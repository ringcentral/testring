const fs = require('fs');
const path = require('path');

const crxFilePath = path.join(__dirname, './extension.crx');

let CACHED_CRX_BASE64 = null;

function getCrxBase64() {
    if (CACHED_CRX_BASE64) {
        return CACHED_CRX_BASE64;
    }

    const crxData = fs.readFileSync(crxFilePath);
    CACHED_CRX_BASE64 = crxData.toString('base64');

    return CACHED_CRX_BASE64;
}

module.exports = {
    getCrxBase64,
};
