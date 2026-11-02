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

async function prebuild(options: HorizonOptions) {
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
  await prebuild({ supportedDevices: 'quest3', horizonAppId: '123' });
  const first = await readOutput();
  await prebuild({ supportedDevices: 'quest3', horizonAppId: '123' });
  expect(await readOutput()).toEqual(first);
  await prebuild({ supportedDevices: 'quest3', horizonAppId: '456' });
  const [, gradle, properties] = await readOutput();
  expect(gradle.match(/flavorDimensions/g)).toHaveLength(1);
  expect(gradle).toContain('mobile { dimension "device" }');
  expect(gradle).toContain('quest { dimension "device" }');
  expect(properties.match(/^horizonAppId=.*$/gm)).toEqual(['horizonAppId=456']);
  expect(properties).toContain('org.gradle.jvmargs=-Xmx2g');
});

it('applies Quest option changes without leaving old feature declarations', async () => {
  await prebuild({ supportedDevices: 'quest3' });
  await prebuild({ supportedDevices: 'quest3', allowBackup: true, disableVrHeadtracking: true });
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

it.each([
  undefined,
  null,
  false,
  [],
  {},
  { supportedDevices: undefined },
  { supportedDevices: null },
  { supportedDevices: 123 },
  { supportedDevices: '' },
  { supportedDevices: ' ' },
  { supportedDevices: 'quest2,quest3' },
  { supportedDevices: 'quest2||quest3' },
  { supportedDevices: '|quest3' },
  { supportedDevices: 'quest3|' },
  { supportedDevices: 'quest2| quest3' },
])('rejects missing or malformed device configuration %j', (options) => {
  expect(() => withHorizon({ name: 'test', slug: 'test' }, options as HorizonOptions)).toThrow(
    '[expo-horizon-core] supportedDevices is required and must be a non-empty pipe-separated string'
  );
});

it('preserves an explicit device list without a fixed model allowlist', async () => {
  const supportedDevices = 'quest3|future-device_1';
  await prebuild({ supportedDevices });
  const { manifest } = await AndroidConfig.Manifest.readAndroidManifestAsync(
    path.join(projectRoot, 'android/app/src/quest/AndroidManifest.xml')
  );
  expect(manifest.application![0]['meta-data']).toContainEqual({
    $: { 'android:name': 'com.oculus.supportedDevices', 'android:value': supportedDevices },
  });
});

it('rejects an omitted device list before changing previously generated files', async () => {
  await prebuild({ supportedDevices: 'quest3', horizonAppId: '123' });
  const previousOutput = await readOutput();
  await expect(prebuild({ horizonAppId: '456' } as HorizonOptions)).rejects.toThrow(
    'supportedDevices is required'
  );
  expect(await readOutput()).toEqual(previousOutput);
});

it('writes namespaced Horizon SDK settings only to the Quest overlay', async () => {
  await prebuild({
    supportedDevices: 'quest3',
    horizonMinSdkVersion: 207,
    horizonTargetSdkVersion: 208,
  });
  const [questManifest] = await readOutput();
  expect(questManifest).toContain('xmlns:metavr="http://schemas.meta.com/metavr-sdk"');
  expect(questManifest).toContain(
    '<metavr:uses-metavr-sdk metavr:minSdkVersion="207" metavr:targetSdkVersion="208"/>'
  );
  expect(
    await fs.readFile(path.join(projectRoot, 'android/app/src/main/AndroidManifest.xml'), 'utf8')
  ).toBe(mobileManifest);
  const first = await readOutput();
  await prebuild({
    supportedDevices: 'quest3',
    horizonMinSdkVersion: 207,
    horizonTargetSdkVersion: 208,
  });
  expect(await readOutput()).toEqual(first);
});

it('supports either SDK setting alone and removes declarations when options are removed', async () => {
  await prebuild({ supportedDevices: 'quest3', horizonMinSdkVersion: 207 });
  let [questManifest] = await readOutput();
  expect(questManifest).toContain('<metavr:uses-metavr-sdk metavr:minSdkVersion="207"/>');
  expect(questManifest).not.toContain('metavr:targetSdkVersion');

  await prebuild({ supportedDevices: 'quest3', horizonTargetSdkVersion: 208 });
  [questManifest] = await readOutput();
  expect(questManifest).toContain('<metavr:uses-metavr-sdk metavr:targetSdkVersion="208"/>');
  expect(questManifest).not.toContain('metavr:minSdkVersion');

  await prebuild({ supportedDevices: 'quest3' });
  [questManifest] = await readOutput();
  expect(questManifest).not.toContain('metavr');
});

describe.each(['horizonMinSdkVersion', 'horizonTargetSdkVersion'] as const)('%s', (key) => {
  it.each([60, -1, 0, 207.5, NaN, Infinity, 2147483648, '207', null])(
    'rejects invalid configuration %s',
    (version) => {
      expect(() =>
        withHorizon({ name: 'test', slug: 'test' }, {
          supportedDevices: 'quest3',
          [key]: version,
        } as HorizonOptions)
      ).toThrow(`${key} must be an integer between 61 and 2147483647`);
    }
  );
});

it('rejects a target SDK lower than the minimum', () => {
  expect(() =>
    withHorizon(
      { name: 'test', slug: 'test' },
      { supportedDevices: 'quest3', horizonMinSdkVersion: 208, horizonTargetSdkVersion: 207 }
    )
  ).toThrow('horizonTargetSdkVersion must be greater than or equal to horizonMinSdkVersion');
});

async function readQuestLayouts() {
  const { manifest } = await AndroidConfig.Manifest.readAndroidManifestAsync(
    path.join(projectRoot, 'android/app/src/quest/AndroidManifest.xml')
  );
  return manifest.application![0].activity?.find(
    (activity) => activity.$['android:name'] === '.MainActivity'
  )?.layout;
}

it('writes default and minimum panel dimensions only to the Quest overlay', async () => {
  const options = {
    defaultWidth: '1024dp',
    defaultHeight: '640dp',
    minWidth: '600dp',
    minHeight: '400dp',
  };
  await prebuild({ supportedDevices: 'quest3', ...options });
  expect(await readQuestLayouts()).toEqual([
    {
      $: {
        'android:defaultWidth': '1024dp',
        'android:defaultHeight': '640dp',
        'android:minWidth': '600dp',
        'android:minHeight': '400dp',
      },
    },
  ]);
  expect(
    await fs.readFile(path.join(projectRoot, 'android/app/src/main/AndroidManifest.xml'), 'utf8')
  ).toBe(mobileManifest);
  const first = await readOutput();
  await prebuild({ supportedDevices: 'quest3', ...options });
  expect(await readOutput()).toEqual(first);
});

it.each(['minWidth', 'minHeight'] as const)(
  'supports %s without default dimensions',
  async (key) => {
    await prebuild({ supportedDevices: 'quest3', [key]: '360.5dp' });
    expect(await readQuestLayouts()).toEqual([{ $: { [`android:${key}`]: '360.5dp' } }]);
  }
);

it('updates and removes panel minimums without retaining stale attributes', async () => {
  await prebuild({
    supportedDevices: 'quest3',
    defaultWidth: '1024dp',
    minWidth: '600dp',
    minHeight: '400dp',
  });
  await prebuild({ supportedDevices: 'quest3', defaultWidth: '1024dp', minWidth: '500dp' });
  expect(await readQuestLayouts()).toEqual([
    { $: { 'android:defaultWidth': '1024dp', 'android:minWidth': '500dp' } },
  ]);
  await prebuild({ supportedDevices: 'quest3', defaultWidth: '1024dp' });
  expect(await readQuestLayouts()).toEqual([{ $: { 'android:defaultWidth': '1024dp' } }]);
  await prebuild({ supportedDevices: 'quest3' });
  expect(await readQuestLayouts()).toBeUndefined();
});

describe.each(['minWidth', 'minHeight'] as const)('%s', (key) => {
  it.each(['', '0dp', '-1dp', 'NaNdp', 'Infinitydp', '600', '600px', '50%', ' 600dp', 600, null])(
    'rejects invalid configuration %s',
    (value) => {
      expect(() =>
        withHorizon({ name: 'test', slug: 'test' }, {
          supportedDevices: 'quest3',
          [key]: value,
        } as HorizonOptions)
      ).toThrow(`${key} must be a positive dp dimension`);
    }
  );
});
