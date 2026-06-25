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

1. Get the path to the user's local `expo/expo` checkout (ask if unknown) and confirm it's on the matching SDK ref (`git -C <upstream> log -1 --oneline`). This repo's branch: `git branch --show-current`.

2. Run the helper. It copies local files into the upstream working copy and prints the diff:

```bash
.cursor/skills/validate-upstream-parity/scripts/validate-parity.sh <upstream-path>
```

3. Read the output:
   - **Native section:** empty = PASS. Any hunk means an intentional Horizon change leaked into shared `main`/`mobile`/`ios` (move it to `quest` or guard it), or it's accidental drift to fix.
   - **TypeScript section:** flag only unexpected differences; expected Horizon changes are fine.

4. Restore the upstream checkout when done:

```bash
.cursor/skills/validate-upstream-parity/scripts/validate-parity.sh <upstream-path> --restore
```

This skill never modifies this repo — only the upstream checkout, which `--restore` reverts.
