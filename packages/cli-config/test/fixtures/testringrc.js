module.exports = function () {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve({ debug: true });
        }, 1000);
    });
};
