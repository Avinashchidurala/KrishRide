/**
 * Recent Searches Utility
 * 
 * Manages recent location searches using AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_SEARCHES_KEY = 'location_recent_searches';
const MAX_RECENT_SEARCHES = 10;

export interface RecentSearch {
  label: string;
  lat: number;
  lng: number;
  city: string;
  state: string;
  country: 'India';
  type: 'CITY' | 'AREA' | 'LANDMARK';
  timestamp: number;
}

/**
 * Get recent searches from storage
 */
export const getRecentSearches = async (): Promise<RecentSearch[]> => {
  try {
    const data = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
    if (!data) return [];
    
    const searches: RecentSearch[] = JSON.parse(data);
    // Sort by timestamp (most recent first)
    return searches.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error getting recent searches:', error);
    return [];
  }
};

/**
 * Add a location to recent searches
 */
export const addRecentSearch = async (location: Omit<RecentSearch, 'timestamp'>): Promise<void> => {
  try {
    const recentSearches = await getRecentSearches();
    
    // Remove duplicate if exists (same label and coordinates)
    const filtered = recentSearches.filter(
      (search) => 
        !(search.label === location.label && 
          Math.abs(search.lat - location.lat) < 0.0001 && 
          Math.abs(search.lng - location.lng) < 0.0001)
    );
    
    // Add new search at the beginning
    const newSearch: RecentSearch = {
      ...location,
      timestamp: Date.now(),
    };
    
    const updated = [newSearch, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error adding recent search:', error);
  }
};

/**
 * Clear all recent searches
 */
export const clearRecentSearches = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch (error) {
    console.error('Error clearing recent searches:', error);
  }
};

