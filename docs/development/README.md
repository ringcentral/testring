# Development

This directory contains documentation for developers working on the testring framework itself.

## Contents

- [Utils Documentation](utils.md) - Build and maintenance utilities
- [Contributing Guidelines](contributing.md) - How to contribute to testring
- [Claude Guidance](claude-guidance.md) - AI assistant guidance for this codebase
- [Wiki Sync](wiki-sync.md) - Automated GitHub wiki synchronization

## Development Setup

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Git

### Getting Started

```bash
# Clone the repository
git clone https://github.com/ringcentral/testring.git
cd testring

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

### Project Structure

```
testring/
├── core/              # Core framework modules
├── packages/          # Extension packages
├── docs/              # Documentation
├── utils/             # Build and maintenance tools
└── README.md          # Project documentation
```

### Development Workflow

1. Create a feature branch
2. Make your changes
3. Add tests for new functionality
4. Run the test suite
5. Update documentation
6. Submit a pull request

## Quick Links

- [Main Documentation](../README.md)
- [Core Modules](../core-modules/README.md)
- [Package Documentation](../packages/README.md)
