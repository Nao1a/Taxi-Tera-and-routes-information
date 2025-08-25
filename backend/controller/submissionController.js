const asyncHandler = require('express-async-handler');
const UserSubmission = require('../models/UserSubmissionModel');

// POST /api/submissions
const createSubmission = asyncHandler(async (req, res) => {
  if (req.user?.id) {
    const User = require('../models/UserModel');
    const u = await User.findById(req.user.id).select('isSubmissionBanned submissionBanReason');
    if (u?.isSubmissionBanned) {
      res.status(403);
      throw new Error(u.submissionBanReason || 'You are banned from submitting data.');
    }
  }
  const { type, payload } = req.body || {};
  if (!type || !payload) {
    res.status(400);
    throw new Error('type and payload are required');
  }

  if (!['newTera', 'newRoute', 'fareUpdate', 'conditionUpdate'].includes(type)) {
    res.status(400);
    throw new Error('Invalid submission type');
  }

  // Normalize payloads lightly for convenience
  if (type === 'newTera') {
    // Accept lng/lat and convert to GeoJSON
    if (!payload.location && (payload.lng !== undefined && payload.lat !== undefined)) {
      const lng = Number(payload.lng);
      const lat = Number(payload.lat);
      if (!Number.isNaN(lng) && !Number.isNaN(lat)) {
        payload.location = { type: 'Point', coordinates: [lng, lat] };
        delete payload.lng; delete payload.lat;
      }
    }
  }

  // Light validation by type (full validation will occur on approval)
  const validators = {
    newTera: () => !!payload.name && Array.isArray(payload?.location?.coordinates) && payload.location.coordinates.length === 2,
    // Accept IDs or names for fromTera/toTera; exact IDs validated on approval
    newRoute: () => !!payload.fromTera && !!payload.toTera && (payload.fare || payload.estimatedTimeMin),
  fareUpdate: () => (payload.routeId || (payload.fromTera && payload.toTera)) && typeof payload.newFare === 'number',
    // Accept either teraId or tera (name)
    conditionUpdate: () => (payload.teraId || payload.tera || payload.teraName) && ['good','average','poor'].includes(payload.condition || '')
  };
  if (!validators[type]()) {
    res.status(400);
    throw new Error('Payload does not satisfy minimal requirements for the selected type');
  }

  const submission = await UserSubmission.create({
    type,
    payload,
    submittedBy: req.user?.id,
    status: 'pending'
  });

  res.status(201).json(submission);
});

// GET /api/submissions/my
const getMySubmissions = asyncHandler(async (req, res) => {
  const submissions = await UserSubmission.find({ submittedBy: req.user?.id })
    .sort({ createdAt: -1 })
    .lean();
  res.json(submissions);
});

module.exports = { createSubmission, getMySubmissions };
