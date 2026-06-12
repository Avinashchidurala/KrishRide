import { createSlice } from '@reduxjs/toolkit';

interface RidesState {
  rides: any[];
  selectedRide: any | null;
  loading: boolean;
  error: string | null;
}

const initialState: RidesState = {
  rides: [],
  selectedRide: null,
  loading: false,
  error: null,
};

const ridesSlice = createSlice({
  name: 'rides',
  initialState,
  reducers: {
    setRides: (state, action) => {
      state.rides = action.payload;
    },
    setSelectedRide: (state, action) => {
      state.selectedRide = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setRides, setSelectedRide, setLoading, setError } = ridesSlice.actions;
export default ridesSlice.reducer;

