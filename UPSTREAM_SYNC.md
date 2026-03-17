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

The script clones upstream, filters it down to the two packages (renaming them to match local paths), and runs `git merge --no-commit` on your current branch. This gives you a real 3-way merge — files changed only upstream merge cleanly, files changed on both sides get conflict markers.

## Options

```bash
./scripts/sync-upstream-local.sh --dry-run        # run the merge, show results, then abort
./scripts/sync-upstream-local.sh --ref sdk-52      # sync from a specific tag/branch
```

## After running the script

You're left in a **merge state** (not committed). The script prints a summary of what happened.

### No conflicts

Review and commit:

```bash
git diff --cached                    # inspect merged changes
git commit -m "chore: sync upstream <sha>"
```

### With conflicts

Files with conflicts have standard `<<<<<<<` / `=======` / `>>>>>>>` markers. Resolve them, then:

```bash
git add <resolved-file>
git commit -m "chore: sync upstream <sha>"
```

### Undo the merge

```bash
git merge --abort
```

## How it works

1. Clones `expo/expo` into a temp directory
2. Runs `git-filter-repo` to keep only `packages/expo-location` and `packages/expo-notifications`, renaming them to `expo-horizon-location` and `expo-horizon-notifications`
3. Adds the filtered repo as a temporary remote (`filtered-upstream`)
4. Merges with `--no-commit --no-ff --allow-unrelated-histories`
5. Cleans up the remote and temp directory on exit

## Requirements

- `git-filter-repo` — `pip install git-filter-repo`
- `git` 2.25+
