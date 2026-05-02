const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

// Use memory storage so we can upload buffer to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Upload buffer to Cloudinary
const uploadToCloudinary = (buffer, folder = 'smart-lost-found') => {
  return new Promise((resolve, reject) => {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'your_cloud_name') {
      return reject(new Error('Cloudinary not configured'));
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
};

// Fallback: Save to local public/uploads directory
const saveLocally = async (buffer, originalName) => {
  const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(originalName)}`;
  const uploadPath = path.join(__dirname, '../public/uploads', filename);
  
  if (!fs.existsSync(path.join(__dirname, '../public/uploads'))) {
    fs.mkdirSync(path.join(__dirname, '../public/uploads'), { recursive: true });
  }

  await fs.promises.writeFile(uploadPath, buffer);
  return {
    secure_url: `/uploads/${filename}`,
    public_id: filename
  };
};

module.exports = { upload, uploadToCloudinary, saveLocally };
