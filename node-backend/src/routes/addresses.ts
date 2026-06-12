import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';

const router = express.Router();

// Get Saved Addresses (for suggestions during booking)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const addresses = await prisma.savedAddress.findMany({
      where: {
        userId: req.user!.userId,
      },
      orderBy: [
        { is_default: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Map to response format (label = address_type, displayName = address)
    const formattedAddresses = addresses.map(addr => ({
      id: addr.id,
      label: addr.address_type, // home, work, other
      displayName: addr.address,
      latitude: addr.latitude,
      longitude: addr.longitude,
      isDefault: addr.is_default,
    }));

    res.json({ addresses: formattedAddresses });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get addresses' });
  }
});

// Add Saved Address (Max 3: Home, Work, Other)
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { label, displayName, latitude, longitude } = req.body;

    // Validate label (must be home, work, or other)
    if (!['home', 'work', 'other'].includes(label)) {
      return res.status(400).json({ error: 'Label must be home, work, or other' });
    }

    // Validate display name
    if (!displayName || typeof displayName !== 'string' || displayName.trim().length === 0) {
      return res.status(400).json({ error: 'Display name is required' });
    }

    // Validate coordinates (required)
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const userId = req.user!.userId;

    // Check current address count (max 3)
    const addressCount = await prisma.savedAddress.count({
      where: { userId },
    });

    if (addressCount >= 3) {
      return res.status(400).json({ error: 'Maximum 3 saved addresses allowed (Home, Work, Other)' });
    }

    // Check if label already exists
    const existing = await prisma.savedAddress.findFirst({
      where: {
        userId,
        address_type: label,
      },
    });

    if (existing) {
      return res.status(400).json({ error: `${label} address already exists. Please update or delete it first.` });
    }

    // Get customer ID if user is a customer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { customer: true },
    });

    const savedAddress = await prisma.savedAddress.create({
      data: {
        userId,
        customerId: user?.customer?.id || null,
        address_type: label, // home, work, or other
        address: displayName.trim(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      },
    });

    res.json({
      address: {
        id: savedAddress.id,
        label: savedAddress.address_type,
        displayName: savedAddress.address,
        latitude: savedAddress.latitude,
        longitude: savedAddress.longitude,
      },
      message: 'Address saved successfully',
    });
  } catch (error: any) {
    console.error('Add address error:', error);
    res.status(500).json({ error: error.message || 'Failed to save address' });
  }
});

// Update Saved Address
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { displayName, latitude, longitude } = req.body;
    const userId = req.user!.userId;

    const savedAddress = await prisma.savedAddress.findUnique({
      where: { id: req.params.id },
    });

    if (!savedAddress || savedAddress.userId !== userId) {
      return res.status(404).json({ error: 'Address not found' });
    }

    // Validate coordinates if provided
    if (latitude !== undefined && !latitude) {
      return res.status(400).json({ error: 'Latitude is required' });
    }
    if (longitude !== undefined && !longitude) {
      return res.status(400).json({ error: 'Longitude is required' });
    }

    // Validate display name if provided
    if (displayName !== undefined && (!displayName || typeof displayName !== 'string' || displayName.trim().length === 0)) {
      return res.status(400).json({ error: 'Display name is required' });
    }

    const updated = await prisma.savedAddress.update({
      where: { id: savedAddress.id },
      data: {
        address: displayName !== undefined ? displayName.trim() : savedAddress.address,
        latitude: latitude !== undefined ? parseFloat(latitude) : savedAddress.latitude,
        longitude: longitude !== undefined ? parseFloat(longitude) : savedAddress.longitude,
      },
    });

    res.json({
      address: {
        id: updated.id,
        label: updated.address_type,
        displayName: updated.address,
        latitude: updated.latitude,
        longitude: updated.longitude,
      },
      message: 'Address updated successfully',
    });
  } catch (error: any) {
    console.error('Update address error:', error);
    res.status(500).json({ error: error.message || 'Failed to update address' });
  }
});

// Delete Saved Address
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;

    const savedAddress = await prisma.savedAddress.findUnique({
      where: { id: req.params.id },
    });

    if (!savedAddress || savedAddress.userId !== userId) {
      return res.status(404).json({ error: 'Address not found' });
    }

    await prisma.savedAddress.delete({
      where: { id: savedAddress.id },
    });

    res.json({ message: 'Address deleted successfully' });
  } catch (error: any) {
    console.error('Delete address error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete address' });
  }
});

// Get Address Suggestions (for booking - returns all saved addresses)
router.get('/suggestions', authenticate, async (req: AuthRequest, res) => {
  try {
    const addresses = await prisma.savedAddress.findMany({
      where: {
        userId: req.user!.userId,
      },
      orderBy: [
        { is_default: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Map to suggestions format
    const suggestions = addresses.map(addr => ({
      id: addr.id,
      label: addr.address_type, // home, work, other
      displayName: addr.address,
      latitude: addr.latitude?.toString(),
      longitude: addr.longitude?.toString(),
      isDefault: addr.is_default,
    }));

    res.json({ suggestions });
  } catch (error: any) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ error: error.message || 'Failed to get suggestions' });
  }
});

export default router;

