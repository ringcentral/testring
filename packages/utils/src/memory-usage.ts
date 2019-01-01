import * as bytes from 'bytes';

export function getExternalMemory(): string {
    const memoryAfter = process.memoryUsage();

    return bytes.format(memoryAfter.external);
}

export function getTotalMemoryUsed(): string {
    const memoryAfter = process.memoryUsage();

    return bytes.format(memoryAfter.rss);
}

export function getHeapTotal(): string {
    const memoryAfter = process.memoryUsage();

    return bytes.format(memoryAfter.heapTotal);
}

export function getHeapUsed(): string {
    const memoryAfter = process.memoryUsage();

    return bytes.format(memoryAfter.heapUsed);
}

export function getMemoryReport(): string {
    return `Total memory usage: ${getTotalMemoryUsed()}, External memory: ${getExternalMemory()}.`;
}

export function getHeapReport(): string {
    return `Total heap: ${getHeapTotal()}, used heap: ${getHeapUsed()}`;
}
