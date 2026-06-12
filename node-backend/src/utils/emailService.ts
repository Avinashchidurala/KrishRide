import sgMail from '@sendgrid/mail';
import { config } from '../config/environment';

if (config.sendGridApiKey) {
  sgMail.setApiKey(config.sendGridApiKey);
}

export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  attachments?: Array<{ filename: string; content: string; type: string }>
): Promise<{ success: boolean; message: string }> => {
  try {
    if (!config.sendGridApiKey) {
      console.log('[DEV] Email would be sent:', { to, subject });
      return { success: true, message: 'Email sent (dev mode)' };
    }

    const msg: any = {
      to,
      from: config.sendGridFromEmail,
      subject,
      html,
    };

    if (attachments && attachments.length > 0) {
      msg.attachments = attachments;
    }

    await sgMail.send(msg);
    return { success: true, message: 'Email sent successfully' };
  } catch (error: any) {
    console.error('Email send error:', error);
    return { success: false, message: error.message || 'Failed to send email' };
  }
};

export const sendBookingConfirmationEmail = async (
  customerEmail: string,
  customerName: string,
  bookingNumber: string,
  invoiceUrl: string
): Promise<void> => {
  const subject = `Booking Confirmed - ${bookingNumber}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #FF6B35; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 10px 20px; background: #FF6B35; color: white; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>HushRyd</h1>
        </div>
        <div class="content">
          <h2>Booking Confirmed!</h2>
          <p>Dear ${customerName},</p>
          <p>Your ride has been booked successfully.</p>
          <p><strong>Booking Number:</strong> ${bookingNumber}</p>
          <p>Please find your invoice attached.</p>
          <p><a href="${invoiceUrl}" class="button">Download Invoice</a></p>
          <p>Thank you for choosing HushRyd!</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Download PDF and attach
  try {
    const pdfResponse = await fetch(invoiceUrl);
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

    await sendEmail(customerEmail, subject, html, [
      {
        filename: `invoice-${bookingNumber}.pdf`,
        content: pdfBase64,
        type: 'application/pdf',
      },
    ]);
  } catch (error) {
    // If PDF download fails, send email without attachment
    await sendEmail(customerEmail, subject, html);
  }
};

export const sendPaymentInvoiceEmail = async (
  customerEmail: string,
  customerName: string,
  bookingNumber: string,
  invoiceUrl: string,
  amount: number
): Promise<void> => {
  const subject = `Payment Invoice - Booking ${bookingNumber}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #FF6B35; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 10px 20px; background: #FF6B35; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px; }
        .amount { font-size: 24px; font-weight: bold; color: #FF6B35; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>HushRyd</h1>
        </div>
        <div class="content">
          <h2>Payment Successful!</h2>
          <p>Dear ${customerName},</p>
          <p>Your payment of ₹${amount.toFixed(2)} for booking ${bookingNumber} has been processed successfully.</p>
          <p>Please find your payment invoice attached.</p>
          <p><a href="${invoiceUrl}" class="button">Download Invoice</a></p>
          <p>Thank you for choosing HushRyd!</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Download PDF and attach
  try {
    const pdfResponse = await fetch(invoiceUrl);
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

    await sendEmail(customerEmail, subject, html, [
      {
        filename: `invoice-${bookingNumber}.pdf`,
        content: pdfBase64,
        type: 'application/pdf',
      },
    ]);
  } catch (error) {
    // If PDF download fails, send email without attachment
    await sendEmail(customerEmail, subject, html);
  }
};

export const sendKYCVerifiedEmail = async (
  driverEmail: string,
  driverName: string,
  status: 'approved' | 'rejected',
  remarks?: string
): Promise<void> => {
  const subject = status === 'approved' 
    ? 'KYC Verification Approved - HushRyd' 
    : 'KYC Verification Rejected - HushRyd';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${status === 'approved' ? '#4CAF50' : '#F44336'}; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .status { font-size: 24px; font-weight: bold; color: ${status === 'approved' ? '#4CAF50' : '#F44336'}; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>HushRyd</h1>
        </div>
        <div class="content">
          <h2>KYC Verification ${status === 'approved' ? 'Approved' : 'Rejected'}</h2>
          <p>Dear ${driverName},</p>
          ${status === 'approved' 
            ? `<p>Congratulations! Your KYC verification has been <span class="status">APPROVED</span>.</p>
               <p>You can now publish rides on HushRyd and start earning!</p>
               <p>Thank you for joining the HushRyd community.</p>`
            : `<p>We regret to inform you that your KYC verification has been <span class="status">REJECTED</span>.</p>
               ${remarks ? `<p><strong>Reason:</strong> ${remarks}</p>` : ''}
               <p>Please review your submitted documents and resubmit your KYC with correct information.</p>
               <p>If you have any questions, please contact our support team.</p>`
          }
          <p>Best regards,<br>HushRyd Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(driverEmail, subject, html);
};

export const sendWelcomeEmail = async (
  userEmail: string,
  userName: string,
  userRole: 'customer' | 'driver'
): Promise<void> => {
  const subject = 'Welcome to HushRyd!';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #FF6B35; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 10px 20px; background: #FF6B35; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to HushRyd!</h1>
        </div>
        <div class="content">
          <h2>Hello ${userName}!</h2>
          <p>We're thrilled to have you join the HushRyd community!</p>
          ${userRole === 'customer' 
            ? `<p>As a customer, you can now:</p>
               <ul>
                 <li>Book rides to your favorite destinations</li>
                 <li>Track your rides in real-time</li>
                 <li>Earn rewards and referral bonuses</li>
                 <li>Enjoy safe and comfortable rides</li>
               </ul>
               <p>Start your journey by booking your first ride today!</p>`
            : `<p>As a driver, you can now:</p>
               <ul>
                 <li>Complete your KYC verification to start publishing rides</li>
                 <li>Earn money by sharing your rides</li>
                 <li>Build your reputation with great ratings</li>
                 <li>Enjoy flexible working hours</li>
               </ul>
               <p>Complete your KYC verification to get started!</p>`
          }
          <p>If you have any questions, our support team is here to help.</p>
          <p>Thank you for choosing HushRyd!</p>
          <p>Best regards,<br>The HushRyd Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(userEmail, subject, html);
};

export const sendAdminCreatedUserEmail = async (
  userEmail: string,
  userName: string,
  userRole: 'customer' | 'driver' | 'admin',
  mobile: string,
  webUrl?: string
): Promise<void> => {
  const loginUrl = webUrl || process.env.CORS_ORIGIN || 'https://hushryd.com';
  const subject = 'Your HushRyd Account Has Been Created';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #FF6B35; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 30px; background: #FF6B35; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; font-weight: bold; }
        .info-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #FF6B35; border-radius: 4px; }
        .credentials { background: #f0f0f0; padding: 15px; margin: 15px 0; border-radius: 4px; font-family: monospace; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>HushRyd</h1>
        </div>
        <div class="content">
          <h2>Welcome ${userName}!</h2>
          <p>Your HushRyd account has been created successfully.</p>
          
          <div class="info-box">
            <h3>Account Details:</h3>
            <p><strong>Role:</strong> ${userRole.charAt(0).toUpperCase() + userRole.slice(1)}</p>
            <p><strong>Phone Number:</strong> ${mobile}</p>
            <p><strong>Email:</strong> ${userEmail}</p>
          </div>

          <div class="info-box">
            <h3>How to Login:</h3>
            <p>Your account uses OTP (One-Time Password) authentication for secure login:</p>
            <ol>
              <li>Visit the HushRyd login page</li>
              <li>Enter your phone number: <strong>${mobile}</strong></li>
              <li>Click "Send OTP"</li>
              <li>Enter the OTP received on your phone</li>
              <li>You'll be logged in automatically!</li>
            </ol>
          </div>

          ${userRole === 'customer' 
            ? `<p>As a customer, you can:</p>
               <ul>
                 <li>Book rides to your favorite destinations</li>
                 <li>Track your rides in real-time</li>
                 <li>Earn rewards and referral bonuses</li>
                 <li>Manage your saved addresses</li>
               </ul>`
            : userRole === 'driver'
            ? `<p>As a driver, you can:</p>
               <ul>
                 <li>Complete your KYC verification</li>
                 <li>Publish rides and earn money</li>
                 <li>Manage your vehicles</li>
               </ul>`
            : `<p>As an admin, you can:</p>
               <ul>
                 <li>Manage users, drivers, and customers</li>
                 <li>Verify KYC documents</li>
                 <li>Handle complaints and support tickets</li>
                 <li>View analytics and reports</li>
               </ul>`
          }

          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}/login" class="button">Login to HushRyd</a>
          </div>

          <p><strong>Need Help?</strong></p>
          <p>If you have any questions or need assistance, please contact our support team.</p>
          
          <p>Thank you for joining HushRyd!</p>
          <p>Best regards,<br>The HushRyd Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(userEmail, subject, html);
};

export const sendBookingConfirmationEmailToDriver = async (
  driverEmail: string,
  driverName: string,
  bookingNumber: string,
  customerName: string,
  pickupLocation: string,
  dropLocation: string,
  scheduledTime: Date,
  passengerCount: number
): Promise<void> => {
  const subject = `New Booking Confirmed - ${bookingNumber}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #FF6B35; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .booking-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .detail-row { margin: 10px 0; }
        .label { font-weight: bold; color: #555; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>HushRyd</h1>
        </div>
        <div class="content">
          <h2>New Booking Confirmed!</h2>
          <p>Dear ${driverName},</p>
          <p>You have a new confirmed booking!</p>
          <div class="booking-details">
            <div class="detail-row">
              <span class="label">Booking Number:</span> ${bookingNumber}
            </div>
            <div class="detail-row">
              <span class="label">Customer:</span> ${customerName}
            </div>
            <div class="detail-row">
              <span class="label">Pickup Location:</span> ${pickupLocation}
            </div>
            <div class="detail-row">
              <span class="label">Drop Location:</span> ${dropLocation}
            </div>
            <div class="detail-row">
              <span class="label">Scheduled Time:</span> ${scheduledTime.toLocaleString('en-IN')}
            </div>
            <div class="detail-row">
              <span class="label">Passengers:</span> ${passengerCount}
            </div>
          </div>
          <p>Please ensure you arrive on time for pickup. Thank you!</p>
          <p>Best regards,<br>HushRyd Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail(driverEmail, subject, html);
};

