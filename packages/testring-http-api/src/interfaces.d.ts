import * as request from 'request';
import { OptionsWithUrl } from 'request-promise';

export interface Response {
    response: request.Response,
    uid: string
}

export interface ResponseReject {
    error: request.Response,
    uid: string
}

export interface Request {
    request: OptionsWithUrl,
    uid: string
}
