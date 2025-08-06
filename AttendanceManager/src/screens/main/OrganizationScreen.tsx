import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const OrganizationScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Organization Settings</Text>
      <Text style={styles.subtitle}>Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
});

export default OrganizationScreen;