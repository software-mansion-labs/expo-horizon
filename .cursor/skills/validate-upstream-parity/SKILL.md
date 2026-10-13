---
name: validate-upstream-parity
description: Validate that the Horizon fork's native code (iOS + Android mobile flavor) is identical to upstream expo, and manually review TypeScript src/ for unexpected drift. Use when checking parity with upstream expo, validating an upstream sync, or before publishing expo-horizon-location / expo-horizon-notifications.
disable-model-invocation: true
---

# Validate Upstream Parity

Verify this repo's fork of `expo-location` and `expo-notifications` still matches upstream [`expo/expo`](https://github.com/expo/expo) after the Android `quest`/`mobile` flavor split.

| Local                        | Upstream                      |
| ---------------------------- | ----------------------------- |
| `expo-horizon-location`      | `packages/expo-location`      |
| `expo-horizon-notifications` | `packages/expo-notifications` |

## What to compare

- **Native (must be identical):** local `ios/` vs upstream `ios/`, and local `src/main` + `src/mobile` (flattened) vs upstream `android/src/main`. Android `src/quest` (package `expo.modules`) is Horizon-only and excluded.
- **TypeScript `src/` (manual review):** allowed to differ; just flag anything unexpected.
- **Ignored:** `build/`, `package.json`, `README`, `CHANGELOG`, `plugin/`.

Upstream keeps all Android source in `src/main`; the fork splits it into `main` (shared) + `mobile` (upstream's main, e.g. `LocationModule.kt`) + `quest` (Horizon-only). So the upstream-equivalent tree is `main ∪ mobile`. The script rebuilds that for you.

## Steps

1. Get the path to the user's local `expo/expo` repository (ask if unknown), resolve the matching SDK ref to a full commit SHA, and create a disposable detached worktree at that SHA. Use that temporary worktree as `<upstream-path>` below; never run the helper on the user's normal Expo checkout. This repo's branch: `git branch --show-current`.

2. Run the helper. It copies local files into the upstream working copy and prints the diff:

```bash
.cursor/skills/validate-upstream-parity/scripts/validate-parity.sh <upstream-path>
```

3. Read the output:
   - **Native section:** review every difference. iOS must match exactly; flattened Android differences must be understood and documented, or moved into Quest/flavor configuration.
   - **TypeScript section:** flag only unexpected differences; expected Horizon changes are fine.

   The helper prints tracked-file diffs and exits successfully even when differences exist. Its diff omits untracked additions. Inspect those files too:

   ```bash
   git -C <upstream-path> status --short --untracked-files=all -- packages/expo-location packages/expo-notifications
   ```

   An empty printed diff alone is not a parity pass. Plugins, package metadata, and native build configuration outside the compared trees require separate review during an upgrade.

4. After review, restore the disposable upstream worktree and remove it with `git worktree remove` from the source Expo repository:

```bash
.cursor/skills/validate-upstream-parity/scripts/validate-parity.sh <upstream-path> --restore
```

The helper never modifies this repo. It overwrites files in the supplied upstream worktree, and `--restore` checks out tracked files and deletes untracked package files. This is why the supplied worktree must be disposable.
