import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
  Platform, Share} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenLayout } from '../../components/layout';
import { useAppSelector } from '../../store/hooks';
import { referralsApi } from '../../services/referralsApi';
import * as Clipboard from '@react-native-clipboard/clipboard';
// import * as Clipboard from 'expo-clipboard';

export default function ReferralsScreen() {
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
      setReferralCode(codeData.referralCode || (user as any)?.customer?.referral_code || '');
      
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
    try {
      const message = `Join HushRyd using my referral code: ${referralCode} and get ₹100! Download the app now.`;
      await Share.share({
        message,
        title: 'Refer HushRyd',
      });
    } catch (error) {
      // Fallback to clipboard
      Clipboard.setString(message);
      Alert.alert('Copied!', 'Referral message copied to clipboard');
    }
  };

  return (
    <ScreenLayout
      header={{
        title: 'Refer & Earn',
        showBack: true,
      }}
      scrollable
    >
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Earn ₹100</Text>
          <Text style={styles.heroSubtitle}>
            for every successful referral
          </Text>
        </View>

        {/* Referral Code Card */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Your Referral Code</Text>
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>{referralCode || 'Loading...'}</Text>
          </View>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={handleCopy}
            activeOpacity={0.8}
          >
            <MaterialIcons 
              name={copied ? 'check' : 'content-copy'} 
              size={18} 
              color="#FFFFFF" 
            />
            <Text style={styles.copyButtonText}>
              {copied ? 'Copied' : 'Copy'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Share Button */}
        <TouchableOpacity 
          style={styles.shareButton} 
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <MaterialIcons name="share" size={20} color="#FFFFFF" />
          <Text style={styles.shareButtonText}>Share Referral Code</Text>
        </TouchableOpacity>

        {/* Referral Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{referralStats.totalReferrals}</Text>
            <Text style={styles.statLabel}>Total Referrals</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{referralStats.successfulReferrals}</Text>
            <Text style={styles.statLabel}>Successful</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₹{referralStats.totalEarnings}</Text>
            <Text style={styles.statLabel}>Total Earnings</Text>
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.howItWorksCard}>
          <Text style={styles.howItWorksTitle}>How it works</Text>
          <View style={styles.stepContainer}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>Share your referral code with friends</Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>They sign up using your code</Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>You both earn ₹100 when they complete their first booking</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  // Hero Section
  heroCard: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    opacity: 0.9,
  },
  // Referral Code Card
  codeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
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
  codeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  codeContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  codeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FF6B35',
    letterSpacing: 3,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  copyButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  // Share Button
  shareButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  // Stats Card
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
    textAlign: 'center',
  },
  // How It Works
  howItWorksCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
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
  howItWorksTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  stepContainer: {
    gap: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    paddingTop: 4,
  },
});
