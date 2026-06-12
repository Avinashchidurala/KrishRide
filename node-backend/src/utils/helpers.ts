import prisma from '../config/database';

export const generateBookingNumber = async (): Promise<string> => {
  let bookingNumber: string;
  let exists = true;

  while (exists) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    bookingNumber = `HUSH${randomNum}`;
    
    const existing = await prisma.booking.findUnique({
      where: { booking_number: bookingNumber },
    });

    if (!existing) {
      exists = false;
    }
  }

  return bookingNumber!;
};

export const generateReferralCode = (): string => {
  return `HUSH${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
};

export const calculateFare = (
  distanceKm: number,
  perKmRate: number,
  passengerCount: number,
  isSurge: boolean = false
): {
  baseFare: number;
  platformFee: number;
  serviceTax: number;
  driverFee: number;
  totalFare: number;
} => {
  const surgeMultiplier = isSurge ? 1.25 : 1.0;
  const adjustedRate = perKmRate * surgeMultiplier;
  const baseFare = distanceKm * adjustedRate * passengerCount;
  const platformFee = 10 * passengerCount; // ₹10 per user
  const driverFee = 20; // ₹20 per ride
  const totalFare = baseFare + platformFee;

  return {
    baseFare,
    platformFee,
    serviceTax: 0, // Service tax removed
    driverFee,
    totalFare,
  };
};

export const isWeekendOrFestival = (date: Date): boolean => {
  const day = date.getDay();
  const isWeekend = day === 0 || day === 6; // Sunday or Saturday
  
  // TODO: Add festival date checking logic
  // For now, just check weekends
  return isWeekend;
};

