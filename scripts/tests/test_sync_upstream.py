"""Offline Git fixtures for the manual sync's merge and recovery behavior."""

import argparse
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location("sync_upstream", Path(__file__).parents[1] / "sync_upstream.py")
sync = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(sync)

UP = "packages/expo-location/"
LOCAL = "expo-horizon-location/"
ANDROID = "android/src/main/java/Location.kt"
MOBILE = "android/src/mobile/java/Location.kt"


def git(root, *args):
    result = subprocess.run(["git", "-C", str(root), *args], text=True, capture_output=True)
    if result.returncode:
        raise AssertionError(result.stderr or result.stdout)
    return result.stdout.strip()


def write(root, path, content):
    file = root / path
    file.parent.mkdir(parents=True, exist_ok=True)
    file.write_text(content)


def commit(root):
    git(root, "add", ".")
    git(root, "-c", "core.hooksPath=/dev/null", "commit", "-qm", "Fixture")
    return git(root, "rev-parse", "HEAD")


class SyncTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="horizon-sync-test-")
        self.addCleanup(self.temp.cleanup)
        self.expo = Path(self.temp.name) / "expo"
        self.root = Path(self.temp.name) / "horizon"
        for repo in (self.expo, self.root):
            repo.mkdir()
            git(repo, "init", "-q", "-b", "main")
            git(repo, "config", "user.name", "Fixture")
            git(repo, "config", "user.email", "fixture@example.invalid")
            git(repo, "config", "commit.gpgSign", "false")
            git(repo, "config", "core.autocrlf", "false")
        for local, upstream in sync.PACKAGES.items():
            for relative, value in {"package.json": '{"version":"1.0.0"}\n',
                                    "src/value.ts": "base\n", "ios/value.swift": "base\n"}.items():
                write(self.expo, upstream + "/" + relative, value)
                write(self.root, local + "/" + relative, value)
        write(self.expo, UP + ANDROID, "base mobile\n")
        write(self.root, LOCAL + MOBILE, "base mobile\n")
        write(self.root, LOCAL + "android/src/quest/java/Location.kt", "Quest only\n")
        write(self.root, "README.md", "Horizon\n")
        self.base = commit(self.expo)
        git(self.expo, "branch", "sdk-test")
        commit(self.root)
        self.args = argparse.Namespace(expo_repo=self.expo, ref="sdk-test", previous=self.base,
                                       remote="origin", offline=True, dry_run=False)

    def target(self, changes):
        for path, content in changes.items():
            if content is None:
                (self.expo / path).unlink()
            else:
                write(self.expo, path, content)
        sha = commit(self.expo)
        git(self.expo, "branch", "-f", "sdk-test", sha)
        return sha

    def run_sync(self):
        self.stdout = io.StringIO()
        self.stderr = io.StringIO()
        with contextlib.redirect_stdout(self.stdout), contextlib.redirect_stderr(self.stderr):
            return sync.prepare(self.args, self.root)

    def test_apply_routing_add_delete_and_generated_exclusion(self):
        target = self.target({UP + ANDROID: "new mobile\n", UP + "src/new.ts": "new\n",
                              UP + "ios/value.swift": None, UP + "build/output.js": "generated\n"})
        start = git(self.root, "rev-parse", "HEAD")
        self.assertEqual(self.run_sync(), 0)
        self.assertEqual((self.root / (LOCAL + MOBILE)).read_text(), "new mobile\n")
        self.assertFalse((self.root / (LOCAL + ANDROID)).exists())
        self.assertEqual((self.root / (LOCAL + "src/new.ts")).read_text(), "new\n")
        self.assertFalse((self.root / (LOCAL + "ios/value.swift")).exists())
        self.assertFalse((self.root / (LOCAL + "build/output.js")).exists())
        self.assertEqual((self.root / (LOCAL + "android/src/quest/java/Location.kt")).read_text(), "Quest only\n")
        self.assertEqual((self.root / "README.md").read_text(), "Horizon\n")
        self.assertEqual(json.loads((self.root / sync.BASELINE).read_text())["commit"], target)
        self.assertEqual(git(self.root, "rev-parse", "HEAD"), start)
        self.assertEqual(git(self.root, "diff", "--name-only"), "")
        self.assertNotIn("WARNING:", self.stderr.getvalue())

    def test_android_mobile_rename_warns_in_preview_and_apply(self):
        renamed = "android/src/main/java/RenamedLocation.kt"
        self.target({UP + ANDROID: None, UP + renamed: "base mobile\n"})
        refs = git(self.root, "show-ref")
        self.args.dry_run = True
        self.assertEqual(self.run_sync(), 0)
        warning = self.stderr.getvalue()
        self.assertIn("WARNING: New or renamed Android files default to src/main", warning)
        self.assertIn("Existing src/mobile routes do not follow renames", warning)
        self.assertIn("move mobile-only code to src/mobile before committing", warning)
        self.assertIn(LOCAL + renamed, warning)
        self.assertIn("Removed mobile paths in this package", warning)
        self.assertIn(LOCAL + MOBILE, warning)
        self.assertEqual(git(self.root, "status", "--porcelain"), "")
        self.assertEqual(git(self.root, "show-ref"), refs)
        self.assertFalse((self.root / sync.BASELINE).exists())

        self.args.dry_run = False
        self.assertEqual(self.run_sync(), 0)
        self.assertEqual(self.stderr.getvalue(), warning)
        self.assertEqual((self.root / (LOCAL + renamed)).read_text(), "base mobile\n")
        self.assertFalse((self.root / (LOCAL + MOBILE)).exists())
        self.assertEqual((self.root / (LOCAL + "android/src/quest/java/Location.kt")).read_text(),
                         "Quest only\n")

    def test_android_rewritten_rename_warns_without_git_rename_detection(self):
        upstream = "packages/expo-notifications/"
        local = "expo-horizon-notifications/"
        original = "android/src/main/java/PushToken.kt"
        mobile = "android/src/mobile/java/PushToken.kt"
        renamed = "android/src/main/java/tokens/NewPushToken.kt"
        write(self.expo, upstream + original, "original token implementation\n")
        self.args.previous = commit(self.expo)
        write(self.root, local + mobile, "original token implementation\n")
        commit(self.root)
        target = self.target({upstream + original: None, upstream + renamed: "rewritten tokens\n",
                              UP + ANDROID: None})
        delta = git(self.expo, "diff", "--name-status", "--find-renames",
                    self.args.previous, target)
        self.assertIn("A\t" + upstream + renamed, delta)
        self.assertIn("D\t" + upstream + original, delta)
        self.assertEqual(self.run_sync(), 0)
        warning = self.stderr.getvalue()
        self.assertIn("WARNING:", warning)
        self.assertIn(local + renamed, warning)
        self.assertIn(local + mobile, warning)
        # An unrelated package's deletion must not be suggested as a rename source.
        self.assertNotIn(LOCAL + MOBILE, warning)
        self.assertEqual((self.root / (local + renamed)).read_text(), "rewritten tokens\n")
        self.assertFalse((self.root / (local + mobile)).exists())

    def test_new_android_file_warns_without_suggesting_a_rename_source(self):
        added = "android/src/main/java/NewFile.kt"
        self.target({UP + added: "new Android code\n"})
        self.assertEqual(self.run_sync(), 0)
        warning = self.stderr.getvalue()
        self.assertIn("WARNING:", warning)
        self.assertIn("shared by mobile and Quest", warning)
        self.assertIn(LOCAL + added, warning)
        self.assertNotIn("Removed mobile paths", warning)

    def test_existing_shared_and_mobile_updates_do_not_warn(self):
        shared = "android/src/main/java/Shared.kt"
        write(self.expo, UP + shared, "shared\n")
        self.args.previous = commit(self.expo)
        write(self.root, LOCAL + shared, "shared\n")
        commit(self.root)
        self.target({UP + shared: "updated shared\n", UP + ANDROID: "updated mobile\n"})
        self.assertEqual(self.run_sync(), 0)
        self.assertNotIn("WARNING:", self.stderr.getvalue())
        self.assertEqual((self.root / (LOCAL + shared)).read_text(), "updated shared\n")
        self.assertEqual((self.root / (LOCAL + MOBILE)).read_text(), "updated mobile\n")

    def test_text_conflict_and_abort(self):
        write(self.root, LOCAL + "src/value.ts", "Horizon edit\n")
        start = commit(self.root)
        self.target({UP + "src/value.ts": "Expo edit\n"})
        self.assertEqual(self.run_sync(), 1)
        self.assertIn("<<<<<<<", (self.root / (LOCAL + "src/value.ts")).read_text())
        self.assertTrue(git(self.root, "ls-files", "--unmerged"))
        git(self.root, "cherry-pick", "--abort")
        self.assertEqual(git(self.root, "rev-parse", "HEAD"), start)
        self.assertEqual(git(self.root, "status", "--porcelain"), "")
        self.assertFalse((self.root / sync.BASELINE).exists())

    def test_resolve_quit_does_not_commit(self):
        write(self.root, LOCAL + "src/value.ts", "Horizon edit\n")
        start = commit(self.root)
        self.target({UP + "src/value.ts": "Expo edit\n"})
        self.assertEqual(self.run_sync(), 1)
        write(self.root, LOCAL + "src/value.ts", "resolved\n")
        git(self.root, "add", LOCAL + "src/value.ts")
        git(self.root, "cherry-pick", "--quit")
        self.assertEqual(git(self.root, "rev-parse", "HEAD"), start)
        self.assertEqual(git(self.root, "ls-files", "--unmerged"), "")
        self.assertTrue(git(self.root, "diff", "--cached", "--name-only"))

    def test_preview_conflicts_and_retry_do_not_advance_baseline(self):
        write(self.root, LOCAL + "src/value.ts", "Horizon edit\n")
        commit(self.root)
        self.target({UP + "src/value.ts": "Expo edit\n"})
        refs = git(self.root, "show-ref")
        self.args.dry_run = True
        self.assertEqual(self.run_sync(), 1)
        self.assertEqual(git(self.root, "status", "--porcelain"), "")
        self.assertEqual(git(self.root, "show-ref"), refs)
        self.assertFalse((self.root / sync.BASELINE).exists())
        self.args.dry_run = False
        self.assertEqual(self.run_sync(), 1)
        self.assertTrue(git(self.root, "ls-files", "--unmerged"))

    def test_modified_upstream_deletion_is_a_conflict(self):
        write(self.root, LOCAL + "src/value.ts", "Horizon edit\n")
        commit(self.root)
        self.target({UP + "src/value.ts": None})
        self.assertEqual(self.run_sync(), 1)
        self.assertEqual((self.root / (LOCAL + "src/value.ts")).read_text(), "Horizon edit\n")
        self.assertTrue(git(self.root, "ls-files", "--unmerged"))

    def test_rename_and_local_modification(self):
        write(self.expo, UP + "src/value.ts", "one\ntwo\nthree\nfour\nfive\n")
        self.base = commit(self.expo)
        self.args.previous = self.base
        write(self.root, LOCAL + "src/value.ts", "one\ntwo\nHorizon\nfour\nfive\n")
        commit(self.root)
        self.target({UP + "src/value.ts": None, UP + "src/renamed.ts": "one\ntwo\nthree\nfour\nfive\n"})
        self.assertEqual(self.run_sync(), 0)
        self.assertFalse((self.root / (LOCAL + "src/value.ts")).exists())
        self.assertIn("Horizon", (self.root / (LOCAL + "src/renamed.ts")).read_text())

    def test_dirty_checkout_and_unknown_baseline_are_rejected(self):
        write(self.root, "unrelated.txt", "keep\n")
        with self.assertRaisesRegex(ValueError, "clean Horizon"):
            self.run_sync()
        (self.root / "unrelated.txt").unlink()
        self.args.previous = None
        with self.assertRaisesRegex(ValueError, "First sync requires"):
            self.run_sync()

    def test_ignored_collision_and_duplicate_routes_are_rejected(self):
        write(self.root, ".gitignore", "ignored.ts\n")
        commit(self.root)
        write(self.root, LOCAL + "src/ignored.ts", "do not overwrite\n")
        self.target({UP + "src/ignored.ts": "upstream\n"})
        with self.assertRaisesRegex(ValueError, "blocks upstream"):
            self.run_sync()
        self.assertEqual((self.root / (LOCAL + "src/ignored.ts")).read_text(), "do not overwrite\n")
        (self.root / (LOCAL + "src/ignored.ts")).unlink()
        write(self.root, LOCAL + ANDROID, "duplicate\n")
        commit(self.root)
        with self.assertRaisesRegex(ValueError, "Duplicate shared/mobile"):
            self.run_sync()

    def test_ignored_baseline_is_preserved_and_rejected(self):
        write(self.root, ".gitignore", sync.BASELINE + "\n")
        commit(self.root)
        content = json.dumps({"commit": self.base})
        write(self.root, sync.BASELINE, content)
        with self.assertRaisesRegex(ValueError, "blocks preparation"):
            self.run_sync()
        self.assertEqual((self.root / sync.BASELINE).read_text(), content)
        self.assertEqual(git(self.root, "status", "--porcelain"), "")

    def test_committed_null_baseline_is_rejected(self):
        write(self.root, sync.BASELINE, "null\n")
        commit(self.root)
        with self.assertRaisesRegex(ValueError, "exactly the reviewed"):
            self.run_sync()

    def test_symlink_baseline_is_rejected(self):
        (self.root / sync.BASELINE).symlink_to("README.md")
        commit(self.root)
        with self.assertRaisesRegex(ValueError, "regular file"):
            self.run_sync()

    def test_older_and_divergent_targets_are_rejected_without_changes(self):
        ancestor = self.base
        self.args.previous = self.target({UP + "src/value.ts": "first update\n"})
        git(self.expo, "checkout", "-q", "--detach", ancestor)
        divergent = self.target({UP + "src/value.ts": "other branch\n"})
        for target in (ancestor, divergent):
            self.args.ref = target
            with self.assertRaisesRegex(ValueError, "does not descend from baseline"):
                self.run_sync()
            self.assertEqual(git(self.root, "status", "--porcelain"), "")
            self.assertFalse((self.root / sync.BASELINE).exists())

    def test_next_sync_uses_committed_baseline_and_clean_undo(self):
        self.target({UP + "src/value.ts": "first update\n"})
        self.assertEqual(self.run_sync(), 0)
        commit(self.root)
        previous_manifest = (self.root / sync.BASELINE).read_bytes()
        self.args.previous = None
        self.target({UP + "src/value.ts": "second update\n"})
        self.assertEqual(self.run_sync(), 0)
        git(self.root, "restore", "--source=HEAD", "--staged", "--worktree", "--",
            *sync.PACKAGES, sync.BASELINE)
        self.assertEqual((self.root / sync.BASELINE).read_bytes(), previous_manifest)
        self.assertEqual(git(self.root, "status", "--porcelain"), "")

    def test_fetch_uses_remote_tip_without_switching_or_modifying_checkout(self):
        clone = Path(self.temp.name) / "expo-clone"
        subprocess.run(["git", "clone", "-q", str(self.expo), str(clone)], check=True)
        start = git(clone, "rev-parse", "HEAD")
        write(clone, UP + "src/value.ts", "uncommitted upstream work\n")
        refs = git(clone, "show-ref")
        target = self.target({UP + "src/value.ts": "remote update\n"})
        self.args.expo_repo = clone
        self.args.offline = False
        self.assertEqual(self.run_sync(), 0)
        self.assertEqual(json.loads((self.root / sync.BASELINE).read_text())["commit"], target)
        self.assertEqual(git(clone, "rev-parse", "HEAD"), start)
        self.assertEqual(git(clone, "show-ref"), refs)
        self.assertEqual((clone / (UP + "src/value.ts")).read_text(), "uncommitted upstream work\n")

    def test_clean_preview_and_first_sync_undo(self):
        self.target({UP + "src/value.ts": "upstream\n"})
        self.args.dry_run = True
        self.assertEqual(self.run_sync(), 0)
        self.assertEqual(git(self.root, "status", "--porcelain"), "")
        self.args.dry_run = False
        self.assertEqual(self.run_sync(), 0)
        git(self.root, "restore", "--source=HEAD", "--staged", "--worktree", "--",
            *sync.PACKAGES, sync.BASELINE)
        self.assertEqual(git(self.root, "status", "--porcelain"), "")
        self.assertFalse((self.root / sync.BASELINE).exists())

    def test_binary_conflict_preserves_local_and_can_abort(self):
        binary = "src/fixture.bin"
        (self.expo / (UP + binary)).write_bytes(b"\0base")
        self.args.previous = commit(self.expo)
        (self.root / (LOCAL + binary)).write_bytes(b"\0local")
        commit(self.root)
        (self.expo / (UP + binary)).write_bytes(b"\0upstream")
        tip = commit(self.expo)
        git(self.expo, "branch", "-f", "sdk-test", tip)
        self.assertEqual(self.run_sync(), 1)
        self.assertEqual((self.root / (LOCAL + binary)).read_bytes(), b"\0local")
        self.assertTrue(git(self.root, "ls-files", "--unmerged"))
        git(self.root, "cherry-pick", "--abort")
        self.assertEqual(git(self.root, "status", "--porcelain"), "")

    def test_completed_sync_retry_is_empty(self):
        self.target({UP + "src/value.ts": "upstream\n"})
        self.assertEqual(self.run_sync(), 0)
        commit(self.root)
        self.args.previous = None
        self.assertEqual(self.run_sync(), 0)
        self.assertEqual(git(self.root, "status", "--porcelain"), "")

    def test_executable_mode_and_add_add_conflict(self):
        self.target({UP + "src/tool.sh": "#!/bin/sh\n", UP + "src/collision.ts": "upstream\n"})
        (self.expo / (UP + "src/tool.sh")).chmod(0o755)
        tip = commit(self.expo)
        git(self.expo, "branch", "-f", "sdk-test", tip)
        write(self.root, LOCAL + "src/collision.ts", "local\n")
        commit(self.root)
        self.assertEqual(self.run_sync(), 1)
        self.assertEqual((self.root / (LOCAL + "src/tool.sh")).stat().st_mode & 0o111, 0o111)
        self.assertIn("<<<<<<<", (self.root / (LOCAL + "src/collision.ts")).read_text())


if __name__ == "__main__":
    unittest.main()
