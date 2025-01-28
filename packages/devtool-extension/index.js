const fs = require('fs');
const path = require('path');


const reportFile = path.join(__dirname, 'extension/testring-dev.json');

const data = require(reportFile);

const crxFile = path.join(__dirname, data.extensionCRXPath);

const isCRXExists = fs.existsSync(crxFile);


module.exports = {
    ...data,
    extensionCRXPath: isCRXExists ? data.extensionCRXPath : null,
    absoluteExtensionCRXPath: isCRXExists ? crxFile : null,
    extensionsPath: 'dist/',
    absoluteExtensionPath: path.join(__dirname, 'dist'),
};
