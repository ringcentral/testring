import { ITransport } from '@testring/types';
import { requestFunction } from './request-function';
import { HttpClientLocal } from './http-client-local';
import { HttpClient } from './http-client';
import { HttpServer } from './http-server';

const createHttpServer = (transport: ITransport) => {
    return new HttpServer(transport, requestFunction);
};

export {
    createHttpServer,
    HttpServer,
    HttpClient,
    HttpClientLocal
};


