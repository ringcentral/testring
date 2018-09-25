module.exports = async () =>  ({
    workerLimit: 5,
    retryCount: 0,
    tests: 'test/proxy-plugins/test/get-text.spec.js',
    plugins: [
        'puppeteer',
        ['babel', {
            presets: [
                'es2015'
            ]
        }]
    ]
});
