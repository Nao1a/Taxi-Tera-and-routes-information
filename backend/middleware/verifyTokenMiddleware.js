const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');

const verifyTokenMiddleware = asyncHandler(async (req, res, next) => {
    // Get token from Authorization, verify-token header, or query string
    const authHeader = req.headers['verifytoken'];
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (authHeader) {
        token = authHeader;
    } else if (req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        return res.status(400).json({ message: 'Verification token is required.' });
    }
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET); // set as req.user for controller compatibility
        next();
    } catch (err) {
        return res.status(400).json({ message: 'Invalid or expired verification token.' });
    }
});

module.exports = verifyTokenMiddleware;
