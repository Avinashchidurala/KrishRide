import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Google Maps API
global.google = {
  maps: {
    places: {
      PlacesServiceStatus: {
        OK: 'OK',
        ZERO_RESULTS: 'ZERO_RESULTS',
        ERROR: 'ERROR',
      },
      AutocompleteService: vi.fn().mockImplementation(() => ({
        getPlacePredictions: vi.fn((request, callback) => {
          // Mock implementation
          callback([], 'OK');
        }),
      })),
      PlacesService: vi.fn().mockImplementation(() => ({
        getDetails: vi.fn((request, callback) => {
          // Mock implementation
          callback(null, 'OK');
        }),
      })),
    },
    Geocoder: vi.fn().mockImplementation(() => ({
      geocode: vi.fn((request, callback) => {
        callback([], 'OK');
      }),
    })),
    Map: vi.fn(),
    event: {
      clearInstanceListeners: vi.fn(),
    },
  },
} as any;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

