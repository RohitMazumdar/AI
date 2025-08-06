import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useAuth } from '../../contexts/AuthContext';
import { RootStackParamList, AttendanceRecord, AttendanceStats } from '../../types';
import { databaseService } from '../../services/database';

type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>;

const DashboardScreen = () => {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const { user } = useAuth();
  
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [stats, setStats] = useState<AttendanceStats>({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    attendanceRate: 0,
    averageWorkingHours: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      if (!user) return;

      // Get today's attendance
      const today = new Date().toISOString().split('T')[0];
      const todayRecords = await databaseService.getAttendanceRecords(user.id, today, today);
      setTodayAttendance(todayRecords.length > 0 ? todayRecords[0] : null);

      // Calculate monthly stats
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString().split('T')[0];
      const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
        .toISOString().split('T')[0];
      
      const monthlyRecords = await databaseService.getAttendanceRecords(user.id, startOfMonth, endOfMonth);
      
      const presentDays = monthlyRecords.filter(record => record.status === 'present').length;
      const absentDays = monthlyRecords.filter(record => record.status === 'absent').length;
      const lateDays = monthlyRecords.filter(record => record.status === 'late').length;
      const totalDays = monthlyRecords.length;
      const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
      
      const totalWorkingHours = monthlyRecords.reduce((sum, record) => 
        sum + (record.workingHours || 0), 0);
      const averageWorkingHours = totalDays > 0 ? totalWorkingHours / totalDays : 0;

      setStats({
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        attendanceRate,
        averageWorkingHours,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getTodayStatus = () => {
    if (!todayAttendance) return 'Not marked';
    if (todayAttendance.checkIn && todayAttendance.checkOut) return 'Complete';
    if (todayAttendance.checkIn) return 'Checked In';
    return 'Not marked';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Complete': return '#4CAF50';
      case 'Checked In': return '#FF9800';
      case 'Not marked': return '#F44336';
      default: return '#666';
    }
  };

  const quickActions = [
    {
      title: 'Mark Attendance',
      icon: 'time-outline',
      color: '#007AFF',
      onPress: () => navigation.navigate('MarkAttendance'),
    },
    {
      title: 'View History',
      icon: 'calendar-outline',
      color: '#4CAF50',
      onPress: () => navigation.navigate('AttendanceHistory'),
    },
    {
      title: 'Employees',
      icon: 'people-outline',
      color: '#FF9800',
      onPress: () => navigation.navigate('Employees'),
      adminOnly: true,
    },
    {
      title: 'Reports',
      icon: 'stats-chart-outline',
      color: '#9C27B0',
      onPress: () => navigation.navigate('Reports'),
    },
  ];

  const filteredActions = quickActions.filter(action => 
    !action.adminOnly || (user?.role === 'admin' || user?.role === 'manager')
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Ionicons name="person-circle-outline" size={40} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Today's Status */}
      <View style={styles.todayCard}>
        <Text style={styles.cardTitle}>Today's Attendance</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status:</Text>
          <Text style={[styles.statusValue, { color: getStatusColor(getTodayStatus()) }]}>
            {getTodayStatus()}
          </Text>
        </View>
        
        {todayAttendance?.checkIn && (
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.timeText}>
              Check In: {new Date(todayAttendance.checkIn.time).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        )}
        
        {todayAttendance?.checkOut && (
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.timeText}>
              Check Out: {new Date(todayAttendance.checkOut.time).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        )}
      </View>

      {/* Monthly Stats */}
      <View style={styles.statsCard}>
        <Text style={styles.cardTitle}>This Month's Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalDays}</Text>
            <Text style={styles.statLabel}>Total Days</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
              {stats.presentDays}
            </Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#F44336' }]}>
              {stats.absentDays}
            </Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#FF9800' }]}>
              {stats.lateDays}
            </Text>
            <Text style={styles.statLabel}>Late</Text>
          </View>
        </View>
        
        <View style={styles.attendanceRate}>
          <Text style={styles.rateLabel}>Attendance Rate</Text>
          <Text style={[styles.rateValue, { 
            color: stats.attendanceRate >= 90 ? '#4CAF50' : 
                   stats.attendanceRate >= 75 ? '#FF9800' : '#F44336'
          }]}>
            {stats.attendanceRate.toFixed(1)}%
          </Text>
        </View>
        
        {stats.averageWorkingHours > 0 && (
          <View style={styles.workingHours}>
            <Text style={styles.hoursLabel}>Average Working Hours</Text>
            <Text style={styles.hoursValue}>
              {stats.averageWorkingHours.toFixed(1)} hrs/day
            </Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsCard}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {filteredActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.actionButton, { borderColor: action.color }]}
              onPress={action.onPress}
            >
              <Ionicons name={action.icon as any} size={30} color={action.color} />
              <Text style={styles.actionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  profileButton: {
    padding: 5,
  },
  todayCard: {
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
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  statsCard: {
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
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  attendanceRate: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  rateLabel: {
    fontSize: 16,
    color: '#666',
  },
  rateValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  workingHours: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  hoursLabel: {
    fontSize: 16,
    color: '#666',
  },
  hoursValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  actionsCard: {
    backgroundColor: '#FFFFFF',
    margin: 15,
    marginTop: 0,
    marginBottom: 30,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    aspectRatio: 1,
    borderWidth: 2,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#F8F9FA',
  },
  actionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default DashboardScreen;