/* ============================================================
   Joukowski-Transformation — Skript Kap. 9.5, S. 72 ff., Anhang C
   Bindet das Widget ein und erklärt, was die konforme Abbildung tut.
   ============================================================ */

FV.register({
  id: 'joukowski',
  chapter: 'Potentialströmungen',
  chapterNo: '9.5',
  title: 'Joukowski: vom Kreis zum Profil',
  subtitle: 'Eine einzige Formel macht aus der Zylinderumströmung eine Tragflügelumströmung.',
  source: 'Skript S. 72 ff., Anhang C (komplexe Funktionen)',

  build: function (root) {
    var h = FV.h;

    root.appendChild(FV.note('', 'Die Idee dahinter',
      'Die Umströmung eines Kreiszylinders kennt man exakt. Die eines Tragflügelprofils nicht. ' +
      'Eine <strong>konforme Abbildung</strong> löst das Problem, indem sie den Kreis auf ein Profil ' +
      'verzerrt — und dabei die Strömung gleich mitnimmt. Man rechnet also im einfachen Raum und ' +
      'schaut das Ergebnis im komplizierten an.'));

    root.appendChild(FV.eq('ζ = z + <span class="frac"><span>a²</span><span class="den">z</span></span>',
      'Joukowski-Transformation. Für grosse |z| ist ζ ≈ z — weit weg vom Körper ändert sich nichts, ' +
      'die Anströmung bleibt dieselbe.'));

    root.appendChild(FV.embed({
      src: 'labs/joukowski.html',
      height: 560,
      title: 'Joukowski-Transformation',
      note: 'links die z-Ebene mit dem Kreis, rechts die ζ-Ebene mit seinem Bild'
    }));

    /* ---------------- Was die Regler tun ---------------- */

    root.appendChild(FV.section('1 · Was die drei Regler bewirken'));

    root.appendChild(h('div', { class: 'panel' },
      h('div', { style: 'font-weight:650;margin-bottom:6px;color:var(--c2)' }, 'Δx — Mittelpunkt nach links'),
      h('div', { html: 'Verschiebt den Kreismittelpunkt entlang der reellen Achse. Das erzeugt die ' +
        '<strong>Dicke</strong> des Profils. Bei Δx = 0 und Δy = 0 bleibt vom Kreis nur eine flache ' +
        'Platte übrig — die entartete Grenzform.', style: 'font-size:13.5px;color:var(--fg-dim)' })));

    root.appendChild(h('div', { class: 'panel' },
      h('div', { style: 'font-weight:650;margin-bottom:6px;color:var(--c2)' }, 'Δy — Mittelpunkt nach oben'),
      h('div', { html: 'Erzeugt die <strong>Wölbung</strong> (Krümmung der Skelettlinie). Ein gewölbtes ' +
        'Profil hat schon bei Anstellwinkel null Auftrieb — deshalb sind fast alle realen Profile ' +
        'gewölbt.', style: 'font-size:13.5px;color:var(--fg-dim)' })));

    root.appendChild(h('div', { class: 'panel' },
      h('div', { style: 'font-weight:650;margin-bottom:6px;color:var(--c2)' }, 'a — die kritischen Punkte'),
      h('div', { html: 'Bei z = ±a ist dζ/dz = 1 − a²/z² = <strong>0</strong>. Genau dort versagt die ' +
        'Winkeltreue, und genau dort entsteht die <strong>scharfe Hinterkante</strong> des Profils. ' +
        'Achte im Widget auf die gelben Punkte und die Marke f′ = 0.',
        style: 'font-size:13.5px;color:var(--fg-dim)' })));

    root.appendChild(FV.note('key', 'Die eine Bedingung, auf die es ankommt',
      'Der Kreis muss den Punkt z = +a <strong>genau durchlaufen</strong> und z = −a im Innern haben. ' +
      'Dann bildet sich bei +a die scharfe Hinterkante, und das Ergebnis ist ein Profil. ' +
      'Läuft der Kreis an beiden Punkten vorbei, wird das Bild nur eine <strong>Ellipse</strong> — die ' +
      'Statuszeile im Widget sagt dir, welcher Fall gerade vorliegt. Liegen beide Punkte ausserhalb, ' +
      'entsteht gar kein geschlossener Körper.'));

    /* ---------------- Konform ---------------- */

    root.appendChild(FV.section('2 · Was „konform“ bedeutet'));

    root.appendChild(h('p', { html:
      'Konform heisst <strong>winkeltreu</strong>: zwei Kurven, die sich in der z-Ebene unter einem ' +
      'bestimmten Winkel schneiden, tun das im Bild unter demselben Winkel. Im Widget siehst du das an ' +
      'den orangen Strom- und grünen Potentiallinien: sie stehen links überall senkrecht aufeinander — ' +
      'und rechts, so verbogen das Bild auch ist, immer noch.' }));

    root.appendChild(FV.note('warn', 'Genau eine Ausnahme',
      'Die Winkeltreue gilt überall dort, wo die Ableitung <strong>nicht</strong> verschwindet. Bei ' +
      'z = ±a ist dζ/dz = 0, und dort werden Winkel <strong>verdoppelt</strong>. Aus dem glatten ' +
      'Kreisdurchgang (180°) wird deshalb eine Ecke mit 360° — die scharfe Hinterkante. Das ist kein ' +
      'Fehler der Methode, sondern ihr eigentlicher Trick.'));

    root.appendChild(h('p', { html:
      'Und weil die Abbildung winkeltreu ist, bleibt eine Potentialströmung eine Potentialströmung: ' +
      'Φ und Ψ übertragen sich unverändert, nur die Geschwindigkeit skaliert mit dem Kehrwert der ' +
      'Ableitung, w<sub>ζ</sub> = w<sub>z</sub> / (dζ/dz). Deshalb wird die Geschwindigkeit an der ' +
      'Hinterkante rechnerisch unendlich — bis die <strong>Kutta-Bedingung</strong> festlegt, dass die ' +
      'Zirkulation gerade so gross sein muss, dass die Strömung dort glatt abfliesst.' }));

    /* ---------------- Zusammenhang ---------------- */

    root.appendChild(FV.section('3 · Die ganze Kette'));

    var chain = [
      ['Zylinder mit Zirkulation', 'Parallelströmung + Dipol + Wirbel — exakt lösbar', '#56c8f5', 'potentiallab'],
      ['Joukowski-Abbildung', 'ζ = z + a²/z verzerrt den Kreis zum Profil', '#a78bfa', null],
      ['Kutta-Bedingung', 'legt Γ fest: glatter Abfluss an der Hinterkante', '#ffd166', null],
      ['Kutta-Joukowski', 'F_y = −Γ·ρu∞·b — der Auftrieb steht da', '#ff8a4c', null]
    ];
    var box = h('div', { class: 'panel' });
    chain.forEach(function (c, i) {
      box.appendChild(h('div', { style: 'display:grid;grid-template-columns:26px 1fr;gap:12px;padding:9px 0' +
        (i < chain.length - 1 ? ';border-bottom:1px solid var(--line)' : '') },
        h('div', { style: 'font-family:var(--mono);color:' + c[2] }, String(i + 1)),
        h('div', null,
          c[3] ? h('a', { href: '#' + c[3], style: 'font-weight:600;font-size:14px' }, c[0])
               : h('div', { style: 'font-weight:600;font-size:14px' }, c[0]),
          h('div', { html: c[1], style: 'font-size:13px;color:var(--fg-dim);margin-top:2px' }))));
    });
    root.appendChild(box);

    root.appendChild(FV.note('', 'Der Punkt, den man behalten sollte',
      'Ohne die Kutta-Bedingung ist die Zirkulation um ein Profil <strong>nicht festgelegt</strong> — ' +
      'die Potentialtheorie allein lässt unendlich viele Lösungen zu, jede mit einem anderen Auftrieb. ' +
      'Erst die Forderung, dass die Strömung an der scharfen Hinterkante nicht mit unendlicher ' +
      'Geschwindigkeit um die Ecke schiessen darf, wählt eine davon aus. In der Realität sorgt die ' +
      'Reibung dafür, dass sich genau diese einstellt — über den Anfahrwirbel, der beim Start ' +
      'abschwimmt.'));
  }
});
