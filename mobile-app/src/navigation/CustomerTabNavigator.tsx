import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, Platform } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

// Customer screens
import CustomerDashboardScreen from '../screens/customer/DashboardScreen';
import MyBookingsScreen from '../screens/customer/MyBookingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type CustomerTabParamList = {
  Home: undefined;
  MyBookings: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<CustomerTabParamList>();

const TabBarIcon: React.FC<{ routeName: string; focused: boolean }> = ({
  routeName,
  focused,
}) => {
  const color = focused ? '#FF6B35' : '#8E8E93';
  const size = 24;

         switch (routeName) {
           case 'Home':
             return <MaterialIcons name="home" size={size} color={color} />;
           case 'MyBookings':
             return <MaterialIcons name="event-note" size={size} color={color} />;
           case 'Profile':
             return <MaterialIcons name="person" size={size} color={color} />;
           default:
             return <MaterialIcons name="circle" size={size} color={color} />;
         }
};

export const CustomerTabNavigator: React.FC = () => {
    const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // Remove header completely
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
      <Tab.Screen name="Home" component={CustomerDashboardScreen} />
      <Tab.Screen name="MyBookings" component={MyBookingsScreen} />
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

