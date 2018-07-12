/// <reference types="chrome" />

export const log = (...args): void => {
    const bgp = chrome.extension.getBackgroundPage();

    if (bgp) {
        bgp.console.log(...args);
    }
};
