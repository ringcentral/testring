import * as path from 'path';
import { Transport } from '@testring/transport';

import { BrowserProxy } from '../../src/browser-proxy/index';

const onActionPlugin = path.resolve(__dirname, './on-action.ts');

new BrowserProxy(new Transport(), onActionPlugin);
