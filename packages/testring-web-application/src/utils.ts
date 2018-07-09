function logXpath(xpath) { //+
    let result = xpath;

    if (xpath === undefined) {
        throw [
            'Path is incorrect, please check that your web test id map is correctly used in your test.',
            'Check the path that is used AFTER the upper mentioned path.'
        ].join('\n');
    } else {
        result = (typeof xpath === 'string') ? xpath : xpath.toString();
    }

    return result;
}

export { logXpath };


