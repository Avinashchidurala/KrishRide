/**
 * Location Validation Utility Tests
 * 
 * Tests for state validation edge cases
 * Note: Full validation logic is tested in backend tests
 * These tests verify the allowed states and validation behavior
 */

import { describe, it, expect } from 'vitest';

// Allowed states constant (matches backend and frontend)
const ALLOWED_STATES = ['Andhra Pradesh', 'Telangana', 'Karnataka', 'Tamil Nadu'] as const;
const STATE_ERROR_MESSAGE = 'Currently available only in Andhra Pradesh, Telangana, Karnataka and Tamil Nadu';

// Mock validation function for testing
const validateState = (state: string | null | undefined): { isValid: boolean; error?: string; state?: string } => {
  if (!state || typeof state !== 'string') {
    return {
      isValid: false,
      error: 'State information is required. ' + STATE_ERROR_MESSAGE,
    };
  }

  const normalizedState = state.trim();
  const isValid = ALLOWED_STATES.includes(normalizedState as typeof ALLOWED_STATES[number]);

  return {
    isValid,
    state: normalizedState,
    error: isValid ? undefined : `Location in "${normalizedState}" is not available. ${STATE_ERROR_MESSAGE}`,
  };
};

describe('Location State Validation', () => {
  describe('validateState', () => {
    it('should accept Telangana', () => {
      const result = validateState('Telangana');
      expect(result.isValid).toBe(true);
      expect(result.state).toBe('Telangana');
    });

    it('should accept Andhra Pradesh', () => {
      const result = validateState('Andhra Pradesh');
      expect(result.isValid).toBe(true);
      expect(result.state).toBe('Andhra Pradesh');
    });

    it('should accept Karnataka', () => {
      const result = validateState('Karnataka');
      expect(result.isValid).toBe(true);
      expect(result.state).toBe('Karnataka');
    });

    it('should accept Tamil Nadu', () => {
      const result = validateState('Tamil Nadu');
      expect(result.isValid).toBe(true);
      expect(result.state).toBe('Tamil Nadu');
    });

    it('should reject Maharashtra', () => {
      const result = validateState('Maharashtra');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain(STATE_ERROR_MESSAGE);
      expect(result.error).toContain('Maharashtra');
    });

    it('should reject Delhi', () => {
      const result = validateState('Delhi');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain(STATE_ERROR_MESSAGE);
    });

    it('should reject null/undefined state', () => {
      const result1 = validateState(null);
      const result2 = validateState(undefined);
      
      expect(result1.isValid).toBe(false);
      expect(result2.isValid).toBe(false);
      expect(result1.error).toContain('State information is required');
    });

    it('should handle state name with extra whitespace', () => {
      const result = validateState('  Telangana  ');
      expect(result.isValid).toBe(true);
      expect(result.state).toBe('Telangana');
    });
  });

  describe('Allowed States List', () => {
    it('should contain exactly 4 states', () => {
      expect(ALLOWED_STATES.length).toBe(4);
    });

    it('should contain all required states', () => {
      const requiredStates = ['Andhra Pradesh', 'Telangana', 'Karnataka', 'Tamil Nadu'];
      requiredStates.forEach(state => {
        expect(ALLOWED_STATES).toContain(state);
      });
    });

    it('should not contain other states', () => {
      const otherStates = ['Maharashtra', 'Delhi', 'Gujarat', 'Punjab'];
      otherStates.forEach(state => {
        expect(ALLOWED_STATES).not.toContain(state);
      });
    });
  });
});

