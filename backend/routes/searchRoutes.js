const express = require('express');
const { searchRoute, listTeras, getTeraDetails } = require('../controller/searchController');
const router = express.Router();

// More specific routes first
// GET /api/search/teras
router.get('/teras', listTeras);
// GET /api/search/tera-details?tera=<teraId or teraName>
router.get('/tera-details', getTeraDetails);
// GET /api/search?from=<teraId>&to=<teraId>&optimizeBy=fare|time
router.get('/', searchRoute);

module.exports = router;
