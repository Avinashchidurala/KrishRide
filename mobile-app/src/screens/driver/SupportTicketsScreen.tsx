import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ScreenLayout } from '../../components/layout';
import { supportApi } from '../../services/supportApi';

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  bookingId?: string;
  rideId?: string;
}

export default function DriverSupportTicketsScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Data
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await supportApi.getTickets();
      setTickets(data.tickets || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadTickets();
  };

  const handleCreateTicket = async () => {
    if (!subject.trim() || !description.trim()) {
      Alert.alert('Error', 'Subject and Description are required');
      return;
    }

    try {
      setSubmitting(true);
      await supportApi.createTicket({
        subject: subject.trim(),
        description: description.trim(),
        bookingId: bookingId.trim() || undefined,
        priority,
      });
      setCreateModalVisible(false);
      setSubject('');
      setDescription('');
      setBookingId('');
      setPriority('medium');
      Alert.alert('Success', 'Ticket submitted successfully');
      loadTickets();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return '#FF6B35'; 
      case 'assigned':
        return '#2196F3'; 
      case 'in_progress':
        return '#9C27B0'; 
      case 'resolved':
        return '#4CAF50'; 
      case 'closed':
        return '#757575'; 
      default:
        return '#757575';
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'low':
        return '#4CAF50'; 
      case 'medium':
        return '#2196F3'; 
      case 'high':
        return '#FF9800'; 
      case 'urgent':
        return '#F44336'; 
      default:
        return '#757575';
    }
  };

  const renderItem = ({ item }: { item: SupportTicket }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.subject}>{item.subject}</Text>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
          <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
            {item.priority.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <View style={styles.row}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      
      <Text style={styles.description} numberOfLines={2}>
        {item.description}
      </Text>

      {item.bookingId && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsLabel}>Booking ID:</Text>
          <Text style={styles.detailsValue}>{item.bookingId}</Text>
        </View>
      )}
      {item.rideId && (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsLabel}>Ride ID:</Text>
            <Text style={styles.detailsValue}>{item.rideId}</Text>
          </View>
      )}
    </View>
  );

  return (
    <ScreenLayout
      header={{
        title: 'Support Tickets',
        showBack: true,
      }}
    >
      <View style={styles.container}>
        {loading && !refreshing ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#FF6B35" />
          </View>
        ) : (
          <FlatList
            data={tickets}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="support-agent" size={48} color="#E0E0E0" />
                <Text style={styles.emptyText}>No tickets found</Text>
              </View>
            }
          />
        )}

        <TouchableOpacity
          style={styles.fab}
          onPress={() => setCreateModalVisible(true)}
        >
          <MaterialIcons name="add" size={24} color="#FFF" />
          <Text style={styles.fabText}>New Ticket</Text>
        </TouchableOpacity>

        <Modal
          visible={createModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setCreateModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New Support Ticket</Text>
                <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Subject *</Text>
              <TextInput
                style={styles.input}
                value={subject}
                onChangeText={setSubject}
                placeholder="Brief subject of your issue"
              />

              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Detailed description of the issue"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <Text style={styles.label}>Priority</Text>
              <View style={styles.priorityContainer}>
                {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityOption,
                      priority === p && { backgroundColor: getPriorityColor(p) + '20', borderColor: getPriorityColor(p) }
                    ]}
                    onPress={() => setPriority(p)}
                  >
                    <Text style={[
                      styles.priorityOptionText,
                      priority === p && { color: getPriorityColor(p), fontWeight: '700' }
                    ]}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Booking ID (Optional)</Text>
              <TextInput
                style={styles.input}
                value={bookingId}
                onChangeText={setBookingId}
                placeholder="Related Booking ID"
              />

              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.disabledButton]}
                onPress={handleCreateTicket}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Ticket</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80, // Space for FAB
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  subject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
    color: '#757575',
  },
  description: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
    marginTop: 4,
  },
  detailsContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsLabel: {
    fontSize: 12,
    color: '#757575',
    marginRight: 4,
  },
  detailsValue: {
    fontSize: 12,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#757575',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#FF6B35',
    borderRadius: 28,
    height: 56,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabText: {
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#1A1A1A',
  },
  textArea: {
    height: 100,
  },
  priorityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  priorityOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
  },
  priorityOptionText: {
    fontSize: 14,
    color: '#757575',
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#FFBca0',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
