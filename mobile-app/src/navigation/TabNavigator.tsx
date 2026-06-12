import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/tabs/HomeScreen';
import { ExploreScreen } from '../screens/tabs/ExploreScreen';
import { NotificationsScreen } from '../screens/tabs/NotificationsScreen';
import { ProfileTabScreen } from '../screens/tabs/ProfileTabScreen';

export type TabParamList = {
  Home: undefined;
  Explore: undefined;
  Notifications: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const getTabBarIcon = (routeName: string, focused: boolean) => {
  const icons: Record<string, { focused: string; unfocused: string }> = {
    Home: { focused: 'home', unfocused: 'home' },
    Explore: { focused: 'search', unfocused: 'search' },
    Notifications: { focused: 'notifications', unfocused: 'notifications-none' },
    Profile: { focused: 'person', unfocused: 'person-outline' },
  };

  const icon = icons[routeName] || { focused: 'circle', unfocused: 'radio-button-unchecked' };
  return icon;
};

const TabBarIcon: React.FC<{ routeName: string; focused: boolean }> = ({
  routeName,
  focused,
}) => {
  const iconConfig = getTabBarIcon(routeName, focused);
  const iconName = focused ? iconConfig.focused : iconConfig.unfocused;
  return (
    <MaterialIcons
      name={iconName as any}
      size={24}
      color={focused ? '#1A1A1A' : '#8E8E93'}
    />
  );
};

const getTabBarLabel = (routeName: string) => {
  const labels: Record<string, string> = {
    Home: 'Home',
    Explore: 'Explore',
    Notifications: 'Notifications',
    Profile: 'Profile',
  };
  return labels[routeName] || routeName;
};

export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabBarIcon routeName={route.name} focused={focused} />
        ),
        tabBarLabel: getTabBarLabel(route.name),
        tabBarActiveTintColor: '#1A1A1A',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIconStyle: styles.tabBarIcon,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileTabScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
      default: {
        elevation: 4,
      },
    }),
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  tabBarIcon: {
    marginTop: 4,
  },
});

