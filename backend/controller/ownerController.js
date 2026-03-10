const asyncHandler = require('express-async-handler');
const Car = require('../models/CarModel');
const HireRequest = require('../models/HireRequestModel');
const Route = require('../models/RouteModel');
const User = require('../models/UserModel');

// @desc    Register a new car
// @route   POST /api/owner/cars
// @access  Private (Owner)
const registerCar = asyncHandler(async (req, res) => {
  const { make, model, plateNumber, gebiAmount, paymentFrequency, conditions } = req.body;
  
  const user = await User.findById(req.user.id);
  if (!user || user.kycStatus !== 'verified') {
     res.status(403);
     throw new Error('You must verify your account (KYC) before registering a car.');
  }

  if (!req.file) {
    res.status(400);
    throw new Error('Ownership document (Libre) is required');
  }

  const ownershipDocImage = req.file.path;

  const car = await Car.create({
    ownerId: req.user.id,
    make,
    model,
    plateNumber,
    libreImage: ownershipDocImage,
    gebiAmount: Number(gebiAmount),
    paymentFrequency,
    conditions,
    status: 'pending' // Default to pending until Admin verifies Libre
  });

  res.status(201).json(car);
});

// @desc    Get logged in owner's cars
// @route   GET /api/owner/cars
// @access  Private (Owner)
const getMyCars = asyncHandler(async (req, res) => {
  const cars = await Car.find({ ownerId: req.user.id })
    .populate({
      path: 'routeId',
      populate: { path: 'fromTera toTera', select: 'name' }
    })
    .sort({ createdAt: -1 });
  res.json(cars);
});

// @desc    Get applications for my cars
// @route   GET /api/owner/applications
// @access  Private (Owner)
const getOwnerApplications = asyncHandler(async (req, res) => {
  // Find all cars owned by user
  const myCars = await Car.find({ ownerId: req.user.id }).select('_id status');
  const carIds = myCars.map(c => c._id);
  
  const applications = await HireRequest.find({
    carId: { $in: carIds }
  })
    .populate('driverId', 'username email driverProfile') 
    .populate('carId', 'make model plateNumber status')
    .sort({ createdAt: -1 });

  // Intelligent Filtering in JS
  const filteredApplications = [];
  const appsByCar = {};

  // Group by Car
  applications.forEach(app => {
    const cId = app.carId._id.toString();
    if (!appsByCar[cId]) appsByCar[cId] = [];
    appsByCar[cId].push(app);
  });

  // Process logic per car
  for (const carId in appsByCar) {
    const carApps = appsByCar[carId];
    if (!carApps.length) continue;

    const carStatus = carApps[0].carId.status; // All generic to same car

    if (carStatus === 'available') {
      // Show all active applications, maybe hide old rejected ones to keep it clean?
      // User said "owner only application for a car listed now should be there"
      // Let's show everything except 'rejected' to keep it focused, unless 'rejected' is the ONLY thing?
      // Let's show everything for available cars so they can haggle/reject.
      // Maybe filter out 'ended'?
      carApps.forEach(app => filteredApplications.push(app));
    } else if (carStatus === 'hired') {
      // Car is hired. Check if we have the 'hired' contract.
      const hiredApp = carApps.find(a => a.status === 'hired');
      
      if (hiredApp) {
        // Ideal state: Show ONLY the hired driver.
        filteredApplications.push(hiredApp);
      } else {
        // CORRUPTION/RECOVERY STATE:
        // Car is marked 'hired', but no application is 'hired'.
        // Show all 'chatting'/'applied' apps so the user can finish the process.
        carApps.forEach(app => {
          if (app.status !== 'rejected') filteredApplications.push(app);
        });
      }
    } else {
      // Maintenance/other? Show all.
      carApps.forEach(app => filteredApplications.push(app));
    }
  }

  // Sort again as they might be shuffled
  filteredApplications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json(filteredApplications);
});

// @desc    Update application status (Hire/Reject)
// @route   PUT /api/owner/applications/:id/status
// @access  Private (Owner)
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body; // 'hired', 'rejected'
  const application = await HireRequest.findById(req.params.id);

  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }

  if (application.ownerId.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Not authorized');
  }

  // If hiring, update car AND reject others
  if (status === 'hired') {
    const car = await Car.findById(application.carId);
    if (!car) throw new Error('Car not found');
    
    // 1. Update Car
    car.status = 'hired';
    await car.save();
    
    // 2. Reject all OTHER applications for this car
    await HireRequest.updateMany(
      { 
        carId: application.carId, 
        _id: { $ne: application._id },
        status: { $in: ['applied', 'chatting'] }
      },
      { status: 'rejected' }
    );
  }

  // 3. Update THIS application
  application.status = status;
  await application.save();

  res.json(application);
});

// @desc    Toggle car status (Available <-> Maintenance)
// @route   PUT /api/owner/cars/:id/status
// @access  Private (Owner)
const toggleCarStatus = asyncHandler(async (req, res) => {
    const car = await Car.findOne({ _id: req.params.id, ownerId: req.user.id });
    
    if (!car) {
        res.status(404);
        throw new Error('Car not found');
    }

    if (car.status === 'pending' || car.status === 'rejected') {
         res.status(400);
         throw new Error(`Cannot change status of ${car.status} car.`);
    }

    if (car.status === 'hired') {
         res.status(400);
         throw new Error('Car is currently hired.');
    }

    // Toggle
    car.status = car.status === 'available' ? 'maintenance' : 'available';
    await car.save();
    res.json(car);
});

// @desc    Update car details (for corrections/re-application)
// @route   PUT /api/owner/cars/:id
// @access  Private (Owner)
const updateCar = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { make, model, plateNumber, gebiAmount, paymentFrequency, conditions } = req.body;

    const car = await Car.findById(id);

    if (!car) {
        res.status(404);
        throw new Error('Car not found');
    }

    if (car.ownerId.toString() !== req.user.id) {
        res.status(401);
        throw new Error('Not authorized');
    }

    // Update fields
    car.make = make || car.make;
    car.model = model || car.model;
    car.plateNumber = plateNumber || car.plateNumber;
    car.gebiAmount = gebiAmount ? Number(gebiAmount) : car.gebiAmount;
    car.paymentFrequency = paymentFrequency || car.paymentFrequency;
    car.conditions = conditions || car.conditions;

    if (req.file) {
        car.libreImage = req.file.path;
    }

    // If it was rejected, reset to pending for re-review
    if (car.status === 'rejected') {
        car.status = 'pending';
        car.rejectionReason = undefined; // Clear reason
    }

    await car.save();
    res.json(car);
});

// @desc    Remove (delete) a car. Ends any hire for that car and updates route count.
// @route   DELETE /api/owner/cars/:id
// @access  Private (Owner)
const deleteCar = asyncHandler(async (req, res) => {
  const car = await Car.findOne({ _id: req.params.id, ownerId: req.user.id });

  if (!car) {
    res.status(404);
    throw new Error('Car not found');
  }

  // 1. End all hire requests for this car so the driver no longer has this as activeJob
  await HireRequest.updateMany(
    { carId: car._id },
    { status: 'ended' }
  );

  // 2. If car was on a route, decrement that route's activeDriverCount
  if (car.routeId) {
    await Route.updateOne(
      { _id: car.routeId },
      { $inc: { activeDriverCount: -1 } }
    );
  }

  // 3. Delete the car
  await Car.findByIdAndDelete(car._id);

  res.json({ message: 'Car removed successfully' });
});

module.exports = {
  registerCar,
  getMyCars,
  getOwnerApplications,
  updateApplicationStatus,
  toggleCarStatus,
  updateCar,
  deleteCar
};
