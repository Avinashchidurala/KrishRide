import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { driverApi } from '../../services/driverApi';
import { useAppSelector } from '../../store/hooks';
import { ScreenLayout } from '../../components/layout';

export default function DriverDashboardScreen() {
  const navigation = useNavigation();
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [kycLoading, setKycLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRides: 0,
    totalEarnings: 0,
    totalBookings: 0,
    averageRating: 0,
  });

  useEffect(() => {
    loadKYCStatus();
    loadStats();
  }, []);

  const loadKYCStatus = async () => {
    try {
      setKycLoading(true);
      const kycData = await driverApi.getKYCStatus();
      setKycStatus(kycData.kycStatus || 'pending');
    } catch (error) {
      console.error('Error loading KYC status:', error);
      setKycStatus('pending');
    } finally {
      setKycLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await driverApi.getDriverDashboardStats();
      setStats(data.stats || stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking KYC status
  if (kycLoading) {
    return (
      <ScreenLayout
        header={{
          title: `Welcome, ${user?.first_name || 'Driver'}!`,
        }}
      >
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      </ScreenLayout>
    );
  }

  // Show verification prompt if not verified
  if (kycStatus !== 'approved') {
    return (
      <ScreenLayout
        header={{
          title: 'Complete Verification',
        }}
        scrollable
      >
        <View style={styles.container}>
          <View style={styles.verificationCard}>
            <View style={styles.verificationTitle}>
              <MaterialIcons name="warning" size={20} color="#FF9800" />
              <Text style={styles.verificationTitleText}>Verification Required</Text>
            </View>
            <Text style={styles.verificationText}>
              Please complete your KYC verification to access the dashboard and publish rides.
            </Text>

            <View style={styles.stepsContainer}>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Identity Proof</Text>
                  <Text style={styles.stepDescription}>Upload Aadhar or PAN card</Text>
                </View>
              </View>

              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Driving License</Text>
                  <Text style={styles.stepDescription}>Upload your valid driving license</Text>
                </View>
              </View>

              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Bank Account</Text>
                  <Text style={styles.stepDescription}>Provide bank account for payments</Text>
                </View>
              </View>

              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>4</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Selfie</Text>
                  <Text style={styles.stepDescription}>Upload a clear selfie</Text>
                </View>
              </View>
            </View>

            {kycStatus === 'pending' && (
              <View style={styles.infoBox}>
                <MaterialIcons name="info" size={16} color="#2196F3" />
                <Text style={styles.infoText}>
                  Your KYC verification is pending. It usually takes 1-2 hours for approval.
                </Text>
              </View>
            )}

            {kycStatus === 'rejected' && (
              <View style={styles.errorBox}>
                <MaterialIcons name="error" size={16} color="#F44336" />
                <Text style={styles.errorText}>
                  Your KYC verification was rejected. Please resubmit with correct documents.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.verifyButton}
              onPress={() => navigation.navigate('KYC' as never)}
            >
              <Text style={styles.verifyButtonText}>Complete Verification Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenLayout>
    );
  }

  // Show actual dashboard if verified
  return (
    <ScreenLayout
      header={{
        title: `Welcome, ${user?.first_name || 'Driver'}!`,
        rightAction: {
          label: 'Earnings',
          onPress: () => navigation.navigate('Earnings' as never),
        },
      }}
      scrollable
    >
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color="#FF6B35" style={styles.loader} />
        ) : (
          <>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.totalRides}</Text>
                <Text style={styles.statLabel}>Total Rides</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>₹{stats.totalEarnings}</Text>
                <Text style={styles.statLabel}>Earnings</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.totalBookings}</Text>
                <Text style={styles.statLabel}>Bookings</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.averageRating && typeof stats.averageRating === 'number' ? stats.averageRating.toFixed(1) : 'N/A'}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            </View>

            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('PublishRide' as never)}
              >
                <Text style={styles.actionButtonText}>Publish Ride</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('RideRequests' as never)}
              >
                <Text style={styles.actionButtonText}>Ride Requests</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('MyRides' as never)}
              >
                <Text style={styles.actionButtonText}>My Rides</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('Earnings' as never)}
              >
                <Text style={styles.actionButtonText}>Earnings</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('Vehicles' as never)}
              >
                <Text style={styles.actionButtonText}>My Vehicles</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loader: {
    marginTop: 50,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verificationContent: {
    padding: 16,
  },
  verificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  verificationTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 8,
  },
  verificationTitleText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  verificationText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  stepsContainer: {
    marginBottom: 20,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  stepNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    lineHeight: 20,
  },
  verifyButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  actionsContainer: {
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});

