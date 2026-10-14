# Working on Expo Horizon

Read [CONTRIBUTING.md](CONTRIBUTING.md), especially **Changelog ownership**, before changing package behavior. These instructions apply to ordinary fixes as well as SDK upgrades and releases.

## Complete a change

- Preserve unrelated local changes. For an SDK migration or release rehearsal, use an isolated checkout of the intended source commit when the user's checkout is dirty. State whether local edits were included.
- The agent implementing a user-facing change owns its release note: update the affected package's `Unpublished` section in the same change, using the contributor policy. Do not defer this to the release workflow. If no entry is appropriate, explain why in the PR's release-notes section.
- Keep upstream changelog wording and published history intact. Put migration details, tests, and mechanical dependency updates in the PR description.
- Use the Node version in `.nvmrc` and the commands in this branch's `package.json`. For code/config changes, install with `yarn install --frozen-lockfile` and run `yarn verify`; see [docs/verification.md](docs/verification.md) for focused checks and native/device verification. Documentation-only changes need formatting and link checks, not native rebuilds.
- Do not describe a dry run, mock, JS test, or package build as proof of real publication or native/device behavior. Report the source commit, checks actually run, and remaining limitations.

## Task-specific instructions

The repository's skills live under `.cursor/skills`; read the applicable file directly when doing these tasks, even if the client does not list Cursor skills:

- Expo SDK upgrade or upstream sync: [bump-expo-sdk](.cursor/skills/bump-expo-sdk/SKILL.md).
- Native/upstream parity review: [validate-upstream-parity](.cursor/skills/validate-upstream-parity/SKILL.md).
- Version preparation, release dry run, publication, or partial-release recovery: [release-expo-horizon](.cursor/skills/release-expo-horizon/SKILL.md).

Use the upstream ref and branch name already authorized by the user. Ask only for missing information or an unresolved product decision; do not request the same approval again. Preparing changes or testing a dry run does not itself authorize npm publication, merging a PR, or creating a remote release tag.
