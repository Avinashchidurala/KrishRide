import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { driverApi } from '../../services/driverApi';

export default function EarningsScreen() {
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState({
    totalEarnings: 0,
    walletBalance: 0,
    completedRides: 0,
  });

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      setLoading(true);
      const data = await driverApi.getEarnings();
      setEarnings(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load earnings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Earnings</Text>
          <Text style={styles.summaryValue}>₹{earnings.totalEarnings && typeof earnings.totalEarnings === 'number' ? earnings.totalEarnings.toFixed(2) : '0.00'}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Wallet Balance</Text>
          <Text style={styles.summaryValue}>₹{earnings.walletBalance && typeof earnings.walletBalance === 'number' ? earnings.walletBalance.toFixed(2) : '0.00'}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Completed Rides</Text>
          <Text style={styles.summaryValue}>{earnings.completedRides}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            Platform fee (₹30) is deducted per completed ride
          </Text>
          <Text style={styles.infoText}>
            Earnings are credited to your wallet after ride completion
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#FF6B35',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 15,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
});

