const express = require('express');
const app = express();
const sosController = require('../src/controllers/sos.controller');
const { authenticate } = require('../src/middleware/auth');

// Create a new SOS alert
app.post('/', authenticate, sosController.createSOS);

// Get all SOS alerts
app.get('/', authenticate, sosController.getAllSOS);

// Export the handler for serverless functions
module.exports = (req, res) => {
  // Set up the request and response objects for Express
  req.url = req.url.replace(/^\/api\/sos/, '');
  app(req, res);
}; 