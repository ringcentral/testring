import {
    OptionsChromeController,
    IOptionsWindow,
} from './extension/options-chrome-controller';

new OptionsChromeController(<IOptionsWindow>(window as any));
