import * as path from 'path';
import { Transport } from '@testring/transport';
import { BrowserProxy } from '../../src/browser-proxy/browser-proxy';

const pluginName = path.resolve(__dirname, './on-action.ts');
const pluginConfig = {};

new BrowserProxy(new Transport(), pluginName, pluginConfig);
