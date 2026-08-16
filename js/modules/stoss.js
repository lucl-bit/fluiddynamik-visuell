/* ============================================================
   Verdichtungsstoss  —  Skript Kap. 11.3 (senkrecht), 11.5 (schief)
   Teil 1: warum überhaupt ein Stoss  ·  Teil 2: senkrechter Stoss
   Teil 3: schiefer Stoss + Stossdiagramm
   ============================================================ */

FV.register({
  id: 'stoss',
  chapter: 'Kompressible Strömungen',
  chapterNo: '11.3',
  title: 'Verdichtungsstoss — warum und wie',
  subtitle: 'Ein Stoss ist kein Materialversagen der Gleichungen, sondern ihre einzige mögliche Antwort.',
  source: 'Skript S. 101–112, Abb. 11.3–11.5, 11.9, 11.10',

  build: function (root) {
    var h = FV.h;
    var GAM = 1.4;

    /* ================= Stossbeziehungen (Rankine-Hugoniot) ================= */

    function rhoRatio(M) { return ((GAM + 1) * M * M) / ((GAM - 1) * M * M + 2); }   // ρ2/ρ1 = u1/u2
    function pRatio(M) { return 2 * GAM / (GAM + 1) * M * M - (GAM - 1) / (GAM + 1); }
    function TRatio(M) { return pRatio(M) / rhoRatio(M); }
    function Ma2(M) {
      var n = 1 + (GAM - 1) / 2 * M * M;
      var d = GAM * M * M - (GAM - 1) / 2;
      return Math.sqrt(n / d);
    }
    function p0Ratio(M) {   // p02/p01 = ρ02/ρ01
      var a = Math.pow(1 + 2 * GAM / (GAM + 1) * (M * M - 1), -1 / (GAM - 1));
      var b = Math.pow((GAM + 1) * M * M / (2 + (GAM - 1) * M * M), GAM / (GAM - 1));
      return a * b;
    }
    function dsOverCv(M) {   // (s2-s1)/cv
      return Math.log(pRatio(M) * Math.pow(1 / rhoRatio(M), GAM));
    }

    /* ================= 1 · Warum überhaupt ein Stoss? ================= */

    root.appendChild(FV.note('', 'Die kurze Antwort',
      'Eine Störung im Gas — „hier steht ein Keil“, „hier wird es enger“ — breitet sich nur mit ' +
      '<strong>Schallgeschwindigkeit</strong> aus. Strömt das Gas schneller als der Schall, kann diese ' +
      'Information nicht mehr stromauf laufen. Das Gas „weiss“ also bis zum letzten Moment nichts vom ' +
      'Hindernis und kann sich nicht allmählich anpassen. Gleichzeitig steilen Kompressionswellen von ' +
      'selbst auf, weil ihre schnelleren Anteile die langsameren einholen. Beides zusammen lässt nur ' +
      'eine Lösung übrig: eine <strong>Unstetigkeit</strong>, wenige mittlere freie Weglängen dick.'));

    root.appendChild(FV.section('1a · Wellen holen sich selbst ein — das Aufsteilen'));

    root.appendChild(h('p', { html:
      'Eine Druckwelle ist keine kleine Störung mehr, sobald ihre Amplitude zählt. Wo das Gas verdichtet ' +
      'ist, ist es <em>wärmer</em> — und a = √(γRT) dort <em>grösser</em>. Zusätzlich wird das Gas dort in ' +
      'Laufrichtung mitbewegt. Der Wellenberg läuft also schneller als das Wellental und holt es ein. ' +
      'Die stetige Lösung wird nach endlicher Zeit <strong>mehrdeutig</strong> — und genau dort setzt die ' +
      'Natur den Stoss.' }));

    var steepT = 0, steepRun = true, steepAmp = 0.55;

    var cvSteep = FV.canvas({
      aspect: 0.40,
      render: function (ctx, w, hgt) {
        var P = FV.plot(ctx, {
          w: w, h: hgt, x: [0, 10], y: [-0.15, 1.25],
          pad: { l: 46, r: 16, t: 26, b: 32 },
          xticks: [0, 2, 4, 6, 8, 10], yticks: [0, 0.5, 1],
          xlabel: 'x', ylabel: 'Druckstörung'
        });
        P.grid(); P.axes();

        // Anfangsprofil
        var f0 = function (x) { return Math.exp(-Math.pow((x - 2.0) / 0.85, 2)); };
        // Charakteristiken: x(x0,t) = x0 + (c0 + amp*f0(x0))*t
        var c0 = 0.55;
        var pts = [], n = 500, folded = false, foldX = null, prevX = -1e9;
        for (var i = 0; i <= n; i++) {
          var x0 = i / n * 8;
          var f = f0(x0);
          var x = x0 + (c0 + steepAmp * f) * steepT;
          if (x < prevX && !folded) { folded = true; foldX = x; }
          prevX = x;
          pts.push([x, f]);
        }

        P.clip(function () {
          // Ausgangsprofil blass
          P.curve(f0, { color: 'rgba(122,136,150,.45)', dash: [4, 4], width: 1.4 });
          P.poly(pts, { color: folded ? '#ff6b6b' : '#56c8f5', width: 2.4 });
          if (folded && foldX !== null) {
            P.vline(foldX, { color: '#ff6b6b', dash: [3, 3] });
          }
        });

        FV.text(ctx, 52, 18,
          folded ? 'mehrdeutig — hier bildet sich der Stoss' : 'stetige Welle, steilt vorne auf',
          { color: folded ? '#ff6b6b' : '#56c8f5', font: '12.5px -apple-system, sans-serif' });
        FV.text(ctx, w - 18, 18, 't = ' + steepT.toFixed(2),
          { color: '#7b8896', align: 'right', font: '12px ui-monospace, monospace' });
      },
      cap: 'Die Vorderflanke wird immer steiler, bis die Kurve über sich selbst kippt. ' +
           'Eine dreiwertige Dichte gibt es physikalisch nicht — die Lösung springt stattdessen.'
    });
    root.appendChild(cvSteep);

    var btnSteep = FV.toggle('▶ läuft', true, function (s) {
      steepRun = s; btnSteep.textContent = s ? '▶ läuft' : '⏸ pausiert';
    });
    root.appendChild(FV.ctrlRow(
      btnSteep,
      FV.button('zurück auf t = 0', function () { steepT = 0; }),
      FV.slider({
        label: 'Amplitude (Nichtlinearität)', min: 0.05, max: 1.0, step: 0.01, value: steepAmp,
        fmt: function (v) { return v.toFixed(2); },
        onInput: function (v) { steepAmp = v; }
      }),
      FV.slider({
        label: 'Zeit t (manuell)', min: 0, max: 6, step: 0.01, value: 0,
        fmt: function (v) { return v.toFixed(2); },
        onInput: function (v) { steepT = v; steepRun = false; btnSteep.setState(false); }
      })
    ));

    root.appendChild(FV.note('warn', 'Warum eine Verdünnung nicht aufsteilt',
      'Bei einer <em>Expansions</em>welle ist es genau umgekehrt: die schnellen Anteile laufen vorne weg, ' +
      'die Welle wird flacher. Deshalb gibt es <strong>keine Verdünnungsstösse</strong> — die Expansion ' +
      'verläuft stetig und isentrop (Prandtl-Meyer-Fächer, Kap. 11.6). Formal folgt dasselbe aus dem ' +
      '2. Hauptsatz: s₂ ≥ s₁ erzwingt Ma₁ &gt; 1 und damit p₂ &gt; p₁.'));

    /* ---------------- 1b · Machkegel ---------------- */

    root.appendChild(FV.section('1b · Wer erfährt vom Hindernis? Der Machkegel'));

    root.appendChild(h('p', { html:
      'Die Kugel unten sendet in gleichen Abständen Schallwellen aus und bewegt sich dabei mit ' +
      'Ma = u/a nach rechts. Schiebe Ma über 1 und beobachte, welcher Teil des Raums je eine ' +
      'Welle zu sehen bekommt.' }));

    var machMa = 0.5, machT = 6, machRun = true;
    var machTxt = h('div', { class: 'note', style: 'margin-top:10px' });

    var cvMach = FV.canvas({
      aspect: 0.5,
      render: function (ctx, w, hgt) {
        var cy = hgt * 0.52;
        var sx = w * 0.70;          // Position der Quelle (bleibt stehen, Wellen fallen zurück)
        var a = 46;                 // Pixel pro Sekunde für die Schallausbreitung
        var Tem = 0.42;             // Emissionsintervall
        var nMax = 22;

        // Machkegel-Hilfslinien
        if (machMa > 1.0005) {
          var alpha = Math.asin(1 / machMa);
          ctx.save();
          ctx.fillStyle = 'rgba(86,200,245,.05)';
          ctx.beginPath();
          ctx.moveTo(sx, cy);
          ctx.lineTo(sx - w, cy - w * Math.tan(alpha));
          ctx.lineTo(sx - w, cy + w * Math.tan(alpha));
          ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(255,209,102,.85)'; ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(sx, cy); ctx.lineTo(sx - w, cy - w * Math.tan(alpha));
          ctx.moveTo(sx, cy); ctx.lineTo(sx - w, cy + w * Math.tan(alpha));
          ctx.stroke();
          // Winkelbogen
          ctx.strokeStyle = 'rgba(255,209,102,.6)'; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.arc(sx, cy, 40, Math.PI - alpha, Math.PI); ctx.stroke();
          ctx.restore();
          FV.text(ctx, sx - 30, cy - 13, 'α', { color: '#ffd166', font: 'bold 13px ui-monospace, monospace' });
          FV.text(ctx, sx + 16, cy - 34, 'nichts hört etwas',
            { color: '#6e7d8c', font: '11.5px -apple-system, sans-serif' });
          FV.text(ctx, 14, 56, 'Machwinkel α = ' + (alpha * 180 / Math.PI).toFixed(1) + '°',
            { color: '#ffd166', font: '12px ui-monospace, monospace' });
        }

        // Wellenfronten — nur die jüngsten nMax Emissionen
        ctx.save();
        var kNow = Math.floor(machT / Tem);
        for (var k = kNow; k >= Math.max(0, kNow - nMax); k--) {
          var age = machT - k * Tem;
          if (age <= 0) continue;
          var R = a * age;
          if (R > w * 1.4) continue;
          var cxk = sx - machMa * a * age;
          ctx.strokeStyle = 'rgba(86,200,245,' + Math.max(0.12, 0.75 - age * 0.075).toFixed(3) + ')';
          ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.arc(cxk, cy, R, 0, 6.2832); ctx.stroke();
        }
        ctx.restore();

        // Quelle
        ctx.save();
        ctx.fillStyle = '#ff8a4c';
        ctx.beginPath(); ctx.arc(sx, cy, 6.5, 0, 6.2832); ctx.fill();
        ctx.restore();
        FV.arrow(ctx, sx + 12, cy, sx + 12 + Math.min(machMa * 26 + 12, 74), cy, '#ff8a4c', 2, 8);

        FV.text(ctx, 14, 20, 'Ma = ' + machMa.toFixed(2),
          { color: '#e6edf3', font: '14px ui-monospace, monospace' });
        FV.text(ctx, 14, 38,
          machMa < 0.999 ? 'Unterschall — jeder Punkt wird erreicht'
            : (machMa < 1.001 ? 'Ma = 1 — alle Fronten berühren sich in der Quelle'
              : 'Überschall — nur der Machkegel wird erreicht'),
          { color: '#7b8896', font: '11.5px -apple-system, sans-serif' });
      }
    });
    root.appendChild(cvMach);

    root.appendChild(FV.ctrlRow(
      FV.slider({
        label: 'Mach-Zahl der Quelle', min: 0, max: 3, step: 0.01, value: machMa,
        fmt: function (v) { return v.toFixed(2); },
        onInput: function (v) { machMa = v; updMachTxt(); }
      }),
      FV.toggle('▶ läuft', true, function (s) { machRun = s; }),
      FV.button('Wellen zurücksetzen', function () { machT = 0.01; })
    ));
    root.appendChild(machTxt);

    function updMachTxt() {
      var t;
      if (machMa < 0.02) {
        t = '<div class="note-h">Ma ≈ 0</div>Konzentrische Kreise. Die Störung erreicht jeden Punkt ' +
          'des Raums, in alle Richtungen gleich schnell.';
      } else if (machMa < 0.999) {
        t = '<div class="note-h">Unterschall</div>Die Wellen laufen der Quelle <strong>voraus</strong>. ' +
          'Das Gas stromauf erfährt rechtzeitig, dass etwas kommt, und weicht kontinuierlich aus — ' +
          'deshalb gibt es im Unterschall keine Stösse. Vorne stehen die Fronten dichter (Doppler).';
      } else if (machMa < 1.05) {
        t = '<div class="note-h">Ma = 1</div>Die Quelle läuft genau so schnell wie ihr eigenes Signal. ' +
          'Alle Fronten berühren sich in <strong>einem</strong> Punkt: die Störungen überlagern sich zu einer ' +
          'ebenen, unendlich steilen Front. Das ist der Grenzfall, aus dem der Stoss wird.';
      } else {
        var al = Math.asin(1 / machMa) * 180 / Math.PI;
        t = '<div class="note-h">Überschall</div>Alle Wellen bleiben hinter der Quelle. Ihre Einhüllende ' +
          'ist der <strong>Machkegel</strong> mit sin α = 1/Ma, hier α = ' + al.toFixed(1) + '°. ' +
          'Ausserhalb liegt die <em>Zone of Silence</em>: dieses Gas weiss nichts vom Hindernis. ' +
          'Es kann sich nicht vorbereiten — und muss beim Erreichen der Front seinen Zustand ' +
          '<strong>sprunghaft</strong> ändern.';
      }
      machTxt.innerHTML = t;
      machTxt.className = 'note' + (machMa > 1.0 ? ' warn' : '');
    }
    updMachTxt();

    root.appendChild(FV.eq('sin α = <span class="frac"><span>1</span><span class="den">Ma</span></span>',
      'Machscher Winkel · Skript Abb. 11.11/11.12. Für Ma → 1 wird α → 90° (senkrechter Stoss), ' +
      'für Ma → ∞ wird α → 0.'));

    /* ================= 2 · Senkrechter Verdichtungsstoss ================= */

    root.appendChild(FV.section('2 · Der senkrechte Verdichtungsstoss'));

    root.appendChild(h('p', { html:
      'Kontrollvolumen um die Front, A₁ = A₂. Masse, Impuls und Energie müssen erfüllt sein — mehr nicht. ' +
      'Die Gleichungen sind nichtlinear und lassen deshalb <strong>zwei</strong> Lösungen zu: die triviale ' +
      '(nichts passiert) und eine unstetige. Die unstetige ist der Stoss.' }));

    root.appendChild(FV.eq(
      'ρ₁u₁ = ρ₂u₂ &nbsp;&nbsp;|&nbsp;&nbsp; ρ₁u₁² + p₁ = ρ₂u₂² + p₂ &nbsp;&nbsp;|&nbsp;&nbsp; h₁ + ½u₁² = h₂ + ½u₂²',
      'Skript S. 101 · daraus die Prandtl-Relation u₁·u₂ = a*² bzw. La₁·La₂ = 1'));

    var Ma1 = 2.0, shockRun = true;
    var particles = [];
    var pRelease = 0;
    var prefilled = false;

    var roShock = FV.readout([
      { key: 'Ma2', lab: 'Ma₂ nach dem Stoss', cls: 'c2' },
      { key: 'p', lab: 'p₂/p₁', cls: 'c1' },
      { key: 'rho', lab: 'ρ₂/ρ₁ = u₁/u₂', cls: 'c1' },
      { key: 'T', lab: 'T₂/T₁', cls: 'c1' },
      { key: 'p0', lab: 'p₀₂/p₀₁ (Ruhedruck)', cls: 'c3' },
      { key: 'ds', lab: '(s₂−s₁)/c_v', cls: 'c3' }
    ]);

    var cvShock = FV.canvas({
      aspect: 0.46,
      render: function (ctx, w, hgt) {
        var top = 46, bot = hgt - 76, xs = w * 0.5;

        // Rohr
        ctx.save();
        ctx.strokeStyle = '#3a4552'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, top); ctx.lineTo(w, top);
        ctx.moveTo(0, bot); ctx.lineTo(w, bot); ctx.stroke();
        ctx.restore();

        // Stossfront
        ctx.save();
        var g = ctx.createLinearGradient(xs - 9, 0, xs + 9, 0);
        g.addColorStop(0, 'rgba(255,209,102,0)');
        g.addColorStop(0.5, 'rgba(255,209,102,.55)');
        g.addColorStop(1, 'rgba(255,209,102,0)');
        ctx.fillStyle = g; ctx.fillRect(xs - 9, top, 18, bot - top);
        ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.moveTo(xs, top); ctx.lineTo(xs, bot); ctx.stroke();
        ctx.restore();
        FV.text(ctx, xs, top - 10, 'Stoss', { color: '#ffd166', align: 'center', font: '12px -apple-system, sans-serif' });

        // Teilchen — Position relativ gespeichert, damit Resize nichts verschiebt
        var tR = TRatio(Ma1);
        var hotCol = tR < 1.3 ? '#8ad9f0' : (tR < 1.8 ? '#f3c96b' : (tR < 2.6 ? '#ff9a4c' : '#ff5f4c'));
        ctx.save();
        particles.forEach(function (p) {
          var px = p.xr * w;
          var py = top + 8 + p.yr * (bot - top - 16);
          ctx.fillStyle = px > xs ? hotCol : '#56c8f5';
          ctx.beginPath(); ctx.arc(px, py, 2.7, 0, 6.2832); ctx.fill();
        });
        ctx.restore();

        // Beschriftungen links / rechts
        FV.text(ctx, 12, top - 10, 'Ma₁ = ' + Ma1.toFixed(2) + '  (Überschall)',
          { color: '#56c8f5', font: '12.5px ui-monospace, monospace' });
        FV.text(ctx, w - 12, top - 10, 'Ma₂ = ' + Ma2(Ma1).toFixed(3) + '  (Unterschall)',
          { color: '#ff8a4c', align: 'right', font: '12.5px ui-monospace, monospace' });

        // Balkenvergleich vor / nach dem Stoss
        var barY = bot + 16, bw = w * 0.40;
        FV.text(ctx, 12, barY - 4, 'vor dem Stoss', { color: '#6e7d8c', font: '11px -apple-system, sans-serif' });
        FV.text(ctx, w - 12, barY - 4, 'nach dem Stoss',
          { color: '#6e7d8c', align: 'right', font: '11px -apple-system, sans-serif' });
        drawBars(ctx, 12, barY, bw, ['p', 'ρ', 'T'], [1, 1, 1], '#4a5663');
        drawBars(ctx, w - 12 - bw, barY, bw, ['p', 'ρ', 'T'],
          [pRatio(Ma1), rhoRatio(Ma1), TRatio(Ma1)], '#ff8a4c');
      },
      cap: 'Die Teilchen werden links gleichmässig eingespeist. Hinter der Front laufen sie langsamer ' +
           'und rücken deshalb enger zusammen — das <em>ist</em> ρ₁u₁ = ρ₂u₂. Die Farbe zeigt die Temperatur.'
    });

    function drawBars(ctx, x, y, w, labs, vals, col) {
      var maxV = 8, bh = 9, gap = 6, x0 = x + 18, wBar = w - 60;
      ctx.save();
      labs.forEach(function (l, i) {
        var yy = y + i * (bh + gap);
        ctx.fillStyle = '#1e2732'; ctx.fillRect(x0, yy, wBar, bh);
        ctx.fillStyle = col;
        ctx.fillRect(x0, yy, Math.min(vals[i] / maxV, 1) * wBar, bh);
        FV.text(ctx, x, yy + bh - 1, l, { color: '#8b98a6', font: '11px ui-monospace, monospace' });
        FV.text(ctx, x0 + wBar + 6, yy + bh - 1, '×' + vals[i].toFixed(2),
          { color: '#8b98a6', font: '11px ui-monospace, monospace' });
      });
      ctx.restore();
    }

    root.appendChild(cvShock);
    root.appendChild(FV.ctrlRow(
      FV.slider({
        label: 'Mach-Zahl vor dem Stoss Ma₁', min: 1.0, max: 4.0, step: 0.01, value: Ma1,
        fmt: function (v) { return v.toFixed(2); },
        onInput: function (v) { Ma1 = v; updShock(); }
      }),
      FV.toggle('▶ läuft', true, function (s) { shockRun = s; })
    ));
    root.appendChild(roShock);

    function updShock() {
      roShock.set('Ma2', Ma2(Ma1).toFixed(3));
      roShock.set('p', pRatio(Ma1).toFixed(2));
      roShock.set('rho', rhoRatio(Ma1).toFixed(2));
      roShock.set('T', TRatio(Ma1).toFixed(2));
      roShock.set('p0', p0Ratio(Ma1).toFixed(3));
      roShock.set('ds', dsOverCv(Ma1).toFixed(3));
      if (cvStates) cvStates.draw();
      if (cvEntropy) cvEntropy.draw();
    }

    /* ---------------- Diagramme Abb. 11.4 / 11.5 ---------------- */

    var cvStates = FV.canvas({
      aspect: 0.72,
      render: function (ctx, w, hgt) {
        var P = FV.plot(ctx, {
          w: w, h: hgt, x: [1, 4], y: [0, 6],
          pad: { l: 40, r: 12, t: 24, b: 32 },
          xticks: [1, 1.5, 2, 2.5, 3, 3.5, 4], yticks: [0, 1, 2, 3, 4, 5, 6],
          xlabel: 'Ma₁', ylabel: 'Verhältnis'
        });
        P.grid(); P.axes();
        P.clip(function () {
          P.curve(pRatio, { color: '#ff6b6b', width: 2.2 });
          P.curve(rhoRatio, { color: '#ff8a4c', width: 2.2 });
          P.curve(TRatio, { color: '#ffd166', width: 2.2 });
          P.curve(p0Ratio, { color: '#a78bfa', width: 2.2 });
          P.curve(Ma2, { color: '#56c8f5', width: 2.2 });
          P.curve(function (M) { return (GAM + 1) / (GAM - 1); }, { color: '#3a4552', dash: [3, 4], width: 1.2 });
          P.vline(Ma1, { color: '#e6edf3' });
          P.dot(Ma1, pRatio(Ma1), '#ff6b6b', 3.5);
          P.dot(Ma1, rhoRatio(Ma1), '#ff8a4c', 3.5);
          P.dot(Ma1, TRatio(Ma1), '#ffd166', 3.5);
          P.dot(Ma1, p0Ratio(Ma1), '#a78bfa', 3.5);
          P.dot(Ma1, Ma2(Ma1), '#56c8f5', 3.5);
        });
        P.label(3.55, 5.6, 'p₂/p₁', '#ff6b6b');
        P.label(3.55, 4.5, 'T₂/T₁', '#ffd166');
        P.label(3.55, 4.05, 'ρ₂/ρ₁', '#ff8a4c');
        P.label(3.55, 0.75, 'p₀₂/p₀₁', '#a78bfa');
        P.label(3.55, 0.2, 'Ma₂', '#56c8f5');
        P.label(1.05, (GAM + 1) / (GAM - 1) + 0.28, 'Grenzwert ρ₂/ρ₁ → 6', '#5c6874');
        FV.text(ctx, 42, 16, 'Zustandsänderungen über den Stoss (γ = 1.4)',
          { color: '#c8d3de', font: '12px -apple-system, sans-serif' });
      },
      cap: 'Abb. 11.4 des Skripts, live mit dem Ma₁-Regler verbunden.'
    });

    var cvEntropy = FV.canvas({
      aspect: 0.72,
      render: function (ctx, w, hgt) {
        var Q = FV.plot(ctx, {
          w: w, h: hgt, x: [0.6, 3], y: [-0.5, 0.5],
          pad: { l: 46, r: 12, t: 24, b: 32 },
          xticks: [1, 1.5, 2, 2.5, 3], yticks: [-0.5, -0.25, 0, 0.25, 0.5],
          xlabel: 'Ma₁', ylabel: '(s₂−s₁)/c_v'
        });
        Q.grid(); Q.axes();
        Q.clip(function () {
          Q.poly([[0.6, 0], [3, 0]], { color: '#3a4552', width: 1 });
          Q.curve(dsOverCv, { color: '#a78bfa', width: 2.3 });
          // 1. Glied der Reihenentwicklung um Ma1 = 1
          Q.curve(function (M) {
            return 2 * GAM / (3 * (GAM + 1) * (GAM + 1)) * Math.pow(M * M - 1, 3);
          }, { color: 'rgba(230,237,243,.45)', dash: [4, 4], width: 1.5 });
          Q.vline(1, { color: '#5c6874', dash: [2, 3] });
          Q.vline(Ma1, { color: '#e6edf3' });
          Q.dot(Ma1, dsOverCv(Ma1), '#a78bfa', 4);
        });
        Q.label(0.66, -0.42, 'Δs < 0 → 2. HS verbietet es', '#ff6b6b');
        Q.label(1.06, 0.42, 'nur hier erlaubt', '#6fdd8b');
        FV.text(ctx, 48, 16, 'Entropiesprung — der Torwächter',
          { color: '#c8d3de', font: '12px -apple-system, sans-serif' });
      },
      cap: 'Abb. 11.5. Für Ma₁ &lt; 1 wäre Δs &lt; 0 — deshalb kann ein Stoss nur im Überschall stehen. ' +
           'Gestrichelt: das erste Glied der Reihenentwicklung um Ma₁ = 1, ~ (Ma₁²−1)³.'
    });

    root.appendChild(h('div', { class: 'duo' }, cvStates, cvEntropy));
    updShock();

    root.appendChild(FV.note('key', 'Die sechs Merksätze zum senkrechten Stoss',
      '<ul style="margin:0">' +
      '<li>Er führt <strong>immer</strong> vom Überschall in den Unterschall: Ma₁ &gt; 1 → Ma₂ &lt; 1.</li>' +
      '<li><strong>Zu:</strong> p, ρ, T, s. <strong>Ab:</strong> u, Ma, p₀ (und ρ₀).</li>' +
      '<li><strong>Unverändert:</strong> T₀ (Energiesatz!) und damit a₀ und a*. ' +
      'p₀ dagegen <em>nicht</em> — der Stoss ist nicht isentrop.</li>' +
      '<li>Die Dichte ist begrenzt: ρ₂/ρ₁ → (γ+1)/(γ−1) = 6 für Ma₁ → ∞. Der Druck dagegen wächst ' +
      'unbegrenzt.</li>' +
      '<li><strong>Prandtl-Relation</strong> u₁·u₂ = a*², also La₁·La₂ = 1. Sehr rechenpraktisch.</li>' +
      '<li>Schwache Stösse (Ma₁ knapp über 1) sind fast isentrop: Δs ~ (Ma₁²−1)³. ' +
      'Deshalb ist ein Kegel mit spitzem Öffnungswinkel im Überschall so viel günstiger als ein stumpfer Körper.</li>' +
      '</ul>'));

    /* ================= 3 · Schiefer Stoss ================= */

    root.appendChild(FV.section('3 · Der schiefe Stoss und das Stossdiagramm'));

    root.appendChild(h('p', { html:
      'Der schiefe Stoss ist kein neues Problem: Legt man dem senkrechten Stoss eine konstante ' +
      'Tangentialgeschwindigkeit v parallel zur Front über, ändert sich wegen der Galilei-Invarianz ' +
      'nichts an der Lösung. <strong>Nur die Normalkomponente u zählt für die Zustandsänderung.</strong> ' +
      'Alle Formeln von oben gelten weiter — man ersetzt Ma₁ durch Ma<sub>n1</sub> = Ma₁·sin β.' }));

    root.appendChild(FV.eq(
      'tan θ = 2 cot β · <span class="frac"><span>Ma₁² sin²β − 1</span>' +
      '<span class="den">Ma₁² (γ + cos 2β) + 2</span></span>',
      'θ-β-Ma-Relation · Skript S. 111'));

    var oMa = 2.5, oTheta = 15 * Math.PI / 180, strongSol = false;

    function thetaOf(M, b) {
      var num = M * M * Math.sin(b) * Math.sin(b) - 1;
      var den = M * M * (GAM + Math.cos(2 * b)) + 2;
      return Math.atan(2 / Math.tan(b) * num / den);
    }
    function thetaMax(M) {
      var mu = Math.asin(Math.min(1 / M, 1)), best = 0, bB = mu;
      for (var i = 0; i <= 900; i++) {
        var b = mu + (Math.PI / 2 - mu) * i / 900;
        var th = thetaOf(M, b);
        if (th > best) { best = th; bB = b; }
      }
      return { th: best, beta: bB };
    }
    function solveBeta(M, th, strong) {
      if (M <= 1) return null;
      var tm = thetaMax(M);
      if (th > tm.th) return null;
      var lo = strong ? tm.beta : Math.asin(1 / M);
      var hi = strong ? Math.PI / 2 : tm.beta;
      for (var i = 0; i < 60; i++) {
        var mid = (lo + hi) / 2;
        var f = thetaOf(M, mid);
        if (strong ? (f > th) : (f < th)) lo = mid; else hi = mid;
      }
      return (lo + hi) / 2;
    }

    var roObl = FV.readout([
      { key: 'beta', lab: 'Stossfrontwinkel β', cls: 'c2' },
      { key: 'man1', lab: 'Ma<sub>n1</sub> = Ma₁ sin β', cls: 'c2' },
      { key: 'ma2', lab: 'Ma₂ hinter dem Stoss', cls: 'c1' },
      { key: 'p', lab: 'p₂/p₁', cls: 'c1' },
      { key: 'thmax', lab: 'θ<sub>max</sub> bei diesem Ma₁', cls: 'c3' },
      { key: 'typ', lab: 'Lösungstyp', cls: 'c3' }
    ]);

    var cvRamp = FV.canvas({
      aspect: 0.78,
      render: function (ctx, w, hgt) { drawRamp(ctx, 0, 0, w, hgt); },
      cap: 'Die Stromlinien knicken an der Front sprunghaft um θ und laufen dahinter parallel weiter.'
    });

    var cvDiag = FV.canvas({
      aspect: 0.78,
      render: function (ctx, w, hgt) { drawShockDiagram(ctx, w, hgt); },
      cap: 'Stossdiagramm (Abb. 11.10). Der volle Punkt ist die gewählte Lösung, der blasse die ' +
           'jeweils andere. Gelb gestrichelt: die θ<sub>max</sub>-Linie, die schwache von starken Lösungen trennt.'
    });

    function drawRamp(ctx, ox, oy, w, hgt) {
      ctx.save(); ctx.translate(ox, oy);
      var cornerX = w * 0.44, baseY = hgt - 46;
      var beta = solveBeta(oMa, oTheta, strongSol);
      var detached = beta === null;

      // Wand als gefüllter Keil
      var rampLen = (w - cornerX) / Math.cos(oTheta);
      var rx = cornerX + rampLen * Math.cos(oTheta), ry = baseY - rampLen * Math.sin(oTheta);
      ctx.fillStyle = '#1b232c';
      ctx.beginPath();
      ctx.moveTo(0, baseY); ctx.lineTo(cornerX, baseY); ctx.lineTo(rx, ry);
      ctx.lineTo(w, hgt); ctx.lineTo(0, hgt); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#8b98a6'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, baseY); ctx.lineTo(cornerX, baseY); ctx.lineTo(rx, ry);
      ctx.stroke();

      // Winkel θ
      ctx.strokeStyle = 'rgba(230,237,243,.35)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cornerX, baseY); ctx.lineTo(w - 8, baseY); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(230,237,243,.5)';
      ctx.beginPath(); ctx.arc(cornerX, baseY, 42, -oTheta, 0); ctx.stroke();
      FV.text(ctx, cornerX + 50, baseY - 8, 'θ = ' + (oTheta * 180 / Math.PI).toFixed(1) + '°',
        { color: '#c8d3de', font: '12px ui-monospace, monospace' });

      if (!detached) {
        // Stossfront
        var L = 400;
        ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(cornerX, baseY);
        ctx.lineTo(cornerX + L * Math.cos(beta), baseY - L * Math.sin(beta));
        ctx.stroke();
        // Winkel β
        ctx.strokeStyle = 'rgba(255,209,102,.55)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(cornerX, baseY, 68, -beta, 0); ctx.stroke();
        FV.text(ctx, cornerX + 74 * Math.cos(beta / 2), baseY - 74 * Math.sin(beta / 2) - 4,
          'β = ' + (beta * 180 / Math.PI).toFixed(1) + '°',
          { color: '#ffd166', font: '12px ui-monospace, monospace' });
      } else {
        // abgehobener, gekrümmter Stoss
        ctx.strokeStyle = '#ff6b6b'; ctx.lineWidth = 2.4;
        ctx.beginPath();
        for (var k = 0; k <= 40; k++) {
          var s = k / 40 * 2 - 1;
          var xx2 = cornerX - 34 - 46 * s * s;
          var yy2 = baseY - s * (hgt - 60) * 0.62 - 4;
          k ? ctx.lineTo(xx2, yy2) : ctx.moveTo(xx2, yy2);
        }
        ctx.stroke();
        FV.text(ctx, w - 8, 20, 'Stoss abgehoben und gekrümmt',
          { color: '#ff6b6b', align: 'right', font: '12px -apple-system, sans-serif' });
        FV.text(ctx, w - 8, 36, 'θ > θmax — keine anliegende Lösung',
          { color: 'rgba(255,107,107,.7)', align: 'right', font: '11px -apple-system, sans-serif' });
      }

      // Stromlinien
      var nS = 5;
      for (var j = 1; j <= nS; j++) {
        var y1 = baseY - j * (hgt - 66) / (nS + 0.4);
        ctx.strokeStyle = 'rgba(86,200,245,.75)'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (!detached) {
          // Schnittpunkt der horizontalen Stromlinie mit der Stossfront
          var dy = baseY - y1;
          var xHit = cornerX + dy / Math.tan(beta);
          if (xHit > w - 8) { ctx.moveTo(6, y1); ctx.lineTo(w - 8, y1); }
          else {
            ctx.moveTo(6, y1); ctx.lineTo(xHit, y1);
            var rem = (w - 8 - xHit) / Math.cos(oTheta);
            ctx.lineTo(xHit + rem * Math.cos(oTheta), y1 - rem * Math.sin(oTheta));
          }
        } else {
          ctx.moveTo(6, y1);
          ctx.lineTo(cornerX - 80, y1);
          ctx.quadraticCurveTo(cornerX - 20, y1, w - 8, y1 - 26);
        }
        ctx.stroke();
      }
      FV.arrow(ctx, 10, 26, 62, 26, '#56c8f5', 2, 8);
      FV.text(ctx, 68, 30, 'Ma₁ = ' + oMa.toFixed(2), { color: '#56c8f5', font: '12.5px ui-monospace, monospace' });
      ctx.restore();
    }

    function drawShockDiagram(ctx, w, hgt) {
      var P = FV.plot(ctx, {
        w: w, h: hgt, x: [0, 50], y: [0, 90],
        pad: { l: 42, r: 12, t: 24, b: 32 },
        xticks: [0, 10, 20, 30, 40, 50], yticks: [0, 30, 60, 90],
        xlabel: 'Umlenkwinkel θ [°]', ylabel: 'β [°]'
      });
      P.grid(); P.axes();

      var MAS = [1.5, 2, 3, 5, 1e6];
      var maxLine = [];
      P.clip(function () {
        MAS.forEach(function (M, idx) {
          var mu = Math.asin(Math.min(1 / M, 1));
          var pts = [];
          for (var i = 0; i <= 400; i++) {
            var b = mu + (Math.PI / 2 - mu) * i / 400;
            pts.push([thetaOf(M, b) * 180 / Math.PI, b * 180 / Math.PI]);
          }
          var isInf = M > 1e5;
          P.poly(pts, { color: isInf ? '#6e7d8c' : 'rgba(86,200,245,' + (0.35 + idx * 0.15) + ')', width: 1.7, dash: isInf ? [4, 4] : null });
          var tm = thetaMax(M);
          maxLine.push([tm.th * 180 / Math.PI, tm.beta * 180 / Math.PI]);
        });
        // Verbindung der θmax-Punkte
        P.poly(maxLine, { color: '#ffd166', width: 1.6, dash: [5, 4] });

        // aktuelle Ma-Kurve hervorheben
        var mu2 = Math.asin(Math.min(1 / oMa, 1));
        var cur = [];
        for (var i2 = 0; i2 <= 400; i2++) {
          var b2 = mu2 + (Math.PI / 2 - mu2) * i2 / 400;
          cur.push([thetaOf(oMa, b2) * 180 / Math.PI, b2 * 180 / Math.PI]);
        }
        P.poly(cur, { color: '#ffffff', width: 2.2 });

        var beta = solveBeta(oMa, oTheta, strongSol);
        if (beta !== null) P.dot(oTheta * 180 / Math.PI, beta * 180 / Math.PI, '#ff8a4c', 5);
        var other = solveBeta(oMa, oTheta, !strongSol);
        if (other !== null) P.dot(oTheta * 180 / Math.PI, other * 180 / Math.PI, 'rgba(255,138,76,.35)', 4);
      });
      P.label(2, 84, 'starke Lösung', '#8b98a6');
      P.label(2, 6, 'schwache Lösung', '#8b98a6');
      P.label(30, 46, 'θmax', '#ffd166');
      FV.text(ctx, 46, 16, 'Stossdiagramm — Kurven für Ma₁ = 1.5, 2, 3, 5, ∞',
        { color: '#c8d3de', font: '11.5px -apple-system, sans-serif' });
    }

    root.appendChild(h('div', { class: 'duo' }, cvRamp, cvDiag));
    root.appendChild(FV.ctrlRow(
      FV.slider({
        label: 'Anström-Mach-Zahl Ma₁', min: 1.05, max: 5, step: 0.01, value: oMa,
        fmt: function (v) { return v.toFixed(2); },
        onInput: function (v) { oMa = v; updObl(); }
      }),
      FV.slider({
        label: 'Rampen-/Umlenkwinkel θ', min: 0, max: 45, step: 0.1, value: 15,
        fmt: function (v) { return v.toFixed(1) + '°'; },
        onInput: function (v) { oTheta = v * Math.PI / 180; updObl(); }
      }),
      FV.toggle('starke Lösung', false, function (s) { strongSol = s; updObl(); })
    ));
    root.appendChild(roObl);

    function updObl() {
      var beta = solveBeta(oMa, oTheta, strongSol);
      var tm = thetaMax(oMa);
      roObl.set('thmax', (tm.th * 180 / Math.PI).toFixed(1) + '°');
      if (beta === null) {
        roObl.set('beta', '—'); roObl.set('man1', '—');
        roObl.set('ma2', '—'); roObl.set('p', '—');
        roObl.set('typ', 'abgehoben');
      } else {
        var Mn1 = oMa * Math.sin(beta);
        var Mn2 = Ma2(Mn1);
        var M2 = Mn2 / Math.sin(beta - oTheta);
        roObl.set('beta', (beta * 180 / Math.PI).toFixed(1) + '°');
        roObl.set('man1', Mn1.toFixed(3));
        roObl.set('ma2', isFinite(M2) ? M2.toFixed(3) : '—');
        roObl.set('p', pRatio(Mn1).toFixed(2));
        roObl.set('typ', strongSol ? 'stark' : 'schwach');
      }
      cvRamp.draw(); cvDiag.draw();
    }
    updObl();

    root.appendChild(FV.note('warn', 'Was du aus dem Stossdiagramm ablesen musst',
      '<ul style="margin:0">' +
      '<li>Zu jedem θ &lt; θ<sub>max</sub> gehören <strong>zwei</strong> Stosswinkel β. Der kleinere ist die ' +
      '<em>schwache</em> Lösung (meist realisiert, Ma₂ oft noch &gt; 1), der grössere die <em>starke</em> ' +
      '(Ma₂ &lt; 1). Welche sich einstellt, entscheidet der Gegendruck stromab.</li>' +
      '<li>θ &gt; θ<sub>max</sub>: <strong>kein</strong> anliegender geradliniger Stoss möglich. Der Stoss ' +
      'hebt ab und krümmt sich (detached shock). Genau das passiert bei jedem stumpfen Körper — dort ist ' +
      'der effektive Keilwinkel im Staupunkt 90°.</li>' +
      '<li>θ<sub>max</sub> wächst mit Ma₁ und läuft für Ma₁ → ∞ gegen ≈ 45°.</li>' +
      '<li>Stets β &gt; θ. Der senkrechte Stoss ist der Sonderfall θ = 0°, β = 90°.</li>' +
      '<li>Hinter einem schiefen Stoss ist Überschall möglich — im Gegensatz zum senkrechten Stoss.</li>' +
      '</ul>'));

    /* ================= Animationsschleife ================= */

    var prev = null;
    FV.loop(function (t) {
      if (prev === null) prev = t;
      var dt = Math.min(t - prev, 0.05); prev = t;

      if (steepRun) { steepT += dt * 0.55; if (steepT > 6) steepT = 0; }
      if (machRun) machT += dt;

      // Teilchen im Rohr (Positionen relativ zur Rohrlänge, 0 … 1)
      if (!prefilled) {                   // Rohr beim Öffnen schon gefüllt zeigen
        prefilled = true;
        for (var s = 0; s < 500; s++) stepParticles(0.02);
      }
      if (shockRun) stepParticles(dt);

      function stepParticles(d) {
        var v1 = 0.10 + Ma1 * 0.072;      // Rohrlängen pro Sekunde vor dem Stoss
        var v2 = v1 / rhoRatio(Ma1);      // Massenerhaltung: ρ₁u₁ = ρ₂u₂
        pRelease += d;
        var interval = 0.05;
        while (pRelease > interval) {
          pRelease -= interval;
          for (var q = 0; q < 5; q++) particles.push({ xr: 0, yr: Math.random() });
        }
        for (var i = particles.length - 1; i >= 0; i--) {
          var p = particles[i];
          p.xr += (p.xr < 0.5 ? v1 : v2) * d;
          if (p.xr > 1) particles.splice(i, 1);
        }
        if (particles.length > 1600) particles.splice(0, particles.length - 1600);
      }

      cvSteep.draw();
      cvMach.draw();
      cvShock.draw();
    });
  }
});
