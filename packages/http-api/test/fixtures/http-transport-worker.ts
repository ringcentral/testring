import process from 'node:process';
import {Transport} from '@testring/transport';

const transport = new Transport(process);

transport.on('rejectHttpRequest', ({error}: any) => {
    process.send?.({
        name: error.name,
        message: error.message,
        statusCode: error.statusCode,
        responseBody: error.responseBody,
    });
});
