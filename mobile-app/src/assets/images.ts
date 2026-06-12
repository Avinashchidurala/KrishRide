/**
 * Centralized image paths for React Native
 * Assets are located in the assets/ folder at project root
 */
export const images = {
  // Main logo - using icon-new.png from frontend (the hushryd-logo-new.jpg is actually a PDF)
  logo: require('../../assets/icon-new.png'),
  logoNew: require('../../assets/icon-new.png'),
  
  // Icons
  icon: require('../../assets/icon.png'),
  iconNew: require('../../assets/icon-new.png'),
  icon512: require('../../assets/icon-512.png'),
  icon192: require('../../assets/icon-192.png'),
  favicon: require('../../assets/favicon.png'),
  favicon192: require('../../assets/favicon-192.png'),
  favicon512: require('../../assets/favicon-512.png'),
  adaptiveIcon: require('../../assets/adaptive-icon.png'),
  
  // Splash screen
  splash: require('../../assets/splash.png'),
} as const;

export default images;

