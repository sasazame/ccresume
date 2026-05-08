# Release Process

This document outlines the standard release process for publishing updates to npm.

## Branch Strategy

This project follows a develop/master branch strategy:
- `develop`: Main development branch where features are integrated
- `master`: Production branch for releases

## Publishing Model

This project publishes to npm via GitHub Actions using npm trusted publishing (OIDC).

Why this is the current preferred model:
- No long-lived npm automation token is required
- npm provenance is generated automatically for public packages
- Publishing is tied to a recorded GitHub release workflow run

The publish workflow lives at `.github/workflows/publish.yml` and runs when a GitHub Release is published.

## One-time Setup

Before the first release with this workflow, ensure the following is configured:

1. On npmjs.com, open the package settings for `@sasazame/ccresume`
2. Add a Trusted Publisher for GitHub Actions
3. Configure it with:
   - Organization or user: `sasazame`
   - Repository: `ccresume`
   - Workflow filename: `publish.yml`
4. After trusted publishing is verified, enable:
   - `Require two-factor authentication and disallow tokens`

## Prerequisites

Before starting the release process, ensure you have:
- git push access to the repository
- GitHub CLI installed and authenticated (`gh auth login`)
- mise installed and the toolchain set up (`mise install`)

You do not need `npm login` for normal releases once trusted publishing is configured.

## Release Steps

### 1. Create Release PR

Create a pull request from `develop` to `master`:

```bash
git checkout develop
git pull origin develop

gh pr create --base master --head develop --title "Release vX.X.X" --body "Release description"
```

### 2. Pre-release Checks

Run all quality checks before creating a release:

```bash
mise run ci
mise run ci:matrix
mise exec -- npm pack --dry-run
```

### 3. Merge Release PR

After PR approval and CI checks pass, merge the PR to `master`.

### 4. Update Version on `master`

After merging, switch to `master` and update the version:

```bash
git checkout master
git pull origin master

# Update CHANGELOG.md if needed (add release date)
# Then commit any changes

# For bug fixes (1.0.0 -> 1.0.1)
mise exec -- npm version patch -m "Release v%s"

# For new features (1.0.0 -> 1.1.0)
mise exec -- npm version minor -m "Release v%s"

# For breaking changes (1.0.0 -> 2.0.0)
mise exec -- npm version major -m "Release v%s"
```

### 5. Push Version Commit and Tag

Push the version commit and tag to the remote repository:

```bash
git push origin master --follow-tags
```

### 6. Create GitHub Release

Create a GitHub release using the CHANGELOG content:

```bash
VERSION=$(mise exec -- node -p "require('./package.json').version")
NOTES=$(awk "/^## \[$VERSION\]/{flag=1;next}/^## \[/{flag=0}flag" CHANGELOG.md)

gh release create "v$VERSION" --notes "$NOTES"
```

Publishing to npm is triggered by this GitHub Release event.

### 7. Verify Publish Workflow

Confirm the `Publish` workflow succeeds and that the package appears on npm with the expected version.

Recommended checks:
- GitHub Actions `Publish` workflow completed successfully
- npm package version is visible on npmjs.com
- provenance information is attached on npmjs.com

### 8. Merge Back to Develop

Create a PR to merge `master` back to `develop` to keep branches in sync:

```bash
gh pr create --base develop --head master --title "chore: merge back vX.X.X release changes" --body "Merge back release changes"
```

## Version Guidelines

Follow [Semantic Versioning](https://semver.org/):

- **PATCH** (x.x.1): Bug fixes, documentation updates
- **MINOR** (x.1.x): New features, backwards compatible changes
- **MAJOR** (1.x.x): Breaking changes, major rewrites

## Changelog

Update the `CHANGELOG.md` file following the [Keep a Changelog](https://keepachangelog.com/) format:
- Update during development in the `develop` branch under `[Unreleased]`
- Move changes to a versioned section when creating the release

## Notes

- The package is scoped and public, so `publishConfig.access=public` is set in `package.json`
- The publish workflow validates that the GitHub release tag matches the `package.json` version
- The publish workflow runs its own install, checks, build, and `npm pack --dry-run` before calling `npm publish`

## Troubleshooting

### Publish workflow fails before publish
- Check that the release tag matches `package.json` version
- Check that npm trusted publisher is configured for `publish.yml`
- Confirm the workflow is running on a GitHub-hosted runner

### npm publish authentication fails
- Verify trusted publishing is configured on npm for this repository and workflow
- If you recently changed the workflow filename, update the npm Trusted Publisher configuration

### Package is not public on npm
- Ensure `publishConfig.access` remains set to `public`

### Version conflicts
- Always pull latest changes before releasing: `git pull origin master`
- Resolve any conflicts before proceeding with release
