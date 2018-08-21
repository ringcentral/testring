module.exports = (baseConfig, env, config) => {
    config.module.rules = config.module.rules.map((rule) => {
        if (rule.test.test('test.css')) {
            return {
                test: /\.css$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: require.resolve('style-loader')
                    },
                    {
                        loader: require.resolve('css-loader'),
                        options: {
                            importLoaders: 1,
                            modules: true
                        }
                    }
                ]
            };
        }

        return rule;
    });

    config.module.rules.push(
        {
            test: /\.(ts|tsx)$/,
            loader: require.resolve('ts-loader')
        }
    );

    config.resolve.extensions.push('.ts', '.tsx');

    return config;
};
