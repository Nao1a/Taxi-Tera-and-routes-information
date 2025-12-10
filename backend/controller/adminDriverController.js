const asyncHandler = require('express-async-handler');
const User = require('../models/UserModel');
const Route = require('../models/RouteModel');
const mongoose = require('mongoose');

// GET /api/admin/drivers - List all drivers
const listDrivers = asyncHandler(async (req, res) => {
  const drivers = await User.find({ role: 'taxiDriver' })
    .select('username email role driverDetails reputation isAccountBanned accountBanReason createdAt')
    .populate({
      path: 'driverDetails.currentRoute',
      select: 'fromTera toTera fare',
      populate: [
        { path: 'fromTera', select: 'name' },
        { path: 'toTera', select: 'name' }
      ]
    })
    .sort({ createdAt: -1 })
    .lean();

  // Calculate months served for each driver
  const driversWithMonths = drivers.map(driver => {
    let monthsServed = 0;
    if (driver.driverDetails?.routeAssignedDate) {
      const assignedDate = new Date(driver.driverDetails.routeAssignedDate);
      const now = new Date();
      const diffTime = Math.abs(now - assignedDate);
      monthsServed = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));
    }
    return { ...driver, monthsServed };
  });

  res.json(driversWithMonths);
});

// POST /api/admin/drivers/:id/verify - Manually verify driver
const verifyDriver = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    res.status(404);
    throw new Error('Driver not found');
  }
  if (user.role !== 'taxiDriver') {
    res.status(400);
    throw new Error('User is not a taxi driver');
  }
  user.driverDetails.verificationStatus = 'verified';
  await user.save();
  res.json({ message: 'Driver verified', user });
});

// POST /api/admin/drivers/:id/reject-verification - Reject driver verification
const rejectDriverVerification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    res.status(404);
    throw new Error('Driver not found');
  }
  if (user.role !== 'taxiDriver') {
    res.status(400);
    throw new Error('User is not a taxi driver');
  }
  user.driverDetails.verificationStatus = 'rejected';
  await user.save();
  res.json({ message: 'Driver verification rejected', user });
});

// POST /api/admin/drivers/:id/ban-from-route - Ban driver from working on route
const banFromRoute = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason, removeFromRoute } = req.body || {};
  const user = await User.findById(id);
  if (!user) {
    res.status(404);
    throw new Error('Driver not found');
  }
  if (user.role !== 'taxiDriver') {
    res.status(400);
    throw new Error('User is not a taxi driver');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    user.driverDetails.isBannedFromRoute = true;
    user.driverDetails.routeBanReason = reason || 'Banned from route by admin';

    if (removeFromRoute && user.driverDetails.currentRoute) {
      const currentRouteId = user.driverDetails.currentRoute;
      const currentRoute = await Route.findById(currentRouteId).session(session);
      if (currentRoute) {
        await Route.updateOne(
          { _id: currentRouteId },
          { $set: { activeDriverCount: Math.max(0, (currentRoute.activeDriverCount || 0) - 1) } },
          { session }
        );
      }
      user.driverDetails.currentRoute = null;
      user.driverDetails.routeAssignedDate = null;
    }

    await user.save({ session });
    await session.commitTransaction();
    res.json({ message: 'Driver banned from route', user });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

// POST /api/admin/drivers/:id/unban-from-route - Unban driver from route
const unbanFromRoute = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    res.status(404);
    throw new Error('Driver not found');
  }
  if (user.role !== 'taxiDriver') {
    res.status(400);
    throw new Error('User is not a taxi driver');
  }
  user.driverDetails.isBannedFromRoute = false;
  user.driverDetails.routeBanReason = undefined;
  await user.save();
  res.json({ message: 'Driver unbanned from route', user });
});

// POST /api/admin/drivers/:id/force-remove-route - Force remove driver from route
const forceRemoveFromRoute = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    res.status(404);
    throw new Error('Driver not found');
  }
  if (user.role !== 'taxiDriver') {
    res.status(400);
    throw new Error('User is not a taxi driver');
  }

  // Early return if driver has no current route - no transaction needed
  if (!user.driverDetails?.currentRoute) {
    return res.json({ message: 'Driver has no current route', user });
  }

  // Only start transaction if driver actually has a route to remove
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const currentRouteId = user.driverDetails.currentRoute;
    const currentRoute = await Route.findById(currentRouteId).session(session);
    if (currentRoute) {
      await Route.updateOne(
        { _id: currentRouteId },
        { $set: { activeDriverCount: Math.max(0, (currentRoute.activeDriverCount || 0) - 1) } },
        { session }
      );
    }
    user.driverDetails.currentRoute = null;
    user.driverDetails.routeAssignedDate = null;
    await user.save({ session });
    await session.commitTransaction();
    res.json({ message: 'Driver removed from route', user });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

// POST /api/admin/drivers/:id/assign-route - Manually assign driver to route
const assignRoute = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { routeId } = req.body || {};
  if (!routeId) {
    res.status(400);
    throw new Error('routeId is required');
  }

  const user = await User.findById(id);
  if (!user) {
    res.status(404);
    throw new Error('Driver not found');
  }
  if (user.role !== 'taxiDriver') {
    res.status(400);
    throw new Error('User is not a taxi driver');
  }
  if (user.driverDetails?.verificationStatus !== 'verified') {
    res.status(400);
    throw new Error('Driver must be verified before route assignment');
  }
  if (user.driverDetails?.isBannedFromRoute) {
    res.status(403);
    throw new Error('Driver is banned from routes and cannot be assigned to a route');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const targetRoute = await Route.findById(routeId).session(session);
    if (!targetRoute) {
      res.status(404);
      throw new Error('Target route not found');
    }
    if (targetRoute.status !== 'approved') {
      res.status(400);
      throw new Error('Can only assign approved routes');
    }

    // If user has a current route, decrement its activeDriverCount
    const currentRouteId = user.driverDetails?.currentRoute;
    if (currentRouteId) {
      const currentRoute = await Route.findById(currentRouteId).session(session);
      if (currentRoute) {
        await Route.updateOne(
          { _id: currentRouteId },
          { $set: { activeDriverCount: Math.max(0, (currentRoute.activeDriverCount || 0) - 1) } },
          { session }
        );
      }
    }

    // Increment target route's activeDriverCount
    await Route.updateOne(
      { _id: routeId },
      { $inc: { activeDriverCount: 1 } },
      { session }
    );

    // Update user's current route
    user.driverDetails.currentRoute = targetRoute._id;
    user.driverDetails.routeAssignedDate = new Date();
    await user.save({ session });
    await session.commitTransaction();

    const updatedRoute = await Route.findById(routeId);
    res.json({
      message: 'Driver assigned to route',
      user: { id: user._id, currentRoute: user.driverDetails.currentRoute },
      route: { id: updatedRoute._id, activeDriverCount: updatedRoute.activeDriverCount }
    });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

module.exports = {
  listDrivers,
  verifyDriver,
  rejectDriverVerification,
  banFromRoute,
  unbanFromRoute,
  forceRemoveFromRoute,
  assignRoute
};

