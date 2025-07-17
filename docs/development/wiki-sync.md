# GitHub Wiki Synchronization

This document explains how the automated GitHub wiki synchronization works for the testring project.

## Overview

The wiki sync system automatically synchronizes documentation from the `docs/` directory to the GitHub wiki whenever changes are made. This ensures that the wiki always reflects the latest documentation.

## How It Works

### Trigger Events

The wiki sync is triggered by:

1. **Push to main branch** - When changes are pushed to the main branch that affect files in the `docs/` directory
2. **Manual trigger** - Can be manually triggered via GitHub Actions UI
3. **Scheduled sync** - Runs daily at 2 AM UTC to ensure consistency

### Sync Process

1. **Checkout repositories** - Both the main repository and the wiki repository are checked out
2. **Process markdown files** - All markdown files in `docs/` are processed:
   - Relative links are converted to wiki links
   - Metadata is added indicating the source file
   - Directory structure is flattened for wiki compatibility
3. **Update wiki** - Processed files are written to the wiki repository
4. **Commit changes** - If changes are detected, they are committed and pushed to the wiki

### File Processing

#### Link Conversion

Relative links in documentation are automatically converted to wiki links:

```markdown
<!-- Original in docs/ -->
[API Reference](../api/README.md)

<!-- Converted for wiki -->
[API Reference](API-Reference)
```

#### Filename Sanitization

Filenames are sanitized for wiki compatibility:

- Special characters are replaced with hyphens
- Multiple hyphens are collapsed to single hyphens
- Leading/trailing hyphens are removed

#### Directory Flattening

The hierarchical directory structure is flattened for the wiki:

```
docs/
├── getting-started/
│   ├── README.md          → Getting-Started.md
│   └── installation.md    → Installation.md
├── api/
│   └── README.md          → API.md
└── README.md              → Home.md
```

## Configuration

### Excluded Files

Some files are excluded from wiki sync:

- Files listed in the `EXCLUDED_FILES` array in the sync script
- Hidden files (starting with `.`)
- Non-markdown files

### Customization

To customize the sync behavior, modify the sync script in `.github/workflows/wiki-sync.yml`:

```javascript
// Configuration section
const DOCS_DIR = './docs';
const WIKI_DIR = './wiki';
const EXCLUDED_FILES = ['README.md']; // Add files to exclude
```

## Wiki Structure

The resulting wiki structure includes:

### Main Pages

- **Home** - Main documentation index (from `docs/README.md`)
- **Getting-Started** - Installation and quick start guides
- **API** - API reference documentation
- **Configuration** - Configuration guides
- **Guides** - Usage and development guides

### Module Documentation

- **Core-Modules** - Documentation for core framework modules
- **Packages** - Documentation for extension packages
- **Playwright-Driver** - Specific Playwright driver documentation

### Development Resources

- **Development** - Development and contribution guides
- **Reports** - Project reports and analysis

## Maintenance

### Monitoring

The wiki sync process can be monitored through:

1. **GitHub Actions** - Check the "Sync Documentation to Wiki" workflow
2. **Wiki history** - Review commit history in the wiki repository
3. **Action summaries** - Each run provides a summary of changes

### Troubleshooting

Common issues and solutions:

#### Sync Failures

**Problem:** Wiki sync fails with permission errors
**Solution:** Ensure the `GITHUB_TOKEN` has wiki write permissions

**Problem:** Link conversion errors
**Solution:** Check for malformed markdown links in source files

**Problem:** File processing errors
**Solution:** Validate markdown syntax and frontmatter in source files

#### Manual Sync

To manually trigger a sync:

1. Go to the GitHub Actions tab
2. Select "Sync Documentation to Wiki"
3. Click "Run workflow"
4. Choose the branch and click "Run workflow"

### Updating the Sync Script

To modify the sync behavior:

1. Edit `.github/workflows/wiki-sync.yml`
2. Test changes in a fork or feature branch
3. Submit a pull request with the changes

## Best Practices

### Documentation Writing

When writing documentation that will be synced to the wiki:

1. **Use relative links** - They will be automatically converted
2. **Avoid deep nesting** - Wiki structure is flattened
3. **Use descriptive filenames** - They become wiki page names
4. **Include frontmatter** - For better wiki metadata

Example frontmatter:

```markdown
---
title: "API Reference"
description: "Complete API reference for testring"
---

# API Reference

Content here...
```

### Link Management

- Use relative links within the documentation
- Avoid absolute URLs to internal documentation
- Test links in the source documentation before syncing

### File Organization

- Keep related content in the same directory
- Use clear, descriptive directory names
- Avoid special characters in filenames

## Integration with Development Workflow

### Pull Request Process

1. Make documentation changes in the `docs/` directory
2. Submit pull request with changes
3. After merge to main, wiki sync automatically runs
4. Verify changes appear in the wiki

### Release Process

Documentation updates are automatically included in the release process:

1. Documentation changes are made during development
2. Changes are reviewed as part of pull requests
3. Wiki is automatically updated when changes are merged
4. Wiki reflects the latest documentation for each release

## Security Considerations

### Permissions

The wiki sync uses the default `GITHUB_TOKEN` which has:

- Read access to the repository
- Write access to the wiki
- No access to secrets or other repositories

### Content Filtering

The sync process:

- Only processes markdown files
- Excludes sensitive files (like configuration with secrets)
- Sanitizes filenames for security
- Does not execute any code from documentation files

## Future Enhancements

Potential improvements to the wiki sync system:

1. **Incremental sync** - Only sync changed files
2. **Image handling** - Sync images and assets
3. **Cross-references** - Better handling of internal links
4. **Wiki templates** - Custom templates for different content types
5. **Validation** - Pre-sync validation of markdown content

## Related Documentation

- [Development Guide](README.md) - General development information
- [Contributing Guidelines](contributing.md) - How to contribute to the project
- [GitHub Actions Documentation](https://docs.github.com/en/actions) - GitHub Actions reference
