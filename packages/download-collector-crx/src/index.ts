const fs = require('fs');
const path = require('path');

const crxFilePath = path.join(__dirname, './extension.crx');

function getCrxBase64() {
    const crxData = fs.readFileSync(crxFilePath);
    return crxData.toString('base64');
}

module.exports = {
    getCrxBase64,
};
