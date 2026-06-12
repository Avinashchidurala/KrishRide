import Razorpay from 'razorpay';
import crypto from 'crypto';
import { config } from '../config/environment';

// Initialize Razorpay instance
let razorpayInstance: Razorpay | null = null;

export const getRazorpayInstance = (): Razorpay => {
  if (!razorpayInstance) {
    if (!config.razorpayKeyId || !config.razorpayKeySecret) {
      throw new Error('Razorpay credentials not configured');
    }
    razorpayInstance = new Razorpay({
      key_id: config.razorpayKeyId,
      key_secret: config.razorpayKeySecret,
    });
  }
  return razorpayInstance;
};

/**
 * Create a Razorpay order
 * @param amount Amount in INR (will be converted to paise)
 * @param receipt Receipt ID/booking number
 * @param customer Customer details
 * @returns Razorpay order object
 */
export const createRazorpayOrder = async (
  amount: number,
  receipt: string,
  customer?: {
    name?: string;
    email?: string;
    contact?: string;
  }
): Promise<any> => {
  const razorpay = getRazorpayInstance();
  
  // Convert amount to paise (multiply by 100)
  const amountInPaise = Math.round(amount * 100);
  
  const orderOptions: any = {
    amount: amountInPaise,
    currency: 'INR',
    receipt: receipt.substring(0, 40), // Razorpay has 40 char limit
    notes: {
      booking_receipt: receipt,
    },
  };

  // Add customer details if provided
  if (customer) {
    if (customer.name) orderOptions.notes.customer_name = customer.name;
    if (customer.email) orderOptions.notes.customer_email = customer.email;
    if (customer.contact) orderOptions.notes.customer_contact = customer.contact;
  }

  try {
    const order = await razorpay.orders.create(orderOptions);
    return order;
  } catch (error: any) {
    console.error('[Razorpay] Error creating order:', error);
    throw new Error(`Failed to create Razorpay order: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Verify Razorpay payment signature
 * @param orderId Razorpay order ID
 * @param paymentId Razorpay payment ID
 * @param signature Razorpay signature
 * @returns true if signature is valid
 */
export const verifyRazorpayPayment = (
  orderId: string,
  paymentId: string,
  signature: string
): boolean => {
  try {
    // Signature string format: order_id|payment_id
    const signatureString = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', config.razorpayKeySecret)
      .update(signatureString)
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('[Razorpay] Error verifying signature:', error);
    return false;
  }
};

/**
 * Get Razorpay payment details
 * @param paymentId Razorpay payment ID
 * @returns Payment details
 */
export const getRazorpayPaymentDetails = async (paymentId: string): Promise<any> => {
  const razorpay = getRazorpayInstance();
  
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error: any) {
    console.error('[Razorpay] Error fetching payment:', error);
    throw new Error(`Failed to fetch payment: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Get Razorpay order details
 * @param orderId Razorpay order ID
 * @returns Order details
 */
export const getRazorpayOrderDetails = async (orderId: string): Promise<any> => {
  const razorpay = getRazorpayInstance();
  
  try {
    const order = await razorpay.orders.fetch(orderId);
    return order;
  } catch (error: any) {
    console.error('[Razorpay] Error fetching order:', error);
    throw new Error(`Failed to fetch order: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Refund a Razorpay payment
 * @param paymentId Razorpay payment ID
 * @param amount Amount to refund in INR (will be converted to paise)
 * @param notes Refund notes
 * @returns Refund details
 */
export const refundRazorpayPayment = async (
  paymentId: string,
  amount?: number,
  notes?: Record<string, string>
): Promise<any> => {
  const razorpay = getRazorpayInstance();
  
  try {
    const refundOptions: any = {};
    
    if (amount) {
      // Convert amount to paise
      refundOptions.amount = Math.round(amount * 100);
    }
    
    if (notes) {
      refundOptions.notes = notes;
    }
    
    const refund = await razorpay.payments.refund(paymentId, refundOptions);
    return refund;
  } catch (error: any) {
    console.error('[Razorpay] Error creating refund:', error);
    throw new Error(`Failed to create refund: ${error.message || 'Unknown error'}`);
  }
};

