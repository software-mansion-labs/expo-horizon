# Upstream Sync

This repo tracks two packages from [expo/expo](https://github.com/expo/expo):

| Upstream | Local |
|---|---|
| `packages/expo-location` | `expo-horizon-location` |
| `packages/expo-notifications` | `expo-horizon-notifications` |

## Quick start

```bash
./scripts/sync-upstream-local.sh
```

This shallow-clones the upstream packages, copies them over the local dirs via `rsync`, and stages everything. Nothing is committed — you review and decide what to keep.

## Options

```bash
./scripts/sync-upstream-local.sh --dry-run        # preview changes, don't touch files
./scripts/sync-upstream-local.sh --ref sdk-52      # sync from a specific tag/branch
```

## After running the script

All upstream changes are staged. Use standard git to review:

```bash
git diff --cached                    # full diff of staged changes
git diff --cached --stat             # file-level summary
git diff --cached -- <file>          # inspect a specific file
```

### Handling changes

| Situation | What to do |
|---|---|
| Accept upstream change | Leave it staged, commit normally |
| Keep your version | `git reset HEAD <file>` then `git checkout -- <file>` |
| Partially accept | `git reset HEAD <file>`, manually edit, `git add <file>` |
| File deleted upstream | Shows as a staged deletion — unstage to keep it |
| New file from upstream | Shows as a staged addition — unstage + delete to skip it |

### Commit

```bash
git commit -m "chore: sync upstream <sha>"
```

The script prints the upstream SHA for reference.

### Undo everything

```bash
git reset HEAD -- expo-horizon-location expo-horizon-notifications
git checkout -- expo-horizon-location expo-horizon-notifications
```

## What the script skips

`build/` and `plugin/build/` directories are excluded since those are generated artifacts. Rebuild after syncing:

```bash
cd expo-horizon-location && yarn build && yarn build plugin
cd expo-horizon-notifications && yarn build && yarn build plugin
```

## Requirements

- `rsync` (pre-installed on macOS)
- `git` with sparse-checkout support (2.25+)
