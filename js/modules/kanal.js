/* ============================================================
   Kanallabor — dieselbe Frage zweimal: was treibt eine Strömung
   nach Ma = 1? Einmal über die Fläche (Laval, Kap. 11.4),
   einmal über die Reibung (Fanno, Kap. 11.7).
   Skript S. 105–108 und S. 117–119, Abb. 11.7, 11.16, 11.17
   ============================================================ */

FV.register({
  id: 'kanal',
  chapter: 'Kompressible Strömungen',
  chapterNo: '11.4·7',
  title: 'Kanallabor: Fläche, Reibung, Sperrung',
  subtitle: 'Laval und Fanno nebeneinander — wo Ma = 1 auftritt, wann gesperrt wird und was dann noch am Massenstrom ändert.',
  source: 'Skript S. 105–108 (Laval), S. 117–119 (Fanno), Abb. 11.7 und 11.17',

  build: function (root) {
    var h = FV.h;

    /* ================================================================
       PHYSIK — geschlossener Block, damit verify.js ihn aus dieser
       Datei herausschneiden und gegen die Tafeln nachrechnen kann.
       ================================================================ */

    var GAM = 1.4;

    /* ---- isentrop (Laval) ---- */
    function pIso(M) { return Math.pow(1 + (GAM - 1) / 2 * M * M, -GAM / (GAM - 1)); }
    function TIso(M) { return 1 / (1 + (GAM - 1) / 2 * M * M); }
    function rIso(M) { return Math.pow(1 + (GAM - 1) / 2 * M * M, -1 / (GAM - 1)); }
    function areaRatio(M) {          // A/A*
      return (1 / M) * Math.pow(2 / (GAM + 1) * (1 + (GAM - 1) / 2 * M * M),
                                (GAM + 1) / (2 * (GAM - 1)));
    }
    function MaFromArea(ar, sup) {   // Umkehrung, ar >= 1
      if (ar <= 1) return 1;
      var lo = sup ? 1 : 1e-5, hi = sup ? 60 : 1;
      // A/A* steigt im Ueberschall mit Ma, faellt im Unterschall — daher die
      // Fallunterscheidung; genau hier war die Bedingung erst invertiert.
      for (var i = 0; i < 90; i++) {
        var m = (lo + hi) / 2;
        if ((areaRatio(m) > ar) === sup) hi = m; else lo = m;
      }
      return (lo + hi) / 2;
    }
    function shockMa2(M1) {          // senkrechter Stoss
      return Math.sqrt((1 + (GAM - 1) / 2 * M1 * M1) / (GAM * M1 * M1 - (GAM - 1) / 2));
    }
    function shockP0(M1) {           // p02/p01
      var M2 = shockMa2(M1);
      return pIso(M1) / pIso(M2) * (2 * GAM / (GAM + 1) * M1 * M1 - (GAM - 1) / (GAM + 1));
    }

    /* ---- Fanno (Skript S. 118) ---- */
    function fT(M) { return (GAM + 1) / (2 + (GAM - 1) * M * M); }                 // T/T*
    function fp(M) { return (1 / M) * Math.sqrt((GAM + 1) / (2 + (GAM - 1) * M * M)); }  // p/p*
    function fr(M) { return (1 / M) * Math.sqrt((2 + (GAM - 1) * M * M) / (GAM + 1)); }  // ρ/ρ*
    function fp0(M) {                                                              // p0/p0*
      return (1 / M) * Math.pow((2 + (GAM - 1) * M * M) / (GAM + 1),
                                (GAM + 1) / (2 * (GAM - 1)));
    }
    // kritische Rohrlänge; λ ist die Rohrreibungszahl aus Kap. 8 (λ = 4·c_f)
    function fLD(M) {
      return (1 - M * M) / (GAM * M * M) +
             (GAM + 1) / (2 * GAM) * Math.log((GAM + 1) * M * M / (2 + (GAM - 1) * M * M));
    }
    function MaFromFLD(v, sup) {     // Umkehrung auf dem gewählten Ast
      if (v <= 0) return 1;
      var lo, hi, i, m;
      if (!sup) {                    // Unterschall: fLD fällt monoton von ∞ auf 0
        lo = 1e-5; hi = 1;
        for (i = 0; i < 90; i++) { m = (lo + hi) / 2; if (fLD(m) > v) lo = m; else hi = m; }
      } else {                       // Überschall: fLD steigt von 0 auf 0.8215
        if (v >= fLD(1e6)) return 1e6;
        lo = 1; hi = 1e6;
        for (i = 0; i < 90; i++) { m = (lo + hi) / 2; if (fLD(m) < v) lo = m; else hi = m; }
      }
      return (lo + hi) / 2;
    }
    // Stromdichte ρu bezogen auf den Kesselzustand — proportional zum Massenstrom
    function flux(M) {
      return M * Math.pow(1 + (GAM - 1) / 2 * M * M, -(GAM + 1) / (2 * (GAM - 1)));
    }

    /* ---- Laval-Geometrie und Lösung ---- */
    var XT = 0.35, AIN = 2.6;
    function AofX(x, AE) {
      if (x <= XT) return 1 + (AIN - 1) * Math.pow(1 - x / XT, 2);
      return 1 + (AE - 1) * Math.pow((x - XT) / (1 - XT), 2);
    }
    function solveLaval(pa, AE) {
      var MeSup = MaFromArea(AE, true), MeSub = MaFromArea(AE, false);
      var P_E = pIso(MeSup);                          // angepasst
      var P_B = pIso(MeSub);                          // gerade gesperrt
      var P_D = P_E * (2 * GAM / (GAM + 1) * MeSup * MeSup - (GAM - 1) / (GAM + 1));
      var res = { P_E: P_E, P_B: P_B, P_D: P_D, MeSup: MeSup, MeSub: MeSub, xs: null, AE: AE };

      if (pa >= P_B) {                                // nicht gesperrt: reines Venturi
        res.mode = 'venturi'; res.choked = false;
        // A* virtuell so, dass p(Austritt) = pa
        var MeV = MaFromP(pa);
        var Astar = AE / areaRatio(MeV);
        res.Astar = Astar; res.mdot = Astar; res.MaOut = MeV;
        res.chokeX = null;
        return res;
      }
      res.choked = true; res.Astar = 1; res.mdot = 1;
      res.chokeX = XT;
      if (pa <= P_E * 1.008) { res.mode = pa < P_E * 0.992 ? 'under' : 'design'; res.MaOut = MeSup; return res; }
      if (pa <= P_D * 1.002) { res.mode = 'over'; res.MaOut = MeSup; return res; }
      // Stoss im divergenten Teil: Position so, dass p(Austritt) = pa.
      // Je weiter stromab der Stoss sitzt, desto staerker ist er und desto
      // TIEFER der Austrittsdruck — pExitWithShock faellt also mit xs.
      var lo = XT + 1e-4, hi = 1;
      for (var i = 0; i < 70; i++) {
        var xs = (lo + hi) / 2;
        if (pExitWithShock(xs, AE) > pa) lo = xs; else hi = xs;
      }
      res.mode = 'shock'; res.xs = (lo + hi) / 2; res.MaOut = null;
      return res;
    }
    function MaFromP(pr) {           // Unterschall-Ma aus p/p0
      var lo = 1e-5, hi = 1;
      for (var i = 0; i < 80; i++) { var m = (lo + hi) / 2; if (pIso(m) > pr) lo = m; else hi = m; }
      return (lo + hi) / 2;
    }
    function pExitWithShock(xs, AE) {  // Austrittsdruck/p0 bei Stoss an der Stelle xs
      var M1 = MaFromArea(AofX(xs, AE), true);
      var p0r = shockP0(M1);
      var M2 = shockMa2(M1);
      var AstarAfter = AofX(xs, AE) / areaRatio(M2);
      var Me = MaFromArea(AE / AstarAfter, false);
      return p0r * pIso(Me);
    }
    // Zustand an der Stelle x im Laval-Kanal
    function lavalAt(x, s) {
      var A = AofX(x, s.AE);
      if (!s.choked) {
        var M = MaFromArea(A / s.Astar, false);
        return { Ma: M, p: pIso(M), T: TIso(M), r: rIso(M), p0: 1 };
      }
      if (s.xs !== null && x > s.xs) {                 // hinter dem Stoss
        var M1 = MaFromArea(AofX(s.xs, s.AE), true);
        var p0r = shockP0(M1), M2 = shockMa2(M1);
        var AstarA = AofX(s.xs, s.AE) / areaRatio(M2);
        var Mx = MaFromArea(A / AstarA, false);
        return { Ma: Mx, p: p0r * pIso(Mx), T: TIso(Mx), r: p0r * rIso(Mx), p0: p0r };
      }
      var sup = x > XT;
      var Mx2 = MaFromArea(A, sup);
      return { Ma: Mx2, p: pIso(Mx2), T: TIso(Mx2), r: rIso(Mx2), p0: 1 };
    }

    /* ---- Fanno-Lösung: Rohr am Kessel, Gegendruck pa/p0 ---- */
    function fannoOut(Ma1, fld) {
      var rest = fLD(Ma1) - fld;
      var Ma2 = rest <= 1e-12 ? 1 : MaFromFLD(rest, false);
      return { Ma2: Ma2, p: pIso(Ma1) * fp(Ma2) / fp(Ma1) };
    }
    function solveFanno(fld, pa) {
      var Ma1max = MaFromFLD(fld, false);              // grösstes mögliches Eintritts-Ma
      var chok = fannoOut(Ma1max, fld);
      if (pa <= chok.p + 1e-9)
        return { choked: true, Ma1: Ma1max, Ma2: chok.Ma2, pOut: chok.p,
                 mdot: flux(Ma1max), pChoke: chok.p, Ma1max: Ma1max, fld: fld };
      var lo = 1e-5, hi = Ma1max;
      for (var i = 0; i < 80; i++) {
        var m = (lo + hi) / 2;
        if (fannoOut(m, fld).p > pa) lo = m; else hi = m;
      }
      var Ma1 = (lo + hi) / 2, o = fannoOut(Ma1, fld);
      return { choked: false, Ma1: Ma1, Ma2: o.Ma2, pOut: o.p,
               mdot: flux(Ma1), pChoke: chok.p, Ma1max: Ma1max, fld: fld };
    }
    // Zustand an der Stelle x ∈ [0,1] im Rohr
    function fannoAt(x, s) {
      var rest = fLD(s.Ma1) - s.fld * x;
      var M = rest <= 1e-12 ? 1 : MaFromFLD(rest, false);
      var k = fp(s.Ma1);
      return { Ma: M, p: pIso(s.Ma1) * fp(M) / k, T: TIso(s.Ma1) * fT(M) / fT(s.Ma1),
               r: rIso(s.Ma1) * fr(M) / fr(s.Ma1),
               p0: fp0(M) / fp0(s.Ma1) };
    }

    /* ===== Ende Physik ===== */

    /* ================================================================
       EINSTIEG
       ================================================================ */

    root.appendChild(FV.note('', 'Der eine Satz, um den es geht',
      'Eine kompressible Strömung lässt sich auf zwei völlig verschiedene Arten antreiben — über die ' +
      '<strong>Querschnittsänderung</strong> oder über die <strong>Reibung</strong>. Beide tun am Ende ' +
      'dasselbe: sie treiben die Mach-Zahl in Richtung <strong>Ma = 1</strong>. Und beide stossen an ' +
      'dieselbe Wand: ist Ma = 1 einmal erreicht, ist der Kanal <em>gesperrt</em> und mehr Massenstrom ' +
      'geht nicht mehr durch, egal wie stark man hinten saugt.'));

    root.appendChild(h('table', null,
      h('thead', null, h('tr', null, h('th', null, ''), h('th', null, 'Laval (Kap. 11.4)'),
        h('th', null, 'Fanno (Kap. 11.7)'))),
      h('tbody', null,
        h('tr', null, h('td', { html: '<strong>Antrieb</strong>' }),
          h('td', null, 'Querschnitt A(x) ändert sich'),
          h('td', null, 'Wandreibung τ_w, A = const.')),
        h('tr', null, h('td', { html: '<strong>reibungsfrei?</strong>' }),
          h('td', { html: 'ja — isentrop, p<sub>0</sub> = const.' }),
          h('td', { html: 'nein — adiabat, aber p<sub>0</sub> fällt' })),
        h('tr', null, h('td', { html: '<strong>Ma = 1 tritt auf</strong>' }),
          h('td', { html: 'im <strong>engsten Querschnitt</strong> (Hals)' }),
          h('td', { html: 'am <strong>Rohrende</strong>, bei der Länge L*' })),
        h('tr', null, h('td', { html: '<strong>Unterschall wird</strong>' }),
          h('td', null, 'beschleunigt, wenn A abnimmt'),
          h('td', null, 'beschleunigt — immer')),
        h('tr', null, h('td', { html: '<strong>Überschall wird</strong>' }),
          h('td', null, 'beschleunigt, wenn A zunimmt'),
          h('td', null, 'verzögert — immer')),
        h('tr', null, h('td', { html: '<strong>umkehrbar?</strong>' }),
          h('td', null, 'ja, die Strömung ist isentrop'),
          h('td', { html: 'nein, s wächst — nur Richtung Ma = 1' })))));

    root.appendChild(FV.note('warn', 'Die Falle gleich vorweg',
      'Bei Fanno beschleunigt die <em>Reibung</em> eine Unterschallströmung. Das klingt falsch, ist es ' +
      'aber nicht: um den Reibungswiderstand zu überwinden, muss der Druck in Strömungsrichtung fallen ' +
      '— und dieser Druckabfall beschleunigt stärker, als die Reibung bremst (Skript S. 119). Im ' +
      'Überschall dreht sich das Vorzeichen um und die Strömung wird verzögert. Beide Male landet man ' +
      'bei Ma = 1.'));

    /* ================================================================
       1 · Das Labor
       ================================================================ */

    root.appendChild(FV.section('1 · Der Kanal'));

    var st = { modus: 'laval', pa: 0.55, AE: 2.0, fld: 1.0693, animT: 0, run: true };
    var loesung = null;

    function rechne() {
      loesung = st.modus === 'laval' ? solveLaval(st.pa, st.AE) : solveFanno(st.fld, st.pa);
      return loesung;
    }
    function zustand(x) {
      return st.modus === 'laval' ? lavalAt(x, loesung) : fannoAt(x, loesung);
    }
    function kontur(x) {              // halbe Kanalhöhe, auf 1 normiert
      return st.modus === 'laval' ? Math.sqrt(AofX(x, st.AE) / AIN) : Math.sqrt(1 / AIN) * 1.35;
    }
    rechne();

    // Farbskala für Ma
    function maSkala() { return st.modus === 'fanno' ? 1.15 : 3; }
    function maFarbe(M, alpha) {
      var t = Math.max(0, Math.min(M / maSkala(), 1));
      var r, g, b;
      if (t < 0.5) { var u = t / 0.5; r = 40 + u * 40; g = 90 + u * 130; b = 200 - u * 40; }
      else { var v = (t - 0.5) / 0.5; r = 80 + v * 175; g = 220 - v * 120; b = 160 - v * 110; }
      return 'rgba(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ',' + (alpha === undefined ? 1 : alpha) + ')';
    }

    var teilchen = [];
    function saeTeilchen() {
      teilchen = [];
      for (var i = 0; i < 34; i++)
        teilchen.push({ x: Math.random(), yr: (Math.random() * 2 - 1) * 0.78 });
    }
    saeTeilchen();

    var roK = FV.readout([
      { key: 'gesperrt', lab: 'Sperrung' },
      { key: 'wo', lab: 'Ma = 1 an der Stelle', cls: 'c3' },
      { key: 'ma1', lab: 'Ma am Eintritt', cls: 'c2' },
      { key: 'ma2', lab: 'Ma am Austritt', cls: 'c1' },
      { key: 'pout', lab: 'p am Austritt / p₀' },
      { key: 'mdot', lab: 'ṁ / ṁ<sub>max</sub>', cls: 'c1' }
    ]);

    var cvKanal = FV.canvas({
      aspect: 0.40,
      render: function (ctx, w, hgt) {
        var padL = 34, padR = 48, padT = 52, padB = 40;
        var x0 = padL, x1 = w - padR, cy = padT + (hgt - padT - padB) / 2;
        var sx = x1 - x0, sy = (hgt - padT - padB) / 2 / 1.0;
        function PX(x) { return x0 + x * sx; }
        function PY(yr) { return cy - yr * sy; }

        // Kanal als Farbband über Ma
        var N = 130;
        for (var i = 0; i < N; i++) {
          var xa = i / N, xb = (i + 1) / N;
          var z = zustand((xa + xb) / 2);
          ctx.fillStyle = maFarbe(z.Ma, 0.34);
          ctx.beginPath();
          ctx.moveTo(PX(xa), PY(kontur(xa))); ctx.lineTo(PX(xb), PY(kontur(xb)));
          ctx.lineTo(PX(xb), PY(-kontur(xb))); ctx.lineTo(PX(xa), PY(-kontur(xa)));
          ctx.closePath(); ctx.fill();
        }

        // Wandkontur
        ctx.save();
        ctx.strokeStyle = '#9fb0c0'; ctx.lineWidth = 2.4; ctx.lineJoin = 'round';
        [1, -1].forEach(function (sg) {
          ctx.beginPath();
          for (var k = 0; k <= 130; k++) {
            var xx = k / 130, p = [PX(xx), PY(sg * kontur(xx))];
            k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
          }
          ctx.stroke();
        });
        ctx.restore();

        // Reibungs-Schraffur bei Fanno
        if (st.modus === 'fanno') {
          ctx.save();
          ctx.strokeStyle = 'rgba(255,138,76,.55)'; ctx.lineWidth = 1.2;
          [1, -1].forEach(function (sg) {
            for (var xx = 0.01; xx < 1; xx += 0.028) {
              var yb = sg * kontur(xx);
              ctx.beginPath();
              ctx.moveTo(PX(xx), PY(yb));
              ctx.lineTo(PX(xx) + 5, PY(yb) + sg * 7);
              ctx.stroke();
            }
          });
          ctx.restore();
          FV.text(ctx, PX(0.5), PY(kontur(0.5)) - 12, 'τ_w — Wandreibung',
            { color: '#ff8a4c', align: 'center', font: '11.5px -apple-system, sans-serif' });
        }

        // Achse
        ctx.save();
        ctx.strokeStyle = 'rgba(140,155,170,.35)'; ctx.lineWidth = 1; ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(PX(0), cy); ctx.lineTo(PX(1), cy); ctx.stroke();
        ctx.restore();

        // Teilchen
        teilchen.forEach(function (t) {
          var z = zustand(t.x);
          var kx = PX(t.x), ky = PY(t.yr * kontur(t.x) * 0.86);
          var len = 3 + z.Ma * 9;
          ctx.save();
          ctx.strokeStyle = maFarbe(z.Ma, 0.95); ctx.lineWidth = 2; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(kx - len, ky); ctx.lineTo(kx, ky); ctx.stroke();
          ctx.restore();
        });

        // Sperrstelle markieren
        var xc = st.modus === 'laval' ? (loesung.choked ? XT : null) : (loesung.choked ? 1 : null);
        if (xc !== null) {
          ctx.save();
          ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(PX(xc), PY(kontur(xc)) - 4); ctx.lineTo(PX(xc), PY(-kontur(xc)) + 4);
          ctx.stroke(); ctx.restore();
          ctx.save();
          ctx.font = '600 12px -apple-system, sans-serif';
          var tw = ctx.measureText('Ma = 1').width;
          var lx = Math.min(PX(xc), x1 - tw / 2 - 4);
          ctx.fillStyle = '#0b1016';
          ctx.fillRect(lx - tw / 2 - 5, padT - 20, tw + 10, 17);
          ctx.restore();
          FV.text(ctx, lx, padT - 8, 'Ma = 1',
            { color: '#a78bfa', align: 'center', font: '600 12px -apple-system, sans-serif' });
        }

        // Stoss bei Laval
        if (st.modus === 'laval' && loesung.xs !== null && loesung.xs !== undefined) {
          ctx.save();
          ctx.strokeStyle = '#ff6b6b'; ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(PX(loesung.xs), PY(kontur(loesung.xs)));
          ctx.lineTo(PX(loesung.xs), PY(-kontur(loesung.xs)));
          ctx.stroke(); ctx.restore();
          FV.text(ctx, PX(loesung.xs), PY(-kontur(loesung.xs)) + 16, 'Stoss',
            { color: '#ff6b6b', align: 'center', font: '11.5px -apple-system, sans-serif' });
        }

        // Kessel links, Gegendruck rechts
        FV.text(ctx, x0 - 4, cy - 4, 'p₀', { color: '#7b8896', align: 'right', font: '13px ui-monospace, monospace' });
        FV.text(ctx, x0 - 4, cy + 12, 'T₀', { color: '#7b8896', align: 'right', font: '13px ui-monospace, monospace' });
        FV.text(ctx, x1 + 7, cy + 4, 'p_a', { color: '#7b8896', font: '13px ui-monospace, monospace' });

        FV.text(ctx, 12, 20, st.modus === 'laval'
          ? 'Laval-Düse — Querschnitt treibt die Strömung'
          : 'Fanno-Rohr — Reibung treibt die Strömung',
          { color: '#c8d3de', font: '12.5px -apple-system, sans-serif' });
        FV.text(ctx, x1, hgt - 6, 'x / L →',
          { color: '#7b8896', align: 'right', font: '11.5px -apple-system, sans-serif' });
        FV.text(ctx, 12, hgt - 6,
          'Farbe und Strichlänge: lokale Mach-Zahl (Skala 0 … ' + maSkala().toFixed(2) + ')',
          { color: '#6e7d8c', font: '11px -apple-system, sans-serif' });
      }
    });
    root.appendChild(cvKanal);

    /* ---- Bedienung ---- */
    var btnLaval, btnFanno, ctrlLaval, ctrlFanno;

    function setModus(m) {
      st.modus = m;
      btnLaval.classList.toggle('on', m === 'laval');
      btnFanno.classList.toggle('on', m === 'fanno');
      ctrlLaval.style.display = m === 'laval' ? '' : 'none';
      ctrlFanno.style.display = m === 'fanno' ? '' : 'none';
      saeTeilchen();
      upd();
    }

    btnLaval = FV.button('Laval — Fläche', function () { setModus('laval'); });
    btnFanno = FV.button('Fanno — Reibung', function () { setModus('fanno'); });
    root.appendChild(FV.ctrlRow(btnLaval, btnFanno,
      FV.toggle('Bewegung', true, function (v) { st.run = v; })));

    var sPa = FV.slider({
      label: 'Gegendruck p<sub>a</sub> / p₀', min: 0.02, max: 0.995, step: 0.0025, value: 0.55,
      fmt: function (v) { return v.toFixed(3); },
      onInput: function (v) { st.pa = v; upd(); }
    });
    var sAE = FV.slider({
      label: 'Austrittsfläche A<sub>e</sub> / A<sub>Hals</sub>', min: 1.05, max: 4, step: 0.05, value: 2.0,
      fmt: function (v) { return v.toFixed(2); },
      onInput: function (v) { st.AE = v; upd(); }
    });
    var sFLD = FV.slider({
      label: 'Rohrlänge λ·L / D', min: 0.02, max: 12, step: 0.02, value: 1.07,
      fmt: function (v) { return v.toFixed(2); },
      onInput: function (v) { st.fld = v; upd(); }
    });

    ctrlLaval = FV.ctrlRow(sAE);
    ctrlFanno = FV.ctrlRow(sFLD);
    root.appendChild(FV.ctrlRow(sPa));
    root.appendChild(ctrlLaval);
    root.appendChild(ctrlFanno);
    root.appendChild(roK);

    root.appendChild(h('div', { class: 'canvas-cap' },
      'λ ist die Rohrreibungszahl aus dem Moody-Diagramm (Kap. 8.5). λ·L/D fasst Länge, Durchmesser ' +
      'und Rauheit zu der einen Zahl zusammen, auf die es ankommt.'));

    /* ================================================================
       2 · Die Verläufe
       ================================================================ */

    root.appendChild(FV.section('2 · Was mit den einzelnen Grössen passiert'));

    root.appendChild(h('p', { html:
      'Vier Kurven über der Lauflänge. Die vierte ist die wichtigste, um Laval und Fanno auseinander ' +
      'zu halten: der <strong>Totaldruck p₀</strong>. Bei Laval bleibt er konstant, solange kein Stoss ' +
      'im Kanal steht — die Strömung ist isentrop. Bei Fanno fällt er <em>immer</em>, weil Reibung ' +
      'Entropie erzeugt. Das ist der eigentliche Preis der Reibung.' }));

    function mkVerlauf(titel, feld, farbe, ymax, ylabel) {
      return FV.canvas({
        aspect: 0.62,
        render: function (ctx, w, hgt) {
          var top = ymax();
          var P = FV.plot(ctx, {
            w: w, h: hgt, x: [0, 1], y: [0, top],
            pad: { l: 44, r: 14, t: 26, b: 32 },
            xticks: [0, 0.25, 0.5, 0.75, 1],
            yticks: tickListe(top), xlabel: 'x / L'
          });
          P.grid(); P.axes();
          // Sperr- bzw. Stossstelle
          if (st.modus === 'laval' && loesung.choked) P.vline(XT, { color: 'rgba(167,139,250,.65)' });
          if (st.modus === 'laval' && loesung.xs) P.vline(loesung.xs, { color: 'rgba(255,107,107,.7)' });
          if (st.modus === 'fanno' && loesung.choked) P.vline(1, { color: 'rgba(167,139,250,.65)' });
          // Ma = 1 als Bezugslinie im Ma-Diagramm
          if (feld === 'Ma' && top > 1) {
            ctx.save();
            ctx.strokeStyle = 'rgba(167,139,250,.5)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.moveTo(P.X(0), P.Y(1)); ctx.lineTo(P.X(1), P.Y(1)); ctx.stroke();
            ctx.restore();
            P.label(0.02, 1 + top * 0.045, 'Ma = 1', '#a78bfa');
          }
          var pts = [], i, n = 200;
          for (i = 0; i <= n; i++) {
            var x = i / n, v = zustand(x)[feld];
            if (isFinite(v)) pts.push([x, Math.min(v, top)]);
          }
          P.poly(pts, { color: farbe, width: 2.4 });
          FV.text(ctx, w - 12, 16, titel,
            { color: '#c8d3de', align: 'right', font: '12.5px -apple-system, sans-serif' });
          FV.text(ctx, 12, 16, ylabel,
            { color: '#7b8896', font: '11.5px ui-monospace, monospace' });
        }
      });
    }
    function tickListe(top) {
      var step = top <= 1.2 ? 0.25 : (top <= 3 ? 0.5 : 1);
      var out = [];
      for (var v = 0; v <= top + 1e-9; v += step) out.push(Math.round(v * 100) / 100);
      return out;
    }

    var cvMa = mkVerlauf('Mach-Zahl Ma(x)', 'Ma', '#ffd166',
      function () { return st.modus === 'laval' ? Math.max(1.4, Math.ceil(loesung.MeSup || 1)) : 1.2; }, 'Ma');
    var cvP = mkVerlauf('Druck p(x) / p₀', 'p', '#56c8f5', function () { return 1; }, 'p/p₀');
    var cvT = mkVerlauf('Temperatur T(x) / T₀', 'T', '#ff8a4c', function () { return 1; }, 'T/T₀');
    var cvP0 = mkVerlauf('Totaldruck p₀(x) / p₀,ein', 'p0', '#a78bfa', function () { return 1.05; }, 'p₀/p₀ₑ');

    root.appendChild(h('div', { class: 'duo' }, cvMa, cvP));
    root.appendChild(h('div', { class: 'duo' }, cvT, cvP0));

    root.appendChild(FV.note('key', 'Woran man den Modus im Diagramm sofort erkennt',
      '<ul style="margin:0">' +
      '<li><strong>Laval, ohne Stoss:</strong> p₀ ist eine waagrechte Linie bei 1. Ma hat im Hals ' +
      'einen Knick und läuft danach nach oben (Überschall) oder wieder nach unten (Venturi).</li>' +
      '<li><strong>Laval, mit Stoss:</strong> p₀ springt an der Stossstelle nach unten und bleibt dann ' +
      'konstant. Ma springt gleichzeitig von Über- auf Unterschall.</li>' +
      '<li><strong>Fanno:</strong> p₀ fällt über die ganze Länge stetig — nirgends waagrecht. Ma läuft ' +
      'monoton auf 1 zu und bleibt darunter, weil der Eintritt hier im Unterschall liegt.</li>' +
      '</ul>'));

    /* ================================================================
       3 · Sperrung und Massenstrom
       ================================================================ */

    root.appendChild(FV.section('3 · Sperrung: was der Gegendruck noch bewirkt — und was nicht'));

    root.appendChild(h('p', { html:
      'Das ist die Figur, für die es sich lohnt, den Gegendruck-Regler langsam zu bewegen. Aufgetragen ' +
      'ist der Massenstrom über dem Gegendruck. Von rechts kommend steigt ṁ, je stärker man saugt — ' +
      'bis der Kanal sperrt. Ab da ist die Kurve <strong>flach</strong>: die Information „hier ist es ' +
      'billiger“ kommt nicht mehr gegen die Strömung an, weil sie an der Stelle Ma = 1 stromauf nicht ' +
      'mehr laufen kann.' }));

    var cvMdot = FV.canvas({
      aspect: 0.50,
      render: function (ctx, w, hgt) {
        var P = FV.plot(ctx, {
          w: w, h: hgt, x: [0, 1], y: [0, 1.15],
          pad: { l: 52, r: 18, t: 48, b: 40 },
          xticks: [0, 0.2, 0.4, 0.6, 0.8, 1], yticks: [0, 0.25, 0.5, 0.75, 1],
          xlabel: 'Gegendruck p_a / p₀'
        });
        P.grid(); P.axes();

        var pB = st.modus === 'laval' ? loesung.P_B : loesung.pChoke;
        // gesperrter Bereich einfärben
        ctx.save();
        ctx.fillStyle = 'rgba(167,139,250,.10)';
        ctx.fillRect(P.X(0), P.Y(1.15), P.X(pB) - P.X(0), P.Y(0) - P.Y(1.15));
        ctx.restore();
        P.vline(pB, { color: 'rgba(167,139,250,.8)', dash: [5, 4] });

        var pts = [], i;
        for (i = 0; i <= 220; i++) {
          var pa = 0.002 + (0.998 - 0.002) * i / 220;
          var s = st.modus === 'laval' ? solveLaval(pa, st.AE) : solveFanno(st.fld, pa);
          var m = st.modus === 'laval' ? s.mdot : s.mdot / flux(loesung.Ma1max);
          pts.push([pa, Math.min(m, 1.1)]);
        }
        P.poly(pts, { color: '#ffd166', width: 2.6 });

        // Betriebspunkt
        var mNow = st.modus === 'laval' ? loesung.mdot : loesung.mdot / flux(loesung.Ma1max);
        P.dot(st.pa, Math.min(mNow, 1.1), '#e6edf3', 6);
        ctx.save();
        ctx.strokeStyle = 'rgba(230,237,243,.45)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(P.X(st.pa), P.Y(0)); ctx.lineTo(P.X(st.pa), P.Y(mNow));
        ctx.lineTo(P.X(0), P.Y(mNow)); ctx.stroke();
        ctx.restore();

        // Beschriftungen INS Diagramm, nicht an die Achsen — dort kollidieren sie
        P.label(pB / 2, 0.52, 'gesperrt', '#a78bfa', 'center');
        P.label(pB / 2, 0.42, 'ṁ ändert sich', '#a78bfa', 'center');
        P.label(pB / 2, 0.33, 'nicht mehr', '#a78bfa', 'center');
        // je nach Lage der Grenze nach links oder rechts beschriften
        P.label(pB + (pB > 0.6 ? -0.02 : 0.02), 0.12, 'Sperrgrenze ' + pB.toFixed(3),
                '#a78bfa', pB > 0.6 ? 'right' : 'left');
        FV.text(ctx, 12, 18, 'ṁ / ṁmax',
          { color: '#7b8896', font: '11.5px ui-monospace, monospace' });
        FV.text(ctx, w - 14, 18, st.modus === 'laval'
          ? 'Laval: ṁ ~ p₀·A*/√T₀' : 'Fanno: Sperrung am Rohrende',
          { color: '#c8d3de', align: 'right', font: '12.5px -apple-system, sans-serif' });
      }
    });
    root.appendChild(cvMdot);

    root.appendChild(FV.note('key', 'Die drei Sätze, die man im Kopf haben muss',
      '<ol style="margin:0">' +
      '<li><strong>Gesperrt heisst: ṁ hängt nicht mehr vom Gegendruck ab.</strong> Er hängt nur noch ' +
      'am Kesselzustand und am engsten Querschnitt: ṁ ∝ p₀·A*/√T₀. Gegendruck senken bringt gar nichts ' +
      'mehr.</li>' +
      '<li><strong>Den Kesseldruck erhöhen bringt dagegen immer etwas.</strong> ṁ ist proportional zu ' +
      'p₀ — auch im gesperrten Zustand. Das ist der einzige Hebel, der dann noch wirkt (neben A* und T₀).</li>' +
      '<li><strong>Warum die Sperrung überhaupt existiert:</strong> Druckinformation läuft mit ' +
      'Schallgeschwindigkeit. An der Stelle mit Ma = 1 strömt das Fluid genau so schnell stromab, wie ' +
      'die Information stromauf laufen will — sie bleibt stehen. Was hinter dieser Stelle passiert, ' +
      'erfährt der Kessel nie.</li>' +
      '</ol>'));

    var roS = FV.readout([
      { key: 'grenze', lab: 'Sperrgrenze p<sub>a</sub>/p₀', cls: 'c3' },
      { key: 'reserve', lab: 'Abstand zur Sperrung' },
      { key: 'wirkung', lab: 'p_a weiter senken bewirkt' },
      { key: 'p0v', lab: 'Totaldruckverlust p₀,aus/p₀,ein', cls: 'c2' }
    ]);
    root.appendChild(roS);

    /* ================================================================
       4 · Fanno im Detail
       ================================================================ */

    root.appendChild(FV.section('4 · Warum das Rohr eine maximale Länge hat'));

    root.appendChild(h('p', { html:
      'Zu jedem Eintritts-Ma gehört genau eine Rohrlänge, nach der Ma = 1 erreicht ist — die ' +
      '<strong>kritische Länge L*</strong>. Sie ist keine Eigenschaft des Rohrs, sondern der Strömung. ' +
      'Die Kurve unten zeigt sie, und man liest zwei Dinge daraus ab: sie geht von beiden Seiten auf ' +
      'null bei Ma = 1, und im Überschall ist sie <em>sehr</em> kurz.' }));

    root.appendChild(FV.eq(
      'λ L* / D = <span class="frac"><span>1 − Ma²</span><span class="den">γ Ma²</span></span> + ' +
      '<span class="frac"><span>γ+1</span><span class="den">2γ</span></span> ' +
      'ln <span class="frac"><span>(γ+1) Ma²</span><span class="den">2 + (γ−1) Ma²</span></span>',
      'Das Skript gibt die Zustandsverhältnisse an (S. 118) und verweist für diese Beziehung auf ' +
      'Kundu Kap. 15.8 · λ = 4·c_f ist die Rohrreibungszahl aus Kap. 8'));

    var cvLstar = FV.canvas({
      aspect: 0.52,
      render: function (ctx, w, hgt) {
        var P = FV.plot(ctx, {
          w: w, h: hgt, x: [0, 3], y: [0, 3],
          pad: { l: 52, r: 18, t: 28, b: 40 },
          xticks: [0, 0.5, 1, 1.5, 2, 2.5, 3], yticks: [0, 0.5, 1, 1.5, 2, 2.5, 3],
          xlabel: 'Mach-Zahl am Eintritt'
        });
        P.grid(); P.axes();
        P.vline(1, { color: 'rgba(167,139,250,.7)' });

        var sub = [], sup = [], i, m;
        for (i = 1; i <= 200; i++) { m = i / 200 * 0.999; sub.push([m, Math.min(fLD(m), 3)]); }
        for (i = 0; i <= 200; i++) { m = 1.001 + (3 - 1.001) * i / 200; sup.push([m, fLD(m)]); }
        P.poly(sub, { color: '#56c8f5', width: 2.6 });
        P.poly(sup, { color: '#ff8a4c', width: 2.6 });

        // Grenzwert im Überschall
        var lim = fLD(1e6);
        ctx.save();
        ctx.strokeStyle = 'rgba(255,138,76,.45)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(P.X(1), P.Y(lim)); ctx.lineTo(P.X(3), P.Y(lim)); ctx.stroke();
        ctx.restore();
        P.label(2.05, lim + 0.13, 'Grenzwert ' + lim.toFixed(4), '#ff8a4c');

        P.label(0.10, 2.55, 'Unterschall — wird beschleunigt', '#56c8f5');
        P.label(1.45, 0.30, 'Überschall — wird verzögert', '#ff8a4c');
        P.label(1.03, 2.85, 'Ma = 1', '#a78bfa');

        // aktueller Betriebspunkt, nur im Fanno-Modus
        if (st.modus === 'fanno') {
          P.dot(loesung.Ma1, Math.min(fLD(loesung.Ma1), 3), '#e6edf3', 6);
          P.label(loesung.Ma1 + 0.06, Math.min(fLD(loesung.Ma1), 3) + 0.12,
            'Ma₁ = ' + loesung.Ma1.toFixed(3), '#e6edf3');
        }
        FV.text(ctx, w - 14, 16, 'Kritische Rohrlänge',
          { color: '#c8d3de', align: 'right', font: '12.5px -apple-system, sans-serif' });
        FV.text(ctx, 12, 16, 'λ L*/D',
          { color: '#7b8896', font: '11.5px ui-monospace, monospace' });
      }
    });
    root.appendChild(cvLstar);

    root.appendChild(FV.note('', 'Was daraus folgt',
      '<ul style="margin:0">' +
      '<li><strong>Beide Äste laufen auf null zu.</strong> Egal ob man von Ma = 0.2 oder von Ma = 3 ' +
      'startet — jede Fanno-Strömung endet bei Ma = 1, nie darüber hinaus. Ein Durchlaufen ist ' +
      'unmöglich, es würde den 2. Hauptsatz verletzen (Skript S. 119).</li>' +
      '<li><strong>Im Überschall ist L* winzig.</strong> Der Grenzwert für Ma → ∞ ist λL*/D = 0.8215. ' +
      'Ein Überschallrohr kann also nie lang sein, ohne dass ein Stoss entsteht.</li>' +
      '<li><strong>Rohr länger als L*?</strong> Dann passt sich die Strömung an: bei Unterschall-Eintritt ' +
      'sinkt Ma₁, der Massenstrom wird kleiner. Bei Überschall-Eintritt springt sie über einen ' +
      'senkrechten Stoss in den Unterschall.</li>' +
      '</ul>'));

    /* ================================================================
       5 · Fallen
       ================================================================ */

    root.appendChild(FV.section('5 · Die Fallen'));

    root.appendChild(FV.note('warn', 'Worauf du achten musst',
      '<ul style="margin:0">' +
      '<li><strong>„Gesperrt“ heisst nicht „Überschall“.</strong> Gesperrt heisst nur Ma = 1 an der ' +
      'engsten Stelle. Ob es danach Überschall wird, entscheidet allein der Gegendruck.</li>' +
      '<li><strong>Ma = 1 kann nur im Hals stehen — bei Laval.</strong> Bei Fanno steht es am ' +
      '<em>Rohrende</em>. Wer das verwechselt, sucht die Sperrstelle am falschen Ort.</li>' +
      '<li><strong>A/A* = 2 hat zwei Lösungen.</strong> Eine im Unterschall (0.306) und eine im ' +
      'Überschall (2.197). Welche gilt, sagt der Gegendruck, nicht die Geometrie.</li>' +
      '<li><strong>p₀ ist nicht immer konstant.</strong> Nur in der isentropen Laval-Strömung ohne ' +
      'Stoss. Über einen Stoss und in jeder Fanno-Strömung fällt er.</li>' +
      '<li><strong>Reibung beschleunigt im Unterschall.</strong> Gegen die Intuition, aber im Skript ' +
      'ausdrücklich betont (S. 119).</li>' +
      '<li><strong>ṁ steigt mit p₀, nicht mit dem Druckverhältnis.</strong> Im gesperrten Zustand ist ' +
      'der Gegendruck völlig wirkungslos.</li>' +
      '</ul>'));

    root.appendChild(FV.note('', 'Weiterlesen auf dieser Seite',
      'Was <em>nach</em> dem Austritt passiert — über- oder unterexpandiert, das Rautenmuster und die ' +
      'Reflexionen an der Strahlgrenze — steht im Kapitel ' +
      '<a href="#freistrahl">Freistrahl: die Wellen lesen</a>. Die beiden Prüfungsaufgaben zur ' +
      'Erkennung stehen in <a href="#lavalduese">Laval-Düse: über- oder unterexpandiert?</a>'));

    /* ================================================================
       Aktualisierung
       ================================================================ */

    function upd() {
      rechne();
      var ein = zustand(0.001), aus = zustand(0.999);
      var pB = st.modus === 'laval' ? loesung.P_B : loesung.pChoke;

      roK.set('gesperrt', loesung.choked ? 'ja' : 'nein');
      roK.set('wo', loesung.choked ? (st.modus === 'laval' ? 'Hals, x = ' + XT.toFixed(2) : 'Rohrende, x = 1.00') : '–');
      roK.set('ma1', ein.Ma.toFixed(3));
      roK.set('ma2', aus.Ma.toFixed(3));
      roK.set('pout', aus.p.toFixed(3));
      var mRel = st.modus === 'laval' ? loesung.mdot : loesung.mdot / flux(loesung.Ma1max);
      roK.set('mdot', mRel.toFixed(3));

      roS.set('grenze', pB.toFixed(3));
      roS.set('reserve', loesung.choked ? 'gesperrt' : (st.pa - pB).toFixed(3) + ' über der Grenze');
      roS.set('wirkung', loesung.choked ? 'nichts mehr am ṁ' : 'ṁ steigt');
      roS.set('p0v', aus.p0.toFixed(4));

      cvKanal.draw(); cvMa.draw(); cvP.draw(); cvT.draw(); cvP0.draw();
      cvMdot.draw(); cvLstar.draw();
    }
    setModus('laval');

    /* ---- Animation ---- */
    var prev = null;
    FV.loop(function (t) {
      if (prev === null) prev = t;
      var dt = Math.min(t - prev, 0.05); prev = t;
      if (!st.run) return;
      teilchen.forEach(function (p) {
        var z = zustand(Math.max(0, Math.min(p.x, 1)));
        p.x += (0.06 + z.Ma * 0.16) * dt;
        if (p.x > 1.02) { p.x = 0; p.yr = (Math.random() * 2 - 1) * 0.78; }
      });
      cvKanal.draw();
    });
  }
});
