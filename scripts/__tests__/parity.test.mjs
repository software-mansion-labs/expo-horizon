import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';

const helper = '.cursor/skills/validate-upstream-parity/scripts/validate-parity.sh';
const packages = ['location', 'notifications'];

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), 'horizon-parity-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const local = join(directory, 'horizon');
  const upstream = join(directory, 'expo with spaces');
  function put(root, path, text) {
    const target = join(root, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, text);
  }
  for (const name of packages) {
    const files = {
      'ios/Module.swift': 'native\n',
      'src/index.ts': 'export const value = 1;\n',
      'android/src/main/Shared.kt': 'shared\n',
      'android/src/main/Value.kt': 'mobile\n',
    };
    for (const [path, text] of Object.entries(files)) {
      put(upstream, `packages/expo-${name}/${path}`, text);
      put(local, `expo-horizon-${name}/${path}`, text);
    }
    put(local, `expo-horizon-${name}/android/src/main/Value.kt`, 'overridden by mobile\n');
    put(local, `expo-horizon-${name}/android/src/mobile/Value.kt`, 'mobile\n');
    put(local, `expo-horizon-${name}/android/src/quest/OnlyQuest.kt`, 'quest only\n');
  }
  mkdirSync(dirname(join(local, helper)), { recursive: true });
  copyFileSync(new URL(`../../${helper}`, import.meta.url), join(local, helper));
  chmodSync(join(local, helper), 0o755);
  const git = (...args) =>
    execFileSync('git', ['-C', upstream, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  git('init', '-q');
  git('add', '.');
  git(
    '-c',
    'user.name=Parity test',
    '-c',
    'user.email=parity@example.invalid',
    'commit',
    '-qm',
    'Baseline'
  );
  const commit = git('rev-parse', 'HEAD');
  const run = (ref = commit) =>
    spawnSync('bash', [join(local, helper), upstream, ref], { encoding: 'utf8' });
  return { local, upstream, put, git, run };
}

test('parity overlays mobile, excludes Quest, and matches pinned upstream', (t) => {
  const f = fixture(t);
  const result = f.run();
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /both checkouts left untouched/);
  assert.equal(f.git('status', '--porcelain'), '');
});

test('parity leaves dirty and untracked upstream files intact and compares committed sources', (t) => {
  const f = fixture(t);
  const path = 'packages/expo-location/ios/Module.swift';
  f.put(f.upstream, path, 'user edit\n');
  f.put(f.upstream, 'packages/expo-location/ios/User.swift', 'untracked user work\n');
  const before = f.git('status', '--porcelain');
  const result = f.run();
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(readFileSync(join(f.upstream, path), 'utf8'), 'user edit\n');
  assert.equal(f.git('status', '--porcelain'), before);
  assert.equal(
    readFileSync(join(f.upstream, 'packages/expo-location/ios/User.swift'), 'utf8'),
    'untracked user work\n'
  );
});

test('parity detects added native files, including empty files', (t) => {
  const f = fixture(t);
  f.put(f.local, 'expo-horizon-location/ios/Added.swift', '');
  const result = f.run();
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /Added.swift/);
  assert.equal(f.git('status', '--porcelain'), '');
});

test('parity detects removed native files', (t) => {
  const f = fixture(t);
  rmSync(join(f.local, 'expo-horizon-location/ios/Module.swift'));
  const result = f.run();
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /Module.swift/);
});

test('TypeScript differences are reported separately from native parity', (t) => {
  const f = fixture(t);
  f.put(f.local, 'expo-horizon-notifications/src/index.ts', 'export const value = 2;\n');
  const result = f.run();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /export const value = 2/);
});

test('invalid ref and missing source trees fail instead of passing silently', (t) => {
  const f = fixture(t);
  assert.equal(f.run('missing-ref').status, 2);
  rmSync(join(f.local, 'expo-horizon-location/ios'), { recursive: true });
  assert.equal(f.run().status, 2);
});

test('legacy restore invocation refuses to discard upstream edits', (t) => {
  const f = fixture(t);
  f.put(f.upstream, 'packages/expo-location/src/index.ts', 'preserve this\n');
  const before = f.git('diff');
  const result = f.run('--restore');
  assert.equal(result.status, 2);
  assert.match(result.stderr, /no restore was performed/);
  assert.equal(f.git('diff'), before);
});
