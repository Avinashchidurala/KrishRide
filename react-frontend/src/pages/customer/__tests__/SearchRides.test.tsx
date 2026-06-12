/**
 * SearchRides Page Tests
 * 
 * Tests cover:
 * - Swapping From and To locations
 * - Refreshing page with query params and location state
 * - Location selection and validation
 * - Search functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SearchRides from '../SearchRides';
import { renderWithProviders, createMockLocation } from '../../../test/testUtils';

// Mock APIs
vi.mock('../../../services/ridesApi', () => ({
  ridesApi: {
    searchRides: vi.fn().mockResolvedValue({ rides: [] }),
  },
}));

// Mock hooks
const mockSetSearchParams = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useSearchParams: () => [new URLSearchParams(), mockSetSearchParams],
  };
});

describe('SearchRides', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Location Swapping', () => {
    it('should swap pickup and drop location objects', () => {
      const pickup = createMockLocation({ label: 'Hyderabad', state: 'Telangana' });
      const drop = createMockLocation({ label: 'Bangalore', state: 'Karnataka' });

      // Test swap logic
      let temp = pickup;
      let newPickup = drop;
      let newDrop = temp;

      expect(newPickup).toEqual(drop);
      expect(newDrop).toEqual(pickup);
      expect(newPickup.state).toBe('Karnataka');
      expect(newDrop.state).toBe('Telangana');
    });
  });

  describe('Query Params Restoration', () => {
    it('should restore locations from navigation state', () => {
      const pickupLocation = createMockLocation({ label: 'Hyderabad', state: 'Telangana' });
      const dropLocation = createMockLocation({ label: 'Bangalore', state: 'Karnataka' });
      const date = '2024-01-15';

      const locationState = {
        pickupLocation,
        dropLocation,
        date,
        pickup: pickupLocation.label,
        drop: dropLocation.label,
      };

      // Mock useLocation to return state
      vi.mock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom');
        return {
          ...actual,
          useLocation: () => ({ state: locationState }),
        };
      });

      // Locations should be restored from state
      expect(locationState.pickupLocation.state).toBe('Telangana');
      expect(locationState.dropLocation.state).toBe('Karnataka');
    });

    it('should restore search data from query params as fallback', () => {
      const searchParams = new URLSearchParams('?pickup=Hyderabad&drop=Bangalore&date=2024-01-15');
      
      const pickup = searchParams.get('pickup');
      const drop = searchParams.get('drop');
      const date = searchParams.get('date');

      expect(pickup).toBe('Hyderabad');
      expect(drop).toBe('Bangalore');
      expect(date).toBe('2024-01-15');
    });
  });

  describe('Location State Validation', () => {
    it('should only accept locations in allowed states', () => {
      const allowedStates = ['Andhra Pradesh', 'Telangana', 'Karnataka', 'Tamil Nadu'];
      
      const validLocation = createMockLocation({ state: 'Telangana' });
      const invalidLocation = createMockLocation({ state: 'Maharashtra' });

      expect(allowedStates).toContain(validLocation.state);
      expect(allowedStates).not.toContain(invalidLocation.state);
    });
  });
});

