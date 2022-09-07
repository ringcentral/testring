import * as path from 'path';
import {Transport} from '@testring-dev/transport';
import {BrowserProxy} from '../../src/browser-proxy/browser-proxy';

const pluginName = path.resolve(__dirname, './sync-plugin.ts');
const pluginConfig = {};

new BrowserProxy(new Transport(), pluginName, pluginConfig);
