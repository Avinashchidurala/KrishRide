import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Paper,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  TrendingUp as CreditIcon,
  TrendingDown as DebitIcon,
} from '@mui/icons-material';
import { walletApi } from '../../services/walletApi';
import PageContainer from '../../components/common/PageContainer';
import StandardCard from '../../components/common/StandardCard';
import { useAppSelector } from '../../app/hooks';

export default function DriverWallet() {
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const [balanceResult, transactionsResult] = await Promise.all([
        walletApi.getBalance(),
        walletApi.getDriverTransactions({ page: 1, limit: 50 }, user?.driver?.id),
      ]);

      setBalance(balanceResult.balance || 0);
      setTransactions(transactionsResult.transactions || []);
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  console.log('Driver Wallet Transactions:', transactions);
  console.log('Driver ID:', user?.driver?.id);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatAmountWithDecimals = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  };


    const filteredTransactions = filter === 'all' 
      ? transactions 
      : transactions.filter(t => t.type === filter);
  
        const theme = useTheme();
        const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <PageContainer title="My Wallet">
      {/* Balance Card */}
      <Card 
        sx={{ 
          borderRadius: 3, 
          mb: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
           position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -30,
              left: -30,
              width: 150,
              height: 150,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
            },
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                Wallet Balance
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                {formatAmount(balance)}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Earnings and referral bonuses
              </Typography>
            </Box>
            <WalletIcon sx={{ fontSize: 64, opacity: 0.5 }} />
          </Box>
        </CardContent>
      </Card>

      {/* Transactions */}
      <StandardCard>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
          Wallet Transactions
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress />
          </Box>
        ) : transactions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              No transactions yet
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {transactions.map((transaction) => (
              <Paper
                key={transaction.id}
                sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': { boxShadow: 2 },
                  transition: 'box-shadow 0.2s',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: transaction.type === 'credit' ? 'success.light' : 'error.light',
                      }}
                    >
                      {transaction.type === 'credit' ? (
                        <CreditIcon sx={{ color: 'success.main' }} />
                      ) : (
                        <DebitIcon sx={{ color: 'error.main' }} />
                      )}
                    </Box>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {transaction.description || transaction.transaction_type}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {formatDate(transaction.createdAt)}
                        {transaction.valid_till && (
                          <Box component="span" sx={{ ml: 1 }}>
                            - Valid till {formatDate(transaction.valid_till)}
                          </Box>
                        )}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{ 
                      fontWeight: 700,
                      color: transaction.type === 'credit' ? 'success.main' : 'error.main'
                    }}
                  >
                    {transaction.type === 'credit' ? '+' : '-'}
                    {formatAmount(transaction.amount)}
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </StandardCard>
    </PageContainer>
  );
}

