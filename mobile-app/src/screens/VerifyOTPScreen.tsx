import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { authApi } from '../services/authApi';
import { useAppDispatch } from '../store/hooks';
import { setAuthData } from '../store/slices/authSlice';
import { ScreenLayout } from '../components/layout';
import { Logo } from '../components/Logo';

export default function VerifyOTPScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useAppDispatch();
  const params = route.params as { 
    mobile?: string; 
    type?: 'login' | 'signup'; 
    role?: 'customer' | 'driver';
    signupData?: {
      firstName: string;
      lastName: string;
      email?: string;
      gender: string;
    };
  };
  
  const { mobile, type, role, signupData } = params || {};
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [loading, setLoading] = useState(false);

  // Prevent direct access - redirect if required params are missing
  useEffect(() => {
    if (!mobile || !type) {
      // Missing required params - redirect to login
      Alert.alert('Error', 'Invalid access. Please login or signup first.', [
        { text: 'OK', onPress: () => navigation.navigate('Login' as never) }
      ]);
      return;
    }
  }, [mobile, type, navigation]);

  useEffect(() => {
    if (mobile && type) {
    inputRefs.current[0]?.focus();
    }
  }, [mobile, type]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      Alert.alert('Error', 'Please enter complete OTP');
      return;
    }

    try {
      setLoading(true);
      console.log('📱 [VERIFY_OTP] Starting OTP verification...');
      console.log('📱 [VERIFY_OTP] Type:', type);
      console.log('📱 [VERIFY_OTP] Role:', role);
      console.log('📱 [VERIFY_OTP] Signup data:', signupData);
      
      const result = await (type === 'login'
        ? authApi.verifyLoginOtp(mobile, otpString)
        : authApi.verifySignupOtp(mobile, otpString, role || 'customer', signupData));

      console.log('Verify OTP result:', result);
      
      // Backend wraps response in {success: true, data: {...}}
      const responseData = result.data || result;
      
      // Check if user data exists
      if (!responseData.user) {
        console.error('Response data:', responseData);
        throw new Error('User data not found in response');
      }

      // Store user and token in Redux and AsyncStorage
      const token = responseData.token || responseData.accessToken;
      if (token && responseData.user) {
        dispatch(setAuthData({ user: responseData.user, token }));
      } else {
        throw new Error('Missing user or token in response');
      }
      
      // Navigation will be handled automatically by AppNavigator
      // based on the updated auth state
      console.log('✅ Authentication successful for user:', responseData.user.mobile);
    } catch (error: any) {
      console.error('❌ [VERIFY_OTP] OTP verification error');
      console.error('❌ [VERIFY_OTP] Error type:', error?.constructor?.name);
      console.error('❌ [VERIFY_OTP] Error message:', error?.message);
      console.error('❌ [VERIFY_OTP] Error status:', error?.response?.status);
      console.error('❌ [VERIFY_OTP] Error response:', JSON.stringify(error?.response?.data, null, 2));
      console.error('❌ [VERIFY_OTP] Full error:', JSON.stringify(error, null, 2));
      
      const errorMessage = error?.response?.data?.error 
        || error?.response?.data?.message 
        || error?.message 
        || `OTP verification failed (Status: ${error?.response?.status || 'Unknown'})`;
      
      Alert.alert(
        'Verification Error', 
        `${errorMessage}\n\nCheck console logs for details.`,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await authApi.login(mobile);
      Alert.alert('Success', 'OTP resent successfully');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend OTP');
    }
  };

  return (
    <ScreenLayout
      header={{
        title: 'Verify OTP',
        showBack: true,
        showLogo: false,
      }}
      backgroundColor="#F8F9FA"
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Logo width={140} height={60} />
        </View>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit OTP sent to {mobile}
        </Text>

        <View style={styles.card}>
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={styles.otpInput}
              value={digit}
              onChangeText={(value) => handleOtpChange(index, value)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify OTP</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResend} style={styles.resendButton}>
          <Text style={styles.resendText}>Resend OTP</Text>
        </TouchableOpacity>
        </View>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    padding: 20,
    paddingTop: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
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
    marginBottom: 40,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
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
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  otpInput: {
    width: 45,
    height: 55,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  resendText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
});

