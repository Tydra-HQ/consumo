/* Mi Consumo — tutorial de primera vez: señala cada parte y, cuando hay que tocar algo, espera a que lo hagas.
   La carga que se hace durante el tutorial es de práctica: no se guarda. */
'use strict';

const typedOk = (sel) => () => { const el = $(sel); return el && el.value.trim() && Date.now() - (typedOk.last || 0) > 1300; };
document.addEventListener('input', () => { typedOk.last = Date.now(); }, true);

const TOUR = [
  { screen: 'home', sel: '#s-home .cta', wait: 'click', text: 'Cada vez que cargues combustible, tocá acá.' },
  { screen: 'step1', sel: '#map-wrap, #near-title, #near-list', wait: () => !!draft.station,
    text: 'Este es el mapa con las estaciones cerca tuyo. Tocá una (en el mapa o en la lista de abajo).' },
  { screen: 'step1', sel: '#country-chip', text: 'Acá elegís el país y, al lado, filtrás por bandera (por ejemplo, solo YPF o Shell).' },
  { screen: 'step1', sel: '#next1', wait: 'click', text: 'Ahora tocá Siguiente.' },
  { screen: 'step2', sel: '#fuel-pills', text: 'Tu combustible habitual ya viene marcado. Si cargaste otro, cambialo acá.' },
  { screen: 'step2', sel: '#in-liters', wait: typedOk('#in-liters'), text: 'Escribí los litros que cargaste. Es una práctica: no se guarda.' },
  { screen: 'step2', sel: '#in-total', wait: typedOk('#in-total'), text: 'Y el total que pagaste.' },
  { screen: 'step2', sel: '#tg-full', text: 'Si llenaste el tanque, dejalo prendido: así calculamos el consumo exacto.' },
  { screen: 'step2', sel: '#next2', wait: 'click', text: 'Tocá Siguiente.' },
  { screen: 'step3', sel: '#keypad', wait: () => !!draft.odo && Date.now() - (TOUR.lastKey || 0) > 1300, text: 'Marcá los kilómetros que dice el tablero del auto.' },
  { screen: 'step3', sel: '#save', wait: 'click', practice: true, text: 'Tocá Guardar y calcular. (Es la práctica: esta carga no se guarda.)' },
  { screen: 'home', sel: '#s-home .tabbar [data-go="history"]', text: 'En Historial ves los gráficos de consumo y de gasto.' },
  { screen: 'home', sel: '#s-home .tabbar [data-go="car"]', text: 'En Mis autos cargás los datos del auto, agregás otros (por ejemplo, uno alquilado) y elegís el idioma.' },
  { screen: 'home', sel: null, text: '¡Listo! Ya sabés usar la app. La próxima carga, hacela de verdad.' }
];
document.addEventListener('click', (e) => { if (e.target.closest('#keypad')) TOUR.lastKey = Date.now(); }, true);

let tourI = -1, tourTimer = null, tourEl = null, tourClicked = false;
function startTour() {
  if (tourEl) return;
  tourI = 0; tourClicked = false;
  if (current !== 'home') go('home');
  tourEl = document.createElement('div');
  tourEl.id = 'tour';
  tourEl.innerHTML = `<div class="tour-block"></div><div class="tour-ring"></div>
    <div class="tour-tip" role="dialog" aria-live="polite"><p class="tour-text"></p>
      <div class="row between center gap8"><button class="link" id="tour-skip">Saltar</button><span class="muted xs tour-n"></span><button class="next tour-ok" id="tour-ok">Entendido</button></div></div>`;
  document.body.appendChild(tourEl);
  $('#tour-skip').onclick = endTour;
  $('#tour-ok').onclick = () => nextStep();
  showStep();
  tourTimer = setInterval(tick, 150);
}
function endTour() {
  clearInterval(tourTimer); tourTimer = null;
  if (tourEl) tourEl.remove(); tourEl = null; tourI = -1;
  db.tourDone = true; save();
}
function stepSel(st) { return typeof st.sel === 'function' ? st.sel() : st.sel; }
function showStep() {
  const st = TOUR[tourI];
  tourClicked = false;
  $('.tour-text', tourEl).textContent = st.text;
  $('.tour-n', tourEl).textContent = (tourI + 1) + ' / ' + TOUR.length;
  const ok = $('#tour-ok');
  ok.textContent = tourI === TOUR.length - 1 ? '¡Listo!' : 'Entendido';
  ok.classList.toggle('hidden', !!st.wait);
  st.shownAt = Date.now();
  const sel = stepSel(st), el = sel && $(sel);
  if (el && st.wait === 'click') {
    el.addEventListener('click', (e) => {
      if (TOUR[tourI] !== st) return;
      if (st.practice) { e.preventDefault(); e.stopImmediatePropagation(); practiceDone(); return; }
      tourClicked = true;
    }, { capture: true, once: true });
  }
  tick();
}
function nextStep() {
  tourI++;
  if (tourI >= TOUR.length) { endTour(); return; }
  showStep();
}
// La carga de práctica: no se guarda; volvemos al inicio
function practiceDone() {
  draft = newDraft();
  go('home');
  toast('¡Muy bien! Así se registra una carga. (Esta era de práctica.)');
  nextStep();
}
function tick() {
  if (!tourEl) return;
  const st = TOUR[tourI];
  const block = $('.tour-block', tourEl), ring = $('.tour-ring', tourEl), tip = $('.tour-tip', tourEl);
  // ¿Se cumplió lo que pedimos?
  if (st.wait === 'click' && tourClicked) { nextStep(); return; }
  if (typeof st.wait === 'function' && current === st.screen && st.wait()) { nextStep(); return; }
  const sel = stepSel(st);
  const els = current === st.screen && sel ? $$(sel).filter((x) => x.offsetParent && !x.classList.contains('hidden')) : [];
  const el = els[0];
  const sheetOpen = !$('#sheet-bg').classList.contains('hidden');
  tourEl.classList.toggle('behind', sheetOpen); // si se abre una ventana de la app, el tutorial se aparta
  // Si pasaron 10 s y no se pudo hacer (sin GPS, por ejemplo), dejamos seguir igual
  if (st.wait) $('#tour-ok').classList.toggle('hidden', Date.now() - st.shownAt < 10000);
  const W = innerWidth, H = innerHeight;
  if (!el) {
    block.style.clipPath = 'none'; ring.style.display = 'none';
    tip.style.top = (H / 2 - 80) + 'px'; tip.style.left = '16px'; tip.style.right = '16px';
    return;
  }
  const rs = els.map((x) => x.getBoundingClientRect()).filter((q) => q.height > 0);
  const r = { left: Math.min(...rs.map((q) => q.left)), top: Math.min(...rs.map((q) => q.top)), right: Math.max(...rs.map((q) => q.right)), bottom: Math.max(...rs.map((q) => q.bottom)) };
  const pad = 6;
  if (els.length === 1 && (r.top < 0 || r.bottom > H)) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  const x1 = Math.max(0, r.left - pad), y1 = Math.max(0, r.top - pad), x2 = Math.min(W, r.right + pad), y2 = Math.min(H, r.bottom + pad);
  block.style.clipPath = `polygon(evenodd, 0 0, ${W}px 0, ${W}px ${H}px, 0 ${H}px, 0 0, ${x1}px ${y1}px, ${x1}px ${y2}px, ${x2}px ${y2}px, ${x2}px ${y1}px, ${x1}px ${y1}px)`;
  ring.style.display = 'block';
  Object.assign(ring.style, { left: x1 + 'px', top: y1 + 'px', width: (x2 - x1) + 'px', height: (y2 - y1) + 'px' });
  const th = tip.offsetHeight || 120;
  const below = H - y2 > th + 24, above = y1 > th + 24;
  tip.style.left = '16px'; tip.style.right = '16px';
  tip.style.top = (below ? y2 + 12 : above ? y1 - th - 12 : 12) + 'px';
}

// Primera vez: sin cargas y sin haber visto el tutorial
if (!db.tourDone && !db.loads.length) setTimeout(() => { if (current === 'home') startTour(); }, 1400);
$('#tour-again').onclick = () => { db.tourDone = false; startTour(); };
