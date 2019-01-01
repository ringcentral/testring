import { ITransport } from '@testring/types';
import { requestFunction } from './request-function';
import { HttpClient } from './http-client';
import { HttpServer } from './http-server';

function createHttpServer(transport: ITransport) {
    return new HttpServer(transport, requestFunction);
}

export {
    createHttpServer,
    HttpServer,
    HttpClient,
};


