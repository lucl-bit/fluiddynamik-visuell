# Fluiddynamik — visuell

**→ [lucl-bit.github.io/fluiddynamik-visuell](https://lucl-bit.github.io/fluiddynamik-visuell/)**

Interaktive Erklärseite zum Skript *Fluiddynamik FS 2026* (IFD, ETH Zürich, Version 04.04.2026).
Jedes Thema hat eine Animation zum Herumspielen und daneben die Erklärung, warum das
Bild zeigt, was es zeigt.

**Lokal öffnen:** `index.html` doppelklicken. Kein Server, kein Build, kein Internet nötig —
reines HTML, CSS und JavaScript ohne jede Abhängigkeit.

> Private Lernhilfe, kein offizielles Lehrmaterial. Formeln, Abbildungsnummern und
> Seitenverweise beziehen sich auf das Skript des Instituts für Fluiddynamik der ETH Zürich;
> die Rechte daran liegen beim Institut. Die Animationen, Simulationen und Texte hier sind
> eigenständig entstanden.

## Was drin ist

| Thema | Skript | Inhalt |
|---|---|---|
| Stromlinie, Bahnlinie, Streichlinie | Kap. 4.5, S. 22–23 | Alle vier ausgezeichneten Linien gleichzeitig in einem instationären Feld, umschaltbar auf stationär; Definitionen und Eigenschaftstabelle |
| Elementarlösungen überlagern | Kap. 9.3, S. 63–71 | eingebettetes Potentialströmungs-Lab (`labs/`) plus Übungsplan, Formelübersicht, Spiegelregel, d'Alembert |
| Joukowski-Transformation | Kap. 9.5, S. 72 ff. | eingebettetes Widget (`labs/`) plus Erklärung von Winkeltreue, kritischen Punkten und Kutta-Bedingung |
| Die vier Modellwirbel | Kap. 10.1, S. 79–81 | Starrkörper gegen Potentialwirbel mit Orientierungszeigern und materiellem Fluidelement; der Rankine-Wirbel mit verschiebbarem Kernradius, Profilen, Druckdelle und Trichter; Zirkulation aller drei; der Hillsche Kugelwirbel im Meridianschnitt (mitbewegt und im Laborsystem) und als 3D-Torus; Gegenbeispiel Scherströmung, Prüfungsfallen |
| Wirbellinien und die Grenzschicht | Kap. 10.1, S. 82 f., Abb. 10.4 | Wo Wirbellinien in fünf Strömungen liegen (3D, umschaltbar), Blasius-Grenzschicht mit ω-Verteilung und mitschwimmenden Schaufelrädern, ausgelenkte Wirbellinie (Λ-Wirbel), Galilei-Invarianz, Helmholtz |
| Biot-Savart | Kap. 10.1, S. 83 f., Abb. 10.5 | Das Linienintegral Beitrag für Beitrag in einer drehbaren 3D-Szene (ds, r, das aufgespannte Parallelogramm, ds×r, mitwachsender Summenvektor), fünf Fadenformen mit numerischer Gegenprobe zur Winkelformel, die Grenzübergänge zu Γ/2πr und Γ/4πr, das Volumenintegral, Rechenlabor mit drei Prüfungsgeometrien |
| Wirbelstreckung und Kippen | Kap. 10.2, S. 84–86 | Wirbelelement frei orientierbar, W mit Zerlegung in Streckung und Kippen, materielle Entwicklung, 2D-Sonderfall, Pirouetteneffekt. Löst FS24 3.3 und HS19 3.6 |
| Wirbelring an der Wand | Kap. 10.3, S. 83, 87 ff. | Spiegelwirbel-Prinzip, Biot-Savart-Simulation beider Prüfungsfälle mit dem wandfreien Ring als Vergleich. Löst HS19 3.4 und 3.5 |
| Tragflügel: 2D gegen 3D | Kap. 10.4, S. 89–91, Abb. 10.7–10.9 | Warum die ebene Theorie keinen Widerstand kennt und der endliche Flügel zwingend einen hat: integrierte Stromlinien um den Flügel, Hufeisenmodell mit w(z), Traglinie in Glauert-Form (elliptisch als beweisbares Optimum), Kräftezerlegung am Profilschnitt, c_W,ind über der Flügelstreckung, Vergleichstabelle |
| Verdichtungsstoss | Kap. 11.3/11.5, S. 101–112 | Aufsteilen einer Kompressionswelle, Machkegel, senkrechter Stoss mit allen Verhältnissen, θ-β-Ma-Stossdiagramm mit abgehobenem Stoss |
| Kanallabor: Fläche, Reibung, Sperrung | Kap. 11.4 + 11.7 | Ein Kanal, umschaltbar zwischen Laval und Fanno; wo Ma = 1 auftritt (Hals gegen Rohrende), Sperrgrenze, Massenstrom über Gegendruck, kritische Rohrlänge L* |
| Freistrahl: die Wellen lesen | Kap. 11.5–11.6, S. 109–115 | Was eine Machwelle ist, Schritt-für-Schritt-Konstruktion ihres Wegs durch den Strahl, die zwei Reflexionsregeln, Druckverlauf auf der Achse |
| Laval-Düse | Kap. 11.4, S. 105–108 | Erkennungsregel über-/unterexpandiert am Strahlbild, Freistrahl mit Rautenmuster, Düse mit Gegendruck-Regler über alle Fälle A–F. Löst FS24 A17 und FS25 A8.3 |
| Roadmap | Kap. 3–11 | Liste der Themen, die als nächstes visualisiert werden, nach Priorität |

## Aufbau

```
index.html          Skelett + Script-Tags (hier neue Module eintragen)
css/style.css       gesamtes Styling
js/core.js          Registry, Router, Bausteine (FV.*)
js/modules/*.js     ein Thema pro Datei
labs/*.html         eigenständige Labs, per iframe eingebunden
verify.js           Prüfskript (node verify.js)
```

Ein eigenständiges Lab bindet man mit `FV.embed({src, height, note})` ein — es bleibt eine
vollständige HTML-Seite und lässt sich auch direkt öffnen. Die Labs in `labs/` sind Kopien;
Änderungen dort wirken nicht auf die Originale zurück.

Bewusst klassische `<script>`-Tags statt ES-Modulen — nur so läuft die Seite über
`file://` per Doppelklick.

## Ein neues Thema hinzufügen

1. `js/modules/meinthema.js` anlegen:

```js
FV.register({
  id: 'meinthema',                    // wird zum #hash in der URL
  chapter: 'Grenzschichten',          // Gruppe in der Navigation
  chapterNo: '7.1',                   // Nummer links in der Navigation
  title: 'Grenzschichtwachstum',
  subtitle: 'Ein Satz, der sagt, worum es geht.',
  source: 'Skript S. 39 ff., Abb. 7.2',

  build: function (root) {
    root.appendChild(FV.section('1 · Die Animation'));

    var cv = FV.canvas({
      aspect: 0.5,                    // Höhe / Breite
      render: function (ctx, w, h, t) { /* zeichnen */ },
      cap: 'Bildunterschrift'
    });
    root.appendChild(cv);

    root.appendChild(FV.ctrlRow(
      FV.slider({ label: 'Re', min: 100, max: 1e5, value: 1000,
                  fmt: function (v) { return v.toFixed(0); },
                  onInput: function (v) { /* … */ cv.draw(); } })
    ));

    FV.loop(function (t) { cv.draw(); });   // nur wenn animiert
  }
});
```

2. In `index.html` eintragen: `<script src="js/modules/meinthema.js"></script>`
3. In `js/modules/roadmap.js` das Item auf `done: true` setzen und `link: 'meinthema'` eintragen.

Die Reihenfolge der Script-Tags bestimmt die Reihenfolge in der Navigation.

## Bausteine (`FV.*`)

**Struktur** — `h(tag, attrs, …kinder)`, `section(titel)`, `panel(titel, …)`,
`note(art, kopf, html)` mit art `''` / `'warn'` / `'key'`, `eq(html, label)`,
`legend([{c, t}])`

**Bedienelemente** — `slider({label, min, max, step, value, fmt, onInput})`,
`toggle(label, an, onChange)`, `button(label, onClick)`, `ctrlRow(…)`,
`readout([{key, lab, cls}])` mit `.set(key, text)`

**Zeichnen** — `canvas({aspect, render, animate, cap})` liefert ein Element mit
`.draw()` und `.size()`; `loop(fn)` für Animationen (wird beim Themenwechsel
automatisch gestoppt); `arrow(ctx, x1, y1, x2, y2, farbe, breite, kopf)`;
`text(ctx, x, y, txt, {color, font, align})`

**Diagramme** — `plot(ctx, {w, h, x:[a,b], y:[a,b], pad, xticks, yticks, xlabel, ylabel})`
liefert `X(v)`, `Y(v)`, `grid()`, `axes()`, `curve(f, stil)`, `poly(punkte, stil)`,
`vline(x, stil)`, `dot(x, y, farbe, r)`, `label(x, y, txt, farbe)`, `clip(fn)`

**Drehbare 3D-Szene** — `scene3d({aspect, span, azim, elev, animate, cap, draw(S, t), pick()})`.
Ziehen dreht, Rad zoomt, Doppelklick setzt zurück; `pick()` liefert greifbare Punkte als
`[{p, set(neuesP)}]`. Im Zeichencallback stehen `S.line3`, `S.poly3`, `S.fill3`, `S.arrow3`,
`S.arc3`, `S.point3`, `S.label3`, `S.filament3` (Wirbelfaden mit Γ-Pfeilen), `S.spin3`
(Drehsinn-Ring), `S.axes`, `S.grid3` bereit, dazu `S.P(p)` und die Vektorhelfer `FV.V3`.
Bewusst orthographisch, damit Winkel und Längen ablesbar bleiben; Tiefensortierung über die
mittlere Tiefe jedes Objekts. `layer: 'front'` bzw. `'back'` erzwingt die Reihenfolge.

Farbrollen: `--c1` orange für die erste Vergleichsgrösse (Starrkörper, Zustand 1),
`--c2` cyan für die zweite (Potentialwirbel, Zustand 2), `--c3` violett für Ruhegrössen
und Entropie.

## Nachrechnen

```bash
node verify.js
```

`verify.js` schneidet die Physikblöcke aus den Moduldateien selbst heraus und rechnet sie
gegen bekannte Werte nach — Syntax aller Dateien, die Formeln der Wirbelstreckung, das
Biot-Savart-Linienintegral gegen seine geschlossenen Formeln, die Traglinie und die
Beiwerte des Tragflügels, die Biot-Savart-Simulation beider Wandfälle, die Eigengeschwindigkeit Γ/(4πR) des freien Rings,
die Blasius-Lösung und die Fanno-Verhältnisse gegen die Zahlenwerte des Skripts, den
Rankine-Wirbel (Anschluss bei r₀, dp/dr = ρuθ²/r, Bernoulli-Konstante) und den Hillschen
Kugelwirbel (u aus ψ, ω_φ/ρ = const., div u = 0, Γ = 5Ua, geschlossene Bahnen), die
Prandtl-Meyer-Funktion und die Wellenreflexionen im Freistrahl, die Düsenrechnung gegen die
Isentropentafeln und die Einbindung in `index.html`. Wer ein Modul ändert, sollte das Skript
danach laufen lassen; erwartete Ausgabe ist `ALLE 394 PRUEFUNGEN BESTANDEN`.

Das Skript hat sich bereits bezahlt gemacht: es hat einen invertierten Massenstrom
(`ṁ/ṁmax > 1` bei nicht gesperrter Düse) und zwei Preset-Knöpfe gefunden, die wegen der
Slider-Schrittweite ihren Fall verfehlten.

## Hinweise

- Canvas-Zeichenkoordinaten sind CSS-Pixel; die Skalierung für Retina macht `core.js`.
- Positionen bewegter Teilchen relativ (0…1) speichern, nicht in Pixeln — sonst
  springt beim Fenstergrössenwechsel alles.
- Alle Zahlenwerte werden aus den Formeln des Skripts gerechnet, nichts ist
  abgetippt. Kontrollwerte senkrechter Stoss bei Ma₁ = 2: Ma₂ = 0.577, p₂/p₁ = 4.50,
  ρ₂/ρ₁ = 2.67, T₂/T₁ = 1.69, p₀₂/p₀₁ = 0.721. Schiefer Stoss bei Ma₁ = 2.5, θ = 15°:
  β = 36.9°, Ma₂ = 1.874, θ_max = 29.8°.
- Wirbelstreckung, Kontrollfall der Prüfungsaufgabe (φ = 90°, reine Scherung S = −1.2):
  W = (−1.20, 0), Streckungsrate exakt 0, Kipprate 68.8 °/s, u·ω = 0 — deckt sich mit
  der Musterlösung FS24 (F · R · R · R).
- Wirbelring, freier Ring: Eigengeschwindigkeit exakt Γ/(4πR) = 1/R bei Γ = 4π. Mit Wand
  bei h = 2.5, R = 0.9 startet sie bei 0.955 statt 1.111 und sinkt weiter, während R wächst.
- Blasius wird beim Laden numerisch gelöst (RK4), nicht tabelliert. Statt eines Shootings
  nutzt `blasius()` die Skalierungsinvarianz: einmal mit f″(0) = 1 integrieren liefert
  F′(∞) = C, daraus folgt f″(0) = C^(−3/2) exakt. Kontrollwerte: f″(0) = 0.332057,
  η(u/u∞ = 0.99) = 4.910 (das „5“ des Skripts), δ₁ = 1.7208, δ₂ = 0.6641,
  c_f·√Re_x = 0.664 — alles Literatur- und Skriptwerte auf vier Stellen.
- Die Grenzschichtfiguren stellen y stark überhöht dar; der Faktor steht im Bild bzw. in
  der Anzeige. Ohne Überhöhung wäre die Grenzschicht bei Re = 20 000 nur 3 % der Plattenlänge.
- Ausgezeichnete Linien, instationär bei x = −1.0 (Voreinstellungen): Bahnlinie y = +0.544,
  Streichlinie y = −0.514, Stromlinie y = −0.338. Stationär geschaltet: alle drei exakt 0.
- Joukowski-Widget: der Kreis läuft durch z = +a (dort die scharfe Hinterkante), z = −a liegt
  im Innern. Die Kopie in `labs/` wurde dafür in einer Zeile korrigiert — im Original lief der
  Kreis durch −a, während die Statusanzeige +a prüfte und deshalb „Ellipse" meldete.
- Fanno (γ = 1.4), gegen die Tafel geprüft: bei Ma = 0.5 ist T/T* = 1.1429, p/p* = 2.1381,
  p₀/p₀* = 1.3399 und λL*/D = 1.0691; bei Ma = 2 entsprechend 0.6667 / 0.4082 / 1.6875 / 0.3050.
  Der Grenzwert λL*/D → 0.8215 für Ma → ∞ stimmt auf vier Stellen. Die Beziehung für L* steht
  nicht im Skript (dort nur die Zustandsverhältnisse, S. 118, mit Verweis auf Kundu Kap. 15.8).
- Prandtl-Meyer: ν(2) = 26.380°, ν(3) = 49.757°, ν(∞) = 130.45° — Literaturwerte auf drei Stellen.
- Biot-Savart: das numerische Linienintegral wird gegen die geschlossenen Formeln gerechnet,
  nicht umgekehrt. Unendlicher Faden Γ/(2πr), halbunendlicher Γ/(4πr) — das Verhältnis ist bei
  *jeder* Länge exakt 2, nicht erst im Grenzwert. Ring auf der Achse Γ R²/(2(R²+z²)^(3/2)),
  im Zentrum Γ/(2R).
- Die drei Prüfungsgeometrien tragen alle denselben Trick: bei geschickter Wahl des Aufpunkts
  ist |r| über den ganzen Kreisbogen konstant und wandert aus dem Integral. Gleitschirm
  |r| = √2·R, Ergebnis (−Γ/(32a), −√2Γ/(16πa), 0); Tragflügel |r| = √(R²+a²). Beide sind
  numerisch gegengerechnet, haben aber **keine** offizielle Musterlösung und sind auf der
  Seite mit ⚠ gekennzeichnet.
- Traglinie: gerechnet wird in der Glauert-Form Γ(θ) = Σ Gₙ sin(nθ), **nicht** mit
  Hufeisen-Panels. Grund: das Abwindintegral ist ein Cauchy-Hauptwert; diskrete freie Wirbel
  auf den Knoten lassen ihn an den Flügelspitzen divergieren, und der Fehler dort wächst mit
  der Panelzahl statt zu verschwinden. Die Reihe liefert w exakt konstant über die ganze
  Spannweite (−Γ₀/(2b), auf 1e−9 geprüft, bis in die Spitzen).
- Aus L = ϱu∞πb G₁/4 und D = ϱ(π/8)·Σ n Gₙ² liest man die Optimalität der Ellipse direkt ab:
  der Auftrieb hängt allein an G₁, jeder weitere Koeffizient kostet nur Widerstand. Eine
  parabolische Verteilung kostet exakt 12.5 % mehr — analytisch Σ_{n≥3, ungerade} 9/(n(n²−4)²) = 1/8.
- Einzelhufeisen: w(z) = −Γ/(4π)·b/((b/2)²−z²), in der Mitte −Γ/(πb). An den Spitzen divergiert
  es — das ist ein Modellfehler, kein physikalischer Effekt, und der Grund für die Traglinie.
- `core.js`: der rAF-Zeitstempel bezieht sich auf den Frame-*Beginn* und kann vor dem in
  `ensureRaf()` genommenen `performance.now()` liegen. `t` wurde dadurch im ersten Frame
  negativ, was jedes `floor(t·n)` auf −1 schickte. Wird jetzt bei 0 geklemmt.
- Laval-Düse mit A_e/A* = 2.0: Ma_e = 2.1972 (Überschall) bzw. 0.3059 (Unterschall),
  p_E/p₀ = 0.0939 (angepasst), p_B/p₀ = 0.9372 (gerade gesperrt), p_D/p₀ = 0.5134
  (Stoss am Austritt) — alles Tafelwerte für γ = 1.4.
- Herleitungen ohne offizielle Musterlösung (alles aus HS19) sind auf der Seite mit ⚠
  gekennzeichnet — dieselbe Konvention wie im Prüfungstrainer. Die Laval-Aufgaben (FS24,
  FS25) haben dagegen beide eine Musterlösung.
