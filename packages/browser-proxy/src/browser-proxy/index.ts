import * as yargs from 'yargs';
import {transport} from '@testring-dev/transport';
import {BrowserProxy} from './browser-proxy';

const args = yargs.argv;

const name = args.name as string;
const config = JSON.parse(args.config as string);

new BrowserProxy(transport, name, config);
