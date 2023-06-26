const path = require('path');
const batchPackages = require('@lerna/batch-packages');
const {filterPackages} = require('@lerna/filter-packages');
const runParallelBatches = require('@lerna/run-parallel-batches');
const {getPackages} = require('@lerna/project');
const npmPublish = require('@jsdevtools/npm-publish');

const token = process.env.NPM_TOKEN;

if (!token) {
    throw new Error('NPM_TOKEN required');
}

async function task(pkg) {
    process.stdout.write(
        `Publishing package: ${pkg.name}...\n  path: ${pkg.location}\n`,
    );
    let published = false;
    try {
        await npmPublish({
            package: path.join(pkg.location, 'package.json'),
            token,
            access: 'public'
        });
        published = true;
    } catch (error) {
        process.stderr.write(error.toString());
    }

    return {
        name: pkg.name,
        location: pkg.location,
        published,
    };
}

async function main() {
    const packages = await getPackages(__dirname);
    const filtered = filterPackages(packages, [], [], false);
    const batchedPackages = batchPackages(filtered);

    try {
        const packagesBatchDescriptors = await runParallelBatches(
            batchedPackages,
            2,
            task,
        );
        const packagesDescriptors = packagesBatchDescriptors.reduce(
            (pkgs, batch) => pkgs.concat(batch),
            [],
        );
        const totalPackages = packagesDescriptors.reduce(
            (acc, item) => (acc += item.published ? 1 : 0),
            0,
        );

        process.stdout.write(`Packages published: ${totalPackages}\n`);
    } catch (e) {
        process.stderr.write(e.toString());
    }
}

main().catch(() => process.exit(1));
