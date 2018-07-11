import * as path from 'path';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as ncp from 'ncp';

const packageJsonPath = path.resolve(__dirname, '../package.json');
const packageJson = fs.readFileSync(packageJsonPath).toString();

const manifestTplPath = path.resolve(__dirname, '../manifest.tpl.json');
const manifestTpl = fs.readFileSync(manifestTplPath).toString();

const staticPath = path.resolve(__dirname, '../static');
const distPath = path.resolve(__dirname, '../dist');

mkdirp.sync(distPath);

const manifest = {
    ...JSON.parse(manifestTpl),
    version: JSON.parse(packageJson).version.split('.').slice(0, 2).join('.'),
};

fs.writeFileSync(
    path.join(distPath, 'manifest.json'),
    JSON.stringify(manifest),
    { mode: 0o766 }
);

ncp(staticPath, distPath);
