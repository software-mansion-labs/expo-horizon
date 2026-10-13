# Contributing

## Development

To develop the packages, you can use the following commands:

```bash
# 1. Install dependencies (from the project root)
yarn install

# 2. Build the packages (run from each package directory as needed)
yarn build          # Builds the package
yarn build plugin   # Builds the config plugin (if applicable)

# 3. Run the example app (from the example directory)
# Clean the environment for a fresh start
rm -rf node_modules android ios

# Install example app dependencies
yarn install

# Build and launch the Expo Horizon app on your device or emulator
yarn quest          # Runs the Meta Horizon version of the app
yarn android        # Runs the Android version of the app
yarn ios            # Runs the iOS version of the app
```

## Publishing

Publishing is handled via the **Publish Package to NPM** GitHub Actions workflow (`.github/workflows/publish.yml`). Do not publish packages manually from the command line.

### How to trigger a release

1. Go to **Actions → Publish Package to NPM** in the GitHub UI.
2. Click **Run workflow** and fill in the inputs:

| Input          | Description                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| `package`      | The package to publish: `expo-horizon-core`, `expo-horizon-location`, or `expo-horizon-notifications`.        |
| `release-type` | `nightly`, `rc`, or `stable`.                                                                                 |
| `version`      | Optional explicit version in `x.y.z` format. Leave empty to infer automatically (see below).                  |
| `dry-run`      | When `true` (default), performs a dry run — no actual publish or git push. Set to `false` for a real release. |

### Version resolution

| Release type | How the version is determined                                                                                                                                                                                        |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nightly`    | Reads the current `latest` tag from npm, increments the minor, and appends a timestamp + commit SHA (e.g. `55.1.0-nightly-20260507-abc1234`). Pass an explicit `version` if `main` has already moved to a new major. |
| `rc`         | Inferred from the branch name in `x.y-stable` format (e.g. branch `55.0-stable` → `55.0.0-rc.1`). Subsequent runs increment the counter automatically.                                                               |
| `stable`     | Inferred from the branch name in `x.y-stable` format. The patch is set to one above the highest patch already on the registry for that `x.y` range. Intended to be run from a dedicated release branch, not `main`.  |

### npm dist-tags

| Release type | Tag applied                                                    |
| ------------ | -------------------------------------------------------------- |
| `nightly`    | `nightly`                                                      |
| `rc`         | `next`                                                         |
| `stable`     | `latest` (when the version is newer than the current `latest`) |

### Git release tags

Only the `expo-horizon-core` job creates and pushes a `vX.Y.Z` git tag for the release. The `expo-horizon-location` and `expo-horizon-notifications` jobs skip git operations (`perform-git-operations: false`) so that publishing all three packages concurrently does not collide on the same tag — all three packages share a release version, and the `npm-package-publish` action does not currently support per-package tag prefixes. Treat the `expo-horizon-core` tag as the canonical marker for a given release across all three packages.

## Naming Conventions

Name your PRs using the format: `[package] type: <description>`

Where `package` is one of: `example`, `expo-horizon-core`, `expo-horizon-location`, or `expo-horizon-notifications`.

Use a brief type (such as `feat`, `fix`, `docs`, `chore`, `style`, `ci`, etc.) and a short, clear description.

Example:
`[expo-horizon-core] Feat: add hand tracking support`

For changes made to the libraries, it's recommended to squash your commits before merging. This helps keep the commit history clean and easier to follow.

## Upstream Sync

Start with the manual helper, using a local Expo checkout and an explicit SDK target:

```bash
./scripts/sync-upstream-local.sh /path/to/expo --ref <sdk-branch> --from <previous-expo-sha> --dry-run
```

Follow [Upstream sync](UPSTREAM_SYNC.md) to apply the previewed commit and resolve
conflicts with the [SDK bump checklist](.cursor/skills/bump-expo-sdk/SKILL.md).
After the first validated sync, the previous SHA is recorded in `upstream-sync.json`.
Verify with `yarn verify`, native builds, and the [device smoke checks](docs/verification.md).

The helper prepares changes without committing and preserves existing Android
mobile routing. It requires no tracking branch or `git-filter-repo`. New APIs and
Quest behavior still need review. The GitHub workflow tests the helper; it no
longer merges upstream or creates PRs. Normal squash merges are supported.
