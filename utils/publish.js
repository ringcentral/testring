const {spawn} = require('child_process');
const batchPackages = require('@lerna/batch-packages');
const {filterPackages} = require('@lerna/filter-packages');
const runParallelBatches = require('@lerna/run-parallel-batches');
const {getPackages} = require('@lerna/project');

// Parse --exclude argument
const argv = process.argv.slice(2);
let excludeList = [];
let isDryRun = false;
for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--exclude=')) {
        excludeList = argv[i].replace('--exclude=', '').split(',').map(s => s.trim());
    }

    if (argv[i] === '--dry-run') {
        isDryRun = true;
    }
}

function getPublishArgs(pkg) {
    const publishArgs = ['publish', pkg.location];

    if (pkg.name.startsWith('@')) {
        publishArgs.push('--access', 'public');
    }

    return publishArgs;
}

function formatCommand(command, args) {
    return [command, ...args].map(item => (item.includes(' ') ? `"${item}"` : item)).join(' ');
}

function runNpm(args) {
    const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';

    return new Promise(resolve => {
        const child = spawn(command, args, {
            cwd: process.cwd(),
            stdio: 'inherit',
        });

        child.on('close', code => resolve(code === 0 ? 0 : code || 1));
        child.on('error', error => {
            process.stderr.write(`${error.toString()}\n`);
            resolve(1);
        });
    });
}

async function task(pkg) {
    if (pkg.private) {
        process.stdout.write(`Skipping private package: ${pkg.name}\n`);

        return {
            name: pkg.name,
            location: pkg.location,
            status: 'skipped',
        };
    }

    const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const publishArgs = getPublishArgs(pkg);

    process.stdout.write(
        `Publishing package: ${pkg.name}...\n  path: ${pkg.location}\n`,
    );

    if (isDryRun) {
        process.stdout.write(`  dry-run: ${formatCommand(command, publishArgs)}\n`);

        return {
            name: pkg.name,
            location: pkg.location,
            status: 'dry-run',
        };
    }

    const code = await runNpm(publishArgs);

    return {
        name: pkg.name,
        location: pkg.location,
        status: code === 0 ? 'published' : 'failed',
    };
}

async function main() {
    const packages = await getPackages(__dirname);
    const filtered = filterPackages(packages, [], excludeList, false);
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
        const failedPackages = packagesDescriptors.filter(item => item.status === 'failed');
        const publishedPackages = packagesDescriptors.filter(item => item.status === 'published');
        const dryRunPackages = packagesDescriptors.filter(item => item.status === 'dry-run');
        const skippedPackages = packagesDescriptors.filter(item => item.status === 'skipped');

        if (failedPackages.length > 0) {
            process.stderr.write(
                `Packages failed: ${failedPackages.map(item => item.name).join(', ')}\n`,
            );
            process.exitCode = 1;
            return;
        }

        process.stdout.write(
            `Packages published: ${publishedPackages.length}\n` +
                `Packages dry-run: ${dryRunPackages.length}\n` +
                `Packages skipped: ${skippedPackages.length}\n`,
        );
    } catch (e) {
        process.stderr.write(`${e.toString()}\n`);
        process.exitCode = 1;
    }
}

main().catch(() => process.exit(1));
