import { createSlice } from '@reduxjs/toolkit';

interface BookingsState {
  bookings: any[];
  selectedBooking: any | null;
  loading: boolean;
  error: string | null;
}

const initialState: BookingsState = {
  bookings: [],
  selectedBooking: null,
  loading: false,
  error: null,
};

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    setBookings: (state, action) => {
      state.bookings = action.payload;
    },
    setSelectedBooking: (state, action) => {
      state.selectedBooking = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setBookings, setSelectedBooking, setLoading, setError } = bookingsSlice.actions;
export default bookingsSlice.reducer;

