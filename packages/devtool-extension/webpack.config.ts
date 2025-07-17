import * as path from 'path';

import * as webpack from 'webpack';
import CopyPlugin from 'copy-webpack-plugin';

const getAbsolutePath = (filepath): string => path.join(__dirname, filepath);

const packageJson = require('./package.json');
const manifestKeyJson = require('./extension/manifest-key.json');

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
        fallback: {
            net: false,
            fs: false,
            path: require.resolve('path-browserify'),
            events: require.resolve('events/'),
            os: require.resolve('os-browserify/browser'),
        },
    },

    module: {
        rules: [
            {
                test: /\.(js|d\.ts)\.map$/,
                use: 'ignore-loader',
            },
            {
                test: /\.d\.ts$/,
                use: 'ignore-loader',
            },
            {
                test: /\.tsx?$/,
                exclude: [/node_modules/, /\.d\.ts$/],
                use: {
                    loader: 'ts-loader',
                    options: {
                        allowTsInNodeModules: true,
                    },
                },
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
                    transform(content, absolutePath) {
                        const relativePath = path.relative(
                            __dirname,
                            absolutePath,
                        );

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
    ],
};

export default config;
