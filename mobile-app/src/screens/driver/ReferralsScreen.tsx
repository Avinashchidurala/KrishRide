import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
  Platform} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenLayout } from '../../components/layout';
import { useAppSelector } from '../../store/hooks';
import { referralsApi } from '../../services/referralsApi';
import * as Clipboard from '@react-native-clipboard/clipboard';
// import * as Clipboard from 'expo-clipboard';

export default function DriverReferralsScreen() {
  const navigation = useNavigation();
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    successfulReferrals: 0,
    totalEarnings: 0,
  });

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      setLoading(true);
      const [codeData, statsData] = await Promise.all([
        referralsApi.getReferralCode(),
        referralsApi.getReferralStats().catch(() => null),
      ]);
      setReferralCode(codeData.referralCode || (user as any)?.driver?.referral_code || '');
      
      if (statsData) {
        setReferralStats({
          totalReferrals: statsData.totalReferrals || 0,
          successfulReferrals: statsData.successfulReferrals || 0,
          totalEarnings: statsData.totalEarnings || 0,
        });
      }
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    Clipboard.setString(referralCode);
    setCopied(true);
    Alert.alert('Copied!', 'Referral code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const message = `Join HushRyd as a driver using my referral code: ${referralCode} and earn rewards!`;
    Clipboard.setString(message);
    Alert.alert('Copied!', 'Referral message copied to clipboard');
  };

  return (
    <ScreenLayout
      header={{
        title: 'Refer & Earn',
        showBack: true,
      }}
      scrollable
    >
      <View style={styles.container}>
        <View style={styles.headerSection}>
          <Text style={styles.title}>Refer & Earn</Text>
          <Text style={styles.subtitle}>
            Share your referral code and earn rewards for each successful driver referral
          </Text>
        </View>

        <View style={styles.referralCodeCard}>
          <Text style={styles.referralCodeLabel}>Your Referral Code</Text>
          <View style={styles.referralCodeContainer}>
            <Text style={styles.referralCode}>{referralCode || 'Loading...'}</Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopy}
            >
              <Text style={styles.copyButtonText}>
                {copied ? '✓ Copied' : 'Copy'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>Share Referral Code</Text>
        </TouchableOpacity>

        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Your Referral Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{referralStats.totalReferrals}</Text>
              <Text style={styles.statLabel}>Total Referrals</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{referralStats.successfulReferrals}</Text>
              <Text style={styles.statLabel}>Successful</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>₹{referralStats.totalEarnings}</Text>
              <Text style={styles.statLabel}>Total Earnings</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How it works</Text>
          <Text style={styles.infoText}>
            1. Share your referral code with potential drivers{'\n'}
            2. They sign up as a driver using your code{'\n'}
            3. You earn rewards when they complete verification and start driving
          </Text>
        </View>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 22,
  },
  referralCodeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  referralCodeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 12,
  },
  referralCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  referralCode: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B35',
    letterSpacing: 2,
    flex: 1,
  },
  copyButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  shareButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B35',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 22,
  },
});

