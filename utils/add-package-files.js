#!/usr/bin/env node

const {copyFileSync, existsSync} = require('fs');
const path = require('path');

const TEMPLATES_FOLDER = path.join(__dirname, 'templates');
const cwd = process.cwd();

function createFile(filename) {
    const input = path.join(TEMPLATES_FOLDER, filename);
    const output = path.join(cwd, filename);

    if (!existsSync(output)) {
        copyFileSync(input, output);
    }
}

createFile('tsconfig.json');
createFile('.mocharc.json');
createFile('.npmignore');
createFile('.npmrc');
