chrome.downloads.onCreated.addListener((downloadItem) => {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id, {
                action: 'downloadStarted',
                downloadItem,
            });
        });
    });
});

chrome.downloads.onDeterminingFilename.addListener((downloadItem) => {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id, {
                action: 'downloadDetermined',
                downloadItem,
            });
        });
    });
});

chrome.downloads.onChanged.addListener((downloadItem) => {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id, {
                action: 'downloadChanged',
                downloadItem,
            });
        });
    });
});
