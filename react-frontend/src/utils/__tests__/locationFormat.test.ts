/**
 * Location Format Utility Tests
 * 
 * Tests for location type mapping and standardization
 */

import { describe, it, expect } from 'vitest';
import { mapPlaceTypeToLocationType, extractStandardizedLocation, LocationType } from '../locationFormat';

describe('Location Format Utilities', () => {
  describe('mapPlaceTypeToLocationType', () => {
    it('should map locality to CITY', () => {
      const types = ['locality', 'political'];
      const result = mapPlaceTypeToLocationType(types);
      expect(result).toBe('CITY');
    });

    it('should map sublocality to AREA', () => {
      const types = ['sublocality', 'sublocality_level_1'];
      const result = mapPlaceTypeToLocationType(types);
      expect(result).toBe('AREA');
    });

    it('should map neighborhood to AREA', () => {
      const types = ['neighborhood', 'political'];
      const result = mapPlaceTypeToLocationType(types);
      expect(result).toBe('AREA');
    });

    it('should map point_of_interest to LANDMARK', () => {
      const types = ['point_of_interest', 'establishment'];
      const result = mapPlaceTypeToLocationType(types);
      expect(result).toBe('LANDMARK');
    });

    it('should map administrative_area_level_2 to CITY as fallback', () => {
      const types = ['administrative_area_level_2', 'political'];
      const result = mapPlaceTypeToLocationType(types);
      expect(result).toBe('CITY');
    });

    it('should default to LANDMARK for unknown types', () => {
      const types = ['establishment', 'store'];
      const result = mapPlaceTypeToLocationType(types);
      expect(result).toBe('LANDMARK');
    });
  });

  describe('extractStandardizedLocation', () => {
    it('should extract CITY location correctly', () => {
      const mockPlace = {
        formatted_address: 'Hyderabad, Telangana, India',
        geometry: {
          location: {
            lat: () => 17.3850,
            lng: () => 78.4867,
          },
        },
        address_components: [
          {
            long_name: 'Hyderabad',
            short_name: 'Hyderabad',
            types: ['locality', 'political'],
          },
          {
            long_name: 'Telangana',
            short_name: 'TG',
            types: ['administrative_area_level_1', 'political'],
          },
          {
            long_name: 'India',
            short_name: 'IN',
            types: ['country', 'political'],
          },
        ],
        name: 'Hyderabad',
        types: ['locality', 'political'],
      };

      const result = extractStandardizedLocation(mockPlace as any);
      
      expect(result).toEqual({
        label: 'Hyderabad, Telangana, India',
        lat: 17.3850,
        lng: 78.4867,
        city: 'Hyderabad',
        state: 'Telangana',
        country: 'India',
        type: 'CITY',
      });
    });

    it('should extract AREA location correctly', () => {
      const mockPlace = {
        formatted_address: 'Hitech City, Hyderabad, Telangana, India',
        geometry: {
          location: {
            lat: () => 17.4486,
            lng: () => 78.3908,
          },
        },
        address_components: [
          {
            long_name: 'Hitech City',
            short_name: 'Hitech City',
            types: ['sublocality', 'sublocality_level_1'],
          },
          {
            long_name: 'Hyderabad',
            short_name: 'Hyderabad',
            types: ['locality', 'political'],
          },
          {
            long_name: 'Telangana',
            short_name: 'TG',
            types: ['administrative_area_level_1', 'political'],
          },
        ],
        name: 'Hitech City',
        types: ['sublocality', 'sublocality_level_1'],
      };

      const result = extractStandardizedLocation(mockPlace as any);
      
      expect(result.type).toBe('AREA');
      expect(result.city).toBe('Hyderabad');
      expect(result.state).toBe('Telangana');
    });

    it('should extract LANDMARK location correctly', () => {
      const mockPlace = {
        formatted_address: 'Charminar, Hyderabad, Telangana, India',
        geometry: {
          location: {
            lat: () => 17.3616,
            lng: () => 78.4747,
          },
        },
        address_components: [
          {
            long_name: 'Charminar',
            short_name: 'Charminar',
            types: ['point_of_interest', 'establishment'],
          },
          {
            long_name: 'Hyderabad',
            short_name: 'Hyderabad',
            types: ['locality', 'political'],
          },
          {
            long_name: 'Telangana',
            short_name: 'TG',
            types: ['administrative_area_level_1', 'political'],
          },
        ],
        name: 'Charminar',
        types: ['point_of_interest', 'establishment'],
      };

      const result = extractStandardizedLocation(mockPlace as any);
      
      expect(result.type).toBe('LANDMARK');
      expect(result.label).toBe('Charminar, Hyderabad, Telangana, India');
    });
  });
});

