// Background location service - DISABLED: Live tracking removed
// This file is kept for compatibility but all functions are no-ops

import AsyncStorage from '@react-native-async-storage/async-storage';

// Stub implementations - live tracking has been removed
export const startBackgroundLocationUpdates = async (bookingId: string): Promise<boolean> => {
  console.log('Background location updates disabled - live tracking removed');
  return false;
};

export const stopBackgroundLocationUpdates = async (): Promise<void> => {
  console.log('Background location updates disabled - live tracking removed');
  try {
    await AsyncStorage.removeItem('activeBookingId');
  } catch (error) {
    console.error('Error clearing active booking ID:', error);
  }
};

export const isBackgroundLocationRunning = async (): Promise<boolean> => {
  return false;
};
