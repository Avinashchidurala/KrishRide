import { useState, useCallback } from 'react';

export const useDateTimePicker = () => {
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());

  const showDatePicker = useCallback(() => {
    setDatePickerVisible(true);
  }, []);

  const hideDatePicker = useCallback(() => {
    setDatePickerVisible(false);
  }, []);

  const showTimePicker = useCallback(() => {
    setTimePickerVisible(true);
  }, []);

  const hideTimePicker = useCallback(() => {
    setTimePickerVisible(false);
  }, []);

  const handleDateChange = useCallback((event: any, date?: Date) => {
    try {
      // Always hide picker on Android, keep visible on iOS for spinner mode
      setDatePickerVisible(false);

      if (date) {
        setSelectedDate(date);
      }
    } catch (error) {
      console.warn('Error handling date change:', error);
      setDatePickerVisible(false);
    }
  }, []);

  const handleTimeChange = useCallback((event: any, time?: Date) => {
    try {
      // Always hide picker on Android, keep visible on iOS for spinner mode
      setTimePickerVisible(false);

      if (time) {
        setSelectedTime(time);
      }
    } catch (error) {
      console.warn('Error handling time change:', error);
      setTimePickerVisible(false);
    }
  }, []);

  // Compatibility exports for different usage patterns
  const showDatePickerModal = useCallback(() => {
    setDatePickerVisible(true);
  }, []);

  const showTimePickerModal = useCallback(() => {
    setTimePickerVisible(true);
  }, []);

  return {
    // Date picker
    datePickerVisible,
    selectedDate,
    showDatePicker,
    hideDatePicker,
    handleDateChange,

    // Time picker
    timePickerVisible,
    selectedTime,
    showTimePicker,
    hideTimePicker,
    handleTimeChange,

    // Alternative naming for compatibility
    showDatePickerModal,
    showTimePickerModal,
  };
};
