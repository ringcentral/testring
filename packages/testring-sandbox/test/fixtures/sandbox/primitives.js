const log = console.log.bind(console);
const root = process.cwd();

const timeout = setTimeout(() => {}, 0);
const interval = setInterval(() => {}, 1000);

clearTimeout(timeout);
clearInterval(interval);

const array = new Array(10);
const map = new Map();
const set = new Set();
const weakMap = new WeakMap();
const weakSet = new WeakSet();
const promise = Promise.resolve();
const buffer = Buffer.from([1, 0]);

const reflect = Reflect.has(map, '1');

module.exports = {
    array,
    map,
    set,
    weakMap,
    weakSet,
    promise,
    buffer
};
