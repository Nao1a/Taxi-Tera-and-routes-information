const asyncHandler = require('express-async-handler');
const TaxiTera = require('../models/TaxiTeraModels');
const Route = require('../models/RouteModel');
const User = require('../models/UserModel');
const { refreshGraph } = require('./searchController');

// Teras
const listTeras = asyncHandler(async (req, res) => {
  const teras = await TaxiTera.find({}).sort({ name: 1 }).lean();
  res.json(teras);
});

const createTera = asyncHandler(async (req, res) => {
  const { name, lng, lat, address, notes, condition = 'good' } = req.body || {};
  if (!name) { res.status(400); throw new Error('name required'); }
  // Prevent duplicates (case-insensitive)
  const existing = await TaxiTera.findOne({ name })
    .collation({ locale: 'en', strength: 2 }) // case-insensitive match
    .lean();
  if (existing) {
    res.status(409);
    throw new Error('A tera with this name already exists');
  }
  const location = (lng != null && lat != null) ? { type: 'Point', coordinates: [Number(lng), Number(lat)] } : undefined;
  const doc = await TaxiTera.create({ name, location, address, notes, condition });
  await refreshGraph();
  res.status(201).json(doc);
});

const updateTera = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, lng, lat, address, notes, condition } = req.body || {};
  const tera = await TaxiTera.findById(id);
  if (!tera) { res.status(404); throw new Error('Tera not found'); }
  if (name != null) {
    const existing = await TaxiTera.findOne({ _id: { $ne: id }, name })
      .collation({ locale: 'en', strength: 2 })
      .lean();
    if (existing) { res.status(409); throw new Error('Another tera with this name already exists'); }
    tera.name = name;
  }
  if (address != null) tera.address = address;
  if (notes != null) tera.notes = notes;
  if (condition != null) tera.condition = condition;
  if (lng != null && lat != null) tera.location = { type: 'Point', coordinates: [Number(lng), Number(lat)] };
  await tera.save();
  await refreshGraph();
  res.json(tera);
});

const deleteTera = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tera = await TaxiTera.findById(id);
  if (!tera) { res.status(404); throw new Error('Tera not found'); }
  await tera.deleteOne();
  await refreshGraph();
  res.json({ message: 'Tera deleted' });
});

// Routes
const listRoutes = asyncHandler(async (req, res) => {
  const routes = await Route.find({}).populate('fromTera toTera', 'name').lean();
  res.json(routes);
});

const createRoute = asyncHandler(async (req, res) => {
  const { fromTera, toTera, fare, estimatedTimeMin, distance, roadCondition, availabilityMin } = req.body || {};
  if (!fromTera || !toTera) { res.status(400); throw new Error('fromTera and toTera required'); }
  const RouteModel = require('../models/RouteModel');
  const TaxiModel = require('../models/TaxiTeraModels');
  // Resolve by id or case-insensitive name
  const resolveByIdOrName = async (val) => {
    if (!val) return null;
    const s = String(val).trim();
    if (s.match(/^[a-f\d]{24}$/i)) {
      const byId = await TaxiModel.findById(s);
      if (byId) return byId;
    }
    return await TaxiModel.findOne({ name: s }).collation({ locale: 'en', strength: 2 });
  };
  const from = await resolveByIdOrName(fromTera);
  const to = await resolveByIdOrName(toTera);
  if (!from || !to) { res.status(400); throw new Error('fromTera/toTera not found'); }
  // Prevent duplicate route in either direction
  const dup = await RouteModel.findOne({
    $or: [
      { fromTera: from._id, toTera: to._id },
      { fromTera: to._id, toTera: from._id }
    ]
  }).lean();
  if (dup) {
    res.status(409);
    throw new Error('Route between these teras already exists');
  }
  let doc;
  try {
    doc = await RouteModel.create({ fromTera: from._id, toTera: to._id, fare, estimatedTimeMin, distance, roadCondition, availabilityMin, status: 'approved', createdBy: req.user?.id });
  } catch (e) {
    if (e && e.code === 11000) {
      res.status(409);
      throw new Error('Route between these teras already exists');
    }
    throw e;
  }
  await refreshGraph();
  res.status(201).json(doc);
});

const updateRoute = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { fare, estimatedTimeMin, distance, roadCondition, availabilityMin } = req.body || {};

  const route = await Route.findById(id);
  if (!route) { res.status(404); throw new Error('Route not found'); }

  // Build an update object only with provided fields to avoid full-document validation
  const update = {};
  if (fare != null && fare !== '') update.fare = Number(fare);
  if (estimatedTimeMin != null && estimatedTimeMin !== '') update.estimatedTimeMin = Number(estimatedTimeMin);
  if (distance != null && distance !== '') update.distance = Number(distance);
  if (roadCondition != null && roadCondition !== '') update.roadCondition = roadCondition;
  if (availabilityMin != null && availabilityMin !== '') update.availabilityMin = Number(availabilityMin);

  const updated = await Route.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true, runValidators: true, context: 'query' }
  ).lean();

  try {
    console.log(`[Admin] Route ${id} updated with`, update);
  } catch {}
  await refreshGraph();
  res.json(updated);
});

const deleteRoute = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const route = await Route.findById(id);
  if (!route) { res.status(404); throw new Error('Route not found'); }
  await route.deleteOne();
  await refreshGraph();
  res.json({ message: 'Route deleted' });
});

// Users: ban/unban
const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: { $ne: 'taxiDriver' } })
    .select('username email role isSubmissionBanned submissionBanReason isAccountBanned accountBanReason reputation createdAt')
    .sort({ createdAt: -1 })
    .lean();
  res.json(users);
});

const banUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body || {};
  const user = await User.findById(id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  if (user.role === 'admin') { res.status(403); throw new Error('Cannot ban an admin user'); }
  user.isSubmissionBanned = true;
  user.submissionBanReason = reason || 'Banned for spamming submissions';
  await user.save();
  res.json({ message: 'User banned from submissions' });
});

const unbanUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  user.isSubmissionBanned = false;
  user.submissionBanReason = undefined;
  await user.save();
  res.json({ message: 'User unbanned from submissions' });
});

// Account ban (complete ban from platform)
const banAccount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body || {};
  const user = await User.findById(id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  if (user.role === 'admin') { res.status(403); throw new Error('Cannot ban an admin user'); }
  user.isAccountBanned = true;
  user.accountBanReason = reason || 'Account banned by admin';
  user.accountBannedAt = new Date();
  await user.save();
  res.json({ message: 'User account banned' });
});

const unbanAccount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  user.isAccountBanned = false;
  user.accountBanReason = undefined;
  user.accountBannedAt = undefined;
  await user.save();
  res.json({ message: 'User account unbanned' });
});

// Change user role
const changeUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body || {};
  if (!role || !['user', 'moderator', 'admin', 'taxiDriver'].includes(role)) {
    res.status(400);
    throw new Error('Invalid role');
  }
  const user = await User.findById(id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  if (user.role === 'admin' && role !== 'admin') {
    res.status(403);
    throw new Error('Cannot change admin role');
  }
  user.role = role;
  await user.save();
  res.json({ message: 'User role updated', user });
});

// Analytics endpoint
const getAnalytics = asyncHandler(async (req, res) => {
  const UserSubmission = require('../models/UserSubmissionModel');
  
  // Get all data
  const users = await User.find({}).select('role isSubmissionBanned isAccountBanned createdAt').lean();
  const drivers = await User.find({ role: 'taxiDriver' })
    .select('driverDetails createdAt')
    .populate('driverDetails.currentRoute', 'fromTera toTera')
    .lean();
  const teras = await TaxiTera.find({}).select('condition createdAt').lean();
  const routes = await Route.find({}).select('roadCondition fare distance activeDriverCount createdAt')
    .populate('fromTera toTera', 'name')
    .lean();
  const submissions = await UserSubmission.find({}).select('status type createdAt submittedBy updatedAt').lean();

  // Calculate statistics
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // User stats
  const usersByRole = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});
  const bannedUsers = users.filter(u => u.isSubmissionBanned).length;
  const newUsersThisMonth = users.filter(u => new Date(u.createdAt) >= thirtyDaysAgo).length;
  const newUsersThisWeek = users.filter(u => new Date(u.createdAt) >= sevenDaysAgo).length;

  // Tera stats
  const terasByCondition = teras.reduce((acc, t) => {
    acc[t.condition] = (acc[t.condition] || 0) + 1;
    return acc;
  }, {});
  const newTerasThisMonth = teras.filter(t => new Date(t.createdAt) >= thirtyDaysAgo).length;

  // Route stats
  const routesByCondition = routes.reduce((acc, r) => {
    acc[r.roadCondition] = (acc[r.roadCondition] || 0) + 1;
    return acc;
  }, {});
  const totalFareSum = routes.reduce((sum, r) => sum + (r.fare || 0), 0);
  const avgFare = routes.length ? (totalFareSum / routes.length).toFixed(2) : 0;
  const totalDistance = routes.reduce((sum, r) => sum + (r.distance || 0), 0);
  const newRoutesThisMonth = routes.filter(r => new Date(r.createdAt) >= thirtyDaysAgo).length;

  // Submission stats
  const submissionsByStatus = submissions.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});
  const submissionsByType = submissions.reduce((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1;
    return acc;
  }, {});
  const pendingSubmissions = submissions.filter(s => s.status === 'pending').length;
  const approvalRate = submissions.length ? 
    ((submissions.filter(s => s.status === 'approved').length / submissions.length) * 100).toFixed(1) : 0;
  const newSubmissionsThisWeek = submissions.filter(s => new Date(s.createdAt) >= sevenDaysAgo).length;

  // Driver stats
  const driversByStatus = drivers.reduce((acc, d) => {
    const status = d.driverDetails?.verificationStatus || 'unverified';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  
  const driversWithRoute = drivers.filter(d => d.driverDetails?.currentRoute).length;
  const driversWithoutRoute = drivers.length - driversWithRoute;
  
  // Calculate average months served
  let totalMonths = 0;
  let driversWithMonths = 0;
  drivers.forEach(d => {
    if (d.driverDetails?.routeAssignedDate) {
      const assignedDate = new Date(d.driverDetails.routeAssignedDate);
      const now = new Date();
      const diffTime = Math.abs(now - assignedDate);
      const months = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));
      totalMonths += months;
      driversWithMonths++;
    }
  });
  const avgMonthsServed = driversWithMonths > 0 ? (totalMonths / driversWithMonths).toFixed(1) : 0;

  // Routes with no drivers
  const routesWithNoDrivers = routes.filter(r => !r.activeDriverCount || r.activeDriverCount === 0).length;

  // Drivers by route
  const driversByRoute = {};
  routes.forEach(route => {
    const routeName = `${route.fromTera?.name || 'Unknown'} → ${route.toTera?.name || 'Unknown'}`;
    driversByRoute[routeName] = route.activeDriverCount || 0;
  });

  // Submission trends (last 30 days)
  const submissionTrends = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const count = submissions.filter(s => {
      const subDate = new Date(s.createdAt).toISOString().split('T')[0];
      return subDate === dateStr;
    }).length;
    submissionTrends.push({ date: dateStr, count });
  }

  // Calculate average processing time (for approved/rejected submissions)
  let totalProcessingTime = 0;
  let processedCount = 0;
  submissions.forEach(s => {
    if (s.status !== 'pending' && s.updatedAt && s.createdAt) {
      const processingTime = new Date(s.updatedAt) - new Date(s.createdAt);
      totalProcessingTime += processingTime;
      processedCount++;
    }
  });
  const avgProcessingTimeHours = processedCount > 0 
    ? (totalProcessingTime / processedCount / (1000 * 60 * 60)).toFixed(1) 
    : 0;

  // Approval rate by type
  const approvalRateByType = {};
  ['newTera', 'newRoute', 'fareUpdate', 'conditionUpdate', 'driver_verification', 'route_application'].forEach(type => {
    const typeSubs = submissions.filter(s => s.type === type);
    if (typeSubs.length > 0) {
      const approved = typeSubs.filter(s => s.status === 'approved').length;
      approvalRateByType[type] = ((approved / typeSubs.length) * 100).toFixed(1);
    }
  });

  // Routes by fare range
  const fareRanges = {
    '0-50': 0,
    '51-100': 0,
    '101-200': 0,
    '201+': 0
  };
  routes.forEach(route => {
    const fare = route.fare || 0;
    if (fare <= 50) fareRanges['0-50']++;
    else if (fare <= 100) fareRanges['51-100']++;
    else if (fare <= 200) fareRanges['101-200']++;
    else fareRanges['201+']++;
  });

  // Most requested routes (from route_application submissions)
  const routeRequests = {};
  submissions.filter(s => s.type === 'route_application').forEach(s => {
    const routeId = s.payload?.targetRouteId;
    if (routeId) {
      // Convert to string to ensure consistent comparison
      const routeIdStr = routeId.toString ? routeId.toString() : String(routeId);
      routeRequests[routeIdStr] = (routeRequests[routeIdStr] || 0) + 1;
    }
  });
  const mostRequestedRoutes = Object.entries(routeRequests)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([routeId, count]) => {
      const route = routes.find(r => r._id.toString() === routeId);
      return {
        routeId,
        name: route ? `${route.fromTera?.name || 'Unknown'} → ${route.toTera?.name || 'Unknown'}` : 'Unknown',
        count
      };
    });

  // User growth trend (last 30 days)
  const userGrowthTrend = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const count = users.filter(u => {
      const userDate = new Date(u.createdAt).toISOString().split('T')[0];
      return userDate === dateStr;
    }).length;
    userGrowthTrend.push({ date: dateStr, count });
  }

  // Recent activity (last 20 submissions)
  const recentSubmissions = await UserSubmission.find({})
    .populate('submittedBy', 'username')
    .sort({ createdAt: -1 })
    .limit(20)
    .select('type status createdAt submittedBy')
    .lean();

  res.json({
    totals: {
      users: users.length,
      drivers: drivers.length,
      teras: teras.length,
      routes: routes.length,
      submissions: submissions.length
    },
    users: {
      byRole: usersByRole,
      banned: bannedUsers,
      accountBanned: users.filter(u => u.isAccountBanned).length,
      newThisMonth: newUsersThisMonth,
      newThisWeek: newUsersThisWeek,
      growthTrend: userGrowthTrend
    },
    drivers: {
      byStatus: driversByStatus,
      withRoute: driversWithRoute,
      withoutRoute: driversWithoutRoute,
      avgMonthsServed,
      byRoute: driversByRoute
    },
    teras: {
      byCondition: terasByCondition,
      newThisMonth: newTerasThisMonth
    },
    routes: {
      byCondition: routesByCondition,
      avgFare,
      totalDistance,
      newThisMonth: newRoutesThisMonth,
      withNoDrivers: routesWithNoDrivers,
      byFareRange: fareRanges,
      mostRequested: mostRequestedRoutes
    },
    submissions: {
      byStatus: submissionsByStatus,
      byType: submissionsByType,
      pending: pendingSubmissions,
      approvalRate,
      approvalRateByType,
      newThisWeek: newSubmissionsThisWeek,
      avgProcessingTimeHours,
      trends: submissionTrends
    },
    recentActivity: recentSubmissions
  });
});

module.exports = {
  listTeras, createTera, updateTera, deleteTera,
  listRoutes, createRoute, updateRoute, deleteRoute,
  listUsers, banUser, unbanUser, banAccount, unbanAccount, changeUserRole,
  getAnalytics
};
