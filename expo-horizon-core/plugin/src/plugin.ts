import type { HorizonOptions } from './withHorizon';

/**
 * Config plugin that automatically configures your Android project for Meta Horizon by:
 *   - Adding a `quest` build flavor to `build.gradle`
 *   - Creating a Horizon-specific AndroidManifest.xml with required permissions and features
 *   - Configuring panel dimensions and supported devices
 *   - Setting up VR headtracking features
 */
export default function expoHorizonCorePlugin(props: HorizonOptions): [string, HorizonOptions] {
  return ['expo-horizon-core', props];
}
