/* ============================================================
   Starrkörperwirbel vs. Potentialwirbel  —  Skript Kap. 10.1, S. 79–81
   ============================================================ */

FV.register({
  id: 'wirbel',
  chapter: 'Drehungsbehaftete Strömungen',
  chapterNo: '10.1',
  title: 'Starrkörper- vs. Potentialwirbel',
  subtitle: 'Beide sehen aus wie ein Wirbel. Nur einer dreht das Fluidteilchen.',
  source: 'Skript S. 79–81, Abb. 10.1–10.4',

  build: function (root) {
    var h = FV.h;

    /* ---------------- Physik-Parameter ---------------- */
    var OMEGA = 1.0;          // Starrkörper: uθ = Ω·r
    var R_REF = 0.60;         // Radius, bei dem beide Wirbel gleich schnell sind
    var C = OMEGA * R_REF * R_REF;   // Potentialwirbel: uθ = c/r

    // Winkelgeschwindigkeit der Bahn (uθ/r) — exakt, r bleibt konstant
    function omBahn(kind, r) { return kind === 'rigid' ? OMEGA : C / (r * r); }
    function uTheta(kind, r) { return kind === 'rigid' ? OMEGA * r : C / r; }
    // lokale Rotation (Wirbelstärke) ω_z
    function omegaZ(kind, r) { return kind === 'rigid' ? 2 * OMEGA : 0; }

    /* ---------------- Zustand ---------------- */
    var st = {
      t: 0, running: true, speed: 0.35,
      showMarker: true, showElement: true, showVectors: true, showTrails: false,
      r0: 0.45   // Rankine-Kernradius für die Diagramme
    };

    // Partikel (dienen beiden Feldern gemeinsam)
    var RADII = [0.30, 0.46, 0.62, 0.80, 0.95];
    var seeds = [];
    RADII.forEach(function (r, i) {
      for (var k = 0; k < 3; k++) seeds.push({ r: r, th0: k * 2.0944 + i * 0.35 });
    });

    // Materielles Fluidelement: Kreuz aus radialer und tangentialer Linie
    var ELEM_R = 0.62, ELEM_TH0 = Math.PI * 0.25, ELEM_D = 0.10;
    var elemT0 = 0;   // Zeitpunkt des letzten Resets

    /* ---------------- Intro ---------------- */

    root.appendChild(FV.note('', 'Worum es geht',
      'Ein <strong>Wirbel</strong> ist umgangssprachlich definiert: ein ausgedehnter Bereich von ' +
      'Fluidteilchen, die um ein gemeinsames Zentrum laufen — in der ebenen, stationären Strömung ' +
      'also <em>geschlossene Stromlinien</em>. Das sagt aber nichts darüber, ob sich die Teilchen selbst ' +
      '<strong>drehen</strong>. Genau darin unterscheiden sich die beiden Modellwirbel: die Bahnen sind ' +
      'in beiden Fällen Kreise, die <em>Drehung</em> des Teilchens ist völlig verschieden.'));

    root.appendChild(FV.eq(
      '<div style="display:flex;gap:38px;justify-content:center;flex-wrap:wrap">' +
      '<div><span style="color:var(--c1)">Starrkörperwirbel</span><br><br>' +
      'u<sub>θ</sub> = Ω·r &nbsp;&nbsp;&nbsp; ω = 2Ω = const.</div>' +
      '<div><span style="color:var(--c2)">Potentialwirbel</span><br><br>' +
      'u<sub>θ</sub> = c / r &nbsp;&nbsp;&nbsp; ω ≡ 0 &nbsp;(r &gt; 0)</div>' +
      '</div>',
      'u_r = 0 in beiden Fällen · Skript S. 79 f.'));

    /* ---------------- Hauptanimation ---------------- */

    root.appendChild(FV.section('1 · Die Animation: dreht sich das Teilchen?'));

    root.appendChild(h('p', { html:
      'Die kleinen Plättchen sind <strong>Fluidteilchen</strong>. Der helle Zeiger zeigt ihre ' +
      '<strong>Orientierung</strong> im Raum. Achte nicht auf die Bahn — die ist links wie rechts ein Kreis — ' +
      'sondern darauf, ob sich der Zeiger mitdreht.' }));

    function makeVortex(kind) {
      var col = kind === 'rigid' ? '#ff8a4c' : '#56c8f5';
      var colDim = kind === 'rigid' ? 'rgba(255,138,76,' : 'rgba(86,200,245,';

      var cv = FV.canvas({
        aspect: 1,
        render: function (ctx, w, hgt) {
          var cx = w / 2, cy = hgt / 2;
          var R = Math.min(w, hgt) / 2 - 20;
          var P = function (r, th) { return [cx + R * r * Math.cos(th), cy - R * r * Math.sin(th)]; };

          // Titelzeile
          FV.text(ctx, 12, 20, kind === 'rigid' ? 'Starrkörperwirbel  uθ = Ω r' : 'Potentialwirbel  uθ = c / r',
            { color: col, font: '13px ui-monospace, monospace' });
          FV.text(ctx, 12, 38, kind === 'rigid' ? 'ω = 2Ω  überall drehungsbehaftet' : 'ω = 0  überall drehungsfrei (ausser r = 0)',
            { color: '#7b8896', font: '11.5px ui-monospace, monospace' });

          // Stromlinien (Kreise)
          ctx.save();
          ctx.strokeStyle = '#1c242e'; ctx.lineWidth = 1;
          RADII.forEach(function (r) {
            ctx.beginPath(); ctx.arc(cx, cy, R * r, 0, 6.2832); ctx.stroke();
          });
          ctx.restore();

          // Zentrum
          if (kind === 'potential') {
            ctx.save();
            var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.2);
            g.addColorStop(0, 'rgba(86,200,245,.35)'); g.addColorStop(1, 'rgba(86,200,245,0)');
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 0.2, 0, 6.2832); ctx.fill();
            ctx.restore();
            FV.text(ctx, cx, cy + 4, '×', { color: '#9fd8f2', align: 'center', font: '16px monospace' });
            FV.text(ctx, cx, cy + 22, 'Singularität', { color: '#5c7484', align: 'center', font: '10px sans-serif' });
          } else {
            ctx.save(); ctx.fillStyle = '#3a4552';
            ctx.beginPath(); ctx.arc(cx, cy, 3, 0, 6.2832); ctx.fill(); ctx.restore();
          }

          // Geschwindigkeitsprofil als Pfeile entlang eines Strahls
          if (st.showVectors) {
            var ang = -Math.PI / 2;   // nach unten zeigender Strahl
            RADII.forEach(function (r) {
              var p = P(r, ang);
              var u = uTheta(kind, r);
              var len = u * R * 0.30;
              // tangential (Richtung +θ) im Bildschirm: (-sin, -cos) wegen y-Flip
              var tx = -Math.sin(ang), ty = -Math.cos(ang);
              FV.arrow(ctx, p[0], p[1], p[0] + tx * len, p[1] + ty * len, colDim + '.85)', 1.8, 7);
            });
            FV.text(ctx, cx + 8, cy + R * 0.99 + 14, 'uθ(r)', { color: colDim + '.7)', font: '11px ui-monospace, monospace' });
          }

          // Fluidteilchen
          seeds.forEach(function (s) {
            var th = s.th0 + omBahn(kind, s.r) * st.t;
            var p = P(s.r, th);
            // Orientierung: alle starten parallel, drehen dann mit Ω_lokal = ½ ω
            var phi = 0.5 * omegaZ(kind, s.r) * st.t;

            if (st.showTrails) {
              ctx.save();
              ctx.strokeStyle = colDim + '.18)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.arc(cx, cy, R * s.r, -th, -th + 0.55);
              ctx.stroke(); ctx.restore();
            }

            drawParticle(ctx, p[0], p[1], phi, col, st.showMarker);
          });

          // materielles Fluidelement (Kreuz aus zwei materiellen Linien)
          if (st.showElement) drawElement(ctx, kind, P);
        }
      });

      // ---- Zeichnen eines Fluidteilchens mit Orientierungszeiger ----
      function drawParticle(ctx, x, y, phi, color, marker) {
        var s = 8;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-phi);   // y-Flip → negatives Vorzeichen
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(-s / 2, -s / 2, s, s, 2) : ctx.rect(-s / 2, -s / 2, s, s);
        ctx.fill();
        if (marker) {
          ctx.globalAlpha = 1;
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s * 1.35, 0); ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath(); ctx.arc(s * 1.35, 0, 1.9, 0, 6.2832); ctx.fill();
        }
        ctx.restore();
      }

      // ---- materielles Kreuz: zeigt Scherung und mittlere Drehung ----
      function drawElement(ctx, kind, P) {
        var dt = st.t - elemT0;
        // Beim Reset steht das Element unverzerrt dort, wo sein Zentrum gerade ist.
        var base = ELEM_TH0 + omBahn(kind, ELEM_R) * elemT0;

        // materieller Punkt: behält seinen Radius, dreht mit uθ(r)/r
        function pt(r, dth) { return P(r, base + dth + omBahn(kind, r) * dt); }

        var N = 20, i;
        var radial = [], tang = [];
        var dthMax = ELEM_D / ELEM_R;
        for (i = 0; i <= N; i++) {
          radial.push(pt(ELEM_R - ELEM_D + 2 * ELEM_D * i / N, 0));
          tang.push(pt(ELEM_R, -dthMax + 2 * dthMax * i / N));
        }

        function stroke(pts, col) {
          ctx.strokeStyle = col; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
          ctx.beginPath();
          pts.forEach(function (p, k) { k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); });
          ctx.stroke();
        }

        ctx.save();
        stroke(radial, '#ffd166');    // radiale materielle Linie
        stroke(tang, '#a78bfa');      // tangentiale materielle Linie
        var cP = pt(ELEM_R, 0);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(cP[0], cP[1], 2.6, 0, 6.2832); ctx.fill();
        ctx.restore();
      }

      return cv;
    }

    var cvRigid = makeVortex('rigid');
    var cvPot = makeVortex('potential');

    var duo = h('div', { class: 'duo' }, cvRigid, cvPot);
    root.appendChild(duo);

    root.appendChild(FV.legend([
      { c: '#ffffff', t: 'weisser Zeiger = Orientierung des Teilchens' },
      { c: '#ffd166', t: 'radiale materielle Linie' },
      { c: '#a78bfa', t: 'tangentiale materielle Linie' }
    ]));

    var btnPlay = FV.toggle('▶ läuft', true, function (s) {
      st.running = s; btnPlay.textContent = s ? '▶ läuft' : '⏸ pausiert';
    });

    var roLive = FV.readout([
      { key: 'rot1', lab: 'Drehrate <b>radiale</b> Linie', cls: 'c1' },
      { key: 'rot2', lab: 'Drehrate <b>tangentiale</b> Linie', cls: 'c2' },
      { key: 'mean', lab: 'Mittel = Ω<sub>lokal</sub> = ½ω', cls: 'c3' }
    ]);

    root.appendChild(FV.ctrlRow(
      btnPlay,
      FV.button('Element zurücksetzen', function () { elemT0 = st.t; }),
      FV.slider({
        label: 'Tempo', min: 0.05, max: 1.0, step: 0.01, value: st.speed,
        fmt: function (v) { return '×' + v.toFixed(2); },
        onInput: function (v) { st.speed = v; }
      }),
      FV.toggle('Orientierung', true, function (s) { st.showMarker = s; }),
      FV.toggle('Fluidelement', true, function (s) { st.showElement = s; }),
      FV.toggle('uθ-Pfeile', true, function (s) { st.showVectors = s; }),
      FV.toggle('Spuren', false, function (s) { st.showTrails = s; })
    ));

    root.appendChild(FV.note('key', 'Was du sehen solltest',
      '<strong>Links (Starrkörper):</strong> Das ganze Feld dreht wie eine Scheibe. Der Zeiger jedes ' +
      'Teilchens dreht sich mit — nach einem Umlauf hat das Teilchen sich einmal um sich selbst gedreht. ' +
      'Das gelbe und das violette Linienstück bleiben senkrecht aufeinander: keine Scherung, reine Rotation.' +
      '<br><br><strong>Rechts (Potentialwirbel):</strong> Innen läuft das Fluid schneller als aussen ' +
      '(uθ ~ 1/r). Der Zeiger dreht sich <em>gar nicht</em> — das Teilchen wird nur auf seiner Kreisbahn ' +
      'herumgetragen und behält seine Ausrichtung (Skript, Abb. 10.2). Das gelbe Linienstück wird ' +
      'nach hinten gebogen (dreht im Uhrzeigersinn), das violette dreht vorwärts — <strong>gleich stark, ' +
      'entgegengesetzt</strong>. Der Mittelwert beider Drehraten ist null, und genau dieser Mittelwert ' +
      '<em>ist</em> ½ω.'));

    root.appendChild(FV.panel('Live-Drehraten am Fluidelement (Potentialwirbel, r = 0.62)', roLive));

    /* ---------------- Der Kernsatz ---------------- */

    root.appendChild(FV.section('2 · Der Satz, der alles erklärt'));

    root.appendChild(FV.eq(
      'Ω<sub>lokal</sub> = ½ · ω &nbsp;&nbsp;&nbsp;(mittlere Winkelgeschwindigkeit eines Fluidteilchens)',
      'gilt für jede Strömung, nicht nur für die beiden Modellwirbel · Skript S. 80'));

    root.appendChild(h('p', { html:
      'Die Wirbelstärke ω = rot u misst <strong>nicht</strong>, ob etwas im Kreis läuft, sondern die ' +
      '<strong>mittlere Eigendrehung</strong> eines Fluidteilchens — gemittelt über alle Richtungen. ' +
      'Deshalb ist beim Starrkörperwirbel ω = 2Ω (doppelt so gross wie die Winkelgeschwindigkeit der ' +
      'Scheibe!) und beim Potentialwirbel ω = 0, obwohl das Fluid dort sichtbar rotiert.' }));

    root.appendChild(h('table', null,
      h('thead', null, h('tr', null,
        h('th', null, ''), h('th', null, 'Starrkörperwirbel'), h('th', null, 'Potentialwirbel'))),
      h('tbody', null,
        trow('Geschwindigkeit', 'u<sub>θ</sub> = Ω·r &nbsp;(innen langsam)', 'u<sub>θ</sub> = c/r &nbsp;(innen schnell)'),
        trow('Wirbelstärke ω', '2Ω, überall gleich', '0 für r &gt; 0, Singularität bei r = 0'),
        trow('Teilchen dreht sich?', 'ja, mit Ω', 'nein — behält Orientierung'),
        trow('Potential Φ vorhanden?', 'nein (nicht wirbelfrei)', 'ja: Φ = c·θ'),
        trow('Zirkulation Γ um Kreis r', '2π Ω r² &nbsp;(wächst mit r²)', '2π c &nbsp;(unabhängig von r)'),
        trow('Bernoulli im ganzen Feld?', 'nein, nur längs Stromlinie', 'ja, im ganzen Feld'),
        trow('Vorkommen', 'Kern eines realen Wirbels, rotierender Behälter', 'Aussenbereich von Tornado/Randwirbel, Badewanne')
      )));

    function trow(a, b, c) {
      return h('tr', null, h('td', { html: a }),
        h('td', { html: b, style: 'color:var(--c1)' }),
        h('td', { html: c, style: 'color:var(--c2)' }));
    }

    /* ---------------- Profile + Rankine ---------------- */

    root.appendChild(FV.section('3 · Profile uθ(r) und ω(r) — und der Rankine-Wirbel'));

    root.appendChild(h('p', { html:
      'Beide Modelle sind unphysikalisch, wenn man sie über das ganze Feld ausdehnt: der ' +
      'Starrkörperwirbel wird nach aussen unendlich schnell, der Potentialwirbel im Zentrum. Der ' +
      '<strong>Rankine-Wirbel</strong> setzt beide zusammen — Starrkörperkern für r ≤ r<sub>0</sub>, ' +
      'Potentialwirbel aussen — und ist damit eine exakte Lösung der Navier-Stokes-Gleichung ' +
      '(Sonderfall von u<sub>θ</sub> = Ar + B/r, Taylor-Couette).' }));

    var cvProf = FV.canvas({
      aspect: 0.42,
      render: function (ctx, w, hgt) {
        var half = w / 2 - 8;
        drawProfile(ctx, 0, 0, half, hgt, 'u');
        drawProfile(ctx, half + 16, 0, half, hgt, 'w');
      },
      cap: 'Rankine-Wirbel (durchgezogen) gegen die reinen Modelle (gestrichelt). ' +
           'Vergleiche mit Abb. 10.3 im Skript. Im realen Wirbel ist der Knick bei r₀ zusätzlich ausgerundet.'
    });

    // Stützstellen einer Funktion auf [a,b] als Punktliste
    function sample(a, b, f, n) {
      n = n || 80; var pts = [];
      for (var i = 0; i <= n; i++) { var x = a + (b - a) * i / n; pts.push([x, f(x)]); }
      return pts;
    }

    function drawProfile(ctx, ox, oy, w, hgt, which) {
      ctx.save(); ctx.translate(ox, oy);
      var r0 = st.r0;
      // Beide Grössen normiert: uθ(r₀) = 1 bzw. ω(Kern) = 1
      var yTop = which === 'u' ? 1.25 : 1.35;
      var P = FV.plot(ctx, {
        w: w, h: hgt,
        x: [0, 1.5], y: [which === 'u' ? 0 : -0.2, yTop],
        pad: { l: 44, r: 12, t: 26, b: 32 },
        xticks: [0, 0.5, 1.0, 1.5], yticks: which === 'u' ? [0, 0.5, 1.0] : [0, 0.5, 1.0],
        xlabel: 'r', ylabel: which === 'u' ? 'uθ (normiert)' : 'ω (normiert)'
      });
      P.grid(); P.axes();

      P.clip(function () {
        if (which === 'u') {
          P.curve(function (r) { return r / r0; }, { color: 'rgba(255,138,76,.45)', dash: [5, 4], width: 1.6 });
          P.curve(function (r) { return r0 / r; }, { color: 'rgba(86,200,245,.45)', dash: [5, 4], width: 1.6 });
          // Rankine: Starrkörper innen, Potentialwirbel aussen
          P.poly(sample(0, r0, function (r) { return r / r0; }), { color: '#ff8a4c', width: 2.6 });
          P.poly(sample(r0, 1.5, function (r) { return r0 / r; }), { color: '#56c8f5', width: 2.6 });
          // realer Wirbel: geglättet (Hamel-Oseen)
          P.curve(function (r) {
            var x = r / r0; return (1 - Math.exp(-1.256 * x * x)) / x / (1 - Math.exp(-1.256));
          }, { color: 'rgba(230,237,243,.5)', dash: [3, 4], width: 1.7 });
        } else {
          P.poly([[0, 1], [r0, 1]], { color: '#ff8a4c', width: 2.6 });
          P.poly([[r0, 0], [1.5, 0]], { color: '#56c8f5', width: 2.6 });
          P.poly([[r0, 1], [r0, 0]], { color: '#6e7d8c', width: 1.4, dash: [4, 3] });
          P.curve(function (r) {
            var x = r / r0; return Math.exp(-1.256 * x * x) / (1 - Math.exp(-1.256)) * 0.717;
          }, { color: 'rgba(230,237,243,.5)', dash: [3, 4], width: 1.7 });
        }
        P.vline(r0, { color: '#556170', dash: [3, 3] });
      });
      P.label(r0, yTop * 0.93, ' r₀', '#8b98a6');
      FV.text(ctx, 44, 16, which === 'u' ? 'Umfangsgeschwindigkeit uθ(r)' : 'Wirbelstärke ω(r)',
        { color: '#c8d3de', font: '12.5px -apple-system, sans-serif' });
      ctx.restore();
    }

    root.appendChild(cvProf);
    root.appendChild(FV.ctrlRow(FV.slider({
      label: 'Kernradius r₀ des Rankine-Wirbels', min: 0.15, max: 0.9, step: 0.01, value: st.r0,
      fmt: function (v) { return v.toFixed(2); },
      onInput: function (v) { st.r0 = v; cvProf.draw(); }
    })));

    root.appendChild(FV.legend([
      { c: '#ff8a4c', t: 'Rankine, Starrkörperkern (r ≤ r₀)' },
      { c: '#56c8f5', t: 'Rankine, Potentialwirbel aussen (r > r₀)' },
      { c: '#8b98a6', t: 'realer Wirbel (geglättet, Hamel-Oseen)' },
      { c: '#4a5663', t: 'reine Modelle unbegrenzt fortgesetzt' }
    ]));

    /* ---------------- Zirkulation ---------------- */

    root.appendChild(FV.section('4 · Zirkulation: warum Γ ≠ 0 trotz ω = 0'));

    root.appendChild(h('p', { html:
      'Der Satz von Stokes sagt: Γ<sub>C</sub> = ∮<sub>C</sub> u·ds = ∫∫<sub>A</sub> ω·dA. Beim Potentialwirbel ' +
      'ist ω ≡ 0 — und trotzdem ist Γ = 2πc auf <em>jedem</em> Kreis um den Ursprung. Kein Widerspruch: ' +
      'die eingeschlossene Fläche enthält die Singularität bei r = 0, in der die gesamte Rotation ' +
      'konzentriert ist. Umschliesst die Kurve den Ursprung <strong>nicht</strong>, ist Γ = 0.' }));

    var roCirc = FV.readout([
      { key: 'u1', lab: 'uθ Starrkörper', cls: 'c1' },
      { key: 'g1', lab: 'Γ Starrkörper', cls: 'c1' },
      { key: 'u2', lab: 'uθ Potentialwirbel', cls: 'c2' },
      { key: 'g2', lab: 'Γ Potentialwirbel', cls: 'c2' }
    ]);

    var circR = 0.6;
    var G_POT = 2 * Math.PI * C;
    function gRigid(r) { return 2 * Math.PI * OMEGA * r * r; }

    var cvCirc = FV.canvas({
      aspect: 0.5,
      render: function (ctx, w, hgt) {
        var P = FV.plot(ctx, {
          w: w, h: hgt, x: [0, 1.5], y: [0, 8],
          pad: { l: 48, r: 14, t: 24, b: 34 },
          xticks: [0, 0.5, 1, 1.5], yticks: [0, 2, 4, 6, 8],
          xlabel: 'Radius r der Integrationskurve', ylabel: 'Γ(r)'
        });
        P.grid(); P.axes();
        P.clip(function () {
          P.curve(gRigid, { color: '#ff8a4c', width: 2.4 });
          P.curve(function () { return G_POT; }, { color: '#56c8f5', width: 2.4 });
          P.vline(circR, { color: '#8b98a6' });
          P.dot(circR, gRigid(circR), '#ff8a4c', 4.5);
          P.dot(circR, G_POT, '#56c8f5', 4.5);
          P.dot(R_REF, G_POT, '#e6edf3', 3);
        });
        FV.text(ctx, 58, 18, 'Starrkörper: Γ ∝ r²', { color: '#ff8a4c', font: '12px -apple-system, sans-serif' });
        FV.text(ctx, w - 20, 18, 'Potentialwirbel: Γ = 2πc = const.', { color: '#56c8f5', align: 'right', font: '12px -apple-system, sans-serif' });
      },
      cap: 'Beim gewählten Vergleichsradius r = ' + R_REF.toFixed(2) +
           ' sind beide Wirbel gleich schnell — dort schneiden sich auch die Γ-Kurven.'
    });
    function updCirc() {
      roCirc.set('u1', (OMEGA * circR).toFixed(2));
      roCirc.set('g1', gRigid(circR).toFixed(2));
      roCirc.set('u2', (C / circR).toFixed(2));
      roCirc.set('g2', G_POT.toFixed(2));
      cvCirc.draw();
    }

    root.appendChild(cvCirc);
    root.appendChild(FV.ctrlRow(FV.slider({
      label: 'Radius r der geschlossenen Kurve', min: 0.15, max: 1.4, step: 0.01, value: circR,
      fmt: function (v) { return v.toFixed(2); },
      onInput: function (v) { circR = v; updCirc(); }
    })));
    root.appendChild(roCirc);
    updCirc();

    /* ---------------- Umkehrung ---------------- */

    root.appendChild(FV.section('5 · Die Umkehrung stimmt nicht: Drehung ohne Wirbel'));

    root.appendChild(h('p', { html:
      '„Es gibt keinen Wirbel ohne Rotation“ — mit dem Potentialwirbel als Grenzfall, bei dem die Rotation ' +
      'in der Singularität steckt. Die <strong>Umkehrung gilt nicht</strong>: Es gibt viele Strömungen mit ' +
      'rot u ≠ 0, die gar keinen Wirbel enthalten. Jede 1D-Scherströmung gehört dazu — Grenzschicht, ' +
      'Kanal- und Rohrströmung, Freistrahl, Mischungsschicht (Skript Abb. 10.4).' }));

    var shearT = 0;
    var cvShear = FV.canvas({
      aspect: 0.34, animate: false,
      render: function (ctx, w, hgt) {
        var x0 = 60, y0 = hgt - 26, H = hgt - 60;
        // Wand
        ctx.save();
        ctx.strokeStyle = '#4a5663'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x0 - 12, y0); ctx.lineTo(w - 14, y0); ctx.stroke();
        for (var i = 0; i < 26; i++) {
          var xx = x0 - 12 + i * (w - x0 - 2) / 26;
          ctx.beginPath(); ctx.moveTo(xx, y0); ctx.lineTo(xx - 7, y0 + 7); ctx.stroke();
        }
        ctx.restore();
        FV.text(ctx, 14, 20, 'Parallele Grenzschicht: u = u(y), keine geschlossenen Stromlinien — aber ω = −∂u/∂y ≠ 0',
          { color: '#c8d3de', font: '12px -apple-system, sans-serif' });

        // Profil u(y) = tanh
        var prof = function (yy) { return Math.tanh(3.1 * yy); };   // yy in [0,1]
        ctx.save();
        ctx.strokeStyle = '#56c8f5'; ctx.lineWidth = 2;
        ctx.beginPath();
        for (var k = 0; k <= 40; k++) {
          var yy = k / 40, px = x0 + prof(yy) * 78, py = y0 - yy * H;
          k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.stroke();
        ctx.strokeStyle = 'rgba(86,200,245,.45)'; ctx.lineWidth = 1;
        for (var k2 = 1; k2 <= 8; k2++) {
          var yy2 = k2 / 8, py2 = y0 - yy2 * H;
          FV.arrow(ctx, x0, py2, x0 + prof(yy2) * 78, py2, 'rgba(86,200,245,.6)', 1.3, 5);
        }
        ctx.restore();
        FV.text(ctx, x0 + 84, y0 - H - 4, 'u(y)', { color: '#56c8f5', font: '12px ui-monospace, monospace' });

        // rotierende Schaufelräder, deren Drehrate = ½ω = ½ du/dy
        // Schaufelräder in einer Spalte: die Drehrate ist ½ω = ½ du/dy
        var xPos = w * 0.52;
        for (var m = 0; m < 6; m++) {
          var yy3 = 0.08 + m * 0.175;
          var py3 = y0 - yy3 * H;
          var dudy = 3.1 * (1 - Math.pow(Math.tanh(3.1 * yy3), 2));   // du/dy
          var rot = -0.5 * dudy * shearT;    // ½ω, im Uhrzeigersinn
          drawWheel(ctx, xPos, py3, 15, rot, '#ffd166');
          FV.text(ctx, xPos + 26, py3 + 4, '½ω = ' + (0.5 * dudy).toFixed(2),
            { color: 'rgba(255,209,102,.65)', font: '11px ui-monospace, monospace' });
        }
        FV.text(ctx, w - 16, hgt - 8,
          'Nahe der Wand drehen die Rädchen schnell, aussen kaum — trotzdem ist nirgends ein Wirbel.',
          { color: '#7b8896', align: 'right', font: '11.5px -apple-system, sans-serif' });
      }
    });

    function drawWheel(ctx, x, y, r, ang, color) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      ctx.strokeStyle = color; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
      for (var i = 0; i < 4; i++) {
        var a = i * Math.PI / 2;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); ctx.stroke();
      }
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 0, 2.2, 0, 6.2832); ctx.fill();
      ctx.restore();
    }

    root.appendChild(cvShear);

    /* ---------------- Prüfungsfallen ---------------- */

    root.appendChild(FV.section('6 · Prüfungsfallen'));

    root.appendChild(FV.note('warn', 'Häufig verwechselt',
      '<ul style="margin:0">' +
      '<li><strong>„Geschlossene Stromlinien ⇒ rot u ≠ 0“ — falsch.</strong> Der Potentialwirbel hat ' +
      'geschlossene Stromlinien und ω ≡ 0.</li>' +
      '<li><strong>„rot u ≠ 0 ⇒ es liegt ein Wirbel vor“ — falsch.</strong> Jede Scherströmung ' +
      'widerlegt das (Abschnitt 5).</li>' +
      '<li><strong>ω = Ω — falsch.</strong> Es ist ω = 2Ω. Der Faktor 2 wird ständig vergessen.</li>' +
      '<li><strong>Bernoulli im ganzen Feld</strong> gilt nur beim Potentialwirbel. Im Starrkörperwirbel ' +
      'ist die Bernoulli-Konstante von Stromlinie zu Stromlinie verschieden.</li>' +
      '<li><strong>ω ist Galilei-invariant</strong> — es ändert sich nicht beim Wechsel in ein gleichförmig ' +
      'bewegtes Bezugssystem. Stromlinien dagegen sehen dort völlig anders aus. Ob etwas „wie ein Wirbel ' +
      'aussieht“, hängt also vom Bezugssystem ab; ω nicht.</li>' +
      '<li>Der Potentialwirbel ist <strong>keine reibungsfreie Kuriosität</strong>: er ist wie der ' +
      'Starrkörperwirbel eine exakte Navier-Stokes-Lösung (Taylor-Couette, u<sub>θ</sub> = Ar + B/r).</li>' +
      '</ul>'));

    /* ---------------- Animationsschleife ---------------- */

    var prev = null;
    FV.loop(function (t) {
      if (prev === null) prev = t;
      var dt = Math.min(t - prev, 0.05); prev = t;
      if (st.running) { st.t += dt * st.speed; shearT += dt * 0.9; }

      // Element zurücksetzen, bevor die Scherung unleserlich wird
      var spread = Math.abs(omBahn('potential', ELEM_R - ELEM_D) - omBahn('potential', ELEM_R + ELEM_D));
      if (spread * (st.t - elemT0) > 1.1) elemT0 = st.t;

      cvRigid.draw(); cvPot.draw(); cvShear.draw();

      // Drehraten der beiden materiellen Linien im Potentialwirbel, in °/s
      // tangentiale Linie: dreht mit uθ/r = c/r²
      // radiale Linie:     dreht mit d(uθ/r)/dr · r + uθ/r = -c/r²
      var r = ELEM_R;
      var wTan = C / (r * r);
      var wRad = -C / (r * r);
      var deg = 180 / Math.PI * st.speed;
      roLive.set('rot1', (wRad * deg).toFixed(1) + ' °/s');
      roLive.set('rot2', (wTan * deg).toFixed(1) + ' °/s');
      roLive.set('mean', '0.0 °/s');
    });
  }
});
