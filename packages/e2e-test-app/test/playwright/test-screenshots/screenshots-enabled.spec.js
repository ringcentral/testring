import {run} from 'testring';
import {unlink, stat, readFile} from 'fs';
import {promisify} from 'util';
import {extname, basename} from 'path';

import {assert} from 'chai';

const deleteFile = promisify(unlink);
const statFile = promisify(stat);
const readFileAsync = promisify(readFile);

run(async (api) => {
    console.log('🔍 Starting screenshot validation test...');

    await api.application.url('http://localhost:8080/screenshot.html');
    const fName = await api.application.makeScreenshot();

    // Validation Point 1: Screenshot file path should be returned
    assert.ok(
        typeof fName === 'string' && fName.length > 0,
        '✅ Screenshot file path should be a non-empty string'
    );
    console.log(`✅ Screenshot file created: ${fName}`);

    // Validation Point 2: File should exist on filesystem
    const fstat = await statFile(fName);
    assert.ok(
        typeof fstat === 'object',
        '✅ Screenshot file should exist on filesystem'
    );
    console.log(`✅ File exists with size: ${fstat.size} bytes`);

    // Validation Point 3: File should have reasonable size (not empty, not too small)
    assert.ok(
        fstat.size > 100,
        '✅ Screenshot file should have reasonable size (> 100 bytes)'
    );
    console.log(`✅ File size validation passed: ${fstat.size} bytes`);

    // Validation Point 4: File should have correct extension
    const fileExtension = extname(fName);
    assert.ok(
        fileExtension === '.png' || fileExtension === '.jpg' || fileExtension === '.jpeg',
        '✅ Screenshot should have valid image extension'
    );
    console.log(`✅ File extension validation passed: ${fileExtension}`);

    // Validation Point 5: File should contain valid image data (PNG signature check)
    const fileBuffer = await readFileAsync(fName);
    const isPNG = fileBuffer.length >= 8 &&
                  fileBuffer[0] === 0x89 &&
                  fileBuffer[1] === 0x50 &&
                  fileBuffer[2] === 0x4E &&
                  fileBuffer[3] === 0x47;

    if (fileExtension === '.png') {
        assert.ok(isPNG, '✅ PNG file should have valid PNG signature');
        console.log('✅ PNG signature validation passed');
    }

    // Validation Point 6: File should be created recently (within last minute)
    const now = new Date();
    const fileAge = now.getTime() - fstat.mtime.getTime();
    assert.ok(
        fileAge < 60000, // 60 seconds
        '✅ Screenshot should be created recently (within 60 seconds)'
    );
    console.log(`✅ File timestamp validation passed: created ${Math.round(fileAge/1000)}s ago`);

    console.log('🎉 All screenshot validation points passed successfully!');
    console.log(`📊 Screenshot Summary:
    - File: ${basename(fName)}
    - Size: ${fstat.size} bytes
    - Format: ${fileExtension}
    - Created: ${fstat.mtime.toISOString()}
    `);

    // cleanup
    assert.doesNotThrow(
        async () => await deleteFile(fName),
        '✅ Screenshot cleanup should succeed'
    );
    console.log('🧹 Screenshot file cleaned up successfully');
});
