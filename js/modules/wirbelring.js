/* ============================================================
   Wirbelring in Wandnähe — Spiegelwirbel
   Skript Kap. 10.3 (Biot-Savart S. 83, Wirbelsätze S. 87 ff.)
   Deckt die Prüfungsaufgaben 3.4 und 3.5 (HS19) ab.

   Modell: Schnitt durch den Ring → zwei gegenläufige Punktwirbel.
   Die Wand wird exakt durch Spiegelwirbel ersetzt (Position gespiegelt,
   Zirkulation umgekehrt) — damit ist die Normalgeschwindigkeit dort null.
   ============================================================ */

FV.register({
  id: 'wirbelring',
  chapter: 'Drehungsbehaftete Strömungen',
  chapterNo: '10.3',
  title: 'Wirbelring an der Wand',
  subtitle: 'Was eine Wand mit einem Wirbelring macht — und warum Spiegelwirbel die Antwort geben.',
  source: 'Skript S. 83 (Biot-Savart), S. 87 ff. (Wirbelsätze)',

  build: function (root) {
    var h = FV.h;
    var GAMMA = 4 * Math.PI;   // so gewählt, dass ein Paar mit Abstand 2R sich mit 1/R bewegt

    /* ---------------- Punktwirbel-Mechanik ---------------- */

    function induced(px, py, vs, skip) {
      var ux = 0, uy = 0;
      for (var i = 0; i < vs.length; i++) {
        if (i === skip) continue;
        var dx = px - vs[i].x, dy = py - vs[i].y;
        var r2 = dx * dx + dy * dy;
        if (r2 < 1e-9) continue;
        ux += vs[i].G / (2 * Math.PI) * (-dy) / r2;
        uy += vs[i].G / (2 * Math.PI) * (dx) / r2;
      }
      return [ux, uy];
    }

    // ein Zeitschritt; wall = true → Spiegelwirbel an y = 0 mitrechnen
    function step(real, dt, wall) {
      var all = real.slice();
      if (wall) {
        for (var i = 0; i < real.length; i++) all.push({ x: real[i].x, y: -real[i].y, G: -real[i].G });
      }
      var v = [];
      for (var j = 0; j < real.length; j++) v.push(induced(real[j].x, real[j].y, all, j));
      for (var k = 0; k < real.length; k++) { real[k].x += v[k][0] * dt; real[k].y += v[k][1] * dt; }
      return v;
    }

    /* ---------------- Einstieg ---------------- */

    root.appendChild(FV.note('', 'Das Werkzeug: Spiegelwirbel',
      'Biot-Savart im Skript (S. 83) gilt für den <em>freien Raum ohne Wände</em>. Eine ebene, ' +
      'undurchlässige Wand baut man trotzdem exakt ein: man ergänzt zu jedem Wirbel einen ' +
      '<strong>Spiegelwirbel</strong> — an der Wand gespiegelte Position, umgekehrte Zirkulation. ' +
      'Beide zusammen erzeugen an der Wand eine rein wandparallele Strömung, die Normalkomponente ' +
      'ist überall null. Genau das verlangt die Randbedingung. Die Wand kann man dann weglassen und ' +
      'rechnet nur noch mit Wirbeln im freien Raum.'));

    root.appendChild(FV.section('1 · Warum das funktioniert'));

    var showMirror1 = true;
    var cvMirror = FV.canvas({
      aspect: 0.50,
      render: function (ctx, w, hgt) {
        var wallY = hgt * 0.52;
        var sc = Math.min(w / 6.4, (hgt * 0.40) / 1.35);
        var cx = w / 2;
        function X(x) { return cx + x * sc; }
        function Y(y) { return wallY - y * sc; }

        var vs = [{ x: 0, y: 1.1, G: GAMMA }];
        if (showMirror1) vs.push({ x: 0, y: -1.1, G: -GAMMA });

        // Wand
        ctx.save();
        ctx.fillStyle = '#161d25';
        ctx.fillRect(0, wallY, w, hgt - wallY);
        ctx.strokeStyle = '#8b98a6'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, wallY); ctx.lineTo(w, wallY); ctx.stroke();
        ctx.restore();

        // Geschwindigkeitsfeld
        for (var i = 0; i < 13; i++) {
          for (var j = 0; j < 5; j++) {
            var x = -2.7 + i * 5.4 / 12;
            var y = 0.16 + j * 1.7 / 4;
            var u = induced(x, y, vs, -1);
            var m = Math.hypot(u[0], u[1]);
            var k = Math.min(0.30, 0.30 / Math.max(m, 0.9)) * sc;
            FV.arrow(ctx, X(x), Y(y), X(x) + u[0] * k, Y(y) - u[1] * k, 'rgba(86,200,245,.45)', 1.2, 4.5);
          }
        }

        // Geschwindigkeit exakt auf der Wand — dort muss v⊥ verschwinden
        for (var q = 0; q < 11; q++) {
          var xw = -2.6 + q * 5.2 / 10;
          var uw = induced(xw, 0, vs, -1);
          var senk = Math.abs(uw[1]) < 1e-9;
          var col = senk ? '#6fdd8b' : '#ff6b6b';
          var kk = 0.42 * sc;
          FV.arrow(ctx, X(xw), wallY - 2, X(xw) + uw[0] * kk, wallY - 2 - uw[1] * kk, col, 2.2, 7);
        }

        drawVortex(ctx, X(0), Y(1.1), 13, GAMMA, '#ff8a4c', 1);
        if (showMirror1) drawVortex(ctx, X(0), Y(-1.1), 13, -GAMMA, '#56c8f5', 0.5);

        FV.text(ctx, 12, 20, showMirror1 ? 'mit Spiegelwirbel' : 'ohne Spiegelwirbel',
          { color: '#c8d3de', font: '13px -apple-system, sans-serif' });
        FV.text(ctx, 12, 38,
          showMirror1 ? 'auf der Wand: rein wandparallel  →  Randbedingung erfüllt'
            : 'auf der Wand: Strömung dringt hindurch  →  unphysikalisch',
          { color: showMirror1 ? '#6fdd8b' : '#ff6b6b', font: '11.5px -apple-system, sans-serif' });
        FV.text(ctx, w - 12, hgt - 10, 'grün: v⊥ = 0 an der Wand',
          { color: '#6e7d8c', align: 'right', font: '11px -apple-system, sans-serif' });
      },
      cap: 'Schalte den Spiegelwirbel ab und sieh, was ohne ihn an der Wand passiert.'
    });

    function drawVortex(ctx, px, py, r, G, col, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha === undefined ? 1 : alpha;
      ctx.strokeStyle = col; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(px, py, r, 0, 6.2832); ctx.stroke();
      // Drehrichtungspfeil
      var dir = G > 0 ? 1 : -1;
      ctx.beginPath();
      ctx.arc(px, py, r, dir > 0 ? -1.9 : 1.9, dir > 0 ? -0.35 : 0.35, dir < 0);
      ctx.stroke();
      var a = dir > 0 ? -0.35 : 0.35;
      var tx = px + Math.cos(a) * r, ty = py + Math.sin(a) * r;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(tx, ty, 2.8, 0, 6.2832); ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(px, py, 3, 0, 6.2832); ctx.fill();
      ctx.restore();
    }

    root.appendChild(cvMirror);
    root.appendChild(FV.ctrlRow(
      FV.toggle('Spiegelwirbel', true, function (s) { showMirror1 = s; cvMirror.draw(); })
    ));

    root.appendChild(FV.note('key', 'Was der Spiegelwirbel physikalisch bedeutet',
      'Er ist kein echter Wirbel, sondern ein Rechentrick, der die Wandwirkung ersetzt. Für den realen ' +
      'Wirbel fühlt sich die Wand deshalb genau wie ein zweiter, gegenläufiger Wirbel an — und zwei ' +
      'gegenläufige Wirbel <em>bewegen sich gemeinsam</em>. Daher rührt jeder Effekt auf den folgenden ' +
      'Bildern.'));

    /* ---------------- Gemeinsame Simulationsansicht ---------------- */

    function makeSim(cfg) {
      /* cfg: {init(), label, mode:'perp'|'par'} */
      var sim = {
        real: null, free: null, t: 0, running: true, wall: true, trail: [], trailFree: []
      };

      function reset() {
        sim.real = cfg.init();
        sim.free = cfg.init();
        sim.t = 0; sim.trail = []; sim.trailFree = [];
      }
      reset();

      var ro = FV.readout(cfg.readouts);

      var cv = FV.canvas({
        aspect: 0.62,
        render: function (ctx, w, hgt) {
          var wallY = hgt - 34;
          var sc = Math.min(w / 6.6, (hgt - 60) / 3.3);
          var cx = w * (cfg.mode === 'par' ? 0.30 : 0.5);
          function X(x) { return cx + x * sc; }
          function Y(y) { return wallY - y * sc; }

          // Wand
          ctx.save();
          ctx.fillStyle = '#161d25';
          ctx.fillRect(0, wallY, w, hgt - wallY);
          ctx.strokeStyle = '#8b98a6'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(0, wallY); ctx.lineTo(w, wallY); ctx.stroke();
          ctx.restore();
          FV.text(ctx, w - 8, hgt - 10, 'Wand', { color: '#6e7d8c', align: 'right', font: '11px -apple-system, sans-serif' });

          // Referenz ohne Wand
          if (sim.wall) {
            ctx.save(); ctx.globalAlpha = 0.30;
            drawRing(ctx, X, Y, sc, sim.free, '#8b98a6');
            ctx.restore();
            drawTrail(ctx, X, Y, sim.trailFree, 'rgba(139,152,166,.35)');
          }

          // Spiegelwirbel
          if (sim.wall) {
            ctx.save(); ctx.globalAlpha = 0.45; ctx.setLineDash([4, 4]);
            sim.real.forEach(function (v) {
              drawVortex(ctx, X(v.x), Y(-v.y), 11, -v.G, '#56c8f5', 0.55);
            });
            ctx.restore();
            // Verbindung real ↔ Spiegel
            ctx.save(); ctx.strokeStyle = 'rgba(86,200,245,.18)'; ctx.setLineDash([3, 4]);
            sim.real.forEach(function (v) {
              ctx.beginPath(); ctx.moveTo(X(v.x), Y(v.y)); ctx.lineTo(X(v.x), Y(-v.y)); ctx.stroke();
            });
            ctx.restore();
          }

          drawTrail(ctx, X, Y, sim.trail, 'rgba(255,138,76,.45)');
          drawRing(ctx, X, Y, sc, sim.real, '#ff8a4c');

          FV.text(ctx, 12, 20, cfg.label, { color: '#c8d3de', font: '12.5px -apple-system, sans-serif' });
          if (sim.wall) FV.text(ctx, 12, 38, 'grau: derselbe Ring ohne Wand',
            { color: '#6e7d8c', font: '11px -apple-system, sans-serif' });
          FV.text(ctx, w - 8, 20, 't = ' + sim.t.toFixed(2),
            { color: '#6e7d8c', align: 'right', font: '11px ui-monospace, monospace' });
        },
        cap: cfg.cap
      });

      function drawTrail(ctx, X, Y, tr, col) {
        if (tr.length < 2) return;
        ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.setLineDash([]);
        ctx.beginPath();
        tr.forEach(function (p, i) { i ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1])); });
        ctx.stroke(); ctx.restore();
      }

      function drawRing(ctx, X, Y, sc, vs, col) {
        var a = vs[0], b = vs[1];
        var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        var dx = b.x - a.x, dy = b.y - a.y;
        var half = Math.hypot(dx, dy) / 2;
        var ang = Math.atan2(-dy, dx);        // Bildschirmwinkel (y gespiegelt)

        // Ring als Ellipse durch beide Schnittpunkte
        ctx.save();
        ctx.translate(X(mx), Y(my)); ctx.rotate(ang);
        ctx.strokeStyle = col; ctx.globalAlpha = 0.45; ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(0, 0, half * sc, half * sc * 0.30, 0, 0, 6.2832);
        ctx.stroke();
        ctx.restore();

        // Bewegungsrichtung
        var all = vs.slice();
        if (sim.wall && vs === sim.real) {
          vs.forEach(function (v) { all.push({ x: v.x, y: -v.y, G: -v.G }); });
        }
        var v0 = induced(a.x, a.y, all, 0), v1 = induced(b.x, b.y, all, 1);
        var vmx = (v0[0] + v1[0]) / 2, vmy = (v0[1] + v1[1]) / 2;
        var vm = Math.hypot(vmx, vmy);
        if (vm > 1e-3) {
          FV.arrow(ctx, X(mx), Y(my), X(mx) + vmx / vm * 30, Y(my) - vmy / vm * 30, col, 2.2, 8);
        }

        drawVortex(ctx, X(a.x), Y(a.y), 12, a.G, col, 1);
        drawVortex(ctx, X(b.x), Y(b.y), 12, b.G, col, 1);
      }

      sim.cv = cv; sim.ro = ro; sim.reset = reset;
      cfg.update(sim, ro);      // Readouts sofort füllen, nicht erst im ersten Frame
      sim.advance = function (dt) {
        if (!sim.running) return;
        var sub = 24, d = dt / sub;
        for (var i = 0; i < sub; i++) {
          step(sim.real, d, sim.wall);
          step(sim.free, d, false);
        }
        sim.t += dt;
        var m = [(sim.real[0].x + sim.real[1].x) / 2, (sim.real[0].y + sim.real[1].y) / 2];
        var mf = [(sim.free[0].x + sim.free[1].x) / 2, (sim.free[0].y + sim.free[1].y) / 2];
        sim.trail.push(m); sim.trailFree.push(mf);
        if (sim.trail.length > 420) { sim.trail.shift(); sim.trailFree.shift(); }
        if (cfg.done(sim)) reset();
        cfg.update(sim, ro);
      };
      return sim;
    }

    /* ---------------- Fall 1: senkrecht auf die Wand zu ---------------- */

    root.appendChild(FV.section('2 · Aufgabe 3.4 — Ring bewegt sich senkrecht auf die Wand zu'));

    root.appendChild(h('p', { html:
      'Die Ringebene liegt <strong>parallel</strong> zur Wand, der Ring fällt darauf zu. Der Schnitt geht ' +
      'durch die Ringachse: links und rechts sieht man denselben Ring, einmal von jeder Seite — deshalb ' +
      'sind die beiden Zirkulationen entgegengesetzt. Der Abstand der beiden Punkte ist der ' +
      '<strong>Ringdurchmesser</strong>.' }));

    root.appendChild(schema3D('perp'));

    var simA = makeSim({
      mode: 'perp',
      label: 'Schnitt durch die Ringachse — Ringebene parallel zur Wand',
      init: function () {
        return [{ x: -0.9, y: 2.5, G: -GAMMA }, { x: 0.9, y: 2.5, G: GAMMA }];
      },
      readouts: [
        { key: 'R', lab: 'Ringradius R / R₀', cls: 'c1' },
        { key: 'h', lab: 'Abstand zur Wand', cls: 'c2' },
        { key: 'v', lab: 'Annäherungsgeschwindigkeit', cls: 'c2' },
        { key: 'vf', lab: 'dieselbe ohne Wand', cls: 'c3' }
      ],
      done: function (s) { return s.real[0].y < 0.40 || s.real[1].x > 2.4; },
      update: function (s, ro) {
        var R = (s.real[1].x - s.real[0].x) / 2;
        var hh = (s.real[0].y + s.real[1].y) / 2;
        var all = s.real.concat(s.wall ? s.real.map(function (v) { return { x: v.x, y: -v.y, G: -v.G }; }) : []);
        var v0 = induced(s.real[0].x, s.real[0].y, all, 0);
        var f0 = induced(s.free[0].x, s.free[0].y, s.free, 0);
        ro.set('R', (R / 0.9).toFixed(3));
        ro.set('h', hh.toFixed(3));
        ro.set('v', Math.abs(v0[1]).toFixed(3));
        ro.set('vf', Math.abs(f0[1]).toFixed(3));
      },
      cap: 'Orange der reale Ring, blass gestrichelt die Spiegelwirbel, grau derselbe Ring ohne Wand.'
    });

    root.appendChild(simA.cv);
    root.appendChild(FV.ctrlRow(
      FV.toggle('▶ läuft', true, function (s) { simA.running = s; }),
      FV.button('zurücksetzen', function () { simA.reset(); }),
      FV.toggle('Wand (Spiegelwirbel)', true, function (s) { simA.wall = s; simA.reset(); })
    ));
    root.appendChild(simA.ro);

    root.appendChild(FV.note('key', 'Was passiert',
      'Jeder Wirbel sieht in erster Linie <strong>seinen eigenen</strong> Spiegel senkrecht unter sich. ' +
      'Ein solches Paar bewegt sich senkrecht zu seiner Verbindungslinie, also <em>horizontal nach ' +
      'aussen</em>. Der Ring wird deshalb <strong>grösser</strong>. Und weil die Selbstinduktion eines ' +
      'Rings mit wachsendem Radius abnimmt (~ Γ/R), wird er dabei <strong>langsamer</strong>. Der graue ' +
      'Vergleichsring ohne Wand behält seinen Radius und seine Geschwindigkeit exakt bei.'));

    /* ---------------- Fall 2: parallel zur Wand ---------------- */

    root.appendChild(FV.section('3 · Aufgabe 3.5 — Ring bewegt sich parallel zur Wand'));

    root.appendChild(h('p', { html:
      'Jetzt steht die Ringebene <strong>senkrecht</strong> zur Wand, der Ring fliegt an ihr entlang. ' +
      'Im Schnitt liegen die beiden Ringhälften übereinander: eine wandnah, eine wandfern. Und genau ' +
      'diese Unsymmetrie entscheidet alles.' }));

    root.appendChild(schema3D('par'));

    var simB = makeSim({
      mode: 'par',
      label: 'Seitenansicht — Ringebene senkrecht zur Wand',
      init: function () {
        return [{ x: -1.4, y: 2.1, G: GAMMA }, { x: -1.4, y: 1.1, G: -GAMMA }];
      },
      readouts: [
        { key: 'tilt', lab: 'Kippwinkel der Ringebene', cls: 'c3' },
        { key: 'hh', lab: 'Abstand zur Wand', cls: 'c2' },
        { key: 'd', lab: 'Ringdurchmesser', cls: 'c1' },
        { key: 'sp', lab: 'Weg zurückgelegt', cls: 'c1' },
        { key: 'spf', lab: 'Weg ohne Wand', cls: 'c3' }
      ],
      // Abbruch, bevor das Punktwirbelmodell in Wandnähe entartet
      done: function (s) {
        var d = Math.hypot(s.real[0].x - s.real[1].x, s.real[0].y - s.real[1].y);
        return s.real[0].x > 2.2 || s.real[1].y < 0.55 || d > 1.35;
      },
      update: function (s, ro) {
        var dx = s.real[0].x - s.real[1].x, dy = s.real[0].y - s.real[1].y;
        var tilt = Math.atan2(dx, dy) * 180 / Math.PI;
        var hh = (s.real[0].y + s.real[1].y) / 2;
        ro.set('tilt', (tilt >= 0 ? '+' : '') + tilt.toFixed(1) + '°');
        ro.set('hh', hh.toFixed(3));
        ro.set('d', Math.hypot(dx, dy).toFixed(3));
        ro.set('sp', ((s.real[0].x + s.real[1].x) / 2 + 1.4).toFixed(3));
        ro.set('spf', ((s.free[0].x + s.free[1].x) / 2 + 1.4).toFixed(3));
      },
      cap: 'Achte auf die Verbindungslinie der beiden Wirbel: sie steht anfangs senkrecht und neigt sich mit der Zeit.'
    });

    root.appendChild(simB.cv);
    root.appendChild(FV.ctrlRow(
      FV.toggle('▶ läuft', true, function (s) { simB.running = s; }),
      FV.button('zurücksetzen', function () { simB.reset(); }),
      FV.toggle('Wand (Spiegelwirbel)', true, function (s) { simB.wall = s; simB.reset(); })
    ));
    root.appendChild(simB.ro);

    root.appendChild(FV.note('key', 'Was passiert',
      'Der <strong>wandnahe</strong> Wirbel ist seinem Spiegel näher als der wandferne dem seinen — und ' +
      'Nähe heisst nach Biot-Savart stärkere Induktion (u ~ Γ/2πr). Deshalb wird die wandnahe Hälfte ' +
      'stärker gebremst als die wandferne. Die Verbindungslinie neigt sich, die wandferne Seite eilt ' +
      'voraus: der Ring <strong>kippt</strong>. Da ein Wirbelpaar sich immer senkrecht zu seiner ' +
      'Verbindungslinie bewegt, dreht die Flugrichtung mit — der Ring läuft nun schräg <em>zur Wand ' +
      'hin</em>. Der Ringdurchmesser bleibt dabei praktisch unverändert.'));

    /* ---------------- 3D-Schema ---------------- */

    function schema3D(mode) {
      return FV.canvas({
        aspect: 0.30,
        render: function (ctx, w, hgt) {
          var cx = w * 0.5, cy = hgt * 0.46, s = Math.min(w / 7.5, hgt / 2.6);
          function P(x, y, z) { return [cx + (x - y * 0.55) * s, cy + (y * 0.32) * s - z * s]; }

          // Wandebene
          ctx.save();
          ctx.fillStyle = 'rgba(139,152,166,.08)';
          ctx.strokeStyle = 'rgba(139,152,166,.45)'; ctx.lineWidth = 1.2;
          ctx.beginPath();
          [[-2.4, -1.5], [2.4, -1.5], [2.4, 1.5], [-2.4, 1.5]].forEach(function (q, i) {
            var p = P(q[0], q[1], 0);
            i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]);
          });
          ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.restore();

          if (mode === 'perp') {
            // Ring horizontal über der Wand
            ctx.save(); ctx.strokeStyle = '#ff8a4c'; ctx.lineWidth = 2.4;
            var c0 = P(0, 0, 1.15);
            ctx.beginPath(); ctx.ellipse(c0[0], c0[1], 1.05 * s, 0.34 * s, 0, 0, 6.2832); ctx.stroke();
            ctx.restore();
            FV.arrow(ctx, c0[0], c0[1], c0[0], c0[1] + 0.62 * s, '#ff8a4c', 2.2, 8);
            // Schnittebene
            ctx.save(); ctx.strokeStyle = 'rgba(86,200,245,.65)'; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.4;
            var a1 = P(-1.6, 0, 1.75), a2 = P(1.6, 0, 1.75), a3 = P(1.6, 0, 0), a4 = P(-1.6, 0, 0);
            ctx.beginPath(); ctx.moveTo(a1[0], a1[1]); ctx.lineTo(a2[0], a2[1]);
            ctx.lineTo(a3[0], a3[1]); ctx.lineTo(a4[0], a4[1]); ctx.closePath(); ctx.stroke();
            ctx.restore();
            FV.text(ctx, 12, 18, 'Ringebene parallel zur Wand, Bewegung senkrecht darauf zu',
              { color: '#c8d3de', font: '12px -apple-system, sans-serif' });
          } else {
            // Ring vertikal
            ctx.save(); ctx.strokeStyle = '#ff8a4c'; ctx.lineWidth = 2.4;
            var c1 = P(-0.7, 0, 1.15);
            ctx.translate(c1[0], c1[1]);
            ctx.beginPath(); ctx.ellipse(0, 0, 0.34 * s, 0.95 * s, 0, 0, 6.2832); ctx.stroke();
            ctx.restore();
            FV.arrow(ctx, c1[0], c1[1], c1[0] + 1.15 * s, c1[1], '#ff8a4c', 2.2, 8);
            ctx.save(); ctx.strokeStyle = 'rgba(86,200,245,.65)'; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.4;
            var b1 = P(-2.0, 0, 2.15), b2 = P(2.0, 0, 2.15), b3 = P(2.0, 0, 0), b4 = P(-2.0, 0, 0);
            ctx.beginPath(); ctx.moveTo(b1[0], b1[1]); ctx.lineTo(b2[0], b2[1]);
            ctx.lineTo(b3[0], b3[1]); ctx.lineTo(b4[0], b4[1]); ctx.closePath(); ctx.stroke();
            ctx.restore();
            FV.text(ctx, 12, 18, 'Ringebene senkrecht zur Wand, Bewegung parallel dazu',
              { color: '#c8d3de', font: '12px -apple-system, sans-serif' });
          }
          FV.text(ctx, w - 12, hgt - 8, 'blau gestrichelt: die Schnittebene der Simulation unten',
            { color: '#6e7d8c', align: 'right', font: '11px -apple-system, sans-serif' });
        }
      });
    }

    /* ---------------- Auflösung ---------------- */

    root.appendChild(FV.section('4 · Die Prüfungsaufgaben'));

    root.appendChild(h('h3', null, 'Aufgabe 3.4 — Wirbelring senkrecht zur Wand (HS19, MC)'));
    root.appendChild(answerTable([
      ['(a) Der Wirbelring wird langsamer.', true,
        'Die Eigengeschwindigkeit eines Wirbelrings fällt mit wachsendem Radius (~ Γ/R). Da der Ring sich aufweitet, bremst er sich selbst ab. In der Simulation oben: die Annäherungsgeschwindigkeit sinkt sichtbar, während der graue Vergleichsring ohne Wand seine behält.'],
      ['(b) Der Wirbelring kippt.', false,
        'Die Anordnung ist rotationssymmetrisch um die Ringachse — jede Ringhälfte hat exakt denselben Wandabstand. Es gibt keine Richtung, in die er kippen könnte.'],
      ['(c) Der Wirbelring wird grösser.', true,
        'Jeder Wirbel bildet mit seinem eigenen Spiegel ein gegenläufiges Paar mit vertikaler Verbindungslinie. Ein solches Paar wandert horizontal — hier nach aussen. Der Ring weitet sich auf.'],
      ['(d) Die Wand hat keinen Einfluss.', false,
        'Wäre nur richtig, wenn der Abstand sehr gross wäre. Die Spiegelwirkung skaliert mit 1/Abstand und ist in Wandnähe deutlich.']
    ], '⚠ HS19 liegt nicht als digitalisierte Musterlösung vor. Die Begründung folgt aus der Spiegelwirbel-Rechnung, die die Simulation oben ausführt.'));

    root.appendChild(h('h3', null, 'Aufgabe 3.5 — Wirbelring parallel zur Wand (HS19, MC)'));
    root.appendChild(answerTable([
      ['(a) Der Wirbelring wird langsamer.', true,
        'Beide Ringhälften werden von den Spiegeln gebremst (die wandnahe stärker). In der Simulation legt der Ring mit Wand nach gleicher Zeit einen messbar kürzeren Weg zurück als der graue ohne Wand — bei den eingestellten Werten rund 10 % weniger.'],
      ['(b) Der Wirbelring kippt.', true,
        'Der Kerneffekt. Die wandnahe Hälfte ist ihrem Spiegel näher und wird stärker gebremst als die wandferne — die Verbindungslinie neigt sich, und mit ihr die Flugrichtung. Der Kippwinkel im Readout wächst stetig an.'],
      ['(c) Der Wirbelring wird kleiner.', false,
        'Der Abstand der beiden Ringhälften bleibt praktisch konstant (Readout «Ringdurchmesser»). Die Spiegel wirken hier fast rein längs der Flugrichtung, nicht quer dazu.'],
      ['(d) Die Wand hat keinen Einfluss.', false,
        'Siehe Kippwinkel und Wegvergleich — beides ohne Wand identisch null bzw. gleich.']
    ], '⚠ HS19 liegt nicht als digitalisierte Musterlösung vor. Die Begründung folgt aus der Spiegelwirbel-Rechnung, die die Simulation oben ausführt.'));

    root.appendChild(FV.note('warn', 'Grenzen des Modells',
      'Die Simulation rechnet den Ringquerschnitt als zwei <em>Punkt</em>wirbel. Damit fehlt der ' +
      'logarithmische Beitrag der Ringkrümmung zur Selbstinduktion, und ein realer Ring hat einen ' +
      'endlichen Kernradius. Die <strong>Richtung</strong> aller Effekte — aufweiten, bremsen, kippen — ' +
      'gibt das Modell korrekt wieder, die Zahlenwerte sind qualitativ. Reibung ist nicht enthalten; ' +
      'in Wandnähe erzeugt ein realer Ring zusätzlich Grenzschicht-Wirbelstärke, die ihn ablenken kann.'));

    root.appendChild(FV.section('5 · Merksätze'));
    root.appendChild(FV.note('key', 'Für die Prüfung',
      '<ul style="margin:0">' +
      '<li><strong>Wand = Spiegelwirbel</strong>, gespiegelte Position und umgekehrte Zirkulation. Damit ' +
      'wird jede Wandaufgabe zu einer Aufgabe im freien Raum.</li>' +
      '<li><strong>Zwei gegenläufige Wirbel bewegen sich senkrecht zu ihrer Verbindungslinie</strong>, ' +
      'mit u = Γ/(2πd). Das ist das ganze Werkzeug — den Rest liest man aus der Geometrie ab.</li>' +
      '<li><strong>Symmetrie prüfen zuerst.</strong> Ist die Anordnung symmetrisch zur Ringachse ' +
      '(Fall 3.4), kann nichts kippen. Ist sie es nicht (Fall 3.5), kippt es fast sicher.</li>' +
      '<li><strong>Näher = stärker.</strong> Wo zwei Beiträge konkurrieren, gewinnt immer der mit dem ' +
      'kleineren Abstand — das entscheidet Fall 3.5 vollständig.</li>' +
      '<li><strong>Ringgeschwindigkeit ~ Γ/R.</strong> Wird ein Ring grösser, wird er langsamer; wird er ' +
      'enger, schneller. Zwei Ringe hintereinander spielen deshalb «leapfrogging».</li>' +
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

    /* ---------------- Loop ---------------- */

    var prev = null;
    FV.loop(function (t) {
      if (prev === null) prev = t;
      var dt = Math.min(t - prev, 0.05); prev = t;
      simA.advance(dt * 0.6);
      simB.advance(dt * 0.6);
      simA.cv.draw(); simB.cv.draw();
    });
  }
});
