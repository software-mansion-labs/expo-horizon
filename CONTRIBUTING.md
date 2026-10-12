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

## Stable releases (new coordinated workflow)

Use **Prepare stable release** and **Publish stable release** for future stable releases, including SDK 58. The existing **Publish Package to NPM** workflow remains unchanged for the already prepared 57.0.3 release and for nightly/RC releases. Do not run both publishers for the same release.

### One-time setup

Merge the automation into the default branch so the workflows appear in Actions. Enable **Allow GitHub Actions to create and approve pull requests** in the repository's Actions settings. Bot-created PR checks may require a maintainer to click **Approve workflows to run**. Preparation runs the shared `yarn verify` checks before opening the PR; publication reruns them on the exact source commit. These include package/plugin builds, lint, formatting, package/example type checks, and Jest. The generated PR also matches the Modules CI and Native Compatibility path filters; require those checks before merging.

Publishing uses the existing `NPM_TOKEN` secret. If the packages use npm trusted publishing instead, configure **each package** to trust `release-stable.yml` in this repository. A successful dry run validates packaging and metadata; it cannot prove that npm will authorize a real upload. Keep the release workflows on maintained SDK branches as well as `main`.

### Prepare, review, publish

1. Select the branch containing the intended SDK and run **Prepare stable release**. Choose `patch`, `minor`, or `major`. Leave `dry-run` enabled to preview the version and download the proposed patch; disable it to open a release PR.
2. Review the PR, wait for its checks, perform the applicable native/device verification, and merge it. JavaScript builds and metadata validation do not replace Quest, Android, and iOS testing of an SDK upgrade.
3. Copy the full 40-character SHA of the prepared commit **after merging**. Run **Publish stable release**, select that release branch, enter the SHA, and leave `dry-run` enabled. The source commit must belong to the selected branch.
4. Check the summary and uploaded tarballs. Run the same workflow with the **same SHA** and `dry-run` disabled. All three packages are validated before the first upload, then published core first. The `vX.Y.Z` tag is created only after all three published tarballs are verified.

No version bump happens during publication. The selected SHA fixes the release version and source even if `main` advances between the dry run and real run. Both new workflows share a concurrency group.

### Version rules and manual bumps

The package major tracks the Expo SDK. The workflow reads Expo versions from the example and core, and compares all three packages with the npm registry **within that SDK line**, independently of the global `latest` tag.

| Choice  | Example             | Requirement                                                           |
| ------- | ------------------- | --------------------------------------------------------------------- |
| `patch` | `57.0.3` → `57.0.4` | SDK 57 checkout and a complete published SDK 57 baseline              |
| `minor` | `57.0.3` → `57.1.0` | Same SDK; minor resets patch to zero                                  |
| `major` | `57.x.x` → `58.0.0` | SDK 58 upgrade already completed; no stable SDK 58 release exists yet |

If one or all package manifests or Android version fields already contain the calculated target, preparation reuses that version and updates the remaining fields. For example, choosing `major` on the SDK 58 upgrade that already says `58.0.0` keeps `58.0.0`; it does not produce `59.0.0`. Other fields must equal the latest complete published baseline (the previous SDK baseline for a first major release). Conflicting, stale, prerelease, or unexpected versions stop preparation before files are written. Selecting `patch` when somebody manually chose the next minor also stops with an explanation.

Preparation updates the three manifests, location/notification Android `version` and `versionName`, changelogs, and compatibility tables. It updates the internal core peer range when the SDK changes. Core's unrelated Android `versionName` stays unchanged; podspecs already read their package manifests. Existing release notes are preserved, and rerunning preparation before publication does not duplicate them. For an SDK upgrade, the location/notification READMEs must already specify the actual upstream versions for the new SDK; automation cannot establish compatibility or perform the SDK upgrade itself.

### Failures and retries

npm cannot publish three packages atomically. If an upload or the final tag push fails, rerun **Publish stable release** with the **original SHA**. It skips an existing version only when the rebuilt tarball has identical integrity; tarballs include the source SHA. Changed source or build output fails safely. Use the uploaded original artifacts to investigate a mismatch rather than increasing the version to hide an incomplete release. Preparation blocks the next bump while the latest release in that SDK line is only partially published.

A maintenance release for an older SDK uses an `sdk-57`-style npm tag when `latest` already points to a newer SDK, preserving the newer default. A conflicting Git release tag, unavailable registry, stale native versions, missing release notes, or incomplete package contents stops the workflow.

Run the automation's isolated regression tests locally with:

```bash
node --test scripts/__tests__/release.test.mjs
```

## Legacy package-by-package publishing

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

You can sync the packages from the upstream Expo repository in two ways:

- Using GitHub Actions (recommended)
- Using a local script (for manual sync and conflict resolution)

### Using GitHub Actions

To sync using GitHub Actions, run the workflow manually from the GitHub Actions page. After the workflow completes, check out the created branch, open a pull request (PR), and merge it into the main branch if everything looks good.

### Manual Sync with Conflict Resolution

When the automated sync encounters conflicts, you can use the local sync script to resolve them manually:

```bash
# Run the local sync script
./scripts/sync-upstream-local.sh

# If conflicts occur, you'll be guided through the resolution process:
# 1. Edit conflicted files to resolve conflicts
# 2. Add resolved files: git add <file>
# 3. Complete the merge: git commit
# 4. Push and create PR: git push -u origin <branch-name>
```

The script will:

- Create a new branch for the sync
- Attempt to merge upstream changes
- If conflicts occur, leave you on the branch to resolve them manually
- If no conflicts, provide instructions for creating a PR

**Requirements:**

- `git-filter-repo`: Install with `pip install git-filter-repo`
- `gh` CLI tool: For creating PRs automatically

### Merging Sync Pull Requests

To maintain a clean and consistent commit history with the upstream repository, consider using either `merge` or `rebase` when integrating changes. When syncing with upstream, use `merge` to preserve the original commit structure, or use `rebase` if you prefer a linear history. Be sure to review and resolve any conflicts carefully before finalizing the merge or rebase.
