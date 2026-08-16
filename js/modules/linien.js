/* ============================================================
   Ausgezeichnete Linien — Skript Kap. 4.5, S. 22–23
   Stromlinie · Bahnlinie · Streichlinie · Zeitlinie
   Alle vier werden aus derselben numerischen Advektion erzeugt,
   genau nach den Definitionen des Skripts.
   ============================================================ */

FV.register({
  id: 'linien',
  chapter: 'Kinematik',
  chapterNo: '4.5',
  title: 'Stromlinie, Bahnlinie, Streichlinie',
  subtitle: 'Drei Linien, die im Praktikum gleich aussehen und in der Prüfung verschieden sind.',
  source: 'Skript S. 22–23',

  build: function (root) {
    var h = FV.h;

    /* ---------------- Strömungsfeld ----------------
       u = U₀·(1 + shear·y)          (Scherung, damit die Zeitlinie etwas tut)
       v = A·sin(2π t / T)            (räumlich konstant, zeitlich oszillierend)
       div u = ∂u/∂x + ∂v/∂y = 0  →  inkompressibel
    ------------------------------------------------- */
    var st = {
      t: 0, running: true, speed: 1.0,
      A: 0.55, T: 3.2, U0: 0.85, shear: 0.30,
      stationary: false,
      show: { stream: true, path: true, streak: true, timeline: false, arrows: true }
    };

    function vel(x, y, t) {
      var v = st.stationary ? 0 : st.A * Math.sin(2 * Math.PI * t / st.T);
      return [st.U0 * (1 + st.shear * y), v];
    }

    // RK2-Schritt
    function advect(p, t, dt) {
      var k1 = vel(p[0], p[1], t);
      var mx = p[0] + k1[0] * dt * 0.5, my = p[1] + k1[1] * dt * 0.5;
      var k2 = vel(mx, my, t + dt * 0.5);
      return [p[0] + k2[0] * dt, p[1] + k2[1] * dt];
    }

    /* ---------------- Zustand der vier Linien ---------------- */
    var PROBE = [-2.3, 0.0];          // Ort der Rauchsonde
    var XMAX = 2.6, YMAX = 1.25;

    var streak = [];                  // Streichlinie: Partikel, jüngstes zuletzt
    var pathP = null, pathTrail = []; // Bahnlinie: EIN Partikel + seine Spur
    var timeline = [], tlBorn = 0;    // Zeitlinie
    var emitAcc = 0;

    function resetAll() {
      streak = []; pathTrail = []; pathP = null; timeline = []; emitAcc = 0;
      spawnTimeline();
    }
    function spawnTimeline() {
      timeline = []; tlBorn = st.t;
      for (var k = 0; k <= 24; k++) timeline.push([-1.6, -0.95 + k * 1.9 / 24]);
    }
    resetAll();

    /* ---------------- Zeichnung ---------------- */

    function mkMap(w, hgt) {
      var sc = Math.min(w / (2 * XMAX + 0.6), hgt / (2 * YMAX + 0.5));
      var cx = w / 2, cy = hgt / 2;
      return {
        X: function (x) { return cx + x * sc; },
        Y: function (y) { return cy - y * sc; }, sc: sc
      };
    }

    function poly(ctx, M, pts, color, width, dash) {
      if (pts.length < 2) return;
      ctx.save();
      ctx.strokeStyle = color; ctx.lineWidth = width || 2; ctx.lineJoin = 'round';
      if (dash) ctx.setLineDash(dash);
      ctx.beginPath();
      pts.forEach(function (p, i) { i ? ctx.lineTo(M.X(p[0]), M.Y(p[1])) : ctx.moveTo(M.X(p[0]), M.Y(p[1])); });
      ctx.stroke(); ctx.restore();
    }

    var cvMain = FV.canvas({
      aspect: 0.46,
      render: function (ctx, w, hgt) {
        var M = mkMap(w, hgt);

        // Feldpfeile (momentan)
        if (st.show.arrows) {
          for (var i = 0; i < 11; i++) {
            for (var j = 0; j < 6; j++) {
              var x = -2.4 + i * 4.8 / 10, y = -1.0 + j * 2.0 / 5;
              var u = vel(x, y, st.t);
              var k = 0.30 * M.sc;
              FV.arrow(ctx, M.X(x), M.Y(y), M.X(x) + u[0] * k, M.Y(y) - u[1] * k,
                'rgba(120,140,165,.40)', 1.1, 4.5);
            }
          }
        }

        // Stromlinien: Integralkurven des MOMENTANEN Feldes (Zeit eingefroren)
        if (st.show.stream) {
          for (var s = 0; s < 7; s++) {
            var y0 = -0.95 + s * 1.9 / 6;
            var p = [-2.5, y0], pts = [p];
            for (var n = 0; n < 260; n++) {
              p = advect(p, st.t, 0.02);      // t bleibt fest → Momentaufnahme
              if (Math.abs(p[0]) > XMAX + 0.3 || Math.abs(p[1]) > YMAX + 0.3) break;
              pts.push(p);
            }
            poly(ctx, M, pts, 'rgba(86,200,245,.55)', 1.4);
          }
        }

        // Zeitlinie
        if (st.show.timeline && timeline.length > 1) {
          poly(ctx, M, timeline, '#ffd166', 2.2);
          ctx.save(); ctx.fillStyle = '#ffd166';
          timeline.forEach(function (q, i) {
            if (i % 4) return;
            ctx.beginPath(); ctx.arc(M.X(q[0]), M.Y(q[1]), 1.8, 0, 6.2832); ctx.fill();
          });
          ctx.restore();
        }

        // Streichlinie: alle Teilchen, die durch die Sonde gelaufen sind
        if (st.show.streak) {
          poly(ctx, M, streak, '#a78bfa', 2.6);
          ctx.save();
          ctx.fillStyle = '#a78bfa';
          ctx.beginPath(); ctx.arc(M.X(PROBE[0]), M.Y(PROBE[1]), 5, 0, 6.2832); ctx.fill();
          ctx.restore();
          FV.text(ctx, M.X(PROBE[0]) - 6, M.Y(PROBE[1]) + 20, 'Sonde',
            { color: '#a78bfa', align: 'center', font: '11px -apple-system, sans-serif' });
        }

        // Bahnlinie: Spur eines einzelnen Teilchens
        if (st.show.path) {
          poly(ctx, M, pathTrail, '#ff8a4c', 2.6);
          if (pathP) {
            ctx.save();
            ctx.fillStyle = '#ff8a4c';
            ctx.beginPath(); ctx.arc(M.X(pathP[0]), M.Y(pathP[1]), 5.5, 0, 6.2832); ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.restore();
          }
        }

        // Kopfzeile
        FV.text(ctx, 12, 20,
          st.stationary ? 'stationäre Strömung — v = 0' : 'instationäre Strömung — v = A·sin(2πt/T)',
          { color: st.stationary ? '#6fdd8b' : '#c8d3de', font: '12.5px -apple-system, sans-serif' });
        FV.text(ctx, w - 12, 20, 't = ' + st.t.toFixed(2),
          { color: '#6e7d8c', align: 'right', font: '11.5px ui-monospace, monospace' });
        if (st.stationary) {
          FV.text(ctx, 12, 38, 'alle drei Linien fallen zusammen',
            { color: '#6fdd8b', font: '11.5px -apple-system, sans-serif' });
        }
      },
      cap: 'Alle Linien entstehen aus derselben numerischen Advektion — jede genau nach ihrer Definition.'
    });

    /* ---------------- Einstieg ---------------- */

    root.appendChild(FV.note('', 'Warum das verwirrt',
      'Im Windkanal blasen alle drei dasselbe Bild: man sieht Fäden im Rauch. In einer ' +
      '<strong>stationären</strong> Strömung sind sie auch tatsächlich identisch. Sobald sich die ' +
      'Strömung aber mit der Zeit ändert, laufen sie auseinander — und genau darauf zielen die ' +
      'Prüfungsfragen. Der Unterschied liegt nicht in der Strömung, sondern darin, ' +
      '<em>was man misst</em>: eine Momentaufnahme, die Geschichte eines Teilchens, oder die ' +
      'Geschichte vieler Teilchen.'));

    root.appendChild(FV.section('1 · Alle drei gleichzeitig'));

    root.appendChild(h('p', { html:
      'Das Feld strömt nach rechts und wird dabei periodisch nach oben und unten geschwenkt — wie Wind, ' +
      'der die Richtung wechselt. Die violette Sonde raucht dauerhaft. Beobachte, wie die drei Linien ' +
      'auseinanderlaufen, und schalte dann auf «stationär».' }));

    root.appendChild(cvMain);

    root.appendChild(FV.legend([
      { c: '#56c8f5', t: 'Stromlinien — tangential zum Feld, jetzt' },
      { c: '#ff8a4c', t: 'Bahnlinie — Weg eines Teilchens' },
      { c: '#a78bfa', t: 'Streichlinie — Rauchfaden aus der Sonde' },
      { c: '#ffd166', t: 'Zeitlinie — gemeinsam gestartete Teilchen' }
    ]));

    var btnRun = FV.toggle('▶ läuft', true, function (s) {
      st.running = s; btnRun.textContent = s ? '▶ läuft' : '⏸ pausiert';
    });
    var btnStat = FV.toggle('stationär machen', false, function (s) {
      st.stationary = s; resetAll();
    });

    root.appendChild(FV.ctrlRow(
      btnRun, btnStat,
      FV.button('zurücksetzen', function () { resetAll(); }),
      FV.slider({
        label: 'Schwenk-Amplitude A', min: 0, max: 1.0, step: 0.01, value: 0.55,
        fmt: function (v) { return v.toFixed(2); },
        onInput: function (v) { st.A = v; }
      }),
      FV.slider({
        label: 'Schwenk-Periode T', min: 1.2, max: 7, step: 0.1, value: 3.2,
        fmt: function (v) { return v.toFixed(1) + ' s'; },
        onInput: function (v) { st.T = v; }
      })
    ));
    root.appendChild(FV.ctrlRow(
      h('span', { style: 'font-size:12px;color:var(--fg-mute);flex:0 0 auto' }, 'anzeigen:'),
      FV.toggle('Stromlinien', true, function (s) { st.show.stream = s; }),
      FV.toggle('Bahnlinie', true, function (s) { st.show.path = s; }),
      FV.toggle('Streichlinie', true, function (s) { st.show.streak = s; }),
      FV.toggle('Zeitlinie', false, function (s) { st.show.timeline = s; if (s) spawnTimeline(); }),
      FV.toggle('Feldpfeile', true, function (s) { st.show.arrows = s; })
    ));

    root.appendChild(FV.note('key', 'Was du sehen solltest',
      '<ul style="margin:0">' +
      '<li>Die <span style="color:#56c8f5"><strong>Stromlinien</strong></span> sind zu jedem Zeitpunkt ' +
      'nahezu parallele Kurven, die als Ganzes auf und ab schwenken. Sie zeigen nur das ' +
      '<em>Jetzt</em> — sie haben kein Gedächtnis.</li>' +
      '<li>Die <span style="color:#ff8a4c"><strong>Bahnlinie</strong></span> schlängelt sich: das Teilchen ' +
      'nimmt jeden Schwenk mit, den es auf seinem Weg erlebt.</li>' +
      '<li>Die <span style="color:#a78bfa"><strong>Streichlinie</strong></span> schlängelt sich ebenfalls, ' +
      'aber <strong>anders</strong> — sie besteht aus lauter verschiedenen Teilchen, die zu ' +
      'verschiedenen Zeiten losgeschickt wurden. Vergleiche die beiden Wellen genau: gleiche Sorte ' +
      'Kurve, unterschiedlicher Verlauf.</li>' +
      '<li>Mit <strong>«stationär machen»</strong> fallen alle drei exakt aufeinander. Das ist der ' +
      'Sonderfall aus dem Skript.</li>' +
      '</ul>'));

    root.appendChild(FV.eq('stationäre Strömung: &nbsp; Stromlinie = Bahnlinie = Streichlinie',
      'Skript S. 23 — und nur dann. Bei instationärer Strömung ist das im Allgemeinen falsch.'));

    root.appendChild(FV.note('', 'Wie verschieden sind sie wirklich?',
      'Alle drei Linien starten hier im selben Punkt, der Sonde bei (−2.3 | 0). Rechnet man mit den ' +
      'Voreinstellungen nach, wo sie 1.3 Längeneinheiten weiter rechts (bei x = −1.0) durchlaufen, ' +
      'kommt heraus:' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:12px 0">' +
      '<div><span style="color:#ff8a4c">Bahnlinie</span><br><b style="font-family:var(--mono);font-size:17px">y = +0.54</b></div>' +
      '<div><span style="color:#a78bfa">Streichlinie</span><br><b style="font-family:var(--mono);font-size:17px">y = −0.51</b></div>' +
      '<div><span style="color:#56c8f5">Stromlinie</span><br><b style="font-family:var(--mono);font-size:17px">y = −0.34</b></div>' +
      '</div>' +
      'Drei Kurven durch denselben Punkt, an derselben Stelle über einen Meter auseinander — und die ' +
      'Bahnlinie liegt sogar auf der anderen Seite. Schaltet man auf stationär, stehen dort dreimal ' +
      'exakt <b>y = 0.000</b>.'));

    /* ---------------- Definitionen ---------------- */

    root.appendChild(FV.section('2 · Die vier Definitionen'));

    function defRow(name, col, def, eqn, exp) {
      return h('div', { class: 'panel', style: 'border-left:3px solid ' + col },
        h('div', { style: 'font-weight:650;font-size:15px;color:' + col + ';margin-bottom:6px' }, name),
        h('div', { html: def, style: 'margin-bottom:8px' }),
        h('div', { class: 'eq', style: 'margin:8px 0', html: eqn }),
        h('div', { html: exp, style: 'font-size:13px;color:var(--fg-dim)' }));
    }

    root.appendChild(defRow('Stromlinie', '#56c8f5',
      'Eine Kurve, die in <strong>jedem Punkt tangential zum momentanen Geschwindigkeitsfeld</strong> ' +
      'verläuft. Sie ist eine Momentaufnahme: man friert die Zeit ein und folgt den Pfeilen.',
      'dx × u ≡ 0 &nbsp;&nbsp;bzw.&nbsp;&nbsp; ' +
      '<span class="frac"><span>dx</span><span class="den">u</span></span> = ' +
      '<span class="frac"><span>dy</span><span class="den">v</span></span> = ' +
      '<span class="frac"><span>dz</span><span class="den">w</span></span>',
      'Als Integralkurve: dx/ds = u(x(s); t) mit <strong>festem t</strong>. In einer stationären ' +
      'Strömung sind Stromlinien zeitlich unveränderliche Kurven im Raum.'));

    root.appendChild(defRow('Bahnlinie', '#ff8a4c',
      'Der Pfad <strong>eines einzelnen Fluidpartikels</strong> über die Zeit. Das ist die Spur, die bei ' +
      'Langzeitbelichtung eines einzelnen markierten Teilchens entsteht.',
      'dξ/dt = u(ξ(t), t) , &nbsp;&nbsp; ξ(t₀) = ξ₀',
      'Hier läuft die Zeit mit — das Teilchen erlebt das Feld nacheinander an verschiedenen Orten und ' +
      'zu verschiedenen Zeiten.'));

    root.appendChild(defRow('Streichlinie', '#a78bfa',
      'Die Linie <strong>aller Partikel, die nacheinander durch denselben festen Punkt</strong> gelaufen ' +
      'sind. Der Rauchfaden einer Rauchsonde ist genau das.',
      'Kurve über die <em>Startzeit</em> τ: &nbsp; ξ(t ; ξ_Sonde, τ) , &nbsp; τ ≤ t',
      'Zu einem festen Beobachtungszeitpunkt t durchläuft man alle früheren Startzeiten τ. Jeder Punkt ' +
      'der Kurve gehört zu einem <em>anderen</em> Teilchen — deshalb ist sie nicht dasselbe wie eine ' +
      'Bahnlinie.'));

    root.appendChild(defRow('Zeitlinie', '#ffd166',
      'Die Linie von Teilchen, die sich zu einem <strong>früheren Zeitpunkt gemeinsam auf einer Kurve</strong> ' +
      'befanden. Experimentell durch Wasserstoffbläschen erzeugt, die entlang eines Drahtes gleichzeitig ' +
      'freigesetzt werden.',
      'Kurve über die <em>Startposition</em>: &nbsp; ξ(t ; ξ₀, t₀) , &nbsp; ξ₀ auf einer Kurve',
      'Sie zeigt direkt das Geschwindigkeitsprofil: wo die Strömung schneller ist, eilt die Linie voraus. ' +
      'Schalte oben die Zeitlinie ein — die Scherung des Feldes wird sofort sichtbar.'));

    /* ---------------- Eigenschaften ---------------- */

    root.appendChild(FV.section('3 · Eigenschaften auf einen Blick'));

    root.appendChild(h('div', { style: 'overflow-x:auto' }, h('table', null,
      h('thead', null, h('tr', null,
        h('th', null, ''),
        h('th', { style: 'color:#56c8f5' }, 'Stromlinie'),
        h('th', { style: 'color:#ff8a4c' }, 'Bahnlinie'),
        h('th', { style: 'color:#a78bfa' }, 'Streichlinie'))),
      h('tbody', null,
        trow('was ist fest?', 'die Zeit t', 'das Teilchen', 'der Durchgangspunkt'),
        trow('worüber läuft die Kurve?', 'über den Ort', 'über die Zeit', 'über die Startzeit τ'),
        trow('Anzahl Teilchen', 'keines — rein rechnerisch', 'genau eines', 'viele'),
        trow('Gedächtnis?', 'nein, nur das Jetzt', 'ja, seine eigene Geschichte', 'ja, die Geschichte aller'),
        trow('Experiment', 'PIV-Momentaufnahme, Rechnung', 'Langzeitbelichtung eines Teilchens', 'Rauch- oder Farbfaden'),
        trow('können sich zwei kreuzen?', 'nein (ausser in Staupunkten)', 'ja', 'ja'),
        trow('bei stationärer Strömung', 'identisch', 'identisch', 'identisch'),
        trow('Galilei-invariant?', 'nein', 'nein', 'nein')
      ))));

    function trow(a, b, c, d) {
      return h('tr', null, h('td', { html: a, style: 'color:var(--fg-dim)' }),
        h('td', { html: b }), h('td', { html: c }), h('td', { html: d }));
    }

    root.appendChild(FV.note('warn', 'Prüfungsfallen',
      '<ul style="margin:0">' +
      '<li><strong>„Stromlinien sind die Bahnen der Teilchen“ — nur bei stationärer Strömung.</strong> ' +
      'Das ist die mit Abstand häufigste Falle.</li>' +
      '<li><strong>Stromlinien schneiden sich nicht.</strong> In einem Punkt hat u nur eine Richtung. ' +
      'Ausnahmen sind Staupunkte (u = 0) und Singularitäten wie Quellen oder Wirbel. Bahn- und ' +
      'Streichlinien dürfen sich dagegen sehr wohl kreuzen — zu verschiedenen Zeiten.</li>' +
      '<li><strong>Kein Massenstrom durch eine Stromlinie.</strong> Die Geschwindigkeit ist überall ' +
      'tangential, also ist die Normalkomponente null. Daraus wird die Stromröhre: ihr Mantel besteht ' +
      'aus Stromlinien, also fliesst durch ihn nichts hindurch.</li>' +
      '<li><strong>Das Stromlinienbild hängt vom Bezugssystem ab.</strong> Ein mit einem Körper ' +
      'mitbewegter Beobachter sieht ein völlig anderes — oft stationäres — Bild als einer im ' +
      'Laborsystem. Die Wirbelstärke ω dagegen ist Galilei-invariant.</li>' +
      '<li><strong>Ψ = konst. auf Stromlinien</strong>, und die Differenz zweier Ψ-Werte ist der ' +
      'Volumenstrom dazwischen: V̇₂₁ = Ψ₂ − Ψ₁ (Skript S. 24).</li>' +
      '</ul>'));

    /* ---------------- Animationsschleife ---------------- */

    var prev = null;
    FV.loop(function (tt) {
      if (prev === null) prev = tt;
      var dt = Math.min(tt - prev, 0.05) * st.speed; prev = tt;

      if (st.running) {
        st.t += dt;

        // --- Streichlinie: laufend neue Teilchen an der Sonde ---
        emitAcc += dt;
        var EMIT = 0.028;
        while (emitAcc > EMIT) {
          emitAcc -= EMIT;
          streak.push([PROBE[0], PROBE[1]]);
        }
        for (var i = streak.length - 1; i >= 0; i--) {
          streak[i] = advect(streak[i], st.t, dt);
          if (streak[i][0] > XMAX) streak.splice(i, 1);
        }

        // --- Bahnlinie: ein einzelnes Teilchen ---
        if (!pathP) { pathP = [PROBE[0], PROBE[1]]; pathTrail = [[PROBE[0], PROBE[1]]]; }
        pathP = advect(pathP, st.t, dt);
        pathTrail.push([pathP[0], pathP[1]]);
        if (pathP[0] > XMAX) { pathP = null; pathTrail = []; }

        // --- Zeitlinie ---
        for (var k = 0; k < timeline.length; k++) timeline[k] = advect(timeline[k], st.t, dt);
        if (st.t - tlBorn > st.T * 1.1 || (timeline.length && timeline[0][0] > XMAX)) spawnTimeline();
      }

      cvMain.draw();
    });
  }
});
