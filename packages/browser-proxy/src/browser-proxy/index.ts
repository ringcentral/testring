import * as yargs from 'yargs';
import { transport } from '@testring/transport';
import { BrowserProxy } from './browser-proxy';

const args = yargs.argv;

const name = args.name;
const config = JSON.parse(args.config);

new BrowserProxy(transport, name, config);
