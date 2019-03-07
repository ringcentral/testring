const childProcess = require('child_process');
const path = require('path');
const batchPackages = require('@lerna/batch-packages');
const filterPackages = require('@lerna/filter-packages');
const runParallelBatches = require('@lerna/run-parallel-batches');
const { getPackages } = require('@lerna/project');


async function task(pkg) {
    process.stdout.write(`Publishing package: ${pkg.name}...\n  path: ${pkg.location}\n`);

    return new Promise((resolve) => {
        childProcess.exec(
            `node ${path.resolve(__dirname, './publish-package-task.js')}`,
            {
                cwd: pkg.location,
                stdio: process.stdio,
            },
            (error) => {
                let published;
                if (error) {
                    // ignoring error with ouput
                    process.stderr.write(error.toString());
                    published = false;
                } else {
                    published = true;
                }

                resolve({
                    name: pkg.name,
                    location: pkg.location,
                    published,
                });
            }
        );
    });
}

async function main() {
    const packages = await getPackages(__dirname);
    const filtered = filterPackages(packages, [], [], true);
    const batchedPackages = batchPackages(filtered);

    try {
        const packagesBatchDescriptors = await runParallelBatches(batchedPackages, 2, task);
        const packagesDescriptors = packagesBatchDescriptors.reduce((pkgs, batch) => pkgs.concat(batch), []);
        process.stdout.write(`Packages published: ${Object.keys(packagesDescriptors).length}\n`);
    } catch (e) {
        process.stderr.write(e.toString());
        process.exit(1);
    }
}

main();
