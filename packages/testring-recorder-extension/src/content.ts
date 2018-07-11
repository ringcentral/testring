/// <reference types="chrome" />

document.addEventListener('click', function() {
    chrome.runtime.sendMessage('HELLO');
});
