package expo.modules.location

import android.location.LocationManager

data class LocationRequest(
  val interval: Long,
  val minUpdateIntervalMillis: Long,
  val maxUpdateDelayMillis: Long,
  val minUpdateDistanceMeters: Float,
  val priority: Int
) {
  companion object {
    const val PRIORITY_HIGH_ACCURACY = LocationManager.GPS_PROVIDER
    const val PRIORITY_BALANCED_POWER_ACCURACY = LocationManager.NETWORK_PROVIDER
    const val PRIORITY_LOW_POWER = LocationManager.PASSIVE_PROVIDER
    const val PRIORITY_NO_POWER = LocationManager.PASSIVE_PROVIDER
  }
} 