// Safe Platform wrapper - simple re-export of React Native Platform
import { Platform } from 'react-native';

export const SafePlatform = {
  get OS() {
    return Platform.OS;
  },
  get Version() {
    return Platform.Version;
  },
  select(obj: any) {
    return Platform.select(obj);
  },
  isIOS() {
    return Platform.OS === 'ios';
  },
  isAndroid() {
    return Platform.OS === 'android';
  },
};

// Export commonly used values
export const PlatformOS = Platform.OS;
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
