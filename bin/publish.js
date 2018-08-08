const childProcess = require('child_process');
const path = require('path');
const glob = require('glob');
const PackageUtilities = require('lerna/lib/PackageUtilities');
const lernaConfig = require('../lerna.json');


// FIXME temporary workaround, waiting for lerna 3 with separated version and publish commands
// https://github.com/lerna/lerna/issues/961

const packagesList = [].concat(
    ...lernaConfig.packages.map((pkg) => glob.sync(pkg))
);

const packagesDescriptors = packagesList
    .reduce((map, pkgPath) => {
        const descriptor = require(path.resolve(pkgPath, 'package.json'));

        if (!descriptor.private) {
            map[pkgPath] = descriptor;
        }

        return map;
    }, {});

const packagePaths = Object.keys(packagesDescriptors)
    .reduce((map, pkgPath) => {
        map[packagesDescriptors[pkgPath].name] = pkgPath;

        return map;
    }, {});

const batchedPackages = PackageUtilities.topologicallyBatchPackages(Object.values(packagesDescriptors), {
    depsOnly: true
});

const task = (pkg) => (callback) => {
    process.stdout.write(`Publishing package: ${pkg.name}...\n  path: ${packagePaths[pkg.name]}\n`);

    childProcess.exec(
        `node ${path.resolve(__dirname, './npm-publish.js')}`,
        {
            cwd: path.resolve(packagePaths[pkg.name]),
            stdio: process.stdio
        },
        (error) => {
            if (error) {
                // @TODO find out why we published some packages more than once
                process.stderr.write(error.toString());
                callback();
            } else {
                callback();
            }
        }
    );
};


PackageUtilities.runParallelBatches(batchedPackages, task, 2, (error) => {
    if (error) {
        process.stderr.write(error.toString());
        process.exit(1);
    } else {
        process.stdout.write(`Packages published: ${Object.keys(packagesDescriptors).length}\n`);
    }
});
