import * as process from 'process';
import { Transport } from './transport';

const transport = new Transport(process);

export { Transport, transport };
