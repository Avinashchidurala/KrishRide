import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity, ActivityIndicator,
  Platform, Image} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import { userApi } from '../services/userApi';
import { bookingsApi } from '../services/bookingsApi';
import { ScreenLayout } from '../components/layout';
import { Card } from '../components/ui/Card';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = user?.role === 'driver'
        ? await userApi.getDriverProfile()
        : await userApi.getUserProfile();
 //setProfile(data.profile || data);
      let profileData = data.profile || data;

      // Frontend fix: Fetch actual bookings count for customers to ensure accuracy
      if (user?.role === 'customer') {
        try {
          const bookingsResult = await bookingsApi.getCustomerBookings();
          const bookings = bookingsResult.bookings || [];

          const completedCount = bookings.filter((b: any) =>
            b.status?.toLowerCase() === 'completed'
          ).length;

          // Override the count from profile API with actual calculated count
          profileData = {
            ...profileData,
            completedBookings: completedCount,
            totalBookings: bookings.length
          };

          console.log('📱 Calculated profile stats:', {
            completed: completedCount,
            total: bookings.length
          });
        } catch (bookingError) {
          console.error('Error fetching bookings for stats:', bookingError);
        }
      }

      setProfile(profileData);

      // Log profile data for debugging
      console.log('📱 Profile loaded:', {
             //profile: data.profile || data,
        profile: profileData,
        user: user,
         //profilePhotoUrl: (data.profile || data)?.profile_photo_url || user?.profile_photo_url,
        profilePhotoUrl: profileData?.profile_photo_url || user?.profile_photo_url,
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: () => {
          dispatch(logout());
        },
      },
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return '#4CAF50';
      case 'confirmed':
        return '#2196F3';
      case 'pending':
        return '#FF9800';
      case 'cancelled':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusLabel = (status: string) => {
    return status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase() || 'Pending';
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

  const menuItems = [
    ...(user?.role === 'customer'
      ? [
        {
          label: 'My Wallet',
          iconName: 'account-balance-wallet',
          onPress: () => navigation.navigate('Wallet' as never),
        },
        {
          label: 'My Bookings',
          iconName: 'event-note',
          onPress: () => navigation.navigate('MyBookings' as never),
        },
      ]
      : []),
    ...(user?.role === 'driver'
      ? [
        {
          label: 'My Vehicles',
          iconName: 'directions-car',
          onPress: () => navigation.navigate('Vehicles' as never),
        },
        {
          label: 'KYC Status',
          iconName: 'verified-user',
          onPress: () => navigation.navigate('KYC' as never),
        },
        {
          label: 'Earnings',
          iconName: 'account-balance-wallet',
          onPress: () => navigation.navigate('Earnings' as never),
        },
      ]
      : []),
    {
      label: 'Referrals',
      iconName: 'card-giftcard',
      onPress: () => navigation.navigate(
        (user?.role === 'customer' ? 'CustomerReferrals' : 'DriverReferrals') as never
      ),
    },
    {
      label: 'Complaints',
      iconName: 'report-problem',
      onPress: () => navigation.navigate(
        (user?.role === 'customer' ? 'CustomerComplaints' : 'DriverComplaints') as never
      ),
    },
    {
      label: 'Support Tickets',
      iconName: 'support-agent',
      onPress: () => navigation.navigate(
        (user?.role === 'customer' ? 'CustomerSupportTickets' : 'DriverSupportTickets') as never
      ),
    },
    {
      label: 'Help & Support',
      iconName: 'help-outline',
      onPress: () => navigation.navigate(
        (user?.role === 'customer' ? 'CustomerSupport' : 'DriverSupport') as never
      ),
    },
    {
      label: 'Settings',
      iconName: 'settings',
      onPress: () => console.log('Settings'),
    },
  ];

  if (loading) {
    return (
      <ScreenLayout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </ScreenLayout>
    );
  }

  const recentBookings = profile?.recentBookings || [];
  const displayBookings = recentBookings.slice(0, 4);

  return (
    <ScreenLayout scrollable>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.profileHeader}>
              <TouchableOpacity
                onPress={() => navigation.navigate('EditProfile' as never)}
                style={styles.avatarContainer}
              >
                {(user?.profile_photo_url || profile?.profile_photo_url) ? (
                  <Image
                    source={{
                      uri: user?.profile_photo_url || profile?.profile_photo_url,
                      cache: 'force-cache'
                    }}
                    style={styles.avatar}
                    onError={(error) => {
                      console.error('Error loading profile photo:', error);
                    }}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <MaterialIcons name="account-circle" size={60} color="#E0E0E0" />
                  </View>
                )}
                <View style={styles.editBadge}>
                  <MaterialIcons name="edit" size={14} color="#fff" />
                </View>
              </TouchableOpacity>
              <View style={styles.profileInfo}>
                <Text style={styles.userName}>
                  {profile?.firstName && profile?.lastName
                    ? `${profile.firstName} ${profile.lastName}`
                    : user?.first_name && user?.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user?.firstName && user?.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : 'User'}
                </Text>
                <Text style={styles.userMobile}>{user?.mobile || profile?.mobile || ''}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        {profile && (
          <View style={styles.statsCard}>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <MaterialIcons name="directions-car" size={24} color="#FF6B35" />
                <Text style={styles.statValue}>{profile.totalBookings || 0}</Text>
                <Text style={styles.statLabel}>Total Rides</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
                <Text style={styles.statValue}>{profile.completedBookings || 0}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <MaterialIcons name="star" size={24} color="#FFB800" />
                <Text style={styles.statValue}>
                  {profile.averageRating && typeof profile.averageRating === 'number'
                    ? profile.averageRating.toFixed(1)
                    : 'N/A'}
                </Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            </View>
          </View>
        )}

        {/* Recent Activity Section - Most Important */}
        {displayBookings.length > 0 && (
          <View style={styles.activityCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              {recentBookings.length > 4 && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('MyBookings' as never)}
                  style={styles.viewAllButton}
                >
                  <Text style={styles.viewAllText}>View All</Text>
                  <MaterialIcons name="chevron-right" size={18} color="#FF6B35" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.activityList}>
              {displayBookings.map((booking: any, index: number) => {
                const status = booking.status || 'pending';
                const statusColor = getStatusColor(status);
                const route = booking.ride
                  ? `${booking.ride.start_location} → ${booking.ride.end_location}`
                  : 'Route not available';
                const date = booking.ride?.scheduled_time
                  ? formatDate(booking.ride.scheduled_time)
                  : formatDate(booking.created_at || booking.createdAt);
                const amount = booking.total_fare || booking.totalFare || 0;

                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.activityItem}
                    onPress={() => {
                      // Navigate to booking details if available
                      if (booking.id) {
                        navigation.navigate('BookingDetails' as never, { bookingId: booking.id } as never);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.activityContent}>
                      <View style={styles.activityMain}>
                        <Text style={styles.activityRoute} numberOfLines={1}>
                          {route}
                        </Text>
                        <Text style={styles.activityDate}>{date}</Text>
                      </View>
                      <View style={styles.activityRight}>
                        <Text style={styles.activityAmount}>₹{Number(amount).toFixed(2)}</Text>
                        <View style={[styles.statusPill, { backgroundColor: statusColor }]}>
                          <Text style={styles.statusPillText}>{getStatusLabel(status)}</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Account Settings Section */}
        <View style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <View style={styles.settingsList}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={item.onPress}
                style={styles.settingsItem}
                activeOpacity={0.7}
              >
                <View style={styles.settingsItemContent}>
                  <MaterialIcons name={item.iconName as any} size={22} color="#FF6B35" />
                  <Text style={styles.settingsItemText}>{item.label}</Text>
                  <MaterialIcons name="chevron-right" size={20} color="#ADB5BD" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout Button - De-emphasized */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutButton}
            activeOpacity={0.7}
          >
            <MaterialIcons name="logout" size={18} color="#666" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
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
    paddingBottom: 16,
  },
  loadingContainer: {
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
  // Header Card
  headerCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    marginBottom: 12,
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
  headerContent: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0F0F0',
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  userMobile: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  // Stats Card
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
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
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
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
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  // Activity Card
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  activityContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  activityMain: {
    flex: 1,
    marginRight: 12,
  },
  activityRoute: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  activityDate: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  activityRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  // Settings Card
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
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
  settingsList: {
    marginTop: 8,
  },
  settingsItem: {
    height: 48,
    justifyContent: 'center',
  },
  settingsItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingsItemText: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
    marginLeft: 12,
  },
  // Logout
  logoutContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  logoutButtonText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 20,
  },
});
