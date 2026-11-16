/* Mi Consumo — Fase 3: "Modo viaje". Registra cómo manejás (velocidad, tipo de vía, ralentí, arranques y frenadas)
   y lo relaciona con el consumo de cada tanque. Opcional y apagado por defecto. Todo queda en el teléfono. */
'use strict';

/* Umbrales (m/s y m/s²) */
const KMH = 3.6;
const BAND_CITY = 40 / KMH, BAND_HWY = 80 / KMH;          // <40 ciudad · 40-80 avenida · >80 ruta
const START_SPEED = 15 / KMH;                              // empieza un viaje automático
const STOP_SPEED = 2;                                      // detenido
const HARSH_ACC = 3.0, HARSH_BRAKE = -3.5;                 // arranque fuerte / frenada brusca (GPS)
const SENSOR_JERK = 4.0;                                   // movimiento brusco (sensor, sin gravedad)
const END_AFTER_STOP = 4 * 60e3;                           // fin automático tras 4 min detenido
const GAP_CLOSE = 6 * 60e3;                                // si la app estuvo cerrada más de esto, se cierra el viaje

let vBuf = [], lastTrackT = 0;
let trip = null, tripWatch = null, lastPt = null, stoppedSince = null, wakeLock = null, motionOn = false, charging = null;
const cfg = () => db.tripCfg || (db.tripCfg = { on: false, mode: 'manual', sensor: true });

/* ---------- Ajustes (pantalla Mi auto) ---------- */
function renderTripSettings() {
  const box = $('#trip-settings'); if (!box) return;
  const c = cfg();
  const modes = [
    ['manual', 'Manual', 'Tocás "Iniciar viaje" y "Terminar viaje".'],
    ['auto', 'Automático con la app abierta', 'Detecta solo cuándo empezás y terminás de manejar, mientras la app está en pantalla.'],
    ['charging', 'Automático solo si el teléfono carga', 'Igual que el anterior, pero solo con el teléfono enchufado (en el cargador del auto). Evita registrar Uber o bici.'],
    ['always', 'Siempre, en segundo plano', 'Requiere la app de Android (próximamente).']
  ];
  box.innerHTML = `
    <div class="row between center gap10">
      <div class="col gap2"><span class="b6">Modo viaje</span><span class="muted xs">Registrar velocidad, tipo de vía, ralentí, arranques y frenadas para entender tu consumo.</span></div>
      <button class="toggle ${c.on ? 'on' : ''}" id="tg-trips" role="switch" aria-checked="${c.on}" aria-label="Registrar mis viajes"><span></span></button>
    </div>
    ${c.on ? `
      <div class="col gap8" role="radiogroup" aria-label="Cómo registrar los viajes">
        ${modes.map(([k, t, d]) => `<button class="opt ${c.mode === k ? 'sel' : ''}" data-mode="${k}" ${k === 'always' ? 'disabled style="opacity:.5"' : ''} role="radio" aria-checked="${c.mode === k}">
          <span class="dot"></span><span class="col gap2"><span class="t" style="font-size:14px">${t}</span><span class="s" style="white-space:normal">${d}</span></span></button>`).join('')}
      </div>
      <label class="row center gap10 xs muted" style="cursor:pointer"><input type="checkbox" id="tg-sensor" ${c.sensor ? 'checked' : ''} style="width:20px;height:20px;accent-color:#0B6E5A"> Usar el sensor de movimiento (más preciso para arranques y frenadas; teléfono fijo en un soporte)</label>
      <span class="muted xs">El recorrido detallado queda solo en este teléfono. Mientras registra, la pantalla se mantiene encendida: conviene tener el teléfono cargando.</span>` : ''}`;
  $('#tg-trips').onclick = () => { c.on = !c.on; if (!c.on) stopTripEngine(true); save(); renderTripSettings(); applyTripMode(); renderTabbars(); };
  box.querySelectorAll('[data-mode]').forEach((b) => b.onclick = () => { if (b.disabled) return; c.mode = b.dataset.mode; save(); renderTripSettings(); applyTripMode(); });
  const sen = $('#tg-sensor'); if (sen) sen.onchange = () => { c.sensor = sen.checked; save(); if (trip) setMotion(c.sensor); };
}

/* ---------- Motor de registro ---------- */
function applyTripMode() {
  const c = cfg();
  if (!c.on) { stopTripEngine(true); renderTripChip(); return; }
  if (c.mode === 'auto' || c.mode === 'charging') startWatch(); // escucha el GPS esperando que empieces a manejar
  else if (!trip) stopWatch();
  renderTripChip();
}
function startWatch() {
  if (tripWatch != null || !navigator.geolocation) return;
  tripWatch = navigator.geolocation.watchPosition(onTripPos, () => {}, { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 });
}
function stopWatch() { if (tripWatch != null) { navigator.geolocation.clearWatch(tripWatch); tripWatch = null; } lastPt = null; }
function stopTripEngine(saveTrip) { if (trip) endTrip(saveTrip); stopWatch(); }

function newTrip(t) {
  return { id: 't-' + t + '-' + Math.random().toString(36).slice(2, 5), start: new Date(t).toISOString(), end: null, mode: cfg().mode,
    km: 0, movingSec: 0, idleSec: 0, cityKm: 0, aveKm: 0, hwyKm: 0, citySec: 0, aveSec: 0, hwySec: 0,
    maxKmh: 0, over120Km: 0, starts: 0, hardStarts: 0, hardAccel: 0, hardBrakes: 0, stops: 0, abrupt: 0, kind: null, include: null,
    t0: t, track: [] }; // track: [segundos desde el inicio, lat, lon, velocidad m/s] cada ~2 s (solo en este teléfono)
}
function beginTrip(t) {
  trip = newTrip(t || Date.now()); stoppedSince = null; lastTrackT = 0;
  startWatch(); keepAwake(true); setMotion(cfg().sensor);
  renderTripChip(); toast('Viaje iniciado.');
}
function endTrip(keep) {
  if (!trip) return;
  const t = trip; trip = null; keepAwake(false); setMotion(false);
  if (!t.end) t.end = lastPt ? new Date(lastPt.t).toISOString() : new Date().toISOString();
  if (keep && t.km >= 0.3) {
    t.kind = guessKind(t);
    t.include = t.kind === 'auto'; // los viajes que parecen en auto cuentan; el resto, no (se puede cambiar)
    db.trips.unshift(t); db.trips = db.trips.slice(0, 500);
    db.trips.forEach((x, i) => { if (i >= 30 && x.track) delete x.track; }); // el recorrido detallado se guarda para los últimos 30 viajes
    save();
    toast(`Viaje guardado: ${fmt(t.km, 1)} km.`);
  }
  if (cfg().mode === 'manual') stopWatch();
  renderTripChip();
  if (current === 'trips') renderTrips();
}
function guessKind(t) {
  const avg = t.movingSec ? t.km / (t.movingSec / 3600) : 0;
  if (t.maxKmh < 14) return 'a pie';
  if (t.maxKmh < 38 && avg < 22) return 'bici';
  return 'auto';
}

function onTripPos(p) {
  const c = cfg();
  const pt = { lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy, t: p.timestamp, v: p.coords.speed };
  if (pt.acc > 50) return; // lectura imprecisa: se descarta
  if (lastPt && pt.t - lastPt.t > GAP_CLOSE && trip) { trip.end = new Date(lastPt.t).toISOString(); endTrip(true); }
  let v = pt.v;
  const dt = lastPt ? (pt.t - lastPt.t) / 1000 : 0;
  const d = lastPt ? distM(lastPt, pt) : 0;
  if ((v == null || isNaN(v)) && dt > 0) v = d / dt;
  if (v == null || isNaN(v)) v = 0;
  pt.v = v;
  // Velocidad suavizada (promedio de las últimas 3 lecturas): el GPS "salta" y falsearía aceleraciones
  vBuf.push(v); if (vBuf.length > 3) vBuf.shift();
  pt.vs = vBuf.reduce((a, b) => a + b, 0) / vBuf.length;

  // Inicio automático
  if (!trip && (c.mode === 'auto' || c.mode === 'charging') && v > START_SPEED && (!lastPt || lastPt.v > START_SPEED)) {
    if (c.mode === 'charging' && charging === false) { lastPt = pt; return; }
    beginTrip(lastPt ? lastPt.t : pt.t);
  }
  if (trip && lastPt && dt > 0 && dt < 30) {
    const vAvg = (v + lastPt.v) / 2, km = d / 1000;
    if (vAvg < STOP_SPEED) trip.idleSec += dt;
    else {
      trip.km += km; trip.movingSec += dt;
      if (vAvg < BAND_CITY) { trip.cityKm += km; trip.citySec += dt; }
      else if (vAvg < BAND_HWY) { trip.aveKm += km; trip.aveSec += dt; }
      else { trip.hwyKm += km; trip.hwySec += dt; }
      if (vAvg * KMH > 120) trip.over120Km += km;
    }
    trip.maxKmh = Math.max(trip.maxKmh, v * KMH);
    if (dt >= 0.8 && dt <= 3) { // aceleración entre lecturas cercanas, con velocidad suavizada
      const a = (pt.vs - (lastPt.vs ?? lastPt.v)) / dt;
      const fromStop = lastPt.v < STOP_SPEED && v >= STOP_SPEED;
      if (fromStop) { trip.starts++; if (a > HARSH_ACC) trip.hardStarts++; }
      else if (a > HARSH_ACC) trip.hardAccel++;
      if (a < HARSH_BRAKE) trip.hardBrakes++;
    }
    if (lastPt.v >= STOP_SPEED && v < STOP_SPEED) trip.stops++;
    // Fin automático: detenido un rato
    if (v < STOP_SPEED) { stoppedSince = stoppedSince || pt.t; if ((c.mode === 'auto' || c.mode === 'charging') && pt.t - stoppedSince > END_AFTER_STOP) { trip.end = new Date(stoppedSince).toISOString(); lastPt = pt; endTrip(true); return; } }
    else stoppedSince = null;
    if (pt.t - lastTrackT >= 2000) { trip.track.push([Math.round((pt.t - trip.t0) / 1000), +pt.lat.toFixed(5), +pt.lon.toFixed(5), +pt.vs.toFixed(1)]); lastTrackT = pt.t; }
    if (current === 'home') renderTripChip();
  }
  lastPt = pt;
}

/* Sensor de movimiento: cuenta sacudones fuertes (arranques, frenadas o curvas bruscas) */
let lastJerk = 0;
function onMotion(e) {
  if (!trip || !e.acceleration) return;
  const a = e.acceleration, m = Math.hypot(a.x || 0, a.y || 0, a.z || 0);
  const now = Date.now();
  if (m > SENSOR_JERK && now - lastJerk > 1500) { trip.abrupt++; lastJerk = now; }
}
function setMotion(on) {
  if (on && !motionOn && 'DeviceMotionEvent' in window) { window.addEventListener('devicemotion', onMotion); motionOn = true; }
  if (!on && motionOn) { window.removeEventListener('devicemotion', onMotion); motionOn = false; }
}
async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator && !wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); }
    if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch (e) { /* sin permiso: sigue igual */ }
}
// La pantalla encendida se pierde al salir de la app: se pide de nuevo al volver
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && trip) keepAwake(true); });
if (navigator.getBattery) navigator.getBattery().then((b) => { charging = b.charging; b.addEventListener('chargingchange', () => { charging = b.charging; }); }).catch(() => {});

/* ---------- Indicador en Inicio ---------- */
function renderTripChip() {
  const el = $('#trip-chip'); if (!el) return;
  const c = cfg();
  if (!c.on) { el.innerHTML = ''; return; }
  if (trip) {
    const min = Math.round((Date.now() - new Date(trip.start)) / 60000);
    el.innerHTML = `<div class="trip-live"><span class="live-dot"></span><span class="grow">Viaje en curso · ${fmt(trip.km, 1)} km · ${min} min</span><button class="btn2" id="trip-stop" style="height:40px;padding:0 14px">Terminar</button></div>`;
    $('#trip-stop').onclick = () => endTrip(true);
  } else if (c.mode === 'manual') {
    el.innerHTML = `<button class="trip-start" id="trip-go"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg> Iniciar viaje</button>`;
    $('#trip-go').onclick = () => beginTrip();
  } else {
    el.innerHTML = `<div class="trip-live muted"><span class="live-dot"></span><span class="grow xs">Modo viaje automático: empieza solo cuando manejás${c.mode === 'charging' ? ' con el teléfono cargando' : ''}.</span></div>`;
  }
}

/* ---------- Evaluación ---------- */
function aggregate(list) {
  const s = { n: list.length, km: 0, movingSec: 0, idleSec: 0, cityKm: 0, aveKm: 0, hwyKm: 0, over120Km: 0, starts: 0, hardStarts: 0, hardAccel: 0, hardBrakes: 0, abrupt: 0, maxKmh: 0 };
  list.forEach((t) => { for (const k in s) if (k !== 'n' && k !== 'maxKmh') s[k] += t[k] || 0; s.maxKmh = Math.max(s.maxKmh, t.maxKmh); });
  return s;
}
// Puntaje 0-100: parte de 100 y descuenta por eventos cada 100 km, ralentí y exceso de velocidad
function score(s) {
  if (s.km < 1) return null;
  const per100 = (x) => x / s.km * 100;
  const idlePct = s.idleSec / Math.max(1, s.idleSec + s.movingSec) * 100;
  let p = 100 - Math.min(35, per100(s.hardStarts + s.hardAccel) * 1) - Math.min(30, per100(s.hardBrakes) * 1.5) - Math.min(10, per100(s.abrupt) * 0.3)
    - Math.min(15, Math.max(0, idlePct - 10) * 0.5) - Math.min(10, (s.over120Km / s.km * 100) * 0.3);
  return Math.max(0, Math.min(100, Math.round(p)));
}
function tips(s) {
  const out = [], per100 = (x) => x / s.km * 100;
  if (per100(s.hardStarts + s.hardAccel) > 10) out.push('Arrancá más suave: muchas aceleraciones fuertes.');
  if (per100(s.hardBrakes) > 8) out.push('Anticipá las frenadas: dejá rodar el auto antes de frenar.');
  const idle = s.idleSec / Math.max(1, s.idleSec + s.movingSec);
  if (idle > 0.2) out.push('Mucho tiempo detenido con el motor en marcha: el ralentí gasta sin avanzar.');
  if (s.over120Km / s.km > 0.1) out.push('Por encima de 120 km/h el consumo sube mucho.');
  if (!out.length) out.push('¡Manejo parejo! Seguí así.');
  return out;
}
const pct = (a, b) => (b ? Math.round(a / b * 100) : 0);
function bandBar(s) {
  const tot = s.cityKm + s.aveKm + s.hwyKm || 1;
  return `<div class="bands" role="img" aria-label="Ciudad ${pct(s.cityKm, tot)} %, avenida ${pct(s.aveKm, tot)} %, ruta ${pct(s.hwyKm, tot)} %">
    <i style="width:${s.cityKm / tot * 100}%;background:#E8A33D"></i><i style="width:${s.aveKm / tot * 100}%;background:#5BA48F"></i><i style="width:${s.hwyKm / tot * 100}%;background:#0B6E5A"></i></div>
    <div class="row between xs muted"><span><b style="color:#E8A33D">■</b> Ciudad ${pct(s.cityKm, tot)} %</span><span><b style="color:#5BA48F">■</b> Avenida ${pct(s.aveKm, tot)} %</span><span><b style="color:#0B6E5A">■</b> Ruta ${pct(s.hwyKm, tot)} %</span></div>`;
}
const tripsInRange = (from, to) => db.trips.filter((t) => t.include && t.start >= from && t.start < to);
// Línea para la pantalla de resultado: cómo se manejó mientras se usaba ese combustible
function tankDrivingLine(seg) {
  if (!db.trips || !db.trips.length) return '';
  const s = aggregate(tripsInRange(seg.fromDate, seg.date));
  if (s.km < 5) return '';
  const tot = s.cityKm + s.aveKm + s.hwyKm || 1;
  const e = estKml(tripsInRange(seg.fromDate, seg.date));
  return `<span class="xs center-text" style="color:#CDE9E0">🚗 ${pct(s.hwyKm, tot)} % ruta · ${pct(s.cityKm, tot)} % ciudad · puntaje de manejo ${score(s) ?? '—'}/100${e ? `<br>Tus viajes estimaban ${fmt(e, 1)} km/l: ${diffTxt(e, seg.kml)} vs. el real` : ''}</span>`;
}

/* ---------- Consumo estimado por viaje ----------
   Modelo: tu rendimiento promedio (K) ajustado por tipo de vía, ralentí y estilo.
   Ciudad rinde ~20 % menos que K, ruta ~12 % más; >120 km/h ~10 % menos; ralentí ≈ 0,8 l/h;
   cada arranque fuerte / frenada brusca cada 100 km suma ~0,5 % (tope 10 %).
   Al cerrar cada tanque se compara con el real y se calibra (promedio de los últimos 5 tanques). */
const baseK = () => summary(segments()).kml || 10;
/* Consumo instantáneo con "potencia específica del vehículo" (VSP, modelo de la EPA de EE. UU.):
   VSP [kW/t] = v·(1,1·a + 0,132) + 0,000302·v³   → energía para acelerar, rodar y vencer el aire.
   Combustible [ml/s] ≈ 0,22 (ralentí, ~0,8 l/h) + 0,16 · VSP positiva. Luego se escala a TU rendimiento real. */
function trackSeries(track) {
  const out = []; let ml = 0, m = 0;
  for (let i = 1; i < (track || []).length; i++) {
    const [t0, la0, lo0, v0] = track[i - 1], [t1, la1, lo1, v1] = track[i];
    const dt = t1 - t0; if (dt <= 0 || dt > 30) continue;
    const v = (v0 + v1) / 2, a = (v1 - v0) / dt, d = distM({ lat: la0, lon: lo0 }, { lat: la1, lon: lo1 });
    const vsp = v * (1.1 * a + 0.132) + 0.000302 * v * v * v;
    const f = (0.22 + 0.16 * Math.max(0, vsp)) * dt; // ml en este tramo
    ml += f; m += d;
    out.push({ t: t1, v, d, ml: f, la0, lo0, la1, lo1 });
  }
  return { km: m / 1000, liters: ml / 1000, pts: out };
}
// Referencia fija: lo que da el modelo en un recorrido "típico" (ciudad con semáforos + avenida + ruta).
// Cada viaje se compara contra ese recorrido típico y se lleva a TU km/l real; las cargas de combustible
// después corrigen cualquier sesgo (calibración).
let _ref = null;
function vspRef() {
  if (_ref) return _ref;
  const tr = []; let t = 0, x = 0, v = 0;
  const go = (target, acc, secs) => { // acelera/frena hasta target y lo mantiene secs segundos
    while (Math.abs(v - target) > 0.01) { v = v < target ? Math.min(target, v + acc * 2) : Math.max(target, v - 1.5 * 2); x += v * 2; t += 2; tr.push([t, -34 - x / 111000, -58, v]); }
    for (let i = 0; i < secs / 2; i++) { x += v * 2; t += 2; tr.push([t, -34 - x / 111000, -58, v]); }
  };
  tr.push([0, -34, -58, 0]);
  for (let i = 0; i < 6; i++) { go(11, 1.2, 20); go(0, 1, 16); } // ciudad: hasta 40 km/h y semáforo
  go(17, 1, 120); go(0, 1, 10);                                   // avenida a 60 km/h
  go(28, 0.9, 300); go(0, 1, 6);                                  // ruta a 100 km/h
  const sres = trackSeries(tr);
  _ref = sres.km / sres.liters;
  return _ref;
}
function rawLiters(t) {
  const K = baseK();
  if (t.track && t.track.length > 3) { // con recorrido: modelo instantáneo
    const s = trackSeries(t.track), ref = vspRef();
    if (s.liters > 0 && ref) return s.liters * ref / K;
  }
  const hwyNormal = Math.max(0, t.hwyKm - (t.over120Km || 0));
  let l = t.cityKm / (K * 0.8) + t.aveKm / K + hwyNormal / (K * 1.12) + (t.over120Km || 0) / (K * 0.9) + t.idleSec / 3600 * 0.8;
  const ev = t.km ? (t.hardStarts + t.hardAccel + t.hardBrakes) / t.km * 100 : 0;
  return l * (1 + Math.min(0.10, ev * 0.005));
}
function calibration() {
  const ratios = [];
  for (const g of segments()) {
    const list = tripsInRange(g.fromDate, g.date), km = list.reduce((a, t) => a + t.km, 0);
    if (km < g.km * 0.5) continue; // pocos viajes registrados en ese tanque: no sirve para calibrar
    const raw = list.reduce((a, t) => a + rawLiters(t), 0);
    if (raw > 0) ratios.push(g.kml / (km / raw));
  }
  const last = ratios.slice(-5);
  return last.length ? last.reduce((a, b) => a + b, 0) / last.length : 1;
}
// km/l estimado para un conjunto de viajes
function estKml(list) {
  const km = list.reduce((a, t) => a + t.km, 0), raw = list.reduce((a, t) => a + rawLiters(t), 0);
  return km > 0 && raw > 0 ? (km / raw) * calibration() : null;
}
function recentPpl() {
  if (!db.loads.length) return null;
  const since = Date.now() - 30 * 864e5;
  let r = db.loads.filter((l) => new Date(l.date).getTime() >= since);
  if (!r.length) r = [db.loads.slice().sort((a, b) => new Date(b.date) - new Date(a.date))[0]];
  return r.reduce((a, l) => a + l.total, 0) / r.reduce((a, l) => a + l.liters, 0);
}
const diffTxt = (est, real) => { const d = (est / real - 1) * 100; return Math.abs(d) < 1 ? 'casi exacto' : (d > 0 ? '+' : '−') + fmt(Math.abs(d), 0) + ' %'; };

/* ---------- Pantalla "Mis viajes" ---------- */
function renderTrips() {
  const body = $('#trips-body');
  const c = cfg();
  if (!db.trips.length) {
    body.innerHTML = `<div class="empty">${c.on ? 'Todavía no hay viajes registrados.' : 'El modo viaje está apagado. Activalo en Mi auto → Modo viaje.'}</div>`;
    return;
  }
  // Por tanque: viajes incluidos entre una carga llena y la siguiente
  const segs = segments().slice().reverse();
  const cur = currentTankId(), curLoad = db.loads.find((l) => l.id === cur);
  const tanks = [];
  if (curLoad) tanks.push({ label: 'Tanque actual (en uso)', from: curLoad.date, to: '9999', kml: null });
  segs.slice(0, 6).forEach((g) => tanks.push({ label: `${esc(g.fromName)} · ${shortDate(g.fromDate)}`, from: g.fromDate, to: g.date, kml: g.kml }));
  const tankHtml = tanks.map((tk) => {
    const s = aggregate(tripsInRange(tk.from, tk.to));
    if (s.km < 1) return '';
    const sc = score(s);
    return `<div class="card col gap8">
      <div class="row between center"><span class="b6 small">${tk.label}</span>${tk.kml ? `<span class="b6">${fmt(tk.kml, 1)} km/l</span>` : '<span class="muted xs">midiendo…</span>'}</div>
      ${(() => { const e = estKml(tripsInRange(tk.from, tk.to)); if (!e) return '';
        return tk.kml ? `<span class="small">Estimado por tus viajes: <b>${fmt(e, 1)} km/l</b> · real ${fmt(tk.kml, 1)} (${diffTxt(e, tk.kml)})</span>`
          : `<span class="small">Estimado hasta ahora: <b>${fmt(e, 1)} km/l</b> · se compara en la próxima carga</span>`; })()}
      ${bandBar(s)}
      <div class="grid3">
        <div class="col gap2"><span class="muted xs">Puntaje</span><span class="b6">${sc ?? '—'}/100</span></div>
        <div class="col gap2"><span class="muted xs">Arranques fuertes</span><span class="b6">${s.hardStarts + s.hardAccel}</span></div>
        <div class="col gap2"><span class="muted xs">Frenadas bruscas</span><span class="b6">${s.hardBrakes}</span></div>
      </div>
      <span class="muted xs">${fmt(s.km, 0)} km registrados · ${Math.round(s.idleSec / 60)} min detenido · máx. ${Math.round(s.maxKmh)} km/h</span>
      ${tips(s).map((t) => `<span class="xs">💡 ${t}</span>`).join('')}
    </div>`;
  }).join('');

  const kindLabel = { auto: '🚗 Auto', bici: '🚲 Bici', 'a pie': '🚶 A pie' };
  const list = db.trips.slice(0, 60).map((t) => {
    const d = new Date(t.start), min = Math.round((new Date(t.end) - d) / 60000);
    const s = aggregate([t]);
    return `<div class="card col gap8 ${t.include ? '' : 'trip-off'}">
      <div class="row between center gap8">
        <span class="col gap2"><span class="b6 small">${d.getDate()} ${MONTHS[d.getMonth()]} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}</span>
        <span class="muted xs">${kindLabel[t.kind] || ''} · ${fmt(t.km, 1)} km · ${min} min · máx. ${Math.round(t.maxKmh)} km/h</span></span>
        <button class="del" data-tdel="${t.id}" aria-label="Borrar viaje"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg></button>
      </div>
      ${(() => { if (t.kind !== 'auto') return ''; const e = estKml([t]); if (!e) return ''; const l = t.km / e, ppl = recentPpl();
        return `<span class="small">Consumo estimado: <b>${fmt(e, 1)} km/l</b> · ${fmt(l, 1)} l${ppl ? ' · ' + money(l * ppl) : ''}${score(s) != null ? ' · puntaje ' + score(s) + '/100' : ''}</span>`; })()}
      ${bandBar(s)}
      ${t.track && t.track.length > 3 ? `<button class="link left" data-tview="${t.id}" style="padding:0;min-height:36px">Ver recorrido y consumo instantáneo ›</button>` : ''}
      <label class="row center gap10 xs" style="cursor:pointer"><input type="checkbox" data-tinc="${t.id}" ${t.include ? 'checked' : ''} style="width:20px;height:20px;accent-color:#0B6E5A"> Manejé yo este auto (contar en la evaluación)</label>
    </div>`;
  }).join('');

  body.innerHTML = (tankHtml ? `<h2 class="h2">Por tanque</h2>${tankHtml}` : '') + `<h2 class="h2">Viajes</h2>${list}`;
  body.querySelectorAll('[data-tview]').forEach((b) => b.onclick = () => { tripView = b.dataset.tview; go('trip'); });
  body.querySelectorAll('[data-tinc]').forEach((cb) => cb.onchange = () => { const t = db.trips.find((x) => x.id === cb.dataset.tinc); t.include = cb.checked; save(); renderTrips(); });
  body.querySelectorAll('[data-tdel]').forEach((b) => b.onclick = () => sheet('¿Borrar este viaje?', '<p class="muted small" style="margin:0">No se puede deshacer.</p>',
    [{ label: 'Borrar', primary: true, run: () => { db.trips = db.trips.filter((x) => x.id !== b.dataset.tdel); save(); renderTrips(); } }, { label: 'Cancelar' }]));
}

/* ---------- Detalle de un viaje: mapa coloreado + velocidad + consumo instantáneo ---------- */
let tripView = null, tmap = null, tLayer = null;
function instColor(kml, K) { // verde = rinde más que tu promedio; rojo = mucho menos
  if (kml == null) return '#9AA6AE';
  return kml >= K * 1.15 ? '#0B6E5A' : kml >= K * 0.85 ? '#5BA48F' : kml >= K * 0.55 ? '#E8A33D' : '#D6001C';
}
function renderTripDetail() {
  const t = db.trips.find((x) => x.id === tripView);
  const body = $('#trip-body');
  if (!t || !t.track || t.track.length < 4) { body.innerHTML = '<div class="empty">Este viaje no tiene recorrido guardado.</div>'; return; }
  const ser = trackSeries(t.track), ref = vspRef() || (ser.km / ser.liters), K = baseK(), scale = K / ref;
  const est = estKml([t]), ppl = recentPpl(), d = new Date(t.start);
  // km/l instantáneo de cada tramo (escalado a tu rendimiento real); detenido = sin dato
  // km/l instantáneo suavizado: ventana de ~8 s (4 lecturas) para quitar el "ruido" del GPS, como el display del auto
  const pts = ser.pts.map((p, i, arr) => {
    if (p.v < 1) return { ...p, kml: null };
    let d = 0, ml = 0;
    for (let j = Math.max(0, i - 2); j <= Math.min(arr.length - 1, i + 1); j++) { d += arr[j].d; ml += arr[j].ml; }
    return { ...p, kml: Math.min(40, (d / 1000) / (ml / 1000) * scale) };
  });
  body.innerHTML = `
    <div class="card col gap6">
      <span class="b6">${d.getDate()} ${MONTHS[d.getMonth()]} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} · ${fmt(t.km, 1)} km · ${Math.round((new Date(t.end) - d) / 60000)} min</span>
      <span class="small">Consumo estimado <b>${est ? fmt(est, 1) + ' km/l' : '—'}</b>${est && ppl ? ' · ' + money(t.km / est * ppl) : ''} · puntaje ${score(aggregate([t])) ?? '—'}/100</span>
    </div>
    <div class="trip-map-wrap"><div id="trip-map"></div></div>
    <div class="row gap10 xs muted" style="flex-wrap:wrap"><span><b style="color:#0B6E5A">━</b> rinde más que tu promedio</span><span><b style="color:#5BA48F">━</b> normal</span><span><b style="color:#E8A33D">━</b> gasta más</span><span><b style="color:#D6001C">━</b> gasta mucho (aceleración)</span><span><b style="color:#9AA6AE">━</b> detenido</span></div>
    <div class="card col gap6"><span class="b6">Velocidad (km/h)</span>${seriesChart(pts, (p) => p.v * 3.6, null, '#14212B')}</div>
    <div class="card col gap6"><span class="b6">Consumo instantáneo (km/l)</span>${seriesChart(pts, (p) => p.kml, K, null, K)}
      <span class="muted xs">La línea punteada es tu promedio (${fmt(K, 1)} km/l). Las caídas fuertes son aceleraciones; los huecos, momentos detenido (gasta en ralentí sin avanzar).</span></div>`;
  // Mapa
  setTimeout(() => {
    if (typeof L === 'undefined') return;
    if (tmap) { tmap.remove(); tmap = null; }
    tmap = L.map('trip-map', { zoomControl: false, attributionControl: false });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(tmap);
    pts.forEach((p) => L.polyline([[p.la0, p.lo0], [p.la1, p.lo1]], { color: instColor(p.kml, K), weight: 6, opacity: .9, interactive: false }).addTo(tmap));
    const tr = t.track, a = tr[0], z = tr[tr.length - 1];
    L.circleMarker([a[1], a[2]], { radius: 7, color: '#fff', weight: 3, fillColor: '#0B6E5A', fillOpacity: 1 }).addTo(tmap).bindTooltip('Inicio');
    L.circleMarker([z[1], z[2]], { radius: 7, color: '#fff', weight: 3, fillColor: '#14212B', fillOpacity: 1 }).addTo(tmap).bindTooltip('Fin');
    tmap.fitBounds(tr.map((q) => [q[1], q[2]]), { padding: [24, 24] });
  }, 450);
}
// Gráfico de línea a lo largo del tiempo (minutos). colorBy: si se da K, colorea cada tramo como el mapa
function seriesChart(pts, val, avg, color, K) {
  const W = 326, H = 120, L0 = 26, B = 18, T = 8;
  const step = Math.max(1, Math.ceil(pts.length / 300)), sp = pts.filter((_, i) => i % step === 0);
  const vals = sp.map(val).filter((x) => x != null);
  if (!vals.length) return '<span class="muted xs">Sin datos.</span>';
  const hi = Math.max(avg || 0, ...vals) * 1.08, tEnd = sp[sp.length - 1].t || 1;
  const x = (t) => L0 + t / tEnd * (W - L0 - 4), y = (v) => T + (1 - v / hi) * (H - T - B);
  let segs = '';
  for (let i = 1; i < sp.length; i++) {
    const a = val(sp[i - 1]), b = val(sp[i]);
    if (a == null || b == null) continue;
    segs += `<line x1="${x(sp[i - 1].t).toFixed(1)}" y1="${y(a).toFixed(1)}" x2="${x(sp[i].t).toFixed(1)}" y2="${y(b).toFixed(1)}" stroke="${color || instColor(b, K)}" stroke-width="2.2" stroke-linecap="round"/>`;
  }
  const ticks = [0, hi / 2, hi].map((v) => `<line x1="${L0}" x2="${W}" y1="${y(v)}" y2="${y(v)}" stroke="#EEF2EF"/><text x="${L0 - 4}" y="${y(v) + 3}" font-size="9" fill="#5A6772" text-anchor="end">${Math.round(v)}</text>`).join('');
  const mins = Math.round(tEnd / 60);
  return `<svg class="tchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico a lo largo del viaje">${ticks}
    ${avg ? `<line x1="${L0}" x2="${W}" y1="${y(avg)}" y2="${y(avg)}" stroke="#E8A33D" stroke-width="1.5" stroke-dasharray="4 4"/>` : ''}
    ${segs}<text x="${L0}" y="${H - 4}" font-size="9" fill="#5A6772">0 min</text><text x="${W}" y="${H - 4}" font-size="9" fill="#5A6772" text-anchor="end">${mins} min</text></svg>`;
}

/* ---------- Enganches con el resto de la app ---------- */
(function hook() {
  const rc = RENDER.car, rh = RENDER.history;
  RENDER.trip = () => renderTripDetail();
  RENDER.car = () => { rc(); renderTripSettings(); };
  RENDER.history = () => { rh(); $('#trips-link').classList.toggle('hidden', !(cfg().on || db.trips.length)); };
  if (!db.trips) db.trips = [];
  applyTripMode();
})();
