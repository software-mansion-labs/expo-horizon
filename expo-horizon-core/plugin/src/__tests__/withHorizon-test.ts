import { AndroidConfig, compileModsAsync } from '@expo/config-plugins';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

import withHorizon, { HorizonOptions } from '../withHorizon';

// Exercise the real prebuild mod compiler and disk output, including dangerous mods.
jest.unmock('fs');

const mobileManifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
  <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
  <application android:name=".MainApplication" android:allowBackup="true" />
</manifest>`;

let projectRoot: string;

beforeEach(async () => {
  projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'horizon-plugin-test-'));
  await fs.mkdir(path.join(projectRoot, 'android/app/src/main'), { recursive: true });
  await fs.writeFile(
    path.join(projectRoot, 'android/app/src/main/AndroidManifest.xml'),
    mobileManifest
  );
  await fs.writeFile(path.join(projectRoot, 'android/app/build.gradle'), 'android {\n}\n');
  await fs.writeFile(
    path.join(projectRoot, 'android/gradle.properties'),
    'org.gradle.jvmargs=-Xmx2g\n'
  );
});

afterEach(async () => {
  await fs.rm(projectRoot, { recursive: true, force: true });
});

async function prebuild(options: HorizonOptions = {}) {
  await compileModsAsync(withHorizon({ name: 'test', slug: 'test' }, options), {
    projectRoot,
    platforms: ['android'],
  });
}

async function readOutput() {
  return Promise.all(
    ['app/src/quest/AndroidManifest.xml', 'app/build.gradle', 'gradle.properties'].map((file) =>
      fs.readFile(path.join(projectRoot, 'android', file), 'utf8')
    )
  );
}

it('keeps mobile permissions and backup settings while restricting the Quest overlay', async () => {
  await prebuild({ supportedDevices: 'quest3', defaultWidth: '1024dp' });
  expect(
    await fs.readFile(path.join(projectRoot, 'android/app/src/main/AndroidManifest.xml'), 'utf8')
  ).toBe(mobileManifest);
  const { manifest } = await AndroidConfig.Manifest.readAndroidManifestAsync(
    path.join(projectRoot, 'android/app/src/quest/AndroidManifest.xml')
  );
  expect(manifest['uses-permission']).toContainEqual({
    $: {
      'android:name': 'android.permission.ACCESS_BACKGROUND_LOCATION',
      'tools:node': 'remove',
    },
  });
  expect(manifest['uses-permission']).not.toContainEqual(
    expect.objectContaining({
      $: expect.objectContaining({ 'android:name': 'android.permission.ACCESS_FINE_LOCATION' }),
    })
  );
  expect(manifest.application![0].$).toMatchObject({
    'android:allowBackup': 'false',
    'tools:replace': 'android:allowBackup',
  });
  expect(manifest.application![0]['meta-data']).toContainEqual({
    $: { 'android:name': 'com.oculus.supportedDevices', 'android:value': 'quest3' },
  });
});

it('produces identical output on repeated prebuild and updates the app ID once', async () => {
  await prebuild({ horizonAppId: '123' });
  const first = await readOutput();
  await prebuild({ horizonAppId: '123' });
  expect(await readOutput()).toEqual(first);
  await prebuild({ horizonAppId: '456' });
  const [, gradle, properties] = await readOutput();
  expect(gradle.match(/flavorDimensions/g)).toHaveLength(1);
  expect(gradle).toContain('mobile { dimension "device" }');
  expect(gradle).toContain('quest { dimension "device" }');
  expect(properties.match(/^horizonAppId=.*$/gm)).toEqual(['horizonAppId=456']);
  expect(properties).toContain('org.gradle.jvmargs=-Xmx2g');
});

it('applies Quest option changes without leaving old feature declarations', async () => {
  await prebuild();
  await prebuild({ allowBackup: true, disableVrHeadtracking: true });
  const { manifest } = await AndroidConfig.Manifest.readAndroidManifestAsync(
    path.join(projectRoot, 'android/app/src/quest/AndroidManifest.xml')
  );
  expect(manifest.application![0].$['android:allowBackup']).toBe('true');
  expect(manifest['uses-feature'] ?? []).not.toContainEqual(
    expect.objectContaining({
      $: expect.objectContaining({ 'android:name': 'android.hardware.vr.headtracking' }),
    })
  );
});

async function readQuestLayouts() {
  const { manifest } = await AndroidConfig.Manifest.readAndroidManifestAsync(
    path.join(projectRoot, 'android/app/src/quest/AndroidManifest.xml')
  );
  return manifest.application![0].activity?.find(
    (activity) => activity.$['android:name'] === '.MainActivity'
  )?.layout;
}

it.each(['defaultWidth', 'defaultHeight'] as const)(
  'supports a fractional %s independently',
  async (key) => {
    await prebuild({ [key]: '360.5dp' });
    expect(await readQuestLayouts()).toEqual([{ $: { [`android:${key}`]: '360.5dp' } }]);
  }
);

describe.each(['defaultWidth', 'defaultHeight'] as const)('%s', (key) => {
  it.each([
    '',
    '0dp',
    '-1dp',
    'NaNdp',
    'Infinitydp',
    'banana',
    '600',
    '600px',
    '50%',
    ' 600dp',
    '600dp\n',
    `${'9'.repeat(400)}dp`,
    600,
    null,
  ])('rejects invalid configuration %s', (value) => {
    expect(() =>
      withHorizon({ name: 'test', slug: 'test' }, { [key]: value } as HorizonOptions)
    ).toThrow(`${key} must be a positive dp dimension`);
  });
});

describe.each(['disableVrHeadtracking', 'allowBackup'] as const)('%s', (key) => {
  it.each(['true', 'false', 0, 1, null])('rejects non-boolean configuration %s', (value) => {
    expect(() =>
      withHorizon({ name: 'test', slug: 'test' }, { [key]: value } as HorizonOptions)
    ).toThrow(`${key} must be a boolean (true or false)`);
  });
});

it.each([123, null, ' ', '123\n456', '123\\456', '"123"', "'123'"])(
  'rejects an invalid app ID %s',
  (horizonAppId) => {
    expect(() =>
      withHorizon({ name: 'test', slug: 'test' }, { horizonAppId } as HorizonOptions)
    ).toThrow('horizonAppId must be a string without whitespace, quotes, or backslashes');
  }
);

it.each(['', 'DEMO_APP_ID', '12345678901234567890'])(
  'preserves an unset, placeholder, or large string app ID %s',
  async (horizonAppId) => {
    await prebuild({ horizonAppId });
    const [, , properties] = await readOutput();
    expect(properties.match(/^horizonAppId=.*$/gm)).toEqual([`horizonAppId=${horizonAppId}`]);
  }
);

it.each([
  '',
  'quest3|',
  '|quest3',
  'quest2||quest3',
  'quest2,quest3',
  'quest2| quest3',
  'quest3\n',
  ['quest3'],
  null,
])('rejects a malformed supportedDevices list %s', (supportedDevices) => {
  expect(() =>
    withHorizon({ name: 'test', slug: 'test' }, { supportedDevices } as HorizonOptions)
  ).toThrow('supportedDevices must be a non-empty pipe-separated string of device names');
});

it('preserves device names without a fixed device allowlist and explicit false booleans', async () => {
  const supportedDevices = 'quest3|future-device_1';
  await prebuild({ supportedDevices, allowBackup: false, disableVrHeadtracking: false });
  const { manifest } = await AndroidConfig.Manifest.readAndroidManifestAsync(
    path.join(projectRoot, 'android/app/src/quest/AndroidManifest.xml')
  );
  expect(manifest.application![0]['meta-data']).toContainEqual({
    $: { 'android:name': 'com.oculus.supportedDevices', 'android:value': supportedDevices },
  });
  expect(manifest.application![0].$['android:allowBackup']).toBe('false');
  expect(manifest['uses-feature']).toContainEqual({
    $: {
      'android:name': 'android.hardware.vr.headtracking',
      'android:required': 'true',
      'android:version': '1',
    },
  });
});

it.each([null, false, 'quest3', 123, []])('rejects non-object plugin options %s', (options) => {
  expect(() => withHorizon({ name: 'test', slug: 'test' }, options as HorizonOptions)).toThrow(
    '[expo-horizon-core] Plugin options must be an object.'
  );
});

it('rejects invalid options before changing previously generated files', async () => {
  await prebuild({ horizonAppId: '123', defaultWidth: '1024dp' });
  const previousOutput = await readOutput();
  await expect(prebuild({ horizonAppId: '456', defaultWidth: '-100dp' })).rejects.toThrow(
    'defaultWidth must be a positive dp dimension'
  );
  expect(await readOutput()).toEqual(previousOutput);
});
