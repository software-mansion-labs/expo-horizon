import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  appendFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const packages = [
  'expo-horizon-core',
  'expo-horizon-location',
  'expo-horizon-notifications',
];
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const json = (path) => JSON.parse(readFileSync(path, 'utf8'));
const output = (cmd, args, cwd = root) =>
  execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim();

export function parseVersion(value) {
  assert(
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value),
    `Invalid stable version: ${value}`
  );
  const parts = value.split('.').map(Number);
  assert(parts.every(Number.isSafeInteger), `Version is too large: ${value}`);
  return parts;
}

export function compare(a, b) {
  const left = parseVersion(a);
  const right = parseVersion(b);
  for (let i = 0; i < 3; i++) if (left[i] !== right[i]) return left[i] - right[i];
  return 0;
}

export function sdkMajor(range) {
  const match = /^[~^]?(\d+)\.\d+\.\d+(?:-[\w.-]+)?$/.exec(range ?? '');
  assert(match, `Cannot determine Expo SDK from ${range}; use an explicit Expo version range.`);
  return Number(match[1]);
}

const stableVersions = (registry) =>
  Object.keys(registry.versions).filter((v) =>
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(v)
  );

// Use the SDK line in this checkout, never the global npm latest tag.
export function resolveRelease({ sdk, localVersions, registries, bump }) {
  assert(['patch', 'minor', 'major'].includes(bump), `Unknown bump: ${bump}`);
  assert.equal(localVersions.length, packages.length);
  assert.equal(registries.length, packages.length);
  localVersions.forEach(parseVersion);
  const versions = registries.flatMap(stableVersions).filter((v) => parseVersion(v)[0] === sdk);
  const latest = [...new Set(versions)].sort(compare).at(-1);
  let version;
  let baseline = latest;
  if (!latest) {
    assert.equal(
      bump,
      'major',
      `SDK ${sdk} has no stable release. Choose major to prepare ${sdk}.0.0.`
    );
    version = `${sdk}.0.0`;
    baseline = registries
      .flatMap(stableVersions)
      .filter((v) => parseVersion(v)[0] === sdk - 1)
      .sort(compare)
      .at(-1);
    assert(
      baseline && registries.every((r) => r.versions[baseline]),
      'The previous SDK release is missing or partially published; complete it first.'
    );
  } else {
    for (let i = 0; i < packages.length; i++) {
      assert(
        registries[i].versions[latest],
        `Partial release ${latest}: ${packages[i]} is missing. Retry Publish stable release from the original commit before preparing another release.`
      );
    }
    assert.notEqual(
      bump,
      'major',
      `SDK ${sdk} already has a release. Upgrade the checkout to the next Expo SDK before choosing major.`
    );
    const [major, minor, patch] = parseVersion(latest);
    version = bump === 'minor' ? `${major}.${minor + 1}.0` : `${major}.${minor}.${patch + 1}`;
  }
  parseVersion(version);
  for (let i = 0; i < localVersions.length; i++) {
    const local = localVersions[i];
    const allowed = local === version || local === baseline;
    assert(
      allowed,
      `${packages[i]} is ${local}, but ${bump} for SDK ${sdk} means ${version}${latest ? ` (published baseline ${latest})` : ''}. Resolve this version conflict; no files were changed.`
    );
  }
  return {
    version,
    latest: latest ?? null,
    baseline,
    reusedManualBump: localVersions.includes(version),
  };
}

export async function registry(name) {
  const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`, {
    signal: AbortSignal.timeout(30000),
    headers: { 'Cache-Control': 'no-cache' },
  });
  assert(
    response.ok,
    `${name}: npm registry returned HTTP ${response.status}; refusing to infer a version.`
  );
  const result = await response.json();
  assert(
    result.name === name &&
      result.versions &&
      typeof result.versions === 'object' &&
      !Array.isArray(result.versions),
    `${name}: invalid registry response`
  );
  return result;
}

export function releaseChangelog(text, version, date) {
  assert(/^\d{4}-\d{2}-\d{2}$/.test(date), 'Invalid release date');
  if (text.includes(`## ${version} — `)) return text;
  const match = /^## Unpublished\s*\n([\s\S]*?)(?=^## |$(?![\s\S]))/m.exec(text);
  assert(match, 'Changelog must have an Unpublished section');
  const blocks = match[1]
    .trim()
    .split(/(?=^### )/m)
    .filter(Boolean);
  const nonempty = blocks.filter((block) => block.replace(/^### .*\n?/, '').trim());
  const empty = blocks
    .map((block) => (block.startsWith('### ') ? block.split('\n')[0] : ''))
    .filter(Boolean)
    .join('\n\n');
  const notes =
    nonempty.map((block) => block.trim()).join('\n\n') ||
    '_This version does not introduce any user-facing changes._';
  return text.replace(
    match[0],
    `## Unpublished\n\n${empty}\n\n## ${version} — ${date}\n\n${notes}\n\n`
  );
}

function compatibility(text, version, sdk, core) {
  const lines = text.split('\n');
  const rows = lines
    .map((line, i) => ({ cells: line.split('|').map((c) => c.trim()), i }))
    .filter(({ cells }) => cells.length >= 4 && /^\d+\.\d+\.\d+/.test(cells[1]));
  const sameSdk = rows.filter(({ cells }) => cells[core ? 2 : 3] === String(sdk));
  if (core) {
    const row = sameSdk[0];
    if (row) {
      const first = row.cells[1].split('-')[0].replace(/ \(unreleased\)/, '');
      lines[row.i] = `| ${first === version ? version : `${first}-${version}`} | ${sdk} |`;
    } else {
      assert(rows.length, 'Core README compatibility table missing');
      lines.splice(rows[0].i, 0, `| ${version} | ${sdk} |`);
    }
  } else {
    const existing = sameSdk.find(({ cells }) => cells[1].replace(' (unreleased)', '') === version);
    const source = existing ?? sameSdk[0];
    assert(
      source,
      `README needs an upstream compatibility row for SDK ${sdk}; the release workflow cannot invent upstream compatibility.`
    );
    assert.equal(parseVersion(source.cells[2])[0], sdk, 'Upstream compatibility SDK mismatch');
    const line = `| ${version} | ${source.cells[2]} | ${sdk} |`;
    if (existing) lines[existing.i] = line;
    else lines.splice(source.i, 0, line);
  }
  return lines.join('\n');
}

function replaceOne(text, pattern, replacement, label) {
  assert.equal([...text.matchAll(pattern)].length, 1, `Expected exactly one ${label}`);
  return text.replace(pattern, replacement);
}

export function planChanges(directory, version, date) {
  const sdk = parseVersion(version)[0];
  const changes = new Map();
  for (const name of packages) {
    const path = `${name}/package.json`;
    const manifest = json(join(directory, path));
    manifest.version = version;
    if (manifest.peerDependencies?.['expo-horizon-core']) {
      const peer = manifest.peerDependencies['expo-horizon-core'];
      assert(
        /^\^\d+\.\d+\.\d+$/.test(peer),
        `${name}: review unsupported internal peer range ${peer}`
      );
      if (parseVersion(peer.slice(1))[0] !== sdk)
        manifest.peerDependencies['expo-horizon-core'] = `^${sdk}.0.0`;
    }
    changes.set(path, `${JSON.stringify(manifest, null, 2)}\n`);
    const readme = `${name}/README.md`;
    changes.set(
      readme,
      compatibility(
        readFileSync(join(directory, readme), 'utf8'),
        version,
        sdk,
        name === packages[0]
      )
    );
    if (name === packages[0]) continue; // Core's Android versionName is not the npm release version.
    const gradle = `${name}/android/build.gradle`;
    let content = readFileSync(join(directory, gradle), 'utf8');
    content = replaceOne(
      content,
      /^version = ['"][^'"]+['"]$/gm,
      `version = '${version}'`,
      `${name} Gradle version`
    );
    content = replaceOne(
      content,
      /^(\s*)versionName ['"][^'"]+['"]$/gm,
      `$1versionName '${version}'`,
      `${name} Gradle versionName`
    );
    changes.set(gradle, content);
    const changelog = `${name}/CHANGELOG.md`;
    changes.set(
      changelog,
      releaseChangelog(readFileSync(join(directory, changelog), 'utf8'), version, date)
    );
  }
  return changes;
}

export function validatePrepared(directory) {
  const manifests = packages.map((name) => json(join(directory, name, 'package.json')));
  const version = manifests[0].version;
  const sdk = parseVersion(version)[0];
  assert(
    manifests.every((m, i) => m.name === packages[i] && m.version === version),
    'All three package versions must match before publishing'
  );
  assert.equal(
    sdkMajor(json(join(directory, 'example/package.json')).dependencies.expo),
    sdk,
    'Example Expo SDK does not match the release'
  );
  assert.equal(
    sdkMajor(manifests[0].devDependencies.expo),
    sdk,
    'Core Expo SDK does not match the release'
  );
  for (const name of packages) {
    const readme = readFileSync(join(directory, name, 'README.md'), 'utf8');
    // Compare without table padding, which Prettier adjusts independently.
    const normalize = (text) => text.replace(/ +/g, ' ');
    assert.equal(
      normalize(compatibility(readme, version, sdk, name === packages[0])),
      normalize(readme),
      `${name}: compatibility table is stale`
    );
  }
  for (const name of packages.slice(1)) {
    const gradle = readFileSync(join(directory, name, 'android/build.gradle'), 'utf8');
    assert.equal(
      /^version = ['"]([^'"]+)['"]$/m.exec(gradle)?.[1],
      version,
      `${name}: Gradle version is stale`
    );
    assert.equal(
      /^\s*versionName ['"]([^'"]+)['"]$/m.exec(gradle)?.[1],
      version,
      `${name}: Android versionName is stale`
    );
    assert(
      readFileSync(join(directory, name, 'CHANGELOG.md'), 'utf8').includes(`## ${version} — `),
      `${name}: release notes missing`
    );
    const peer = json(join(directory, name, 'package.json')).peerDependencies['expo-horizon-core'];
    assert(
      /^\^\d+\.\d+\.\d+$/.test(peer) &&
        parseVersion(peer.slice(1))[0] === sdk &&
        compare(peer.slice(1), version) <= 0,
      `${name}: incompatible core peer dependency`
    );
  }
  return version;
}

export function publicationPlan(packed, registries, version) {
  assert.equal(packed.length, packages.length);
  assert.equal(registries.length, packages.length);
  const plan = packed.map((pack, i) => {
    assert.equal(pack.name, packages[i]);
    assert.equal(pack.version, version);
    assert(
      /^sha512-[A-Za-z0-9+/]+=*$/.test(pack.integrity ?? ''),
      `${pack.name}: missing package integrity`
    );
    const newest = stableVersions(registries[i])
      .filter((v) => parseVersion(v)[0] === parseVersion(version)[0])
      .sort(compare)
      .at(-1);
    assert(
      !newest || compare(newest, version) <= 0,
      `${pack.name}: ${version} is older than the published SDK release ${newest}`
    );
    const existing = registries[i].versions[version];
    if (existing)
      assert(
        existing.dist?.integrity === pack.integrity,
        `${pack.name}@${version} already exists with different contents. Retry from the original release commit; never bump just to repair a partial release.`
      );
    const latest = registries[i]['dist-tags']?.latest;
    if (latest) parseVersion(latest);
    return {
      name: pack.name,
      skip: !!existing,
      tag: latest && compare(latest, version) > 0 ? `sdk-${parseVersion(version)[0]}` : 'latest',
    };
  });
  if (!plan.some((p) => p.skip)) {
    const [sdk, minor, patch] = parseVersion(version);
    // A manually prepared commit cannot bypass the baseline/partial-release checks.
    resolveRelease({
      sdk,
      localVersions: packages.map(() => version),
      registries,
      bump: patch > 0 ? 'patch' : minor > 0 ? 'minor' : 'major',
    });
  }
  return plan;
}

function checkTag(version, sha) {
  const tag = `refs/tags/v${version}`;
  const lines = output('git', ['ls-remote', 'origin', tag, `${tag}^{}`])
    .split('\n')
    .filter(Boolean);
  if (!lines.length) return false;
  const peeled = lines.find((line) => line.endsWith('^{}')) ?? lines[0];
  assert.equal(peeled.split(/\s/)[0], sha, `Tag v${version} belongs to a different commit`);
  return true;
}

function summary(text) {
  console.log(text);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${text}\n`);
}

export async function prepare(directory, bump, registries, date) {
  const sdk = sdkMajor(json(join(directory, 'example/package.json')).dependencies.expo);
  assert.equal(
    sdkMajor(json(join(directory, packages[0], 'package.json')).devDependencies.expo),
    sdk,
    'Core and example Expo SDKs disagree'
  );
  const plan = resolveRelease({
    sdk,
    bump,
    registries,
    localVersions: packages.map((name) => json(join(directory, name, 'package.json')).version),
  });
  for (const name of packages.slice(1)) {
    const gradle = readFileSync(join(directory, name, 'android/build.gradle'), 'utf8');
    for (const pattern of [/^version = ['"]([^'"]+)['"]$/m, /^\s*versionName ['"]([^'"]+)['"]$/m]) {
      const current = pattern.exec(gradle)?.[1];
      assert(
        [plan.baseline, plan.version].includes(current),
        `${name}: conflicting Android version ${current}; expected ${plan.baseline} or ${plan.version}. No files were changed.`
      );
    }
  }
  // Compute and validate every edit before touching any file.
  const changes = planChanges(directory, plan.version, date);
  for (const [path, contents] of changes) writeFileSync(join(directory, path), contents);
  return plan;
}

async function publish(dryRun) {
  const version = validatePrepared(root);
  assert.equal(
    output('git', ['status', '--porcelain', '--untracked-files=no']),
    '',
    'Commit release preparation before publishing'
  );
  const sha = output('git', ['rev-parse', 'HEAD']);
  const tagged = checkTag(version, sha);
  const destination =
    process.env.RELEASE_ARTIFACTS || mkdtempSync(join(tmpdir(), 'horizon-release-'));
  mkdirSync(destination, { recursive: true });
  const packed = [];
  for (const name of packages) {
    const path = join(root, name, 'package.json');
    const original = readFileSync(path, 'utf8');
    try {
      // Bind retries to the exact source commit as well as the generated package contents.
      writeFileSync(
        path,
        `${JSON.stringify({ ...JSON.parse(original), gitHead: sha }, null, 2)}\n`
      );
      const [pack] = JSON.parse(
        output(
          'npm',
          ['pack', '--ignore-scripts', '--json', '--pack-destination', destination],
          join(root, name)
        )
      );
      const files = new Set(pack.files.map((file) => file.path));
      for (const file of [
        'build/index.js',
        'build/index.d.ts',
        'app.plugin.js',
        'expo-module.config.json',
        'android/build.gradle',
        `plugin/build/${name === packages[0] ? 'withHorizon' : name === packages[1] ? 'withLocation' : 'withNotifications'}.js`,
        `ios/${name === packages[0] ? 'ExpoHorizon' : name === packages[1] ? 'ExpoLocation' : 'ExpoNotifications'}.podspec`,
        ...(name === packages[0] ? ['plugin.js', 'plugin.d.ts', 'plugin/build/plugin.js'] : []),
      ])
        assert(files.has(file), `${name}: tarball missing ${file}`);
      for (const prefix of ['android/src/main/', 'android/src/mobile/', 'android/src/quest/'])
        assert(
          [...files].some((file) => file.startsWith(prefix)),
          `${name}: tarball missing ${prefix}`
        );
      packed.push(pack);
    } finally {
      writeFileSync(path, original);
    }
  }
  const registries = await Promise.all(packages.map(registry));
  const plan = publicationPlan(packed, registries, version);
  summary(
    `Release ${version}; source ${sha}; dry run: ${dryRun}.\n\n| Package | Plan | npm tag |\n| --- | --- | --- |\n${plan.map((p) => `| ${p.name} | ${p.skip ? 'Already published; identical artifact' : 'Publish'} | ${p.tag} |`).join('\n')}`
  );
  // Every package must pass its publish dry run before the first real upload.
  for (let i = 0; i < plan.length; i++) {
    if (plan[i].skip) continue;
    execFileSync(
      'npm',
      [
        'publish',
        join(destination, packed[i].filename),
        '--dry-run',
        '--provenance',
        '--tag',
        plan[i].tag,
      ],
      { stdio: 'inherit', cwd: root }
    );
  }
  if (dryRun) return;
  for (let i = 0; i < plan.length; i++) {
    if (plan[i].skip) continue;
    execFileSync(
      'npm',
      ['publish', join(destination, packed[i].filename), '--provenance', '--tag', plan[i].tag],
      { stdio: 'inherit', cwd: root }
    );
    summary(`Published ${plan[i].name}@${version}.`);
  }
  // npm is not atomic: a retry skips only identical artifacts. Tag only a complete release.
  for (let attempt = 0; attempt < 6; attempt++) {
    const current = await Promise.all(packages.map(registry));
    if (publicationPlan(packed, current, version).every((p) => p.skip)) break;
    assert(attempt < 5, 'npm has not confirmed the complete release. Retry from the same commit.');
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  if (!tagged) {
    output('git', ['tag', '-a', `v${version}`, sha, '-m', `Release ${version}`]);
    output('git', ['push', 'origin', `refs/tags/v${version}`]);
  }
  summary(`All three packages verified; release tag v${version} points to ${sha}.`);
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const command = process.argv[2];
  if (command === 'prepare') {
    const registries = await Promise.all(packages.map(registry));
    const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw' }).format(new Date());
    const plan = await prepare(root, process.env.RELEASE_BUMP, registries, date);
    summary(
      `Prepared ${plan.version}${plan.reusedManualBump ? ' (reused the manual version bump)' : ''}; published SDK baseline: ${plan.latest ?? 'first release'}.`
    );
    if (process.env.GITHUB_OUTPUT)
      appendFileSync(process.env.GITHUB_OUTPUT, `version=${plan.version}\n`);
  } else if (command === 'check') {
    console.log(validatePrepared(root));
  } else if (command === 'publish') {
    assert(
      ['true', 'false'].includes(process.env.RELEASE_DRY_RUN),
      'RELEASE_DRY_RUN must explicitly be true or false'
    );
    await publish(process.env.RELEASE_DRY_RUN === 'true');
  } else {
    throw new Error('Usage: node scripts/release.mjs prepare|check|publish');
  }
}
