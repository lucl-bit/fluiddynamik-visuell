/* ============================================================
   Biot-Savart — woher die Geschwindigkeit an einem Punkt kommt
   Skript Kap. 10.1, S. 83 f., Abb. 10.5

   Aufbau: erst das Integral Beitrag für Beitrag am drehbaren Modell,
   dann die geschlossene Formel daneben zur Kontrolle, dann die
   Grenzübergänge, zuletzt drei Prüfungsgeometrien.

   Der Physikblock unten ist bewusst frei von DOM und FV — verify.js
   schneidet ihn aus dieser Datei heraus und rechnet ihn nach.
   ============================================================ */

/* ---------------- Physik ---------------- */

function vAdd(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
function vSub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function vMul(a, s) { return [a[0] * s, a[1] * s, a[2] * s]; }
function vDot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function vCross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function vLen(a) { return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]); }
function vUnit(a) { var L = vLen(a); return L < 1e-14 ? [0, 0, 0] : [a[0] / L, a[1] / L, a[2] / L]; }

/* Die Einzelbeiträge des Integrals, Segment für Segment.
   Genau das, was die Animation zeigt: zu jedem Stück ds der Vektor r,
   das Kreuzprodukt und der Beitrag du = Γ/(4π) · (ds × r)/|r|³.        */
function bsTerms(pts, G, x) {
  var out = [], f = G / (4 * Math.PI);
  for (var i = 1; i < pts.length; i++) {
    var a = pts[i - 1], b = pts[i];
    var ds = vSub(b, a);
    var m = vMul(vAdd(a, b), 0.5);          // Mittelpunktsregel
    var r = vSub(x, m);
    var rl = vLen(r), r3 = rl * rl * rl;
    if (r3 < 1e-14) continue;
    var c = vCross(ds, r);
    out.push({ a: a, b: b, mid: m, ds: ds, r: r, rlen: rl, cross: c, du: vMul(c, f / r3) });
  }
  return out;
}

/* Numerisches Linienintegral über eine Polylinie */
function bsPoly(pts, G, x) {
  var t = bsTerms(pts, G, x), u = [0, 0, 0];
  for (var i = 0; i < t.length; i++) u = vAdd(u, t[i].du);
  return u;
}

/* Teilsumme bis Segment n — der mitwachsende Summenvektor der Animation */
function bsPartial(terms, n) {
  var u = [0, 0, 0];
  for (var i = 0; i < Math.min(n, terms.length); i++) u = vAdd(u, terms[i].du);
  return u;
}

/* Endliches gerades Stück, geschlossen:  u = Γ/(4πh)·(cos θ₁ − cos θ₂)
   θ₁ = Winkel zwischen Fadenrichtung und r₁ (Innenwinkel am Anfangspunkt),
   θ₂ = derselbe Winkel am Endpunkt (Aussenwinkel des Dreiecks).          */
function segAngles(a, b, x) {
  var e = vUnit(vSub(b, a));
  var r1 = vSub(x, a), r2 = vSub(x, b);
  var c = vCross(e, r1);
  return {
    e: e, h: vLen(c), dir: vUnit(c),
    cos1: vDot(e, vUnit(r1)), cos2: vDot(e, vUnit(r2))
  };
}
function bsSeg(a, b, G, x) {
  var s = segAngles(a, b, x);
  if (s.h < 1e-12) return [0, 0, 0];
  return vMul(s.dir, G / (4 * Math.PI * s.h) * (s.cos1 - s.cos2));
}

/* Halbunendlicher Faden ab p0 in Richtung e (θ₂ → π, also cos θ₂ = −1) */
function bsRay(p0, e, G, x) {
  var eu = vUnit(e);
  var r1 = vSub(x, p0);
  var c = vCross(eu, r1), h = vLen(c);
  if (h < 1e-12) return [0, 0, 0];
  return vMul(vUnit(c), G / (4 * Math.PI * h) * (vDot(eu, vUnit(r1)) + 1));
}

/* Unendlich langer Faden: der Potentialwirbel, Γ/(2πh) */
function bsLine(p0, e, G, x) {
  var eu = vUnit(e);
  var c = vCross(eu, vSub(x, p0)), h = vLen(c);
  if (h < 1e-12) return [0, 0, 0];
  return vMul(vUnit(c), G / (2 * Math.PI * h));
}

/* Kreisring, Geschwindigkeit auf der eigenen Achse im Abstand z */
function ringAxis(R, z, G) { return G * R * R / (2 * Math.pow(R * R + z * z, 1.5)); }

/* Bogenstück als Polylinie: c + R(u·cos φ + v·sin φ), φ von a0 bis a1 */
function arcPts(c, u, v, R, a0, a1, n) {
  var out = [];
  for (var i = 0; i <= n; i++) {
    var p = a0 + (a1 - a0) * i / n;
    out.push(vAdd(c, vAdd(vMul(u, R * Math.cos(p)), vMul(v, R * Math.sin(p)))));
  }
  return out;
}
function segPts(a, b, n) {
  var out = [];
  for (var i = 0; i <= n; i++) out.push(vAdd(a, vMul(vSub(b, a), i / n)));
  return out;
}

/* ---- Prüfungsgeometrie 1: Gleitschirm ----
   W3 gebunden als Kreissegment in der y-z-Ebene um Q, R = √2·a, ±45°.
   Durchlaufsinn W1 (aus dem Unendlichen) → W3 → W2 (ins Unendliche);
   damit zeigt der Auftrieb nach +y, siehe Kutta-Joukowski F = ϱ u × Γ.   */
function geoSchirm(a) {
  var R = Math.SQRT2 * a;
  var Q = [0, -a, 0];
  var P = [R, -a, 0];
  var end1 = [0, 0, a], end2 = [0, 0, -a];    // φ = π/4 und 3π/4
  return {
    R: R, a: a, Q: Q, P: P, end1: end1, end2: end2,
    /* s(φ) = Q + R(0, sin φ, cos φ) */
    arc: function (n) { return arcPts(Q, [0, 0, 1], [0, 1, 0], R, Math.PI / 4, 3 * Math.PI / 4, n || 240); },
    /* Beiträge in P. W1 wird gegen +x durchlaufen, daher −Γ. */
    uW1: function (G) { return bsRay(end1, [1, 0, 0], -G, P); },
    uW2: function (G) { return bsRay(end2, [1, 0, 0], G, P); },
    uW3num: function (G) { return bsPoly(arcPts(Q, [0, 0, 1], [0, 1, 0], R, Math.PI / 4, 3 * Math.PI / 4, 2000), G, P); },
    /* geschlossen: |r| = √2·R ist über den ganzen Bogen konstant,
       ds × r = R²(−1, −sin φ, −cos φ) dφ  ⇒  u = Γ/(8√2 πR)·(−π/2, −√2, 0) */
    uW3exact: function (G) {
      var k = G / (8 * Math.SQRT2 * Math.PI * R);
      return [k * (-Math.PI / 2), k * (-Math.SQRT2), 0];
    }
  };
}

/* ---- Prüfungsgeometrie 2: Tragflügel ----
   W2 gebunden als Kreissegment in der xy-Ebene (z = 0) um Q, ±45°,
   Aufpunkt P um a aus der Ebene versetzt.                                */
function geoFluegel(R, a) {
  var s2 = R * Math.SQRT2 / 2;
  var Q = [s2, 0, 0];
  var P = [s2, 0, a];
  var end1 = [0, s2, 0], end2 = [0, -s2, 0];   // φ = 3π/4 und 5π/4
  return {
    R: R, a: a, Q: Q, P: P, end1: end1, end2: end2,
    arc: function (n) { return arcPts(Q, [1, 0, 0], [0, 1, 0], R, 3 * Math.PI / 4, 5 * Math.PI / 4, n || 240); },
    uW1: function (G) { return bsRay(end1, [1, 0, 0], -G, Q); },
    uW3: function (G) { return bsRay(end2, [1, 0, 0], G, Q); },
    uW2num: function (G) { return bsPoly(arcPts(Q, [1, 0, 0], [0, 1, 0], R, 3 * Math.PI / 4, 5 * Math.PI / 4, 2000), G, P); },
    /* |r|² = R² + a² konstant, ds × r = R(a cos φ, a sin φ, R) dφ        */
    uW2exact: function (G) {
      var k = G * R / (4 * Math.PI * Math.pow(R * R + a * a, 1.5));
      return [k * (-Math.SQRT2 * a), 0, k * (Math.PI * R / 2)];
    }
  };
}

/* ---- Prüfungsgeometrie 3: zwei koaxiale Ringe auf der z-Achse ---- */
function geoRinge(R1, R2, L, G) {
  return {
    /* im Mittelpunkt von Ring 1 (Ursprung) */
    atRing1: { self: ringAxis(R1, 0, G), other: ringAxis(R2, L, G) },
    /* im Mittelpunkt von Ring 2 (z = L) */
    atRing2: { self: ringAxis(R2, 0, G), other: ringAxis(R1, L, G) },
    v1: ringAxis(R1, 0, G) + ringAxis(R2, L, G),
    v2: ringAxis(R2, 0, G) + ringAxis(R1, L, G)
  };
}

/* ---------------- Einstieg ---------------- */

FV.register({
  id: 'biotsavart',
  chapter: 'Drehungsbehaftete Strömungen',
  chapterNo: '10.1',
  title: 'Biot-Savart: woher die Geschwindigkeit kommt',
  subtitle: 'Ein Wirbelfaden ist gegeben, gesucht ist die Geschwindigkeit an einem Punkt. ' +
            'Das Integral wird hier Beitrag für Beitrag aufgebaut.',
  source: 'Skript S. 83 f., Abb. 10.5',

  build: function (root) {
    var h = FV.h;
    var C1 = '#ff8a4c', C2 = '#56c8f5', C3 = '#a78bfa',
        OK = '#6fdd8b', WARN = '#ffd166', DIM = '#6e7d8c';
    var GAMMA = 4 * Math.PI;   // damit Γ/(4π) = 1 und die Zahlen klein bleiben

    function f3(v) { return (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(3); }
    function vecTxt(u) { return '(' + f3(u[0]) + ', ' + f3(u[1]) + ', ' + f3(u[2]) + ')'; }

    /* Ein gemeinsamer Faktor für alle Vektoren einer Szene: der längste
       bekommt die Zielgrösse, die übrigen bleiben dazu im Verhältnis.
       Ein fester Faktor würde je nach Γ und Geometrie aus dem Bild laufen. */
    function scaleAll(vecs, target) {
      var mx = 0;
      vecs.forEach(function (v) { if (v) mx = Math.max(mx, vLen(v)); });
      return mx < 1e-12 ? 0 : target / mx;
    }

    /* ============================================================
       1 · Das Integral, Beitrag für Beitrag
       ============================================================ */

    root.appendChild(FV.section('1 · Das Integral, Beitrag für Beitrag'));

    root.appendChild(h('p', { html:
      'Ein Wirbelfaden mit der Zirkulation Γ liegt im Raum. Gesucht ist die Geschwindigkeit ' +
      'im Aufpunkt <b style="color:' + OK + '">x</b>. Das Gesetz von Biot-Savart zerlegt den ' +
      'Faden in Stücke d<i>s</i> und lässt jedes einzeln beitragen:' }));

    root.appendChild(FV.eq(
      '<b>u</b>(<b>x</b>) = <span class="frac"><span>Γ</span><span class="den">4π</span></span> ' +
      '∫<sub>C</sub> <span class="frac"><span>d<b>s</b> × <b>r</b></span>' +
      '<span class="den">|<b>r</b>|³</span></span> &nbsp;&nbsp;mit&nbsp;&nbsp; <b>r</b> = <b>x</b> − <b>s</b>',
      'Skript S. 83 — das allgemeine Gesetz für einen Wirbelfaden entlang der Raumkurve C'));

    root.appendChild(h('p', { html:
      'Drei Dinge stehen in diesem Ausdruck, und alle drei sieht man unten gleichzeitig: ' +
      'd<b>s</b> zeigt <b>entlang</b> des Fadens, <b>r</b> zeigt <b>vom Faden zum Aufpunkt</b>, ' +
      'und das Kreuzprodukt steht <b>senkrecht auf beiden</b>. Deshalb liegt der Beitrag d<b>u</b> ' +
      'nie in der von d<b>s</b> und <b>r</b> aufgespannten Ebene — dreh die Szene, dann wird das sichtbar.' }));

    var forms = {
      seg:  { lab: 'gerade Strecke',   sub: 'endliches Stück — die Formel mit θ₁ und θ₂' },
      line: { lab: 'unendlich lang',   sub: 'der Potentialwirbel, Γ/(2πr)' },
      ray:  { lab: 'halbunendlich',    sub: 'der Randwirbel, Γ/(4πr) — genau die Hälfte' },
      ring: { lab: 'Kreisring',        sub: 'geschlossen, auf der Achse exakt lösbar' },
      arc:  { lab: 'Kreissegment',     sub: 'der gebundene Wirbel der Prüfungsaufgaben' }
    };

    var st = {
      form: 'seg',
      len: 3.0,             // halbe Länge der Strecke bzw. Radius
      x: [0.0, 1.5, 1.2],   // Aufpunkt
      frac: 0.55,           // wie weit die Animation gelaufen ist
      running: false,
      showPar: true
    };

    var NSHOW = 30;         // sichtbare Häppchen — grob genug, um sie zu unterscheiden
    var NFINE = 1500;       // für die Kontrollzahl

    function curve(n) {
      var L = st.len;
      if (st.form === 'seg')  return segPts([-L, 0, 0], [L, 0, 0], n);
      if (st.form === 'line') return segPts([-400, 0, 0], [400, 0, 0], n);
      if (st.form === 'ray')  return segPts([0, 0, 0], [400, 0, 0], n);
      if (st.form === 'ring') return arcPts([0, 0, 0], [1, 0, 0], [0, 0, 1], L, 0, 2 * Math.PI, n);
      return arcPts([0, 0, 0], [1, 0, 0], [0, 1, 0], L, -Math.PI / 4, Math.PI / 4, n);
    }

    /* der gezeichnete Faden bleibt endlich, auch wenn die Physik unendlich ist */
    function curveShown(n) {
      var L = st.len;
      if (st.form === 'line') return segPts([-4.2, 0, 0], [4.2, 0, 0], n);
      if (st.form === 'ray')  return segPts([0, 0, 0], [4.2, 0, 0], n);
      return curve(n);
    }

    /* geschlossene Lösung, wo es eine gibt */
    function exact() {
      var L = st.len;
      if (st.form === 'seg')  return bsSeg([-L, 0, 0], [L, 0, 0], GAMMA, st.x);
      if (st.form === 'line') return bsLine([0, 0, 0], [1, 0, 0], GAMMA, st.x);
      if (st.form === 'ray')  return bsRay([0, 0, 0], [1, 0, 0], GAMMA, st.x);
      return null;   // Ring und Segment: nur auf der Achse geschlossen, siehe unten
    }

    var sc1 = FV.scene3d({
      aspect: 0.58, span: 8.5, azim: 0.75, elev: 0.44,
      cap: 'Der Laufpunkt wandert über den Faden. Grau das Parallelogramm aus d<b>s</b> und <b>r</b>, ' +
           'violett der Einzelbeitrag d<b>u</b>, grün die bis hierher aufgelaufene Summe. ' +
           'Der Aufpunkt lässt sich mit der Maus greifen.',
      pick: function () {
        return [{ p: st.x, set: function (p) { st.x = p; syncGeom(); } }];
      },
      draw: function (S) {
        var shown = curveShown(NSHOW);
        var terms = bsTerms(shown, GAMMA, st.x);
        var nDone = Math.max(1, Math.round(st.frac * terms.length));
        var cur = terms[Math.min(nDone, terms.length) - 1];

        S.grid3('xz', 4, 1);
        S.axes(2.5, ['x', 'y', 'z']);

        /* der Wirbelfaden */
        S.filament3(shown, { color: C1, width: 3.4, heads: st.form === 'ring' ? 4 : 3 });
        if (st.form === 'line' || st.form === 'ray') {
          S.label3(shown[shown.length - 1], '→ ∞', { color: C1, dx: 8, font: '12px var(--mono), monospace' });
          if (st.form === 'line') S.label3(shown[0], '∞ ←', { color: C1, dx: -34 });
        }
        S.label3(shown[Math.floor(shown.length * 0.18)], 'Γ', { color: C1, dx: -4, dy: -14, font: 'italic 14px Georgia, serif' });

        /* Aufpunkt */
        S.point3(st.x, { color: OK, r: 5.5, ring: 'rgba(111,221,139,.45)' });
        S.label3(st.x, 'Aufpunkt x', { color: OK, dx: 11, dy: -12, font: '12px -apple-system, sans-serif' });

        if (cur) {
          /* das Stück ds, stark betont */
          var dsEnd = vAdd(cur.a, vMul(cur.ds, 1));
          S.line3(cur.a, dsEnd, { color: '#fff', width: 5 });
          S.arrow3(cur.mid, vAdd(cur.mid, vMul(vUnit(cur.ds), 0.85)),
                   { color: '#fff', width: 2.2, head: 10 });
          S.label3(vAdd(cur.mid, vMul(vUnit(cur.ds), 0.9)), 'ds',
                   { color: '#fff', dx: 4, dy: -8, font: 'italic 13px Georgia, serif' });

          /* r vom Faden zum Aufpunkt */
          S.arrow3(cur.mid, st.x, { color: C2, width: 1.9, head: 10 });
          S.label3(vMul(vAdd(cur.mid, st.x), 0.5), 'r',
                   { color: C2, dx: 6, dy: 8, font: 'italic 14px Georgia, serif' });

          /* Parallelogramm aus ds und r — macht sichtbar, worauf du senkrecht steht */
          if (st.showPar) {
            var dsU = vMul(vUnit(cur.ds), 0.85);
            S.fill3([cur.mid, vAdd(cur.mid, dsU), vAdd(vAdd(cur.mid, dsU), cur.r), st.x],
                    { color: 'rgba(120,140,165,.16)', stroke: 'rgba(150,170,195,.35)', width: 1 });
          }

          /* der Einzelbeitrag du, gross skaliert */
          var duS = vLen(cur.du) > 1e-9 ? vMul(cur.du, 0.9 / vLen(cur.du) * Math.min(1, vLen(cur.du) * 6)) : [0, 0, 0];
          if (vLen(duS) > 1e-6) {
            S.arrow3(st.x, vAdd(st.x, duS), { color: C3, width: 2.6, head: 11, layer: 'front' });
            S.label3(vAdd(st.x, duS), 'du', { color: C3, dx: 6, dy: -6, font: 'italic 13px Georgia, serif', layer: 'front' });
          }

          /* die aufgelaufene Summe */
          var uP = bsPartial(terms, nDone);
          var uS = vLen(uP) > 1e-9 ? vMul(vUnit(uP), Math.min(2.0, vLen(uP) * 1.5)) : [0, 0, 0];
          if (vLen(uS) > 1e-6) {
            S.arrow3(st.x, vAdd(st.x, uS), { color: OK, width: 3.2, head: 13, layer: 'front' });
            S.label3(vAdd(st.x, uS), 'u', { color: OK, dx: 8, dy: -8, font: 'italic 15px Georgia, serif', layer: 'front' });
          }

          /* schon abgearbeiteter Teil des Fadens hervorheben */
          S.poly3(shown.slice(0, nDone + 1), { color: '#fff5e8', width: 1.4, alpha: 0.5 });
        }
      }
    });
    root.appendChild(sc1);

    var ro1 = FV.readout([
      { key: 'seg', lab: 'Stück Nr.' },
      { key: 'r', lab: '|r| am Laufpunkt', cls: 'c2' },
      { key: 'w', lab: '|ds × r| / |r|³' },
      { key: 'du', lab: '|du| dieses Stücks', cls: 'c3' },
      { key: 'u', lab: '|u| aufgelaufen' }
    ]);
    root.appendChild(ro1);

    var slFrac = FV.slider({
      label: 'Laufpunkt auf dem Faden', min: 0.02, max: 1, step: 0.005, value: 0.55,
      fmt: function (v) { return (v * 100).toFixed(0) + ' %'; },
      onInput: function (v) { st.frac = v; sync1(); }
    });

    var btnRun = FV.toggle('▶ durchlaufen', false, function (s) { st.running = s; });

    var formRow = h('div', { class: 'btn-row' });
    var formBtns = {};
    Object.keys(forms).forEach(function (k) {
      var b = FV.button(forms[k].lab, function () {
        st.form = k;
        st.frac = 0.55;
        slFrac.set(0.55);
        Object.keys(formBtns).forEach(function (j) { formBtns[j].classList.toggle('on', j === k); });
        formSub.innerHTML = forms[k].sub;
        syncGeom();
      });
      if (k === st.form) b.classList.add('on');
      formBtns[k] = b;
      formRow.appendChild(b);
    });
    var formSub = h('div', { class: 'canvas-cap', style: 'text-align:left;margin-top:4px', html: forms.seg.sub });

    root.appendChild(formRow);
    root.appendChild(formSub);
    root.appendChild(FV.ctrlRow(
      slFrac,
      FV.slider({
        label: 'Länge bzw. Radius', min: 0.6, max: 4, step: 0.05, value: st.len,
        fmt: function (v) { return v.toFixed(2); },
        onInput: function (v) { st.len = v; syncGeom(); }
      })
    ));
    root.appendChild(FV.ctrlRow(
      btnRun,
      FV.toggle('Parallelogramm', true, function (s) { st.showPar = s; sc1.draw(); }),
      FV.button('Aufpunkt zurücksetzen', function () { st.x = [0.0, 1.5, 1.2]; syncGeom(); })
    ));

    root.appendChild(FV.legend([
      { c: C1, t: 'Wirbelfaden C mit Zirkulation Γ' },
      { c: '#ffffff', t: 'das aktuelle Stück ds' },
      { c: C2, t: 'r = x − s' },
      { c: C3, t: 'Beitrag du dieses Stücks' },
      { c: OK, t: 'Aufpunkt x und aufgelaufene Summe u' }
    ]));

    function sync1() {
      var shown = curveShown(NSHOW);
      var terms = bsTerms(shown, GAMMA, st.x);
      var nDone = Math.max(1, Math.round(st.frac * terms.length));
      var cur = terms[Math.min(nDone, terms.length) - 1];
      if (cur) {
        ro1.set('seg', nDone + ' / ' + terms.length);
        ro1.set('r', cur.rlen.toFixed(3));
        ro1.set('w', (vLen(cur.cross) / Math.pow(cur.rlen, 3) / vLen(cur.ds)).toFixed(3));
        ro1.set('du', vLen(cur.du).toFixed(4));
        ro1.set('u', vLen(bsPartial(terms, nDone)).toFixed(4));
      }
      sc1.draw();
    }

    /* sync2 hängt nur an Form, Länge und Aufpunkt — nicht am Laufpunkt.
       Deshalb läuft das feine Integral nicht bei jedem Animationsframe mit. */
    function syncGeom() { sync1(); sync2(); }

    FV.loop(function () {
      if (!st.running) return;
      st.frac += 0.006;
      if (st.frac > 1) st.frac = 0.02;
      slFrac.set(st.frac);      // ruft onInput und damit sync1
    });

    root.appendChild(FV.note('', 'Warum die Summe zum Schluss kippt',
      'Bei der geraden Strecke zeigen alle Beiträge in dieselbe Richtung — die Summe wächst nur. ' +
      'Beim Kreisring ist das anders: die gegenüberliegende Seite des Rings liefert Beiträge mit ' +
      'entgegengesetzter Komponente, und der Summenvektor dreht sich unterwegs. Genau deshalb ist ' +
      'die Geschwindigkeit im Ringzentrum kleiner, als man nach dem ersten Viertel des Umlaufs vermutet.'));

    /* ============================================================
       2 · Die Formel daneben — zur Kontrolle
       ============================================================ */

    root.appendChild(FV.section('2 · Die geschlossene Formel — und die Probe'));

    root.appendChild(h('p', { html:
      'Für ein <b>gerades</b> Fadenstück lässt sich das Integral geschlossen ausrechnen. Das Skript ' +
      'gibt das Ergebnis über den Abstand r und die beiden Winkel θ₁ (Innenwinkel des Dreiecks) und ' +
      'θ₂ (Aussenwinkel) an:' }));

    root.appendChild(FV.eq(
      'u<sub>ϑ</sub> = <span class="frac"><span>Γ</span><span class="den">4πr</span></span> ' +
      '(cos θ₁ − cos θ₂)',
      'Skript S. 83 — u<sub>ϑ</sub> steht senkrecht auf der von Faden und Aufpunkt aufgespannten Ebene'));

    var ro2 = FV.readout([
      { key: 'num', lab: 'Integral, numerisch' },
      { key: 'ex', lab: 'Formel, geschlossen', cls: 'c2' },
      { key: 'dev', lab: 'Abweichung' },
      { key: 't1', lab: 'θ₁' },
      { key: 't2', lab: 'θ₂' },
      { key: 'hh', lab: 'Abstand r' }
    ]);
    root.appendChild(ro2);
    var hint2 = h('p', { class: 'canvas-cap', style: 'text-align:left' });
    root.appendChild(hint2);

    function sync2() {
      var uN = bsPoly(curve(NFINE), GAMMA, st.x);
      var uE = exact();
      ro2.set('num', vLen(uN).toFixed(4));

      if (st.form === 'seg' || st.form === 'ray' || st.form === 'line') {
        var L = st.len;
        var A = st.form === 'seg' ? segAngles([-L, 0, 0], [L, 0, 0], st.x)
                                  : segAngles([0, 0, 0], [1, 0, 0], st.x);
        var cos2 = st.form === 'seg' ? A.cos2 : -1;
        var cos1 = st.form === 'line' ? 1 : A.cos1;
        ro2.set('ex', vLen(uE).toFixed(4));
        ro2.set('t1', (Math.acos(Math.max(-1, Math.min(1, cos1))) * 180 / Math.PI).toFixed(1) + '°');
        ro2.set('t2', (Math.acos(Math.max(-1, Math.min(1, cos2))) * 180 / Math.PI).toFixed(1) + '°');
        ro2.set('hh', A.h.toFixed(3));
        var dev = Math.abs(vLen(uN) - vLen(uE));
        ro2.set('dev', dev < 1e-4 ? '< 10⁻⁴' : dev.toExponential(1));
        hint2.innerHTML = st.form === 'seg'
          ? 'Beide Zahlen stammen aus verschiedenen Rechnungen: links die Summe über 1500 Stücke, ' +
            'rechts die Formel. Dass sie übereinstimmen, ist die Probe — keine Behauptung.'
          : 'Der gezeichnete Faden ist abgeschnitten, die Formel rechnet mit dem unendlichen. ' +
            'Die numerische Spalte hinkt deshalb etwas hinterher; wie sie aufholt, zeigt Abschnitt 3.';
      } else {
        ro2.set('ex', '—');
        ro2.set('dev', '—');
        ro2.set('t1', '—'); ro2.set('t2', '—');
        ro2.set('hh', vLen(vSub(st.x, [0, 0, 0])).toFixed(3));
        hint2.innerHTML = 'Für den gekrümmten Faden gibt es keine Winkelformel — hier bleibt nur das ' +
          'Integral. Geschlossen lösbar ist der Ring trotzdem, aber nur auf seiner Achse: dort ist |r| ' +
          'über den ganzen Umlauf konstant. Dasselbe Argument trägt die Prüfungsaufgaben in Abschnitt 5.';
      }
    }

    root.appendChild(FV.note('key', 'Die drei Fälle, die man auswendig können sollte',
      '<ul style="margin:0;padding-left:18px">' +
      '<li><b>Unendlich langer Faden</b> — θ₁ → 0, θ₂ → π, also cos θ₁ − cos θ₂ → 2: ' +
      'u = Γ/(2πr). Das ist der Potentialwirbel.</li>' +
      '<li><b>Halbunendlicher Faden</b>, Aufpunkt senkrecht über dem Ende — θ₁ = π/2, θ₂ = π, ' +
      'also cos θ₁ − cos θ₂ = 1: u = Γ/(4πr). Genau die Hälfte. Das ist der Randwirbel am Tragflügel.</li>' +
      '<li><b>Kreisring auf seiner Achse</b> — u = Γ R²/(2(R² + z²)<sup>3/2</sup>), im Zentrum Γ/(2R).</li>' +
      '</ul>'));

    /* ============================================================
       3 · Die Grenzübergänge
       ============================================================ */

    root.appendChild(FV.section('3 · Wie aus dem Stück der Potentialwirbel wird'));

    root.appendChild(h('p', { html:
      'Der Faktor ½ zwischen halbunendlich und unendlich ist keine Definition, sondern ein Grenzwert. ' +
      'Unten steht die induzierte Geschwindigkeit in dimensionsloser Form 4πr·u/Γ über der Fadenlänge. ' +
      'Der Aufpunkt sitzt im Abstand r senkrecht über der Fadenmitte (blau) beziehungsweise über dem ' +
      'Fadenanfang (orange).' }));

    var st3 = { r: 1.0, L: 3 };

    var cv3 = FV.canvas({
      aspect: 0.46,
      render: function (ctx, w, hgt) {
        var P = FV.plot(ctx, {
          w: w, h: hgt, x: [0, 20], y: [0, 2.3],
          pad: { l: 54, r: 16, t: 16, b: 40 },
          xticks: [0, 5, 10, 15, 20], yticks: [0, 0.5, 1, 1.5, 2],
          xlabel: 'halbe Fadenlänge  ℓ / r', ylabel: '4πr·u / Γ'
        });
        P.grid(); P.axes();

        /* Asymptoten */
        P.poly([[0, 2], [20, 2]], { color: 'rgba(86,200,245,.35)', width: 1.4, dash: [5, 4] });
        P.poly([[0, 1], [20, 1]], { color: 'rgba(255,138,76,.35)', width: 1.4, dash: [5, 4] });
        P.label(19.4, 2.11, 'Γ / 2πr', '#56c8f5', 'right');
        P.label(19.4, 1.11, 'Γ / 4πr', '#ff8a4c', 'right');

        /* beidseitig: Aufpunkt über der Mitte, Länge 2ℓ  → 2·ℓ/√(ℓ²+r²) */
        P.clip(function () {
          P.curve(function (l) { return 2 * l / Math.sqrt(l * l + 1); }, { color: C2, width: 2.4 });
          /* einseitig: Aufpunkt über dem Anfang, Länge ℓ → ℓ/√(ℓ²+r²) */
          P.curve(function (l) { return l / Math.sqrt(l * l + 1); }, { color: C1, width: 2.4 });
        });

        var lv = st3.L;
        P.vline(lv, { color: '#8899aa', dash: [3, 3] });
        P.dot(lv, 2 * lv / Math.sqrt(lv * lv + 1), C2, 4.5);
        P.dot(lv, lv / Math.sqrt(lv * lv + 1), C1, 4.5);
      }
    });
    root.appendChild(cv3);

    var ro3 = FV.readout([
      { key: 'b', lab: 'beidseitig  4πr·u/Γ', cls: 'c2' },
      { key: 'e', lab: 'einseitig  4πr·u/Γ', cls: 'c1' },
      { key: 'q', lab: 'Verhältnis' },
      { key: 't', lab: 'θ₁ einseitig' }
    ]);
    root.appendChild(ro3);

    root.appendChild(FV.ctrlRow(FV.slider({
      label: 'halbe Fadenlänge ℓ / r', min: 0.1, max: 20, step: 0.1, value: 3,
      fmt: function (v) { return v.toFixed(1); },
      onInput: function (v) { st3.L = v; sync3(); }
    })));

    function sync3() {
      var l = st3.L;
      var b = 2 * l / Math.sqrt(l * l + 1), e = l / Math.sqrt(l * l + 1);
      ro3.set('b', b.toFixed(4));
      ro3.set('e', e.toFixed(4));
      ro3.set('q', (b / e).toFixed(4));
      ro3.set('t', '90.0°');
      cv3.draw();
    }
    sync3();

    root.appendChild(FV.note('', 'Was das Diagramm sagt',
      'Das Verhältnis der beiden Kurven ist bei <b>jeder</b> Länge exakt 2 — der Faktor ½ gilt also ' +
      'nicht erst im Grenzwert, sondern für jedes Paar aus halbem und ganzem Faden. Was der Grenzwert ' +
      'liefert, ist der <b>Zahlenwert</b>: bei ℓ = 5r sind erst 98 % erreicht, bei ℓ = 20r sind es 99.9 %. ' +
      'Ein Faden von zwanzigfacher Länge des Aufpunktabstands ist also praktisch unendlich lang.'));

    /* ============================================================
       4 · Verteilte Wirbelstärke — das Volumenintegral
       ============================================================ */

    root.appendChild(FV.section('4 · Wenn ω im Raum verteilt ist'));

    root.appendChild(h('p', { html:
      'Ein Wirbelfaden ist eine Idealisierung. Liegt ω stattdessen als Feld im Raum vor, tritt an die ' +
      'Stelle des Linienintegrals ein Volumenintegral — die Struktur bleibt aber dieselbe: ein ' +
      'Kreuzprodukt geteilt durch |r|³.' }));

    root.appendChild(FV.eq(
      '<b>u</b>(<b>x</b>) = <span class="frac"><span>1</span><span class="den">4π</span></span> ' +
      '∫<sub>V</sub> <span class="frac"><span><b>ω</b> × <b>r</b></span>' +
      '<span class="den">|<b>r</b>|³</span></span> dV &nbsp;&nbsp;mit&nbsp;&nbsp; ' +
      '<b>r</b> = <b>x</b> − <b>r</b><sub>ω</sub>',
      'Skript S. 84, Abb. 10.5'));

    var st4 = { x: [2.4, 1.3, 0.6] };

    var sc4 = FV.scene3d({
      aspect: 0.48, span: 9, azim: 0.72, elev: 0.36,
      cap: 'Jede Zelle dV trägt mit <b>ω</b> × <b>r</b>/|<b>r</b>|³ bei. Die Zellen weiter weg zählen ' +
           'mit 1/|<b>r</b>|² weniger — das Volumen wächst mit r², der Nenner mit r³.',
      pick: function () { return [{ p: st4.x, set: function (p) { st4.x = p; sc4.draw(); } }]; },
      draw: function (S) {
        S.axes(2.6, ['x', 'y', 'z']);

        /* eine kompakte Wirbelregion aus Zellen, ω im Wesentlichen entlang z */
        var cells = [];
        for (var i = -1; i <= 1; i++) {
          for (var j = -1; j <= 1; j++) {
            for (var k = -1; k <= 1; k++) {
              var p = [i * 0.52, j * 0.52, k * 0.52];
              var rr = Math.hypot(p[0], p[1]);
              if (rr > 1.15) continue;
              cells.push({ p: p, om: [0, 0, 1.0 * Math.exp(-rr * rr * 0.9)] });
            }
          }
        }
        cells.forEach(function (c) {
          var s = 0.30;
          S.fill3([[c.p[0] - s, c.p[1] - s, c.p[2]], [c.p[0] + s, c.p[1] - s, c.p[2]],
                   [c.p[0] + s, c.p[1] + s, c.p[2]], [c.p[0] - s, c.p[1] + s, c.p[2]]],
                  { color: 'rgba(255,138,76,.10)', stroke: 'rgba(255,138,76,.30)', width: 0.8 });
          S.arrow3(c.p, vAdd(c.p, vMul(c.om, 0.5)), { color: C1, width: 1.4, head: 6, alpha: 0.85 });
        });
        S.label3([0, 0, 1.5], 'ω', { color: C1, dx: 6, font: 'italic 15px Georgia, serif' });
        S.label3([0.75, -0.75, -0.6], 'dV', { color: '#8899aa', dx: 4, font: 'italic 12px Georgia, serif' });

        /* Beiträge von drei Zellen exemplarisch */
        var u = [0, 0, 0];
        cells.forEach(function (c) {
          var r = vSub(st4.x, c.p), rl = vLen(r);
          u = vAdd(u, vMul(vCross(c.om, r), 1 / Math.pow(rl, 3)));
        });
        u = vMul(u, 1 / (4 * Math.PI) * 8);

        [cells[0], cells[Math.floor(cells.length / 2)], cells[cells.length - 1]].forEach(function (c) {
          if (!c) return;
          S.line3(c.p, st4.x, { color: 'rgba(86,200,245,.5)', width: 1, dash: [3, 3] });
        });
        S.point3(st4.x, { color: OK, r: 5, ring: 'rgba(111,221,139,.45)' });
        S.label3(st4.x, ' x', { color: OK, dx: 8, dy: -10, font: 'italic 14px Georgia, serif' });
        if (vLen(u) > 1e-6) {
          S.arrow3(st4.x, vAdd(st4.x, vMul(vUnit(u), Math.min(1.6, vLen(u) * 3))),
                   { color: OK, width: 2.8, head: 12, layer: 'front' });
        }
      }
    });
    root.appendChild(sc4);

    root.appendChild(FV.note('', 'Der Zusammenhang zwischen beiden Formen',
      'Schnürt man die Wirbelregion zu einem dünnen Faden zusammen, wird aus ω dV das Produkt ' +
      'Γ d<b>s</b> — die Zirkulation Γ ist ja gerade der Wirbelfluss durch den Querschnitt. Damit geht ' +
      'das Volumenintegral in das Linienintegral aus Abschnitt 1 über. Beide Formeln sind dieselbe Aussage.'));

    /* ============================================================
       5 · Rechenlabor: drei Prüfungsgeometrien
       ============================================================ */

    root.appendChild(FV.section('5 · Rechenlabor — drei Prüfungsgeometrien'));

    root.appendChild(h('p', { html:
      'Alle drei Aufgaben haben denselben Bau: <b>zwei halbunendliche Fäden</b> und ein ' +
      '<b>endlicher gebundener Faden</b>, der als Kreissegment modelliert ist. Für die geraden Teile ' +
      'nimmt man die Winkelformel, für das Segment muss man integrieren. Der Trick ist jedes Mal ' +
      'derselbe: bei geschickter Wahl des Aufpunkts ist <b>|r| über den ganzen Bogen konstant</b> und ' +
      'wandert aus dem Integral heraus.' }));

    /* ---- 5a Gleitschirm ---- */

    root.appendChild(h('h3', null, 'a · Gleitschirm — gebundener Wirbel in der y-z-Ebene'));

    root.appendChild(h('p', { html:
      'Der Schirm ist ein Kreissegment um Q mit Radius R = √2·a, der Bogen spannt ±45° um die ' +
      'y-Achse. Die Randwirbel W1 und W2 laufen von den Bogenenden in <i>x</i>-Richtung nach hinten. ' +
      'Gesucht sind u, v und w im Punkt P = (R, −a, 0).' }));

    var stA = { a: 1.0, show: { w1: true, w2: true, w3: true } };

    function schirmScene() {
      var g = geoSchirm(stA.a);
      return g;
    }

    var scA = FV.scene3d({
      aspect: 0.62, span: 9.5, azim: 0.95, elev: 0.30,
      cap: 'W3 ist der gebundene Wirbel im Schirm, W1 und W2 sind die Randwirbel. Die Zirkulation ' +
           'läuft nach Helmholtz ohne Unterbrechung durch das ganze System — deshalb ist die ' +
           'Pfeilrichtung auf allen drei Fäden festgelegt, sobald sie auf einem feststeht.',
      draw: function (S) {
        var g = schirmScene(), a = stA.a;
        S.axes(3.0, ['x', 'y', 'z']);

        /* Anströmung */
        S.arrow3([-3.4, -a, 0], [-2.2, -a, 0], { color: DIM, width: 1.6, head: 9 });
        S.label3([-3.4, -a, 0], 'u∞', { color: DIM, dx: -6, dy: -12, font: 'italic 13px Georgia, serif', align: 'right' });
        /* Schwerkraft */
        S.arrow3([2.6, 0.4, -2.2], [2.6, -0.8, -2.2], { color: DIM, width: 1.4, head: 8 });
        S.label3([2.6, -0.8, -2.2], 'g', { color: DIM, dx: 6, font: 'italic 13px Georgia, serif' });

        /* W1: kommt aus dem Unendlichen und endet am Bogenende 1 */
        if (stA.show.w1) {
          S.filament3(segPts([5.0, 0, a], g.end1, 40), { color: C2, width: 3, heads: 3 });
          S.label3([4.2, 0, a], 'W1', { color: C2, dx: 6, dy: -10 });
        }
        /* W2: startet am Bogenende 2 und läuft ins Unendliche */
        if (stA.show.w2) {
          S.filament3(segPts(g.end2, [5.0, 0, -a], 40), { color: C3, width: 3, heads: 3 });
          S.label3([4.2, 0, -a], 'W2', { color: C3, dx: 6, dy: -10 });
        }
        /* W3: der gebundene Bogen */
        if (stA.show.w3) {
          S.filament3(g.arc(60), { color: C1, width: 4, heads: 2 });
          S.label3(g.arc(8)[4], 'W3', { color: C1, dx: -6, dy: -16 });
        }

        /* Q, P und die Radien */
        S.point3(g.Q, { color: '#8899aa', r: 3.5 });
        S.label3(g.Q, 'Q', { color: '#c8d3de', dx: -14, dy: 8, font: 'italic 13px Georgia, serif' });
        S.line3(g.Q, g.end1, { color: '#4a5663', width: 1, dash: [3, 3] });
        S.line3(g.Q, g.end2, { color: '#4a5663', width: 1, dash: [3, 3] });
        S.line3(g.Q, [0, -stA.a + g.R, 0], { color: '#4a5663', width: 1, dash: [3, 3] });
        S.label3(vMul(vAdd(g.Q, g.end1), 0.5), 'R', { color: '#7b8896', dx: 4, dy: 6, font: 'italic 12px Georgia, serif' });

        S.point3(g.P, { color: OK, r: 5, ring: 'rgba(111,221,139,.45)' });
        S.label3(g.P, 'P', { color: OK, dx: 9, dy: -8, font: 'italic 14px Georgia, serif' });

        /* die drei Beiträge in P */
        var G = GAMMA, tot = [0, 0, 0];
        var parts = [];
        if (stA.show.w1) parts.push({ u: g.uW1(G), c: C2 });
        if (stA.show.w2) parts.push({ u: g.uW2(G), c: C3 });
        if (stA.show.w3) parts.push({ u: g.uW3exact(G), c: C1 });
        parts.forEach(function (p) { tot = vAdd(tot, p.u); });
        var kA = scaleAll(parts.map(function (p) { return p.u; }).concat([tot]), 1.5);
        parts.forEach(function (p) {
          if (vLen(p.u) > 1e-9) {
            S.arrow3(g.P, vAdd(g.P, vMul(p.u, kA)), { color: p.c, width: 2, head: 9, alpha: 0.9, layer: 'front' });
          }
        });
        if (vLen(tot) > 1e-9) {
          S.arrow3(g.P, vAdd(g.P, vMul(tot, kA)), { color: OK, width: 3.2, head: 12, layer: 'front' });
          S.label3(vAdd(g.P, vMul(tot, kA)), 'u ges', { color: OK, dx: 7, dy: -6, layer: 'front' });
        }
      }
    });
    root.appendChild(scA);

    var roA = FV.readout([
      { key: 'w3', lab: 'W3 (Bogen) — u, v, w', cls: 'c1' },
      { key: 'w3n', lab: 'W3 numerisch nachgerechnet' },
      { key: 'w12', lab: 'W1 + W2 — u, v, w', cls: 'c2' },
      { key: 'tot', lab: 'zusammen' }
    ]);
    root.appendChild(roA);

    root.appendChild(FV.ctrlRow(
      FV.slider({
        label: 'a  (R = √2·a)', min: 0.5, max: 2, step: 0.01, value: 1,
        fmt: function (v) { return v.toFixed(2); },
        onInput: function (v) { stA.a = v; syncA(); }
      })
    ));
    root.appendChild(FV.ctrlRow(
      FV.toggle('W1', true, function (s) { stA.show.w1 = s; syncA(); }),
      FV.toggle('W2', true, function (s) { stA.show.w2 = s; syncA(); }),
      FV.toggle('W3 (gebunden)', true, function (s) { stA.show.w3 = s; syncA(); })
    ));

    function syncA() {
      var g = geoSchirm(stA.a), G = GAMMA;
      var u3 = g.uW3exact(G), u3n = g.uW3num(G);
      var u12 = vAdd(g.uW1(G), g.uW2(G));
      roA.set('w3', vecTxt(u3));
      roA.set('w3n', vecTxt(u3n));
      roA.set('w12', vecTxt(u12));
      roA.set('tot', vecTxt(vAdd(u3, u12)));
      scA.draw();
    }
    syncA();

    root.appendChild(FV.note('warn', 'Der Rechenweg für den Bogen',
      'Parametrisiere <b>s</b>(φ) = <b>x</b><sub>Q</sub> + R(0, sin φ, cos φ) mit φ von π/4 bis 3π/4. ' +
      'Dann ist <b>x</b><sub>P</sub> − <b>x</b><sub>Q</sub> = (R, 0, 0) und damit ' +
      '<b>r</b> = (R, −R sin φ, −R cos φ). Der entscheidende Schritt: ' +
      '|<b>r</b>|² = R² (1 + sin²φ + cos²φ) = 2R² ist <b>konstant</b> und darf vor das Integral. ' +
      'Es bleibt d<b>s</b> × <b>r</b> = R²(−1, −sin φ, −cos φ) dφ, und die drei Integrale sind ' +
      'elementar:<br><br>' +
      '<b>u</b><sub>W3</sub> = Γ/(8√2 πR) · (−π/2, −√2, 0) = ( −Γ/(16√2 R), −Γ/(8πR), 0 )<br><br>' +
      'Mit R = √2·a also u = −Γ/(32a), v = −√2Γ/(16πa), w = 0. Das <b>v &lt; 0</b> ist der Abwind — ' +
      'der Schirm fliegt in seinem eigenen Abwind, genau wie der Tragflügel in Kapitel 10.4. ' +
      '⚠ Ohne offizielle Musterlösung; die Zahl oben rechnet dieselbe Geometrie numerisch nach.'));

    /* ---- 5b Tragflügel ---- */

    root.appendChild(h('h3', null, 'b · Tragflügel — derselbe Bau, andere Achsenlage'));

    root.appendChild(h('p', { html:
      'Hier liegen alle Fäden in der xy-Ebene (z = 0), und der Aufpunkt P ist um a aus dieser Ebene ' +
      'herausgehoben. Das ist der eigentliche Stolperstein der Aufgabe — die Geometrie ist dieselbe ' +
      'wie beim Schirm, nur sind x, y und z vertauscht.' }));

    var stB = { R: 1.4, a: 0.9, show: { w1: true, w3: true, w2: true } };

    var scB = FV.scene3d({
      aspect: 0.62, span: 9.5, azim: 0.85, elev: 0.36,
      cap: 'W2 ist der gebundene Wirbel, W1 und W3 die halbunendlichen Randwirbel. Q liegt im ' +
           'Bogenmittelpunkt, P genau um a darüber.',
      draw: function (S) {
        var g = geoFluegel(stB.R, stB.a);
        S.axes(3.0, ['x', 'y', 'z']);
        S.arrow3([-3.4, 0, 0], [-2.3, 0, 0], { color: DIM, width: 1.6, head: 9 });
        S.label3([-3.4, 0, 0], 'u∞', { color: DIM, dx: -6, dy: -12, font: 'italic 13px Georgia, serif', align: 'right' });

        if (stB.show.w1) {
          S.filament3(segPts([5.0, g.end1[1], 0], g.end1, 40), { color: C2, width: 3, heads: 3 });
          S.label3([4.2, g.end1[1], 0], 'W1', { color: C2, dx: 6, dy: -10 });
        }
        if (stB.show.w3) {
          S.filament3(segPts(g.end2, [5.0, g.end2[1], 0], 40), { color: C3, width: 3, heads: 3 });
          S.label3([4.2, g.end2[1], 0], 'W3', { color: C3, dx: 6, dy: -10 });
        }
        if (stB.show.w2) {
          S.filament3(g.arc(60), { color: C1, width: 4, heads: 2 });
          S.label3(g.arc(8)[4], 'W2', { color: C1, dx: -10, dy: -14 });
        }

        S.point3(g.Q, { color: '#8899aa', r: 3.5 });
        S.label3(g.Q, 'Q', { color: '#c8d3de', dx: -6, dy: 14, font: 'italic 13px Georgia, serif' });
        S.point3(g.P, { color: OK, r: 5, ring: 'rgba(111,221,139,.45)' });
        S.label3(g.P, 'P', { color: OK, dx: 9, dy: -8, font: 'italic 14px Georgia, serif' });
        S.line3(g.Q, g.P, { color: '#4a5663', width: 1, dash: [3, 3] });
        S.label3(vMul(vAdd(g.Q, g.P), 0.5), 'a', { color: '#7b8896', dx: 7, font: 'italic 12px Georgia, serif' });
        S.line3(g.Q, g.end1, { color: '#4a5663', width: 1, dash: [3, 3] });
        S.line3(g.Q, g.end2, { color: '#4a5663', width: 1, dash: [3, 3] });

        var G = GAMMA;
        var uW2 = g.uW2exact(G);
        var uQ = [0, 0, 0];
        if (stB.show.w1) uQ = vAdd(uQ, g.uW1(G));
        if (stB.show.w3) uQ = vAdd(uQ, g.uW3(G));
        var kB = scaleAll([uW2, uQ], 1.5);
        if (stB.show.w2 && vLen(uW2) > 1e-9) {
          S.arrow3(g.P, vAdd(g.P, vMul(uW2, kB)), { color: C1, width: 2.6, head: 11, layer: 'front' });
          S.label3(vAdd(g.P, vMul(uW2, kB)), 'u von W2 in P', { color: C1, dx: 7, dy: -6, layer: 'front' });
        }
        if (vLen(uQ) > 1e-9) {
          S.arrow3(g.Q, vAdd(g.Q, vMul(uQ, kB)), { color: C2, width: 2.6, head: 11, layer: 'front' });
          S.label3(vAdd(g.Q, vMul(uQ, kB)), 'W1+W3 in Q', { color: C2, dx: 7, dy: 12, layer: 'front' });
        }
      }
    });
    root.appendChild(scB);

    var roB = FV.readout([
      { key: 'w2', lab: 'W2 in P — u, v, w', cls: 'c1' },
      { key: 'w2n', lab: 'W2 numerisch nachgerechnet' },
      { key: 'w13', lab: 'W1 + W3 in Q — u, v, w', cls: 'c2' },
      { key: 'r', lab: '|r| auf dem Bogen' }
    ]);
    root.appendChild(roB);

    root.appendChild(FV.ctrlRow(
      FV.slider({
        label: 'Radius R', min: 0.6, max: 2.2, step: 0.02, value: stB.R,
        fmt: function (v) { return v.toFixed(2); },
        onInput: function (v) { stB.R = v; syncB(); }
      }),
      FV.slider({
        label: 'Versatz a von P', min: 0.1, max: 2, step: 0.02, value: stB.a,
        fmt: function (v) { return v.toFixed(2); },
        onInput: function (v) { stB.a = v; syncB(); }
      })
    ));
    root.appendChild(FV.ctrlRow(
      FV.toggle('W1', true, function (s) { stB.show.w1 = s; syncB(); }),
      FV.toggle('W2 (gebunden)', true, function (s) { stB.show.w2 = s; syncB(); }),
      FV.toggle('W3', true, function (s) { stB.show.w3 = s; syncB(); })
    ));

    function syncB() {
      var g = geoFluegel(stB.R, stB.a), G = GAMMA;
      roB.set('w2', vecTxt(g.uW2exact(G)));
      roB.set('w2n', vecTxt(g.uW2num(G)));
      roB.set('w13', vecTxt(vAdd(g.uW1(G), g.uW3(G))));
      roB.set('r', Math.sqrt(stB.R * stB.R + stB.a * stB.a).toFixed(3));
      scB.draw();
    }
    syncB();

    root.appendChild(FV.note('warn', 'Der Rechenweg für den Bogen',
      'Mit <b>s</b>(φ) = <b>x</b><sub>Q</sub> + R(cos φ, sin φ, 0), φ von 3π/4 bis 5π/4, und ' +
      'P = Q + (0, 0, a) wird <b>r</b> = (−R cos φ, −R sin φ, a). Wieder ist ' +
      '|<b>r</b>|² = R² + a² <b>konstant</b>. Es bleibt d<b>s</b> × <b>r</b> = R(a cos φ, a sin φ, R) dφ ' +
      'und damit<br><br>' +
      '<b>u</b><sub>W2</sub> = <span class="frac"><span>ΓR</span>' +
      '<span class="den">4π(R² + a²)<sup>3/2</sup></span></span> · ( −√2·a, 0, πR/2 )<br><br>' +
      'Die y-Komponente fällt weg, weil ∫sin φ dφ über ein zur x-Achse symmetrisches Intervall ' +
      'verschwindet. Für W1 und W3 in Q genügt die Winkelformel — beide Fäden sind halbunendlich, ' +
      'also cos θ₂ = −1. ⚠ Ohne offizielle Musterlösung, numerisch gegengerechnet.'));

    /* ---- 5c zwei Ringe ---- */

    root.appendChild(h('h3', null, 'c · Zwei koaxiale Wirbelringe'));

    root.appendChild(h('p', { html:
      'Zwei Ringe mit gleicher Zirkulation Γ, aber verschiedenen Radien, stehen im Abstand L ' +
      'hintereinander. Auf der gemeinsamen Achse ist |<b>r</b>| über den ganzen Umlauf konstant — ' +
      'derselbe Trick wie oben — und das Integral wird zu ' +
      'u<sub>z</sub> = ΓR²/(2(R² + z²)<sup>3/2</sup>).' }));

    var stC = { R1: 1.3, R2: 0.85, L: 1.4, spin: 0 };

    var scC = FV.scene3d({
      aspect: 0.58, span: 7.5, azim: 0.7, elev: 0.30,
      animate: true,
      cap: 'Jeder Ring bewegt sich mit der Geschwindigkeit, die im eigenen Mittelpunkt herrscht — ' +
           'die Summe aus dem eigenen Beitrag und dem des anderen Rings.',
      draw: function (S, t) {
        var g = geoRinge(stC.R1, stC.R2, stC.L, GAMMA);
        S.axes(2.4, ['x', 'y', 'z']);

        var c1 = [0, 0, 0], c2 = [0, 0, stC.L];
        var ringPts = function (c, R) {
          return arcPts(c, [1, 0, 0], [0, 1, 0], R, 0, 2 * Math.PI, 72);
        };
        S.filament3(ringPts(c1, stC.R1), { color: C1, width: 3.4, heads: 4 });
        S.filament3(ringPts(c2, stC.R2), { color: C2, width: 3.4, heads: 4 });
        S.label3([stC.R1, 0, 0], 'Ring 1', { color: C1, dx: 8, dy: 8 });
        S.label3([stC.R2, 0, stC.L], 'Ring 2', { color: C2, dx: 8, dy: -8 });
        S.line3([0, 0, -0.5], [0, 0, stC.L + 0.7], { color: '#4a5663', width: 1, dash: [4, 4] });
        S.label3([0, 0, stC.L * 0.5], 'L', { color: '#7b8896', dx: -14, font: 'italic 12px Georgia, serif' });

        S.point3(c1, { color: C1, r: 4 });
        S.point3(c2, { color: C2, r: 4 });
        var kC = scaleAll([[0, 0, g.v1], [0, 0, g.v2]], 1.3);
        S.arrow3(c1, [0, 0, g.v1 * kC], { color: C1, width: 2.6, head: 11, layer: 'front' });
        S.arrow3(c2, [0, 0, stC.L + g.v2 * kC], { color: C2, width: 2.6, head: 11, layer: 'front' });
      }
    });
    root.appendChild(scC);

    var roC = FV.readout([
      { key: 'a1', lab: 'Ring 1 durch sich selbst', cls: 'c1' },
      { key: 'b1', lab: 'Ring 1 durch Ring 2' },
      { key: 'v1', lab: 'Ring 1 gesamt', cls: 'c1' },
      { key: 'a2', lab: 'Ring 2 durch sich selbst', cls: 'c2' },
      { key: 'b2', lab: 'Ring 2 durch Ring 1' },
      { key: 'v2', lab: 'Ring 2 gesamt', cls: 'c2' }
    ]);
    root.appendChild(roC);

    root.appendChild(FV.ctrlRow(
      FV.slider({ label: 'Radius R₁', min: 0.5, max: 2, step: 0.01, value: stC.R1,
        fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { stC.R1 = v; syncC(); } }),
      FV.slider({ label: 'Radius R₂', min: 0.3, max: 2, step: 0.01, value: stC.R2,
        fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { stC.R2 = v; syncC(); } }),
      FV.slider({ label: 'Abstand L', min: 0.3, max: 3, step: 0.01, value: stC.L,
        fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { stC.L = v; syncC(); } })
    ));

    var hintC = h('p', { class: 'canvas-cap', style: 'text-align:left' });
    root.appendChild(hintC);

    function syncC() {
      var g = geoRinge(stC.R1, stC.R2, stC.L, GAMMA);
      roC.set('a1', g.atRing1.self.toFixed(3));
      roC.set('b1', g.atRing1.other.toFixed(3));
      roC.set('v1', g.v1.toFixed(3));
      roC.set('a2', g.atRing2.self.toFixed(3));
      roC.set('b2', g.atRing2.other.toFixed(3));
      roC.set('v2', g.v2.toFixed(3));
      hintC.innerHTML = g.v2 > g.v1
        ? 'Der kleinere Ring 2 ist schneller (' + g.v2.toFixed(3) + ' gegen ' + g.v1.toFixed(3) +
          ') — er läuft davon. Der Eigenbeitrag Γ/(2R) ist beim kleineren Radius grösser.'
        : 'Ring 1 ist hier schneller (' + g.v1.toFixed(3) + ' gegen ' + g.v2.toFixed(3) +
          ') und holt auf. Beim Leapfrogging schlüpft der hintere Ring durch den vorderen hindurch, ' +
          'weitet sich dabei und wird langsamer — dann kehrt sich das Verhältnis um.';
      scC.draw();
    }
    syncC();

    root.appendChild(FV.note('key', 'Warum das schnell geht',
      'Beide Ringe stehen senkrecht auf der z-Achse. Für einen Aufpunkt <b>auf</b> dieser Achse hat ' +
      'jedes Bogenstück denselben Abstand |<b>r</b>| = √(R² + z²), und d<b>s</b> × <b>r</b> hat eine ' +
      'z-Komponente R·ds sowie radiale Anteile, die sich über den Umlauf zu null wegheben. ' +
      'Übrig bleibt u<sub>z</sub> = Γ/(4π) · 2πR · R/(R² + z²)<sup>3/2</sup> = ΓR²/(2(R² + z²))<sup>3/2</sup>. ' +
      'Im eigenen Zentrum (z = 0) also Γ/(2R): <b>je kleiner der Ring, desto schneller</b>. ' +
      'Der Wandfall dazu steht im Kapitel <a href="#wirbelring">Wirbelring an der Wand</a>.'));

    /* ============================================================
       6 · Merkzettel
       ============================================================ */

    root.appendChild(FV.section('6 · Was hängen bleiben sollte'));

    root.appendChild(FV.note('key', 'Prüfungsstrategie für jede Biot-Savart-Aufgabe',
      '<ol style="margin:0;padding-left:18px">' +
      '<li><b>Durchlaufsinn festlegen.</b> Nach Helmholtz ist Γ entlang des ganzen Systems konstant. ' +
      'Steht die Richtung auf einem Faden fest, folgen alle anderen zwingend.</li>' +
      '<li><b>Gerade Stücke</b> mit der Winkelformel Γ/(4πr)·(cos θ₁ − cos θ₂). Halbunendlich heisst ' +
      'cos θ₂ = −1, unendlich zusätzlich cos θ₁ = +1.</li>' +
      '<li><b>Richtung nicht vergessen:</b> die Formel liefert nur den Betrag. Die Richtung ist ' +
      'd<b>s</b> × <b>r</b>, also senkrecht auf der Ebene aus Faden und Aufpunkt.</li>' +
      '<li><b>Gekrümmtes Stück</b> parametrisieren und zuerst |<b>r</b>| prüfen. Ist es konstant, ' +
      'wird das Integral elementar — in allen drei Aufgaben oben ist genau das der Fall.</li>' +
      '<li><b>Beiträge vektoriell addieren</b>, nicht die Beträge.</li>' +
      '</ol>'));

    root.appendChild(FV.note('', 'Anschluss',
      'Wozu das Ganze: das Hufeisenmodell des Tragflügels besteht aus genau diesen Bausteinen — ' +
      'ein gebundener Wirbel plus zwei halbunendliche Randwirbel. Was sie zusammen anrichten, steht ' +
      'im Kapitel <a href="#tragfluegel">Tragflügel: 2D gegen 3D</a>.'));

    syncGeom();
  }
});
