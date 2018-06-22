#!/usr/bin/env node

const { ensureSymlinkSync } = require('fs-extra');
const { resolve, join } = require('path');

const PROJECT_FOLDER = resolve(__dirname, '..');
const cwd = process.cwd();

function copy(filename) {
    ensureSymlinkSync(join(PROJECT_FOLDER, filename), join(cwd, filename));
}

copy('tsconfig.json');
copy('mocha.opts');
copy('.npmignore');
