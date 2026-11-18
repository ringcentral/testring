import process from 'node:process';
import {Transport} from '@testring/transport';
import {HttpClient} from '../../src/http-client';

const httpClient = new HttpClient(new Transport(process), {
    httpResponseTimeout: 500,
});

const captureError = async (requestPromise: Promise<any>) => {
    try {
        await requestPromise;
        return null;
    } catch (error: any) {
        return {
            name: error.name,
            code: error.code,
            uid: error.uid,
            message: error.message,
            statusCode: error.statusCode,
            responseBody: error.responseBody,
        };
    }
};

const delay = (timeout: number) =>
    new Promise((resolve) => setTimeout(resolve, timeout));

async function run() {
    const requestError = await captureError(
        httpClient.get({
            url: 'https://example.test/error?token=request-secret',
        }),
    );
    const firstSuccess = await httpClient.get({
        url: 'https://example.test/first-success',
    });
    const timeoutError = await captureError(
        httpClient.get({
            url: 'https://user:password@example.test/slow?token=timeout-secret',
        }),
    );
    const secondSuccess = await httpClient.get({
        url: 'https://example.test/second-success',
    });

    await delay(900);
    process.send?.({
        type: 'http-test-result',
        requestError,
        firstSuccess,
        timeoutError,
        secondSuccess,
    });
}

run().catch((error) => {
    process.send?.({type: 'http-test-error', message: error.message});
});
