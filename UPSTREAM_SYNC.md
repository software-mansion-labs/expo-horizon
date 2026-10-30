# Upstream sync

Keep the manual sync + AI workflow: prepare the upstream changes, resolve conflicts
and adapt Quest behavior, then verify before committing. The script uses explicit
Expo snapshots and does not require an `upstream-filtered` branch or shared merge history.

## Prepare the update

Use a clean Horizon worktree and a local `expo/expo` repository containing the
previous upstream commit. Choose the upstream ref explicitly:

```bash
./scripts/sync-upstream-local.sh /path/to/expo --ref <target-ref> --from <previous-expo-sha> --dry-run
```

By default, the script looks up the latest commit on that branch on the Expo
checkout's `origin` remote and fetches that exact commit. It does not switch or
modify the Expo checkout or update its branches. Use `--remote <name>` for another
remote, `--ref refs/tags/<tag>` for a tag, or `--ref <full-sha>` for an exact commit.
Use `--offline` to resolve a ref already available locally without contacting a remote.

An SDK branch name does not guarantee newer package code. The selected target must
descend from the recorded baseline; older or divergent targets are rejected before
changing Horizon files. Review the ref and package versions if this happens. Do not
change the baseline to bypass the check. For example, a snapshot taken from Expo
`main` may be ahead of an SDK release branch.

The first run requires `--from` with the full Expo SHA used in the previous upgrade.
Obtain it from the recorded upgrade evidence; package versions alone are not enough.
If that baseline is unknown, establish it through a full source comparison before
using this helper. The script deliberately does not guess.

The preview prints the resolved target SHA, affected files, and Git's merge result.
To apply exactly what was previewed, use the printed SHA:

```bash
./scripts/sync-upstream-local.sh /path/to/expo --ref <printed-target-sha> --from <previous-expo-sha>
```

Changes are staged without creating a commit. The proposed target is staged in
`upstream-sync.json` alongside them. Commit that file only after resolving and
validating the upgrade. Subsequent runs read the previous SHA from that file, so
`--from` can be omitted. Only a committed, regular baseline file is accepted; ignored
copies are never overwritten. A dry run never advances it.

## Resolve and verify

The helper applies a three-way change using the previous Expo snapshot as the
base, the current Horizon code as ours, and the selected Expo snapshot as theirs.
Git handles text merges, renames, additions, deletions, and binary conflicts.
Conflicting paths appear in `git status`; text conflicts have conflict markers.

Use the [SDK bump checklist](.cursor/skills/bump-expo-sdk/SKILL.md) to review and
finish the migration. The helper preserves existing Android `src/mobile` routing
and leaves `src/quest` implementations untouched. Routing follows existing paths,
so an upstream rename does not inherit the old file's `src/mobile` placement.
Both preview and apply warn on stderr about new or renamed paths defaulting to
`src/main`, which is shared by mobile and Quest. The warning also lists removed
mobile paths from the same package as possible rename sources, even when Git
cannot detect a heavily edited rename. Review these paths and move mobile-only
code to `src/mobile` before committing; the warning does not change the exit code.
A clean merge does not prove compatibility. Review package metadata, dependencies,
plugins, changelogs, and Horizon-specific changes as well. Generated `build/`,
`plugin/build/`, Android build/cache directories, and TypeScript build-info are
excluded; rebuild outputs.

After resolving conflicts and staging the resolved files, end the preparation:

```bash
git cherry-pick --quit
```

Use `--quit` rather than `--continue` here: this preparation leaves changes staged
for review and does not create a commit. Review `git diff --cached`, run source
parity against the exact Expo target, run `yarn verify`, and perform the
[native/device checks](docs/verification.md). Update the Horizon-only core and
example app as required; the script imports only location and notifications.
Record the upstream SHAs, intentional differences, and verification results in the PR.

Run the [read-only parity helper](.cursor/skills/validate-upstream-parity/SKILL.md)
against the same pinned target:

```bash
.cursor/skills/validate-upstream-parity/scripts/validate-parity.sh /path/to/expo <printed-target-sha>
```

It leaves both checkouts untouched, includes additions and deletions, and returns
1 for native differences or 2 for an invalid input/comparison error. TypeScript
differences are printed for manual review. Review plugins, metadata, and native
build configuration separately; an exit code of 0 does not validate those areas.

## Undo

While a conflicted preparation is still active:

```bash
git cherry-pick --abort
```

After a clean preparation, or after `--quit`, the following restores the affected
packages and baseline to `HEAD`. Use it before making further edits you want to keep:

```bash
git restore --source=HEAD --staged --worktree -- expo-horizon-location expo-horizon-notifications upstream-sync.json
```

Exit codes: **0** means preparation/preview completed without conflicts; **1**
means conflicts require review; **2** means invalid input or a tool error. Review
the error and `git status` before retrying. Never commit an unresolved upgrade.

## Tooling

Requirements: Python 3.9+ and Git 2.40+. No `git-filter-repo` is needed. The script
creates temporary snapshot objects to feed Git's three-way merge; it does not
maintain a tracking branch, push, or publish. Normal squash merges are supported.
The GitHub workflow now runs regression tests for the helper; it does not sync
Expo or open upgrade PRs. Run those tests locally with:

```bash
python3 -m unittest discover -s scripts/tests -v
```
