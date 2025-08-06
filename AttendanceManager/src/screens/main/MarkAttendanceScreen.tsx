import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '../../contexts/AuthContext';
import { databaseService } from '../../services/database';
import { locationService, LocationCoords } from '../../services/location';
import { AttendanceRecord } from '../../types';

const MarkAttendanceScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  
  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);
  const [locationAddress, setLocationAddress] = useState<string>('');
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);

  // Mock organization data - in a real app, this would come from the database
  const organizationLocation: LocationCoords = {
    latitude: 37.7749, // San Francisco coordinates as example
    longitude: -122.4194,
  };
  const organizationRadius = 100; // 100 meters

  useEffect(() => {
    loadTodayAttendance();
    getCurrentLocation();
  }, []);

  const loadTodayAttendance = async () => {
    try {
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      const records = await databaseService.getAttendanceRecords(user.id, today, today);
      setTodayAttendance(records.length > 0 ? records[0] : null);
    } catch (error) {
      console.error('Failed to load today attendance:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      const location = await locationService.getCurrentLocation();
      
      if (location) {
        setCurrentLocation(location);
        const address = await locationService.reverseGeocode(location);
        setLocationAddress(address);
      } else {
        Alert.alert(
          'Location Required',
          'Please enable location services to mark attendance.'
        );
      }
    } catch (error) {
      console.error('Failed to get location:', error);
      Alert.alert('Error', 'Failed to get your current location');
    } finally {
      setLocationLoading(false);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Failed to take photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const markCheckIn = async () => {
    if (!currentLocation || !user) return;

    setLoading(true);
    try {
      // Check if within geofence
      const isWithinRange = locationService.isWithinGeofence(
        currentLocation,
        { center: organizationLocation, radius: organizationRadius }
      );

      if (!isWithinRange) {
        Alert.alert(
          'Location Error',
          'You are not within the allowed area to mark attendance. Please move closer to your workplace.'
        );
        setLoading(false);
        return;
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toISOString();

      // Determine if late (assuming work starts at 9 AM)
      const workStartTime = new Date();
      workStartTime.setHours(9, 0, 0, 0);
      const isLate = now > workStartTime;

      const attendanceData: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'> = {
        employeeId: user.id,
        organizationId: 'default-org', // In a real app, this would be dynamic
        date: today,
        checkIn: {
          time: currentTime,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          photo: photo || undefined,
        },
        status: isLate ? 'late' : 'present',
      };

      await databaseService.markAttendance(attendanceData);
      
      Alert.alert(
        'Success',
        `Check-in recorded successfully${isLate ? ' (Late)' : ''}!`,
        [{ text: 'OK', onPress: () => loadTodayAttendance() }]
      );
      
      setPhoto(null);
    } catch (error) {
      console.error('Failed to mark check-in:', error);
      Alert.alert('Error', 'Failed to mark check-in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const markCheckOut = async () => {
    if (!currentLocation || !user || !todayAttendance) return;

    setLoading(true);
    try {
      const now = new Date();
      const currentTime = now.toISOString();

      // Calculate working hours
      const checkInTime = todayAttendance.checkIn ? new Date(todayAttendance.checkIn.time) : now;
      const workingHours = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

      const updates: Partial<AttendanceRecord> = {
        checkOut: {
          time: currentTime,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          photo: photo || undefined,
        },
        workingHours: Math.max(0, workingHours),
      };

      await databaseService.updateAttendanceRecord(todayAttendance.id, updates);
      
      Alert.alert(
        'Success',
        `Check-out recorded successfully! Working hours: ${workingHours.toFixed(1)}`,
        [{ text: 'OK', onPress: () => loadTodayAttendance() }]
      );
      
      setPhoto(null);
    } catch (error) {
      console.error('Failed to mark check-out:', error);
      Alert.alert('Error', 'Failed to mark check-out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isWithinRange = currentLocation ? locationService.isWithinGeofence(
    currentLocation,
    { center: organizationLocation, radius: organizationRadius }
  ) : false;

  const distance = currentLocation ? locationService.calculateDistance(
    currentLocation,
    organizationLocation
  ) : 0;

  const canCheckIn = !todayAttendance?.checkIn && isWithinRange;
  const canCheckOut = todayAttendance?.checkIn && !todayAttendance?.checkOut && isWithinRange;

  return (
    <ScrollView style={styles.container}>
      {/* Location Status */}
      <View style={styles.locationCard}>
        <Text style={styles.cardTitle}>Current Location</Text>
        
        {locationLoading ? (
          <Text style={styles.loadingText}>Getting location...</Text>
        ) : (
          <>
            <Text style={styles.addressText}>{locationAddress}</Text>
            {currentLocation && (
              <Text style={styles.coordsText}>
                {locationService.formatCoordinates(currentLocation)}
              </Text>
            )}
            
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Distance from office:</Text>
              <Text style={[styles.statusValue, { 
                color: isWithinRange ? '#4CAF50' : '#F44336' 
              }]}>
                {distance.toFixed(0)}m
              </Text>
            </View>
            
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Status:</Text>
              <Text style={[styles.statusValue, { 
                color: isWithinRange ? '#4CAF50' : '#F44336' 
              }]}>
                {isWithinRange ? 'Within Range' : 'Out of Range'}
              </Text>
            </View>
          </>
        )}
        
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={getCurrentLocation}
          disabled={locationLoading}
        >
          <Ionicons name="refresh" size={20} color="#007AFF" />
          <Text style={styles.refreshText}>Refresh Location</Text>
        </TouchableOpacity>
      </View>

      {/* Today's Attendance */}
      <View style={styles.attendanceCard}>
        <Text style={styles.cardTitle}>Today's Attendance</Text>
        
        {todayAttendance ? (
          <>
            {todayAttendance.checkIn && (
              <View style={styles.timeEntry}>
                <Ionicons name="log-in-outline" size={24} color="#4CAF50" />
                <View style={styles.timeDetails}>
                  <Text style={styles.timeLabel}>Check In</Text>
                  <Text style={styles.timeValue}>
                    {new Date(todayAttendance.checkIn.time).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
                <Text style={[styles.statusBadge, { 
                  backgroundColor: todayAttendance.status === 'late' ? '#FF9800' : '#4CAF50'
                }]}>
                  {todayAttendance.status.toUpperCase()}
                </Text>
              </View>
            )}
            
            {todayAttendance.checkOut && (
              <View style={styles.timeEntry}>
                <Ionicons name="log-out-outline" size={24} color="#F44336" />
                <View style={styles.timeDetails}>
                  <Text style={styles.timeLabel}>Check Out</Text>
                  <Text style={styles.timeValue}>
                    {new Date(todayAttendance.checkOut.time).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
                {todayAttendance.workingHours && (
                  <Text style={styles.hoursText}>
                    {todayAttendance.workingHours.toFixed(1)}h
                  </Text>
                )}
              </View>
            )}
          </>
        ) : (
          <Text style={styles.noAttendanceText}>No attendance marked today</Text>
        )}
      </View>

      {/* Photo Section */}
      <View style={styles.photoCard}>
        <Text style={styles.cardTitle}>Attendance Photo</Text>
        
        {photo ? (
          <View style={styles.photoContainer}>
            <Image source={{ uri: photo }} style={styles.photo} />
            <TouchableOpacity
              style={styles.removePhotoButton}
              onPress={() => setPhoto(null)}
            >
              <Ionicons name="close-circle" size={24} color="#F44336" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.cameraButton} onPress={takePhoto}>
            <Ionicons name="camera-outline" size={40} color="#666" />
            <Text style={styles.cameraText}>Take Photo (Optional)</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsCard}>
        {canCheckIn && (
          <TouchableOpacity
            style={[styles.actionButton, styles.checkInButton]}
            onPress={markCheckIn}
            disabled={loading}
          >
            <Ionicons name="log-in-outline" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>
              {loading ? 'Marking...' : 'Check In'}
            </Text>
          </TouchableOpacity>
        )}
        
        {canCheckOut && (
          <TouchableOpacity
            style={[styles.actionButton, styles.checkOutButton]}
            onPress={markCheckOut}
            disabled={loading}
          >
            <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>
              {loading ? 'Marking...' : 'Check Out'}
            </Text>
          </TouchableOpacity>
        )}
        
        {!isWithinRange && (
          <View style={styles.warningCard}>
            <Ionicons name="warning-outline" size={24} color="#FF9800" />
            <Text style={styles.warningText}>
              You need to be within {organizationRadius}m of your workplace to mark attendance.
            </Text>
          </View>
        )}
        
        {todayAttendance?.checkIn && todayAttendance?.checkOut && (
          <View style={styles.completeCard}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#4CAF50" />
            <Text style={styles.completeText}>
              Attendance completed for today!
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  addressText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  coordsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusLabel: {
    fontSize: 16,
    color: '#666',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    paddingVertical: 10,
  },
  refreshText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 8,
  },
  attendanceCard: {
    backgroundColor: '#FFFFFF',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  timeDetails: {
    flex: 1,
    marginLeft: 15,
  },
  timeLabel: {
    fontSize: 16,
    color: '#666',
  },
  timeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  hoursText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  noAttendanceText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  photoCard: {
    backgroundColor: '#FFFFFF',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photoContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  photo: {
    width: 200,
    height: 150,
    borderRadius: 10,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -10,
    right: 70,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  cameraButton: {
    alignItems: 'center',
    paddingVertical: 30,
    borderWidth: 2,
    borderColor: '#DDD',
    borderStyle: 'dashed',
    borderRadius: 10,
  },
  cameraText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  actionsCard: {
    margin: 15,
    marginTop: 0,
    marginBottom: 30,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  checkInButton: {
    backgroundColor: '#4CAF50',
  },
  checkOutButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#E65100',
    marginLeft: 10,
  },
  completeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  completeText: {
    flex: 1,
    fontSize: 16,
    color: '#2E7D32',
    marginLeft: 10,
    fontWeight: 'bold',
  },
});

export default MarkAttendanceScreen;