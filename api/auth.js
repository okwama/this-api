const express = require('express');
const app = express();
const authController = require('../src/controllers/auth.controller');
const { authenticate } = require('../src/middleware/auth');

// Public routes
app.post('/login', authController.login);
app.post('/register', authController.register);
app.post('/refresh', authController.refreshToken);

// Protected routes
app.post('/logout', authenticate, authController.logout);
app.get('/profile', authenticate, authController.getProfile);
app.put('/profile', authenticate, authController.updateProfile);

// Export the handler for serverless functions
module.exports = (req, res) => {
  // Set up the request and response objects for Express
  req.url = req.url.replace(/^\/api\/auth/, '');
  app(req, res);
}; 