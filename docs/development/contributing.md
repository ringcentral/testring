# Contributing to Testring

Thank you for your interest in contributing to testring! This guide will help you get started with contributing to the project.

## Getting Started

### Prerequisites

Before you begin, ensure you have:

- Node.js 16.0 or higher
- npm 7.0 or higher
- Git
- A GitHub account

### Setting Up the Development Environment

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/testring.git
   cd testring
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/ringcentral/testring.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Build the project**:
   ```bash
   npm run build
   ```
6. **Run tests** to ensure everything works:
   ```bash
   npm test
   ```

## Development Workflow

### Creating a Feature Branch

1. **Sync with upstream**:
   ```bash
   git checkout main
   git pull upstream main
   ```
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Making Changes

1. **Make your changes** in the appropriate files
2. **Add tests** for new functionality
3. **Update documentation** as needed
4. **Run tests** to ensure nothing is broken:
   ```bash
   npm test
   ```
5. **Run linting**:
   ```bash
   npm run lint
   npm run lint:fix  # Auto-fix issues
   ```

### Committing Changes

We follow conventional commit messages:

```bash
git commit -m "feat: add new plugin system feature"
git commit -m "fix: resolve memory leak in worker processes"
git commit -m "docs: update API documentation"
git commit -m "test: add unit tests for transport module"
```

Commit types:
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `test`: Test additions or modifications
- `refactor`: Code refactoring
- `style`: Code style changes
- `chore`: Build process or auxiliary tool changes

### Submitting a Pull Request

1. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```
2. **Create a pull request** on GitHub
3. **Fill out the PR template** with:
   - Description of changes
   - Related issues
   - Testing performed
   - Breaking changes (if any)

## Code Standards

### TypeScript Guidelines

- Use TypeScript for all new code
- Follow existing code style and patterns
- Add proper type annotations
- Use interfaces for object types
- Prefer `const` over `let` when possible

Example:

```typescript
interface PluginConfig {
    name: string;
    enabled: boolean;
    options?: Record<string, unknown>;
}

const createPlugin = (config: PluginConfig): Plugin => {
    return {
        name: config.name,
        initialize: () => {
            // Implementation
        }
    };
};
```

### Testing Guidelines

- Write unit tests for all new functionality
- Use descriptive test names
- Follow the AAA pattern (Arrange, Act, Assert)
- Mock external dependencies
- Aim for high test coverage

Example:

```typescript
describe('PluginManager', () => {
    it('should register plugin successfully', () => {
        // Arrange
        const manager = new PluginManager();
        const plugin = createMockPlugin();
        
        // Act
        manager.register(plugin);
        
        // Assert
        expect(manager.getPlugin(plugin.name)).toBe(plugin);
    });
});
```

### Documentation Guidelines

- Update documentation for any API changes
- Use clear, concise language
- Include code examples
- Follow the existing documentation structure
- Update the changelog for significant changes

## Project Structure

Understanding the project structure helps with contributions:

```
testring/
├── core/                 # Core framework modules
│   ├── api/             # API controllers
│   ├── cli/             # Command line interface
│   ├── logger/          # Logging system
│   └── ...              # Other core modules
├── packages/            # Extension packages
│   ├── plugin-*/        # Plugin packages
│   ├── devtool-*/       # Development tools
│   └── ...              # Other packages
├── docs/                # Documentation
├── utils/               # Build and maintenance scripts
└── .github/             # GitHub workflows and templates
```

## Types of Contributions

### Bug Fixes

1. **Search existing issues** to avoid duplicates
2. **Create an issue** if one doesn't exist
3. **Reference the issue** in your PR
4. **Include tests** that reproduce the bug
5. **Verify the fix** works as expected

### New Features

1. **Discuss the feature** in an issue first
2. **Get approval** from maintainers
3. **Follow the plugin architecture** for extensions
4. **Include comprehensive tests**
5. **Update documentation**

### Documentation Improvements

1. **Identify areas** that need improvement
2. **Follow the documentation structure**
3. **Include examples** where helpful
4. **Test documentation** for accuracy

### Performance Improvements

1. **Benchmark current performance**
2. **Implement improvements**
3. **Measure performance gains**
4. **Include benchmarks** in the PR

## Plugin Development

### Creating a New Plugin

1. **Use the plugin template**:
   ```bash
   npm run create-plugin my-plugin-name
   ```
2. **Follow the plugin API**:
   ```typescript
   export interface Plugin {
       name: string;
       initialize(api: PluginAPI): void;
       destroy?(): void;
   }
   ```
3. **Add comprehensive tests**
4. **Document the plugin** thoroughly

### Plugin Guidelines

- Follow the single responsibility principle
- Use the provided plugin API
- Handle errors gracefully
- Provide clear configuration options
- Include usage examples

## Release Process

### Versioning

We follow semantic versioning (SemVer):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

1. Update version numbers
2. Update changelog
3. Run full test suite
4. Build and verify packages
5. Create release notes
6. Tag the release

## Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

### Communication

- **GitHub Issues**: Bug reports and feature requests
- **Pull Requests**: Code contributions and discussions
- **Discussions**: General questions and community chat

### Getting Help

If you need help:

1. **Check the documentation** first
2. **Search existing issues** for similar problems
3. **Create a new issue** with detailed information
4. **Join community discussions**

## Recognition

Contributors are recognized in:

- The project's contributor list
- Release notes for significant contributions
- Special recognition for major features or fixes

## Legal

By contributing to testring, you agree that your contributions will be licensed under the same license as the project (MIT License).

## Questions?

If you have questions about contributing:

1. Check this guide first
2. Look at existing issues and PRs
3. Create a new issue with the "question" label
4. Reach out to maintainers

Thank you for contributing to testring! 🎉
