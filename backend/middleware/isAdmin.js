const asyncHandler = require('express-async-handler');

const isAdmin = asyncHandler(async (req, res, next) => {
  const role = req.user?.role;
  if (!role || (role !== 'admin' && role !== 'moderator')) {
    res.status(403);
    throw new Error('Admin privileges required');
  }
  next();
});

module.exports = isAdmin;
