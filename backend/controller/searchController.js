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
  const teras = await TaxiTera.find({}).select('_id name').lean();
  global.adjGraph = buildAdjacencyList(routes, teras);
  global.teraNameMap = teras.reduce((acc, t) => { acc[t._id.toString()] = t.name; return acc; }, {});
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
    let secondBest = null;
    if (result.secondBest && result.secondBest.path) {
      secondBest = {
        path: result.secondBest.path.map(id => global.teraNameMap[id] || id),
        totalFare: result.secondBest.totalFare,
        totalTime: result.secondBest.totalTime
      };
    }
    const response = { path: namedPath, totalFare: result.totalFare, totalTime: result.totalTime, optimizeBy, secondBest };
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
