/* ============================================================
   Laval-Düse und Freistrahl — Skript Kap. 11.4, S. 105–108 (Abb. 11.6–11.8)
   plus Prandtl-Meyer, S. 112.
   Deckt die Prüfungsaufgaben FS24 A17 und FS25 A8.3 ab
   (gleicher Wortlaut, entgegengesetzte Antwort — nur am Bild unterscheidbar).
   ============================================================ */

FV.register({
  id: 'lavalduese',
  chapter: 'Kompressible Strömungen',
  chapterNo: '11.4',
  title: 'Laval-Düse: über- oder unterexpandiert?',
  subtitle: 'Woran man am Strahlbild in fünf Sekunden erkennt, welcher Fall vorliegt.',
  source: 'Skript S. 105–108, Abb. 11.6–11.8 · S. 112',

  build: function (root) {
    var h = FV.h;
    var GAM = 1.4;

    /* ================= Isentrope Stromfadenbeziehungen ================= */

    function pIso(M) { return Math.pow(1 + (GAM - 1) / 2 * M * M, -GAM / (GAM - 1)); }
    function TIso(M) { return 1 / (1 + (GAM - 1) / 2 * M * M); }
    function areaRatio(M) {   // A / A*
      var e = (GAM + 1) / (2 * (GAM - 1));
      return 1 / M * Math.pow(2 / (GAM + 1) * (1 + (GAM - 1) / 2 * M * M), e);
    }
    function MaFromArea(AR, supersonic) {
      if (AR <= 1) return 1;
      var lo = supersonic ? 1 : 1e-4, hi = supersonic ? 12 : 1;
      for (var i = 0; i < 80; i++) {
        var mid = (lo + hi) / 2, f = areaRatio(mid);
        if (supersonic ? (f < AR) : (f > AR)) lo = mid; else hi = mid;
      }
      return (lo + hi) / 2;
    }
    function MaFromP(pr) {    // p/p0 → Ma (Unterschall-Ast)
      return Math.sqrt(2 / (GAM - 1) * (Math.pow(pr, -(GAM - 1) / GAM) - 1));
    }
    // senkrechter Stoss
    function shockMa2(M) {
      return Math.sqrt((1 + (GAM - 1) / 2 * M * M) / (GAM * M * M - (GAM - 1) / 2));
    }
    function shockP0Ratio(M) {
      var a = Math.pow(1 + 2 * GAM / (GAM + 1) * (M * M - 1), -1 / (GAM - 1));
      var b = Math.pow((GAM + 1) * M * M / (2 + (GAM - 1) * M * M), GAM / (GAM - 1));
      return a * b;
    }

    /* ================= Düsengeometrie ================= */

    var XT = 0.34;                       // Lage des Halses
    function AofX(x) {                   // A(x) / A_hals
      if (x <= XT) { var s = (XT - x) / XT; return 1 + 2.0 * s * s; }
      var t = (x - XT) / (1 - XT); return 1 + 1.0 * t * t;
    }
    var AE = AofX(1);                    // Austrittsfläche / A_hals  = 2.0

    var MA_E_SUP = MaFromArea(AE, true);       // Austritts-Mach, voll expandiert
    var MA_E_SUB = MaFromArea(AE, false);      // Unterschalllösung bei gesperrter Düse
    var P_E = pIso(MA_E_SUP);                  // = p_E / p0   (angepasst)
    var P_B = pIso(MA_E_SUB);                  // = p_B / p0   (gerade gesperrt)
    var P_D = P_E * (2 * GAM / (GAM + 1) * MA_E_SUP * MA_E_SUP - (GAM - 1) / (GAM + 1));

    /* ---- Zustand der Düse für gegebenen Gegendruck ---- */
    function solveNozzle(pa) {
      // liefert {mode, Ma(x), p(x), xs, MaE, pe, choked}
      var res = { pa: pa, choked: true, xs: null };

      if (pa >= P_B) {                       // reine Unterschallströmung, nicht gesperrt
        res.mode = 'venturi'; res.choked = false;
        var MaE = MaFromP(pa);
        var Astar = AE / areaRatio(MaE);     // fiktive kritische Fläche > 1
        res.Ma = function (x) { return MaFromArea(AofX(x) / Astar, false); };
        res.p = function (x) { return pIso(res.Ma(x)); };
        res.MaE = MaE; res.pe = pa;
        // ṁ ~ p0·A*/√T0, gesperrt ist A* = A_hals → Verhältnis ist direkt A*/A_hals
        res.mdot = Astar;
        return res;
      }
      res.mdot = 1;

      if (pa > P_D) {                        // senkrechter Stoss im divergenten Teil
        res.mode = 'shock';
        var lo = XT + 1e-6, hi = 1;
        for (var i = 0; i < 70; i++) {
          var mid = (lo + hi) / 2;
          if (peWithShockAt(mid) > pa) lo = mid; else hi = mid;
        }
        var xs = (lo + hi) / 2;
        res.xs = xs;
        var M1 = MaFromArea(AofX(xs), true);
        var p0r = shockP0Ratio(M1);
        var Astar2 = 1 / p0r;                // A*_2 / A*_1
        res.Ma = function (x) {
          if (x <= XT) return MaFromArea(AofX(x), false);
          if (x < xs) return MaFromArea(AofX(x), true);
          return MaFromArea(AofX(x) / Astar2, false);
        };
        res.p = function (x) {
          var M = res.Ma(x);
          return x < xs ? pIso(M) : p0r * pIso(M);
        };
        res.MaE = MaFromArea(AE / Astar2, false);
        res.pe = pa;
        return res;
      }

      // ab hier: in der Düse voll isentrop bis Überschall
      res.Ma = function (x) { return MaFromArea(AofX(x), x > XT); };
      res.p = function (x) { return pIso(res.Ma(x)); };
      res.MaE = MA_E_SUP; res.pe = P_E;
      if (pa > P_E * 1.008) res.mode = 'over';        // überexpandiert
      else if (pa < P_E * 0.992) res.mode = 'under';  // unterexpandiert
      else res.mode = 'design';
      return res;
    }

    /* ---- Form der freien Strahlgrenze ----
       Auslenkung relativ zum Lippenradius; s = Lauflänge in Rautenlängen.
       ratio = p_a/p_e.  Vorzeichen ist der didaktische Kern:
       p_a > p_e (überexpandiert) → Einschnürung, p_a < p_e → Aufweitung.     */
    function jetOffset(ratio, s) {
      if (s <= 0) return 0;
      var over = ratio > 1.0;
      var strength = Math.min(Math.abs(Math.log(ratio)) * 1.5, 0.85);
      return (over ? -1 : 1) * strength * 0.85 * Math.sin(Math.PI * s) * Math.exp(-s * 0.16);
    }

    function peWithShockAt(xs) {
      var M1 = MaFromArea(AofX(xs), true);
      var p0r = shockP0Ratio(M1);
      var MaE = MaFromArea(AE * p0r, false);
      return p0r * pIso(MaE);
    }

    /* ================= Die Regel ================= */

    root.appendChild(FV.note('key', 'Die ganze Erkennungsregel in einem Satz',
      'Schau <strong>nur</strong> auf die Düsenlippe und frage: <strong>weitet sich der Strahl dort auf ' +
      'oder wird er eingeschnürt?</strong>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px">' +
      '<div style="border-left:3px solid #56c8f5;padding-left:12px">' +
      '<div style="color:#56c8f5;font-weight:650">weitet sich auf</div>' +
      'Expansionsfächer an der Lippe → der Strahl muss noch entspannen →<br>' +
      '<strong>p<sub>e</sub> &gt; p<sub>a</sub></strong> → <strong>unter</strong>expandiert</div>' +
      '<div style="border-left:3px solid #ff8a4c;padding-left:12px">' +
      '<div style="color:#ff8a4c;font-weight:650">wird eingeschnürt</div>' +
      'schiefe Stösse an der Lippe → der Strahl muss komprimiert werden →<br>' +
      '<strong>p<sub>e</sub> &lt; p<sub>a</sub></strong> → <strong>über</strong>expandiert</div>' +
      '</div>' +
      '<div style="margin-top:14px">Eselsbrücke: <em>über</em>expandiert heisst „die Düse hat ' +
      '<em>zu viel</em> expandiert“ — der Druck ist unter den Umgebungsdruck gefallen, und die Umgebung ' +
      'drückt den Strahl wieder zusammen.</div>'));

    /* ================= 1 · Der Freistrahl ================= */

    root.appendChild(FV.section('1 · Das Bild, auf das es ankommt'));

    root.appendChild(h('p', { html:
      'Beide Prüfungsaufgaben zeigen dasselbe Rautenmuster und stellen dieselbe Frage. Der einzige ' +
      'Unterschied steckt in den ersten Millimetern hinter der Lippe. Schiebe den Regler und beobachte ' +
      'nur diese Stelle.' }));

    var jetR = 1.4;      // p_a / p_e
    var roJet = FV.readout([
      { key: 'fall', lab: 'Fall' },
      { key: 'pr', lab: 'p<sub>e</sub> / p<sub>a</sub>', cls: 'c2' },
      { key: 'lippe', lab: 'an der Lippe steht', cls: 'c1' },
      { key: 'grenze', lab: 'Strahlgrenze zuerst', cls: 'c3' }
    ]);

    function drawJet(ctx, w, hgt, ratio, opts) {
      opts = opts || {};
      var over = ratio > 1.0;                 // p_a > p_e  → überexpandiert
      var lipX = w * 0.16, R0 = Math.min(hgt * 0.20, 46);
      var cy = hgt * 0.52;
      var Lw = w * 0.30;                       // Wellenlänge einer Raute

      // Düse
      ctx.save();
      ctx.fillStyle = '#1b232c'; ctx.strokeStyle = '#8b98a6'; ctx.lineWidth = 2;
      [1, -1].forEach(function (sg) {
        ctx.beginPath();
        ctx.moveTo(0, cy - sg * (R0 + 30));
        ctx.lineTo(lipX, cy - sg * (R0 + 30));
        ctx.lineTo(lipX, cy - sg * R0);
        ctx.lineTo(0, cy - sg * (R0 * 0.55));
        ctx.closePath(); ctx.fill(); ctx.stroke();
      });
      ctx.restore();

      // Strahlgrenze: schwingt, Vorzeichen der ersten Auslenkung entscheidet
      function bnd(x) { return R0 * (1 + jetOffset(ratio, (x - lipX) / Lw)); }

      ctx.save();
      ctx.strokeStyle = '#e6edf3'; ctx.lineWidth = 2;
      [1, -1].forEach(function (sg) {
        ctx.beginPath();
        for (var x = lipX; x <= w - 4; x += 2) {
          var y = cy - sg * bnd(x);
          x === lipX ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
      ctx.restore();

      // Charakteristiken: an der freien Grenze mit Vorzeichenwechsel reflektiert
      var Ma = 2.2, alpha = Math.asin(1 / Ma);
      var slope = Math.tan(alpha);
      function drawWave(x0, sg0, gen) {
        // startet am Rand sg0 (+1 oben) und läuft schräg nach unten/oben
        var x = x0, y = cy - sg0 * bnd(x0), dir = -sg0;
        for (var g = gen; g < gen + 5; g++) {
          // Schnitt mit der gegenüberliegenden Grenze suchen
          var xx = x, yy = y, hit = null;
          for (var k = 0; k < 900; k++) {
            xx += 1.4; yy += dir * 1.4 * slope;
            if (xx > w - 4) break;
            var lim = cy - (dir > 0 ? -1 : 1) * bnd(xx);
            if (dir > 0 ? (yy >= lim) : (yy <= lim)) { hit = [xx, yy]; break; }
          }
          var ex = hit ? hit[0] : w - 4, ey = hit ? hit[1] : yy;
          // gerade Generationen = wie an der Lippe, ungerade = umgekehrter Typ
          var expansion = (over ? 1 : 0) !== (g % 2);
          ctx.save();
          ctx.strokeStyle = expansion ? 'rgba(86,200,245,.85)' : 'rgba(255,138,76,.9)';
          ctx.lineWidth = expansion ? 1.2 : 2;
          if (expansion) ctx.setLineDash([4, 3]);
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
          ctx.restore();
          if (!hit) break;
          x = ex; y = ey; dir = -dir;
        }
      }

      // erste Generation: Fächer (mehrere Linien) oder Stoss (eine Linie)
      [1, -1].forEach(function (sg) {
        if (over) {
          drawWave(lipX, sg, 0);
        } else {
          for (var f = 0; f < 3; f++) drawWave(lipX + f * 3, sg, 0);
        }
      });

      // Lupe auf die Lippe — die Stelle, die entscheidet
      ctx.save();
      ctx.strokeStyle = 'rgba(255,209,102,.6)'; ctx.lineWidth = 1.4; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.arc(lipX, cy - R0, 24, 0, 6.2832); ctx.stroke();
      ctx.restore();

      // Richtungspfeil: wohin läuft die Strahlgrenze?
      var dy = bnd(lipX + Lw * 0.22) - R0;
      FV.arrow(ctx, lipX + 30, cy - R0, lipX + 30, cy - R0 - dy * 1.6,
        over ? '#ff8a4c' : '#56c8f5', 2.4, 8);

      // Beschriftung ausserhalb der Lupe
      var lab = over ? 'schiefe Stösse' : 'Expansionsfächer';
      FV.text(ctx, lipX + 44, cy - R0 - 26, lab,
        { color: over ? '#ff8a4c' : '#56c8f5', font: 'bold 12px -apple-system, sans-serif' });
      FV.text(ctx, lipX + 8, cy + R0 + 26,
        over ? 'Strahl wird eingeschnürt' : 'Strahl weitet sich auf',
        { color: '#c8d3de', font: '12px -apple-system, sans-serif' });

      FV.text(ctx, 10, 18, opts.title || (over ? 'überexpandiert   p_e < p_a' : 'unterexpandiert   p_e > p_a'),
        { color: over ? '#ff8a4c' : '#56c8f5', font: '13px ui-monospace, monospace' });
      if (opts.sub) FV.text(ctx, 10, 36, opts.sub, { color: '#7b8896', font: '11.5px -apple-system, sans-serif' });
    }

    var cvJet = FV.canvas({
      aspect: 0.34,
      render: function (ctx, w, hgt) { drawJet(ctx, w, hgt, jetR); },
      cap: 'Gestrichelt blau: Expansionswellen · durchgezogen orange: Verdichtungsstösse. ' +
           'Der gelbe Kreis markiert die Stelle, die in der Prüfung entscheidet.'
    });
    root.appendChild(cvJet);

    root.appendChild(FV.ctrlRow(FV.slider({
      label: 'Umgebungsdruck p<sub>a</sub> / p<sub>e</sub>', min: 0.35, max: 2.6, step: 0.01, value: 1.4,
      fmt: function (v) { return v.toFixed(2); },
      onInput: function (v) { jetR = v; updJet(); }
    })));
    root.appendChild(roJet);

    function updJet() {
      var over = jetR > 1.0;
      var near = Math.abs(jetR - 1) < 0.03;
      roJet.set('fall', near ? 'angepasst' : (over ? 'überexpandiert' : 'unterexpandiert'));
      roJet.set('pr', (1 / jetR).toFixed(2));
      roJet.set('lippe', near ? '— nichts —' : (over ? 'schiefe Stösse' : 'Expansionsfächer'));
      roJet.set('grenze', near ? 'bleibt gerade' : (over ? 'nach innen' : 'nach aussen'));
      cvJet.draw();
    }
    updJet();

    root.appendChild(h('h3', null, 'Die beiden Fälle direkt nebeneinander'));

    var cvOver = FV.canvas({
      aspect: 0.58,
      render: function (ctx, w, hgt) {
        drawJet(ctx, w, hgt, 1.8, { title: 'ÜBERexpandiert', sub: 'p_e < p_a — die Prüfung FS25, Aufgabe 8.3' });
      }
    });
    var cvUnder = FV.canvas({
      aspect: 0.58,
      render: function (ctx, w, hgt) {
        drawJet(ctx, w, hgt, 0.55, { title: 'UNTERexpandiert', sub: 'p_e > p_a — die Prüfung FS24, Aufgabe 17' });
      }
    });
    root.appendChild(h('div', { class: 'duo' }, cvOver, cvUnder));

    root.appendChild(FV.note('warn', 'Warum das so schwer zu sehen ist',
      'Weiter stromab sehen beide Strahlen praktisch gleich aus — dasselbe Rautenmuster aus abwechselnd ' +
      'Stössen und Fächern. Die Unterscheidung ist <strong>ausschliesslich</strong> in der ersten Raute ' +
      'zu treffen. Deshalb geben die Prüfungsbilder immer die Düsenlippe mit her: dort und nur dort ' +
      'steckt die Antwort.'));

    /* ================= 2 · Warum das Rautenmuster ================= */

    root.appendChild(FV.section('2 · Warum sich das Muster ewig wiederholt'));

    root.appendChild(h('p', { html:
      'Die Strahlgrenze ist keine Wand, sondern eine <strong>freie Grenze</strong>: dort muss der Druck ' +
      'immer gleich p<sub>a</sub> sein. Eine ankommende Welle wird deshalb mit ' +
      '<strong>umgekehrtem Vorzeichen</strong> reflektiert — nur so bleibt der Druck konstant. An einer ' +
      'festen Wand ist es genau andersherum.' }));

    root.appendChild(h('table', null,
      h('thead', null, h('tr', null, h('th', null, 'ankommend'), h('th', null, 'reflektiert an fester Wand'),
        h('th', null, 'reflektiert an freier Strahlgrenze'))),
      h('tbody', null,
        h('tr', null, h('td', { html: 'Verdichtungsstoss' }),
          h('td', { html: '<span style="color:var(--c1)">Verdichtungsstoss</span> (gleich)' }),
          h('td', { html: '<span style="color:var(--c2)">Expansionsfächer</span> (umgekehrt)' })),
        h('tr', null, h('td', { html: 'Expansionsfächer' }),
          h('td', { html: '<span style="color:var(--c2)">Expansionsfächer</span> (gleich)' }),
          h('td', { html: '<span style="color:var(--c1)">Verdichtungsstoss</span> (umgekehrt)' })))));

    root.appendChild(FV.note('key', 'Daraus folgt Antwort (d) der Aufgabe',
      'Weil sich Expansion und Kompression abwechseln, <strong>oszilliert</strong> die Mach-Zahl im ' +
      'Strahl — sie steigt im Fächer, fällt im Stoss, steigt wieder. Sie nimmt also <em>nicht</em> ' +
      'kontinuierlich ab. Ohne Reibung würde das ewig so weitergehen; in Wirklichkeit dämpft die ' +
      'Vermischung mit der Umgebung das Muster nach einigen Rauten weg.'));

    /* ================= 3 · Die Düse selbst ================= */

    root.appendChild(FV.section('3 · Wo die Fälle herkommen: der Gegendruck'));

    root.appendChild(h('p', { html:
      'Bei festem Kesseldruck p₀ senkt man den Gegendruck p<sub>a</sub> ab und läuft dabei die Fälle des ' +
      'Skripts (Abb. 11.6) der Reihe nach durch. Der Regler unten macht genau das.' }));

    var pa = 0.35;
    var roNoz = FV.readout([
      { key: 'fall', lab: 'Fall (Skript S. 107 f.)' },
      { key: 'ma', lab: 'Ma am Austritt', cls: 'c1' },
      { key: 'pe', lab: 'p<sub>e</sub> / p₀', cls: 'c2' },
      { key: 'xs', lab: 'Stoss in der Düse bei', cls: 'c3' },
      { key: 'chok', lab: 'gesperrt?', cls: 'c3' },
      { key: 'md', lab: 'Massenstrom ṁ / ṁ<sub>max</sub>', cls: 'c1' }
    ]);

    var cvNoz = FV.canvas({
      aspect: 0.62,
      render: function (ctx, w, hgt) {
        var sol = solveNozzle(pa);
        var padL = 52, padR = 16;
        var x0 = padL, x1 = w - padR;
        function X(x) { return x0 + x * (x1 - x0); }

        // --- Düsenkontur oben ---
        var topH = hgt * 0.40, cyN = topH * 0.52;
        var kA = topH * 0.19;
        ctx.save();
        ctx.fillStyle = '#1b232c'; ctx.strokeStyle = '#8b98a6'; ctx.lineWidth = 1.8;
        [1, -1].forEach(function (sg) {
          ctx.beginPath();
          ctx.moveTo(X(0), cyN - sg * topH * 0.46);
          for (var t = 0; t <= 1.0001; t += 0.01) ctx.lineTo(X(t), cyN - sg * kA * AofX(t));
          ctx.lineTo(X(1), cyN - sg * topH * 0.46);
          ctx.closePath(); ctx.fill(); ctx.stroke();
        });
        ctx.restore();

        // Strömung farbig: blau Unterschall, orange Überschall
        for (var t2 = 0; t2 < 1; t2 += 0.008) {
          var M = sol.Ma(t2);
          var col = M < 1 ? 'rgba(86,200,245,.30)' : 'rgba(255,138,76,.32)';
          ctx.fillStyle = col;
          ctx.fillRect(X(t2), cyN - kA * AofX(t2), X(t2 + 0.009) - X(t2), 2 * kA * AofX(t2));
        }
        // Hals
        ctx.save();
        ctx.strokeStyle = 'rgba(230,237,243,.35)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(X(XT), cyN - kA * 1.6); ctx.lineTo(X(XT), cyN + kA * 1.6); ctx.stroke();
        ctx.restore();
        FV.text(ctx, X(XT), cyN - kA * 1.75, 'Hals', { color: '#8b98a6', align: 'center', font: '10.5px -apple-system, sans-serif' });

        // Stoss
        if (sol.xs !== null) {
          ctx.save(); ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.moveTo(X(sol.xs), cyN - kA * AofX(sol.xs));
          ctx.lineTo(X(sol.xs), cyN + kA * AofX(sol.xs));
          ctx.stroke(); ctx.restore();
          FV.text(ctx, X(sol.xs), cyN - kA * AofX(sol.xs) - 6, 'Stoss',
            { color: '#ffd166', align: 'center', font: '11px -apple-system, sans-serif' });
        }

        // Strahl ausserhalb andeuten
        if (sol.mode === 'over' || sol.mode === 'under') {
          var isOver = sol.mode === 'over';
          ctx.save();
          ctx.strokeStyle = isOver ? 'rgba(255,138,76,.8)' : 'rgba(86,200,245,.8)';
          ctx.lineWidth = 1.5;
          if (!isOver) ctx.setLineDash([4, 3]);
          [1, -1].forEach(function (sg) {
            ctx.beginPath();
            ctx.moveTo(X(1), cyN - sg * kA * AE);
            ctx.lineTo(X(1) + 26, cyN - sg * kA * AE * (isOver ? 0.55 : 1.5));
            ctx.stroke();
          });
          ctx.restore();
        }

        // --- Druckverlauf unten ---
        ctx.save(); ctx.translate(0, topH + 8);
        var P = FV.plot(ctx, {
          w: w, h: hgt - topH - 8, x: [0, 1], y: [0, 1.02],
          pad: { l: padL, r: padR, t: 18, b: 30 },
          xticks: [0, 0.25, 0.5, 0.75, 1], yticks: [0, 0.25, 0.5, 0.75, 1],
          xlabel: 'x entlang der Düse', ylabel: 'p / p₀',
          xfmt: function (v) { return v.toFixed(2); }
        });
        P.grid(); P.axes();
        P.clip(function () {
          // Referenzniveaus
          [[P_B, 'p_B  gerade gesperrt', '#5c6874'],
           [P_D, 'p_D  Stoss am Austritt', '#5c6874'],
           [P_E, 'p_E  angepasst', '#5c6874']].forEach(function (r) {
            P.poly([[0, r[0]], [1, r[0]]], { color: r[2], dash: [3, 4], width: 1 });
          });
          // aktuelle Kurve
          var pts = [];
          for (var t3 = 0; t3 <= 1.0001; t3 += 0.004) pts.push([t3, sol.p(t3)]);
          if (sol.xs !== null) {
            var a = [], b = [];
            pts.forEach(function (q) { (q[0] < sol.xs ? a : b).push(q); });
            P.poly(a, { color: '#ff8a4c', width: 2.4 });
            P.poly(b, { color: '#56c8f5', width: 2.4 });
            P.poly([[sol.xs, sol.p(sol.xs - 1e-4)], [sol.xs, sol.p(sol.xs + 1e-4)]], { color: '#ffd166', width: 2.4 });
          } else {
            P.poly(pts, { color: sol.choked ? '#ff8a4c' : '#56c8f5', width: 2.4 });
          }
          // Gegendruck
          P.poly([[0, pa], [1, pa]], { color: '#ffffff', dash: [5, 4], width: 1.6 });
          P.dot(1, sol.pe, '#ffffff', 4.5);
        });
        P.label(0.02, P_B + 0.035, 'p_B', '#6e7d8c');
        P.label(0.02, P_D + 0.035, 'p_D', '#6e7d8c');
        P.label(0.02, P_E + 0.035, 'p_E', '#6e7d8c');
        P.label(0.62, pa + 0.04, 'Gegendruck p_a', '#c8d3de');
        ctx.restore();
      },
      cap: 'Oben die Düse (blau = Unterschall, orange = Überschall), unten der Druckverlauf. ' +
           'Weiss gestrichelt der eingestellte Gegendruck; der weisse Punkt ist der Druck am Düsenende.'
    });

    var sPa = FV.slider({
      label: 'Gegendruck p<sub>a</sub> / p₀', min: 0.02, max: 1.0, step: 0.0005, value: 0.35,
      fmt: function (v) { return v.toFixed(3); },
      onInput: function (v) { pa = v; updNoz(); }
    });

    root.appendChild(cvNoz);
    root.appendChild(FV.ctrlRow(sPa));
    root.appendChild(FV.ctrlRow(
      h('span', { style: 'font-size:12px;color:var(--fg-mute);flex:0 0 auto' }, 'Direkt anspringen:'),
      FV.button('A  Unterschall', function () { setPa((1 + P_B) / 2); }),
      FV.button('B  gerade gesperrt', function () { setPa(P_B + 0.0006); }),
      FV.button('C  Stoss in der Düse', function () { setPa((P_B + P_D) / 2); }),
      FV.button('D  Stoss am Düsenende', function () { setPa(P_D + 0.0008); }),
      FV.button('überexpandiert', function () { setPa((P_D + P_E) / 2); }),
      FV.button('E  angepasst', function () { setPa(P_E); }),
      FV.button('F  unterexpandiert', function () { setPa(P_E * 0.45); })
    ));
    root.appendChild(roNoz);

    function setPa(v) { sPa.set(Math.max(0.02, Math.min(1, v))); }

    function updNoz() {
      var sol = solveNozzle(pa);
      var names = {
        venturi: 'A · reine Unterschallströmung (nicht gesperrt)',
        shock: 'C · senkrechter Stoss im divergenten Teil',
        over: 'D–E · überexpandiert, Stösse ausserhalb',
        design: 'E · angepasst — paralleler Überschallstrahl',
        under: 'F · unterexpandiert, Expansionsfächer ausserhalb'
      };
      var nm = names[sol.mode];
      if (sol.mode === 'venturi' && pa <= P_B + 0.004) nm = 'B · Ma = 1 im Hals erreicht, gerade gesperrt';
      if (sol.mode === 'shock' && sol.xs > 0.985) nm = 'D · senkrechter Stoss genau am Düsenende';
      roNoz.set('fall', nm);
      roNoz.set('ma', sol.MaE.toFixed(3));
      roNoz.set('pe', sol.pe.toFixed(3));
      roNoz.set('xs', sol.xs === null ? '—' : 'x = ' + sol.xs.toFixed(3));
      roNoz.set('chok', sol.choked ? 'ja' : 'nein');
      roNoz.set('md', sol.mdot.toFixed(3));
      cvNoz.draw();
    }
    updNoz();

    root.appendChild(FV.note('key', 'Die drei Merkzahlen dieser Düse (A_e/A* = ' + AE.toFixed(1) + ')',
      '<ul style="margin:0">' +
      '<li><strong>p_B/p₀ = ' + P_B.toFixed(3) + '</strong> — knapp darunter ist die Düse gesperrt. ' +
      'Ab hier bringt weiteres Absenken <em>keinen</em> zusätzlichen Massenstrom mehr.</li>' +
      '<li><strong>p_D/p₀ = ' + P_D.toFixed(3) + '</strong> — der Stoss steht genau am Austritt. ' +
      'Darüber sitzt er <em>in</em> der Düse, darunter <em>ausserhalb</em>.</li>' +
      '<li><strong>p_E/p₀ = ' + P_E.toFixed(3) + '</strong> — angepasst, Ma_e = ' + MA_E_SUP.toFixed(2) + '. ' +
      'Darüber überexpandiert, darunter unterexpandiert.</li>' +
      '</ul>'));

    /* ================= 4 · Aufgaben ================= */

    root.appendChild(FV.section('4 · Die beiden Prüfungsaufgaben'));

    root.appendChild(h('p', { html:
      'Zwei Aufgaben, gleicher Wortlaut, <strong>entgegengesetzte Antwort</strong>. Wer die Regel von ganz ' +
      'oben kennt, unterscheidet sie in fünf Sekunden.' }));

    root.appendChild(h('h3', null, 'FS 2024, Aufgabe 17 — der Strahl weitet sich auf'));
    root.appendChild(h('p', { class: 'src' },
      'Im Bild sitzen an der Lippe Expansionsfächer, die Strahlgrenze geht nach aussen → unterexpandiert.'));
    root.appendChild(answerTable([
      ['(a) Die Strömung ist überexpandiert.', false,
        'Überexpandiert wäre p<sub>e</sub> &lt; p<sub>a</sub>, dann würde der Strahl von schiefen Stössen <em>eingeschnürt</em>. Hier ist es umgekehrt.'],
      ['(b) Der Druck am Ende der Düse ist grösser als der Umgebungsdruck.', true,
        'Genau das Kennzeichen der Unterexpansion: p<sub>e</sub> &gt; p<sub>a</sub>. Die Restexpansion findet erst im Freistrahl über Prandtl-Meyer-Fächer statt (S. 112).'],
      ['(c) Bei Erhöhung des Aussendruckes können Stösse in der Düse auftreten.', true,
        'Fährt man den Regler in Abschnitt 3 von Fall F nach oben, wandert der Stoss von aussen an die Lippe (p_D) und dann in den divergenten Teil hinein (Fall C).'],
      ['(d) Die Mach-Zahl im austretenden Strahl nimmt kontinuierlich ab.', false,
        'Im Rautenmuster wechseln sich Fächer und Stösse ab, die Mach-Zahl <strong>oszilliert</strong> (Abschnitt 2).']
    ], 'Musterlösung FS24: F · R · R · F'));

    root.appendChild(h('h3', null, 'FS 2025, Aufgabe 8.3 — derselbe Wortlaut, eingeschnürter Strahl'));
    root.appendChild(h('p', { class: 'src' },
      'Dort sitzen an der Lippe schiefe Verdichtungsstösse, der Strahl wird eingeschnürt → überexpandiert.'));
    root.appendChild(answerTable([
      ['(a) Die Strömung ist überexpandiert.', true,
        'Schiefe Stösse an der Lippe ⟹ der Strahl muss auf einen höheren Druck komprimiert werden ⟹ p<sub>e</sub> &lt; p<sub>a</sub>.'],
      ['(b) In der Düse tritt ein Stoss auf.', false,
        'Die Stösse setzen erst <em>ausserhalb</em> an der Lippe an. Läge ein Stoss im divergenten Teil, träte der Strahl im Unterschall aus — dann gäbe es gar kein Rautenmuster.'],
      ['(c) Der Massenstrom kann durch Absenken des Aussendrucks erhöht werden.', false,
        'Die Düse ist gesperrt. Sobald im Hals Ma = 1 steht, ist ṁ maximal und reagiert nicht mehr auf p<sub>a</sub> (Readout «Massenstrom» in Abschnitt 3).'],
      ['(d) Im engsten Querschnitt erreicht die Temperatur den kritischen Wert T*.', true,
        'Im Hals ist Ma = 1, und der kritische Zustand ist genau durch u = a definiert. Dort gilt T* = T₀ · 2/(γ+1) = ' + (2 / (GAM + 1)).toFixed(3) + ' T₀.']
    ], 'Musterlösung FS25: R · F · F · R'));

    /* ================= 5 · Fallen ================= */

    root.appendChild(FV.section('5 · Die Fallen'));
    root.appendChild(FV.note('warn', 'Worauf du achten musst',
      '<ul style="margin:0">' +
      '<li><strong>„Über“ heisst nicht „zu wenig“.</strong> Überexpandiert = die Düse hat zu <em>viel</em> ' +
      'expandiert, p<sub>e</sub> ist unter p<sub>a</sub> gefallen. Das ist die häufigste Verwechslung.</li>' +
      '<li><strong>Rautenmuster allein sagt gar nichts.</strong> Es tritt in beiden Fällen auf. Nur die ' +
      'erste Welle an der Lippe entscheidet.</li>' +
      '<li><strong>Rautenmuster ⟹ Überschall am Austritt</strong> ⟹ es steht <em>kein</em> Stoss in der ' +
      'Düse. Bei einem Stoss im divergenten Teil träte der Strahl im Unterschall aus.</li>' +
      '<li><strong>Gesperrt heisst gesperrt.</strong> Sobald der Hals Ma = 1 erreicht, ändert kein ' +
      'Gegendruck den Massenstrom mehr — die Information kann nicht mehr stromauf.</li>' +
      '<li><strong>T₀ und T* bleiben über einen Stoss unverändert</strong>, p₀ dagegen nicht. Deshalb ' +
      'wandert der Stoss beim Anheben von p<sub>a</sub> in die Düse: nur so kann die Strömung genug ' +
      'Ruhedruck verlieren, um den Gegendruck zu treffen.</li>' +
      '</ul>'));

    function answerTable(rows, footer) {
      var box = h('div', { class: 'panel' });
      rows.forEach(function (r) {
        box.appendChild(h('div', { style: 'display:grid;grid-template-columns:34px 1fr;gap:12px;padding:10px 0;border-bottom:1px solid var(--line)' },
          h('div', {
            style: 'font-family:var(--mono);font-weight:700;font-size:15px;' +
              'color:' + (r[1] ? 'var(--ok)' : 'var(--bad)')
          }, r[1] ? 'R' : 'F'),
          h('div', null,
            h('div', { style: 'font-weight:600;font-size:14px;margin-bottom:4px' }, r[0]),
            h('div', { html: r[2], style: 'font-size:13.5px;color:var(--fg-dim)' }))));
      });
      if (footer) box.appendChild(h('div', { class: 'src', style: 'margin-top:12px' }, footer));
      return box;
    }
  }
});
