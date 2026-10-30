---
name: bump-expo-sdk
description: Migrate expo-horizon-location and expo-horizon-notifications to a target Expo SDK branch using a local expo/expo checkout, preserving Android mobile/Quest flavors and exact iOS parity. Use when bumping, upgrading, or syncing this repository to a new Expo SDK.
disable-model-invocation: true
---

# Bump Expo SDK

Migrate the Horizon forks to a target `expo/expo` branch. Upstream is authoritative for iOS and standard Android; Quest behavior remains an explicit product decision.

See [Upstream upgrades](../../../UPSTREAM_SYNC.md) for the supported preparation and validation workflow.

## Required inputs

Read [AGENTS.md](../../../AGENTS.md) and [Changelog ownership](../../../CONTRIBUTING.md#changelog-ownership). Reuse the following inputs from the user’s request or established session context; ask only for a missing or ambiguous value:

1. The exact upstream ref, such as `sdk-57`. If omitted, ask the user; never default to `main` or infer it.
2. The path to the user's local `expo/expo` repository. Check recorded workspace context before asking.

Resolve and report the target versions:

```bash
.cursor/skills/bump-expo-sdk/scripts/resolve-sdk-versions.sh <expo-repo> <resolved-target-sha>
```

Use versions from the exact target, not arbitrary latest npm versions. The manual preparation command below fetches and pins the selected remote ref; use its printed full SHA for version resolution, application, subsequent comparisons, and the temporary worktree. With `--offline`, the selected ref must already exist locally.

The version resolver needs Node.js on `PATH`. If upstream removes or reorganizes a package expected by that helper, inspect package metadata and migration notes at the pinned SHA directly. Record the missing package and required tooling migration; do not substitute versions from another ref or treat successful sync preparation as a completed upgrade.

## Safety

- Use a clean, isolated Horizon worktree when the current checkout has unrelated changes. Preserve the user’s checkout and report which source commit is being upgraded.
- Do not switch or modify the user's `expo/expo` checkout. Create a temporary detached worktree at the requested ref and remove it after validation:

```bash
git -C <expo-repo> worktree add --detach <temporary-directory> <resolved-commit-sha>
```

- Reuse the authorized branch or use the branch name requested by the user; otherwise use the coding agent’s normal branch convention.
- Follow the user’s existing authorization for commits and PR work. An SDK upgrade alone does not authorize publication.
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

Reuse decisions already made by the user or explicitly documented in the repository. Ask the user to choose only when the product behavior remains unresolved; do not silently change an established decision. Implement the confirmed choice:

- **Implement:** provide equivalent Quest behavior and tests.
- **No-op:** return a documented, type-correct result with no side effect.
- **Reject:** throw a specific, actionable unavailable-feature error; do not crash or hang.

Also ask when a previously classified Quest API changes semantics upstream. Keep Android API registration and TypeScript surface aligned across flavors even when behavior differs.

### 6. Update versions and documentation

Follow the repository convention unless the user requests another release version:

- For the first release of a new SDK line, keep or set all three Horizon package versions to `<sdk-major>.0.0`. Check npm first: never reset an already released SDK line to `.0.0` or blindly increment a manually prepared version. Use the release skill for an existing SDK line or an explicit release request.
- Update `expo-horizon-core` peer ranges in location and notifications.
- Copy target-compatible dependency ranges from upstream package metadata, especially `expo-application` and `expo-constants`.
- Update `expo-module-scripts`, Expo, React Native, example-app dependencies, and lockfile based on the target SDK's own metadata and install tooling.
- Keep location/notification Android `version` and `versionName` aligned with their package versions. Core’s Android `versionName` is unrelated to npm releases. Review `versionCode` rather than changing it blindly.
- Update all three README prerequisites and compatibility tables with exact upstream package versions.

Apply [Changelog ownership](../../../CONTRIBUTING.md#changelog-ownership) while implementing the upgrade. Inspect every Horizon behavior change, including Quest implement/no-op/reject decisions, and write the corresponding genuine note under `Unpublished` in the same change. Preserve upstream wording and historical entries. Explain in the PR when only mechanical synchronization occurred; do not manufacture release notes from a version bump. Use the release skill when preparation of a dated release is explicitly requested.

Do not edit podspec versions when they read from `package.json`.

### 7. Validate parity

Read the parity skill and run its read-only helper against the resolved upstream commit:

```bash
.cursor/skills/validate-upstream-parity/scripts/validate-parity.sh <expo-repo> <resolved-commit>
```

The helper leaves both checkouts untouched, reports additions and deletions, and fails on native differences. TypeScript differences are printed for review. Separately inspect plugins, metadata, and native build configuration outside the compared source trees.

Acceptance gates:

- iOS diff is empty for both packages.
- Flattened Android mobile diff is empty except documented, unavoidable fork differences. Prefer moving such differences into Quest/flavor configuration until it is empty.
- Every TypeScript difference is understood and intentional.
- Quest exposes the expected API surface and matches every recorded implement/no-op/reject decision.
- Any temporary upstream worktree created for migration is removed. The parity helper itself leaves both checkouts untouched.
- The proposed `upstream-sync.json` target matches the validated Expo SHA. Commit it with the upgrade only after validation; do not treat staged metadata as evidence that the upgrade is complete.

### 8. Verify

Use the Node version in `.nvmrc` and run the branch's shared verification entry point:

```bash
yarn install --frozen-lockfile
yarn verify
```

When changing dependencies for the upgrade, deliberately regenerate and review the lockfile first, then check that the frozen install works. Use [docs/verification.md](../../../docs/verification.md) for focused reruns; do not substitute the older per-package test commands for the root Jest configuration.

Also build or run both Android variants (`mobileDebug`, `questDebug`) and iOS when the environment supports them. Clearly report any native validation not run.

## Handoff

Summarize:

- Upstream ref, commit, and exact package versions.
- Files/features migrated and intentional upstream differences.
- Quest decisions and their tests.
- Parity result for iOS, Android mobile, TypeScript, and Quest.
- Commands run, failures, and validation that remains.

Do not call the bump complete while a Quest decision or parity difference is unexplained.
