/* ============================================================
   Wirbelstreckung und Kippen — der Term (ω·∇)u
   Skript Kap. 10.2, S. 84–86, Abb. 10.6
   Deckt die Prüfungsaufgaben zum "lokalen Wirbelelement" ab.
   ============================================================ */

FV.register({
  id: 'wirbelstreckung',
  chapter: 'Drehungsbehaftete Strömungen',
  chapterNo: '10.2',
  title: 'Wirbelstreckung und Kippen',
  subtitle: 'Der Term (ω·∇)u — warum ein Wirbelelement mal gestreckt wird, mal nur kippt.',
  source: 'Skript S. 84–86, Abb. 10.6',

  build: function (root) {
    var h = FV.h;

    /* ---------------- Feld und Zustand ----------------
       u(x,y) = ( U0 + E·x + S·y ,  −E·y )
       ∂u/∂x = (E, 0)      ∂u/∂y = (S, −E)
       ω = |ω|·(cos φ, sin φ)  in der Zeichenebene
       W = (ω·∇)u = |ω|·( E cos φ + S sin φ , −E sin φ )
    -------------------------------------------------- */

    var st = {
      U0: 1.2, S: -1.2, E: 0.0,
      phi: 90 * Math.PI / 180,      // Orientierung des Wirbelelements
      L: 1.5,                        // Länge des Elements (Weltkoordinaten)
      t: 0, running: true, speed: 1.0
    };

    function uField(x, y) { return [st.U0 + st.E * x + st.S * y, -st.E * y]; }

    function Wvec() {
      var c = Math.cos(st.phi), s = Math.sin(st.phi);
      return [st.E * c + st.S * s, -st.E * s];      // pro Einheit |ω|
    }
    // Streckungsrate σ = W·ê_ω / |ω|   (>0 strecken, <0 stauchen)
    function sigma() { return st.E * Math.cos(2 * st.phi) + st.S / 2 * Math.sin(2 * st.phi); }
    // Kipprate dφ/dt = W·ê_⊥ / |ω|
    function kipp() { return -st.E * Math.sin(2 * st.phi) - st.S * Math.sin(st.phi) * Math.sin(st.phi); }

    /* ---------------- Einstieg ---------------- */

    root.appendChild(FV.note('', 'Der eine Satz, um den es geht',
      'Für den Wirbelstreckungsterm zählt <strong>nur, wie sich u längs des Wirbelelements ändert</strong> — ' +
      'also die Ableitung ∂u/∂s in Richtung von ω. Alles andere am Strömungsbild ist für diesen Term ' +
      'irrelevant. Wer das einmal verinnerlicht hat, löst die Prüfungsaufgaben zum lokalen Wirbelelement ' +
      'in zehn Sekunden.'));

    root.appendChild(FV.eq(
      '<div style="line-height:2.2">' +
      '<span style="color:var(--fg-mute)">Dω/Dt =</span> &nbsp;' +
      '<span style="color:#ffd166">(ω · ∇) u</span> &nbsp;+&nbsp; ' +
      '<span style="color:#56c8f5">ν Δω</span>' +
      '</div>',
      'inkompressibel, ρ = const, konservative Kräfte f = −∇U · Skript S. 84'));

    root.appendChild(h('table', null,
      h('thead', null, h('tr', null, h('th', null, 'Term'), h('th', null, 'Bedeutung'), h('th', null, 'wann null?'))),
      h('tbody', null,
        h('tr', null,
          h('td', { html: '<span style="color:#ffd166">(ω·∇)u</span>' }),
          h('td', { html: 'Wirbelstreckung <em>und</em> Kippen. Der einzige Term, der ω ohne Reibung ändern kann.' }),
          h('td', { html: 'in jeder 2D-Strömung; und immer, wenn sich u längs ω nicht ändert' })),
        h('tr', null,
          h('td', { html: '<span style="color:#56c8f5">νΔω</span>' }),
          h('td', { html: 'Diffusion der Wirbelstärke — sie verschmiert, wandert aber nie von selbst ins Feld.' }),
          h('td', { html: 'reibungsfrei (ν = 0)' })),
        h('tr', null,
          h('td', { html: '<span style="color:var(--fg-mute)">Druck</span>' }),
          h('td', { html: 'kommt gar nicht vor — die Rotationsbildung hat ihn eliminiert.' }),
          h('td', { html: 'immer' })),
        h('tr', null,
          h('td', { html: '<span style="color:var(--fg-mute)">konservative Kräfte</span>' }),
          h('td', { html: 'f = −∇U, und rot(∇U) ≡ 0 — deshalb tauchen sie nicht auf.' }),
          h('td', { html: 'immer (das ist Aussage d der Aufgabe 3.6)' }))
      )));

    root.appendChild(FV.note('key', 'Die Zerlegung aus dem Skript (S. 85)',
      'Man zerlegt die Geschwindigkeit lokal in eine zu ω parallele und eine senkrechte Komponente, ' +
      'u = u∥ + u⊥, und leitet längs des Elements ab:' +
      '<div class="eq" style="margin:12px 0">W = |ω| ∂u/∂s = |ω| ∂u∥/∂s &nbsp;+&nbsp; |ω| ∂u⊥/∂s</div>' +
      '<ul style="margin:0">' +
      '<li><strong>∂u∥/∂s > 0</strong> → das Element wird <span style="color:#ffd166">gestreckt</span>, |ω| nimmt zu (Abb. 10.6b)</li>' +
      '<li><strong>∂u∥/∂s &lt; 0</strong> → gestaucht, |ω| nimmt ab</li>' +
      '<li><strong>∂u⊥/∂s ≠ 0</strong> → das Element <span style="color:#a78bfa">kippt</span>, ω ändert die Richtung (Abb. 10.6c)</li>' +
      '</ul>'));

    /* ---------------- Interaktiv ---------------- */

    root.appendChild(FV.section('1 · Selbst ausprobieren'));

    root.appendChild(h('p', { html:
      'Links die Momentaufnahme: das schwarze Wirbelelement, das Geschwindigkeitsfeld und — entscheidend — ' +
      'die beiden Geschwindigkeiten <strong>an den Enden des Elements</strong>. Ihre Differenz ist W. ' +
      'Rechts, was in der nächsten Zeitspanne daraus wird: das Element ist eine <em>materielle</em> Linie, ' +
      'es wird einfach mit der Strömung mitgeführt.' }));

    var roW = FV.readout([
      { key: 'W', lab: 'W = (ω·∇)u', cls: 'c2' },
      { key: 'str', lab: 'Streckungsrate σ = W·ê<sub>ω</sub>', cls: 'c1' },
      { key: 'kip', lab: 'Kipprate dφ/dt', cls: 'c3' },
      { key: 'om', lab: '|ω| / |ω|₀ (materiell verfolgt)', cls: 'c1' },
      { key: 'uom', lab: 'u · ω', cls: 'c2' },
      { key: 'diag', lab: 'Diagnose' }
    ]);

    // Weltkoordinaten → Canvas
    function mkMap(w, hgt) {
      var sc = Math.min(w / 6.4, hgt / 4.2);
      var cx = w / 2, cy = hgt / 2;
      return {
        X: function (x) { return cx + x * sc; },
        Y: function (y) { return cy - y * sc; },
        sc: sc
      };
    }

    function drawField(ctx, M, w, hgt) {
      var nx = 9, ny = 6;
      for (var i = 0; i < nx; i++) {
        for (var j = 0; j < ny; j++) {
          var x = -2.9 + i * 5.8 / (nx - 1);
          var y = -1.85 + j * 3.7 / (ny - 1);
          var u = uField(x, y);
          var px = M.X(x), py = M.Y(y);
          var k = 0.32 * M.sc;
          FV.arrow(ctx, px, py, px + u[0] * k, py - u[1] * k, 'rgba(86,200,245,.5)', 1.3, 5);
        }
      }
    }

    function drawElement(ctx, M, phi, len, style) {
      var c = Math.cos(phi), s = Math.sin(phi);
      var ax = -len / 2 * c, ay = -len / 2 * s, bx = len / 2 * c, by = len / 2 * s;
      ctx.save();
      ctx.strokeStyle = style.color; ctx.lineWidth = style.width || 4; ctx.lineCap = 'round';
      if (style.dash) ctx.setLineDash(style.dash);
      ctx.beginPath();
      ctx.moveTo(M.X(ax), M.Y(ay)); ctx.lineTo(M.X(bx), M.Y(by));
      ctx.stroke();
      ctx.restore();
      return [[ax, ay], [bx, by]];
    }

    /* ---- Canvas 1: Momentaufnahme ---- */
    var cvNow = FV.canvas({
      aspect: 0.66,
      render: function (ctx, w, hgt) {
        var M = mkMap(w, hgt);
        drawField(ctx, M, w, hgt);

        var ends = drawElement(ctx, M, st.phi, st.L, { color: '#e6edf3', width: 5 });
        var A = ends[0], B = ends[1];
        var uA = uField(A[0], A[1]), uB = uField(B[0], B[1]);
        var k = 0.32 * M.sc;

        // Geschwindigkeiten an den Enden
        FV.arrow(ctx, M.X(A[0]), M.Y(A[1]), M.X(A[0]) + uA[0] * k, M.Y(A[1]) - uA[1] * k, '#ffffff', 2.4, 8);
        FV.arrow(ctx, M.X(B[0]), M.Y(B[1]), M.X(B[0]) + uB[0] * k, M.Y(B[1]) - uB[1] * k, '#ffffff', 2.4, 8);

        // W am oberen Ende, mit Zerlegung
        var Wv = Wvec();
        var kw = 0.42 * M.sc;
        var ox = M.X(B[0]) + uB[0] * k, oy = M.Y(B[1]) - uB[1] * k;
        var c = Math.cos(st.phi), s = Math.sin(st.phi);
        var par = st.E * Math.cos(2 * st.phi) + st.S / 2 * Math.sin(2 * st.phi);   // σ
        var perp = -st.E * Math.sin(2 * st.phi) - st.S * s * s;                    // Kipprate
        var Wpar = [par * c, par * s];
        var Wperp = [perp * -s, perp * c];

        if (Math.hypot(Wv[0], Wv[1]) > 1e-4) {
          FV.arrow(ctx, ox, oy, ox + Wv[0] * kw, oy - Wv[1] * kw, '#56c8f5', 2.6, 9);
          if (Math.abs(par) > 1e-4)
            FV.arrow(ctx, ox, oy, ox + Wpar[0] * kw, oy - Wpar[1] * kw, '#ffd166', 2.2, 8);
          if (Math.abs(perp) > 1e-4)
            FV.arrow(ctx, ox, oy, ox + Wperp[0] * kw, oy - Wperp[1] * kw, '#a78bfa', 2.2, 8);
          FV.text(ctx, ox + Wv[0] * kw + 6, oy - Wv[1] * kw, 'W', { color: '#56c8f5', font: 'bold 13px ui-monospace, monospace' });
        } else {
          FV.text(ctx, ox + 8, oy, 'W = 0', { color: '#6fdd8b', font: 'bold 13px ui-monospace, monospace' });
        }

        FV.text(ctx, 12, 20, 'Momentaufnahme — was der Term sagt',
          { color: '#c8d3de', font: '12.5px -apple-system, sans-serif' });
        FV.text(ctx, 12, hgt - 10, 'weiss: u an den beiden Enden · ihre Differenz ist W',
          { color: '#6e7d8c', font: '11px -apple-system, sans-serif' });
      }
    });

    /* ---- Canvas 2: materielle Entwicklung ---- */
    // Endpunkte werden advektiert; der Mittelpunkt wird zurückgesetzt
    // (erlaubt, weil ω Galilei-invariant ist)
    var mat = null;
    function resetMat() {
      var c = Math.cos(st.phi), s = Math.sin(st.phi);
      mat = { a: [-st.L / 2 * c, -st.L / 2 * s], b: [st.L / 2 * c, st.L / 2 * s], L0: st.L };
    }
    resetMat();

    var cvNext = FV.canvas({
      aspect: 0.66,
      render: function (ctx, w, hgt) {
        var M = mkMap(w, hgt);
        drawField(ctx, M, w, hgt);

        // Ausgangslage blass
        drawElement(ctx, M, st.phi, st.L, { color: 'rgba(230,237,243,.28)', width: 4, dash: [5, 5] });

        // aktuelles materielles Element
        ctx.save();
        ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(M.X(mat.a[0]), M.Y(mat.a[1]));
        ctx.lineTo(M.X(mat.b[0]), M.Y(mat.b[1]));
        ctx.stroke();
        ctx.restore();

        var len = Math.hypot(mat.b[0] - mat.a[0], mat.b[1] - mat.a[1]);
        var rel = len / mat.L0;
        var ang = Math.atan2(mat.b[1] - mat.a[1], mat.b[0] - mat.a[0]) * 180 / Math.PI;

        FV.text(ctx, 12, 20, 'Materielle Entwicklung (mitbewegt)',
          { color: '#c8d3de', font: '12.5px -apple-system, sans-serif' });
        FV.text(ctx, 12, 40, 'Länge ×' + rel.toFixed(2) + '   →   |ω| ×' + rel.toFixed(2),
          { color: '#ffd166', font: '12px ui-monospace, monospace' });
        FV.text(ctx, 12, 58, 'Richtung ' + ang.toFixed(1) + '°  (Start ' + (st.phi * 180 / Math.PI).toFixed(0) + '°)',
          { color: '#a78bfa', font: '12px ui-monospace, monospace' });
        FV.text(ctx, 12, hgt - 10, 'Wirbellinien sind materielle Linien — deshalb genügt Mitschwimmen',
          { color: '#6e7d8c', font: '11px -apple-system, sans-serif' });
      }
    });

    root.appendChild(h('div', { class: 'duo' }, cvNow, cvNext));

    root.appendChild(FV.legend([
      { c: '#e6edf3', t: 'Wirbelelement (Richtung von ω)' },
      { c: '#56c8f5', t: 'W = (ω·∇)u' },
      { c: '#ffd166', t: 'Anteil parallel zu ω → Streckung' },
      { c: '#a78bfa', t: 'Anteil senkrecht zu ω → Kippen' }
    ]));

    var sPhi = FV.slider({
      label: 'Orientierung des Wirbelelements φ', min: 0, max: 180, step: 1, value: 90,
      fmt: function (v) { return v.toFixed(0) + '°'; },
      onInput: function (v) { st.phi = v * Math.PI / 180; resetMat(); upd(); }
    });
    var sS = FV.slider({
      label: 'Scherung S &nbsp;(∂u<sub>x</sub>/∂y)', min: -2, max: 2, step: 0.05, value: -1.2,
      fmt: function (v) { return v.toFixed(2); },
      onInput: function (v) { st.S = v; resetMat(); upd(); }
    });
    var sE = FV.slider({
      label: 'Dehnung E &nbsp;(∂u<sub>x</sub>/∂x)', min: -1.2, max: 1.2, step: 0.05, value: 0,
      fmt: function (v) { return v.toFixed(2); },
      onInput: function (v) { st.E = v; resetMat(); upd(); }
    });

    root.appendChild(FV.ctrlRow(sPhi, sS, sE,
      FV.button('zurücksetzen', function () { resetMat(); })));

    function preset(phi, S, E) {
      sPhi.set(phi); sS.set(S); sE.set(E); resetMat();
    }
    root.appendChild(FV.ctrlRow(
      h('span', { style: 'font-size:12px;color:var(--fg-mute);flex:0 0 auto' }, 'Situationen:'),
      FV.button('Aufgabe 3.3 / 3.6 — Element ⊥ zur Strömung', function () { preset(90, -1.2, 0); }),
      FV.button('FS25-Variante — Element ∥ zur Strömung', function () { preset(0, -1.2, 0); }),
      FV.button('reine Streckung', function () { preset(0, 0, 0.8); }),
      FV.button('reine Stauchung', function () { preset(0, 0, -0.8); }),
      FV.button('schräg: beides zugleich', function () { preset(45, -1.2, 0); })
    ));

    root.appendChild(roW);

    function upd() {
      var Wv = Wvec(), Wn = Math.hypot(Wv[0], Wv[1]);
      var sg = sigma(), kp = kipp();
      roW.set('W', Wn < 1e-4 ? '0' : '(' + Wv[0].toFixed(2) + ', ' + Wv[1].toFixed(2) + ')');
      roW.set('str', sg.toFixed(3) + ' /s');
      roW.set('kip', (kp * 180 / Math.PI).toFixed(1) + ' °/s');
      var uu = uField(0, 0);
      var om = [Math.cos(st.phi), Math.sin(st.phi)];
      roW.set('uom', (uu[0] * om[0] + uu[1] * om[1]).toFixed(2));

      var d;
      if (Wn < 1e-3) d = 'nichts passiert';
      else if (Math.abs(sg) < 1e-3) d = 'reines Kippen';
      else if (Math.abs(kp) < 1e-3) d = sg > 0 ? 'reine Streckung' : 'reine Stauchung';
      else d = (sg > 0 ? 'Streckung' : 'Stauchung') + ' + Kippen';
      roW.set('diag', d);
      cvNow.draw();
    }
    upd();

    root.appendChild(FV.note('warn', 'Probier das aus',
      '<ul style="margin:0">' +
      '<li><strong>φ = 90°, reine Scherung</strong> (Aufgabe 3.3): W zeigt in Strömungsrichtung, also ' +
      '<em>senkrecht</em> zum Element → Streckungsrate exakt 0, das Element kippt nur. ' +
      'Genau das fragt die Prüfung ab.</li>' +
      '<li><strong>φ = 0°, reine Scherung</strong> (FS25-Variante): Längs des Elements ändert sich u ' +
      'überhaupt nicht → W = 0. Weder Streckung noch Kippen.</li>' +
      '<li><strong>φ = 45°</strong>: jetzt passiert beides gleichzeitig — der Normalfall in einer ' +
      'turbulenten Strömung.</li>' +
      '<li><strong>Dehnung E > 0 bei φ = 0°</strong>: reine Streckung, |ω| wächst. Genau das ist die ' +
      'Wirbelstreckung im engeren Sinn.</li>' +
      '</ul>'));

    root.appendChild(FV.note('', 'Warum die Aufgabe „instantan“ sagt',
      'Lass die rechte Animation bei φ = 90° laufen und beobachte |ω|: <strong>im ersten Moment</strong> ' +
      'ändert sich die Länge nicht — das Element kippt nur. Sobald es aber schräg steht, ist die ' +
      'Streckungsrate nicht mehr null, und es beginnt sich zu strecken. Die Aussage „wird instantan ' +
      'gestreckt“ ist deshalb <em>jetzt</em> falsch, aber einen Augenblick später wäre sie richtig. ' +
      'Der Term (ω·∇)u ist eine Momentaufnahme, keine Prognose.'));

    /* ---------------- 2D ---------------- */

    root.appendChild(FV.section('2 · Warum der Term in 2D immer verschwindet'));

    root.appendChild(h('p', { html:
      'In einer ebenen Strömung in der x-y-Ebene hat ω nur eine Komponente, ω = ω<sub>z</sub>(x,y)·e<sub>z</sub> — ' +
      'die Wirbellinien stehen senkrecht auf der Strömungsebene. Der Term ist die Ableitung von u ' +
      '<em>längs dieser Richtung</em>, also nach z. Und in einer 2D-Strömung hängt u nicht von z ab. ' +
      'Damit ist W identisch null:' }));

    root.appendChild(FV.eq(
      '(ω · ∇)u = ω<sub>z</sub> ∂u/∂z = 0 &nbsp;&nbsp;⟹&nbsp;&nbsp; Dω/Dt = ν Δω',
      '2D-Wirbeltransportgleichung — eine skalare Gleichung, analog zur Wärmeleitung · Skript S. 85'));

    var cv2D = FV.canvas({
      aspect: 0.36,
      render: function (ctx, w, hgt) {
        var cy = hgt * 0.56, cx = w * 0.5;
        // Ebene in Isometrie
        function P(x, y, z) {
          return [cx + (x - y) * 0.62 * 46, cy + (x + y) * 0.30 * 46 - z * 46];
        }
        ctx.save();
        // Strömungsebene
        ctx.fillStyle = 'rgba(86,200,245,.07)';
        ctx.strokeStyle = 'rgba(86,200,245,.35)'; ctx.lineWidth = 1.2;
        ctx.beginPath();
        var cs = [P(-1.6, -1.6, 0), P(1.6, -1.6, 0), P(1.6, 1.6, 0), P(-1.6, 1.6, 0)];
        cs.forEach(function (p, i) { i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); });
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();

        // Stromlinienpfeile in der Ebene
        for (var i = -1; i <= 1; i++) {
          var a = P(-1.3, i * 0.9, 0), b = P(1.1, i * 0.9, 0);
          FV.arrow(ctx, a[0], a[1], b[0], b[1], 'rgba(86,200,245,.7)', 1.6, 7);
        }

        // Wirbellinien senkrecht zur Ebene
        [[-0.8, -0.7], [0.6, 0.5], [-0.2, 0.9]].forEach(function (q) {
          var a = P(q[0], q[1], -0.55), b = P(q[0], q[1], 1.15);
          ctx.save(); ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.restore();
        });

        FV.text(ctx, 14, 20, 'ω steht überall senkrecht auf der Strömungsebene',
          { color: '#ffd166', font: '12px -apple-system, sans-serif' });
        FV.text(ctx, 14, 38, 'längs ω (also in z) ändert sich u nicht  →  (ω·∇)u = 0',
          { color: '#7b8896', font: '11.5px -apple-system, sans-serif' });
        FV.text(ctx, w - 14, hgt - 10,
          'Folge: in 2D kann sich ω eines Fluidteilchens nur durch Reibung ändern.',
          { color: '#6e7d8c', align: 'right', font: '11.5px -apple-system, sans-serif' });
      }
    });
    root.appendChild(cv2D);

    root.appendChild(FV.note('key', 'Die grosse Konsequenz',
      'In einer reibungsfreien Strömung mit konservativen Kräften bleibt eine Strömung, die einmal ' +
      'drehungsfrei war, für alle Zeiten drehungsfrei. Eine Potentialströmung bleibt eine ' +
      'Potentialströmung. Wirbelstärke wird nicht im Feld erzeugt — sie entsteht an den ' +
      '<strong>Wänden</strong> umströmter Körper und diffundiert von dort ins Feld (Skript S. 85).'));

    /* ---------------- Pirouette ---------------- */

    root.appendChild(FV.section('3 · Warum Streckung ω vergrössert — der Pirouetteneffekt'));

    root.appendChild(h('p', { html:
      'Eine Wirbelröhre wird gestreckt. Das Fluid ist inkompressibel, also bleibt ihr Volumen gleich: ' +
      'wird sie doppelt so lang, halbiert sich ihr Querschnitt. Die Zirkulation Γ = ω·A bleibt nach ' +
      'Kelvin erhalten — also muss ω genau in dem Mass wachsen, in dem A schrumpft. Deshalb ist die ' +
      'Wirbelstärke proportional zur Länge des materiellen Elements.' }));

    root.appendChild(FV.eq(
      'A·L = const. &nbsp;&nbsp;und&nbsp;&nbsp; Γ = ω·A = const. &nbsp;&nbsp;⟹&nbsp;&nbsp; ' +
      'ω ∝ 1/A ∝ L',
      'derselbe Mechanismus wie bei der Eiskunstläuferin, die die Arme anlegt'));

    var stretch = 1.0, pirT = 0;
    var roPir = FV.readout([
      { key: 'L', lab: 'Länge L / L₀', cls: 'c1' },
      { key: 'A', lab: 'Querschnitt A / A₀', cls: 'c2' },
      { key: 'om', lab: 'Wirbelstärke ω / ω₀', cls: 'c1' },
      { key: 'G', lab: 'Zirkulation Γ / Γ₀', cls: 'c3' }
    ]);

    var cvPir = FV.canvas({
      aspect: 0.42,
      render: function (ctx, w, hgt) {
        var cx = w * 0.5, cy = hgt * 0.52;
        var L = 1.0 * stretch, A = 1 / stretch;
        var rad = Math.sqrt(A) * 40;
        var half = L * 62;

        // Röhre
        ctx.save();
        var g = ctx.createLinearGradient(0, cy - half, 0, cy + half);
        g.addColorStop(0, 'rgba(255,209,102,.10)');
        g.addColorStop(0.5, 'rgba(255,209,102,.22)');
        g.addColorStop(1, 'rgba(255,209,102,.10)');
        ctx.fillStyle = g;
        ctx.fillRect(cx - rad, cy - half, rad * 2, half * 2);
        ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - rad, cy - half); ctx.lineTo(cx - rad, cy + half);
        ctx.moveTo(cx + rad, cy - half); ctx.lineTo(cx + rad, cy + half);
        ctx.stroke();
        // Deckel als Ellipsen
        [-1, 1].forEach(function (sg) {
          ctx.beginPath(); ctx.ellipse(cx, cy + sg * half, rad, rad * 0.32, 0, 0, 6.2832); ctx.stroke();
        });
        ctx.restore();

        // Zugpfeile
        FV.arrow(ctx, cx, cy - half - 8, cx, cy - half - 34, '#e6edf3', 2, 8);
        FV.arrow(ctx, cx, cy + half + 8, cx, cy + half + 34, '#e6edf3', 2, 8);

        // rotierende Marker auf dem Mantel (Drehrate ∝ ω)
        var om = stretch;
        for (var k = 0; k < 3; k++) {
          var a = pirT * om * 1.6 + k * 2.094;
          var px = cx + Math.cos(a) * rad;
          var py = cy - half + (k + 0.5) * (2 * half / 3);
          var vis = Math.sin(a) > 0 ? 1 : 0.28;
          ctx.save(); ctx.globalAlpha = vis; ctx.fillStyle = '#ff8a4c';
          ctx.beginPath(); ctx.arc(px, py, 4.2, 0, 6.2832); ctx.fill(); ctx.restore();
        }

        FV.text(ctx, 14, 20, 'Wirbelröhre unter Streckung', { color: '#c8d3de', font: '12.5px -apple-system, sans-serif' });
        FV.text(ctx, 14, 38, 'Volumen konstant · Zirkulation konstant',
          { color: '#7b8896', font: '11.5px -apple-system, sans-serif' });
        FV.text(ctx, w - 14, hgt - 12, 'die Marker drehen schneller, je dünner die Röhre wird',
          { color: '#6e7d8c', align: 'right', font: '11px -apple-system, sans-serif' });
      }
    });
    root.appendChild(cvPir);
    root.appendChild(FV.ctrlRow(FV.slider({
      label: 'Streckung L / L₀', min: 0.4, max: 3, step: 0.01, value: 1,
      fmt: function (v) { return '×' + v.toFixed(2); },
      onInput: function (v) {
        stretch = v;
        roPir.set('L', v.toFixed(2));
        roPir.set('A', (1 / v).toFixed(2));
        roPir.set('om', v.toFixed(2));
        roPir.set('G', '1.00');
      }
    })));
    root.appendChild(roPir);
    roPir.set('L', '1.00'); roPir.set('A', '1.00'); roPir.set('om', '1.00'); roPir.set('G', '1.00');

    root.appendChild(FV.note('', 'Warum das für Turbulenz zentral ist',
      'In einer 3D-Strömung streckt das Geschwindigkeitsfeld die Wirbelröhren ständig. Jede Streckung ' +
      'macht sie dünner und schneller — Energie wandert dabei zu immer kleineren Skalen, bis die Reibung ' +
      'sie aufzehrt. Genau dieser Weg fehlt in 2D, weil dort W ≡ 0 ist. Deshalb verhält sich ' +
      '2D-Turbulenz grundlegend anders als 3D-Turbulenz.'));

    /* ---------------- Aufgaben ---------------- */

    root.appendChild(FV.section('4 · Die Prüfungsaufgaben'));

    root.appendChild(h('h3', null, 'Aufgabe 3.3 — Lokales Wirbelelement (FS24, MC)'));
    root.appendChild(h('p', { class: 'src' },
      'Vertikales Wirbelelement in einer horizontalen Scherströmung mit ∂u/∂y ≠ 0. ' +
      'Klicke oben auf «Aufgabe 3.3 / 3.6», um genau diese Lage einzustellen.'));

    root.appendChild(answerTable([
      ['(a) Das Wirbelelement wird instantan gestreckt.', false,
        'Streckung bräuchte ∂u∥/∂s ≠ 0, also eine Geschwindigkeitskomponente <em>in y-Richtung</em>, die sich <em>längs y</em> ändert. Die gibt es hier nicht: u hat nur eine x-Komponente. Die Streckungsrate ist exakt 0.'],
      ['(b) Der Wirbelstreckungsterm (ω·∇)u ist parallel zur Strömung ausgerichtet.', true,
        'Mit ω ∥ e<sub>y</sub> ist W = ω<sub>y</sub> ∂u/∂y, und ∂u/∂y zeigt in x-Richtung — also parallel zu u. Im Bild links siehst du den blauen W-Pfeil genau in Strömungsrichtung.'],
      ['(c) Das Wirbelelement kippt instantan.', true,
        'W steht senkrecht auf ω, und ∂u⊥/∂s ≠ 0 bedeutet nach Skript S. 85 genau: Kippen (Abb. 10.6c).'],
      ['(d) Es gilt u · ω = 0.', true,
        'Das vertikale Element steht senkrecht auf der horizontalen Strömung, das Skalarprodukt verschwindet. Reine Geometrie, unabhängig vom Rest.']
    ], 'Musterlösung der Prüfung FS24: F · R · R · R'));

    root.appendChild(h('h3', null, 'Aufgabe 3.6 — Lokales Wirbelelement und Wirbeltransport (HS19, MC)'));

    root.appendChild(answerTable([
      ['(a) Das gezeichnete Element hat einen verschwindenden Wirbelstreckungsterm W := (ω·∇)u.', false,
        'Dieselbe Lage wie in 3.3: vertikales Element, Scherströmung mit ∂u/∂y ≠ 0. Damit ist W = ω<sub>y</sub> ∂u/∂y ≠ 0 — er verschwindet nicht, er bewirkt hier nur <em>Kippen</em> statt Streckung. Genau diese Verwechslung ist die Falle: «Wirbelstreckungsterm» ist der Sammelname für beides.'],
      ['(b) Die Geschwindigkeit des Rankine-Wirbels ist monoton.', false,
        'u<sub>θ</sub> steigt im Kern linear an, erreicht bei r₀ ihr Maximum und fällt aussen wie 1/r ab. Ein Maximum im Innern schliesst Monotonie aus (siehe das Profildiagramm im Wirbel-Kapitel).'],
      ['(c) In einer 2D-Strömung ist (ω·∇)u = 0.', true,
        'ω zeigt in z, u hängt nicht von z ab → die Ableitung längs ω verschwindet. Steht wörtlich im Skript S. 85 und ist Abschnitt 2 oben.'],
      ['(d) Konservative Kräfte ergeben keinen Beitrag zur Wirbeltransportgleichung.', true,
        'Konservativ heisst f = −∇U, und die Rotation eines Gradienten ist immer null. Bei der Rotationsbildung der Impulsgleichung fällt der Term deshalb heraus — es ist eine der Voraussetzungen, unter denen das Skript die Gleichung herleitet (S. 84).']
    ], '⚠ Diese Prüfung (HS19) liegt nicht als digitalisierte Musterlösung vor — die Begründungen sind aus dem Skript hergeleitet.'));

    root.appendChild(FV.section('5 · Die Fallen'));
    root.appendChild(FV.note('warn', 'Worauf du achten musst',
      '<ul style="margin:0">' +
      '<li><strong>«Wirbelstreckungsterm» heisst nicht «Streckung».</strong> W ist der Sammelname für ' +
      'Streckung <em>und</em> Kippen. W ≠ 0 sagt allein noch nicht, dass etwas gestreckt wird.</li>' +
      '<li><strong>Nur die Änderung längs ω zählt.</strong> Ein noch so starker Geschwindigkeitsgradient ' +
      '<em>quer</em> zum Element trägt nichts zu W bei. Prüfe im Bild immer: wie ändert sich u, wenn ich ' +
      'am Element entlanglaufe?</li>' +
      '<li><strong>Element parallel zur Strömung ≠ automatisch Streckung.</strong> Es kommt darauf an, ob ' +
      'u längs des Elements <em>zunimmt</em>. Bei gleich langen Pfeilen entlang des Elements ist W = 0 ' +
      '(so die FS25-Variante).</li>' +
      '<li><strong>W zeigt nie die Bewegungsrichtung des Elements an</strong>, sondern die Änderungsrate ' +
      'von ω. Der Anteil parallel zu ω ändert den Betrag, der senkrechte die Richtung.</li>' +
      '<li><strong>Erhalten ist Γ, nicht ω.</strong> Die lokale Wirbelstärke darf sich sehr wohl ändern — ' +
      'die Zirkulation um eine materielle Kurve nicht (Kelvin).</li>' +
      '</ul>'));

    /* ---- Hilfsfunktion: Antwort-Tabelle ---- */
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

    /* ---------------- Loop ---------------- */

    var prev = null;
    FV.loop(function (t) {
      if (prev === null) prev = t;
      var dt = Math.min(t - prev, 0.05); prev = t;
      pirT += dt;

      // materielles Element advektieren, Mittelpunkt festhalten
      function adv(p, d) {
        var u = uField(p[0], p[1]);
        return [p[0] + u[0] * d, p[1] + u[1] * d];
      }
      var d2 = dt * 0.55;
      mat.a = adv(mat.a, d2);
      mat.b = adv(mat.b, d2);
      var mx = (mat.a[0] + mat.b[0]) / 2, my = (mat.a[1] + mat.b[1]) / 2;
      mat.a[0] -= mx; mat.a[1] -= my; mat.b[0] -= mx; mat.b[1] -= my;

      var len = Math.hypot(mat.b[0] - mat.a[0], mat.b[1] - mat.a[1]);
      if (len > 3.4 || len < 0.25) resetMat();

      // Streckungsverhältnis in die Anzeige
      roW.set('om', (len / mat.L0).toFixed(2));

      cvNext.draw(); cvPir.draw();
    });
  }
});
