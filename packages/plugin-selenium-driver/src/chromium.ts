/* eslint-disable no-sequences */
/* eslint-disable no-console */
const os = require('os');
const https = require('https');
const path = require('path');
const fs = require('fs');
const extract = require('extract-zip');

const CHROMIUM_DOWNLOAD_PATH = path.join(os.homedir(), 'Downloads');

const DOWNLOAD_URLS = {
    darwin: 'https://www.googleapis.com/download/storage/v1/b/chromium-browser-snapshots/o/Mac%2F1159680%2Fchrome-mac.zip?generation=1687199461863686&alt=media',
    win32: 'https://www.googleapis.com/download/storage/v1/b/chromium-browser-snapshots/o/Win%2F1159780%2Fchrome-win.zip?generation=1687230822312589&alt=media',
    win64: 'https://www.googleapis.com/download/storage/v1/b/chromium-browser-snapshots/o/Win_x64%2F1159777%2Fchrome-win.zip?generation=1687229811750676&alt=media',
};
const platform = os.platform();

class Chromium {
    private _completed = 0
    private _totalBytes = 0

    async install() {
        const zipPath = path.join(CHROMIUM_DOWNLOAD_PATH, `chromium-116.zip`);

        if (!fs.existsSync(CHROMIUM_DOWNLOAD_PATH)) {
            fs.mkdirSync(CHROMIUM_DOWNLOAD_PATH);
        }
        if (!fs.existsSync(this.path)) {
            if (!fs.existsSync(zipPath)) {
                const tid = setInterval(() => this._getDownloadPercent(), 6000);
                try {
                    await this._downloadChromiumZip(zipPath);
                    this._getDownloadPercent()
                } finally {
                    clearInterval(tid);
                }
            }
            await extract(zipPath, { dir: CHROMIUM_DOWNLOAD_PATH });
        }
    }

    get path() {
        return path.join(
            CHROMIUM_DOWNLOAD_PATH,
            platform === 'darwin' ? `chrome-mac/Chromium.app/Contents/MacOS/Chromium` : `chrome-win/chrome.exe`,
        );
    }

    private _getDownloadUrl() {
        if (platform === 'darwin') {
            return DOWNLOAD_URLS.darwin
        }
        return os.arch() === 'x64' ? DOWNLOAD_URLS.win64 : DOWNLOAD_URLS.win32;
    }

    private _downloadChromiumZip(zipPath) {
        return new Promise((resolve, reject) => {
            const url = this._getDownloadUrl();
            https.get(url, (response) => {
                if (response.statusCode !== 200) {
                    const error = new Error(
                        `Download failed: code ${response.statusCode}. URL: ${url}`,
                    );
                    response.resume();
                    reject(error);
                    return;
                }
                const file = fs.createWriteStream(zipPath);
                file.on('finish', resolve);
                file.on('error', () => {
                    fs.unlinkSync(zipPath)
                    reject()
                });
                response.pipe(file);
                this._onProgress(response);
            });
        })
    }

    private _onProgress(response) {
        if (!this._totalBytes) {
            this._totalBytes = parseInt(response.headers['content-length'], 10);
        }
        response.on('data', (chunk) => {
            this._completed += chunk.length
        });
    }

    private _getDownloadPercent() {
        const percent = Math.round(this._completed / this._totalBytes * 100) || 0;
        console.log(`Downloading chromium app... ${percent}%`)
    }
}

export default new Chromium();
