import * as path from 'path';

import * as webpack from 'webpack';
import * as CopyWebpackPlugin from 'copy-webpack-plugin';

import { CRXPlugin } from './crx-plugin';


const absolutePath = (filepath) => path.join(__dirname, filepath);

const packageJson = require('./package.json');
const manifestKeyJson = require('./extension/manifest-key.json');
const appVersion = packageJson.version;

const staticRelativeDir = 'static/';
const outputDir = absolutePath('dist');

const manifestRelativePath = path.join(staticRelativeDir, 'manifest.json');


const staticFilesTransform = (content, absolutePath) => {
    const relativePath = path.relative(__dirname, absolutePath);

    if (relativePath === manifestRelativePath) {
        const data = JSON.parse(content);

        // Adding version and key in manifest.json
        return JSON.stringify({
            ...data,
            ...manifestKeyJson,
            version: appVersion,
        });
    }

    return content;
};


const config: webpack.Configuration = {
    mode: 'development',

    entry: {
        background: './src/background.ts',
        content: './src/content.ts',
        popup: './src/popup.ts',
        options: './src/options.ts',
    },

    output: {
        path: outputDir,
        filename: '[name].bundle.js',
    },

    resolve: {
        extensions: [ '.tsx', '.ts', '.js' ],
    },

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        allowTsInNodeModules: true,
                    },
                },
                exclude: /node_modules/,
            },
        ],
    },

    node: {
        net: 'empty',
        fs: 'empty',
    },

    devtool: false,

    stats: 'minimal',

    plugins: [
        new CopyWebpackPlugin([
            {
                from: staticRelativeDir,
                to: outputDir,
                transform: staticFilesTransform,
            },
        ]),
        (process.argv.indexOf('--enable-crx') > -1) ? new CRXPlugin({
            directory: outputDir,
            keyPath: absolutePath('extension/testring-dev.pem'),
            filename: 'testring-dev',
            outputDirectory: absolutePath('extension'),
            rootPath: __dirname,
        }) : () => {},
    ],
};

export default config;
