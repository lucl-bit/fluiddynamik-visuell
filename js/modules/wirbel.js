/* ============================================================
   Die vier Modellwirbel: Starrkörper, Potential, Rankine, Hill
   —  Skript Kap. 10.1, S. 79–81, Abb. 10.1–10.3
   ============================================================ */

FV.register({
  id: 'wirbel',
  chapter: 'Drehungsbehaftete Strömungen',
  chapterNo: '10.1',
  title: 'Die vier Modellwirbel',
  subtitle: 'Starrkörper, Potential, Rankine, Hill — dieselben Kreisbahnen, völlig verschiedene Eigendrehung.',
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

    /* ===== Physik: Rankine-Wirbel und Hillscher Kugelwirbel =====
       Reine Funktionen ohne Modulzustand. verify.js schneidet genau diesen
       Block aus der Datei heraus und rechnet ihn gegen die geschlossenen
       Formeln nach — deshalb darf hier nichts stehen, was FV oder st braucht. */

    /* --- Rankine: Starrkörperkern (r ≤ r0) + Potentialwirbel (r > r0) ---
       OM ist die Winkelgeschwindigkeit des Kerns; der Anschluss bei r0 ist
       stetig, weil c = OM·r0² gewählt wird. */
    function rkU(r, r0, OM) { return r <= r0 ? OM * r : OM * r0 * r0 / r; }
    function rkOm(r, r0, OM) { return r < r0 ? 2 * OM : 0; }
    function rkGam(r, r0, OM) { return 2 * Math.PI * r * rkU(r, r0, OM); }

    // Druck aus dem radialen Gleichgewicht dp/dr = ρ uθ²/r, mit ρ = 1 und p(∞) = 0
    function rkP(r, r0, OM) {
      return r >= r0 ? -0.5 * OM * OM * Math.pow(r0, 4) / (r * r)
                     : OM * OM * (0.5 * r * r - r0 * r0);
    }
    // Bernoulli-Konstante p + ½ρu² — aussen konstant, im Kern nicht
    function rkH(r, r0, OM) { var u = rkU(r, r0, OM); return rkP(r, r0, OM) + 0.5 * u * u; }

    /* --- Hillscher Kugelwirbel ---
       Bezugssystem „Kugel ruht“: Anströmung U in +z, Kugelradius a.
       Stokes-Stromfunktion ψ(r,θ) mit u_r = ψ_θ/(r² sinθ), u_θ = −ψ_r/(r sinθ). */
    function hillPsi(r, th, U, a) {
      var s2 = Math.pow(Math.sin(th), 2);
      return r <= a ? 0.75 * U * s2 * (r * r * r * r / (a * a) - r * r)
                    : 0.50 * U * s2 * (r * r - a * a * a / r);
    }
    function hillVel(r, th, U, a) {          // [u_r, u_θ]
      var c = Math.cos(th), s = Math.sin(th);
      if (r <= a) return [1.5 * U * c * (r * r / (a * a) - 1),
                          -1.5 * U * s * (2 * r * r / (a * a) - 1)];
      var q = a * a * a / (r * r * r);
      return [U * c * (1 - q), -U * s * (1 + 0.5 * q)];
    }
    // ω hat nur eine φ-Komponente und ist proportional zum Achsabstand ρ = r sinθ
    function hillOm(r, th, U, a) { return r <= a ? -7.5 * U / (a * a) * r * Math.sin(th) : 0; }

    // Laborsystem: u_lab = u − U·e_z, damit ruht das Fluid im Unendlichen
    function hillPsiLab(r, th, U, a) {
      return hillPsi(r, th, U, a) - 0.5 * U * r * r * Math.pow(Math.sin(th), 2);
    }
    function hillVelLab(r, th, U, a) {
      var v = hillVel(r, th, U, a);
      return [v[0] - U * Math.cos(th), v[1] + U * Math.sin(th)];
    }
    // Meridianebene kartesisch: (ρ, z) → [u_ρ, u_z]
    function hillUxz(rho, z, U, a, lab) {
      var r = Math.hypot(rho, z);
      if (r < 1e-9) r = 1e-9;
      var th = Math.atan2(Math.abs(rho), z);
      var v = lab ? hillVelLab(r, th, U, a) : hillVel(r, th, U, a);
      var s = Math.sin(th), c = Math.cos(th);
      return [v[0] * s + v[1] * c, v[0] * c - v[1] * s];
    }
    function hillPsiXZ(rho, z, U, a, lab) {
      var r = Math.hypot(rho, z), th = Math.atan2(Math.abs(rho), z);
      return lab ? hillPsiLab(r, th, U, a) : hillPsi(r, th, U, a);
    }
    // Zirkulation des ganzen Wirbels: Γ = ∫∫ ω dA über den Meridian-Halbkreis
    function hillGam(U, a) { return 5 * U * a; }
    // Radius des Wirbelkern-Rings in der Äquatorebene (dort ist u = 0)
    function hillCore(a) { return a / Math.SQRT2; }

    /* ===== Ende Physik ===== */

    /* ---------------- Intro ---------------- */

    root.appendChild(FV.note('', 'Worum es geht',
      'Ein <strong>Wirbel</strong> ist umgangssprachlich definiert: ein ausgedehnter Bereich von ' +
      'Fluidteilchen, die um ein gemeinsames Zentrum laufen — in der ebenen, stationären Strömung ' +
      'also <em>geschlossene Stromlinien</em>. Das sagt aber nichts darüber, ob sich die Teilchen selbst ' +
      '<strong>drehen</strong>. Genau darin unterscheiden sich die beiden Grundmodelle: die Bahnen sind ' +
      'in beiden Fällen Kreise, die <em>Drehung</em> des Teilchens ist völlig verschieden. ' +
      'Aus ihnen werden anschliessend die beiden realistischen Modelle zusammengesetzt: der ' +
      '<strong>Rankine-Wirbel</strong> (Abschnitt 3–5) und, als räumliches Gegenstück, der ' +
      '<strong>Hillsche Kugelwirbel</strong> (Abschnitt 7).'));

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
    var sldProfR0 = FV.slider({
      label: 'Kernradius r₀ des Rankine-Wirbels', min: 0.15, max: 0.9, step: 0.01, value: st.r0,
      fmt: function (v) { return v.toFixed(2); },
      onInput: function (v) { setR0(v, 'prof'); }
    });
    root.appendChild(FV.ctrlRow(sldProfR0));

    root.appendChild(FV.legend([
      { c: '#ff8a4c', t: 'Rankine, Starrkörperkern (r ≤ r₀)' },
      { c: '#56c8f5', t: 'Rankine, Potentialwirbel aussen (r > r₀)' },
      { c: '#8b98a6', t: 'realer Wirbel (geglättet, Hamel-Oseen)' },
      { c: '#4a5663', t: 'reine Modelle unbegrenzt fortgesetzt' }
    ]));

    /* ---------------- Rankine im Feld ---------------- */

    root.appendChild(FV.section('4 · Der Rankine-Wirbel im Feld'));

    root.appendChild(h('p', { html:
      'Dieselbe Animation wie in Abschnitt 1, jetzt aber mit dem <strong>zusammengesetzten</strong> Feld. ' +
      'Der Kernradius r<sub>0</sub> ist verschiebbar — beobachte, was mit einem Teilchen passiert, das ' +
      'vom Aussenbereich in den Kern gerät: es fängt an, sich zu drehen. Nichts an seiner Bahn ändert ' +
      'sich dabei, nur seine <em>Eigendrehung</em>. Genau das ist der Unterschied zwischen ω = 0 und ω = 2Ω.' }));

    var RK_RADII = [0.16, 0.29, 0.42, 0.55, 0.70, 0.86];
    var rkSeeds = [];
    RK_RADII.forEach(function (r, i) {
      for (var k = 0; k < 3; k++) rkSeeds.push({ r: r, th0: k * 2.0944 + i * 0.4 });
    });

    var cvRank = FV.canvas({
      aspect: 0.6,
      render: function (ctx, w, hgt) {
        var wide = w > 560;
        var cx = wide ? w * 0.40 : w / 2, cy = hgt / 2 + 6;
        var R = hgt / 2 - 34;
        var r0 = st.r0;
        var P = function (r, th) { return [cx + R * r * Math.cos(th), cy - R * r * Math.sin(th)]; };

        FV.text(ctx, 12, 20, 'Rankine-Wirbel  uθ = Ω r  |  Ω r0²/r',
          { color: '#e6edf3', font: '13px ui-monospace, monospace' });
        FV.text(ctx, 12, 38, 'die gesamte Wirbelstärke steckt im Kern',
          { color: '#7b8896', font: '11.5px ui-monospace, monospace' });

        // Kernfläche: dort und nur dort ist ω = 2Ω
        ctx.save();
        ctx.fillStyle = 'rgba(255,138,76,.13)';
        ctx.beginPath(); ctx.arc(cx, cy, R * r0, 0, 6.2832); ctx.fill();
        ctx.strokeStyle = 'rgba(255,138,76,.75)'; ctx.lineWidth = 1.4;
        ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.arc(cx, cy, R * r0, 0, 6.2832); ctx.stroke();
        ctx.restore();

        // Stromlinien — Kreise, in beiden Bereichen
        ctx.save();
        ctx.strokeStyle = '#1c242e'; ctx.lineWidth = 1;
        RK_RADII.forEach(function (r) {
          ctx.beginPath(); ctx.arc(cx, cy, R * r, 0, 6.2832); ctx.stroke();
        });
        ctx.restore();

        // uθ entlang eines Strahls: der Knick bei r0 wird sichtbar
        if (st.showVectors) {
          var ang = -Math.PI / 2;
          var uMax = OMEGA * r0;
          for (var q = 0.10; q < 1.02; q += 0.09) {
            var p = P(q, ang);
            var len = rkU(q, r0, OMEGA) / Math.max(uMax, 1e-6) * R * 0.20;
            FV.arrow(ctx, p[0], p[1], p[0] - len, p[1], q <= r0 ? 'rgba(255,138,76,.85)' : 'rgba(86,200,245,.85)', 1.6, 6);
          }
          FV.text(ctx, cx - 6, cy + R * 1.03 + 15, 'uθ(r)  — Maximum genau bei r0',
            { color: '#7b8896', align: 'center', font: '11px ui-monospace, monospace' });
        }

        // Fluidteilchen: Farbe und Eigendrehung folgen dem Bereich, in dem sie liegen
        rkSeeds.forEach(function (s) {
          var inCore = s.r <= r0;
          var col = inCore ? '#ff8a4c' : '#56c8f5';
          var th = s.th0 + rkU(s.r, r0, OMEGA) / s.r * st.t;
          var p = P(s.r, th);
          var phi = 0.5 * rkOm(s.r, r0, OMEGA) * st.t;
          rkParticle(ctx, p[0], p[1], phi, col, st.showMarker);
        });

        // Mittelpunkt
        ctx.save(); ctx.fillStyle = '#3a4552';
        ctx.beginPath(); ctx.arc(cx, cy, 3, 0, 6.2832); ctx.fill(); ctx.restore();

        // r0-Markierung am Rand des Kerns
        FV.text(ctx, cx + R * r0 * 0.71 + 4, cy - R * r0 * 0.71 - 4, 'r0',
          { color: '#ffb388', font: '12px ui-monospace, monospace' });

        if (!wide) return;

        // Seitentext: was in welchem Bereich gilt
        var tx = cx + R + 26, ty = cy - R + 24;
        function line(txt, col, dy, font) {
          FV.text(ctx, tx, ty, txt, { color: col, font: font || '12px -apple-system, sans-serif' });
          ty += dy;
        }
        line('Kern   r ≤ r0', '#ff8a4c', 20, '13px ui-monospace, monospace');
        line('uθ = Ω r  — innen langsam', '#9aa7b4', 17);
        line('ω = 2Ω  — Teilchen dreht mit', '#9aa7b4', 17);
        line('rotiert wie eine feste Scheibe', '#6e7d8c', 30);
        line('Aussen   r > r0', '#56c8f5', 20, '13px ui-monospace, monospace');
        line('uθ = Ω r0²/ r  — nach aussen träge', '#9aa7b4', 17);
        line('ω = 0  — Orientierung bleibt', '#9aa7b4', 17);
        line('Γ = 2π Ω r0² unabhängig von r', '#6e7d8c', 28);
        line('Beide Bereiche sind je für sich', '#6e7d8c', 15, '11.5px -apple-system, sans-serif');
        line('exakte Navier-Stokes-Lösungen', '#6e7d8c', 15, '11.5px -apple-system, sans-serif');
        line('(Taylor-Couette, uθ = Ar + B/r).', '#6e7d8c', 15, '11.5px -apple-system, sans-serif');
      },
      cap: 'Der Rankine-Wirbel ist das Standardmodell für Tornado, Randwirbel und Badewannenwirbel: ' +
           'ein drehender Kern, aussen ein drehungsfreies Feld.'
    });

    // eigener Teilchenzeichner — dieselbe Optik wie in Abschnitt 1
    function rkParticle(ctx, x, y, phi, color, marker) {
      var s = 8;
      ctx.save();
      ctx.translate(x, y); ctx.rotate(-phi);
      ctx.fillStyle = color; ctx.globalAlpha = 0.9;
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

    root.appendChild(cvRank);

    var sldRankR0 = FV.slider({
      label: 'Kernradius r₀', min: 0.15, max: 0.9, step: 0.01, value: st.r0,
      fmt: function (v) { return v.toFixed(2); },
      onInput: function (v) { setR0(v, 'rank'); }
    });
    root.appendChild(FV.ctrlRow(sldRankR0));

    root.appendChild(FV.legend([
      { c: '#ff8a4c', t: 'Teilchen im Kern — dreht sich mit Ω' },
      { c: '#56c8f5', t: 'Teilchen aussen — behält seine Orientierung' },
      { c: 'rgba(255,138,76,.35)', t: 'Fläche mit ω ≠ 0' }
    ]));

    var roRank = FV.readout([
      { key: 'om', lab: 'ω im Kern', cls: 'c1' },
      { key: 'umax', lab: 'u<sub>θ,max</sub> = Ω r₀', cls: 'c1' },
      { key: 'gam', lab: 'Γ aussen = 2π Ω r₀²', cls: 'c2' },
      { key: 'dp', lab: 'Δp auf der Achse', cls: 'c3' }
    ]);
    root.appendChild(roRank);

    function updRank() {
      var r0 = st.r0;
      roRank.set('om', (2 * OMEGA).toFixed(2));
      roRank.set('umax', (OMEGA * r0).toFixed(3));
      roRank.set('gam', rkGam(r0 * 1.0001, r0, OMEGA).toFixed(3));
      roRank.set('dp', rkP(0, r0, OMEGA).toFixed(3));
    }

    // Der Kernradius steuert Profil, Feldbild und Druckkurve gemeinsam.
    // syncing verhindert, dass sich die beiden Schieber gegenseitig aufschaukeln.
    var syncing = false;
    function setR0(v, from) {
      st.r0 = v;
      if (!syncing) {
        syncing = true;
        if (from !== 'prof' && sldProfR0) sldProfR0.set(v);
        if (from !== 'rank' && sldRankR0) sldRankR0.set(v);
        syncing = false;
      }
      cvProf.draw(); cvRank.draw(); cvPres.draw(); cvCirc.draw();
      updRank(); updPres(); updCirc();
    }

    /* ---------------- Druck und Trichter ---------------- */

    root.appendChild(FV.section('5 · Warum der Tornado einen Trichter hat'));

    root.appendChild(h('p', { html:
      'Damit ein Fluidteilchen auf seiner Kreisbahn bleibt, muss der Druck nach aussen zunehmen: ' +
      '∂p/∂r = ρ u<sub>θ</sub>²/ r. Integriert man das durch den Rankine-Wirbel, ergibt sich eine ' +
      '<strong>Druckdelle</strong> im Zentrum — und wenn oben eine freie Oberfläche liegt, wird daraus ' +
      'genau der sichtbare Trichter des Tornados oder des Badewannenwirbels.' }));

    root.appendChild(FV.eq(
      'r &gt; r<sub>0</sub>: &nbsp; p = p<sub>∞</sub> − <span class="frac"><span>ρ Ω² r<sub>0</sub>⁴</span>' +
      '<span class="den">2 r²</span></span> &nbsp;&nbsp;&nbsp;&nbsp; ' +
      'r ≤ r<sub>0</sub>: &nbsp; p = p<sub>∞</sub> − ρ Ω² r<sub>0</sub>² + <span class="frac">' +
      '<span>ρ Ω² r²</span><span class="den">2</span></span>',
      'Die Absenkung auf der Achse ist doppelt so gross wie am Kernrand: Δp(0) = 2 · Δp(r₀)'));

    var cvPres = FV.canvas({
      aspect: 0.44,
      render: function (ctx, w, hgt) {
        var half = w / 2 - 8;
        drawPres(ctx, 0, 0, half, hgt);
        drawFunnel(ctx, half + 16, 0, half, hgt);
      },
      cap: 'Links der Druck und die Bernoulli-Konstante, rechts die freie Oberfläche eines rotierenden ' +
           'Wasserkörpers — sie folgt der Druckkurve, weil an ihr überall Umgebungsdruck herrscht.'
    });

    function drawPres(ctx, ox, oy, w, hgt) {
      ctx.save(); ctx.translate(ox, oy);
      var r0 = st.r0;
      // Normierung: alle Drücke durch ρ Ω² r0² — dann ist p(0) = −1 unabhängig von r0
      var nrm = 1 / (OMEGA * OMEGA * r0 * r0);
      var P = FV.plot(ctx, {
        w: w, h: hgt, x: [0, 2.2], y: [-1.25, 0.6],
        pad: { l: 46, r: 12, t: 26, b: 32 },
        xticks: [0, 0.5, 1, 1.5, 2], yticks: [-1, -0.5, 0, 0.5],
        xlabel: 'r', ylabel: '(p − p∞) / ρΩ²r₀²'
      });
      P.grid(); P.axes();
      P.clip(function () {
        P.poly(sample(0, r0, function (r) { return rkP(r, r0, OMEGA) * nrm; }),
          { color: '#ff8a4c', width: 2.6 });
        P.poly(sample(r0, 2.2, function (r) { return rkP(r, r0, OMEGA) * nrm; }),
          { color: '#56c8f5', width: 2.6 });
        // Bernoulli-Konstante: aussen flach auf null, im Kern nicht
        P.poly(sample(0, r0, function (r) { return rkH(r, r0, OMEGA) * nrm; }),
          { color: '#a78bfa', width: 2.0, dash: [5, 4] });
        P.poly([[r0, 0], [2.2, 0]], { color: '#a78bfa', width: 2.0, dash: [5, 4] });
        P.vline(r0, { color: '#556170', dash: [3, 3] });
        P.dot(0, -1, '#ff8a4c', 4);
        P.dot(r0, -0.5, '#ffffff', 3.5);
      });
      P.label(r0 + 0.06, -0.46, 'p(r₀) = −½', '#c8d3de');
      P.label(0.06, -1.06, 'p(0) = −1', '#ff8a4c');
      P.label(1.35, 0.16, 'Bernoulli-Konstante H', '#a78bfa');
      FV.text(ctx, 46, 16, 'Druck p(r) und H = p + ½ρu²',
        { color: '#c8d3de', font: '12.5px -apple-system, sans-serif' });
      ctx.restore();
    }

    function drawFunnel(ctx, ox, oy, w, hgt) {
      ctx.save(); ctx.translate(ox, oy);
      var r0 = st.r0;
      var nrm = 1 / (OMEGA * OMEGA * r0 * r0);
      var x0 = 34, x1 = w - 14, ySurf = 52, depth = hgt * 0.46;
      var cx = (x0 + x1) / 2, sc = (x1 - x0) / 2 / 2.2;   // r bis 2.2 nach beiden Seiten
      function X(r) { return cx + r * sc; }
      function Y(p) { return ySurf - p * depth; }          // p ist negativ → nach unten

      // Wasserkörper
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x0, hgt - 14);
      for (var i = 0; i <= 160; i++) {
        var r = -2.2 + 4.4 * i / 160;
        ctx.lineTo(X(r), Y(rkP(Math.abs(r), r0, OMEGA) * nrm));
      }
      ctx.lineTo(x1, hgt - 14);
      ctx.closePath();
      ctx.fillStyle = 'rgba(86,200,245,.13)'; ctx.fill();
      ctx.restore();

      // Kernbereich nur markieren, nicht füllen
      ctx.save();
      ctx.strokeStyle = 'rgba(255,138,76,.45)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      [-r0, r0].forEach(function (rr) {
        ctx.beginPath(); ctx.moveTo(X(rr), 34); ctx.lineTo(X(rr), hgt - 16); ctx.stroke();
      });
      ctx.restore();

      // Oberfläche
      ctx.save();
      ctx.lineWidth = 2.4; ctx.lineJoin = 'round';
      ['core', 'outer'].forEach(function (part) {
        ctx.strokeStyle = part === 'core' ? '#ff8a4c' : '#56c8f5';
        ctx.beginPath();
        var started = false;
        for (var i = 0; i <= 200; i++) {
          var r = -2.2 + 4.4 * i / 200, ar = Math.abs(r);
          var inCore = ar <= r0;
          if ((part === 'core') !== inCore) { started = false; continue; }
          var px = X(r), py = Y(rkP(ar, r0, OMEGA) * nrm);
          started ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
          started = true;
        }
        ctx.stroke();
      });
      ctx.restore();

      // Bezugsniveau p = p∞
      ctx.save();
      ctx.strokeStyle = '#3a4552'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(x0, ySurf); ctx.lineTo(x1, ySurf); ctx.stroke();
      ctx.restore();

      // Tiefenmasse
      ctx.save();
      ctx.strokeStyle = '#6e7d8c'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx, ySurf); ctx.lineTo(cx, Y(-1)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X(r0), ySurf); ctx.lineTo(X(r0), Y(-0.5)); ctx.stroke();
      ctx.restore();

      FV.text(ctx, 14, 16, 'freie Oberfläche: der Trichter',
        { color: '#c8d3de', font: '12.5px -apple-system, sans-serif' });
      FV.text(ctx, x1, ySurf - 6, 'p = p∞', { color: '#6e7d8c', align: 'right', font: '11px ui-monospace, monospace' });
      FV.text(ctx, cx + 8, (ySurf + Y(-1)) / 2, 'doppelt so tief', { color: '#ffb388', font: '11px -apple-system, sans-serif' });
      FV.text(ctx, X(r0) + 6, ySurf + 14, 'r₀', { color: '#ffb388', font: '11px ui-monospace, monospace' });
      FV.text(ctx, X(-r0) - 6, ySurf + 14, 'r₀', { color: '#ffb388', align: 'right', font: '11px ui-monospace, monospace' });
      FV.text(ctx, x1, hgt - 4, 'r →', { color: '#6e7d8c', align: 'right', font: '11px ui-monospace, monospace' });
      ctx.restore();
    }

    root.appendChild(cvPres);

    var roPres = FV.readout([
      { key: 'p0', lab: 'Δp auf der Achse', cls: 'c1' },
      { key: 'pr0', lab: 'Δp am Kernrand r₀', cls: 'c2' },
      { key: 'rat', lab: 'Verhältnis', cls: 'c3' },
      { key: 'hcore', lab: 'H(0) − H(r₀)', cls: 'c3' }
    ]);
    root.appendChild(roPres);

    function updPres() {
      var r0 = st.r0;
      roPres.set('p0', rkP(0, r0, OMEGA).toFixed(3));
      roPres.set('pr0', rkP(r0, r0, OMEGA).toFixed(3));
      roPres.set('rat', (rkP(0, r0, OMEGA) / rkP(r0, r0, OMEGA)).toFixed(2) + ' ×');
      roPres.set('hcore', (rkH(0, r0, OMEGA) - rkH(r0, r0, OMEGA)).toFixed(3));
    }

    root.appendChild(FV.note('key', 'Was die violette Linie sagt',
      'H = p + ½ρu² ist die <strong>Bernoulli-Konstante</strong>. Im Aussenbereich ist sie über das ' +
      'ganze Feld gleich — dort ist die Strömung drehungsfrei, und Bernoulli darf quer über Stromlinien ' +
      'hinweg angewendet werden. Im Kern fällt H zur Achse hin ab: dort gilt Bernoulli <em>nur längs ' +
      'einer Stromlinie</em>, und wer die Konstante von aussen nach innen mitnimmt, rechnet falsch. ' +
      'Genau diese Unterscheidung ist die Prüfungsfalle bei ω ≠ 0.'));

    updRank(); updPres();

    /* ---------------- Zirkulation ---------------- */

    root.appendChild(FV.section('6 · Zirkulation: warum Γ ≠ 0 trotz ω = 0'));

    root.appendChild(h('p', { html:
      'Der Satz von Stokes sagt: Γ<sub>C</sub> = ∮<sub>C</sub> u·ds = ∫∫<sub>A</sub> ω·dA. Beim Potentialwirbel ' +
      'ist ω ≡ 0 — und trotzdem ist Γ = 2πc auf <em>jedem</em> Kreis um den Ursprung. Kein Widerspruch: ' +
      'die eingeschlossene Fläche enthält die Singularität bei r = 0, in der die gesamte Rotation ' +
      'konzentriert ist. Umschliesst die Kurve den Ursprung <strong>nicht</strong>, ist Γ = 0.' }));

    root.appendChild(h('p', { html:
      'Der <strong>Rankine-Wirbel</strong> zeigt beide Verhaltensweisen nacheinander: solange die Kurve ' +
      'noch im Kern liegt, sammelt sie mit jedem Stück Fläche zusätzliche Wirbelstärke ein und Γ wächst ' +
      'wie r². Sobald sie den Kern ganz umschliesst, ist alles ω eingefangen — von da an bleibt Γ ' +
      'konstant bei 2π Ω r₀², egal wie weit man hinausgeht. Das ist der Satz von Stokes in einem Bild.' }));

    var roCirc = FV.readout([
      { key: 'u1', lab: 'uθ Starrkörper', cls: 'c1' },
      { key: 'g1', lab: 'Γ Starrkörper', cls: 'c1' },
      { key: 'u2', lab: 'uθ Potentialwirbel', cls: 'c2' },
      { key: 'g2', lab: 'Γ Potentialwirbel', cls: 'c2' },
      { key: 'u3', lab: 'uθ Rankine', cls: 'c3' },
      { key: 'g3', lab: 'Γ Rankine', cls: 'c3' }
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
          // Rankine: erst wie der Starrkörper, ab r0 wie der Potentialwirbel
          P.poly(sample(0, st.r0, function (r) { return rkGam(r, st.r0, OMEGA); }),
            { color: '#ffd166', width: 2.4 });
          P.poly(sample(st.r0, 1.5, function (r) { return rkGam(r, st.r0, OMEGA); }),
            { color: '#ffd166', width: 2.4 });
          P.vline(st.r0, { color: '#556170', dash: [3, 3] });
          P.vline(circR, { color: '#8b98a6' });
          P.dot(circR, gRigid(circR), '#ff8a4c', 4.5);
          P.dot(circR, G_POT, '#56c8f5', 4.5);
          P.dot(circR, rkGam(circR, st.r0, OMEGA), '#ffd166', 4.5);
          P.dot(R_REF, G_POT, '#e6edf3', 3);
        });
        FV.text(ctx, 58, 18, 'Starrkörper: Γ ∝ r²', { color: '#ff8a4c', font: '12px -apple-system, sans-serif' });
        FV.text(ctx, w - 20, 18, 'Potentialwirbel: Γ = 2πc = const.', { color: '#56c8f5', align: 'right', font: '12px -apple-system, sans-serif' });
        FV.text(ctx, w / 2, hgt - 46, 'Rankine: erst ∝ r², ab r₀ konstant',
          { color: '#ffd166', align: 'center', font: '12px -apple-system, sans-serif' });
      },
      cap: 'Beim gewählten Vergleichsradius r = ' + R_REF.toFixed(2) +
           ' sind beide Wirbel gleich schnell — dort schneiden sich auch die Γ-Kurven.'
    });
    function updCirc() {
      roCirc.set('u1', (OMEGA * circR).toFixed(2));
      roCirc.set('g1', gRigid(circR).toFixed(2));
      roCirc.set('u2', (C / circR).toFixed(2));
      roCirc.set('g2', G_POT.toFixed(2));
      roCirc.set('u3', rkU(circR, st.r0, OMEGA).toFixed(2));
      roCirc.set('g3', rkGam(circR, st.r0, OMEGA).toFixed(2));
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

    /* ---------------- Hillscher Kugelwirbel ---------------- */

    root.appendChild(FV.section('7 · Der Hillsche Kugelwirbel'));

    root.appendChild(h('p', { html:
      'Starrkörper-, Potential- und Rankine-Wirbel sind <strong>eben</strong>: gerade Wirbellinien, ' +
      'überall dasselbe Bild. Der <strong>Hillsche Kugelwirbel</strong> ist der einfachste ' +
      'räumliche Wirbel — ein Kugelvolumen, in dem die Wirbelstärke sitzt, und aussen herum ' +
      'exakt die Potentialströmung um eine Kugel. Er beschreibt die Strömung in einem fallenden ' +
      'Tropfen und in einer aufsteigenden Gasblase (Skript S. 81, nach Panton).' }));

    root.appendChild(FV.eq(
      '<div style="display:flex;gap:34px;justify-content:center;flex-wrap:wrap">' +
      '<div><span style="color:var(--c1)">innen &nbsp;r ≤ a</span><br><br>' +
      'ψ = <span class="frac"><span>3</span><span class="den">4</span></span> U sin²θ ' +
      '( <span class="frac"><span>r⁴</span><span class="den">a²</span></span> − r² )</div>' +
      '<div><span style="color:var(--c2)">aussen &nbsp;r &gt; a</span><br><br>' +
      'ψ = <span class="frac"><span>1</span><span class="den">2</span></span> U sin²θ ' +
      '( r² − <span class="frac"><span>a³</span><span class="den">r</span></span> )</div>' +
      '</div>',
      'Stokes-Stromfunktion; u_r = ψ_θ /(r² sinθ), u_θ = −ψ_r /(r sinθ). Auf r = a ist ψ = 0 — ' +
      'die Kugeloberfläche ist selbst eine Stromfläche.'));

    /* --- Zustand und Feldkonstanten --- */
    var A_H = 1.0, U_H = 1.0;
    var Z_HALF = 2.7, RHO_MAX = 1.45;
    var hl = {
      lab: false, run: true, speed: 0.55, showOm: false, showPsi: true, showPart: true,
      t: 0, zc: 0, parts: [], cont: null, contLab: null
    };

    /* --- Konturlinien (Marching Squares) ---
       Ein einziges Gitter, alle Niveaus daraus: die Auswertung von ψ ist der
       teure Teil, das Nachzeichnen nicht. Wird nur bei Moduswechsel neu gebaut. */
    function contours(f, x0, x1, y0, y1, nx, ny, levels) {
      var g = [], i, j, dx = (x1 - x0) / nx, dy = (y1 - y0) / ny;
      for (j = 0; j <= ny; j++) {
        var row = [];
        for (i = 0; i <= nx; i++) row.push(f(x0 + i * dx, y0 + j * dy));
        g.push(row);
      }
      return levels.map(function (lev) {
        var segs = [];
        for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) {
          var xA = x0 + i * dx, yA = y0 + j * dy, xB = xA + dx, yB = yA + dy;
          var q = [[xA, yA], [xB, yA], [xB, yB], [xA, yB]];
          var v = [g[j][i], g[j][i + 1], g[j + 1][i + 1], g[j + 1][i]];
          var pts = [];
          for (var k = 0; k < 4; k++) {
            var k2 = (k + 1) & 3;
            if ((v[k] > lev) !== (v[k2] > lev)) {
              var t = (lev - v[k]) / (v[k2] - v[k]);
              pts.push([q[k][0] + (q[k2][0] - q[k][0]) * t,
                        q[k][1] + (q[k2][1] - q[k][1]) * t]);
            }
          }
          if (pts.length >= 2) {
            segs.push(pts[0], pts[1]);
            if (pts.length === 4) segs.push(pts[2], pts[3]);
          }
        }
        return segs;
      });
    }

    // Niveaus: innen dicht genug, damit der Wirbelkern erkennbar wird
    var LEV_MOVE = [-0.178, -0.155, -0.125, -0.09, -0.055, -0.022, -0.005,
                    0.02, 0.07, 0.15, 0.26, 0.41, 0.60, 0.83, 1.10];
    var LEV_LAB = [-0.435, -0.415, -0.385, -0.345, -0.30, -0.25, -0.20,
                   -0.15, -0.105, -0.065, -0.032, -0.011, -0.003];

    // Ein Bild enthält einige tausend Segmente. Einzeln gestrichen kostet das
    // pro Frame mehr als alles andere zusammen, deshalb werden sie hier einmal
    // nach innen/aussen sortiert und später in genau zwei Pfaden gezeichnet.
    function hillContours(lab) {
      var cc = contours(function (z, rho) { return hillPsiXZ(rho, z, U_H, A_H, lab); },
        -Z_HALF, Z_HALF, 0, RHO_MAX, 150, 46, lab ? LEV_LAB : LEV_MOVE);
      var inn = [], out = [];
      cc.forEach(function (segs) {
        for (var i = 0; i < segs.length; i += 2) {
          var p = segs[i], q = segs[i + 1];
          var d = Math.hypot((p[0] + q[0]) / 2, (p[1] + q[1]) / 2) < A_H ? inn : out;
          d.push(p[0], p[1], q[0], q[1]);
        }
      });
      return { inn: inn, out: out };
    }

    /* --- Partikel --- */
    function hillSeed(p) {
      p.rho = Math.sqrt(Math.random()) * RHO_MAX;     // flächengleich verteilt
      p.z = -Z_HALF + Math.random() * 2 * Z_HALF;
      p.tr = [];
      return p;
    }
    function hillSeedInlet(p) {
      p.rho = Math.sqrt(Math.random()) * RHO_MAX;
      p.z = -Z_HALF + Math.random() * 0.12;
      p.tr = [];
      return p;
    }
    function hillReset() {
      hl.parts = [];
      for (var i = 0; i < 260; i++) hl.parts.push(hillSeed({}));
    }
    hillReset();

    function hillStep(p, dt) {
      var v = hillUxz(p.rho, p.z - hl.zc, U_H, A_H, hl.lab);
      var rm = p.rho + v[0] * dt * 0.5, zm = p.z + v[1] * dt * 0.5;
      var v2 = hillUxz(rm, zm - hl.zc, U_H, A_H, hl.lab);
      p.rho += v2[0] * dt; p.z += v2[1] * dt;
      if (p.rho < 0) p.rho = -p.rho;                  // Spiegelung an der Achse
      p.tr.push([p.z, p.rho]);
      if (p.tr.length > 7) p.tr.shift();
      if (p.z > Z_HALF || p.z < -Z_HALF || p.rho > RHO_MAX) {
        hl.lab ? hillSeed(p) : hillSeedInlet(p);
      }
    }

    var cvHill = FV.canvas({
      aspect: 0.5,
      render: function (ctx, w, hgt) {
        var sc = w / (2 * Z_HALF);
        var cy = hgt / 2, zc = hl.zc;
        var narrow = w < 560;      // schmales Fenster: nur die Kernaussagen beschriften
        function X(z) { return w / 2 + sc * z; }
        function Y(rho) { return cy - sc * rho; }

        // Wirbelstärke: |ω| ∝ Achsabstand ρ, nur im Kugelinneren
        if (hl.showOm) {
          ctx.save();
          ctx.beginPath(); ctx.arc(X(zc), cy, sc * A_H, 0, 6.2832); ctx.clip();
          var nb = 30;
          for (var b = 0; b < nb; b++) {
            var rr = (b + 0.5) / nb * A_H;
            var al = 0.42 * rr / A_H;
            ctx.fillStyle = 'rgba(167,139,250,' + al.toFixed(3) + ')';
            ctx.fillRect(X(zc - A_H), Y(rr + A_H / nb / 2), sc * 2 * A_H, sc * A_H / nb);
            ctx.fillRect(X(zc - A_H), Y(-rr + A_H / nb / 2), sc * 2 * A_H, sc * A_H / nb);
          }
          ctx.restore();
        }

        // Stromlinien als ψ-Niveaulinien
        if (hl.showPsi) {
          var cc = hl.lab ? (hl.contLab || (hl.contLab = hillContours(true)))
                          : (hl.cont || (hl.cont = hillContours(false)));
          ctx.save(); ctx.lineWidth = 1.25;
          [[cc.inn, 'rgba(255,138,76,.62)'], [cc.out, 'rgba(86,200,245,.42)']].forEach(function (grp) {
            var d = grp[0];
            ctx.strokeStyle = grp[1];
            ctx.beginPath();
            for (var i = 0; i < d.length; i += 4) {
              var xa = X(zc + d[i]), xb = X(zc + d[i + 2]);
              ctx.moveTo(xa, Y(d[i + 1])); ctx.lineTo(xb, Y(d[i + 3]));
              ctx.moveTo(xa, Y(-d[i + 1])); ctx.lineTo(xb, Y(-d[i + 3]));
            }
            ctx.stroke();
          });
          ctx.restore();
        }

        // Kugelrand — Stromfläche, kein Teilchen geht hindurch
        ctx.save();
        ctx.strokeStyle = '#e6edf3'; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.arc(X(zc), cy, sc * A_H, 0, 6.2832); ctx.stroke();
        ctx.restore();

        // Symmetrieachse
        ctx.save();
        ctx.strokeStyle = '#2b3644'; ctx.lineWidth = 1; ctx.setLineDash([6, 5]);
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
        ctx.restore();

        // Partikel — nach innen/aussen gruppiert, damit vier Pfade reichen
        if (hl.showPart) {
          ctx.save(); ctx.lineCap = 'round';
          [true, false].forEach(function (grpIn) {
            var col = grpIn ? '255,180,120' : '150,200,230';
            // Spuren
            ctx.strokeStyle = 'rgba(' + col + ',.30)'; ctx.lineWidth = 1.6;
            ctx.beginPath();
            hl.parts.forEach(function (p) {
              if ((Math.hypot(p.rho, p.z - zc) < A_H) !== grpIn || p.tr.length < 2) return;
              for (var sg = 0; sg < 2; sg++) {
                var sgn = sg ? -1 : 1;
                for (var k = 0; k < p.tr.length; k++) {
                  var q = p.tr[k];
                  k ? ctx.lineTo(X(q[0]), Y(sgn * q[1])) : ctx.moveTo(X(q[0]), Y(sgn * q[1]));
                }
              }
            });
            ctx.stroke();
            // Köpfe
            ctx.fillStyle = 'rgba(' + col + ',.95)';
            ctx.beginPath();
            hl.parts.forEach(function (p) {
              if ((Math.hypot(p.rho, p.z - zc) < A_H) !== grpIn) return;
              var px = X(p.z), pa = Y(p.rho), pb = Y(-p.rho);
              ctx.moveTo(px + 1.9, pa); ctx.arc(px, pa, 1.9, 0, 6.2832);
              ctx.moveTo(px + 1.9, pb); ctx.arc(px, pb, 1.9, 0, 6.2832);
            });
            ctx.fill();
          });
          ctx.restore();
        }

        // Wirbelkern-Ring: dort ist die Geschwindigkeit im mitbewegten System null
        var rc = hillCore(A_H);
        [1, -1].forEach(function (sgn) {
          ctx.save();
          ctx.fillStyle = '#ffd166';
          ctx.beginPath(); ctx.arc(X(zc), Y(sgn * rc), 3.4, 0, 6.2832); ctx.fill();
          ctx.strokeStyle = 'rgba(255,209,102,.5)'; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.arc(X(zc), Y(sgn * rc), 8, 0, 6.2832); ctx.stroke();
          ctx.restore();
        });
        if (!narrow) {
          ctx.save();
          ctx.fillStyle = 'rgba(11,16,22,.72)';
          ctx.fillRect(X(zc) + 9, Y(rc) - 21, 132, 17);
          ctx.restore();
          FV.text(ctx, X(zc) + 13, Y(rc) - 9, 'Wirbelkern  r = a/√2',
            { color: 'rgba(255,209,102,.95)', font: '11px ui-monospace, monospace' });
        }

        // Staupunkte an den Polen (nur im mitbewegten System in Ruhe)
        if (!hl.lab) {
          [-1, 1].forEach(function (sgn) {
            ctx.save(); ctx.fillStyle = '#e6edf3';
            ctx.beginPath(); ctx.arc(X(zc + sgn * A_H), cy, 3, 0, 6.2832); ctx.fill(); ctx.restore();
          });
          if (!narrow) FV.text(ctx, X(zc - A_H) - 8, cy - 10, 'Staupunkt',
            { color: '#8b98a6', align: 'right', font: '11px -apple-system, sans-serif' });
        }

        // Kopfzeile — mit Band unterlegt, damit sie über den Linien lesbar bleibt
        ctx.save();
        ctx.fillStyle = 'rgba(11,16,22,.78)';
        ctx.fillRect(0, 0, w, 52);
        ctx.restore();
        FV.text(ctx, 12, 20,
          hl.lab ? (narrow ? 'Laborsystem' : 'Laborsystem — das Fluid ruht im Unendlichen')
                 : (narrow ? 'mitbewegt: die Kugel steht' : 'mitbewegt — die Kugel steht, angeströmt mit U'),
          { color: '#e6edf3', font: (narrow ? '12px' : '13px') + ' ui-monospace, monospace' });
        FV.text(ctx, 12, 38,
          hl.lab ? (narrow ? 'die Kugel nimmt ihr Fluid mit' : 'die Kugel läuft mit U nach links und nimmt ihr Fluid mit')
                 : (narrow ? 'aussen: Potentialströmung' : 'aussen exakt die Potentialströmung um eine Kugel'),
          { color: '#7b8896', font: (narrow ? '10.5px' : '11.5px') + ' ui-monospace, monospace' });
        // Richtungspfeil, fest in der unteren linken Ecke: im mitbewegten Bild
        // die Anströmung, im Laborsystem die Bewegung der Kugel selbst
        if (!hl.lab) {
          FV.arrow(ctx, 16, hgt - 22, 16 + sc * 0.42, hgt - 22, 'rgba(86,200,245,.85)', 2, 8);
          FV.text(ctx, 16 + sc * 0.42 + 8, hgt - 18, narrow ? 'U' : 'U  Anströmung',
            { color: '#56c8f5', font: '12px ui-monospace, monospace' });
        } else {
          FV.arrow(ctx, 16 + sc * 0.42, hgt - 22, 16, hgt - 22, 'rgba(255,138,76,.85)', 2, 8);
          FV.text(ctx, 16 + sc * 0.42 + 8, hgt - 18, narrow ? 'U' : 'U  so läuft die Kugel',
            { color: '#ff8a4c', font: '12px ui-monospace, monospace' });
        }
      },
      cap: 'Meridianschnitt. Die Strömung ist rotationssymmetrisch um die gestrichelte Achse; ' +
           'jede gezeichnete Linie ist in Wirklichkeit eine Fläche, jeder Punkt ein Ring.'
    });

    root.appendChild(cvHill);

    var btnFrame = FV.toggle('Laborsystem', false, function (s) {
      hl.lab = s; hl.t = 0; hl.zc = s ? Z_HALF * 0.55 : 0;
      hillReset(); cvHill.draw();
    });

    root.appendChild(FV.ctrlRow(
      btnFrame,
      FV.toggle('▶ läuft', true, function (s) { hl.run = s; }),
      FV.slider({
        label: 'Tempo', min: 0.05, max: 1.6, step: 0.01, value: hl.speed,
        fmt: function (v) { return '×' + v.toFixed(2); },
        onInput: function (v) { hl.speed = v; }
      }),
      FV.toggle('Stromlinien ψ', true, function (s) { hl.showPsi = s; cvHill.draw(); }),
      FV.toggle('Wirbelstärke ω', false, function (s) { hl.showOm = s; cvHill.draw(); }),
      FV.toggle('Partikel', true, function (s) { hl.showPart = s; cvHill.draw(); })
    ));

    root.appendChild(FV.legend([
      { c: '#ff8a4c', t: 'innen: geschlossene Stromlinien, ω ≠ 0' },
      { c: '#56c8f5', t: 'aussen: Potentialströmung, ω = 0' },
      { c: '#ffd166', t: 'Wirbelkern-Ring r = a/√2' },
      { c: '#a78bfa', t: 'Wirbelstärke |ω| ∝ Achsabstand' }
    ]));

    root.appendChild(FV.note('key', 'Was du sehen solltest',
      'Schalte zwischen den beiden Bezugssystemen um. <strong>Mitbewegt</strong> sieht es aus wie eine ' +
      'gewöhnliche Kugelumströmung mit zwei Staupunkten — nur dass innen zusätzlich etwas kreist. ' +
      '<strong>Im Laborsystem</strong> ruht das Fluid weit weg, und man sieht, worum es wirklich geht: ' +
      'die Kugel schiebt sich durchs Fluid und nimmt ihren <em>gesamten Inhalt</em> mit. Kein Teilchen ' +
      'tritt über die Kugeloberfläche ein oder aus — sie ist eine Stromfläche (ψ = 0). Genau wie bei der ' +
      'Galilei-Invarianz weiter unten: das Geschwindigkeitsfeld und die Stromlinien sehen völlig ' +
      'verschieden aus, das Wirbelstärkefeld ω ist in beiden Bildern identisch.'));

    var roHill = FV.readout([
      { key: 'gam', lab: 'Γ = 5 U a', cls: 'c1' },
      { key: 'umax', lab: 'u<sub>max</sub> am Äquator', cls: 'c2' },
      { key: 'uc', lab: 'u im Zentrum (Labor)', cls: 'c2' },
      { key: 'rc', lab: 'Kernring r/a', cls: 'c3' },
      { key: 'om', lab: 'ω am Äquator', cls: 'c3' }
    ]);
    root.appendChild(roHill);
    roHill.set('gam', hillGam(U_H, A_H).toFixed(2));
    roHill.set('umax', (1.5 * U_H).toFixed(2) + ' U');
    roHill.set('uc', (2.5 * U_H).toFixed(2) + ' U');
    roHill.set('rc', hillCore(A_H).toFixed(3));
    roHill.set('om', Math.abs(hillOm(A_H, Math.PI / 2, U_H, A_H)).toFixed(2));

    root.appendChild(h('p', { html:
      'Die Wirbelstärke hat nur eine Komponente in Umfangsrichtung und wächst linear mit dem ' +
      'Achsabstand ρ = r sinθ. Genau diese Bedingung ω<sub>φ</sub>/ρ = const. macht die Lösung ' +
      'stationär — sie ist das räumliche Gegenstück zum Starrkörperkern des Rankine-Wirbels.' }));

    root.appendChild(FV.eq(
      'ω<sub>φ</sub> = − <span class="frac"><span>15 U</span><span class="den">2 a²</span></span> ' +
      'r sinθ &nbsp;&nbsp;(r ≤ a) &nbsp;&nbsp;&nbsp;&nbsp; ω ≡ 0 &nbsp;(r &gt; a) ' +
      '&nbsp;&nbsp;&nbsp;&nbsp; Γ = 5 U a',
      'Die Zirkulation folgt aus Γ = ∫∫ ω dA über den halben Meridianschnitt.'));

    /* --- 3D: der Kugelwirbel ist ein Wirbelring mit maximal dickem Kern --- */

    root.appendChild(h('p', { html:
      'Räumlich betrachtet ist der Hillsche Kugelwirbel ein <a href="#wirbelring">Wirbelring</a> — ' +
      'nur ist sein Kern so dick geworden, dass er die ganze Kugel ausfüllt. Der „Faden“ ist ' +
      'der gelbe Ring bei r = a/√2 in der Äquatorebene; die geschlossenen Bahnen wickeln sich als ' +
      'Torusflächen darum.' }));

    // eine geschlossene Meridianbahn im mitbewegten System, per RK4 integriert
    function hillLoop(rho0) {
      var p = [rho0, 0], pts = [[rho0, 0]], dt = 0.006;
      function f(q) { return hillUxz(q[0], q[1], U_H, A_H, false); }
      for (var i = 0; i < 4000; i++) {
        var k1 = f(p);
        var k2 = f([p[0] + k1[0] * dt / 2, p[1] + k1[1] * dt / 2]);
        var k3 = f([p[0] + k2[0] * dt / 2, p[1] + k2[1] * dt / 2]);
        var k4 = f([p[0] + k3[0] * dt, p[1] + k3[1] * dt]);
        p = [p[0] + dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
             p[1] + dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])];
        pts.push([p[0], p[1]]);
        if (i > 60 && Math.hypot(p[0] - rho0, p[1]) < 0.012) break;
      }
      pts.push([rho0, 0]);
      return pts;
    }
    var HILL_LOOPS = [0.76, 0.87, 0.95].map(hillLoop);

    var cvHill3 = FV.scene3d({
      aspect: 0.55, span: 5.0, azim: 0.7, elev: 0.32,
      cap: 'Ziehen dreht die Szene. Der gelbe Ring ist der Wirbelkern, die orangen Schlaufen sind ' +
           'geschlossene Bahnen — zusammen bilden sie ineinandergeschachtelte Torusflächen.',
      draw: function (S) {
        var rc = hillCore(A_H);

        // Kugel als Drahtgitter: Meridiane und Breitenkreise
        var k;
        for (k = 0; k < 6; k++) {
          var ph = k * Math.PI / 6;
          var u = [Math.cos(ph), 0, Math.sin(ph)];
          S.arc3([0, 0, 0], u, [0, 1, 0], A_H, 0, 6.2832, { color: '#22303e', width: 1 });
        }
        for (k = 1; k < 6; k++) {
          var yy = -A_H + 2 * A_H * k / 6;
          var rr = Math.sqrt(Math.max(A_H * A_H - yy * yy, 0));
          S.arc3([0, yy, 0], [1, 0, 0], [0, 0, 1], rr, 0, 6.2832, { color: '#22303e', width: 1 });
        }

        // geschlossene Bahnen, um die Achse gedreht — Meridianschnitte plus
        // Breitenringe, erst zusammen liest man die Torusfläche
        HILL_LOOPS.forEach(function (loop, li) {
          var nPhi = 6, al = li === 0 ? 0.7 : 0.32;
          for (var j = 0; j < nPhi; j++) {
            var ph = j * 2 * Math.PI / nPhi;
            var cp = Math.cos(ph), sp = Math.sin(ph);
            var pts = loop.map(function (q) { return [q[0] * cp, q[1], q[0] * sp]; });
            S.poly3(pts, { color: '#ff8a4c', width: 1.4, alpha: al });
          }
          if (li > 0) return;
          for (var m = 0; m < 7; m++) {
            var q2 = loop[Math.floor(m * loop.length / 7)];
            S.arc3([0, q2[1], 0], [1, 0, 0], [0, 0, 1], q2[0], 0, 6.2832,
              { color: '#ff8a4c', width: 1.1, alpha: 0.4 });
          }
        });

        // Wirbelkern-Ring mit Γ-Richtung
        S.filament3(S.arcPts([0, 0, 0], [1, 0, 0], [0, 0, 1], rc, 0, 6.2832, 72),
          { color: '#ffd166', width: 3.4, heads: 4, head: 10 });
        S.label3([rc * 1.28, 0.30, 0], 'Wirbelkern-Ring', { color: '#ffd166', dx: 8 });

        // Bewegungsrichtung im Laborsystem
        S.arrow3([A_H * 1.55, A_H * 0.35, 0], [A_H * 1.55, -A_H * 0.55, 0],
          { color: '#56c8f5', width: 2, head: 10 });
        S.label3([A_H * 1.55, -A_H * 0.1, 0], 'U', { color: '#56c8f5', dx: 10, font: '13px ui-monospace, monospace' });
        S.arc3([0, 0, 0], [1, 0, 0], [0, 0, 1], A_H, 0, 6.2832, { color: '#3f4d5c', width: 1.4 });
      }
    });
    root.appendChild(cvHill3);

    root.appendChild(FV.note('warn', 'Zwei Dinge, die man dazu sagen muss',
      '<ul style="margin:0">' +
      '<li>Der Hillsche Kugelwirbel ist eine exakte Lösung der <strong>Euler</strong>-Gleichungen. ' +
      'An der Kugelschale springt ω von −15U/(2a) sinθ auf null; eine reibungsbehaftete Strömung ' +
      'würde diesen Sprung sofort ausglätten — genauso, wie der reale Wirbel den Knick des ' +
      'Rankine-Modells bei r₀ ausrundet.</li>' +
      '<li>Er ist der Grenzfall des <a href="#wirbelring">Wirbelrings</a> mit maximal dickem Kern. ' +
      'Beim dünnen Ring ist die Eigengeschwindigkeit Γ/(4πR)·(ln(8R/ε) − ¼) und hängt vom Kernradius ε ab; ' +
      'beim Kugelwirbel fällt dieser Freiheitsgrad weg und es bleibt schlicht U = Γ/(5a).</li>' +
      '</ul>'));

    root.appendChild(h('h3', null, 'Die vier Modelle nebeneinander'));

    root.appendChild(h('table', null,
      h('thead', null, h('tr', null,
        h('th', null, ''), h('th', null, 'Starrkörper'), h('th', null, 'Potential'),
        h('th', null, 'Rankine'), h('th', null, 'Hill'))),
      h('tbody', null,
        qrow('Geometrie', 'eben', 'eben', 'eben', 'räumlich, achsensymmetrisch'),
        qrow('Geschwindigkeit', 'u<sub>θ</sub> = Ω r', 'u<sub>θ</sub> = c/r',
             'beides, Anschluss bei r₀', 'ψ aus Kugelfunktionen'),
        qrow('Wirbelstärke ω', '2Ω überall', '0 (ausser r = 0)',
             '2Ω im Kern, 0 aussen', '∝ Achsabstand im Kern, 0 aussen'),
        qrow('Γ (grosse Kurve)', '∝ r², unbeschränkt', '2π c', '2π Ω r₀²', '5 U a'),
        qrow('Bernoulli global?', 'nein', 'ja', 'nur aussen', 'nur aussen'),
        qrow('exakte Lösung von', 'Navier-Stokes', 'Navier-Stokes', 'Navier-Stokes', 'Euler'),
        qrow('Vorkommen', 'rotierender Behälter', 'Aussenfeld eines Wirbels',
             'Tornado, Randwirbel', 'fallender Tropfen, Gasblase')
      )));

    function qrow(a, b, c2, d, e) {
      return h('tr', null, h('td', { html: a }),
        h('td', { html: b, style: 'color:var(--c1)' }),
        h('td', { html: c2, style: 'color:var(--c2)' }),
        h('td', { html: d, style: 'color:#ffd166' }),
        h('td', { html: e, style: 'color:var(--c3)' }));
    }

    /* ---------------- Umkehrung ---------------- */

    root.appendChild(FV.section('8 · Die Umkehrung stimmt nicht: Drehung ohne Wirbel'));

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

    root.appendChild(FV.section('9 · Prüfungsfallen'));

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
      '<li><strong>Rankine: u<sub>θ</sub> ist maximal bei r₀</strong>, nicht im Zentrum und nicht ' +
      'im Unendlichen. Beide Grenzfälle des Modells sind unphysikalisch — genau deshalb wird ' +
      'zusammengesetzt.</li>' +
      '<li><strong>Die Druckdelle auf der Achse ist doppelt so tief wie am Kernrand.</strong> ' +
      'Wer nur die Aussenlösung bis r = 0 fortsetzt, bekommt −∞; wer sie bei r₀ abschneidet, ' +
      'unterschätzt sie um den Faktor 2.</li>' +
      '<li><strong>Bernoulli quer über Stromlinien</strong> ist im Rankine-Wirbel nur aussen erlaubt. ' +
      'Im Kern ist H = p + ½ρu² von Stromlinie zu Stromlinie verschieden.</li>' +
      '<li><strong>Hill: die Kugeloberfläche ist eine Stromfläche</strong> (ψ = 0), kein Fluid tritt ' +
      'durch sie hindurch. Der Wirbel transportiert sein gesamtes Inneres mit — das ist die Aussage, ' +
      'nicht die Form.</li>' +
      '<li><strong>Hill: ω ist nicht konstant</strong>, sondern proportional zum Achsabstand ' +
      '(ω<sub>φ</sub>/ρ = const.). Nur diese Verteilung macht die Lösung stationär.</li>' +
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

      cvRigid.draw(); cvPot.draw(); cvShear.draw(); cvRank.draw();

      // Hillscher Kugelwirbel: eigene Zeit, eigenes Tempo. Im Laborsystem
      // wandert die Kugel durchs Bild; am linken Rand wird neu gesät.
      if (hl.run) {
        var hdt = dt * hl.speed;
        hl.t += hdt;
        if (hl.lab) {
          hl.zc -= U_H * hdt;
          if (hl.zc < -Z_HALF * 0.95) { hl.zc = Z_HALF * 0.95; hillReset(); }
        }
        for (var pi = 0; pi < hl.parts.length; pi++) hillStep(hl.parts[pi], hdt);
      }
      cvHill.draw();

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
