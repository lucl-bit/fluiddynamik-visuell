/* ============================================================
   Tragflügel: 2D gegen 3D
   Skript Kap. 10.4, S. 89–91, Abb. 10.7–10.9

   Kernaussage: die ebene Theorie liefert Auftrieb ohne Widerstand
   (d'Alembert). Am Flügel endlicher Spannweite geht das nicht mehr —
   das Wirbelsystem, das den Auftrieb erst erzeugt, induziert einen
   Abwind und damit zwingend einen Widerstand.

   Das Wirbelsystem wird nicht gemalt, sondern gerechnet: die Traglinie
   ist in Hufeisen zerlegt, deren Feld über Biot-Savart ausgewertet wird.
   Der Physikblock unten läuft ohne DOM — verify.js schneidet ihn heraus.
   ============================================================ */

/* ---------------- Physik ---------------- */

function tAdd(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
function tSub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function tMul(a, s) { return [a[0] * s, a[1] * s, a[2] * s]; }
function tDot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function tCross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function tLen(a) { return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]); }
function tUnit(a) { var L = tLen(a); return L < 1e-14 ? [0, 0, 0] : [a[0] / L, a[1] / L, a[2] / L]; }

/* Gerades Stück mit Kernradius: ohne Abschneiden divergiert das Feld
   direkt am Faden und die Stromlinienintegration bricht aus.          */
function fSeg(a, b, G, x, core) {
  var e = tUnit(tSub(b, a));
  var r1 = tSub(x, a), r2 = tSub(x, b);
  var c = tCross(e, r1), hh = tLen(c);
  if (hh < (core || 1e-9)) return [0, 0, 0];
  var cos1 = tDot(e, tUnit(r1)), cos2 = tDot(e, tUnit(r2));
  return tMul(tUnit(c), G / (4 * Math.PI * hh) * (cos1 - cos2));
}
function fRay(p0, e, G, x, core) {
  var eu = tUnit(e), r1 = tSub(x, p0);
  var c = tCross(eu, r1), hh = tLen(c);
  if (hh < (core || 1e-9)) return [0, 0, 0];
  return tMul(tUnit(c), G / (4 * Math.PI * hh) * (tDot(eu, tUnit(r1)) + 1));
}

/* Zirkulationsverteilung über die Spannweite */
function gammaOf(z, b, G0, kind) {
  var q = 2 * z / b;
  if (Math.abs(q) >= 1) return 0;
  if (kind === 'rect') return G0;                       // Einzelhufeisen
  if (kind === 'ell') return G0 * Math.sqrt(1 - q * q); // elliptischer Grundriss
  return G0 * (1 - q * q);                              // parabolisch, als Zwischenfall
}

/* Traglinie als Kette von Hufeisen.
   Cosinus-Gitter nach Glauert: an den Spitzen, wo Γ(z) steil abfällt,
   liegen die Panels dichter. Durchlaufsinn so, dass der Auftrieb nach
   +y zeigt (Kutta-Joukowski in Vektorform: F = ϱ u × Γ).              */
function liftingLine(b, G0, kind, N) {
  N = N || 16;
  var nodes = [], i;
  for (i = 0; i <= N; i++) {
    var th = Math.PI * i / N;
    nodes.push(-(b / 2) * Math.cos(th));
  }
  var panels = [];
  for (i = 0; i < N; i++) {
    var z1 = nodes[i], z2 = nodes[i + 1];
    var zm = 0.5 * (z1 + z2);
    var G = gammaOf(zm, b, G0, kind);
    panels.push({ z1: z1, z2: z2, zm: zm, G: G });
  }
  return { b: b, G0: G0, kind: kind, N: N, nodes: nodes, panels: panels };
}

/* Geschwindigkeit, die das ganze Wirbelsystem im Punkt x induziert */
function inducedBy(sys, x, core) {
  core = core === undefined ? 0.02 * sys.b : core;
  var u = [0, 0, 0];
  for (var i = 0; i < sys.panels.length; i++) {
    var p = sys.panels[i];
    /* gebundenes Stück, durchlaufen von z2 nach z1 */
    u = tAdd(u, fSeg([0, 0, p.z2], [0, 0, p.z1], p.G, x, core));
    /* die beiden freien Wirbel nach hinten */
    u = tAdd(u, fRay([0, 0, p.z1], [1, 0, 0], p.G, x, core));
    u = tAdd(u, fRay([0, 0, p.z2], [1, 0, 0], -p.G, x, core));
  }
  return u;
}

/* Abwind direkt aus den freien Wirbeln. Nur brauchbar, wenn der Aufpunkt
   nicht dicht an einem Knoten liegt — siehe die Bemerkung bei glauert().  */
function downwashRaw(sys, z) {
  var u = [0, 0, 0], x = [0, 0, z];
  for (var i = 0; i < sys.panels.length; i++) {
    var p = sys.panels[i];
    u = tAdd(u, fRay([0, 0, p.z1], [1, 0, 0], p.G, x, 1e-9));
    u = tAdd(u, fRay([0, 0, p.z2], [1, 0, 0], -p.G, x, 1e-9));
  }
  return u[1];
}

/* ---- Traglinientheorie in der Glauert-Form ----
   Substitution z = −(b/2)·cos θ und Ansatz  Γ(θ) = Σ G_n sin(nθ).
   Mit dem Glauert-Integral ∫₀^π cos(nθ')/(cos θ' − cos θ) dθ' = π sin(nθ)/sin θ
   wird der Hauptwert des Abwindintegrals geschlossen auswertbar:

        w(θ) = −(1/2b) · Σ n G_n sin(nθ)/sin θ

   Das ist der Grund, hier nicht mit Hufeisen-Panels zu rechnen: das
   Abwindintegral ist ein Cauchy-Hauptwert, und diskrete freie Wirbel auf
   den Knoten lassen ihn an den Flügelspitzen divergieren — der Fehler dort
   wächst sogar mit der Panelzahl. Die Reihe hat dieses Problem nicht.     */
function glauert(b, G0, kind, M) {
  M = M || 24;
  var Q = 720, Gn = [0];              // Gn[0] ungenutzt, Index = n
  for (var n = 1; n <= M; n++) {
    /* G_n = (2/π) ∫₀^π Γ(θ) sin(nθ) dθ, Trapez über ein glattes Integrand */
    var s = 0;
    for (var i = 0; i <= Q; i++) {
      var th = Math.PI * i / Q;
      var wq = (i === 0 || i === Q) ? 0.5 : 1;
      s += wq * gammaOf(-(b / 2) * Math.cos(th), b, G0, kind) * Math.sin(n * th);
    }
    Gn.push(2 / Math.PI * s * (Math.PI / Q));
  }
  return { b: b, G0: G0, kind: kind, M: M, Gn: Gn };
}

function thetaOfZ(b, z) {
  var q = Math.max(-1, Math.min(1, -2 * z / b));
  return Math.acos(q);
}

/* Abwind an der Stelle z, exakt aus der Reihe */
function downwashG(gl, z) {
  var th = thetaOfZ(gl.b, z), sth = Math.sin(th), s = 0;
  for (var n = 1; n <= gl.M; n++) {
    /* an den Spitzen ist sin(nθ)/sin θ → n (Grenzwert von l'Hôpital) */
    s += n * gl.Gn[n] * (Math.abs(sth) < 1e-7 ? n : Math.sin(n * th) / sth);
  }
  return -s / (2 * gl.b);
}

/* Zirkulation aus der Reihe — zeigt zugleich, wie gut sie die Vorgabe trifft */
function gammaG(gl, z) {
  var th = thetaOfZ(gl.b, z), s = 0;
  for (var n = 1; n <= gl.M; n++) s += gl.Gn[n] * Math.sin(n * th);
  return s;
}

/* Einzelhufeisen geschlossen:  w(z) = −Γ/(4π) · b/((b/2)² − z²) */
function downwashHorseshoe(b, G, z) {
  return -G / (4 * Math.PI) * b / ((b / 2) * (b / 2) - z * z);
}

/* Elliptische Verteilung: der Abwind ist über die ganze Spannweite konstant */
function downwashElliptic(b, G0) { return -G0 / (2 * b); }

/* Auftrieb und induzierter Widerstand, geschlossen aus den Koeffizienten
   (Dichte ϱ = 1):   L = ϱu∞ πb G₁/4      D = ϱ (π/8) Σ n G_n²
   Am zweiten Ausdruck liest man die Optimalität der Ellipse direkt ab:
   L hängt allein an G₁, D bekommt von jedem weiteren G_n nur Zuwachs.     */
function forcesG(gl, uinf) {
  var L = uinf * Math.PI * gl.b * gl.Gn[1] / 4, D = 0;
  for (var n = 1; n <= gl.M; n++) D += n * gl.Gn[n] * gl.Gn[n];
  return { L: L, D: Math.PI / 8 * D };
}

/* Die Beiwerte des Skripts, S. 91 */
function coeffs(cA, LAM) {
  var cWi = cA * cA / (Math.PI * LAM);
  return { cWi: cWi, alphaI: cA / (Math.PI * LAM), E: cWi > 1e-12 ? cA / cWi : Infinity };
}

/* Ein Profilschnitt nach Abb. 10.9 */
function section(uinf, w, Fres) {
  var ai = Math.atan2(-w, uinf);          // w < 0 ⇒ α_i > 0
  return {
    alphaI: ai,
    ueff: Math.sqrt(uinf * uinf + w * w),
    Fy: Fres * Math.cos(ai),              // trägt das Gewicht
    Fx: Fres * Math.sin(ai)               // der induzierte Widerstand
  };
}

/* Stromlinie im Feld aus Anströmung und Wirbelsystem (RK2) */
function streamline(p0, sys, uinf, dt, n) {
  var p = p0.slice(), out = [p.slice()];
  for (var i = 0; i < n; i++) {
    var k1 = tAdd([uinf, 0, 0], inducedBy(sys, p));
    var pm = tAdd(p, tMul(k1, dt * 0.5));
    var k2 = tAdd([uinf, 0, 0], inducedBy(sys, pm));
    p = tAdd(p, tMul(k2, dt));
    if (!isFinite(p[0]) || !isFinite(p[1]) || !isFinite(p[2])) break;
    out.push(p.slice());
  }
  return out;
}

/* ---------------- Einstieg ---------------- */

FV.register({
  id: 'tragfluegel',
  chapter: 'Drehungsbehaftete Strömungen',
  chapterNo: '10.4',
  title: 'Tragflügel: 2D gegen 3D',
  subtitle: 'Die ebene Theorie kennt keinen Widerstand. Der echte Flügel hat einen — ' +
            'und zwar genau deshalb, weil er Auftrieb erzeugt.',
  source: 'Skript S. 89–91, Abb. 10.7–10.9',

  build: function (root) {
    var h = FV.h;
    var C1 = '#ff8a4c', C2 = '#56c8f5', C3 = '#a78bfa',
        OK = '#6fdd8b', WARN = '#ffd166', BAD = '#ff6b6b', DIM = '#6e7d8c';

    /* ============================================================
       1 · Was die ebene Theorie behauptet
       ============================================================ */

    root.appendChild(FV.section('1 · Was die ebene Theorie behauptet'));

    root.appendChild(h('p', { html:
      'Kapitel 9.5 betrachtet ein Profil in der x-y-Ebene. Das beschreibt einen Flügel, der in ' +
      'Spannweitenrichtung z <b>beiderseits unendlich</b> ausgedehnt ist. Für den gilt:' }));

    root.appendChild(FV.eq(
      'F<sub>y</sub> = −Γ · ϱu<sub>∞</sub> · b &nbsp;&nbsp;&nbsp;&nbsp; F<sub>x</sub> = 0',
      'Kutta-Joukowski für den Auftrieb, d\'Alembert für den Widerstand (Skript S. 72 f.)'));

    root.appendChild(FV.note('warn', 'Das Paradoxon',
      'Eine ebene Potentialströmung übt auf einen umströmten Körper <b>keine</b> Kraft in ' +
      'Anströmrichtung aus — das ist d\'Alemberts Ergebnis. Ein unendlich langer Flügel würde also ' +
      'Auftrieb erzeugen, ohne dass man dafür Leistung aufbringen müsste. An einem realen Flügel ist ' +
      'das anders, und der Grund ist <b>nicht</b> die Reibung. Auch eine völlig reibungsfreie ' +
      'Rechnung liefert für einen Flügel <b>endlicher</b> Spannweite einen Widerstand.'));

    /* ============================================================
       2 · Was am echten Flügel passiert
       ============================================================ */

    root.appendChild(FV.section('2 · Was am echten Flügel passiert'));

    root.appendChild(h('p', { html:
      'Unten die Flügelenden bei ±b/2. Weil unten Überdruck (Druckseite) und oben Unterdruck ' +
      '(Saugseite) herrscht, wird um die Enden herum ausgeglichen: die Stromlinien auf der Unterseite ' +
      'weichen <b>nach aussen</b> zu den Spitzen aus, die auf der Oberseite <b>nach innen</b> zur ' +
      'Mitte. Hinter dem Flügel treffen sie mit einem Knick aufeinander — es entsteht eine ' +
      'Wirbelschicht, die sich stromab zu zwei gegensinnigen Nachlaufwirbeln aufrollt.' }));

    var st2 = { b: 3.0, kind: 'ell', G0: 0.7, phase: 0, showStream: true, showWake: true };
    var lines2 = null;

    /* Panelsystem für die Stromlinien, Glauert-Reihe für den Abwind */
    var cache2 = null;
    function sys2() {
      var key = st2.b + '|' + st2.G0 + '|' + st2.kind;
      if (!cache2 || cache2.key !== key) {
        cache2 = { key: key, sys: liftingLine(st2.b, st2.G0, st2.kind, 14),
                   gl: glauert(st2.b, st2.G0, st2.kind, 24) };
      }
      return cache2.sys;
    }
    function gl2() { sys2(); return cache2.gl; }

    function rebuild2() {
      var sys = sys2();
      lines2 = [];
      var starts = [];
      /* oben und unten je vier Startpunkte, symmetrisch über die Spannweite.
         Dicht am Flügel, damit die seitliche Ablenkung deutlich wird — sie
         ist der Punkt der Abbildung, nicht das Absacken im Abwind.        */
      [0.30, 0.60, 0.84, 0.97].forEach(function (f) {
        var z = f * st2.b / 2;
        starts.push({ p: [-1.8, 0.18, z], side: 'top' });
        starts.push({ p: [-1.8, -0.18, z], side: 'bot' });
        starts.push({ p: [-1.8, 0.18, -z], side: 'top' });
        starts.push({ p: [-1.8, -0.18, -z], side: 'bot' });
      });
      starts.forEach(function (s) {
        lines2.push({ pts: streamline(s.p, sys, 1.0, 0.10, 48), side: s.side });
      });
    }
    rebuild2();

    var sc2 = FV.scene3d({
      aspect: 0.62, span: 9, azim: 0.48, elev: 0.66, animate: true,
      cap: 'Die Stromlinien sind nicht gezeichnet, sondern im Feld aus Anströmung und Wirbelsystem ' +
           'integriert. Blau die Oberseite, orange die Unterseite. Der Blick geht von schräg oben — ' +
           'so sieht man, worauf es ankommt: die blauen Linien wandern zur Mitte, die orangen nach aussen.',
      draw: function (S, t) {
        var sys = sys2(), b = st2.b;
        S.axes(2.2, ['x', 'y', 'z']);

        /* Anströmung */
        S.arrow3([-3.4, 0, 0], [-2.6, 0, 0], { color: DIM, width: 1.6, head: 9 });
        S.label3([-3.4, 0, 0], 'u∞', { color: DIM, dx: -6, dy: -12, align: 'right', font: 'italic 13px Georgia, serif' });

        /* der Flügel als Fläche, Tiefe L in x */
        var L = 0.6;
        S.fill3([[-L / 2, 0, -b / 2], [L / 2, 0, -b / 2], [L / 2, 0, b / 2], [-L / 2, 0, b / 2]],
                { color: 'rgba(214,226,238,.30)', stroke: 'rgba(230,237,243,.75)', width: 1.6 });
        S.label3([0, 0, b / 2], 'b/2', { color: '#98a5b3', dx: 8, dy: 10, font: '12px -apple-system, sans-serif' });
        S.label3([0, 0, -b / 2], '−b/2', { color: '#98a5b3', dx: -34, dy: 10 });
        S.label3([-L / 2, 0.10, 0], 'Saugseite', { color: C2, dx: -10, dy: -12, font: '11px -apple-system, sans-serif' });
        S.label3([-L / 2, -0.10, 0], 'Druckseite', { color: C1, dx: -10, dy: 14, font: '11px -apple-system, sans-serif' });

        /* Stromlinien */
        if (st2.showStream && lines2) {
          lines2.forEach(function (l) {
            S.poly3(l.pts, { color: l.side === 'top' ? C2 : C1, width: 1.5, alpha: 0.72 });
          });
          /* mitschwimmende Marker */
          var ph = ((t * 0.09) % 1 + 1) % 1;
          lines2.forEach(function (l) {
            var i = Math.min(l.pts.length - 1, Math.max(0, Math.floor(ph * (l.pts.length - 1))));
            S.point3(l.pts[i], { color: l.side === 'top' ? C2 : C1, r: 2.6 });
          });
        }

        /* die aufgerollten Nachlaufwirbel andeuten */
        if (st2.showWake) {
          [1, -1].forEach(function (sgn) {
            var zc = sgn * b / 2;
            S.poly3([[0, 0, zc], [4.6, 0, zc]], { color: C3, width: 2, alpha: 0.55, dash: [6, 4] });
            for (var k = 1; k <= 2; k++) {
              S.spin3([1.5 + k * 1.5, 0, zc], [sgn, 0, 0], 0.26, { color: C3, width: 1.4, alpha: 0.75 });
            }
            S.label3([4.6, 0, zc], 'Randwirbel', { color: C3, dx: 8, dy: sgn * 8, font: '11px -apple-system, sans-serif' });
          });
        }
      }
    });
    root.appendChild(sc2);

    root.appendChild(FV.ctrlRow(
      FV.slider({
        label: 'Spannweite b', min: 1.2, max: 8, step: 0.1, value: st2.b,
        fmt: function (v) { return v.toFixed(1); },
        onInput: function (v) { st2.b = v; rebuild2(); sc2.draw(); syncSpan(); }
      }),
      FV.slider({
        label: 'Zirkulation Γ₀', min: 0.2, max: 3, step: 0.05, value: st2.G0,
        fmt: function (v) { return v.toFixed(2); },
        onInput: function (v) { st2.G0 = v; rebuild2(); sc2.draw(); syncSpan(); }
      })
    ));
    root.appendChild(FV.ctrlRow(
      FV.toggle('Stromlinien', true, function (s) { st2.showStream = s; sc2.draw(); }),
      FV.toggle('Nachlaufwirbel', true, function (s) { st2.showWake = s; sc2.draw(); }),
      FV.button('Blick von hinten', function () { sc2.setView(0.02, 0.10, 1.15); }),
      FV.button('Blick von oben', function () { sc2.setView(0.0, 1.45, 1.0); }),
      FV.button('Standardblick', function () { sc2.setView(0.48, 0.66, 1.0); })
    ));

    var roSpan = FV.readout([
      { key: 'w0', lab: 'Abwind in der Mitte w(0)', cls: 'c2' },
      { key: 'ai', lab: 'α_i in der Mitte' },
      { key: 'rel', lab: 'w(0) / u∞' }
    ]);
    root.appendChild(roSpan);
    var spanHint = h('p', { class: 'canvas-cap', style: 'text-align:left' });
    root.appendChild(spanHint);

    function syncSpan() {
      var w0 = downwashG(gl2(), 0);
      roSpan.set('w0', w0.toFixed(4));
      roSpan.set('ai', (Math.atan2(-w0, 1) * 180 / Math.PI).toFixed(2) + '°');
      roSpan.set('rel', (w0 / 1.0).toFixed(4));
      spanHint.innerHTML = 'Zieh die Spannweite gross: der Abwind geht gegen null und mit ihm der ' +
        'induzierte Widerstand — die 2D-Aussage wird wieder gültig. Sie ist also kein Fehler, ' +
        'sondern der Grenzfall b → ∞.';
      sc2.draw();
    }
    syncSpan();

    root.appendChild(FV.note('key', 'Die Kette, um die es geht',
      'Druckunterschied zwischen Ober- und Unterseite → Umströmung der Flügelenden → Wirbelschicht ' +
      'im Nachlauf → aufgerollte Randwirbel → <b>Abwind am Flügel selbst</b>. Jeder Schritt folgt ' +
      'zwingend aus dem vorigen, und der erste ist genau das, was den Auftrieb ausmacht. ' +
      'Deshalb ist der letzte nicht vermeidbar.'));

    /* ============================================================
       3 · Das Hufeisenmodell
       ============================================================ */

    root.appendChild(FV.section('3 · Das Hufeisenmodell'));

    root.appendChild(h('p', { html:
      'Das einfachste Modell: ein <b>gebundener Wirbel</b> der Länge b an der Stelle des Flügels. ' +
      'Nach dem Helmholtzschen Wirbelsatz kann ein Wirbelfaden nicht einfach enden — also gehen von ' +
      'seinen beiden Enden zwei <b>halbunendliche Randwirbel</b> nach hinten ab. Γ ist entlang des ' +
      'ganzen Systems konstant. Die Bausteine dafür kommen aus dem Kapitel ' +
      '<a href="#biotsavart">Biot-Savart</a>.' }));

    var st3 = { b: 3.0, G: 1.6, z: 0.0 };

    var sc3 = FV.scene3d({
      aspect: 0.56, span: 10, azim: 0.78, elev: 0.32,
      cap: 'Der gebundene Wirbel trägt, die Randwirbel induzieren. Der grüne Pfeil zeigt den Abwind ' +
           'an der gewählten Stelle z auf der Traglinie.',
      draw: function (S) {
        var b = st3.b, G = st3.G;
        S.axes(2.2, ['x', 'y', 'z']);
        S.arrow3([-3.2, 0, 0], [-2.5, 0, 0], { color: DIM, width: 1.6, head: 9 });
        S.label3([-3.2, 0, 0], 'u∞', { color: DIM, dx: -6, dy: -12, align: 'right', font: 'italic 13px Georgia, serif' });

        /* gebundener Wirbel, durchlaufen von +b/2 nach −b/2 */
        S.filament3([[0, 0, b / 2], [0, 0, -b / 2]], { color: C1, width: 4, heads: 2 });
        S.label3([0, 0, 0], 'gebundener Wirbel', { color: C1, dx: 0, dy: -18, align: 'center', font: '12px -apple-system, sans-serif' });

        /* die zwei Randwirbel */
        S.filament3([[0, 0, -b / 2], [5.2, 0, -b / 2]], { color: C3, width: 3.2, heads: 3 });
        S.filament3([[5.2, 0, b / 2], [0, 0, b / 2]], { color: C3, width: 3.2, heads: 3 });
        S.label3([4.4, 0, -b / 2], 'Randwirbel', { color: C3, dx: 6, dy: 12, font: '12px -apple-system, sans-serif' });
        S.label3([4.4, 0, b / 2], 'Randwirbel', { color: C3, dx: 6, dy: -12, font: '12px -apple-system, sans-serif' });
        S.label3([2.4, 0, b / 2], 'Γ', { color: C3, dy: -12, font: 'italic 14px Georgia, serif' });

        /* Abwindprofil entlang der Traglinie */
        var prof = [];
        for (var i = 0; i <= 60; i++) {
          var zz = -b / 2 * 0.985 + b * 0.985 * i / 60;
          var w = downwashHorseshoe(b, G, zz);
          prof.push([0, Math.max(-1.9, w * 0.45), zz]);
        }
        S.poly3(prof, { color: C2, width: 2 });
        S.label3(prof[30], 'w(z)', { color: C2, dx: 10, dy: 10, font: 'italic 13px Georgia, serif' });

        /* die gewählte Stelle */
        var zc = st3.z * b / 2 * 0.96;
        var wz = downwashHorseshoe(b, G, zc);
        S.point3([0, 0, zc], { color: OK, r: 4.5 });
        S.arrow3([0, 0, zc], [0, Math.max(-1.9, wz * 0.45), zc],
                 { color: OK, width: 2.6, head: 11, layer: 'front' });
      }
    });
    root.appendChild(sc3);

    root.appendChild(FV.eq(
      'w(z) = −<span class="frac"><span>Γ</span><span class="den">4π</span></span> · ' +
      '<span class="frac"><span>b</span><span class="den">(b/2)² − z²</span></span> ' +
      '&nbsp;&nbsp;&nbsp; w(0) = −<span class="frac"><span>Γ</span><span class="den">πb</span></span>',
      'Summe der beiden halbunendlichen Randwirbel — jeder liefert Γ/(4π·Abstand)'));

    var ro3 = FV.readout([
      { key: 'w', lab: 'Abwind w(z)', cls: 'c2' },
      { key: 'w0', lab: 'w(0) = −Γ/(πb)' },
      { key: 'ai', lab: 'α_i an dieser Stelle' }
    ]);
    root.appendChild(ro3);

    root.appendChild(FV.ctrlRow(
      FV.slider({ label: 'Spannweite b', min: 1.2, max: 6, step: 0.05, value: st3.b,
        fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { st3.b = v; sync3(); } }),
      FV.slider({ label: 'Zirkulation Γ', min: 0.2, max: 3, step: 0.02, value: st3.G,
        fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { st3.G = v; sync3(); } }),
      FV.slider({ label: 'Stelle z / (b/2)', min: -0.95, max: 0.95, step: 0.01, value: 0,
        fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { st3.z = v; sync3(); } })
    ));

    function sync3() {
      var zc = st3.z * st3.b / 2 * 0.96;
      var w = downwashHorseshoe(st3.b, st3.G, zc);
      ro3.set('w', w.toFixed(4));
      ro3.set('w0', downwashHorseshoe(st3.b, st3.G, 0).toFixed(4));
      ro3.set('ai', (Math.atan2(-w, 1) * 180 / Math.PI).toFixed(2) + '°');
      sc3.draw();
    }
    sync3();

    root.appendChild(FV.note('warn', 'Wo das Einzelhufeisen versagt',
      'Zieh die Stelle z zu einer Flügelspitze: der Abwind läuft gegen unendlich. Das ist keine ' +
      'Physik, sondern ein Modellfehler. Beim Einzelhufeisen springt Γ an den Spitzen von Γ auf null, ' +
      'die gesamte abgehende Wirbelstärke sitzt in <b>zwei Punkten</b>. In Wirklichkeit fällt Γ(z) ' +
      'stetig ab und die Wirbelstärke verteilt sich über die ganze Spannweite — das ist das ' +
      'verfeinerte Modell im nächsten Abschnitt.'));

    /* ============================================================
       4 · Traglinie: viele Hufeisen
       ============================================================ */

    root.appendChild(FV.section('4 · Die Traglinie — und warum elliptisch das Optimum ist'));

    root.appendChild(h('p', { html:
      'Statt eines Hufeisens ein ganzes System davon: differentielle Hufeisen der Stärke dΓ, ' +
      'symmetrisch um z = 0, deren Mittelstücke sich zum gebundenen Wirbel überlagern. Die ' +
      'Zirkulation ist jetzt von z abhängig und fällt zu den Spitzen auf null ab.' }));

    var st4 = { b: 3.0, G0: 1.6, kind: 'ell' };
    var cache4 = null;
    function gl4() {
      var key = st4.b + '|' + st4.G0 + '|' + st4.kind;
      if (!cache4 || cache4.key !== key) {
        cache4 = { key: key, gl: glauert(st4.b, st4.G0, st4.kind, 24) };
      }
      return cache4.gl;
    }

    /* Beim Rechteck springt Γ an den Spitzen — dafür ist die Sinusreihe das
       falsche Werkzeug (Gibbs). Dort gilt ohnehin die geschlossene
       Hufeisenformel aus Abschnitt 3.                                     */
    function w4(z) {
      if (st4.kind === 'rect') return downwashHorseshoe(st4.b, st4.G0, z);
      return downwashG(gl4(), z);
    }

    var cv4 = FV.canvas({
      aspect: 0.52,
      render: function (ctx, w, hgt) {
        var gl = gl4(), b = st4.b;
        var P = FV.plot(ctx, {
          w: w, h: hgt, x: [-1.05, 1.05], y: [-1.15, 1.35],
          pad: { l: 56, r: 16, t: 16, b: 40 },
          xticks: [-1, -0.5, 0, 0.5, 1], yticks: [-1, -0.5, 0, 0.5, 1],
          xlabel: 'z / (b/2)', ylabel: 'Γ/Γ₀   bzw.   w / |w(0)|'
        });
        P.grid(); P.axes();

        /* Γ(z) */
        P.clip(function () {
          P.curve(function (q) { return gammaOf(q * b / 2, b, 1, st4.kind); },
                  { color: C1, width: 2.6 });
        });

        /* Abwind, normiert auf den Betrag in der Mitte */
        var w0 = Math.abs(w4(0)) || 1;
        var pts = [];
        for (var i = 0; i <= 120; i++) {
          var q = -1 + 2 * i / 120;
          pts.push([q, w4(q * b / 2) / w0]);
        }
        P.clip(function () { P.poly(pts, { color: C2, width: 2.6 }); });

        P.label(-0.98, 1.22, 'Γ(z)/Γ₀', C1);
        P.label(-0.98, -0.9, 'w(z)/|w(0)|', C2);
        if (st4.kind === 'ell') {
          P.label(0.98, -1.06, 'konstant über die ganze Spannweite', OK, 'right');
        }
      }
    });
    root.appendChild(cv4);

    var ro4 = FV.readout([
      { key: 'w0', lab: 'w in der Mitte', cls: 'c2' },
      { key: 'w7', lab: 'w bei z = 0.7·b/2', cls: 'c2' },
      { key: 'var', lab: 'Schwankung über z' },
      { key: 'th', lab: 'elliptisch erwartet: −Γ₀/(2b)' },
      { key: 'more', lab: 'induzierter Widerstand ggü. elliptisch', cls: 'c1' }
    ]);
    root.appendChild(ro4);

    var kindBtns = {};
    var kindRow = h('div', { class: 'btn-row' });
    [['ell', 'elliptisch  Γ₀√(1−(2z/b)²)'], ['par', 'parabolisch'], ['rect', 'rechteckig (Einzelhufeisen)']]
      .forEach(function (e) {
        var b2 = FV.button(e[1], function () {
          st4.kind = e[0];
          Object.keys(kindBtns).forEach(function (j) { kindBtns[j].classList.toggle('on', j === e[0]); });
          sync4();
        });
        if (e[0] === st4.kind) b2.classList.add('on');
        kindBtns[e[0]] = b2;
        kindRow.appendChild(b2);
      });
    root.appendChild(kindRow);

    root.appendChild(FV.ctrlRow(
      FV.slider({ label: 'Spannweite b', min: 1.2, max: 6, step: 0.05, value: st4.b,
        fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { st4.b = v; sync4(); } }),
      FV.slider({ label: 'Γ₀', min: 0.2, max: 3, step: 0.02, value: st4.G0,
        fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { st4.G0 = v; sync4(); } })
    ));

    var hint4 = h('p', { class: 'canvas-cap', style: 'text-align:left' });
    root.appendChild(hint4);

    function sync4() {
      var w0 = w4(0), w7 = w4(0.7 * st4.b / 2);
      ro4.set('w0', w0.toFixed(4));
      ro4.set('w7', w7.toFixed(4));
      ro4.set('var', (Math.abs((w7 - w0) / w0) * 100).toFixed(1) + ' %');
      ro4.set('th', downwashElliptic(st4.b, st4.G0).toFixed(4));

      /* Vergleich bei gleichem Auftrieb: D/L² ist dafür das richtige Mass */
      if (st4.kind === 'rect') {
        ro4.set('more', '→ ∞');
      } else {
        var gE = glauert(st4.b, 1, 'ell', 24), fE = forcesG(gE, 1.0);
        var gK = glauert(st4.b, 1, st4.kind, 24), fK = forcesG(gK, 1.0);
        var rel = (fK.D / (fK.L * fK.L)) / (fE.D / (fE.L * fE.L));
        ro4.set('more', rel < 1.0005 ? 'Minimum' : '+' + ((rel - 1) * 100).toFixed(1) + ' %');
      }
      hint4.innerHTML = st4.kind === 'ell'
        ? 'Bei der elliptischen Verteilung ist der Abwind über die Spannweite <b>exakt konstant</b> — ' +
          'bis in die Flügelspitzen hinein. Damit ist auch α_i überall gleich, und genau dafür lässt ' +
          'sich zeigen, dass der induzierte Widerstand bei gegebenem Gesamtauftrieb minimal wird.'
        : st4.kind === 'rect'
        ? 'Beim Rechteck springt Γ an den Spitzen von Γ₀ auf null. Die gesamte abgehende ' +
          'Wirbelstärke sitzt dort in zwei Punkten, und der Abwind divergiert — der induzierte ' +
          'Widerstand dieses Modells ist unendlich. Ein sprunghaftes Γ(z) ist also nicht nur ungenau, ' +
          'sondern physikalisch unmöglich.'
        : 'Der Abwind ist hier <b>nicht</b> konstant. Ein Teil des Flügels arbeitet damit bei einem ' +
          'ungünstigeren effektiven Anstellwinkel als der Rest — bei gleichem Gesamtauftrieb entsteht ' +
          'mehr induzierter Widerstand als bei der elliptischen Verteilung.';
      cv4.draw();
    }
    sync4();

    root.appendChild(FV.note('key', 'Warum ausgerechnet die Ellipse',
      'Schreibt man Γ als Reihe Γ(θ) = Σ G<sub>n</sub> sin(nθ) mit z = −(b/2)cos θ, dann ist<br><br>' +
      'L = ϱu<sub>∞</sub> πb G₁/4 &nbsp;&nbsp;und&nbsp;&nbsp; D = ϱ (π/8) Σ n G<sub>n</sub>²<br><br>' +
      'Der Auftrieb hängt <b>allein an G₁</b>. Jeder weitere Koeffizient G₂, G₃, … erhöht den ' +
      'Widerstand, ohne zum Auftrieb beizutragen. Das Minimum liegt also dort, wo alle bis auf G₁ ' +
      'verschwinden — und das ist genau Γ_ell(z) = Γ₀√(1 − (2z/b)²), mit dem konstanten Abwind ' +
      'w = −Γ₀/(2b). Die parabolische Verteilung oben kostet gegenüber der elliptischen exakt ' +
      '<b>12.5 %</b> mehr. Ein Flügel mit elliptischem Grundriss erzeugt gerade diese Verteilung; ' +
      'die Spitfire ist deshalb elliptisch geschnitten, heute erreicht man dasselbe billiger über ' +
      'Verwindung und Zuspitzung.'));

    /* ============================================================
       5 · Der Profilschnitt — wo der Widerstand entsteht
       ============================================================ */

    root.appendChild(FV.section('5 · Der Profilschnitt — wo der Widerstand entsteht'));

    root.appendChild(h('p', { html:
      'Jetzt der entscheidende Schritt. In einem Schnitt z = const überlagern sich die ungestörte ' +
      'Anströmung u<sub>∞</sub> und der Abwind v zur <b>effektiven</b> Anströmung u<sub>eff</sub>. ' +
      'Für die Kräfte ist diese massgeblich: in ihrer Richtung ist die Kraft null (d\'Alembert), ' +
      'senkrecht dazu steht die Querkraft F<sub>res</sub> nach Kutta-Joukowski. Und weil ' +
      'u<sub>eff</sub> gegenüber u<sub>∞</sub> gekippt ist, ist F<sub>res</sub> es auch.' }));

    var st5 = { wRel: 0.18, Fres: 1.0 };

    var cv5 = FV.canvas({
      aspect: 0.56,
      render: function (ctx, w, hgt) {
        var uinf = 1.0, wv = -st5.wRel * uinf;
        var S5 = section(uinf, wv, st5.Fres);
        var ai = S5.alphaI;

        var cx = w * 0.42, cy = hgt * 0.60;
        var sU = Math.min(w, hgt) * 0.42;     // Skala für Geschwindigkeiten
        var sF = Math.min(w, hgt) * 0.40;     // Skala für Kräfte

        /* Achsen */
        ctx.save();
        ctx.strokeStyle = '#2a323d'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(w * 0.06, cy); ctx.lineTo(w * 0.96, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, hgt * 0.06); ctx.lineTo(cx, hgt * 0.94); ctx.stroke();
        ctx.restore();
        FV.text(ctx, w * 0.955, cy + 16, 'x', { color: DIM, align: 'right', font: 'italic 13px Georgia, serif' });
        FV.text(ctx, cx - 14, hgt * 0.08, 'y', { color: DIM, font: 'italic 13px Georgia, serif' });

        /* ein angedeutetes Profil */
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(0);
        ctx.fillStyle = 'rgba(200,215,230,.12)';
        ctx.strokeStyle = 'rgba(200,215,230,.45)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        var Lp = sU * 0.55;
        ctx.moveTo(-Lp * 0.5, 0);
        ctx.bezierCurveTo(-Lp * 0.2, -Lp * 0.16, Lp * 0.2, -Lp * 0.10, Lp * 0.5, 0);
        ctx.bezierCurveTo(Lp * 0.2, Lp * 0.03, -Lp * 0.2, Lp * 0.06, -Lp * 0.5, 0);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();

        /* Geschwindigkeitsdreieck, unten links angesetzt */
        var gx = w * 0.10, gy = hgt * 0.30;
        FV.arrow(ctx, gx, gy, gx + sU * 0.62, gy, C2, 2.2, 10);
        FV.text(ctx, gx + sU * 0.31, gy - 10, 'u∞', { color: C2, align: 'center', font: 'italic 13px Georgia, serif' });
        FV.arrow(ctx, gx + sU * 0.62, gy, gx + sU * 0.62, gy + sU * 0.62 * st5.wRel, C1, 2.2, 9);
        FV.text(ctx, gx + sU * 0.66, gy + sU * 0.31 * st5.wRel, 'v (Abwind)', { color: C1, font: '12px -apple-system, sans-serif' });
        FV.arrow(ctx, gx, gy, gx + sU * 0.62, gy + sU * 0.62 * st5.wRel, '#e6edf3', 2.6, 11);
        FV.text(ctx, gx + sU * 0.30, gy + sU * 0.42 * st5.wRel + 16, 'u eff', { color: '#e6edf3', align: 'center', font: 'italic 13px Georgia, serif' });

        /* Kräfte am Profil: F_res senkrecht auf u_eff */
        /* u_eff-Richtung: (cos(-ai), sin(-ai)) im Bild, y zeigt im Canvas nach unten */
        var ex = Math.cos(ai), ey = Math.sin(ai);          // Bildrichtung von u_eff (nach rechts unten)
        /* senkrecht darauf, nach oben: (-ey, -ex)? — normal drehen um −90° */
        var nx = ey, ny = -ex;

        /* Referenz: die Kraft ohne Abwind stünde exakt senkrecht (0,-1) */
        ctx.save(); ctx.setLineDash([4, 4]);
        FV.arrow(ctx, cx, cy, cx, cy - sF, '#3a4552', 1.4, 8);
        ctx.restore();
        // seitlich an den gestrichelten Pfeil, sonst kollidiert es mit F_x
        FV.text(ctx, cx - 10, cy - sF * 0.74, 'ohne Abwind stünde',
                { color: '#55636f', align: 'right', font: '11px -apple-system, sans-serif' });
        FV.text(ctx, cx - 10, cy - sF * 0.74 + 13, 'F res genau hier',
                { color: '#55636f', align: 'right', font: '11px -apple-system, sans-serif' });

        /* u_eff-Richtung durch das Profil, gestrichelt */
        ctx.save(); ctx.strokeStyle = 'rgba(230,237,243,.30)'; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx - ex * sU * 0.5, cy - ey * sU * 0.5);
        ctx.lineTo(cx + ex * sU * 0.9, cy + ey * sU * 0.9);
        ctx.stroke(); ctx.restore();

        /* F_res */
        var Fx2 = cx + nx * sF * st5.Fres, Fy2 = cy + ny * sF * st5.Fres;
        FV.arrow(ctx, cx, cy, Fx2, Fy2, OK, 3, 13);
        FV.text(ctx, Fx2 + 10, Fy2 + 16, 'F res', { color: OK, font: 'italic 14px Georgia, serif' });

        /* Zerlegung */
        FV.arrow(ctx, cx, cy, cx, Fy2, C2, 2, 10);
        FV.text(ctx, cx - 10, (cy + Fy2) / 2, 'F y', { color: C2, align: 'right', font: 'italic 13px Georgia, serif' });
        ctx.save(); ctx.setLineDash([3, 3]); ctx.strokeStyle = '#3a4552'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx, Fy2); ctx.lineTo(Fx2, Fy2); ctx.stroke(); ctx.restore();
        FV.arrow(ctx, cx, Fy2, Fx2, Fy2, BAD, 2.6, 11);
        FV.text(ctx, (cx + Fx2) / 2, Fy2 - 14, 'F x', { color: BAD, align: 'center', font: 'italic 14px Georgia, serif' });
        FV.text(ctx, (cx + Fx2) / 2, Fy2 - 30, 'induzierter Widerstand',
                { color: BAD, align: 'center', font: '12px -apple-system, sans-serif' });

        /* Winkel α_i */
        ctx.save();
        ctx.strokeStyle = WARN; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(cx, cy, sF * 0.30, -Math.PI / 2, -Math.PI / 2 + ai); ctx.stroke();
        ctx.restore();
        FV.text(ctx, cx + sF * 0.16, cy - sF * 0.36, 'α i', { color: WARN, font: 'italic 13px Georgia, serif' });
      }
    });
    root.appendChild(cv5);

    var ro5 = FV.readout([
      { key: 'ai', lab: 'α_i', cls: 'c3' },
      { key: 'fy', lab: 'F_y (trägt)', cls: 'c2' },
      { key: 'fx', lab: 'F_x (Widerstand)' },
      { key: 'e', lab: 'Gleitzahl F_y/F_x' },
      { key: 'ue', lab: 'u_eff / u∞' }
    ]);
    root.appendChild(ro5);

    root.appendChild(FV.ctrlRow(
      FV.slider({
        label: 'Abwind |v| / u∞', min: 0, max: 0.5, step: 0.005, value: st5.wRel,
        fmt: function (v) { return v.toFixed(3); },
        onInput: function (v) { st5.wRel = v; sync5(); }
      })
    ));

    var hint5 = h('p', { class: 'canvas-cap', style: 'text-align:left' });
    root.appendChild(hint5);

    function sync5() {
      var S5 = section(1.0, -st5.wRel, st5.Fres);
      ro5.set('ai', (S5.alphaI * 180 / Math.PI).toFixed(2) + '°');
      ro5.set('fy', S5.Fy.toFixed(4));
      ro5.set('fx', S5.Fx.toFixed(4));
      ro5.set('e', S5.Fx > 1e-9 ? (S5.Fy / S5.Fx).toFixed(1) : '∞');
      ro5.set('ue', S5.ueff.toFixed(4));
      hint5.innerHTML = st5.wRel < 1e-6
        ? 'Ohne Abwind steht F_res exakt senkrecht auf u∞: F_x = 0. Das ist der 2D-Fall — ' +
          'd\'Alembert, kein Widerstand.'
        : 'F_res steht immer noch senkrecht auf der <b>effektiven</b> Anströmung — daran ändert der ' +
          'Abwind nichts. Aber weil u_eff gekippt ist, hat F_res jetzt eine Komponente in ' +
          'x-Richtung. Das <b>ist</b> der induzierte Widerstand.';
      cv5.draw();
    }
    sync5();

    root.appendChild(FV.note('key', 'Der Kern in einem Satz',
      'Der induzierte Widerstand ist keine zusätzliche Kraft, die irgendwo herkommt — es ist ' +
      '<b>dieselbe</b> Querkraft, nur gekippt. Er tritt zu allen anderen Widerstandsanteilen ' +
      '(Reibung, Ablösung) hinzu und verschwindet nur, wenn der Auftrieb verschwindet: ' +
      '<b>kein Fliegen ohne induzierten Widerstand.</b>'));

    /* ============================================================
       6 · Die Beiwerte
       ============================================================ */

    root.appendChild(FV.section('6 · Die Beiwerte — Flügelstreckung'));

    root.appendChild(FV.eq(
      'c<sub>W,ind</sub> = <span class="frac"><span>c<sub>A</sub>²</span>' +
      '<span class="den">πΛ</span></span> &nbsp;&nbsp;&nbsp; mit &nbsp;&nbsp; ' +
      'Λ = <span class="frac"><span>b²</span><span class="den">A</span></span>',
      'Skript S. 91, gültig für die elliptische Zirkulationsverteilung'));

    root.appendChild(h('p', { html:
      'Zwei Aussagen stecken darin. Erstens: der induzierte Widerstand wächst mit dem ' +
      '<b>Quadrat</b> des Auftriebs — langsam fliegen ist teuer, weil c<sub>A</sub> dann gross sein ' +
      'muss. Zweitens: er sinkt mit der <b>Flügelstreckung</b> Λ. Ein Segelflugzeug hat deshalb lange ' +
      'dünne Flügel.' }));

    var st6 = { cA: 0.8, LAM: 9 };

    var cv6 = FV.canvas({
      aspect: 0.50,
      render: function (ctx, w, hgt) {
        var P = FV.plot(ctx, {
          w: w, h: hgt, x: [1, 30], y: [0, 0.14],
          pad: { l: 60, r: 16, t: 16, b: 40 },
          xticks: [1, 5, 10, 15, 20, 25, 30], yticks: [0, 0.03, 0.06, 0.09, 0.12],
          xlabel: 'Flügelstreckung Λ = b²/A', ylabel: 'c W,ind',
          yfmt: function (v) { return v.toFixed(2); }
        });
        P.grid(); P.axes();

        P.clip(function () {
          [[0.4, 'rgba(86,200,245,.5)'], [0.8, C2], [1.2, C1]].forEach(function (e) {
            P.curve(function (L) { return e[0] * e[0] / (Math.PI * L); }, { color: e[1], width: 2 });
          });
          P.curve(function (L) { return st6.cA * st6.cA / (Math.PI * L); }, { color: OK, width: 2.8 });
        });

        P.label(29, 1.2 * 1.2 / (Math.PI * 26), 'c A = 1.2', C1, 'right');
        P.label(29, 0.8 * 0.8 / (Math.PI * 22), 'c A = 0.8', C2, 'right');
        P.label(29, 0.4 * 0.4 / (Math.PI * 15), 'c A = 0.4', 'rgba(86,200,245,.7)', 'right');

        /* Marker realer Flugzeuge */
        [[2, 'Delta'], [9, 'Verkehrsflugzeug'], [25, 'Segelflugzeug']].forEach(function (e) {
          P.vline(e[0], { color: '#2a323d', dash: [3, 4] });
          P.label(e[0], 0.132, e[1], '#6e7d8c', e[0] > 20 ? 'right' : 'left');
        });

        var c = coeffs(st6.cA, st6.LAM);
        P.dot(st6.LAM, c.cWi, OK, 5.5);
      }
    });
    root.appendChild(cv6);

    var ro6 = FV.readout([
      { key: 'cwi', lab: 'c W,ind' },
      { key: 'ai', lab: 'α_i = c_A/(πΛ)', cls: 'c3' },
      { key: 'e', lab: 'c_A / c_W,ind', cls: 'c2' }
    ]);
    root.appendChild(ro6);

    root.appendChild(FV.ctrlRow(
      FV.slider({ label: 'Auftriebsbeiwert c_A', min: 0.1, max: 1.6, step: 0.01, value: st6.cA,
        fmt: function (v) { return v.toFixed(2); }, onInput: function (v) { st6.cA = v; sync6(); } }),
      FV.slider({ label: 'Flügelstreckung Λ', min: 1, max: 30, step: 0.1, value: st6.LAM,
        fmt: function (v) { return v.toFixed(1); }, onInput: function (v) { st6.LAM = v; sync6(); } })
    ));

    function sync6() {
      var c = coeffs(st6.cA, st6.LAM);
      ro6.set('cwi', c.cWi.toFixed(5));
      ro6.set('ai', (c.alphaI * 180 / Math.PI).toFixed(2) + '°');
      ro6.set('e', c.E.toFixed(1));
      cv6.draw();
    }
    sync6();

    root.appendChild(FV.note('', 'Grössenordnung',
      'Bei einem Verkehrsflugzeug macht der induzierte Widerstand mehr als ein Drittel des ' +
      'Gesamtwiderstands aus, der Reibungswiderstand mehr als die Hälfte. Sein Ursprung ist ' +
      'energetisch greifbar: die kinetische Energie, die im Abwind des Nachlaufs zurückbleibt, ' +
      'muss vom Antrieb aufgebracht werden. Winglets verkleinern ihn, indem sie die Randumströmung ' +
      'behindern — sie wirken wie eine künstliche Verlängerung der Spannweite.'));

    /* ============================================================
       7 · Die Gegenüberstellung
       ============================================================ */

    root.appendChild(FV.section('7 · 2D gegen 3D auf einen Blick'));

    var tbl = h('div', { class: 'panel' });
    tbl.innerHTML =
      '<table style="width:100%;border-collapse:collapse;font-size:13.5px">' +
      '<tr style="border-bottom:1px solid #2a323d">' +
      '<th style="text-align:left;padding:8px 10px;color:#6e7d8c;font-weight:600">&nbsp;</th>' +
      '<th style="text-align:left;padding:8px 10px;color:#56c8f5">ebene Strömung (2D)</th>' +
      '<th style="text-align:left;padding:8px 10px;color:#ff8a4c">räumliche Strömung (3D)</th></tr>' +
      [['Flügel', 'unendliche Spannweite', 'endliche Spannweite b'],
       ['Zirkulation', 'Γ konstant, kein z', 'Γ = Γ(z), fällt zu den Spitzen auf null'],
       ['Randwirbel', '<b>gibt es nicht</b>', 'zwei gegensinnige Nachlaufwirbel'],
       ['Abwind am Flügel', '<b>gibt es nicht</b>', 'v &lt; 0, vom eigenen Wirbelsystem induziert'],
       ['effektive Anströmung', 'gleich u<sub>∞</sub>', 'um α_i gekippt'],
       ['Auftrieb', 'F<sub>y</sub> = −Γϱu<sub>∞</sub>b', 'F<sub>y</sub> = F<sub>res</sub> cos α_i'],
       ['Widerstand', '<b>exakt null</b> (d\'Alembert)', 'F<sub>x</sub> = F<sub>res</sub> sin α_i &gt; 0'],
       ['Beiwert', 'c<sub>w</sub> = 0', 'c<sub>W,ind</sub> = c<sub>A</sub>²/(πΛ)'],
       ['Nomenklatur', 'c<sub>a</sub> (klein, Profil)', 'c<sub>A</sub> (gross, ganzer Körper)']]
        .map(function (r) {
          return '<tr style="border-bottom:1px solid #1b222c">' +
            '<td style="padding:7px 10px;color:#9aa7b4">' + r[0] + '</td>' +
            '<td style="padding:7px 10px">' + r[1] + '</td>' +
            '<td style="padding:7px 10px">' + r[2] + '</td></tr>';
        }).join('') +
      '</table>';
    root.appendChild(tbl);

    root.appendChild(FV.note('key', 'Die Prüfungsfrage dahinter',
      'Wird gefragt, warum ein Flügel endlicher Spannweite Widerstand hat, obwohl die Strömung ' +
      'reibungsfrei gerechnet wird, lautet die Antwort <b>nicht</b> „wegen der Reibung" und auch ' +
      'nicht „wegen Ablösung". Sie lautet: das Wirbelsystem, das nach Kutta-Joukowski den Auftrieb ' +
      'trägt, kann nach Helmholtz nicht am Flügelende aufhören. Die abgehenden Randwirbel induzieren ' +
      'am Flügel einen Abwind, der die effektive Anströmung kippt — und mit ihr die Querkraft. ' +
      'Die Rechenbausteine dafür stehen im Kapitel <a href="#biotsavart">Biot-Savart</a>.'));
  }
});
