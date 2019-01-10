#!/usr/bin/env node

const npm = require('npm-utils');

function onError(error) {
    process.stderr.write(error.toString());
    process.exit(-1);
}

npm.setAuthToken()
    .then(() => npm.publish({
        access: 'public',
    }))
    .catch(onError);
