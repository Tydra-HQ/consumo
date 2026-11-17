/* Mi Consumo — Fase 2: cuenta opcional, copia en la nube, auto compartido, ranking y sugerencias de estaciones.
   Base de datos: Supabase. La clave de abajo es la "publicable": está pensada para ir en la app;
   la seguridad la ponen las reglas (RLS) de la base, no el secreto de la clave. */
'use strict';

const SB_URL = 'https://bcpzopohqetsmfqllboi.supabase.co';
const SB_KEY = 'sb_publishable_qssBOD1BSCTWRbPdwOCwhA_fXss0mrJ';

let sb = null, user = null, syncing = false, syncAgain = false, isAdmin = false;
let cloudStatus = '', myCars = [], pendingEmail = '';

// Nombre para el saludo de Inicio: el apodo, o la primera parte del correo ("leonardo.dente@…" → "Leonardo")
function cloudUserName() {
  if (!user) return null;
  if (db.nickname) return db.nickname;
  const p = (user.email || '').split('@')[0].split(/[._-]/)[0];
  return p ? p.charAt(0).toUpperCase() + p.slice(1) : null;
}

function initCloud() {
  if (!window.supabase || !window.supabase.createClient) return;
  sb = window.supabase.createClient(SB_URL, SB_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' }
  });
  sb.auth.onAuthStateChange((event, session) => {
    const was = user && user.id;
    user = session ? session.user : null;
    if (event === 'SIGNED_IN' && !was) toast('Sesión iniciada: ' + user.email);
    if (user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) setTimeout(cloudSync, 50);
    if (!user) { isAdmin = false; myCars = []; }
    renderCloud();
    if (current === 'home') renderHome();
  });
  fetchOverrides();
  window.addEventListener('online', () => { fetchOverrides(); cloudSync(); });
}

/* ---------- Cambios de estaciones aprobados (para todos, con o sin cuenta) ---------- */
async function fetchOverrides() {
  if (!sb || !navigator.onLine) return;
  const { data, error } = await sb.from('station_overrides').select('*');
  if (error || !data) return;
  db.overrides = data; save();
  if (typeof mergeUserLayer === 'function' && STATIONS.length) mergeUserLayer();
}

/* ---------- Sincronización ---------- */
const toRow = (l, carId) => ({
  id: l.id, car_id: carId, date: l.date, station_id: l.stationId, station_name: l.stationName, brand: l.brand,
  lat: l.lat, lon: l.lon, fuel: l.fuel, liters: l.liters, total: l.total, full: l.full, odo: l.odo, deleted: false
});
const fromRow = (r) => ({
  id: r.id, date: r.date, stationId: r.station_id, stationName: r.station_name, brand: r.brand,
  lat: r.lat, lon: r.lon, fuel: r.fuel, liters: Number(r.liters), total: Number(r.total), full: r.full, odo: r.odo
});

async function ensureCar() {
  const { data: cars, error } = await sb.from('cars').select('*').order('created_at');
  if (error) throw error;
  myCars = cars || [];
  if (db.carId && myCars.some((c) => c.id === db.carId)) { addCloudCars(); return; }
  // ¿Algún auto de este teléfono ya está en la nube de esta cuenta? Entonces este es un auto nuevo: se crea aparte
  const linked = (db.garage || []).some((g) => g.carId && myCars.some((c) => c.id === g.carId));
  if (myCars.length && !linked) {
    // Ya tenés un auto en la nube (otro teléfono): usamos ese y subimos lo que haya en este
    adoptCar(myCars.find((c) => c.owner === user.id) || myCars[0], false);
  } else {
    const c = db.car;
    const { data, error: e2 } = await sb.from('cars').insert({
      owner: user.id, brand: c.brand || null, model: c.model || null, year: parseInt(c.year, 10) || null,
      tank: parseFloat(c.tank) || null, share_stats: db.shareStats !== false
    }).select().single();
    if (e2) throw e2;
    myCars = myCars.concat([data]);
    db.carId = data.id; db.carDirty = false;
  }
  addCloudCars();
  db.dirty = Array.from(new Set(db.dirty.concat(db.loads.map((l) => l.id)))); // primera vez: subir todo
  db.lastPull = null;
  save();
}
// Autos de la cuenta que todavía no están en este teléfono (otro teléfono, auto compartido): se agregan a "Mis autos"
function addCloudCars() {
  if (typeof emptyCarEntry !== 'function') return;
  const known = new Set([db.carId].concat((db.garage || []).map((g) => g.carId)).filter(Boolean));
  for (const c of myCars) {
    if (known.has(c.id)) continue;
    const e = emptyCarEntry({ brand: c.brand || '', model: c.model || '', year: c.year ? String(c.year) : '', tank: c.tank ? String(c.tank) : '' },
      { kind: c.owner === user.id ? 'own' : 'shared', country: db.lastCountry || 'AR' });
    e.carId = c.id; e.carDirty = false; e.shareStats = c.share_stats !== false;
    db.garage.push(e);
  }
}
// Pasa a usar un auto de la nube. Si clear=true, reemplaza las cargas locales por las de ese auto
function adoptCar(car, clear) {
  db.carId = car.id; db.lastPull = null;
  db.shareStats = car.share_stats !== false;
  if (car.brand || car.model || !db.car.model) {
    db.car = { brand: car.brand || '', model: car.model || '', year: car.year ? String(car.year) : '', tank: car.tank ? String(car.tank) : '', fuel: db.car.fuel };
    db.carDirty = false;
  } else db.carDirty = true; // el auto en la nube está vacío: subimos los datos de este teléfono
  if (clear) { db.loads = []; db.dirty = []; db.tombstones = []; }
}

async function cloudSync() {
  if (!sb || !user || !navigator.onLine) return;
  if (syncing) { syncAgain = true; return; }
  syncing = true; setStatus('Sincronizando…');
  try {
    await ensureCar();
    const carId = db.carId;

    // 1) Subir cargas nuevas o cambiadas
    const dirty = db.loads.filter((l) => db.dirty.includes(l.id));
    if (dirty.length) {
      const { error } = await sb.from('loads').upsert(dirty.map((l) => toRow(l, carId)));
      if (error) throw error;
      db.dirty = db.dirty.filter((id) => !dirty.some((l) => l.id === id));
    }
    // 2) Marcar como borradas las que se eliminaron acá
    if (db.tombstones.length) {
      const { error } = await sb.from('loads').update({ deleted: true }).in('id', db.tombstones).eq('car_id', carId);
      if (error) throw error;
      db.tombstones = [];
    }
    // 3) Bajar lo que cambió en la nube (otros teléfonos o personas del auto compartido)
    let q = sb.from('loads').select('*').eq('car_id', carId).order('updated_at').limit(1000);
    if (db.lastPull) q = q.gt('updated_at', db.lastPull);
    const { data: rows, error: e3 } = await q;
    if (e3) throw e3;
    for (const r of rows || []) {
      const i = db.loads.findIndex((l) => l.id === r.id);
      if (r.deleted) { if (i >= 0) db.loads.splice(i, 1); }
      else if (!db.dirty.includes(r.id)) { if (i >= 0) db.loads[i] = fromRow(r); else db.loads.push(fromRow(r)); }
      db.lastPull = r.updated_at;
    }
    // 4) Datos del auto y estadísticas para el ranking
    const sum = summary(segments());
    const carUpd = { avg_kml: sum.kml ? Math.round(sum.kml * 100) / 100 : null, km_measured: Math.round(sum.km) || null, share_stats: db.shareStats !== false };
    if (db.carDirty) Object.assign(carUpd, { brand: db.car.brand || null, model: db.car.model || null, year: parseInt(db.car.year, 10) || null, tank: parseFloat(db.car.tank) || null });
    const { data: car, error: e4 } = await sb.from('cars').update(carUpd).eq('id', carId).select().single();
    if (e4) throw e4;
    if (!db.carDirty && car) db.car = { brand: car.brand || '', model: car.model || '', year: car.year ? String(car.year) : '', tank: car.tank ? String(car.tank) : '', fuel: db.car.fuel };
    db.carDirty = false;
    myCars = myCars.map((c) => (c.id === carId ? car : c));
    // 5) Enviar sugerencias de estaciones pendientes
    const unsent = db.suggestions.filter((x) => !x.sent);
    for (const sg of unsent) {
      const row = sg.type === 'new'
        ? { type: 'new', station_id: sg.station.id, brand: sg.station.brand, address: sg.station.address, city: sg.station.city, province: sg.station.province || null, lat: sg.station.lat, lon: sg.station.lon }
        : { type: 'move', station_id: sg.stationId, lat: sg.lat, lon: sg.lon };
      const { error } = await sb.from('station_suggestions').insert(row);
      if (!error) sg.sent = true;
    }
    // 6) Apodo guardado en la nube (por si se puso desde otro teléfono)
    if (db.langPending) { // eligió guardar el idioma en la cuenta antes de iniciar sesión
      const { error } = await sb.from('profiles').upsert({ id: user.id, lang: db.langPending });
      if (!error) { db.langPending = null; toast('Idioma guardado en tu cuenta.'); }
    }
    const { data: prof } = await sb.from('profiles').select('nickname, lang').eq('id', user.id).maybeSingle();
    if (prof) db.nickname = prof.nickname || '';
    // Idioma de la cuenta: se aplica salvo que en este teléfono se haya elegido otro "solo acá"
    if (prof && prof.lang && !db.langLocal && prof.lang !== (db.lang || LANG)) { db.lang = prof.lang; setLang(prof.lang, true); }
    // 7) ¿Sos administrador? (para aprobar sugerencias)
    const { data: adm } = await sb.rpc('is_admin');
    isAdmin = !!adm;
    save();
    setStatus('Sincronizado ✓ ' + new Date().toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }));
    if (current === 'car') renderCloud(); // refrescar código, autos y ranking
    if (current === 'home') renderHome();
    if (rows && rows.length && typeof RENDER !== 'undefined' && RENDER[current] && !['step1', 'step2', 'step3', 'car'].includes(current)) RENDER[current]();
  } catch (e) {
    setStatus('No se pudo sincronizar: ' + (e.message || e));
  } finally {
    syncing = false;
    if (syncAgain) { syncAgain = false; setTimeout(cloudSync, 500); }
  }
}
function setStatus(t) { cloudStatus = t; const el = document.getElementById('sync-status'); if (el) el.textContent = t; }

/* ---------- Pantalla "Mi auto": cuenta, compartir, ranking, administración ---------- */
function renderCloud() {
  const acct = $('#acct'); if (!acct) return;
  if (!sb) { acct.innerHTML = '<span class="muted small">La nube no está disponible sin conexión.</span>'; return; }
  if (!user) {
    acct.innerHTML = `
      <div class="row center gap10"><span class="ico-box">${ICON.cloud}</span>
        <div class="col gap2"><span class="b6">Copia en la nube (opcional)</span><span class="muted xs">Tus cargas a salvo y en cualquier teléfono. Además podés compartir el auto.</span></div></div>
      ${pendingEmail ? `
        <p class="small" style="margin:0">Te enviamos un correo a <b>${esc(pendingEmail)}</b>. Abrí el enlace <b>desde este teléfono</b>.</p>
        <label for="otp" class="muted xs b6">¿El correo trae un código de 6 dígitos? Escribilo acá:</label>
        <div class="row gap8"><input id="otp" class="field" inputmode="numeric" autocomplete="one-time-code" maxlength="10" placeholder="123456"><button class="btn2" id="otp-go" style="padding:0 16px">Entrar</button></div>
        <button class="link left" id="otp-back">Usar otro correo</button>`
      : `
        <label for="em" class="muted xs b6">Tu correo</label>
        <input id="em" class="field" type="email" inputmode="email" autocomplete="email" placeholder="nombre@gmail.com">
        <button class="next" id="em-go">Enviarme el enlace para entrar</button>
        <span class="muted xs">Sin contraseñas: te llega un enlace por correo.</span>`}`;
    if (pendingEmail) {
      $('#otp-go').onclick = async () => {
        const token = $('#otp').value.trim(); if (!token) return;
        const { error } = await sb.auth.verifyOtp({ email: pendingEmail, token, type: 'email' });
        if (error) toast('Código incorrecto o vencido.'); else { pendingEmail = ''; }
      };
      $('#otp-back').onclick = () => { pendingEmail = ''; renderCloud(); };
    } else {
      $('#em-go').onclick = async () => {
        const email = $('#em').value.trim();
        if (!/^\S+@\S+\.\S+$/.test(email)) { toast('Revisá el correo.'); return; }
        $('#em-go').disabled = true;
        const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname } });
        $('#em-go').disabled = false;
        if (error) toast('No se pudo enviar: ' + error.message); else { pendingEmail = email; renderCloud(); }
      };
    }
    $('#share-card').classList.add('hidden'); $('#admin-card').classList.add('hidden');
    $('#rank-card').innerHTML = `<span class="b6">Comparar con otros conductores</span><span class="muted xs">Iniciá sesión para ver cómo rinde tu auto frente a otros del mismo modelo.</span>`;
    return;
  }

  // Con sesión
  const carOpts = '';
  acct.innerHTML = `
    <div class="row center gap10"><span class="ico-box">${ICON.cloud}</span>
      <div class="col gap2" style="min-width:0"><span class="b6 ellipsis">${esc(user.email)}</span><span class="muted xs" id="sync-status">${esc(cloudStatus)}</span></div></div>
    ${carOpts}
    <label for="nick" class="muted xs b6">Apodo para el ranking (opcional)</label>
    <div class="row gap8"><input id="nick" class="field" maxlength="24" placeholder="Anónimo" value="${esc(db.nickname || '')}"><button class="btn2" id="nick-go" style="padding:0 16px">Guardar</button></div>
    <div class="grid2"><button class="btn2" id="sync-go">Sincronizar</button><button class="btn2" id="out-go">Cerrar sesión</button></div>`;
  $('#sync-go').onclick = () => cloudSync();
  $('#out-go').onclick = () => sheet('¿Cerrar sesión?', '<p class="muted small" style="margin:0">Tus cargas siguen en este teléfono y en la nube.</p>',
    [{ label: 'Cerrar sesión', primary: true, run: async () => { await sb.auth.signOut(); db.lastPull = null; save(); renderCloud(); } }, { label: 'Cancelar' }]);
  $('#nick-go').onclick = async () => {
    const nickname = $('#nick').value.trim() || null;
    const { error } = await sb.from('profiles').upsert({ id: user.id, nickname });
    if (error) toast(error.code === '23505' ? 'Ese apodo ya está en uso.' : 'No se pudo guardar el apodo.');
    else { db.nickname = nickname || ''; save(); toast('Apodo guardado.'); }
  };

  // Compartir el auto
  const car = myCars.find((c) => c.id === db.carId);
  const sc = $('#share-card'); sc.classList.remove('hidden');
  sc.innerHTML = `
    <span class="b6">Compartir ${esc(carName(db.car))}</span>
    <span class="muted xs">Para que otra persona (por ejemplo, de tu familia) registre cargas de este auto, pasale este código:</span>
    <div class="row center between"><span class="code">${car ? esc(car.invite_code) : '······'}</span><button class="btn2" id="code-share" style="padding:0 16px">Enviar código</button></div>
    <label for="join" class="muted xs b6">¿Te pasaron un código? Se agrega a tus autos:</label>
    <div class="row gap8"><input id="join" class="field" maxlength="6" placeholder="ABC123" style="text-transform:uppercase"><button class="btn2" id="join-go" style="padding:0 16px">Sumarme</button></div>`;
  $('#code-share').onclick = async () => {
    if (!car) return;
    const text = `Sumate a mi auto en Mi Consumo: abrí ${location.origin + location.pathname}, entrá en "Mi auto", iniciá sesión y usá el código ${car.invite_code}`;
    try { if (navigator.share) await navigator.share({ title: 'Mi Consumo', text }); else { await navigator.clipboard.writeText(text); toast('Mensaje copiado.'); } } catch (e) { /* cancelado */ }
  };
  $('#join-go').onclick = () => {
    const code = $('#join').value.trim().toUpperCase(); if (code.length < 6) { toast('El código tiene 6 caracteres.'); return; }
    sheet('¿Sumarte a ese auto?', '<p class="muted small" style="margin:0">Se agrega a "Mis autos" y pasa a ser el auto en uso. Tus otros autos quedan como están; cambiás desde la lista.</p>',
      [{ label: 'Sumarme', primary: true, run: async () => {
          await cloudSync(); // primero guardar lo propio
          const { data: cid, error } = await sb.rpc('join_car', { code });
          if (error) { toast(error.message.includes('invalid') ? 'Código inexistente.' : 'No se pudo: ' + error.message); return; }
          await switchCar(cid);
          toast('Listo: el auto compartido se agregó a tus autos.');
        } }, { label: 'Cancelar' }]);
  };

  renderRanking();
  renderAdmin();
}

async function switchCar(carId) {
  await cloudSync(); // guardar cambios del auto actual
  if (db.carId === carId) return;
  if (!db.garage.some((g) => g.carId === carId)) {
    const { data: car, error } = await sb.from('cars').select('*').eq('id', carId).single();
    if (error || !car) { toast('No se pudo abrir ese auto.'); return; }
    myCars = myCars.filter((c) => c.id !== car.id).concat([car]);
    addCloudCars();
  }
  const g = db.garage.find((x) => x.carId === carId);
  if (g) switchToCar(g.carMeta.key, true);
  await cloudSync();
  renderCar();
}

async function renderRanking() {
  const rc = $('#rank-card');
  const c = db.car;
  const head = `<div class="row between center"><span class="b6">${c.model ? '¿Cómo te va vs. otros ' + esc(c.model) + '?' : 'Comparar con otros conductores'}</span></div>`;
  const toggle = `<label class="row center gap10 xs muted" style="cursor:pointer"><input type="checkbox" id="share-stats" ${db.shareStats !== false ? 'checked' : ''} style="width:20px;height:20px;accent-color:#0B6E5A"> Participar en el ranking (con tu apodo o como "Anónimo")</label>`;
  if (!c.brand || !c.model) { rc.innerHTML = head + '<span class="muted xs">Completá marca y modelo de tu auto (arriba) para compararte.</span>' + toggle; bindToggle(); return; }
  rc.innerHTML = head + '<span class="muted xs">Cargando…</span>' + toggle; bindToggle();
  const { data, error } = await sb.rpc('leaderboard', { p_brand: c.brand, p_model: c.model });
  if (error) { rc.querySelector('.muted.xs').textContent = 'No se pudo cargar el ranking.'; return; }
  const rows = data || [];
  const list = rows.length
    ? rows.map((r, i) => `<div class="trow ${r.is_mine ? 'mine-row' : ''}"><span style="width:20px" class="b6 muted">${i + 1}</span><span class="g ellipsis">${r.is_mine ? 'Vos' + (r.name !== 'Anónimo' ? ' (' + esc(r.name) + ')' : '') : esc(r.name)}</span><span class="muted xs">${fmt(r.km)} km</span><span class="b6" style="width:54px;text-align:right">${fmt(r.kml, 1)}</span></div>`).join('')
      + (rows.length === 1 ? '<span class="muted xs">Por ahora sos el único con este modelo. ¡Invitá a otros!</span>' : '')
    : '<span class="muted xs">Todavía no hay datos de este modelo. Aparecés cuando midas al menos 200 km.</span>';
  rc.innerHTML = head + '<div class="col">' + list + '</div>' + toggle; bindToggle();
}
function bindToggle() {
  const t = $('#share-stats'); if (!t) return;
  t.onchange = () => { db.shareStats = t.checked; save(); cloudSync().then(renderRanking); };
}

async function renderAdmin() {
  const ac = $('#admin-card');
  if (!isAdmin) { ac.classList.add('hidden'); return; }
  ac.classList.remove('hidden');
  const { data, error } = await sb.from('station_suggestions').select('*').eq('status', 'pending').order('created_at').limit(50);
  if (error) { ac.innerHTML = '<span class="muted xs">No se pudieron cargar las sugerencias.</span>'; return; }
  const rows = data || [];
  ac.innerHTML = `<div class="row between center"><span class="b6">Sugerencias de estaciones</span><span class="badge">${rows.length} pendiente${rows.length === 1 ? '' : 's'}</span></div>` +
    (rows.length ? rows.map((r) => {
      const st = r.station_id ? STATIONS.find((x) => x.id === r.station_id) : null;
      const what = r.type === 'new' ? `Nueva: ${esc(r.brand || '')} · ${esc(r.address || '')}${r.city ? ' · ' + esc(r.city) : ''}`
        : `Mover: ${st ? esc(stationLabel(st)) : esc(r.station_id)}${st ? ' (' + distTxt(distM(st, r)) + ')' : ''}`;
      return `<div class="trow"><span class="g col gap2"><span class="small">${what}</span>
          <a class="xs" href="https://www.google.com/maps/search/?api=1&query=${r.lat},${r.lon}" target="_blank" rel="noopener">Ver en el mapa ↗</a></span>
        <button class="btn2" data-ok="${r.id}" style="padding:0 12px;height:40px">Aprobar</button>
        <button class="del" data-no="${r.id}" aria-label="Rechazar">${ICON.x}</button></div>`;
    }).join('') : '<span class="muted xs">No hay sugerencias para revisar.</span>');
  ac.querySelectorAll('[data-ok],[data-no]').forEach((b) => b.onclick = async () => {
    const approve = !!b.dataset.ok;
    const { error: e2 } = await sb.rpc('review_suggestion', { sid: Number(b.dataset.ok || b.dataset.no), approve });
    if (e2) { toast('No se pudo: ' + e2.message); return; }
    toast(approve ? 'Aprobada: ya la ven todos.' : 'Rechazada.');
    await fetchOverrides(); renderAdmin();
  });
}

const ICON = {
  cloud: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6 9.5 4.25 4.25 0 0 0 7 18z"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
};

initCloud();
// Sincronizar al abrir la app y al volver a ella
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') cloudSync(); });
