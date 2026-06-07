/* ─────────────────────────────────────────────────────────────────────────
   Lexiverse Galaxy · celestial archetype library  (v2 — lit/dim + textures)
   Each word → a distinct procedural body with its own surface texture & style.
   Glow is a SMALL additive sprite that just hugs the planet (not a big bloom).
   Every body exposes { glows[], dimMats[], coreMats[] } so the scene can:
     · dim a LOCKED planet (still shows its base color, just darker)
     · light it on learn (brightness + a slightly larger breathing halo)
   Zero post-processing.
   ───────────────────────────────────────────────────────────────────────── */
(function () {
  let THREE = null;
  const geoCache = {};
  const texCache = {};
  let tightGlowTex = null, starTex = null;

  function g(key, make) { return geoCache[key] || (geoCache[key] = make()); }

  // ── Tight glow sprite: bright part hugs the body, thin falloff ───────────
  function tightGlow() {
    if (tightGlowTex) return tightGlowTex;
    const s = 128, c = document.createElement('canvas'); c.width = c.height = s;
    const ctx = c.getContext('2d');
    const grd = ctx.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
    grd.addColorStop(0.0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.28, 'rgba(255,255,255,0.90)');
    grd.addColorStop(0.50, 'rgba(255,255,255,0.36)');
    grd.addColorStop(1.0, 'rgba(255,255,255,0)');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, s, s);
    tightGlowTex = new THREE.CanvasTexture(c); return tightGlowTex;
  }
  function starTexture() {
    if (starTex) return starTex;
    const s = 64, c = document.createElement('canvas'); c.width = c.height = s;
    const ctx = c.getContext('2d');
    const grd = ctx.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
    grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.4, 'rgba(255,255,255,0.5)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, s, s);
    starTex = new THREE.CanvasTexture(c); return starTex;
  }

  // ── Procedural GRAYSCALE surface textures (tinted per-planet via material.color)
  function surfaceTexture(kind, variant) {
    const key = kind + variant;
    if (texCache[key]) return texCache[key];
    const w = 256, h = 128, c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    const rnd = mulberry(variant * 2654435761 >>> 0);
    ctx.fillStyle = '#8a8a8a'; ctx.fillRect(0, 0, w, h);

    if (kind === 'bands') {
      // gas-giant horizontal bands
      let y = 0;
      while (y < h) {
        const bh = 4 + rnd() * 14;
        const v = 90 + rnd() * 150 | 0;
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(0, y, w, bh);
        y += bh;
      }
      // soften with a couple of swirl ovals
      for (let i = 0; i < 5; i++) {
        ctx.globalAlpha = 0.18; ctx.fillStyle = rnd() > 0.5 ? '#fff' : '#444';
        ctx.beginPath(); ctx.ellipse(rnd()*w, rnd()*h, 18+rnd()*30, 5+rnd()*8, 0, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else if (kind === 'speckle') {
      // rocky / cratered
      for (let i = 0; i < 900; i++) {
        const v = 70 + rnd() * 170 | 0;
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        const r = 0.6 + rnd() * 2.2;
        ctx.beginPath(); ctx.arc(rnd()*w, rnd()*h, r, 0, 7); ctx.fill();
      }
    } else if (kind === 'swirl') {
      // marbled / cloudy
      for (let i = 0; i < 28; i++) {
        const v = 80 + rnd() * 160 | 0;
        ctx.strokeStyle = `rgba(${v},${v},${v},0.5)`; ctx.lineWidth = 2 + rnd() * 6;
        ctx.beginPath();
        const cx = rnd()*w, cy = rnd()*h, rad = 10 + rnd()*40;
        ctx.arc(cx, cy, rad, rnd()*7, rnd()*7); ctx.stroke();
      }
    } else if (kind === 'molten') {
      // glowing veins
      ctx.fillStyle = '#5a5a5a'; ctx.fillRect(0,0,w,h);
      for (let i = 0; i < 40; i++) {
        ctx.strokeStyle = `rgba(255,255,255,${0.3+rnd()*0.5})`; ctx.lineWidth = 1 + rnd()*2.5;
        ctx.beginPath(); let x = rnd()*w, y = rnd()*h; ctx.moveTo(x,y);
        for (let k=0;k<4;k++){ x += (rnd()-0.5)*60; y += (rnd()-0.5)*40; ctx.lineTo(x,y); } ctx.stroke();
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    texCache[key] = t; return t;
  }

  function mulberry(a){return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}

  // glow sprite tagged so the scene can breathe + grow it
  function glowSprite(color, scale) {
    const m = new THREE.SpriteMaterial({ map: tightGlow(), color, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
    const sp = new THREE.Sprite(m); sp.scale.setScalar(scale);
    sp.userData.glow = { base: scale };
    return sp;
  }
  function solidSphere(color, r, texKind, variant) {
    const matOpts = { color, transparent: true };
    if (texKind) matOpts.map = surfaceTexture(texKind, variant);
    const mat = new THREE.MeshBasicMaterial(matOpts);
    const mesh = new THREE.Mesh(g('sphere', () => new THREE.SphereGeometry(1, 24, 24)), mat);
    mesh.scale.setScalar(r);
    mat.userData = { dim: true, base: 1 };
    return mesh;
  }
  function coreDot(color, r) {
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true });
    const mesh = new THREE.Mesh(g('coreLow', () => new THREE.SphereGeometry(1, 12, 12)), mat);
    mesh.scale.setScalar(r); mat.userData = { core: true, base: 1 }; return mesh;
  }
  function wire(geoKey, geoMake, color, r, opacity) {
    const mat = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity });
    const mesh = new THREE.Mesh(g(geoKey, geoMake), mat); mesh.scale.setScalar(r);
    mat.userData = { dim: true, base: opacity }; return mesh;
  }
  function orbitRing(color, r, tilt, opacity) {
    const t = new THREE.Mesh(g('thinTorus', () => new THREE.TorusGeometry(1, 0.014, 8, 80)),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
    t.scale.setScalar(r); t.rotation.x = Math.PI/2 + tilt.x; t.rotation.y = tilt.y;
    t.material.userData = { dim: true, base: opacity }; return t;
  }
  const finish = (grp, pickR, spin, spinTarget) => ({ object3D: grp, pickR, spin, spinTarget: spinTarget || grp });

  // ── gas: banded gas giant (textured) ─────────────────────────────────────
  function buildGas(_T, radius, color, rnd) {
    const grp = new THREE.Group();
    grp.add(glowSprite(color, radius * 2.0));
    grp.add(solidSphere(color, radius, 'bands', (rnd()*9999)|0));
    grp.userData.spinObj = grp;
    return finish(grp, radius * 1.5, 0.18 + rnd()*0.18);
  }
  // ── rocky: cratered planet (textured) ────────────────────────────────────
  function buildRocky(_T, radius, color, rnd) {
    const grp = new THREE.Group();
    grp.add(glowSprite(color, radius * 1.8));
    grp.add(solidSphere(color, radius, 'speckle', (rnd()*9999)|0));
    return finish(grp, radius * 1.5, 0.12 + rnd()*0.15);
  }
  // ── molten: glowing-vein world ───────────────────────────────────────────
  function buildMolten(_T, radius, color, rnd) {
    const grp = new THREE.Group();
    grp.add(glowSprite(color, radius * 2.3));
    grp.add(solidSphere(color, radius, 'molten', (rnd()*9999)|0));
    grp.add(coreDot(0xffffff, radius * 0.2));
    return finish(grp, radius * 1.5, 0.1 + rnd()*0.12);
  }
  // ── geodesic: wireframe icosahedron + small core ─────────────────────────
  function buildGeodesic(_T, radius, color, rnd) {
    const grp = new THREE.Group();
    grp.add(glowSprite(color, radius * 2.2));
    grp.add(wire('ico1', () => new THREE.IcosahedronGeometry(1,1), color, radius, 0.85));
    grp.add(wire('ico0', () => new THREE.IcosahedronGeometry(1,0), color, radius*0.62, 0.4));
    grp.add(coreDot(0xffffff, radius * 0.22));
    if (rnd() > 0.4) grp.add(orbitRing(color, radius*1.5, { x:(rnd()-0.5)*2, y:rnd()*Math.PI }, 0.5));
    return finish(grp, radius * 1.6, 0.25 + rnd()*0.3);
  }
  // ── orb: smooth glow star ────────────────────────────────────────────────
  function buildOrb(_T, radius, color, rnd) {
    const grp = new THREE.Group();
    grp.add(glowSprite(color, radius * 2.4));
    grp.add(solidSphere(color, radius * 0.78, 'swirl', (rnd()*9999)|0));
    grp.add(coreDot(0xffffff, radius * 0.3));
    return finish(grp, radius * 1.6, 0.08 + rnd()*0.16);
  }
  // ── ringed: textured Saturn ──────────────────────────────────────────────
  function buildRinged(_T, radius, color, rnd) {
    const grp = new THREE.Group();
    grp.add(glowSprite(color, radius * 1.9));
    grp.add(solidSphere(color, radius * 0.85, 'bands', (rnd()*9999)|0));
    const ring = new THREE.Mesh(g('ring', () => new THREE.RingGeometry(1.35, 2.1, 64)),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
    ring.scale.setScalar(radius); ring.rotation.x = Math.PI/2.3 + (rnd()-0.5)*0.8; ring.rotation.y = (rnd()-0.5)*0.6;
    ring.material.userData = { dim: true, base: 0.55 }; grp.add(ring);
    return finish(grp, radius * 1.9, 0.14 + rnd()*0.2);
  }
  // ── galaxy: small spiral ─────────────────────────────────────────────────
  function buildGalaxy(_T, radius, color, rnd) {
    const grp = new THREE.Group();
    const N = 140, arms = 2, pos = new Float32Array(N*3), col = new Float32Array(N*3);
    const c1 = new THREE.Color(color), c2 = new THREE.Color(0xffffff);
    for (let i=0;i<N;i++){ const t=i/N; const ang=(i%arms)/arms*Math.PI*2 + t*Math.PI*3.2; const rad=t*radius*2.0; const sp=(rnd()-0.5)*radius*0.4*(1-t);
      pos[i*3]=Math.cos(ang)*rad+sp; pos[i*3+1]=(rnd()-0.5)*radius*0.3*(1-t); pos[i*3+2]=Math.sin(ang)*rad+sp;
      const cc=c2.clone().lerp(c1,t); col[i*3]=cc.r; col[i*3+1]=cc.g; col[i*3+2]=cc.b; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos,3)); geo.setAttribute('color', new THREE.BufferAttribute(col,3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: radius*0.42, map: starTexture(), vertexColors: true, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true }));
    pts.material.userData = { dim: true, base: 0.95 };
    pts.rotation.x = (rnd()-0.5)*1.4; pts.rotation.z = (rnd()-0.5)*1.0; grp.add(pts);
    grp.add(glowSprite(color, radius * 2.0));
    return finish(grp, radius * 1.7, 0.4 + rnd()*0.3, pts);
  }
  // ── crystal: wireframe gem ───────────────────────────────────────────────
  function buildCrystal(_T, radius, color, rnd) {
    const grp = new THREE.Group();
    grp.add(glowSprite(color, radius * 2.0));
    const geoKey = rnd() > 0.5 ? 'dodeca' : 'octa';
    grp.add(wire(geoKey, () => geoKey==='dodeca' ? new THREE.DodecahedronGeometry(1,0) : new THREE.OctahedronGeometry(1,0), color, radius, 0.82));
    grp.add(coreDot(0xffffff, radius * 0.26));
    return finish(grp, radius * 1.5, 0.3 + rnd()*0.4);
  }
  // ── dwarf: tiny soft star ────────────────────────────────────────────────
  function buildDwarf(_T, radius, color, rnd) {
    const grp = new THREE.Group();
    grp.add(glowSprite(color, radius * 2.6));
    grp.add(coreDot(color, radius * 0.7));
    grp.add(coreDot(0xffffff, radius * 0.34));
    return finish(grp, radius * 2.0, 0.02 + rnd()*0.06);
  }

  const BUILDERS = { gas: buildGas, rocky: buildRocky, molten: buildMolten, geodesic: buildGeodesic, orb: buildOrb, ringed: buildRinged, galaxy: buildGalaxy, crystal: buildCrystal, dwarf: buildDwarf };

  window.LexiPlanets = {
    init(t) { THREE = t; },
    build(arch, radius, color, rnd) { return (BUILDERS[arch] || buildOrb)(THREE, radius, color, rnd); },
    archetypes: Object.keys(BUILDERS),
  };
})();
