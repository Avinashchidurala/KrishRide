import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { authApi } from '../services/authApi';
import { Logo } from '../components/Logo';

export default function SignupScreen() {
  const navigation = useNavigation();
  const [role, setRole] = useState<'customer' | 'driver'>('customer');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    gender: '',
  });

  const handleSignup = async () => {
    if (!formData.firstName || !formData.lastName || !formData.mobile || !formData.gender) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (formData.mobile.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    const signupData = {
      role,
      firstName: formData.firstName,
      lastName: formData.lastName,
      mobile: formData.mobile,
      email: formData.email || undefined,
      gender: formData.gender,
    };

    console.log('📝 [SIGNUP] Starting signup process...');
    console.log('📝 [SIGNUP] Form data:', JSON.stringify(signupData, null, 2));
    console.log('📝 [SIGNUP] Role:', role);
    console.log('📝 [SIGNUP] Mobile:', formData.mobile);

    try {
      setLoading(true);
      console.log('📝 [SIGNUP] Calling authApi.signup...');
      const result = await authApi.signup(signupData);
      console.log('✅ [SIGNUP] Signup successful! Response:', JSON.stringify(result, null, 2));
      // Store signup data to pass to OTP verification
      navigation.navigate('VerifyOTP' as never, { 
        mobile: formData.mobile, 
        type: 'signup', 
        role,
        signupData: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          gender: formData.gender,
        }
      } as never);
    } catch (error: any) {
      console.error('❌ [SIGNUP] Signup failed!');
      console.error('❌ [SIGNUP] Error type:', error?.constructor?.name);
      console.error('❌ [SIGNUP] Error message:', error?.message);
      console.error('❌ [SIGNUP] Error response:', error?.response?.data);
      console.error('❌ [SIGNUP] Error status:', error?.response?.status);
      console.error('❌ [SIGNUP] Error statusText:', error?.response?.statusText);
      console.error('❌ [SIGNUP] Request URL:', error?.config?.url);
      console.error('❌ [SIGNUP] Request method:', error?.config?.method);
      console.error('❌ [SIGNUP] Request baseURL:', error?.config?.baseURL);
      console.error('❌ [SIGNUP] Full error:', JSON.stringify(error, null, 2));
      
      const errorMessage = error?.response?.data?.error 
        || error?.response?.data?.message 
        || error?.message 
        || `Failed to sign up (Status: ${error?.response?.status || 'Unknown'})`;
      
      Alert.alert(
        'Signup Error', 
        `${errorMessage}\n\nCheck console logs for details.`,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      console.log('📝 [SIGNUP] Signup process completed');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoContainer}>
          <Logo width={180} height={80} />
        </View>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join HushRyd today</Text>

        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[styles.roleButton, role === 'customer' && styles.roleButtonActive]}
            onPress={() => setRole('customer')}
          >
            <Text style={[styles.roleText, role === 'customer' && styles.roleTextActive]}>
              Customer
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleButton, role === 'driver' && styles.roleButtonActive]}
            onPress={() => setRole('driver')}
          >
            <Text style={[styles.roleText, role === 'driver' && styles.roleTextActive]}>
              Driver
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>First Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter first name"
            value={formData.firstName}
            onChangeText={(text) => setFormData({ ...formData, firstName: text })}
          />

          <Text style={styles.label}>Last Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter last name"
            value={formData.lastName}
            onChangeText={(text) => setFormData({ ...formData, lastName: text })}
          />

          <Text style={styles.label}>Mobile Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 10-digit mobile number"
            keyboardType="phone-pad"
            maxLength={10}
            value={formData.mobile}
            onChangeText={(text) => setFormData({ ...formData, mobile: text.replace(/\D/g, '') })}
          />

          <Text style={styles.label}>Email (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter email"
            keyboardType="email-address"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
          />

          <Text style={styles.label}>Gender *</Text>
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

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
        </TouchableOpacity>
        </View>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    paddingTop: 50,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  roleContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  roleButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  roleButtonActive: {
    borderColor: '#FF6B35',
    backgroundColor: '#FF6B35',
  },
  roleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  roleTextActive: {
    color: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  genderButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  genderButtonActive: {
    borderColor: '#FF6B35',
    backgroundColor: '#FF6B35',
  },
  genderText: {
    fontSize: 14,
    color: '#666',
  },
  genderTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
});

