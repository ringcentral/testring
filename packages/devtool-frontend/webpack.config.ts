import * as webpack from 'webpack';
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin';

const config: webpack.Configuration = {
    mode: 'development',
    entry: {
        editor: './src/editor.tsx',
        popup: './src/popup.tsx',
    },
    output: {
        filename: '[name].bundle.js',
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.css'],
        fallback: {
            net: false,
            fs: false,
            path: require.resolve('path-browserify'),
            events: require.resolve('events/'),
            os: require.resolve('os-browserify/browser'),
        },
    },
    plugins: [
        new MonacoWebpackPlugin({
            languages: ['javascript'],
        }),
    ],
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
                exclude: /\.d\.ts$/,
                use: 'ts-loader',
            },
            {
                test: /\.css$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'style-loader',
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1,
                            modules: true,
                        },
                    },
                ],
            },
            {
                test: /\.css$/,
                include: /node_modules/,
                use: [
                    {
                        loader: 'style-loader',
                    },
                    {
                        loader: 'css-loader',
                    },
                ],
            },
            {
                test: /\.(png|jpg|gif)$/i,
                use: [
                    {
                        loader: 'url-loader',
                    },
                ],
            },
        ],
    },

    stats: 'minimal',
};

export default config;
