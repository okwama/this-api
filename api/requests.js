const express = require('express');
const app = express();
const requestController = require('../src/controllers/request.controller');
const { authenticate } = require('../src/middleware/auth');

// IMPORTANT: All specific routes (without parameters) must come FIRST
// before any parameterized routes like /:id

// Get all pending requests
app.get('/pending', authenticate, requestController.getPendingRequests);

// Get all staff requests (supervisor/admin only)
app.get('/all', authenticate, requestController.getAllStaffRequests);

// Get confirmed pickup requests
app.get('/in-progress', authenticate, requestController.inProgressRequests);

// Get all completed requests
app.get('/completed', authenticate, requestController.completedRequests);

// Get vault officers
app.get('/vault-officers', authenticate, requestController.getVaultOfficers);

// Get available vault officers
app.get('/available-vault-officers', authenticate, requestController.getAvailableVaultOfficers);

// PARAMETERIZED ROUTES MUST COME LAST
// Get request details - This catches any /:id pattern, so it must be after specific routes
app.get('/:id', authenticate, requestController.getRequestDetails);

// Confirm pickup
app.post('/:id/pickup', authenticate, requestController.confirmPickup);

// Confirm delivery
app.post('/:id/delivery', authenticate, requestController.confirmDelivery);

// Assign to vault officer
app.post('/:id/assign-vault-officer', authenticate, requestController.assignToVaultOfficer);

// Export the handler for serverless functions
module.exports = (req, res) => {
  // Set up the request and response objects for Express
  req.url = req.url.replace(/^\/api\/requests/, '');
  app(req, res);
}; 