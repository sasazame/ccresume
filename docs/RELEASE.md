# Release Process

This document outlines the standard release process for publishing updates to npm.

## Branch Strategy

This project follows a develop/master branch strategy:
- `develop`: Main development branch where features are integrated
- `master`: Production branch for releases

## Prerequisites

Before starting the release process, ensure you have:
- npm authentication configured (`npm login`)
- git push access to the repository
- GitHub CLI installed and authenticated (`gh auth login`)

## Release Steps

### 1. Create Release PR

Create a pull request from `develop` to `master`:

```bash
# Ensure develop is up to date
git checkout develop
git pull origin develop

# Create PR
gh pr create --base master --head develop --title "Release vX.X.X" --body "Release description"
```

### 2. Pre-release Checks

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

### 3. Merge Release PR

After PR approval and CI checks pass, merge the PR to master.

### 4. Update Version

After merging, switch to master and update the version:

```bash
# Switch to master and pull latest
git checkout master
git pull origin master

# Update CHANGELOG.md if needed (add release date)
# Then commit any changes

# For bug fixes (1.0.0 → 1.0.1)
npm version patch -m "Release v%s"

# For new features (1.0.0 → 1.1.0)
npm version minor -m "Release v%s"

# For breaking changes (1.0.0 → 2.0.0)
npm version major -m "Release v%s"
```

### 5. Push Changes

Push the version commit and tag to the remote repository:

```bash
git push origin master --follow-tags
```

### 6. Publish to npm

Publish the package to npm registry:

```bash
npm publish
```

### 7. Create GitHub Release

Create a GitHub release with release notes:

```bash
# Automatically generate release notes from commits
gh release create v$(node -p "require('./package.json').version") --generate-notes

# Or with custom notes
gh release create v$(node -p "require('./package.json').version") --notes "Release notes here"
```

### 8. Merge Back to Develop

Create a PR to merge master back to develop to keep branches in sync:

```bash
gh pr create --base develop --head master --title "chore: merge back vX.X.X release changes" --body "Merge back release changes"
```

## Version Guidelines

Follow [Semantic Versioning](https://semver.org/):

- **PATCH** (x.x.1): Bug fixes, documentation updates
- **MINOR** (x.1.x): New features, backwards compatible changes
- **MAJOR** (1.x.x): Breaking changes, major rewrites

## Changelog

Update the CHANGELOG.md file following the [Keep a Changelog](https://keepachangelog.com/) format:
- Update during development in the `develop` branch under `[Unreleased]`
- Move changes to a versioned section when creating the release

## Quick Release Script

For the develop/master workflow, the release process requires manual PR creation and merging. 
The automated steps after PR merge can be scripted:

```bash
#!/bin/bash
# release-after-merge.sh

# Exit on error
set -e

# This script should be run after merging develop to master

echo "Switching to master..."
git checkout master
git pull origin master

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

echo "Creating merge-back PR..."
gh pr create --base develop --head master --title "chore: merge back v$(node -p "require('./package.json').version") release changes" --body "Merge back release changes"

echo "Release complete!"
```

Usage: `./release-after-merge.sh patch|minor|major`

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