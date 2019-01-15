#!/usr/bin/env node

const { copyFileSync, existsSync } = require('fs');
const path = require('path');

const PROJECT_FOLDER = path.resolve(__dirname, '..');
const cwd = process.cwd();

function createFile(filename) {
    const input = path.join(PROJECT_FOLDER, filename);
    const output = path.join(cwd, filename);

    if (!existsSync(output)) {
        copyFileSync(input, output);
    }
}

createFile('tsconfig.json');
createFile('mocha.opts');
createFile('.npmignore');
createFile('.npmrc');
