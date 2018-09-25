module.exports = async () =>  ({
    workerLimit: 5,
    retryCount: 0,
    tests: 'test/proxy-plugins/test/*.spec.js',
    plugins: [
        'selenium-driver',
        ['babel', {
            presets: [
                'es2015'
            ]
        }]
    ]
});
