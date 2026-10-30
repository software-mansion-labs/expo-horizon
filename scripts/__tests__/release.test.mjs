import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  packages,
  resolveRelease,
  releaseChangelog,
  prepare,
  validatePrepared,
  publicationPlan,
  parseVersion,
} from '../release.mjs';

const registries = (versions = ['57.0.2']) =>
  packages.map((name) => ({
    name,
    versions: Object.fromEntries(versions.map((v) => [v, { dist: { integrity: 'sha512-YWJj' } }])),
    'dist-tags': { latest: versions.at(-1) },
  }));
const resolve = (overrides = {}) =>
  resolveRelease({
    sdk: 57,
    localVersions: ['57.0.2', '57.0.2', '57.0.2'],
    registries: registries(),
    bump: 'patch',
    ...overrides,
  });
const packed = (version = '57.0.3') =>
  packages.map((name) => ({ name, version, integrity: 'sha512-YWJj' }));

function fixture(t, sdk = 57) {
  const directory = mkdtempSync(join(tmpdir(), 'horizon-release-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const put = (path, text) => {
    mkdirSync(join(directory, path, '..'), { recursive: true });
    writeFileSync(
      join(directory, path),
      typeof text === 'string' ? text : `${JSON.stringify(text, null, 2)}\n`
    );
  };
  const get = (path) => readFileSync(join(directory, path), 'utf8');
  put('example/package.json', { dependencies: { expo: `~${sdk}.0.3` } });
  for (const name of packages) {
    put(`${name}/package.json`, {
      name,
      version: sdk === 57 ? '57.0.2' : '58.0.0',
      devDependencies: { expo: `~${sdk}.0.3` },
      ...(name === packages[0] ? {} : { peerDependencies: { 'expo-horizon-core': '^57.0.0' } }),
    });
    put(
      `${name}/README.md`,
      name === packages[0]
        ? '| Version | SDK |\n| --- | --- |\n| 57.0.0-57.0.2 | 57 |\n'
        : `| Version | Upstream | SDK |\n| --- | --- | --- |\n| ${sdk}.0.${sdk === 57 ? 2 : 0} (unreleased) | ${sdk}.0.11 | ${sdk} |\n`
    );
    put(
      `${name}/android/build.gradle`,
      `version = '${sdk === 57 ? '57.0.2' : '58.0.0'}'\n  versionName "${sdk === 57 ? '57.0.2' : '58.0.0'}"\n`
    );
    put(
      `${name}/CHANGELOG.md`,
      '# Changelog\n\n## Unpublished\n\n### Features\n\n- A feature.\n\n### Fixes\n\n## 57.0.2 — 2026-01-01\n\nOld notes.\n'
    );
  }
  return { directory, put, get };
}

test('patch and minor are derived from the published SDK baseline', () => {
  assert.equal(resolve().version, '57.0.3');
  assert.equal(resolve({ bump: 'minor' }).version, '57.1.0');
  assert.equal(resolve({ registries: registries(['57.0.2', '58.0.0']) }).version, '57.0.3');
});

test('manual bumps in one or every manifest are reused without double bumping', () => {
  for (const localVersions of [
    ['57.0.3', '57.0.2', '57.0.2'],
    ['57.0.3', '57.0.3', '57.0.3'],
  ]) {
    const result = resolve({ localVersions });
    assert.equal(result.version, '57.0.3');
    assert.equal(result.reusedManualBump, true);
  }
});

test('conflicting, stale, prerelease and wrong SDK versions fail', () => {
  for (const version of ['57.0.4', '57.1.0', '57.0.1', '58.0.0', '57.0.3-rc.1']) {
    assert.throws(() => resolve({ localVersions: [version, '57.0.2', '57.0.2'] }));
  }
  assert.throws(() => parseVersion('057.0.3'));
  assert.throws(() => resolve({ bump: 'major' }), /Upgrade the checkout/);
});

test('first SDK 58 release reuses 58.0.0 or finishes a partial major bump', () => {
  for (const localVersions of [
    ['58.0.0', '58.0.0', '58.0.0'],
    ['58.0.0', '57.0.2', '57.0.2'],
  ]) {
    assert.equal(resolve({ sdk: 58, bump: 'major', localVersions }).version, '58.0.0');
  }
  assert.throws(() => resolve({ sdk: 58 }), /Choose major/);
  assert.throws(
    () => resolve({ sdk: 58, bump: 'major', localVersions: ['57.0.1', '58.0.0', '58.0.0'] }),
    /version conflict/
  );
});

test('a partial npm publication blocks another bump, including a new SDK', () => {
  const partial = registries();
  partial[0].versions['57.0.3'] = {};
  assert.throws(() => resolve({ registries: partial }), /Partial release/);
  assert.throws(
    () => resolve({ sdk: 58, bump: 'major', registries: partial }),
    /partially published/
  );
});

test('changelog moves notes once, retains empty headings and older history', () => {
  const source =
    '# Changelog\n\n## Unpublished\n\n### Features\n\n- Feature\n\n### Fixes\n\n## 57.0.2 — 2026-01-01\n\nOld\n';
  const result = releaseChangelog(source, '57.0.3', '2026-10-12');
  assert.match(result, /## Unpublished\n\n### Features\n\n### Fixes\n\n## 57.0.3/);
  assert.equal(result.split('- Feature').length, 2);
  assert.match(result, /Old\n$/);
  assert.equal(releaseChangelog(result, '57.0.3', '2026-10-13'), result);
  assert.match(
    releaseChangelog('## Unpublished\n\n### Fixes\n', '57.0.3', '2026-10-12'),
    /does not introduce/
  );
});

test('preparation synchronizes metadata and is idempotent before publication', async (t) => {
  const f = fixture(t);
  const coreGradle = f.get(`${packages[0]}/android/build.gradle`);
  await prepare(f.directory, 'patch', registries(), '2026-10-12');
  assert.equal(validatePrepared(f.directory), '57.0.3');
  assert.equal(f.get(`${packages[0]}/android/build.gradle`), coreGradle);
  const readme = f.get(`${packages[1]}/README.md`);
  const notes = f.get(`${packages[1]}/CHANGELOG.md`);
  await prepare(f.directory, 'patch', registries(), '2026-10-13');
  assert.equal(f.get(`${packages[1]}/README.md`), readme);
  assert.equal(f.get(`${packages[1]}/CHANGELOG.md`), notes);
});

test('SDK 58 preparation updates peer ranges and preserves upstream versions', async (t) => {
  const f = fixture(t, 58);
  await prepare(f.directory, 'major', registries(), '2026-10-12');
  assert.equal(validatePrepared(f.directory), '58.0.0');
  assert.match(f.get(`${packages[1]}/package.json`), /\^58.0.0/);
  assert.match(f.get(`${packages[1]}/README.md`), /\| 58.0.0 \| 58.0.11 \| 58 \|/);
});

test('missing upstream SDK row aborts before any file changes', async (t) => {
  const f = fixture(t, 58);
  f.put(`${packages[2]}/README.md`, '| 57.0.2 | 57.0.1 | 57 |\n');
  const before = f.get(`${packages[0]}/package.json`);
  await assert.rejects(
    prepare(f.directory, 'major', registries(), '2026-10-12'),
    /upstream compatibility row/
  );
  assert.equal(f.get(`${packages[0]}/package.json`), before);
});

test('conflicting native manual bump aborts before edits', async (t) => {
  const f = fixture(t);
  f.put(`${packages[2]}/android/build.gradle`, "version = '57.0.9'\nversionName '57.0.9'\n");
  const before = f.get(`${packages[0]}/package.json`);
  await assert.rejects(
    prepare(f.directory, 'patch', registries(), '2026-10-12'),
    /conflicting Android version/
  );
  assert.equal(f.get(`${packages[0]}/package.json`), before);
});

test('publication validation catches stale Android, docs, versions and Expo SDK', async (t) => {
  const f = fixture(t);
  await prepare(f.directory, 'patch', registries(), '2026-10-12');
  const cases = [
    [
      `${packages[1]}/android/build.gradle`,
      "version = '57.0.2'\nversionName '57.0.2'\n",
      /Gradle version/,
    ],
    [`${packages[1]}/README.md`, '| 57.0.2 | 57.0.11 | 57 |\n', /table is stale/],
    [`${packages[1]}/CHANGELOG.md`, '## Unpublished\n', /release notes missing/],
    ['example/package.json', { dependencies: { expo: '~58.0.3' } }, /Expo SDK/],
  ];
  for (const [path, replacement, error] of cases) {
    const original = f.get(path);
    f.put(path, replacement);
    assert.throws(() => validatePrepared(f.directory), error);
    f.put(path, original);
  }
});

test('partial publish retries skip only identical artifacts and preserve newer SDK latest', () => {
  const partial = registries(['57.0.2', '58.0.0']);
  partial[0].versions['57.0.3'] = { dist: { integrity: 'sha512-YWJj' } };
  const plan = publicationPlan(packed(), partial, '57.0.3');
  assert.deepEqual(
    plan.map((p) => p.skip),
    [true, false, false]
  );
  assert(plan.every((p) => p.tag === 'sdk-57'));
  partial[0].versions['57.0.3'].dist.integrity = 'sha512-b3RoZXI=';
  assert.throws(() => publicationPlan(packed(), partial, '57.0.3'), /different contents/);
});

test('missing integrity or outdated publication is rejected', () => {
  const invalid = packed();
  delete invalid[0].integrity;
  assert.throws(() => publicationPlan(invalid, registries(), '57.0.3'), /integrity/);
  assert.throws(() => publicationPlan(packed(), registries(['57.0.4']), '57.0.3'), /older than/);
});

// Execute the real CLI against fake git/npm executables and a local registry.
// These tests never contact npm or publish a package.
async function publishFixture(t) {
  const f = fixture(t);
  await prepare(f.directory, 'patch', registries(), '2026-10-12');
  const { chmodSync } = await import('node:fs');
  f.put('scripts/release.mjs', readFileSync(new URL('../release.mjs', import.meta.url), 'utf8'));
  f.put('registry.json', registries());
  f.put('calls.jsonl', '');
  f.put(
    'preload.mjs',
    `import {readFileSync} from 'node:fs';
    globalThis.fetch = async (url) => {
      if (process.env.FAIL_REGISTRY) return new Response('', {status:503});
      const name = decodeURIComponent(url.split('/').at(-1));
      return new Response(JSON.stringify(JSON.parse(readFileSync(process.env.TEST_ROOT+'/registry.json')).find(r=>r.name===name)));
    };`
  );
  const bin = (name, source) => {
    f.put(`bin/${name}`, `#!${process.execPath}\n${source}`);
    chmodSync(join(f.directory, 'bin', name), 0o755);
  };
  const prelude = `const fs=require('node:fs'); const root=process.env.TEST_ROOT; const args=process.argv.slice(2);
    fs.appendFileSync(root+'/calls.jsonl',JSON.stringify({tool:require('node:path').basename(process.argv[1]),args})+'\\n');`;
  bin(
    'git',
    `${prelude}
    if(args[0]==='rev-parse') console.log('a'.repeat(40));
    else if(args[0]==='ls-remote' && process.env.FAIL_TAG) console.log('b'.repeat(40)+'\\trefs/tags/v57.0.3');`
  );
  bin(
    'npm',
    `${prelude}
    if(args[0]==='pack') {
      const name=require('node:path').basename(process.cwd());
      console.log(JSON.stringify([{name,version:'57.0.3',integrity:'sha512-YWJj',filename:name+'.tgz',files:['build/index.js','build/index.d.ts','app.plugin.js','expo-module.config.json','android/build.gradle','plugin/build/withHorizon.js','plugin/build/withLocation.js','plugin/build/withNotifications.js','plugin.js','plugin.d.ts','plugin/build/plugin.js','android/src/main/test.kt','android/src/mobile/test.kt','android/src/quest/test.kt','ios/ExpoHorizon.podspec','ios/ExpoLocation.podspec','ios/ExpoNotifications.podspec'].map(path=>({path}))}]));
    } else if(args[0]==='publish') {
      const name=require('node:path').basename(args[1],'.tgz');
      if(process.env.FAIL_PACKAGE===name && (!process.env.FAIL_UPLOAD_ONLY || !args.includes('--dry-run'))) process.exit(1);
      if(!args.includes('--dry-run')) {
        const records=JSON.parse(fs.readFileSync(root+'/registry.json'));
        records.find(r=>r.name===name).versions['57.0.3']={dist:{integrity:'sha512-YWJj'}};
        fs.writeFileSync(root+'/registry.json',JSON.stringify(records));
      }
    } else process.exit(1);`
  );
  const { spawnSync } = await import('node:child_process');
  const run = (dryRun, env = {}) =>
    spawnSync(
      process.execPath,
      [
        '--import',
        join(f.directory, 'preload.mjs'),
        join(f.directory, 'scripts/release.mjs'),
        'publish',
      ],
      {
        encoding: 'utf8',
        env: {
          ...process.env,
          PATH: `${join(f.directory, 'bin')}:${process.env.PATH}`,
          TEST_ROOT: f.directory,
          RELEASE_DRY_RUN: String(dryRun),
          RELEASE_ARTIFACTS: join(f.directory, 'artifacts'),
          GITHUB_STEP_SUMMARY: '',
          ...env,
        },
      }
    );
  const calls = () => f.get('calls.jsonl').trim().split('\n').filter(Boolean).map(JSON.parse);
  return { ...f, run, calls };
}

test('CLI dry run exercises all packages without uploads or git mutations', async (t) => {
  const f = await publishFixture(t);
  const result = f.run(true);
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();
  assert.equal(calls.filter((c) => c.tool === 'npm' && c.args[0] === 'publish').length, 3);
  assert(
    calls
      .filter((c) => c.tool === 'npm' && c.args[0] === 'publish')
      .every((c) => c.args.includes('--dry-run'))
  );
  assert(!calls.some((c) => c.tool === 'git' && ['tag', 'push'].includes(c.args[0])));
  assert(!f.get(`${packages[0]}/package.json`).includes('gitHead'));
});

test('CLI preflight failure prevents every real upload', async (t) => {
  for (const env of [{ FAIL_PACKAGE: packages[2] }, { FAIL_REGISTRY: '1' }, { FAIL_TAG: '1' }]) {
    const f = await publishFixture(t);
    const result = f.run(false, env);
    assert.notEqual(result.status, 0);
    assert(
      !f
        .calls()
        .some((c) => c.tool === 'npm' && c.args[0] === 'publish' && !c.args.includes('--dry-run'))
    );
    assert(!f.calls().some((c) => c.tool === 'git' && ['tag', 'push'].includes(c.args[0])));
  }
});

test('CLI publishes core first, tags only after all uploads, and retries identical artifacts', async (t) => {
  const f = await publishFixture(t);
  const result = f.run(false);
  assert.equal(result.status, 0, result.stderr);
  const calls = f.calls();
  const uploads = calls.filter(
    (c) => c.tool === 'npm' && c.args[0] === 'publish' && !c.args.includes('--dry-run')
  );
  assert.deepEqual(
    uploads.map((c) => c.args[1].split('/').at(-1)),
    packages.map((name) => `${name}.tgz`)
  );
  assert(
    calls.findIndex((c) => c.tool === 'git' && c.args[0] === 'tag') > calls.indexOf(uploads.at(-1))
  );
  f.put('calls.jsonl', '');
  const retry = f.run(false);
  assert.equal(retry.status, 0, retry.stderr);
  assert(!f.calls().some((c) => c.tool === 'npm' && c.args[0] === 'publish'));
});

test('publication cannot bypass a partial previous release or skip versions', () => {
  const partial = registries();
  partial[0].versions['57.0.3'] = { dist: { integrity: 'sha512-YWJj' } };
  assert.throws(() => publicationPlan(packed('57.0.4'), partial, '57.0.4'), /Partial release/);
  assert.throws(
    () => publicationPlan(packed('57.0.9'), registries(), '57.0.9'),
    /version conflict/
  );
});

test('CLI resumes a failed upload without republishing successful packages', async (t) => {
  const f = await publishFixture(t);
  const failed = f.run(false, { FAIL_PACKAGE: packages[2], FAIL_UPLOAD_ONLY: '1' });
  assert.notEqual(failed.status, 0);
  assert(!f.calls().some((c) => c.tool === 'git' && c.args[0] === 'tag'));
  f.put('calls.jsonl', '');
  const retried = f.run(false);
  assert.equal(retried.status, 0, retried.stderr);
  const uploads = f
    .calls()
    .filter((c) => c.tool === 'npm' && c.args[0] === 'publish' && !c.args.includes('--dry-run'));
  assert.equal(uploads.length, 1);
  assert(uploads[0].args[1].endsWith('expo-horizon-notifications.tgz'));
  assert(f.calls().some((c) => c.tool === 'git' && c.args[0] === 'tag'));
});
