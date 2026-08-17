/* ============================================================
   Wirbellinien — Integralkurven von ω, und was sie in der
   ebenen Grenzschicht tun.
   Skript Kap. 10.1, S. 82 f. (Definition, Tabelle 10.1, Abb. 10.4),
   Kap. 10.3, S. 87 f. (Helmholtz, Kelvin), Kap. 7.2, S. 40 f. (Blasius)
   ============================================================ */

FV.register({
  id: 'wirbellinien',
  chapter: 'Drehungsbehaftete Strömungen',
  chapterNo: '10.1',
  title: 'Wirbellinien und die Grenzschicht',
  subtitle: 'Was eine Wirbellinie ist, wo sie liegen darf und warum die Grenzschicht voll davon ist.',
  source: 'Skript S. 82 f., Tab. 10.1, Abb. 10.4 · Blasius S. 40 f. · Helmholtz/Kelvin S. 87 f.',

  build: function (root) {
    var h = FV.h;

    /* ================================================================
       PHYSIK — alles Rechnerische in einem Block, damit verify.js ihn
       aus dieser Datei herausschneiden und nachrechnen kann.
       ================================================================ */

    function blasius() {
      // 2 f''' + f f'' = 0,  f(0) = f'(0) = 0,  f'(∞) = 1
      // Trick statt Shooting: mit f''(0) = 1 integrieren liefert F'(∞) = C.
      // Wegen der Skalierungsinvarianz f(η) = c F(cη) gilt f'(∞) = c² C und
      // f''(0) = c³, also c = 1/√C und damit direkt α = f''(0) = C^(−3/2).
      var dE = 0.005, N = 2400;                      // bis η = 12
      function rhs(y) { return [y[1], y[2], -0.5 * y[0] * y[2]]; }
      function step(y, hh) {
        function add(a, b, s) { return [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s]; }
        var k1 = rhs(y), k2 = rhs(add(y, k1, hh / 2)),
            k3 = rhs(add(y, k2, hh / 2)), k4 = rhs(add(y, k3, hh));
        return [y[0] + hh / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
                y[1] + hh / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
                y[2] + hh / 6 * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2])];
      }
      var y = [0, 0, 1], i;
      for (i = 0; i < N; i++) y = step(y, dE);
      var alpha = Math.pow(y[1], -1.5);              // f''(0)
      y = [0, 0, alpha];
      var f = [0], fp = [0], fpp = [alpha];
      for (i = 0; i < N; i++) {
        y = step(y, dE); f.push(y[0]); fp.push(y[1]); fpp.push(y[2]);
      }
      return { dE: dE, N: N, alpha: alpha, f: f, fp: fp, fpp: fpp };
    }

    var BL = blasius();
    var ETA_MAX = BL.N * BL.dE;

    function tab(arr, eta) {                          // lineare Interpolation
      if (eta <= 0) return arr[0];
      if (eta >= ETA_MAX) return arr[BL.N];
      var q = eta / BL.dE, i = Math.floor(q);
      return arr[i] + (arr[i + 1] - arr[i]) * (q - i);
    }

    function uOfEta(eta) { return tab(BL.fp, eta); }              // u/u∞   = f'(η)
    function omOfEta(eta) { return tab(BL.fpp, eta) / BL.alpha; } // ω/ω_w  = f''(η)/f''(0)

    // η, bei dem u/u∞ den Wert frac erreicht  (δ ist definiert über frac = 0.99)
    function etaOfU(frac) {
      for (var i = 1; i <= BL.N; i++)
        if (BL.fp[i - 1] < frac && BL.fp[i] >= frac)
          return (i - 1 + (frac - BL.fp[i - 1]) / (BL.fp[i] - BL.fp[i - 1])) * BL.dE;
      return ETA_MAX;
    }
    // η, bei dem ω/ω_Wand auf frac abgefallen ist
    function etaOfOm(frac) {
      for (var i = 1; i <= BL.N; i++) {
        var a = BL.fpp[i - 1] / BL.alpha, b = BL.fpp[i] / BL.alpha;
        if (a >= frac && b < frac) return (i - 1 + (a - frac) / (a - b)) * BL.dE;
      }
      return ETA_MAX;
    }
    var ETA_99 = etaOfU(0.99);                        // 4.910 — das «5» im Skript
    function deltaStarEta() { return ETA_MAX - BL.f[BL.N]; }   // δ₁·√(u∞/νx) = 1.7208
    function thetaEta() {                                       // δ₂·√(u∞/νx) = 0.664
      var s = 0;
      for (var i = 0; i < BL.N; i++)
        s += (BL.fp[i] * (1 - BL.fp[i]) + BL.fp[i + 1] * (1 - BL.fp[i + 1])) / 2 * BL.dE;
      return s;
    }

    // Dimensionsbehaftet, mit u∞ = 1 und Plattenlänge L = 1, also ν = 1/Re_L
    function etaOfXY(x, y, nu) { return x <= 1e-9 ? ETA_MAX : y / Math.sqrt(nu * x); }
    function deltaOfX(x, nu) { return ETA_99 * Math.sqrt(nu * x); }      // δ = 4.91·√(νx)
    function uOfXY(x, y, nu) { return uOfEta(etaOfXY(x, y, nu)); }
    // ω_z = −∂u/∂y = −f''(η)/√(νx) ;  an der Wand also ω_w = −α/√(νx)
    function omWall(x, nu) { return x <= 1e-9 ? -Infinity : -BL.alpha / Math.sqrt(nu * x); }
    function omOfXY(x, y, nu) { return omWall(x, nu) * omOfEta(etaOfXY(x, y, nu)); }
    function cf(x, nu) { return 2 * BL.alpha * Math.sqrt(nu / x); }      // = 0.664/√Re_x

    /* ---- Λ-Wirbel: eine ausgelenkte Wirbellinie, materiell konvektiert ---- */
    // Wirbellinien haften an der Materie (Kelvin) — also genügt Mitschwimmen.
    function lambdaInit(n, x0, y0, amp, lam) {
      var p = [];
      for (var i = 0; i < n; i++) {
        var z = -lam / 2 + lam * i / (n - 1);
        var bump = Math.pow(Math.cos(Math.PI * z / lam), 2);   // 1 in der Mitte, 0 am Rand
        p.push({ x: x0, y: y0 + amp * bump, z: z });
      }
      return p;
    }
    function lambdaStep(p, dt, nu) {
      for (var i = 0; i < p.length; i++) p[i].x += uOfXY(p[i].x, p[i].y, nu) * dt;
    }
    function lineLength(p) {
      var L = 0;
      for (var i = 1; i < p.length; i++)
        L += Math.sqrt(Math.pow(p[i].x - p[i - 1].x, 2) +
                       Math.pow(p[i].y - p[i - 1].y, 2) +
                       Math.pow(p[i].z - p[i - 1].z, 2));
      return L;
    }

    /* ---- Galilei: Rankine-Wirbel in Parallelströmung ---- */
    var R0 = 0.55, OM0 = 1.7;            // Kernradius, Winkelgeschwindigkeit im Kern
    function uGal(x, y, Uinf, Ub) {
      var r = Math.hypot(x, y);
      var ut = r < 1e-6 ? 0 : (r <= R0 ? OM0 * r : OM0 * R0 * R0 / r);
      var ex = r < 1e-6 ? 0 : -y / r, ey = r < 1e-6 ? 0 : x / r;
      return [Uinf - Ub + ut * ex, ut * ey];
    }
    function omGal(x, y) {               // hängt weder von Uinf noch von Ub ab
      return Math.hypot(x, y) <= R0 ? 2 * OM0 : 0;
    }

    /* ===== Ende Physik ===== */

    /* ---- Kabinett-Projektion: x rechts, y oben, z schräg nach hinten ---- */
    function iso(cx, cy, s) {
      var az = 0.40, bz = 0.30;
      return {
        s: s,
        P: function (x, y, z) { return [cx + s * (x + z * az), cy - s * (y + z * bz)]; }
      };
    }

    /* ================================================================
       EINSTIEG
       ================================================================ */

    root.appendChild(FV.note('', 'Der eine Satz, um den es geht',
      'Eine <strong>Wirbellinie</strong> ist für das Wirbelstärkefeld ω genau das, was eine ' +
      '<strong>Stromlinie</strong> für das Geschwindigkeitsfeld u ist: eine Kurve, die in jedem ' +
      'Punkt in Richtung des Feldvektors zeigt. Mehr steckt in der Definition nicht drin. ' +
      'Interessant wird sie erst durch das, was daraus folgt — und weil sie fast nie dorthin zeigt, ' +
      'wo man sie erwartet.'));

    root.appendChild(FV.eq(
      '<div style="line-height:2.1">' +
      '<span style="color:#ffd166">dx/ds = ω(x, t)</span> &nbsp;&nbsp;bzw. äquivalent&nbsp;&nbsp; ' +
      'ω × dx = 0 &nbsp;&nbsp;⟺&nbsp;&nbsp; ' +
      'dx/ω<sub>x</sub> = dy/ω<sub>y</sub> = dz/ω<sub>z</sub>' +
      '</div>',
      's ist ein reiner Kurvenparameter, die Zeit t ist dabei fest — eine Momentaufnahme · Skript S. 82'));

    root.appendChild(h('p', { html:
      'Daneben die Stromlinie, exakt dieselbe Konstruktion mit u statt ω: ' +
      '<span style="font-family:var(--mono)">dx/u = dy/v = dz/w</span>. ' +
      'Beide Linienfelder existieren gleichzeitig im selben Strömungsgebiet, und sie haben in aller ' +
      'Regel <em>nichts</em> miteinander zu tun: im geraden Grenzschichtprofil stehen sie sogar exakt ' +
      'senkrecht aufeinander. Wer Wirbellinien und Stromlinien verwechselt, sieht in jeder Aufgabe ' +
      'das falsche Bild.' }));

    /* ================================================================
       1 · Die Vergleichsfigur
       ================================================================ */

    root.appendChild(FV.section('1 · Wo liegen die Wirbellinien wirklich?'));

    root.appendChild(h('p', { html:
      'Fünf Strömungen, immer dasselbe Bild: die <span style="color:#56c8f5">Stromlinien</span> liegen ' +
      'in der Zeichenebene, die <span style="color:#ffd166">Wirbellinien</span> stehen senkrecht darauf ' +
      'und laufen nach hinten in die Tiefe (z). Das ist kein Zufall dieser Beispiele, sondern gilt in ' +
      '<strong>jeder</strong> ebenen Strömung: ω = ω<sub>z</sub>·e<sub>z</sub>. Die Dicke der gelben ' +
      'Stäbe zeigt |ω|. Beim Laufenlassen wandern sie mit dem Fluid mit — Wirbellinien sind ' +
      'materielle Linien.' }));

    var FIELDS = {
      starr: {
        name: 'Starrkörperwirbel',
        om0: 1.1,
        u: function (x, y) { return [-1.1 * y, 1.1 * x]; },
        om: function () { return 2 * 1.1; },
        stream: 'circles', spin: function () { return 1.1; },
        msg: 'ω ist im ganzen Feld konstant = 2Ω. Ein dichter, überall gleich starker Wald von ' +
             'Wirbellinien — und er rotiert als Ganzes mit.',
        key: 'Wirbel UND Wirbelstärke'
      },
      pot: {
        name: 'Potentialwirbel',
        u: function (x, y) { var r2 = x * x + y * y; return r2 < 0.01 ? [0, 0] : [-0.7 * y / r2, 0.7 * x / r2]; },
        om: function (x, y) { return Math.hypot(x, y) < 0.12 ? 99 : 0; },
        stream: 'circles',
        msg: 'Ausserhalb der Achse ist ω ≡ 0 — es gibt keine einzige Wirbellinie im Feld. Die gesamte ' +
             'Zirkulation steckt in der Singularität auf der Achse. Deshalb heisst der Potentialwirbel ' +
             'auch Linienwirbel.',
        key: 'Wirbel OHNE Wirbelstärke (ausser auf der Achse)'
      },
      rankine: {
        name: 'Rankine-Wirbel',
        u: function (x, y) {
          var r = Math.hypot(x, y); if (r < 1e-6) return [0, 0];
          var ut = r <= 0.62 ? 1.1 * r : 1.1 * 0.62 * 0.62 / r;
          return [-ut * y / r, ut * x / r];
        },
        om: function (x, y) { return Math.hypot(x, y) <= 0.62 ? 2 * 1.1 : 0; },
        stream: 'circles', spin: function () { return 1.1; },
        msg: 'Der reale Wirbel: alle Wirbellinien stecken im Kern r ≤ r₀, aussen ist die Strömung eine ' +
             'reine Potentialströmung. Zusammen bilden sie genau eine Wirbelröhre vom Radius r₀.',
        key: 'Wirbelstärke gebündelt zur Wirbelröhre'
      },
      grenz: {
        name: 'Grenzschicht',
        u: function (x, y) { return [y <= 0 ? 0 : uOfEta(y * 3.1), 0]; },
        om: function (x, y) { return y < 0 ? 0 : -3.41 * omOfEta(y * 3.1); },
        stream: 'parallel', wall: true,
        msg: 'Die Stromlinien sind schnurgerade — trotzdem ist ω ≠ 0. Die Wirbellinien liegen quer ' +
             'zur Strömung, parallel zur Wand, und sie sind direkt an der Wand am stärksten. ' +
             'Genau das zeigt Abb. 10.4 im Skript.',
        key: 'Wirbelstärke OHNE Wirbel'
      },
      paar: {
        name: 'Wirbelpaar',
        u: function (x, y) {
          function w(cx, cy, G) {
            var dx = x - cx, dy = y - cy, r2 = dx * dx + dy * dy;
            return r2 < 0.02 ? [0, 0] : [-G * dy / r2, G * dx / r2];
          }
          var a = w(-0.55, 0, 0.5), b = w(0.55, 0, -0.5);
          return [a[0] + b[0], a[1] + b[1]];
        },
        om: function (x, y) {
          return (Math.hypot(x + 0.55, y) < 0.12 || Math.hypot(x - 0.55, y) < 0.12) ? 99 : 0;
        },
        stream: 'pair',
        msg: 'Zwei gegensinnige Linienwirbel — der Schnitt durch einen Wirbelring. Auch hier ist im ' +
             'ganzen sichtbaren Feld ω = 0, die Wirbelstärke sitzt in zwei Linien. Sie schieben sich ' +
             'gegenseitig; das ist genau das Kapitel <em>Wirbelring an der Wand</em>.',
        key: 'zwei Wirbelfäden'
      }
    };

    var sel = 'starr';
    var seeds = [];        // Fusspunkte der Wirbellinien, werden mitkonvektiert
    var isoRun = true;

    function reseed() {
      seeds = [];
      var F = FIELDS[sel], i, j;
      if (sel === 'pot') { seeds.push({ x: 0, y: 0, w: 3.4, fix: true }); return; }
      if (sel === 'paar') {
        seeds.push({ x: -0.55, y: 0, w: 2.6, fix: true });
        seeds.push({ x: 0.55, y: 0, w: 2.6, fix: true, neg: true });
        return;
      }
      if (sel === 'grenz') {
        // wandnormal gestaffelt: nahe der Wand dichter, dort ist |ω| gross
        [0.05, 0.15, 0.30, 0.52, 0.82, 1.20].forEach(function (yy) {
          for (var k = 0; k < 3; k++)
            seeds.push({ x: -1.05 + k * 1.05, y: yy, w: Math.abs(F.om(0, yy)) });
        });
        return;
      }
      // Kreisfelder: Polarkoordinaten speichern und exakt rotieren lassen
      for (i = -3; i <= 3; i++)
        for (j = -2; j <= 2; j++) {
          var x = i * 0.52, y = j * 0.52, r = Math.hypot(x, y);
          if (r > 1.45) continue;
          var w = Math.abs(F.om(x, y));
          if (w <= 0.05) continue;
          seeds.push({ x: x, y: y, w: w, r: r, th: Math.atan2(y, x) });
        }
    }
    reseed();

    var cvIso = FV.canvas({
      aspect: 0.66,
      render: function (ctx, w, hgt) {
        var F = FIELDS[sel];
        var ZB = 0.85;                    // Tiefe der dargestellten Wirbellinien
        // Maßstab und Lage aus dem tatsächlichen Platzbedarf, damit nichts abgeschnitten
        // wird und die Kopf-/Fusszeile frei bleiben (P: x + .4z nach rechts, y + .3z nach oben)
        var yLo = F.wall ? -0.14 : -1.40, yHi = 1.40;
        // die Wirbelfelder sind rund, die Grenzschicht ist breit und flach
        var xLo = F.wall ? -1.78 : -1.45, xHi = F.wall ? 1.90 : 1.62;
        var topPad = 56, botPad = 26;
        var s = Math.min(w / (xHi - xLo + 0.40 * ZB),
                         (hgt - topPad - botPad) / (yHi - yLo + 0.30 * ZB));
        var M = iso(w / 2 - s * (xLo + xHi + 0.40 * ZB) / 2,
                    topPad + s * (yHi + 0.30 * ZB), s);

        // Andeutung der Tiefenrichtung
        ctx.save();
        ctx.strokeStyle = 'rgba(120,140,160,.18)'; ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);
        [-1.6, 1.6].forEach(function (xx) {
          var yb = F.wall ? 0 : -1.35;
          var a = M.P(xx, yb, 0), b = M.P(xx, yb, ZB);
          ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
        });
        ctx.restore();

        // Wand (nur Grenzschicht)
        if (F.wall) {
          ctx.save();
          ctx.fillStyle = 'rgba(160,175,190,.13)';
          ctx.strokeStyle = 'rgba(180,195,210,.55)'; ctx.lineWidth = 1.6;
          ctx.beginPath();
          [[-1.7, 0, 0], [1.7, 0, 0], [1.7, 0, ZB], [-1.7, 0, ZB]].forEach(function (q, i) {
            var p = M.P(q[0], q[1], q[2]);
            i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
          });
          ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.restore();
        }

        // Stromlinien in der Ebene z = 0
        ctx.save();
        if (F.stream === 'circles') {
          [0.32, 0.62, 0.95, 1.3].forEach(function (r) {
            ctx.strokeStyle = 'rgba(86,200,245,.8)'; ctx.lineWidth = 1.9;
            ctx.beginPath();
            for (var a = 0; a <= 6.30; a += 0.06) {
              var p = M.P(r * Math.cos(a), r * Math.sin(a), 0);
              a ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
            }
            ctx.stroke();
          });
        } else if (F.stream === 'parallel') {
          [0.06, 0.18, 0.34, 0.55, 0.82, 1.15, 1.5].forEach(function (yy) {
            var a = M.P(-1.6, yy, 0), b = M.P(1.35, yy, 0);
            var uu = F.u(0, yy)[0];
            FV.arrow(ctx, a[0], a[1], a[0] + (b[0] - a[0]) * Math.max(uu, 0.06), a[1],
              'rgba(86,200,245,' + (0.35 + 0.4 * uu) + ')', 1.7, 7);
          });
        } else {
          for (var k = -3; k <= 3; k++) {
            var y0 = k * 0.38; if (Math.abs(y0) < 1e-9) y0 = 0.02;
            ctx.strokeStyle = 'rgba(86,200,245,.5)'; ctx.lineWidth = 1.5;
            ctx.beginPath();
            var q = [-1.6, y0];
            for (var n = 0; n < 260; n++) {
              var uu2 = F.u(q[0], q[1]);
              var nn = Math.hypot(uu2[0], uu2[1]) || 1;
              q = [q[0] + uu2[0] / nn * 0.016, q[1] + uu2[1] / nn * 0.016];
              if (Math.abs(q[0]) > 1.7 || Math.abs(q[1]) > 1.4) break;
              var p = M.P(q[0], q[1], 0);
              n ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
            }
            ctx.stroke();
          }
        }
        ctx.restore();

        // Wirbellinien in z-Richtung — von hinten (oben im Bild) nach vorne zeichnen,
        // sonst verdecken die hinteren Stäbe die vorderen
        seeds.slice().sort(function (p, q) { return q.y - p.y; }).forEach(function (sd) {
          var wgt = Math.min(sd.w, 4);
          var lw = 1.1 + wgt * 0.62;
          var col = sd.neg ? '#ff8a4c' : '#ffd166';
          ctx.save();
          ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round';
          var a = M.P(sd.x, sd.y, -0.06), b = M.P(sd.x, sd.y, ZB - 0.22);
          ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
          ctx.restore();
          var c = M.P(sd.x, sd.y, ZB);        // Pfeilspitze: Richtung von ω
          FV.arrow(ctx, b[0], b[1], c[0], c[1], col, lw, 5 + wgt * 0.8);
        });

        if (seeds.length === 0)
          FV.text(ctx, w * 0.42, hgt * 0.5, 'ω ≡ 0 — keine Wirbellinie im Feld',
            { color: '#6fdd8b', font: '13px -apple-system, sans-serif', align: 'center' });

        // Achsenhinweis für z
        var yb2 = F.wall ? 0.02 : -1.32;
        var o = M.P(1.42, yb2, 0), oz = M.P(1.42, yb2, 0.62);
        FV.arrow(ctx, o[0], o[1], oz[0], oz[1], '#7b8896', 1.4, 7);
        FV.text(ctx, oz[0] + 5, oz[1], 'z', { color: '#7b8896', font: '12px ui-monospace, monospace' });

        // Beschriftung auf abdeckendem Grund, damit kein Stab hineinragt
        ctx.save();
        ctx.font = '600 13.5px -apple-system, sans-serif';
        var bw = Math.max(ctx.measureText(F.name).width, 0);
        ctx.font = '12px -apple-system, sans-serif';
        bw = Math.max(bw, ctx.measureText(F.key).width) + 22;
        ctx.fillStyle = '#0b1016';        // exakt die Canvas-Hintergrundfarbe, volldeckend
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(6, 6, bw, 42, 7); else ctx.rect(6, 6, bw, 42);
        ctx.fill();
        ctx.restore();
        FV.text(ctx, 17, 24, F.name, { color: '#e6edf3', font: '600 13.5px -apple-system, sans-serif' });
        FV.text(ctx, 17, 42, F.key, { color: '#ffd166', font: '12px -apple-system, sans-serif' });
        FV.text(ctx, 12, hgt - 9, 'blau: Stromlinien (in der Ebene) · gelb: Wirbellinien (nach hinten)',
          { color: '#8494a3', font: '11px -apple-system, sans-serif' });
      }
    });
    root.appendChild(cvIso);

    var msgBox = h('div', { html: FIELDS.starr.msg });
    var fieldBtns = {};
    var rowF = FV.ctrlRow();
    Object.keys(FIELDS).forEach(function (k) {
      var b = FV.button(FIELDS[k].name, function () {
        sel = k; reseed();
        Object.keys(fieldBtns).forEach(function (q) { fieldBtns[q].classList.toggle('on', q === k); });
        msgBox.innerHTML = FIELDS[k].msg;
        cvIso.draw();
      });
      fieldBtns[k] = b;
      rowF.appendChild(b);
    });
    rowF.appendChild(FV.toggle('Bewegung', true, function (v) { isoRun = v; }));
    fieldBtns.starr.classList.add('on');
    root.appendChild(rowF);

    root.appendChild(h('div', { class: 'note key' },
      h('div', { class: 'note-h' }, 'Was man hier sieht'), msgBox));

    root.appendChild(FV.note('warn', 'Die Verwechslung, die am meisten kostet',
      'Beim <strong>Potentialwirbel</strong> und beim <strong>Wirbelpaar</strong> siehst du kreisende ' +
      'Stromlinien und trotzdem keine einzige Wirbellinie. Bei der <strong>Grenzschicht</strong> ist es ' +
      'genau umgekehrt: schnurgerade Stromlinien und ein dichtes Bündel Wirbellinien. ' +
      '<em>Kreisende Stromlinien sind kein Indiz für Wirbelstärke, gerade Stromlinien keines für ihr ' +
      'Fehlen.</em> Das Skript sagt es so: es gibt keinen Wirbel ohne Rotation — aber sehr wohl ' +
      'Rotation ohne Wirbel (S. 81). Mehr dazu im Kapitel ' +
      '<a href="#wirbel">Starrkörper- vs. Potentialwirbel</a>.'));

    /* ================================================================
       2 · Grenzschicht
       ================================================================ */

    root.appendChild(FV.section('2 · Die ebene Grenzschicht — der wichtigste Fall'));

    root.appendChild(h('p', { html:
      'Eine Platte wird mit u<sub>∞</sub> überströmt. In der Grenzschicht ist ' +
      'u = u(y)·e<sub>x</sub>, also folgt direkt aus ω = rot u:' }));

    root.appendChild(FV.eq(
      'ω = rot u = (0, 0, −∂u/∂y) &nbsp;&nbsp;⟹&nbsp;&nbsp; ' +
      '<span style="color:#ffd166">ω<sub>z</sub> = −∂u/∂y</span>',
      'die einzige Komponente steht senkrecht auf der Strömungsebene · Skript Abb. 10.4, S. 82'));

    root.appendChild(h('p', { html:
      'Drei Folgerungen, die man sich einprägen sollte, weil sie im Hintergrund fast jeder Aufgabe zur ' +
      'Grenzschicht mitlaufen:' }));

    root.appendChild(h('ol', null,
      h('li', { html: 'Die Wirbellinien laufen in <strong>z-Richtung</strong> — quer zur Strömung und ' +
        'parallel zur Wand. Sie stehen senkrecht auf den Stromlinien.' }),
      h('li', { html: '|ω| ist <strong>an der Wand am grössten</strong> und wird zum Grenzschichtrand hin ' +
        'praktisch null. Ausserhalb der Grenzschicht ist die Strömung eine Potentialströmung.' }),
      h('li', { html: 'Es gibt <strong>keinen Wirbel</strong> — nichts kreist, nichts rollt sich auf. ' +
        'Trotzdem ist die Strömung dort überall drehungsbehaftet.' })));

    var Re = 20000, xProbe = 0.55, gsRun = true;
    var wheels = [], gsOver = 1;
    function nu() { return 1 / Re; }        // u∞ = 1, L = 1
    function yView() { return 1.75 * deltaOfX(1, nu()); }   // dargestellter Höhenbereich

    function seedWheels() {
      wheels = [];
      var yMin = 0.16 * deltaOfX(1, nu()), yMax = 1.35 * deltaOfX(1, nu());
      for (var i = 0; i < 14; i++)
        wheels.push({
          x: Math.random(),
          y: yMin + (yMax - yMin) * Math.pow(Math.random(), 1.3),
          a: Math.random() * 6.28
        });
    }
    seedWheels();

    var roGS = FV.readout([
      { key: 'rex', lab: 'Re<sub>x</sub> an der Sonde' },
      { key: 'del', lab: 'δ(x) / L', cls: 'c2' },
      { key: 'omw', lab: '|ω| an der Wand · L/u<sub>∞</sub>', cls: 'c1' },
      { key: 'cf', lab: 'c<sub>f</sub> = 0.664/√Re<sub>x</sub>', cls: 'c3' },
      { key: 'ov', lab: 'y-Überhöhung im Bild' }
    ]);

    var cvGS = FV.canvas({
      aspect: 0.44,
      render: function (ctx, w, hgt) {
        var padL = 30, padR = 20, padT = 26, padB = 34;
        var x0 = padL, x1 = w - padR, yW = hgt - padB, yT = padT;
        var YV = yView();
        var sx = (x1 - x0), sy = (yW - yT) / YV;
        gsOver = sy / sx;
        function PX(x) { return x0 + x * sx; }
        function PY(y) { return yW - y * sy; }
        var n = nu();

        // Aussenströmung
        for (var j = 0; j < 5; j++) {
          var yy = YV * (0.62 + j * 0.09);
          FV.arrow(ctx, PX(0.02), PY(yy), PX(0.15), PY(yy), 'rgba(86,200,245,.32)', 1.4, 6);
        }

        // Bänder konstanter Wirbelstärke: y = η·√(νx), also Parabeln
        var levels = [
          { om: 0.90, a: 0.23 }, { om: 0.70, a: 0.185 }, { om: 0.50, a: 0.14 },
          { om: 0.30, a: 0.10 }, { om: 0.10, a: 0.06 }
        ];
        var prevEta = 0, xx;
        levels.forEach(function (lv) {
          var e = etaOfOm(lv.om);
          ctx.save();
          ctx.fillStyle = 'rgba(255,209,102,' + lv.a + ')';
          ctx.beginPath();
          for (xx = 0; xx <= 1.0001; xx += 0.02) ctx.lineTo(PX(xx), PY(prevEta * Math.sqrt(n * xx)));
          for (xx = 1; xx >= -0.0001; xx -= 0.02) ctx.lineTo(PX(xx), PY(e * Math.sqrt(n * xx)));
          ctx.closePath(); ctx.fill();
          ctx.restore();
          prevEta = e;
        });

        // Grenzschichtrand δ(x)
        ctx.save();
        ctx.strokeStyle = '#56c8f5'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
        ctx.beginPath();
        for (xx = 0; xx <= 1.0001; xx += 0.01) {
          var px = PX(xx), py = PY(deltaOfX(xx, n));
          xx ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.stroke(); ctx.restore();
        // Beschriftung auf deckendem Grund, sonst laufen die Raeder hindurch
        var dLabX = PX(0.90), dLabY = PY(deltaOfX(0.90, n)) - 15;
        ctx.save();
        ctx.font = '12px -apple-system, sans-serif';
        var dw = ctx.measureText('δ(x) ∝ √x').width;
        ctx.fillStyle = '#0b1016';
        ctx.fillRect(dLabX - dw / 2 - 5, dLabY - 11, dw + 10, 17);
        ctx.restore();
        FV.text(ctx, dLabX, dLabY, 'δ(x) ∝ √x',
          { color: '#56c8f5', align: 'center', font: '12px -apple-system, sans-serif' });

        // Wirbellinien als ⊗ (Blickrichtung: in die Zeichenebene hinein)
        for (var i = 0; i < 5; i++) {
          var xw = 0.25 + i * 0.163;
          [0.6, 2.2, 3.8].forEach(function (eta) {
            var yw = eta * Math.sqrt(n * xw);
            if (yw > YV * 0.95) return;
            var mag = omOfEta(eta);
            var rr = 2.6 + mag * 4.6;
            ctx.save();
            ctx.strokeStyle = 'rgba(255,209,102,' + (0.4 + 0.5 * mag) + ')';
            ctx.lineWidth = 1.3;
            ctx.beginPath(); ctx.arc(PX(xw), PY(yw), rr, 0, 6.2832); ctx.stroke();
            var d = rr * 0.7;
            ctx.beginPath();
            ctx.moveTo(PX(xw) - d, PY(yw) - d); ctx.lineTo(PX(xw) + d, PY(yw) + d);
            ctx.moveTo(PX(xw) + d, PY(yw) - d); ctx.lineTo(PX(xw) - d, PY(yw) + d);
            ctx.stroke(); ctx.restore();
          });
        }

        // Profil an der Sonde
        ctx.save();
        ctx.strokeStyle = 'rgba(120,140,160,.45)'; ctx.lineWidth = 1; ctx.setLineDash([2, 4]);
        ctx.beginPath(); ctx.moveTo(PX(xProbe), yW); ctx.lineTo(PX(xProbe), yT); ctx.stroke();
        ctx.restore();
        var scaleU = 0.115 * sx, m;
        ctx.save();
        ctx.strokeStyle = '#e6edf3'; ctx.lineWidth = 2;
        ctx.beginPath();
        for (m = 0; m <= 44; m++) {
          var yy2 = YV * m / 44;
          var uu = uOfXY(xProbe, yy2, n);
          m ? ctx.lineTo(PX(xProbe) + uu * scaleU, PY(yy2))
            : ctx.moveTo(PX(xProbe) + uu * scaleU, PY(yy2));
        }
        ctx.stroke(); ctx.restore();
        for (m = 1; m <= 7; m++) {
          var yy3 = YV * m / 8;
          var uu3 = uOfXY(xProbe, yy3, n);
          FV.arrow(ctx, PX(xProbe), PY(yy3), PX(xProbe) + uu3 * scaleU, PY(yy3), '#e6edf3', 1.3, 5);
        }

        // Schaufelräder
        wheels.forEach(function (wh) {
          var px2 = PX(wh.x), py2 = PY(wh.y);
          if (px2 > x1 - 2 || py2 < yT) return;
          var rr2 = 5.5;
          ctx.save();
          ctx.translate(px2, py2); ctx.rotate(wh.a);
          ctx.strokeStyle = '#ff8a4c'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
          for (var q = 0; q < 4; q++) {
            ctx.beginPath(); ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(q * 1.5708) * rr2, Math.sin(q * 1.5708) * rr2);
            ctx.stroke();
          }
          ctx.fillStyle = '#ff8a4c';
          ctx.beginPath(); ctx.arc(rr2, 0, 2, 0, 6.2832); ctx.fill();
          ctx.restore();
        });

        // Wand
        ctx.save();
        ctx.fillStyle = '#2a3542'; ctx.fillRect(x0, yW, x1 - x0, 8);
        ctx.strokeStyle = '#8fa0b0'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(x0, yW); ctx.lineTo(x1, yW); ctx.stroke();
        for (var hx = x0; hx < x1 - 6; hx += 9) {
          ctx.strokeStyle = 'rgba(143,160,176,.45)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(hx, yW + 8); ctx.lineTo(hx + 6, yW + 14); ctx.stroke();
        }
        ctx.restore();

        FV.text(ctx, x1, hgt - 5, 'x / L →', { color: '#7b8896', align: 'right', font: '11.5px -apple-system, sans-serif' });
        FV.text(ctx, 12, 18, 'ω-Verteilung über der Platte (Blasius)',
          { color: '#c8d3de', font: '12.5px -apple-system, sans-serif' });
      }
    });

    root.appendChild(cvGS);
    root.appendChild(FV.legend([
      { c: '#56c8f5', t: 'Grenzschichtrand δ (u/u∞ = 0.99)' },
      { c: '#ffd166', t: 'Wirbellinien ⊗ — Grösse ∝ |ω|' },
      { c: '#e6edf3', t: 'Geschwindigkeitsprofil an der Sonde' },
      { c: '#ff8a4c', t: 'Schaufelrad, dreht mit Ω = ω/2' }
    ]));

    root.appendChild(FV.ctrlRow(
      FV.slider({
        label: 'Reynoldszahl Re<sub>L</sub> = u<sub>∞</sub>L/ν', min: 3, max: 5, step: 0.02,
        value: Math.log10(20000),
        fmt: function (v) { return Math.round(Math.pow(10, v)).toLocaleString('de-CH'); },
        onInput: function (v) { Re = Math.pow(10, v); seedWheels(); lamReset(); updGS(); }
      }),
      FV.slider({
        label: 'Sonde bei x/L', min: 0.05, max: 1, step: 0.01, value: 0.55,
        fmt: function (v) { return v.toFixed(2); },
        onInput: function (v) { xProbe = v; updGS(); }
      }),
      FV.toggle('Bewegung', true, function (v) { gsRun = v; }),
      FV.button('Räder neu setzen', seedWheels)
    ));
    root.appendChild(roGS);

    function updGS() {
      var n = nu();
      roGS.set('rex', Math.round(xProbe / n).toLocaleString('de-CH'));
      roGS.set('del', deltaOfX(xProbe, n).toFixed(4));
      roGS.set('omw', Math.abs(omWall(xProbe, n)).toFixed(1));
      roGS.set('cf', cf(xProbe, n).toFixed(5));
      cvGS.draw();
      roGS.set('ov', '≈ ' + Math.round(gsOver) + '×');
    }
    updGS();

    root.appendChild(FV.note('key', 'Der Beweis läuft im Bild mit',
      'Die orangen Schaufelräder drehen sich mit Ω = ω/2 — das ist keine Zeichenkonvention, sondern ' +
      'das Skript-Ergebnis, dass die mittlere Winkelgeschwindigkeit eines Fluidteilchens die halbe ' +
      'Wirbelstärke beträgt (S. 80). Beobachte zwei Dinge: <strong>weit vorne links</strong> laufen ' +
      'die Räder noch ungedreht mit — die Grenzschicht ist dort dünner als ihre Höhe. Sobald sie ' +
      'eintauchen, beginnen sie zu drehen, und je näher an der Wand, desto schneller bei zugleich ' +
      'immer langsamerem Vorankommen. <strong>Oberhalb von δ</strong> dreht sich nichts, obwohl das ' +
      'Fluid dort am schnellsten strömt. Geschwindigkeit und Drehung haben nichts miteinander zu tun.'));

    /* ---- Profile ---- */

    root.appendChild(h('p', { html:
      'Beide Profile hängen nur von der Ähnlichkeitsvariablen η = y·√(u<sub>∞</sub>/νx) ab — deshalb ' +
      'sehen sie an <em>jeder</em> Stelle x gleich aus, nur in y gestreckt. Rechts steht die ' +
      'Wirbelstärke, und dort liegt der eigentliche Unterschied zum Geschwindigkeitsprofil: sie hat ' +
      'ihr Maximum an der Wand und fällt monoton nach aussen ab.' }));

    var cvU = FV.canvas({
      aspect: 0.85,
      render: function (ctx, w, hgt) {
        var P = FV.plot(ctx, {
          w: w, h: hgt, x: [0, 1.08], y: [0, 6],
          xticks: [0, 0.25, 0.5, 0.75, 1], yticks: [0, 1, 2, 3, 4, 5, 6],
          xlabel: 'u / u∞', ylabel: 'η'
        });
        P.grid(); P.axes();
        var pts = [], i;
        for (i = 0; i <= 120; i++) { var e = 6 * i / 120; pts.push([uOfEta(e), e]); }
        P.poly(pts, { color: '#e6edf3', width: 2.4 });
        ctx.save();
        ctx.strokeStyle = 'rgba(86,200,245,.75)'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(P.X(0), P.Y(ETA_99)); ctx.lineTo(P.X(1.08), P.Y(ETA_99)); ctx.stroke();
        ctx.restore();
        P.label(0.06, ETA_99 + 0.34, 'η = ' + ETA_99.toFixed(2) + '   →   δ', '#56c8f5');
        P.label(0.34, 0.30, 'Haftbedingung u(0) = 0', '#7b8896');
        FV.text(ctx, w - 12, 16, 'Geschwindigkeitsprofil f′(η)',
          { color: '#c8d3de', align: 'right', font: '12.5px -apple-system, sans-serif' });
      }
    });

    var cvOm = FV.canvas({
      aspect: 0.85,
      render: function (ctx, w, hgt) {
        var P = FV.plot(ctx, {
          w: w, h: hgt, x: [0, 1.08], y: [0, 6],
          xticks: [0, 0.25, 0.5, 0.75, 1], yticks: [0, 1, 2, 3, 4, 5, 6],
          xlabel: '|ω| / |ω_Wand|', ylabel: 'η'
        });
        P.grid(); P.axes();
        var pts = [], i;
        for (i = 0; i <= 120; i++) { var e = 6 * i / 120; pts.push([omOfEta(e), e]); }
        ctx.save();
        ctx.fillStyle = 'rgba(255,209,102,.12)';
        ctx.beginPath();
        ctx.moveTo(P.X(0), P.Y(0));
        pts.forEach(function (q) { ctx.lineTo(P.X(q[0]), P.Y(q[1])); });
        ctx.lineTo(P.X(0), P.Y(6)); ctx.closePath(); ctx.fill();
        ctx.restore();
        P.poly(pts, { color: '#ffd166', width: 2.4 });
        ctx.save();
        ctx.strokeStyle = 'rgba(86,200,245,.75)'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(P.X(0), P.Y(ETA_99)); ctx.lineTo(P.X(1.08), P.Y(ETA_99)); ctx.stroke();
        ctx.restore();
        P.dot(1, 0, '#ffd166', 5);
        P.label(0.28, 0.30, 'Maximum an der Wand', '#ffd166');
        P.label(0.12, ETA_99 + 0.34, 'bei δ nur noch ' +
          (omOfEta(ETA_99) * 100).toFixed(1) + ' % davon', '#56c8f5');
        FV.text(ctx, w - 12, 16, 'Wirbelstärke f″(η)',
          { color: '#c8d3de', align: 'right', font: '12.5px -apple-system, sans-serif' });
      }
    });

    root.appendChild(h('div', { class: 'duo' }, cvU, cvOm));
    root.appendChild(h('div', { class: 'canvas-cap' },
      'Numerisch gelöste Blasius-Gleichung 2f‴ + f f″ = 0 — dieselbe Lösung, aus der das Skript ' +
      'δ = 5x/√Re_x, δ₁ = 1.721x/√Re_x und c_f = 0.664/√Re_x gewinnt (S. 41).'));

    root.appendChild(FV.note('', 'Woher die Wirbelstärke überhaupt kommt',
      'Nach Kelvin kann in einer reibungsfreien Strömung mit konservativen Kräften nie Wirbelstärke ' +
      'entstehen — eine aus der Ruhe angefahrene Strömung bliebe für immer drehungsfrei (S. 88). ' +
      'Die Anströmung vor der Platte ist genau das: drehungsfrei. Erzeugt wird ω erst an der ' +
      '<strong>Wand</strong>, durch Haftbedingung und Reibung. Von dort diffundiert sie mit ν nach ' +
      'aussen, während sie mit u stromab konvektiert wird. Das Wettrennen dieser beiden Vorgänge ' +
      '<em>ist</em> die Grenzschicht:' +
      '<div class="eq" style="margin:12px 0">δ ~ √(ν·t) &nbsp;mit&nbsp; t ≈ x/u<sub>∞</sub> ' +
      '&nbsp;&nbsp;⟹&nbsp;&nbsp; δ ~ √(νx/u<sub>∞</sub>) = 5x/√Re<sub>x</sub></div>' +
      'Die Wurzel im Grenzschichtgesetz ist also nichts anderes als die Wurzel im Diffusionsgesetz. ' +
      'Genau deshalb wächst δ mit √x und schrumpft mit √Re — probiere beide Regler aus.'));

    /* ================================================================
       3 · ausgelenkte Wirbellinie
       ================================================================ */

    root.appendChild(FV.section('3 · Was passiert, wenn man eine Wirbellinie auslenkt?'));

    root.appendChild(h('p', { html:
      'Solange die Wirbellinie sauber in z liegt, passiert nichts: alle ihre Punkte sitzen auf ' +
      'derselben Höhe y, werden mit derselben Geschwindigkeit u(y) transportiert, und die Linie bleibt ' +
      'gerade. Das ist derselbe Sachverhalt, der in jeder 2D-Strömung (ω·∇)u = 0 erzwingt. ' +
      'Beult man sie aber ein Stück nach oben aus, kommt der ausgelenkte Teil in schnelleres Fluid und ' +
      'wird vorausgezogen — und weil Wirbellinien materielle Linien sind, folgt die Linie einfach mit. ' +
      'Es entsteht die typische Λ-Form.' }));

    var lam = { p: null, y0f: 0.5, ampf: 0.5, run: true, L0: 1, x0: 0.18 };
    function lamReset() {
      var d = deltaOfX(lam.x0, nu());
      lam.p = lambdaInit(41, lam.x0, lam.y0f * d, lam.ampf * d, 0.9);
      lam.L0 = lineLength(lam.p);
    }
    lamReset();

    var roLam = FV.readout([
      { key: 'len', lab: 'Länge L / L₀', cls: 'c1' },
      { key: 'om', lab: '|ω| / |ω₀| = L / L₀', cls: 'c1' },
      { key: 'spread', lab: 'Vorsprung der Spitze in x', cls: 'c2' },
      { key: 'diag', lab: 'Diagnose' }
    ]);

    var cvLam = FV.canvas({
      aspect: 0.52,
      render: function (ctx, w, hgt) {
        // Eigene Blickrichtung für diese Figur: die Spannweite z läuft quer über das Bild,
        // die Strömungsrichtung x in die Tiefe. Nur so ist die Λ-Form lesbar — in der
        // Projektion von Abschnitt 1 fielen z und x beide nach rechts und überlagerten sich.
        var XE = 1.45, ZE = 0.45, topPad = 56, botPad = 26;
        var ax = 0.45, ay = 0.35;                // Tiefenversatz pro Einheit x
        var YS = 0.25 / deltaOfX(1, nu());      // y-Überhöhung, sonst unsichtbar
        // Höhenbedarf aus der aktuellen Reglerstellung, sonst steht die Figur
        // bei kleiner Auslenkung in einem halbleeren Bild
        var yTop = Math.max(0.13, (lam.y0f + lam.ampf) * deltaOfX(lam.x0, nu()) * YS * 1.3);
        var s = Math.min(w / (2 * ZE + ax * XE),
                         (hgt - topPad - botPad) / (yTop + ay * XE));
        var cx = w / 2 - s * (ax * XE) / 2, cy = topPad + s * (yTop + ay * XE);
        var M = { P: function (x, y, z) { return [cx + s * (z + ax * x), cy - s * (y + ay * x)]; } };
        function Q(p) { return M.P(p.x, p.y * YS, p.z); }

        // Wand als Fläche y = 0
        ctx.save();
        ctx.fillStyle = 'rgba(160,175,190,.10)';
        ctx.strokeStyle = 'rgba(180,195,210,.45)'; ctx.lineWidth = 1.4;
        ctx.beginPath();
        [[0, 0, -ZE], [XE, 0, -ZE], [XE, 0, ZE], [0, 0, ZE]].forEach(function (q, i) {
          var p = M.P(q[0], q[1], q[2]);
          i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
        });
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();

        // Höhenmassstab an der linken Kante: wo liegt δ an der Startposition?
        var dStart = deltaOfX(lam.x0, nu()) * YS;
        var m0 = M.P(lam.x0, 0, -ZE), m1 = M.P(lam.x0, dStart, -ZE);
        ctx.save();
        ctx.strokeStyle = 'rgba(86,200,245,.7)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(m0[0], m0[1]); ctx.lineTo(m1[0], m1[1]); ctx.stroke();
        ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2;
        ctx.strokeStyle = 'rgba(86,200,245,.4)';
        ctx.beginPath(); ctx.moveTo(m1[0], m1[1]);
        ctx.lineTo(M.P(lam.x0, dStart, ZE)[0], M.P(lam.x0, dStart, ZE)[1]); ctx.stroke();
        ctx.restore();
        FV.text(ctx, m1[0] - 7, m1[1] - 2, 'δ',
          { color: '#56c8f5', align: 'right', font: '13px ui-monospace, monospace' });

        // Strömungsprofil an der rechten Kante: die Pfeile zeigen jetzt in die Tiefe,
        // also in die tatsächliche Strömungsrichtung
        var dRef = deltaOfX(0.30, nu());
        [0.3, 0.7, 1.1, 1.5].forEach(function (fr) {
          var yy = fr * dRef;
          var uu = uOfXY(0.30, yy, nu());
          var a = M.P(0.05, yy * YS, ZE * 0.98), b = M.P(0.05 + 0.62 * uu, yy * YS, ZE * 0.98);
          FV.arrow(ctx, a[0], a[1], b[0], b[1], 'rgba(86,200,245,' + (0.4 + 0.45 * uu) + ')', 1.7, 7);
        });
        var lp = M.P(0.05 + 0.62 * uOfXY(0.30, 1.5 * dRef, nu()), 1.5 * dRef * YS, ZE * 0.98);
        FV.text(ctx, lp[0] + 9, lp[1] - 4, 'u(y)',
          { color: '#56c8f5', font: '12px ui-monospace, monospace' });

        // Ausgangslage
        ctx.save();
        ctx.strokeStyle = 'rgba(230,237,243,.22)'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
        var yy0 = lam.y0f * deltaOfX(lam.x0, nu()) * YS;
        var a0 = M.P(lam.x0, yy0, -ZE), b0 = M.P(lam.x0, yy0, ZE);
        ctx.beginPath(); ctx.moveTo(a0[0], a0[1]); ctx.lineTo(b0[0], b0[1]); ctx.stroke();
        ctx.restore();

        // aktuelle Wirbellinie
        var Lr = lineLength(lam.p) / lam.L0;
        ctx.save();
        ctx.strokeStyle = '#ffd166'; ctx.lineWidth = Math.min(2.2 + 2.6 * (Lr - 1) * 4, 7);
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath();
        lam.p.forEach(function (q, i) {
          var pp = Q(q); i ? ctx.lineTo(pp[0], pp[1]) : ctx.moveTo(pp[0], pp[1]);
        });
        ctx.stroke(); ctx.restore();

        // Pfeilspitze am Ende: Richtung von ω
        var e1 = Q(lam.p[lam.p.length - 2]), e2 = Q(lam.p[lam.p.length - 1]);
        FV.arrow(ctx, e1[0], e1[1], e2[0], e2[1], '#ffd166', 3, 10);

        FV.text(ctx, 12, 20, 'Ausgelenkte Wirbellinie, materiell mitgeführt',
          { color: '#c8d3de', font: '12.5px -apple-system, sans-serif' });
        FV.text(ctx, 12, 39, 'Länge ×' + Lr.toFixed(3) + '   →   |ω| ×' + Lr.toFixed(3),
          { color: '#ffd166', font: '12px ui-monospace, monospace' });
        FV.text(ctx, 12, hgt - 10,
          'Spannweite z quer, Strömung x in die Tiefe · y stark überhöht',
          { color: '#6e7d8c', font: '11px -apple-system, sans-serif' });
      }
    });
    root.appendChild(cvLam);

    root.appendChild(FV.ctrlRow(
      FV.slider({
        label: 'Auslenkung der Beule / δ', min: 0, max: 1.2, step: 0.05, value: 0.5,
        fmt: function (v) { return v.toFixed(2) + '·δ'; },
        onInput: function (v) { lam.ampf = v; lamReset(); }
      }),
      FV.slider({
        label: 'Ausgangshöhe y₀ / δ', min: 0.1, max: 1.2, step: 0.05, value: 0.5,
        fmt: function (v) { return v.toFixed(2) + '·δ'; },
        onInput: function (v) { lam.y0f = v; lamReset(); }
      }),
      FV.toggle('Bewegung', true, function (v) { lam.run = v; }),
      FV.button('zurücksetzen', lamReset)
    ));
    root.appendChild(roLam);

    root.appendChild(FV.note('warn', 'Stell die Auslenkung auf 0',
      'Dann bleibt die Linie exakt gerade und behält ihre Länge — sie wird nur verschoben. Das ist der ' +
      'ungestörte 2D-Fall: (ω·∇)u = 0, ω ändert sich nicht. Schon eine kleine Beule genügt, damit die ' +
      'Linie gestreckt wird und |ω| wächst. Genau so beginnt der Umschlag zur Turbulenz in einer ' +
      'Plattengrenzschicht: aus spannweitigen Wirbellinien werden Λ- und Hufeisenwirbel, die sich ' +
      'selbst weiter verstärken. Der Mechanismus dahinter ist die Wirbelstreckung — siehe ' +
      '<a href="#wirbelstreckung">Wirbelstreckung und Kippen</a>.'));

    root.appendChild(FV.note('', 'Was diese Animation bewusst nicht kann',
      'Gezeigt ist nur die Konvektion durch das Grundprofil u(y). In Wirklichkeit induziert die ' +
      'gekrümmte Wirbellinie nach Biot-Savart auch ein Feld auf sich selbst, das die Beine des Λ ' +
      'aufrichtet und die Struktur von der Wand weghebt. Für das, was hier gezeigt werden soll — ' +
      'Wirbellinien sind materielle Linien, und Scherung streckt sie — ist die Selbstinduktion nicht ' +
      'nötig; für ein realistisches Bild des Umschlags schon.'));

    /* ================================================================
       4 · Eigenschaften
       ================================================================ */

    root.appendChild(FV.section('4 · Eigenschaften — ω gegen u'));

    root.appendChild(h('table', null,
      h('thead', null, h('tr', null,
        h('th', null, 'Wirbelstärkefeld ω(x)'),
        h('th', null, 'Geschwindigkeitsfeld u(x)'))),
      h('tbody', null,
        h('tr', null,
          h('td', { html: '<strong>div ω ≡ 0</strong> — immer, auch in kompressibler Strömung' }),
          h('td', { html: 'div u = 0 nur, falls inkompressibel' })),
        h('tr', null,
          h('td', { html: '<strong>Galilei-invariant</strong> — in jedem gleichförmig bewegten ' +
            'Bezugssystem dasselbe' }),
          h('td', { html: 'nicht invariant — Stromlinien sehen mitbewegt völlig anders aus' })),
        h('tr', null,
          h('td', { html: 'Wirbellinien = Integralkurven von ω' }),
          h('td', { html: 'Stromlinien = Integralkurven von u' })),
        h('tr', null,
          h('td', { html: 'Wirbelröhre: der Mantel besteht aus Wirbellinien' }),
          h('td', { html: 'Stromröhre: der Mantel besteht aus Stromlinien' })),
        h('tr', null,
          h('td', { html: 'Wirbelfaden — Röhre mit sehr kleinem Querschnitt' }),
          h('td', { html: 'Stromfaden' })),
        h('tr', null,
          h('td', { html: 'Zirkulation Γ = ∫<sub>S</sub> ω·n dS = Wirbelfluss durch S' }),
          h('td', { html: 'Volumenstrom V̇ = ∫<sub>S</sub> u·n dS durch S' })))));
    root.appendChild(h('div', { class: 'src' }, 'Tabelle 10.1 im Skript, S. 82'));

    root.appendChild(h('p', { html:
      'Zwei Zeilen davon lohnen einen zweiten Blick. <strong>div ω ≡ 0 gilt immer</strong>, weil ω per ' +
      'Konstruktion eine Rotation ist und div rot ≡ 0 — daraus folgt gleich der Helmholtzsche ' +
      'Wirbelsatz weiter unten. Und die <strong>Galilei-Invarianz</strong> ist der Grund, warum man ' +
      'über Wirbelstärke ohne Angabe des Bezugssystems reden darf, über Stromlinien aber nicht:' }));

    var Ub = 0, Uinf = 1.0;

    function drawGalStream(ctx, w, hgt) {
      // Ränder freihalten: die Bahnen laufen bis |y| = YM
      var YM = 1.3, topPad = 30, botPad = 26;
      var s = Math.min(w / 3.6, (hgt - topPad - botPad) / (2 * YM));
      var cx = w * 0.5, cy = topPad + s * YM;
      function PX(x) { return cx + x * s; }
      function PY(y) { return cy - y * s; }
      var starts = [], k;
      for (k = -6; k <= 6; k++) starts.push([-1.68, k * 0.21]);
      starts.push([0.18, 0], [0.34, 0], [-0.18, 0], [-0.34, 0], [0.75, 0], [-0.75, 0]);
      starts.forEach(function (q) {
        ctx.save();
        ctx.strokeStyle = 'rgba(86,200,245,.6)'; ctx.lineWidth = 1.4;
        ctx.beginPath();
        var p = q.slice(), ds = 0.011;
        for (var n = 0; n < 900; n++) {
          // Mittelpunktverfahren — mit Euler driften die Kreisbahnen sichtbar nach aussen
          // auf, obwohl sie geschlossen sein müssen
          var u1 = uGal(p[0], p[1], Uinf, Ub), n1 = Math.hypot(u1[0], u1[1]);
          if (n1 < 1e-4) break;
          var u2 = uGal(p[0] + u1[0] / n1 * ds / 2, p[1] + u1[1] / n1 * ds / 2, Uinf, Ub);
          var n2 = Math.hypot(u2[0], u2[1]);
          if (n2 < 1e-4) break;
          p = [p[0] + u2[0] / n2 * ds, p[1] + u2[1] / n2 * ds];
          if (Math.abs(p[0]) > 1.78 || Math.abs(p[1]) > YM) break;
          // geschlossene Bahn: einmal herum genügt, sonst zeichnet sie sich vielfach übereinander
          if (n > 25 && Math.hypot(p[0] - q[0], p[1] - q[1]) < 1.5 * ds) break;
          n ? ctx.lineTo(PX(p[0]), PY(p[1])) : ctx.moveTo(PX(p[0]), PY(p[1]));
        }
        ctx.stroke(); ctx.restore();
      });
      ctx.save();
      ctx.strokeStyle = 'rgba(255,209,102,.45)'; ctx.lineWidth = 1.2; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.arc(PX(0), PY(0), R0 * s, 0, 6.2832); ctx.stroke();
      ctx.restore();
      FV.text(ctx, 12, 18, 'Stromlinienbild im gewählten Bezugssystem',
        { color: '#c8d3de', font: '12.5px -apple-system, sans-serif' });
      FV.text(ctx, 12, hgt - 10,
        Math.abs(Ub - Uinf) < 0.06 ? 'mit dem Wirbel mitbewegt → geschlossene Bahnen'
          : (Math.abs(Ub) < 0.06 ? 'ruhendes System → welliges Bild, kein geschlossener Kreis'
            : 'irgendein anderes System → wieder ein anderes Bild'),
        { color: '#6e7d8c', font: '11.5px -apple-system, sans-serif' });
    }

    function drawGalOm(ctx, w, hgt) {
      var s = Math.min(w / 3.6, (hgt - 30 - 26) / 2.6);
      var cx = w * 0.5, cy = 30 + s * 1.3;
      ctx.save();
      ctx.fillStyle = 'rgba(255,209,102,.16)';
      ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, R0 * s, 0, 6.2832); ctx.fill(); ctx.stroke();
      ctx.restore();
      for (var i = -2; i <= 2; i++)
        for (var j = -2; j <= 2; j++) {
          var x = i * 0.25, y = j * 0.25;
          if (omGal(x, y) === 0) continue;
          var px = cx + x * s, py = cy - y * s;
          ctx.save();
          ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 1.3;
          ctx.beginPath(); ctx.arc(px, py, 5, 0, 6.2832); ctx.stroke();
          ctx.fillStyle = '#ffd166';
          ctx.beginPath(); ctx.arc(px, py, 1.8, 0, 6.2832); ctx.fill();
          ctx.restore();
        }
      FV.text(ctx, cx, cy + R0 * s + 22, 'ω = 2Ω im Kern,  ω = 0 aussen',
        { color: '#ffd166', align: 'center', font: '12px ui-monospace, monospace' });
      FV.text(ctx, 12, 18, 'Wirbelstärkefeld — identisch in jedem System',
        { color: '#c8d3de', font: '12.5px -apple-system, sans-serif' });
      FV.text(ctx, 12, hgt - 10, 'der Regler ändert hier nichts. Gar nichts.',
        { color: '#6fdd8b', font: '11.5px -apple-system, sans-serif' });
    }

    var cvGal1 = FV.canvas({ aspect: 0.72, render: drawGalStream });
    var cvGal2 = FV.canvas({ aspect: 0.72, render: drawGalOm });
    root.appendChild(h('div', { class: 'duo' }, cvGal1, cvGal2));

    root.appendChild(FV.ctrlRow(FV.slider({
      label: 'Geschwindigkeit des Beobachters U<sub>B</sub> / u<sub>∞</sub>',
      min: 0, max: 1.6, step: 0.02, value: 0,
      fmt: function (v) { return v.toFixed(2); },
      onInput: function (v) { Ub = v * Uinf; cvGal1.draw(); cvGal2.draw(); }
    })));
    root.appendChild(h('div', { class: 'canvas-cap' },
      'Rankine-Wirbel in einer Parallelströmung. Schiebe den Regler auf 1.00 — mitbewegt mit der ' +
      'Aussenströmung werden aus dem welligen Bild geschlossene Kreise. Das Wirbelstärkefeld rechts ' +
      'bleibt dabei unverändert.'));

    root.appendChild(FV.note('key', 'Warum das eine Prüfungsfrage wert ist',
      'Eine Aussage wie «hier liegt ein Wirbel vor, man sieht doch die geschlossenen Stromlinien» ist ' +
      'ohne Angabe des Bezugssystems wertlos — dasselbe Feld kann in einem anderen System völlig ' +
      'anders aussehen. Die Frage «ist die Strömung drehungsbehaftet?» dagegen hat immer eine ' +
      'eindeutige Antwort, weil ω nicht vom Bezugssystem abhängt. Wenn eine Aufgabe nach Rotation ' +
      'fragt, rechne ω aus und schau nicht auf das Bild.'));

    /* ================================================================
       5 · Helmholtz
       ================================================================ */

    root.appendChild(FV.section('5 · Wo darf eine Wirbellinie enden?'));

    root.appendChild(h('p', { html:
      'Aus div ω ≡ 0 folgt derselbe Schluss wie aus der Kontinuitätsgleichung für ein inkompressibles ' +
      'Geschwindigkeitsfeld: Der Fluss durch jeden Querschnitt einer Röhre ist gleich gross. Für ' +
      'Wirbelröhren heisst dieser Fluss Zirkulation — das ist der ' +
      '<strong>Helmholtzsche Wirbelsatz</strong>:' }));

    root.appendChild(FV.eq(
      'Γ = ∫<sub>S</sub> ω · n dS = const. längs der Wirbelröhre &nbsp;&nbsp;⟹&nbsp;&nbsp; ' +
      'ω<sub>1</sub>A<sub>1</sub> = ω<sub>2</sub>A<sub>2</sub>',
      'kinematische Aussage, gilt zu jedem festen Zeitpunkt · Skript S. 87'));

    root.appendChild(h('p', { html:
      'Daraus folgt die Aussage, nach der am häufigsten gefragt wird: eine Wirbelröhre kann nicht ' +
      'einfach aufhören. Wo sollte die Zirkulation hin? Es bleiben genau drei Möglichkeiten — und eine ' +
      'verbotene:' }));

    var cvHelm = FV.canvas({
      aspect: 0.34,
      render: function (ctx, w, hgt) {
        var cw = w / 4, cy = hgt * 0.44;
        // zwei kurze Zeilen, Schriftgrad an die Spaltenbreite angepasst — sonst laufen
        // sie im schmalen Fenster über den Spaltenrand hinaus
        function passend(txt, maxW, start, fett) {
          var size = start, pre = fett ? '600 ' : '';
          ctx.font = pre + size + 'px -apple-system, sans-serif';
          while (ctx.measureText(txt).width > maxW && size > 8) {
            size -= 0.5;
            ctx.font = pre + size + 'px -apple-system, sans-serif';
          }
          return pre + size + 'px -apple-system, sans-serif';
        }
        function box(i, zeile1, zeile2, ok) {
          var cx = cw * i + cw / 2, maxW = cw - 12;
          var col = ok ? '#c8d3de' : '#ff6b6b';
          FV.text(ctx, cx, hgt - 27, zeile1,
            { color: col, align: 'center', font: passend(zeile1, maxW, 12, true) });
          FV.text(ctx, cx, hgt - 11, zeile2,
            { color: ok ? '#7b8896' : '#ff6b6b', align: 'center',
              font: passend(zeile2, maxW, 11.5, false) });
          if (i > 0) {
            ctx.save(); ctx.strokeStyle = 'rgba(120,140,160,.16)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(cw * i, 26); ctx.lineTo(cw * i, hgt - 40); ctx.stroke(); ctx.restore();
          }
          return cx;
        }
        var R = Math.min(cw * 0.30, hgt * 0.23);

        // (1) geschlossener Ring
        var c1 = box(0, 'geschlossen', '(Wirbelring)', true);
        ctx.save();
        ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3.4;
        ctx.beginPath(); ctx.ellipse(c1, cy, R, R * 0.54, 0, 0, 6.2832); ctx.stroke();
        ctx.restore();
        FV.arrow(ctx, c1 + R - 1, cy - 5, c1 + R, cy + 9, '#ffd166', 2.4, 8);

        // (2) endet an einer Wand
        var c2 = box(1, 'an einer Wand', '(Grenzschicht!)', true);
        ctx.save();
        ctx.fillStyle = '#2a3542'; ctx.fillRect(c2 - R * 1.25, cy + R * 0.62, R * 2.5, 7);
        ctx.strokeStyle = '#8fa0b0'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(c2 - R * 1.25, cy + R * 0.62); ctx.lineTo(c2 + R * 1.25, cy + R * 0.62); ctx.stroke();
        ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(c2 - R * 0.9, cy + R * 0.62);
        ctx.bezierCurveTo(c2 - R * 0.8, cy - R * 0.9, c2 + R * 0.8, cy - R * 0.9, c2 + R * 0.9, cy + R * 0.62);
        ctx.stroke(); ctx.restore();

        // (3) ins Unendliche
        var c3 = box(2, 'im Unendlichen', '(freie Oberfläche)', true);
        ctx.save();
        ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(c3 - R * 1.1, cy + R * 0.34); ctx.lineTo(c3 + R * 1.1, cy - R * 0.34); ctx.stroke();
        ctx.setLineDash([3, 5]); ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(c3 - R * 1.45, cy + R * 0.45); ctx.lineTo(c3 - R * 1.1, cy + R * 0.34);
        ctx.moveTo(c3 + R * 1.1, cy - R * 0.34); ctx.lineTo(c3 + R * 1.45, cy - R * 0.45);
        ctx.stroke(); ctx.restore();
        FV.text(ctx, c3 - R * 1.5, cy + R * 0.8, '∞', { color: '#7b8896', align: 'center', font: '13px ui-monospace, monospace' });
        FV.text(ctx, c3 + R * 1.5, cy - R * 0.62, '∞', { color: '#7b8896', align: 'center', font: '13px ui-monospace, monospace' });

        // (4) verboten
        var c4 = box(3, 'mitten im Fluid', '— unmöglich', false);
        ctx.save();
        ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(c4 - R, cy + R * 0.3); ctx.lineTo(c4 + R * 0.2, cy - R * 0.06); ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.strokeStyle = '#ff6b6b'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
        var ex = c4 + R * 0.42, ey = cy - R * 0.12, d = 8;
        ctx.beginPath();
        ctx.moveTo(ex - d, ey - d); ctx.lineTo(ex + d, ey + d);
        ctx.moveTo(ex + d, ey - d); ctx.lineTo(ex - d, ey + d);
        ctx.stroke(); ctx.restore();

        FV.text(ctx, 12, 16, 'Die drei erlaubten Enden — und das verbotene',
          { color: '#c8d3de', font: '12.5px -apple-system, sans-serif' });
      }
    });
    root.appendChild(cvHelm);

    root.appendChild(FV.note('key', 'Der Bezug zur Grenzschicht',
      'Die spannweitigen Wirbellinien in der Plattengrenzschicht laufen quer über die Platte und enden ' +
      'an deren seitlichen Rändern — bei der idealisierten unendlich breiten Platte im Unendlichen. ' +
      'Beim Tragflügel sieht man alle drei Fälle auf einmal: der gebundene Wirbel im Flügel geht an ' +
      'den Flügelspitzen in die beiden Randwirbel über, die stromab bis zum Anfahrwirbel laufen — ' +
      'zusammen ein einziger geschlossener Wirbelring (Skript S. 89 ff.).'));

    root.appendChild(FV.note('', 'Und die zeitliche Aussage dazu (Kelvin)',
      'Helmholtz sagt etwas über <em>einen</em> Zeitpunkt. Kelvin ergänzt die Entwicklung in der Zeit: ' +
      'in einer reibungsfreien, barotropen Strömung mit konservativen Kräften ist die Zirkulation einer ' +
      'mitbewegten geschlossenen Kurve konstant. Die für uns wichtigste Folgerung daraus steht auf ' +
      'S. 88 und trägt die ganze Animation in Abschnitt 3:' +
      '<div class="eq" style="margin:12px 0">Fluidelemente, die einmal eine Wirbellinie gebildet haben, ' +
      'tun dies für alle Zeiten<br>' +
      '<span style="color:var(--fg-mute);font-size:13px">— «Wirbellinien haften an der Materie»</span></div>' +
      'Deshalb genügt es, die Punkte einer Wirbellinie einfach mitschwimmen zu lassen: sie bilden auch ' +
      'danach eine Wirbellinie. In der <em>realen</em> Grenzschicht ist die Voraussetzung reibungsfrei ' +
      'allerdings verletzt — dort diffundiert ω zusätzlich von der Wand nach aussen, und die ' +
      'Wirbellinien wandern relativ zur Materie.'));

    /* ================================================================
       6 · Fallen
       ================================================================ */

    root.appendChild(FV.section('6 · Die Fallen'));

    root.appendChild(FV.note('warn', 'Worauf du achten musst',
      '<ul style="margin:0">' +
      '<li><strong>Wirbellinie ≠ Stromlinie.</strong> In jeder ebenen Strömung stehen sie senkrecht ' +
      'aufeinander — die Wirbellinien zeigen aus der Zeichenebene heraus. Wer im 2D-Bild nach ' +
      'Wirbellinien sucht, findet höchstens Punkte.</li>' +
      '<li><strong>Gerade Stromlinien schliessen ω ≠ 0 nicht aus.</strong> Die Grenzschicht ist der ' +
      'Standardfall: rot u ≠ 0 ohne jeden Wirbel (Skript S. 81 und Abb. 10.4).</li>' +
      '<li><strong>Kreisende Stromlinien beweisen ω ≠ 0 nicht.</strong> Beim Potentialwirbel ist ω ≡ 0 ' +
      'überall ausser auf der Achse.</li>' +
      '<li><strong>ω ist maximal an der Wand, nicht in der Mitte der Grenzschicht.</strong> Das ' +
      'Geschwindigkeitsprofil ist dort am steilsten — und ω ist genau diese Steigung.</li>' +
      '<li><strong>Wirbellinien können nicht im Fluid enden.</strong> Wenn eine Skizze das zeigt, ist ' +
      'die Skizze falsch. Sie schliessen sich, enden an einer Berandung oder gehen ins Unendliche.</li>' +
      '<li><strong>Erhalten ist Γ, nicht ω.</strong> Verengt sich die Wirbelröhre, steigt ω — nach ' +
      'ω₁A₁ = ω₂A₂.</li>' +
      '<li><strong>ω ist Galilei-invariant, u nicht.</strong> Bei jeder Frage nach «liegt ein Wirbel ' +
      'vor» zuerst klären, in welchem Bezugssystem das Bild gezeichnet ist.</li>' +
      '</ul>'));

    /* ================================================================
       Animations-Loop
       ================================================================ */

    var prev = null;
    FV.loop(function (t) {
      if (prev === null) prev = t;
      var dt = Math.min(t - prev, 0.05); prev = t;

      /* --- Abschnitt 1: Wirbellinien mit dem Fluid mitführen --- */
      if (isoRun) {
        var F = FIELDS[sel];
        seeds.forEach(function (sd) {
          if (sd.fix) return;
          if (sd.r !== undefined) {                 // Kreisbahn: exakt drehen statt Euler
            sd.th += F.spin() * dt * 0.55;
            sd.x = sd.r * Math.cos(sd.th);
            sd.y = sd.r * Math.sin(sd.th);
          } else {
            var u = F.u(sd.x, sd.y);
            sd.x += u[0] * dt * 0.55; sd.y += u[1] * dt * 0.55;
            if (sd.x > 1.35) sd.x -= 2.5;           // periodisch nachrücken
          }
        });
        cvIso.draw();
      }

      /* --- Abschnitt 2: Schaufelräder --- */
      if (gsRun) {
        var n = nu();
        var yMin = 0.16 * deltaOfX(1, n), yMax = 1.35 * deltaOfX(1, n);
        wheels.forEach(function (wh) {
          wh.x += uOfXY(wh.x, wh.y, n) * dt * 0.22;
          wh.a += omOfXY(wh.x, wh.y, n) / 2 * dt * 0.22;
          if (wh.x > 1.02) {
            wh.x = 0.005;
            wh.y = yMin + (yMax - yMin) * Math.pow(Math.random(), 1.3);
          }
        });
        cvGS.draw();
      }

      /* --- Abschnitt 3: ausgelenkte Wirbellinie --- */
      if (lam.run) {
        lambdaStep(lam.p, dt * 0.16, nu());
        var Lr = lineLength(lam.p) / lam.L0;
        var spread = 0, xMax = 0;
        lam.p.forEach(function (q) {
          spread = Math.max(spread, q.x - lam.p[0].x);
          xMax = Math.max(xMax, q.x);
        });
        roLam.set('len', Lr.toFixed(3));
        roLam.set('om', Lr.toFixed(3));
        roLam.set('spread', spread.toFixed(3) + '·L');
        roLam.set('diag', lam.ampf < 1e-6 ? 'gerade — nichts passiert'
          : (Lr > 1.02 ? 'wird gestreckt, |ω| wächst' : 'noch fast ungestört'));
        if (xMax > 1.40) lamReset();       // die Spitze eilt voraus, sie begrenzt
        cvLam.draw();
      }
    });
  }
});
