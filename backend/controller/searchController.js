const TaxiTera = require('../models/TaxiTeraModels');
const Route = require('../models/RouteModel');
const { buildAdjacencyList } = require('../utils/graphBuilder');
const { findShortestPath } = require('../utils/dijkstra');

// Ensure graph initialized (with simple lock and staleness check)
async function ensureGraph({ force = false } = {}) {
  const STALE_MS = 10 * 60 * 1000; // 10 minutes
  const now = Date.now();
  const empty = !global.adjGraph || !Object.keys(global.adjGraph).length;
  const stale = !global.graphLastBuiltAt || (now - global.graphLastBuiltAt > STALE_MS);
  if (force || empty || stale) {
    if (!global.graphBuildingPromise) {
      global.graphBuildingPromise = (async () => {
        try { await refreshGraph(); }
        finally { global.graphBuildingPromise = null; }
      })();
    }
    await global.graphBuildingPromise;
  }
}

async function refreshGraph() {
  const routes = await Route.find({ status: 'approved' }).lean();
  const teras = await TaxiTera.find({}).select('_id name location').lean();
  global.adjGraph = buildAdjacencyList(routes, teras);
  global.teraNameMap = teras.reduce((acc, t) => { acc[t._id.toString()] = t.name; return acc; }, {});
  // cache coordinates in [lat, lng] for quick lookup (convert from GeoJSON [lng, lat])
  global.teraCoordMap = teras.reduce((acc, t) => {
    const coords = Array.isArray(t.location?.coordinates) ? t.location.coordinates : null;
    if (coords && coords.length === 2) {
      acc[t._id.toString()] = [coords[1], coords[0]]; // [lat, lng]
    }
    return acc;
  }, {});
  global.graphRevision = (global.graphRevision || 0) + 1;
  global.graphLastBuiltAt = Date.now();
  try {
    const edgeCount = Object.values(global.adjGraph || {}).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
    console.log(`[Graph] refresh #${global.graphRevision} @ ${new Date().toISOString()} | teras=${teras.length} routes=${routes.length} edges=${edgeCount}`);
  } catch {}
  return global.adjGraph;
}

async function searchRoute(req, res, next) {
  try {
  await ensureGraph();
    const { from, to, optimizeBy = 'fare' } = req.query;
  // prevent CDN/browser caching
  res.set('Cache-Control', 'no-store');
    if (!from || !to) return res.status(400).json({ message: 'from and to query params required' });
  if (!['fare', 'time', 'stops'].includes(optimizeBy)) return res.status(400).json({ message: 'optimizeBy must be fare, time, or stops' });

    // Accept either ObjectId string or tera name for from/to
    const nameToId = Object.fromEntries(Object.entries(global.teraNameMap).map(([id, name]) => [name.toLowerCase(), id]));
    const fromId = global.adjGraph[from] ? from : nameToId[from.toLowerCase()];
    const toId = global.adjGraph[to] ? to : nameToId[to.toLowerCase()];
    if (!fromId || !toId) return res.status(404).json({ message: 'Unknown from or to tera' });

    const result = findShortestPath(global.adjGraph, fromId, toId, optimizeBy);
    if (!result || !Array.isArray(result.path)) {
      return res.status(500).json({ message: 'Unexpected search result structure' });
    }
    if (!result.path.length) {
      return res.status(404).json({ message: 'No route found' });
    }
    const namedPath = result.path.map(id => global.teraNameMap[id] || id);
    const coordsPath = result.path
      .map(id => global.teraCoordMap?.[id])
      .filter(Boolean);
    let secondBest = null;
    if (result.secondBest && result.secondBest.path) {
      secondBest = {
        path: result.secondBest.path.map(id => global.teraNameMap[id] || id),
        coordinates: result.secondBest.path.map(id => global.teraCoordMap?.[id]).filter(Boolean),
        totalFare: result.secondBest.totalFare,
        totalTime: result.secondBest.totalTime
      };
    }
    const response = { path: namedPath, coordinates: coordsPath, totalFare: result.totalFare, totalTime: result.totalTime, optimizeBy, secondBest };
    if (req.query.debug === 'true') {
      response._debug = { fromId, toId, rawPath: result.path };
    }
    res.json(response);
  } catch (err) {
    next(err);
  }
}
async function listTeras(req, res, next) {
  try {
    // Serve directly from DB so suggestions don't depend on in-memory cache
    res.set('Cache-Control', 'no-store');
    const teras = await TaxiTera.find({}).select('_id name').lean();
    res.json(teras.map(t => ({ id: t._id.toString(), name: t.name })));
  } catch (e) { next(e); }
}

async function getTeraDetails(req, res, next) {
  try {
    await ensureGraph();
    res.set('Cache-Control', 'no-store');
    
    const { tera } = req.query;
    if (!tera) return res.status(400).json({ message: 'tera query param required' });

    // Accept either ObjectId string or tera name
    const nameToId = Object.fromEntries(Object.entries(global.teraNameMap).map(([id, name]) => [name.toLowerCase(), id]));
    const teraId = global.adjGraph[tera] ? tera : nameToId[tera.toLowerCase()];
    
    if (!teraId) return res.status(404).json({ message: 'Tera not found' });

    // Get tera info from database
    const teraDoc = await TaxiTera.findById(teraId).lean();
    if (!teraDoc) return res.status(404).json({ message: 'Tera not found in database' });

    // Get direct destinations from adjacency graph
    const directRoutes = global.adjGraph[teraId] || [];
    
    // Fetch route details including activeDriverCount
    // Look up routes by fromTera and toTera (handles bidirectional routes)
    // Build a single query with all route combinations
    const routeConditions = [];
    directRoutes.forEach(edge => {
      routeConditions.push(
        { fromTera: teraId, toTera: edge.to },
        { fromTera: edge.to, toTera: teraId }
      );
    });
    
    const routesData = routeConditions.length > 0
      ? await Route.find({ $or: routeConditions, status: 'approved' })
          .select('fromTera toTera activeDriverCount').lean()
      : [];
    
    // Build route map by fromTera/toTera (bidirectional)
    const routeMap = routesData.reduce((acc, r) => {
      const fromId = r.fromTera.toString();
      const toId = r.toTera.toString();
      const key1 = `${fromId}-${toId}`;
      const key2 = `${toId}-${fromId}`;
      acc[key1] = r.activeDriverCount || 0;
      acc[key2] = r.activeDriverCount || 0;
      return acc;
    }, {});
    
    // Map destinations with names, coordinates, and driver count
    const destinations = directRoutes.map(edge => {
      const key1 = `${teraId}-${edge.to}`;
      const key2 = `${edge.to}-${teraId}`;
      const driverCount = routeMap[key1] || routeMap[key2] || 0;
      
      return {
        id: edge.to,
        name: global.teraNameMap[edge.to] || edge.to,
        coordinates: global.teraCoordMap?.[edge.to] || null,
        fare: edge.fare,
        estimatedTimeMin: edge.time,
        activeDriverCount: driverCount
      };
    });

    // Prepare tera coordinates (convert from GeoJSON [lng, lat] to [lat, lng])
    const coords = Array.isArray(teraDoc.location?.coordinates) && teraDoc.location.coordinates.length === 2
      ? [teraDoc.location.coordinates[1], teraDoc.location.coordinates[0]]
      : null;

    const response = {
      tera: {
        id: teraDoc._id.toString(),
        name: teraDoc.name,
        coordinates: coords,
        address: teraDoc.address,
        condition: teraDoc.condition,
        notes: teraDoc.notes
      },
      directDestinations: destinations,
      totalDestinations: destinations.length
    };

    res.json(response);
  } catch (err) {
    next(err);
  }
}


// GET /api/search/routes
const listRoutes = async (req, res) => {
  const Route = require('../models/RouteModel');
  const routes = await Route.find({ status: 'approved' })
    .populate('fromTera', 'name')
    .populate('toTera', 'name')
    .select('fromTera toTera fare estimatedTimeMin distanceKm')
    .lean();

  const formatted = routes.map(r => ({
    _id: r._id,
    name: `${r.fromTera?.name || 'Unknown'} - ${r.toTera?.name || 'Unknown'}`,
    fare: r.fare,
    time: r.estimatedTimeMin,
    distance: r.distanceKm
  }));

  res.json(formatted);
};

module.exports = { searchRoute, refreshGraph, listTeras, getTeraDetails, listRoutes };
