// ACO routing prototype for eGABAY.
//
// Loads the sample town coordinates from assets/map/js/data.js, builds a
// haversine distance matrix, then uses ant colony optimization to find the
// shortest visit order starting from a chosen town (default: Boac, matching
// the map page's `selectedOrigin`). The result is verified against exhaustive
// search (6 towns = 5! = 120 candidate orders, trivially checkable).
//
//   node scripts/route-aco-demo.mjs [startTown]
//
// For production legs, swap the haversine matrix for OSRM /table distances.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'assets/map/js/data.js'), 'utf8');
const TOWNS = new Function('return ' + src.match(/const TOWNS = (\[[\s\S]*?\]);/)[1])();

const startName = process.argv[2] ?? 'Boac';
const startIdx = TOWNS.findIndex((t) => t.name === startName);
if (startIdx === -1) {
  console.error(`Unknown town "${startName}". Options: ${TOWNS.map((t) => t.name).join(', ')}`);
  process.exit(1);
}

// ---------- Distance matrix (haversine, km) ----------
function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const n = TOWNS.length;
const dist = Array.from({ length: n }, (_, i) =>
  Array.from({ length: n }, (_, j) => haversineKm(TOWNS[i], TOWNS[j])),
);

// ---------- Deterministic RNG (mulberry32) ----------
function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- Ant colony optimization ----------
// Classic Ant System: ants build tours probabilistically from pheromone τ
// and heuristic η = 1/d; pheromone evaporates then good tours deposit more.
function antColony({ ants = 20, iterations = 200, alpha = 1, beta = 3, rho = 0.5, q = 100, seed = 1 }) {
  const rand = rng(seed);
  const tau = Array.from({ length: n }, () => Array(n).fill(1));
  const eta = dist.map((row) => row.map((d) => 1 / Math.max(d, 1e-6)));
  let best = { order: null, length: Infinity };

  for (let iter = 0; iter < iterations; iter++) {
    const tours = [];
    for (let a = 0; a < ants; a++) {
      const order = [startIdx];
      const visited = new Set(order);
      while (order.length < n) {
        const i = order[order.length - 1];
        const weights = [];
        let total = 0;
        for (let j = 0; j < n; j++) {
          if (visited.has(j)) { weights.push(0); continue; }
          const w = tau[i][j] ** alpha * eta[i][j] ** beta;
          weights.push(w);
          total += w;
        }
        let r = rand() * total;
        let next = weights.findIndex((w) => (r -= w) <= 0);
        if (next === -1) next = weights.findIndex((w) => w > 0);
        order.push(next);
        visited.add(next);
      }
      const length = order.slice(1).reduce((sum, j, k) => sum + dist[order[k]][j], 0);
      tours.push({ order, length });
      if (length < best.length) best = { order, length };
    }
    // Evaporate, then let every ant deposit pheromone ∝ 1/tour-length.
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) tau[i][j] *= 1 - rho;
    for (const { order, length } of tours) {
      for (let k = 0; k + 1 < order.length; k++) tau[order[k]][order[k + 1]] += q / length;
    }
  }
  return best;
}

// ---------- Exact answer by exhaustive search (fixed start, open path) ----------
function bruteForce() {
  let best = { order: null, length: Infinity };
  const rest = TOWNS.map((_, i) => i).filter((i) => i !== startIdx);
  (function permute(prefix, remaining) {
    if (!remaining.length) {
      const order = [startIdx, ...prefix];
      const length = order.slice(1).reduce((s, j, k) => s + dist[order[k]][j], 0);
      if (length < best.length) best = { order, length };
      return;
    }
    for (let i = 0; i < remaining.length; i++) {
      permute([...prefix, remaining[i]], remaining.filter((_, k) => k !== i));
    }
  })([], rest);
  return best;
}

// ---------- Report ----------
const fmt = (v) => v.toFixed(1).padStart(6);
console.log(`\nHaversine distance matrix (km), ${n} towns:`);
console.log('           ' + TOWNS.map((t) => t.name.slice(0, 9).padStart(9)).join(' '));
dist.forEach((row, i) =>
  console.log(TOWNS[i].name.slice(0, 9).padEnd(9) + '  ' + row.map((d) => fmt(d)).join(' ')),
);

const aco = antColony({});
const exact = bruteForce();
const render = (o) => o.order.map((i) => TOWNS[i].name).join(' → ');

console.log(`\nStart: ${startName} (visit all ${n} towns, open path)`);
console.log(`  ACO best:        ${render(aco)}  = ${aco.length.toFixed(1)} km`);
console.log(`  Exhaustive best: ${render(exact)}  = ${exact.length.toFixed(1)} km`);
console.log(`  ACO ${Math.abs(aco.length - exact.length) < 1e-9 ? 'found the global optimum' : 'missed the optimum'}.`);
