/* Mi Consumo — registro de cargas de combustible (PWA, fase 1: todo en el teléfono) */
'use strict';

/* ---------------- Datos y almacenamiento ---------------- */
const KEY = 'miconsumo.v1';
/* Países: cada uno con su base de estaciones, combustibles y moneda */
const COUNTRIES = {
  AR: { name: 'Argentina', center: [-34.6037, -58.3816], file: 'stations.json', cur: 'ARS', fuels: ['Súper', 'Premium', 'Diésel', 'GNC'] },
  ES: { name: 'España', center: [40.4168, -3.7038], file: 'estaciones-ES.json', cur: 'EUR', fuels: ['Gasolina 95', 'Gasolina 98', 'Diésel', 'Diésel+', 'GLP'],
        priceIdx: { 'Gasolina 95': 0, 'Gasolina 98': 1, 'Diésel': 2, 'Diésel+': 3, 'GLP': 4 } },
  // Brasil: un archivo por estado (la app baja solo el de donde estás); todavía sin precios
  BR: { name: 'Brasil', center: [-23.5505, -46.6333], file: 'estaciones-BR.json', regional: true, cur: 'BRL',
        fuels: ['Gasolina', 'Gasolina aditivada', 'Etanol', 'Diesel S10', 'GNV'] }
};
let COUNTRY = 'AR';
let FUELS = COUNTRIES.AR.fuels;
// País según la posición GPS (cajas aproximadas; España incluye Baleares y Canarias)
// Contorno aproximado de Argentina (para no confundirla con el sur de Brasil, Uruguay o Paraguay)
const AR_POLY = [[-21.8, -66.2], [-22.0, -62.8], [-23.0, -61.0], [-24.0, -60.0], [-25.3, -57.65], [-27.3, -58.6], [-27.3, -56.0], [-26.9, -55.0],
  [-25.55, -54.62], [-25.6, -54.1], [-25.95, -53.75], [-26.25, -53.64], [-27.1, -53.8],
  [-28.0, -55.4], [-29.2, -56.7], [-30.2, -57.6], [-33.5, -58.4], [-34.6, -58.3], [-35.5, -57.0], [-41, -62.5], [-55.1, -66.4], [-55.0, -68.8],
  [-52.4, -69.0], [-52.3, -72.0], [-49, -73.6], [-46, -71.8], [-41, -71.9], [-36, -70.6], [-33, -70.0], [-28, -69.0], [-24, -67.3], [-22.0, -66.7]];
function inPoly(lat, lon, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ai, oi] = poly[i], [aj, oj] = poly[j];
    if ((oi > lon) !== (oj > lon) && lat < (aj - ai) * (lon - oi) / (oj - oi) + ai) inside = !inside;
  }
  return inside;
}
function countryAt(lat, lon) {
  if (inPoly(lat, lon, AR_POLY)) return 'AR';
  if ((lat > 35.8 && lat < 43.9 && lon > -9.5 && lon < 4.4) || (lat > 27.5 && lat < 29.5 && lon > -18.3 && lon < -13.3)
    || (lat > 35.1 && lat < 35.95 && lon > -5.5 && lon < -2.8)) return 'ES'; // + Ceuta y Melilla
  if (lat > -33.8 && lat < 5.3 && lon > -74 && lon < -34.7 && !(lat < -30.2 && lon < -53.5)) return 'BR'; // (sin Uruguay)
  return null;
}
const BRANDS = ['YPF', 'Shell', 'Axion', 'Puma', 'Blanca', 'Dapsa', 'Gulf', 'Refinor', 'VOY', 'Otra'];

const blank = () => ({
  car: { brand: '', model: '', year: '', tank: '' },
  loads: [],            // cargas registradas
  lastFuel: null,       // último combustible elegido
  userStations: [],     // estaciones agregadas por el usuario (sobreviven a nuevas versiones de la base)
  corrections: {},      // id -> {lat, lon, date}: posiciones corregidas por el usuario
  suggestions: [],      // cola de sugerencias para enviar a la base compartida
  // Nube (fase 2)
  carId: null, dirty: [], tombstones: [], lastPull: null, carDirty: false, shareStats: true,
  overrides: [], nickname: '',
  // Modo viaje (fase 3): apagado por defecto
  trips: [], tripCfg: { on: false, mode: 'manual', sensor: true },
  // Varios autos: el activo usa los campos de arriba; los demás quedan guardados en garage
  carMeta: null, garage: []
});
// Marca una carga como cambiada para subirla a la nube en la próxima sincronización
function markDirty(id) { if (!db.dirty.includes(id)) db.dirty.push(id); }
const cloudSoon = () => { if (typeof cloudSync === 'function') setTimeout(cloudSync, 300); };

let db = load();
function load() {
  let d;
  try { d = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY)) || {}); }
  catch (e) { d = blank(); }
  if (d.car && !d.car.fuel && d.lastFuel) d.car.fuel = d.lastFuel; // combustible habitual del auto
  if (!d.carMeta) d.carMeta = { key: 'c-' + Date.now().toString(36), kind: 'own', country: d.lastCountry || 'AR', archived: false, lastUsed: Date.now(), seenIn: [] };
  return d;
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); }
  catch (e) { toast('No se pudo guardar en el teléfono.'); }
}

let STATIONS = [];        // base oficial + correcciones + estaciones propias
let stationsVersion = '';
let officialCount = 0;
let pricesDate = '';
let loadedRegions = [], regionIdx = null; // Brasil: estados cargados
// Estados con estaciones en tu cuadrado de 1° y los de alrededor (el más cercano si no hay ninguno)
function regionsFor(idx, p) {
  const la = Math.floor(p.lat), lo = Math.floor(p.lon), out = [];
  const add = (k) => (idx.cells[k] || []).forEach((u) => { if (!out.includes(u)) out.push(u); });
  add(la + ',' + lo);
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) add((la + a) + ',' + (lo + b));
  if (!out.length) {
    const near = Object.keys(idx.cells).map((k) => { const [a, b] = k.split(',').map(Number); return [k, Math.hypot(a + 0.5 - p.lat, b + 0.5 - p.lon)]; }).sort((x, y) => x[1] - y[1])[0];
    if (near) add(near[0]);
  }
  return out.slice(0, 4);
}
async function loadStations(code, pos) {
  code = code || (db.country && db.country !== 'auto' ? db.country : (db.lastCountry || 'AR'));
  const C = COUNTRIES[code] || COUNTRIES.AR;
  COUNTRY = COUNTRIES[code] ? code : 'AR'; FUELS = C.fuels; db.lastCountry = COUNTRY;
  if (!FUELS.includes(db.lastFuel)) db.lastFuel = null;
  try {
    let rows = [];
    loadedRegions = [];
    if (C.regional) {
      // Índice de estados → bajamos solo los que rodean tu posición
      const idx = await (await fetch(C.file)).json();
      const p = pos || { lat: C.center[0], lon: C.center[1] };
      const pick = regionsFor(idx, p);
      for (const uf of pick) {
        const d = await (await fetch(C.file.replace('.json', '-' + uf + '.json'))).json();
        rows = rows.concat(d.rows); loadedRegions.push(uf);
      }
      regionIdx = idx;
      stationsVersion = idx.version; pricesDate = '';
    } else {
      const res = await fetch(C.file);
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      stationsVersion = data.version; pricesDate = data.pricesDate || '';
      rows = data.rows;
    }
    officialCount = rows.length;
    STATIONS = rows.map((r) => ({ id: r[0], brand: r[1], address: r[2], city: r[3], province: r[4], lat: r[5], lon: r[6], prices: r[7] && r[7].length ? r[7] : null }));
  } catch (e) {
    STATIONS = []; stationsVersion = ''; officialCount = 0;
    toast(`No se pudo cargar la base de estaciones de ${C.name}.`);
  }
  mergeUserLayer();
  if (typeof draft !== 'undefined' && !FUELS.includes(draft.fuel)) draft.fuel = prefFuel();
}
// Si el país está en "automático" y el GPS dice que estás en otro, cambia de base
async function ensureCountryFor(pos) {
  if (!db.country || db.country === 'auto') {
    const c = countryAt(pos.lat, pos.lon);
    if (c && c !== COUNTRY) {
      toast(`Estás en ${COUNTRIES[c].name}: cargando sus estaciones…`);
      await loadStations(c, pos); save();
      if (typeof askCarFor === 'function') askCarFor(c, false);
      return true;
    }
  }
  // Brasil: si te moviste a otro estado, bajamos el de ahí
  if (COUNTRIES[COUNTRY].regional && regionIdx && regionsFor(regionIdx, pos).slice(0, 2).some((u) => !loadedRegions.includes(u))) {
    if (ensureCountryFor.busy) return false;
    ensureCountryFor.busy = true;
    try { await loadStations(COUNTRY, pos); } finally { ensureCountryFor.busy = false; }
    return true;
  }
  return false;
}
function mergeUserLayer() {
  STATIONS = STATIONS.filter((s) => !s.mine && !s.ov);
  // Cambios aprobados para todos (vienen de la nube): mueven estaciones existentes o agregan nuevas
  const byId = new Map(STATIONS.map((s) => [s.id, s]));
  const ovIds = new Set();
  for (const o of db.overrides || []) {
    ovIds.add(o.station_id);
    const s = byId.get(o.station_id);
    if (s) { s.lat = o.lat; s.lon = o.lon; if (o.brand) s.brand = o.brand; if (o.address) s.address = o.address; if (o.city) s.city = o.city; }
    else STATIONS.push({ id: o.station_id, brand: o.brand || 'Otra', address: o.address || '', city: o.city || '', province: o.province || '', lat: o.lat, lon: o.lon, ov: true });
  }
  for (const s of STATIONS) {
    const c = db.corrections[s.id];
    if (c) { s.lat = c.lat; s.lon = c.lon; s.corrected = true; }
  }
  for (const u of db.userStations) if (!ovIds.has(u.id)) STATIONS.push(Object.assign({ mine: true }, u));
  for (const s of STATIONS) s.key = norm([s.brand, s.address, s.city, s.province].join(' '));
}

/* ---------------- Utilidades ---------------- */
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const fmt = (n, d = 0) => Number(n).toLocaleString(locale(), { minimumFractionDigits: d, maximumFractionDigits: d });
// Moneda: pesos sin decimales; euros con 2 (o 3 para precio por litro)
const curOf = (cur) => cur || COUNTRIES[COUNTRY].cur;
const money = (n, cur) => (curOf(cur) === 'EUR' ? fmt(n, n < 10 ? (n < 3 ? 3 : 2) : 2) + ' €'
  : curOf(cur) === 'BRL' ? 'R$ ' + fmt(n, n < 100 ? 2 : 0) : '$ ' + fmt(Math.round(n)));
const CUR_SYM = { ARS: '$', EUR: '€', BRL: 'R$' };
const sameCur = (l) => (l.cur || 'ARS') === COUNTRIES[COUNTRY].cur;
const shortDate = (iso) => { const d = new Date(iso); return LANG === 'en' ? monthNames()[d.getMonth()] + ' ' + d.getDate() : d.getDate() + ' ' + monthNames()[d.getMonth()]; };

// Acepta "40,5", "40.5", "56.700", "56700"
function parseNum(s) {
  s = String(s || '').replace(/\s|\$/g, '');
  if (!s) return NaN;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  return parseFloat(s);
}
function distM(a, b) {
  const R = 6371000, toR = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toR, dLon = (b.lon - a.lon) * toR;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
const distTxt = (m) => (m < 1000 ? Math.round(m / 10) * 10 + ' m' : fmt(m / 1000, m < 10000 ? 1 : 0) + ' km');
const brandAbbr = (b) => ({ Shell: 'SH', Axion: 'AX', Puma: 'PU', Blanca: 'BL', Dapsa: 'DA', Gulf: 'GU', Refinor: 'RE' }[b] || String(b || '?').slice(0, 3).toUpperCase());
const stationLabel = (s) => s.brand + ' · ' + s.address;

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.add('hidden'), 3200);
}
function sheet(title, bodyHtml, actions) {
  $('#sheet-title').textContent = title;
  $('#sheet-body').innerHTML = bodyHtml;
  const box = $('#sheet-actions'); box.innerHTML = '';
  actions.forEach((a) => {
    const b = document.createElement('button');
    b.className = a.primary ? 'next' : 'btn2';
    b.textContent = a.label;
    b.onclick = () => { if (a.run && a.run() === false) return; closeSheet(); };
    box.appendChild(b);
  });
  $('#sheet-bg').classList.remove('hidden');
}
function closeSheet() { $('#sheet-bg').classList.add('hidden'); }
$('#sheet-bg').addEventListener('click', (e) => { if (e.target.id === 'sheet-bg') closeSheet(); });

/* ---------------- Cálculo de consumo (tanque lleno a tanque lleno) ---------------- */
// Cada carga con tanque lleno cierra un tramo: km desde la carga llena anterior ÷ litros cargados desde entonces.
function segments(list) {
  const loads = (list || db.loads).slice().sort((a, b) => a.odo - b.odo);
  const out = [];
  let prevFull = null, liters = 0, cost = 0;
  for (const l of loads) {
    if (prevFull) { liters += l.liters; cost += l.total; }
    if (l.full) {
      if (prevFull && liters > 0) {
        const km = l.odo - prevFull.odo;
        // El consumo de este tramo corresponde al combustible cargado en la carga llena ANTERIOR (prevFull)
        if (km > 0) out.push({ loadId: l.id, date: l.date, fromId: prevFull.id, fromName: prevFull.stationName, fromStation: prevFull.stationId,
          fromDate: prevFull.date, fromFuel: prevFull.fuel, km, liters, cost, kml: km / liters });
      }
      prevFull = l; liters = 0; cost = 0;
    }
  }
  return out;
}
function summary(segs) {
  const km = segs.reduce((a, s) => a + s.km, 0);
  const liters = segs.reduce((a, s) => a + s.liters, 0);
  const cost = segs.reduce((a, s) => a + s.cost, 0);
  return { km, liters, cost, kml: liters ? km / liters : null, cpk: km ? cost / km : null };
}
// Costo por km a precios de HOY: precio promedio por litro de los últimos 30 días ÷ rendimiento promedio.
// (Con inflación de 2-3 % mensual, promediar todo el historial subestima el costo actual.)
function currentCpk() {
  const kml = summary(segments()).kml;
  if (!kml || !db.loads.length) return null;
  const since = Date.now() - 30 * 864e5;
  const mine = db.loads.filter(sameCur);
  if (!mine.length) return null;
  let recent = mine.filter((l) => new Date(l.date).getTime() >= since);
  if (!recent.length) recent = [mine.slice().sort((a, b) => new Date(b.date) - new Date(a.date))[0]]; // sin cargas en el mes: la última
  const ppl = recent.reduce((a, l) => a + l.total, 0) / recent.reduce((a, l) => a + l.liters, 0);
  return ppl / kml;
}
const lastOdo = () => db.loads.reduce((m, l) => Math.max(m, l.odo), 0);
// Límites del kilometraje según la fecha: mayor que las cargas anteriores, menor que las posteriores
const dayOf = (iso) => { const d = new Date(iso); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
function odoBounds(day) {
  let lo = 0, hi = Infinity, prev = null;
  for (const l of db.loads) {
    if (dayOf(l.date) <= day) { if (l.odo > lo) { lo = l.odo; prev = l; } }
    else hi = Math.min(hi, l.odo);
  }
  return { lo, hi, prev };
}

/* ---------------- Navegación ---------------- */
const SCREENS = { home: 's-home', step1: 's-step1', step2: 's-step2', step3: 's-step3', done: 's-done', history: 's-history', car: 's-car', trips: 's-trips', trip: 's-trip' };
const ORDER = ['home', 'step1', 'step2', 'step3', 'done', 'history', 'trips', 'trip', 'car'];
let current = null;
function go(name) {
  const back = current && ORDER.indexOf(name) < ORDER.indexOf(current);
  const next = document.getElementById(SCREENS[name]);
  if (current) {
    const prev = document.getElementById(SCREENS[current]);
    prev.classList.remove('active');
    prev.classList.toggle('back-anim', !back);
  }
  next.classList.toggle('back-anim', back);
  void next.offsetWidth;
  next.classList.add('active');
  next.classList.remove('back-anim');
  if (current === 'step1' && name !== 'step1') stopLive();
  current = name;
  renderTabbars();
  (RENDER[name] || (() => {}))();
  const sc = next.querySelector('.scroll'); if (sc) sc.scrollTop = 0;
}
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-go]');
  if (!t) return;
  const dest = t.dataset.go;
  if (dest === 'step1' && current === 'home') draft = newDraft();
  go(dest);
});

const TAB_ICONS = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  history: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  car: '<path d="M5 17h14v-5l-2-5H7l-2 5z"/><circle cx="8" cy="17" r="2"/><circle cx="16" cy="17" r="2"/>'
};
TAB_ICONS.trips = '<path d="M3 17l5-5 4 3 8-8"/><path d="M15 7h5v5"/>';
// Barra de abajo: la pestaña "Viajes" aparece solo si el modo viaje está activo o hay viajes guardados
function renderTabbars() {
  const showTrips = !!((db.tripCfg && db.tripCfg.on) || (db.trips && db.trips.length));
  const tabs = [['home', 'Inicio'], ['history', 'Historial']].concat(showTrips ? [['trips', 'Viajes']] : []).concat([['car', 'Mis autos']]);
  $$('.tabbar').forEach((nav) => {
    const here = nav.closest('.screen').dataset.nav;
    nav.style.gridTemplateColumns = `repeat(${tabs.length}, minmax(0, 1fr))`;
    nav.innerHTML = tabs.map(([k, lab]) =>
      `<button data-go="${k}" class="${k === here ? 'on' : ''}" ${k === here ? 'aria-current="page"' : ''}><svg viewBox="0 0 24 24" aria-hidden="true">${TAB_ICONS[k]}</svg>${lab}</button>`).join('');
  });
}
renderTabbars();

/* ---------------- Borrador de la carga en curso ---------------- */
const todayStr = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
// Combustible por defecto: el habitual del auto; si no, el último elegido
const prefFuel = () => (FUELS.includes(db.car.fuel) ? db.car.fuel : FUELS.includes(db.lastFuel) ? db.lastFuel : FUELS[0]);
const newDraft = () => ({ date: todayStr(), manualPick: false, station: null, fuel: prefFuel(), liters: '', total: '', full: true, odo: '', pos: null });
let draft = newDraft();

/* ---------------- INICIO ---------------- */
function renderHome() {
  const car = db.car;
  $('#hello').textContent = typeof cloudUserName === 'function' && cloudUserName() ? '¡Hola, ' + cloudUserName() + '!' : '¡Hola!';
  $('#car-chip-name').textContent = car.model ? [car.model, car.year].filter(Boolean).join(' ') : 'Mi auto';
  const segs = segments();
  const all = summary(segs);
  const hero = $('#hero');
  if (segs.length) {
    const last = segs[segs.length - 1];
    const diff = all.kml ? last.kml - all.kml : 0;
    const pts = segs.slice(-8).map((s) => s.kml);
    hero.innerHTML = `
      <div class="row between center gap8">
        <span class="lbl">Último tanque medido</span>
        ${segs.length > 1 ? `<span class="delta">${Math.abs(diff) < 0.05 ? '= promedio' : (diff > 0 ? '▲ ' : '▼ ') + fmt(Math.abs(diff), 1) + ' vs. promedio'}</span>` : ''}
      </div>
      <div class="row center gap12">
        <div class="row baseline gap6" style="flex-shrink:0"><span class="big">${fmt(last.kml, 1)}</span><span class="unit">km/l</span></div>
        <div class="grow" style="min-width:0">${pts.length > 1 ? spark(pts) : ''}</div>
      </div>
      <span class="lbl ellipsis">Combustible de ${esc(last.fromName)} (${shortDate(last.fromDate)})</span>`;
  } else {
    hero.innerHTML = `
      <span class="lbl">Bienvenido</span>
      <span style="font-family:Outfit,sans-serif;font-size:22px;font-weight:700;line-height:1.25">Registrá cada carga y te mostramos cuánto rinde tu auto.</span>
      <span class="lbl">Tip: empezá con el tanque lleno. Desde la siguiente carga completa ya vas a ver tu consumo.</span>`;
  }
  const cpk = currentCpk();
  $('#st-cpk').textContent = cpk ? money(cpk) : '—';
  const now = new Date();
  const month = db.loads.filter((l) => { const d = new Date(l.date); if (!sameCur(l)) return false; return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
    .reduce((a, l) => a + l.total, 0);
  $('#st-month').textContent = month ? money(month) : '$ 0';

  const segBy = Object.fromEntries(segs.map((s) => [s.fromId, s]));
  const inUse = currentTankId();
  const recent = db.loads.slice().sort((a, b) => b.odo - a.odo).slice(0, 3);
  $('#recent').innerHTML = recent.length ? recent.map((l) => loadRow(l, segBy[l.id], l.id === inUse)).join('')
    : '<div class="empty">Todavía no registraste cargas.</div>';
  if (typeof renderTripChip === 'function') renderTripChip();
}
// Carga llena más reciente: su combustible todavía se está usando, el consumo se conoce en la próxima carga llena
function currentTankId() {
  const fulls = db.loads.filter((l) => l.full).sort((a, b) => b.odo - a.odo);
  return fulls.length ? fulls[0].id : null;
}
function loadRow(l, seg, inUse) {
  return `<div class="load">
    ${brandBox(l.brand)}
    <div class="col gap2" style="min-width:0">
      <span class="t ellipsis">${esc(l.stationName)}</span>
      <span class="s">${shortDate(l.date)} · ${fmt(l.liters, 1)} l · ${esc(tr(l.fuel))}${l.full ? '' : ' · ' + tr('parcial')}</span>
    </div>
    <span class="v">${seg ? fmt(seg.kml, 1) + ' km/l' : inUse ? '<span class="muted xs b6">en uso</span>' : money(l.total)}</span>
  </div>`;
}
function spark(vals) {
  const w = 350, h = 64, min = Math.min(...vals), max = Math.max(...vals), span = max - min || 1;
  const p = vals.map((v, i) => [6 + i * (w - 12) / (vals.length - 1), h - 8 - (v - min) / span * (h - 20)]);
  const last = p[p.length - 1];
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="Tendencia de consumo de los últimos tanques">
    <polyline class="spark" points="${p.map((q) => q.map((n) => n.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="#F2B85B" stroke-width="3" vector-effect="non-scaling-stroke"/>
    <circle cx="${last[0]}" cy="${last[1]}" r="5" fill="#F2B85B"/></svg>`;
}

/* ---------------- PASO 1: ubicación ---------------- */
let nearList = [];
// Filtro por bandera (por país): lista vacía = todas
const brandFilter = () => ((db.brandFilter || {})[COUNTRY] || []);
const brandOk = (s) => { const f = brandFilter(); return !f.length || f.includes(s.brand) || (draft.station && draft.station.id === s.id); };
function updateBrandChip() {
  const bc = $('#brand-chip'); if (!bc) return;
  const f = brandFilter();
  bc.textContent = 'Bandera: ' + (!f.length ? 'todas' : f.length <= 2 ? f.join(', ') : f.length + ' elegidas') + ' ▾';
  bc.classList.toggle('on', !!f.length);
}
function pickBrands() {
  const cnt = {};
  STATIONS.forEach((s) => { cnt[s.brand] = (cnt[s.brand] || 0) + 1; });
  const brands = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]).slice(0, 24), f = brandFilter();
  sheet('¿Qué banderas querés ver?', `<div class="brandgrid">${brands.map((b) => {
    return `<label class="brandopt"><input type="checkbox" value="${esc(b)}" ${f.includes(b) ? 'checked' : ''}>${brandBox(b)}<span class="small b6 ellipsis">${esc(b)}</span></label>`;
  }).join('')}</div><span class="muted xs">Sin ninguna marcada se ven todas.</span>`,
  [{ label: 'Aplicar', primary: true, run: () => {
      db.brandFilter = db.brandFilter || {};
      db.brandFilter[COUNTRY] = $$('.brandopt input:checked').map((i) => i.value); save();
      updateBrandChip(); updateVisible();
    } },
   { label: 'Ver todas', run: () => { db.brandFilter = db.brandFilter || {}; db.brandFilter[COUNTRY] = []; save(); updateBrandChip(); updateVisible(); } }]);
}
document.addEventListener('click', (e) => { if (e.target.closest('#brand-chip')) pickBrands(); });
function updateCountryChip() {
  updateBrandChip();
  const cc = $('#country-chip');
  if (cc) { cc.textContent = 'País: ' + (db.country && db.country !== 'auto' ? COUNTRIES[db.country].name : 'automático (' + COUNTRIES[COUNTRY].name + ')') + ' ▾'; }
}
function renderStep1() {
  updateCountryChip();
  hideHere();
  $('#search-box').classList.add('hidden');
  $('#search-input').value = '';
  $('#search-list').innerHTML = '';
  updateNext1();
  if (db.country && db.country !== 'auto' && typeof askCarFor === 'function') askCarFor(db.country, true);
  if (!navigator.geolocation) { gpsFailed('Este navegador no permite usar el GPS.'); return; }
  if (draft.pos) showNear();
  else {
    $('#gps-msg').textContent = 'Buscando tu ubicación…';
    $('#near-list').innerHTML = '<div class="empty">Buscando estaciones cercanas…</div>';
    $('#map-wrap').classList.add('hidden'); updateRoute();
  }
  startLive();
}
/* GPS en vivo: mientras estás en el Paso 1, el mapa y la lista se actualizan a medida que te movés */
let watchId = null, lastLive = 0, userPanned = false, lastFix = null, speedNow = 0, wasMoving = false;
// Zoom según la velocidad, como un navegador: más rápido = más alejado, despacio = más cerca
function startLive() {
  stopLive();
  userPanned = false;
  watchId = navigator.geolocation.watchPosition(onLivePos,
    (err) => { if (!draft.pos) gpsFailed(err.code === 1 ? 'Sin permiso para usar el GPS. Podés buscar la estación a mano.' : 'No pudimos ubicarte. Buscá la estación a mano.'); },
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 3000 });
}
function stopLive() { if (watchId != null) { navigator.geolocation.clearWatch(watchId); watchId = null; } if (lmap) setRotation(null); lastHeading = null; lastFix = null; speedNow = 0; wasMoving = false; $('#drive-warn').classList.add('hidden'); }
function onLivePos(p) {
  const np = { lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy };
  // Velocidad: la del GPS, o calculada entre dos lecturas. Más de ~12 km/h = vas manejando
  let speed = p.coords.speed;
  if ((speed == null || isNaN(speed)) && lastFix) { const dt = (p.timestamp - lastFix.t) / 1000; if (dt > 0) speed = distM(lastFix, np) / dt; }
  // Rumbo: el del GPS, o calculado entre dos lecturas separadas al menos 10 m
  let heading = p.coords.heading;
  if ((heading == null || isNaN(heading)) && lastFix && distM(lastFix, np) > 10) heading = bearing(lastFix, np);
  if (heading != null && !isNaN(heading)) lastHeading = heading;
  lastFix = { lat: np.lat, lon: np.lon, t: p.timestamp };
  if (speed != null && !isNaN(speed)) { speedNow = speed; if (speed > 1.5) wasMoving = true; $('#drive-warn').classList.toggle('hidden', speed < 3.3); }
  // País elegido a mano y el GPS está en otro: se simula la ubicación (tocando el mapa)
  if (db.country && db.country !== 'auto' && countryAt(np.lat, np.lon) !== db.country) {
    if (!draft.pos) { draft.simulated = true; const c = COUNTRIES[db.country].center; draft.pos = { lat: c[0], lon: c[1], acc: 30 }; showNear(); }
    return;
  }
  if (draft.simulated) return;
  if (!draft.pos) { draft.pos = np; lastLive = Date.now(); showNear(); const c = countryAt(np.lat, np.lon); if (c && typeof askCarFor === 'function') askCarFor(c, false); return; }
  const moved = distM(draft.pos, np);
  if (moved < 8 && Date.now() - lastLive < 10000) return; // sin cambios relevantes
  draft.pos = np; lastLive = Date.now();
  liveUpdate();
}
function liveUpdate() {
  const pos = draft.pos;
  const nearest = STATIONS.map((s) => ({ s, d: distM(pos, s) })).sort((a, b) => a.d - b.d)[0];
  const close = Math.max(60, Math.min(pos.acc || 0, 100));
  const hereOn = !$('#here').classList.contains('hidden');
  if (!draft.manualPick && nearest && nearest.d <= close && speedNow < 2.5) { // solo si estás detenido o casi
    // Llegaste a una estación: mostramos la tarjeta "Estás en…"
    if (!hereOn || draft.station.id !== nearest.s.id) { showHere(nearest); if (navigator.vibrate) navigator.vibrate(120); }
    else $('#here-dist').textContent = (nearest.s.city ? nearest.s.city + ' · ' : '') + 'a ' + distTxt(nearest.d) + ' de vos';
    return;
  }
  if (hereOn && (!nearest || nearest.d > close)) { // te alejaste de la estación detectada
    draft.station = null; hideHere();
    initMap([]); updateNext1(); updateRoute();
    return;
  }
  if (!lmap) return;
  drawMe();
  if (!userPanned) {
    if (rotateOn && speedNow > 3.3 && lastHeading != null) setRotation(lastHeading);
    // Sin cambiar el zoom: con una estación elegida, que vos y ella sigan en pantalla; si no, solo seguirte
    if (draft.station) showBoth(false);
    else if (!lmap.getBounds().pad(-0.2).contains([pos.lat, pos.lon])) lmap.panTo([pos.lat, pos.lon], { animate: true });
  }
  else updateVisible();
  if (draft.station) drawRoute(false);
  if (!draft.station) $('#gps-msg').innerHTML = '<span class="live-dot"></span>Siguiendo tu ubicación en vivo. Tocá tu estación o esperá a llegar.';
}
function gpsFailed(msg) {
  hideHere();
  $('#map-wrap').classList.add('hidden'); updateRoute();
  $('#gps-msg').textContent = msg;
  // Sin GPS: mostrar las estaciones usadas recientemente
  const seen = new Set(), rec = [];
  db.loads.slice().sort((a, b) => b.odo - a.odo).forEach((l) => {
    if (seen.has(l.stationId)) return; seen.add(l.stationId);
    const s = STATIONS.find((x) => x.id === l.stationId); if (s) rec.push({ s, d: null });
  });
  nearList = rec.slice(0, 4);
  $('#near-title').textContent = nearList.length ? 'Usadas recientemente' : 'Buscá tu estación';
  renderOptions('#near-list', nearList);
  if (!nearList.length) $('#near-list').innerHTML = '';
  $('#search-box').classList.remove('hidden');
}
function showNear() {
  const pos = draft.pos;
  updateCountryChip();
  if (!showNear.busy) ensureCountryFor(pos).then((changed) => { if (changed) { showNear.busy = true; showNear(); showNear.busy = false; } });
  $('#gps-msg').innerHTML = draft.simulated
    ? `Estás fuera de ${COUNTRIES[db.country].name}: <b>tocá el mapa donde estás</b> (o buscá la estación).`
    : '<span class="live-dot"></span>Siguiendo tu ubicación en vivo. Tocá tu estación o esperá a llegar.';
  const nearest = STATIONS.map((s) => ({ s, d: distM(pos, s) })).sort((a, b) => a.d - b.d).slice(0, 3);
  // Si estás prácticamente en una estación (a pocos metros), preguntamos directamente
  const close = Math.max(60, Math.min(pos.acc || 0, 100));
  if (!draft.manualPick && (!draft.simulated || draft.simTapped) && nearest.length && nearest[0].d <= close) { showHere(nearest[0]); return; }
  hideHere();
  if (!draft.station && !draft.manualPick && (!draft.simulated || draft.simTapped) && nearest.length && nearest[0].d < 300) draft.station = nearest[0].s; // la más cercana, preseleccionada
  initMap(nearest.filter((x) => x.d < 5000));
  updateNext1(); updateRoute();
}
function renderOptions(sel, list) {
  const box = $(sel);
  // La estación elegida va primero, con el botón "Siguiente" en su misma fila
  if (draft.station) {
    const k = list.findIndex((x) => x.s.id === draft.station.id);
    if (k > 0) list.unshift(list.splice(k, 1)[0]);
  }
  box.innerHTML = list.map(({ s, d }, i) => `
    <div class="optwrap ${draft.station && draft.station.id === s.id ? 'on' : ''}">
    <button class="opt ${draft.station && draft.station.id === s.id ? 'sel' : ''}" data-i="${i}">
      <span class="dot"></span>
      <span class="col gap2" style="min-width:0">
        <span class="t">${brandBox(s.brand, 'bchip')}${s.mine ? '<span class="mine">TUYA</span>' : ''}</span>
        <span class="s ellipsis">${esc(s.address)} · ${esc(s.city)}</span>
      </span>
      <span class="col gap2" style="align-items:flex-end;margin-left:auto"><span class="d">${d == null ? '' : distTxt(d)}</span>${stationPrice(s, draft.fuel) ? `<span class="xs b6 accent">${money(stationPrice(s, draft.fuel))}</span>` : ''}</span>
    </button>
    ${draft.station && draft.station.id === s.id ? '<button class="next next-inline" type="button">Siguiente <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>' : ''}
    </div>`).join('');
  box.querySelectorAll('.opt').forEach((b) => b.onclick = () => pickStation(list[+b.dataset.i], sel !== '#near-list'));
  box.querySelectorAll('.next-inline').forEach((b) => b.onclick = () => go('step2'));
}
function pickStation(item, fromSearch) {
  draft.station = item.s;
  refreshSelection();
  updateNext1();
  // reordenar la lista (la elegida arriba, con Siguiente) y mostrar vos + la estación en el mapa
  renderOptions('#near-list', nearList);
  if (fromSearch) renderOptions('#search-list', searchList);
  showBoth(true); drawRoute(true);
  const nt = $('#near-title'); if (nt && !fromSearch) nt.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  // Elegida desde la búsqueda pero lejos de la posición registrada: ofrecer corregirla
  if (fromSearch && draft.pos && item.d != null && item.d > 400) {
    sheet('¿Corregimos la ubicación?',
      `<p class="muted small" style="margin:0">Según la base, <b class="ink">${esc(stationLabel(item.s))}</b> está a ${distTxt(item.d)} de donde estás ahora. Si estás en esa estación, guardamos tu posición como la correcta. La próxima vez la vas a encontrar por GPS.</p>`,
      [{ label: 'Sí, estoy acá: corregir ubicación', primary: true, run: () => correctStation(item.s) },
       { label: 'No, solo elegirla' }]);
  }
}
function refreshSelection() {
  $$('#s-step1 .opt').forEach((b) => b.classList.remove('sel'));
  [['#near-list', nearList], ['#search-list', searchList]].forEach(([sel, list]) => {
    $(sel).querySelectorAll('.opt').forEach((b) => { if (draft.station && list[+b.dataset.i] && list[+b.dataset.i].s.id === draft.station.id) b.classList.add('sel'); });
  });
  refreshPins(); updateRoute();
}
function correctStation(s) {
  const p = draft.pos;
  if (s.mine) {
    const u = db.userStations.find((x) => x.id === s.id); if (u) { u.lat = p.lat; u.lon = p.lon; }
  } else {
    db.corrections[s.id] = { lat: p.lat, lon: p.lon, date: new Date().toISOString() };
  }
  db.suggestions.push({ type: 'move', stationId: s.id, lat: p.lat, lon: p.lon, date: new Date().toISOString(), sent: false });
  save(); mergeUserLayer();
  draft.station = STATIONS.find((x) => x.id === s.id);
  toast('Ubicación corregida. ¡Gracias!');
}
function updateNext1() {
  $('#next1').disabled = !draft.station;
}
$('#next1').onclick = () => go('step2');
$('#btn-search').onclick = () => { $('#search-box').classList.remove('hidden'); $('#search-input').focus(); };

let searchList = [];
$('#search-input').addEventListener('input', (e) => {
  const words = norm(e.target.value).split(/\s+/).filter(Boolean);
  if (!words.length) { searchList = []; $('#search-list').innerHTML = ''; return; }
  let res = STATIONS.filter((s) => words.every((w) => s.key.includes(w)));
  res = res.map((s) => ({ s, d: draft.pos ? distM(draft.pos, s) : null }));
  if (draft.pos) res.sort((a, b) => a.d - b.d);
  searchList = res.slice(0, 20);
  renderOptions('#search-list', searchList);
  if (!searchList.length) $('#search-list').innerHTML = '<div class="empty">Sin resultados. Podés agregarla como estación nueva.</div>';
});

$('#btn-new-site').onclick = () => {
  if (!draft.pos) { toast('Para agregar una estación necesitamos tu ubicación (GPS).'); return; }
  sheet('Nueva estación',
    `<p class="muted xs" style="margin:0">Se guarda en tu ubicación actual. Queda en tu teléfono aunque se actualice la base, y más adelante se enviará como sugerencia.</p>
     <div class="col gap6"><label for="ns-brand" class="muted xs b6">Bandera</label>
       <select id="ns-brand" class="field">${BRANDS.map((b) => `<option>${b}</option>`).join('')}</select></div>
     <div class="col gap6"><label for="ns-addr" class="muted xs b6">Dirección</label><input id="ns-addr" class="field" placeholder="Av. del Libertador 1200"></div>
     <div class="col gap6"><label for="ns-city" class="muted xs b6">Localidad</label><input id="ns-city" class="field" placeholder="San Isidro"></div>`,
    [{ label: 'Guardar estación', primary: true, run: () => {
        const addr = $('#ns-addr').value.trim();
        if (!addr) { $('#ns-addr').classList.add('shake'); setTimeout(() => $('#ns-addr').classList.remove('shake'), 400); return false; }
        const u = { id: 'u-' + Date.now(), brand: $('#ns-brand').value, address: addr, city: $('#ns-city').value.trim(), province: '', lat: draft.pos.lat, lon: draft.pos.lon, created: new Date().toISOString() };
        db.userStations.push(u);
        db.suggestions.push({ type: 'new', station: u, date: u.created, sent: false });
        save(); mergeUserLayer();
        draft.station = STATIONS.find((x) => x.id === u.id);
        showNear(); toast('Estación agregada.');
      } },
     { label: 'Cancelar' }]);
};

function showHere(item) {
  const s = item.s, [bg, fg] = brandColor(s.brand);
  draft.station = s;
  $('#gps-msg').textContent = 'Te encontramos en una estación.';
  $('#here-brand').innerHTML = brandBox(s.brand, 'bchip');
  $('#here-addr').textContent = s.address;
  $('#here-dist').textContent = (s.city ? s.city + ' · ' : '') + 'a ' + distTxt(item.d) + ' de vos';
  ['#map-wrap', '#route', '#pick-list', '#foot1'].forEach((q) => $(q).classList.add('hidden'));
  $('#here').classList.remove('hidden');
}
function hideHere() {
  $('#here').classList.add('hidden');
  ['#pick-list', '#foot1'].forEach((q) => $(q).classList.remove('hidden'));
}
$('#here-yes').onclick = () => go('step2');
$('#here-no').onclick = () => { draft.manualPick = true; draft.station = null; showNear(); };

// Vos y la estación elegida, los dos en pantalla (solo se reencuadra si alguno quedó afuera, o al elegir)
function showBoth(force) {
  if (!lmap || !draft.pos || !draft.station) return;
  const a = [draft.pos.lat, draft.pos.lon], b = [draft.station.lat, draft.station.lon];
  const in2 = lmap.getBounds().pad(-0.08);
  if (force || !in2.contains(a) || !in2.contains(b)) lmap.fitBounds([a, b], { padding: [48, 48], maxZoom: Math.max(lmap.getZoom(), 15), animate: true });
}
// Recorrido hasta la estación: por calles (servicio OSRM) si responde; si no, una línea recta punteada
let lRoute = null, routeFor = null, routeAt = null, routeBusy = false;
async function drawRoute(force) {
  if (!lmap) return;
  if (!lRoute) lRoute = L.layerGroup().addTo(lmap);
  const s = draft.station, p = draft.pos;
  if (!s || !p) { lRoute.clearLayers(); routeFor = null; return; }
  const moved = routeAt ? distM(routeAt, p) : Infinity;
  if (!force && routeFor === s.id && moved < 250) return; // recalcular solo si te moviste bastante
  routeFor = s.id; routeAt = { lat: p.lat, lon: p.lon };
  const straight = () => { lRoute.clearLayers(); L.polyline([[p.lat, p.lon], [s.lat, s.lon]], { color: '#0B6E5A', weight: 4, dashArray: '6 8', opacity: .8, interactive: false }).addTo(lRoute); };
  if (distM(p, s) < 80) { lRoute.clearLayers(); return; }
  if (routeBusy) return;
  routeBusy = true;
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${p.lon},${p.lat};${s.lon},${s.lat}?overview=full&geometries=geojson`;
    const ctl = new AbortController(); setTimeout(() => ctl.abort(), 6000);
    const r = await (await fetch(url, { signal: ctl.signal })).json();
    const g = r.routes && r.routes[0];
    if (!g || draft.station !== s) throw new Error('sin ruta');
    lRoute.clearLayers();
    L.polyline(g.geometry.coordinates.map(([lo, la]) => [la, lo]), { color: '#fff', weight: 8, opacity: .9, interactive: false }).addTo(lRoute);
    L.polyline(g.geometry.coordinates.map(([lo, la]) => [la, lo]), { color: '#0B6E5A', weight: 5, opacity: .95, interactive: false }).addTo(lRoute);
    const min = Math.max(1, Math.round(g.duration / 60)), km = g.distance / 1000;
    $('#gps-msg').innerHTML = `<span class="live-dot"></span>Hasta la estación: ${km < 1 ? Math.round(g.distance) + ' m' : fmt(km, 1) + ' km'} · ${min} min`;
  } catch (e) {
    if (draft.station === s) { straight(); $('#gps-msg').innerHTML = `<span class="live-dot"></span>Hasta la estación: ${distTxt(distM(p, s))} en línea recta`; }
  }
  finally { routeBusy = false; }
}
function drawMe() {
  if (!lMe) return;
  lMe.clearLayers();
  const p = draft.pos;
  L.circle([p.lat, p.lon], { radius: Math.min(p.acc || 30, 300), color: '#0B6E5A', weight: 1, fillOpacity: .1, interactive: false }).addTo(lMe);
  L.marker([p.lat, p.lon], { icon: L.divIcon({ className: 'lf-icon', iconSize: null, html: '<span class="lf-me"></span>' }), interactive: false, zIndexOffset: -100 }).addTo(lMe);
}

/* Rotación del mapa según el rumbo (solo mientras te sigue y vas en movimiento) */
let rotateOn = true, rotAcc = 0, rotOn = false, lastHeading = null;
function setRotation(h) {
  const el = $('#map'), wrap = $('#map-wrap');
  if (h == null) { // volver a norte arriba
    if (!rotOn) return;
    rotOn = false; rotAcc = 0;
    el.style.transform = ''; el.style.width = el.style.height = el.style.left = el.style.top = '';
    el.style.setProperty('--rot', '0deg'); $('#needle').style.transform = '';
    lmap.invalidateSize({ pan: false }); lmap.dragging.enable(); lmap.panTo([draft.pos.lat, draft.pos.lon], { animate: false });
    return;
  }
  if (!rotOn) { // agrandar el mapa para que al girar no queden esquinas vacías
    const w = wrap.clientWidth, hh = wrap.clientHeight, d = Math.ceil(Math.hypot(w, hh));
    Object.assign(el.style, { width: d + 'px', height: d + 'px', left: (w - d) / 2 + 'px', top: (hh - d) / 2 + 'px' });
    lmap.invalidateSize({ pan: false }); lmap.panTo([draft.pos.lat, draft.pos.lon], { animate: false });
    lmap.dragging.disable(); rotOn = true;
  }
  const cur = ((rotAcc % 360) + 360) % 360;
  rotAcc += ((h - cur + 540) % 360) - 180; // el giro más corto (sin dar la vuelta entera)
  el.style.transform = `rotate(${-rotAcc}deg)`;
  el.style.setProperty('--rot', rotAcc + 'deg');           // las etiquetas quedan derechas
  $('#needle').style.transform = `rotate(${-rotAcc}deg)`;  // la brújula señala el norte
}
const bearing = (a, b) => { const r = Math.PI / 180, y = Math.sin((b.lon - a.lon) * r) * Math.cos(b.lat * r),
  x = Math.cos(a.lat * r) * Math.sin(b.lat * r) - Math.sin(a.lat * r) * Math.cos(b.lat * r) * Math.cos((b.lon - a.lon) * r);
  return (Math.atan2(y, x) / r + 360) % 360; };

/* Mapa real: Leaflet + OpenStreetMap (necesita internet para las calles; sin conexión la lista sigue funcionando) */
const BRAND_COLORS = { YPF: ['#0055A5', '#fff'], Shell: ['#FFD100', '#14212B'], Axion: ['#6D2077', '#fff'], Puma: ['#D6001C', '#fff'],
  Blanca: ['#5A6772', '#fff'], Dapsa: ['#C94A05', '#fff'], Gulf: ['#F58025', '#14212B'], Refinor: ['#00843D', '#fff'], VOY: ['#167D72', '#fff'],
  Repsol: ['#E35205', '#fff'], BP: ['#007A33', '#fff'], Cepsa: ['#C8102E', '#fff'], Moeve: ['#00594F', '#fff'], Galp: ['#E87722', '#14212B'],
  Ballenoil: ['#0072CE', '#fff'], Plenergy: ['#6CC24A', '#14212B'], Petroprix: ['#E4002B', '#fff'], Petronor: ['#00843D', '#fff'], Independiente: ['#5A6772', '#fff'],
  Petrobras: ['#008542', '#FFE600'], Ipiranga: ['#FFD100', '#003C7E'], ALE: ['#0047BB', '#fff'], 'Bandeira branca': ['#5A6772', '#fff'] };
const brandColor = (b) => BRAND_COLORS[b] || ['#14212B', '#fff'];
let lmap = null, lPins = null, lMe = null, lMarkers = {};
// Con zoom cercano (o la estación elegida) el cartel muestra también el precio del combustible habitual
const PRICE_ZOOM = 15;
// Logos de marcas (Wikimedia Commons); las demás se muestran con su color
const LOGOS = new Set(['axion', 'bp', 'ballenoil', 'campsa', 'esso', 'galp', 'gulf', 'moeve', 'petrobras', 'petronor', 'petroprix', 'puma', 'q8', 'repsol', 'shell', 'ypf', 'ipiranga']);
const logoOf = (b) => { const k = String(b || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'); return LOGOS.has(k) ? 'logos/' + k + '.png' : null; };
const brandBox = (b, cls = 'brand') => { const lg = logoOf(b), [bg, fg] = brandColor(b);
  // en los cuadraditos, de los logos muy anchos mostramos solo el símbolo de la izquierda
  const icon = cls === 'brand' && /repsol|petronor|petrobras/.test(lg || '') ? ' icon' : '';
  return lg ? `<span class="${cls} logo${icon}"><img src="${lg}" alt="${esc(b)}"></span>` : `<span class="${cls}" style="background:${bg};color:${fg}">${esc(cls === 'brand' ? brandAbbr(b) : b)}</span>`; };
const pinIcon = (s, sel) => { const [bg, fg] = brandColor(s.brand);
  const p = (sel || (lmap && lmap.getZoom() >= PRICE_ZOOM)) ? stationPrice(s, draft.fuel) : null;
  const lg = logoOf(s.brand);
  return L.divIcon({ className: 'lf-icon', iconSize: null, html: lg
    ? `<span class="lf-pin logo ${sel ? 'sel' : ''}" style="--pc:#fff"><img src="${lg}" alt="${esc(s.brand)}">${p ? `<b class="pp">${money(p)}</b>` : ''}</span>`
    : `<span class="lf-pin ${sel ? 'sel' : ''}" style="--pc:${bg};color:${fg}">${esc(s.brand)}${p ? `<b class="pp">${money(p)}</b>` : ''}</span>` }); };
function initMap(nearest) {
  const el = $('#map');
  if (typeof L === 'undefined') { // sin la librería del mapa: solo lista
    $('#map-wrap').classList.add('hidden'); nearList = nearest; renderOptions('#near-list', nearList); return;
  }
  $('#map-wrap').classList.remove('hidden');
  if (!lmap) {
    lmap = L.map(el, { zoomControl: false, attributionControl: false });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(lmap);
    lMe = L.layerGroup().addTo(lmap); lPins = L.layerGroup().addTo(lmap);
    lmap.on('moveend', updateVisible);
    // En modo simulado, tocar el mapa fija "dónde estás"
    lmap.on('click', (e) => { if (!draft.simulated || rotOn) return; draft.pos = { lat: e.latlng.lat, lon: e.latlng.lng, acc: 10 }; draft.simTapped = true; draft.station = null; draft.manualPick = false; showNear(); });
    lmap.on('dragstart', () => { userPanned = true; $('#recenter').classList.remove('hidden'); });
    $('#recenter').onclick = () => { userPanned = false; $('#recenter').classList.add('hidden'); lmap.setView([draft.pos.lat, draft.pos.lon], Math.max(lmap.getZoom(), 15)); };
    $('#compass').onclick = () => { // alterna: girar con el rumbo / norte siempre arriba
      rotateOn = !rotateOn; $('#compass').classList.toggle('locked', !rotateOn);
      if (!rotateOn) setRotation(null); else if (lastHeading != null && speedNow > 3.3) setRotation(lastHeading);
      toast(rotateOn ? 'El mapa gira según tu rumbo' : 'Norte siempre arriba');
    };
  }
  drawMe();
  const p = draft.pos;
  // Encuadre inicial: vos + las 3 estaciones más cercanas (o la elegida)
  const pts = [[p.lat, p.lon]].concat(nearest.map(({ s }) => [s.lat, s.lon]));
  if (draft.station) pts.push([draft.station.lat, draft.station.lon]);
  setTimeout(() => {
    lmap.invalidateSize();
    if (pts.length > 1) lmap.fitBounds(pts, { padding: [36, 36], maxZoom: 17 });
    else lmap.setView([p.lat, p.lon], 15);
    updateVisible();
  }, 480);
}
// La lista muestra lo mismo que el mapa: las estaciones visibles, la más cercana a vos primero
function updateVisible() {
  if (!lmap || current !== 'step1') return;
  lPins.clearLayers(); lMarkers = {};
  if (lmap.getZoom() < 12) {
    nearList = [];
    $('#near-title').textContent = 'Acercá el mapa para ver estaciones';
    $('#near-list').innerHTML = '';
    return;
  }
  const b = lmap.getBounds(), ref = draft.pos || { lat: lmap.getCenter().lat, lon: lmap.getCenter().lng };
  const vis = STATIONS.filter((s) => b.contains([s.lat, s.lon]) && brandOk(s)).map((s) => ({ s, d: distM(ref, s) })).sort((a, b2) => a.d - b2.d);
  vis.slice(0, 120).forEach((item) => {
    const s = item.s, sel = !!draft.station && draft.station.id === s.id;
    const m = L.marker([s.lat, s.lon], { icon: pinIcon(s, sel), title: stationLabel(s), zIndexOffset: sel ? 1000 : 0, keyboard: true });
    m.on('click', () => pickStation(item, false));
    m.addTo(lPins); lMarkers[s.id] = { m, s };
  });
  nearList = vis.slice(0, 20);
  $('#near-title').textContent = vis.length ? `Estaciones en el mapa (${vis.length})` : 'No hay estaciones en esta zona del mapa';
  renderOptions('#near-list', nearList);
  if (vis.length > 20) $('#near-list').insertAdjacentHTML('beforeend', `<div class="muted xs center-text">y ${vis.length - 20} más: acercá el mapa para verlas</div>`);
}
function refreshPins() {
  for (const id in lMarkers) {
    const sel = !!draft.station && draft.station.id === id;
    lMarkers[id].m.setIcon(pinIcon(lMarkers[id].s, sel)); lMarkers[id].m.setZIndexOffset(sel ? 1000 : 0);
  }
}
// "Cómo llegar": abre Google Maps con el recorrido hasta la estación elegida
function updateRoute() {
  const a = $('#route'), s = draft.station;
  if (!s) { a.classList.add('hidden'); if (lRoute) lRoute.clearLayers(); routeFor = null; return; }
  a.href = `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lon}&travelmode=driving`;
  a.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l18-8-8 18-2-8z"/></svg><span class="ellipsis">Cómo llegar a ${esc(stationLabel(s))}</span><span aria-hidden="true">↗</span>`;
  a.classList.remove('hidden');
}

/* ---------------- PASO 2: combustible ---------------- */
function renderStep2() {
  if (!FUELS.includes(draft.fuel)) draft.fuel = prefFuel(); // cambió el país o el auto
  $('#lbl-total').textContent = `Total pagado (${CUR_SYM[COUNTRIES[COUNTRY].cur]})`;
  $('#step2-where').textContent = 'Paso 2 de 3 · ' + (draft.station ? stationLabel(draft.station) : '');
  $('#fuel-hint').textContent = draft.fuel === db.car.fuel ? 'Tu combustible habitual' : db.lastFuel && draft.fuel === db.lastFuel ? 'Como la última vez' : '';
  $('#fuel-pills').style.gridTemplateColumns = `repeat(${FUELS.length > 4 ? 3 : 4}, minmax(0, 1fr))`;
  $('#fuel-pills').innerHTML = FUELS.map((f) => `<button class="pill ${f === draft.fuel ? 'sel' : ''}" aria-pressed="${f === draft.fuel}">${f}</button>`).join('');
  $$('#fuel-pills .pill').forEach((b, i) => b.onclick = () => { draft.fuel = FUELS[i]; renderStep2(); });
  $('#in-date').value = draft.date; $('#in-date').max = todayStr();
  $('#in-liters').value = draft.liters;
  $('#in-total').value = draft.total;
  setToggle(draft.full);
  calcPpl();
}
// Precio oficial del día en esta estación (España): sugerencia para no tipear el total
function stationPrice(st, fuel) {
  const C = COUNTRIES[COUNTRY], s = st || draft.station;
  if (!C.priceIdx || !s || !s.prices) return null;
  const p = s.prices[C.priceIdx[fuel || draft.fuel]];
  return p > 0 ? p : null;
}
function renderPriceHint() {
  const box = $('#price-hint'), p = stationPrice();
  if (!p) { box.classList.add('hidden'); return; }
  const l = parseNum(draft.liters);
  box.classList.remove('hidden');
  box.innerHTML = `<span class="grow">Precio oficial hoy: <b>${money(p)}/l</b>${pricesDate ? '<br><span class="xs muted">Ministerio, ' + esc(pricesDate.split(' ')[0]) + '</span>' : ''}</span>` +
    (l > 0 && !parseNum(draft.total) ? `<button class="btn2" id="use-price" style="padding:0 12px;height:40px">Total: ${money(l * p)}</button>` : '');
  const b = $('#use-price');
  if (b) b.onclick = () => { $('#in-total').value = String((Math.round(l * p * 100) / 100)).replace('.', ','); calcPpl(); };
}
function calcPpl() {
  draft.liters = $('#in-liters').value; draft.total = $('#in-total').value;
  const l = parseNum(draft.liters), t = parseNum(draft.total);
  const ok = l > 0 && t > 0;
  $('#ppl').textContent = ok ? money(t / l) : '—';
  $('#next2').disabled = !ok;
  renderPriceHint();
}
$('#in-liters').addEventListener('input', calcPpl);
$('#in-date').addEventListener('change', (e) => { draft.date = e.target.value && e.target.value <= todayStr() ? e.target.value : todayStr(); e.target.value = draft.date; });
$('#in-total').addEventListener('input', calcPpl);
function setToggle(on) {
  const t = $('#tg-full'); t.classList.toggle('on', on); t.setAttribute('aria-checked', on);
}
$('#tg-full').onclick = () => { draft.full = !draft.full; setToggle(draft.full); };
$('#next2').onclick = () => {
  const l = parseNum(draft.liters), tank = parseNum(db.car.tank);
  if (tank > 0 && l > tank * 1.1) {
    sheet('¿Revisamos los litros?', `<p class="muted small" style="margin:0">Cargaste ${fmt(l, 1)} l y el tanque de tu auto es de ${fmt(tank)} l.</p>`,
      [{ label: 'Está bien, seguir', primary: true, run: () => go('step3') }, { label: 'Corregir' }]);
    return;
  }
  go('step3');
};

/* ---------------- PASO 3: kilometraje ---------------- */
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];
$('#keypad').innerHTML = KEYS.map((k) => `<button class="key" aria-label="${k === '⌫' ? 'Borrar' : k === 'C' ? 'Limpiar' : k}">${k}</button>`).join('');
$$('#keypad .key').forEach((b, i) => b.onclick = () => {
  const k = KEYS[i];
  if (k === '⌫') draft.odo = draft.odo.slice(0, -1);
  else if (k === 'C') draft.odo = '';
  else if (draft.odo.length < 7 && !(draft.odo === '' && k === '0')) draft.odo += k;
  renderStep3();
});
function renderStep3() {
  const n = parseInt(draft.odo || '0', 10), b = odoBounds(draft.date);
  $('#odo-num').textContent = fmt(n);
  const tag = $('#odo-tag');
  tag.className = 'odo-tag'; tag.textContent = '';
  if (draft.odo) {
    if (b.lo && n > b.lo && n < b.hi) { tag.classList.add('ok'); tag.textContent = 'Recorriste ' + fmt(n - b.lo) + ' km desde la carga anterior'; }
    else if (b.lo && n <= b.lo && draft.odo.length >= String(b.lo).length) { tag.classList.add('bad'); tag.textContent = 'Es menor que la carga anterior (' + fmt(b.lo) + ' km)'; }
    else if (n >= b.hi) { tag.classList.add('bad'); tag.textContent = 'Es mayor que una carga posterior (' + fmt(b.hi) + ' km)'; }
  }
  $('#odo-last').textContent = b.prev ? 'Carga anterior: ' + fmt(b.prev.odo) + ' km · ' + shortDate(b.prev.date) : 'Primera carga: anotá el kilometraje actual.';
  $('#save').disabled = !draft.odo;
}
$('#save').onclick = () => {
  const n = parseInt(draft.odo || '0', 10), b = odoBounds(draft.date);
  if (!n) return;
  const bad = (b.lo && n <= b.lo) ? 'El kilometraje tiene que ser mayor a ' + fmt(b.lo) + ' km.' : (n >= b.hi ? 'El kilometraje tiene que ser menor a ' + fmt(b.hi) + ' km (hay una carga posterior).' : '');
  if (bad) { $('.odo').classList.add('shake'); setTimeout(() => $('.odo').classList.remove('shake'), 400); toast(bad); return; }
  if (b.lo && n - b.lo > 1500) {
    sheet('¿Es correcto?', `<p class="muted small" style="margin:0">Serían ${fmt(n - b.lo)} km desde la carga anterior. ¿Lo guardamos igual?</p>`,
      [{ label: 'Sí, guardar', primary: true, run: () => commit(n) }, { label: 'Corregir' }]);
    return;
  }
  commit(n);
};
let lastSaved = null;
function commit(odo) {
  const s = draft.station;
  const load = {
    id: 'l-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6), date: draft.date === todayStr() ? new Date().toISOString() : new Date(draft.date + 'T12:00:00').toISOString(),
    stationId: s.id, stationName: stationLabel(s), brand: s.brand,
    lat: draft.pos ? draft.pos.lat : null, lon: draft.pos ? draft.pos.lon : null,
    fuel: draft.fuel, cur: COUNTRIES[COUNTRY].cur, country: COUNTRY, liters: parseNum(draft.liters), total: parseNum(draft.total), full: draft.full, odo
  };
  const newest = odo > lastOdo();
  db.loads.push(load);
  markDirty(load.id);
  if (newest) db.lastFuel = draft.fuel; // solo si es la carga más reciente
  save();
  lastSaved = load;
  cloudSoon();
  draft = newDraft();
  go('done');
}

/* ---------------- RESULTADO ---------------- */
function renderDone() {
  const l = lastSaved; if (!l) { go('home'); return; }
  const segs = segments();
  const seg = segs.find((s) => s.loadId === l.id);
  const prev = summary(segs.filter((s) => s.loadId !== l.id));
  const ppl = l.total / l.liters;
  let main;
  if (seg) {
    const better = prev.kml ? (seg.kml / prev.kml - 1) * 100 : null;
    const max = Math.max(seg.kml, prev.kml || 0) * 1.05;
    main = `
      <div class="col center gap2 rise d2" style="margin-top:8px">
        <span class="lite small">Consumo del tanque anterior</span>
        <div class="row baseline gap8"><span class="done-big">${fmt(seg.kml, 1)}</span><span style="font-size:22px;font-weight:600">km/l</span></div>
        <span class="lite small">equivale a ${fmt(100 / seg.kml, 1)} l cada 100 km</span>
        <span class="small center-text" style="margin-top:8px;background:rgba(255,255,255,.12);border-radius:12px;padding:8px 12px">⛽ ${esc(tr('Combustible'))} ${esc(tr(seg.fromFuel))} · ${esc(tr('cargado en'))} <b>${esc(seg.fromName)}</b> el ${shortDate(seg.fromDate)}</span>
        ${typeof tankDrivingLine === 'function' ? tankDrivingLine(seg) : ''}
      </div>
      <div class="grid3 rise d3" style="width:100%">
        <div class="tile"><b>${fmt(seg.km)}</b><span>km recorridos</span></div>
        <div class="tile"><b>${money(ppl)}</b><span>por litro</span></div>
        <div class="tile"><b>${money(seg.cost / seg.km)}</b><span>por km</span></div>
      </div>
      ${prev.kml ? `<div class="cmp rise d4">
        <span class="b6 small">Comparado con tu promedio</span>
        <div class="bar-row"><span class="lab">Promedio</span><span class="trk"><i style="width:${prev.kml / max * 100}%;background:#9AA6AE"></i></span><span class="val">${fmt(prev.kml, 1)}</span></div>
        <div class="bar-row"><span class="lab">Ese tanque</span><span class="trk"><i style="width:${seg.kml / max * 100}%;background:#0B6E5A"></i></span><span class="val">${fmt(seg.kml, 1)}</span></div>
        <span class="accent small b6">${Math.abs(better) < 0.5 ? 'Igual que tu promedio.' : better > 0 ? 'Un ' + fmt(better, 0) + ' % mejor que tu promedio. ¡Bien!' : 'Un ' + fmt(-better, 0) + ' % peor que tu promedio.'}</span>
      </div>` : ''}`;
  } else {
    main = `
      <div class="grid3 rise d2" style="width:100%;margin-top:8px">
        <div class="tile"><b>${fmt(l.liters, 1)} l</b><span>cargados</span></div>
        <div class="tile"><b>${money(ppl)}</b><span>por litro</span></div>
        <div class="tile"><b>${money(l.total)}</b><span>total</span></div>
      </div>
      <p class="lite small center-text rise d3" style="margin:0">${l.full
        ? 'Este es tu punto de partida. En la próxima carga con tanque lleno vas a ver cuánto rindió este combustible.'
        : 'Carga parcial guardada. El consumo se calcula cuando vuelvas a llenar el tanque.'}</p>`;
  }
  $('#done-body').innerHTML = `
    <div class="check-wrap"><span class="check-ring"></span><span class="check-dot"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span></div>
    <h1 class="h1 rise d1" style="font-size:30px;margin-top:6px">¡Carga guardada!</h1>
    <span class="lite small rise d1">${esc(l.stationName)} · ${dayOf(l.date) === todayStr() ? 'hoy' : shortDate(l.date)}</span>
    ${main}`;
}

/* ---------------- HISTORIAL ---------------- */
let period = 1; // 0:3M 1:6M 2:1A 3:Todo
const PERIODS = [['3M', 3], ['6M', 6], ['1A', 12], ['Todo', 999]];
function renderHistory() {
  $('#period').innerHTML = PERIODS.map(([lab], i) => `<button class="${i === period ? 'on' : ''}" aria-pressed="${i === period}">${lab}</button>`).join('');
  $$('#period button').forEach((b, i) => b.onclick = () => { period = i; renderHistory(); });
  const from = new Date(); from.setMonth(from.getMonth() - PERIODS[period][1]);
  const segs = segments().filter((s) => new Date(s.fromDate) >= from);
  const sum = summary(segs);
  $('#h-avg').textContent = sum.kml ? fmt(sum.kml, 1) : '—';
  $('#chart-line').innerHTML = segs.length >= 2 ? lineChart(segs, sum.kml)
    : '<div class="empty">Necesitás al menos dos tanques llenos medidos para ver el gráfico.</div>';

  // Gasto por mes (últimos 6 meses del período)
  const months = [];
  const nMonths = Math.min(6, PERIODS[period][1]);
  for (let i = nMonths - 1; i >= 0; i--) { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i); months.push({ y: d.getFullYear(), m: d.getMonth(), v: 0 }); }
  db.loads.forEach((l) => { const d = new Date(l.date); const mm = months.find((x) => x.y === d.getFullYear() && x.m === d.getMonth()); if (mm) mm.v += l.total; });
  $('#chart-bars').innerHTML = months.some((m) => m.v) ? barChart(months) : '<div class="empty">Sin gastos en este período.</div>';

  // Por estación
  const by = {};
  db.loads.forEach((l) => { const k = l.stationId; by[k] = by[k] || { name: l.stationName, n: 0, l: 0, t: 0, km: 0, sl: 0 }; by[k].n++; by[k].l += l.liters; by[k].t += l.total; });
  segments().forEach((g) => { const r = by[g.fromStation]; if (r) { r.km += g.km; r.sl += g.liters; } }); // rendimiento del combustible de cada estación
  const rows = Object.values(by).sort((a, b) => b.n - a.n);
  $('#by-station').innerHTML = rows.length ? `<div class="trow muted xs" style="border-top:none;padding-top:0"><span class="g">Estación</span><span style="width:58px;text-align:right">Rinde</span><span style="width:76px;text-align:right">Precio</span></div>` + rows.map((r) => `<div class="trow"><span class="g col gap2" style="min-width:0"><span class="ellipsis">${esc(r.name)}</span><span class="muted xs">${r.n} ${r.n === 1 ? 'carga' : 'cargas'}</span></span><span class="b6" style="width:58px;text-align:right">${r.sl ? fmt(r.km / r.sl, 1) : '—'}</span><span class="b6" style="width:76px;text-align:right">${money(r.t / r.l)}/l</span></div>`).join('')
    : '<div class="empty">Todavía no hay cargas.</div>';

  // Todas las cargas
  const segBy = Object.fromEntries(segments().map((s) => [s.fromId, s]));
  const inUse = currentTankId();
  const all = db.loads.slice().sort((a, b) => b.odo - a.odo);
  $('#all-loads').innerHTML = all.length ? all.map((l) => `<div class="trow">
      <span class="g col gap2"><span class="b6 ellipsis">${esc(l.stationName)}</span><span class="muted xs">${shortDate(l.date)} · ${fmt(l.odo)} km · ${fmt(l.liters, 1)} l · ${money(l.total)}${l.full ? '' : ' · parcial'}</span></span>
      <span class="b6" style="text-align:right">${segBy[l.id] ? fmt(segBy[l.id].kml, 1) + '<br><span class="muted xs">km/l</span>' : l.id === inUse ? '<span class="muted xs">en uso</span>' : ''}</span>
      <button class="del" data-del="${esc(l.id)}" aria-label="Borrar carga"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg></button>
    </div>`).join('') : '<div class="empty">Todavía no hay cargas.</div>';
  $$('#all-loads [data-del]').forEach((b) => b.onclick = () => {
    const l = db.loads.find((x) => x.id === b.dataset.del);
    sheet('¿Borrar esta carga?', `<p class="muted small" style="margin:0">${esc(l.stationName)} · ${shortDate(l.date)} · ${fmt(l.odo)} km. No se puede deshacer.</p>`,
      [{ label: 'Borrar', primary: true, run: () => { db.loads = db.loads.filter((x) => x.id !== l.id); db.dirty = db.dirty.filter((x) => x !== l.id); db.tombstones.push(l.id); save(); cloudSoon(); renderHistory(); toast('Carga borrada.'); } }, { label: 'Cancelar' }]);
  });
}
function lineChart(segs, avg) {
  const W = 326, H = 150, L = 28, B = 22, T = 10;
  const vals = segs.map((s) => s.kml);
  let lo = Math.floor(Math.min(...vals) - .5), hi = Math.ceil(Math.max(...vals) + .5);
  const x = (i) => L + i * (W - L - 8) / (segs.length - 1);
  const y = (v) => T + (hi - v) / (hi - lo) * (H - T - B);
  const pts = segs.map((s, i) => x(i).toFixed(1) + ',' + y(s.kml).toFixed(1)).join(' ');
  const ticks = [lo, (lo + hi) / 2, hi];
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Consumo en km por litro de cada tanque. Promedio ${fmt(avg, 1)}">
    ${ticks.map((t) => `<line x1="${L}" x2="${W}" y1="${y(t)}" y2="${y(t)}" stroke="#EEF2EF"/><text x="${L - 6}" y="${y(t) + 3}" font-size="10" fill="#5A6772" text-anchor="end">${fmt(t, t % 1 ? 1 : 0)}</text>`).join('')}
    <line x1="${L}" x2="${W}" y1="${y(avg)}" y2="${y(avg)}" stroke="#E8A33D" stroke-width="1.5" stroke-dasharray="4 4"/>
    <polyline class="chart-line" points="${pts}" fill="none" stroke="#0B6E5A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    ${segs.map((s, i) => `<circle cx="${x(i)}" cy="${y(s.kml)}" r="3.5" fill="#fff" stroke="#0B6E5A" stroke-width="2"><title>${esc(s.fromName)} (${shortDate(s.fromDate)}): ${fmt(s.kml, 1)} km/l</title></circle>`).join('')}
    <text x="${L}" y="${H - 6}" font-size="10" fill="#5A6772">${shortDate(segs[0].fromDate)}</text>
    <text x="${W}" y="${H - 6}" font-size="10" fill="#5A6772" text-anchor="end">${shortDate(segs[segs.length - 1].fromDate)}</text>
  </svg>`;
}
function barChart(months) {
  const W = 326, H = 130, n = months.length, gap = 10, bw = (W - gap * (n - 1)) / n;
  const max = Math.max(...months.map((m) => m.v)) || 1;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gasto en combustible por mes" class="bars">
    ${months.map((m, i) => {
      const h = m.v / max * (H - 40), xx = i * (bw + gap), last = i === n - 1;
      return `<rect x="${xx}" y="${H - 20 - h}" width="${bw}" height="${Math.max(h, m.v ? 2 : 0)}" rx="6" fill="${last ? '#E8A33D' : '#0B6E5A'}" style="animation-delay:${.2 + i * .06}s"/>
        <text x="${xx + bw / 2}" y="${H - 24 - h}" font-size="10" fill="#5A6772" text-anchor="middle">${m.v ? fmt(m.v / 1000, 0) + 'k' : ''}</text>
        <text x="${xx + bw / 2}" y="${H - 5}" font-size="11" font-weight="600" fill="#5A6772" text-anchor="middle">${monthNames()[m.m]}</text>`;
    }).join('')}
  </svg>`;
}

/* ---------------- MI AUTO ---------------- */
function renderCar() {
  $('#country').value = db.country || 'auto';
  $('#country-info').textContent = `Ahora: ${COUNTRIES[COUNTRY].name}` + (COUNTRY === 'ES' && pricesDate ? ` · precios oficiales del ${pricesDate.split(' ')[0]}` : COUNTRY === 'AR' ? ' · base preparada a mano'
    : COUNTRY === 'BR' ? ` · ANP (sin precios por ahora) · estado${loadedRegions.length > 1 ? 's' : ''} ${loadedRegions.join(', ')}` : '');
  const c = db.car;
  $('#c-brand').value = c.brand; $('#c-model').value = c.model; $('#c-year').value = c.year; $('#c-tank').value = c.tank;
  const cf = COUNTRIES[(db.carMeta && db.carMeta.country) || COUNTRY].fuels;
  $('#c-fuel').innerHTML = cf.map((f) => `<option value="${esc(f)}" ${f === c.fuel ? 'selected' : ''}>${esc(f)}</option>`).join('');
  if (!cf.includes(c.fuel)) $('#c-fuel').value = cf[0];
  $('#lang').value = LANG;
  $('#car-saved').classList.add('hidden');
  const sum = summary(segments());
  const spent = db.loads.reduce((a, l) => a + l.total, 0);
  $('#car-stats').innerHTML = `<span class="b6">Resumen</span>
    <div class="grid3">
      <div class="col gap2"><span class="muted xs">Odómetro</span><span class="b6">${lastOdo() ? fmt(lastOdo()) + ' km' : '—'}</span></div>
      <div class="col gap2"><span class="muted xs">Promedio</span><span class="b6">${sum.kml ? fmt(sum.kml, 1) + ' km/l' : '—'}</span></div>
      <div class="col gap2"><span class="muted xs">Cargas</span><span class="b6">${db.loads.length}</span></div>
    </div>
    <span class="muted xs">Total gastado: ${money(spent)}</span>`;
  const mine = db.userStations.length, fixed = Object.keys(db.corrections).length;
  $('#db-info').textContent = `${COUNTRIES[COUNTRY].name} · base ${stationsVersion} · ${fmt(officialCount)} estaciones` +
    (mine ? ` · ${mine} agregada${mine > 1 ? 's' : ''} por vos` : '') + (fixed ? ` · ${fixed} corregida${fixed > 1 ? 's' : ''}` : '');
  if (typeof renderGarage === 'function') renderGarage();
  if (typeof renderCloud === 'function') renderCloud();
}
$('#car-form').onsubmit = (e) => {
  e.preventDefault();
  db.car = { brand: $('#c-brand').value.trim(), model: $('#c-model').value.trim(), year: $('#c-year').value.trim(), tank: $('#c-tank').value.trim(), fuel: $('#c-fuel').value };
  draft.fuel = db.car.fuel;
  db.carDirty = true; save(); cloudSoon();
  $('#car-saved').classList.remove('hidden');
  toast('Auto guardado.');
};
$('#btn-share').onclick = async () => {
  const sum = summary(segments()), c = db.car;
  const car = [c.brand, c.model, c.year].filter(Boolean).join(' ') || 'Mi auto';
  const text = sum.kml
    ? `${car}: rinde ${fmt(sum.kml, 1)} km/l (${fmt(100 / sum.kml, 1)} l/100 km) en ${fmt(sum.km)} km medidos. Costo actual: ${money(currentCpk())} por km. — Mi Consumo`
    : `Estoy registrando el consumo de ${car} con Mi Consumo.`;
  try {
    if (navigator.share) await navigator.share({ title: 'Mi consumo', text });
    else { await navigator.clipboard.writeText(text); toast('Resumen copiado. Pegalo donde quieras.'); }
  } catch (e) { /* el usuario canceló */ }
};
$('#btn-export').onclick = () => {
  if (!db.loads.length) { toast('Todavía no hay cargas para exportar.'); return; }
  const segBy = Object.fromEntries(segments().map((s) => [s.fromId, s]));
  const dec = (n, d) => (n == null ? '' : Number(n).toFixed(d).replace('.', ','));
  const head = ['Fecha', 'Estación', 'Combustible', 'Litros', 'Total $', 'Precio/litro', 'Tanque lleno', 'Kilometraje', 'km/l de este combustible'];
  const rows = db.loads.slice().sort((a, b) => a.odo - b.odo).map((l) => [
    new Date(l.date).toLocaleDateString(locale()), l.stationName, l.fuel, dec(l.liters, 2), dec(l.total, 2), dec(l.total / l.liters, 2),
    l.full ? 'Sí' : 'No', l.odo, segBy[l.id] ? dec(segBy[l.id].kml, 2) : '']);
  const csv = '﻿' + [head, ...rows].map((r) => r.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(';')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = 'mis-cargas.csv'; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};


/* ---------------- Importar cargas anteriores (CSV) ---------------- */
// Columnas reconocidas (en cualquier orden): Fecha; Estación; Combustible; Litros; Total; Tanque lleno; Kilometraje
function parseCSV(text) {
  text = text.replace(/^﻿/, '');
  const first = text.split(/\r?\n/)[0];
  const sep = (first.match(/;/g) || []).length >= (first.match(/,/g) || []).length ? ';' : ',';
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === sep) { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
    else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim()));
}
function parseDate(v) {
  v = v.trim(); let m;
  if ((m = v.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/))) { const y = m[3].length === 2 ? 2000 + +m[3] : +m[3]; return new Date(y, +m[2] - 1, +m[1], 12); }
  if ((m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return new Date(+m[1], +m[2] - 1, +m[3], 12);
  return null;
}
$('#btn-import').onclick = () => $('#file-import').click();
$('#file-import').onchange = async (e) => {
  const f = e.target.files[0]; e.target.value = '';
  if (!f) return;
  let text = await f.text();
  if (text.includes('�')) text = new TextDecoder('windows-1252').decode(await f.arrayBuffer()); // Excel en español guarda en Latin-1
  const rows = parseCSV(text);
  if (rows.length < 2) { toast('El archivo está vacío.'); return; }
  const head = rows[0].map((h) => norm(h).trim());
  const col = (...names) => head.findIndex((h) => names.some((n) => h.startsWith(n)));
  const C = { date: col('fecha'), st: col('estacion', 'lugar'), fuel: col('combustible', 'tipo'), lit: col('litros'), tot: col('total', 'importe', 'monto'), full: col('tanque', 'lleno'), odo: col('kilometraje', 'km', 'odometro'), sid: col('idempresa', 'id estacion') };
  if (C.date < 0 || C.lit < 0 || C.tot < 0 || C.odo < 0) { toast('Faltan columnas: Fecha, Litros, Total y Kilometraje son obligatorias.'); return; }
  const have = new Set(db.loads.map((l) => l.odo));
  const ok = [], bad = [];
  rows.slice(1).forEach((r, i) => {
    const d = parseDate(r[C.date] || ''), lit = parseNum(r[C.lit]), tot = parseNum(r[C.tot]), odo = parseInt(String(r[C.odo] || '').replace(/\D/g, ''), 10);
    if (!d || !(lit > 0) || !(tot > 0) || !(odo > 0)) { bad.push(i + 2); return; }
    if (have.has(odo)) return; // ya cargada
    // Si viene el id de la estación de la base oficial, se vincula a esa estación
    const known = C.sid >= 0 ? STATIONS.find((x) => x.id === String(r[C.sid] || '').trim()) : null;
    const name = known ? stationLabel(known) : ((C.st >= 0 && r[C.st].trim()) || 'Carga importada');
    const brand = known ? known.brand : (BRANDS.find((b) => norm(name).startsWith(norm(b))) || name.split(/[\s·-]/)[0]);
    const fuelTxt = C.fuel >= 0 ? norm(r[C.fuel] || '') : '';
    const fuel = FUELS.find((x) => norm(x) === fuelTxt) || (fuelTxt.includes('prem') ? 'Premium' : fuelTxt.includes('dies') || fuelTxt.includes('gasoil') ? 'Diésel' : fuelTxt.includes('gnc') ? 'GNC' : 'Súper');
    const fv = C.full >= 0 ? norm(r[C.full] || '').trim() : '';
    ok.push({ id: 'l-imp-' + Date.now() + '-' + i, date: d.toISOString(), stationId: known ? known.id : 'imp:' + norm(name), stationName: name, brand,
      lat: known ? known.lat : null, lon: known ? known.lon : null, fuel, liters: lit, total: tot, full: !(fv && /^(no|n|0|false|parcial)/.test(fv)), odo });
    have.add(odo);
  });
  if (!ok.length) { toast(bad.length ? 'No se pudo leer ninguna fila (revisá las filas ' + bad.slice(0, 5).join(', ') + ').' : 'Esas cargas ya estaban registradas.'); return; }
  ok.sort((a, b) => a.odo - b.odo);
  sheet('Importar ' + ok.length + (ok.length === 1 ? ' carga' : ' cargas'),
    `<p class="muted small" style="margin:0">Del ${shortDate(ok[0].date)} (${fmt(ok[0].odo)} km) al ${shortDate(ok[ok.length - 1].date)} (${fmt(ok[ok.length - 1].odo)} km).${bad.length ? ' Se omiten ' + bad.length + ' filas con datos incompletos.' : ''}</p>`,
    [{ label: 'Importar', primary: true, run: () => {
        db.loads.push(...ok); ok.forEach((l) => markDirty(l.id));
        const newest = db.loads.slice().sort((a, b) => b.odo - a.odo)[0];
        if (!db.lastFuel) db.lastFuel = newest.fuel;
        save(); renderCar(); cloudSoon(); toast(ok.length + ' cargas importadas.');
      } },
     { label: 'Cancelar' }]);
};

/* ---------------- Botón "atrás" de Android ---------------- */
const BACK = { step1: 'home', step2: 'step1', step3: 'step2', done: 'home', history: 'home', car: 'home', trips: 'home', trip: 'trips' };
history.replaceState({ root: true }, '');
history.pushState({ app: true }, '');
window.addEventListener('popstate', () => {
  if (!$('#sheet-bg').classList.contains('hidden')) { closeSheet(); history.pushState({ app: true }, ''); return; }
  if (current !== 'home' && BACK[current]) { go(BACK[current]); history.pushState({ app: true }, ''); return; }
  history.back(); // en el inicio: salir de la app
});

$('#country').onchange = async (e) => {
  db.country = e.target.value; save(); draft.pos = null; draft.simulated = false;
  const want = db.country === 'auto' ? COUNTRY : db.country;
  if (want !== COUNTRY) await loadStations(want);
  renderCar();
};

// Idioma: al cambiarlo, preguntar si se guarda en la cuenta (para cualquier teléfono)
$('#lang').onchange = (e) => {
  const l = e.target.value; db.lang = l; db.langLocal = false; save(); setLang(l, true);
  const signed = typeof user !== 'undefined' && user;
  sheet(tr('¿Guardar {} como tu idioma?').replace('{}', LANGS[l]),
    `<p class="muted small" style="margin:0">${signed ? 'Lo guardamos en tu cuenta para que la app aparezca en este idioma en cualquier teléfono.' : 'Para guardarlo en tu cuenta, iniciá sesión en "Copia en la nube" (abajo). Queda guardado al entrar.'}</p>`,
    [{ label: signed ? 'Sí, en mi cuenta' : 'Iniciar sesión y guardarlo', primary: true, run: () => {
        db.langPending = l; save();
        if (signed) cloudSync(); else setTimeout(() => { const em = $('#em'); if (em) { em.scrollIntoView({ behavior: 'smooth', block: 'center' }); em.focus(); } }, 200);
      } },
     { label: 'Solo en este teléfono', run: () => { db.langLocal = true; save(); } }]);
};
function pickCountry() {
  const opts = [['auto', 'Automático (según el GPS)'], ...Object.entries(COUNTRIES).map(([k, c]) => [k, c.name])];
  sheet('¿En qué país cargás?', '<p class="muted xs" style="margin:0">Si elegís un país distinto de donde estás, el mapa se abre allí y tocás tu ubicación (sirve para probar).</p>',
    opts.map(([k, lab]) => ({ label: (((db.country || 'auto') === k) ? '✓ ' : '') + lab, primary: false, run: async () => {
      db.country = k; save();
      const want = k === 'auto' ? (draft.pos && !draft.simulated ? countryAt(draft.pos.lat, draft.pos.lon) || COUNTRY : COUNTRY) : k;
      if (want !== COUNTRY) await loadStations(want);
      draft.pos = null; draft.simulated = false; draft.station = null; draft.manualPick = false; draft.carAsked = false;
      if (current === 'step1') renderStep1();
      if (typeof askCarFor === 'function') askCarFor(COUNTRY, k !== 'auto');
    } })));
}
document.addEventListener('click', (e) => { if (e.target.closest('#country-chip')) pickCountry(); });

/* ---------------- Arranque ---------------- */
const RENDER = { home: renderHome, step1: renderStep1, step2: renderStep2, step3: renderStep3, done: renderDone, history: renderHistory, car: renderCar, trips: () => renderTrips() };
loadStations().then(() => { if (current === 'car') renderCar(); });
go('home');

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  // Buscar versión nueva al abrir y cada vez que se vuelve a la app; cuando llega, recargar solo (una vez)
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((reg) => {
    reg.update().catch(() => {});
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
  }).catch(() => {});
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded || !navigator.serviceWorker.controller) return;
    reloaded = true;
    if (!['step1', 'step2', 'step3'].includes(current)) location.reload(); // no interrumpir una carga a medio hacer
  });
}
