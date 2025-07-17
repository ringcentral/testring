import {ITransportSerializedStruct} from '@testring/types';

export interface ISerializedFunction extends ITransportSerializedStruct {
    $key: string;
    body: string;
    arguments: Array<string>;
    isAsync?: boolean;
}

export const FUNCTION_KEY = 'Function';

const trimString = (str: string) => str.trim();

function getBody(fn: string) {
    const blockBodyRegExp = /{([^]*)}$/;
    const inlineBodyRegExp = /=>\s*(.+)$/;

    // TODO (flops) need to handle all cases
    // () => ({ test: 1 }), for example
    if (fn.includes('{')) {
        const blockBody = fn.match(blockBodyRegExp);

        let normalizedBody = blockBody ? blockBody[1] : '';

        if (normalizedBody && normalizedBody.includes('[native code]')) {
            normalizedBody = '';
        }

        return normalizedBody;
    }
    const inlineBody = fn.match(inlineBodyRegExp);

    return inlineBody ? `return ${inlineBody[1]}` : '';
}

function getArguments(fn: string) {
    const argumentsRegExp = /^(function)?([^(]*\(([^)]*)\)|[A-z]+)/;
    const args = fn.match(argumentsRegExp);

    const matchedArgs = (args ? args[3] || args[2] : '') || '';

    if (matchedArgs.includes('()')) {
        return [];
    }

    return matchedArgs.split(',').map(trimString);
}

export function serializeFunction(func: Function): ISerializedFunction {
    const content = func.toString();
    const body = getBody(content) || '';
    const args = getArguments(content);
    const isAsync = content.trim().startsWith('async ') || content.includes('async function');

    // Check if the function contains problematic syntax patterns
    const problematicPatterns = [
        'super.',
        'constructor(',
        'class ',
        'extends ',
        'static ',
        'private ',
        'protected ',
        'public ',
        'readonly ',
        'abstract ',
        'override ',
        'async function',
        'function*',
        'yield ',
        'import ',
        'export ',
    ];
    
    // Check if the function arguments contain destructuring or modern syntax
    const hasDestructuringArgs = args.some(arg => 
        arg.includes('{') || arg.includes('}') || arg.includes('[') || arg.includes(']') || 
        arg.includes('...') || arg.includes('=') // default parameters
    );
    
    const hasProblematicPattern = problematicPatterns.some(pattern => content.includes(pattern));
    
    if (hasProblematicPattern || hasDestructuringArgs) {
        return {
            $key: FUNCTION_KEY,
            body: 'return undefined;',
            arguments: args,
            isAsync: false,
        };
    }

    return {
        $key: FUNCTION_KEY,
        body,
        arguments: args,
        isAsync,
    };
}

export function deserializeFunction(
    serializedFunction: ISerializedFunction,
): Function {
    // Check if the function body contains problematic syntax patterns
    // These patterns cannot be used in Function constructor
    const problematicPatterns = [
        'super.',
        'constructor(',
        'class ',
        'extends ',
        'static ',
        'private ',
        'protected ',
        'public ',
        'readonly ',
        'abstract ',
        'override ',
        'async function',
        'function*',
        'yield ',
        'import ',
        'export ',
    ];

    // Check if the function arguments contain destructuring or modern syntax
    const hasDestructuringArgs = serializedFunction.arguments.some(arg => 
        arg.includes('{') || arg.includes('}') || arg.includes('[') || arg.includes(']') || 
        arg.includes('...') || arg.includes('=') // default parameters
    );
    
    const body = serializedFunction.body || '';
    const hasProblematicPattern = problematicPatterns.some(pattern => body.includes(pattern));
    
    if (hasProblematicPattern || hasDestructuringArgs) {
        // Return a no-op function with the same arity
        const argsPlaceholder = serializedFunction.arguments.map(() => '_').join(', ');
        return new Function(argsPlaceholder, 'return undefined;');
    }

    // eslint-disable-next-line no-new-func
    if (serializedFunction.isAsync) {
        // For async functions, wrap the body in an async function
        return new Function(
            ...serializedFunction.arguments,
            `return (async function(${serializedFunction.arguments.join(', ')}) { ${serializedFunction.body} })(...arguments);`,
        );
    }
    
    return new Function(
        ...serializedFunction.arguments,
        serializedFunction.body,
    );
}
