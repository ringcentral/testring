import * as process from 'process';
import { Transport } from './transport';
import { serialize, deserialize } from './serialize';

const transport = new Transport(process);

export { Transport, transport, serialize, deserialize };
