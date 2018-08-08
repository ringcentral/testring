import { IConfig, ITransport } from '@testring/types';
import { requestFunction } from './request-function';
import { HttpClientLocal } from './http-client-local';
import { HttpClient } from './http-client';
import { HttpServer } from './http-server';

const createHttpServer = (config: IConfig, transport: ITransport) => {
    return new HttpServer(transport, config, requestFunction);
};

export {
    createHttpServer,
    HttpServer,
    HttpClient,
    HttpClientLocal
};


