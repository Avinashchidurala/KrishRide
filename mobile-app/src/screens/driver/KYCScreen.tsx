import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Image, TextInput, KeyboardAvoidingView,
  Platform} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { driverApi } from '../../services/driverApi';
import { uploadApi } from '../../services/uploadApi';

export default function KYCScreen() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [documents, setDocuments] = useState({
    aadhar: null as string | null,
    pan: null as string | null,
    drivingLicense: null as string | null,
    selfie: null as string | null,
  });
  const [documentUrls, setDocumentUrls] = useState({
    aadhar: null as string | null,
    pan: null as string | null,
    drivingLicense: null as string | null,
    selfie: null as string | null,
  });
  const [uploading, setUploading] = useState<string | null>(null);
  const [kycData, setKycData] = useState({
    aadharNumber: '',
    panNumber: '',
    drivingLicenseNumber: '',
    drivingLicenseExpiry: '',
    bankName: '',
    bankIfscCode: '',
    bankAccountNumber: '',
  });

  const pickImage = async (type: keyof typeof documents, useCamera: boolean = false) => {
    try {
      // Request permissions
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Camera permission is required to take photos');
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Photo library permission is required');
          return;
        }
      }

      // Launch image picker
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            quality: 0.8,
            allowsEditing: false,
          })
        : await ImagePicker.launchImageLibraryAsync({
            quality: 0.8,
            allowsEditing: false,
          });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const uri = asset.uri;

        if (!uri) {
          Alert.alert('Error', 'Failed to get image URI');
          return;
        }

        // Check file size if available
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (asset.fileSize && asset.fileSize > maxSize) {
          Alert.alert(
            'File Too Large',
            `File size must be less than 5MB. Your file is ${(asset.fileSize / (1024 * 1024)).toFixed(2)}MB. Please compress the image or choose a smaller file.`
          );
          return;
        }

        setDocuments({ ...documents, [type]: uri });
        
        // Upload to S3 immediately
        setUploading(type);
        try {
          const documentType = type === 'aadhar' ? 'aadhar' : 
                              type === 'pan' ? 'pan' : 
                              type === 'drivingLicense' ? 'driving_license' : 'selfie';
          
          const uploadResult = await uploadApi.uploadBase64Image(uri, documentType);
          setDocumentUrls({ ...documentUrls, [type]: uploadResult.url });
          Alert.alert('Success', 'Document uploaded successfully');
        } catch (error: any) {
          console.error('Error uploading image:', error);
          const errorMessage = error.response?.data?.error || error.message || 'Failed to upload document. Please try again.';
          Alert.alert('Upload Error', errorMessage);
        } finally {
          setUploading(null);
        }
      }
    } catch (error: any) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      if (!kycData.aadharNumber && !kycData.panNumber) {
        Alert.alert('Error', 'Please provide either Aadhar or PAN number');
        return false;
      }
    } else if (currentStep === 2) {
      if (!kycData.drivingLicenseNumber || !kycData.drivingLicenseExpiry) {
        Alert.alert('Error', 'Please provide driving license details');
        return false;
      }
    } else if (currentStep === 3) {
      if (!kycData.bankName || !kycData.bankIfscCode || !kycData.bankAccountNumber) {
        Alert.alert('Error', 'Please provide all bank account details');
        return false;
      }
      // Validate IFSC format
      const cleanIFSC = kycData.bankIfscCode.replace(/\s/g, '').toUpperCase();
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIFSC)) {
        Alert.alert('Error', 'Invalid IFSC code format. Must be 11 characters (e.g., SBIN0001234)');
        return false;
      }
    } else if (currentStep === 4) {
      if (!documents.selfie) {
        Alert.alert('Error', 'Please upload a selfie');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      return;
    }

    try {
      setLoading(true);

      // Ensure all documents are uploaded to S3
      // Upload any documents that haven't been uploaded yet
      if (documents.aadhar && !documentUrls.aadhar) {
        setUploading('aadhar');
        try {
          const uploadResult = await uploadApi.uploadBase64Image(documents.aadhar, 'aadhar');
          setDocumentUrls({ ...documentUrls, aadhar: uploadResult.url });
        } catch (error: any) {
          Alert.alert('Error', 'Failed to upload Aadhar document');
          setLoading(false);
          return;
        } finally {
          setUploading(null);
        }
      }

      if (documents.pan && !documentUrls.pan) {
        setUploading('pan');
        try {
          const uploadResult = await uploadApi.uploadBase64Image(documents.pan, 'pan');
          setDocumentUrls({ ...documentUrls, pan: uploadResult.url });
        } catch (error: any) {
          Alert.alert('Error', 'Failed to upload PAN document');
          setLoading(false);
          return;
        } finally {
          setUploading(null);
        }
      }

      if (documents.drivingLicense && !documentUrls.drivingLicense) {
        setUploading('drivingLicense');
        try {
          const uploadResult = await uploadApi.uploadBase64Image(documents.drivingLicense, 'driving_license');
          setDocumentUrls({ ...documentUrls, drivingLicense: uploadResult.url });
        } catch (error: any) {
          Alert.alert('Error', 'Failed to upload Driving License document');
          setLoading(false);
          return;
        } finally {
          setUploading(null);
        }
      }

      if (documents.selfie && !documentUrls.selfie) {
        setUploading('selfie');
        try {
          const uploadResult = await uploadApi.uploadBase64Image(documents.selfie, 'selfie');
          setDocumentUrls({ ...documentUrls, selfie: uploadResult.url });
        } catch (error: any) {
          Alert.alert('Error', 'Failed to upload Selfie');
          setLoading(false);
          return;
        } finally {
          setUploading(null);
        }
      }

      // Submit KYC with S3 URLs
      await driverApi.submitKyc({
        aadharNumber: kycData.aadharNumber || undefined,
        panNumber: kycData.panNumber || undefined,
        drivingLicenseNumber: kycData.drivingLicenseNumber,
        drivingLicenseExpiry: kycData.drivingLicenseExpiry,
        aadharUrl: documentUrls.aadhar || undefined,
        panUrl: documentUrls.pan || undefined,
        drivingLicenseUrl: documentUrls.drivingLicense || undefined,
        selfieUrl: documentUrls.selfie || undefined,
        bankName: kycData.bankName,
        bankIfscCode: kycData.bankIfscCode,
        bankAccountNumber: kycData.bankAccountNumber,
      });
      Alert.alert(
        'Documents Submitted',
        'Your documents have been submitted. We are verifying your profile. This process usually takes 1-2 hours. You\'ll be notified once the verification is complete.',
        [{ text: 'OK', onPress: () => {} }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit KYC');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>KYC Verification</Text>
          <Text style={styles.stepText}>Step {step} of 5</Text>
        </View>

        <View style={styles.content}>
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Identity Proof (Aadhar OR PAN)</Text>
              <Text style={styles.stepDescription}>Upload either Aadhar or PAN card</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Aadhar Number (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="12-digit Aadhar number"
                  keyboardType="numeric"
                  maxLength={12}
                  value={kycData.aadharNumber}
                  onChangeText={(text) => setKycData({ ...kycData, aadharNumber: text.replace(/\D/g, '') })}
                />
              </View>

              <View style={styles.uploadButtonContainer}>
                <TouchableOpacity 
                  style={[styles.uploadButton, styles.uploadButtonHalf]} 
                  onPress={() => pickImage('aadhar', false)}
                  disabled={uploading === 'aadhar'}
                >
                  {uploading === 'aadhar' ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.uploadText}>📁 Choose from Gallery</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.uploadButton, styles.uploadButtonHalf, styles.cameraButton]} 
                  onPress={() => pickImage('aadhar', true)}
                  disabled={uploading === 'aadhar'}
                >
                  {uploading === 'aadhar' ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.uploadText}>📷 Take Photo</Text>
                  )}
                </TouchableOpacity>
              </View>
              {documents.aadhar && (
                <View>
                  <Image source={{ uri: documents.aadhar }} style={styles.preview} />
                  {documentUrls.aadhar && (
                    <Text style={styles.uploadedText}>✓ Uploaded to S3</Text>
                  )}
                </View>
              )}

              <Text style={styles.orText}>OR</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>PAN Number (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10-character PAN (e.g., ABCDE1234F)"
                  autoCapitalize="characters"
                  maxLength={10}
                  value={kycData.panNumber}
                  onChangeText={(text) => setKycData({ ...kycData, panNumber: text.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                />
              </View>

              <View style={styles.uploadButtonContainer}>
                <TouchableOpacity 
                  style={[styles.uploadButton, styles.uploadButtonHalf]} 
                  onPress={() => pickImage('pan', false)}
                  disabled={uploading === 'pan'}
                >
                  {uploading === 'pan' ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.uploadText}>📁 Choose from Gallery</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.uploadButton, styles.uploadButtonHalf, styles.cameraButton]} 
                  onPress={() => pickImage('pan', true)}
                  disabled={uploading === 'pan'}
                >
                  {uploading === 'pan' ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.uploadText}>📷 Take Photo</Text>
                  )}
                </TouchableOpacity>
              </View>
              {documents.pan && (
                <View>
                  <Image source={{ uri: documents.pan }} style={styles.preview} />
                  {documentUrls.pan && (
                    <Text style={styles.uploadedText}>✓ Uploaded to S3</Text>
                  )}
                </View>
              )}
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Driving License</Text>
              <Text style={styles.stepDescription}>Upload your driving license document</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>License Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter driving license number"
                  value={kycData.drivingLicenseNumber}
                  onChangeText={(text) => setKycData({ ...kycData, drivingLicenseNumber: text })}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Expiry Date *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={kycData.drivingLicenseExpiry}
                  onChangeText={(text) => setKycData({ ...kycData, drivingLicenseExpiry: text })}
                />
              </View>

              <View style={styles.uploadButtonContainer}>
                <TouchableOpacity 
                  style={[styles.uploadButton, styles.uploadButtonHalf]} 
                  onPress={() => pickImage('drivingLicense', false)}
                  disabled={uploading === 'drivingLicense'}
                >
                  {uploading === 'drivingLicense' ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.uploadText}>📁 Choose from Gallery</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.uploadButton, styles.uploadButtonHalf, styles.cameraButton]} 
                  onPress={() => pickImage('drivingLicense', true)}
                  disabled={uploading === 'drivingLicense'}
                >
                  {uploading === 'drivingLicense' ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.uploadText}>📷 Take Photo</Text>
                  )}
                </TouchableOpacity>
              </View>
              {documents.drivingLicense && (
                <View>
                  <Image source={{ uri: documents.drivingLicense }} style={styles.preview} />
                  {documentUrls.drivingLicense && (
                    <Text style={styles.uploadedText}>✓ Uploaded to S3</Text>
                  )}
                </View>
              )}
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Bank Account Details *</Text>
              <Text style={styles.stepDescription}>Bank account details are required for receiving payments</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Bank Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter bank name"
                  value={kycData.bankName}
                  onChangeText={(text) => setKycData({ ...kycData, bankName: text })}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>IFSC Code *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., SBIN0001234"
                  autoCapitalize="characters"
                  maxLength={11}
                  value={kycData.bankIfscCode}
                  onChangeText={(text) => setKycData({ ...kycData, bankIfscCode: text.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                />
                <Text style={styles.helperText}>11 characters: 4 letters + 0 + 6 alphanumeric</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Account Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter account number"
                  keyboardType="numeric"
                  value={kycData.bankAccountNumber}
                  onChangeText={(text) => setKycData({ ...kycData, bankAccountNumber: text.replace(/\D/g, '') })}
                />
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  Your bank account will be verified using PayU verification service. This may take a few moments.
                </Text>
              </View>
            </View>
          )}

          {step === 4 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Selfie</Text>
              <Text style={styles.stepDescription}>Take a clear selfie of yourself</Text>
              <View style={styles.uploadButtonContainer}>
                <TouchableOpacity 
                  style={[styles.uploadButton, styles.uploadButtonHalf, styles.cameraButton]} 
                  onPress={() => pickImage('selfie', true)}
                  disabled={uploading === 'selfie'}
                >
                  {uploading === 'selfie' ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.uploadText}>📷 Take Selfie</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.uploadButton, styles.uploadButtonHalf]} 
                  onPress={() => pickImage('selfie', false)}
                  disabled={uploading === 'selfie'}
                >
                  {uploading === 'selfie' ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.uploadText}>📁 Choose from Gallery</Text>
                  )}
                </TouchableOpacity>
              </View>
              {documents.selfie && (
                <View>
                  <Image source={{ uri: documents.selfie }} style={styles.preview} />
                  {documentUrls.selfie && (
                    <Text style={styles.uploadedText}>✓ Uploaded to S3</Text>
                  )}
                </View>
              )}
            </View>
          )}

          {step === 5 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Review & Submit</Text>
              <Text style={styles.stepDescription}>Review your information and submit for verification</Text>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitText}>Submit KYC</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.navigation}>
            {step > 1 && (
              <TouchableOpacity style={styles.navButton} onPress={() => setStep(step - 1)}>
                <Text style={styles.navText}>Previous</Text>
              </TouchableOpacity>
            )}
            {step < 5 && step !== 5 && (
              <TouchableOpacity style={[styles.navButton, styles.navButtonPrimary]} onPress={handleNext}>
                <Text style={[styles.navText, styles.navTextPrimary]}>Next</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  header: { 
    backgroundColor: '#FF6B35', 
    padding: 20, 
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 20,
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#fff', 
    marginBottom: 5,
    textAlign: 'center',
  },
  stepText: { 
    fontSize: 14, 
    color: '#fff', 
    opacity: 0.9,
    textAlign: 'center',
  },
  content: { 
    padding: 16,
    paddingBottom: 100, // Extra padding for navigation buttons
  },
  stepContent: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 20, 
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    marginBottom: 8,
    color: '#333',
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#333',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  uploadButtonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
    marginTop: 8,
  },
  uploadButton: { 
    backgroundColor: '#FF6B35', 
    borderRadius: 8, 
    padding: 16, 
    alignItems: 'center',
    flex: 1,
  },
  uploadButtonHalf: {
    flex: 1,
  },
  cameraButton: {
    backgroundColor: '#2196F3',
  },
  uploadText: { 
    color: '#fff', 
    fontSize: 14, 
    fontWeight: '600' 
  },
  preview: { 
    width: '100%', 
    height: 200, 
    borderRadius: 8, 
    marginTop: 10,
    resizeMode: 'contain',
  },
  orText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 15,
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#1976D2',
    lineHeight: 18,
  },
  submitButton: { 
    backgroundColor: '#4CAF50', 
    borderRadius: 8, 
    padding: 16, 
    alignItems: 'center',
    marginTop: 10,
  },
  submitText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  navigation: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 20,
    gap: 12,
  },
  navButton: { 
    backgroundColor: '#fff', 
    borderRadius: 8, 
    padding: 15, 
    flex: 1, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  navButtonPrimary: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  navText: { 
    color: '#FF6B35', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  navTextPrimary: {
    color: '#fff',
  },
  uploadedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
});

