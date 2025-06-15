const express = require('express');
const app = express();
const crewlocationController = require('../src/controllers/crewlocation.controller');
const { authenticate } = require('../src/middleware/auth');

// POST /api/locations
app.post('/', authenticate, crewlocationController.createLocation);

// GET /api/locations/:requestId
app.get('/:requestId', authenticate, crewlocationController.getLocationsByRequest);

// Export the handler for serverless functions
module.exports = (req, res) => {
  // Set up the request and response objects for Express
  req.url = req.url.replace(/^\/api\/crewlocation/, '');
  app(req, res);
}; 