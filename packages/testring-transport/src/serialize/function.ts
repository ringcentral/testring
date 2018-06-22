import { ISerializedStruct } from '../../interfaces';

export interface ISerializedFunction extends ISerializedStruct {
    $key: string,
    body: string,
    arguments: Array<string>
}

export const FUNCTION_KEY = 'Function';

const trimString = (str) => str.trim();

export const serializeFunction = (func: Function): ISerializedFunction => {
    const bodyRegExp = /{([^]*)}$/;
    const argumentsRegExp = /^(function)?[^(]*\(([^)]*)\)/;
    const content = func.toString();

    const body = content.match(bodyRegExp);
    const args = content.match(argumentsRegExp);

    const normalizedBody = body ? body[1] : '';
    const normalizedArg = args ? args[2].split(',').map(trimString) : [];

    return {
        $key: FUNCTION_KEY,
        body: normalizedBody,
        arguments: normalizedArg
    };
};

export const deserializeFunction = (serializedFunction: ISerializedFunction): Function => {
    return new Function(...serializedFunction.arguments, serializedFunction.body);
};
