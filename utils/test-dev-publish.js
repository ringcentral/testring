#!/usr/bin/env node

/**
 * Test script to validate dev publishing logic without actually publishing
 */

const path = require('path');
const fs = require('fs');
const {getPackages} = require('@lerna/project');
const {filterPackages} = require('@lerna/filter-packages');

// Mock parameters for testing
const mockGithubUsername = 'testuser';
const mockCommitId = 'abc1234';
const excludeList = ['@testring/devtool-frontend', '@testring/devtool-backend', '@testring/devtool-extension'];

// Function to create dev package.json (copied from publish.js)
function createDevPackageJson(pkg, githubUsername, commitId) {
    const packageJsonPath = path.join(pkg.location, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Create dev version: original-version-username-commitid
    const devVersion = `${packageJson.version}-${githubUsername}-${commitId}`;
    
    // Transform package name
    let devName;
    if (packageJson.name === 'testring') {
        devName = 'testring-dev';
    } else if (packageJson.name.startsWith('@testring/')) {
        devName = packageJson.name.replace('@testring/', '@testring-dev/');
    } else {
        devName = packageJson.name; // Keep original name if it doesn't match expected patterns
    }
    
    // Create modified package.json
    const devPackageJson = {
        ...packageJson,
        name: devName,
        version: devVersion
    };
    
    // Transform dependencies to use dev versions
    if (devPackageJson.dependencies) {
        for (const [depName, depVersion] of Object.entries(devPackageJson.dependencies)) {
            if (depName === 'testring') {
                devPackageJson.dependencies[depName] = `${depVersion}-${githubUsername}-${commitId}`;
            } else if (depName.startsWith('@testring/')) {
                devPackageJson.dependencies[depName] = `${depVersion}-${githubUsername}-${commitId}`;
            }
        }
    }
    
    return devPackageJson;
}

async function testDevPublish() {
    console.log('🧪 Testing dev publish logic...\n');
    
    try {
        const packages = await getPackages(__dirname);
        const filtered = filterPackages(packages, [], excludeList, false);
        
        console.log(`📦 Found ${filtered.length} packages to process:\n`);
        
        for (const pkg of filtered) {
            const originalPackageJson = JSON.parse(fs.readFileSync(path.join(pkg.location, 'package.json'), 'utf8'));
            const devPackageJson = createDevPackageJson(pkg, mockGithubUsername, mockCommitId);
            
            console.log(`Package: ${originalPackageJson.name}`);
            console.log(`  Original version: ${originalPackageJson.version}`);
            console.log(`  Dev name: ${devPackageJson.name}`);
            console.log(`  Dev version: ${devPackageJson.version}`);
            
            // Show dependency transformations
            if (devPackageJson.dependencies) {
                const transformedDeps = Object.entries(devPackageJson.dependencies)
                    .filter(([name, version]) => name.startsWith('@testring/') || name === 'testring')
                    .filter(([name, version]) => version.includes(`-${mockGithubUsername}-${mockCommitId}`));
                
                if (transformedDeps.length > 0) {
                    console.log(`  Transformed dependencies:`);
                    transformedDeps.forEach(([name, version]) => {
                        console.log(`    ${name}: ${version}`);
                    });
                }
            }
            console.log('');
        }
        
        console.log('✅ Dev publish logic test completed successfully!');
        console.log('\nTo test the actual publish command (dry run):');
        console.log(`npm run publish:dev -- --github-username=${mockGithubUsername} --commit-id=${mockCommitId}`);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

testDevPublish();
