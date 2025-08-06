# Attendance Manager

A comprehensive React Native attendance management application built with Expo, featuring geolocation-based check-ins, offline support, and role-based access control.

## Features

### Core Features
- **User Authentication**: Secure login/registration with role-based access (Admin, Manager, Employee)
- **Geolocation-based Attendance**: Check-in/check-out with location verification and geofencing
- **Photo Verification**: Optional photo capture during attendance marking
- **Offline Support**: Local SQLite database for offline functionality
- **Real-time Dashboard**: Overview of attendance statistics and quick actions
- **Attendance History**: Monthly view with filtering and detailed records
- **Role-based UI**: Different features based on user roles

### Technical Features
- **Cross-platform**: iOS and Android support
- **TypeScript**: Full type safety
- **Expo**: Managed workflow for easy development and deployment
- **SQLite**: Local database for offline data storage
- **Secure Storage**: Encrypted storage for authentication tokens
- **Navigation**: React Navigation with tab and stack navigators

## Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- EAS CLI for deployment (`npm install -g eas-cli`)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AttendanceManager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on device/simulator**
   - iOS: `npm run ios` (requires macOS and Xcode)
   - Android: `npm run android` (requires Android Studio)
   - Web: `npm run web`

## Project Structure

```
src/
├── contexts/           # React contexts (Auth)
├── navigation/         # Navigation configuration
├── screens/           # Screen components
│   ├── auth/          # Authentication screens
│   └── main/          # Main app screens
├── services/          # Business logic services
│   ├── auth.ts        # Authentication service
│   ├── database.ts    # SQLite database service
│   └── location.ts    # Location and geofencing service
└── types/             # TypeScript type definitions
```

## Configuration

### App Configuration
Update `app.json` with your app-specific details:
- App name and slug
- Bundle identifiers
- Permissions
- Icons and splash screens

### Location Settings
In `src/screens/main/MarkAttendanceScreen.tsx`, update the organization location:
```typescript
const organizationLocation: LocationCoords = {
  latitude: YOUR_OFFICE_LATITUDE,
  longitude: YOUR_OFFICE_LONGITUDE,
};
const organizationRadius = YOUR_GEOFENCE_RADIUS_IN_METERS;
```

## Demo Credentials

The app comes with a pre-configured demo admin account:
- **Email**: admin@demo.com
- **Password**: any password (for demo purposes)

You can create additional accounts through the registration screen.

## Deployment

### Prerequisites for App Store Deployment

1. **iOS App Store**
   - Apple Developer Account ($99/year)
   - App Store Connect app created
   - iOS Distribution Certificate
   - App Store Provisioning Profile

2. **Google Play Store**
   - Google Play Console account ($25 one-time fee)
   - Google Play service account key
   - App bundle signing certificate

### EAS Build Setup

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**
   ```bash
   eas login
   ```

3. **Configure EAS**
   ```bash
   eas build:configure
   ```

4. **Update eas.json** with your credentials:
   - Apple ID and Team ID for iOS
   - Service account key path for Android

### Building for Production

1. **Build for iOS**
   ```bash
   eas build --platform ios --profile production
   ```

2. **Build for Android**
   ```bash
   eas build --platform android --profile production
   ```

3. **Build for both platforms**
   ```bash
   eas build --platform all --profile production
   ```

### Submitting to App Stores

1. **Submit to App Store**
   ```bash
   eas submit --platform ios --profile production
   ```

2. **Submit to Play Store**
   ```bash
   eas submit --platform android --profile production
   ```

## App Store Requirements

### iOS App Store
- App icons (1024x1024 for App Store, various sizes for app)
- Screenshots for different device sizes
- App description and keywords
- Privacy policy URL
- Age rating
- App categories

### Google Play Store
- Feature graphic (1024x500)
- Screenshots for phone and tablet
- App description
- Privacy policy URL
- Content rating
- App categories

## Key Dependencies

- **@react-navigation/native**: Navigation framework
- **expo-location**: Location services and geofencing
- **expo-sqlite**: Local database
- **expo-secure-store**: Secure credential storage
- **expo-camera**: Camera functionality
- **expo-image-picker**: Image selection
- **@expo/vector-icons**: Icon library

## Security Features

- **Encrypted Storage**: Authentication tokens stored securely
- **Geofencing**: Location-based attendance verification
- **Role-based Access**: Different features for different user roles
- **Input Validation**: Form validation and sanitization
- **Offline Security**: Local data encryption

## Performance Optimizations

- **Lazy Loading**: Screens loaded on demand
- **Image Optimization**: Compressed image storage
- **Database Indexing**: Optimized queries
- **Memory Management**: Proper cleanup of resources

## Troubleshooting

### Common Issues

1. **Location not working**
   - Ensure location permissions are granted
   - Check if location services are enabled on device
   - Verify GPS/network connectivity

2. **Database errors**
   - Clear app data and restart
   - Check for SQLite syntax errors in logs

3. **Build failures**
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall
   - Check EAS build logs for specific errors

### Development Tips

- Use Expo Go app for quick testing during development
- Enable remote debugging for better error tracking
- Use Flipper for advanced debugging (React Native CLI projects)
- Test on both iOS and Android devices before deployment

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the Expo documentation: https://docs.expo.dev/
- React Navigation docs: https://reactnavigation.org/

## Roadmap

- [ ] Push notifications for attendance reminders
- [ ] Advanced reporting and analytics
- [ ] Employee management features
- [ ] Leave request system
- [ ] Multi-organization support
- [ ] Biometric authentication
- [ ] Dark mode theme
- [ ] Internationalization (i18n)

---

Built with ❤️ using React Native and Expo
