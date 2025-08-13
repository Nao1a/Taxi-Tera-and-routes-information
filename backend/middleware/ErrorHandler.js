const { constants } = require("../constants");
const errorHandler = (err, req, res, next) => {
    // Mongo / Mongoose specific handling overrides status where appropriate
    let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
    let title = 'Error';
    let details;

    // Duplicate key error (MongoServerError code 11000)
    if (err && (err.code === 11000 || err.code === 11001)) {
        statusCode = 409;
        title = 'Duplicate Key';
        const fields = Object.keys(err.keyValue || {});
        details = { fields, keyValue: err.keyValue };
    }
    // CastError (invalid ObjectId etc.)
    else if (err.name === 'CastError') {
        statusCode = 400;
        title = 'Invalid Identifier';
        details = { path: err.path, value: err.value };
    }
    // Mongoose validation error
    else if (err.name === 'ValidationError') {
        statusCode = 422;
        title = 'Validation Failed';
        details = Object.values(err.errors || {}).map(e => ({ path: e.path, message: e.message }));
    }

    // Switch for predefined app constants (only if not already overridden)
    if (!details) {
        switch (statusCode) {
            case constants.VALIDATION_ERROR:
                title = 'Validation Failed';
                break;
            case constants.NOT_FOUND:
                title = 'Not Found';
                break;
            case constants.UNAUTHORIZED:
                title = 'Unauthorized';
                break;
            case constants.FORBIDDEN:
                title = 'Forbidden';
                break;
            case constants.SERVER_ERROR:
                title = 'Server Error';
                break;
            default:
                break;
        }
    }

    const response = {
        title,
        message: err.message || 'An error occurred',
    };
    if (details) response.details = details;
    // Include stack only in development
    if (process.env.NODE_ENV !== 'production') {
        response.stack = err.stack;
    }
    res.status(statusCode).json(response);
};

module.exports = errorHandler;