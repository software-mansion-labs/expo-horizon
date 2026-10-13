---
name: bump-expo-sdk
description: Migrate expo-horizon-location and expo-horizon-notifications to a target Expo SDK branch using a local expo/expo checkout, preserving Android mobile/Quest flavors and exact iOS parity. Use when bumping, upgrading, or syncing this repository to a new Expo SDK.
disable-model-invocation: true
---

# Bump Expo SDK

Migrate the Horizon forks to a target `expo/expo` branch. Upstream is authoritative for iOS and standard Android; Quest behavior remains an explicit product decision.

See [Upstream upgrades](../../../UPSTREAM_SYNC.md) for the supported workflow and current parity-helper limitations.

## Required inputs

Before changing files, obtain both:

1. The exact upstream ref, such as `sdk-57`. If omitted, ask the user; never default to `main` or infer it.
2. The path to the user's local `expo/expo` repository. If omitted, ask.

Resolve and report the target versions:

```bash
.cursor/skills/bump-expo-sdk/scripts/resolve-sdk-versions.sh <expo-repo> <resolved-target-sha>
```

Use versions from the exact target, not arbitrary latest npm versions. The manual preparation command below fetches and pins the selected remote ref; use its printed full SHA for version resolution, application, subsequent comparisons, and the temporary worktree. With `--offline`, the selected ref must already exist locally.

The version resolver needs Node.js on `PATH`. If upstream removes or reorganizes a package expected by that helper, inspect package metadata and migration notes at the pinned SHA directly. Record the missing package and required tooling migration; do not substitute versions from another ref or treat successful sync preparation as a completed upgrade.

## Safety

- Require a clean Horizon worktree before starting. Do not discard unrelated changes.
- Do not switch or modify the user's `expo/expo` checkout. Create a temporary detached worktree at the requested ref and remove it after validation:

```bash
git -C <expo-repo> worktree add --detach <temporary-directory> <resolved-commit-sha>
```

- If creating a branch, use `kosmydel/expo-sdk-<sdk-major>`.
- Do not commit, push, or publish unless explicitly requested.
- Track the migration as a checklist. Stop at unresolved merge conflicts or product decisions.

## Package mapping

| Horizon package              | Upstream package              |
| ---------------------------- | ----------------------------- |
| `expo-horizon-location`      | `packages/expo-location`      |
| `expo-horizon-notifications` | `packages/expo-notifications` |

`expo-horizon-core` is Horizon-only. Update its SDK-facing dependencies and version, but do not replace it from upstream.

## Migration workflow

### 1. Inventory the upstream delta

Use the manual sync helper to preview the latest commit on the requested SDK branch:

```bash
./scripts/sync-upstream-local.sh <expo-repo> --ref <target-ref> --dry-run
```

On the first run, also pass `--from <previous-full-expo-sha>` from established upgrade evidence. Later runs use the committed `upstream-sync.json`. If the previous SHA is unknown, establish a baseline by full source comparison; do not guess. A preview exit code of 1 means conflicts were found, not that preparation failed.

The target must descend from the previous Expo commit. An SDK branch can contain older package code than a snapshot from `main`; if the helper rejects an older/divergent target, review the chosen ref and versions instead of changing the baseline to bypass the check.

Apply the previewed SHA by rerunning with `--ref <printed-target-sha>` and without `--dry-run`. This stages the upstream delta and leaves conflicts for resolution. Follow the remaining steps to resolve them and adapt Horizon behavior. After staging resolutions, run `git cherry-pick --quit` (not `--continue`) to leave the changes staged without committing. Use `git cherry-pick --abort` to undo a conflicted preparation. See [Upstream sync](../../../UPSTREAM_SYNC.md) for clean-result recovery and helper limits.

Compare the target packages with the currently documented upstream versions and inspect all added, modified, renamed, and deleted files. Review native, TypeScript, config plugin, tests, package metadata, and build configuration. Do not copy only obvious implementation files.

Record:

- Target Expo, location, notifications, application, constants, and module-scripts versions.
- New or removed public APIs.
- Android APIs or dependencies that may not exist on Quest.
- Upstream build, manifest, permission, ProGuard, podspec, and deployment-target changes.

### 2. Synchronize iOS exactly

Replace each local `ios/` tree with the matching upstream `ios/` tree, including additions and deletions. There are no Horizon-specific iOS changes: local iOS must be byte-for-byte equivalent to the target upstream package.

### 3. Synchronize TypeScript and config plugins

Apply the complete upstream delta, then preserve only intentional Horizon extensions:

- Location exports Horizon detection (`isHorizon`).
- Notifications can return the Horizon push-token type.
- Horizon-specific plugin configuration remains where required.

Manually review every remaining TypeScript/plugin difference. Do not treat an old fork difference as intentional without understanding it.

### 4. Route Android changes by source set

Upstream `android/src/main` maps to the flattened local `android/src/main + android/src/mobile` tree:

- Put code shared by mobile and Quest in `src/main`.
- Put Google Play Services, Firebase-specific, or mobile implementation code in `src/mobile`.
- Keep Meta Horizon implementations in `src/quest`.
- When `main` and `mobile` contain the same relative path, `mobile` is the upstream-equivalent implementation.

Important package-specific routing:

- Location: upstream `LocationModule.kt`, `LocationHelpers.kt`, and mobile task consumers normally belong in `src/mobile`; adapt corresponding Quest implementations separately.
- Notifications: upstream FCM `tokens/PushTokenModule.kt` and `FirebaseTokenListener.kt` belong in `src/mobile`; preserve the Meta push implementation in `src/quest`.
- Merge upstream Gradle, manifest, ProGuard, and dependency changes without removing the `device` flavor dimension, `mobile`/`quest` flavors, `mobileApi` dependencies, Meta SDK dependencies, or Horizon app-id configuration.

Honor upstream deletions in shared/mobile trees. Never copy upstream `android/src/main` wholesale over local `src/main`, because that bypasses flavor routing.

### 5. Get Quest decisions from the user

For every new Android API and every upstream behavior change that lacks a clear Quest equivalent, inspect its dependencies and present a batched decision list:

| API/change | Upstream Android behavior | Quest capability/constraint | Proposed choice            |
| ---------- | ------------------------- | --------------------------- | -------------------------- |
| ...        | ...                       | ...                         | implement / no-op / reject |

Ask the user to choose. Do not silently decide. Implement the confirmed choice:

- **Implement:** provide equivalent Quest behavior and tests.
- **No-op:** return a documented, type-correct result with no side effect.
- **Reject:** throw a specific, actionable unavailable-feature error; do not crash or hang.

Also ask when a previously classified Quest API changes semantics upstream. Keep Android API registration and TypeScript surface aligned across flavors even when behavior differs.

### 6. Update versions and documentation

Follow the repository convention unless the user requests another release version:

- Set all three Horizon package versions to `<sdk-major>.0.0`; confirm if that version already exists or release policy is ambiguous.
- Update `expo-horizon-core` peer ranges in location and notifications.
- Copy target-compatible dependency ranges from upstream package metadata, especially `expo-application` and `expo-constants`.
- Update `expo-module-scripts`, Expo, React Native, example-app dependencies, and lockfile based on the target SDK's own metadata and install tooling.
- Update Android `version`/`versionName`; review `versionCode` rather than changing it blindly.
- Update all three README prerequisites and compatibility tables with exact upstream package versions.

Treat changelogs as release history, not a migration report:

- Preserve upstream changelog content verbatim when syncing it. Do not summarize, rewrite, reclassify, or duplicate upstream entries.
- Do not add entries for mechanical SDK synchronization, dependency/version bumps, parity results, files changed, or claims such as “no native or TypeScript changes.” Those belong in the handoff or PR description.
- Add a Horizon changelog item only for an actual user-facing Horizon behavior or API change, and state only that change in the existing terse style.
- Do not invent a release heading or date. Ask the user before cutting a release entry. Until then, put genuine user-facing changes under `Unpublished`.
- If the user requests a release entry with no user-facing changes, use the repository's existing sentence: `_This version does not introduce any user-facing changes._`

Do not edit podspec versions when they read from `package.json`.

### 7. Validate parity

Run the existing parity helper against the temporary target-ref worktree:

```bash
.cursor/skills/validate-upstream-parity/scripts/validate-parity.sh <temporary-expo-worktree>
git -C <temporary-expo-worktree> status --short --untracked-files=all -- packages/expo-location packages/expo-notifications
```

The helper prints tracked-file diffs but does not fail on differences or include untracked additions in its diff. Review added files and separately inspect plugins, metadata, and native build configuration. After review, run the helper with `--restore` and remove the disposable worktree.

Acceptance gates:

- iOS diff is empty for both packages.
- Flattened Android mobile diff is empty except documented, unavoidable fork differences. Prefer moving such differences into Quest/flavor configuration until it is empty.
- Every TypeScript difference is understood and intentional.
- Quest exposes the expected API surface and matches every recorded implement/no-op/reject decision.
- The temporary upstream worktree is restored and removed.
- The proposed `upstream-sync.json` target matches the validated Expo SHA. Commit it with the upgrade only after validation; do not treat staged metadata as evidence that the upgrade is complete.

### 8. Verify

Run, fixing failures before handoff:

```bash
yarn install
yarn verify
```

Also build or run both Android variants (`mobileDebug`, `questDebug`) and iOS when the environment supports them. Clearly report any native validation not run.

## Handoff

Summarize:

- Upstream ref, commit, and exact package versions.
- Files/features migrated and intentional upstream differences.
- Quest decisions and their tests.
- Parity result for iOS, Android mobile, TypeScript, and Quest.
- Commands run, failures, and validation that remains.

Do not call the bump complete while a Quest decision or parity difference is unexplained.
