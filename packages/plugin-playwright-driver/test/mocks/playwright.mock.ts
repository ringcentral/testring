// Mock Playwright API for testing
export class MockPage {
    private _url = 'about:blank';
    private _title = 'Mock Page';
    private _elements: Map<string, MockElement> = new Map();
    private _cookies: any[] = [];
    private _viewport = { width: 1280, height: 720 };

    async goto(url: string) {
        this._url = url;
        return { url };
    }

    url() {
        return this._url;
    }

    async title() {
        return this._title;
    }

    async setTitle(title: string) {
        this._title = title;
    }

    async click(selector: string, options?: any) {
        const element = this._elements.get(selector);
        if (!element) {
            throw new Error(`Timeout: ${selector}`);
        }
        return element.click(options);
    }

    async fill(selector: string, value: string) {
        const element = this._elements.get(selector);
        if (!element) {
            throw new Error(`Timeout: ${selector}`);
        }
        return element.fill(value);
    }

    async textContent(selector: string) {
        const element = this._elements.get(selector);
        return element ? await element.textContent() : null;
    }

    async $(selector: string) {
        return this._elements.get(selector) || null;
    }

    async $$(selector: string) {
        return Array.from(this._elements.values()).filter(el => 
            el._selector === selector
        );
    }

    async waitForSelector(selector: string, options: any = {}) {
        const element = this._elements.get(selector);
        if (!element) {
            throw new Error(`Timeout: ${selector}`);
        }
        return element;
    }

    async evaluate(fn: any, ...args: any[]) {
        if (typeof fn === 'function') {
            return fn(...args);
        }
        if (typeof fn === 'string') {
            // Handle string function expressions
            try {
                const func = new Function('args', fn);
                return func(args);
            } catch (e) {
                // For simple return statements
                if (fn.includes('return ')) {
                    const returnValue = fn.replace(/^return\s+/, '').replace(/;$/, '');
                    return eval(returnValue);
                }
                throw e;
            }
        }
        return fn;
    }

    async screenshot() {
        return Buffer.from('mock-screenshot-data');
    }

    async reload() {
        // Mock reload - return response like real Playwright
        return { url: this._url };
    }

    async content() {
        return '<html><body>Mock content</body></html>';
    }

    async setViewportSize(size: { width: number; height: number }) {
        this._viewport = size;
    }

    async isEnabled(selector: string) {
        const element = this._elements.get(selector);
        return element ? element.isEnabled() : false;
    }

    async isChecked(selector: string) {
        const element = this._elements.get(selector);
        return element ? element.isChecked() : false;
    }

    async inputValue(selector: string) {
        const element = this._elements.get(selector);
        return element ? element.inputValue() : '';
    }

    async getAttribute(selector: string, attr: string) {
        const element = this._elements.get(selector);
        return element ? element.getAttribute(attr) : null;
    }

    async selectOption(selector: string, option: any) {
        const element = this._elements.get(selector);
        if (element) {
            (element as any)._value = option.value || option.label || option;
        }
    }

    async hover(selector: string) {
        const element = this._elements.get(selector);
        if (!element) {
            throw new Error(`Timeout: ${selector}`);
        }
    }

    async dragAndDrop(source: string, target: string) {
        // Mock drag and drop
    }

    async waitForFunction(fn: any, arg: any, options: any = {}) {
        // Mock wait for function
        return fn(arg);
    }

    locator(selector: string) {
        return {
            scrollIntoViewIfNeeded: async () => {},
            textContent: async () => this._elements.get(selector)?.textContent() || ''
        };
    }

    keyboard = {
        type: async (text: string) => {
            // Mock keyboard typing
        }
    };

    coverage = {
        startJSCoverage: async () => {},
        stopJSCoverage: async () => {},
        startCSSCoverage: async () => {},
        stopCSSCoverage: async () => {}
    };

    // Event handling
    private _eventHandlers: Map<string, Function[]> = new Map();

    on(event: string, handler: Function) {
        if (!this._eventHandlers.has(event)) {
            this._eventHandlers.set(event, []);
        }
        this._eventHandlers.get(event)!.push(handler);
    }

    off(event: string, handler: Function) {
        const handlers = this._eventHandlers.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    // Page lifecycle
    async close() {
        // Clean up page resources
        this._elements.clear();
        this._eventHandlers.clear();
    }

    // Frame handling
    mainFrame() {
        return {
            // Mock frame methods
            url: () => this._url,
            title: async () => this._title,
            $: async (selector: string) => this.$(selector),
            $$: async (selector: string) => this.$$(selector),
            click: async (selector: string, options?: any) => this.click(selector, options),
            fill: async (selector: string, value: string) => this.fill(selector, value),
            waitForSelector: async (selector: string, options?: any) => this.waitForSelector(selector, options),
            evaluate: async (fn: any, ...args: any[]) => this.evaluate(fn, ...args),
            textContent: async (selector: string) => this.textContent(selector)
        };
    }

    // Helper methods for testing
    _addElement(selector: string, element: MockElement) {
        element._selector = selector;
        this._elements.set(selector, element);
    }

    _removeElement(selector: string) {
        this._elements.delete(selector);
    }

    _clearElements() {
        this._elements.clear();
    }

    _setMockCookies(cookies: any[]) {
        this._cookies = cookies;
    }
}

export class MockElement {
    _selector: string = '';
    private _text: string = '';
    private _value: string = '';
    private _enabled: boolean = true;
    private _checked: boolean = false;
    private _visible: boolean = true;
    private _attributes: Map<string, string> = new Map();

    constructor(options: {
        text?: string;
        value?: string;
        enabled?: boolean;
        checked?: boolean;
        visible?: boolean;
        attributes?: Record<string, string>;
    } = {}) {
        this._text = options.text || '';
        this._value = options.value || '';
        this._enabled = options.enabled !== false;
        this._checked = options.checked || false;
        this._visible = options.visible !== false;
        if (options.attributes) {
            Object.entries(options.attributes).forEach(([key, value]) => {
                this._attributes.set(key, value);
            });
        }
    }

    async click(options?: any) {
        if (!this._enabled) {
            throw new Error('Element is not enabled');
        }
        // Mock click
    }

    async fill(value: string) {
        if (!this._enabled) {
            throw new Error('Element is not enabled');
        }
        this._value = value;
    }

    async textContent() {
        return this._text;
    }

    async inputValue() {
        return this._value;
    }

    async isEnabled() {
        return this._enabled;
    }

    async isChecked() {
        return this._checked;
    }

    async isVisible() {
        return this._visible;
    }

    async getAttribute(attr: string) {
        return this._attributes.get(attr) || null;
    }

    async boundingBox() {
        return { x: 0, y: 0, width: 100, height: 30 };
    }

    async innerHTML() {
        return `<div>${this._text}</div>`;
    }

    // Setters for testing
    setText(text: string) {
        this._text = text;
    }

    setValue(value: string) {
        this._value = value;
    }

    setEnabled(enabled: boolean) {
        this._enabled = enabled;
    }

    setChecked(checked: boolean) {
        this._checked = checked;
    }

    setVisible(visible: boolean) {
        this._visible = visible;
    }

    setAttribute(attr: string, value: string) {
        this._attributes.set(attr, value);
    }
}

export class MockBrowserContext {
    private _pages: MockPage[] = [];
    private _cookies: any[] = [];
    public _browser: MockBrowser | undefined;

    async newPage() {
        const page = new MockPage();
        this._pages.push(page);
        return page;
    }

    pages() {
        return this._pages;
    }

    async addCookies(cookies: any[]) {
        this._cookies.push(...cookies);
    }

    async cookies() {
        return this._cookies;
    }

    async clearCookies() {
        this._cookies = [];
    }

    async close() {
        // Close all pages first
        for (const page of this._pages) {
            // Clean up page resources if needed
        }
        this._pages = [];
        this._cookies = [];
        // Remove this context from browser
        if (this._browser) {
            const index = this._browser._contexts.indexOf(this);
            if (index > -1) {
                this._browser._contexts.splice(index, 1);
            }
        }
    }

    tracing = {
        start: async (options: any) => {},
        stop: async (options: any) => {}
    };
}

export class MockBrowser {
    public _contexts: MockBrowserContext[] = [];

    async newContext(options?: any) {
        const context = new MockBrowserContext();
        context._browser = this;
        this._contexts.push(context);
        return context;
    }

    contexts() {
        return this._contexts;
    }

    async close() {
        for (const context of this._contexts) {
            await context.close();
        }
        this._contexts = [];
    }

    version() {
        return '1.0.0';
    }
}

// Mock the playwright module
export const mockPlaywright = {
    chromium: {
        launch: async (options?: any) => new MockBrowser()
    },
    firefox: {
        launch: async (options?: any) => new MockBrowser()
    },
    webkit: {
        launch: async (options?: any) => new MockBrowser()
    }
};