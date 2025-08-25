const asyncHandler = require('express-async-handler');
const UserSubmission = require('../models/UserSubmissionModel');
const TaxiTera = require('../models/TaxiTeraModels');
const Route = require('../models/RouteModel');
const { refreshGraph } = require('./searchController');

// GET /api/admin/submissions?status=pending|approved|rejected
const getAllSubmissions = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    filter.status = status;
  }
  const items = await UserSubmission.find(filter)
    .populate('submittedBy', 'username email role')
    .sort({ createdAt: -1 })
    .lean();
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
