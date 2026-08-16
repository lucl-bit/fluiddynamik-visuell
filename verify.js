const fs = require('fs');
const D = '/Users/lucaskoll/Desktop/semester4/fluid/visuell/';
let fail = 0, pass = 0;
function chk(name, got, exp, tol) {
  const ok = tol === undefined ? got === exp : Math.abs(got - exp) <= tol;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}  =  ${typeof got === 'number' ? got.toFixed(4) : got}` +
              (ok ? '' : `   ERWARTET ${exp}`));
  ok ? pass++ : fail++;
}
// Physikblöcke aus den ausgelieferten Moduldateien herausschneiden und ausführen
function slice(file, from, to) {
  const s = fs.readFileSync(D + file, 'utf8');
  const a = s.indexOf(from), b = s.indexOf(to);
  if (a < 0 || b < 0) throw new Error('Block nicht gefunden in ' + file);
  return s.slice(a, b);
}

console.log('=== 1) Syntax aller ausgelieferten Dateien ===');
for (const f of ['js/core.js','js/modules/wirbel.js','js/modules/wirbelstreckung.js',
                 'js/modules/wirbelring.js','js/modules/stoss.js','js/modules/lavalduese.js','js/modules/linien.js','js/modules/potentiallab.js','js/modules/joukowski.js','js/modules/roadmap.js']) {
  new Function(fs.readFileSync(D + f, 'utf8'));   // wirft bei Syntaxfehler
  console.log('  PASS  ' + f); pass++;
}

console.log();
console.log('=== 2) wirbelstreckung.js — Formeln aus der echten Datei ===');
const phys1 = slice('js/modules/wirbelstreckung.js', 'function uField', '/* ---------------- Einstieg');
const mk = new Function('st', phys1 + '; return {uField, Wvec, sigma, kipp};');

// Prüfungsfall FS24 3.3 / HS19 3.6: Element senkrecht zur Scherströmung
let st = { U0: 1.2, S: -1.2, E: 0, phi: Math.PI/2 };
let m = mk(st);
console.log(' Aufgabe 3.3/3.6 (phi=90 Grad, reine Scherung S=-1.2):');
chk('W_x  (parallel zur Stroemung)', m.Wvec()[0], -1.2, 1e-12);
chk('W_y', m.Wvec()[1], 0, 1e-12);
chk('Streckungsrate sigma  -> Aussage (a) FALSCH', m.sigma(), 0, 1e-12);
chk('Kipprate [Grad/s]     -> Aussage (c) RICHTIG', m.kipp()*180/Math.PI, 68.755, 0.01);
const om = [Math.cos(st.phi), Math.sin(st.phi)], u0 = m.uField(0,0);
chk('u . omega             -> Aussage (d) RICHTIG', u0[0]*om[0]+u0[1]*om[1], 0, 1e-12);

// FS25-Variante: Element parallel zur Strömung
st = { U0: 1.2, S: -1.2, E: 0, phi: 0 }; m = mk(st);
console.log(' FS25-Variante (phi=0, Element parallel zu u):');
chk('|W|  -> weder Streckung noch Kippen', Math.hypot(m.Wvec()[0], m.Wvec()[1]), 0, 1e-12);
chk('u . omega  != 0 (u parallel omega)', m.uField(0,0)[0]*1, 1.2, 1e-12);

// reine Streckung / schräg
st = { U0: 1.2, S: 0, E: 0.8, phi: 0 }; m = mk(st);
console.log(' Reine Dehnung (phi=0, E=0.8):');
chk('Streckungsrate = E', m.sigma(), 0.8, 1e-12);
chk('Kipprate = 0', m.kipp(), 0, 1e-12);
st = { U0: 1.2, S: -1.2, E: 0, phi: Math.PI/4 }; m = mk(st);
console.log(' Schraeg (phi=45 Grad, S=-1.2)  -> analytisch: sigma=S/2, kipp=-S/2:');
chk('Streckungsrate = S/2', m.sigma(), -0.6, 1e-12);
chk('Kipprate [rad/s] = -S/2', m.kipp(), 0.6, 1e-12);

console.log();
console.log('=== 3) wirbelring.js — Biot-Savart aus der echten Datei ===');
const phys2 = slice('js/modules/wirbelring.js', 'function induced', '/* ---------------- Einstieg');
const R = new Function('GAMMA', phys2 + '; return {induced, step};');
const GAMMA = 4*Math.PI;
const V = R(GAMMA);
function run(init, T, dt, wall) { const r = init(); const N = Math.round(T/dt);
  for (let i=0;i<N;i++) V.step(r, dt, wall); return r; }

const A = () => [{x:-0.9,y:2.5,G:-GAMMA},{x:0.9,y:2.5,G:GAMMA}];
console.log(' Fall 3.4 — Ring senkrecht auf die Wand zu:');
let f0 = run(A, 1.2, 0.0002, false), w0 = run(A, 1.2, 0.0002, true);
chk('OHNE Wand: Radius bleibt', (f0[1].x-f0[0].x)/2, 0.9, 1e-6);
chk('MIT  Wand: Radius waechst  -> (c) RICHTIG', (w0[1].x-w0[0].x)/2, 1.031, 0.01);
chk('OHNE Wand: Abstand nach t=1.2', (f0[0].y+f0[1].y)/2, 1.167, 0.01);
chk('MIT  Wand: Abstand groesser -> langsamer -> (a) RICHTIG', (w0[0].y+w0[1].y)/2, 1.484, 0.01);
chk('MIT  Wand: kein Kippen (Symmetrie) -> (b) FALSCH', w0[0].y - w0[1].y, 0, 1e-9);

const B = () => [{x:-1.4,y:2.1,G:GAMMA},{x:-1.4,y:1.1,G:-GAMMA}];
console.log(' Fall 3.5 — Ring parallel zur Wand:');
let f1 = run(B, 1.0, 0.0002, false), w1 = run(B, 1.0, 0.0002, true);
const tilt = v => Math.atan2(v[0].x-v[1].x, v[0].y-v[1].y)*180/Math.PI;
const dia  = v => Math.hypot(v[0].x-v[1].x, v[0].y-v[1].y);
chk('OHNE Wand: kein Kippen', tilt(f1), 0, 1e-9);
chk('MIT  Wand: kippt          -> (b) RICHTIG', tilt(w1), 8.5, 0.2);
chk('OHNE Wand: Weg nach t=1', (f1[0].x+f1[1].x)/2 + 1.4, 2.0, 0.01);
chk('MIT  Wand: kuerzerer Weg  -> (a) RICHTIG', (w1[0].x+w1[1].x)/2 + 1.4, 1.757, 0.01);
chk('MIT  Wand: Durchmesser ~konstant -> (c) FALSCH', dia(w1), 1.0, 0.02);
chk('MIT  Wand: naehert sich der Wand', (w1[0].y+w1[1].y)/2, 1.475, 0.01);

console.log();
console.log('=== 4) Freier Ring: Eigengeschwindigkeit muss exakt Gamma/(4 pi R) = 1/R sein ===');
const r0 = A(); const v0 = V.induced(r0[0].x, r0[0].y, r0, 0);
chk('|v| bei R=0.9  ->  1/0.9', Math.abs(v0[1]), 1/0.9, 1e-9);

console.log();
console.log('=== 5) Einbindung in index.html ===');
const html = fs.readFileSync(D + 'index.html', 'utf8');
for (const f of ['wirbel.js','wirbelstreckung.js','wirbelring.js','stoss.js','roadmap.js'])
  chk('script-Tag ' + f, html.includes('js/modules/' + f), true);

console.log();
console.log('=== 6) lavalduese.js — Duesenstroemung aus der echten Datei ===');
const phys3 = slice('js/modules/lavalduese.js', 'function pIso', '/* ================= Die Regel');
const L = new Function('GAM', phys3 +
  '; return {pIso, areaRatio, MaFromArea, solveNozzle, AofX, AE, MA_E_SUP, MA_E_SUB, P_E, P_B, P_D, XT, shockMa2, jetOffset};');
const N = L(1.4);
console.log(' Isentrope Tafelwerte bei A/A* = 2.0 (gamma = 1.4):');
chk('A_e/A_hals der Geometrie', N.AE, 2.0, 1e-9);
chk('Ma_e Ueberschall  (Tafel 2.1972)', N.MA_E_SUP, 2.1972, 1e-3);
chk('Ma_e Unterschall  (Tafel 0.3059)', N.MA_E_SUB, 0.3059, 1e-3);
chk('p_E/p0 angepasst  (Tafel 0.0939)', N.P_E, 0.09387, 1e-4);
chk('p_B/p0 gesperrt   (Tafel 0.9372)', N.P_B, 0.93717, 1e-4);
chk('A/A*(Ma=1) = 1', N.areaRatio(1), 1.0, 1e-9);
chk('MaFromArea rueckwaerts konsistent', N.areaRatio(N.MA_E_SUP), 2.0, 1e-6);

console.log(' p_D: senkrechter Stoss genau am Austritt:');
// unabhaengig nachgerechnet: p2/p1 = 2g/(g+1) Ma^2 - (g-1)/(g+1)
const g=1.4, Me=N.MA_E_SUP;
const pJump = 2*g/(g+1)*Me*Me - (g-1)/(g+1);
chk('p_D/p0 = p_E/p0 * (p2/p1)', N.P_D, N.P_E*pJump, 1e-9);
chk('Reihenfolge p_E < p_D < p_B', (N.P_E < N.P_D && N.P_D < N.P_B), true);

console.log(' Fallunterscheidung ueber den ganzen Gegendruckbereich:');
const cases = [
  [0.97,  'venturi', 'A  Unterschall, nicht gesperrt'],
  [0.80,  'shock',   'C  Stoss im divergenten Teil'],
  [0.55,  'shock',   'C  Stoss weiter stromab'],
  [0.30,  'over',    'D-E ueberexpandiert'],
  [N.P_E, 'design',  'E  angepasst'],
  [0.04,  'under',   'F  unterexpandiert']];
for (const [pa, mode, txt] of cases) chk('pa/p0=' + pa.toFixed(3) + '  -> ' + txt, N.solveNozzle(pa).mode, mode);

console.log(' Stossposition wandert mit steigendem Gegendruck Richtung Hals:');
const xs = [0.52, 0.70, 0.90].map(pa => N.solveNozzle(pa).xs);
chk('xs monoton fallend bei steigendem pa', (xs[0] > xs[1] && xs[1] > xs[2]), true);
chk('Stoss immer im divergenten Teil (x > x_Hals)', xs.every(v => v > N.XT), true);
chk('Stoss nahe Austritt bei pa knapp ueber p_D', N.solveNozzle(N.P_D*1.004).xs, 1.0, 0.05);
console.log('   (Stosslagen: ' + xs.map(v=>v.toFixed(3)).join(', ') + ')');

console.log(' Randbedingung: Druck am Austritt trifft den Gegendruck:');
for (const pa of [0.60, 0.75, 0.88]) {
  const s = N.solveNozzle(pa);
  chk('pa=' + pa + ' -> p(x=1) = pa', s.p(1), pa, 2e-3);
}
console.log(' Sperrung:');
chk('gesperrt bei pa < p_B', N.solveNozzle(N.P_B*0.99).choked, true);
chk('nicht gesperrt bei pa > p_B', N.solveNozzle(N.P_B*1.02).choked, false);
chk('mdot maximal und konstant ab Sperrung', N.solveNozzle(0.30).mdot, N.solveNozzle(0.04).mdot, 1e-12);
chk('mdot kleiner ohne Sperrung', N.solveNozzle(0.97).mdot < 1, true);
chk('mdot -> 1 wenn Sperrung gerade erreicht', N.solveNozzle(N.P_B*1.0001).mdot, 1.0, 2e-3);
chk('mdot -> 0 wenn pa -> p0 (Grenzwert)', N.solveNozzle(0.9999999).mdot, 0, 0.01);
chk('mdot ~ sqrt(dp): Faktor 10 in dp -> Faktor ~3.16', 
    N.solveNozzle(0.99).mdot / N.solveNozzle(0.999).mdot, 3.16, 0.06);
chk('mdot monoton mit fallendem pa', N.solveNozzle(0.99).mdot < N.solveNozzle(0.95).mdot, true);
console.log(' Hals:');
chk('Ma im Hals = 1 wenn gesperrt', N.solveNozzle(0.30).Ma(N.XT), 1.0, 1e-3);
chk('T*/T0 = 2/(gamma+1)', 2/(g+1), 0.8333, 1e-4);

console.log(' Freistrahl — Vorzeichen der ersten Auslenkung (der Kern der Aufgabe):');
// ratio = p_a/p_e ;  s = Lauflaenge in Rautenlaengen
chk('UEBERexpandiert (pa>pe): Grenze zuerst nach INNEN', N.jetOffset(1.8, 0.15) < 0, true);
chk('UNTERexpandiert (pa<pe): Grenze zuerst nach AUSSEN', N.jetOffset(0.55, 0.15) > 0, true);
chk('angepasst (pa=pe): keine Auslenkung', N.jetOffset(1.0, 0.15), 0, 1e-12);
chk('an der Lippe selbst noch null', N.jetOffset(1.8, 0), 0, 1e-12);
chk('Vorzeichenwechsel nach einer halben Raute (Rautenmuster)',
    N.jetOffset(1.8, 0.5) * N.jetOffset(1.8, 1.5) < 0, true);
chk('staerkeres Druckverhaeltnis -> groessere Auslenkung',
    Math.abs(N.jetOffset(2.4, 0.5)) > Math.abs(N.jetOffset(1.3, 0.5)), true);
chk('Muster klingt stromab ab',
    Math.abs(N.jetOffset(1.8, 4.5)) < Math.abs(N.jetOffset(1.8, 0.5)), true);

console.log(' Preset-Knoepfe treffen ihren Fall (inkl. Rundung auf die Slider-Schrittweite):');
const snap = v => Math.round(v/0.0005)*0.0005;
[['A Unterschall', (1+N.P_B)/2, 'venturi'],
 ['B gerade gesperrt', N.P_B+0.0006, 'venturi'],
 ['C Stoss in der Duese', (N.P_B+N.P_D)/2, 'shock'],
 ['D Stoss am Duesenende', N.P_D+0.0008, 'shock'],
 ['ueberexpandiert', (N.P_D+N.P_E)/2, 'over'],
 ['E angepasst', N.P_E, 'design'],
 ['F unterexpandiert', N.P_E*0.45, 'under']
].forEach(([n, v, mode]) => chk(n, N.solveNozzle(snap(v)).mode, mode));
chk('Knopf D setzt den Stoss ans Duesenende', N.solveNozzle(snap(N.P_D+0.0008)).xs, 1.0, 0.02);

console.log();
console.log('=== 7) linien.js — Strom-, Bahn- und Streichlinie aus der echten Datei ===');
const phys4 = slice('js/modules/linien.js', 'function vel', '/* ---------------- Zustand der vier Linien');
const mkL = st => new Function('st', phys4 + '; return {vel, advect};')(st);

function lines(stationary) {
  const st = {t:0, A:0.55, T:3.2, U0:0.85, shear:0.30, stationary};
  const L = mkL(st);
  const P = [-2.3, 0.0], dt = 0.002, tEnd = 3.0;

  // Bahnlinie: EIN Teilchen, gestartet bei tau=0
  let p = P.slice(), path = [];
  for (let t = 0; t < tEnd; t += dt) { p = L.advect(p, t, dt); path.push(p.slice()); }

  // Streichlinie zur Zeit tEnd: Teilchen, die zu tau in [0,tEnd] gestartet sind
  const streak = [];
  for (let tau = 0; tau <= tEnd; tau += 0.05) {
    let q = P.slice();
    for (let t = tau; t < tEnd; t += dt) q = L.advect(q, t, dt);
    streak.push(q.slice());
  }

  // Stromlinie zur Zeit tEnd: Zeit eingefroren, raeumlich integriert
  let r = P.slice(); const stream = [];
  for (let n = 0; n < 1500; n++) { r = L.advect(r, tEnd, dt); stream.push(r.slice()); }
  return {path, streak, stream};
}

// y-Wert einer Kurve an einer festen x-Stelle
function yAt(curve, x) {
  for (let i = 1; i < curve.length; i++) {
    const a = curve[i-1], b = curve[i];
    if ((a[0]-x)*(b[0]-x) <= 0 && a[0] !== b[0])
      return a[1] + (b[1]-a[1]) * (x-a[0])/(b[0]-a[0]);
  }
  return null;
}

const X_TEST = -1.0;
const ins = lines(false), sta = lines(true);
const yi = { bahn: yAt(ins.path, X_TEST), streich: yAt(ins.streak, X_TEST), strom: yAt(ins.stream, X_TEST) };
const ys = { bahn: yAt(sta.path, X_TEST), streich: yAt(sta.streak, X_TEST), strom: yAt(sta.stream, X_TEST) };

console.log(' instationaer, gemessen bei x = ' + X_TEST + ':');
console.log('   Bahnlinie y=' + yi.bahn.toFixed(4) + '  Streichlinie y=' + yi.streich.toFixed(4) +
            '  Stromlinie y=' + yi.strom.toFixed(4));
chk('Bahnlinie != Streichlinie', Math.abs(yi.bahn - yi.streich) > 0.02, true);
chk('Bahnlinie != Stromlinie', Math.abs(yi.bahn - yi.strom) > 0.02, true);
chk('Streichlinie != Stromlinie', Math.abs(yi.streich - yi.strom) > 0.02, true);

console.log(' stationaer (A wird ignoriert), gemessen bei x = ' + X_TEST + ':');
console.log('   Bahnlinie y=' + ys.bahn.toFixed(4) + '  Streichlinie y=' + ys.streich.toFixed(4) +
            '  Stromlinie y=' + ys.strom.toFixed(4));
chk('Bahnlinie = Streichlinie', ys.bahn, ys.streich, 1e-6);
chk('Bahnlinie = Stromlinie', ys.bahn, ys.strom, 1e-6);
chk('alle drei auf der Sondenhoehe y = 0', ys.strom, 0, 1e-9);

console.log(' Feldeigenschaften:');
const L0 = mkL({t:0, A:0.55, T:3.2, U0:0.85, shear:0.30, stationary:false});
const eps = 1e-5, t0 = 0.7;
const dudx = (L0.vel(eps,0,t0)[0] - L0.vel(-eps,0,t0)[0])/(2*eps);
const dvdy = (L0.vel(0,eps,t0)[1] - L0.vel(0,-eps,t0)[1])/(2*eps);
chk('div u = 0 (inkompressibel)', dudx + dvdy, 0, 1e-9);
chk('v ist raeumlich konstant', L0.vel(-2,1,t0)[1], L0.vel(2,-1,t0)[1], 1e-12);
chk('u waechst mit y (Scherung)', L0.vel(0,1,t0)[0] > L0.vel(0,-1,t0)[0], true);
chk('v oszilliert: v(t=0) = 0', L0.vel(0,0,0)[1], 0, 1e-12);
chk('v(t=T/4) = A', L0.vel(0,0,3.2/4)[1], 0.55, 1e-9);

console.log();
console.log('=== 8) Eingebettete Labs ===');
for (const f of ['labs/potentialstroemung.html','labs/joukowski.html'])
  chk('Datei vorhanden: ' + f, fs.existsSync(D + f), true);
const jouk = fs.readFileSync(D + 'labs/joukowski.html','utf8');
chk('joukowski: Kreis laeuft durch +a (Standardkonstruktion)',
    /Math\.sqrt\(\(a - cx\) \* \(a - cx\) \+ cy \* cy\)/.test(jouk), true);
// Geometrie mit den Voreinstellungen des Widgets
const jA=0.8, jCx=-0.12, jCy=0.06, jR=Math.hypot(jA-jCx,jCy);
chk('  +a liegt auf dem Kreis', Math.hypot(jA-jCx,jCy), jR, 1e-12);
chk('  -a liegt im Innern', Math.hypot(jCx+jA,jCy) < jR, true);
chk('  Statusanzeige meldet "Profil"', jR > (jA-jCx)-0.002, true);
chk('  Grenzfall cx=cy=0 -> R=a (flache Platte)', Math.hypot(jA-0,0), jA, 1e-12);
for (const f of ['potentiallab','joukowski'])
  chk('Modul ' + f + '.js eingebunden', fs.readFileSync(D+'index.html','utf8').includes(f+'.js'), true);
const pl = fs.readFileSync(D+'js/modules/potentiallab.js','utf8');
chk('potentiallab verweist auf das kopierte Lab',
    pl.includes("labs/potentialstroemung.html"), true);

console.log();
console.log(fail === 0 ? `ALLE ${pass} PRUEFUNGEN BESTANDEN` : `${fail} FEHLGESCHLAGEN, ${pass} bestanden`);
process.exit(fail === 0 ? 0 : 1);
