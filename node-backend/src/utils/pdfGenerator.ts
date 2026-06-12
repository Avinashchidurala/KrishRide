import PDFDocument from 'pdfkit';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { config } from '../config/environment';

const s3Client = new S3Client({
  region: config.awsRegion,
  credentials: {
    accessKeyId: config.awsAccessKeyId,
    secretAccessKey: config.awsSecretAccessKey,
  },
});

export interface InvoiceData {
  bookingNumber: string;
  customerName: string;
  customerMobile: string;
  customerEmail: string;
  driverName: string;
  driverMobile: string;
  pickupLocation: string;
  dropLocation: string;
  scheduledTime: Date;
  passengerCount: number;
  baseFare: number;
  platformFee: number;
  serviceTax: number;
  totalFare: number;
  paymentStatus: string;
  utrNumber?: string;
  bookingDate: Date;
}

export const generateInvoicePDF = async (invoiceData: InvoiceData): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', async () => {
        try {
          const pdfBuffer = Buffer.concat(chunks);
          const key = `invoices/${invoiceData.bookingNumber}-${Date.now()}.pdf`;

          const command = new PutObjectCommand({
            Bucket: config.awsS3Bucket,
            Key: key,
            Body: pdfBuffer,
            ContentType: 'application/pdf',
          });

          await s3Client.send(command);

          const url = `https://${config.awsS3Bucket}.s3.${config.awsRegion}.amazonaws.com/${key}`;
          resolve(url);
        } catch (error) {
          reject(error);
        }
      });

      // Invoice Header
      doc.fontSize(24).text('HushRyd', { align: 'center' });
      doc.fontSize(16).text('Invoice', { align: 'center' });
      doc.moveDown();

      // Booking Details
      doc.fontSize(14).text(`Booking Number: ${invoiceData.bookingNumber}`, { align: 'left' });
      doc.text(`Booking Date: ${invoiceData.bookingDate}`, { align: 'left' });
      doc.moveDown();

      // Customer Details
      doc.fontSize(12).text('Customer Details:', { underline: true });
      doc.text(`Name: ${invoiceData.customerName}`);
      doc.text(`Mobile: ${invoiceData.customerMobile}`);
      doc.text(`Email: ${invoiceData.customerEmail}`);
      doc.moveDown();

      // Driver Details
      doc.text('Driver Details:', { underline: true });
      doc.text(`Name: ${invoiceData.driverName}`);
      doc.text(`Mobile: ${invoiceData.driverMobile}`);
      doc.moveDown();

      // Ride Details
      doc.text('Ride Details:', { underline: true });
      doc.text(`Pickup: ${invoiceData.pickupLocation}`);
      doc.text(`Drop: ${invoiceData.dropLocation}`);
      doc.text(`Date & Time: ${invoiceData.scheduledTime.toLocaleString('en-IN')}`);
      doc.text(`Passengers: ${invoiceData.passengerCount}`);
      doc.moveDown();

      // Fare Breakdown
      doc.text('Fare Breakdown:', { underline: true });
      doc.text(`Base Fare: ₹${invoiceData.baseFare.toFixed(2)}`);
      doc.text(`Platform Fee: ₹${invoiceData.platformFee.toFixed(2)}`);
      doc.moveDown();
      doc.fontSize(14).text(`Total Amount: ₹${invoiceData.totalFare.toFixed(2)}`, { underline: true });
      doc.moveDown();

      // Payment Details
      doc.fontSize(12);
      doc.text(`Payment Status: ${invoiceData.paymentStatus}`);
      if (invoiceData.utrNumber) {
        doc.text(`UTR Number: ${invoiceData.utrNumber}`);
      }
      doc.moveDown();

      // Footer
      doc.fontSize(10).text('Thank you for using HushRyd!', { align: 'center' });
      doc.text('For support, contact: support@hushryd.com', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

