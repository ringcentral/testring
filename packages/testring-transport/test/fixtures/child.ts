import { Transport } from '../../src/transport';
import { PAYLOAD, REQUEST_NAME, RESPONSE_NAME } from './constants';

const transport = new Transport(process);

transport.on(REQUEST_NAME, (() => {
    transport.broadcast(RESPONSE_NAME, PAYLOAD);
}));


