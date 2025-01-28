const DOWNLOAD_KEY = "_DOWNLOADS_";
const DOWNLOADS_PERSISTED = localStorage.getItem(DOWNLOAD_KEY) ? JSON.parse(localStorage.getItem(DOWNLOAD_KEY) ?? "[]") : [];
const DOWNLOADS = DOWNLOADS_PERSISTED.reduce((acc, download) => {
    acc[download.id] = download;
    return acc;
}, {});

chrome.runtime.onMessage.addListener((message) => {
    const {action, downloadItem} = message;
    if (action === 'downloadStarted') {
        DOWNLOADS[downloadItem.id] = {
            id: downloadItem.id,
            fileName: '',
            fileUrl: '',
            state: downloadItem.state,
            startTime: new Date(downloadItem.startTime).getTime(),
        };
        updatePageVariable();
        return;
    }

    if (action === 'downloadDetermined') {
        const download = DOWNLOADS[downloadItem.id];
        download.fileName = downloadItem.filename;
        download.state = downloadItem.state;
        updatePageVariable();
        return;
    }

    if (action === 'downloadChanged') {
        const download = DOWNLOADS[downloadItem.id];
        const filePath = downloadItem.filename?.current;
        const state = downloadItem.state?.current;
        if (filePath) {
            download.filePath = filePath;
        }
        if (state) {
            download.state = state;
        }
        updatePageVariable();
    }
});

function updatePageVariable() {
    const downloads = Object.values(DOWNLOADS);
    downloads.sort((a, b) => b.startTime - a.startTime);
    localStorage.setItem('_DOWNLOADS_', JSON.stringify(downloads));
}
