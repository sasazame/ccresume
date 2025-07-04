# Release Process

This document outlines the standard release process for publishing updates to npm.

## Prerequisites

Before starting the release process, ensure you have:
- npm authentication configured (`npm login`)
- git push access to the repository
- GitHub CLI installed and authenticated (`gh auth login`)

## Release Steps

### 1. Pre-release Checks

Run all quality checks before creating a release:

```bash
# Run linting
npm run lint

# Run type checking (if applicable)
npm run typecheck

# Run tests
npm test

# Verify package contents
npm pack --dry-run
```

### 2. Update Version

Use npm version command to automatically update package.json, package-lock.json, and create a git tag:

```bash
# For bug fixes (1.0.0 → 1.0.1)
npm version patch -m "Release v%s"

# For new features (1.0.0 → 1.1.0)
npm version minor -m "Release v%s"

# For breaking changes (1.0.0 → 2.0.0)
npm version major -m "Release v%s"
```

### 3. Push Changes

Push the version commit and tag to the remote repository:

```bash
git push origin master --follow-tags
```

### 4. Publish to npm

Publish the package to npm registry:

```bash
npm publish
```

### 5. Create GitHub Release

Create a GitHub release with release notes:

```bash
# Automatically generate release notes from commits
gh release create v$(node -p "require('./package.json').version") --generate-notes

# Or with custom notes
gh release create v$(node -p "require('./package.json').version") --notes "Release notes here"
```

## Version Guidelines

Follow [Semantic Versioning](https://semver.org/):

- **PATCH** (x.x.1): Bug fixes, documentation updates
- **MINOR** (x.1.x): New features, backwards compatible changes
- **MAJOR** (1.x.x): Breaking changes, major rewrites

## Changelog

Consider maintaining a CHANGELOG.md file following the [Keep a Changelog](https://keepachangelog.com/) format.

## Quick Release Script

For convenience, you can create a release script:

```bash
#!/bin/bash
# release.sh

# Exit on error
set -e

echo "Running pre-release checks..."
npm run lint
npm run typecheck
npm test

echo "Creating release..."
npm version "$1" -m "Release v%s"

echo "Pushing to repository..."
git push origin master --follow-tags

echo "Publishing to npm..."
npm publish

echo "Creating GitHub release..."
gh release create "v$(node -p "require('./package.json').version")" --generate-notes

echo "Release complete!"
```

Usage: `./release.sh patch|minor|major`

## Troubleshooting

### npm publish fails
- Ensure you're logged in: `npm whoami`
- Check registry: `npm config get registry`
- Verify package name availability: `npm info <package-name>`

### Git push fails
- Ensure you have push access to the repository
- Check if branch protection rules are blocking the push
- Verify remote URL: `git remote -v`

### Version conflicts
- Always pull latest changes before releasing: `git pull origin master`
- Resolve any conflicts before proceeding with release