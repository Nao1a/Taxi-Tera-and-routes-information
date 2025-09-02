const TaxiTera = require('../models/TaxiTeraModels');
const Route = require('../models/RouteModel');
const { buildAdjacencyList } = require('../utils/graphBuilder');
const { findShortestPath } = require('../utils/dijkstra');

// Ensure graph initialized
async function ensureGraph() {
  if (!global.adjGraph) {
    await refreshGraph();
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
    await ensureGraph();
    const teras = Object.entries(global.teraNameMap).map(([id, name]) => ({ id, name }));
    res.json(teras);
  } catch (e) { next(e); }
}

module.exports = { searchRoute, refreshGraph, listTeras };
