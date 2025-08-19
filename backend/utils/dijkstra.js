// Pathfinding utilities on adjacency list produced by graphBuilder
// adjGraph: { nodeId: [ { to, fare, time } ] }
// optimizeBy: 'fare' | 'time' | 'stops'
// For 'stops': minimize number of edges; tie-breaker by lower total fare then by lower total time.
// For all modes this function also attempts to compute a second best alternative path.
// Definition of second best:
//  - fare/time modes: lowest total fare/time strictly greater than best (ties resolved by other metric then lexicographic path string)
//  - stops mode: second (fare,time) pair among minimal-hop paths after sorting by (fare, time)
// Returns { path, totalFare, totalTime, secondBest: { path, totalFare, totalTime } | null }

function findShortestPath(adjGraph, startId, endId, optimizeBy = 'fare') {
  if (!adjGraph) throw new Error('Adjacency graph not loaded');
  const start = startId.toString();
  const target = endId.toString();
  if (!adjGraph[start] || !adjGraph[target]) {
    // If either node missing treat as unreachable
    return { path: [], totalFare: null, totalTime: null, secondBest: null };
  }
  if (start === target) {
    return { path: [start], totalFare: 0, totalTime: 0, secondBest: null };
  }

  if (optimizeBy === 'stops') {
    // BFS collecting ALL minimal-hop paths (capped)
    const MAX_PATHS = 50; // safety cap
    const queue = [start];
    const depth = { [start]: 0 };
    const parents = {}; // node -> Set of parents at minimal depth
    let minDepth = Infinity;
    while (queue.length) {
      const node = queue.shift();
      const d = depth[node];
      if (d > minDepth) break; // we have processed all nodes at min depth
      if (node === target) { minDepth = d; continue; }
      for (const edge of adjGraph[node] || []) {
        if (!(edge.to in depth)) {
          depth[edge.to] = d + 1;
          parents[edge.to] = new Set([node]);
          queue.push(edge.to);
        } else if (depth[edge.to] === d + 1) {
          // another minimal parent
          parents[edge.to].add(node);
        }
      }
    }
    if (minDepth === Infinity) return { path: [], totalFare: null, totalTime: null, secondBest: null };
    // Reconstruct all minimal paths via DFS backward
    const allPaths = [];
    function backtrack(node, acc) {
      if (allPaths.length >= MAX_PATHS) return;
      if (node === start) {
        allPaths.push([start, ...acc]);
        return;
      }
      const ps = parents[node];
      if (!ps) return;
      for (const p of ps) backtrack(p, [node, ...acc]);
    }
    backtrack(target, []);
    // Compute totals for each path
    const pathObjs = allPaths.map(p => {
      let fareSum = 0, timeSum = 0, ok = true;
      for (let i = 0; i < p.length - 1; i++) {
        const a = p[i], b = p[i+1];
        const edge = (adjGraph[a] || []).find(e => e.to === b);
        if (!edge) { ok = false; break; }
        fareSum += edge.fare; timeSum += edge.time;
      }
      return ok ? { path: p, totalFare: fareSum, totalTime: timeSum } : null;
    }).filter(Boolean);
    if (!pathObjs.length) return { path: [], totalFare: null, totalTime: null, secondBest: null };
    // Sort by fare then time then lexicographic path string
    pathObjs.sort((a,b)=> a.totalFare - b.totalFare || a.totalTime - b.totalTime || a.path.join(',').localeCompare(b.path.join(',')) );
    const best = pathObjs[0];
    const second = pathObjs.length > 1 ? pathObjs[1] : null;
    return { path: best.path, totalFare: best.totalFare, totalTime: best.totalTime, secondBest: second };
  }

  const dist = {}; // metric distance based on optimizeBy
  const totalFare = {}; // accumulate fare regardless of metric used
  const totalTime = {}; // accumulate time regardless of metric
  const prev = {};
  const visited = new Set();

  for (const node of Object.keys(adjGraph)) {
    dist[node] = Infinity;
    totalFare[node] = Infinity;
    totalTime[node] = Infinity;
  }
  dist[start] = 0;
  totalFare[start] = 0;
  totalTime[start] = 0;

  // Priority queue (simple array based for modest graph size)
  const pq = [{ node: start, d: 0 }];

  function push(node, d) {
    pq.push({ node, d });
  }
  function popMin() {
    let idx = 0;
    for (let i = 1; i < pq.length; i++) {
      if (pq[i].d < pq[idx].d) idx = i;
    }
    return pq.splice(idx, 1)[0];
  }

  while (pq.length) {
    const { node } = popMin();
    if (visited.has(node)) continue;
    visited.add(node);
    if (node === target) break; // early exit

    for (const edge of adjGraph[node] || []) {
  const w = optimizeBy === 'time' ? edge.time : edge.fare; // for fare or time modes
      const alt = dist[node] + w;
      if (alt < dist[edge.to]) {
        dist[edge.to] = alt;
        // recompute totals from node
        totalFare[edge.to] = totalFare[node] + edge.fare;
        totalTime[edge.to] = totalTime[node] + edge.time;
        prev[edge.to] = node;
        push(edge.to, alt);
      }
    }
  }

  if (!prev[target] && start !== target) {
    // No path found
  return { path: [], totalFare: null, totalTime: null, secondBest: null };
  }

  // Reconstruct path
  const path = [];
  let cur = target;
  path.push(cur);
  while (cur !== start) {
    cur = prev[cur];
    if (!cur) break; // safety
    path.push(cur);
  }
  path.reverse();

  // After best path, attempt to compute a second-best alternative for fare/time modes
  const best = { path, totalFare: totalFare[target], totalTime: totalTime[target] };

  // Helper to run dijkstra ignoring one directed edge (u->v)
  function dijkstraIgnoringEdge(blockU, blockV) {
    const dist2 = {}; const fare2 = {}; const time2 = {}; const prev2 = {}; const visited2 = new Set();
    for (const n of Object.keys(adjGraph)) { dist2[n]=Infinity; fare2[n]=Infinity; time2[n]=Infinity; }
    dist2[start]=0; fare2[start]=0; time2[start]=0;
    const pq2=[{node:start,d:0}];
    function popMin2(){let idx=0; for(let i=1;i<pq2.length;i++){ if(pq2[i].d<pq2[idx].d) idx=i;} return pq2.splice(idx,1)[0];}
    function push2(n,d){pq2.push({node:n,d});}
    while(pq2.length){
      const {node}=popMin2();
      if(visited2.has(node)) continue; visited2.add(node);
      if(node===target) break;
      for(const edge of adjGraph[node]||[]){
        if(node===blockU && edge.to===blockV) continue; // skip blocked edge
        const w = optimizeBy === 'time' ? edge.time : edge.fare;
        const alt = dist2[node] + w;
        if(alt < dist2[edge.to]) {
          dist2[edge.to]=alt;
          fare2[edge.to]=fare2[node]+edge.fare;
          time2[edge.to]=time2[node]+edge.time;
          prev2[edge.to]=node;
          push2(edge.to, alt);
        }
      }
    }
    if(!prev2[target] && start!==target) return null;
    const p=[]; let c=target; p.push(c); while(c!==start){ c=prev2[c]; if(!c) break; p.push(c);} p.reverse();
    if(p[0]!==start || p[p.length-1]!==target) return null;
    return { path:p, totalFare: fare2[target], totalTime: time2[target] };
  }

  // Generate candidates by removing each consecutive edge of the best path
  const candidates = [];
  for (let i=0;i<best.path.length-1;i++) {
    const u = best.path[i]; const v = best.path[i+1];
    const cand = dijkstraIgnoringEdge(u,v);
    if(!cand) continue;
    // Must be strictly worse in primary metric (fare or time) to be second best
    const primaryBest = optimizeBy === 'time' ? best.totalTime : best.totalFare;
    const primaryCand = optimizeBy === 'time' ? cand.totalTime : cand.totalFare;
    if(primaryCand > primaryBest) candidates.push(cand);
  }
  // Deduplicate by path signature
  const seen = new Set();
  const unique = [];
  for (const c of candidates) { const sig=c.path.join('>'); if(!seen.has(sig)){ seen.add(sig); unique.push(c);} }
  unique.sort((a,b)=> (optimizeBy==='time'? a.totalTime-b.totalTime : a.totalFare-b.totalFare) || a.totalFare-b.totalFare || a.totalTime-b.totalTime || a.path.join(',').localeCompare(b.path.join(',')) );
  const secondBest = unique.length? unique[0]: null;

  return { ...best, secondBest };
}

module.exports = { findShortestPath };
