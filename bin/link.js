#!/usr/bin/env node

const { ensureSymlinkSync } = require('fs-extra');
const path = require('path');

const PROJECT_FOLDER = path.resolve(__dirname, '..');
const cwd = process.cwd();

function createLink(filename) {
    ensureSymlinkSync(path.join(PROJECT_FOLDER, filename), path.join(cwd, filename));
}

createLink('tsconfig.json');
createLink('mocha.opts');
createLink('.npmignore');
