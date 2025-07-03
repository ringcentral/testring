#!/usr/bin/env node

const process = require('node:process');
const path = require('path');
const fs = require('fs');

const root = process.cwd();

const filename = path.join(root, './README.md');

function generateFile(file) {
    const pkg = require(path.join(root, './package.json'));

    const content = `
# \`${pkg.name}\`

${pkg.description ? `> ${pkg.description}` : ''}

## Install
Using npm:

\`\`\`
npm install --save-dev ${pkg.name}
\`\`\`

or using yarn:

\`\`\`
yarn add ${pkg.name} --dev
\`\`\`
`;

    fs.writeFileSync(file, content.trim());
}

if (!fs.existsSync(filename)) {
    generateFile(filename);
}
