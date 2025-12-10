const asyncHandler = require('express-async-handler');
const UserSubmission = require('../models/UserSubmissionModel');
const TaxiTera = require('../models/TaxiTeraModels');
const Route = require('../models/RouteModel');
const User = require('../models/UserModel');
const mongoose = require('mongoose');
const { refreshGraph } = require('./searchController');

// GET /api/admin/submissions?status=pending|approved|rejected&type=newTera|newRoute|...
const getAllSubmissions = asyncHandler(async (req, res) => {
  const { status, type } = req.query;
  const filter = {};
  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    filter.status = status;
  }
  if (type && ['newTera', 'newRoute', 'fareUpdate', 'conditionUpdate', 'driver_verification', 'route_application'].includes(type)) {
    filter.type = type;
  }
  const items = await UserSubmission.find(filter)
    .populate('submittedBy', 'username email role')
    .sort({ createdAt: -1 })
    .lean();
  
  // Populate route details for route_application submissions
  for (const item of items) {
    if (item.type === 'route_application' && item.payload?.targetRouteId) {
      const route = await Route.findById(item.payload.targetRouteId)
        .populate('fromTera', 'name')
        .populate('toTera', 'name')
        .select('fromTera toTera fare activeDriverCount')
        .lean();
      if (route) {
        item.payload.targetRoute = {
          _id: route._id,
          name: `${route.fromTera.name} → ${route.toTera.name}`,
          fare: route.fare,
          activeDriverCount: route.activeDriverCount || 0
        };
      }
      if (item.payload?.currentRouteId) {
        const currentRoute = await Route.findById(item.payload.currentRouteId)
          .populate('fromTera', 'name')
          .populate('toTera', 'name')
          .select('fromTera toTera')
          .lean();
        if (currentRoute) {
          item.payload.currentRoute = {
            _id: currentRoute._id,
            name: `${currentRoute.fromTera.name} → ${currentRoute.toTera.name}`
          };
        }
      }
    }
  }
  
  res.json(items);
});

// PATCH /api/admin/submissions/:id/approve
const approveSubmission = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { adminNotes } = req.body || {};
  const sub = await UserSubmission.findById(id);
  if (!sub) {
    res.status(404);
    throw new Error('Submission not found');
  }
  if (sub.status === 'approved') return res.json(sub);

  const payload = sub.payload || {};

  // helper: resolve tera (string can be ID or name)
  const normalize = (x) => String(x || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '');
  const getSuggestions = async (needle) => {
    const normNeedle = normalize(needle);
    const all = await TaxiTera.find({}).select('name').lean();
    const ranked = all.map(t => ({ t, n: normalize(t.name) }))
      .filter(x => x.n.includes(normNeedle) || normNeedle.includes(x.n))
      .slice(0, 5)
      .map(x => x.t.name);
    return ranked;
  };

  const resolveTera = async (val) => {
    if (!val) return null;
    const s = String(val).trim();
    // If it's a valid ObjectId try by id first
    if (s.match(/^[a-f\d]{24}$/i)) {
      const byId = await TaxiTera.findById(s);
      if (byId) return byId;
    }
    // Fallback to case-insensitive name match
    const escapeRegex = (v) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(`^${escapeRegex(s)}$`, 'i');
    let found = await TaxiTera.findOne({ name: rx });
    if (found) return found;
    // Try normalized equality
    const all = await TaxiTera.find({}).select('name').lean();
    const normS = normalize(s);
    const exact = all.find(t => normalize(t.name) === normS);
    if (exact) return await TaxiTera.findOne({ name: exact.name });
    // Try includes matching
    const candidates = all.filter(t => normalize(t.name).includes(normS) || normS.includes(normalize(t.name)));
    if (candidates.length === 1) return await TaxiTera.findOne({ name: candidates[0].name });
    return null; // ambiguous or not found
  };

  const getOrCreateTera = async (val) => {
  const existing = await resolveTera(val);
  if (existing) return existing;
    // Auto-create minimal tera if not found
    const name = String(val || '').trim();
  // Avoid creating a duplicate by case-insensitive check
  const dupe = await TaxiTera.findOne({ name }).collation({ locale: 'en', strength: 2 });
  if (dupe) return dupe;
    const created = await TaxiTera.create({
      name,
      location: { type: 'Point', coordinates: [0, 0] },
      notes: 'Auto-created via route approval; coordinates TBD',
      condition: 'average'
    });
    return created;
  };

  switch (sub.type) {
    case 'newTera': {
      // Expected: { name, location: { type:'Point', coordinates:[lng,lat] }, address?, notes?, condition? }
      // Prevent duplicates (case-insensitive by name)
      const existingTera = await TaxiTera.findOne({ name: payload.name }).collation({ locale: 'en', strength: 2 });
      const doc = existingTera || await TaxiTera.create({
        name: payload.name,
        location: payload.location,
        address: payload.address,
        notes: payload.notes,
        condition: payload.condition || 'good'
      });
      sub.adminNotes = adminNotes || sub.adminNotes;
      sub.status = 'approved';
      await sub.save();
      await refreshGraph();
      return res.json({ message: existingTera ? 'Submission approved. Tera already existed; no duplicate created.' : 'Submission approved. Tera created.', tera: doc, submission: sub });
    }
    case 'newRoute': {
      // Expected: { fromTera, toTera, fare, estimatedTimeMin, distance?, roadCondition?, availabilityMin? }
  const fromT = await getOrCreateTera(payload.fromTera);
  const toT = await getOrCreateTera(payload.toTera);
      // Prevent duplicate route regardless of direction
      const existingRoute = await Route.findOne({
        $or: [
          { fromTera: fromT._id, toTera: toT._id },
          { fromTera: toT._id, toTera: fromT._id }
        ]
      });
      if (existingRoute) {
        sub.adminNotes = adminNotes || sub.adminNotes;
        sub.status = 'approved';
        await sub.save();
        await refreshGraph();
        return res.json({ message: 'Submission approved. Route already existed; no duplicate created.', route: existingRoute, submission: sub });
      }
      const doc = await Route.create({
        fromTera: fromT._id,
        toTera: toT._id,
        fare: payload.fare,
        distance: payload.distance,
        estimatedTimeMin: payload.estimatedTimeMin,
        roadCondition: payload.roadCondition,
        availabilityMin: payload.availabilityMin,
        status: 'approved',
        createdBy: sub.submittedBy || req.user?.id
      });
      sub.adminNotes = adminNotes || sub.adminNotes;
      sub.status = 'approved';
      await sub.save();
      await refreshGraph();
      return res.json({ message: 'Submission approved. Route created.', route: doc, submission: sub });
    }
    case 'fareUpdate': {
      // Expected: { routeId? or (fromTera,toTera), newFare }
      let route;
      if (payload.routeId) {
        route = await Route.findById(payload.routeId);
      } else if (payload.fromTera && payload.toTera) {
        const fromT = await resolveTera(payload.fromTera);
        const toT = await resolveTera(payload.toTera);
        if (!fromT || !toT) {
          res.status(404);
          throw new Error('Tera name(s) not found');
        }
        // Match route regardless of order (undirected)
        route = await Route.findOne({
          status: 'approved',
          $or: [
            { fromTera: fromT._id, toTera: toT._id },
            { fromTera: toT._id, toTera: fromT._id }
          ]
        });
      }
      if (!route) {
        res.status(404);
        throw new Error('Target route not found');
      }
      // In case of legacy routes missing createdBy, set a sensible default to pass validation
      if (!route.createdBy) {
        route.createdBy = sub.submittedBy || req.user?.id || undefined;
      }
      route.fare = payload.newFare;
      await route.save();
      sub.adminNotes = adminNotes || sub.adminNotes;
      sub.status = 'approved';
      await sub.save();
      await refreshGraph();
      return res.json({ message: 'Submission approved. Fare updated.', route, submission: sub });
    }
    case 'conditionUpdate': {
      // Expected: { teraId, condition: 'good'|'average'|'poor' }
      const tera = payload.teraId ? await TaxiTera.findById(payload.teraId) : await resolveTera(payload.tera || payload.teraName);
      if (!tera) {
        let msg = 'Target tera not found.';
        const sugg = await getSuggestions(payload.tera || payload.teraName || '');
        if (sugg.length) msg += ` Suggestions: ${sugg.join(', ')}`;
        res.status(404);
        throw new Error(msg);
      }
      tera.condition = payload.condition;
      await tera.save();
      sub.adminNotes = adminNotes || sub.adminNotes;
      sub.status = 'approved';
      await sub.save();
      await refreshGraph();
      return res.json({ message: 'Submission approved. Tera condition updated.', tera, submission: sub });
    }
    case 'driver_verification': {
      // Expected: { licensePhoto, carPhoto, licenseText, carPlate, carType }
      const user = await User.findById(sub.submittedBy);
      if (!user) {
        res.status(404);
        throw new Error('User not found');
      }
      if (user.role !== 'taxiDriver') {
        res.status(400);
        throw new Error('User is not a taxi driver');
      }
      // Update user verification status
      user.driverDetails.verificationStatus = 'verified';
      if (payload.licensePhoto) user.driverDetails.documents.licensePhoto = payload.licensePhoto;
      if (payload.carPhoto) user.driverDetails.documents.carPhoto = payload.carPhoto;
      await user.save();
      sub.adminNotes = adminNotes || sub.adminNotes;
      sub.status = 'approved';
      await sub.save();
      return res.json({ message: 'Driver verification approved.', user: { id: user._id, verificationStatus: user.driverDetails.verificationStatus }, submission: sub });
    }
    case 'route_application': {
      // Expected: { targetRouteId, currentRouteId?, monthsServed, reason? }
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const user = await User.findById(sub.submittedBy).session(session);
        if (!user) {
          await session.abortTransaction();
          res.status(404);
          throw new Error('User not found');
        }
        if (user.role !== 'taxiDriver') {
          await session.abortTransaction();
          res.status(400);
          throw new Error('User is not a taxi driver');
        }
        if (user.driverDetails?.verificationStatus !== 'verified') {
          await session.abortTransaction();
          res.status(400);
          throw new Error('Driver must be verified before route assignment');
        }
        const targetRoute = await Route.findById(payload.targetRouteId).session(session);
        if (!targetRoute) {
          await session.abortTransaction();
          res.status(404);
          throw new Error('Target route not found');
        }
        if (targetRoute.status !== 'approved') {
          await session.abortTransaction();
          res.status(400);
          throw new Error('Can only assign approved routes');
        }
        // If user has a current route, decrement its activeDriverCount
        const currentRouteId = user.driverDetails?.currentRoute;
        if (currentRouteId) {
          const currentRoute = await Route.findById(currentRouteId).session(session);
          if (currentRoute) {
            // Use updateOne to avoid full document validation
            await Route.updateOne(
              { _id: currentRouteId },
              { $set: { activeDriverCount: Math.max(0, (currentRoute.activeDriverCount || 0) - 1) } },
              { session }
            );
          }
        }
        // Increment target route's activeDriverCount
        // Use updateOne to avoid full document validation
        await Route.updateOne(
          { _id: payload.targetRouteId },
          { $inc: { activeDriverCount: 1 } },
          { session }
        );
        // Update user's current route
        user.driverDetails.currentRoute = targetRoute._id;
        user.driverDetails.routeAssignedDate = new Date();
        await user.save({ session });
        sub.adminNotes = adminNotes || sub.adminNotes;
        sub.status = 'approved';
        await sub.save({ session });
        await session.commitTransaction();
        
        // Fetch updated route to get the new activeDriverCount
        const updatedRoute = await Route.findById(payload.targetRouteId);
        return res.json({
          message: 'Route application approved. Driver assigned to route.',
          user: { id: user._id, currentRoute: user.driverDetails.currentRoute },
          route: { id: updatedRoute._id, activeDriverCount: updatedRoute.activeDriverCount },
          submission: sub
        });
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    }
    default:
      res.status(400);
      throw new Error('Unsupported submission type');
  }
});

// PATCH /api/admin/submissions/:id/reject
const rejectSubmission = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { adminNotes } = req.body || {};
  const sub = await UserSubmission.findById(id);
  if (!sub) {
    res.status(404);
    throw new Error('Submission not found');
  }
  sub.status = 'rejected';
  if (adminNotes) sub.adminNotes = adminNotes;
  await sub.save();
  return res.json({ message: 'Submission rejected', submission: sub });
});

module.exports = { getAllSubmissions, approveSubmission, rejectSubmission };
