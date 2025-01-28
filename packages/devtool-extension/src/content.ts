/// <reference types="chrome" />

import {ExtensionPostMessageTypes} from '@testring/types';
import {BackgroundChromeClient} from './extension/chrome-transport/chrome-client';

import {ElementHighlightController} from './extension/element-highlight-controller';

const client = new BackgroundChromeClient();

async function init() {
    await client.waitForReady();

    const elementHighlightController = new ElementHighlightController(window);

    window.addEventListener(
        'message',
        function (event) {
            // We only accept messages from ourselves
            if (event.source !== window) {
                return;
            }

            switch (event.data.type) {
                case ExtensionPostMessageTypes.CLEAR_HIGHLIGHTS:
                    elementHighlightController.clearHighlights();
                    break;
                case ExtensionPostMessageTypes.ADD_XPATH_HIGHLIGHT:
                    if (event.data.xpath) {
                        elementHighlightController.addXpathSelector(
                            event.data.xpath,
                        );
                    } else {
                        // eslint-disable-next-line no-console
                        console.error('Invalid xpath is passed to add');
                    }
                    break;
                case ExtensionPostMessageTypes.REMOVE_XPATH_HIGHLIGHT:
                    if (event.data.xpath) {
                        elementHighlightController.removeXpathSelector(
                            event.data.xpath,
                        );
                    } else {
                        // eslint-disable-next-line no-console
                        console.error('Invalid xpath is passed to delete');
                    }
                    break;
            }
        },
        false,
    );
}

init();
