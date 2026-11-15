/* Mi Consumo — registro de cargas de combustible (PWA, fase 1: todo en el teléfono) */
'use strict';

/* ---------------- Datos y almacenamiento ---------------- */
const KEY = 'miconsumo.v1';
const FUELS = ['Súper', 'Premium', 'Diésel', 'GNC'];
const BRANDS = ['YPF', 'Shell', 'Axion', 'Puma', 'Blanca', 'Dapsa', 'Gulf', 'Refinor', 'VOY', 'Otra'];

const blank = () => ({
  car: { brand: '', model: '', year: '', tank: '' },
  loads: [],            // cargas registradas
  lastFuel: null,       // último combustible elegido
  userStations: [],     // estaciones agregadas por el usuario (sobreviven a nuevas versiones de la base)
  corrections: {},      // id -> {lat, lon, date}: posiciones corregidas por el usuario
  suggestions: []       // cola de sugerencias para enviar a la base compartida (fase 2)
});

let db = load();
function load() {
  try { return Object.assign(blank(), JSON.parse(localStorage.getItem(KEY)) || {}); }
  catch (e) { return blank(); }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); }
  catch (e) { toast('No se pudo guardar en el teléfono.'); }
}

let STATIONS = [];        // base oficial + correcciones + estaciones propias
let stationsVersion = '';
let officialCount = 0;
async function loadStations() {
  try {
    const res = await fetch('stations.json');
    const data = await res.json();
    stationsVersion = data.version;
    officialCount = data.rows.length;
    STATIONS = data.rows.map((r) => ({ id: r[0], brand: r[1], address: r[2], city: r[3], province: r[4], lat: r[5], lon: r[6] }));
  } catch (e) {
    STATIONS = [];
    toast('No se pudo cargar la base de estaciones.');
  }
  mergeUserLayer();
}
function mergeUserLayer() {
  STATIONS = STATIONS.filter((s) => !s.mine);
  for (const s of STATIONS) {
    const c = db.corrections[s.id];
    if (c) { s.lat = c.lat; s.lon = c.lon; s.corrected = true; }
  }
  for (const u of db.userStations) STATIONS.push(Object.assign({ mine: true }, u));
  for (const s of STATIONS) s.key = norm([s.brand, s.address, s.city, s.province].join(' '));
}

/* ---------------- Utilidades ---------------- */
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const fmt = (n, d = 0) => Number(n).toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d });
const money = (n) => '$ ' + fmt(Math.round(n));
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const shortDate = (iso) => { const d = new Date(iso); return d.getDate() + ' ' + MONTHS[d.getMonth()]; };

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
function segments() {
  const loads = db.loads.slice().sort((a, b) => a.odo - b.odo);
  const out = [];
  let prevFull = null, liters = 0, cost = 0;
  for (const l of loads) {
    if (prevFull) { liters += l.liters; cost += l.total; }
    if (l.full) {
      if (prevFull && liters > 0) {
        const km = l.odo - prevFull.odo;
        if (km > 0) out.push({ loadId: l.id, date: l.date, km, liters, cost, kml: km / liters });
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
const lastOdo = () => db.loads.reduce((m, l) => Math.max(m, l.odo), 0);

/* ---------------- Navegación ---------------- */
const SCREENS = { home: 's-home', step1: 's-step1', step2: 's-step2', step3: 's-step3', done: 's-done', history: 's-history', car: 's-car' };
const ORDER = ['home', 'step1', 'step2', 'step3', 'done', 'history', 'car'];
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
  current = name;
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
$$('.tabbar').forEach((nav) => {
  const here = nav.closest('.screen').dataset.nav;
  nav.innerHTML = [['home', 'Inicio'], ['history', 'Historial'], ['car', 'Mi auto']].map(([k, lab]) =>
    `<button data-go="${k}" class="${k === here ? 'on' : ''}" ${k === here ? 'aria-current="page"' : ''}><svg viewBox="0 0 24 24" aria-hidden="true">${TAB_ICONS[k]}</svg>${lab}</button>`).join('');
});

/* ---------------- Borrador de la carga en curso ---------------- */
const newDraft = () => ({ station: null, fuel: db.lastFuel || FUELS[0], liters: '', total: '', full: true, odo: '', pos: null });
let draft = newDraft();

/* ---------------- INICIO ---------------- */
function renderHome() {
  const car = db.car;
  $('#car-chip-name').textContent = car.model ? [car.model, car.year].filter(Boolean).join(' ') : 'Mi auto';
  const segs = segments();
  const all = summary(segs);
  const hero = $('#hero');
  if (segs.length) {
    const last = segs[segs.length - 1];
    const diff = all.kml ? last.kml - all.kml : 0;
    const pts = segs.slice(-8).map((s) => s.kml);
    hero.innerHTML = `
      <span class="lbl">Último tanque</span>
      <div class="row baseline gap8">
        <span class="big">${fmt(last.kml, 1)}</span><span class="unit">km/l</span>
        ${segs.length > 1 ? `<span class="delta">${Math.abs(diff) < 0.05 ? '= promedio' : (diff > 0 ? '▲ ' : '▼ ') + fmt(Math.abs(diff), 1) + ' vs. promedio'}</span>` : ''}
      </div>
      ${pts.length > 1 ? spark(pts) : ''}
      <span class="lbl">${pts.length > 1 ? 'Últimos ' + pts.length + ' tanques' : 'Primer tanque medido'}</span>`;
  } else {
    hero.innerHTML = `
      <span class="lbl">Bienvenido</span>
      <span style="font-family:Outfit,sans-serif;font-size:22px;font-weight:700;line-height:1.25">Registrá cada carga y te mostramos cuánto rinde tu auto.</span>
      <span class="lbl">Tip: empezá con el tanque lleno. Desde la siguiente carga completa ya vas a ver tu consumo.</span>`;
  }
  $('#st-cpk').textContent = all.cpk ? money(all.cpk) : '—';
  const now = new Date();
  const month = db.loads.filter((l) => { const d = new Date(l.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
    .reduce((a, l) => a + l.total, 0);
  $('#st-month').textContent = month ? money(month) : '$ 0';

  const segBy = Object.fromEntries(segs.map((s) => [s.loadId, s]));
  const recent = db.loads.slice().sort((a, b) => b.odo - a.odo).slice(0, 3);
  $('#recent').innerHTML = recent.length ? recent.map((l) => loadRow(l, segBy[l.id])).join('')
    : '<div class="empty">Todavía no registraste cargas.</div>';
}
function loadRow(l, seg) {
  return `<div class="load">
    <span class="brand">${esc(brandAbbr(l.brand))}</span>
    <div class="col gap2" style="min-width:0">
      <span class="t ellipsis">${esc(l.stationName)}</span>
      <span class="s">${shortDate(l.date)} · ${fmt(l.liters, 1)} l · ${esc(l.fuel)}${l.full ? '' : ' · parcial'}</span>
    </div>
    <span class="v">${seg ? fmt(seg.kml, 1) + ' km/l' : money(l.total)}</span>
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
function renderStep1() {
  $('#search-box').classList.add('hidden');
  $('#search-input').value = '';
  $('#search-list').innerHTML = '';
  updateNext1();
  if (draft.pos) { showNear(); return; }
  $('#gps-msg').textContent = 'Buscando tu ubicación…';
  $('#near-list').innerHTML = '<div class="empty">Buscando estaciones cercanas…</div>';
  drawMap([]);
  if (!navigator.geolocation) { gpsFailed('Este navegador no permite usar el GPS.'); return; }
  navigator.geolocation.getCurrentPosition(
    (p) => { draft.pos = { lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy }; showNear(); },
    (err) => gpsFailed(err.code === 1 ? 'Sin permiso para usar el GPS. Podés buscar la estación a mano.' : 'No pudimos ubicarte. Buscá la estación a mano.'),
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
  );
}
function gpsFailed(msg) {
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
  $('#gps-msg').textContent = 'Te ubicamos. Confirmá en qué estación estás.';
  nearList = STATIONS.map((s) => ({ s, d: distM(pos, s) })).sort((a, b) => a.d - b.d).filter((x) => x.d < 5000).slice(0, 5);
  $('#near-title').textContent = nearList.length ? 'Estaciones cerca tuyo' : 'No hay estaciones de la base a menos de 5 km';
  if (!draft.station && nearList.length && nearList[0].d < 300) draft.station = nearList[0].s; // la más cercana, preseleccionada
  renderOptions('#near-list', nearList);
  if (!nearList.length) { $('#near-list').innerHTML = ''; $('#search-box').classList.remove('hidden'); }
  drawMap(nearList);
  updateNext1();
}
function renderOptions(sel, list) {
  const box = $(sel);
  box.innerHTML = list.map(({ s, d }, i) => `
    <button class="opt ${draft.station && draft.station.id === s.id ? 'sel' : ''}" data-i="${i}">
      <span class="dot"></span>
      <span class="col gap2" style="min-width:0">
        <span class="t">${esc(s.brand)}${s.mine ? '<span class="mine">TUYA</span>' : ''}</span>
        <span class="s ellipsis">${esc(s.address)} · ${esc(s.city)}</span>
      </span>
      <span class="d">${d == null ? '' : distTxt(d)}</span>
    </button>`).join('');
  box.querySelectorAll('.opt').forEach((b) => b.onclick = () => pickStation(list[+b.dataset.i], sel !== '#near-list'));
}
function pickStation(item, fromSearch) {
  draft.station = item.s;
  refreshSelection();
  updateNext1();
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
  $$('#map .pin').forEach((p) => p.classList.toggle('sel', !!draft.station && p.dataset.id === draft.station.id));
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

function drawMap(list) {
  const map = $('#map');
  let html = `<div class="road" style="left:-20px;top:42%;width:120%;height:16px;transform:rotate(-8deg)"></div>
    <div class="road" style="left:38%;top:-20px;width:14px;height:130%;transform:rotate(12deg)"></div>
    <div class="road" style="left:0;top:80%;width:100%;height:9px;opacity:.6"></div>
    <div class="road" style="left:70%;top:0;width:9px;height:100%;opacity:.6"></div>`;
  if (draft.pos) {
    const p0 = draft.pos, k = Math.cos(p0.lat * Math.PI / 180);
    const xy = list.map(({ s }) => [(s.lon - p0.lon) * 111320 * k, (s.lat - p0.lat) * 110540]);
    const maxr = Math.max(60, ...xy.map(([x, y]) => Math.max(Math.abs(x), Math.abs(y))));
    html += xy.map(([x, y], i) => `<span class="pin ${draft.station && draft.station.id === list[i].s.id ? 'sel' : ''}" data-id="${esc(list[i].s.id)}" style="left:${50 + x / maxr * 40}%;top:${50 - y / maxr * 38}%">${esc(list[i].s.brand)}</span>`).join('');
    html += `<span class="me-ping"></span><span class="me"></span><span class="acc">GPS · precisión ${Math.round(p0.acc)} m</span>`;
  }
  map.innerHTML = html;
}

/* ---------------- PASO 2: combustible ---------------- */
function renderStep2() {
  $('#step2-where').textContent = 'Paso 2 de 3 · ' + (draft.station ? stationLabel(draft.station) : '');
  $('#fuel-hint').textContent = db.lastFuel && draft.fuel === db.lastFuel ? 'Como la última vez' : '';
  $('#fuel-pills').innerHTML = FUELS.map((f) => `<button class="pill ${f === draft.fuel ? 'sel' : ''}" aria-pressed="${f === draft.fuel}">${f}</button>`).join('');
  $$('#fuel-pills .pill').forEach((b, i) => b.onclick = () => { draft.fuel = FUELS[i]; renderStep2(); });
  $('#in-liters').value = draft.liters;
  $('#in-total').value = draft.total;
  setToggle(draft.full);
  calcPpl();
}
function calcPpl() {
  draft.liters = $('#in-liters').value; draft.total = $('#in-total').value;
  const l = parseNum(draft.liters), t = parseNum(draft.total);
  const ok = l > 0 && t > 0;
  $('#ppl').textContent = ok ? money(t / l) : '—';
  $('#next2').disabled = !ok;
}
$('#in-liters').addEventListener('input', calcPpl);
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
  const n = parseInt(draft.odo || '0', 10), last = lastOdo();
  $('#odo-num').textContent = fmt(n);
  const tag = $('#odo-tag');
  tag.className = 'odo-tag';
  if (!draft.odo) tag.textContent = '';
  else if (last && n > last) { tag.classList.add('ok'); tag.textContent = 'Recorriste ' + fmt(n - last) + ' km desde la última carga'; }
  else if (last && n <= last && draft.odo.length >= String(last).length) { tag.classList.add('bad'); tag.textContent = 'Es menor que la última carga (' + fmt(last) + ' km)'; }
  else tag.textContent = '';
  const lastLoad = db.loads.slice().sort((a, b) => b.odo - a.odo)[0];
  $('#odo-last').textContent = lastLoad ? 'Última carga: ' + fmt(lastLoad.odo) + ' km · ' + shortDate(lastLoad.date) : 'Primera carga: anotá el kilometraje actual.';
  $('#save').disabled = !draft.odo;
}
$('#save').onclick = () => {
  const n = parseInt(draft.odo || '0', 10), last = lastOdo();
  if (!n) return;
  if (last && n <= last) { $('.odo').classList.add('shake'); setTimeout(() => $('.odo').classList.remove('shake'), 400); toast('El kilometraje tiene que ser mayor a ' + fmt(last) + ' km.'); return; }
  if (last && n - last > 1500) {
    sheet('¿Es correcto?', `<p class="muted small" style="margin:0">Serían ${fmt(n - last)} km desde la última carga. ¿Lo guardamos igual?</p>`,
      [{ label: 'Sí, guardar', primary: true, run: () => commit(n) }, { label: 'Corregir' }]);
    return;
  }
  commit(n);
};
let lastSaved = null;
function commit(odo) {
  const s = draft.station;
  const load = {
    id: 'l-' + Date.now(), date: new Date().toISOString(),
    stationId: s.id, stationName: stationLabel(s), brand: s.brand,
    lat: draft.pos ? draft.pos.lat : null, lon: draft.pos ? draft.pos.lon : null,
    fuel: draft.fuel, liters: parseNum(draft.liters), total: parseNum(draft.total), full: draft.full, odo
  };
  db.loads.push(load);
  db.lastFuel = draft.fuel;
  save();
  lastSaved = load;
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
        <span class="lite small">Consumo de este tanque</span>
        <div class="row baseline gap8"><span class="done-big">${fmt(seg.kml, 1)}</span><span style="font-size:22px;font-weight:600">km/l</span></div>
        <span class="lite small">equivale a ${fmt(100 / seg.kml, 1)} l cada 100 km</span>
      </div>
      <div class="grid3 rise d3" style="width:100%">
        <div class="tile"><b>${fmt(seg.km)}</b><span>km recorridos</span></div>
        <div class="tile"><b>${money(ppl)}</b><span>por litro</span></div>
        <div class="tile"><b>${money(seg.cost / seg.km)}</b><span>por km</span></div>
      </div>
      ${prev.kml ? `<div class="cmp rise d4">
        <span class="b6 small">Comparado con tu promedio</span>
        <div class="bar-row"><span class="lab">Promedio</span><span class="trk"><i style="width:${prev.kml / max * 100}%;background:#9AA6AE"></i></span><span class="val">${fmt(prev.kml, 1)}</span></div>
        <div class="bar-row"><span class="lab">Este tanque</span><span class="trk"><i style="width:${seg.kml / max * 100}%;background:#0B6E5A"></i></span><span class="val">${fmt(seg.kml, 1)}</span></div>
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
        ? 'Este es tu punto de partida. En la próxima carga con tanque lleno vas a ver el consumo.'
        : 'Carga parcial guardada. El consumo se calcula cuando vuelvas a llenar el tanque.'}</p>`;
  }
  $('#done-body').innerHTML = `
    <div class="check-wrap"><span class="check-ring"></span><span class="check-dot"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span></div>
    <h1 class="h1 rise d1" style="font-size:30px;margin-top:6px">¡Carga guardada!</h1>
    <span class="lite small rise d1">${esc(l.stationName)} · hoy</span>
    ${main}`;
}

/* ---------------- HISTORIAL ---------------- */
let period = 1; // 0:3M 1:6M 2:1A 3:Todo
const PERIODS = [['3M', 3], ['6M', 6], ['1A', 12], ['Todo', 999]];
function renderHistory() {
  $('#period').innerHTML = PERIODS.map(([lab], i) => `<button class="${i === period ? 'on' : ''}" aria-pressed="${i === period}">${lab}</button>`).join('');
  $$('#period button').forEach((b, i) => b.onclick = () => { period = i; renderHistory(); });
  const from = new Date(); from.setMonth(from.getMonth() - PERIODS[period][1]);
  const segs = segments().filter((s) => new Date(s.date) >= from);
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
  db.loads.forEach((l) => { const k = l.stationId; by[k] = by[k] || { name: l.stationName, n: 0, l: 0, t: 0 }; by[k].n++; by[k].l += l.liters; by[k].t += l.total; });
  const rows = Object.values(by).sort((a, b) => b.n - a.n);
  $('#by-station').innerHTML = rows.length ? rows.map((r) => `<div class="trow"><span class="g ellipsis">${esc(r.name)}</span><span class="muted xs">${r.n} ${r.n === 1 ? 'carga' : 'cargas'}</span><span class="b6" style="width:76px;text-align:right">${money(r.t / r.l)}/l</span></div>`).join('')
    : '<div class="empty">Todavía no hay cargas.</div>';

  // Todas las cargas
  const segBy = Object.fromEntries(segments().map((s) => [s.loadId, s]));
  const all = db.loads.slice().sort((a, b) => b.odo - a.odo);
  $('#all-loads').innerHTML = all.length ? all.map((l) => `<div class="trow">
      <span class="g col gap2"><span class="b6 ellipsis">${esc(l.stationName)}</span><span class="muted xs">${shortDate(l.date)} · ${fmt(l.odo)} km · ${fmt(l.liters, 1)} l · ${money(l.total)}${l.full ? '' : ' · parcial'}</span></span>
      <span class="b6">${segBy[l.id] ? fmt(segBy[l.id].kml, 1) : ''}</span>
      <button class="del" data-del="${esc(l.id)}" aria-label="Borrar carga"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg></button>
    </div>`).join('') : '<div class="empty">Todavía no hay cargas.</div>';
  $$('#all-loads [data-del]').forEach((b) => b.onclick = () => {
    const l = db.loads.find((x) => x.id === b.dataset.del);
    sheet('¿Borrar esta carga?', `<p class="muted small" style="margin:0">${esc(l.stationName)} · ${shortDate(l.date)} · ${fmt(l.odo)} km. No se puede deshacer.</p>`,
      [{ label: 'Borrar', primary: true, run: () => { db.loads = db.loads.filter((x) => x.id !== l.id); save(); renderHistory(); toast('Carga borrada.'); } }, { label: 'Cancelar' }]);
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
    ${ticks.map((t) => `<line x1="${L}" x2="${W}" y1="${y(t)}" y2="${y(t)}" stroke="#EEF2EF"/><text x="${L - 6}" y="${y(t) + 3}" font-size="10" fill="#5A6772" text-anchor="end">${fmt(t, 0)}</text>`).join('')}
    <line x1="${L}" x2="${W}" y1="${y(avg)}" y2="${y(avg)}" stroke="#E8A33D" stroke-width="1.5" stroke-dasharray="4 4"/>
    <polyline class="chart-line" points="${pts}" fill="none" stroke="#0B6E5A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    ${segs.map((s, i) => `<circle cx="${x(i)}" cy="${y(s.kml)}" r="3.5" fill="#fff" stroke="#0B6E5A" stroke-width="2"><title>${shortDate(s.date)}: ${fmt(s.kml, 1)} km/l</title></circle>`).join('')}
    <text x="${L}" y="${H - 6}" font-size="10" fill="#5A6772">${shortDate(segs[0].date)}</text>
    <text x="${W}" y="${H - 6}" font-size="10" fill="#5A6772" text-anchor="end">${shortDate(segs[segs.length - 1].date)}</text>
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
        <text x="${xx + bw / 2}" y="${H - 5}" font-size="11" font-weight="600" fill="#5A6772" text-anchor="middle">${MONTHS[m.m]}</text>`;
    }).join('')}
  </svg>`;
}

/* ---------------- MI AUTO ---------------- */
function renderCar() {
  const c = db.car;
  $('#c-brand').value = c.brand; $('#c-model').value = c.model; $('#c-year').value = c.year; $('#c-tank').value = c.tank;
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
  $('#db-info').textContent = `Base de estaciones ${stationsVersion} · ${fmt(officialCount)} estaciones` +
    (mine ? ` · ${mine} agregada${mine > 1 ? 's' : ''} por vos` : '') + (fixed ? ` · ${fixed} corregida${fixed > 1 ? 's' : ''}` : '');
}
$('#car-form').onsubmit = (e) => {
  e.preventDefault();
  db.car = { brand: $('#c-brand').value.trim(), model: $('#c-model').value.trim(), year: $('#c-year').value.trim(), tank: $('#c-tank').value.trim() };
  save();
  $('#car-saved').classList.remove('hidden');
  toast('Auto guardado.');
};
$('#btn-share').onclick = async () => {
  const sum = summary(segments()), c = db.car;
  const car = [c.brand, c.model, c.year].filter(Boolean).join(' ') || 'Mi auto';
  const text = sum.kml
    ? `${car}: rinde ${fmt(sum.kml, 1)} km/l (${fmt(100 / sum.kml, 1)} l/100 km) en ${fmt(sum.km)} km medidos. Costo: ${money(sum.cpk)} por km. — Mi Consumo`
    : `Estoy registrando el consumo de ${car} con Mi Consumo.`;
  try {
    if (navigator.share) await navigator.share({ title: 'Mi consumo', text });
    else { await navigator.clipboard.writeText(text); toast('Resumen copiado. Pegalo donde quieras.'); }
  } catch (e) { /* el usuario canceló */ }
};
$('#btn-export').onclick = () => {
  if (!db.loads.length) { toast('Todavía no hay cargas para exportar.'); return; }
  const segBy = Object.fromEntries(segments().map((s) => [s.loadId, s]));
  const dec = (n, d) => (n == null ? '' : Number(n).toFixed(d).replace('.', ','));
  const head = ['Fecha', 'Estación', 'Combustible', 'Litros', 'Total $', 'Precio/litro', 'Tanque lleno', 'Kilometraje', 'km/l'];
  const rows = db.loads.slice().sort((a, b) => a.odo - b.odo).map((l) => [
    new Date(l.date).toLocaleDateString('es-AR'), l.stationName, l.fuel, dec(l.liters, 2), dec(l.total, 2), dec(l.total / l.liters, 2),
    l.full ? 'Sí' : 'No', l.odo, segBy[l.id] ? dec(segBy[l.id].kml, 2) : '']);
  const csv = '﻿' + [head, ...rows].map((r) => r.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(';')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = 'mis-cargas.csv'; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
};

/* ---------------- Arranque ---------------- */
const RENDER = { home: renderHome, step1: renderStep1, step2: renderStep2, step3: renderStep3, done: renderDone, history: renderHistory, car: renderCar };
loadStations().then(() => { if (current === 'car') renderCar(); });
go('home');

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
