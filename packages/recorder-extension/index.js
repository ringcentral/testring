const fs = require('fs');
const path = require('path');

const crxFile = path.join(__dirname, 'extension/testring-dev.crx');
const reportFile = path.join(__dirname, 'extension/testring-dev.json');

if (!fs.existsSync(crxFile)) {
    throw Error('Please rebuild extension needed files not found');
}

const data = require(reportFile);

module.exports = {
    ...data,
    absoluteExtensionPath: path.join(__dirname, data.extensionPath),
};
