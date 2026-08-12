// Real module-customization-hooks file (Node's own recommended shape for
// hook logic that "deserves its own file" — see the `module.register()`
// docs), registered by ../esm-loader-hooks.ts via a real file:// URL rather
// than an inlined `data:` URL. This file is never compiled by tsc — it's a
// plain, hand-authored ES module, copied into dist/ as-is by
// copy-esm-loader-hooks-impl.js at build time — so it can be linted,
// debugged, and read like normal source.
//
// Native ESM does not do CommonJS-style extensionless relative resolution
// (`./helper` without `.js`) — this hook restores that, the one thing a
// deleted vm-sandbox used to provide for free that Node has no built-in
// equivalent for.
//
// Treating ambiguous `.js` autotest files as ES modules (FR-009) does NOT
// need a hook at all: Node's own module-syntax detection (`detect-module`,
// unflagged-to-default in Node 20.19.0/22.7.0 — inside this repo's already
// -raised `>=20.19` floor) already parses a `.js` file with no
// `"type": "module"` field as CommonJS first, and transparently re-parses
// it as an ES module if that fails because it contains `import`/`export`
// syntax. An earlier version of this file re-implemented that same
// decision manually via a `load()` override — doing so is what caused a
// package's own internal relative import (e.g. chai's `index.mjs` doing
// `import chai from './index.js'`, which also passes through this same
// resolve() hook) to have its genuinely-CommonJS `index.js` incorrectly
// forced into `format: 'module'`. Not overriding format at all avoids
// that whole class of bug structurally, rather than patching around it.
function isBareSpecifier(specifier) {
    return !(
        specifier.startsWith('./') ||
        specifier.startsWith('../') ||
        specifier.startsWith('/') ||
        specifier.startsWith('file:')
    );
}

export async function resolve(specifier, context, nextResolve) {
    try {
        return await nextResolve(specifier, context);
    } catch (error) {
        const isMissing =
            error &&
            (error.code === 'ERR_MODULE_NOT_FOUND' ||
                error.code === 'ERR_UNSUPPORTED_DIR_IMPORT');

        if (!isBareSpecifier(specifier) && isMissing) {
            for (const candidate of [
                specifier + '.js',
                specifier + '/index.js',
            ]) {
                try {
                    return await nextResolve(candidate, context);
                } catch (nestedError) {
                    // try the next candidate
                }
            }
        }

        throw error;
    }
}
