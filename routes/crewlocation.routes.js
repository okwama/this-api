const express = require('express');
const router = express.Router();
const { createLocation, getLocationsByRequest } = require('../controllers/crewlocation.controller');

// POST location
router.post('/location', createLocation);

// GET locations by request ID
router.get('/location/:requestId', getLocationsByRequest);

module.exports = router;
