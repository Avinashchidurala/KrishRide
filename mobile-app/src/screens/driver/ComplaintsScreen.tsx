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
import { complaintsApi } from '../../services/ComplaintApi'; // Note: Ensure this path is correct based on your file structure

interface Complaint {
  id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  bookingId?: string;
}

export default function DriverComplaintsScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [bookingId, setBookingId] = useState('');

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const data = await complaintsApi.getComplaints();
      setComplaints(data.complaints || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadComplaints();
  };

  const handleCreateComplaint = async () => {
    if (!subject.trim() || !description.trim()) {
      Alert.alert('Error', 'Subject and Description are required');
      return;
    }

    try {
      setSubmitting(true);
      await complaintsApi.createComplaint({
        subject: subject.trim(),
        description: description.trim(),
        bookingId: bookingId.trim() || undefined,
      });
      setCreateModalVisible(false);
      setSubject('');
      setDescription('');
      setBookingId('');
      Alert.alert('Success', 'Complaint submitted successfully');
      loadComplaints();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return '#FF6B35';  
      case 'in_progress':
        return '#2196F3';  
      case 'resolved':
        return '#4CAF50';  
      case 'closed':
        return '#757575';  
      default:
        return '#757575';
    }
  };

  const renderItem = ({ item }: { item: Complaint }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.subject}>{item.subject}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>
      
      <Text style={styles.date}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
      
      <Text style={styles.description} numberOfLines={2}>
        {item.description}
      </Text>

      {item.bookingId && (
        <View style={styles.bookingIdContainer}>
          <Text style={styles.bookingIdLabel}>Booking ID:</Text>
          <Text style={styles.bookingIdValue}>{item.bookingId}</Text>
        </View>
      )}
    </View>
  );

  return (
    <ScreenLayout
      header={{
        title: 'My Complaints',
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
            data={complaints}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="report-problem" size={48} color="#E0E0E0" />
                <Text style={styles.emptyText}>No complaints found</Text>
              </View>
            }
          />
        )}

        <TouchableOpacity
          style={styles.fab}
          onPress={() => setCreateModalVisible(true)}
        >
          <MaterialIcons name="add" size={24} color="#FFF" />
          <Text style={styles.fabText}>New Complaint</Text>
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
                <Text style={styles.modalTitle}>New Complaint</Text>
                <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Subject *</Text>
              <TextInput
                style={styles.input}
                value={subject}
                onChangeText={setSubject}
                placeholder="Brief subject of your complaint"
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

              <Text style={styles.label}>Booking ID (Optional)</Text>
              <TextInput
                style={styles.input}
                value={bookingId}
                onChangeText={setBookingId}
                placeholder="Related Booking ID"
              />

              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.disabledButton]}
                onPress={handleCreateComplaint}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Complaint</Text>
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
    marginBottom: 8,
  },
  subject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 8,
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
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
  },
  bookingIdContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookingIdLabel: {
    fontSize: 12,
    color: '#757575',
    marginRight: 4,
  },
  bookingIdValue: {
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
    maxHeight: '80%',
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
