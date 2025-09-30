const fs = require('fs');
const path = require('path');

/**
 * Copy selenium-server folder to dist directory
 */
function copySeleniumServer() {
    const sourceDir = path.join(__dirname, 'src', 'selenium-server-v4');
    const destDir = path.join(__dirname, 'dist', 'selenium-server-v4');
    
    try {
        // Check if source directory exists
        if (!fs.existsSync(sourceDir)) {
            console.error(`Source directory does not exist: ${sourceDir}`);
            process.exit(1);
        }
        
        // Create dist directory if it doesn't exist
        const distDir = path.join(__dirname, 'dist');
        if (!fs.existsSync(distDir)) {
            fs.mkdirSync(distDir, { recursive: true });
        }
        
        // Remove existing selenium-server folder in dist if it exists
        if (fs.existsSync(destDir)) {
            fs.rmSync(destDir, { recursive: true, force: true });
        }
        
        // Copy the entire selenium-server folder
        fs.cpSync(sourceDir, destDir, { recursive: true });
        
        console.log(`Successfully copied selenium-server folder to ${destDir}`);
    } catch (error) {
        console.error('Error copying selenium-server folder:', error.message);
        process.exit(1);
    }
}

// Run the copy function
copySeleniumServer();
