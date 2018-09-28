import * as bytes from 'bytes';

export const getExternalMemory = (): string => {
    const memoryAfter = process.memoryUsage();

    return bytes.format(memoryAfter.external);
};

export const getTotalMemoryUsed = (): string => {
    const memoryAfter = process.memoryUsage();

    return bytes.format(memoryAfter.rss);
};

export const getHeapTotal = (): string => {
    const memoryAfter = process.memoryUsage();

    return bytes.format(memoryAfter.heapTotal);
};

export const getHeapUsed = (): string => {
    const memoryAfter = process.memoryUsage();

    return bytes.format(memoryAfter.heapUsed);
};

export const getMemoryReport = (): string => {
    return `Total memory usage: ${getTotalMemoryUsed()}, External memory: ${getExternalMemory()}.`;
};

export const getHeapReport = (): string => {
    return `Total heap: ${getHeapTotal()}, used heap: ${getHeapUsed()}`;
};
