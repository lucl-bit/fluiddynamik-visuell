/* ============================================================
   Freistrahl — was die einzelnen Linien im Rautenmuster bedeuten
   und warum sie sich reflektieren.
   Skript Kap. 11.5 (schiefer Stoss, S. 109 ff.) und 11.6
   (Prandtl-Meyer, S. 112 ff.), Anschluss an Kap. 11.4.
   ============================================================ */

FV.register({
  id: 'freistrahl',
  chapter: 'Kompressible Strömungen',
  chapterNo: '11.6',
  title: 'Freistrahl: die Wellen lesen',
  subtitle: 'Was eine einzelne Linie im Rautenmuster ist, woher sie kommt und warum sie an der Achse anders reflektiert als am Strahlrand.',
  source: 'Skript S. 109–115, Abb. 11.11–11.13 · Prandtl-Meyer S. 112 ff.',

  build: function (root) {
    var h = FV.h;

    /* ================================================================
       PHYSIK
       ================================================================ */

    var GAM = 1.4, DEG = 180 / Math.PI;

    function pIso(M) { return Math.pow(1 + (GAM - 1) / 2 * M * M, -GAM / (GAM - 1)); }
    function machWinkel(M) { return M <= 1 ? Math.PI / 2 : Math.asin(1 / M); }
    // Prandtl-Meyer-Funktion, Skript S. 113
    function nu(M) {
      if (M <= 1) return 0;
      var a = Math.sqrt((GAM + 1) / (GAM - 1));
      return a * Math.atan(Math.sqrt((M * M - 1) / (a * a))) - Math.atan(Math.sqrt(M * M - 1));
    }
    function MaFromNu(v) {
      if (v <= 0) return 1;
      var lo = 1, hi = 60;
      for (var i = 0; i < 90; i++) { var m = (lo + hi) / 2; if (nu(m) < v) lo = m; else hi = m; }
      return (lo + hi) / 2;
    }
    function MaFromP(pr) {
      var lo = 1e-5, hi = 60;
      for (var i = 0; i < 90; i++) { var m = (lo + hi) / 2; if (pIso(m) > pr) lo = m; else hi = m; }
      return (lo + hi) / 2;
    }
    function areaRatio(M) {
      return (1 / M) * Math.pow(2 / (GAM + 1) * (1 + (GAM - 1) / 2 * M * M),
                                (GAM + 1) / (2 * (GAM - 1)));
    }
    function MaFromArea(ar) {        // Überschallast
      if (ar <= 1) return 1;
      var lo = 1, hi = 60;
      for (var i = 0; i < 90; i++) { var m = (lo + hi) / 2; if (areaRatio(m) > ar) hi = m; else lo = m; }
      return (lo + hi) / 2;
    }

    /* ---- Zustand des Strahls ----
       Die Strahlgrenze ist eine freie Oberfläche: dort gilt IMMER p = p_a,
       also Ma = Ma_a. Der Sprung von Ma_e auf Ma_a an der Lippe verlangt eine
       Umlenkung θ = ν(Ma_a) − ν(Ma_e). Auf der Achse wird jede Welle
       gleichartig reflektiert, dort wirkt θ ein zweites Mal.            */
    function strahl(MaE, paRel) {          // paRel = p_a / p_e
      var pE = pIso(MaE);
      var pA = pE * paRel;
      var MaA = MaFromP(pA);               // Ma an der Strahlgrenze
      var theta = nu(MaA) - nu(MaE);       // > 0 Expansion, < 0 Kompression
      var nuC = nu(MaE) + 2 * theta;       // Achsenzone: θ wirkt zweimal
      var MaC = MaFromNu(Math.max(nuC, 0));
      return {
        MaE: MaE, MaA: MaA, MaC: MaC, theta: theta,
        pE: pE, pA: pA, pC: pIso(MaC),
        unter: paRel < 1, ueber: paRel > 1, paRel: paRel
      };
    }

    /* ---- Geometrie des Wellenzuges ----
       Rückgabe: Liste von Segmenten {x1,y1,x2,y2,art} und die Strahlgrenze.
       art: 'exp' Expansionswelle, 'komp' Kompressionswelle/Stoss.        */
    function wellenzug(s, R, nSeg) {
      // Die Wellen werden mit den exakten Machwinkeln zwischen Achse (y = 0) und
      // mittlerer Strahlgrenze (y = R) konstruiert. Die Ausbauchung der Grenze
      // selbst wird danach schematisch aufgesetzt: würde man eine einzelne Welle
      // mit konstanter Randneigung θ laufen lassen, wüchse der Strahl unbegrenzt,
      // weil in Wirklichkeit ein ganzer Fächer die Umlenkung verteilt.
      var tA = Math.tan(machWinkel(s.MaA)), tC = Math.tan(machWinkel(s.MaC));
      var seg = [], refl = [];
      var x = 0, y = R, nachUnten = true;
      var art = s.unter ? 'exp' : 'komp';   // unterexpandiert startet mit Expansion

      for (var k = 0; k < nSeg; k++) {
        var t = nachUnten ? tA : tC;
        var x2, y2;
        if (nachUnten) { x2 = x + y / t; y2 = 0; }          // zur Achse
        else { x2 = x + (R - y) / t; y2 = R; refl.push(x2); } // zur Strahlgrenze
        if (!isFinite(x2) || x2 <= x) break;
        seg.push({ x1: x, y1: y, x2: x2, y2: y2, art: art });
        x = x2; y = y2;
        var warAchse = nachUnten;           // lief das eben beendete Segment zur Achse?
        nachUnten = !nachUnten;
        // Achse reflektiert gleichartig, die freie Grenze kippt das Vorzeichen
        if (!warAchse) art = (art === 'exp' ? 'komp' : 'exp');
      }

      // Strahlgrenze: Umkehrpunkte sind genau die Reflexionsstellen. Bei
      // Unterexpansion weicht sie zuerst nach aussen, bei Überexpansion nach innen.
      var amp = R * Math.min(Math.abs(s.theta) * 1.6, 0.30) * (s.unter ? 1 : -1);
      var rand = [{ x: 0, y: R }];
      for (var i = 0; i < refl.length; i++)
        rand.push({ x: refl[i], y: R + amp * (i % 2 === 0 ? 1 : -1) });
      return { seg: seg, rand: rand, refl: refl, amp: amp };
    }

    // Druck auf der Achse: springt bei jedem Auftreffen einer Welle
    function achsDruck(s, seg) {
      var stufen = [], p = s.pE, i;
      for (i = 0; i < seg.length; i++) {
        if (seg[i].y2 === 0) {              // Welle trifft die Achse
          stufen.push({ x: seg[i].x2, von: p, nach: (p === s.pE ? s.pC : s.pE) });
          p = (p === s.pE ? s.pC : s.pE);
        }
      }
      return stufen;
    }

    /* ===== Ende Physik ===== */

    /* ================================================================
       EINSTIEG
       ================================================================ */

    root.appendChild(FV.note('', 'Die Frage, die dieses Kapitel beantwortet',
      'Im Rautenmuster eines Überschallstrahls sieht man lauter schräge Linien, die sich kreuzen und ' +
      'am Rand zurückgeworfen werden. Was <em>ist</em> so eine Linie eigentlich, warum entsteht sie an ' +
      'der Düsenlippe, und warum kommt sie vom Strahlrand als etwas anderes zurück als von der Achse? ' +
      'Genau das bauen wir hier Schritt für Schritt auf.'));

    root.appendChild(FV.section('1 · Was eine einzelne Linie ist'));

    root.appendChild(h('p', { html:
      'Jede dieser Linien ist eine <strong>Machwelle</strong> — die Bahn, auf der sich eine winzige ' +
      'Druckstörung durch die Überschallströmung ausbreitet. Sie steht unter dem Machwinkel μ zur ' +
      'lokalen Strömungsrichtung:' }));

    root.appendChild(FV.eq(
      'sin μ = 1 / Ma &nbsp;&nbsp;⟹&nbsp;&nbsp; μ = arcsin(1/Ma)',
      'Ma = 1 → μ = 90° (senkrecht) · Ma = 2 → μ = 30° · je schneller, desto flacher · Skript S. 103'));

    root.appendChild(h('p', { html:
      'Es gibt genau <strong>zwei Sorten</strong>, und alles Weitere folgt daraus, welche gerade vorliegt:' }));

    root.appendChild(h('table', null,
      h('thead', null, h('tr', null, h('th', null, ''),
        h('th', { html: '<span style="color:#56c8f5">Expansionswelle</span>' }),
        h('th', { html: '<span style="color:#ff6b6b">Kompressionswelle / Stoss</span>' }))),
      h('tbody', null,
        h('tr', null, h('td', null, 'Druck p'), h('td', null, 'fällt'), h('td', null, 'steigt')),
        h('tr', null, h('td', null, 'Mach-Zahl Ma'), h('td', null, 'steigt'), h('td', null, 'fällt')),
        h('tr', null, h('td', null, 'Strömung dreht'), h('td', null, 'von sich weg (Ecke öffnet)'),
          h('td', null, 'zu sich hin (Ecke schliesst)')),
        h('tr', null, h('td', null, 'Verlauf'), h('td', null, 'stetig, als Fächer aufgespreizt'),
          h('td', null, 'sprunghaft, gebündelt zum Stoss')),
        h('tr', null, h('td', { html: 'Totaldruck p<sub>0</sub>' }), h('td', null, 'bleibt (isentrop)'),
          h('td', null, 'fällt')))));

    /* ================================================================
       2 · Woher die erste Welle kommt
       ================================================================ */

    root.appendChild(FV.section('2 · Woher die allererste Welle kommt'));

    root.appendChild(h('p', { html:
      'An der Düsenlippe treffen zwei Drücke aufeinander: der Druck im Strahl p<sub>e</sub> und der ' +
      'Umgebungsdruck p<sub>a</sub>. Ein Sprung kann dort nicht stehenbleiben — die Strahlgrenze ist ' +
      'eine <strong>freie Oberfläche</strong>, auf der zwingend p = p<sub>a</sub> gilt. Also muss die ' +
      'Strömung sich anpassen, und das geht nur über eine Welle:' }));

    root.appendChild(h('table', null,
      h('thead', null, h('tr', null, h('th', null, 'Fall'), h('th', null, 'Bedingung'),
        h('th', null, 'was an der Lippe entsteht'), h('th', null, 'Strahl direkt danach'))),
      h('tbody', null,
        h('tr', null,
          h('td', { html: '<strong>unter</strong>expandiert' }),
          h('td', { html: 'p<sub>e</sub> &gt; p<sub>a</sub>' }),
          h('td', { html: '<span style="color:#56c8f5">Expansionsfächer</span> — der Strahl ist noch zu ' +
            'stark gepresst und dehnt sich weiter aus' }),
          h('td', null, 'wird zuerst dicker')),
        h('tr', null,
          h('td', { html: '<strong>über</strong>expandiert' }),
          h('td', { html: 'p<sub>e</sub> &lt; p<sub>a</sub>' }),
          h('td', { html: '<span style="color:#ff6b6b">schiefer Stoss</span> — der Strahl wurde zu weit ' +
            'entspannt und wird von aussen zusammengedrückt' }),
          h('td', null, 'wird zuerst dünner')),
        h('tr', null,
          h('td', null, 'angepasst'),
          h('td', { html: 'p<sub>e</sub> = p<sub>a</sub>' }),
          h('td', null, 'gar nichts'),
          h('td', null, 'bleibt glatt')))));

    root.appendChild(FV.note('key', 'Das ist die ganze Erkennungsregel',
      'Schau dir <strong>nur die erste Raute</strong> an, direkt an der Lippe. Wird der Strahl dort ' +
      'zuerst <em>breiter</em>, war er unterexpandiert. Wird er zuerst <em>schmaler</em>, war er ' +
      'überexpandiert. Weiter stromab sehen beide Strahlen praktisch gleich aus — dort kann man es ' +
      'nicht mehr unterscheiden.'));

    /* ================================================================
       3 · Die Konstruktion Schritt für Schritt
       ================================================================ */

    root.appendChild(FV.section('3 · Der Weg einer einzelnen Welle'));

    root.appendChild(h('p', { html:
      'Jetzt verfolgen wir <strong>eine</strong> Welle von der Lippe an. Schieb den Regler Schritt für ' +
      'Schritt weiter — der Text darunter sagt jedes Mal, was gerade passiert.' }));

    var MA_E = MaFromArea(2.0);           // Austritts-Mach-Zahl bei A_e/A* = 2
    var stF = { paRel: 0.45, schritt: 3, alle: false };
    var sJet = strahl(MA_E, stF.paRel);

    var SCHRITTE = [
      { t: 'Nur die Düse', d: 'Am Austritt herrscht der Druck p_e. Der Umgebungsdruck p_a ist ein ' +
          'anderer — dieser Sprung ist der Motor für alles Folgende.' },
      { t: 'Die Welle entsteht an der Lippe', d: null },
      { t: 'Sie läuft schräg durch den Strahl', d: 'Unter dem Machwinkel μ = arcsin(1/Ma). Alles, was ' +
          'links von ihr liegt, weiss noch nichts von der Umgebung.' },
      { t: 'Sie trifft die Symmetrieachse', d: 'Die Achse ist keine Wand, aber sie wirkt wie eine: aus ' +
          'Symmetriegründen kommt von der anderen Seite dieselbe Welle an. Die Strömung muss dort ' +
          'achsparallel bleiben.' },
      { t: 'Reflexion an der Achse — GLEICHARTIG', d: 'Eine Expansion bleibt eine Expansion, ein Stoss ' +
          'bleibt ein Stoss. Die Umlenkung wirkt ein zweites Mal, deshalb schiesst der Strahl auf der ' +
          'Achse über den Umgebungsdruck hinaus.' },
      { t: 'Sie läuft zurück zur Strahlgrenze', d: null },
      { t: 'Reflexion am Rand — MIT VORZEICHENWECHSEL', d: 'Hier steckt der Kern. Am freien Rand muss ' +
          'p = p_a gelten. Eine ankommende Expansion würde den Druck weiter senken — also muss die ' +
          'reflektierte Welle ihn wieder anheben. Aus der Expansion wird eine Kompression.' },
      { t: 'Und wieder zur Achse', d: 'Ab hier wiederholt sich alles. Nach zwei Reflexionen am Rand ist ' +
          'der Ausgangszustand zurück — das ist die Periode einer Raute.' },
      { t: 'Das fertige Muster', d: 'Was man auf dem Foto einer Rakete sieht, ist die Summe aller dieser ' +
          'Wellen. Die hellen Stellen sind Verdichtungen.' }
    ];

    var cvJet = FV.canvas({
      aspect: 0.44,
      render: function (ctx, w, hgt) {
        var padL = 14, padR = 22, padT = 58, padB = 44;
        var innenH = hgt - padT - padB;
        var cy = padT + innenH / 2;
        var lipX = padL + 76;
        var nSeg = stF.alle ? 12 : Math.max(0, stF.schritt - 1);

        // Wellenzug in Einheiten des Strahlradius rechnen, erst beim Zeichnen
        // skalieren — sonst verzerrt eine nachträgliche x-Streckung die Winkel.
        var wz = wellenzug(sJet, 1, Math.max(nSeg, 1));
        var voll = wellenzug(sJet, 1, 8), xv = 0;
        voll.seg.forEach(function (g) { xv = Math.max(xv, g.x2); });

        var scy = innenH * 0.30;                                  // halbe Strahlbreite
        var scx = (w - padR - lipX) / Math.max(xv * 1.02, 1e-6);  // Lauflänge
        var R = 1;

        function PX(x) { return lipX + x * scx; }
        function PY(y) { return cy - y * scy; }

        // Düse
        ctx.save();
        ctx.fillStyle = '#222c38'; ctx.strokeStyle = '#8fa0b0'; ctx.lineWidth = 2;
        [1, -1].forEach(function (sg) {
          ctx.beginPath();
          ctx.moveTo(padL, cy - sg * (scy + 26));
          ctx.lineTo(lipX, cy - sg * scy);
          ctx.lineTo(lipX, cy - sg * (scy + 14));
          ctx.lineTo(padL, cy - sg * (scy + 40));
          ctx.closePath(); ctx.fill(); ctx.stroke();
        });
        ctx.restore();
        FV.text(ctx, padL + 6, cy - 4, 'Ma_e', { color: '#c8d3de', font: '12px ui-monospace, monospace' });
        FV.text(ctx, padL + 6, cy + 12, sJet.MaE.toFixed(2),
          { color: '#ffd166', font: '12px ui-monospace, monospace' });

        // Symmetrieachse
        ctx.save();
        ctx.strokeStyle = 'rgba(140,155,170,.45)'; ctx.lineWidth = 1; ctx.setLineDash([6, 5]);
        ctx.beginPath(); ctx.moveTo(lipX, cy); ctx.lineTo(w - padR, cy); ctx.stroke();
        ctx.restore();
        if (!stF.alle && stF.schritt <= 3)
          FV.text(ctx, w - padR, cy + 15, 'Symmetrieachse',
            { color: '#7b8896', align: 'right', font: '11px -apple-system, sans-serif' });

        // Strahlgrenze (oben und unten gespiegelt)
        if (stF.schritt >= 2) {
          ctx.save();
          ctx.strokeStyle = '#e6edf3'; ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
          [1, -1].forEach(function (sg) {
            ctx.beginPath();
            wz.rand.forEach(function (p, i) {
              var px = PX(p.x), py = cy - sg * p.y * scy;
              i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
            });
            ctx.stroke();
          });
          ctx.restore();
        }

        // Wellensegmente
        wz.seg.forEach(function (g, i) {
          if (i >= nSeg) return;
          var col = g.art === 'exp' ? '#56c8f5' : '#ff6b6b';
          var akt = (!stF.alle && i === nSeg - 1);
          [1, -1].forEach(function (sg) {
            ctx.save();
            ctx.strokeStyle = col; ctx.lineWidth = akt ? 3.4 : 1.8;
            ctx.globalAlpha = akt ? 1 : (stF.alle ? 0.75 : 0.5);
            ctx.beginPath();
            ctx.moveTo(PX(g.x1), cy - sg * g.y1 * scy);
            ctx.lineTo(PX(g.x2), cy - sg * g.y2 * scy);
            ctx.stroke(); ctx.restore();
          });
          // Reflexionspunkt markieren
          if (akt) {
            [1, -1].forEach(function (sg) {
              ctx.save(); ctx.fillStyle = '#fff';
              ctx.beginPath(); ctx.arc(PX(g.x2), cy - sg * g.y2 * scy, 4, 0, 6.2832); ctx.fill(); ctx.restore();
            });
          }
        });

        // Beschriftung des aktuellen Schritts
        var kopf = stF.alle ? SCHRITTE[SCHRITTE.length - 1].t
                            : SCHRITTE[Math.min(stF.schritt, SCHRITTE.length - 1)].t;
        ctx.save();
        ctx.font = '600 13px -apple-system, sans-serif';
        var bw = ctx.measureText(kopf).width + 22;
        ctx.fillStyle = '#0b1016';
        ctx.fillRect(8, 8, bw, 24);
        ctx.restore();
        FV.text(ctx, 19, 25, kopf,
          { color: '#e6edf3', font: '600 13px -apple-system, sans-serif' });

        // Legende unten
        FV.text(ctx, 12, hgt - 22,
          'blau: Expansion (p fällt) · rot: Kompression / Stoss (p steigt)',
          { color: '#6e7d8c', font: '11px -apple-system, sans-serif' });
        FV.text(ctx, 12, hgt - 7,
          'weiss: Strahlgrenze (p = p_a) · Längsmassstab ' +
          (scy > scx ? (scy / scx).toFixed(1) + '× gestaucht' : (scx / scy).toFixed(1) + '× gedehnt') +
          ', Ausbauchung überhöht',
          { color: '#6e7d8c', font: '11px -apple-system, sans-serif' });

        // Fallanzeige
        var fall = sJet.unter ? 'UNTERexpandiert — p_e > p_a' : (sJet.ueber ? 'ÜBERexpandiert — p_e < p_a' : 'angepasst');
        FV.text(ctx, w - padR, 46, fall,
          { color: sJet.unter ? '#56c8f5' : '#ff6b6b', align: 'right',
            font: '600 13px -apple-system, sans-serif' });
      }
    });
    root.appendChild(cvJet);

    var erklaerBox = h('div', { class: 'note key' },
      h('div', { class: 'note-h' }, 'Was gerade passiert'),
      h('div', { html: '' }));
    var erklaerText = erklaerBox.lastChild;

    var sSchritt = FV.slider({
      label: 'Schritt der Konstruktion', min: 0, max: 8, step: 1, value: 3,
      fmt: function (v) { return v.toFixed(0) + ' / 8'; },
      onInput: function (v) { stF.schritt = v; stF.alle = false; updJet(); }
    });
    var sPaRel = FV.slider({
      label: 'Druckverhältnis p<sub>a</sub> / p<sub>e</sub>', min: 0.25, max: 2.4, step: 0.05, value: 0.45,
      fmt: function (v) { return v.toFixed(2); },
      onInput: function (v) { stF.paRel = v; sJet = strahl(MA_E, v); updJet(); }
    });
    root.appendChild(FV.ctrlRow(sSchritt, sPaRel));
    root.appendChild(FV.ctrlRow(
      FV.button('◀ zurück', function () { sSchritt.set(Math.max(0, stF.schritt - 1)); }),
      FV.button('weiter ▶', function () { sSchritt.set(Math.min(8, stF.schritt + 1)); }),
      FV.button('ganzes Muster zeigen', function () { stF.alle = true; updJet(); }),
      FV.button('unterexpandiert', function () { sPaRel.set(0.45); }),
      FV.button('überexpandiert', function () { sPaRel.set(1.9); })
    ));
    root.appendChild(erklaerBox);

    var roJ = FV.readout([
      { key: 'fall', lab: 'Fall' },
      { key: 'mae', lab: 'Ma am Austritt', cls: 'c2' },
      { key: 'maa', lab: 'Ma an der Strahlgrenze', cls: 'c2' },
      { key: 'mac', lab: 'Ma auf der Achse', cls: 'c1' },
      { key: 'theta', lab: 'Umlenkung an der Lippe', cls: 'c3' },
      { key: 'mu', lab: 'Machwinkel μ' }
    ]);
    root.appendChild(roJ);

    /* ================================================================
       4 · Der Druck auf der Achse
       ================================================================ */

    root.appendChild(FV.section('4 · Wie sich die Drücke zeigen'));

    root.appendChild(h('p', { html:
      'Das ist die Antwort auf „wie sieht man den Druck im Bild“. Trägt man p entlang der ' +
      '<strong>Symmetrieachse</strong> auf, springt er bei jeder ankommenden Welle. Und er pendelt ' +
      'nicht etwa auf p<sub>a</sub> ein, sondern <strong>schiesst jedes Mal darüber hinaus</strong> — ' +
      'weil an der Achse die Umlenkung ein zweites Mal wirkt. Deshalb hört das Muster nicht von selbst ' +
      'auf.' }));

    var cvDruck = FV.canvas({
      aspect: 0.46,
      render: function (ctx, w, hgt) {
        var voll = wellenzug(sJet, 1, 12);
        var stufen = achsDruck(sJet, voll.seg);
        var xEnd = stufen.length ? stufen[stufen.length - 1].x * 1.06 : 6;
        var pMax = Math.max(sJet.pE, sJet.pC, sJet.pA) * 1.45;

        var P = FV.plot(ctx, {
          w: w, h: hgt, x: [0, xEnd], y: [0, pMax],
          pad: { l: 62, r: 20, t: 30, b: 40 },
          xticks: [], yticks: tickL(pMax),
          xlabel: 'Lauflänge auf der Achse'
        });
        P.grid(); P.axes();

        // Umgebungsdruck als Bezugslinie
        ctx.save();
        ctx.strokeStyle = '#6fdd8b'; ctx.lineWidth = 1.8; ctx.setLineDash([6, 4]);
        ctx.beginPath(); ctx.moveTo(P.X(0), P.Y(sJet.pA)); ctx.lineTo(P.X(xEnd), P.Y(sJet.pA)); ctx.stroke();
        ctx.restore();
        P.label(xEnd * 0.012, sJet.pA + pMax * 0.05, 'Umgebungsdruck p_a', '#6fdd8b');

        // Treppe
        var pts = [[0, sJet.pE]], p = sJet.pE, i;
        for (i = 0; i < stufen.length; i++) {
          pts.push([stufen[i].x, p]);
          p = stufen[i].nach;
          pts.push([stufen[i].x, p]);
        }
        pts.push([xEnd, p]);
        P.poly(pts, { color: '#ffd166', width: 2.6 });

        // Sprungstellen markieren
        for (i = 0; i < stufen.length; i++) {
          P.dot(stufen[i].x, stufen[i].nach, i % 2 === 0 ?
            (sJet.unter ? '#56c8f5' : '#ff6b6b') : (sJet.unter ? '#ff6b6b' : '#56c8f5'), 4.5);
        }

        P.label(xEnd * 0.012, sJet.pE + pMax * 0.10, 'p_e am Austritt', '#c8d3de');
        FV.text(ctx, 12, 18, 'p / p₀',
          { color: '#7b8896', font: '11.5px ui-monospace, monospace' });
        FV.text(ctx, w - 16, 18,
          sJet.unter ? 'unterexpandiert: schiesst nach UNTEN durch'
                     : 'überexpandiert: schiesst nach OBEN durch',
          { color: sJet.unter ? '#56c8f5' : '#ff6b6b', align: 'right',
            font: '12.5px -apple-system, sans-serif' });
        FV.text(ctx, P.X(0), hgt - 8, 'jeder Sprung = eine ankommende Welle',
          { color: '#6e7d8c', font: '11px -apple-system, sans-serif' });
      }
    });
    function tickL(top) {
      var st = top <= 0.12 ? 0.02 : (top <= 0.35 ? 0.05 : 0.1), out = [];
      for (var v = 0; v <= top + 1e-9; v += st) out.push(Math.round(v * 1000) / 1000);
      return out;
    }
    root.appendChild(cvDruck);

    root.appendChild(FV.note('', 'Warum das Muster trotzdem irgendwann verschwindet',
      'In dieser idealen Rechnung liefe es ewig weiter. In Wirklichkeit vermischt sich der Strahl am ' +
      'Rand mit der ruhenden Umgebung, die Scherschicht wächst nach innen und frisst das Muster nach ' +
      'einigen Rauten auf. Bei stark überexpandierten Strahlen bildet sich zusätzlich eine ' +
      '<strong>Machscheibe</strong>: ein senkrechter Stoss quer über die Achse, hinter dem die Strömung ' +
      'im Unterschall ist. Dann bricht das Muster abrupt ab.'));

    /* ================================================================
       5 · Die zwei Reflexionsregeln
       ================================================================ */

    root.appendChild(FV.section('5 · Die zwei Reflexionsregeln nebeneinander'));

    root.appendChild(h('p', { html:
      'Das ist die eine Sache, die man sich merken muss. An einer <strong>festen Wand</strong> und an ' +
      'einer <strong>freien Grenze</strong> reflektiert dieselbe Welle völlig verschieden — und der ' +
      'Grund ist jedes Mal die Randbedingung:' }));

    function reflBild(frei) {
      return FV.canvas({
        aspect: 0.62,
        render: function (ctx, w, hgt) {
          var padT = 44, padB = 40;
          var yR = hgt - padB, xa = 30, xb = w - 26;
          var mid = (xa + xb) / 2;

          // Rand
          ctx.save();
          if (frei) {
            ctx.strokeStyle = '#e6edf3'; ctx.lineWidth = 2.4; ctx.setLineDash([8, 5]);
            ctx.beginPath(); ctx.moveTo(xa, yR); ctx.lineTo(xb, yR); ctx.stroke();
          } else {
            ctx.fillStyle = '#2a3542'; ctx.fillRect(xa, yR, xb - xa, 9);
            ctx.strokeStyle = '#8fa0b0'; ctx.lineWidth = 1.8;
            ctx.beginPath(); ctx.moveTo(xa, yR); ctx.lineTo(xb, yR); ctx.stroke();
            for (var hx = xa; hx < xb - 6; hx += 10) {
              ctx.strokeStyle = 'rgba(143,160,176,.5)'; ctx.lineWidth = 1;
              ctx.beginPath(); ctx.moveTo(hx, yR + 9); ctx.lineTo(hx + 6, yR + 15); ctx.stroke();
            }
          }
          ctx.restore();

          // ankommende Expansionswelle
          var yTop = padT + 6;
          FV.arrow(ctx, xa + 14, yTop, mid, yR - 3, '#56c8f5', 3, 10);
          // reflektierte Welle
          var col = frei ? '#ff6b6b' : '#56c8f5';
          FV.arrow(ctx, mid, yR - 3, xb - 14, yTop, col, 3, 10);

          ctx.save(); ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(mid, yR - 2, 4.5, 0, 6.2832); ctx.fill(); ctx.restore();

          FV.text(ctx, xa + 16, yTop + 16, 'Expansion',
            { color: '#56c8f5', font: '12px -apple-system, sans-serif' });
          FV.text(ctx, xb - 14, yTop + 16, frei ? 'Kompression' : 'Expansion',
            { color: col, align: 'right', font: '12px -apple-system, sans-serif' });

          FV.text(ctx, w / 2, 20, frei ? 'freie Strahlgrenze' : 'feste Wand (oder Symmetrieachse)',
            { color: '#c8d3de', align: 'center', font: '600 13px -apple-system, sans-serif' });
          FV.text(ctx, w / 2, 36, frei ? 'Randbedingung:  p = p_a' : 'Randbedingung:  v ∥ Wand',
            { color: '#7b8896', align: 'center', font: '11.5px ui-monospace, monospace' });
          FV.text(ctx, w / 2, hgt - 8,
            frei ? 'Vorzeichen kippt' : 'gleichartig',
            { color: frei ? '#ff6b6b' : '#6fdd8b', align: 'center',
              font: '600 12.5px -apple-system, sans-serif' });
        }
      });
    }
    root.appendChild(h('div', { class: 'duo' }, reflBild(false), reflBild(true)));

    root.appendChild(FV.note('key', 'Die Begründung in je einem Satz',
      '<ul style="margin:0">' +
      '<li><strong>Feste Wand / Achse:</strong> Die Strömung muss parallel zur Wand bleiben. Die ' +
      'ankommende Welle dreht sie weg — die reflektierte muss sie genauso wieder zurückdrehen. Dafür ' +
      'braucht es <em>dieselbe</em> Sorte Welle.</li>' +
      '<li><strong>Freie Grenze:</strong> Dort muss der Druck gleich p<sub>a</sub> bleiben. Die ' +
      'ankommende Expansion senkt den Druck — die reflektierte muss ihn wieder anheben. Dafür braucht ' +
      'es die <em>andere</em> Sorte.</li>' +
      '<li><strong>Die Symmetrieachse ist keine Wand</strong>, verhält sich aber genau wie eine: von ' +
      'der anderen Strahlhälfte kommt spiegelbildlich dieselbe Welle an, und beide zusammen halten die ' +
      'Strömung achsparallel.</li>' +
      '</ul>'));

    /* ================================================================
       6 · Fallen
       ================================================================ */

    root.appendChild(FV.section('6 · Die Fallen'));

    root.appendChild(FV.note('warn', 'Worauf du achten musst',
      '<ul style="margin:0">' +
      '<li><strong>Das Rautenmuster allein sagt gar nichts.</strong> Es tritt bei über- und bei ' +
      'unterexpandierten Strahlen auf. Entscheidend ist einzig die <em>erste</em> Raute: breiter oder ' +
      'schmaler?</li>' +
      '<li><strong>Rautenmuster heisst aber: Überschall am Austritt.</strong> Also steht <em>kein</em> ' +
      'Stoss in der Düse — sonst käme der Strahl im Unterschall heraus und es gäbe gar keine Wellen.</li>' +
      '<li><strong>„Überexpandiert“ heisst zu viel expandiert, nicht zu wenig.</strong> Die Düse hat ' +
      'den Druck unter den Umgebungsdruck gedrückt. Der Name beschreibt, was die Düse getan hat — ' +
      'nicht, was der Strahl noch tun muss.</li>' +
      '<li><strong>Auf der Achse gilt nicht p = p_a.</strong> Nur an der Strahlgrenze. Auf der Achse ' +
      'schiesst der Druck bei jeder Reflexion darüber hinaus — genau deshalb geht es immer weiter.</li>' +
      '<li><strong>Der Machwinkel ändert sich mit.</strong> Wird der Strahl schneller, werden die Linien ' +
      'flacher, und die Rauten werden länger.</li>' +
      '</ul>'));

    root.appendChild(FV.note('', 'Wo das herkommt und wohin es führt',
      'Wie der Gegendruck überhaupt zu p<sub>e</sub> ≠ p<sub>a</sub> führt, steht im ' +
      '<a href="#kanal">Kanallabor</a>. Die beiden Prüfungsaufgaben zur Erkennung stehen in ' +
      '<a href="#lavalduese">Laval-Düse: über- oder unterexpandiert?</a>, und der schiefe Stoss selbst ' +
      'mit θ-β-Ma-Diagramm in <a href="#stoss">Verdichtungsstoss</a>.'));

    /* ================================================================
       Aktualisierung
       ================================================================ */

    function updJet() {
      var s = SCHRITTE[Math.min(stF.schritt, SCHRITTE.length - 1)];
      var extra = '';
      if (stF.schritt === 1) {
        extra = sJet.unter
          ? 'p_e ist <strong>grösser</strong> als p_a — der Strahl ist noch zu stark gepresst. Er muss ' +
            'sich weiter ausdehnen, also entsteht ein <span style="color:#56c8f5">Expansionsfächer</span>. ' +
            'Die Strömung dreht dabei um ' + Math.abs(sJet.theta * DEG).toFixed(1) + '° nach aussen.'
          : 'p_e ist <strong>kleiner</strong> als p_a — die Düse hat zu weit entspannt. Die Umgebung ' +
            'drückt den Strahl zusammen, also entsteht ein <span style="color:#ff6b6b">schiefer Stoss</span>. ' +
            'Die Strömung dreht um ' + Math.abs(sJet.theta * DEG).toFixed(1) + '° nach innen.';
      }
      erklaerText.innerHTML = (s.d || '') + (extra ? (s.d ? '<br><br>' : '') + extra : '');

      roJ.set('fall', sJet.unter ? 'unterexpandiert' : (sJet.ueber ? 'überexpandiert' : 'angepasst'));
      roJ.set('mae', sJet.MaE.toFixed(3));
      roJ.set('maa', sJet.MaA.toFixed(3));
      roJ.set('mac', sJet.MaC.toFixed(3));
      roJ.set('theta', (sJet.theta * DEG).toFixed(1) + '°');
      roJ.set('mu', (machWinkel(sJet.MaA) * DEG).toFixed(1) + '°');
      cvJet.draw(); cvDruck.draw();
    }
    updJet();
  }
});
