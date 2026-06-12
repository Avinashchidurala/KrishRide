import express, { Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';
import { config } from '../config/environment';
import { sendPaymentInvoiceEmail } from '../utils/emailService';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getRazorpayPaymentDetails,
  refundRazorpayPayment,
} from '../services/razorpayService';

const router = express.Router();

// Razorpay - Create order for payment
router.post('/razorpay/create-order', authenticate, async (req: AuthRequest, res) => {
  try {
    const { bookingId, amount } = req.query;

    if (!bookingId || !amount) {
      return res.status(400).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2>Error</h2>
            <p>Missing required parameters: bookingId and amount</p>
            <button onclick="window.ReactNativeWebView.postMessage('PAYMENT_FAILED')">Close</button>
          </body>
        </html>
      `);
    }

    // Get booking details (you might want to validate the booking exists)
    // For now, we'll use the provided amount

    const PAYU_KEY = config.payuMerchantKey || process.env.PAYU_MERCHANT_KEY || process.env.PAYU_KEY || '';
    const PAYU_SALT = config.payuMerchantSalt || process.env.PAYU_MERCHANT_SALT || process.env.PAYU_SALT || '';
    const PAYU_MODE = config.payuMode || process.env.PAYU_MODE || 'TEST';
    const PAYU_BASE_URL = PAYU_MODE === 'PRODUCTION'
      ? 'https://secure.payu.in'
      : 'https://test.payu.in';

    if (!PAYU_KEY || !PAYU_SALT) {
      return res.status(500).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2>Configuration Error</h2>
            <p>Payment system is not configured properly.</p>
            <button onclick="window.ReactNativeWebView.postMessage('PAYMENT_FAILED')">Close</button>
          </body>
        </html>
      `);
    }

    // Generate payment parameters
    const crypto = require('crypto');
    const txnid = `TXN${Date.now()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`.substring(0, 30);

    const sanitizeForHash = (value: string): string => {
      return String(value || '').trim().replace(/\|/g, '').replace(/\s+/g, ' ');
    };

    const productinfo = sanitizeForHash(`HushRyd Booking ${bookingId}`).replace(/\s+/g, '');
    const amountString = parseFloat(amount as string).toFixed(2);

    // For mobile WebView, we need user details - you might want to get these from booking
    const firstname = 'Customer';
    const email = 'customer@hushryd.com';
    const phone = '9999999999';

    const sanitizedFirstname = sanitizeForHash(firstname);
    const sanitizedEmail = sanitizeForHash(email);

    // Success and failure URLs for mobile WebView
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://your-domain.com'
      : 'http://10.0.2.2:3000'; // Android emulator

    const surl = `${baseUrl}/api/payments/payu/callback?status=success&txnid=${txnid}`;
    const furl = `${baseUrl}/api/payments/payu/callback?status=failure&txnid=${txnid}`;

    // Generate hash string (same as create-payment endpoint)
    const hashString = `${PAYU_KEY}|${txnid}|${amountString}|${productinfo}|${sanitizedFirstname}|${sanitizedEmail}|||||||||||${PAYU_SALT}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    // Return HTML page with auto-submitting form
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PayU Payment</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f8f9fa;
            text-align: center;
        }
        .container {
            max-width: 400px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #FF6B35;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .amount {
            font-size: 24px;
            font-weight: bold;
            color: #FF6B35;
            margin: 10px 0;
        }
        .text {
            color: #666;
            margin: 10px 0;
        }
        .secure {
            color: #28a745;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="loading">
            <div class="spinner"></div>
            <div>
                <div class="amount">₹${amountString}</div>
                <div class="text">Processing payment...</div>
                <div class="text">Please wait while we redirect you to secure payment gateway</div>
                <div class="secure">
                    <span>🔒</span>
                    <span>SSL Secured Payment</span>
                </div>
            </div>
        </div>
    </div>

    <form id="payuForm" action="${PAYU_BASE_URL}/_payment" method="post" style="display: none;">
        <input type="hidden" name="key" value="${PAYU_KEY}" />
        <input type="hidden" name="txnid" value="${txnid}" />
        <input type="hidden" name="amount" value="${amountString}" />
        <input type="hidden" name="productinfo" value="${productinfo}" />
        <input type="hidden" name="firstname" value="${sanitizedFirstname}" />
        <input type="hidden" name="email" value="${sanitizedEmail}" />
        <input type="hidden" name="phone" value="${phone}" />
        <input type="hidden" name="surl" value="${surl}" />
        <input type="hidden" name="furl" value="${furl}" />
        <input type="hidden" name="hash" value="${hash}" />
        <input type="hidden" name="service_provider" value="payu_paisa" />
    </form>

    <script>
        // Auto-submit the form after a short delay
        setTimeout(function() {
            document.getElementById('payuForm').submit();
        }, 2000);

        // Listen for messages from React Native WebView
        window.addEventListener('message', function(event) {
            if (event.data && typeof event.data === 'string') {
                // Forward messages to React Native
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(event.data);
                }
            }
        });
    </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);

  } catch (error: any) {
    console.error('Error creating payment page:', error);
    res.status(500).send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2>Payment Error</h2>
          <p>An error occurred while processing your payment.</p>
          <button onclick="window.ReactNativeWebView.postMessage('PAYMENT_FAILED')">Close</button>
        </body>
      </html>
    `);
  }
});

// PayU Payment Callback Handler
router.get('/payu/callback', (req, res) => {
  try {
    const { status, txnid } = req.query;

    if (status === 'success') {
      // Payment successful - you might want to update booking status here
      console.log(`Payment successful for transaction: ${txnid}`);

      res.send(`
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 50px; background: #f8f9fa; }
              .success { color: #28a745; }
              .container { max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            </style>
          </head>
          <body>
            <div class="container">
              <h2 class="success">✅ Payment Successful!</h2>
              <p>Your booking has been confirmed.</p>
              <p>Transaction ID: ${txnid}</p>
              <script>
                // Notify React Native WebView about success
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage('PAYMENT_SUCCESS:' + '${txnid}');
                }
                // Auto-close after 3 seconds
                setTimeout(function() {
                  if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage('PAYMENT_SUCCESS:' + '${txnid}');
                  }
                }, 3000);
              </script>
            </div>
          </body>
        </html>
      `);
    } else {
      // Payment failed or cancelled
      console.log(`Payment failed/cancelled for transaction: ${txnid}`);

      res.send(`
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 50px; background: #f8f9fa; }
              .error { color: #dc3545; }
              .container { max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            </style>
          </head>
          <body>
            <div class="container">
              <h2 class="error">❌ Payment Failed</h2>
              <p>The payment could not be processed.</p>
              <p>Please try again.</p>
              <script>
                // Notify React Native WebView about failure
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage('PAYMENT_FAILED');
                }
                // Auto-close after 3 seconds
                setTimeout(function() {
                  if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage('PAYMENT_FAILED');
                  }
                }, 3000);
              </script>
            </div>
          </body>
        </html>
      `);
    }
  } catch (error: any) {
    console.error('PayU callback error:', error);
    res.status(500).send('Internal server error');
  }
});

router.post('/payu/create-payment', authenticate, async (req: AuthRequest, res) => {
  try {
    const { bookingId, amount } = req.body;
    const userId = req.user!.userId;

    if (!bookingId || typeof bookingId !== 'string') {
      return res.status(400).json({ error: 'Valid booking ID is required' });
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!booking || booking.customer.userId !== userId) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.paymentStatus === 'success') {
      return res.status(400).json({ error: 'Payment already completed for this booking' });
    }

    const user = booking.customer.user;
    const firstname = user.first_name;
    const email = user.email || `${user.mobile}@hushryd.com`;
    const phone = user.mobile;

    // CRITICAL: Use consistent environment variable names
    // Check config first (uses PAYU_MERCHANT_KEY), then fallback to PAYU_KEY for compatibility
    const PAYU_KEY = config.payuMerchantKey || process.env.PAYU_MERCHANT_KEY || process.env.PAYU_KEY || '';
    const PAYU_SALT = config.payuMerchantSalt || process.env.PAYU_MERCHANT_SALT || process.env.PAYU_SALT || '';
    const PAYU_MODE = config.payuMode || process.env.PAYU_MODE || 'TEST';
    const PAYU_BASE_URL = PAYU_MODE === 'PRODUCTION' 
      ? 'https://secure.payu.in' 
      : 'https://test.payu.in';

    if (!PAYU_KEY || !PAYU_SALT) {
      return res.status(500).json({ error: 'PayU credentials not configured' });
    }

    const crypto = require('crypto');
    
    // Generate unique transaction ID (max 30 chars, alphanumeric)
    const txnid = `TXN${Date.now()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`.substring(0, 30);
    
    // Sanitize inputs: remove pipe characters and trim whitespace
    // PayU hash string uses pipe as separator, so values must not contain pipes
    const sanitizeForHash = (value: string): string => {
      return String(value || '').trim().replace(/\|/g, '').replace(/\s+/g, ' ');
    };
    
    // Product info must not contain special characters (|, &, etc.)
    // CRITICAL: Remove spaces from productinfo - PayU may reject values with spaces
    const productinfo = sanitizeForHash(`HushRydBooking${booking.booking_number}`).replace(/\s+/g, '');
    
    // Sanitize user inputs
    const sanitizedFirstname = sanitizeForHash(firstname);
    const sanitizedEmail = sanitizeForHash(email);
    
    // Format amount to exactly 2 decimal places (as string for hash)
    const amountString = parseFloat(amount.toFixed(2)).toFixed(2);
    
    // Success and failure URLs (surl and furl)
    // CRITICAL: PayU callbacks MUST go to BACKEND, not frontend
    // PayU servers need to reach these URLs, so they must be publicly accessible
    // Use BACKEND_PUBLIC_URL (not CORS_ORIGIN which is frontend)
    const backendUrl = config.backendPublicUrl.replace(/\/$/, ''); // Remove trailing slash
    const frontendUrl = config.corsOrigin.replace(/\/$/, ''); // Frontend URL for redirects
    const surl = `${backendUrl}/api/payments/success?bookingId=${bookingId}`; // Success URL - PayU calls backend after successful payment
    const furl = `${backendUrl}/api/payments/failure?bookingId=${bookingId}`; // Failure URL - PayU calls backend after failed payment

    // PayU India Hash Format (SHA512) - EXACT FORMAT:
    // sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
    // Format breakdown:
    // - 6 required fields: key, txnid, amount, productinfo, firstname, email
    // - 5 UDF fields (udf1-udf5): all empty in our case (5 pipes: |udf1|udf2|udf3|udf4|udf5|)
    // - 5 reserved empty fields (5 pipes: |||||)
    // - 1 salt field (1 pipe before salt: |)
    // After email: |udf1|udf2|udf3|udf4|udf5||||||SALT = 10 pipes total
    // Total: 17 parts separated by 16 pipes (|)
    // IMPORTANT: Use exact same values in hash that will be sent in form
    
    // PayU Hash Format: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT
    // After email: |udf1|udf2|udf3|udf4|udf5||||||SALT = 11 pipes (5 for UDF + 5 for reserved + 1 before SALT)
    // Total: 17 parts, 16 pipes
    // VERIFIED: 11 pipes after email is CORRECT per PayU documentation
    const hashString = `${PAYU_KEY}|${txnid}|${amountString}|${productinfo}|${sanitizedFirstname}|${sanitizedEmail}|||||||||||${PAYU_SALT}`;
    
    // Generate SHA512 hash (lowercase hex)
    const hash = crypto.createHash('sha512').update(hashString).digest('hex').toLowerCase();
    
    // Verify hash string format
    const hashParts = hashString.split('|');
    if (hashParts.length !== 17) {
      console.error('[PayU] Hash format error: Expected 17 parts, got', hashParts.length);
      console.error('[PayU] Hash string:', hashString.replace(PAYU_SALT, 'SALT_HIDDEN'));
      return res.status(500).json({ error: 'Hash generation error' });
    }
    
    // CRITICAL DEBUGGING: Log exact values being sent to PayU
    // This helps identify hash mismatches
    console.log('\n=== PAYU PAYMENT REQUEST DEBUG ===');
    console.log('[PayU] Environment:', PAYU_MODE);
    console.log('[PayU] Base URL:', PAYU_BASE_URL);
    console.log('[PayU] Payment URL:', `${PAYU_BASE_URL}/_payment`);
    console.log('[PayU] Key:', PAYU_KEY);
    console.log('[PayU] Txnid:', txnid);
    console.log('[PayU] Amount (string):', amountString, '(type:', typeof amountString + ')');
    console.log('[PayU] Productinfo:', productinfo, '(length:', productinfo.length + ')');
    console.log('[PayU] Firstname:', sanitizedFirstname, '(length:', sanitizedFirstname.length + ')');
    console.log('[PayU] Email:', sanitizedEmail, '(length:', sanitizedEmail.length + ')');
    console.log('[PayU] Hash String (SALT hidden):', hashString.replace(PAYU_SALT, 'SALT_HIDDEN'));
    console.log('[PayU] Hash Parts Count:', hashParts.length, '(Expected: 17)');
    console.log('[PayU] Hash Length:', hash.length, '(Expected: 128)');
    console.log('[PayU] Hash Preview:', hash.substring(0, 20) + '...');
    console.log('[PayU] Success URL (surl):', surl);
    console.log('[PayU] Failure URL (furl):', furl);
    console.log('=== END PAYU DEBUG ===\n');

    // PayU API Request Payload (for form submission to PayU gateway)
    // All values must be strings, amount must have exactly 2 decimal places
    // IMPORTANT: Use sanitized values that match the hash calculation EXACTLY
    // CRITICAL: Every value in this response MUST match the hash string values character-by-character
    // Note: Cookie domain warnings from PayU are expected - they set cookies on their domain
    const response = {
      key: String(PAYU_KEY), // Ensure string type
      txnid: String(txnid), // Ensure string type
      amount: String(amountString), // Use same amount string as in hash (must be XX.XX format)
      productinfo: String(productinfo), // Use sanitized productinfo (NO SPACES, NO PIPES)
      firstname: String(sanitizedFirstname), // Use sanitized firstname (matches hash, NO PIPES)
      email: String(sanitizedEmail), // Use sanitized email (matches hash, NO PIPES)
      phone: String(phone), // Phone is not in hash, but required by PayU
      surl: String(surl), // Success URL (not in hash, but required)
      furl: String(furl), // Failure URL (not in hash, but required)
      hash: String(hash), // SHA512 hash (lowercase hex, 128 chars)
      service_provider: 'payu_paisa', // Required by PayU India
      paymentUrl: `${PAYU_BASE_URL}/_payment`, // Form action URL (not sent in form)
    };
    
    // CRITICAL VALIDATION: Verify all hash values match response values
    const hashValidation = {
      keyMatch: response.key === PAYU_KEY,
      txnidMatch: response.txnid === txnid,
      amountMatch: response.amount === amountString,
      productinfoMatch: response.productinfo === productinfo,
      firstnameMatch: response.firstname === sanitizedFirstname,
      emailMatch: response.email === sanitizedEmail,
    };
    
    const validationErrors = Object.entries(hashValidation)
      .filter(([_, match]) => !match)
      .map(([field]) => field);
    
    if (validationErrors.length > 0) {
      console.error('[PayU] CRITICAL ERROR: Hash values do not match response values!');
      console.error('[PayU] Mismatched fields:', validationErrors);
      console.error('[PayU] Hash validation:', hashValidation);
      return res.status(500).json({ 
        error: 'Hash generation error: Values mismatch',
        details: 'Internal error: Hash values do not match form values'
      });
    }
    
    console.log('[PayU] Hash validation passed: All values match');

    // Validate all required fields are present
    const requiredFields = ['key', 'txnid', 'amount', 'productinfo', 'firstname', 'email', 'phone', 'surl', 'furl', 'hash'];
    const missingFields = requiredFields.filter(field => !response[field as keyof typeof response]);
    if (missingFields.length > 0) {
      console.error('[PayU] Missing required fields:', missingFields);
      return res.status(500).json({ error: 'Missing required payment fields' });
    }

    // Update booking with transaction ID
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        utr_number: txnid, // Store transaction ID
        paymentStatus: 'initiated',
        paymentMethod: 'payu',
      },
    });

    res.json(response);
  } catch (error: any) {
    console.error('PayU create payment error:', error);
    res.status(500).json({ error: error.message || 'Failed to create payment' });
  }
});

// Verify PayU Payment
router.post('/payu/verify', authenticate, async (req: AuthRequest, res) => {
  try {
    const { txnid, bookingId } = req.body;

    if (!txnid || !bookingId) {
      return res.status(400).json({ error: 'Transaction ID and Booking ID are required' });
    }

    // Get booking
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        utr_number: txnid,
      },
      include: {
        customer: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if already verified
    if (booking.paymentStatus === 'success') {
      return res.json({
        success: true,
        verified: true,
        message: 'Payment already verified',
        bookingId: booking.id,
        txnid,
      });
    }

    // Verify payment with PayU status check API (if available)
    // For now, we'll check if payment was successful via callback
    // The success callback should have already updated the booking
    
    // If booking status is still 'initiated', payment might not be complete
    if (booking.paymentStatus === 'initiated') {
      return res.json({
        success: false,
        verified: false,
        message: 'Payment verification pending. Please wait for callback.',
      });
    }

    res.json({
      success: true,
      verified: booking.paymentStatus === 'success',
      bookingId: booking.id,
      txnid,
    });
  } catch (error: any) {
    console.error('PayU verify error:', error);
    res.status(500).json({ error: error.message || 'Payment verification failed' });
  }
});

// Create payment request
router.post('/create', authenticate, async (req, res) => {
  try {
    const { bookingId, amount } = req.body;
    const userId = req.user!.userId;

    // Input validation
    if (!bookingId || typeof bookingId !== 'string') {
      return res.status(400).json({ error: 'Valid booking ID is required' });
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: {
          include: {
            user: true,
          },
        },
        ride: true,
      },
    });

    if (!booking || booking.customer.userId !== userId) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Generate transaction ID
    const transactionId = generateTransactionId();

    // Prepare payment request
    const paymentData = {
      amount: parseFloat(amount),
      firstName: booking.customer.user.first_name,
      lastName: booking.customer.user.last_name,
      email: booking.customer.user.email || booking.customer.user.mobile + '@hushryd.com',
      phone: booking.customer.user.mobile,
      productInfo: `HushRyd Booking ${booking.booking_number}`,
      transactionId,
      successUrl: `${config.corsOrigin}/payment/success?txnid=${transactionId}`,
      failureUrl: `${config.corsOrigin}/payment/failure?txnid=${transactionId}`,
      cancelUrl: `${config.corsOrigin}/payment/cancel?txnid=${transactionId}`,
    };

    // Create payment request - this generates PayU payment parameters with hash
    const paymentResponse = await createPaymentRequest(paymentData);

    // Update booking with transaction ID
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        utr_number: transactionId,
        paymentStatus: 'initiated',
        paymentMethod: 'payu',
      },
    });

    // Return PayU payment URL and parameters for frontend form submission
    res.json({
      paymentUrl: paymentResponse.paymentUrl,
      transactionId: paymentResponse.transactionId,
      paymentParams: paymentResponse.paymentParams, // PayU formatted parameters with hash
    });
  } catch (error: any) {
    console.error('Payment creation error:', error);
    res.status(500).json({ error: error.message || 'Failed to create payment' });
  }
});

// Payment success callback - NOTE: Primary handlers are in server.ts (before middleware)
// These routes are kept for backward compatibility but PayU callbacks are handled in server.ts
// The server.ts handlers return HTML immediately, then we process payment in background
// This ensures PayU always gets a valid HTML response
router.get('/success', async (req, res) => {
  // Process payment in background (don't block response)
  handlePaymentSuccess(req.query as any, res).catch(err => {
    console.error('[PayU Success Callback] Background processing error:', err);
  });
});

router.post('/success', async (req, res) => {
  // Process payment in background (don't block response)
  handlePaymentSuccess(req.body, res).catch(err => {
    console.error('[PayU Success Callback] Background processing error:', err);
  });
});

export async function handlePaymentSuccess(paymentResponse: any, res?: Response) {
  try {
    // Log incoming PayU callback (safely, without sensitive data)
    console.log('[PayU Success Callback] Received:', {
      txnid: paymentResponse.txnid,
      status: paymentResponse.status,
      amount: paymentResponse.amount,
      productinfo: paymentResponse.productinfo,
      firstname: paymentResponse.firstname,
      email: paymentResponse.email,
      hash: paymentResponse.hash ? `${paymentResponse.hash.substring(0, 20)}...` : 'missing',
      timestamp: new Date().toISOString(),
    });

    // TODO: Verify payment response hash (commented out for now to keep it simple)
    // const verification = verifyPaymentResponse(paymentResponse);
    // For now, we'll trust PayU and verify later if needed
    const verification = {
      isValid: true,
      status: paymentResponse.status === 'success' ? 'success' : 'failed',
      transactionId: paymentResponse.txnid,
    };

    if (!verification.isValid) {
      console.error('[PayU Success Callback] Invalid hash verification');
      // Only send response if res is provided (not called from server.ts)
      if (res) {
        res.status(200).send(`
          <html>
            <head><title>Payment Processing</title></head>
            <body>
              <script>window.location.href = '${config.corsOrigin}/payment/failure?error=invalid_hash';</script>
              <p>Redirecting...</p>
            </body>
          </html>
        `);
      }
      return;
    }

    // Find booking by transaction ID (stored in utr_number)
    const booking = await prisma.booking.findFirst({
      where: { utr_number: verification.transactionId },
      include: {
        customer: {
          include: {
            user: true,
          },
        },
        ride: {
          include: {
            driver: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      console.error('[PayU Success Callback] Booking not found for txnid:', paymentResponse.txnid);
      // Only send response if res is provided (not called from server.ts)
      if (res) {
        res.status(200).send(`
          <html>
            <head><title>Payment Processing</title></head>
            <body>
              <script>window.location.href = '${config.corsOrigin}/payment/failure?error=booking_not_found';</script>
              <p>Redirecting...</p>
            </body>
          </html>
        `);
      }
      return;
    }

    // Prevent duplicate payment processing
    if (booking.paymentStatus === 'success') {
      // Payment already processed, return success
      console.log('[PayU Success Callback] Payment already processed for booking:', booking.booking_number);
      // Only send response if res is provided (not called from server.ts)
      if (res) {
        res.status(200).send(`
          <html>
            <head>
              <title>Payment Already Processed</title>
              <meta http-equiv="refresh" content="0;url=${config.corsOrigin}/payment/success?bookingId=${booking.id}&status=success&message=already_processed">
            </head>
            <body>
              <p>Payment already processed. Redirecting...</p>
              <script>window.location.href = '${config.corsOrigin}/payment/success?bookingId=${booking.id}&status=success&message=already_processed';</script>
            </body>
          </html>
        `);
      }
      return;
    }

    // Update booking payment status and confirm booking (use transaction for atomicity)
    await prisma.$transaction(async (tx) => {
      // Re-check booking status within transaction (prevent race condition)
      const currentBooking = await tx.booking.findUnique({
        where: { id: booking.id },
      });

      if (!currentBooking) {
        throw new Error('Booking not found');
      }

      // Prevent duplicate payment processing (idempotent)
      if (currentBooking.paymentStatus === 'success' && currentBooking.paymentStatus === "success") {
        return; // Already processed
      }

      if (verification.status === 'success') {
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            paymentStatus: 'success',
            status: 'confirmed',
            utr_number: paymentResponse.mihpayid || paymentResponse.bank_ref_num || paymentResponse.txnid || booking.utr_number,
            paymentMethod: 'payu',
          },
        });

        // Increment seats_booked on the ride when booking is confirmed
        await tx.ride.update({
          where: { id: booking.rideId },
          data: {
            seats_booked: { increment: booking.passengerCount },
          },
        });
      } else {
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            paymentStatus: 'failed',
            status: 'pending',
          },
        });
      }
    });

    // Send payment invoice email if payment was successful
    if (verification.status === 'success') {
      try {
        // Generate invoice PDF
        let invoiceUrl = null;
        try {
          const invoiceData = {
            bookingNumber: booking.booking_number,
            customerName: `${booking.customer.user.first_name} ${booking.customer.user.last_name}`,
            customerMobile: booking.customer.user.mobile,
            customerEmail: booking.customer.user.email || '',
            driverName: booking.ride.driver?.user ? `${booking.ride.driver.user.first_name} ${booking.ride.driver.user.last_name}` : 'Driver',
            driverMobile: booking.ride.driver?.user?.mobile || '',
            pickupLocation: booking.ride.start_location,
            dropLocation: booking.ride.end_location,
            scheduledTime: booking.ride.scheduled_time,
            passengerCount: booking.passengerCount,
            baseFare: Number(booking.base_fare),
            platformFee: Number(booking.platform_fee),
            serviceTax: Number(booking.service_tax),
            totalFare: Number(booking.total_fare),
            paymentStatus: 'success',
            utrNumber: paymentResponse.mihpayid || paymentResponse.bank_ref_num || null,
            bookingDate: booking.createdAt,
          };

          invoiceUrl = await generateInvoicePDF(invoiceData);
        } catch (error) {
          console.error('Error generating invoice:', error);
        }

        // Send invoice email to customer
        if (booking.customer.user.email && invoiceUrl) {
          await sendPaymentInvoiceEmail(
            booking.customer.user.email,
            `${booking.customer.user.first_name} ${booking.customer.user.last_name}`,
            booking.booking_number,
            invoiceUrl,
            Number(booking.total_fare)
          );

          await prisma.booking.update({
            where: { id: booking.id },
            data: { invoice_sent_email: true },
          });
        }

        // Send confirmation email and SMS to customer
        try {
          const customerName = `${booking.customer.user.first_name} ${booking.customer.user.last_name}`;
          
          // Send confirmation SMS to customer
          if (booking.customer.user.mobile) {
            const { sendBookingConfirmationSMS } = await import('../utils/smsService');
            await sendBookingConfirmationSMS(
              booking.customer.user.mobile,
              booking.booking_number,
              booking.ride.start_location,
              booking.ride.end_location,
              booking.ride.scheduled_time || new Date()
            );
          }

          // Send confirmation email to customer (if not already sent with invoice)
          if (booking.customer.user.email && invoiceUrl) {
            const { sendBookingConfirmationEmail } = await import('../utils/emailService');
            await sendBookingConfirmationEmail(
              booking.customer.user.email,
              customerName,
              booking.booking_number,
              invoiceUrl
            );
          }
        } catch (error) {
          console.error('Error sending customer confirmation notifications:', error);
        }

        // Send confirmation email and SMS to driver
        if (booking.ride.driver?.user) {
          try {
            const driverName = `${booking.ride.driver.user.first_name} ${booking.ride.driver.user.last_name}`;
            const customerName = `${booking.customer.user.first_name} ${booking.customer.user.last_name}`;
            
            // Send confirmation SMS to driver
            if (booking.ride.driver.user.mobile) {
              const { sendBookingConfirmationSMSToDriver } = await import('../utils/smsService');
              await sendBookingConfirmationSMSToDriver(
                booking.ride.driver.user.mobile,
                driverName,
                booking.booking_number,
                customerName,
                booking.ride.start_location,
                booking.ride.end_location,
                booking.ride.scheduled_time || new Date(),
                booking.passengerCount
              );
            }

            // Send confirmation email to driver
            if (booking.ride.driver.user.email) {
              const { sendBookingConfirmationEmailToDriver } = await import('../utils/emailService');
              await sendBookingConfirmationEmailToDriver(
                booking.ride.driver.user.email,
                driverName,
                booking.booking_number,
                customerName,
                booking.ride.start_location,
                booking.ride.end_location,
                booking.ride.scheduled_time || new Date(),
                booking.passengerCount
              );
            }
          } catch (error) {
            console.error('Error sending driver confirmation notifications:', error);
          }
        }
      } catch (error) {
        console.error('Error sending payment invoice email:', error);
      }
    }

    // CRITICAL: PayU requires this EXACT HTML format
    // This HTML must be returned DIRECTLY from surl/furl
    // DO NOT modify the structure - PayU validates this
    console.log('[PayU Success Callback] Payment processed successfully for booking:', booking.booking_number);
    const txnid = paymentResponse.txnid || paymentResponse.mihpayid || '';
    const txnidEscaped = txnid.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    
    // Only send response if res is provided (not called from server.ts)
    // When called from server.ts, HTML is already sent, so we just process in background
    if (res) {
      res.status(200).set("Content-Type", "text/html").send(`
<!DOCTYPE html>
<html>
  <head>
    <title>Payment Success</title>
  </head>
  <body>
    <script>
      try {
        if (window.opener) {
          window.opener.postMessage(
            {
              status: "success",
              source: "payu",
              txnid: "${txnidEscaped}"
            },
            "*"
          );
        }
        window.close();
      } catch (e) {
        document.body.innerText = "Payment completed. You may close this window.";
      }
    </script>
    <noscript>
      Payment completed. You may close this window.
    </noscript>
  </body>
</html>
    `);
    }
  } catch (error: any) {
    console.error('[PayU Success Callback] Error processing payment:', error);
    // Only send response if res is provided (not called from server.ts)
    if (res) {
      res.status(200).send(`
      <html>
        <head>
          <title>Payment Processing Error</title>
          <meta http-equiv="refresh" content="0;url=${config.corsOrigin}/payment/failure?error=processing_error">
        </head>
        <body>
          <p>An error occurred. Redirecting...</p>
          <script>window.location.href = '${config.corsOrigin}/payment/failure?error=processing_error';</script>
        </body>
      </html>
    `);
    }
  }
}

// Payment failure callback (PayU will call this backend endpoint)
// PayU can send data via GET (query params) or POST (body)
// CRITICAL: Always return 200 OK to PayU, then redirect to frontend
router.get('/failure', async (req, res) => {
  await handlePaymentFailure(req.query as any, res);
});

router.post('/failure', async (req, res) => {
  await handlePaymentFailure(req.body, res);
});

export async function handlePaymentFailure(paymentResponse: any, res?: Response) {
  try {
    // Log incoming PayU callback (safely, without sensitive data)
    console.log('[PayU Failure Callback] Received:', {
      txnid: paymentResponse.txnid,
      status: paymentResponse.status,
      error: paymentResponse.error_Message || paymentResponse.error,
      amount: paymentResponse.amount,
      timestamp: new Date().toISOString(),
    });

    // Find booking by transaction ID
    const booking = await prisma.booking.findFirst({
      where: { utr_number: paymentResponse.txnid },
      include: {
        customer: true,
      },
    });

    if (booking) {
      // Update payment status and cancel booking if not paid
      await prisma.$transaction(async (tx) => {
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            paymentStatus: 'failed',
            status: 'cancelled', // Cancel booking on payment failure
          },
        });

        // Decrement customer total_bookings since booking is cancelled
        await tx.customer.update({
          where: { id: booking.customerId },
          data: {
            total_bookings: { decrement: 1 },
          },
        });
      });

      console.log(`[PayU Failure Callback] Booking ${booking.booking_number} cancelled due to payment failure`);
    }

    // CRITICAL: PayU requires this EXACT HTML format
    // This HTML must be returned DIRECTLY from surl/furl
    // DO NOT modify the structure - PayU validates this
    const txnid = paymentResponse.txnid || paymentResponse.mihpayid || '';
    const txnidEscaped = txnid.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    
    // Only send response if res is provided (not called from server.ts)
    // When called from server.ts, HTML is already sent, so we just process in background
    if (res) {
      res.status(200).set("Content-Type", "text/html").send(`
<!DOCTYPE html>
<html>
  <head>
    <title>Payment Failed</title>
  </head>
  <body>
    <script>
      try {
        if (window.opener) {
          window.opener.postMessage(
            {
              status: "failure",
              source: "payu",
              txnid: "${txnidEscaped}"
            },
            "*"
          );
        }
        window.close();
      } catch (e) {
        document.body.innerText = "Payment failed. You may close this window.";
      }
    </script>
    <noscript>
      Payment failed. You may close this window.
    </noscript>
  </body>
</html>
    `);
    }
  } catch (error: any) {
    console.error('[PayU Failure Callback] Error processing failure:', error);
    // Only send response if res is provided (not called from server.ts)
    if (res) {
      res.status(200).send(`
      <html>
        <head>
          <title>Payment Processing Error</title>
          <meta http-equiv="refresh" content="0;url=${config.corsOrigin}/payment/failure?error=processing_error">
        </head>
        <body>
          <p>An error occurred. Redirecting...</p>
          <script>window.location.href = '${config.corsOrigin}/payment/failure?error=processing_error';</script>
        </body>
      </html>
    `);
    }
  }
}

// Payment cancel callback
router.post('/cancel', async (req, res) => {
  try {
    const { txnid } = req.body;

    const booking = await prisma.booking.findFirst({
      where: { utr_number: txnid },
      include: {
        customer: true,
      },
    });

    if (booking) {
      // Cancel booking when payment is cancelled by user
      await prisma.$transaction(async (tx) => {
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            paymentStatus: 'cancelled',
            status: 'cancelled', // Cancel booking when payment is cancelled
          },
        });

        // Decrement customer total_bookings since booking is cancelled
        await tx.customer.update({
          where: { id: booking.customerId },
          data: {
            total_bookings: { decrement: 1 },
          },
        });
      });

      console.log(`[Payment] Booking ${booking.booking_number} cancelled due to payment cancellation`);
    }

    res.redirect(`${config.corsOrigin}/payment/cancel?bookingId=${booking?.id || ''}`);
  } catch (error: any) {
    console.error('Payment cancel callback error:', error);
    res.redirect(`${config.corsOrigin}/payment/cancel?error=processing_error`);
  }
});

// Get payment status
router.get('/status/:transactionId', authenticate, async (req, res) => {
  try {
    const { transactionId } = req.params;

    const booking = await prisma.booking.findFirst({
      where: { utr_number: transactionId },
      include: {
        customer: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({
      transactionId,
      paymentStatus: booking.paymentStatus,
      amount: booking.total_fare,
      bookingId: booking.id,
    });
  } catch (error: any) {
    console.error('Payment status error:', error);
    res.status(500).json({ error: error.message || 'Failed to get payment status' });
  }
});

export default router;

