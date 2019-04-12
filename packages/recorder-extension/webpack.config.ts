import * as path from 'path';
import * as webpack from 'webpack';

const config: webpack.Configuration = {
    mode: 'development',

    entry: {
        background: './src/background.ts',
        content: './src/content.ts',
        popup: './src/popup.ts',
    },

    output: {
        path: path.resolve(__dirname, 'dist'),
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
};

export default config;
