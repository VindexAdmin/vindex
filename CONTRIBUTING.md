# Contributing to VindexChain

Thank you for your interest in contributing to VindexChain! This document provides guidelines and information for contributors.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Process](#development-process)
4. [Coding Standards](#coding-standards)
5. [Testing](#testing)
6. [Documentation](#documentation)
7. [Pull Request Process](#pull-request-process)
8. [Security](#security)

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences
- Show empathy towards other community members

## Getting Started

### Prerequisites

- Node.js 18+
- Go 1.21+
- PostgreSQL 15+
- Git
- Docker (optional)

### Setup Development Environment

1. **Fork the repository**
```bash
git clone https://github.com/your-username/vindexchain-ecosystem
cd vindexchain-ecosystem
```

2. **Run setup script**
```bash
./scripts/setup.sh
```

3. **Start development servers**
```bash
npm run dev
```

### Project Structure

```
vindexchain-ecosystem/
├── blockchain/           # Go blockchain core
├── explorer/            # Next.js block explorer  
├── wallet/              # Browser extension
├── dex/                 # DEX interface
├── website/             # Main website
├── docs/                # Documentation
└── scripts/             # Utility scripts
```

## Development Process

### Branching Strategy

We use GitFlow branching model:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `hotfix/*` - Critical bug fixes
- `release/*` - Release preparation

### Workflow

1. Create a feature branch from `develop`
2. Make your changes
3. Add tests
4. Update documentation
5. Submit a pull request

```bash
# Create feature branch
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/your-feature-name
```

## Coding Standards

### Go Code (Blockchain)

- Follow [Go Code Review Comments](https://github.com/golang/go/wiki/CodeReviewComments)
- Use `gofmt` for formatting
- Add comments for exported functions
- Write table-driven tests

```go
// Good example
func ValidateAddress(addr string) error {
    if len(addr) == 0 {
        return errors.New("address cannot be empty")
    }
    // validation logic
    return nil
}
```

### TypeScript/React Code

- Use TypeScript for type safety
- Follow React best practices
- Use functional components with hooks
- Implement proper error boundaries

```typescript
// Good example
interface WalletProps {
  address: string;
  balance: BigNumber;
  onSend: (amount: string, recipient: string) => Promise<void>;
}

export function Wallet({ address, balance, onSend }: WalletProps) {
  // component logic
}
```

### CSS/Styling

- Use Tailwind CSS for styling
- Follow mobile-first responsive design
- Maintain consistent spacing (8px grid)
- Use semantic color names

```css
/* Good example */
.wallet-card {
  @apply bg-gray-900 rounded-lg p-6 border border-red-600/20;
}
```

## Testing

### Test Requirements

- Unit tests for all business logic
- Integration tests for API endpoints
- E2E tests for critical user flows
- Minimum 80% code coverage

### Running Tests

```bash
# Run all tests
npm test

# Run specific component tests
npm run test:core
npm run test:explorer
npm run test:wallet
npm run test:dex

# Run with coverage
npm run test:coverage
```

### Writing Tests

#### Go Tests

```go
func TestValidateAddress(t *testing.T) {
    tests := []struct {
        name    string
        addr    string
        wantErr bool
    }{
        {"valid address", "vindex1abc123", false},
        {"empty address", "", true},
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := ValidateAddress(tt.addr)
            if (err != nil) != tt.wantErr {
                t.Errorf("ValidateAddress() error = %v, wantErr %v", err, tt.wantErr)
            }
        })
    }
}
```

#### React Tests

```typescript
import { render, screen } from '@testing-library/react';
import { Wallet } from './Wallet';

test('displays wallet balance', () => {
  render(
    <Wallet 
      address="vindex1abc123" 
      balance={new BigNumber('1000000')}
      onSend={jest.fn()}
    />
  );
  
  expect(screen.getByText('1.000000 OC$')).toBeInTheDocument();
});
```

## Documentation

### Requirements

- All public APIs must be documented
- Include code examples
- Update README files for changes
- Add inline comments for complex logic

### Documentation Types

1. **API Documentation** - OpenAPI/Swagger specs
2. **Code Documentation** - Inline comments
3. **User Guides** - Step-by-step instructions
4. **Developer Guides** - Technical implementation details

### Writing Guidelines

- Use clear, concise language
- Include practical examples
- Keep documentation up-to-date
- Use proper markdown formatting

## Pull Request Process

### Before Submitting

1. **Test your changes**
```bash
npm test
npm run lint
npm run build
```

2. **Update documentation**
- Update relevant README files
- Add/update API documentation
- Include code examples

3. **Write descriptive commit messages**
```bash
# Good commit messages
feat: add token creation functionality
fix: resolve wallet connection issue
docs: update API documentation
test: add unit tests for staking module
```

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Review Process

1. **Automated Checks**
   - All tests must pass
   - Code coverage requirements met
   - Linting passes
   - Build succeeds

2. **Code Review**
   - At least one core team member review
   - Security review for sensitive changes
   - Performance review for critical paths

3. **Approval and Merge**
   - All feedback addressed
   - Final approval from maintainer
   - Squash and merge to develop

## Security

### Reporting Security Issues

**DO NOT** create public issues for security vulnerabilities.

Instead, email us at: security@vindexchain.com

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Security Guidelines

- Never commit secrets or private keys
- Use environment variables for configuration
- Validate all user inputs
- Follow secure coding practices
- Regular dependency updates

### Security Review Process

1. **Automated Security Scanning**
   - Dependency vulnerability scanning
   - Static code analysis
   - Secret detection

2. **Manual Security Review**
   - Code review by security team
   - Threat modeling for new features
   - Penetration testing for major releases

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project website
- Annual contributor awards

## Getting Help

- **Discord**: https://discord.gg/vindexchain
- **GitHub Discussions**: Use for questions and ideas
- **Email**: dev@vindexchain.com

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.

---

Thank you for contributing to VindexChain! 🛡️🇵🇷