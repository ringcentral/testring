import * as requestPromise from 'request-promise';
import { IConfig, ITransport } from '@testring/types';

import { HttpClient } from './http-client';
import { HttpClientLocal } from './http-client-local';
import { HttpServer } from './http-server';

const createHttpServer = (config: IConfig, transport: ITransport) => {
    return new HttpServer(transport, config, requestPromise);
};

export {
    createHttpServer,
    HttpServer,
    HttpClient,
    HttpClientLocal
};


