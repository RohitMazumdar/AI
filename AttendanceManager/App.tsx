import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/contexts/AuthContext';
import { databaseService } from './src/services/database';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize database
      await databaseService.init();
      
      // Create demo admin user if none exists
      const existingAdmin = await databaseService.getUserByEmail('admin@demo.com');
      if (!existingAdmin) {
        await databaseService.createUser({
          email: 'admin@demo.com',
          name: 'Demo Admin',
          role: 'admin',
        });
      }
      
      console.log('App initialized successfully');
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppNavigator />
          <StatusBar style="light" backgroundColor="#007AFF" />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}