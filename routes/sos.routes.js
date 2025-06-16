const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const sosController = require('../controllers/sos.controller');

// Create a new SOS alert
router.post('/', authenticate, sosController.createSOS);

// Get all SOS alerts
router.get('/', authenticate, sosController.getAllSOS);

module.exports = router;
