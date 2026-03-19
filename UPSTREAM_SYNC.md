# Upstream Sync

This repo tracks two packages from [expo/expo](https://github.com/expo/expo):

| Upstream                      | Local                        |
| ----------------------------- | ---------------------------- |
| `packages/expo-location`      | `expo-horizon-location`      |
| `packages/expo-notifications` | `expo-horizon-notifications` |

## Quick start

```bash
./scripts/sync-upstream-local.sh
```

The script clones upstream, filters it to the two packages (renaming paths), and runs a proper `git merge --no-commit`. Only files changed on **both** sides produce conflict markers. Unchanged local files accept the upstream version automatically.

## Options

```bash
./scripts/sync-upstream-local.sh --dry-run        # run the merge, show results, then abort
./scripts/sync-upstream-local.sh --ref sdk-52      # sync from a specific tag/branch
```

## After running the script

You're left in a merge state (not committed).

### No conflicts

```bash
git diff --cached
git commit -m "chore: sync upstream <sha>"
```

### With conflicts

Files with real conflicts (changed on both sides) have `<<<<<<<` / `=======` / `>>>>>>>` markers. Resolve them, then:

```bash
git add <resolved-file>
git commit
```

### Undo the merge

```bash
git merge --abort
```

## How it works

1. Clones `expo/expo` to a temp directory
2. Runs `git-filter-repo` to extract + rename the two packages
3. Fetches the filtered objects into the local repo
4. Updates a persistent tracking branch (`upstream-filtered`) with the new upstream tree
5. Merges `upstream-filtered` into your current branch with `--no-commit`
6. Cleans up the temp remote on exit

The `upstream-filtered` branch gives git a proper merge base — it records what upstream looked like at the last sync. On subsequent syncs, git does a 3-way merge between your branch, the new upstream, and the previous sync point. This means only files changed on both sides conflict.

### The `upstream-filtered` branch

This branch is the merge base. Push it to the remote so the whole team shares it:

```bash
git push origin upstream-filtered
```

The script automatically fetches it from origin if it doesn't exist locally, so new team members don't need to do a first sync from scratch.

**Do not delete this branch.** If it's lost, the next sync falls back to a first sync (all files conflict).

### First sync

On the very first run, `upstream-filtered` doesn't exist yet (locally or on origin). The merge uses `--allow-unrelated-histories`, so every file shows as new or conflicted. This is a one-time cost — after committing and pushing `upstream-filtered`, subsequent syncs will be clean.

## Requirements

- `git-filter-repo` — `pip install git-filter-repo`
- `git` 2.25+
