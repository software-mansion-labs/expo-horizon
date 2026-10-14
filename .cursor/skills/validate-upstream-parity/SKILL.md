---
name: validate-upstream-parity
description: Compare Expo Horizon iOS and flattened Android mobile sources with a pinned Expo commit, and review TypeScript drift without modifying either checkout. Use for upstream parity, SDK sync validation, or pre-release native verification.
disable-model-invocation: true
---

# Validate Upstream Parity

Read [AGENTS.md](../../../AGENTS.md). Compare the Horizon location/notification forks with the exact upstream ref used for the SDK migration. Reuse the upstream path/ref from the current task; ask only if they cannot be established. Do not silently use upstream `main` or its current checkout branch.

| Local package                | Upstream package              |
| ---------------------------- | ----------------------------- |
| `expo-horizon-location`      | `packages/expo-location`      |
| `expo-horizon-notifications` | `packages/expo-notifications` |

## Run a read-only comparison

```bash
.cursor/skills/validate-upstream-parity/scripts/validate-parity.sh <expo-repo> <resolved-commit>
```

The helper archives tracked upstream files at that commit into a temporary directory and assembles a separate local comparison tree. It never replaces, checks out, or cleans files in either repository. Local source edits are included in the comparison; upstream working-tree edits are not used as the baseline. No `--restore` step is needed. It reports added and removed files as well as modifications.

## Interpret the results

- **iOS:** should be byte-for-byte equivalent to the selected upstream source. Investigate every difference.
- **Android mobile:** compare upstream `android/src/main` with local `src/main` plus `src/mobile`, where mobile wins on an overlapping relative path. Quest is excluded. Investigate native differences; do not label one intentional just because it existed before. Record any justified fork exception and its evidence rather than silently weakening the check.
- **TypeScript `src/`:** review each difference. Known Horizon exports and push-token extensions can be intentional. A clean native result does not approve arbitrary JS drift.
- **Outside this comparison:** core, plugins, metadata, docs/changelogs, dependencies, and generated build output. Review these separately during an upgrade or release; a parity pass does not verify them.

The helper returns 0 when native trees match, 1 for native differences, and 2 for invalid input or a comparison error. TypeScript differences are printed for review but do not change the native result. Review diff output even on exit 0. Follow the contributor changelog policy for any user-facing Horizon changes needed to resolve a difference.

Run the shared workspace verification and applicable native/device checks described in [docs/verification.md](../../../docs/verification.md). Report the exact upstream commit, native result, reviewed exceptions, TypeScript findings, and validation limitations. Do not claim overall parity until every difference is accounted for.
