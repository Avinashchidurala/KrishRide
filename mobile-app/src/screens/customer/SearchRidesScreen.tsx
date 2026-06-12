import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ridesApi } from '../../services/ridesApi';
import LocationSearchModal from '../../components/LocationSearchModal';
import { StandardLocation } from '../../utils/locationFormat';
import { ScreenLayout } from '../../components/layout';

interface Ride {
  id: string;
  driver: {
    user: {
      first_name: string;
      last_name: string;
      mobile: string;
    };
    average_rating: number;
    vehicle_number: string;
  };
  start_location: string;
  end_location: string;
  price_per_seat: number;
  availableSeats: number;
  scheduled_time: string;
  vehicle_type: string;
}

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

type SortOption = 'earliest' | 'cheapest' | 'seats';

export default function SearchRidesScreen() {
  const navigation = useNavigation();

  // Search filters
  const [pickupLocation, setPickupLocation] = useState<StandardLocation | null>(null);
  const [dropLocation, setDropLocation] = useState<StandardLocation | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [minSeats, setMinSeats] = useState(1);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>('earliest');

  // UI state
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Ride[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [locationModalType, setLocationModalType] = useState<'pickup' | 'drop'>('pickup');
  const [showFilters, setShowFilters] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const vehicleTypes = [
    { label: 'All Types', value: '' },
    { label: 'Sedan', value: 'sedan' },
    { label: 'SUV', value: 'suv' },
    { label: 'Hatchback', value: 'hatchback' },
  ];

  const minSeatsOptions = [1, 2, 3, 4];

  const handleTimeSlotToggle = (slotId: string) => {
    setSelectedTimeSlots((prev) =>
      prev.includes(slotId)
        ? prev.filter((id) => id !== slotId)
        : [...prev, slotId]
    );
  };

  const clearFilters = () => {
    setSelectedTimeSlots([]);
    setMaxPrice('');
    setVehicleType('');
    setMinSeats(1);
    setMinRating(0);
  };

  const sortRides = (rides: Ride[], sortOption: SortOption): Ride[] => {
    const sorted = [...rides];
    switch (sortOption) {
      case 'earliest':
        return sorted.sort((a, b) => 
          new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime()
        );
      case 'cheapest':
        return sorted.sort((a, b) => a.price_per_seat - b.price_per_seat);
      case 'seats':
        return sorted.sort((a, b) => b.availableSeats - a.availableSeats);
      default:
        return sorted;
    }
  };

  const handleSearch = async () => {
    if (!pickupLocation || !dropLocation) {
      Alert.alert('Missing Information', 'Please select both pickup and drop locations.');
      return;
    }

    if (!selectedDate) {
      Alert.alert('Missing Information', 'Please select a travel date.');
      return;
    }

    try {
      setLoading(true);

      const searchParams: any = {
        pickup: pickupLocation.label || pickupLocation.address,
        drop: dropLocation.label || dropLocation.address,
        date: selectedDate,
        startLatitude: pickupLocation.lat,
        startLongitude: pickupLocation.lng,
        endLatitude: dropLocation.lat,
        endLongitude: dropLocation.lng,
      };

      if (selectedTimeSlots.length > 0) {
        searchParams.timeSlots = selectedTimeSlots.join(',');
      }
      if (maxPrice) {
        searchParams.maxPrice = parseFloat(maxPrice);
      }

      const response = await ridesApi.searchRides(searchParams);
      
      // Apply client-side filters
      let filteredRides = response.rides || [];
      
      if (minSeats > 1) {
        filteredRides = filteredRides.filter(
          (ride: Ride) => ride.availableSeats >= minSeats
        );
      }
      
      if (minRating > 0) {
        filteredRides = filteredRides.filter(
          (ride: Ride) => (Number(ride.driver?.average_rating) || 0) >= minRating
        );
      }

      if (vehicleType) {
        filteredRides = filteredRides.filter(
          (ride: Ride) => ride.vehicle_type?.toLowerCase() === vehicleType.toLowerCase()
        );
      }

      // Sort rides
      filteredRides = sortRides(filteredRides, sortBy);
      
      setSearchResults(filteredRides);
      setHasSearched(true);
      setShowFilters(false);
    } catch (error: any) {
      console.error('Search error:', error);
      Alert.alert('Search Failed', error.response?.data?.error || error.message || 'Failed to search rides');
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    const formattedDate = date.toISOString().split('T')[0];
    setSelectedDate(formattedDate);
    setDatePickerVisible(false);
  };

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderRideItem = (ride: Ride) => (
    <TouchableOpacity
      key={ride.id}
      style={styles.rideCard}
      onPress={() => navigation.navigate('BookRide', { rideId: ride.id })}
      activeOpacity={0.7}
    >
      {/* Primary Info Row: Time (left) + Price (right) */}
      <View style={styles.primaryRow}>
        <Text style={styles.departureTime}>{formatTime(ride.scheduled_time)}</Text>
        <Text style={styles.priceText}>₹{ride.price_per_seat} / seat</Text>
      </View>

      {/* Route Info */}
      <Text style={styles.routeText} numberOfLines={1}>
        {ride.start_location} → {ride.end_location}
      </Text>

      {/* Secondary Info Row: Seats + Rating */}
      <View style={styles.secondaryRow}>
        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="car-seat" size={16} color="#666" />
          <Text style={styles.infoText}>{ride.availableSeats} seats</Text>
        </View>
        <View style={styles.infoItem}>
          <MaterialIcons name="star" size={16} color="#FFB800" />
          <Text style={styles.infoText}>
            {ride.driver?.average_rating != null ? Number(ride.driver.average_rating).toFixed(1) : 'N/A'}
          </Text>
        </View>
      </View>

      {/* CTA Button */}
      <TouchableOpacity
        style={styles.bookButton}
        onPress={(e) => {
          e.stopPropagation();
          navigation.navigate('BookRide', { rideId: ride.id });
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.bookButtonText}>Book</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <ScreenLayout
      header={{
        title: 'Find a Ride',
        showBack: true,
      }}
      backgroundColor="#F5F5F5"
    >
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Search Summary Header - Only show when results are loaded */}
        {hasSearched && pickupLocation && dropLocation && selectedDate && (
          <TouchableOpacity
            style={styles.summaryCard}
            onPress={() => setShowFilters(true)}
            activeOpacity={0.7}
          >
            <View style={styles.summaryContent}>
              <MaterialIcons name="edit" size={18} color="#FF6B35" />
              <View style={styles.summaryText}>
                <Text style={styles.summaryRoute} numberOfLines={1}>
                  {pickupLocation.label} → {dropLocation.label}
                </Text>
                <Text style={styles.summaryDate}>{formatDateDisplay(selectedDate)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Search Form - Only show when no results or filters are open */}
        {(!hasSearched || showFilters) && (
          <View style={styles.searchCard}>
            {/* Location Selection */}
            <View style={styles.locationSection}>
              <TouchableOpacity
                style={styles.locationButton}
                onPress={() => {
                  setLocationModalType('pickup');
                  setLocationModalVisible(true);
                }}
              >
                <View style={styles.locationButtonContent}>
                  <View style={styles.locationIconContainer}>
                    <MaterialIcons name="radio-button-checked" size={20} color="#4CAF50" />
                  </View>
                  <View style={styles.locationTextContainer}>
                    <Text style={styles.locationLabel}>From</Text>
                    <Text 
                      style={pickupLocation ? styles.locationValue : styles.locationPlaceholder}
                      numberOfLines={1}
                    >
                      {pickupLocation?.label || 'Select pickup location'}
                    </Text>
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#999" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.locationButton}
                onPress={() => {
                  setLocationModalType('drop');
                  setLocationModalVisible(true);
                }}
              >
                <View style={styles.locationButtonContent}>
                  <View style={styles.locationIconContainer}>
                    <MaterialIcons name="location-on" size={20} color="#F44336" />
                  </View>
                  <View style={styles.locationTextContainer}>
                    <Text style={styles.locationLabel}>To</Text>
                    <Text 
                      style={dropLocation ? styles.locationValue : styles.locationPlaceholder}
                      numberOfLines={1}
                    >
                      {dropLocation?.label || 'Select destination'}
                    </Text>
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#999" />
              </TouchableOpacity>
            </View>

            {/* Date Selection */}
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setDatePickerVisible(true)}
            >
              <MaterialIcons name="calendar-today" size={20} color="#FF6B35" />
              <View style={styles.dateTextContainer}>
                <Text style={styles.dateLabel}>Travel Date</Text>
                <Text style={selectedDate ? styles.dateValue : styles.datePlaceholder}>
                  {selectedDate ? formatDateDisplay(selectedDate) : 'Select date'}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#999" />
            </TouchableOpacity>

            {/* Filters Toggle */}
            <TouchableOpacity
              style={styles.filtersToggle}
              onPress={() => setShowFilters(!showFilters)}
            >
              <MaterialIcons 
                name={showFilters ? 'expand-less' : 'expand-more'} 
                size={24} 
                color="#FF6B35" 
              />
              <Text style={styles.filtersToggleText}>
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Text>
            </TouchableOpacity>

            {/* Filters Panel */}
            {showFilters && (
              <View style={styles.filtersPanel}>
                {/* Time Slots */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Time Slots</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeSlotsScroll}>
                    <View style={styles.timeSlotsRow}>
                      {TIME_SLOTS.map((slot) => {
                        const isSelected = selectedTimeSlots.includes(slot.id);
                        return (
                          <TouchableOpacity
                            key={slot.id}
                            style={[
                              styles.timeSlotChip,
                              isSelected && styles.timeSlotChipActive,
                            ]}
                            onPress={() => handleTimeSlotToggle(slot.id)}
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
                    </View>
                  </ScrollView>
                </View>

                {/* Minimum Seats */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Minimum Seats</Text>
                  <View style={styles.seatsRow}>
                    {minSeatsOptions.map((seats) => (
                      <TouchableOpacity
                        key={seats}
                        style={[
                          styles.seatChip,
                          minSeats === seats && styles.seatChipActive,
                        ]}
                        onPress={() => setMinSeats(seats)}
                      >
                        <Text
                          style={[
                            styles.seatText,
                            minSeats === seats && styles.seatTextActive,
                          ]}
                        >
                          {seats}+
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Minimum Rating */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
                  <View style={styles.ratingRow}>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <TouchableOpacity
                        key={rating}
                        style={[
                          styles.ratingChip,
                          minRating >= rating && styles.ratingChipActive,
                        ]}
                        onPress={() => setMinRating(rating === minRating ? 0 : rating)}
                      >
                        <MaterialIcons
                          name={minRating >= rating ? 'star' : 'star-border'}
                          size={24}
                          color={minRating >= rating ? '#FFB800' : '#E0E0E0'}
                        />
                      </TouchableOpacity>
                    ))}
                    {minRating > 0 && (
                      <Text style={styles.ratingLabel}>{minRating}+</Text>
                    )}
                  </View>
                </View>

                {/* Max Price */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Max Price (₹)</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Any"
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>

                {/* Vehicle Type */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Vehicle Type</Text>
                  <View style={styles.vehicleTypeRow}>
                    {vehicleTypes.map((type) => (
                      <TouchableOpacity
                        key={type.value}
                        style={[
                          styles.vehicleTypeChip,
                          vehicleType === type.value && styles.vehicleTypeChipActive,
                        ]}
                        onPress={() => setVehicleType(type.value)}
                      >
                        <Text
                          style={[
                            styles.vehicleTypeText,
                            vehicleType === type.value && styles.vehicleTypeTextActive,
                          ]}
                        >
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Clear Filters */}
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={clearFilters}
                >
                  <MaterialIcons name="clear" size={18} color="#666" />
                  <Text style={styles.clearButtonText}>Clear Filters</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Search Button - Only show when filters are visible or no results */}
            {(!hasSearched || showFilters) && (
              <TouchableOpacity
                style={[styles.searchButton, loading && styles.searchButtonDisabled]}
                onPress={handleSearch}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="search" size={24} color="#fff" />
                    <Text style={styles.searchButtonText}>Search Rides</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Sort Options - Only show when results are loaded */}
        {hasSearched && searchResults.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.sortContainer}
            contentContainerStyle={styles.sortContent}
          >
            <TouchableOpacity
              style={[styles.sortChip, sortBy === 'earliest' && styles.sortChipActive]}
              onPress={() => {
                setSortBy('earliest');
                setSearchResults(sortRides(searchResults, 'earliest'));
              }}
            >
              <Text style={[styles.sortText, sortBy === 'earliest' && styles.sortTextActive]}>
                Earliest
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortChip, sortBy === 'cheapest' && styles.sortChipActive]}
              onPress={() => {
                setSortBy('cheapest');
                setSearchResults(sortRides(searchResults, 'cheapest'));
              }}
            >
              <Text style={[styles.sortText, sortBy === 'cheapest' && styles.sortTextActive]}>
                Cheapest
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortChip, sortBy === 'seats' && styles.sortChipActive]}
              onPress={() => {
                setSortBy('seats');
                setSearchResults(sortRides(searchResults, 'seats'));
              }}
            >
              <Text style={[styles.sortText, sortBy === 'seats' && styles.sortTextActive]}>
                Most Seats
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* Search Results */}
        {hasSearched && (
          <View style={styles.resultsSection}>
            {searchResults.length > 0 ? (
              <View style={styles.resultsList}>
                {searchResults.map((ride) => renderRideItem(ride))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="car-off" size={80} color="#E0E0E0" />
                <Text style={styles.emptyTitle}>No rides found</Text>
                <Text style={styles.emptySubtitle}>
                  Try adjusting your filters or check back later
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

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

      {/* Date Picker Modal */}
      {datePickerVisible && (
        <Modal
          visible={datePickerVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setDatePickerVisible(false)}
        >
          <View style={styles.datePickerModal}>
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                  <Text style={styles.datePickerCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.datePickerTitle}>Select Date</Text>
                <TouchableOpacity
                  onPress={() => {
                    if (!selectedDate) {
                      handleDateSelect(new Date());
                    }
                    setDatePickerVisible(false);
                  }}
                >
                  <Text style={styles.datePickerDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={new Date()}
                onChange={(event, date) => {
                  if (Platform.OS === 'android') {
                    if (date && event.type !== 'dismissed') {
                      handleDateSelect(date);
                    } else {
                      setDatePickerVisible(false);
                    }
                  } else if (date) {
                    const formattedDate = date.toISOString().split('T')[0];
                    setSelectedDate(formattedDate);
                  }
                }}
              />
            </View>
          </View>
        </Modal>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  // Search Summary Card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryText: {
    flex: 1,
  },
  summaryRoute: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  summaryDate: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  // Search Form
  searchCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  locationSection: {
    marginBottom: 12,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  locationButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationIconContainer: {
    marginRight: 12,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  locationPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  dateTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  datePlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  filtersToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  filtersToggleText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
    marginLeft: 8,
  },
  filtersPanel: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  timeSlotsScroll: {
    marginHorizontal: -16,
  },
  timeSlotsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  timeSlotChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  timeSlotChipActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  timeSlotText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  timeSlotTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  seatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  seatChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  seatChipActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  seatText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  seatTextActive: {
    color: '#FFFFFF',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingChip: {
    padding: 4,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFB800',
    marginLeft: 8,
  },
  priceInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    padding: 14,
    fontSize: 16,
    color: '#1A1A1A',
  },
  vehicleTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vehicleTypeChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  vehicleTypeChipActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  vehicleTypeText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  vehicleTypeTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    marginTop: 8,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginLeft: 6,
  },
  searchButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  // Sort Options
  sortContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  sortContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  sortChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  sortChipActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  sortText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  sortTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Results Section
  resultsSection: {
    paddingHorizontal: 16,
  },
  resultsList: {
    gap: 12,
  },
  // Ride Card
  rideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  primaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  departureTime: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B35',
  },
  routeText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
    marginBottom: 12,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  bookButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'flex-start',
    minWidth: 80,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 16,
  },
  emptyTitle: {
    fontSize: 20,
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
  datePickerModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  datePickerCancel: {
    fontSize: 16,
    color: '#666',
  },
  datePickerDone: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '700',
  },
});
