# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-11-04

### Added
- Example user template in `.dendrita/users/example-user/` with complete structure
- Node.js integration setup (package.json, package-lock.json, tsconfig.json) in `.dendrita/integrations/`
- Archived scripts and documentation in `.archived/`

### Changed
- **BREAKING**: Moved agents from `.dendrita/agents/` to `.dendrita/users/[user-id]/agents/`
- **BREAKING**: Moved skills from `.dendrita/skills/` to `.dendrita/users/[user-id]/skills/`
- Reorganized user-specific domain knowledge to be stored per user
- Updated documentation to use generic examples and placeholders

### Fixed
- Removed all personal information (emails, user IDs, workspace names) from code examples
- Removed `.dendrita/settings.local.json` from Git tracking
- Updated all examples to use generic placeholders (`[user-id]`, `[workspace-name]`, etc.)
- Cleaned up documentation to remove specific company/project references

### Documentation
- Updated README.md with generic examples
- Updated CONTRIBUTING.md with generic examples
- Updated `.dendrita/WORKSPACE-STRUCTURE.md` with generic workspace names
- Updated `.dendrita/users/README.md` with generic user examples
- Updated integration documentation with generic examples

### Security
- Verified zero personal information in codebase
- Only name and company in "About" sections of README (as per open-source best practices)
- All user-specific files properly excluded from Git

### Status
- Privacy: All personal information removed from open-source codebase
- Structure: Agents and skills now properly organized per user
- Documentation: Generic examples ready for open-source distribution
- Integration: Node.js setup ready for replication

## [0.1.0] - 2025-11-03

### Added
- MIT License for open source distribution
- Code of Conduct (Contributor Covenant v1.4)
- Contributing guide with git workflow and commit conventions
- Security policy with responsible vulnerability disclosure
- Pull Request template with impact analysis
- Issue templates (bug report, feature request, question)
- GitHub issue template configuration with quick links
- README enhanced with badges and "Using as Template" section
- Template customization guide for new workspaces
- Full governance documentation

### Documentation
- README with project badges and platform info
- INSTRUCTION.md for Cursor/ChatGPT integration
- CONTRIBUTING.md with clear workflow
- SECURITY.md with SLAs for vulnerability fixes

### Fixed
- Removed unnecessary long setup guide (redundant with README)

### Status
- Framework: Complete and documented
- Governance: Ready for open source distribution
- Community: Ready for contributions
- Template: Ready for forking and customization

---

## Release Strategy

We follow [Semantic Versioning](https://semver.org/):
- **0.x.y**: Foundation and early releases
- **1.0.0**: First stable release
- **x.y.z**: Breaking changes, features, fixes

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.
