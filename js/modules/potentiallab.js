/* ============================================================
   Potentialströmungs-Lab — Skript Kap. 9.3, S. 63–71
   Bindet das eigenständige Lab ein und liefert den Skript-Kontext:
   welche Elementarlösung was tut und was man damit üben soll.
   ============================================================ */

FV.register({
  id: 'potentiallab',
  chapter: 'Potentialströmungen',
  chapterNo: '9.3',
  title: 'Elementarlösungen überlagern',
  subtitle: 'Baukasten: Quelle, Senke, Wirbel, Dipol und Parallelströmung frei zusammensetzen.',
  source: 'Skript S. 63–71, Abb. 9.6–9.10',

  build: function (root) {
    var h = FV.h;

    root.appendChild(FV.note('', 'Warum das funktioniert',
      'Die Potentialgleichung ΔΦ = 0 ist <strong>linear</strong>. Deshalb darf man Lösungen einfach ' +
      'addieren, und aus einer Handvoll Elementarlösungen wird jede Körperumströmung, die man braucht. ' +
      'Genau das macht dieses Lab: Elemente ins Feld setzen, verschieben, und zusehen, welcher Körper ' +
      'entsteht. Der Körper ist dabei nichts anderes als eine <em>Stromlinie</em>, die man zur Wand ' +
      'erklärt.'));

    root.appendChild(FV.embed({
      src: 'labs/potentialstroemung.html',
      height: 700,
      title: 'Potentialströmungs-Lab',
      note: 'Element wählen und ins Feld klicken · Ziehen verschiebt · Rechtsklick löscht · Leertaste pausiert'
    }));

    /* ---------------- Bedienung ---------------- */

    root.appendChild(FV.section('1 · Was du damit üben solltest'));

    root.appendChild(h('p', { html:
      'Arbeite die Presets der Reihe nach durch und sag jeweils <em>vorher</em>, was passieren wird. ' +
      'Das ist genau die Denkarbeit, die in der Prüfung verlangt wird.' }));

    function step(nr, title, body) {
      return h('div', { class: 'panel' },
        h('div', { style: 'font-weight:650;font-size:14.5px;margin-bottom:5px' },
          h('span', { style: 'color:var(--c2);font-family:var(--mono);margin-right:8px' }, nr), title),
        h('div', { html: body, style: 'font-size:13.5px;color:var(--fg-dim)' }));
    }

    root.appendChild(step('01', 'Halbkörper — Parallelströmung + Quelle',
      'Die Quelle verdrängt die ankommende Strömung. Vor ihr entsteht ein <strong>Staupunkt</strong>, wo ' +
      'sich Anströmung und Quellströmung genau aufheben. Suche ihn im Lab (dort wird |w| = 0) und prüfe ' +
      'den Abstand: x<sub>S</sub> = Q/(2π u<sub>∞</sub>). Weit stromab läuft der Körper auf die feste ' +
      'Breite Q/u<sub>∞</sub> zu — der gesamte Volumenstrom der Quelle muss ja irgendwo hin.'));

    root.appendChild(step('02', 'Rankine-Körper — Parallelströmung + Quelle + Senke',
      'Setze hinter die Quelle eine gleich starke Senke. Jetzt schluckt die Senke alles, was die Quelle ' +
      'ausstösst, und der Körper <strong>schliesst sich</strong>. Zwei Staupunkte, vorn und hinten. ' +
      'Schiebe die beiden zusammen — der Körper wird runder und geht im Grenzfall in den Zylinder über.'));

    root.appendChild(step('03', 'Zylinder — Parallelströmung + Dipol',
      'Der Grenzfall aus 02: Quelle und Senke fallen zusammen und werden zum Dipol. Mit dem Moment ' +
      'm = u<sub>∞</sub>R² wird die Stromlinie Ψ = 0 genau zum Kreis mit Radius R. Prüfe im Lab die ' +
      'Geschwindigkeit auf dem Zylinder: sie erreicht in den Scheiteln <strong>2u<sub>∞</sub></strong>, ' +
      'also den doppelten Anströmwert, und ist in den Staupunkten null.'));

    root.appendChild(step('04', 'Magnus — Zylinder + Wirbel',
      'Jetzt kommt Zirkulation dazu. Das Bild wird unsymmetrisch: oben wird die Strömung schneller ' +
      '(kleinerer Druck), unten langsamer. Beobachte die beiden <strong>Staupunkte</strong> — sie ' +
      'wandern aufeinander zu und lösen sich bei genügend starkem Γ vom Zylinder ab. Schalte die ' +
      'Druck-Ebene ein und sieh die Asymmetrie direkt.'));

    root.appendChild(step('05', 'Wand — Spiegelungsprinzip',
      'Eine Wand ist kein neues Element, sondern ein <strong>gespiegeltes</strong>. Setze eine Quelle vor ' +
      'eine Wand: das Lab ergänzt automatisch das Spiegelbild, und die Wand wird zur Stromlinie. Genau ' +
      'dieselbe Konstruktion steckt hinter dem ' +
      '<a href="#wirbelring">Wirbelring an der Wand</a> — dort mit umgekehrter Zirkulation, weil ein ' +
      'Wirbel anders gespiegelt wird als eine Quelle.'));

    root.appendChild(FV.note('warn', 'Spiegelregel — wird gern verwechselt',
      '<strong>Quelle</strong> vor einer Wand → Spiegelbild ist wieder eine <strong>Quelle</strong> ' +
      'gleicher Stärke. <strong>Wirbel</strong> vor einer Wand → Spiegelbild ist ein Wirbel mit ' +
      '<strong>umgekehrtem</strong> Vorzeichen. In beiden Fällen wird die Wand dadurch zur Stromlinie: ' +
      'die Normalkomponente verschwindet dort.'));

    /* ---------------- Formelübersicht ---------------- */

    root.appendChild(FV.section('2 · Die Elementarlösungen'));

    root.appendChild(h('p', { html:
      'Alle in der komplexen Schreibweise F(z) = Φ + iΨ mit der komplexen Geschwindigkeit ' +
      'w(z) = dF/dz = u − iv. Vorzeichen und Normierung wie im Skript S. 63 f.' }));

    root.appendChild(h('div', { style: 'overflow-x:auto' }, h('table', null,
      h('thead', null, h('tr', null,
        h('th', null, 'Element'), h('th', null, 'F(z)'), h('th', null, 'w(z)'), h('th', null, 'Merkmal'))),
      h('tbody', null,
        frow('Parallelströmung', 'u<sub>∞</sub> · z', 'u<sub>∞</sub>',
          'die einzige Potentialströmung ohne jede Singularität'),
        frow('Quelle / Senke', '<span class="frac"><span>Q</span><span class="den">2π</span></span> ln z',
          '<span class="frac"><span>Q</span><span class="den">2πz</span></span>',
          'u<sub>r</sub> = Q/2πr, u<sub>θ</sub> = 0 · Q > 0 Quelle, Q < 0 Senke'),
        frow('Potentialwirbel', '−<span class="frac"><span>iΓ</span><span class="den">2π</span></span> ln z',
          '−<span class="frac"><span>iΓ</span><span class="den">2πz</span></span>',
          'u<sub>θ</sub> = Γ/2πr, u<sub>r</sub> = 0 · Γ > 0 im Gegenuhrzeigersinn'),
        frow('Dipol', '<span class="frac"><span>m</span><span class="den">z</span></span>',
          '−<span class="frac"><span>m</span><span class="den">z²</span></span>',
          'Grenzfall Quelle + Senke bei ε → 0 mit Qε/π = m'),
        frow('Zylinder', 'u<sub>∞</sub>(z + R²/z)', 'u<sub>∞</sub>(1 − R²/z²)',
          'Parallelströmung + Dipol mit m = u<sub>∞</sub>R²')
      ))));

    function frow(a, b, c, d) {
      return h('tr', null, h('td', { html: '<strong>' + a + '</strong>' }),
        h('td', { html: b, style: 'font-family:var(--mono)' }),
        h('td', { html: c, style: 'font-family:var(--mono)' }),
        h('td', { html: d, style: 'font-size:12.5px;color:var(--fg-dim)' }));
    }

    root.appendChild(FV.note('key', 'Quelle und Wirbel sind dasselbe, um 90° gedreht',
      'Die komplexen Potentiale unterscheiden sich nur um den Faktor −i, also eine Drehung um π/2 in der ' +
      'komplexen Ebene. Dadurch <strong>vertauschen Stromlinien und Potentiallinien ihre Rollen</strong>: ' +
      'Bei der Quelle sind die Stromlinien radiale Halbgeraden und die Potentiallinien konzentrische ' +
      'Kreise, beim Wirbel genau umgekehrt. Schalte im Lab Ψ- und Φ-Linien abwechselnd ein und ' +
      'vergleiche beide Elemente — das sieht man sofort.'));

    /* ---------------- Kräfte ---------------- */

    root.appendChild(FV.section('3 · Kräfte: das Paradoxon und der Auftrieb'));

    root.appendChild(FV.eq('F<sub>y</sub> = −Γ · ρ u<sub>∞</sub> · b',
      'Auftriebsformel von Kutta-Joukowski · Skript S. 71 f. — beachte das Minuszeichen bei ' +
      'der Vorzeichenkonvention Γ > 0 im Gegenuhrzeigersinn'));

    root.appendChild(h('p', { html:
      'Und der zweite, ebenso wichtige Teil: <strong>F<sub>x</sub> = 0</strong>. Eine ebene ' +
      'Potentialströmung erzeugt <em>keinen</em> Widerstand — das <strong>d’Alembertsche Paradoxon</strong>. ' +
      'Im Lab kannst du das nachvollziehen: Schalte beim Zylinder ohne Zirkulation die Druck-Ebene ein. ' +
      'Vorne und hinten herrscht derselbe Überdruck, oben und unten derselbe Unterdruck. Beim Integrieren ' +
      'über den Umfang hebt sich alles auf.' }));

    root.appendChild(FV.note('warn', 'Warum die Realität anders aussieht',
      'Der Widerstand eines realen Zylinders kommt aus der <strong>Grenzschicht</strong> und ihrer ' +
      'Ablösung — beides gibt es in der reibungsfreien Theorie nicht. Der Auftrieb dagegen wird von der ' +
      'Potentialtheorie erstaunlich gut getroffen, solange die Strömung anliegt. Deshalb rechnet man ' +
      'Tragflügel bis heute so.'));

    root.appendChild(FV.section('4 · Verwandte Kapitel'));
    root.appendChild(h('ul', null,
      h('li', { html: 'Der <a href="#joukowski">konformen Abbildung</a> macht aus dem Kreis von hier ein ' +
        'echtes Tragflügelprofil.' }),
      h('li', { html: 'Der <a href="#wirbel">Potentialwirbel</a> im Vergleich zum Starrkörperwirbel — ' +
        'warum ω ≡ 0 ist, obwohl sich alles dreht.' }),
      h('li', { html: 'Das <a href="#wirbelring">Spiegelungsprinzip</a> an einer Wand, angewendet auf ' +
        'Wirbelringe.' })));
  }
});
