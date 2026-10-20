#!/usr/bin/env python3
"""Prepare a three-way Expo update. Requires Python 3.9+ and Git 2.40+."""

import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parent.parent
BASELINE = "upstream-sync.json"
PACKAGES = {
    "expo-horizon-location": "packages/expo-location",
    "expo-horizon-notifications": "packages/expo-notifications",
}
GENERATED = ("build/", "plugin/build/", "android/build/", "android/.gradle/", "node_modules/")


def git(repo, *args, data=None, env=None, allowed=(0,)):
    result = subprocess.run(
        ["git", "-C", str(repo), *args], input=data, stdout=subprocess.PIPE,
        stderr=subprocess.PIPE, env=env,
    )
    if result.returncode not in allowed:
        raise ValueError(result.stderr.decode(errors="replace").strip() or
                         result.stdout.decode(errors="replace").strip())
    return result


def output(repo, *args, **kwargs):
    return git(repo, *args, **kwargs).stdout.decode().strip()


def clean_checkout(root):
    for state in ("MERGE_HEAD", "CHERRY_PICK_HEAD", "REVERT_HEAD", "sequencer", "rebase-merge", "rebase-apply"):
        path = Path(output(root, "rev-parse", "--git-path", state))
        if (root / path).exists():
            raise ValueError("Finish or abort the existing Git operation first: " + state)
    if output(root, "status", "--porcelain", "--untracked-files=normal"):
        raise ValueError("Use a clean Horizon worktree; commit changes or create a separate worktree first.")


def resolve_target(repo, ref, remote, offline):
    if offline:
        return output(repo, "rev-parse", "--verify", "--end-of-options", ref + "^{commit}")
    if re.fullmatch(r"[0-9a-f]{40}", ref):
        sha = ref
    else:
        full_ref = ref if ref.startswith("refs/") else "refs/heads/" + ref
        git(repo, "check-ref-format", full_ref)
        lines = output(repo, "ls-remote", "--exit-code", "--refs", "--", remote, full_ref).splitlines()
        matches = [line.split()[0] for line in lines if line.split()[1] == full_ref]
        if len(matches) != 1:
            raise ValueError("Target must resolve to exactly one remote branch/tag: " + full_ref)
        sha = matches[0]
    # Fetch the observed object, not a moving local branch. Neither FETCH_HEAD nor
    # local/remote-tracking branches are used as synchronization state.
    git(repo, "fetch", "--quiet", "--no-tags", "--no-write-fetch-head", "--no-recurse-submodules",
        "--", remote, sha)
    return output(repo, "rev-parse", "--verify", sha + "^{commit}")


def entries(repo, ref, prefix):
    raw = git(repo, "ls-tree", "-rz", ref, "--", prefix).stdout
    result = {}
    for record in raw.split(b"\0"):
        if not record:
            continue
        info, path = record.split(b"\t", 1)
        mode, kind, oid = info.decode().split()
        if kind != "blob":
            raise ValueError("Unsupported upstream submodule: " + os.fsdecode(path))
        result[os.fsdecode(path)] = (mode, oid)
    return result


def snapshot(repo, sha, tracked):
    mapped = {}
    for local, upstream in PACKAGES.items():
        source = entries(repo, sha, upstream)
        if upstream + "/package.json" not in source:
            raise ValueError("Missing upstream package at " + sha + ": " + upstream)
        for path, blob in source.items():
            relative = path[len(upstream) + 1:]
            if relative.startswith(GENERATED) or relative.endswith(".tsbuildinfo"):
                continue
            destination = local + "/" + relative
            if relative.startswith("android/src/quest/") or relative.startswith("android/src/mobile/"):
                raise ValueError("Upstream source sets changed; review routing first: " + path)
            if relative.startswith("android/src/main/"):
                mobile = destination.replace("/android/src/main/", "/android/src/mobile/", 1)
                if mobile in tracked:
                    if destination in tracked:
                        raise ValueError("Duplicate shared/mobile source: " + destination)
                    destination = mobile
            mapped[destination] = blob
    return mapped


def warn_android_routing(old, new):
    # Compare paths rather than relying on Git's similarity-based rename detection:
    # a renamed and rewritten mobile file still needs an explicit routing review.
    for package in PACKAGES:
        added = sorted(path for path in new.keys() - old.keys()
                       if path.startswith(package + "/android/src/main/"))
        if not added:
            continue
        print(
            "WARNING: New or renamed Android files default to src/main, which is shared "
            "by mobile and Quest. Existing src/mobile routes do not follow renames.",
            file=sys.stderr,
        )
        print("Review these paths and move mobile-only code to src/mobile before committing:",
              file=sys.stderr)
        print("\n".join("  " + path for path in added), file=sys.stderr)
        removed = sorted(path for path in old.keys() - new.keys()
                         if path.startswith(package + "/android/src/mobile/"))
        if removed:
            print("Removed mobile paths in this package may be the sources of those renames:",
                  file=sys.stderr)
            print("\n".join("  " + path for path in removed), file=sys.stderr)


def import_blobs(root, expo, snapshots):
    oids = sorted({oid for tree in snapshots for _, oid in tree.values()})
    pack = git(expo, "pack-objects", "--stdout", data=("\n".join(oids) + "\n").encode()).stdout
    git(root, "index-pack", "--stdin", data=pack)


def tree(root, files, index):
    env = {**os.environ, "GIT_INDEX_FILE": str(index)}
    git(root, "read-tree", "--empty", env=env)
    records = b"".join(
        f"{mode} {oid}\t".encode() + os.fsencode(path) + b"\0"
        for path, (mode, oid) in sorted(files.items())
    )
    git(root, "update-index", "-z", "--index-info", data=records, env=env)
    return output(root, "write-tree", env=env)


def commit(root, tree_id, message, parent=None):
    env = {**os.environ, "GIT_AUTHOR_NAME": "Upstream sync", "GIT_AUTHOR_EMAIL": "upstream@example.invalid",
           "GIT_COMMITTER_NAME": "Upstream sync", "GIT_COMMITTER_EMAIL": "upstream@example.invalid"}
    args = ["commit-tree", tree_id]
    if parent:
        args += ["-p", parent]
    return output(root, *args, data=(message + "\n").encode(), env=env)


def prepare(args, root=ROOT):
    clean_checkout(root)
    start = output(root, "rev-parse", "HEAD")
    tracked = entries(root, "HEAD", ".")
    baseline = None
    if BASELINE in tracked:
        if tracked[BASELINE][0] not in ("100644", "100755"):
            raise ValueError("upstream-sync.json must be a committed regular file, not a symlink.")
        baseline = json.loads(output(root, "show", "HEAD:" + BASELINE))
        if not isinstance(baseline, dict) or set(baseline) != {"commit"}:
            raise ValueError("upstream-sync.json must contain exactly the reviewed Expo commit.")
    elif os.path.lexists(root / BASELINE):
        raise ValueError("Untracked/ignored upstream-sync.json blocks preparation; preserve it elsewhere first.")
    previous = args.previous or (baseline or {}).get("commit")
    if not isinstance(previous, str) or not re.fullmatch(r"[0-9a-f]{40}", previous):
        raise ValueError("First sync requires --from <full previous Expo SHA>; never guess the merge base.")
    if baseline and baseline.get("commit") != previous:
        raise ValueError("--from differs from the recorded baseline; review that baseline before syncing.")
    previous = output(args.expo_repo, "rev-parse", "--verify", previous + "^{commit}")
    target = resolve_target(args.expo_repo, args.ref, args.remote, args.offline)
    if git(args.expo_repo, "merge-base", "--is-ancestor", previous, target, allowed=(0, 1)).returncode:
        raise ValueError(
            f"Target {target} does not descend from baseline {previous}. "
            "Older/divergent targets cannot be synced incrementally. Review the target ref; "
            "do not substitute a guessed baseline. Files and index are unchanged."
        )
    old = snapshot(args.expo_repo, previous, tracked)
    new = snapshot(args.expo_repo, target, tracked)
    changed = sorted(path for path in old.keys() | new.keys() if old.get(path) != new.get(path))
    print(f"Expo {previous} -> {target}", flush=True)
    for path in changed:
        kind = "added" if path not in old else "deleted" if path not in new else "changed"
        print(f"  {kind:7} {path}")
    warn_android_routing(old, new)
    # Ignored local files are not reported by git status. Do not overwrite them.
    for path in new:
        if path not in tracked and os.path.lexists(root / path):
            raise ValueError("Untracked/ignored file blocks upstream path: " + path)
    import_blobs(root, args.expo_repo, (old, new))
    if BASELINE in tracked:
        old[BASELINE] = tracked[BASELINE]
    proposed = (json.dumps({"commit": target}, indent=2) + "\n").encode()
    new[BASELINE] = ("100644", output(root, "hash-object", "-w", "--stdin", data=proposed))
    with tempfile.TemporaryDirectory(prefix="horizon-sync-") as temporary:
        index = Path(temporary) / "index"
        base = commit(root, tree(root, old, index), "Previous Expo snapshot " + previous)
        tip = commit(root, tree(root, new, index), "Sync Expo " + previous + " -> " + target, base)
    if args.dry_run:
        result = git(root, "merge-tree", "--write-tree", "--merge-base=" + base,
                     "HEAD", tip, allowed=(0, 1))
        print(result.stdout.decode(errors="replace"), end="")
        print("Preview only. Horizon files, index, baseline, and branches are unchanged.")
        return result.returncode
    # Recheck after potentially slow network/object preparation.
    clean_checkout(root)
    if output(root, "rev-parse", "HEAD") != start:
        raise ValueError("Horizon HEAD changed during preparation; rerun the sync.")
    # A one-commit range activates Git's sequencer, so --abort works on conflicts.
    result = git(root, "-c", "rerere.enabled=false", "cherry-pick", "--no-commit",
                 base + ".." + tip, allowed=(0, 1))
    print(result.stdout.decode(errors="replace"), end="")
    print(result.stderr.decode(errors="replace"), end="", file=sys.stderr)
    if result.returncode:
        print("Resolve conflicts, git add the resolved files, then git cherry-pick --quit.")
        print("Use --quit, not --continue: leave the resolved changes staged for review, without a commit.")
        print("To undo this conflicted preparation: git cherry-pick --abort")
    else:
        print("Changes staged, not committed. Review the diff and all Horizon/Quest adaptations.")
        print("To undo this clean preparation before further edits:")
        print("  git restore --source=HEAD --staged --worktree -- " + " ".join(PACKAGES) + " " + BASELINE)
    print("Run parity, yarn verify, and native/device checks before committing the proposed baseline.")
    return result.returncode


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("expo_repo", type=Path, help="local expo/expo repository (checkout may be dirty)")
    parser.add_argument("--ref", required=True, help="remote SDK branch, refs/tags/<tag>, or full commit SHA")
    parser.add_argument("--from", dest="previous", help="previous full Expo SHA; defaults to upstream-sync.json")
    parser.add_argument("--remote", default="origin", help="Expo remote to fetch (default: origin)")
    parser.add_argument("--offline", action="store_true", help="resolve --ref locally; do not fetch")
    parser.add_argument("--dry-run", action="store_true", help="preview changes/conflicts without applying them")
    args = parser.parse_args()
    try:
        return prepare(args)
    except (OSError, ValueError, subprocess.SubprocessError) as error:
        print("Upstream sync failed: " + str(error), file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
