const tsNode = require('ts-node');
const path = require('path');
const project = path.join(process.cwd(), 'tsconfig.json');
tsNode.register({ cache: false, project: project});
