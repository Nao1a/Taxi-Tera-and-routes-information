const express = require('express');
const router = express.Router();
const validateToken = require('../middleware/authToken');
const { uploadCarDoc } = require('../middleware/uploadMiddleware');
const {  
  registerCar, 
  getMyCars, 
  getOwnerApplications,
  updateApplicationStatus,
  toggleCarStatus,
  updateCar,
  deleteCar
} = require('../controller/ownerController');

// All routes are protected
// verifyToken is a middleware function that must be defined
router.use(validateToken);

router.post('/cars', uploadCarDoc, registerCar);
router.get('/cars', getMyCars);
router.put('/cars/:id/status', toggleCarStatus);
router.put('/cars/:id', uploadCarDoc, updateCar);
router.delete('/cars/:id', deleteCar);
router.get('/applications', getOwnerApplications);
router.put('/applications/:id/status', updateApplicationStatus);

module.exports = router;