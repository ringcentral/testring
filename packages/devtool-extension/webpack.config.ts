import * as path from 'path';

import * as webpack from 'webpack';
import CopyPlugin from 'copy-webpack-plugin';

import {CRXPlugin} from './crx-plugin';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const __dirname = path.dirname(__filename);

const getAbsolutePath = (filepath): string => path.join(__dirname, filepath);

import packageJson from './package.json' assert { type: 'json' };
import manifestKeyJson from './extension/manifest-key.json' assert { type: 'json' };

const appVersion = packageJson.version;

const staticRelativeDir = 'static/';
const outputDir = getAbsolutePath('dist');

const manifestRelativePath = path.join(staticRelativeDir, 'manifest.json');

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
        extensions: ['.tsx', '.ts', '.js'],
        fallback:{
            net:false,
            fs: false,
            "path": require.resolve("path-browserify"),
            "events": require.resolve("events/"),
            "os": require.resolve("os-browserify/browser"),
        },
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

    devtool: false,

    stats: 'minimal',

    plugins: [
        new CopyPlugin({
            patterns: [
                {
                    from: staticRelativeDir,
                    to: outputDir,
                    transform(content, absolutePath){
                        const relativePath = path.relative(__dirname, absolutePath);

                        if (relativePath === manifestRelativePath) {
                            const data = JSON.parse(content.toString());

                            // Adding version and key in manifest.json
                            return JSON.stringify({
                                ...data,
                                ...manifestKeyJson,
                                version: appVersion,
                            });
                        }
                        return content;
                    },
                },
            ],
        }),
        process.argv.indexOf('--enable-crx') > -1
            ? new CRXPlugin({
                  directory: outputDir,
                  keyPath: getAbsolutePath('extension/testring-dev.pem'),
                  filename: 'testring-dev',
                  outputDirectory: getAbsolutePath('extension'),
                  rootPath: __dirname,
              })
            : () => {
                  /* empty */
              },
    ],
};

export default config;
