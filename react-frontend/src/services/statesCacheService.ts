/**
 * States Service (No Cache)
 *
 * Always fetches active service states directly from the database via API.
 * No caching, no TTL, no stale fallback.
 *
 * Guarantees:
 * - Always up-to-date data
 * - Only active states (is_active = true)
 * - Simple and predictable behavior
 */

interface ServiceState {
  id: string;
  name: string;
  is_active: boolean;
}

class StatesService {
  /**
   * Get active states (always fetched from API)
   *
   * @returns Array of active state names from service_states table
   */
  async getActiveStates(): Promise<string[]> {
    try {
      console.log('[StatesService] 🔄 Fetching states from /api/public/service-states...');

      const response = await fetch('/api/public/service-states');

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const data = await response.json();
      console.log('[StatesService] 📦 Raw API Response:', data);

      if (!Array.isArray(data)) {
        throw new Error('API response is not an array');
      }

      // Extract only active state names
      const activeStateNames = data
        .filter((state: ServiceState) => state.is_active === true)
        .map((state: ServiceState) => state.name);

      console.log('[StatesService] ✅ Loaded active states:', activeStateNames);
      console.log(`[StatesService] 📊 Total active states: ${activeStateNames.length}`);

      return activeStateNames;
    } catch (error) {
      console.error('[StatesService] ❌ Failed to fetch service states:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to fetch service states: ${errorMessage}`);
    }
  }
}

// Export singleton instance
export const statesService = new StatesService();
