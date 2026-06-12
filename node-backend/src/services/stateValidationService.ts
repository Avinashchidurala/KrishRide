/**
 * State Validation Service
 * 
 * Provides database-driven state validation with caching.
 * Handles dynamic state management for service availability.
 * All validation is strictly based on the service_states table.
 */

import prisma from '../config/database';
import { cacheService, cacheKeys, cacheTTL } from './cacheService';

interface CachedState {
  name: string;
  isActive: boolean;
}

class StateValidationService {
  private cachedStates: CachedState[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

  /**
   * Normalize state name for comparison (trim and case-insensitive)
   */
  private normalizeStateName(state: string): string {
    return state.trim().toLowerCase();
  }

  /**
   * Check if a state is available and active in the database
   * 
   * @param stateName - State name to validate
   * @returns True if state exists and is_active = true, false otherwise
   */
  async isStateAvailable(stateName: string | undefined | null): Promise<boolean> {
    if (!stateName || typeof stateName !== 'string') {
      return false;
    }

    try {
      const normalizedInput = this.normalizeStateName(stateName);
      const activeStates = await this.getActiveStates();

      // Check if state exists and is active (case-insensitive)
      const isAvailable = activeStates.some(
        state => this.normalizeStateName(state.name) === normalizedInput
      );

      return isAvailable;
    } catch (error) {
      console.error('Error checking state availability:', error);
      // Throw error instead of fallback - fail fast
      throw new Error('Unable to validate state availability. Please try again.');
    }
  }

  /**
   * Get the exact state name from database (case-corrected)
   * 
   * @param stateName - State name to find
   * @returns Exact state name from database or null if not found
   */
  async getExactStateName(stateName: string | undefined | null): Promise<string | null> {
    if (!stateName || typeof stateName !== 'string') {
      return null;
    }

    try {
      const normalizedInput = this.normalizeStateName(stateName);
      const activeStates = await this.getActiveStates();

      const exactState = activeStates.find(
        state => this.normalizeStateName(state.name) === normalizedInput
      );

      return exactState?.name ?? null;
    } catch (error) {
      console.error('Error getting exact state name:', error);
      // Throw error instead of fallback - fail fast
      throw new Error('Unable to retrieve state information. Please try again.');
    }
  }

  /**
   * Get unavailable state error message dynamically from database
   * 
   * @returns Error message with list of available states
   */
  async getUnavailableStateMessage(): Promise<string> {
    try {
      const activeStates = await this.getActiveStates();

      if (activeStates.length === 0) {
        return 'Services are not available for the location you are searching.';
      }

      // Format state names for message
      const stateNames = activeStates.map(state => state.name);
      const formattedStates = this.formatStateList(stateNames);

      return `Currently available only in ${formattedStates}`;
    } catch (error) {
      console.error('Error generating unavailable state message:', error);
      // Return generic message - don't fallback to hardcoded list
      return 'Services are not available for the location you are searching.';
    }
  }

  /**
   * Get all available active states from database with caching
   * Fails fast if database is unavailable.
   * 
   * @returns Array of available states where is_active = true
   */
  private async getActiveStates(): Promise<CachedState[]> {
    // Check in-memory cache first
    const now = Date.now();
    if (this.cachedStates !== null && (now - this.cacheTimestamp) < this.CACHE_TTL_MS) {
      console.log('[StateValidationService] Using in-memory cache');
      return this.cachedStates;
    }

    try {
      // Try Redis cache
      // const cacheKey = cacheKeys.activeStates();
      // const cachedData = await cacheService.get<CachedState[]>(cacheKey);

      // if (cachedData !== null) {
      //   console.log('[StateValidationService] Using Redis cache');
      //   this.cachedStates = cachedData;
      //   this.cacheTimestamp = now;
      //   return cachedData;
      // }

      // Fetch from database
      // console.log('[StateValidationService] Fetching from database');
      const states = await prisma.serviceState.findMany({
        where: { is_active: true },
        select: {
          name: true,
          is_active: true,
        },
        orderBy: { name: 'asc' },
      });

      const mappedStates: CachedState[] = states.map((state: any) => ({
        name: state.name,
        isActive: state.is_active,
      }));

      // Cache in Redis
      // await cacheService.set(
      //   cacheKey,
      //   mappedStates,
      //   cacheTTL.activeStates
      // );

      // Cache in memory
      // this.cachedStates = mappedStates;
      // this.cacheTimestamp = now;

      return mappedStates;
    } catch (error) {
      console.error('[StateValidationService] Error fetching active states:', error);

      // If in-memory cache exists (even stale), use it
      if (this.cachedStates !== null) {
        console.warn('[StateValidationService] Database error - using stale in-memory cache as fallback');
        return this.cachedStates;
      }

      // No cache available - throw error to fail fast
      throw new Error('Unable to fetch service states from database. Service temporarily unavailable.');
    }
  }

  /**
   * Format state list for display
   * 
   * @param states - Array of state names
   * @returns Formatted string like "State1, State2, State3 and State4"
   */
  private formatStateList(states: string[]): string {
    if (states.length === 0) return '';
    if (states.length === 1) return states[0];
    if (states.length === 2) return `${states[0]} and ${states[1]}`;

    const allButLast = states.slice(0, -1).join(', ');
    const last = states[states.length - 1];

    return `${allButLast} and ${last}`;
  }

  /**
   * Clear all caches (useful for testing or manual cache invalidation)
   */
  // async clearCache(): Promise<void> {
  //   this.cachedStates = null;
  //   this.cacheTimestamp = 0;
  //   await cacheService.delete(cacheKeys.activeStates());
  //   console.log('[StateValidationService] Caches cleared');
  // }

  /**
   * Refresh cache immediately
   */
  // async refreshCache(): Promise<CachedState[]> {
  //   this.cachedStates = null;
  //   this.cacheTimestamp = 0;
  //   await cacheService.delete(cacheKeys.activeStates());
  //   return this.getActiveStates();
  // }

  /**
   * Get all states (including inactive) - for admin purposes
   */
  async getAllStates(includeInactive: boolean = false) {
    try {
      return await prisma.serviceState.findMany({
        where: includeInactive ? {} : { is_active: true },
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      console.error('Error fetching all states:', error);
      return [];
    }
  }

  /**
   * Get count of active states
   */
  async getStateCount(): Promise<number> {
    try {
      const states = await this.getActiveStates();
      return states.length;
    } catch (error) {
      console.error('Error getting state count:', error);
      // Throw error - don't use fallback
      throw error;
    }
  }

  /**
   * Validate state status (Active, Inactive, or Not Found)
   */
  async validateStateStatus(stateName: string): Promise<{
    isValid: boolean;
    status: 'active' | 'inactive' | 'not_found';
    message?: string;
    state?: any;
  }> {
    if (!stateName) {
      return { isValid: false, status: 'not_found' };
    }

    try {
      const normalizedInput = this.normalizeStateName(stateName);

      // Get ALL states (active and inactive)
      const allStates = await prisma.serviceState.findMany();

      // First try exact match
      let matchedState = allStates.find(
        state => this.normalizeStateName(state.name) === normalizedInput
      );

      // If no exact match, check if input string contains state name (e.g. "Bangalore, Karnataka" contains "Karnataka")
      if (!matchedState) {
        matchedState = allStates.find(
          state => normalizedInput.includes(this.normalizeStateName(state.name))
        );
      }

      if (!matchedState) {
        return {
          isValid: false,
          status: 'not_found',
          message: 'Services are not available for the location you are searching.'
        };
      }

      if (!matchedState.is_active) {
        return {
          isValid: false,
          status: 'inactive',
          message: 'We have resumed our services at the current location', // Exact text requested by user
          state: matchedState
        };
      }

      return {
        isValid: true,
        status: 'active',
        state: matchedState
      };

    } catch (error) {
      console.error('Error validating state status:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const stateValidationService = new StateValidationService();
