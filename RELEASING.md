# Releasing

Two things are released separately: the **registry** (components, served from
GitHub Pages) and the **CLI** (`bootcn` on npm). A component change does not
need a CLI release, and the other way round.

## Registry

1. Bump `version` in `packages/registry/registry.json` (and the `version` of
   each changed item's `manifest.json`).
2. Merge to `main`. [`deploy-registry.yml`](.github/workflows/deploy-registry.yml)
   publishes it as the latest registry.
3. Freeze the version so projects can pin it:

   ```bash
   git tag registry-v0.3.0
   git push origin registry-v0.3.0
   ```

   The tag starts a deploy of `main`, which rebuilds every tagged version under
   `/v/<version>/`. Never move or delete a published `registry-v*` tag.

## CLI (npm)

Releases are published by [`release-cli.yml`](.github/workflows/release-cli.yml)
with npm trusted publishing: GitHub proves to npm which workflow is publishing,
so no npm token is stored in the repository, and npm attaches provenance.

### One-time setup (package owner)

npm configures a trusted publisher on an existing package, so the first
version is published by hand:

1. Build and publish `0.1.0` from your machine (needs your npm login and 2FA):

   ```bash
   pnpm install && pnpm build && pnpm test
   ```

   ```bash
   cd packages/cli && npm login && npm publish
   ```

2. On npmjs.com, open the `bootcn` package → **Settings** → **Trusted
   Publisher** → **GitHub Actions**, and enter exactly:
   - Organization or user: `tsirosgeorge`
   - Repository: `bootcn`
   - Workflow filename: `release-cli.yml`
   - Environment: leave empty
   - Allowed actions: tick **npm publish**

   The first publish through the workflow must happen within 2 days of saving
   this, or the configuration expires.

3. Recommended afterwards: **Settings** → **Publishing access** → "Require
   two-factor authentication and disallow tokens".

### Every release

1. Bump `version` in `packages/cli/package.json` and merge to `main` with CI
   green.
2. Tag and push:

   ```bash
   git tag cli-v0.2.0
   git push origin cli-v0.2.0
   ```

The workflow checks that the tag matches `package.json` and that the version is
not on npm yet, runs lint, typecheck, build and all unit tests, publishes, and
creates a GitHub release.

CI packs the CLI exactly as npm would publish it and runs it on Node 20, 22 and
24 on every push (`package` job in [`ci.yml`](.github/workflows/ci.yml)).
