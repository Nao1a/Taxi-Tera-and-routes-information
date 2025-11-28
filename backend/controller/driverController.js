const asyncHandler = require('express-async-handler');
const User = require('../models/UserModel');
const UserSubmission = require('../models/UserSubmissionModel');
const Route = require('../models/RouteModel');

// POST /api/driver/verify
// Uploads driver documents and creates verification submission
// Note: This controller is called AFTER uploadDriverDocuments middleware processes files
const verifyDriver = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401);
    throw new Error('Unauthorized');
  }

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.role !== 'taxiDriver') {
    res.status(403);
    throw new Error('Only taxi drivers can submit verification documents');
  }

  if (!user.driverDetails) {
    res.status(400);
    throw new Error('Driver details not found. Please complete signup as driver first.');
  }

  const files = req.files;
  if (!files || !files.licensePhoto || !files.carPhoto) {
    res.status(400);
    throw new Error('Both license photo and car photo are required');
  }

  const licensePhotoUrl = files.licensePhoto[0].path;
  const carPhotoUrl = files.carPhoto[0].path;

  // Update user documents
  user.driverDetails.documents.licensePhoto = licensePhotoUrl;
  user.driverDetails.documents.carPhoto = carPhotoUrl;
  user.driverDetails.verificationStatus = 'pending';
  await user.save();

  // Create verification submission
  const submission = await UserSubmission.create({
    type: 'driver_verification',
    payload: {
      licensePhoto: licensePhotoUrl,
      carPhoto: carPhotoUrl,
      licenseText: user.driverDetails.licenseText,
      carPlate: user.driverDetails.carPlate,
      carType: user.driverDetails.carType
    },
    submittedBy: userId,
    status: 'pending'
  });

  res.status(201).json({
    message: 'Verification documents submitted successfully',
    submission,
    user: {
      verificationStatus: user.driverDetails.verificationStatus
    }
  });
});

// POST /api/driver/apply-route
// Apply for a route assignment
const applyForRoute = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { targetRouteId, reason } = req.body;

  if (!userId) {
    res.status(401);
    throw new Error('Unauthorized');
  }

  if (!targetRouteId) {
    res.status(400);
    throw new Error('targetRouteId is required');
  }

  const user = await User.findById(userId).populate('driverDetails.currentRoute');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.role !== 'taxiDriver') {
    res.status(403);
    throw new Error('Only taxi drivers can apply for routes');
  }

  if (user.driverDetails?.verificationStatus !== 'verified') {
    res.status(403);
    throw new Error('You must be verified as a driver before applying for routes');
  }

  // Check if route exists
  const targetRoute = await Route.findById(targetRouteId);
  if (!targetRoute) {
    res.status(404);
    throw new Error('Target route not found');
  }

  if (targetRoute.status !== 'approved') {
    res.status(400);
    throw new Error('Can only apply for approved routes');
  }

  // Calculate months served if user has a current route
  let monthsServed = 0;
  const currentRouteId = user.driverDetails?.currentRoute?._id || user.driverDetails?.currentRoute;
  
  if (currentRouteId) {
    const routeAssignedDate = user.driverDetails.routeAssignedDate;
    if (routeAssignedDate) {
      const now = new Date();
      const diffTime = Math.abs(now - routeAssignedDate);
      monthsServed = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30)); // Approximate months
    }
  }

  // Create route application submission
  const submission = await UserSubmission.create({
    type: 'route_application',
    payload: {
      targetRouteId,
      currentRouteId: currentRouteId || null,
      monthsServed,
      reason: reason || ''
    },
    submittedBy: userId,
    status: 'pending'
  });

  res.status(201).json({
    message: 'Route application submitted successfully',
    submission,
    monthsServed
  });
});

// GET /api/driver/routes
// Get all available routes for application
const getAvailableRoutes = asyncHandler(async (req, res) => {
  const routes = await Route.find({ status: 'approved' })
    .populate('fromTera', 'name')
    .populate('toTera', 'name')
    .select('fromTera toTera fare activeDriverCount')
    .lean();

  // Format routes for display
  const formattedRoutes = routes.map(route => ({
    _id: route._id,
    name: `${route.fromTera.name} → ${route.toTera.name}`,
    fare: route.fare,
    activeDriverCount: route.activeDriverCount || 0
  }));

  res.json(formattedRoutes);
});

// GET /api/driver/status
// Get current driver status
const getDriverStatus = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401);
    throw new Error('Unauthorized');
  }

  const user = await User.findById(userId)
    .populate({
      path: 'driverDetails.currentRoute',
      populate: [
        { path: 'fromTera', select: 'name' },
        { path: 'toTera', select: 'name' }
      ]
    })
    .select('role driverDetails')
    .lean();

  if (!user || user.role !== 'taxiDriver') {
    res.status(403);
    throw new Error('User is not a taxi driver');
  }

  // Format route name if route exists
  if (user.driverDetails?.currentRoute) {
    const route = user.driverDetails.currentRoute;
    route.name = `${route.fromTera?.name || ''} → ${route.toTera?.name || ''}`;
  }

  res.json({
    role: user.role,
    driverDetails: user.driverDetails
  });
});

module.exports = {
  verifyDriver,
  applyForRoute,
  getAvailableRoutes,
  getDriverStatus
};

