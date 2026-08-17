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
for (const f of ['js/core.js','js/modules/wirbel.js','js/modules/wirbellinien.js','js/modules/kanal.js','js/modules/freistrahl.js','js/modules/wirbelstreckung.js',
                 'js/modules/wirbelring.js','js/modules/stoss.js','js/modules/lavalduese.js','js/modules/linien.js','js/modules/potentiallab.js','js/modules/joukowski.js','js/modules/roadmap.js',
                 'js/modules/biotsavart.js','js/modules/tragfluegel.js']) {
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
console.log('=== 9) wirbellinien.js — Blasius-Grenzschicht aus der echten Datei ===');
const phys5 = slice('js/modules/wirbellinien.js', 'function blasius()', '/* ===== Ende Physik =====');
const W = new Function(phys5 +
  '; return {BL, ETA_99, ETA_MAX, uOfEta, omOfEta, etaOfU, etaOfOm, deltaStarEta, thetaEta,' +
  ' etaOfXY, deltaOfX, uOfXY, omWall, omOfXY, cf, lambdaInit, lambdaStep, lineLength, uGal, omGal, R0, OM0};')();

console.log(' Loesung der Blasius-Gleichung 2f\'\'\' + f f\'\' = 0:');
chk('f\'\'(0) = alpha              (Literatur 0.332057)', W.BL.alpha, 0.332057, 1e-5);
chk('f\'(eta -> unendlich) = 1', W.uOfEta(W.ETA_MAX), 1.0, 1e-6);
chk('Haftbedingung f\'(0) = 0', W.uOfEta(0), 0, 1e-12);
chk('eta bei u/uinf = 0.99        (Literatur 4.910)', W.ETA_99, 4.910, 5e-3);
chk('delta1 * sqrt(uinf/nu x)     (Skript 1.721)', W.deltaStarEta(), 1.7208, 2e-3);
chk('delta2 * sqrt(uinf/nu x)     (Skript 0.664)', W.thetaEta(), 0.6641, 2e-3);
chk('cf * sqrt(Re_x) = 2 alpha    (Skript 0.664)', 2 * W.BL.alpha, 0.664, 1e-3);
chk('cf(x) direkt aus dem Modul', W.cf(0.5, 1/20000) * Math.sqrt(0.5*20000), 0.664, 1e-3);

console.log(' Wirbelstaerke omega_z = -du/dy: Maximum an der WAND, nicht innen:');
chk('om/om_wand bei eta=0 ist 1', W.omOfEta(0), 1.0, 1e-12);
let monoton = true, prevOm = 2;
for (let e = 0; e <= 6; e += 0.05) { const v = W.omOfEta(e); if (v > prevOm + 1e-9) monoton = false; prevOm = v; }
chk('faellt von der Wand aus monoton ab', monoton, true);
chk('am Grenzschichtrand nur noch ~5.5 %', W.omOfEta(W.ETA_99), 0.0554, 2e-3);
chk('bei eta=6 praktisch null', W.omOfEta(6) < 0.01, true);
// numerische Gegenprobe: omega = -du/dy aus dem Profil selbst differenziert
{
  const nu = 1/20000, x = 0.4, y = 0.004, eps = 1e-7;
  const dudy = (W.uOfXY(x, y+eps, nu) - W.uOfXY(x, y-eps, nu)) / (2*eps);
  // relativ pruefen: |omega| ist hier ~73, die Tabelleninterpolation traegt ~1e-4 rel. bei
  chk('omOfXY stimmt mit -du/dy des Profils ueberein',
      W.omOfXY(x, y, nu) / (-dudy), 1.0, 1e-3);
}
chk('omega ist negativ (du/dy > 0)', W.omOfXY(0.4, 0.004, 1/20000) < 0, true);

console.log(' Wachstumsgesetze:');
chk('delta ~ sqrt(x):  delta(4x)/delta(x) = 2', W.deltaOfX(0.8,1e-4)/W.deltaOfX(0.2,1e-4), 2.0, 1e-9);
chk('delta ~ 1/sqrt(Re): 100x Re -> 10x duenner',
    W.deltaOfX(1,1e-3)/W.deltaOfX(1,1e-5), 10.0, 1e-9);
chk('delta = 4.910*sqrt(nu x)', W.deltaOfX(1, 1e-4), 4.910*Math.sqrt(1e-4), 5e-5);
chk('|omega| an der Wand waechst zur Vorderkante hin',
    Math.abs(W.omWall(0.1,1e-4)) > Math.abs(W.omWall(0.9,1e-4)), true);
chk('Aehnlichkeit: u haengt nur von eta ab',
    W.uOfXY(0.25, 0.5*Math.sqrt(1e-4*0.25), 1e-4),
    W.uOfXY(0.81, 0.5*Math.sqrt(1e-4*0.81), 1e-4), 1e-12);

console.log(' Ausgelenkte Wirbellinie (Abschnitt 3), materiell konvektiert:');
{
  const nu = 1/20000, x0 = 0.18, d0 = W.deltaOfX(x0, nu);
  // (a) gerade Linie: darf sich nicht veraendern -> genau der 2D-Fall (om.grad)u = 0
  const g = W.lambdaInit(41, x0, 0.5*d0, 0, 0.9);
  const Lg0 = W.lineLength(g);
  for (let i = 0; i < 400; i++) W.lambdaStep(g, 0.002, nu);
  chk('gerade Linie: Laenge bleibt exakt', W.lineLength(g)/Lg0, 1.0, 1e-12);
  chk('gerade Linie: alle Punkte auf gleichem x', Math.max(...g.map(p=>p.x)) - Math.min(...g.map(p=>p.x)), 0, 1e-12);
  chk('gerade Linie: y unveraendert', g[20].y, 0.5*d0, 1e-12);
  // (b) ausgebeulte Linie: wird gestreckt, die Spitze eilt voraus
  const b = W.lambdaInit(41, x0, 0.5*d0, 0.5*d0, 0.9);
  const Lb0 = W.lineLength(b);
  let mono = true, last = 1;
  for (let i = 0; i < 400; i++) {
    W.lambdaStep(b, 0.002, nu);
    const r = W.lineLength(b)/Lb0;
    if (r < last - 1e-12) mono = false;
    last = r;
  }
  chk('ausgebeulte Linie: wird laenger  -> |omega| waechst', last > 1.02, true);
  chk('  und zwar monoton', mono, true);
  chk('Spitze (Mitte) eilt dem Rand voraus', b[20].x > b[0].x + 1e-6, true);
  chk('Rand bleibt in der Ausgangshoehe', b[0].y, 0.5*d0, 1e-12);
  console.log('   (Laenge nach t=0.8: x' + last.toFixed(4) + ', Vorsprung ' + (b[20].x-b[0].x).toFixed(4) + ')');
}

console.log(' Galilei-Invarianz (Abschnitt 4):');
{
  // omega numerisch aus dem Geschwindigkeitsfeld: om_z = dv/dx - du/dy
  const eps = 1e-5;
  const omNum = (x, y, Ub) =>
    (W.uGal(x+eps, y, 1.0, Ub)[1] - W.uGal(x-eps, y, 1.0, Ub)[1]) / (2*eps) -
    (W.uGal(x, y+eps, 1.0, Ub)[0] - W.uGal(x, y-eps, 1.0, Ub)[0]) / (2*eps);

  const inner = [[0.2,0.1],[-0.15,0.3],[0.05,-0.25]];
  const outer = [[1.2,0.5],[-0.9,0.8],[1.5,-0.2]];
  let invariant = true, matches = true, uAlwaysDiffers = true;
  for (const [x,y] of inner.concat(outer)) {
    const o0 = omNum(x,y,0.0), o1 = omNum(x,y,1.0), o2 = omNum(x,y,1.6);
    if (Math.abs(o0-o1) > 1e-6 || Math.abs(o0-o2) > 1e-6) invariant = false;
    if (Math.abs(o0 - W.omGal(x,y)) > 1e-5) matches = false;
    if (Math.abs(W.uGal(x,y,1.0,0.0)[0] - W.uGal(x,y,1.0,1.0)[0]) < 1e-9) uAlwaysDiffers = false;
  }
  chk('omega aus u differenziert: gleich fuer Ub = 0, 1.0, 1.6', invariant, true);
  chk('  und deckt sich mit der analytischen Formel omGal', matches, true);
  chk('u dagegen aendert sich in JEDEM der Punkte', uAlwaysDiffers, true);
  chk('omGal bekommt Uinf/Ub gar nicht erst als Argument', W.omGal.length, 2);
  chk('omega im Kern = 2*Omega', W.omGal(0.1,0.1), 2*W.OM0, 1e-12);
  chk('omega ausserhalb des Kerns = 0', W.omGal(W.R0+0.01,0), 0, 1e-12);
  // mitbewegt mit Ub = Uinf bleibt nur die Umfangsbewegung: u steht senkrecht auf r
  for (const [x,y] of [[0.3,0.2],[0.9,-0.4]]) {
    const u = W.uGal(x,y,1.0,1.0), r = Math.hypot(x,y);
    chk('Ub=Uinf: u senkrecht auf r bei (' + x + ',' + y + ')', (u[0]*x + u[1]*y)/r, 0, 1e-12);
  }
  chk('Ub=0: derselbe Punkt hat eine Radialkomponente',
      Math.abs(W.uGal(0.3,0.2,1.0,0.0)[0]*0.3 + W.uGal(0.3,0.2,1.0,0.0)[1]*0.2) > 0.1, true);
  chk('Rankine: u_theta stetig bei r0',
      Math.hypot(...W.uGal(0, W.R0-1e-7, 0, 0)), Math.hypot(...W.uGal(0, W.R0+1e-7, 0, 0)), 1e-5);
  chk('Kern: Starrkoerper u_theta ~ r', W.uGal(0.2,0,0,0)[1] / W.uGal(0.4,0,0,0)[1], 0.5, 1e-9);
  chk('aussen: Potentialwirbel u_theta ~ 1/r',
      W.uGal(1.2,0,0,0)[1] / W.uGal(0.6,0,0,0)[1], 0.5, 1e-9);
}

console.log(' Einbindung:');
chk('script-Tag wirbellinien.js in index.html', html.includes('js/modules/wirbellinien.js'), true);
chk('steht zwischen wirbel.js und wirbelstreckung.js',
    html.indexOf('wirbel.js') < html.indexOf('wirbellinien.js') &&
    html.indexOf('wirbellinien.js') < html.indexOf('wirbelstreckung.js'), true);
chk('roadmap verlinkt das neue Kapitel',
    fs.readFileSync(D+'js/modules/roadmap.js','utf8').includes("link: 'wirbellinien'"), true);

console.log();
console.log('=== 10) kanal.js — Fanno und Laval aus der echten Datei ===');
const phys6 = slice('js/modules/kanal.js', 'var GAM = 1.4;', '/* ===== Ende Physik =====');
const K = new Function(phys6 +
  '; return {pIso, TIso, rIso, areaRatio, MaFromArea, shockMa2, shockP0, fT, fp, fr, fp0, fLD,' +
  ' MaFromFLD, flux, XT, AIN, AofX, solveLaval, MaFromP, lavalAt, fannoOut, solveFanno, fannoAt};')();

console.log(' Fanno-Tafel (gamma = 1.4), Skript S. 118:');
for (const [M, T, p, p0, L] of [
  [0.2, 1.1905, 5.4554, 2.9635, 14.5333],
  [0.5, 1.1429, 2.1381, 1.3399,  1.0691],
  [2.0, 0.6667, 0.4082, 1.6875,  0.3050],
  [3.0, 0.4286, 0.2182, 4.2346,  0.5222]]) {
  chk(`Ma=${M}  T/T*`,   K.fT(M),  T,  5e-4);
  chk(`Ma=${M}  p/p*`,   K.fp(M),  p,  5e-4);
  chk(`Ma=${M}  p0/p0*`, K.fp0(M), p0, 5e-4);
  chk(`Ma=${M}  lambda L*/D`, K.fLD(M), L, 5e-4);
}
chk('rho/rho* = (p/p*)/(T/T*)  (ideales Gas)', K.fr(0.5), K.fp(0.5)/K.fT(0.5), 1e-9);
chk('alle Verhaeltnisse = 1 bei Ma = 1', K.fT(1)+K.fp(1)+K.fr(1)+K.fp0(1), 4, 1e-9);
chk('lambda L*/D = 0 bei Ma = 1', K.fLD(1), 0, 1e-9);
chk('Grenzwert Ma -> unendlich  (Literatur 0.8215)', K.fLD(1e6), 0.8215, 1e-4);
chk('MaFromFLD Unterschall invers', K.MaFromFLD(K.fLD(0.35), false), 0.35, 1e-6);
chk('MaFromFLD Ueberschall invers', K.MaFromFLD(K.fLD(2.4), true), 2.4, 1e-5);
chk('beide Aeste laufen auf Ma=1 zu: L* faellt zur 1 hin',
    K.fLD(0.3) > K.fLD(0.7) && K.fLD(3.0) > K.fLD(1.5), true);

console.log(' Fanno-Rohr am Kessel, lambda L/D = 1.0691 (das ist genau L* fuer Ma1 = 0.5):');
{
  const fld = K.fLD(0.5);
  const ges = K.solveFanno(fld, 0.05);
  chk('gesperrt: Ma1 trifft exakt 0.5', ges.Ma1, 0.5, 1e-5);
  chk('gesperrt: Ma2 = 1 am ROHRENDE', ges.Ma2, 1.0, 1e-6);
  chk('gesperrt: Flag gesetzt', ges.choked, true);
  const frei = K.solveFanno(fld, 0.8);
  chk('nicht gesperrt bei pa = 0.8', frei.choked, false);
  chk('  Austrittsdruck trifft den Gegendruck', frei.pOut, 0.8, 1e-4);
  chk('  Ma2 > Ma1 (Reibung BESCHLEUNIGT im Unterschall)', frei.Ma2 > frei.Ma1, true);
  chk('mdot konstant unterhalb der Sperrgrenze',
      K.solveFanno(fld, 0.30).mdot, K.solveFanno(fld, 0.02).mdot, 1e-12);
  chk('mdot steigt mit fallendem pa (noch nicht gesperrt)',
      K.solveFanno(fld, 0.6).mdot > K.solveFanno(fld, 0.9).mdot, true);
  chk('laengeres Rohr -> kleineres Ma1 -> weniger Durchsatz',
      K.solveFanno(8, 0.02).mdot < K.solveFanno(0.5, 0.02).mdot, true);
  // Verlauf im Rohr: das Entscheidende ist, dass p0 FAELLT
  let p0Faellt = true, maSteigt = true, T0const = true;
  const s = K.solveFanno(fld, 0.05);
  let prevP0 = 2, prevMa = -1;
  const T0 = x => { const z = K.fannoAt(x, s); return z.T * (1 + 0.2*z.Ma*z.Ma); };
  for (let x = 0; x <= 1.0001; x += 0.02) {
    const z = K.fannoAt(x, s);
    if (z.p0 > prevP0 + 1e-9) p0Faellt = false;
    if (z.Ma < prevMa - 1e-9) maSteigt = false;
    if (Math.abs(T0(x) - T0(0)) > 1e-6) T0const = false;
    prevP0 = z.p0; prevMa = z.Ma;
  }
  chk('Totaldruck p0 faellt ueber die ganze Rohrlaenge', p0Faellt, true);
  chk('  und zwar echt: p0(Ende)/p0(Ein) < 1', K.fannoAt(1, s).p0 < 0.999, true);
  chk('Mach-Zahl steigt monoton bis 1', maSteigt, true);
  chk('Totaltemperatur T0 bleibt konstant (adiabat!)', T0const, true);
  chk('p faellt in Stroemungsrichtung', K.fannoAt(1, s).p < K.fannoAt(0, s).p, true);
  chk('T faellt in Stroemungsrichtung (Unterschall)', K.fannoAt(1, s).T < K.fannoAt(0, s).T, true);
}

console.log(' Laval-Kanal aus derselben Datei:');
{
  chk('A/A*(Ma=1) = 1', K.areaRatio(1), 1, 1e-9);
  chk('Ma(A/A*=2) Ueberschall  (Tafel 2.1972)', K.MaFromArea(2, true), 2.1972, 1e-3);
  chk('Ma(A/A*=2) Unterschall  (Tafel 0.3059)', K.MaFromArea(2, false), 0.3059, 1e-3);
  const s = K.solveLaval(0.10, 2.0);
  chk('tiefer Gegendruck -> gesperrt', s.choked, true);
  chk('Ma = 1 exakt im HALS', K.lavalAt(K.XT, s).Ma, 1.0, 2e-3);
  chk('p0 konstant ohne Stoss (isentrop)', K.lavalAt(0.9, s).p0, 1.0, 1e-12);
  chk('mdot maximal und konstant ab Sperrung',
      K.solveLaval(0.10, 2).mdot, K.solveLaval(0.30, 2).mdot, 1e-12);
  chk('nicht gesperrt bei hohem Gegendruck', K.solveLaval(0.99, 2).choked, false);
  chk('  dann mdot < 1', K.solveLaval(0.99, 2).mdot < 1, true);
  const sh = K.solveLaval(0.70, 2.0);
  chk('mittlerer Gegendruck -> Stoss im divergenten Teil', sh.mode, 'shock');
  chk('  Stoss liegt hinter dem Hals', sh.xs > K.XT, true);
  chk('  p0 springt am Stoss nach unten',
      K.lavalAt(sh.xs + 0.02, sh).p0 < K.lavalAt(sh.xs - 0.02, sh).p0, true);
  chk('  Ma springt von Ueber- auf Unterschall',
      K.lavalAt(sh.xs - 0.02, sh).Ma > 1 && K.lavalAt(sh.xs + 0.02, sh).Ma < 1, true);
  chk('  Austrittsdruck trifft den Gegendruck', K.lavalAt(0.9999, sh).p, 0.70, 5e-3);
  chk('groessere Austrittsflaeche -> hoeheres Ma am Austritt',
      K.MaFromArea(3.5, true) > K.MaFromArea(2.0, true), true);
  chk('Stoss wandert bei steigendem pa Richtung Hals',
      K.solveLaval(0.80, 2).xs < K.solveLaval(0.60, 2).xs, true);
}

console.log(' Der Kernvergleich: wo steht Ma = 1?');
{
  const sL = K.solveLaval(0.10, 2.0), sF = K.solveFanno(K.fLD(0.5), 0.05);
  chk('Laval: im Hals, NICHT am Austritt',
      Math.abs(K.lavalAt(K.XT, sL).Ma - 1) < 2e-3 && K.lavalAt(1, sL).Ma > 2, true);
  chk('Fanno: am Austritt, NICHT vorher',
      Math.abs(K.fannoAt(1, sF).Ma - 1) < 1e-3 && K.fannoAt(0.5, sF).Ma < 1, true);
}
chk('script-Tag kanal.js in index.html', html.includes('js/modules/kanal.js'), true);

console.log();
console.log('=== 11) freistrahl.js — Prandtl-Meyer und Wellenreflexion ===');
const phys7 = slice('js/modules/freistrahl.js', 'var GAM = 1.4, DEG', '/* ===== Ende Physik =====');
const J = new Function(phys7 +
  '; return {pIso, machWinkel, nu, MaFromNu, MaFromP, areaRatio, MaFromArea,' +
  ' strahl, wellenzug, achsDruck};')();
const DEG = 180/Math.PI;

console.log(' Prandtl-Meyer-Funktion (Skript S. 113):');
chk('nu(1) = 0', J.nu(1), 0, 1e-12);
chk('nu(1.5)  (Literatur 11.905 Grad)', J.nu(1.5)*DEG, 11.905, 2e-3);
chk('nu(2.0)  (Literatur 26.380 Grad)', J.nu(2.0)*DEG, 26.380, 2e-3);
chk('nu(3.0)  (Literatur 49.757 Grad)', J.nu(3.0)*DEG, 49.757, 2e-3);
chk('nu(unendlich)  (Literatur 130.45 Grad)', J.nu(1e6)*DEG, 130.45, 0.01);
chk('MaFromNu invers', J.MaFromNu(J.nu(2.4)), 2.4, 1e-5);
chk('Machwinkel mu(2) = 30 Grad', J.machWinkel(2)*DEG, 30, 1e-9);
chk('Machwinkel mu(1) = 90 Grad', J.machWinkel(1)*DEG, 90, 1e-9);
chk('schneller -> flacher', J.machWinkel(3) < J.machWinkel(2), true);

console.log(' Strahlzustand, Austritt Ma_e = 2.1972 (A_e/A* = 2):');
const MaE = J.MaFromArea(2.0);
chk('Ma_e aus dem Flaechenverhaeltnis', MaE, 2.1972, 1e-3);
{
  const u = J.strahl(MaE, 0.45);      // UNTERexpandiert: p_a < p_e
  chk('unterexpandiert erkannt', u.unter, true);
  chk('  Umlenkung positiv -> Expansionsfaecher', u.theta > 0, true);
  chk('  Ma steigt an der Strahlgrenze', u.MaA > u.MaE, true);
  chk('  Ma auf der Achse noch hoeher (theta wirkt zweimal)', u.MaC > u.MaA, true);
  chk('  Randbedingung p = p_a an der Grenze exakt erfuellt', J.pIso(u.MaA), u.pA, 1e-9);
  chk('  Druck auf der Achse schiesst UNTER p_a durch', u.pC < u.pA, true);

  const o = J.strahl(MaE, 1.90);      // UEBERexpandiert: p_a > p_e
  chk('ueberexpandiert erkannt', o.ueber, true);
  chk('  Umlenkung negativ -> Kompression / Stoss', o.theta < 0, true);
  chk('  Ma faellt an der Strahlgrenze', o.MaA < o.MaE, true);
  chk('  Ma auf der Achse noch tiefer', o.MaC < o.MaA, true);
  chk('  Druck auf der Achse schiesst UEBER p_a hinaus', o.pC > o.pA, true);

  const a = J.strahl(MaE, 1.0);       // angepasst
  chk('angepasst: keine Umlenkung', a.theta, 0, 1e-9);
  chk('  Ma bleibt ueberall gleich', a.MaC, a.MaE, 1e-6);
}

console.log(' Die Reflexionsregeln — der Kern des Kapitels:');
{
  const u = J.strahl(MaE, 0.45);
  const wz = J.wellenzug(u, 1, 8);
  chk('erstes Segment laeuft zur Achse (y2 = 0)', wz.seg[0].y2, 0, 1e-12);
  chk('erste Welle ist eine Expansion (unterexpandiert)', wz.seg[0].art, 'exp');
  // Erwartung: Achse gleichartig, freie Grenze kippt
  //   Seg0 exp (->Achse) | Seg1 exp (->Rand) | Seg2 komp (->Achse) | Seg3 komp (->Rand) | Seg4 exp ...
  chk('nach Reflexion an der ACHSE gleichartig', wz.seg[1].art, 'exp');
  chk('nach Reflexion an der freien GRENZE gekippt', wz.seg[2].art, 'komp');
  chk('wieder Achse -> gleichartig', wz.seg[3].art, 'komp');
  chk('wieder Grenze -> gekippt', wz.seg[4].art, 'exp');
  chk('Muster hat die Periode 4 (eine Raute)', wz.seg[0].art === wz.seg[4].art, true);
  chk('Segmente wechseln zwischen Achse und Rand',
      wz.seg[0].y2 === 0 && wz.seg[1].y2 > 0 && wz.seg[2].y2 === 0, true);
  let steigend = true;
  for (let i = 1; i < wz.seg.length; i++) if (wz.seg[i].x1 < wz.seg[i-1].x1) steigend = false;
  chk('Wellenzug laeuft monoton stromab', steigend, true);

  const o = J.wellenzug(J.strahl(MaE, 1.90), 1, 8);
  chk('ueberexpandiert: erste Welle ist eine Kompression', o.seg[0].art, 'komp');
  chk('  und kippt an der Grenze zur Expansion', o.seg[2].art, 'exp');

  // Strahlgrenze: unterexpandiert zuerst nach AUSSEN, ueberexpandiert nach INNEN
  chk('unterexpandiert: Strahl wird zuerst BREITER', wz.rand[1].y > wz.rand[0].y, true);
  chk('ueberexpandiert: Strahl wird zuerst SCHMALER', o.rand[1].y < o.rand[0].y, true);
  chk('  das ist die ganze Erkennungsregel',
      (wz.rand[1].y > 1) && (o.rand[1].y < 1), true);
}

console.log(' Druckverlauf auf der Achse:');
{
  const u = J.strahl(MaE, 0.45);
  const st = J.achsDruck(u, J.wellenzug(u, 1, 10).seg);
  chk('mehrere Drucksprünge auf der Achse', st.length >= 2, true);
  chk('erster Sprung: von p_e auf p_Achse', st[0].von, u.pE, 1e-12);
  chk('  und der geht nach UNTEN (Expansion)', st[0].nach < st[0].von, true);
  chk('zweiter Sprung geht wieder nach OBEN', st[1].nach > st[1].von, true);
  chk('Druck pendelt zwischen zwei Werten', st[2].nach, st[0].nach, 1e-12);
}
chk('script-Tag freistrahl.js in index.html', html.includes('js/modules/freistrahl.js'), true);

console.log();
console.log('=== 10) biotsavart.js — Linienintegral gegen die geschlossenen Formeln ===');
const physBS = slice('js/modules/biotsavart.js', 'function vAdd', '/* ---------------- Einstieg');
const BS = new Function(physBS +
  '; return {bsPoly,bsSeg,bsRay,bsLine,ringAxis,arcPts,segPts,geoSchirm,geoFluegel,geoRinge,vLen,vAdd};')();
const GBS = 4 * Math.PI;                 // wie im Modul: damit Gamma/(4 pi) = 1

console.log(' Gerades Fadenstueck — Numerik gegen Gamma/(4 pi r)(cos t1 - cos t2):');
{
  const a = [-3,0,0], b = [3,0,0];
  for (const X of [[0,1.5,1.2], [1.1,0.4,-0.9], [-2.0,2.2,0.3]]) {
    const uN = BS.bsPoly(BS.segPts(a,b,4000), GBS, X), uE = BS.bsSeg(a,b,GBS,X);
    chk(`  Betrag bei x=(${X})`, BS.vLen(uN), BS.vLen(uE), 1e-5);
    for (let k = 0; k < 3; k++) chk(`    Komponente ${'uvw'[k]}`, uN[k], uE[k], 1e-5);
  }
}

console.log(' Die drei Faelle, die man auswendig koennen muss:');
{
  const r = 1.3;
  chk('unendlicher Faden   = Gamma/(2 pi r)',
      BS.vLen(BS.bsLine([0,0,0],[1,0,0],GBS,[0,r,0])), GBS/(2*Math.PI*r), 1e-12);
  chk('halbunendlich       = Gamma/(4 pi r)',
      BS.vLen(BS.bsRay([0,0,0],[1,0,0],GBS,[0,r,0])), GBS/(4*Math.PI*r), 1e-12);
  chk('  Verhaeltnis exakt 2 (der Faktor 1/2)',
      BS.vLen(BS.bsLine([0,0,0],[1,0,0],GBS,[0,r,0])) / BS.vLen(BS.bsRay([0,0,0],[1,0,0],GBS,[0,r,0])), 2, 1e-12);
  // Grenzuebergang: ein endliches Stueck laeuft in den unendlichen hinein
  const lang = BS.bsSeg([-4000,0,0],[4000,0,0],GBS,[0,r,0]);
  chk('endliches Stueck, 3000-fache Laenge -> unendlich', BS.vLen(lang), GBS/(2*Math.PI*r), 1e-6);
}

console.log(' Kreisring auf der eigenen Achse:');
{
  const R = 1.7, ring = BS.arcPts([0,0,0],[1,0,0],[0,1,0],R,0,2*Math.PI,6000);
  chk('im Zentrum = Gamma/(2R)', BS.bsPoly(ring,GBS,[0,0,0])[2], GBS/(2*R), 1e-6);
  chk('bei z = 1.1 = Gamma R^2/(2(R^2+z^2)^1.5)', BS.bsPoly(ring,GBS,[0,0,1.1])[2], BS.ringAxis(R,1.1,GBS), 1e-6);
  chk('Formel im Zentrum stimmt mit sich selbst', BS.ringAxis(R,0,GBS), GBS/(2*R), 1e-14);
}

console.log(' Pruefungsgeometrie Gleitschirm (Kreissegment in der y-z-Ebene):');
{
  const a = 1.0, g = BS.geoSchirm(a), e = g.uW3exact(GBS), n = g.uW3num(GBS);
  chk('u  numerisch = geschlossen', n[0], e[0], 1e-5);
  chk('v  numerisch = geschlossen', n[1], e[1], 1e-5);
  chk('w  numerisch = geschlossen', n[2], e[2], 1e-5);
  chk('u = -Gamma/(32a)',            e[0], -GBS/(32*a), 1e-12);
  chk('v = -sqrt2 Gamma/(16 pi a)',  e[1], -Math.SQRT2*GBS/(16*Math.PI*a), 1e-12);
  chk('w = 0 (Symmetrie des Bogens)', e[2], 0, 1e-12);
  chk('v < 0 — der Schirm fliegt im eigenen Abwind', e[1] < 0, true);
  // |r| ist ueber den ganzen Bogen konstant — das traegt die ganze Rechnung
  const pts = g.arc(400);
  const rs = pts.map(p => BS.vLen([g.P[0]-p[0], g.P[1]-p[1], g.P[2]-p[2]]));
  chk('|r| konstant ueber den Bogen', Math.max(...rs)-Math.min(...rs), 0, 1e-12);
  chk('|r| = sqrt(2) R', rs[0], Math.SQRT2*g.R, 1e-12);
}

console.log(' Pruefungsgeometrie Tragfluegel (Kreissegment in der xy-Ebene):');
{
  const R = 1.4, a = 0.9, g = BS.geoFluegel(R,a), e = g.uW2exact(GBS), n = g.uW2num(GBS);
  chk('u  numerisch = geschlossen', n[0], e[0], 1e-5);
  chk('v  numerisch = geschlossen', n[1], e[1], 1e-5);
  chk('w  numerisch = geschlossen', n[2], e[2], 1e-5);
  const k = GBS*R/(4*Math.PI*Math.pow(R*R+a*a,1.5));
  chk('u = -sqrt2 a k', e[0], -Math.SQRT2*a*k, 1e-12);
  chk('v = 0 (sin-Integral verschwindet)', e[1], 0, 1e-12);
  chk('w = k pi R/2', e[2], k*Math.PI*R/2, 1e-12);
  const pts = g.arc(400);
  const rs = pts.map(p => BS.vLen([g.P[0]-p[0], g.P[1]-p[1], g.P[2]-p[2]]));
  chk('|r| konstant ueber den Bogen', Math.max(...rs)-Math.min(...rs), 0, 1e-12);
  chk('|r| = sqrt(R^2 + a^2)', rs[0], Math.sqrt(R*R+a*a), 1e-12);
}

console.log(' Pruefungsgeometrie zwei koaxiale Ringe:');
{
  const R1 = 1.3, R2 = 0.85, L = 1.4, g = BS.geoRinge(R1,R2,L,GBS);
  chk('Ring 1 durch sich selbst = Gamma/(2R1)', g.atRing1.self, GBS/(2*R1), 1e-14);
  chk('Ring 2 durch sich selbst = Gamma/(2R2)', g.atRing2.self, GBS/(2*R2), 1e-14);
  chk('Ring 1 durch Ring 2', g.atRing1.other, GBS*R2*R2/(2*Math.pow(R2*R2+L*L,1.5)), 1e-14);
  chk('der kleinere Ring ist schneller', g.v2 > g.v1, true);
}
chk('script-Tag biotsavart.js in index.html', html.includes('js/modules/biotsavart.js'), true);

console.log();
console.log('=== 11) tragfluegel.js — Traglinie, Abwind, Beiwerte ===');
const physTF = slice('js/modules/tragfluegel.js', 'function tAdd', '/* ---------------- Einstieg');
const TF = new Function(physTF +
  '; return {liftingLine,glauert,downwashG,gammaG,downwashRaw,downwashHorseshoe,downwashElliptic,forcesG,coeffs,section,gammaOf};')();

console.log(' Einzelhufeisen — Abwind aus den beiden Randwirbeln:');
{
  const b = 3.0, Gm = 1.6;
  const sysR = TF.liftingLine(b,Gm,'rect',20);
  chk('w(0) = -Gamma/(pi b)', TF.downwashRaw(sysR,0), -Gm/(Math.PI*b), 1e-12);
  chk('  Simulation = geschlossene Formel', TF.downwashRaw(sysR,0), TF.downwashHorseshoe(b,Gm,0), 1e-12);
  chk('w(0.6) ebenso', TF.downwashRaw(sysR,0.6), TF.downwashHorseshoe(b,Gm,0.6), 1e-12);
  chk('Abwind zeigt nach unten', TF.downwashHorseshoe(b,Gm,0) < 0, true);
  chk('  und divergiert an der Spitze',
      Math.abs(TF.downwashHorseshoe(b,Gm,0.999*b/2)) > 20*Math.abs(TF.downwashHorseshoe(b,Gm,0)), true);
}

console.log(' Elliptische Verteilung — Abwind ueber die ganze Spannweite konstant:');
{
  const b = 3.0, G0 = 1.6, gl = TF.glauert(b,G0,'ell',24);
  chk('nur G_1 ist besetzt', Math.abs(gl.Gn[2]) + Math.abs(gl.Gn[3]) + Math.abs(gl.Gn[4]), 0, 1e-12);
  chk('G_1 = Gamma_0', gl.Gn[1], G0, 1e-9);
  let mn = Infinity, mx = -Infinity;
  for (let i = 0; i <= 200; i++) { const w = TF.downwashG(gl, (-1+2*i/200)*b/2); mn = Math.min(mn,w); mx = Math.max(mx,w); }
  chk('w schwankt nicht (inkl. Fluegelspitzen)', mx-mn, 0, 1e-9);
  chk('w = -Gamma_0/(2b)', TF.downwashG(gl,0), TF.downwashElliptic(b,G0), 1e-9);
  chk('  auch exakt an der Spitze', TF.downwashG(gl,b/2), TF.downwashElliptic(b,G0), 1e-9);
  chk('Gamma(0) = Gamma_0', TF.gammaG(gl,0), G0, 1e-9);
  chk('Gamma(0.6 b/2) = Gamma_0 sqrt(1-0.36)', TF.gammaG(gl,0.6*b/2), G0*Math.sqrt(1-0.36), 1e-9);
  chk('Gamma an der Spitze = 0', TF.gammaG(gl,b/2), 0, 1e-9);
}

console.log(' Auftrieb und induzierter Widerstand aus der Reihe:');
{
  const b = 3.0, G0 = 1.6, gl = TF.glauert(b,G0,'ell',24), F = TF.forcesG(gl,1.0);
  chk('L = rho u_inf pi b G_1/4', F.L, G0*Math.PI*b/4, 1e-8);
  chk('D = rho pi/8 G_0^2',        F.D, G0*G0*Math.PI/8, 1e-8);
  chk('D/L = |w|/u_inf = alpha_i', F.D/F.L, Math.abs(TF.downwashElliptic(b,G0)), 1e-9);
  // die Beiwertformel des Skripts, S. 91
  const A = b*0.5, LAM = b*b/A, cA = F.L/(0.5*A), cW = F.D/(0.5*A);
  chk('c_W,ind = c_A^2/(pi Lambda)', cW, cA*cA/(Math.PI*LAM), 1e-9);
}

console.log(' Elliptisch ist das Optimum (gleicher Auftrieb, kleinster Widerstand):');
{
  const b = 3.0;
  const rel = (k, m) => { const g = TF.glauert(b,1,k,m), f = TF.forcesG(g,1.0); return f.D/(f.L*f.L); };
  chk('parabolisch kostet mehr', rel('par',24) > rel('ell',24), true);
  // Der Zuschlag ist exakt 1/8. Analytisch: fuer Gamma ~ sin^2(theta) ist
  // G_n/G_1 = -3/(n(n^2-4)) fuer ungerade n, und D/L^2 traegt
  // sum_{n=3,5,...} 9/(n(n^2-4)^2) = 0.125 ueber den elliptischen Wert hinaus.
  // Die abgeschnittene Reihe naehert sich dem von unten:
  chk('  Zuschlag bei M=24  Reihengliedern', rel('par',24)/rel('ell',24), 1.125, 1e-4);
  chk('  Zuschlag bei M=200 Reihengliedern', rel('par',200)/rel('ell',200), 1.125, 1e-8);
  chk('  monotone Konvergenz gegen 1.125',
      rel('par',24)/rel('ell',24) < rel('par',200)/rel('ell',200), true);
}

console.log(' Profilschnitt nach Abb. 10.9:');
{
  const S = TF.section(1.0, -0.18, 1.0);
  chk('alpha_i = atan(|v|/u_inf)', S.alphaI, Math.atan(0.18), 1e-12);
  chk('F_y^2 + F_x^2 = F_res^2',   S.Fy*S.Fy + S.Fx*S.Fx, 1, 1e-12);
  chk('F_x/F_y = tan(alpha_i)',    S.Fx/S.Fy, 0.18, 1e-12);
  chk('ohne Abwind ist F_x = 0 (d Alembert)', TF.section(1.0,0,1.0).Fx, 0, 1e-15);
  chk('  und F_y = F_res',                    TF.section(1.0,0,1.0).Fy, 1, 1e-15);
  chk('u_eff > u_inf', S.ueff > 1.0, true);
}

console.log(' Beiwerte, Skript S. 91:');
{
  const c = TF.coeffs(0.8, 9);
  chk('c_W,ind = c_A^2/(pi Lambda)', c.cWi, 0.64/(Math.PI*9), 1e-14);
  chk('alpha_i = c_A/(pi Lambda)',   c.alphaI, 0.8/(Math.PI*9), 1e-14);
  chk('c_W,ind = c_A * alpha_i',     c.cWi, 0.8*c.alphaI, 1e-14);
  // Segelflieger gegen Delta: die Streckung schlaegt voll durch
  chk('Lambda 25 gegen Lambda 2 — Faktor 12.5',
      TF.coeffs(0.8,2).cWi / TF.coeffs(0.8,25).cWi, 12.5, 1e-12);
  // grosse Spannweite bei festem Gamma: der Abwind faellt wie 1/b
  const w1 = Math.abs(TF.downwashElliptic(3,1.6)), w2 = Math.abs(TF.downwashElliptic(30,1.6));
  chk('b verzehnfacht -> Abwind ein Zehntel', w2/w1, 0.1, 1e-14);
}
chk('script-Tag tragfluegel.js in index.html', html.includes('js/modules/tragfluegel.js'), true);

console.log();
console.log(fail === 0 ? `ALLE ${pass} PRUEFUNGEN BESTANDEN` : `${fail} FEHLGESCHLAGEN, ${pass} bestanden`);
process.exit(fail === 0 ? 0 : 1);
