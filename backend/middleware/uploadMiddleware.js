const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'taxi-driver-documents',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
  },
});

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'), false);
    }
  },
});

// Middleware for uploading license and car photos
const uploadDriverDocuments = upload.fields([
  { name: 'licensePhoto', maxCount: 1 },
  { name: 'carPhoto', maxCount: 1 },
]);

const uploadLicense = upload.single('licenseFile');
const uploadIdentity = upload.single('idFile');
const uploadCarDoc = upload.single('ownershipDoc');

module.exports = {
  uploadDriverDocuments,
  uploadLicense,
  uploadIdentity,
  uploadCarDoc,
  upload,
  cloudinary,
};

