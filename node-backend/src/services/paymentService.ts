import crypto from 'crypto';
import axios from 'axios';
import { config } from '../config/environment';

export interface PayUPaymentRequest {
  amount: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  productInfo: string;
  transactionId: string;
  successUrl: string;
  failureUrl: string;
  cancelUrl: string;
}

export interface PayUPaymentResponse {
  status: string;
  paymentUrl: string;
  transactionId: string;
  paymentParams: Record<string, string>; // PayU payment parameters with hash
}

// PayU Configuration
const PAYU_MERCHANT_KEY = config.payuMerchantKey || process.env.PAYU_MERCHANT_KEY || '';
const PAYU_MERCHANT_SALT = config.payuMerchantSalt || process.env.PAYU_MERCHANT_SALT || '';
const PAYU_MODE = config.payuMode || process.env.PAYU_MODE || 'TEST'; // TEST or PRODUCTION
const PAYU_BASE_URL = PAYU_MODE === 'PRODUCTION' 
  ? 'https://secure.payu.in' 
  : 'https://test.payu.in';

/**
 * Generate hash for PayU payment request
 * Format: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
 * 
 * @param key - Merchant key
 * @param txnid - Transaction ID
 * @param amount - Amount (must be string with 2 decimal places, e.g., "100.00")
 * @param productinfo - Product information (no spaces, no pipes)
 * @param firstname - Customer first name (no pipes)
 * @param email - Customer email (no pipes)
 * @param udf1 - Optional UDF parameter 1 (default: empty string)
 * @param udf2 - Optional UDF parameter 2 (default: empty string)
 * @param udf3 - Optional UDF parameter 3 (default: empty string)
 * @param udf4 - Optional UDF parameter 4 (default: empty string)
 * @param udf5 - Optional UDF parameter 5 (default: empty string)
 * @returns SHA512 hash in lowercase hex format
 */
const generatePaymentHash = (
  key: string,
  txnid: string,
  amount: string,
  productinfo: string,
  firstname: string,
  email: string,
  udf1: string = '',
  udf2: string = '',
  udf3: string = '',
  udf4: string = '',
  udf5: string = ''
): string => {
  // Sanitize inputs: remove pipe characters
  const sanitize = (value: string): string => {
    return String(value || '').trim().replace(/\|/g, '');
  };

  const sanitizedKey = sanitize(key);
  const sanitizedTxnid = sanitize(txnid);
  const sanitizedAmount = sanitize(amount);
  const sanitizedProductinfo = sanitize(productinfo);
  const sanitizedFirstname = sanitize(firstname);
  const sanitizedEmail = sanitize(email);
  const sanitizedUdf1 = sanitize(udf1);
  const sanitizedUdf2 = sanitize(udf2);
  const sanitizedUdf3 = sanitize(udf3);
  const sanitizedUdf4 = sanitize(udf4);
  const sanitizedUdf5 = sanitize(udf5);

  // Build hash string in exact order as per PayU documentation
  // Format: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT
  // Total: 17 parts (6 required + 5 UDF + 5 reserved empty + 1 salt) = 16 pipes
  const hashString = `${sanitizedKey}|${sanitizedTxnid}|${sanitizedAmount}|${sanitizedProductinfo}|${sanitizedFirstname}|${sanitizedEmail}|${sanitizedUdf1}|${sanitizedUdf2}|${sanitizedUdf3}|${sanitizedUdf4}|${sanitizedUdf5}||||||${PAYU_MERCHANT_SALT}`;

  // Generate SHA512 hash (lowercase hex)
  const hash = crypto
    .createHash('sha512')
    .update(hashString)
    .digest('hex')
    .toLowerCase();

  // Verify hash string format (should have 17 parts)
  const hashParts = hashString.split('|');
  if (hashParts.length !== 17) {
    console.error('[PayU] Hash format error: Expected 17 parts, got', hashParts.length);
    console.error('[PayU] Hash string:', hashString.replace(PAYU_MERCHANT_SALT, 'SALT_HIDDEN'));
    throw new Error('Hash generation error: Invalid format');
  }

  return hash;
};

// Create payment request
export const createPaymentRequest = async (
  paymentData: PayUPaymentRequest
): Promise<PayUPaymentResponse> => {
  try {
    const {
      amount,
      firstName,
      lastName,
      email,
      phone,
      productInfo,
      transactionId,
      successUrl,
      failureUrl,
      cancelUrl,
    } = paymentData;

    // Sanitize product info: remove spaces and special characters
    // CRITICAL: PayU may reject productinfo values with spaces
    const sanitizedProductInfo = String(productInfo || 'HushRydBooking')
      .trim()
      .replace(/\|/g, '')
      .replace(/\s+/g, '');

    // Sanitize firstname: remove pipes (used as delimiter in hash)
    const sanitizedFirstname = String(firstName || '')
      .trim()
      .replace(/\|/g, '');

    // Sanitize email: remove pipes
    const sanitizedEmail = String(email || '')
      .trim()
      .replace(/\|/g, '');

    // Format amount to exactly 2 decimal places (as string for hash)
    const amountString = parseFloat(amount.toFixed(2)).toFixed(2);

    // Generate hash using correct PayU format
    // Format: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
    const hash = generatePaymentHash(
      PAYU_MERCHANT_KEY,
      transactionId,
      amountString,
      sanitizedProductInfo,
      sanitizedFirstname,
      sanitizedEmail
      // udf1-udf5 are empty (default)
    );

    // Prepare payment parameters (all values must be strings)
    const paymentParams: Record<string, string> = {
      key: PAYU_MERCHANT_KEY,
      txnid: transactionId,
      amount: amountString, // Use same amount string as in hash
      productinfo: sanitizedProductInfo, // Use sanitized productinfo (matches hash)
      firstname: sanitizedFirstname, // Use sanitized firstname (matches hash)
      email: sanitizedEmail, // Use sanitized email (matches hash)
      phone: phone,
      surl: successUrl,
      furl: failureUrl,
      curl: cancelUrl,
      hash: hash,
      service_provider: 'payu_paisa',
    };

    // Create payment URL
    const paymentUrl = `${PAYU_BASE_URL}/_payment`;

    return {
      status: 'success',
      paymentUrl,
      transactionId,
      paymentParams, // Return formatted PayU parameters with hash for frontend form submission
    };
  } catch (error: any) {
    console.error('PayU payment request error:', error);
    throw new Error(error.message || 'Failed to create payment request');
  }
};

/**
 * Verify PayU payment response hash
 * Reverse hash format: sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 * 
 * For regular integration (no additional charges, no split transactions):
 * sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 */
export const verifyPaymentResponse = (response: Record<string, string>): {
  isValid: boolean;
  transactionId: string;
  status: string;
  amount: number;
} => {
  try {
    const {
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      status,
      hash,
      key,
      // UDF parameters (optional)
      udf1 = '',
      udf2 = '',
      udf3 = '',
      udf4 = '',
      udf5 = '',
      // Additional fields for split transactions or additional charges
      additional_charges = '',
      splitInfo = '',
    } = response;

    if (!txnid || !amount || !status || !hash) {
      console.error('[PayU] Missing required fields in payment response');
      return {
        isValid: false,
        transactionId: txnid || '',
        status: 'error',
        amount: 0,
      };
    }

    // Sanitize inputs
    const sanitize = (value: string): string => {
      return String(value || '').trim().replace(/\|/g, '');
    };

    const sanitizedStatus = sanitize(status);
    const sanitizedTxnid = sanitize(txnid);
    const sanitizedAmount = sanitize(amount);
    const sanitizedProductinfo = sanitize(productinfo || '');
    const sanitizedFirstname = sanitize(firstname || '');
    const sanitizedEmail = sanitize(email || '');
    const sanitizedUdf1 = sanitize(udf1);
    const sanitizedUdf2 = sanitize(udf2);
    const sanitizedUdf3 = sanitize(udf3);
    const sanitizedUdf4 = sanitize(udf4);
    const sanitizedUdf5 = sanitize(udf5);
    const sanitizedKey = sanitize(key || PAYU_MERCHANT_KEY);

    // Build reverse hash string based on PayU documentation
    // Format for regular integration: sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
    // Format with additional charges: sha512(additional_charges|SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
    // Format with split: sha512(SALT|status|splitInfo||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
    
    let hashString: string;
    
    if (additional_charges && splitInfo) {
      // Combined split and additional charges
      hashString = `${additional_charges}|${PAYU_MERCHANT_SALT}|${sanitizedStatus}|${splitInfo}||||||${sanitizedUdf5}|${sanitizedUdf4}|${sanitizedUdf3}|${sanitizedUdf2}|${sanitizedUdf1}|${sanitizedEmail}|${sanitizedFirstname}|${sanitizedProductinfo}|${sanitizedAmount}|${sanitizedTxnid}|${sanitizedKey}`;
    } else if (additional_charges) {
      // With additional charges only
      hashString = `${additional_charges}|${PAYU_MERCHANT_SALT}|${sanitizedStatus}||||||${sanitizedUdf5}|${sanitizedUdf4}|${sanitizedUdf3}|${sanitizedUdf2}|${sanitizedUdf1}|${sanitizedEmail}|${sanitizedFirstname}|${sanitizedProductinfo}|${sanitizedAmount}|${sanitizedTxnid}|${sanitizedKey}`;
    } else if (splitInfo) {
      // With split only
      hashString = `${PAYU_MERCHANT_SALT}|${sanitizedStatus}|${splitInfo}||||||${sanitizedUdf5}|${sanitizedUdf4}|${sanitizedUdf3}|${sanitizedUdf2}|${sanitizedUdf1}|${sanitizedEmail}|${sanitizedFirstname}|${sanitizedProductinfo}|${sanitizedAmount}|${sanitizedTxnid}|${sanitizedKey}`;
    } else {
      // Regular integration (no additional charges, no split)
      hashString = `${PAYU_MERCHANT_SALT}|${sanitizedStatus}||||||${sanitizedUdf5}|${sanitizedUdf4}|${sanitizedUdf3}|${sanitizedUdf2}|${sanitizedUdf1}|${sanitizedEmail}|${sanitizedFirstname}|${sanitizedProductinfo}|${sanitizedAmount}|${sanitizedTxnid}|${sanitizedKey}`;
    }

    // Generate expected hash
    const expectedHash = crypto
      .createHash('sha512')
      .update(hashString)
      .digest('hex')
      .toLowerCase();

    // Verify hash (case-insensitive comparison)
    const isValid = hash.toLowerCase() === expectedHash;

    if (!isValid) {
      console.error('[PayU] Hash verification failed');
      console.error('[PayU] Expected hash:', expectedHash.substring(0, 20) + '...');
      console.error('[PayU] Received hash:', hash.substring(0, 20) + '...');
      console.error('[PayU] Hash string:', hashString.replace(PAYU_MERCHANT_SALT, 'SALT_HIDDEN'));
    }

    return {
      isValid,
      transactionId: txnid,
      status: status.toLowerCase(),
      amount: parseFloat(amount),
    };
  } catch (error: any) {
    console.error('[PayU] Payment verification error:', error);
    return {
      isValid: false,
      transactionId: '',
      status: 'error',
      amount: 0,
    };
  }
};

// Get payment status
// Note: This is a placeholder - PayU status check API implementation may vary
// Refer to PayU API documentation for the correct endpoint and hash format
export const getPaymentStatus = async (transactionId: string): Promise<any> => {
  try {
    // PayU status check API (if available)
    // This is a placeholder - actual implementation depends on PayU API
    // The hash format for status check may differ from payment hash
    // Refer to PayU API documentation for the correct format
    
    console.warn('[PayU] getPaymentStatus is a placeholder - implement according to PayU API docs');
    
    // Placeholder implementation
    // const response = await axios.post(`${PAYU_BASE_URL}/merchant/postservice`, {
    //   key: PAYU_MERCHANT_KEY,
    //   command: 'verify_payment',
    //   var1: transactionId,
    //   hash: generateHash({
    //     key: PAYU_MERCHANT_KEY,
    //     command: 'verify_payment',
    //     var1: transactionId,
    //   }),
    // });
    // return response.data;
    
    throw new Error('Payment status check not implemented - refer to PayU API documentation');
  } catch (error: any) {
    console.error('[PayU] Payment status error:', error);
    throw new Error(error.message || 'Failed to get payment status');
  }
};

// Generate unique transaction ID
export const generateTransactionId = (): string => {
  return `TXN${Date.now()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
};

