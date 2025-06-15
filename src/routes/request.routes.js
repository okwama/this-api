const express = require('express');
const router = express.Router();
const requestController = require('../controllers/request.controller');
const auth = require('../middleware/auth');

// IMPORTANT: All specific routes (without parameters) must come FIRST
// before any parameterized routes like /:id

// Get all pending requests
router.get('/pending', auth.authenticate, requestController.getPendingRequests);

// Get all staff requests (supervisor/admin only)
router.get('/all', auth.authenticate, requestController.getAllStaffRequests);

// Get confirmed pickup requests
router.get('/in-progress', auth.authenticate, requestController.inProgressRequests);

// Get all completed requests
router.get('/completed', auth.authenticate, requestController.completedRequests);

// Get vault officers
router.get('/vault-officers', auth.authenticate, requestController.getVaultOfficers);

// Get available vault officers
router.get('/available-vault-officers', auth.authenticate, requestController.getAvailableVaultOfficers);

// PARAMETERIZED ROUTES MUST COME LAST
// Get request details - This catches any /:id pattern, so it must be after specific routes
router.get('/:id', auth.authenticate, requestController.getRequestDetails);

// Confirm pickup
router.post('/:id/pickup', auth.authenticate, requestController.confirmPickup);

// Confirm delivery
router.post('/:id/delivery', auth.authenticate, requestController.confirmDelivery);

// Assign to vault officer
router.post('/:id/assign-vault-officer', auth.authenticate, requestController.assignToVaultOfficer);

module.exports = router;