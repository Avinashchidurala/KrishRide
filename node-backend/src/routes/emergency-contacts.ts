import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';

const router = express.Router();

// Get Emergency Contacts
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;

    const contacts = await prisma.emergencyContact.findMany({
      where: { userId },
      orderBy: [
        { is_primary: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    res.json({ contacts });
  } catch (error: any) {
    console.error('Get emergency contacts error:', error);
    res.status(500).json({ error: error.message || 'Failed to get emergency contacts' });
  }
});

// Add Emergency Contact
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, mobile, relationship } = req.body;
    const userId = req.user!.userId;

    // Input validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (!mobile || typeof mobile !== 'string') {
      return res.status(400).json({ error: 'Mobile number is required' });
    }

    // Format mobile number
    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      return res.status(400).json({ error: 'Invalid mobile number' });
    }
    const formattedMobile = cleanMobile.length === 10 ? `+91${cleanMobile}` : mobile;

    // Check if contact already exists
    const existing = await prisma.emergencyContact.findFirst({
      where: {
        userId,
        mobile: formattedMobile,
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Emergency contact with this mobile number already exists' });
    }

    // If this is the first contact or is_primary is true, set as primary
    const existingContacts = await prisma.emergencyContact.findMany({
      where: { userId },
    });

    const isPrimary = existingContacts.length === 0 || req.body.isPrimary === true;

    // If setting as primary, unset other primary contacts
    if (isPrimary) {
      await prisma.emergencyContact.updateMany({
        where: {
          userId,
          is_primary: true,
        },
        data: {
          is_primary: false,
        },
      });
    }

    const contact = await prisma.emergencyContact.create({
      data: {
        userId,
        name: name.trim(),
        mobile: formattedMobile,
        relationship: relationship || null,
        is_primary: isPrimary,
      },
    });

    res.status(201).json({
      contact,
      message: 'Emergency contact added successfully',
    });
  } catch (error: any) {
    console.error('Add emergency contact error:', error);
    res.status(500).json({ error: error.message || 'Failed to add emergency contact' });
  }
});

// Update Emergency Contact
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, mobile, relationship, isPrimary } = req.body;
    const userId = req.user!.userId;

    const contact = await prisma.emergencyContact.findUnique({
      where: { id },
    });

    if (!contact || contact.userId !== userId) {
      return res.status(404).json({ error: 'Emergency contact not found' });
    }

    // Format mobile if provided
    let formattedMobile = contact.mobile;
    if (mobile) {
      const cleanMobile = mobile.replace(/\D/g, '');
      if (cleanMobile.length < 10) {
        return res.status(400).json({ error: 'Invalid mobile number' });
      }
      formattedMobile = cleanMobile.length === 10 ? `+91${cleanMobile}` : mobile;

      // Check if mobile is already used by another contact
      const existing = await prisma.emergencyContact.findFirst({
        where: {
          userId,
          mobile: formattedMobile,
          id: { not: id },
        },
      });

      if (existing) {
        return res.status(400).json({ error: 'Emergency contact with this mobile number already exists' });
      }
    }

    // Handle primary contact update
    if (isPrimary === true) {
      await prisma.emergencyContact.updateMany({
        where: {
          userId,
          is_primary: true,
          id: { not: id },
        },
        data: {
          is_primary: false,
        },
      });
    }

    const updated = await prisma.emergencyContact.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : contact.name,
        mobile: mobile !== undefined ? formattedMobile : contact.mobile,
        relationship: relationship !== undefined ? relationship : contact.relationship,
        is_primary: isPrimary !== undefined ? isPrimary : contact.is_primary,
      },
    });

    res.json({
      contact: updated,
      message: 'Emergency contact updated successfully',
    });
  } catch (error: any) {
    console.error('Update emergency contact error:', error);
    res.status(500).json({ error: error.message || 'Failed to update emergency contact' });
  }
});

// Delete Emergency Contact
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const contact = await prisma.emergencyContact.findUnique({
      where: { id },
    });

    if (!contact || contact.userId !== userId) {
      return res.status(404).json({ error: 'Emergency contact not found' });
    }

    await prisma.emergencyContact.delete({
      where: { id },
    });

    res.json({ message: 'Emergency contact deleted successfully' });
  } catch (error: any) {
    console.error('Delete emergency contact error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete emergency contact' });
  }
});

export default router;

