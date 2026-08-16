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
      var t = (now - t0) / 1000;
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
    canvas: canvas, loop: loop, plot: plot, arrow: arrow, text: text, embed: embed
  };
})();
