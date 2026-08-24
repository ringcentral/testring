const fs = require('fs');
const path = require('path');

/**
 * Copy the hand-authored ESM loader hooks file into dist/, since tsc only
 * compiles .ts sources and won't emit a plain .mjs file on its own.
 */
function copyEsmLoaderHooksImpl() {
    const sourceFile = path.join(
        __dirname,
        'src',
        'worker',
        'esm-loader-hooks-impl.mjs',
    );
    const destFile = path.join(
        __dirname,
        'dist',
        'worker',
        'esm-loader-hooks-impl.mjs',
    );

    try {
        if (!fs.existsSync(sourceFile)) {
            console.error(`Source file does not exist: ${sourceFile}`);
            process.exit(1);
        }

        fs.mkdirSync(path.dirname(destFile), {recursive: true});
        fs.copyFileSync(sourceFile, destFile);

        console.log(`Successfully copied esm-loader-hooks-impl.mjs to ${destFile}`);
    } catch (error) {
        console.error('Error copying esm-loader-hooks-impl.mjs:', error.message);
        process.exit(1);
    }
}

copyEsmLoaderHooksImpl();
