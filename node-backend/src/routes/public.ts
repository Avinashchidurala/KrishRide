/**
 * Public Routes
 * 
 * Routes that don't require authentication.
 * Includes public data like service availability, static content, etc.
 */

import express from 'express';
import { stateValidationService } from '../services/stateValidationService';

const router = express.Router();

/**
 * Get all active service states
 * 
 * @route GET /api/public/service-states
 * @returns {Array} Array of active service states
 * 
 * @example
 * GET /api/public/service-states
 * Response:
 * [
 *   {
 *     "id": "state-ap-001",
 *     "name": "Andhra Pradesh",
 *     "is_active": true
 *   },
 *   {
 *     "id": "state-tg-001",
 *     "name": "Telangana",
 *     "is_active": true
 *   }
 * ]
 */
router.get('/service-states', async (req, res) => {
  try {
    const states = await stateValidationService.getAllStates(false);

    res.json(
      states.map((state: any) => ({
        id: state.id,
        name: state.name,
        is_active: state.is_active,
      }))
    );
  } catch (error: any) {
    console.error('Error fetching service states:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch service states' });
  }
});

/**
 * Get service availability message
 * 
 * @route GET /api/public/service-availability
 * @returns {Object} Service availability info with active states count and message
 * 
 * @example
 * GET /api/public/service-availability
 * Response:
 * {
 *   "isAvailable": true,
 *   "activeStatesCount": 4,
 *   "message": "Currently available in Andhra Pradesh, Telangana, Karnataka and Tamil Nadu"
 * }
 */
router.get('/service-availability', async (req, res) => {
  try {
    const statesCount = await stateValidationService.getStateCount();
    const message = await stateValidationService.getUnavailableStateMessage();

    // The getUnavailableStateMessage returns "Currently available only in..." format
    // For this endpoint, we'll reformat it to just list the states
    const isAvailable = statesCount > 0;

    res.json({
      isAvailable,
      activeStatesCount: statesCount,
      message: isAvailable
        ? message.replace('Currently available only in ', 'Currently available in ')
        : 'Service is currently unavailable',
    });
  } catch (error: any) {
    console.error('Error fetching service availability:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch service availability' });
  }
});

/**
 * Validate if a location is in a service state
 * 
 * @route POST /api/public/validate-state
 * @body {Object} - { state: "Andhra Pradesh" }
 * @returns {Object} Validation result
 * 
 * @example
 * POST /api/public/validate-state
 * Body: { "state": "Telangana" }
 * Response:
 * {
 *   "isValid": true,
 *   "state": "Telangana",
 *   "message": "Service is available in this state"
 * }
 */
router.post('/validate-state', async (req, res) => {
  try {
    const { state } = req.body;

    if (!state || typeof state !== 'string') {
      return res.status(400).json({
        isValid: false,
        status: 'invalid_input',
        message: 'State name is required',
      });
    }

    const result = await stateValidationService.validateStateStatus(state);

    res.json(result);
  } catch (error: any) {
    console.error('Error validating state:', error);
    res.status(500).json({ error: error.message || 'Failed to validate state' });
  }
});

export default router;
