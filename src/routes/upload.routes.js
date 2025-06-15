const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const { upload } = require('../config/cloudinary');
const { authenticate } = require('../middleware/auth');

// Upload image route - allow all authenticated users to upload
router.post('/', authenticate, upload.single('image'), (req, res, next) => {
  // Add user info to request for logging
  console.log('Upload request from user:', req.user);
  next();
}, uploadController.uploadImage);

module.exports = router; 