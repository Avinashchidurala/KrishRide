import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ridesApi } from '../../services/ridesApi';
import LocationSearchModal from '../../components/LocationSearchModal';
import { StandardLocation } from '../../utils/locationFormat';
import { ScreenLayout } from '../../components/layout';

// Predefined 3-hour time slots
const TIME_SLOTS = [
  { id: '00-03', label: '00:00 - 03:00', start: 0, end: 3 },
  { id: '03-06', label: '03:00 - 06:00', start: 3, end: 6 },
  { id: '06-09', label: '06:00 - 09:00', start: 6, end: 9 },
  { id: '09-12', label: '09:00 - 12:00', start: 9, end: 12 },
  { id: '12-15', label: '12:00 - 15:00', start: 12, end: 15 },
  { id: '15-18', label: '15:00 - 18:00', start: 15, end: 18 },
  { id: '18-21', label: '18:00 - 21:00', start: 18, end: 21 },
  { id: '21-24', label: '21:00 - 24:00', start: 21, end: 24 },
];

export default function CustomerDashboardScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rides, setRides] = useState<any[]>([]);
  
  // Location states
  const [pickupLocation, setPickupLocation] = useState<StandardLocation | null>(null);
  const [dropLocation, setDropLocation] = useState<StandardLocation | null>(null);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [locationModalType, setLocationModalType] = useState<'pickup' | 'drop'>('pickup');
  
  // Date & Time states
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [whenModalVisible, setWhenModalVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const formatDateDisplay = (date: Date): string => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dateStr = date.toDateString();
    const todayStr = today.toDateString();
    const tomorrowStr = tomorrow.toDateString();
    
    if (dateStr === todayStr) return 'Today';
    if (dateStr === tomorrowStr) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getWhenDisplayText = (): string => {
    if (!selectedDate && !selectedTimeSlot) return 'When';
    if (!selectedDate) return 'Select date';
    if (!selectedTimeSlot) return formatDateDisplay(selectedDate);
    
    const timeSlot = TIME_SLOTS.find(s => s.id === selectedTimeSlot);
    return `${formatDateDisplay(selectedDate)} · ${timeSlot?.label || selectedTimeSlot}`;
  };

  const loadRides = async () => {
    const pickupLabel = pickupLocation?.label || '';
    const dropLabel = dropLocation?.label || '';
    
    if (!pickupLabel || !dropLabel || !selectedDate) {
      setError('Please fill all fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const dateStr = selectedDate.toISOString().split('T')[0];
      const params: any = {
        pickup: pickupLabel,
        drop: dropLabel,
        date: dateStr,
        startLatitude: pickupLocation!.lat,
        startLongitude: pickupLocation!.lng,
        endLatitude: dropLocation!.lat,
        endLongitude: dropLocation!.lng,
      };
      
      if (selectedTimeSlot) {
        params.timeSlots = selectedTimeSlot;
      }
      
      const result = await ridesApi.searchRides(params);
      setRides(result.rides || []);
      
      if (result.rides?.length === 0) {
        setError('No rides found. Try different locations or dates.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to search rides');
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSwapLocations = () => {
    const temp = pickupLocation;
    setPickupLocation(dropLocation);
    setDropLocation(temp);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setDatePickerVisible(false);
  };

  const handleWhenConfirm = () => {
    setWhenModalVisible(false);
  };

  const renderRideItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.rideCard}
      onPress={() => navigation.navigate('BookRide', { rideId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.rideHeader}>
        <View style={styles.routeInfo}>
          <View style={styles.locationRow}>
            <View style={styles.locationDot} />
            <Text style={styles.rideLocationText} numberOfLines={1}>
              {item.start_location}
            </Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.locationRow}>
            <View style={[styles.locationDot, styles.locationDotRed]} />
            <Text style={styles.rideLocationText} numberOfLines={1}>
              {item.end_location}
            </Text>
          </View>
        </View>
        <View style={styles.priceBox}>
          <Text style={styles.priceText}>₹{item.price_per_seat}</Text>
          <Text style={styles.priceLabel}>per seat</Text>
        </View>
      </View>

      <View style={styles.rideDetails}>
        <View style={styles.detailItem}>
          <MaterialIcons name="event" size={16} color="#666" />
          <Text style={styles.detailText}>
            {new Date(item.scheduled_time).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <MaterialIcons name="access-time" size={16} color="#666" />
          <Text style={styles.detailText}>
            {new Date(item.scheduled_time).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <MaterialCommunityIcons name="car-seat" size={16} color="#666" />
          <Text style={styles.detailText}>
            {item.availableSeats || item.seats_available} seats
          </Text>
        </View>
        <View style={styles.detailItem}>
          <MaterialIcons name="star" size={16} color="#FFB800" />
          <Text style={styles.detailText}>
            {item.driver?.average_rating != null ? Number(item.driver.average_rating).toFixed(1) : 'N/A'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.bookButton}
        onPress={() => navigation.navigate('BookRide', { rideId: item.id })}
      >
        <Text style={styles.bookButtonText}>Book Now</Text>
        <MaterialIcons name="arrow-forward" size={18} color="white" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <ScreenLayout backgroundColor="#F5F5F5">
      <View style={styles.container}>
        {/* Main Search Card */}
        <View style={styles.searchCard}>
          {/* From Location */}
          <TouchableOpacity
            style={styles.inputField}
            onPress={() => {
              setLocationModalType('pickup');
              setLocationModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.inputIcon}>
              <View style={styles.greenDot} />
            </View>
            <View style={styles.inputContent}>
              <Text style={styles.inputLabel}>From</Text>
              <Text 
                style={pickupLocation ? styles.inputValue : styles.inputPlaceholder}
                numberOfLines={1}
              >
                {pickupLocation?.label || 'Select pickup location'}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>

          {/* Swap Button */}
          <TouchableOpacity
            style={styles.swapButton}
            onPress={handleSwapLocations}
            activeOpacity={0.7}
          >
            <MaterialIcons name="swap-vert" size={20} color="#666" />
          </TouchableOpacity>

          {/* To Location */}
          <TouchableOpacity
            style={styles.inputField}
            onPress={() => {
              setLocationModalType('drop');
              setLocationModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.inputIcon}>
              <View style={styles.redDot} />
            </View>
            <View style={styles.inputContent}>
              <Text style={styles.inputLabel}>To</Text>
              <Text 
                style={dropLocation ? styles.inputValue : styles.inputPlaceholder}
                numberOfLines={1}
              >
                {dropLocation?.label || 'Select destination'}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>

          {/* When (Date + Time) */}
          <TouchableOpacity
            style={styles.inputField}
            onPress={() => setWhenModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.inputIcon}>
              <MaterialIcons name="event" size={20} color="#FF6B35" />
            </View>
            <View style={styles.inputContent}>
              <Text style={styles.inputLabel}>When</Text>
              <Text 
                style={selectedDate ? styles.inputValue : styles.inputPlaceholder}
              >
                {getWhenDisplayText()}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Results Section */}
        <ScrollView
          style={styles.resultsContainer}
          contentContainerStyle={styles.resultsContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.statusContainer}>
              <ActivityIndicator size="large" color="#FF6B35" />
              <Text style={styles.statusText}>Finding rides...</Text>
            </View>
          ) : error ? (
            <View style={styles.statusContainer}>
              <MaterialIcons name="error-outline" size={48} color="#F44336" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : rides.length > 0 ? (
            <>
              <Text style={styles.resultsHeader}>
                {rides.length} {rides.length === 1 ? 'Ride' : 'Rides'} Available
              </Text>
              <FlatList
                data={rides}
                renderItem={renderRideItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            </>
          ) : selectedDate || pickupLocation || dropLocation ? (
            <View style={styles.statusContainer}>
              <MaterialCommunityIcons name="car-off" size={64} color="#E0E0E0" />
              <Text style={styles.emptyTitle}>No rides found</Text>
              <Text style={styles.emptySubtitle}>
                Try different locations or dates
              </Text>
            </View>
          ) : (
            <View style={styles.statusContainer}>
              <MaterialIcons name="search" size={64} color="#E0E0E0" />
              <Text style={styles.welcomeTitle}>Ready to travel?</Text>
              <Text style={styles.welcomeSubtitle}>
                Enter your journey details to find available rides
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Sticky Find Rides Button */}
        <View style={styles.stickyButtonContainer}>
          <TouchableOpacity
            style={[
              styles.findRidesButton,
              loading && styles.findRidesButtonDisabled,
              (!pickupLocation || !dropLocation || !selectedDate) && styles.findRidesButtonDisabled,
            ]}
            onPress={loadRides}
            disabled={loading || !pickupLocation || !dropLocation || !selectedDate}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="search" size={24} color="#fff" />
                <Text style={styles.findRidesButtonText}>Find Rides</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Location Search Modal */}
      <LocationSearchModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
        onSelect={(location) => {
          if (locationModalType === 'pickup') {
            setPickupLocation(location);
          } else {
            setDropLocation(location);
          }
          setLocationModalVisible(false);
        }}
      />

      {/* When Modal (Bottom Sheet) */}
      <Modal
        visible={whenModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setWhenModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setWhenModalVisible(false)}
          />
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHeader}>
              <View style={styles.bottomSheetHandle} />
              <Text style={styles.bottomSheetTitle}>When</Text>
              <TouchableOpacity
                onPress={handleWhenConfirm}
                style={styles.bottomSheetDone}
              >
                <Text style={styles.bottomSheetDoneText}>Done</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.bottomSheetContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Date Selector */}
              <View style={styles.dateSection}>
                <Text style={styles.sectionLabel}>Date</Text>
                <TouchableOpacity
                  style={styles.dateSelector}
                  onPress={() => setDatePickerVisible(true)}
                >
                  <MaterialIcons name="calendar-today" size={20} color="#FF6B35" />
                  <Text style={styles.dateSelectorText}>
                    {selectedDate 
                      ? formatDateDisplay(selectedDate)
                      : 'Select date'
                    }
                  </Text>
                  <MaterialIcons name="chevron-right" size={24} color="#999" />
                </TouchableOpacity>
              </View>

              {/* Time Slots */}
              <View style={styles.timeSection}>
                <Text style={styles.sectionLabel}>Time Slot</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.timeSlotsContainer}
                >
                  {TIME_SLOTS.map((slot) => {
                    const isSelected = selectedTimeSlot === slot.id;
                    return (
                      <TouchableOpacity
                        key={slot.id}
                        style={[
                          styles.timeSlotChip,
                          isSelected && styles.timeSlotChipActive,
                        ]}
                        onPress={() => setSelectedTimeSlot(isSelected ? null : slot.id)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.timeSlotText,
                            isSelected && styles.timeSlotTextActive,
                          ]}
                        >
                          {slot.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {datePickerVisible && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          onChange={(event, date) => {
            if (Platform.OS === 'android') {
              setDatePickerVisible(false);
              if (date && event.type !== 'dismissed') {
                handleDateSelect(date);
              }
            } else if (date) {
              handleDateSelect(date);
            }
          }}
        />
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    marginBottom: 8,
  },
  inputIcon: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  greenDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
  },
  redDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F44336',
  },
  inputContent: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  inputValue: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  inputPlaceholder: {
    fontSize: 16,
    color: '#999',
    fontWeight: '400',
  },
  swapButton: {
    alignSelf: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100, // Space for sticky button
  },
  resultsHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  statusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  statusText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    marginTop: 16,
    textAlign: 'center',
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  rideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  routeInfo: {
    flex: 1,
    marginRight: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    marginRight: 12,
  },
  locationDotRed: {
    backgroundColor: '#F44336',
  },
  rideLocationText: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '600',
    flex: 1,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E0E0E0',
    marginLeft: 5,
    marginBottom: 8,
  },
  priceBox: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FF6B35',
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  rideDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  bookButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  stickyButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  findRidesButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  findRidesButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  findRidesButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  bottomSheetHandle: {
    position: 'absolute',
    top: 8,
    left: '50%',
    marginLeft: -30,
    width: 60,
    height: 4,
    backgroundColor: '#CCCCCC',
    borderRadius: 2,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
    textAlign: 'center',
  },
  bottomSheetDone: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  bottomSheetDoneText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B35',
  },
  bottomSheetContent: {
    padding: 20,
  },
  dateSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    height: 56,
  },
  dateSelectorText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 12,
  },
  timeSection: {
    marginBottom: 24,
  },
  timeSlotsContainer: {
    paddingRight: 20,
  },
  timeSlotChip: {
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timeSlotChipActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  timeSlotTextActive: {
    color: '#FFFFFF',
  },
});
