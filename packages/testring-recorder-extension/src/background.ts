chrome.runtime.onMessage.addListener((message) => {
    alert(`Content script say: ${message}`);
});
