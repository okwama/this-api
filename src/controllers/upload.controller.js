const { cloudinary } = require('../config/cloudinary');
const streamifier = require('streamifier');

const uploadImage = async (req, res) => {
  try {
    // Debug Cloudinary configuration
    console.log('Cloudinary Config:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? '***' : 'missing',
      api_secret: process.env.CLOUDINARY_API_SECRET ? '***' : 'missing'
    });

    console.log('Upload request received:', {
      file: req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : 'No file',
      headers: req.headers,
      body: req.body
    });

    if (!req.file) {
      console.log('No file provided in request');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Create a promise to handle the upload stream
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'bm_security',
          resource_type: 'auto',
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
          transformation: [
            { width: 1000, height: 1000, crop: 'limit' }
          ],
          // Add these options to help with debugging
          invalidate: true,
          overwrite: true,
          use_filename: true,
          unique_filename: true
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error details:', {
              message: error.message,
              http_code: error.http_code,
              name: error.name,
              request_id: error.request_id,
              error: error.error
            });
            reject(error);
          } else {
            console.log('Cloudinary upload successful:', {
              public_id: result.public_id,
              secure_url: result.secure_url,
              format: result.format,
              resource_type: result.resource_type
            });
            resolve(result);
          }
        }
      );

      // Pipe the file buffer to the upload stream
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    // Wait for the upload to complete
    const result = await uploadPromise;

    // Return the secure URL
    return res.status(200).json({
      success: true,
      data: {
        url: result.secure_url,
        public_id: result.public_id
      }
    });

  } catch (error) {
    console.error('Upload error details:', {
      error: error.message,
      user: req.user?.name || 'Unknown',
      stack: error.stack,
      http_code: error.http_code,
      request_id: error.request_id
    });

    // Handle specific error cases
    if (error.message.includes('File size too large')) {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 5MB limit'
      });
    }

    if (error.message.includes('Invalid image file')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image file format'
      });
    }

    // Return a more detailed error response
    return res.status(error.http_code || 500).json({
      success: false,
      message: error.message || 'Failed to upload image',
      error: process.env.NODE_ENV === 'development' ? {
        name: error.name,
        http_code: error.http_code,
        request_id: error.request_id
      } : undefined
    });
  }
};

module.exports = {
  uploadImage
}; 