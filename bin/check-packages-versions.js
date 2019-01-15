const fs = require('fs');
const path = require('path');

const root = process.cwd();

const regex = /\^|~|<|>|\||( - )/;

function checkDependencies(deps) {
    let notExact = [];
    if (!deps) {
        return notExact;
    }

    for (let pack in deps) {
        let version = deps[pack];

        if (regex.test(version)) {
            notExact.push(pack + '@' + version);
        }
    }

    return notExact;
}

try {
    const data = fs.readFileSync(path.join(root, 'package.json')).toString();
    const { dependencies, devDependencies, peerDependencies } = JSON.parse(data);

    const packages = [].concat(
        checkDependencies(dependencies),
        checkDependencies(devDependencies),
        checkDependencies(peerDependencies),
    );

    if (packages.length > 0) {
        // eslint-disable-next-line no-console
        console.log(packages.join('\n'));
        process.exit(1);
    }
} catch (e) {
    // eslint-disable-next-line no-console
    console.log(e.message);
    process.exit(1);
}
