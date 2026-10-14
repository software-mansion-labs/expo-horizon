---
name: release-expo-horizon
description: Prepare, dry-run, review, or publish an Expo Horizon release and diagnose partial publication. Use for release versions, changelog preparation, npm publishing workflows, or recovery; use bump-expo-sdk for the actual Expo SDK migration.
---

# Release Expo Horizon

Read [AGENTS.md](../../../AGENTS.md), [Changelog ownership](../../../CONTRIBUTING.md#changelog-ownership), and the publishing instructions in `CONTRIBUTING.md`. The scripts/workflows in the selected source commit define the available behavior; do not assume an unmerged workflow is installed on the default branch.

## Establish the source and release state

- Identify the requested source branch/commit, Expo SDK, release type, and bump or explicit version. Reuse established user choices. A dry-run request authorizes a rehearsal, not npm publication or a remote release tag.
- Query the npm registry for all three `expo-horizon-*` packages. Use stable versions within the selected SDK, not just the global `latest` tag or Git tags. Confirm whether all packages have the baseline version; investigate an incomplete release before preparing the next one.
- Compare package manifests, location/notification Android versions, core peer ranges, and README compatibility rows. Keep a matching manual bump; stop on conflicts. Core's Android versionName is not an npm version, and podspecs read their package versions.
- A new SDK major requires the actual SDK upgrade and known upstream compatibility first. Version preparation cannot establish compatibility or perform that upgrade.

## Prepare notes and metadata

Review the actual changes since the published baseline against **Changelog ownership**. The implementing agent owns genuine `Unpublished` notes; during a release, repair omissions based on the code and existing PR evidence. Preserve upstream entries and historical release sections. Include core's user-facing notes in the release handoff because it has no package changelog.

Inspect the generated diff rather than treating a successful command as proof of correct documentation:

- The target version must be consistent; compatibility rows must retain the correct upstream versions.
- Pending notes must appear exactly once under the intended dated release. An existing target heading is preserved by the script; check whether later `Unpublished` notes still need inclusion.
- The empty-section fallback is a claim to verify, not evidence that nothing changed. Do not replace it with invented features or a mechanical SDK-sync report.
- Only the target row is updated automatically. Correct older `unreleased` labels when npm confirms those package versions are published.

For future stable releases, use **Prepare stable release** and **Publish stable release**. Preparation's dry run produces a patch; disabling its dry run opens a version PR but does not publish. Review that PR and its applicable Modules CI, Native Compatibility, and device evidence before merging.

## Local rehearsal

Use a disposable checkout containing the intended source and automation revisions. Leave unrelated working-tree changes untouched and report whether they were included. Use the Node version in `.nvmrc`, frozen dependencies, and the workflow's pinned package tools.

Follow the current workflow steps: run the release regression tests, prepare with the selected `RELEASE_BUMP`, format the generated metadata, run `node scripts/release.mjs check`, and run `yarn verify`. Save the resulting patch and inspect every changed file. Repeat preparation against the same registry baseline to check that it does not double-bump or duplicate notes.

The publishing script requires a clean committed source. A local-only preparation commit in the disposable checkout can supply that SHA for a rehearsal. Run publication only with `RELEASE_DRY_RUN=true`; export tarballs and logs outside the disposable checkout before cleanup. Report separately that a local rehearsal does not exercise GitHub bot PR creation, Actions permissions, real npm authorization, or native/device behavior.

## Publish and recover

Use the coordinated workflow with the exact merged preparation SHA. Run a dry run first, then use the same SHA for an authorized real run. Do not increment versions during publication. A rerun of an existing GitHub job reuses its original inputs; changing dry-run mode requires a new workflow dispatch.

The coordinated publisher validates all packages before uploading, publishes core first, skips existing versions only when integrity matches, preserves a newer SDK's npm `latest`, and tags only after the complete release is verified. npm uploads are not atomic: retry a partial release from the original SHA; investigate changed artifacts instead of bumping the version to hide the failure.

For a release still using the legacy **Publish Package to NPM** workflow, pass the explicit stable version and run each package separately, core first. Check the actual `dry-run` input in the logs. A green job or `+ package@version` message alone does not prove publication. Do not mix the legacy and coordinated publisher for the same release: their artifacts and retry behavior differ.

After real publication, read npm's exact version records for all three packages and verify the Git tag. Report partial success honestly. Do not rerun successful immutable uploads or delete/recreate published versions or tags to repair a failure.

## Handoff

Report source revisions, resolved version and npm baseline, generated files, notes requiring review, checks actually completed, and artifact/run/PR links. Clearly distinguish proposed file changes, a pushed preparation PR, dry-run results, and actual npm publication. State any remaining native/device or authorization checks.
