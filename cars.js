/* Mi Consumo — varios autos ("Mis autos") y pregunta de auto al cambiar de país.
   El auto activo usa los campos de siempre (db.car, db.loads, db.trips, carId…); los demás quedan en db.garage. */
'use strict';

const CAR_FIELDS = ['car', 'loads', 'trips', 'carId', 'dirty', 'tombstones', 'lastPull', 'carDirty', 'shareStats', 'carMeta'];
const KIND_LABEL = { own: 'Propio', rental: 'Alquilado', lent: 'Prestado', shared: 'Compartido' };
const carName = (c) => [c.brand, c.model, c.year].filter(Boolean).join(' ') || 'Auto sin nombre';
const newCarKey = () => 'c-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

function emptyCarEntry(car, meta) {
  return { car: Object.assign({ brand: '', model: '', year: '', tank: '' }, car), loads: [], trips: [], carId: null, dirty: [], tombstones: [],
    lastPull: null, carDirty: true, shareStats: true,
    carMeta: Object.assign({ key: newCarKey(), kind: 'own', country: COUNTRY, archived: false, archiveOnReturn: false, lastUsed: 0, seenIn: [] }, meta) };
}
// Todos los autos: el activo primero
function allCars() {
  const active = {}; CAR_FIELDS.forEach((f) => { active[f] = db[f]; });
  return [active].concat(db.garage || []);
}
function carKml(entry) { return summary(segments(entry.loads || [])).kml; }

// Cambiar de auto: guarda el activo en el garaje y trae el elegido
function switchToCar(key, quiet) {
  if (!key || db.carMeta.key === key) return;
  const i = db.garage.findIndex((g) => g.carMeta.key === key);
  if (i < 0) return;
  const prev = {}; CAR_FIELDS.forEach((f) => { prev[f] = db[f]; });
  // Un alquilado que se marcó "archivar al volver" se archiva al dejarlo en otro país
  if (prev.carMeta.archiveOnReturn && prev.carMeta.country !== COUNTRY) {
    prev.carMeta.archived = true;
    if (!quiet) setTimeout(() => toast(`Archivamos ${carName(prev.car)} (${KIND_LABEL[prev.carMeta.kind].toLowerCase()}). Su historial queda guardado.`), 1600);
  }
  const next = db.garage.splice(i, 1)[0];
  db.garage.push(prev);
  CAR_FIELDS.forEach((f) => { db[f] = next[f] !== undefined ? next[f] : blank()[f]; });
  if (!db.trips) db.trips = [];
  db.carMeta.archived = false; db.carMeta.lastUsed = Date.now();
  save(); renderTabbars();
  if (!quiet) toast('Ahora: ' + carName(db.car));
  if (typeof cloudSync === 'function') cloudSoon();
}
function addCar(car, meta) {
  const e = emptyCarEntry(car, meta);
  db.garage.push(e);
  switchToCar(e.carMeta.key, true);
  return e;
}

/* ---------- Formulario "Auto nuevo" ---------- */
function openNewCar(opts, then) {
  opts = opts || {};
  const kind = opts.kind || 'own', ctry = opts.country || COUNTRY;
  const kinds = [['own', 'Propio'], ['rental', 'Alquilado'], ['lent', 'Prestado']];
  sheet('Auto nuevo', `
    <div class="col gap10">
      <div class="seg3" role="radiogroup" aria-label="Este auto es">${kinds.map(([k, l]) =>
        `<label class="segopt"><input type="radio" name="nk" value="${k}" ${k === kind ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>
      <div class="grid2">
        <div class="col gap6"><label for="n-brand" class="muted xs b6">Marca</label><input id="n-brand" class="field" placeholder="Seat"></div>
        <div class="col gap6"><label for="n-model" class="muted xs b6">Modelo</label><input id="n-model" class="field" placeholder="Ibiza"></div>
      </div>
      <div class="grid2">
        <div class="col gap6"><label for="n-year" class="muted xs b6">Año (opcional)</label><input id="n-year" class="field" inputmode="numeric"></div>
        <div class="col gap6"><label for="n-tank" class="muted xs b6">Tanque (l, opcional)</label><input id="n-tank" class="field" inputmode="numeric"></div>
      </div>
      <span class="muted xs b6">¿Qué combustible carga?</span>
      <div class="seg3 segfuel" role="radiogroup" aria-label="Combustible habitual">${COUNTRIES[ctry].fuels.map((f) =>
        `<label class="segopt"><input type="radio" name="nf" value="${esc(f)}"><span>${esc(f)}</span></label>`).join('')}</div>
      <label class="row center gap10 ${kind === 'own' ? 'hidden' : ''}" id="n-arch-row"><input type="checkbox" id="n-arch" ${kind === 'own' ? '' : 'checked'} style="width:22px;height:22px;accent-color:var(--green)">
        <span class="col gap2"><span class="small b6">Archivarlo cuando cambie de país</span><span class="muted xs">Sale de la lista y conserva su historial</span></span></label>
      <span class="muted xs">Se usa en ${esc(COUNTRIES[ctry].name)}. En la primera carga llená el tanque: el consumo aparece desde la segunda carga completa.</span>
    </div>`,
    [{ label: 'Guardar', primary: true, run: () => {
        const model = $('#n-model').value.trim(), brand = $('#n-brand').value.trim();
        if (!model && !brand) { toast('Poné al menos la marca o el modelo.'); return false; }
        const k = (document.querySelector('input[name="nk"]:checked') || {}).value || 'own';
        const fuel = (document.querySelector('input[name="nf"]:checked') || {}).value;
        if (!fuel) { toast('Elegí el combustible que carga.'); return false; }
        addCar({ brand, model, year: $('#n-year').value.trim(), tank: $('#n-tank').value.trim(), fuel },
          { kind: k, country: ctry, archiveOnReturn: k !== 'own' && $('#n-arch').checked, lastUsed: Date.now(), seenIn: [ctry] });
        toast('Listo: ahora cargás con ' + carName(db.car) + '.');
        draft.fuel = fuel;
        if (then) then(); else if (current === 'car') renderCar(); else if (current === 'home') renderHome();
      } }, { label: 'Cancelar' }]);
  $$('input[name="nk"]').forEach((r) => r.onchange = () => {
    const own = r.value === 'own' && r.checked;
    if (r.checked) { $('#n-arch-row').classList.toggle('hidden', own); $('#n-arch').checked = !own; }
  });
}

/* ---------- ¿Con qué auto? (al cambiar de país) ---------- */
function askCarFor(code, manual) {
  if (!code || !COUNTRIES[code] || draft.carAsked) return;
  const m = db.carMeta;
  // Primera vez (sin cargas ni otros autos): el auto es de este país, no hace falta preguntar
  if (!db.loads.length && !(db.garage || []).length) { if (m.country !== code) { m.country = code; save(); } return; }
  if (m.country === code || (m.seenIn || []).includes(code)) return;
  draft.carAsked = true;
  const others = (db.garage || []).filter((g) => !g.carMeta.archived || g.carMeta.country === code)
    .sort((a, b) => (b.carMeta.country === code) - (a.carMeta.country === code) || (b.carMeta.lastUsed || 0) - (a.carMeta.lastUsed || 0));
  const line = (e, extra) => `${carName(e.car)} · ${KIND_LABEL[e.carMeta.kind].toLowerCase()}${extra || ''}`;
  const acts = others.slice(0, 4).map((e) => ({ label: line(e, e.carMeta.country === code ? '' : ' (' + COUNTRIES[e.carMeta.country || 'AR'].name + ')'),
    run: () => { switchToCar(e.carMeta.key); markSeen(code); refreshAfterCar(); } }));
  acts.push({ label: 'Sigo con ' + carName(db.car), run: () => { markSeen(code); } });
  acts.unshift({ label: '+ Auto nuevo (alquilado o prestado)', primary: true, run: () => { setTimeout(() => openNewCar({ kind: 'rental', country: code }, refreshAfterCar), 50); } });
  if (manual) acts.push({ label: 'Era una prueba: volver a automático', run: () => {
    db.country = 'auto'; save(); draft.pos = null; draft.simulated = false; draft.station = null;
    loadStations((lastFix && countryAt(lastFix.lat, lastFix.lon)) || 'AR').then(() => { if (current === 'step1') renderStep1(); });
  } });
  setTimeout(() => sheet(`Estás cargando en ${COUNTRIES[code].name}`,
    `<p class="muted small" style="margin:0">¿Con qué auto? Así el consumo de tu auto no se mezcla con el de uno alquilado.</p>`, acts), 300);
}
function markSeen(code) { db.carMeta.seenIn = Array.from(new Set((db.carMeta.seenIn || []).concat(code))); save(); }
function refreshAfterCar() {
  draft.fuel = prefFuel();
  if (current === 'home') renderHome();
  if (current === 'car') renderCar();
}

/* ---------- Lista "Mis autos" ---------- */
function renderGarage() {
  const box = $('#garage'); if (!box) return;
  const cars = allCars();
  const card = (e, active) => {
    const k = carKml(e), m = e.carMeta;
    return `<button class="carrow ${active ? 'on' : ''}" ${active ? 'aria-current="true"' : `data-car="${m.key}"`}>
      <span class="ico-box">${m.kind === 'shared' ? '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.5A5 5 0 0 1 21 19"/></svg>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 17h14v-5l-2-5H7l-2 5z"/><circle cx="8" cy="17" r="2"/><circle cx="16" cy="17" r="2"/></svg>'}</span>
      <span class="col gap2 grow left" style="min-width:0"><span class="b6 ellipsis">${esc(carName(e.car))}</span>
        <span class="muted xs">${KIND_LABEL[m.kind]} · ${esc(COUNTRIES[m.country || 'AR'].name)} · ${(e.loads || []).length} carga${(e.loads || []).length === 1 ? '' : 's'}${e.carId ? ' · en la nube' : ''}</span></span>
      <span class="col gap2" style="align-items:flex-end">${active ? '<span class="badge-on">EN USO</span>' : ''}<span class="b6 small">${k ? fmt(k, 1) + ' km/l' : ''}</span></span>
    </button>`;
  };
  const live = cars.slice(1).filter((e) => !e.carMeta.archived), arch = cars.slice(1).filter((e) => e.carMeta.archived);
  box.innerHTML = `<span class="muted xs">Tocá un auto para usarlo. Las cargas y los viajes quedan guardados en cada uno.</span>
    ${card(cars[0], true)}${live.map((e) => card(e, false)).join('')}
    <button class="btn-add" id="car-add">+ Agregar auto</button>
    ${arch.length ? `<details class="arch"><summary class="muted small b6">Archivados (${arch.length})</summary>${arch.map((e) => card(e, false)).join('')}</details>` : ''}
    ${live.length ? '<button class="link left xs" id="car-archive">Archivar el auto en uso…</button>' : ''}`;
  box.querySelectorAll('[data-car]').forEach((b) => b.onclick = () => { switchToCar(b.dataset.car); renderCar(); });
  $('#car-add').onclick = () => openNewCar({ kind: 'own', country: COUNTRY });
  if ($('#car-archive')) $('#car-archive').onclick = () => sheet('¿Archivar ' + carName(db.car) + '?',
    '<p class="muted small" style="margin:0">Sale de la lista y se conserva todo su historial. Podés volver a usarlo desde "Archivados".</p>',
    [{ label: 'Archivar', primary: true, run: () => { const cur = db.carMeta; const nxt = live[0]; switchToCar(nxt.carMeta.key, true);
        const g = db.garage.find((x) => x.carMeta === cur); if (g) g.carMeta.archived = true; save(); renderCar(); toast('Auto archivado.'); } },
     { label: 'Cancelar' }]);
}

// Chip del inicio: si hay varios autos, elegir; si no, ir a "Mi auto"
$('#car-chip').removeAttribute('data-go');
$('#car-chip').onclick = () => {
  const live = (db.garage || []).filter((g) => !g.carMeta.archived);
  if (!live.length) { go('car'); return; }
  sheet('¿Qué auto usás?', '', [{ label: '✓ ' + carName(db.car), primary: true }]
    .concat(live.map((e) => ({ label: carName(e.car) + ' · ' + KIND_LABEL[e.carMeta.kind].toLowerCase(), run: () => { switchToCar(e.carMeta.key); renderHome(); } })))
    .concat([{ label: '+ Auto nuevo', run: () => setTimeout(() => openNewCar({ kind: 'own', country: COUNTRY }), 50) }, { label: 'Ver Mis autos', run: () => go('car') }]));
};
renderTabbars();
