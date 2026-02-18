const asyncHandler = require('express-async-handler');
const Car = require('../models/CarModel');
const HireRequest = require('../models/HireRequestModel');
const Message = require('../models/MessageModel');
const User = require('../models/UserModel');

// @desc    Get all available cars
// @route   GET /api/hire/jobs
// @access  Private (Driver)
const getAvailableJobs = asyncHandler(async (req, res) => {
  const cars = await Car.find({ 
    status: 'available',
    isVerified: true
  })
  .populate('ownerId', 'username email')
  .populate({
    path: 'routeId',
    populate: { path: 'fromTera toTera', select: 'name' }
  });

  // Find cars this driver has arguably applied for
  const myApplications = await HireRequest.find({
    driverId: req.user.id,
    status: { $in: ['applied', 'chatting', 'hired', 'rejected'] }
  }).select('carId status');

  const appliedCarIds = new Set(myApplications.map(app => app.carId.toString()));

  const carsWithStatus = cars.map(car => {
    const carObj = car.toObject();
    const application = myApplications.find(app => app.carId.toString() === car._id.toString());
    return {
      ...carObj,
      hasApplied: appliedCarIds.has(car._id.toString()),
      applicationStatus: application ? application.status : null
    };
  });
  
  res.json(carsWithStatus);
});

// @desc    Apply for a car
// @route   POST /api/hire/apply
// @access  Private (Driver)
const applyForJob = asyncHandler(async (req, res) => {
  const { carId, proposedGebi, experienceYears, notes } = req.body;

  // Check if verified (Refresh from DB)
  const user = await User.findById(req.user.id);
  if (!user || user.kycStatus !== 'verified') {
    res.status(403);
    throw new Error('You must be verified to apply');
  }

  const car = await Car.findById(carId);
  if (!car || car.status !== 'available') {
    res.status(404);
    throw new Error('Car not available');
  }

  // Check if already applied
  const existing = await HireRequest.findOne({ 
    carId, 
    driverId: req.user.id, 
    status: { $in: ['applied', 'chatting', 'hired'] } 
  });
  
  if (existing) {
    res.status(400);
    throw new Error('You have already applied');
  }

  const initialOffer = proposedGebi || car.gebiAmount;

  const request = await HireRequest.create({
    carId,
    driverId: req.user.id,
    ownerId: car.ownerId,
    proposedGebi: initialOffer,
    experienceYears: experienceYears ? Number(experienceYears) : undefined,
    notes,
    offerHistory: [{ amount: initialOffer, by: 'driver' }],
    status: 'applied'
  });

  res.status(201).json(request);
}); 

// @desc    Make/Update an offer (Haggle)
// @route   POST /api/hire/requests/:id/offer
// @access  Private (Driver or Owner)
const makeOffer = asyncHandler(async (req, res) => {
    const { amount } = req.body;
    const request = await HireRequest.findById(req.params.id);

    if (!request) {
        res.status(404);
        throw new Error('Request not found');
    }

    // Verify participant
    if (request.driverId.toString() !== req.user.id && request.ownerId.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized');
    }

    if (request.status === 'hired' || request.status === 'rejected' || request.status === 'ended') {
        res.status(400);
        throw new Error('Cannot optimize offer for closed request');
    }

    const role = request.ownerId.toString() === req.user.id ? 'owner' : 'driver';

    request.proposedGebi = Number(amount);
    request.offerHistory.push({
        amount: Number(amount),
        by: role
    });

    // If waiting for application, moving into chatting phase
    if (request.status === 'applied') {
        request.status = 'chatting';
    }

    await request.save();

    // Create system message
    await Message.create({
        hireRequestId: request._id,
        senderId: req.user.id,
        content: `PROPOSAL_UPDATE:${amount}`, // Special format or just text
        isSystemMessage: true // Add to model if not exist, or handle in frontend
    });

    res.json(request);
});

// @desc    Get my applications (Driver)
// @route   GET /api/hire/my-applications
// @access  Private (Driver)
const getMyApplications = asyncHandler(async (req, res) => {
  const apps = await HireRequest.find({ driverId: req.user.id })
    .populate('carId')
    .populate('ownerId', 'username email')
    .sort({ createdAt: -1 });
  res.json(apps);
});

// @desc    Get Chat History
// @route   GET /api/hire/requests/:id/messages
// @access  Private
const getChatMessages = asyncHandler(async (req, res) => {
  // Mark incoming messages as read
  await Message.updateMany(
    { 
      hireRequestId: req.params.id, 
      senderId: { $ne: req.user.id },
      isRead: false
    },
    { $set: { isRead: true } }
  );

  const messages = await Message.find({ hireRequestId: req.params.id })
    .populate('senderId', 'username role')
    .sort({ createdAt: 1 });
  res.json(messages);
});

// @desc    Get unread message count
// @route   GET /api/hire/unread-count
// @access  Private
const getUnreadMessageCount = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Find all hire requests where user is involved
  const requests = await HireRequest.find({
    $or: [{ driverId: userId }, { ownerId: userId }]
  }).select('_id');

  const requestIds = requests.map(r => r._id);

  // Count messages in these requests where sender != user AND isRead is false
  const count = await Message.countDocuments({
    hireRequestId: { $in: requestIds },
    senderId: { $ne: userId },
    isRead: false
  });

  res.json({ count });
});

// @desc    Send Message
// @route   POST /api/hire/requests/:id/messages
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const message = await Message.create({
    hireRequestId: req.params.id,
    senderId: req.user.id,
    content
  });
  
  // Update status to 'chatting' ONLY if it is currently 'applied'
  let hireRequest = await HireRequest.findById(req.params.id);
  
  // Ensure we don't revert status if already hired
  if (hireRequest.status === 'applied') {
    hireRequest.status = 'chatting';
    await hireRequest.save();
  }

  const populated = await Message.findById(message._id).populate('senderId', 'username role');

  // Notify the recipient via socket
  const recipientId = hireRequest.driverId.toString() === req.user.id 
    ? hireRequest.ownerId.toString() 
    : hireRequest.driverId.toString();
  
  const io = req.app.get('io');
  if (io) {
      io.to(recipientId).emit('new_message', {
          count: 1 // Just a trigger to refetch count
      });
  }

  res.status(201).json(populated);
});

module.exports = {
  getAvailableJobs,
  applyForJob,
  makeOffer,
  getMyApplications,
  getChatMessages,
  sendMessage,
  getUnreadMessageCount
};
