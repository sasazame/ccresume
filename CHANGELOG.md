# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2025-08-06

### Added
- Display git branch in conversation preview for newer Claude Code versions (#46)
- New session feature - press `n` to start a new Claude session in selected project directory (#48)
- Interactive command editor - press `-` to edit Claude CLI options before starting/resuming sessions (#49)
- Full conversation view (experimental) - press `f` to toggle full message view (#50)

### Changed
- Major version bump to indicate project maturity and feature completeness
- Improved type safety and test coverage throughout the codebase (#51)

## [0.3.1] - 2025-07-13

### Fixed
- Preserve terminal scrollback buffer when exiting (#34)
- Windows terminal input compatibility improvements (#33)

### Changed
- Refactored magic numbers to named constants for better code maintainability

## [0.3.0] - 2025-07-11

### Added
- New `--hide` option to hide specific message types (#27)
  - Hide tool use messages with `--hide tool`
  - Hide thinking messages with `--hide thinking`
  - Hide user messages with `--hide user`
  - Hide assistant messages with `--hide assistant`
  - Default behavior (no arguments): `--hide` hides both tool and thinking messages
  - Multiple message types can be hidden: `--hide tool thinking user`
- Improved command-line argument parsing with validation for hide options

## [0.2.0] - 2025-07-07

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