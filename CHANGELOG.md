# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Pagination support for better navigation through large conversation lists (#18)
- Performance optimizations for improved rendering and responsiveness (#18)

### Fixed
- Corrected shortcut display order in bottom help text (#19)
- Upgraded to ESLint v9 and TypeScript-ESLint v8 to fix compatibility issues (#17)

### Changed
- Updated multiple dependencies including:
  - @types/node from 20.19.4 to 24.0.10 (#8)
  - jest from 30.0.3 to 30.0.4 (#10)
  - date-fns from 3.6.0 to 4.1.0 (#11)
  - codecov/codecov-action from 4 to 5 (#7)
- Improved CI/CD pipeline configuration (#6)
- Updated Node.js requirement to >= 18

### Security
- Updated various dependencies to address security vulnerabilities

## [0.1.5] - 2024-11-20

### Fixed
- Fixed conversation filtering logic

## [0.1.4] - 2024-11-19

### Fixed
- Fixed issue with configuration loading

## [0.1.3] - 2024-11-19

### Added
- Support for custom configuration paths
- Better error handling for invalid configurations

## [0.1.2] - 2024-11-18

### Fixed
- Fixed issue with message display truncation

## [0.1.1] - 2024-11-18

### Fixed
- Fixed CLI binary path issue

## [0.1.0] - 2024-11-17

### Added
- Initial release
- TUI interface for browsing Claude Code conversations
- Search functionality with conversation filtering
- Message preview with syntax highlighting
- Keyboard navigation and shortcuts
- Configuration file support
- Resume conversation functionality