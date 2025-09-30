import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as TaskManager from "expo-task-manager";
import * as Location from "expo-quest-location";
import { Section, SectionTitle } from "../components/Section";

export default function LocationScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [lastKnownLocation, setLastKnownLocation] =
    useState<Location.LocationObject | null>(null);
  const [heading, setHeading] = useState<Location.LocationHeadingObject | null>(
    null
  );
  const [providerStatus, setProviderStatus] =
    useState<Location.LocationProviderStatus | null>(null);
  const [permissions, setPermissions] =
    useState<Location.LocationPermissionResponse | null>(null);
  const [backgroundPermissions, setBackgroundPermissions] = useState<any>(null);
  const [servicesEnabled, setServicesEnabled] = useState<boolean | null>(null);
  const [backgroundLocationAvailable, setBackgroundLocationAvailable] =
    useState<boolean | null>(null);
  const [locationUpdatesActive, setLocationUpdatesActive] = useState(false);
  const [geofencingActive, setGeofencingActive] = useState(false);
  const [geocodedAddress, setGeocodedAddress] = useState<
    Location.LocationGeocodedAddress[] | null
  >(null);
  const [geocodedLocation, setGeocodedLocation] = useState<
    Location.LocationGeocodedLocation[] | null
  >(null);
  const [locationSubscription, setLocationSubscription] =
    useState<Location.LocationSubscription | null>(null);
  const [headingSubscription, setHeadingSubscription] =
    useState<Location.LocationSubscription | null>(null);

  // Loading states for async operations
  const [loadingStates, setLoadingStates] = useState<{
    [key: string]: boolean;
  }>({});

  // Helper function to set loading state
  const setLoading = (operation: string, isLoading: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [operation]: isLoading }));
  };

  // Helper function to check if operation is loading
  const isLoading = (operation: string) => loadingStates[operation] || false;

  useEffect(() => {
    checkInitialStatus();
    setupTaskManager();
  }, []);

  const setupTaskManager = () => {
    // Define background tasks
    TaskManager.defineTask(
      "test-location-task",
      ({ data, error }: { data: any; error: any }) => {
        if (error) {
          console.error("Location task error:", error);
          return;
        }
        console.log("Location task data:", data);
      }
    );

    TaskManager.defineTask(
      "test-geofencing-task",
      ({ data, error }: { data: any; error: any }) => {
        if (error) {
          console.error("Geofencing task error:", error);
          return;
        }
        console.log("Geofencing task data:", data);
      }
    );
  };

  const checkInitialStatus = async () => {
    try {
      setLoading("checkInitialStatus", true);
      const status = await Location.getProviderStatusAsync();
      setProviderStatus(status);

      const services = await Location.hasServicesEnabledAsync();
      setServicesEnabled(services);

      const available = await Location.isBackgroundLocationAvailableAsync();
      setBackgroundLocationAvailable(available);

      const perms = await Location.getForegroundPermissionsAsync();
      setPermissions(perms);

      const bgPerms = await Location.getBackgroundPermissionsAsync();
      setBackgroundPermissions(bgPerms);
    } catch (error) {
      console.error("Error checking initial status:", error);
    } finally {
      setLoading("checkInitialStatus", false);
    }
  };

  const requestForegroundPermissions = async () => {
    try {
      setLoading("requestForegroundPermissions", true);
      const result = await Location.requestForegroundPermissionsAsync();
      setPermissions(result);
      Alert.alert("Foreground Permissions", `Status: ${result.status}`);
    } catch (error) {
      Alert.alert(
        "Error",
        `Failed to request foreground permissions: ${error}`
      );
    } finally {
      setLoading("requestForegroundPermissions", false);
    }
  };

  const requestBackgroundPermissions = async () => {
    try {
      setLoading("requestBackgroundPermissions", true);
      const result = await Location.requestBackgroundPermissionsAsync();
      setBackgroundPermissions(result);
      Alert.alert("Background Permissions", `Status: ${result.status}`);
    } catch (error) {
      Alert.alert(
        "Error",
        `Failed to request background permissions: ${error}`
      );
    } finally {
      setLoading("requestBackgroundPermissions", false);
    }
  };

  const getCurrentPosition = async () => {
    try {
      setLoading("getCurrentPosition", true);

      // Check if location services are enabled
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert(
          "Location Services",
          "Location services are disabled. Please enable them in device settings."
        );
        return;
      }

      // Check permissions
      const permissions = await Location.getForegroundPermissionsAsync();
      if (permissions.status !== "granted") {
        Alert.alert(
          "Permissions Required",
          "Location permissions are required. Please grant them in settings."
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 20000, // 20 second timeout for emulator
        maximumAge: 60000, // Accept cached location up to 1 minute old
      });
      setLocation(position);
      Alert.alert(
        "Current Position",
        `Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}\nAccuracy: ${position.coords.accuracy}m`
      );
    } catch (error) {
      console.error("Get current position error:", error);
      Alert.alert(
        "Error",
        `Failed to get current position: ${error}\n\nFor Android emulator:\n1. Enable location in emulator settings\n2. Set a route in Extended Controls\n3. Start route playback`
      );
    } finally {
      setLoading("getCurrentPosition", false);
    }
  };

  const getLastKnownPosition = async () => {
    try {
      setLoading("getLastKnownPosition", true);
      const position = await Location.getLastKnownPositionAsync({
        maxAge: 60000, // 1 minute
        requiredAccuracy: 100, // 100 meters
      });
      setLastKnownLocation(position);
      if (position) {
        Alert.alert(
          "Last Known Position",
          `Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}`
        );
      } else {
        Alert.alert("Last Known Position", "No last known position available");
      }
    } catch (error) {
      Alert.alert("Error", `Failed to get last known position: ${error}`);
    } finally {
      setLoading("getLastKnownPosition", false);
    }
  };

  const startLocationWatching = async () => {
    try {
      setLoading("startLocationWatching", true);

      // Check if location services are enabled
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert(
          "Location Services",
          "Location services are disabled. Please enable them in device settings."
        );
        return;
      }

      // Check permissions
      const permissions = await Location.getForegroundPermissionsAsync();
      if (permissions.status !== "granted") {
        Alert.alert(
          "Permissions Required",
          "Location permissions are required. Please grant them in settings."
        );
        return;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000, // More frequent updates for emulator
          distanceInterval: 1, // Smaller distance interval
          mayShowUserSettingsDialog: true, // Allow user to adjust settings
        },
        (newLocation: Location.LocationObject) => {
          setLocation(newLocation);
          console.log("Location update:", newLocation);
        },
        (error: string) => {
          console.error("Location watch error:", error);
          Alert.alert("Location Error", `Location watch error: ${error}`);
        }
      );
      setLocationSubscription(subscription);
      setLocationUpdatesActive(true);
      Alert.alert(
        "Location Watching",
        "Started watching location updates\n\nMake sure location is enabled in emulator settings."
      );
    } catch (error) {
      console.error("Location watching error:", error);
      Alert.alert(
        "Error",
        `Failed to start location watching: ${error}\n\nFor Android emulator:\n1. Enable location in emulator settings\n2. Set a route in Extended Controls\n3. Start route playback`
      );
    } finally {
      setLoading("startLocationWatching", false);
    }
  };

  const stopLocationWatching = () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
      setLocationUpdatesActive(false);
      Alert.alert("Location Watching", "Stopped watching location updates");
    }
  };

  const getHeading = async () => {
    try {
      setLoading("getHeading", true);
      const headingData = await Location.getHeadingAsync();
      setHeading(headingData);
      Alert.alert(
        "Heading",
        `True: ${headingData.trueHeading}°, Magnetic: ${headingData.magHeading}°`
      );
    } catch (error) {
      Alert.alert("Error", `Failed to get heading: ${error}`);
    } finally {
      setLoading("getHeading", false);
    }
  };

  const startHeadingWatching = async () => {
    try {
      setLoading("startHeadingWatching", true);
      const subscription = await Location.watchHeadingAsync(
        (newHeading: Location.LocationHeadingObject) => {
          setHeading(newHeading);
          console.log("Heading update:", newHeading);
        },
        (error: string) => {
          console.error("Heading watch error:", error);
        }
      );
      setHeadingSubscription(subscription);
      Alert.alert("Heading Watching", "Started watching heading updates");
    } catch (error) {
      Alert.alert("Error", `Failed to start heading watching: ${error}`);
    } finally {
      setLoading("startHeadingWatching", false);
    }
  };

  const stopHeadingWatching = () => {
    if (headingSubscription) {
      headingSubscription.remove();
      setHeadingSubscription(null);
      Alert.alert("Heading Watching", "Stopped watching heading updates");
    }
  };

  const geocodeAddress = async () => {
    try {
      setLoading("geocodeAddress", true);
      const locations = await Location.geocodeAsync(
        "1600 Pennsylvania Avenue NW, Washington, DC"
      );
      setGeocodedLocation(locations);
      if (locations.length > 0) {
        Alert.alert(
          "Geocoding Result",
          `Found ${locations.length} location(s)`
        );
      } else {
        Alert.alert("Geocoding Result", "No locations found");
      }
    } catch (error) {
      Alert.alert("Error", `Failed to geocode address: ${error}`);
    } finally {
      setLoading("geocodeAddress", false);
    }
  };

  const reverseGeocodeLocation = async () => {
    try {
      setLoading("reverseGeocodeLocation", true);
      const addresses = await Location.reverseGeocodeAsync({
        latitude: 38.8977,
        longitude: -77.0365,
      });
      setGeocodedAddress(addresses);
      if (addresses.length > 0) {
        Alert.alert(
          "Reverse Geocoding Result",
          `Found ${addresses.length} address(es)`
        );
      } else {
        Alert.alert("Reverse Geocoding Result", "No addresses found");
      }
    } catch (error) {
      Alert.alert("Error", `Failed to reverse geocode location: ${error}`);
    } finally {
      setLoading("reverseGeocodeLocation", false);
    }
  };

  const startBackgroundLocationUpdates = async () => {
    try {
      setLoading("startBackgroundLocationUpdates", true);

      // Check if background location is available
      const isAvailable = await Location.isBackgroundLocationAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          "Background Location",
          "Background location is not available on this device"
        );
        return;
      }

      // Check background permissions
      const bgPermissions = await Location.getBackgroundPermissionsAsync();
      if (bgPermissions.status !== "granted") {
        Alert.alert(
          "Permissions Required",
          "Background location permissions are required. Please grant them in settings."
        );
        return;
      }

      await Location.startLocationUpdatesAsync("test-location-task", {
        accuracy: Location.Accuracy.Balanced,
        activityType: Location.ActivityType.Fitness,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: "Location Tracking",
          notificationBody: "Tracking your location in the background",
          notificationColor: "#FF0000",
        },
      });
      setLocationUpdatesActive(true);
      Alert.alert("Background Location", "Started background location updates");
    } catch (error) {
      console.error("Background location error:", error);
      Alert.alert(
        "Error",
        `Failed to start background location updates: ${error}\n\nMake sure you have:\n1. Background location permissions\n2. Foreground service permissions\n3. App is not battery optimized`
      );
    } finally {
      setLoading("startBackgroundLocationUpdates", false);
    }
  };

  const stopBackgroundLocationUpdates = async () => {
    try {
      setLoading("stopBackgroundLocationUpdates", true);
      await Location.stopLocationUpdatesAsync("test-location-task");
      setLocationUpdatesActive(false);
      Alert.alert("Background Location", "Stopped background location updates");
    } catch (error) {
      Alert.alert(
        "Error",
        `Failed to stop background location updates: ${error}`
      );
    } finally {
      setLoading("stopBackgroundLocationUpdates", false);
    }
  };

  const startGeofencing = async () => {
    try {
      setLoading("startGeofencing", true);

      // Check if background location is available
      const isAvailable = await Location.isBackgroundLocationAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          "Geofencing",
          "Background location is not available on this device"
        );
        return;
      }

      // Check background permissions
      const bgPermissions = await Location.getBackgroundPermissionsAsync();
      if (bgPermissions.status !== "granted") {
        Alert.alert(
          "Permissions Required",
          "Background location permissions are required for geofencing. Please grant them in settings."
        );
        return;
      }

      const regions: Location.LocationRegion[] = [
        {
          identifier: "test-region-1",
          latitude: 38.8977,
          longitude: -77.0365,
          radius: 1000, // 1km
          notifyOnEnter: true,
          notifyOnExit: true,
        },
      ];
      await Location.startGeofencingAsync("test-geofencing-task", regions);
      setGeofencingActive(true);
      Alert.alert("Geofencing", "Started geofencing with test region");
    } catch (error) {
      console.error("Geofencing error:", error);
      Alert.alert(
        "Error",
        `Failed to start geofencing: ${error}\n\nMake sure you have:\n1. Background location permissions\n2. TaskManager is properly configured\n3. App is not battery optimized`
      );
    } finally {
      setLoading("startGeofencing", false);
    }
  };

  const stopGeofencing = async () => {
    try {
      setLoading("stopGeofencing", true);
      await Location.stopGeofencingAsync("test-geofencing-task");
      setGeofencingActive(false);
      Alert.alert("Geofencing", "Stopped geofencing");
    } catch (error) {
      Alert.alert("Error", `Failed to stop geofencing: ${error}`);
    } finally {
      setLoading("stopGeofencing", false);
    }
  };

  const enableNetworkProvider = async () => {
    if (Platform.OS === "android") {
      try {
        setLoading("enableNetworkProvider", true);
        await Location.enableNetworkProviderAsync();
        Alert.alert("Network Provider", "Network provider enabled");
      } catch (error) {
        Alert.alert("Error", `Failed to enable network provider: ${error}`);
      } finally {
        setLoading("enableNetworkProvider", false);
      }
    } else {
      Alert.alert(
        "Network Provider",
        "This method is only available on Android"
      );
    }
  };

  const checkLocationUpdatesStatus = async () => {
    try {
      setLoading("checkLocationUpdatesStatus", true);
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(
        "test-location-task"
      );
      Alert.alert("Location Updates Status", `Active: ${hasStarted}`);
    } catch (error) {
      Alert.alert("Error", `Failed to check location updates status: ${error}`);
    } finally {
      setLoading("checkLocationUpdatesStatus", false);
    }
  };

  const checkGeofencingStatus = async () => {
    try {
      setLoading("checkGeofencingStatus", true);
      const hasStarted = await Location.hasStartedGeofencingAsync(
        "test-geofencing-task"
      );
      Alert.alert("Geofencing Status", `Active: ${hasStarted}`);
    } catch (error) {
      Alert.alert("Error", `Failed to check geofencing status: ${error}`);
    } finally {
      setLoading("checkGeofencingStatus", false);
    }
  };

  const TestButton = ({
    title,
    onPress,
    color = "#007AFF",
    loadingKey,
  }: {
    title: string;
    onPress: () => void;
    color?: string;
    loadingKey?: string;
  }) => {
    const isButtonLoading = loadingKey ? isLoading(loadingKey) : false;

    return (
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: color },
          isButtonLoading && styles.buttonDisabled,
        ]}
        onPress={onPress}
        disabled={isButtonLoading}
      >
        <View style={styles.buttonContent}>
          {isButtonLoading && (
            <ActivityIndicator
              size="small"
              color="#fff"
              style={styles.loadingIndicator}
            />
          )}
          <Text style={styles.buttonText}>
            {isButtonLoading ? `${title}...` : title}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const StatusText = ({ label, value }: { label: string; value: any }) => (
    <Text style={styles.statusText}>
      <Text style={styles.statusLabel}>{label}: </Text>
      <Text style={styles.statusValue}>{String(value)}</Text>
    </Text>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Section title="Permissions">
          <TestButton
            title="Request Foreground Permissions"
            onPress={requestForegroundPermissions}
            loadingKey="requestForegroundPermissions"
          />
          <TestButton
            title="Request Background Permissions"
            onPress={requestBackgroundPermissions}
            loadingKey="requestBackgroundPermissions"
          />
          <StatusText label="Services Enabled" value={servicesEnabled} />
          <StatusText
            label="Foreground Permissions"
            value={permissions?.status}
          />
          <StatusText
            label="Background Permissions"
            value={backgroundPermissions?.status}
          />
        </Section>

        <Section title="Location">
          <TestButton
            title="Get Current Position"
            onPress={getCurrentPosition}
            loadingKey="getCurrentPosition"
          />
          <TestButton
            title="Get Last Known Position"
            onPress={getLastKnownPosition}
            loadingKey="getLastKnownPosition"
          />
          <TestButton
            title="Start Location Watching"
            onPress={startLocationWatching}
            loadingKey="startLocationWatching"
          />
          <TestButton
            title="Stop Location Watching"
            onPress={stopLocationWatching}
            color="#FF3B30"
          />
          <SectionTitle title="Current Location" />
          <Text style={styles.dataText}>
            Latitude: {location?.coords?.latitude || "Unknown"}
          </Text>
          <Text style={styles.dataText}>
            Longitude: {location?.coords?.longitude || "Unknown"}
          </Text>
          <Text style={styles.dataText}>
            Accuracy: {location?.coords?.accuracy || "Unknown"}m
          </Text>
          <Text style={styles.dataText}>
            Timestamp:{" "}
            {location?.timestamp
              ? new Date(location.timestamp).toLocaleString()
              : "Unknown"}
          </Text>
          <StatusText
            label="Background Location Available"
            value={backgroundLocationAvailable}
          />
          <StatusText
            label="Location Updates Active"
            value={locationUpdatesActive}
          />
        </Section>

        <Section title="Heading">
          <TestButton
            title="Get Heading"
            onPress={getHeading}
            loadingKey="getHeading"
          />
          <TestButton
            title="Start Heading Watching"
            onPress={startHeadingWatching}
            loadingKey="startHeadingWatching"
          />
          <TestButton
            title="Stop Heading Watching"
            onPress={stopHeadingWatching}
            color="#FF3B30"
          />
          <SectionTitle title="Current Heading" />
          <Text style={styles.dataText}>
            True Heading: {heading?.trueHeading || "Unknown"}°
          </Text>
          <Text style={styles.dataText}>
            Magnetic Heading: {heading?.magHeading || "Unknown"}°
          </Text>
          <Text style={styles.dataText}>
            Accuracy: {heading?.accuracy || "Unknown"}
          </Text>
        </Section>

        <Section title="Geocoding">
          <SectionTitle title="Geocoding" />
          <TestButton
            title="Geocode Address"
            onPress={geocodeAddress}
            loadingKey="geocodeAddress"
          />
          <TestButton
            title="Reverse Geocode Location"
            onPress={reverseGeocodeLocation}
            loadingKey="reverseGeocodeLocation"
          />
        </Section>

        <Section title="Geocoded Address">
          {geocodedAddress && geocodedAddress.length > 0 ? (
            geocodedAddress.map((address, index) => (
              <View key={index} style={styles.addressContainer}>
                <Text style={styles.dataText}>
                  Name: {address.name || "N/A"}
                </Text>
                <Text style={styles.dataText}>
                  Street: {address.street || ""} {address.streetNumber || ""}
                </Text>
                <Text style={styles.dataText}>
                  City: {address.city || "N/A"}
                </Text>
                <Text style={styles.dataText}>
                  Region: {address.region || "N/A"}
                </Text>
                <Text style={styles.dataText}>
                  Country: {address.country || "N/A"}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.dataText}>No geocoded addresses available</Text>
          )}
        </Section>

        <Section title="Geocoded Location">
          <SectionTitle title="Geocoded Location" />
          {geocodedLocation && geocodedLocation.length > 0 ? (
            geocodedLocation.map((loc, index) => (
              <View key={index} style={styles.locationContainer}>
                <Text style={styles.dataText}>Latitude: {loc.latitude}</Text>
                <Text style={styles.dataText}>Longitude: {loc.longitude}</Text>
                <Text style={styles.dataText}>
                  Accuracy: {loc.accuracy || "Unknown"}m
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.dataText}>No geocoded locations available</Text>
          )}
        </Section>

        <Section title="Status">
          <StatusText label="Geofencing Active" value={geofencingActive} />
        </Section>

        <Section title="Background Services">
          <TestButton
            title="Start Background Location Updates"
            onPress={startBackgroundLocationUpdates}
            loadingKey="startBackgroundLocationUpdates"
          />
          <TestButton
            title="Stop Background Location Updates"
            onPress={stopBackgroundLocationUpdates}
            color="#FF3B30"
            loadingKey="stopBackgroundLocationUpdates"
          />
          <TestButton
            title="Start Geofencing"
            onPress={startGeofencing}
            loadingKey="startGeofencing"
          />
          <TestButton
            title="Stop Geofencing"
            onPress={stopGeofencing}
            color="#FF3B30"
            loadingKey="stopGeofencing"
          />
        </Section>

        <Section title="Utilities">
          <TestButton
            title="Enable Network Provider"
            onPress={enableNetworkProvider}
            loadingKey="enableNetworkProvider"
          />
          <TestButton
            title="Check Location Updates Status"
            onPress={checkLocationUpdatesStatus}
            loadingKey="checkLocationUpdatesStatus"
          />
          <TestButton
            title="Check Geofencing Status"
            onPress={checkGeofencingStatus}
            loadingKey="checkGeofencingStatus"
          />
        </Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  button: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingIndicator: {
    marginRight: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  statusText: {
    fontSize: 14,
    marginBottom: 5,
  },
  statusLabel: {
    fontWeight: "bold",
    color: "#666",
  },
  statusValue: {
    color: "#333",
  },
  dataText: {
    fontSize: 14,
    marginBottom: 3,
    color: "#333",
  },
  addressContainer: {
    backgroundColor: "#f8f8f8",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  locationContainer: {
    backgroundColor: "#f8f8f8",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
});
