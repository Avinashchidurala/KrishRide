import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAppSelector } from '../store/hooks';
import { userApi, UpdateProfileData, EmergencyContact, AddEmergencyContactData } from '../services/userApi';
import { uploadApi } from '../services/uploadApi';
import { ScreenLayout } from '../components/layout';
import { Card } from '../components/ui/Card';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  
  // Profile form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    gender: '',
  });

  // Profile picture
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(null);

  // Emergency contacts
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    mobile: '',
    relationship: '',
    isPrimary: false,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      // Load full profile data
      const data = user?.role === 'driver'
        ? await userApi.getDriverProfile()
        : await userApi.getUserProfile();
      
      const profileData = data.profile || data.driver?.user || {};
      
      // Update form data with loaded profile
      setFormData({
        firstName: profileData.firstName || profileData.first_name || user?.first_name || '',
        lastName: profileData.lastName || profileData.last_name || user?.last_name || '',
        email: profileData.email || user?.email || '',
        gender: profileData.gender || user?.gender || '',
      });

      // Set profile photo
      const photoUrl = profileData.profile_photo_url || user?.profile_photo_url;
      if (photoUrl) {
        setProfilePhoto(photoUrl);
      }

      setProfile(profileData);
      
      // Load emergency contacts
      await loadEmergencyContacts();
    } catch (error: any) {
      console.error('Error loading profile:', error);
      // Fallback to user data from Redux if API fails
      setFormData({
        firstName: user?.first_name || '',
        lastName: user?.last_name || '',
        email: user?.email || '',
        gender: user?.gender || '',
      });
      setProfilePhoto(user?.profile_photo_url || null);
    } finally {
      setLoading(false);
    }
  };

  const loadEmergencyContacts = async () => {
    try {
      const response = await userApi.getEmergencyContacts();
      console.log('📞 [EMERGENCY_CONTACTS] API Response:', JSON.stringify(response, null, 2));
      
      // Handle different response structures
      let contacts = [];
      if (Array.isArray(response)) {
        contacts = response;
      } else if (response?.contacts && Array.isArray(response.contacts)) {
        contacts = response.contacts;
      } else if (response?.data?.contacts && Array.isArray(response.data.contacts)) {
        contacts = response.data.contacts;
      } else if (response?.data && Array.isArray(response.data)) {
        contacts = response.data;
      }
      
      console.log('📞 [EMERGENCY_CONTACTS] Parsed contacts:', JSON.stringify(contacts, null, 2));
      setEmergencyContacts(contacts);
    } catch (error: any) {
      console.error('❌ [EMERGENCY_CONTACTS] Error loading emergency contacts:', error);
      console.error('❌ [EMERGENCY_CONTACTS] Error details:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
      });
      // If emergency contacts API fails, try to get from profile
      if (profile?.emergencyContacts) {
        console.log('📞 [EMERGENCY_CONTACTS] Using contacts from profile:', profile.emergencyContacts);
        setEmergencyContacts(profile.emergencyContacts);
      } else {
        setEmergencyContacts([]);
      }
    }
  };

  const requestImagePermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to upload profile pictures');
        return false;
      }
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestImagePermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false, // We'll read the file ourselves for better control
      });

      if (!result.canceled && result.assets[0]) {
        setProfilePhotoUri(result.assets[0].uri);
        await uploadProfilePhoto(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    const hasPermission = await requestImagePermission();
    if (!hasPermission) return;

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera permissions to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false, // We'll read the file ourselves for better control
      });

      if (!result.canceled && result.assets[0]) {
        setProfilePhotoUri(result.assets[0].uri);
        await uploadProfilePhoto(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Select Profile Picture',
      'Choose an option',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const uploadProfilePhoto = async (imageUri: string) => {
    try {
      setUploadingPhoto(true);
      console.log('📸 Uploading profile photo...');
      
      const uploadResult = await uploadApi.uploadBase64Image(imageUri, 'profile_photo', 'profile.jpg');
      console.log('✅ Profile photo uploaded:', uploadResult.url);

      // Update profile photo URL
      await userApi.uploadProfilePhoto(uploadResult.url, user?.role as 'customer' | 'driver');
      
      setProfilePhoto(uploadResult.url);
      Alert.alert('Success', 'Profile picture updated successfully');
    } catch (error: any) {
      console.error('Error uploading profile photo:', error);
      Alert.alert('Error', error.message || 'Failed to upload profile picture');
      setProfilePhotoUri(null);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      Alert.alert('Error', 'First name and last name are required');
      return;
    }

    try {
      setLoading(true);
      const updateData: UpdateProfileData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim() || undefined,
        gender: formData.gender || undefined,
      };

      await userApi.updateProfile(updateData, user?.role as 'customer' | 'driver');
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.response?.data?.error || error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async () => {
    if (!contactForm.name.trim() || !contactForm.mobile.trim()) {
      Alert.alert('Error', 'Name and mobile number are required');
      return;
    }

    if (contactForm.mobile.replace(/\D/g, '').length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      setLoading(true);
      const data: AddEmergencyContactData = {
        name: contactForm.name.trim(),
        mobile: contactForm.mobile.replace(/\D/g, ''),
        relationship: contactForm.relationship.trim() || undefined,
        isPrimary: contactForm.isPrimary,
      };

      const result = await userApi.addEmergencyContact(data);
      console.log('✅ [EMERGENCY_CONTACTS] Add contact result:', JSON.stringify(result, null, 2));
      await loadEmergencyContacts();
      setShowAddContact(false);
      setContactForm({ name: '', mobile: '', relationship: '', isPrimary: false });
      Alert.alert('Success', 'Emergency contact added successfully');
    } catch (error: any) {
      console.error('Error adding emergency contact:', error);
      Alert.alert('Error', error.response?.data?.error || error.message || 'Failed to add emergency contact');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateContact = async () => {
    if (!editingContact) return;

    if (!contactForm.name.trim() || !contactForm.mobile.trim()) {
      Alert.alert('Error', 'Name and mobile number are required');
      return;
    }

    if (contactForm.mobile.replace(/\D/g, '').length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      setLoading(true);
      const contactId = editingContact.id || editingContact.contactId || editingContact._id;
      if (!contactId) {
        Alert.alert('Error', 'Contact ID not found');
        return;
      }
      const result = await userApi.updateEmergencyContact(contactId, {
        name: contactForm.name.trim(),
        mobile: contactForm.mobile.replace(/\D/g, ''),
        relationship: contactForm.relationship.trim() || undefined,
        isPrimary: contactForm.isPrimary,
      });
      console.log('✅ [EMERGENCY_CONTACTS] Update contact result:', JSON.stringify(result, null, 2));
      await loadEmergencyContacts();
      setEditingContact(null);
      setShowAddContact(false);
      setContactForm({ name: '', mobile: '', relationship: '', isPrimary: false });
      Alert.alert('Success', 'Emergency contact updated successfully');
    } catch (error: any) {
      console.error('Error updating emergency contact:', error);
      Alert.alert('Error', error.response?.data?.error || error.message || 'Failed to update emergency contact');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContact = (contact: any) => {
    const contactName = contact.name || contact.contactName || 'this contact';
    const contactId = contact.id || contact.contactId || contact._id;
    
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contactName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!contactId) {
              Alert.alert('Error', 'Contact ID not found');
              return;
            }
            try {
              setLoading(true);
              await userApi.deleteEmergencyContact(contactId);
              await loadEmergencyContacts();
              Alert.alert('Success', 'Emergency contact deleted successfully');
            } catch (error: any) {
              console.error('Error deleting emergency contact:', error);
              Alert.alert('Error', error.response?.data?.error || error.message || 'Failed to delete emergency contact');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const startEditContact = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setContactForm({
      name: contact.name,
      mobile: contact.mobile.replace(/^\+91/, ''),
      relationship: contact.relationship || '',
      isPrimary: contact.is_primary,
    });
    setShowAddContact(true);
  };

  if (loading && !profile) {
    return (
      <ScreenLayout
        header={{
          title: 'Edit Profile',
          showBack: true,
        }}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      header={{
        title: 'Edit Profile',
        showBack: true,
      }}
      scrollable
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Profile Picture Section */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Picture</Text>
            <View style={styles.photoSection}>
              <TouchableOpacity
                style={styles.photoContainer}
                onPress={showImagePickerOptions}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <ActivityIndicator size="large" color="#FF6B35" />
                ) : profilePhotoUri ? (
                  <Image source={{ uri: profilePhotoUri }} style={styles.profilePhoto} />
                ) : profilePhoto ? (
                  <Image source={{ uri: profilePhoto }} style={styles.profilePhoto} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <MaterialIcons name="camera-alt" size={40} color="#666" />
                  </View>
                )}
                <View style={styles.editPhotoBadge}>
                  <MaterialIcons name="edit" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text style={styles.photoHint}>Tap to change profile picture</Text>
            </View>
          </Card>

          {/* Profile Information Section */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter first name"
                value={formData.firstName}
                onChangeText={(text) => setFormData({ ...formData, firstName: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter last name"
                value={formData.lastName}
                onChangeText={(text) => setFormData({ ...formData, lastName: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderContainer}>
                {['Male', 'Female', 'Other'].map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    style={[
                      styles.genderButton,
                      formData.gender === gender && styles.genderButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, gender })}
                  >
                    <Text
                      style={[
                        styles.genderText,
                        formData.gender === gender && styles.genderTextActive,
                      ]}
                    >
                      {gender}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSaveProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </Card>

          {/* Emergency Contacts Section */}
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Emergency Contacts</Text>
              {!showAddContact && (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => {
                    setShowAddContact(true);
                    setEditingContact(null);
                    setContactForm({ name: '', mobile: '', relationship: '', isPrimary: false });
                  }}
                >
                  <MaterialIcons name="add" size={20} color="#FF6B35" />
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Add/Edit Contact Form */}
            {showAddContact && (
              <View style={styles.contactForm}>
                <Text style={styles.formSubtitle}>
                  {editingContact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
                </Text>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter contact name"
                    value={contactForm.name}
                    onChangeText={(text) => setContactForm({ ...contactForm, name: text })}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Mobile Number *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 10-digit mobile number"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={contactForm.mobile}
                    onChangeText={(text) =>
                      setContactForm({ ...contactForm, mobile: text.replace(/\D/g, '') })
                    }
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Relationship (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Spouse, Parent, Friend"
                    value={contactForm.relationship}
                    onChangeText={(text) => setContactForm({ ...contactForm, relationship: text })}
                  />
                </View>

                <View style={styles.formGroup}>
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() =>
                      setContactForm({ ...contactForm, isPrimary: !contactForm.isPrimary })
                    }
                  >
                    <MaterialIcons
                      name={contactForm.isPrimary ? 'check-box' : 'check-box-outline-blank'}
                      size={24}
                      color={contactForm.isPrimary ? '#FF6B35' : '#666'}
                    />
                    <Text style={styles.checkboxLabel}>Set as primary contact</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.contactFormActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowAddContact(false);
                      setEditingContact(null);
                      setContactForm({ name: '', mobile: '', relationship: '', isPrimary: false });
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={editingContact ? handleUpdateContact : handleAddContact}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.submitButtonText}>
                        {editingContact ? 'Update' : 'Add'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Emergency Contacts List */}
            {emergencyContacts.length > 0 && (
              <View style={styles.contactsList}>
                {emergencyContacts.map((contact: any) => {
                  // Handle both camelCase and snake_case field names
                  const contactName = contact.name || contact.contactName || '';
                  const contactMobile = contact.mobile || contact.contactMobile || '';
                  const contactRelationship = contact.relationship || contact.contactRelationship || '';
                  const isPrimary = contact.is_primary !== undefined ? contact.is_primary : (contact.isPrimary !== undefined ? contact.isPrimary : false);
                  const contactId = contact.id || contact.contactId || contact._id || '';
                  
                  return (
                    <View key={contactId} style={styles.contactItem}>
                      <View style={styles.contactInfo}>
                        <View style={styles.contactHeader}>
                          <Text style={styles.contactName}>{contactName}</Text>
                          {isPrimary && (
                            <View style={styles.primaryBadge}>
                              <Text style={styles.primaryText}>Primary</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.contactMobile}>{contactMobile}</Text>
                        {contactRelationship && (
                          <Text style={styles.contactRelationship}>{contactRelationship}</Text>
                        )}
                      </View>
                    <View style={styles.contactActions}>
                      <TouchableOpacity
                        style={styles.contactActionButton}
                        onPress={() => startEditContact(contact)}
                      >
                        <MaterialIcons name="edit" size={20} color="#FF6B35" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.contactActionButton}
                        onPress={() => handleDeleteContact(contact)}
                      >
                        <MaterialIcons name="delete" size={20} color="#DC3545" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  );
                })}
              </View>
            )}

            {emergencyContacts.length === 0 && !showAddContact && (
              <View style={styles.emptyContacts}>
                <MaterialIcons name="emergency" size={48} color="#E0E0E0" />
                <Text style={styles.emptyContactsText}>No emergency contacts added</Text>
                <Text style={styles.emptyContactsSubtext}>
                  Add at least one emergency contact for your safety
                </Text>
              </View>
            )}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    margin: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  formSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  photoSection: {
    alignItems: 'center',
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F0F0',
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editPhotoBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF6B35',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  photoHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  genderButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  genderText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  genderTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  addButtonText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  contactForm: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  contactFormActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  contactsList: {
    marginTop: 8,
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  contactInfo: {
    flex: 1,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  contactMobile: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  contactRelationship: {
    fontSize: 12,
    color: '#999',
  },
  contactActions: {
    flexDirection: 'row',
    gap: 8,
  },
  contactActionButton: {
    padding: 8,
  },
  primaryBadge: {
    backgroundColor: '#28A745',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  primaryText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  emptyContacts: {
    alignItems: 'center',
    padding: 32,
  },
  emptyContactsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 4,
  },
  emptyContactsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

