/* ─────────────────────────────────────────────────────────────────────────
   Lexiverse Galaxy · data
   ~170 words scattered through a SPHERE VOLUME (not a shell). Each word gets a
   deterministic archetype + color + radius from a hash of its id, so every
   planet is distinct but stable across reloads. Status (mastered/unlockable/
   locked) is layered on top and only modulates brightness / label / breathing.
   ───────────────────────────────────────────────────────────────────────── */
(function () {
  const WORDS = [
    // a rich, alphabetical-ish vocabulary pool (like the reference)
    'abandon','ability','abolish','abound','abridge','absorb','abstract','accent','accept','access',
    'acclaim','accord','accrue','achieve','acquire','acute','adapt','adept','admire','adopt',
    'advent','adverse','advise','aerial','affirm','afflict','agile','aleph','alibi','align',
    'allege','alliance','allocate','allure','aloft','altruism','amber','ambient','amend','amiable',
    'amplify','analyse','anchor','ancient','anneal','anomaly','anthem','apex','aplomb','apparent',
    'append','apricot','aptitude','arcane','ardent','argue','arise','armada','aroma','arouse',
    'ascend','aspire','assemble','asset','astound','asylum','atlas','atrium','attain','auburn',
    'audit','augment','aura','auspice','austere','author','avail','avert','aware','azure',
    'ballast','banner','barren','bask','beacon','bestow','betray','bivouac','blithe','bloom',
    'bolster','boreal','bountiful','bramble','brevity','brisk','buoyant','cadence','cajole','candor',
    'canopy','caprice','cascade','cathartic','celestial','cipher','clarion','cleave','cobalt','coda',
    'cogent','coherent','comet','compass','conjure','console','contour','convey','coral','cosmic',
    'crystal','cultivate','dapple','dawn','dazzle','debut','decree','deepen','defy','deluge',
    'demure','denote','depict','descend','diaphanous','diffuse','dilate','distill','diverge','divine',
    'dormant','dovetail','drift','dusk','dwell','eddy','effervesce','elapse','elicit','embark',
    'ember','emerge','endure','envision','ephemeral','epoch','equinox','estuary','ethereal','evoke',
    'exalt','expanse','fathom','feather','ferment','fervent','filament','flourish','fluent','foster',
    'fractal','gleam','glimmer','harbor','horizon','ignite','kindle','lantern','luminous','meridian',
    // denser pool — more worlds to roam
    'mirage','mosaic','muster','nascent','nebula','nimbus','nuance','oasis','obscure','onward',
    'opaque','orbit','ornate','outset','overt','pallid','paragon','pastoral','pendant','perch',
    'pinnacle','placid','plumage','poise','ponder','portal','potent','prairie','precise','prelude',
    'prism','pristine','prowess','quaint','quarry','quasar','quench','quiver','radiant','rampart',
    'ravine','reckon','reverie','ripple','rustic','saffron','salient','savor','scarlet','sentinel',
    'serene','shimmer','silhouette','sinew','solace','solstice','sonnet','spectral','sprout','stellar',
    'summit','sunder','surge','tactile','tangible','tempest','tether','thicket','thrive','tidal',
    'timbre','tranquil','trellis','tundra','umbra','undulate','unfurl','vantage','velvet','verdant',
    'vesper','vivid','voyage','wander','whittle','willow','wisp','wreath','zenith','zephyr',
  ];

  const CATS = ['noun', 'verb', 'adj'];
  const ARCH = ['gas', 'rocky', 'molten', 'geodesic', 'orb', 'ringed', 'galaxy', 'crystal', 'dwarf'];
  // Category-driven archetype families (visual grammar of the universe):
  //   nouns  → physical worlds  : rocky / ringed / dwarf
  //   verbs  → dynamic / flowing: gas / molten / galaxy / orb (drives change)
  //   adjs   → structured forms : crystal / geodesic (qualities = geometry)
  // Each family has its own internal weighting so families still feel varied.
  const FAMILY = {
    noun: { rocky: 0.46, ringed: 0.32, dwarf: 0.22 },
    verb: { gas: 0.40, molten: 0.24, orb: 0.22, galaxy: 0.14 },
    adj:  { crystal: 0.50, geodesic: 0.38, orb: 0.12 },
  };
  const PALETTE = ['#7EF9FF','#FFD66B','#FF6B6B','#FF8FD0','#B79BFF','#5FE0D6','#5B8BFF','#9CFFB0','#FFA94D','#FF9E6B','#C8B8FF','#6BE0A0','#FF7EB6','#9AD8FF'];

  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0); }
  function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  function pickArchetype(category, r) {
    const fam = FAMILY[category]; let acc = 0; const x = r();
    for (const a in fam) { acc += fam[a]; if (x <= acc) return a; }
    return Object.keys(fam)[0];
  }

  const FIELD_R = 132;

  function build() {
    const nodes = [];
    WORDS.forEach((word, i) => {
      const seed = hash(word + '#' + i);
      const r = mulberry32(seed);
      // uniform-ish point in a sphere volume (cube-root for even density), slight shell bias
      const u = r(), v = r(), w = r();
      const radius = FIELD_R * Math.cbrt(0.06 + 0.94 * u);
      const theta = v * Math.PI * 2;
      const phi = Math.acos(2 * w - 1);
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi) * 0.72;          // flatten a touch → galaxy disc feel
      const z = radius * Math.sin(phi) * Math.sin(theta);

      const category = CATS[i % 3];
      const archetype = pickArchetype(category, r);
      const color = PALETTE[(r() * PALETTE.length) | 0];
      const baseR = archetype === 'galaxy' ? 2.4 + r() * 1.4
        : archetype === 'dwarf' ? 0.6 + r() * 0.5
        : archetype === 'ringed' ? 1.5 + r() * 1.2
        : archetype === 'geodesic' ? 1.6 + r() * 1.8
        : 1.1 + r() * 1.7;

      nodes.push({
        id: `${word}-${i}`, word, category,
        x: +x.toFixed(2), y: +y.toFixed(2), z: +z.toFixed(2),
        archetype, color, radius: +baseR.toFixed(2),
        // per-planet breathing so the whole sky shimmers at different rates
        breathPhase: +(r() * Math.PI * 2).toFixed(3),
        breathSpeed: +(0.5 + r() * 1.1).toFixed(3),
        seed, status: 'locked',
      });
    });

    // adjacency by k-nearest (for "connections" + unlockable derivation)
    const adjacency = new Map(nodes.map((n) => [n.id, []]));
    const K = 3;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i]; const d = [];
      for (let j = 0; j < nodes.length; j++) { if (i === j) continue; const b = nodes[j]; d.push([(a.x-b.x)**2+(a.y-b.y)**2+(a.z-b.z)**2, j]); }
      d.sort((p, q) => p[0] - q[0]);
      for (let n = 0; n < K; n++) { const b = nodes[d[n][1]]; if (!adjacency.get(a.id).includes(b.id)) adjacency.get(a.id).push(b.id); }
    }
    // symmetric edges
    const edges = []; const seen = new Set();
    for (const [src, list] of adjacency) for (const tgt of list) { const key = [src, tgt].sort().join('|'); if (seen.has(key)) continue; seen.add(key); edges.push({ source: src, target: tgt }); }
    // make adjacency symmetric for navigation
    for (const e of edges) { if (!adjacency.get(e.target).includes(e.source)) adjacency.get(e.target).push(e.source); }

    const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));

    // seed a SMALL starting cluster — most of the sky begins dim, leaving room
    // for the learner to light it up (一个一个点亮).
    const rnd = mulberry32(99);
    const masteredIds = new Set();
    for (let r0 = 0; r0 < 2; r0++) {
      let cur = nodes[(rnd() * nodes.length) | 0].id;
      for (let s = 0; s < 4 && masteredIds.size < 7; s++) { masteredIds.add(cur); const ns = (adjacency.get(cur) || []).filter((x) => !masteredIds.has(x)); cur = ns.length ? ns[(rnd() * ns.length) | 0] : nodes[(rnd() * nodes.length) | 0].id; }
    }
    deriveStatuses(nodes, adjacency, masteredIds);
    return { nodes, edges, adjacency, byId, masteredIds, fieldR: FIELD_R };
  }

  function deriveStatuses(nodes, adjacency, masteredIds) {
    for (const n of nodes) {
      if (masteredIds.has(n.id)) { n.status = 'mastered'; continue; }
      const ns = adjacency.get(n.id) || [];
      n.status = ns.some((nb) => masteredIds.has(nb)) ? 'unlockable' : 'locked';
    }
  }

  window.LexiGalaxyData = {
    build, deriveStatuses,
    GLOSS: {
      noun: { en: 'a thing, place, or idea you can name', zh: '名词 · 可命名的事物或概念' },
      verb: { en: 'an action or process — something done', zh: '动词 · 表示动作或过程' },
      adj: { en: 'a quality describing how something is', zh: '形容词 · 描述性质或状态' },
    },
    ipaFor(w) { return '/' + w.replace(/[^a-z]/g, '').replace(/(.)(?=.)/g, '$1\u200a') + '/'; },
  };
})();
