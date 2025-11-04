# Contributing

Thanks for your interest in contributing to **ennui-dendrita**!

## Before You Start

- Read the [Code of Conduct](CODE_OF_CONDUCT.md)
- Check existing [issues](../../issues) to avoid duplicates
- Review the [structure](#structure) below

## How to Contribute

### 1. Fork & Clone
```bash
git clone https://github.com/your-username/ennui-dendrita.git
cd ennui-dendrita
git checkout -b feature/your-feature
```

### 2. Make Changes

### 3. Commit with Clear Messages
```
feat: Add new feature
fix: Fix bug
docs: Update documentation
refactor: Code cleanup
```

### 4. Push & Open PR
```bash
git push origin feature/your-feature
```

## What We're Looking For

- **Structure matters** - Follow the workspace organization
- **Documentation** - Update docs alongside changes
- **Clarity** - Keep files readable and concise
- **ennui context** - Include relevant workspace/project info when applicable

## Project Structure

```
workspaces/[company]/
├── active-projects/[project]/
│   ├── master-plan.md
│   ├── current-context.md
│   └── tasks.md
├── best-practices/
├── work-modes/
└── ...
```

## Special Contributions

### Adding a New Workspace
1. Create `workspaces/[company]/` following `.dendrita/templates/workspace-template/`
2. Add README with context
3. Document in main README.md

### Adding a Methodology
1. Create `workspaces/[workspace-name]/best-practices/[name]/`
2. Include `README.md` with description
3. Add full documentation

### Adding a Work Mode
1. Create `.dendrita/users/[user-id]/agents/[name].md`
2. Document purpose and use cases

## Questions?

- Use [Discussions](https://github.com/ennui-dendrita/ennui-dendrita/discussions) for questions
- Check [SECURITY.md](SECURITY.md) for security issues
- Report bugs via [Issues](../../issues)

Thanks for contributing! 🚀
