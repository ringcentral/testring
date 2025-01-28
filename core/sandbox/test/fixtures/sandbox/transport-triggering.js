const transport = global['__$transport$__'];

transport.on('request', (data) => {
    transport.emit('response', data);
});
