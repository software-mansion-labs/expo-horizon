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

| Input | Description |
| --- | --- |
| `package` | The package to publish: `expo-horizon-core`, `expo-horizon-location`, or `expo-horizon-notifications`. |
| `release-type` | `nightly`, `rc`, or `stable`. |
| `version` | Optional explicit version in `x.y.z` format. Leave empty to infer automatically (see below). |
| `dry-run` | When `true` (default), performs a dry run — no actual publish or git push. Set to `false` for a real release. |

### Version resolution

| Release type | How the version is determined |
| --- | --- |
| `nightly` | Reads the current `latest` tag from npm, increments the minor, and appends a timestamp + commit SHA (e.g. `55.1.0-nightly-20260507-abc1234`). Pass an explicit `version` if `main` has already moved to a new major. |
| `rc` | Inferred from the branch name in `x.y-stable` format (e.g. branch `55.0-stable` → `55.0.0-rc.1`). Subsequent runs increment the counter automatically. |
| `stable` | Inferred from the branch name in `x.y-stable` format. The patch is set to one above the highest patch already on the registry for that `x.y` range. Intended to be run from a dedicated release branch, not `main`. |

### npm dist-tags

| Release type | Tag applied |
| --- | --- |
| `nightly` | `nightly` |
| `rc` | `next` |
| `stable` | `latest` (when the version is newer than the current `latest`) |

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
