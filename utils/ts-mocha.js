const tsNode = require('ts-node');

tsNode.register({ cache: false, project: './tsconfig.json', });
