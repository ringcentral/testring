# Dev Publishing Guide

This document describes the conditional publishing system for testring packages.

## Overview

The testring project now supports conditional publishing to development packages when:
- The repository is not `ringcentral/testring`, OR
- The branch is not `master`, AND
- `NPM_TOKEN` is available

## Publishing Logic

### Production Publishing (Original)
- **Condition**: Repository is `ringcentral/testring` AND branch is `master`
- **Target**: Original package names (`testring`, `@testring/*`)
- **Version**: Uses the version specified in the workflow input

### Dev Publishing (New)
- **Condition**: Repository is NOT `ringcentral/testring` OR branch is NOT `master`, AND `NPM_TOKEN` is available
- **Target**: Dev package names (`testring-dev`, `@testring-dev/*`)
- **Version**: `{original-version}-{github-username}-{commit-id}`

## Package Name Transformations

| Original Package | Dev Package |
|------------------|-------------|
| `testring` | `testring-dev` |
| `@testring/api` | `@testring-dev/api` |
| `@testring/cli` | `@testring-dev/cli` |
| `@testring/*` | `@testring-dev/*` |

## Version Format

Dev versions follow the pattern: `{original-version}-{github-username}-{commit-id}`

Example:
- Original version: `0.8.0`
- GitHub username: `johndoe`
- Commit ID: `abc1234`
- Dev version: `0.8.0-johndoe-abc1234`

## Dependencies

All internal dependencies are automatically transformed to use dev versions:
- `@testring/api: 0.8.0` → `@testring/api: 0.8.0-johndoe-abc1234`
- `testring: 0.8.0` → `testring: 0.8.0-johndoe-abc1234`

## Usage

### Manual Dev Publishing

```bash
# Test the dev publishing logic (dry run)
node utils/test-dev-publish.js

# Publish to dev packages
npm run publish:dev -- --github-username=yourusername --commit-id=abc1234
```

### GitHub Actions

The publishing workflow automatically detects the conditions and publishes accordingly:

1. **Production**: Triggered on `ringcentral/testring` master branch
2. **Dev**: Triggered on any other repository or branch (with NPM_TOKEN)

## Testing

Use the test script to validate the dev publishing logic:

```bash
node utils/test-dev-publish.js
```

This script will:
- Show all packages that would be published
- Display the transformed package names and versions
- Show dependency transformations
- Validate the logic without actually publishing

## Excluded Packages

The following packages are excluded from publishing (both production and dev):
- `@testring/devtool-frontend`
- `@testring/devtool-backend`
- `@testring/devtool-extension`

## Implementation Details

### Files Modified

1. **`utils/publish.js`**: Enhanced with dev publishing logic
2. **`.github/workflows/publish.yml`**: Added conditional publishing workflow
3. **`package.json`**: Added `publish:dev` script
4. **`utils/test-dev-publish.js`**: Test script for validation

### Key Features

- **Automatic detection**: No manual configuration needed
- **Dependency transformation**: All internal dependencies use dev versions
- **Safe publishing**: Temporary package.json files prevent accidental overwrites
- **Comprehensive testing**: Test script validates logic before publishing
- **Flexible versioning**: Includes username and commit ID for uniqueness

## Troubleshooting

### Common Issues

1. **Missing NPM_TOKEN**: Dev publishing requires NPM_TOKEN to be set
2. **Invalid parameters**: Dev publishing requires both `--github-username` and `--commit-id`
3. **Package conflicts**: Dev packages use unique versioning to avoid conflicts

### Debug Commands

```bash
# Check package transformations
node utils/test-dev-publish.js

# Validate package versions
node utils/check-packages-versions.js

# Test publish command (without actual publishing)
npm run publish:dev -- --github-username=test --commit-id=test
```
