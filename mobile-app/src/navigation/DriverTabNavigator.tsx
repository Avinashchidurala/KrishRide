import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, Platform } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Logo } from '../components/Logo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Driver screens
import DriverDashboardScreen from '../screens/driver/DashboardScreen';
import PublishRideScreen from '../screens/driver/PublishRideScreen';
import RideRequestsScreen from '../screens/driver/RideRequestsScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type DriverTabParamList = {
  Dashboard: undefined;
  PublishRide: undefined;
  RideRequests: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<DriverTabParamList>();

const TabBarIcon: React.FC<{ routeName: string; focused: boolean }> = ({
  routeName,
  focused,
}) => {
  const color = focused ? '#FF6B35' : '#8E8E93';
  const size = 24;

  switch (routeName) {
    case 'Dashboard':
      return <MaterialIcons name="dashboard" size={size} color={color} />;
    case 'PublishRide':
      return <MaterialIcons name="add-circle" size={size} color={color} />;
    case 'RideRequests':
      return <MaterialIcons name="event-note" size={size} color={color} />;
    case 'Profile':
      return <MaterialIcons name="person" size={size} color={color} />;
    default:
      return <MaterialIcons name="circle" size={size} color={color} />;
  }
};

export const DriverTabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // Remove header completely
        headerTitle: () => <Logo width={100} height={40} />,
        headerTitleAlign: 'center',
        headerStyle: {
          backgroundColor: '#FFFFFF',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: '#E9ECEF',
        },
        tabBarIcon: ({ focused }) => (
          <TabBarIcon routeName={route.name} focused={focused} />
        ),
        tabBarLabel: ({ focused, children }) => {
          return <Text style={{ color: focused ? '#FF6B35' : '#8E8E93', fontSize: 12, fontWeight: '500' }}>{children}</Text>;
        },
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      })}
    >
      <Tab.Screen name="Dashboard" component={DriverDashboardScreen} />
      <Tab.Screen name="PublishRide" component={PublishRideScreen} />
      <Tab.Screen name="RideRequests" component={RideRequestsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E9ECEF',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 12,
  },

  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    letterSpacing: 0.25,
  },
  tabBarIcon: {
    marginTop: 6,
  },
  iconText: {
    fontSize: 24,
  },
});

