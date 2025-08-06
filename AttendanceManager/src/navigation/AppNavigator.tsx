import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';

import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList, TabParamList } from '../types';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main Screens
import DashboardScreen from '../screens/main/DashboardScreen';
import MarkAttendanceScreen from '../screens/main/MarkAttendanceScreen';
import AttendanceHistoryScreen from '../screens/main/AttendanceHistoryScreen';
import EmployeesScreen from '../screens/main/EmployeesScreen';
import ReportsScreen from '../screens/main/ReportsScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import AddEmployeeScreen from '../screens/main/AddEmployeeScreen';
import EditEmployeeScreen from '../screens/main/EditEmployeeScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import OrganizationScreen from '../screens/main/OrganizationScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color="#007AFF" />
  </View>
);

const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#007AFF' },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: { fontWeight: 'bold' }
    }}
  >
    <Stack.Screen 
      name="Login" 
      component={LoginScreen} 
      options={{ title: 'Sign In' }}
    />
    <Stack.Screen 
      name="Register" 
      component={RegisterScreen} 
      options={{ title: 'Create Account' }}
    />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap;

        switch (route.name) {
          case 'Dashboard':
            iconName = focused ? 'home' : 'home-outline';
            break;
          case 'Attendance':
            iconName = focused ? 'time' : 'time-outline';
            break;
          case 'Employees':
            iconName = focused ? 'people' : 'people-outline';
            break;
          case 'Reports':
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
            break;
          case 'Settings':
            iconName = focused ? 'settings' : 'settings-outline';
            break;
          default:
            iconName = 'circle';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#007AFF',
      tabBarInactiveTintColor: 'gray',
      headerStyle: { backgroundColor: '#007AFF' },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: { fontWeight: 'bold' }
    })}
  >
    <Tab.Screen 
      name="Dashboard" 
      component={DashboardScreen}
      options={{ title: 'Dashboard' }}
    />
    <Tab.Screen 
      name="Attendance" 
      component={MarkAttendanceScreen}
      options={{ title: 'Mark Attendance' }}
    />
    <Tab.Screen 
      name="Employees" 
      component={EmployeesScreen}
      options={{ title: 'Employees' }}
    />
    <Tab.Screen 
      name="Reports" 
      component={ReportsScreen}
      options={{ title: 'Reports' }}
    />
    <Tab.Screen 
      name="Settings" 
      component={SettingsScreen}
      options={{ title: 'Settings' }}
    />
  </Tab.Navigator>
);

const MainStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#007AFF' },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: { fontWeight: 'bold' }
    }}
  >
    <Stack.Screen 
      name="Main" 
      component={MainTabs} 
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="AttendanceHistory" 
      component={AttendanceHistoryScreen}
      options={{ title: 'Attendance History' }}
    />
    <Stack.Screen 
      name="AddEmployee" 
      component={AddEmployeeScreen}
      options={{ title: 'Add Employee' }}
    />
    <Stack.Screen 
      name="EditEmployee" 
      component={EditEmployeeScreen}
      options={{ title: 'Edit Employee' }}
    />
    <Stack.Screen 
      name="Profile" 
      component={ProfileScreen}
      options={{ title: 'Profile' }}
    />
    <Stack.Screen 
      name="Organization" 
      component={OrganizationScreen}
      options={{ title: 'Organization Settings' }}
    />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;