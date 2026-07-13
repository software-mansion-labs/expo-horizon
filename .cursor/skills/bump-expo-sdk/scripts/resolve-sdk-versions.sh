#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 <path-to-expo-repo> <git-ref>" >&2
  exit 1
}

EXPO_REPO="${1:-}"
REF="${2:-}"

if [[ -z "${EXPO_REPO}" || -z "${REF}" ]]; then
  usage
fi

if ! git -C "${EXPO_REPO}" rev-parse --git-dir >/dev/null 2>&1; then
  echo "Not a git repository: ${EXPO_REPO}" >&2
  exit 1
fi

COMMIT="$(git -C "${EXPO_REPO}" rev-parse --verify "${REF}^{commit}" 2>/dev/null)" || {
  echo "Git ref not found in ${EXPO_REPO}: ${REF}" >&2
  exit 1
}

read_json_at_ref() {
  local path="$1"
  git -C "${EXPO_REPO}" show "${COMMIT}:${path}" 2>/dev/null || {
    echo "Missing ${path} at ${REF}" >&2
    exit 1
  }
}

EXPO_PACKAGE="$(read_json_at_ref packages/expo/package.json)"
LOCATION_PACKAGE="$(read_json_at_ref packages/expo-location/package.json)"
NOTIFICATIONS_PACKAGE="$(read_json_at_ref packages/expo-notifications/package.json)"
APPLICATION_PACKAGE="$(read_json_at_ref packages/expo-application/package.json)"
CONSTANTS_PACKAGE="$(read_json_at_ref packages/expo-constants/package.json)"
MODULE_SCRIPTS_PACKAGE="$(read_json_at_ref packages/expo-module-scripts/package.json)"

node - \
  "${REF}" \
  "${COMMIT}" \
  "${EXPO_PACKAGE}" \
  "${LOCATION_PACKAGE}" \
  "${NOTIFICATIONS_PACKAGE}" \
  "${APPLICATION_PACKAGE}" \
  "${CONSTANTS_PACKAGE}" \
  "${MODULE_SCRIPTS_PACKAGE}" <<'NODE'
const [
  ref,
  commit,
  expoJson,
  locationJson,
  notificationsJson,
  applicationJson,
  constantsJson,
  moduleScriptsJson,
] = process.argv.slice(2);

const parse = JSON.parse;
const expo = parse(expoJson);
const location = parse(locationJson);
const notifications = parse(notificationsJson);
const application = parse(applicationJson);
const constants = parse(constantsJson);
const moduleScripts = parse(moduleScriptsJson);
const sdkMajor = Number.parseInt(expo.version, 10);

if (!Number.isInteger(sdkMajor)) {
  throw new Error(`Cannot derive Expo SDK major from expo version: ${expo.version}`);
}

const pick = (object, key) =>
  object.dependencies?.[key] ??
  object.devDependencies?.[key] ??
  object.peerDependencies?.[key] ??
  null;

console.log(
  JSON.stringify(
    {
      ref,
      commit,
      sdkMajor,
      expoVersion: expo.version,
      suggestedHorizonVersion: `${sdkMajor}.0.0`,
      upstream: {
        expoLocation: location.version,
        expoNotifications: notifications.version,
        expoApplication: application.version,
        expoConstants: constants.version,
        expoModuleScripts: moduleScripts.version,
      },
      notificationDependencyRanges: {
        expoApplication: pick(notifications, 'expo-application'),
        expoConstants: pick(notifications, 'expo-constants'),
      },
    },
    null,
    2
  )
);
NODE
