---
name: bump-expo-sdk
description: Migrate expo-horizon-location and expo-horizon-notifications to a target Expo SDK branch using a local expo/expo checkout, preserving Android mobile/Quest flavors and exact iOS parity. Use when bumping, upgrading, or syncing this repository to a new Expo SDK.
disable-model-invocation: true
---

# Bump Expo SDK

Migrate the Horizon forks to a target `expo/expo` branch. Upstream is authoritative for iOS and standard Android; Quest behavior remains an explicit product decision.

## Required inputs

Before changing files, obtain both:

1. The exact upstream ref, such as `sdk-57`. If omitted, ask the user; never default to `main` or infer it.
2. The path to the user's local `expo/expo` repository. If omitted, ask.

Resolve and report the target versions:

```bash
.cursor/skills/bump-expo-sdk/scripts/resolve-sdk-versions.sh <expo-repo> <ref>
```

Use versions from that ref, not arbitrary latest npm versions. Confirm the ref exists locally. If it does not, ask before fetching.

## Safety

- Require a clean Horizon worktree before starting. Do not discard unrelated changes.
- Do not switch or modify the user's `expo/expo` checkout. Create a temporary detached worktree at the requested ref and remove it after validation:

```bash
git -C <expo-repo> worktree add --detach <temporary-directory> <ref>
```

- If creating a branch, use `kosmydel/expo-sdk-<sdk-major>`.
- Do not commit, push, publish, or change the `upstream-filtered` branch unless explicitly requested.
- Track the migration as a checklist. Stop at unresolved merge conflicts or product decisions.

## Package mapping

| Horizon package              | Upstream package              |
| ---------------------------- | ----------------------------- |
| `expo-horizon-location`      | `packages/expo-location`      |
| `expo-horizon-notifications` | `packages/expo-notifications` |

`expo-horizon-core` is Horizon-only. Update its SDK-facing dependencies and version, but do not replace it from upstream.

## Migration workflow

### 1. Inventory the upstream delta

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
.cursor/skills/validate-upstream-parity/scripts/validate-parity.sh <temporary-expo-worktree> --restore
```

Acceptance gates:

- iOS diff is empty for both packages.
- Flattened Android mobile diff is empty except documented, unavoidable fork differences. Prefer moving such differences into Quest/flavor configuration until it is empty.
- Every TypeScript difference is understood and intentional.
- Quest exposes the expected API surface and matches every recorded implement/no-op/reject decision.
- The temporary upstream worktree is restored and removed.

### 8. Verify

Run, fixing failures before handoff:

```bash
yarn install
yarn build
yarn lint
yarn prettier:check
yarn workspace expo-horizon-location test
yarn workspace expo-horizon-notifications test
yarn workspace expo-horizon-core test
yarn workspace app ts:check
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
