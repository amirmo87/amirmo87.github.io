/* =====================================================================
   Graph Theory Lab — graph-theory.js
   بخش ریاضیات گسسته: نظریه گراف
   -------------------------------------------------------------------
   Part 1  : الگوریتم‌های گراف (هم‌ریختی، همبندی، دوبخشی، مسطح، ...)
   Part 2  : شمارش همه گراف‌های غیرهم‌ریخت با n رأس و m یال و ویژگی‌های دلخواه
   Part 3  : نام‌گذاری ریاضی (K_n, C_n, P_n, K_{a,b}, W_n, ...)
   Part 4  : چیدمان (layout) و رسم SVG
   Part 5  : رابط کاربری
   ===================================================================== */
(function () {
  'use strict';

  const MAXN = 7;                       // حداکثر تعداد رأس (به‌خاطر سرعت)
  const pc = (x) => { let c = 0; while (x) { x &= x - 1; c++; } return c; };

  /* =================================================================
     Part 1 — Core graph algorithms
     گراف = { n, nb[], deg[], m }   (nb[i] = bitmask همسایه‌های رأس i)
     ================================================================= */
  function makeGraph(n, nb) {
    const deg = nb.map(pc);
    let s = 0; for (const d of deg) s += d;
    return { n, nb, deg, m: s / 2 };
  }
  function edgeList(n) {
    const E = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) E.push([i, j]);
    return E;
  }
  const adj = (g, i, j) => (g.nb[i] >> j) & 1;
  const sortedDeg = (g) => [...g.deg].sort((a, b) => b - a);

  function components(g) {
    const comps = []; let seen = 0;
    for (let s = 0; s < g.n; s++) {
      if ((seen >> s) & 1) continue;
      let comp = 1 << s, frontier = 1 << s;
      while (frontier) {
        let nxt = 0;
        for (let v = 0; v < g.n; v++) if ((frontier >> v) & 1) nxt |= g.nb[v];
        nxt &= ~comp; comp |= nxt; frontier = nxt;
      }
      seen |= comp; comps.push(comp);
    }
    return comps;
  }
  const isConnected = (g) => components(g).length === 1;

  function inducedSub(g, mask) {
    const idx = [];
    for (let v = 0; v < g.n; v++) if ((mask >> v) & 1) idx.push(v);
    const pos = {}; idx.forEach((v, i) => { pos[v] = i; });
    const nb = idx.map((v) => {
      let r = 0;
      for (const u of idx) if ((g.nb[v] >> u) & 1) r |= 1 << pos[u];
      return r;
    });
    return { g: makeGraph(idx.length, nb), idx };
  }
  function complement(g) {
    const full = (1 << g.n) - 1;
    return makeGraph(g.n, g.nb.map((x, i) => (~x) & full & ~(1 << i)));
  }

  function bipartition(g) {
    const col = new Array(g.n).fill(-1);
    for (let s = 0; s < g.n; s++) {
      if (col[s] !== -1) continue;
      col[s] = 0; const q = [s];
      while (q.length) {
        const v = q.pop();
        for (let u = 0; u < g.n; u++) if ((g.nb[v] >> u) & 1) {
          if (col[u] === -1) { col[u] = 1 - col[v]; q.push(u); }
          else if (col[u] === col[v]) return null;
        }
      }
    }
    return col;
  }
  function hasTriangle(g) {
    for (let i = 0; i < g.n; i++)
      for (let j = i + 1; j < g.n; j++)
        if (adj(g, i, j) && (g.nb[i] & g.nb[j])) return true;
    return false;
  }
  function girth(g) {
    let best = Infinity;
    for (let s = 0; s < g.n; s++) {
      const dist = new Array(g.n).fill(-1), par = new Array(g.n).fill(-1);
      dist[s] = 0; const q = [s];
      for (let qi = 0; qi < q.length; qi++) {
        const v = q[qi];
        for (let u = 0; u < g.n; u++) if ((g.nb[v] >> u) & 1) {
          if (dist[u] === -1) { dist[u] = dist[v] + 1; par[u] = v; q.push(u); }
          else if (par[v] !== u) best = Math.min(best, dist[v] + dist[u] + 1);
        }
      }
    }
    return best;
  }
  function diameter(g) {
    let best = 0;
    for (let s = 0; s < g.n; s++) {
      const dist = new Array(g.n).fill(-1); dist[s] = 0; const q = [s];
      for (let qi = 0; qi < q.length; qi++) {
        const v = q[qi];
        for (let u = 0; u < g.n; u++) if (((g.nb[v] >> u) & 1) && dist[u] === -1) { dist[u] = dist[v] + 1; q.push(u); }
      }
      for (const d of dist) { if (d === -1) return Infinity; best = Math.max(best, d); }
    }
    return best;
  }
  function isHamiltonian(g) {
    const n = g.n; if (n < 3) return false;
    const full = (1 << n) - 1;
    function dfs(v, vis) {
      if (vis === full) return ((g.nb[v] >> 0) & 1) === 1;
      for (let u = 1; u < n; u++)
        if (!((vis >> u) & 1) && ((g.nb[v] >> u) & 1) && dfs(u, vis | (1 << u))) return true;
      return false;
    }
    return dfs(0, 1);
  }
  const isEulerian = (g) => isConnected(g) && g.deg.every((d) => d % 2 === 0);

  function colorWith(g, k) {
    const col = new Array(g.n).fill(-1);
    const order = [...Array(g.n).keys()].sort((a, b) => g.deg[b] - g.deg[a]);
    function rec(i, maxUsed) {
      if (i === g.n) return true;
      const v = order[i];
      for (let c = 0; c <= Math.min(maxUsed + 1, k - 1); c++) {
        let ok = true;
        for (let u = 0; u < g.n; u++) if (((g.nb[v] >> u) & 1) && col[u] === c) { ok = false; break; }
        if (ok) { col[v] = c; if (rec(i + 1, Math.max(maxUsed, c))) return true; col[v] = -1; }
      }
      return false;
    }
    return rec(0, -1) ? col : null;
  }
  function chromatic(g) {
    for (let k = 1; k <= g.n; k++) { const c = colorWith(g, k); if (c) return { chi: k, coloring: c }; }
    return { chi: g.n, coloring: [...Array(g.n).keys()] };
  }

  /* هم‌ریختی (isomorphism) با backtracking */
  function isIso(g, h) {
    const n = g.n;
    if (n !== h.n || g.m !== h.m) return false;
    const map = new Array(n).fill(-1); let used = 0;
    function rec(i) {
      if (i === n) return true;
      for (let v = 0; v < n; v++) {
        if (((used >> v) & 1) || g.deg[i] !== h.deg[v]) continue;
        let ok = true;
        for (let j = 0; j < i; j++) {
          if (((g.nb[i] >> j) & 1) !== ((h.nb[v] >> map[j]) & 1)) { ok = false; break; }
        }
        if (!ok) continue;
        map[i] = v; used |= 1 << v;
        if (rec(i + 1)) return true;
        used &= ~(1 << v);
      }
      return false;
    }
    return rec(0);
  }
  function invKey(g) {
    const sig = [];
    for (let v = 0; v < g.n; v++) {
      const nd = [];
      for (let u = 0; u < g.n; u++) if ((g.nb[v] >> u) & 1) nd.push(g.deg[u]);
      nd.sort((a, b) => b - a);
      sig.push(g.deg[v] + ':' + nd.join(''));
    }
    sig.sort();
    return sig.join('|');
  }

  /* ---- مسطح بودن با قضیه‌ی واگنر: بدون مینور K5 و K3,3 ---- */
  const K5 = (() => { const nb = []; for (let i = 0; i < 5; i++) nb.push(31 & ~(1 << i)); return makeGraph(5, nb); })();
  const K33 = (() => {
    const nb = new Array(6).fill(0);
    for (let i = 0; i < 3; i++) for (let j = 3; j < 6; j++) { nb[i] |= 1 << j; nb[j] |= 1 << i; }
    return makeGraph(6, nb);
  })();
  function containsSubgraph(g, H) {
    const k = H.n; if (g.n < k) return false;
    const map = new Array(k).fill(-1); let used = 0;
    function rec(i) {
      if (i === k) return true;
      for (let v = 0; v < g.n; v++) {
        if ((used >> v) & 1) continue;
        let ok = true;
        for (let j = 0; j < i; j++) if (((H.nb[i] >> j) & 1) && !((g.nb[v] >> map[j]) & 1)) { ok = false; break; }
        if (ok) { map[i] = v; used |= 1 << v; if (rec(i + 1)) return true; used &= ~(1 << v); }
      }
      return false;
    }
    return rec(0);
  }
  function contract(g, a, b) {            // رأس b را در a ادغام می‌کند
    const n = g.n, idx = [];
    for (let v = 0; v < n; v++) if (v !== b) idx.push(v);
    const pos = {}; idx.forEach((v, i) => { pos[v] = i; });
    const remap = (mask) => { let r = 0; for (const v of idx) if ((mask >> v) & 1) r |= 1 << pos[v]; return r; };
    const nbs = idx.map((v) => {
      if (v === a) return remap((g.nb[a] | g.nb[b]) & ~(1 << a) & ~(1 << b));
      let mk = g.nb[v] & ~(1 << b);
      if ((g.nb[v] >> b) & 1) mk |= 1 << a;
      return remap(mk);
    });
    return makeGraph(n - 1, nbs);
  }
  const minorMemo = new Map();
  function hasMinor(g, H, tag) {
    const key = tag + ':' + g.n + ':' + g.nb.join(',');
    if (minorMemo.has(key)) return minorMemo.get(key);
    let res = false;
    if (g.n >= H.n && g.m >= H.m) {
      if (containsSubgraph(g, H)) res = true;
      else if (g.n > H.n) {
        outer: for (let a = 0; a < g.n; a++)
          for (let b = a + 1; b < g.n; b++)
            if (adj(g, a, b) && hasMinor(contract(g, a, b), H, tag)) { res = true; break outer; }
      }
    }
    minorMemo.set(key, res);
    return res;
  }
  function isPlanar(g) {
    if (g.n < 5) return true;
    if (g.n >= 3 && g.m > 3 * g.n - 6) return false;
    const comps = components(g);
    if (comps.length > 1) return comps.every((c) => isPlanar(inducedSub(g, c).g));
    return !hasMinor(g, K5, 'K5') && !hasMinor(g, K33, 'K33');
  }

  /* =================================================================
     Part 2 — Enumeration of non-isomorphic graphs
     ================================================================= */
  function quickReason(n, m, o) {
    const E = n * (n - 1) / 2;
    if (m > E) return String.raw`m>\binom{n}{2}`;
    if (o.regular != null) {
      if (o.regular > n - 1) return String.raw`k\le n-1\ \text{is violated}`;
      if (n * o.regular !== 2 * m) return String.raw`\text{handshake: } nk=2m\ \Rightarrow\ ${n}\cdot ${o.regular}\ne ${2 * m}`;
    }
    if ((o.connected || o.eulerian) && m < n - 1) return String.raw`\text{a connected graph needs } m\ge n-1=${n - 1}`;
    if (o.acyclic && m > n - 1) return String.raw`\text{a forest has } m\le n-1=${n - 1}`;
    if (o.hamiltonian && n < 3) return String.raw`\text{a Hamiltonian cycle needs } n\ge 3`;
    if (o.hamiltonian && m < n) return String.raw`\text{a Hamiltonian graph needs } m\ge n`;
    if (o.minDeg != null && 2 * m < n * o.minDeg) return String.raw`2m<n\,\delta\ \Rightarrow\ ${2 * m}<${n * o.minDeg}`;
    if (o.maxDeg != null && 2 * m > n * o.maxDeg) return String.raw`2m>n\,\Delta\ \Rightarrow\ ${2 * m}>${n * o.maxDeg}`;
    if (o.minDeg != null && o.maxDeg != null && o.minDeg > o.maxDeg) return String.raw`\delta>\Delta`;
    return null;
  }

  function enumerate(n, m, o) {
    o = o || {};
    const EL = edgeList(n), E = EL.length;
    if (m > E || quickReason(n, m, o)) return [];
    const buckets = new Map(), out = [];
    const needComps = o.connected || o.acyclic || o.eulerian;

    const process = (mask) => {
      const nb = new Array(n).fill(0);
      for (let k = 0; k < E; k++) if ((mask >> k) & 1) { const e = EL[k]; nb[e[0]] |= 1 << e[1]; nb[e[1]] |= 1 << e[0]; }
      const deg = nb.map(pc);
      for (const d of deg) {
        if (o.regular != null && d !== o.regular) return;
        if (o.minDeg != null && d < o.minDeg) return;
        if (o.maxDeg != null && d > o.maxDeg) return;
        if (o.eulerian && (d & 1)) return;
      }
      const g = { n, nb, deg, m };
      if (needComps) {
        const c = components(g).length;
        if ((o.connected || o.eulerian) && c !== 1) return;
        if (o.acyclic && m - n + c !== 0) return;
      }
      if (o.bipartite && !bipartition(g)) return;
      if (o.triangleFree && hasTriangle(g)) return;
      const key = invKey(g);
      let b = buckets.get(key);
      if (!b) { b = []; buckets.set(key, b); }
      for (const h of b) if (isIso(g, h)) return;
      b.push(g); out.push(g);
    };

    if (m === 0) process(0);
    else {
      let x = (1 << m) - 1; const limit = 1 << E;
      for (;;) {
        process(x);
        const c = x & -x, r = x + c;
        x = (((r ^ x) >>> 2) / c) | r;
        if (x >= limit || x < 0) break;
      }
    }
    let res = out;
    if (o.planar) res = res.filter(isPlanar);
    if (o.hamiltonian) res = res.filter(isHamiltonian);
    return res;
  }

  /* =================================================================
     Part 3 — Naming (نام‌گذاری ریاضی)
     ================================================================= */
  const isCycleGraph = (g) => g.n >= 3 && g.deg.every((d) => d === 2) && isConnected(g);
  const isPathGraph = (g) => g.n >= 2 && isConnected(g) && g.m === g.n - 1 && Math.max(...g.deg) <= 2;
  const isTreeGraph = (g) => isConnected(g) && g.m === g.n - 1;

  function multipartite(g) {                 // آیا چندبخشی کامل است؟
    const comps = components(complement(g));
    for (const p of comps) for (let v = 0; v < g.n; v++) if (((p >> v) & 1) && (g.nb[v] & p)) return null;
    return comps.map((p) => pc(p)).sort((a, b) => a - b);
  }
  let DICT = null;
  function buildDict() {
    DICT = [];
    const fromE = (n, E) => {
      const nb = new Array(n).fill(0);
      E.forEach(([a, b]) => { nb[a] |= 1 << b; nb[b] |= 1 << a; });
      return makeGraph(n, nb);
    };
    const add = (n, E, tex, aka) => DICT.push({ g: fromE(n, E), tex, aka });
    for (let k = 3; k <= 6; k++) for (let l = 1; k + l <= MAXN; l++) {
      const E = []; for (let i = 0; i < k; i++) E.push([i, (i + 1) % k]);
      E.push([0, k]); for (let j = 1; j < l; j++) E.push([k + j - 1, k + j]);
      let aka = 'tadpole graph (cycle with a tail)';
      if (k === 3 && l === 1) aka = 'paw graph';
      if (k === 4 && l === 1) aka = 'banner graph';
      add(k + l, E, `T_{${k},${l}}`, aka);
    }
    add(5, [[0, 1], [1, 2], [2, 0], [0, 3], [1, 4]], String.raw`\mathrm{Bull}`, 'bull graph');
    add(5, [[0, 1], [0, 2], [0, 3], [0, 4], [1, 2]], String.raw`\mathrm{Cricket}`, 'cricket graph');
    add(5, [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [1, 4]], String.raw`\mathrm{House}`, 'house graph  (C₄ with a roof)');
    add(5, [[0, 1], [0, 2], [1, 2], [1, 3], [2, 3], [3, 4]], String.raw`\mathrm{Kite}`, 'kite graph');
    add(5, [[0, 1], [0, 2], [1, 2], [1, 3], [2, 3], [1, 4]], String.raw`\mathrm{Dart}`, 'dart graph');
    add(6, [[0, 1], [1, 2], [2, 0], [3, 4], [4, 5], [5, 3], [0, 3], [1, 4], [2, 5]], String.raw`Y_3`, 'triangular prism  (C₃ □ K₂)');
    add(6, [[0, 1], [1, 2], [2, 0], [0, 3], [1, 4], [2, 5]], String.raw`\mathrm{Net}`, 'net graph');
    add(6, [[0, 1], [1, 2], [2, 0], [3, 4], [4, 5], [5, 3], [2, 3]], String.raw`B_{3,3}`, 'barbell graph');
    add(6, [[0, 1], [1, 2], [3, 4], [4, 5], [0, 3], [1, 4], [2, 5]], String.raw`L_3`, 'domino  (ladder P₂ □ P₃)');
    add(6, [[0, 1], [1, 2], [2, 0], [3, 0], [3, 1], [4, 1], [4, 2], [5, 2], [5, 0]], String.raw`\mathrm{Sun}_3`, '3-sun graph');
    add(7, [[0, 1], [0, 2], [1, 2], [1, 3], [2, 3], [0, 4], [0, 5], [4, 5], [4, 6], [5, 6], [3, 6]],
      String.raw`\mathrm{Moser}`, 'Moser spindle  (unit-distance graph, χ = 4)');
  }
  function dictLookup(g) {
    if (!DICT) buildDict();
    for (const e of DICT) if (e.g.n === g.n && e.g.m === g.m && isIso(e.g, g)) return e;
    return null;
  }
  function walkOrder(g, start) {            // DFS از یک رأس
    const seen = new Set(), order = [];
    (function dfs(v) {
      seen.add(v); order.push(v);
      for (let u = 0; u < g.n; u++) if (adj(g, v, u) && !seen.has(u)) dfs(u);
    })(start);
    return order;
  }

  // idx = null  =>  نام موقت بدون شماره (برای مؤلفه‌ها)
  function nameConnected(g, idx) {
    const n = g.n, m = g.m;
    if (n === 1) return { tex: 'K_1', aka: 'trivial graph', named: true };
    if (n === 2) return { tex: 'K_2', aka: 'a single edge', named: true };

    const mp = multipartite(g);
    if (mp) {
      const r = mp.length;
      if (mp.every((x) => x === 1)) {
        const aka = n === 3 ? 'complete graph = triangle' : n === 4 ? 'complete graph (tetrahedron)' : 'complete graph';
        return { tex: n === 3 ? 'K_3 = C_3' : `K_{${n}}`, aka, named: true };
      }
      if (r === 2) {
        const [a, b] = mp;
        let aka = 'complete bipartite graph';
        if (a === 1 && b === 2) aka = 'path P₃  (cherry)';
        else if (a === 1 && b === 3) aka = 'claw';
        else if (a === 1) aka = 'star graph';
        else if (a === 2 && b === 2) aka = 'square';
        else if (a === 3 && b === 3) aka = 'utility graph  (K₃,₃)';
        return { tex: a === 2 && b === 2 ? 'K_{2,2} = C_4' : `K_{${a},${b}}`, aka, named: true };
      }
      let aka = 'complete multipartite graph';
      const key = mp.join(',');
      if (key === '1,1,2') aka = 'diamond graph  (K₄ − e)';
      else if (key === '2,2,2') aka = 'octahedron graph';
      else if (key === '1,2,2') aka = 'wheel W₅  (K₁ ∨ C₄)';
      else if (mp[0] === 1 && mp[1] === 1) aka = 'book graph  (triangles sharing an edge)';
      else if (mp[r - 1] - mp[0] <= 1) aka = `Turán graph T(${n},${r})`;
      return { tex: `K_{${mp.join(',')}}`, aka, named: true };
    }
    if (isCycleGraph(g)) return { tex: `C_{${n}}`, aka: 'cycle graph', named: true };
    if (isPathGraph(g)) return { tex: `P_{${n}}`, aka: 'path graph', named: true };

    const hub = g.deg.indexOf(n - 1);
    if (hub >= 0 && n >= 5) {
      const rest = inducedSub(g, ((1 << n) - 1) & ~(1 << hub)).g;
      if (isCycleGraph(rest)) return { tex: `W_{${n}}`, aka: 'wheel graph  (K₁ ∨ C)', named: true };
      if (isPathGraph(rest)) return { tex: `F_{1,${n - 1}}`, aka: n === 5 ? 'gem graph  (fan)' : 'fan graph  (K₁ ∨ P)', named: true };
      if (rest.deg.every((d) => d === 1)) {
        const k = (n - 1) / 2;
        return { tex: `F_{${k}}`, aka: k === 2 ? 'friendship graph = butterfly (bowtie)' : 'friendship graph  (windmill)', named: true };
      }
    }
    const e = dictLookup(g);
    if (e) return { tex: e.tex, aka: e.aka, named: true };

    if (m === n - 1) {                       // درخت
      const internal = []; for (let v = 0; v < n; v++) if (g.deg[v] > 1) internal.push(v);
      const big = []; for (let v = 0; v < n; v++) if (g.deg[v] >= 3) big.push(v);
      if (big.length === 1) {
        const c = big[0], legs = [];
        for (let u = 0; u < n; u++) if (adj(g, c, u)) {
          let len = 1, prev = c, cur = u;
          while (g.deg[cur] === 2) {
            let nxt = -1; for (let w = 0; w < n; w++) if (adj(g, cur, w) && w !== prev) nxt = w;
            prev = cur; cur = nxt; len++;
          }
          legs.push(len);
        }
        legs.sort((a, b) => b - a);
        return { tex: `S(${legs.join(',')})`, aka: 'spider  (subdivided star)', named: true };
      }
      if (internal.length === 2 && adj(g, internal[0], internal[1])) {
        const a = g.deg[internal[0]] - 1, b = g.deg[internal[1]] - 1;
        return { tex: `S_{${Math.min(a, b)},${Math.max(a, b)}}`, aka: 'double star', named: true };
      }
      const leavesRemoved = inducedSub(g, ((1 << n) - 1) & ~g.deg.reduce((acc, d, v) => acc | (d === 1 ? 1 << v : 0), 0)).g;
      const cat = leavesRemoved.n >= 1 && isConnected(leavesRemoved) && Math.max(...leavesRemoved.deg) <= 2;
      return { tex: idx == null ? `T_{${n}}` : String.raw`T_{${n}}^{(${idx})}`, aka: cat ? 'caterpillar tree' : 'tree', named: false };
    }
    if (n >= 5 && isCycleGraph(complement(g))) return { tex: String.raw`\overline{C_{${n}}}`, aka: 'complement of a cycle', named: true };

    const beta = m - n + 1;
    const aka = beta === 1 ? 'unicyclic graph' : beta === 2 ? 'bicyclic graph' : `cyclomatic number β = ${beta}`;
    return { tex: idx == null ? `H_{${n},${m}}` : String.raw`G_{${n},${m}}^{(${idx})}`, aka, named: false };
  }

  function nameGraph(g, idx) {
    const comps = components(g);
    if (comps.length === 1) return nameConnected(g, idx);
    if (comps.length === g.n) return { tex: String.raw`\overline{K_{${g.n}}}`, aka: 'empty (edgeless) graph', named: true };
    const groups = new Map();
    for (const c of comps) {
      const sub = inducedSub(g, c).g;
      const nm = nameConnected(sub, null);
      const t = nm.tex.split('=')[0].trim();
      const o = groups.get(t) || { t, cnt: 0, n: sub.n };
      o.cnt++; groups.set(t, o);
    }
    const arr = [...groups.values()].sort((a, b) => b.n - a.n || (a.t < b.t ? -1 : 1));
    const tex = arr.map((o) => (o.cnt > 1 ? o.cnt : '') + o.t).join(String.raw` \sqcup `);
    const forest = m0(g) === g.n - comps.length;
    return { tex, aka: (forest ? 'forest' : 'disconnected graph') + ` · c(G) = ${comps.length}`, named: true };
  }
  const m0 = (g) => g.m;

  /* =================================================================
     Part 4 — Layout + SVG
     ================================================================= */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function normalize(pos) {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const p of pos) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    let s = Math.max(x1 - x0, y1 - y0) / 2; if (s < 1e-6) s = 1;
    return pos.map((p) => [(p[0] - cx) / s, (p[1] - cy) / s]);
  }
  function forceLayout(g, seed) {
    const n = g.n, rng = mulberry32(seed);
    let pos = [];
    for (let i = 0; i < n; i++) { const a = 2 * Math.PI * i / n + (rng() - 0.5) * 0.9, r = 0.5 + 0.5 * rng(); pos.push([Math.cos(a) * r, Math.sin(a) * r]); }
    const k = 0.85; let t = 0.5;
    for (let it = 0; it < 260; it++) {
      const d = pos.map(() => [0, 0]);
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        let dx = pos[i][0] - pos[j][0], dy = pos[i][1] - pos[j][1];
        const dist = Math.max(Math.hypot(dx, dy), 0.01), f = k * k / dist;
        dx /= dist; dy /= dist;
        d[i][0] += dx * f; d[i][1] += dy * f; d[j][0] -= dx * f; d[j][1] -= dy * f;
      }
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (adj(g, i, j)) {
        let dx = pos[i][0] - pos[j][0], dy = pos[i][1] - pos[j][1];
        const dist = Math.max(Math.hypot(dx, dy), 0.01), f = dist * dist / k;
        dx /= dist; dy /= dist;
        d[i][0] -= dx * f; d[i][1] -= dy * f; d[j][0] += dx * f; d[j][1] += dy * f;
      }
      for (let i = 0; i < n; i++) {
        const len = Math.max(Math.hypot(d[i][0], d[i][1]), 1e-9), lim = Math.min(len, t);
        pos[i][0] = Math.max(-1.5, Math.min(1.5, pos[i][0] + d[i][0] / len * lim));
        pos[i][1] = Math.max(-1.5, Math.min(1.5, pos[i][1] + d[i][1] / len * lim));
      }
      t *= 0.985;
    }
    return normalize(pos);
  }
  function segCross(p1, p2, p3, p4) {
    const o = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const d1 = o(p3, p4, p1), d2 = o(p3, p4, p2), d3 = o(p1, p2, p3), d4 = o(p1, p2, p4);
    return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
  }
  function distPtSeg(p, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy;
    let t = L ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
  }
  function scoreLayout(g, pos) {
    const E = []; for (let i = 0; i < g.n; i++) for (let j = i + 1; j < g.n; j++) if (adj(g, i, j)) E.push([i, j]);
    let cr = 0;
    for (let a = 0; a < E.length; a++) for (let b = a + 1; b < E.length; b++) {
      const [u, v] = E[a], [x, y] = E[b];
      if (u === x || u === y || v === x || v === y) continue;
      if (segCross(pos[u], pos[v], pos[x], pos[y])) cr++;
    }
    let minD = Infinity;
    for (let i = 0; i < g.n; i++) for (let j = i + 1; j < g.n; j++) minD = Math.min(minD, Math.hypot(pos[i][0] - pos[j][0], pos[i][1] - pos[j][1]));
    let clr = Infinity;
    for (let v = 0; v < g.n; v++) for (const [x, y] of E) if (x !== v && y !== v) clr = Math.min(clr, distPtSeg(pos[v], pos[x], pos[y]));
    return cr * 100 - Math.min(minD, 0.8) * 10 - Math.min(clr, 0.5) * 10;
  }
  function polygon(order) {
    const n = order.length, pos = new Array(n);
    order.forEach((v, i) => { const a = -Math.PI / 2 + 2 * Math.PI * i / n; pos[v] = [Math.cos(a), Math.sin(a)]; });
    return pos;
  }
  function treeLayout(g) {
    const n = g.n; let root = 0, bestE = Infinity;
    for (let s = 0; s < n; s++) {
      const dist = new Array(n).fill(-1); dist[s] = 0; const q = [s];
      for (let qi = 0; qi < q.length; qi++) for (let u = 0; u < n; u++) if (adj(g, q[qi], u) && dist[u] < 0) { dist[u] = dist[q[qi]] + 1; q.push(u); }
      const e = Math.max(...dist); if (e < bestE) { bestE = e; root = s; }
    }
    const ch = Array.from({ length: n }, () => []), depth = new Array(n).fill(0);
    (function dfs(v, p) { for (let u = 0; u < n; u++) if (adj(g, v, u) && u !== p) { depth[u] = depth[v] + 1; ch[v].push(u); dfs(u, v); } })(root, -1);
    const xs = new Array(n).fill(0); let leaf = 0;
    (function place(v) {
      if (!ch[v].length) { xs[v] = leaf++; return; }
      ch[v].forEach(place); xs[v] = (xs[ch[v][0]] + xs[ch[v][ch[v].length - 1]]) / 2;
    })(root);
    const maxD = Math.max(...depth);
    return xs.map((x, v) => [leaf > 1 ? -1 + 2 * x / (leaf - 1) : 0, maxD > 0 ? -0.9 + 1.8 * depth[v] / maxD : 0]);
  }
  function layoutConnected(g) {
    const n = g.n;
    if (n === 1) return [[0, 0]];
    if (n === 2) return [[-0.7, 0], [0.7, 0]];
    const mp = multipartite(g);
    if (isCycleGraph(g) || (mp && mp.every((x) => x === 1))) return polygon(walkOrder(g, 0));
    if (isPathGraph(g)) {
      const start = g.deg.indexOf(1), order = walkOrder(g, start), pos = new Array(n);
      order.forEach((v, i) => { pos[v] = [-1 + 2 * i / (n - 1), 0]; });
      return pos;
    }
    const hub = g.deg.indexOf(n - 1);
    if (hub >= 0) {
      const restMask = ((1 << n) - 1) & ~(1 << hub), pos = new Array(n); pos[hub] = [0, 0];
      const order = []; let seen = 1 << hub;
      for (let v = 0; v < n; v++) {
        if ((seen >> v) & 1) continue;
        let comp = 1 << v, fr = 1 << v;
        while (fr) { let nx = 0; for (let w = 0; w < n; w++) if ((fr >> w) & 1) nx |= g.nb[w] & restMask; nx &= ~comp; comp |= nx; fr = nx; }
        seen |= comp;
        let start = -1, bd = 99;
        for (let w = 0; w < n; w++) if ((comp >> w) & 1) { const d = pc(g.nb[w] & restMask); if (d < bd) { bd = d; start = w; } }
        const sub = new Set(), loc = [];
        (function dfs(x) { sub.add(x); loc.push(x); for (let y = 0; y < n; y++) if (((comp >> y) & 1) && adj(g, x, y) && !sub.has(y)) dfs(y); })(start);
        order.push(...loc);
      }
      order.forEach((v, i) => { const a = -Math.PI / 2 + 2 * Math.PI * i / order.length; pos[v] = [Math.cos(a), Math.sin(a)]; });
      return pos;
    }
    if (mp && mp.length === 2) {
      const col = bipartition(g), A = [], B = [];
      for (let v = 0; v < n; v++) (col[v] === 0 ? A : B).push(v);
      if (A.length === 3 && B.length === 3) { return polygon([A[0], B[0], A[1], B[1], A[2], B[2]]); }
      const pos = new Array(n);
      A.forEach((v, i) => { pos[v] = [-0.75, A.length > 1 ? -0.9 + 1.8 * i / (A.length - 1) : 0]; });
      B.forEach((v, i) => { pos[v] = [0.75, B.length > 1 ? -0.9 + 1.8 * i / (B.length - 1) : 0]; });
      return pos;
    }
    if (isTreeGraph(g)) return treeLayout(g);
    let best = polygon(walkOrder(g, 0)), bestS = scoreLayout(g, best);
    for (let seed = 1; seed <= 24; seed++) {
      const p = forceLayout(g, seed * 7919), s = scoreLayout(g, p);
      if (s < bestS) { bestS = s; best = p; }
    }
    return best;
  }
  function layoutGraph(g) {
    const comps = components(g);
    const items = comps.map((c) => { const { g: sub, idx } = inducedSub(g, c); return { idx, pos: layoutConnected(sub), n: sub.n }; })
      .sort((a, b) => b.n - a.n);
    const pos = new Array(g.n);
    if (items.length === 1) { items[0].idx.forEach((v, i) => { pos[v] = items[0].pos[i]; }); return pos; }
    const c = items.length, cols = c <= 3 ? c : Math.ceil(Math.sqrt(c)), rows = Math.ceil(c / cols);
    const cw = 2 / cols, ch = 2 / rows, s = 0.8 * Math.min(cw, ch) / 2;
    items.forEach((it, i) => {
      const col = i % cols, row = Math.floor(i / cols), cx = -1 + cw * (col + 0.5), cy = -1 + ch * (row + 0.5);
      it.idx.forEach((v, j) => { pos[v] = [cx + it.pos[j][0] * s, cy + it.pos[j][1] * s]; });
    });
    return pos;
  }

  const DEG_COLORS = ['#8b93a8', '#5fd4c5', '#7fb4ff', '#a99bff', '#e8c872', '#ffa66b', '#ff7b8c'];
  const COL_COLORS = ['#ff7b8c', '#5fd4c5', '#e8c872', '#a99bff', '#7fb4ff', '#ffa66b', '#b8e986'];

  function drawSVG(g, pos, mode, coloring) {
    const S = 240, c = S / 2, R = c - 36;
    const P = pos.map((p) => [c + p[0] * R, c + p[1] * R]);
    let s = `<svg class="gt-svg" viewBox="0 0 ${S} ${S}" role="img" aria-label="graph with ${g.n} vertices and ${g.m} edges">`;
    s += '<g class="edges">';
    for (let i = 0; i < g.n; i++) for (let j = i + 1; j < g.n; j++) if (adj(g, i, j))
      s += `<line class="e" data-u="${i}" data-v="${j}" x1="${P[i][0].toFixed(1)}" y1="${P[i][1].toFixed(1)}" x2="${P[j][0].toFixed(1)}" y2="${P[j][1].toFixed(1)}"/>`;
    s += '</g><g class="verts">';
    for (let i = 0; i < g.n; i++) {
      const fill = mode === 'color' ? COL_COLORS[coloring[i] % COL_COLORS.length] : DEG_COLORS[Math.min(g.deg[i], 6)];
      s += `<g class="vtx" data-v="${i}" style="--d:${i * 45}ms">` +
        `<circle class="ring" cx="${P[i][0].toFixed(1)}" cy="${P[i][1].toFixed(1)}" r="18"/>` +
        `<circle class="dot" cx="${P[i][0].toFixed(1)}" cy="${P[i][1].toFixed(1)}" r="13" style="fill:${fill}"/>` +
        `<text class="vl" x="${P[i][0].toFixed(1)}" y="${(P[i][1] + 1).toFixed(1)}" text-anchor="middle" dominant-baseline="central">v<tspan class="sb" dy="3.5">${i + 1}</tspan></text></g>`;
    }
    return s + '</g></svg>';
  }

  /* =================================================================
     Part 5 — UI
     ================================================================= */
  const PROPS = [
    { id: 'connected',    label: 'Connected',     tex: String.raw`c(G)=1` },
    { id: 'acyclic',      label: 'Acyclic',       tex: String.raw`\beta(G)=0` },
    { id: 'bipartite',    label: 'Bipartite',     tex: String.raw`\chi(G)\le 2` },
    { id: 'triangleFree', label: 'Triangle-free', tex: String.raw`K_3\not\subseteq G` },
    { id: 'planar',       label: 'Planar',        tex: String.raw`K_5,K_{3,3}\not\preceq G` },
    { id: 'eulerian',     label: 'Eulerian',      tex: String.raw`\forall v:\ 2\mid\deg v` },
    { id: 'hamiltonian',  label: 'Hamiltonian',   tex: String.raw`C_n\subseteq G` },
    { id: 'regular',      label: 'Regular',       tex: String.raw`\delta=\Delta=k`, param: { key: 'k', min: 0, max: 6 } },
    { id: 'minDeg',       label: 'Min degree',    tex: String.raw`\delta(G)\ge a`,  param: { key: 'a', min: 0, max: 6 } },
    { id: 'maxDeg',       label: 'Max degree',    tex: String.raw`\Delta(G)\le b`,  param: { key: 'b', min: 0, max: 6 } },
  ];
  const state = { n: 6, m: 7, on: { connected: true }, p: { k: 2, a: 1, b: 3 }, mode: 'deg', shown: 0, list: [], token: 0 };
  const PAGE = 24;

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function tex(s, display) {
    if (typeof katex !== 'undefined') { try { return katex.renderToString(s, { throwOnError: false, displayMode: !!display }); } catch (e) { /* fallthrough */ } }
    return `<span class="gt-fallback">${esc(s)}</span>`;
  }
  const $ = (sel, root) => (root || document).querySelector(sel);
  const maxM = (n) => n * (n - 1) / 2;

  function currentOpts() {
    const o = {};
    PROPS.forEach((p) => { if (state.on[p.id] && !p.param) o[p.id] = true; });
    o.regular = state.on.regular ? state.p.k : null;
    o.minDeg = state.on.minDeg ? state.p.a : null;
    o.maxDeg = state.on.maxDeg ? state.p.b : null;
    return o;
  }

  function statementTex(n, m, o) {
    const c = [String.raw`|V|=${n}`, String.raw`|E|=${m}`];
    if (o.connected) c.push(String.raw`c(G)=1`);
    if (o.acyclic) c.push(String.raw`\beta(G)=0`);
    if (o.bipartite) c.push(String.raw`\chi(G)\le 2`);
    if (o.triangleFree) c.push(String.raw`K_3\not\subseteq G`);
    if (o.planar) c.push(String.raw`G\text{ is planar}`);
    if (o.eulerian) c.push(String.raw`G\text{ is Eulerian}`);
    if (o.hamiltonian) c.push(String.raw`G\text{ is Hamiltonian}`);
    if (o.regular != null) c.push(String.raw`G\text{ is }${o.regular}\text{-regular}`);
    if (o.minDeg != null) c.push(String.raw`\delta(G)\ge ${o.minDeg}`);
    if (o.maxDeg != null) c.push(String.raw`\Delta(G)\le ${o.maxDeg}`);
    return String.raw`\mathcal{G}\;=\;\Bigl\{\,G=(V,E)\ \Big|\ ${c.join(String.raw`,\ `)}\,\Bigr\}\Big/{\cong}`;
  }

  function buildChips() {
    const host = $('#gt-chips');
    host.innerHTML = PROPS.map((p) => {
      const on = !!state.on[p.id];
      const mini = p.param
        ? `<span class="gt-mini" data-key="${p.param.key}"><button type="button" data-act="mdec" aria-label="decrease ${p.param.key}">−</button><output>${p.param.key} = ${state.p[p.param.key]}</output><button type="button" data-act="minc" aria-label="increase ${p.param.key}">+</button></span>`
        : '';
      return `<div class="gt-chip${on ? ' on' : ''}" data-id="${p.id}">` +
        `<button type="button" class="gt-chip-btn" aria-pressed="${on}"><span class="gt-chip-name">${p.label}</span><span class="gt-chip-tex">${tex(p.tex)}</span></button>${on ? mini : ''}</div>`;
    }).join('');
  }

  function syncControls() {
    $('#out-n').textContent = state.n;
    $('#out-m').textContent = state.m;
    $('#range-m').innerHTML = tex(String.raw`0\le m\le\binom{n}{2}=${maxM(state.n)}`);
    $('#gt-mode-deg').setAttribute('aria-pressed', state.mode === 'deg');
    $('#gt-mode-color').setAttribute('aria-pressed', state.mode === 'color');
  }

  function renderStatement(count, reason) {
    const n = state.n, m = state.m, o = currentOpts();
    let html = `<div class="gt-thm-label">Problem</div><div class="gt-eq">${tex(statementTex(n, m, o), true)}</div><div class="gt-facts">`;
    const facts = [String.raw`\sum_{v\in V}\deg(v)=2m=${2 * m}`, String.raw`\bar d=\frac{2m}{n}=${(2 * m / n).toFixed(2)}`];
    if (n > 1) facts.push(String.raw`\rho=\frac{m}{\binom{n}{2}}=${(m / maxM(n)).toFixed(3)}`);
    facts.push(String.raw`\bigl|\mathcal{G}\bigr|=${count}`);
    html += facts.map((f) => `<span class="gt-fact">${tex(f)}</span>`).join('') + '</div>';
    if (count === 0) html += `<div class="gt-empty">${tex(String.raw`\mathcal{G}=\varnothing`)}<span>${reason ? tex(reason) : 'no graph satisfies all of these constraints'}</span></div>`;
    $('#gt-statement').innerHTML = html;
  }

  function statsOf(g) {
    const comps = components(g).length, ch = chromatic(g), gi = girth(g), dm = diameter(g);
    return {
      comps, beta: g.m - g.n + comps, chi: ch.chi, coloring: ch.coloring, girth: gi, diam: dm,
      planar: isPlanar(g), euler: isEulerian(g), ham: isHamiltonian(g), bip: !!bipartition(g),
      tree: comps === 1 && g.m === g.n - 1, forest: g.m === g.n - comps,
      reg: g.deg.every((d) => d === g.deg[0]) ? g.deg[0] : null,
    };
  }
  const inf = (x) => (x === Infinity ? String.raw`\infty` : x);

  function cardHTML(g, idx) {
    const st = statsOf(g), pos = layoutGraph(g), nm = g.__name;
    const badges = [];
    if (st.tree) badges.push('tree'); else if (st.forest) badges.push('forest');
    if (st.bip) badges.push('bipartite');
    if (st.planar) badges.push('planar');
    if (st.euler) badges.push('Eulerian');
    if (st.ham) badges.push('Hamiltonian');
    if (st.reg != null && g.n > 1) badges.push(`${st.reg}-regular`);
    const ds = sortedDeg(g).join(',');
    return `<article class="gt-card" style="--i:${idx % PAGE}" data-i="${idx}">
      <div class="gt-card-top"><span class="gt-no">№ ${String(idx + 1).padStart(2, '0')}</span><span class="gt-nm">${tex(String.raw`|V|=${g.n},\ |E|=${g.m}`)}</span></div>
      <div class="gt-frame">${drawSVG(g, pos, state.mode, st.coloring)}</div>
      <div class="gt-name">${tex(nm.tex)}</div>
      <div class="gt-aka">${esc(nm.aka)}</div>
      <div class="gt-stats">
        <span>${tex(String.raw`\deg=(${ds})`)}</span>
        <span>${tex(String.raw`\delta=${Math.min(...g.deg)},\ \Delta=${Math.max(...g.deg)}`)}</span>
        <span>${tex(String.raw`c=${st.comps},\ \beta=${st.beta}`)}</span>
        <span>${tex(String.raw`\chi=${st.chi}`)}</span>
        <span>${tex(String.raw`\operatorname{diam}=${inf(st.diam)},\ g=${inf(st.girth)}`)}</span>
      </div>
      <div class="gt-badges">${badges.map((b) => `<i>${b}</i>`).join('')}</div>
    </article>`;
  }

  function renderLegend() {
    const host = $('#gt-legend');
    if (state.mode === 'deg') {
      host.innerHTML = '<span class="gt-leg-t">vertex colour = </span>' + tex(String.raw`\deg(v)`) + ' : ' +
        DEG_COLORS.map((c, d) => `<span class="gt-sw"><b style="background:${c}"></b>${d}</span>`).join('');
    } else {
      host.innerHTML = '<span class="gt-leg-t">vertex colour = a proper colouring </span>' + tex(String.raw`c:V\to\{1,\dots,\chi(G)\}`) +
        '<span class="gt-leg-t"> using the minimum number of colours</span>';
    }
  }

  function showMore() {
    const grid = $('#gt-grid');
    const end = Math.min(state.shown + PAGE, state.list.length);
    let html = '';
    for (let i = state.shown; i < end; i++) html += cardHTML(state.list[i], i);
    grid.insertAdjacentHTML('beforeend', html);
    state.shown = end;
    const btn = $('#gt-more');
    btn.hidden = state.shown >= state.list.length;
    btn.textContent = `Show more  (${state.list.length - state.shown} remaining)`;
  }

  function run() {
    const token = ++state.token;
    syncControls(); renderLegend();
    $('#gt-grid').classList.add('busy'); $('#gt-busy').hidden = false;
    setTimeout(() => {
      if (token !== state.token) return;
      const o = currentOpts();
      let list = enumerate(state.n, state.m, o);
      list.forEach((g) => { g.__c = components(g).length; g.__ds = sortedDeg(g).join(''); });
      list.sort((a, b) => a.__c - b.__c || (a.__ds < b.__ds ? 1 : a.__ds > b.__ds ? -1 : 0));
      let k = 0;
      list.forEach((g) => { g.__name = nameGraph(g, k + 1); if (!g.__name.named) k++; });
      list = list.map((g, i) => ({ g, i })).sort((a, b) => (b.g.__name.named - a.g.__name.named) || a.i - b.i).map((x) => x.g);
      state.list = list; state.shown = 0;
      $('#gt-grid').innerHTML = '';
      renderStatement(list.length, quickReason(state.n, state.m, o));
      showMore();
      $('#gt-grid').classList.remove('busy'); $('#gt-busy').hidden = true;
    }, 30);
  }

  function clampState() {
    state.n = Math.max(1, Math.min(MAXN, state.n));
    state.m = Math.max(0, Math.min(maxM(state.n), state.m));
  }

  function initUI() {
    document.querySelectorAll('[data-tex]').forEach((el) => { el.innerHTML = tex(el.getAttribute('data-tex'), el.hasAttribute('data-display')); });
    buildChips(); syncControls();

    document.querySelectorAll('.gt-stepper').forEach((st) => {
      st.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        const d = b.dataset.act === 'inc' ? 1 : -1;
        if (st.dataset.for === 'n') state.n += d; else state.m += d;
        clampState(); run();
      });
    });
    $('#gt-chips').addEventListener('click', (e) => {
      const chip = e.target.closest('.gt-chip'); if (!chip) return;
      const id = chip.dataset.id, p = PROPS.find((x) => x.id === id);
      const mb = e.target.closest('.gt-mini button');
      if (mb) {
        const key = mb.parentElement.dataset.key, d = mb.dataset.act === 'minc' ? 1 : -1;
        state.p[key] = Math.max(p.param.min, Math.min(p.param.max, state.p[key] + d));
      } else if (e.target.closest('.gt-chip-btn')) {
        state.on[id] = !state.on[id];
      } else return;
      buildChips(); run();
    });
    $('#gt-mode-deg').addEventListener('click', () => { state.mode = 'deg'; refreshCards(); });
    $('#gt-mode-color').addEventListener('click', () => { state.mode = 'color'; refreshCards(); });
    $('#gt-more').addEventListener('click', showMore);
    document.querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => {
      const [n, m, ...ids] = b.dataset.preset.split(',');
      state.n = +n; state.m = +m; state.on = {};
      ids.forEach((x) => { if (x.indexOf(':') > -1) { const [k, v] = x.split(':'); state.on[k] = true; state.p[{ regular: 'k', minDeg: 'a', maxDeg: 'b' }[k]] = +v; } else if (x) state.on[x] = true; });
      clampState(); buildChips(); run();
    }));

    // hover: رأس را که نشانه بروی، یال‌های متصل به آن روشن می‌شوند
    const grid = $('#gt-grid');
    grid.addEventListener('mouseover', (e) => {
      const v = e.target.closest('.vtx'); if (!v) return;
      const svg = v.closest('svg'), id = v.dataset.v;
      svg.classList.add('dim');
      svg.querySelectorAll('.e').forEach((l) => l.classList.toggle('on', l.dataset.u === id || l.dataset.v === id));
    });
    grid.addEventListener('mouseout', (e) => {
      const v = e.target.closest('.vtx'); if (!v) return;
      const svg = v.closest('svg'); svg.classList.remove('dim');
      svg.querySelectorAll('.e.on').forEach((l) => l.classList.remove('on'));
    });
    run();
  }

  function refreshCards() {          // فقط رنگ رأس‌ها عوض می‌شود
    syncControls(); renderLegend();
    $('#gt-grid').innerHTML = ''; const n = state.shown; state.shown = 0;
    while (state.shown < n) showMore();
  }

  /* ---- export for tests / start ---- */
  const api = { enumerate, nameGraph, isPlanar, isHamiltonian, isEulerian, components, bipartition, chromatic, girth, diameter, makeGraph, layoutGraph, quickReason, isIso };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initUI); else initUI();
  }
})();
