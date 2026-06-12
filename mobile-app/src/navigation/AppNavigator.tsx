import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppSelector } from '../store/hooks';
import { View, ActivityIndicator } from 'react-native';
import { CustomerTabNavigator } from './CustomerTabNavigator';
import { DriverTabNavigator } from './DriverTabNavigator';

// Auth screens
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import VerifyOTPScreen from '../screens/VerifyOTPScreen';

// Customer screens (stack screens)
import BookingDetailsScreen from '../screens/customer/BookingDetailsScreen';
import BookRideScreen from '../screens/customer/BookRideScreen';
import PayUPaymentScreen from '../screens/PayUPaymentScreen';
import WalletScreen from '../screens/customer/WalletScreen';
import SOSScreen from '../screens/customer/SOSScreen';
import PaymentScreen from '../screens/PaymentScreen';
import ReferralsScreen from '../screens/customer/ReferralsScreen';
import DriverReferralsScreen from '../screens/driver/ReferralsScreen';
import SupportScreen from '../screens/customer/SupportScreen';
import LiveTrackingScreen from '../screens/customer/LiveTrackingScreen';
import SearchRidesScreen from '../screens/customer/SearchRidesScreen';
import AddressesScreen from '../screens/customer/AddressesScreen';
import EditProfileScreen from '../screens/EditProfileScreen';

// Driver screens (stack screens)
import VehiclesScreen from '../screens/driver/VehiclesScreen';
import KYCScreen from '../screens/driver/KYCScreen';
import ActiveRideScreen from '../screens/driver/ActiveRideScreen';
import EarningsScreen from '../screens/driver/EarningsScreen';
import AddVehicleScreen from '../screens/driver/AddVehicleScreen';
import MyRidesScreen from '../screens/driver/MyRidesScreen';
import CustomerComplaintsScreen from '../screens/customer/ComplaintsScreen';
import CustomerSupportTicketsScreen from '../screens/customer/SupportTicketsScreen';
import DriverComplaintsScreen from '../screens/driver/ComplaintsScreen';
import DriverSupportTicketsScreen from '../screens/driver/SupportTicketsScreen';
import DriverSupportScreen from '../screens/driver/SupportScreen';

export type RootStackParamList = {
  // Auth
  Login: undefined;
  Signup: undefined;
  VerifyOTP: {
    mobile: string;
    type: 'login' | 'signup';
    role?: 'customer' | 'driver';
    signupData?: {
      firstName: string;
      lastName: string;
      email?: string;
      gender: string;
    };
  };

  // Main tabs (role-based)
  CustomerTabs: undefined;
  DriverTabs: undefined;

  // Customer stack screens
  BookingDetails: { bookingId: string };
  BookRide: { rideId: string };
  PayUPayment: { bookingId: string; amount: number };
  Wallet: undefined;
  SOS: undefined;
  Payment: undefined;
  CustomerReferrals: undefined;
  CustomerSupport: undefined;
  CustomerComplaints: undefined;
  CustomerSupportTickets: undefined;
  Addresses: undefined;
  EditProfile: undefined;
  LiveTracking: undefined;
  SearchRides: undefined;

  // Driver stack screens
  Vehicles: undefined;
  KYC: undefined;
  ActiveRide: { bookingId: string };
  Earnings: undefined;
  DriverReferrals: undefined;
  DriverSupport: undefined;
  MyRides: undefined;
  AddVehicle: undefined;
  DriverComplaints: undefined;
  DriverSupportTickets: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAppSelector((state) => state.auth);
  const userRole = user?.role;
  const navigationRef = useRef<any>(null);

  // Handle navigation after auth state is restored
  useEffect(() => {
    if (!isLoading && navigationRef.current) {
      // Small delay to ensure NavigationContainer is ready
      const timeoutId = setTimeout(() => {
        const navigator = navigationRef.current;
        if (navigator && isAuthenticated && userRole) {
          const targetRoute = userRole === 'customer' ? 'CustomerTabs' : 'DriverTabs';
          console.log('🚀 Navigating to', targetRoute, 'for user role:', userRole);
          navigator.reset({
            index: 0,
            routes: [{ name: targetRoute }],
          });
        } else if (navigator && !isAuthenticated) {
          console.log('🔐 Navigating to Login (not authenticated)');
          navigator.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, userRole, isLoading]);

  // Show loading screen while restoring auth state
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
        initialRouteName="Login" // Always start with Login, let useEffect handle navigation
      >
        {/* Auth Screens - Always available */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />

        {/* Customer Tab Navigator - Always registered */}
        <Stack.Screen name="CustomerTabs" component={CustomerTabNavigator} />
        <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} />
        <Stack.Screen name="BookRide" component={BookRideScreen} />
        <Stack.Screen name="PayUPayment" component={PayUPaymentScreen} />

            <Stack.Screen name="Wallet" component={WalletScreen} />
            <Stack.Screen name="SOS" component={SOSScreen} />
            <Stack.Screen name="Payment" component={PaymentScreen} />
            <Stack.Screen name="CustomerReferrals" component={ReferralsScreen} />
            <Stack.Screen name="CustomerSupport" component={SupportScreen} />
            <Stack.Screen name="LiveTracking" component={LiveTrackingScreen} />
            <Stack.Screen name="SearchRides" component={SearchRidesScreen} />
            <Stack.Screen name="Addresses" component={AddressesScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="CustomerComplaints" component={CustomerComplaintsScreen} />
            <Stack.Screen name="CustomerSupportTickets" component={CustomerSupportTicketsScreen} />

        {/* Driver Tab Navigator - Always registered */}
            <Stack.Screen name="DriverTabs" component={DriverTabNavigator} />
            <Stack.Screen name="Vehicles" component={VehiclesScreen} />
            <Stack.Screen name="KYC" component={KYCScreen} />
            <Stack.Screen name="ActiveRide" component={ActiveRideScreen} />
            <Stack.Screen name="Earnings" component={EarningsScreen} />
            <Stack.Screen name="DriverReferrals" component={DriverReferralsScreen} />
            <Stack.Screen name="DriverSupport" component={DriverSupportScreen} />
            <Stack.Screen name="AddVehicle" component={AddVehicleScreen} />
            <Stack.Screen name="MyRides" component={MyRidesScreen} />
            <Stack.Screen name="DriverComplaints" component={DriverComplaintsScreen} />
            <Stack.Screen name="DriverSupportTickets" component={DriverSupportTicketsScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
};

