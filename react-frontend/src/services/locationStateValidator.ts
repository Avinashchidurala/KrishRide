/**
 * Location State Validation Service
 * 
 * Validates user locations against active service states in the database
 * Shows dynamic error messages with available states
 */

import adminStateService from './adminStateService';
import api from './api';

interface ActiveState {
  id: string;
  name: string;
  is_active: boolean;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
  availableStates?: ActiveState[];
}

class LocationStateValidator {
  private activeStatesCache: ActiveState[] | null = null;
  private cacheExpiry: number | null = null;
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch active states from backend
   */
  /**
   * Fetch active states from backend
   */
  private async fetchActiveStates(): Promise<ActiveState[]> {
    try {
      const response = await adminStateService.getAvailableStates();
      return response || [];
    } catch (error) {
      console.error('Error fetching active states:', error);
      return [];
    }
  }

  /**
   * Get active states with caching
   */
  async getActiveStates(forceRefresh = false): Promise<ActiveState[]> {
    const now = Date.now();

    // Return cached states if still valid and not force refreshing
    if (
      !forceRefresh &&
      this.activeStatesCache &&
      this.cacheExpiry &&
      now < this.cacheExpiry
    ) {
      return this.activeStatesCache;
    }

    // Fetch fresh states
    const states = await this.fetchActiveStates();
    this.activeStatesCache = states;
    this.cacheExpiry = now + this.CACHE_DURATION;

    return states;
  }

  /**
   * Validate if a location is in an active service state
   */
  async validateLocation(location: string): Promise<ValidationResult> {
    if (!location) {
      return { isValid: false, error: 'Location is required' };
    }

    try {
      // Use the new backend endpoint for strict validation
      const response = await api.post('/public/validate-state', {
        state: location // Send full location string for backend parsing
      });

      const result = response.data;

      if (!result.isValid) {
        if (result.status === 'inactive') {
          return {
            isValid: false,
            error: result.message || 'We have resumed our services at the current location',
          };
        }

        // Status 'not_found' or other error
        return {
          isValid: false,
          error: result.message || 'Services are not available for the location you are searching.'
        };
      }

      return { isValid: true };

    } catch (error: any) {
      console.error('Location validation error:', error);
      // Fallback for network errors - show generic message or try cached
      const msg = error.response?.data?.message || 'Error validating location. Please try again.';
      return {
        isValid: false,
        error: msg,
      };
    }
  }

  /**
   * Validate both pickup and drop locations
   */
  async validateBothLocations(
    pickup: string,
    drop: string
  ): Promise<{
    pickupValid: boolean;
    dropValid: boolean;
    pickupError?: string;
    dropError?: string;
    availableStates?: ActiveState[];
  }> {
    const pickupResult = await this.validateLocation(pickup);
    const dropResult = await this.validateLocation(drop);

    return {
      pickupValid: pickupResult.isValid,
      dropValid: dropResult.isValid,
      pickupError: pickupResult.error,
      dropError: dropResult.error,
      availableStates: [], // Not really needed with specific error messages
    };
  }

  /**
   * Get formatted list of available states for display
   */
  async getAvailableStatesText(): Promise<string> {
    const activeStates = await this.getActiveStates();

    if (activeStates.length === 0) {
      return 'No service areas available at the moment';
    }

    const stateNames = activeStates.map(s => s.name).join(', ');
    return `Currently we are available in ${stateNames}`;
  }

  /**
   * Clear cache (useful after admin updates states)
   */
  clearCache(): void {
    this.activeStatesCache = null;
    this.cacheExpiry = null;
  }
}

// Export singleton instance
export const locationStateValidator = new LocationStateValidator();

export type { ValidationResult, ActiveState };
