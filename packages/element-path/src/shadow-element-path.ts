
export interface ShadowElementPathProxy {
    toShadowCSSSelector(): string;
    toString(): string;
    toFormattedString(): string;
    isShadowElement: true;
    and(selector: string): ShadowElementPathProxy;
    then(selector: string): ShadowElementPathProxy;
    getParentSelectors(): string[];
    shadow$: ShadowElementPathProxy;
    [key: string]: any;
    [key: symbol]: any;
}

/**
 * Regex patterns for CSS selector pattern matching
 * - '*' - all elements with the specified attribute
 * - '*foo' - attribute ends with foo
 * - 'foo*' - attribute starts with foo
 * - '*foo*' - attribute contains foo
 * - 'foo' - exact foo value
 */
export const CSS_SELECTOR_PATTERNS = {
    // Wildcard pattern: '*'
    WILDCARD: /^\*$/,
    
    // Suffix pattern: '*foo' (starts with * but doesn't end with *)
    SUFFIX: /^\*[^*]+$/,
    
    // Prefix pattern: 'foo*' (ends with * but doesn't start with *)
    PREFIX: /^[^*]+\*$/,
    
    // Contains pattern: '*foo*' (starts and ends with *, length > 2)
    CONTAINS: /^\*[^*]+\*$/
} as const;

function propertyToCSSSelector(prop: string, attributeName: string): string {
    // Handle escaped asterisks: foo\\*bar -> foo*bar
    if (prop.includes('\\*')) {
        return `[${attributeName}="${prop.replace(/\\\*/g, '*')}"]`;
    }
    
    // Handle wildcard
    if (CSS_SELECTOR_PATTERNS.WILDCARD.test(prop)) {
        return `[${attributeName}]`;
    }
    
    // Handle suffix pattern: *foo
    if (CSS_SELECTOR_PATTERNS.SUFFIX.test(prop)) {
        const value = prop.substring(1);
        return `[${attributeName}$="${value}"]`;
    }
    
    // Handle prefix pattern: foo*
    if (CSS_SELECTOR_PATTERNS.PREFIX.test(prop)) {
        const value = prop.substring(0, prop.length - 1);
        return `[${attributeName}^="${value}"]`;
    }
    
    // Handle contains pattern: *foo*
    if (CSS_SELECTOR_PATTERNS.CONTAINS.test(prop)) {
        const value = prop.substring(1, prop.length - 1);
        return `[${attributeName}*="${value}"]`;
    }
    
    // Handle exact match
    return `[${attributeName}="${prop}"]`;
}

export function createShadowElementPathProxy(parentSelectors: string[], attributeName: string): ShadowElementPathProxy {
    const cssParts: string[] = [];
    
    const proxy = new Proxy(Object.create(null), {
        get(_t, prop: string | symbol) {
            if (prop === 'toShadowCSSSelector') {
                return () => cssParts.join(' ');
            }
            if (prop === 'toString' || prop === 'toFormattedString') {
                return () => parentSelectors[0];
            }
            if (prop === 'isShadowElement') {
                return true;
            }
            // getParentSelectors
            if (prop === 'getParentSelectors') {
                return () => parentSelectors;
            }
            // handle shadow$
            if (prop === 'shadow$') {
                const newParentSelectors = parentSelectors.concat(cssParts.join(' '));
                return createShadowElementPathProxy(newParentSelectors, attributeName);
            }
            // handle and
            if (prop === 'and') {
                return (selector: string) => {
                    if (cssParts.length > 0) {
                        cssParts[cssParts.length - 1] += selector;
                    }
                    return proxy;
                };
            }
            if (prop === 'then') {
                return (selector: string) => {
                    cssParts.push(selector);
                    return proxy;
                };
            }

            // Throw error for empty string properties
            if (typeof prop === 'string' && prop === '') {
                throw new Error('Empty string property is not supported');
            }
            
            // Throw error for integer properties
            if (typeof prop === 'string' && !isNaN(Number(prop)) && Number.isInteger(Number(prop))) {
                throw new Error(`Index access is not supported. Received integer property: ${prop}`);
            }
            
            // Add CSS part for property access
            if (typeof prop === 'string') {
                cssParts.push(propertyToCSSSelector(prop, attributeName));
            }
            
            return proxy;
        }
    });
    
    return proxy as ShadowElementPathProxy;
}
