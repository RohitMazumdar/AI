import * as Location from 'expo-location';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface GeofenceConfig {
  center: LocationCoords;
  radius: number; // in meters
}

class LocationService {
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Failed to request location permissions:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<LocationCoords | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 1,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Failed to get current location:', error);
      return null;
    }
  }

  calculateDistance(point1: LocationCoords, point2: LocationCoords): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (point1.latitude * Math.PI) / 180;
    const φ2 = (point2.latitude * Math.PI) / 180;
    const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  isWithinGeofence(currentLocation: LocationCoords, geofence: GeofenceConfig): boolean {
    const distance = this.calculateDistance(currentLocation, geofence.center);
    return distance <= geofence.radius;
  }

  async reverseGeocode(coords: LocationCoords): Promise<string> {
    try {
      const result = await Location.reverseGeocodeAsync(coords);
      if (result.length > 0) {
        const location = result[0];
        return `${location.street || ''} ${location.city || ''} ${location.region || ''}`.trim();
      }
      return 'Unknown location';
    } catch (error) {
      console.error('Failed to reverse geocode:', error);
      return 'Unknown location';
    }
  }

  formatCoordinates(coords: LocationCoords): string {
    return `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
  }
}

export const locationService = new LocationService();