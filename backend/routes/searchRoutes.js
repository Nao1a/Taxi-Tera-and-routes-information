const express = require('express');
const { searchRoute, listTeras } = require('../controller/searchController');
const router = express.Router();

// GET /api/search?from=<teraId>&to=<teraId>&optimizeBy=fare|time
router.get('/', searchRoute);
router.get('/teras', listTeras);

module.exports = router;
