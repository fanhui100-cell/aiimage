/* ─────────────────────────────────────────────────────────────────────────
   Lexiverse prototype data layer  (vanilla twin of lib/lexiverse/lexiverse-data.ts)
   · type contract: LexiNode { id, word, category, x, y, z, status }, LexiEdge { source, target }
   · 150 mock nodes on a Fibonacci sphere (with depth jitter for parallax)
   · k-nearest edges → a believable semantic web
   · deriveStatuses(): a locked node adjacent to any mastered node → unlockable
   ───────────────────────────────────────────────────────────────────────── */

// Real word pool so labels read like vocabulary, not "node_42".
const WORDS = {
  noun: ['ocean','horizon','lantern','harbor','signal','fragment','meadow','cipher','glacier','ember',
    'archive','cradle','beacon','marble','thicket','prism','canyon','willow','satchel','quartz',
    'orchard','tunnel','compass','feather','citadel','nebula','anchor','ribbon','cavern','meridian',
    'lattice','plateau','vessel','aurora','spindle','furnace','estuary','cobble','monsoon','garland',
    'pendant','reservoir','obelisk','driftwood','almanac','vellum','filament','sandbar','reverie','keystone'],
  verb: ['drift','kindle','gather','unfold','traverse','summon','restore','illuminate','navigate','cultivate',
    'whisper','assemble','dissolve','venture','reckon','flourish','beckon','wander','reconcile','envision',
    'harness','linger','emerge','sustain','retrieve','convey','anchor','translate','awaken','distill',
    'orbit','mend','forge','glimpse','nourish','unravel','propel','reveal','anchor2','immerse',
    'channel','endure','migrate','compose','soften','expand','ignite','traverse2','absorb','elevate'],
  adj: ['luminous','tranquil','vivid','remote','fragile','radiant','vast','subtle','resilient','serene',
    'boundless','intricate','candid','vibrant','weathered','nimble','sincere','elusive','tangible','buoyant',
    'pristine','dormant','fervent','lucid','rugged','graceful','wistful','austere','verdant','crisp',
    'kindred','seamless','ardent','quiet','sprawling','tender','stark','golden','hollow','brisk',
    'mellow','keen','frosted','amber','lush','hushed','steadfast','airy','dusky','clear'],
};
const CATS = ['noun', 'verb', 'adj'];
const TOTAL = 150;

// IPA + tiny bilingual gloss pools so the detail panel feels real (sampled, not per-word authored).
const GLOSS = {
  noun: { en: 'a thing, place, or idea you can name and hold in mind', zh: '名词 · 可命名的事物、地点或概念' },
  verb: { en: 'an action or process — something done or happening', zh: '动词 · 表示动作或过程' },
  adj:  { en: 'a quality that describes how something looks or feels', zh: '形容词 · 描述性质或状态' },
};

function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function buildNodes(seed = 7) {
  const rnd = mulberry32(seed);
  const nodes = [];
  const golden = Math.PI * (3 - Math.sqrt(5)); // golden angle
  const counters = { noun: 0, verb: 0, adj: 0 };
  for (let i = 0; i < TOTAL; i++) {
    // Fibonacci sphere — even angular distribution.
    const y = 1 - (i / (TOTAL - 1)) * 2;       // 1 → -1
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = golden * i;
    // Depth jitter: vary shell radius so the cloud has volume & parallax.
    const R = 30 + rnd() * 10;
    const x = Math.cos(theta) * radiusAtY * R;
    const z = Math.sin(theta) * radiusAtY * R;
    const yy = y * R;

    const category = CATS[i % 3];
    const word = WORDS[category][counters[category] % WORDS[category].length];
    counters[category]++;
    nodes.push({
      id: `${word}-${i}`, word, category,
      x: +x.toFixed(3), y: +yy.toFixed(3), z: +z.toFixed(3),
      status: 'locked',
    });
  }
  return nodes;
}

// k-nearest-neighbour edges → a connected semantic web (deduped, undirected).
function buildEdges(nodes, k = 3) {
  const edges = [];
  const seen = new Set();
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    const dists = [];
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      const b = nodes[j];
      const d = (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2;
      dists.push([d, j]);
    }
    dists.sort((p, q) => p[0] - q[0]);
    for (let n = 0; n < k; n++) {
      const j = dists[n][1];
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ source: nodes[i].id, target: nodes[j].id });
    }
  }
  return edges;
}

// Seed an initial "constellation" of mastered words — a few connected clusters.
function seedMastered(nodes, edges, count = 16, seed = 3) {
  const rnd = mulberry32(seed);
  const adj = buildAdjacency(nodes, edges);
  const masteredIds = new Set();
  // grow from a couple of random roots so mastered words sit in connected clumps
  const roots = 3;
  for (let r = 0; r < roots; r++) {
    let cur = nodes[(rnd() * nodes.length) | 0].id;
    const per = Math.ceil(count / roots);
    for (let s = 0; s < per && masteredIds.size < count; s++) {
      masteredIds.add(cur);
      const ns = (adj.get(cur) || []).filter((x) => !masteredIds.has(x));
      cur = ns.length ? ns[(rnd() * ns.length) | 0] : nodes[(rnd() * nodes.length) | 0].id;
    }
  }
  return masteredIds;
}

function buildAdjacency(nodes, edges) {
  const adj = new Map();
  nodes.forEach((n) => adj.set(n.id, []));
  edges.forEach((e) => { adj.get(e.source)?.push(e.target); adj.get(e.target)?.push(e.source); });
  return adj;
}

// Core rule: locked node adjacent to a mastered node → unlockable.
function deriveStatuses(nodes, adjacency, masteredIds) {
  for (const n of nodes) {
    if (masteredIds.has(n.id)) { n.status = 'mastered'; continue; }
    const neighbors = adjacency.get(n.id) || [];
    n.status = neighbors.some((nb) => masteredIds.has(nb)) ? 'unlockable' : 'locked';
  }
}

function createGraph(seed = 7) {
  const nodes = buildNodes(seed);
  const edges = buildEdges(nodes, 3);
  const adjacency = buildAdjacency(nodes, edges);
  const masteredIds = seedMastered(nodes, edges, 16, 3);
  deriveStatuses(nodes, adjacency, masteredIds);
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  return { nodes, edges, adjacency, masteredIds, byId };
}

window.Lexiverse = {
  createGraph, deriveStatuses, buildAdjacency, GLOSS,
  ipaFor(word) { return '/' + word.replace(/[^a-z]/g, '').replace(/(.)(?=.)/g, '$1\u200a') + '/'; },
};
