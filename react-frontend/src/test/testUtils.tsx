import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock store for testing
export const createMockStore = (initialState: any = {}) => {
  return configureStore({
    reducer: {
      auth: (state: any = { user: null, isAuthenticated: false, ...initialState.auth }) => state,
      user: (state: any = null) => state,
      rides: (state: any = { rides: [] }) => state,
      bookings: (state: any = { bookings: [] }) => state,
    },
    preloadedState: initialState,
  });
};

// Test theme
const theme = createTheme();

// Custom render function with providers
export const renderWithProviders = (
  ui: React.ReactElement,
  {
    initialState = {},
    store = createMockStore(initialState),
    ...renderOptions
  }: any = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>{children}</BrowserRouter>
      </ThemeProvider>
    </Provider>
  );

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
};

// Mock location objects for testing
export const createMockLocation = (overrides = {}) => ({
  label: 'Hyderabad, Telangana, India',
  lat: 17.3850,
  lng: 78.4867,
  city: 'Hyderabad',
  state: 'Telangana',
  country: 'India' as const,
  type: 'CITY' as const,
  ...overrides,
});

// Mock Google Places API responses
export const createMockPlaceResult = (overrides = {}) => ({
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
  place_id: 'test-place-id',
  ...overrides,
});

