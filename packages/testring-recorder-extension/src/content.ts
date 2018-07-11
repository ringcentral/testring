document.addEventListener('click', function() {
    chrome.runtime.sendMessage('HELLO');
});
