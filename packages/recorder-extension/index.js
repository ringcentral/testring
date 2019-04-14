const fs = require('fs');
const path = require('path');

const reportFile = path.join(__dirname, 'extension/testring-dev.crx');

if (!fs.existsSync(reportFile)) {
    throw Error('Please rebuild extension needed files not found');
}

const data = require(reportFile);

module.exports = {
    ...data,
    absoluteExtensionPath: path.join(__dirname, data.extensionPath),
};
