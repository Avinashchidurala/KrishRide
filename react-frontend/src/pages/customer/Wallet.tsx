import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  CircularProgress,
  Avatar,
  Chip,
  Divider,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  TextField
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  TrendingUp as DebitIcon,
  TrendingDown as CreditIcon,
  History as HistoryIcon,
  CardGiftcard as GiftIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import { walletApi } from '../../services/walletApi';
import { useAppSelector } from '../../app/hooks';
import PageContainer from '../../components/common/PageContainer';
import StandardCard from '../../components/common/StandardCard';

export default function Wallet() {
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
        walletApi.getTransactions({ page: 1, limit: 50 }),
      ]);

      setBalance(balanceResult.balance || 0);
      setTransactions(transactionsResult.transactions || []);
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const getTransactionTypeIcon = (type: string, transactionType: string) => {
    if (type === 'credit') {
      if (transactionType === 'referral') return <GiftIcon />;
      return <CreditIcon />;
    }
    return <DebitIcon />;
  };

  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(t => t.type === filter);

      const theme = useTheme();
      const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <PageContainer maxWidth="lg" title="My Wallet" subtitle="Manage your wallet balance and view transaction history">
        {/* Balance Card */}
        <Card 
          sx={{
            borderRadius: 2,
            boxShadow: 3,
            mb: 3,
            background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C5A 50%, #E55A2B 100%)',
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
          <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" sx={{ opacity: 0.9, mb: 2, fontSize: '0.875rem' }}>
                  Wallet Balance
                </Typography>
                <Typography variant="h2" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '2rem', md: '3rem' } }}>
                  {formatAmount(balance)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                  <Chip
                    label="Available Balance"
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontWeight: 500,
                    }}
                  />
                </Box>
                <Typography variant="caption" sx={{ opacity: 0.8, mt: 2, display: 'block' }}>
                  Only referral & cashback amounts with validity
                </Typography>
              </Box>
              <WalletIcon sx={{ fontSize: { xs: 80, md: 120 }, opacity: 0.3 }} />
            </Box>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <StandardCard>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CreditIcon sx={{ color: 'success.main', fontSize: 32 }} />
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    Total Credits
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {formatAmount(
                      transactions
                        .filter(t => t.type === 'credit')
                        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
                    )}
                  </Typography>
                </Box>
              </Box>
            </StandardCard>
          </Grid>
          <Grid item xs={12} sm={4}>
            <StandardCard>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <DebitIcon sx={{ color: 'error.main', fontSize: 32 }} />
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    Total Debits
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.main' }}>
                    {formatAmount(
                      transactions
                        .filter(t => t.type === 'debit')
                        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
                    )}
                  </Typography>
                </Box>
              </Box>
            </StandardCard>
          </Grid>
          <Grid item xs={12} sm={4}>
            <StandardCard>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <HistoryIcon sx={{ color: 'info.main', fontSize: 32 }} />
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    Total Transactions
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'info.main' }}>
                    {transactions.length}
                  </Typography>
                </Box>
              </Box>
            </StandardCard>
          </Grid>
        </Grid>

        {/* Transactions */}
        <StandardCard>
          <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Transaction History
            </Typography>
          </Box>

            {/* Filter Tabs */}
            {isMobile && (
              <TextField
               value={filter}
               onChange={(e) => setFilter(e.target.value)}
                select
                fullWidth
                label="Filter Transactions"
              >
                 <MenuItem value="all">
                    All ({transactions.length})
                  </MenuItem>
                  <MenuItem value="credit">
                    Credits ({transactions.filter(t => t.type === 'credit').length})
                  </MenuItem>
                  <MenuItem value="debit">
                    Debits ({transactions.filter(t => t.type === 'debit').length})
                  </MenuItem>
              </TextField>
            )}
            {!isMobile && (
            <Tabs
              value={filter}
              onChange={(_, newValue) => setFilter(newValue)}
              variant="fullWidth"
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 500,
                },
              }}
            >
              <Tab label={`All (${transactions.length})`} value="all" />
              <Tab 
                label={`Credits (${transactions.filter(t => t.type === 'credit').length})`} 
                value="credit"
                icon={<CreditIcon />}
                iconPosition="start"
              />
              <Tab 
                label={`Debits (${transactions.filter(t => t.type === 'debit').length})`} 
                value="debit"
                icon={<DebitIcon />}
                iconPosition="start"
              />
            </Tabs>
            )}

            <Box sx={{ p: 3 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
                  <CircularProgress size={48} />
                </Box>
              ) : filteredTransactions.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <WalletIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2 }}>
                    No transactions found
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                    {filter === 'all' 
                      ? 'Your transaction history will appear here'
                      : `No ${filter} transactions`}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {filteredTransactions.map((transaction, index) => (
                    <Paper
                      key={transaction.id}
                      sx={{
                        p: 3,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': {
                          borderColor: transaction.type === 'credit' ? 'success.main' : 'error.main',
                          transform: 'translateY(-2px)',
                          boxShadow: 2,
                        },
                        transition: 'all 0.2s',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: {xs:'center',md:'space-between'},flexDirection:{xs:'column',md:'row'} }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56 }}>
                            {getTransactionTypeIcon(transaction.type, transaction.transaction_type)}
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {transaction.description || transaction.transaction_type || 'Transaction'}
                              </Typography>
                              {transaction.transaction_type === 'referral' && (
                                <Chip
                                  icon={<GiftIcon />}
                                  label="Referral"
                                  size="small"
                                  sx={{ bgcolor: 'success.light', color: 'success.dark' }}
                                />
                              )}
                            </Box>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {formatDate(transaction.createdAt)}
                            </Typography>
                            {transaction.valid_till && (
                              <Box sx={{ mt: 1 }}>
                                <Chip
                                  label={`Valid till ${new Date(transaction.valid_till).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}`}
                                  size="small"
                                  sx={{ bgcolor: 'warning.light', color: 'warning.dark', fontSize: '0.7rem' }}
                                />
                              </Box>
                            )}
                          </Box>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              color: transaction.type === 'credit' ? 'success.main' : 'error.main'
                            }}
                          >
                            {transaction.type === 'credit' ? '+' : '-'}
                            {formatAmountWithDecimals(parseFloat(transaction.amount || 0))}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {transaction.type === 'credit' ? 'Credited' : 'Debited'}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
        </StandardCard>
    </PageContainer>
  );
}
