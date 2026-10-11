// Red-carpet welcome screen for the home page.
// Plays once per visit (per browser tab session). Safe to remove: delete the
// welcome block in index.html and nothing else on the site is affected.
(function () {
  var root = document.getElementById('welcome');
  var html = document.documentElement;
  if (!root || !html.classList.contains('welcome-on')) return;

  var stage = root.querySelector('.w-stage');
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var timers = [];
  var finished = false;

  try { sessionStorage.setItem('sfsWelcomeSeen', '1'); } catch (e) {}

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  var NS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs, parent) {
    var el = document.createElementNS(NS, tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  }

  // ---- Rope posts and velvet ropes, drawn along both edges of the carpet ----
  function buildPosts() {
    var W = stage.clientWidth, H = stage.clientHeight;
    var horizon = H * 0.54;
    var s = svg('svg', { 'class': 'w-ropes', viewBox: '0 0 ' + W + ' ' + H });
    var defs = svg('defs', {}, s);
    var g = svg('linearGradient', { id: 'wGold', x1: 0, x2: 1, y1: 0, y2: 0 }, defs);
    svg('stop', { offset: '0', 'stop-color': '#b8892a' }, g);
    svg('stop', { offset: '.45', 'stop-color': '#fff1b8' }, g);
    svg('stop', { offset: '1', 'stop-color': '#a8781f' }, g);

    var ts = [0.2, 0.52, 0.86];
    [-1, 1].forEach(function (side) {
      var pts = ts.map(function (t) {
        var edge = side < 0 ? W * (0.41 - 0.43 * t) : W * (0.59 + 0.43 * t);
        var sc = 0.45 + 0.75 * t;
        var x = Math.min(W - 16, Math.max(16, edge + side * 22 * sc));
        var y = horizon + (H - horizon) * t;
        return { x: x, y: y, sc: sc, h: H * 0.17 * sc };
      });

      // ropes first (behind the poles' balls), fading in after the poles
      for (var i = 0; i < pts.length - 1; i++) {
        var a = pts[i], b = pts[i + 1];
        var ya = a.y - a.h * 0.85, yb = b.y - b.h * 0.85;
        var mx = (a.x + b.x) / 2, my = (ya + yb) / 2 + (a.h + b.h) * 0.22;
        var p = 'M' + a.x + ' ' + ya + ' Q' + mx + ' ' + my + ' ' + b.x + ' ' + yb;
        var rg = svg('g', { 'class': 'w-rope', style: 'animation-delay:' + (1.9 + i * 0.15) + 's' }, s);
        svg('path', { d: p, fill: 'none', stroke: '#5a0a12', 'stroke-width': (a.sc + b.sc) * 3.6, 'stroke-linecap': 'round' }, rg);
        svg('path', { d: p, fill: 'none', stroke: '#d92a45', 'stroke-width': (a.sc + b.sc) * 2.2, 'stroke-linecap': 'round' }, rg);
      }

      pts.forEach(function (pt, i) {
        var w = 7 * pt.sc;
        var pg = svg('g', { 'class': 'w-post', style: 'animation-delay:' + (1.4 + i * 0.15) + 's' }, s);
        svg('ellipse', { cx: pt.x, cy: pt.y, rx: w * 2.4, ry: w * 0.8, fill: 'url(#wGold)' }, pg);
        svg('rect', { x: pt.x - w / 2, y: pt.y - pt.h, width: w, height: pt.h, rx: w / 2, fill: 'url(#wGold)' }, pg);
        svg('circle', { cx: pt.x, cy: pt.y - pt.h, r: w * 1.5, fill: 'url(#wGold)' }, pg);
      });
    });
    stage.appendChild(s);
  }

  // ---- Sparkles ----
  function spark(cls, style) {
    var el = document.createElement('span');
    el.className = 'w-spark' + (cls ? ' ' + cls : '');
    el.setAttribute('style', style);
    return el;
  }
  function ambientSparkles() {
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 26; i++) {
      frag.appendChild(spark('',
        'left:' + rnd(3, 97) + '%;top:' + rnd(3, 62) + '%;--s:' + rnd(6, 15) + 'px;--d:' + rnd(0, 2.2) + 's'));
    }
    stage.appendChild(frag);
  }
  function seamBurst() {
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 36; i++) {
      frag.appendChild(spark('burst',
        'left:50%;top:' + rnd(2, 98) + '%;--s:' + rnd(8, 20) + 'px;--dx:' + rnd(-160, 160) + 'px;--dy:' + rnd(-70, 70) +
        'px;--d:' + rnd(0, 0.35) + 's;--t:' + rnd(0.8, 1.3) + 's'));
    }
    root.appendChild(frag);
  }

  // ---- Finishing ----
  function finish() {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    if (root.parentNode) root.parentNode.removeChild(root);
    html.classList.remove('welcome-on');
  }
  function fadeOut() {
    if (finished) return;
    timers.forEach(clearTimeout);
    root.classList.add('leaving');
    setTimeout(finish, 500);
  }

  var skip = root.querySelector('.w-skip');
  if (skip) skip.addEventListener('click', fadeOut);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fadeOut(); });

  // ---- Timeline (about 6.5 seconds) ----
  if (reduced) {
    later(fadeOut, 1600);
    return;
  }
  buildPosts();
  ambientSparkles();
  later(function () { root.classList.add('closing'); }, 4600);          // curtains draw shut
  later(function () {                                                     // ...then part
    root.classList.add('closed', 'opening');
    seamBurst();
  }, 5400);
  later(finish, 6800);
})();
