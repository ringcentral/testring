const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const NODE_MODULES_PATH = path.resolve('./node_modules');

if (fs.existsSync(NODE_MODULES_PATH)) {
    childProcess.execSync('npm run cleanup');
}
