#!/usr/bin/env node

const rimraf = require('rimraf');
const path = require('path');

const cwd = process.cwd();

function removeLink(filename) {
    rimraf(path.join(cwd, filename), (error) => {
        if (error) {
            throw error;
        }
    });
}

removeLink('tsconfig.json');
removeLink('mocha.opts');
removeLink('.npmignore');
