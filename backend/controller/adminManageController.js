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
  const users = await User.find({}).select('username email role isSubmissionBanned submissionBanReason createdAt').sort({ createdAt: -1 }).lean();
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

module.exports = {
  listTeras, createTera, updateTera, deleteTera,
  listRoutes, createRoute, updateRoute, deleteRoute,
  listUsers, banUser, unbanUser
};
