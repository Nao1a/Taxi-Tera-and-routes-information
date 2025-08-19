// Utility to build an in-memory adjacency list for taxi teras
// routes: array of Route mongoose docs or plain objects with fromTera/toTera (ObjectId) and fare, estimatedTimeMin
// teras: array of TaxiTera docs { _id, name }
// Output: { teraId: [ { to, fare, time } ] }
// NOTE: All routes are considered bidirectional. We create reverse edges automatically.

function buildAdjacencyList(routes, teras) {
  const graph = {};

  // Ensure every tera is represented even if it has no outgoing routes
  for (const t of teras) {
    const id = t._id.toString();
    if (!graph[id]) graph[id] = [];
  }

  for (const r of routes) {
    const from = (r.fromTera || r.from || r.fromId || r.from_id || r.fromTeraId).toString();
    const to = (r.toTera || r.to || r.toId || r.to_id || r.toTeraId).toString();
    const fare = Number(r.fare) || 0;
    const time = Number(r.estimatedTimeMin || r.time || r.duration) || 0;

    if (!graph[from]) graph[from] = [];
    if (!graph[to]) graph[to] = [];

    // Push forward edge if not duplicate
    if (!graph[from].some(e => e.to === to)) {
      graph[from].push({ to, fare, time });
    }
    // Push reverse edge if not duplicate
    if (!graph[to].some(e => e.to === from)) {
      graph[to].push({ to: from, fare, time });
    }
  }

  return graph;
}

module.exports = { buildAdjacencyList };
