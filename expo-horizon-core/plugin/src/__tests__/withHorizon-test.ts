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
