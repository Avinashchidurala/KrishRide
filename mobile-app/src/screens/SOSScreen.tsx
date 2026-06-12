import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Platform,
  Share,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { ScreenLayout } from '../components/layout';
import { useAppSelector } from '../store/hooks';
import { userApi } from '../services/userApi';

export default function SOSScreen() {
  const navigation = useNavigation();
  const { user } = useAppSelector((state) => state.auth);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      setLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for SOS feature');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting location:', error);
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleCallEmergency = () => {
    Alert.alert(
      'Call Emergency Services',
      'This will call 112 (Emergency Number). Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          style: 'destructive',
          onPress: () => Linking.openURL('tel:112'),
        },
      ]
    );
  };

  const handleCallSupport = () => {
    Alert.alert(
      'Call Support',
      'This will call HushRyd Support. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => Linking.openURL('tel:+917780445190'),
        },
      ]
    );
  };

  const handleShareLocation = async () => {
    if (!location) {
      Alert.alert('Error', 'Location not available. Please try again.');
      return;
    }

    const locationUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
    const message = `I need help! My current location: ${locationUrl}`;

    try {
      await Share.share({
        message,
        title: 'SOS - Share Location',
      });
    } catch (error) {
      console.error('Error sharing location:', error);
    }
  };

  const handleAlertTrustedContact = async () => {
    try {
      // Get emergency contacts
      const contacts = await userApi.getEmergencyContacts();
      const primaryContact = Array.isArray(contacts)
        ? contacts.find((c: any) => c.is_primary || c.isPrimary)
        : contacts?.contacts?.find((c: any) => c.is_primary || c.isPrimary);

      if (!primaryContact) {
        Alert.alert(
          'No Emergency Contact',
          'Please add an emergency contact in your profile settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Add Contact',
              onPress: () => navigation.navigate('EditProfile' as never),
            },
          ]
        );
        return;
      }

      const contactMobile = primaryContact.mobile || primaryContact.contactMobile;
      if (!contactMobile) {
        Alert.alert('Error', 'Emergency contact mobile number not found');
        return;
      }

      Alert.alert(
        'Alert Trusted Contact',
        `This will send an alert to ${primaryContact.name || primaryContact.contactName}. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Send Alert',
            style: 'destructive',
            onPress: async () => {
              // In a real app, this would send an SMS or push notification
              const locationUrl = location
                ? `https://www.google.com/maps?q=${location.lat},${location.lng}`
                : 'Location unavailable';
              const message = `URGENT: ${user?.first_name || 'User'} needs help! Location: ${locationUrl}`;
              
              // For now, open SMS app
              Linking.openURL(`sms:${contactMobile}?body=${encodeURIComponent(message)}`);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error alerting trusted contact:', error);
      Alert.alert('Error', 'Failed to alert emergency contact');
    }
  };

  return (
    <ScreenLayout
      header={{
        title: 'Emergency / SOS',
        showBack: true,
      }}
    >
      <View style={styles.container}>
        {/* Warning Header */}
        <View style={styles.warningCard}>
          <MaterialIcons name="warning" size={32} color="#F44336" />
          <Text style={styles.warningTitle}>Emergency Assistance</Text>
          <Text style={styles.warningText}>
            Use these options to get help in an emergency situation
          </Text>
        </View>

        {/* Location Status */}
        {loadingLocation ? (
          <View style={styles.locationStatus}>
            <Text style={styles.locationStatusText}>Getting your location...</Text>
          </View>
        ) : location ? (
          <View style={styles.locationStatus}>
            <MaterialIcons name="location-on" size={16} color="#4CAF50" />
            <Text style={styles.locationStatusText}>Location available</Text>
          </View>
        ) : (
          <View style={styles.locationStatus}>
            <MaterialIcons name="location-off" size={16} color="#F44336" />
            <Text style={styles.locationStatusText}>Location unavailable</Text>
          </View>
        )}

        {/* Emergency Actions */}
        <View style={styles.actionsContainer}>
          {/* Call Emergency */}
          <TouchableOpacity
            style={[styles.actionCard, styles.emergencyAction]}
            onPress={handleCallEmergency}
            activeOpacity={0.8}
          >
            <View style={styles.actionIconContainer}>
              <MaterialIcons name="phone" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Call Emergency</Text>
              <Text style={styles.actionSubtitle}>112 - Emergency Services</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Call Support */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleCallSupport}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconContainer, styles.supportIcon]}>
              <MaterialIcons name="headset-mic" size={24} color="#FF6B35" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Call Support</Text>
              <Text style={styles.actionSubtitle}>HushRyd Support Team</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>

          {/* Share Location */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleShareLocation}
            activeOpacity={0.8}
            disabled={!location}
          >
            <View style={[styles.actionIconContainer, styles.shareIcon]}>
              <MaterialIcons name="share-location" size={24} color="#2196F3" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Share Live Location</Text>
              <Text style={styles.actionSubtitle}>
                {location ? 'Share your current location' : 'Location unavailable'}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>

          {/* Alert Trusted Contact */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleAlertTrustedContact}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconContainer, styles.alertIcon]}>
              <MaterialIcons name="notifications-active" size={24} color="#FF9800" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Alert Trusted Contact</Text>
              <Text style={styles.actionSubtitle}>Send alert to emergency contact</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Safety Note */}
        <View style={styles.safetyNote}>
          <MaterialIcons name="info" size={18} color="#666" />
          <Text style={styles.safetyNoteText}>
            In case of immediate danger, call 112 (Emergency Services) immediately.
          </Text>
        </View>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  warningCard: {
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FFEBEE',
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F44336',
    marginTop: 12,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  locationStatusText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  emergencyAction: {
    backgroundColor: '#F44336',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  supportIcon: {
    backgroundColor: '#FFF5F5',
  },
  shareIcon: {
    backgroundColor: '#E3F2FD',
  },
  alertIcon: {
    backgroundColor: '#FFF8E1',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  safetyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  safetyNoteText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});

