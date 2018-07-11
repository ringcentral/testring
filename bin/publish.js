const childProcess = require('child_process');
const path = require('path');
const glob = require('glob');
const lernaConfig = require('../lerna.json');

const results = [].concat(
    ...lernaConfig.packages.map((pkg) => glob.sync(pkg))
);

results.forEach((pkg) => {
    childProcess.execSync('npm publish', {
        cwd: path.resolve(pkg),
        stdio: process.stdio
    });
});

process.stdout.write(`\nPackages published: ${results.length}\n`);
