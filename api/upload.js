const express = require('express');
const app = express();
const uploadController = require('../src/controllers/upload.controller');
const { authenticate } = require('../src/middleware/auth');

// Upload image
app.post('/', authenticate, uploadController.uploadImage);

// Export the handler for serverless functions
module.exports = (req, res) => {
  // Set up the request and response objects for Express
  req.url = req.url.replace(/^\/api\/upload/, '');
  app(req, res);
}; 