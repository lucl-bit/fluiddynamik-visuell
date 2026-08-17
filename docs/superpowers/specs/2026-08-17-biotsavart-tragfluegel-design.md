# Biot-Savart und die 3D-Strömung am Tragflügel

Design für zwei neue Kapitel der Seite *Fluiddynamik — visuell*, plus den 3D-Baustein,
den beide teilen. Stand 2026-08-17.

## Ziel

Zwei Fragen sollen nach dem Durcharbeiten beantwortbar sein:

1. **Woher kommt die Geschwindigkeit an einem Punkt?** Nicht „die Formel lautet …", sondern:
   welcher Teil des Wirbelfadens liefert welchen Beitrag, in welche Richtung zeigt er,
   und wie summiert sich das zum Endergebnis.
2. **Was unterscheidet die 2D- von der 3D-Umströmung eines Tragflügels?** Insbesondere:
   warum die ebene Theorie keinen Widerstand kennt und die räumliche zwingend einen hat.

Belege: Skript Fluiddynamik FS 2026, Kap. 10.1 (S. 83 f., Abb. 10.5) und Kap. 10.4
(S. 89–91, Abb. 10.7–10.9).

## Fundament: `FV.scene3d()` in `core.js`

Eine drehbare Szene, die beide Kapitel benutzen. Bewusst **orthographisch**, nicht
perspektivisch — Winkel und Längen sollen ablesbar bleiben; eine Fluchtpunktverzerrung
würde genau das kaputt machen, worum es geht.

- Kamera über Azimut/Elevation. Ziehen dreht, Rad zoomt, Doppelklick setzt zurück.
- `P(x, y, z)` liefert Bildkoordinaten, `depth(x, y, z)` den Kamerabstand.
  Gezeichnet wird über eine nach Tiefe sortierte Liste (Painter's Algorithm).
- Raum-Primitive: `line3`, `arrow3`, `arc3`, `filament3` (Wirbelfaden mit Drehsinn-Ringen),
  `point3`, `label3`, `plane3`, dazu Achsenkreuz und Bodengitter.
- Ein Aufpunkt lässt sich mit der Maus greifen und in einer wählbaren Ebene verschieben.

Konvention wie im Rest des Projekts: Raumkoordinaten werden physikalisch gespeichert,
nie in Pixeln — sonst springt beim Fenstergrössenwechsel alles.

## Kapitel A — `biotsavart`, Skript 10.1

Titel: **Biot-Savart: woher die Geschwindigkeit kommt**

### 1 · Das Integral, Beitrag für Beitrag

Kernstück des Kapitels. Ein Laufpunkt wandert über den Wirbelfaden C. Gleichzeitig sichtbar:

- `ds` tangential am Laufpunkt,
- `r = x − s` zum Aufpunkt,
- das von `ds` und `r` aufgespannte Parallelogramm mit `ds × r` senkrecht darauf,
- der Einzelbeitrag `du`,
- der **mitwachsende Summenvektor u**.

Laufpunkt per Slider oder automatisch. Daneben laufen `|r|`, `|ds×r|/|r|³` und die
Zwischensumme als Zahlen mit. Der Aufpunkt ist frei verschiebbar.

### 2 · Fünf Formen zum Umschalten

Gerade Strecke · unendlich lang · halbunendlich · Kreisring · Kreissegment.

Bei jeder Form steht die **analytische Formel neben dem numerischen Integral** — zwei
Zahlen, die übereinstimmen müssen. Damit ist u_ϑ = Γ/(4πr)·(cos θ₁ − cos θ₂) überprüfbar
statt geglaubt. θ₁ und θ₂ werden im Bild eingezeichnet.

### 3 · Die Grenzübergänge

Faden verlängern und zusehen, wie θ₁ → 0 und θ₂ → π laufen und die Zahl gegen Γ/(2πr)
konvergiert. Halbunendlich daneben: der Faktor ½ zwischen beiden Fällen.

### 4 · Das Volumenintegral

Abb. 10.5 als kompaktes Schaubild: verteiltes ω statt Faden, dV-Zellen, dieselbe Struktur
ω × r/|r|³. Ohne eigene Simulation.

### 5 · Rechenlabor: drei Prüfungsaufgaben

Jede in exakter Geometrie als 3D-Szene, Beiträge einzeln zuschaltbar, u/v/w als Zahlen.
Teilaufgabe „Drehrichtung eintragen" wird visuell beantwortet: Helmholtz erzwingt Γ
konstant durch das ganze System, der Auftrieb legt das Vorzeichen fest.

**(a) Gleitschirm.** W1, W2 halbunendlich, W3 Kreissegment in der y-z-Ebene um Q,
R = √2·a, x_Q = (0, −a, 0), x_P = (R, −a, 0).

Parametrisierung s(φ) = x_Q + R(0, sin φ, cos φ), φ von π/4 bis 3π/4. Dann ist
x_P − x_Q = (R, 0, 0) und r = (R, −R sin φ, −R cos φ), also **|r| = √2·R konstant** —
darum ist das Integral geschlossen lösbar:

    ds × r = R² (−1, −sin φ, −cos φ) dφ
    u_W3   = Γ/(8√2 π R) · (−π/2, −√2, 0)
           = ( −Γ/(16√2 R),  −Γ/(8πR),  0 )

mit R = √2·a also u = −Γ/(32a), v = −√2Γ/(16πa), w = 0.

**(b) Tragflügel.** W1, W3 halbunendlich, W2 Kreissegment in der xy-Ebene (z = 0) um Q,
Q = (R√2/2, 0, 0), P = (R√2/2, 0, a). Gleiche Struktur, andere Lage — bewusst beide
drin, weil das Umrechnen zwischen den Achsenlagen die eigentliche Fehlerquelle ist.

**(c) Zwei koaxiale Wirbelringe.** Radien R₁ > R₂, Abstand L, beide Γ. Auf der Achse gilt
u_z = Γ R²/(2(R² + z²)^{3/2}), im Zentrum Γ/(2R). Dazu die Leapfrogging-Animation.

## Kapitel B — `tragfluegel`, Skript 10.4

Titel: **Tragflügel: 2D gegen 3D**

1. **Was die 2D-Theorie behauptet.** Unendlicher Flügel, Kutta-Joukowski
   F_y = −Γ·ϱu∞·b, d'Alembert: Widerstand exakt null. Verweis auf das Joukowski-Kapitel.
2. **Warum das am echten Flügel bricht** (Abb. 10.7). Druckseite unten, Saugseite oben,
   Umströmung der Enden, Stromlinien oben zur Mitte und unten nach aussen abgelenkt,
   Wirbelschicht hinter dem Flügel, Aufrollen zu zwei Nachlaufwirbeln. Spannweiten-Slider:
   b gross → der 3D-Effekt verschwindet, die 2D-Aussage wird wieder gültig.
3. **Hufeisenmodell** (Abb. 10.8). Gebundener Wirbel plus zwei Randwirbel, Γ nach Helmholtz
   konstant. Der Abwind wird per Biot-Savart aus Kapitel A gerechnet:

       w(z) = −Γ/(4π) · b / ((b/2)² − z²),   in der Mitte w(0) = −Γ/(πb)

   An den Spitzen divergiert das — genau deshalb braucht es das verfeinerte Modell.
4. **Traglinie.** Viele differentielle Hufeisen, Γ(z) umschaltbar zwischen rechteckig und
   elliptisch Γ_ell(z) = Γ₀√(1 − (2z/b)²). Bei elliptisch wird der Abwind über die
   Spannweite konstant, w = −Γ₀/(2b), damit α_i konstant und der induzierte Widerstand
   minimal.
5. **Profilschnitt** (Abb. 10.9). u∞ + v → u_eff, Winkel α_i, F_res senkrecht auf u_eff,
   Zerlegung in F_y und F_x. Abwind hochdrehen → F_res kippt → F_x wächst. Kernaussage:
   kein Fliegen ohne induzierten Widerstand.
6. **Die Zahlen.** c_W,ind = c_A²/(πΛ) mit Λ = b²/A, aufgetragen über Λ, mit Markern für
   Segelflugzeug (Λ ≈ 25), Verkehrsflugzeug (Λ ≈ 9), Deltaflügel (Λ ≈ 2).
7. **Tabelle 2D gegen 3D.** Was es wo gibt und was nicht.

## Nachrechnen (`verify.js`)

Nach dem Muster der bestehenden Prüfungen: der Physikblock wird aus der ausgelieferten
Moduldatei herausgeschnitten und ausgeführt. Numerik gegen Analytik:

| Prüfung | Erwartung |
|---|---|
| Gerades Stück | Numerisches Integral = Γ/(4πr)·(cos θ₁ − cos θ₂) |
| Faden verlängert | → Γ/(2πr) |
| Halbunendlich | → Γ/(4πr), also exakt die Hälfte |
| Ring auf der Achse | Γ R²/(2(R²+z²)^{3/2}), im Zentrum Γ/(2R) |
| Kreissegment Gleitschirm | (−Γ/(32a), −√2Γ/(16πa), 0) |
| Kreissegment Tragflügel | analytisch gleiche Struktur, Achsen vertauscht |
| Hufeisen-Abwind | w(0) = −Γ/(πb) |
| Elliptische Verteilung | w über z konstant = −Γ₀/(2b) |
| Beiwerte | c_W,ind = c_A²/(πΛ) und α_i = c_A/(πΛ) |

Erwartete Ausgabe bleibt `ALLE … PRUEFUNGEN BESTANDEN`.

## Bewusst nicht enthalten

- Keine perspektivische Kamera (siehe oben).
- Keine frei formbare Raumkurve C — die fünf Formen des Skripts decken alle Aussagen ab,
  eine freie Kurve hätte keine analytische Gegenprobe.
- Kein Wellenwiderstand und keine kompressiblen Effekte; das gehört zu Kap. 11.

## Offen / Vorbehalt

Die drei Prüfungsaufgaben liegen nur als Angabe vor, ohne Musterlösung. Die Ergebnisse
werden deshalb nach der Konvention der Seite mit ⚠ markiert — sie sind gegen die
analytischen Ausdrücke geprüft, nicht gegen ein offizielles Lösungsblatt.
