/* ============================================================
   core.js — Gerüst: Modul-Registry, Router, DOM/Canvas/Plot-Helfer.
   Ein neues Thema anlegen: siehe README.md.
   Bewusst klassisches <script> (kein ES-Modul), damit die Seite
   per Doppelklick über file:// läuft.
   ============================================================ */

var FV = (function () {

  var modules = [];
  var current = null;
  var loops = [];        // aktive rAF-Callbacks des sichtbaren Moduls
  var rafId = null;
  var lastT = 0;

  /* ---------- Registry ---------- */

  function register(def) {
    // def: {id, chapter, chapterNo, title, subtitle, source, status, build(root)}
    modules.push(def);
  }

  /* ---------- kleine DOM-Fabrik ---------- */

  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (k === 'class') el.className = attrs[k];
        else if (k === 'html') el.innerHTML = attrs[k];
        else if (k === 'text') el.textContent = attrs[k];
        else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), attrs[k]);
        else if (attrs[k] !== null && attrs[k] !== undefined) el.setAttribute(k, attrs[k]);
      }
    }
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c === null || c === undefined || c === false) continue;
      if (Array.isArray(c)) c.forEach(function (x) { if (x) el.appendChild(x); });
      else if (typeof c === 'string') el.appendChild(document.createTextNode(c));
      else el.appendChild(c);
    }
    return el;
  }

  /* ---------- Bausteine ---------- */

  function section(title) {
    var el = h('h2', null, title);
    return el;
  }

  function panel(title) {
    var p = h('div', { class: 'panel' });
    if (title) p.appendChild(h('div', { class: 'panel-title' }, title));
    for (var i = 1; i < arguments.length; i++) if (arguments[i]) p.appendChild(arguments[i]);
    return p;
  }

  function note(kind, head, htmlBody) {
    return h('div', { class: 'note ' + (kind || '') },
      head ? h('div', { class: 'note-h' }, head) : null,
      h('div', { html: htmlBody }));
  }

  function eq(htmlStr, label) {
    return h('div', { class: 'eq' },
      h('div', { html: htmlStr }),
      label ? h('span', { class: 'lbl' }, label) : null);
  }

  function legend(items) {
    var box = h('div', { class: 'legend' });
    items.forEach(function (it) {
      box.appendChild(h('span', null,
        h('i', { class: 'swatch', style: 'background:' + it.c }),
        document.createTextNode(it.t)));
    });
    return box;
  }

  /* ---------- Controls ---------- */

  function slider(o) {
    // o: {label, min, max, step, value, fmt(v), onInput(v)}
    var valEl = h('span', { class: 'ctrl-val' });
    var inp = h('input', {
      type: 'range', min: o.min, max: o.max,
      step: o.step === undefined ? 0.01 : o.step, value: o.value
    });
    var fmt = o.fmt || function (v) { return v.toFixed(2); };
    function sync() {
      var v = parseFloat(inp.value);
      valEl.textContent = fmt(v);
      if (o.onInput) o.onInput(v);
    }
    inp.addEventListener('input', sync);
    var wrap = h('div', { class: 'ctrl' },
      h('div', { class: 'ctrl-lab' }, h('span', { html: o.label }), valEl),
      inp);
    wrap.set = function (v) { inp.value = v; sync(); };
    wrap.get = function () { return parseFloat(inp.value); };
    valEl.textContent = fmt(parseFloat(inp.value));
    return wrap;
  }

  function toggle(label, initial, onChange) {
    var b = h('button', { class: 'btn' + (initial ? ' on' : '') }, label);
    var state = !!initial;
    b.addEventListener('click', function () {
      state = !state;
      b.classList.toggle('on', state);
      onChange(state);
    });
    b.getState = function () { return state; };
    b.setState = function (s) { state = !!s; b.classList.toggle('on', state); onChange(state); };
    return b;
  }

  function button(label, onClick) {
    return h('button', { class: 'btn', onclick: onClick }, label);
  }

  function ctrlRow() {
    var r = h('div', { class: 'ctrls' });
    for (var i = 0; i < arguments.length; i++) if (arguments[i]) r.appendChild(arguments[i]);
    return r;
  }

  function readout(items) {
    // items: [{key, lab, cls}] -> Objekt mit .set(key, text)
    var box = h('div', { class: 'readout' });
    var map = {};
    items.forEach(function (it) {
      var v = h('div', { class: 'ro-val' }, '–');
      box.appendChild(h('div', { class: 'ro ' + (it.cls || '') },
        h('div', { class: 'ro-lab', html: it.lab }), v));
      map[it.key] = v;
    });
    box.set = function (k, txt) { if (map[k]) map[k].textContent = txt; };
    return box;
  }

  /* ---------- Canvas ---------- */

  function canvas(o) {
    // o: {aspect (h/w), render(ctx, w, h, t), animate:bool, cap:string}
    var el = h('canvas', { class: 'fv-canvas' });
    var wrap = h('div', { class: 'canvas-wrap' }, el);
    var ctx = el.getContext('2d');
    var W = 800, H = 800 * (o.aspect || 0.55);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      var cw = el.clientWidth || 800;
      W = cw; H = Math.round(cw * (o.aspect || 0.55));
      el.style.height = H + 'px';
      el.width = Math.round(W * dpr);
      el.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(lastT);
    }

    function draw(t) {
      ctx.save();
      ctx.clearRect(0, 0, W, H);
      o.render(ctx, W, H, t || 0);
      ctx.restore();
    }

    var out = h('div', null, wrap, o.cap ? h('div', { class: 'canvas-cap', html: o.cap }) : null);
    out.draw = function () { draw(lastT); };
    out.el = el;
    out.size = function () { return { w: W, h: H }; };

    // Größe erst nach Einhängen ins DOM bekannt
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () { resize(); });
      ro.observe(el);
    } else {
      window.addEventListener('resize', resize);
    }
    setTimeout(resize, 0);   // falls der Observer nicht feuert (versteckter Tab o.ä.)
    if (o.animate) loop(function (t) { draw(t); });
    return out;
  }

  /* ---------- Eingebettetes Lab (eigenständige HTML-Seite im iframe) ---------- */

  function embed(o) {
    // o: {src, height, note}
    var frame = h('iframe', {
      src: o.src, class: 'embed-frame',
      style: 'height:' + (o.height || 620) + 'px',
      loading: 'lazy', title: o.title || 'Lab'
    });
    var bar = h('div', { class: 'embed-bar' },
      h('span', null, o.note || 'eigenständiges Lab'),
      h('a', { href: o.src, target: '_blank', rel: 'noopener' }, 'in eigenem Tab öffnen ↗'));
    return h('div', { class: 'embed' }, frame, bar);
  }

  /* ---------- Animations-Loop (pro Modul zurückgesetzt) ---------- */

  function loop(fn) { loops.push(fn); ensureRaf(); }

  function ensureRaf() {
    if (rafId !== null) return;
    var t0 = performance.now();
    function step(now) {
      // Der rAF-Zeitstempel bezieht sich auf den Beginn des laufenden Frames.
      // Wurde ensureRaf mitten im Frame aufgerufen, liegt er VOR t0 und t
      // würde negativ — was jede Rechnung der Art floor(t·n) auf −1 schickt.
      var t = Math.max(0, (now - t0) / 1000);
      lastT = t;
      for (var i = 0; i < loops.length; i++) loops[i](t);
      rafId = requestAnimationFrame(step);
    }
    rafId = requestAnimationFrame(step);
  }

  function stopLoops() {
    loops = [];
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
  }

  /* ---------- Plot-Helfer (kartesisches Diagramm auf Canvas) ---------- */

  function plot(ctx, o) {
    // o: {w,h, x:[a,b], y:[a,b], pad:{l,r,t,b}, xlabel, ylabel, xticks:[], yticks:[]}
    var pad = o.pad || { l: 46, r: 14, t: 14, b: 34 };
    var x0 = pad.l, x1 = o.w - pad.r, y0 = o.h - pad.b, y1 = pad.t;
    var ax = o.x[0], bx = o.x[1], ay = o.y[0], by = o.y[1];

    function X(v) { return x0 + (v - ax) / (bx - ax) * (x1 - x0); }
    function Y(v) { return y0 + (v - ay) / (by - ay) * (y1 - y0); }

    var P = {
      X: X, Y: Y, x0: x0, x1: x1, y0: y0, y1: y1,
      grid: function () {
        ctx.save();
        ctx.strokeStyle = '#1e2732'; ctx.lineWidth = 1;
        (o.xticks || []).forEach(function (t) {
          ctx.beginPath(); ctx.moveTo(X(t), y0); ctx.lineTo(X(t), y1); ctx.stroke();
        });
        (o.yticks || []).forEach(function (t) {
          ctx.beginPath(); ctx.moveTo(x0, Y(t)); ctx.lineTo(x1, Y(t)); ctx.stroke();
        });
        ctx.restore();
      },
      axes: function () {
        ctx.save();
        ctx.strokeStyle = '#4a5663'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke();
        ctx.fillStyle = '#7b8896'; ctx.font = '11px ui-monospace, monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        (o.xticks || []).forEach(function (t) {
          ctx.beginPath(); ctx.moveTo(X(t), y0); ctx.lineTo(X(t), y0 + 4); ctx.stroke();
          ctx.fillText(o.xfmt ? o.xfmt(t) : String(t), X(t), y0 + 7);
        });
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        (o.yticks || []).forEach(function (t) {
          ctx.beginPath(); ctx.moveTo(x0 - 4, Y(t)); ctx.lineTo(x0, Y(t)); ctx.stroke();
          ctx.fillText(o.yfmt ? o.yfmt(t) : String(t), x0 - 7, Y(t));
        });
        ctx.fillStyle = '#98a5b3'; ctx.font = '12px -apple-system, sans-serif';
        if (o.xlabel) { ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(o.xlabel, x1, o.h - 2); }
        if (o.ylabel) {
          ctx.save(); ctx.translate(11, y1 + 4); ctx.rotate(0);
          ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(o.ylabel, 0, 0); ctx.restore();
        }
        ctx.restore();
      },
      curve: function (f, style) {
        style = style || {};
        ctx.save();
        ctx.strokeStyle = style.color || '#fff';
        ctx.lineWidth = style.width || 2;
        if (style.dash) ctx.setLineDash(style.dash);
        ctx.beginPath();
        var n = style.n || 320, started = false;
        for (var i = 0; i <= n; i++) {
          var xv = ax + (bx - ax) * i / n;
          var yv = f(xv);
          if (!isFinite(yv)) { started = false; continue; }
          var yc = Math.max(Math.min(yv, by), ay);
          var px = X(xv), py = Y(yc);
          if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
        }
        ctx.stroke(); ctx.restore();
      },
      poly: function (pts, style) {
        style = style || {};
        ctx.save();
        ctx.strokeStyle = style.color || '#fff';
        ctx.lineWidth = style.width || 2;
        if (style.dash) ctx.setLineDash(style.dash);
        ctx.beginPath();
        pts.forEach(function (p, i) { i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1])); });
        ctx.stroke(); ctx.restore();
      },
      vline: function (xv, style) {
        style = style || {};
        ctx.save();
        ctx.strokeStyle = style.color || '#8899aa';
        ctx.lineWidth = style.width || 1.2;
        ctx.setLineDash(style.dash || [4, 4]);
        ctx.beginPath(); ctx.moveTo(X(xv), y0); ctx.lineTo(X(xv), y1); ctx.stroke();
        ctx.restore();
      },
      dot: function (xv, yv, color, r) {
        ctx.save(); ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(X(xv), Y(yv), r || 4, 0, 6.2832); ctx.fill(); ctx.restore();
      },
      label: function (xv, yv, txt, color, align) {
        ctx.save(); ctx.fillStyle = color || '#c8d3de';
        ctx.font = '12px -apple-system, sans-serif';
        ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(txt, X(xv), Y(yv)); ctx.restore();
      },
      clip: function (fn) {
        ctx.save(); ctx.beginPath(); ctx.rect(x0, y1, x1 - x0, y0 - y1); ctx.clip(); fn(); ctx.restore();
      }
    };
    return P;
  }

  /* ---------- Zeichen-Utilities ---------- */

  function arrow(ctx, x1, y1, x2, y2, color, width, headLen) {
    var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
    if (L < 0.5) return;
    var hl = Math.min(headLen || 8, L * 0.5);
    var ux = dx / L, uy = dy / L;
    ctx.save();
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width || 1.6;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - ux * hl * 0.8, y2 - uy * hl * 0.8); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - ux * hl - uy * hl * 0.42, y2 - uy * hl + ux * hl * 0.42);
    ctx.lineTo(x2 - ux * hl + uy * hl * 0.42, y2 - uy * hl - ux * hl * 0.42);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function text(ctx, x, y, txt, o) {
    o = o || {};
    ctx.save();
    ctx.fillStyle = o.color || '#c8d3de';
    ctx.font = (o.font || '12px -apple-system, sans-serif');
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = o.baseline || 'alphabetic';
    ctx.fillText(txt, x, y);
    ctx.restore();
  }

  /* ---------- 3D-Vektoren ---------- */

  var V3 = {
    add: function (a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; },
    sub: function (a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; },
    mul: function (a, s) { return [a[0] * s, a[1] * s, a[2] * s]; },
    dot: function (a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; },
    cross: function (a, b) {
      return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    },
    len: function (a) { return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]); },
    unit: function (a) { var L = V3.len(a); return L < 1e-12 ? [0, 0, 0] : [a[0] / L, a[1] / L, a[2] / L]; }
  };

  /* ---------- Drehbare 3D-Szene ----------
     Orthographische Projektion, bewusst ohne Perspektive: Winkel und Längen
     sollen ablesbar bleiben. Tiefensortierung nach Painter's Algorithm über
     die mittlere Tiefe jedes Objekts — für Wirbelfäden und Achsenkreuze reicht das.
     o: {aspect, span, azim, elev, cap, animate, draw(S, t), pick()}
  */

  function scene3d(o) {
    var cam0 = { azim: o.azim === undefined ? 0.62 : o.azim,
                 elev: o.elev === undefined ? 0.38 : o.elev, zoom: 1 };
    var cam = { azim: cam0.azim, elev: cam0.elev, zoom: 1 };
    var span = o.span || 6;                 // Weltbreite, die ins Bild passen soll
    var queue = [], ctxRef = null;
    var right = [1, 0, 0], upv = [0, 1, 0], fwd = [0, 0, -1];
    var cx = 0, cy = 0, sc = 1;

    function setCam(w, hgt) {
      var ce = Math.cos(cam.elev), se = Math.sin(cam.elev);
      var ca = Math.cos(cam.azim), sa = Math.sin(cam.azim);
      var eye = [ce * sa, se, ce * ca];     // Richtung Ursprung → Kamera
      fwd = V3.mul(eye, -1);
      right = V3.unit(V3.cross([0, 1, 0], eye));
      if (V3.len(right) < 1e-9) right = [1, 0, 0];
      upv = V3.cross(eye, right);
      sc = w / span * cam.zoom;
      cx = w * (o.ox === undefined ? 0.5 : o.ox);
      cy = hgt * (o.oy === undefined ? 0.5 : o.oy);
    }

    function P(p) { return [cx + sc * V3.dot(p, right), cy - sc * V3.dot(p, upv)]; }
    function depth(p) { return V3.dot(p, fwd); }        // grösser = weiter weg

    function push(z, fn) { queue.push({ z: z, f: fn }); }
    function lay(style, z) {
      if (!style) return z;
      if (style.layer === 'front') return -1e9;
      if (style.layer === 'back') return 1e9;
      return z;
    }

    var S = {
      P: P, depth: depth, V: V3,
      get ctx() { return ctxRef; },
      get scale() { return sc; },
      cam: cam,

      /* Rohzugriff: eigene Zeichnung mit selbst gewählter Tiefe */
      raw: function (z, fn) { push(z, fn); },

      poly3: function (pts, st) {
        st = st || {};
        var pp = pts.map(P), zm = 0;
        pts.forEach(function (p) { zm += depth(p); });
        zm /= Math.max(pts.length, 1);
        push(lay(st, zm), function (ctx) {
          ctx.save();
          ctx.strokeStyle = st.color || '#c8d3de';
          ctx.lineWidth = st.width || 1.6;
          ctx.globalAlpha = st.alpha === undefined ? 1 : st.alpha;
          if (st.dash) ctx.setLineDash(st.dash);
          ctx.lineJoin = 'round'; ctx.lineCap = 'round';
          ctx.beginPath();
          pp.forEach(function (q, i) { i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
          ctx.stroke(); ctx.restore();
        });
      },

      line3: function (a, b, st) { S.poly3([a, b], st); },

      fill3: function (pts, st) {
        st = st || {};
        var pp = pts.map(P), zm = 0;
        pts.forEach(function (p) { zm += depth(p); });
        zm /= Math.max(pts.length, 1);
        push(lay(st, zm), function (ctx) {
          ctx.save();
          ctx.fillStyle = st.color || '#1b2735';
          ctx.globalAlpha = st.alpha === undefined ? 1 : st.alpha;
          ctx.beginPath();
          pp.forEach(function (q, i) { i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
          ctx.closePath(); ctx.fill();
          if (st.stroke) {
            ctx.globalAlpha = 1; ctx.strokeStyle = st.stroke;
            ctx.lineWidth = st.width || 1.2; ctx.stroke();
          }
          ctx.restore();
        });
      },

      arrow3: function (a, b, st) {
        st = st || {};
        var pa = P(a), pb = P(b);
        var zm = (depth(a) + depth(b)) / 2;
        push(lay(st, zm), function (ctx) {
          ctx.save();
          ctx.globalAlpha = st.alpha === undefined ? 1 : st.alpha;
          if (st.dash) ctx.setLineDash(st.dash);
          arrow(ctx, pa[0], pa[1], pb[0], pb[1], st.color || '#c8d3de', st.width || 1.8, st.head || 9);
          ctx.restore();
        });
      },

      /* Bogen in der von u und v aufgespannten Ebene um c, Winkel a0…a1 */
      arcPts: function (c, u, v, r, a0, a1, n) {
        n = n || 48; var out = [];
        for (var i = 0; i <= n; i++) {
          var a = a0 + (a1 - a0) * i / n;
          out.push(V3.add(c, V3.add(V3.mul(u, r * Math.cos(a)), V3.mul(v, r * Math.sin(a)))));
        }
        return out;
      },
      arc3: function (c, u, v, r, a0, a1, st) { S.poly3(S.arcPts(c, u, v, r, a0, a1, st && st.n), st); },

      point3: function (p, st) {
        st = st || {};
        var q = P(p), z = depth(p);
        push(lay(st, z), function (ctx) {
          ctx.save();
          ctx.fillStyle = st.color || '#fff';
          ctx.beginPath(); ctx.arc(q[0], q[1], st.r || 4, 0, 6.2832); ctx.fill();
          if (st.ring) {
            ctx.strokeStyle = st.ring; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(q[0], q[1], (st.r || 4) + 3.5, 0, 6.2832); ctx.stroke();
          }
          ctx.restore();
        });
      },

      label3: function (p, txt, st) {
        st = st || {};
        var q = P(p), z = depth(p);
        push(lay(st, z - 1e-6), function (ctx) {
          text(ctx, q[0] + (st.dx || 0), q[1] + (st.dy || 0), txt,
               { color: st.color || '#c8d3de', font: st.font || '12px -apple-system, sans-serif',
                 align: st.align || 'left', baseline: st.baseline || 'middle' });
        });
      },

      /* Wirbelfaden: dicke Linie plus Pfeilspitzen in Richtung von Γ */
      filament3: function (pts, st) {
        st = st || {};
        S.poly3(pts, { color: st.color || '#e08a3c', width: st.width || 3.2,
                       alpha: st.alpha, layer: st.layer, dash: st.dash });
        // Pfeilspitzen mit fester Bildgrösse: die Segmente sind zu kurz für arrow()
        var nH = st.heads || 3;
        for (var k = 1; k <= nH; k++) {
          var i = Math.round(pts.length * k / (nH + 1));
          if (i < 1 || i >= pts.length) continue;
          var q = P(pts[i]), qb = P(pts[i - 1]);
          var dx = q[0] - qb[0], dy = q[1] - qb[1], L = Math.hypot(dx, dy);
          if (L < 1e-6) continue;
          (function (q, ux, uy, z) {
            push(lay(st, z), function (ctx) {
              var hl = st.head || 11;
              ctx.save();
              ctx.fillStyle = st.color || '#e08a3c';
              ctx.globalAlpha = st.alpha === undefined ? 1 : st.alpha;
              ctx.beginPath();
              ctx.moveTo(q[0] + ux * hl * 0.5, q[1] + uy * hl * 0.5);
              ctx.lineTo(q[0] - ux * hl * 0.5 - uy * hl * 0.36, q[1] - uy * hl * 0.5 + ux * hl * 0.36);
              ctx.lineTo(q[0] - ux * hl * 0.5 + uy * hl * 0.36, q[1] - uy * hl * 0.5 - ux * hl * 0.36);
              ctx.closePath(); ctx.fill(); ctx.restore();
            });
          })(q, dx / L, dy / L, depth(pts[i]) - 1e-7);
        }
      },

      /* Drehsinn-Ring senkrecht zur Tangente t um den Punkt p (Rechte-Hand-Regel) */
      spin3: function (p, t, r, st) {
        st = st || {};
        var tu = V3.unit(t);
        var helper = Math.abs(tu[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
        var u = V3.unit(V3.cross(helper, tu)), v = V3.cross(tu, u);
        var pts = S.arcPts(p, u, v, r, 0, 5.2, 30);
        S.poly3(pts, { color: st.color || '#8fa2b5', width: st.width || 1.4, alpha: st.alpha, layer: st.layer });
        var n = pts.length;
        S.arrow3(pts[n - 2], pts[n - 1],
                 { color: st.color || '#8fa2b5', width: st.width || 1.4, head: 7, alpha: st.alpha, layer: st.layer });
      },

      /* Achsenkreuz mit Beschriftung */
      axes: function (L, names, st) {
        st = st || {};
        var c = st.color || '#55636f', lc = st.labelColor || '#7b8896';
        var ax = [[[L, 0, 0], names && names[0] || 'x'],
                  [[0, L, 0], names && names[1] || 'y'],
                  [[0, 0, L], names && names[2] || 'z']];
        ax.forEach(function (e) {
          S.arrow3([0, 0, 0], e[0], { color: c, width: 1.3, head: 8, layer: st.layer });
          S.label3(V3.mul(e[0], 1.09), e[1], { color: lc, dx: 3, font: 'italic 13px Georgia, serif', layer: st.layer });
        });
      },

      /* Gitter in einer Koordinatenebene: plane 'xz' | 'xy' | 'yz' */
      grid3: function (plane, half, step, st) {
        st = st || {};
        var col = st.color || '#1b2430';
        for (var i = -half; i <= half + 1e-9; i += step) {
          var a, b, c2, d;
          if (plane === 'xz') { a = [i, 0, -half]; b = [i, 0, half]; c2 = [-half, 0, i]; d = [half, 0, i]; }
          else if (plane === 'xy') { a = [i, -half, 0]; b = [i, half, 0]; c2 = [-half, i, 0]; d = [half, i, 0]; }
          else { a = [0, i, -half]; b = [0, i, half]; c2 = [0, -half, i]; d = [0, half, i]; }
          S.poly3([a, b], { color: col, width: 1, layer: 'back' });
          S.poly3([c2, d], { color: col, width: 1, layer: 'back' });
        }
      }
    };

    var cv = canvas({
      aspect: o.aspect || 0.62,
      cap: o.cap,
      render: function (ctx, w, hgt, t) {
        ctxRef = ctx;
        setCam(w, hgt);
        queue = [];
        // Ein Fehler beim Zeichnen darf nicht die rAF-Schleife der ganzen
        // Seite abreissen lassen — dann stünden auch alle anderen
        // Animationen still. Unter file:// maskiert der Browser den Stack
        // im window.onerror-Handler, hier ist er vollständig.
        try {
          o.draw(S, t);
        } catch (err) {
          window.FV_lastError = { where: o.name || 'scene3d', message: err.message, stack: err.stack };
          if (!scene3d._warned) { scene3d._warned = true; console.error('scene3d:', err); }
        }
        queue.sort(function (a, b) { return b.z - a.z; });
        for (var i = 0; i < queue.length; i++) queue[i].f(ctx);
        if (!o.noHint) {
          text(ctx, w - 10, 15, 'ziehen zum Drehen · Rad zoomt · Doppelklick setzt zurück',
               { color: '#4a5663', font: '11px -apple-system, sans-serif', align: 'right' });
        }
      }
    });

    /* ---------- Maus: Kamera drehen bzw. Griffpunkt ziehen ---------- */

    var el = cv.el;
    el.classList.add('grabbable');
    var drag = null;

    function localXY(ev) {
      var r = el.getBoundingClientRect();
      return [ev.clientX - r.left, ev.clientY - r.top];
    }

    function hitHandle(xy) {
      if (!o.pick) return null;
      var hs = o.pick() || [], best = null, bd = 15;
      hs.forEach(function (hd) {
        var q = P(hd.p), d = Math.hypot(q[0] - xy[0], q[1] - xy[1]);
        if (d < bd) { bd = d; best = hd; }
      });
      return best;
    }

    el.addEventListener('pointerdown', function (ev) {
      var xy = localXY(ev);
      var hd = hitHandle(xy);
      drag = hd ? { mode: 'pick', xy: xy, h: hd, p0: hd.p.slice() }
                : { mode: 'rot', xy: xy, azim: cam.azim, elev: cam.elev };
      el.setPointerCapture(ev.pointerId);
      el.style.cursor = 'grabbing';
      ev.preventDefault();
    });

    el.addEventListener('pointermove', function (ev) {
      var xy = localXY(ev);
      if (!drag) {
        el.style.cursor = hitHandle(xy) ? 'pointer' : 'grab';
        return;
      }
      var dx = xy[0] - drag.xy[0], dy = xy[1] - drag.xy[1];
      if (drag.mode === 'rot') {
        cam.azim = drag.azim + dx * 0.009;
        cam.elev = Math.max(-1.45, Math.min(1.45, drag.elev + dy * 0.009));
      } else {
        // in der Kameraebene verschieben — das ist immer möglich und wirkt direkt
        var np = V3.add(drag.p0, V3.add(V3.mul(right, dx / sc), V3.mul(upv, -dy / sc)));
        drag.h.set(np);
      }
      cv.draw();
      ev.preventDefault();
    });

    function endDrag(ev) {
      if (!drag) return;
      drag = null;
      el.style.cursor = 'grab';
      if (ev && ev.pointerId !== undefined && el.hasPointerCapture(ev.pointerId)) {
        el.releasePointerCapture(ev.pointerId);
      }
    }
    el.addEventListener('pointerup', endDrag);
    el.addEventListener('pointercancel', endDrag);

    el.addEventListener('wheel', function (ev) {
      cam.zoom = Math.max(0.35, Math.min(4, cam.zoom * (ev.deltaY < 0 ? 1.12 : 1 / 1.12)));
      cv.draw(); ev.preventDefault();
    }, { passive: false });

    el.addEventListener('dblclick', function () {
      cam.azim = cam0.azim; cam.elev = cam0.elev; cam.zoom = 1;
      cv.draw();
    });

    cv.cam = cam;
    cv.S = S;
    cv.setView = function (az, el2, zm) {
      cam.azim = az; cam.elev = el2; if (zm) cam.zoom = zm; cv.draw();
    };
    if (o.animate) loop(function () { cv.draw(); });
    return cv;
  }

  /* ---------- Router / Start ---------- */

  function buildNav() {
    var nav = document.getElementById('nav');
    nav.innerHTML = '';
    var groups = [];
    modules.forEach(function (m) {
      var g = groups.filter(function (x) { return x.name === m.chapter; })[0];
      if (!g) { g = { name: m.chapter, items: [] }; groups.push(g); }
      g.items.push(m);
    });
    groups.forEach(function (g) {
      nav.appendChild(h('div', { class: 'nav-group' }, g.name));
      g.items.forEach(function (m) {
        var a = h('a', {
          class: 'nav-item' + (m.status === 'soon' ? ' soon' : ''),
          href: '#' + m.id, 'data-id': m.id
        },
          h('span', { class: 'num' }, m.chapterNo || ''),
          h('span', null, m.title));
        a.addEventListener('click', function () {
          document.getElementById('sidebar').classList.remove('open');
        });
        nav.appendChild(a);
      });
    });
  }

  function show(id) {
    var m = modules.filter(function (x) { return x.id === id; })[0] || modules[0];
    if (!m) return;
    stopLoops();
    current = m;
    var root = document.getElementById('content');
    root.innerHTML = '';
    root.scrollTop = 0;
    window.scrollTo(0, 0);

    var head = h('div', null,
      h('div', null,
        h('span', { class: 'chip' }, m.chapterNo ? 'Skript ' + m.chapterNo : m.chapter),
        m.source ? h('span', { class: 'src' }, m.source) : null),
      h('h1', null, m.title),
      m.subtitle ? h('p', { class: 'lede' }, m.subtitle) : null);
    root.appendChild(head);

    m.build(root);

    Array.prototype.forEach.call(document.querySelectorAll('.nav-item'), function (a) {
      a.classList.toggle('active', a.getAttribute('data-id') === m.id);
    });
    document.getElementById('crumb').textContent = m.title;
    document.title = m.title + ' — Fluiddynamik visuell';
  }

  function route() {
    var id = (location.hash || '').replace(/^#/, '');
    show(id || modules[0].id);
  }

  function start() {
    buildNav();
    window.addEventListener('hashchange', route);
    document.getElementById('burger').addEventListener('click', function () {
      document.getElementById('sidebar').classList.toggle('open');
    });
    route();
  }

  return {
    register: register, start: start, modules: modules,
    h: h, section: section, panel: panel, note: note, eq: eq, legend: legend,
    slider: slider, toggle: toggle, button: button, ctrlRow: ctrlRow, readout: readout,
    canvas: canvas, loop: loop, plot: plot, arrow: arrow, text: text, embed: embed,
    scene3d: scene3d, V3: V3
  };
})();
