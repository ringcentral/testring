import {ITransportSerializedStruct} from '@testring/types';

export interface ISerializedFunction extends ITransportSerializedStruct {
    $key: string;
    body: string;
    arguments: Array<string>;
}

export const FUNCTION_KEY = 'Function';

const trimString = (str) => str.trim();

function getBody(fn: string) {
    const blockBodyRegExp = /{([^]*)}$/;
    const inlineBodyRegExp = /=>\s*(.+)$/;

    // TODO (flops) need to handle all cases
    // () => ({ test: 1 }), for example
    if (fn.includes('{')) {
        const blockBody = fn.match(blockBodyRegExp);

        let normalizedBody = blockBody ? blockBody[1] : '';

        if (normalizedBody.includes('[native code]')) {
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

    const matchedArgs = args ? args[3] || args[2] : '';

    if (matchedArgs.includes('()')) {
        return [];
    }

    return matchedArgs.split(',').map(trimString);
}

export function serializeFunction(func: Function): ISerializedFunction {
    const content = func.toString();
    const body = getBody(content);
    const args = getArguments(content);

    return {
        $key: FUNCTION_KEY,
        body,
        arguments: args,
    };
}

export function deserializeFunction(
    serializedFunction: ISerializedFunction,
): Function {
    // eslint-disable-next-line no-new-func
    return new Function(
        ...serializedFunction.arguments,
        serializedFunction.body,
    );
}
