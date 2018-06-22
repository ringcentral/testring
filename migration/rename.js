const fs = require('fs');
const path = require('path');
const glob = require('glob');


const result = glob.sync('**/testomator**');

console.log(result);

result.forEach((file) => {
    const full = path.join(process.cwd(), file);

    fs.renameSync(full, full.replace('testomator', 'testring'));
});
