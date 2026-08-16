/* ============================================================
   Roadmap — was als nächstes visualisiert werden soll.
   Beim Bauen eines Themas: status auf 'done' setzen und die id
   des neuen Moduls in "link" eintragen.
   ============================================================ */

FV.register({
  id: 'roadmap',
  chapter: 'Übersicht',
  chapterNo: '—',
  title: 'Roadmap: was noch visualisiert wird',
  subtitle: 'Durchgang durch das Skript — Themen, bei denen ein Bild oder eine Animation mehr bringt als Text.',
  source: 'Auswahl nach Skript Fluiddynamik FS 2026, Kap. 3–11',

  build: function (root) {
    var h = FV.h;

    var ITEMS = [
      /* ---- fertig ---- */
      { k: 'Bereits gebaut', p: 'A', done: true, link: 'linien',
        t: 'Stromlinie, Bahnlinie, Streichlinie, Zeitlinie',
        d: 'Alle vier gleichzeitig in einem instationären Feld, das man auf stationär umschalten kann — dann fallen sie zusammen. Mit Definitionen und Eigenschaftstabelle.',
        m: 'Kap. 4.5, S. 22–23' },
      { k: 'Bereits gebaut', p: 'A', done: true, link: 'potentiallab',
        t: 'Elementarlösungen überlagern (Lab)',
        d: 'Freier Baukasten mit Quelle, Senke, Wirbel, Dipol, Zylinder und Wänden; Ψ/Φ-Linien, Druck- und Geschwindigkeitsfeld, Presets für Halbkörper, Rankine-Körper und Magnus.',
        m: 'Kap. 9.3, S. 63–71' },
      { k: 'Bereits gebaut', p: 'A', done: true, link: 'joukowski',
        t: 'Joukowski-Transformation (Widget)',
        d: 'Kreis in der z-Ebene neben seinem Bild in der ζ-Ebene, mit Winkeltreue, kritischen Punkten ±a und der Entstehung der scharfen Hinterkante.',
        m: 'Kap. 9.5, S. 72 ff.' },
      { k: 'Bereits gebaut', p: 'A', done: true, link: 'wirbel',
        t: 'Starrkörper- vs. Potentialwirbel',
        d: 'Bahn identisch, Eigendrehung völlig verschieden. Mit Rankine-Wirbel, Zirkulation und Gegenbeispiel Scherströmung.',
        m: 'Kap. 10.1, S. 79–81' },
      { k: 'Bereits gebaut', p: 'A', done: true, link: 'wirbelstreckung',
        t: 'Wirbelstreckung und Kippen — der Term (ω·∇)u',
        d: 'Wirbelelement frei orientierbar, W mit Zerlegung in Streckung und Kippen, Pirouetteneffekt. Löst die Prüfungsaufgaben zum lokalen Wirbelelement (FS24 3.3, HS19 3.6).',
        m: 'Kap. 10.2, S. 84–86' },
      { k: 'Bereits gebaut', p: 'A', done: true, link: 'wirbelring',
        t: 'Wirbelring an der Wand — Spiegelwirbel',
        d: 'Biot-Savart-Simulation mit Spiegelwirbeln für beide Prüfungsfälle (HS19 3.4 senkrecht, 3.5 parallel), jeweils mit dem wandfreien Ring als Vergleich.',
        m: 'Kap. 10.3, S. 83, 87 ff.' },
      { k: 'Bereits gebaut', p: 'A', done: true, link: 'stoss',
        t: 'Verdichtungsstoss senkrecht + schief',
        d: 'Warum ein Stoss entsteht (Aufsteilen, Machkegel), Rankine-Hugoniot, Stossdiagramm.',
        m: 'Kap. 11.3/11.5, S. 101–112' },
      { k: 'Bereits gebaut', p: 'A', done: true, link: 'lavalduese',
        t: 'Laval-Düse: über- oder unterexpandiert?',
        d: 'Erkennungsregel am Strahlbild, Freistrahl mit Rautenmuster, Düse mit Gegendruck-Regler über alle Fälle A–F. Löst FS24 A17 und FS25 A8.3.',
        m: 'Kap. 11.4, S. 105–108' },

      /* ---- Kap. 4 Kinematik ---- */
            { k: 'Kap. 4 · Kinematik', p: 'B',
        t: 'Substantielle Ableitung: lokal + konvektiv',
        d: 'Thermometer, das mit der Strömung schwimmt, gegen ein festes am Ufer. Zerlegung D/Dt = ∂/∂t + (u·∇) als zwei getrennt sichtbare Beiträge.',
        m: 'Kap. 4.2, S. 20' },
      { k: 'Kap. 4 · Kinematik', p: 'B',
        t: 'Deformation eines Fluidelements',
        d: 'Zerlegung des Geschwindigkeitsgradienten in Translation, Rotation, Dehnung und Scherung — ein Quadrat, das unter jedem Anteil einzeln verformt wird. Direkte Vorbereitung auf ω = rot u.',
        m: 'Kap. 4.4, S. 21' },
      { k: 'Kap. 4 · Kinematik', p: 'C',
        t: 'Stromfunktion Ψ',
        d: 'Isolinien von Ψ sind Stromlinien, und die Differenz zweier Ψ-Werte ist direkt der Volumenstrom dazwischen. Als anklickbares Feld.',
        m: 'Kap. 4.6, S. 24' },

      /* ---- Kap. 5 Erhaltungssätze ---- */
      { k: 'Kap. 5 · Erhaltungssätze', p: 'A',
        t: 'Impulssatz am Kontrollvolumen',
        d: 'Krümmer, Strahl auf Platte, Rückstoss: Kontrollvolumen frei verschiebbar, ein- und austretende Impulsströme plus Druckkräfte werden live als Vektoren gezeichnet. Der häufigste Rechenfehler ist ein falsch gewähltes KV — genau das lässt sich zeigen.',
        m: 'Kap. 5.2.1, S. 26 f.' },
      { k: 'Kap. 5 · Erhaltungssätze', p: 'B',
        t: 'Bernoulli als Energiebilanz',
        d: 'Venturi-Rohr mit Steigrohren: statischer, dynamischer und Gesamtdruck als drei Balken, die sich ineinander umwandeln. Plus die Frage, wo Bernoulli gerade <em>nicht</em> gilt.',
        m: 'Kap. 5.2.4, S. 28 ff.' },

      /* ---- Kap. 3 Dimensionsanalyse ---- */
      { k: 'Kap. 3 · Dimensionsanalyse', p: 'B',
        t: 'Buckingham Π — Schritt für Schritt',
        d: 'Grössen eingeben, Dimensionsmatrix wird aufgebaut, Rang bestimmt, Π-Gruppen fallen heraus. Als nachvollziehbarer Rechenweg statt Blackbox.',
        m: 'Kap. 3.2–3.4, S. 14 ff.' },
      { k: 'Kap. 3 · Dimensionsanalyse', p: 'C',
        t: 'Modellähnlichkeit im Windkanal',
        d: 'Modell verkleinern und schauen, welche Kennzahl man opfern muss, wenn Re und Fr nicht gleichzeitig passen.',
        m: 'Kap. 3.5–3.6, S. 17 f.' },

      /* ---- Kap. 6 Reibung ---- */
      { k: 'Kap. 6 · Reibungsbehaftete Strömungen', p: 'A',
        t: 'Couette + Poiseuille überlagert',
        d: 'Zwei Regler — Wandgeschwindigkeit und Druckgradient — erzeugen das gesamte Profilspektrum inklusive Rückströmung. Zeigt sofort, warum die Lösung linear + parabolisch ist.',
        m: 'Kap. 6.2, S. 33 ff.' },
      { k: 'Kap. 6 · Reibungsbehaftete Strömungen', p: 'B',
        t: 'Stokes 1. und 2. Problem',
        d: 'Plötzlich angefahrene Wand und oszillierende Wand: Diffusion der Wirbelstärke nach oben, Eindringtiefe ~ √(νt) bzw. √(ν/ω), Phasenverschiebung.',
        m: 'Kap. 6.2, S. 34 ff.' },
      { k: 'Kap. 6 · Reibungsbehaftete Strömungen', p: 'B',
        t: 'Was die Reynoldszahl wirklich macht',
        d: 'Gleiche Geometrie, Re von 0.1 bis 10⁶: von schleichender Umströmung über anliegende Grenzschicht bis zur Kármánschen Wirbelstrasse.',
        m: 'Kap. 6.3.1, S. 36' },
      { k: 'Kap. 6 · Reibungsbehaftete Strömungen', p: 'C',
        t: 'Widerstandsbeiwert der Kugel über sechs Dekaden',
        d: 'cW(Re) mit Stokes-Ast, Plateau und Widerstandskrise — jeweils mit dem passenden Strömungsbild daneben.',
        m: 'Kap. 6.3.2, S. 37 f.' },

      /* ---- Kap. 7 Grenzschicht ---- */
      { k: 'Kap. 7 · Grenzschichten', p: 'A',
        t: 'Grenzschichtwachstum und Blasius-Profil',
        d: 'δ(x) ~ √(νx/u∞) an der Platte, Profil an jeder Stelle abgreifbar, Ähnlichkeitsvariable η als Erklärung, warum alle Profile aufeinanderfallen.',
        m: 'Kap. 7.1–7.2, S. 39 ff.' },
      { k: 'Kap. 7 · Grenzschichten', p: 'A',
        t: 'Ablösung unter Druckanstieg',
        d: 'Druckgradient regelbar: Profil kippt, Wendepunkt wandert in die Strömung, Wandschubspannung wird null, Rückströmung beginnt. Der Übergang von „anliegend“ zu „abgelöst“ als eine einzige Grösse.',
        m: 'Kap. 7.1, S. 39 f.' },
      { k: 'Kap. 7 · Grenzschichten', p: 'B',
        t: 'Verdrängungs- und Impulsverlustdicke',
        d: 'δ₁ und δ₂ als Flächengleichheit im Profil sichtbar machen — statt als Integral, das man auswendig lernt.',
        m: 'Kap. 7.3, S. 43 f.' },

      /* ---- Kap. 8 Turbulenz ---- */
      { k: 'Kap. 8 · Turbulenz', p: 'A',
        t: 'Reynolds-Zerlegung und Schubspannung',
        d: 'Signal u(t) mit Mittelwert und Schwankung, daraus −ρ·⟨u′v′⟩ als zusätzliche Spannung. Zeigt, warum turbulente Impulsübertragung wie eine Zähigkeit wirkt.',
        m: 'Kap. 8.2–8.3, S. 46 ff.' },
      { k: 'Kap. 8 · Turbulenz', p: 'A',
        t: 'Logarithmisches Wandgesetz',
        d: 'u⁺ über y⁺ halblogarithmisch: viskose Unterschicht, Puffer, Log-Bereich — mit umschaltbarer linearer Darstellung, damit klar wird, wie flach das Profil in Wandnähe wirklich ist.',
        m: 'Kap. 8.4, S. 48 ff.' },
      { k: 'Kap. 8 · Turbulenz', p: 'B',
        t: 'Moody-Diagramm interaktiv',
        d: 'Re und relative Rauheit einstellen, λ ablesen, Druckverlust berechnen — inklusive der Frage, ab wann die Rauheit überhaupt zählt.',
        m: 'Kap. 8.5–8.6, S. 50 ff.' },
      { k: 'Kap. 8 · Turbulenz', p: 'B',
        t: 'Laminares gegen turbulentes Rohrprofil',
        d: 'Parabel gegen 1/7-Potenz bei gleichem Volumenstrom: warum das turbulente Profil völliger ist und trotzdem mehr Verlust erzeugt.',
        m: 'Kap. 8.5, S. 50 ff.' },

      /* ---- Kap. 9 Potentialströmungen ---- */
                  { k: 'Kap. 9 · Potentialströmungen', p: 'A',
        t: 'd’Alembertsches Paradoxon',
        d: 'Die c_p-Verteilung um den Zylinder integrieren und sehen, wie sich alles exakt aufhebt — und daneben das reale Bild mit Ablösung, das den Widerstand erklärt.',
        m: 'Kap. 9.4, S. 71 f.' },
      { k: 'Kap. 9 · Potentialströmungen', p: 'B',
        t: 'Kutta-Bedingung und Anfahrwirbel',
        d: 'Profil anfahren: ohne Kutta-Bedingung Umströmung der Hinterkante, mit ihr sauberer Abfluss — und der Anfahrwirbel, der die Zirkulation bilanziert (Kelvin).',
        m: 'Kap. 9.5, S. 72 ff.' },
      { k: 'Kap. 9 · Potentialströmungen', p: 'C',
        t: 'Virtuelle Masse',
        d: 'Beschleunigter Körper im Fluid: warum er sich schwerer anfühlt, als er ist.',
        m: 'Kap. 9.6, S. 75 ff.' },

      /* ---- Kap. 10 Wirbel ---- */
      { k: 'Kap. 10 · Drehungsbehaftete Strömungen', p: 'A',
        t: 'Baroklines Drehmoment',
        d: 'Wenn ∇ρ und ∇p nicht parallel sind, entsteht Wirbelstärke aus dem Nichts — mit dem Standardbeispiel der schräg angeströmten Dichteschichtung.',
        m: 'Kap. 10.2, S. 85 f.' },
      { k: 'Kap. 10 · Drehungsbehaftete Strömungen', p: 'A',
        t: 'Hufeisenwirbel am Tragflügel',
        d: 'Gebundener Wirbel plus zwei Randwirbel, daraus Abwind und induzierter Widerstand. Erklärt, warum ein endlicher Flügel Widerstand hat, obwohl die 2D-Theorie keinen kennt.',
        m: 'Kap. 10.4, S. 89 ff.' },
      { k: 'Kap. 10 · Drehungsbehaftete Strömungen', p: 'B',
        t: 'Wirbelsätze von Helmholtz und Kelvin',
        d: 'Wirbelröhre kann im Fluid nicht enden, Γ bleibt entlang der Röhre und in der Zeit erhalten — als bewegte Röhre gezeigt, die sich verformt, aber ihre Zirkulation behält.',
        m: 'Kap. 10.3, S. 87 ff.' },
      { k: 'Kap. 10 · Drehungsbehaftete Strömungen', p: 'B',
        t: 'Biot-Savart für Wirbelfäden',
        d: 'Induzierte Geschwindigkeit eines geraden und eines halbunendlichen Wirbelfadens, inklusive des Faktors ½ zwischen beiden.',
        m: 'Kap. 10.3, S. 88' },
      { k: 'Kap. 10 · Drehungsbehaftete Strömungen', p: 'B',
        t: 'Leapfrogging zweier Wirbelringe',
        d: 'Zwei Ringe hintereinander schlüpfen abwechselnd durcheinander — dieselbe Mechanik wie beim Wandfall, nur ohne Spiegel. Guter Test, ob man Γ/R wirklich verstanden hat.',
        m: 'Kap. 10.3, S. 83' },

      /* ---- Kap. 11 Kompressibel ---- */
      { k: 'Kap. 11 · Kompressible Strömungen', p: 'A',
        t: 'Prandtl-Meyer-Expansionsfächer',
        d: 'Das Gegenstück zum schiefen Stoss: konvexe Ecke, zentrierter Fächer, stetig gekrümmte Stromlinie, ν(Ma) als Buchhaltung der Umlenkung.',
        m: 'Kap. 11.6, S. 112 ff.' },
      { k: 'Kap. 11 · Kompressible Strömungen', p: 'B',
        t: 'Energie-Ellipse',
        d: 'Alle möglichen Zustände eines Stromfadens auf einer Ellipse: Ma < 1, Ma = 1, Ma > 1, u_max, und wo die Winkelhalbierende liegt.',
        m: 'Kap. 11.2, S. 98, Abb. 11.2' },
      { k: 'Kap. 11 · Kompressible Strömungen', p: 'B',
        t: 'A/A* und Sperrung',
        d: 'Warum ein Querschnittsverlauf im Unterschall beschleunigt und im Überschall verzögert — mit dem Vorzeichenwechsel von (Ma²−1) als Angelpunkt.',
        m: 'Kap. 11.4, S. 105 ff.' },
      { k: 'Kap. 11 · Kompressible Strömungen', p: 'B',
        t: 'Überschallprofil komplett',
        d: 'Stösse und Expansionsfächer an einer angestellten Platte oder einem Rautenprofil zusammensetzen und daraus Auftrieb und Wellenwiderstand ausrechnen.',
        m: 'Kap. 11.5–11.6, S. 118 f., Abb. 11.13' },
      { k: 'Kap. 11 · Kompressible Strömungen', p: 'C',
        t: 'Einfluss der Reibung (Fanno)',
        d: 'Reibungsbehaftete Rohrströmung treibt jede Strömung Richtung Ma = 1 — von beiden Seiten.',
        m: 'Kap. 11.7, S. 115 ff.' },

      /* ---- übergreifend ---- */
      { k: 'Übergreifend', p: 'A',
        t: 'Welche Gleichung darf ich hier benutzen?',
        d: 'Entscheidungsbaum: inkompressibel oder nicht, reibungsfrei oder nicht, stationär, wirbelfrei, isentrop — und welche Formel danach übrig bleibt. Kein Bild, aber der grösste Zeitgewinn in einer Prüfung.',
        m: 'Kap. 3–11' },
      { k: 'Übergreifend', p: 'B',
        t: 'Kennzahlen-Landkarte',
        d: 'Re, Ma, Fr, Pr, We, St: was jede vergleicht, wann sie gross und wann klein ist, und welcher Term in der Gleichung dabei wegfällt.',
        m: 'Kap. 3.6, S. 18' }
    ];

    root.appendChild(FV.note('', 'Wie diese Liste zustande kommt',
      'Durchgang durch das Skript mit einer Frage: bei welchem Thema scheitert das Verständnis an einer ' +
      'fehlenden Vorstellung — nicht an fehlender Rechnung? Diese Themen stehen hier. ' +
      '<strong>Priorität A</strong> heisst: ohne Bild kaum zu verstehen und zugleich prüfungsrelevant. ' +
      '<strong>B</strong>: deutlicher Gewinn. <strong>C</strong>: schön, aber verzichtbar. ' +
      'Sag einfach, welches Thema als nächstes dran ist.'));

    var counts = { A: 0, B: 0, C: 0, done: 0 };
    ITEMS.forEach(function (it) { counts[it.p]++; if (it.done) counts.done++; });

    root.appendChild(FV.readout([
      { key: 'a', lab: 'fertig', cls: 'c2' },
      { key: 'b', lab: 'Priorität A offen', cls: 'c1' },
      { key: 'c', lab: 'Priorität B offen', cls: 'c3' },
      { key: 'd', lab: 'gesamt' }
    ]));
    var ro = root.lastChild;
    ro.set('a', String(counts.done));
    ro.set('b', String(counts.A - counts.done));
    ro.set('c', String(counts.B));
    ro.set('d', String(ITEMS.length));

    // nach Kapitel gruppieren und nach Kapitelnummer sortieren
    var groups = [];
    ITEMS.forEach(function (it) {
      var g = groups.filter(function (x) { return x.k === it.k; })[0];
      if (!g) { g = { k: it.k, items: [] }; groups.push(g); }
      g.items.push(it);
    });
    function order(k) {
      if (k.indexOf('Bereits') === 0) return -1;
      var m = k.match(/Kap\.\s*(\d+)/);
      return m ? parseInt(m[1], 10) : 99;
    }
    groups.sort(function (a, b) { return order(a.k) - order(b.k); });

    groups.forEach(function (g) {
      var box = h('div', { class: 'rm-group' }, h('h3', null, g.k));
      g.items.forEach(function (it) {
        var title = it.done
          ? h('a', { class: 't', href: '#' + it.link, style: 'color:var(--ok)' }, '✓ ' + it.t)
          : h('div', { class: 't' }, it.t);
        box.appendChild(h('div', { class: 'rm-item' + (it.done ? ' done' : '') },
          h('div', { class: 'prio p-' + it.p.toLowerCase() }, it.done ? 'fertig' : 'Prio ' + it.p),
          h('div', null,
            title,
            h('div', { class: 'd', html: it.d }),
            h('div', { class: 'm' }, it.m))));
      });
      root.appendChild(box);
    });

    root.appendChild(FV.section('Ein Thema ergänzen'));
    root.appendChild(h('p', { html:
      'Neue Datei unter <code>js/modules/</code> anlegen, <code>FV.register({…})</code> aufrufen und die ' +
      'Datei in <code>index.html</code> als <code>&lt;script&gt;</code> eintragen. Das Modul erscheint dann ' +
      'automatisch in der Navigation. Die Bausteine (Regler, Canvas, Diagramme, Merkkästen) stehen über ' +
      '<code>FV.*</code> bereit — Details in <code>README.md</code>.' }));
  }
});
