const express = require('express');
const { verifyDriver, applyForRoute, getAvailableRoutes, getDriverStatus } = require('../controller/driverController');
const authToken = require('../middleware/authToken');
const { uploadDriverDocuments } = require('../middleware/uploadMiddleware');

const router = express.Router();

// All driver routes require authentication
// verify route uses multer middleware for file uploads
router.post('/verify', authToken, uploadDriverDocuments, verifyDriver);
router.post('/apply-route', authToken, applyForRoute);
router.get('/routes', authToken, getAvailableRoutes);
router.get('/status', authToken, getDriverStatus);

module.exports = router;

