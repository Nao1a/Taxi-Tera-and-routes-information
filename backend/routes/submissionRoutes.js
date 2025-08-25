const express = require('express');
const { createSubmission, getMySubmissions } = require('../controller/submissionController');
const isAuth = require('../middleware/authToken');

const router = express.Router();

// Authenticated user submissions
router.post('/', isAuth, createSubmission);
router.get('/my', isAuth, getMySubmissions);

module.exports = router;
