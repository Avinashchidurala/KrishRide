import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { walletApi } from '../../services/walletApi';
import { ScreenLayout } from '../../components/layout';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function WalletScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const [balanceData, transactionsData] = await Promise.all([
        walletApi.getWalletBalance(),
        walletApi.getWalletTransactions(),
      ]);
      setBalance(balanceData.balance || 0);
      setTransactions(transactionsData.transactions || []);
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateStr = date.toDateString();
    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();

    if (dateStr === todayStr) return 'Today';
    if (dateStr === yesterdayStr) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderTransaction = ({ item }: { item: any }) => {
    const isPositive = item.amount > 0;
    const transactionType = item.type || 'Transaction';
    
    return (
      <View style={styles.transactionRow}>
        <View style={styles.transactionLeft}>
          <View style={[styles.transactionIcon, { backgroundColor: isPositive ? '#E8F5E9' : '#FFEBEE' }]}>
            <MaterialIcons 
              name={isPositive ? 'add' : 'remove'} 
              size={20} 
              color={isPositive ? '#4CAF50' : '#F44336'} 
            />
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionType}>{transactionType}</Text>
            <Text style={styles.transactionDate}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        <Text style={[styles.transactionAmount, isPositive && styles.positiveAmount]}>
          {isPositive ? '+' : ''}₹{Math.abs(item.amount || 0).toFixed(2)}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <ScreenLayout>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading wallet...</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout scrollable>
      <SafeAreaView style={styles.container}>
        {/* Wallet Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>
          
          <View style={styles.balanceActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                // Navigate to add money screen
                navigation.navigate('AddMoney' as never);
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="add" size={20} color="#FF6B35" />
              <Text style={styles.actionButtonText}>Add Money</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={() => {
                // Show transaction history
                // Already visible below
              }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="history" size={20} color="#666" />
              <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
                History
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transaction History */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          
          {transactions.length > 0 ? (
            <View style={styles.transactionsList}>
              <FlatList
                data={transactions}
                renderItem={renderTransaction}
                keyExtractor={(item, index) => item.id || `transaction-${index}`}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="account-balance-wallet" size={64} color="#E0E0E0" />
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptySubtitle}>
                Your transaction history will appear here
              </Text>
              <TouchableOpacity
                style={styles.addMoneyButton}
                onPress={() => navigation.navigate('AddMoney' as never)}
                activeOpacity={0.8}
              >
                <Text style={styles.addMoneyButtonText}>Add Money</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  // Balance Card
  balanceCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: '700',
    color: '#FF6B35',
    marginBottom: 24,
  },
  balanceActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  actionButtonSecondary: {
    backgroundColor: '#F8F9FA',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF6B35',
  },
  actionButtonTextSecondary: {
    color: '#666',
  },
  // Transactions Section
  transactionsSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  transactionsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
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
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 13,
    color: '#666',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F44336',
  },
  positiveAmount: {
    color: '#4CAF50',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  addMoneyButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  addMoneyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
