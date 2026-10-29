// LUMBRE · demo — intro, reloj del horno, carta con stock, "Armá tu caja", fuego, galería y eventos.
import { initKit } from '../kit/kit.js?v=1';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const html = document.documentElement;
html.classList.add('js');
const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esDesk = () => matchMedia('(min-width: 900px)').matches;
const conMouse = matchMedia('(hover: hover) and (pointer: fine)').matches;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const WA = '5491161142717';
const LLAMA = '<svg aria-hidden="true"><use href="#llamita"/></svg>';
const CAT_EMPANADAS = (p) => p && p.categoria !== 'sandwiches';

/* =============== chispas (canvas liviano) =============== */
function chispas(canvas, { n = 24, alto = 1 } = {}) {
  if (!canvas || reducido) return { start() {}, stop() {} };
  const c = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1, raf = 0, on = false;
  const ps = [];
  const nueva = (inicio) => ({ x: Math.random() * W, y: inicio ? H * (1 - Math.random() * alto) : H + 10, r: .7 + Math.random() * 1.8,
    v: .35 + Math.random() * .9, a: Math.random() * Math.PI * 2, w: .4 + Math.random() * .9, vida: 0, max: 220 + Math.random() * 260 });
  // brillo pre-dibujado (shadowBlur por partícula es carísimo en celulares)
  const spr = document.createElement('canvas'); spr.width = spr.height = 32;
  { const g = spr.getContext('2d'); const rg = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    rg.addColorStop(0, 'rgba(255,236,190,1)'); rg.addColorStop(.25, 'rgba(255,170,80,.95)'); rg.addColorStop(.6, 'rgba(255,110,30,.35)'); rg.addColorStop(1, 'rgba(255,90,20,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 32, 32); }
  function medir() {
    dpr = Math.min(esDesk() ? 2 : 1.5, devicePixelRatio || 1);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  let impar = false, quieto = true, tq = 0;
  const lento = !esDesk();
  if (lento) addEventListener('scroll', () => { quieto = false; clearTimeout(tq); tq = setTimeout(() => { quieto = true; }, 220); }, { passive: true });
  function paso() {
    // en el celu: 30 fps y en pausa mientras se scrollea (el scroll queda fluido)
    if (lento && ((impar = !impar) || !quieto)) { raf = on ? requestAnimationFrame(paso) : 0; return; }
    c.clearRect(0, 0, W, H); c.globalAlpha = 1;
    for (const p of ps) {
      p.vida++; p.a += .03; p.y -= p.v; p.x += Math.sin(p.a) * p.w * .6;
      const t = p.vida / p.max; const al = t < .15 ? t / .15 : Math.max(0, 1 - (t - .15) / .85);
      const d = p.r * 6; c.globalAlpha = al * .9; c.drawImage(spr, p.x - d / 2, p.y - d / 2, d, d);
      if (p.vida > p.max || p.y < -10) Object.assign(p, nueva(false));
    }
    raf = on ? requestAnimationFrame(paso) : 0;
  }
  medir();
  for (let i = 0; i < n; i++) ps.push(nueva(true));
  addEventListener('resize', () => { medir(); }, { passive: true });
  return {
    start() { if (on) return; on = true; raf = requestAnimationFrame(paso); },
    stop() { on = false; if (raf) cancelAnimationFrame(raf); raf = 0; },
  };
}

/* =============== intro =============== */
async function intro() {
  const el = $('#intro');
  if (!html.classList.contains('con-intro') || !el) { html.classList.add('listo'); el?.remove(); return; }
  const ch = chispas($('.intro__chispas', el), { n: esDesk() ? 30 : 16, alto: .6 });
  ch.start();
  const img = $('.hero__marco img');
  const foto = img.complete ? Promise.resolve() : new Promise((r) => { img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true }); });
  const min = esDesk() ? 1900 : 1450, max = esDesk() ? 2600 : 1800;
  await Promise.race([Promise.all([document.fonts?.ready, foto, espera(min)]), espera(max)]);
  el.classList.add('is-fuera');
  html.classList.add('listo');
  setTimeout(() => { ch.stop(); el.remove(); }, 700);
}

/* =============== header, menú, secciones =============== */
function header() {
  const top = $('#top');
  const pintar = () => top.classList.toggle('is-solido', scrollY > 24 || html.classList.contains('menu-abierto'));
  addEventListener('scroll', pintar, { passive: true }); pintar();
  const btn = $('[data-menu]'), menu = $('#menu');
  const cerrar = () => { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', 'Abrir el menú'); html.classList.remove('menu-abierto'); pintar(); };
  btn.addEventListener('click', () => {
    const abrir = menu.hidden;
    if (!abrir) return cerrar();
    menu.hidden = false; menu.classList.remove('is-abierto'); void menu.offsetWidth; menu.classList.add('is-abierto');
    btn.setAttribute('aria-expanded', 'true'); btn.setAttribute('aria-label', 'Cerrar el menú'); html.classList.add('menu-abierto'); pintar();
  });
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) cerrar(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) cerrar(); });
  addEventListener('resize', () => { if (esDesk() && !menu.hidden) cerrar(); }, { passive: true });
  // link activo según la sección
  const links = $$('.top__nav a');
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) links.forEach((a) => a.classList.toggle('is-aca', a.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-45% 0px -50% 0px' });
  ['carta', 'caja', 'fuego', 'eventos', 'como-pedir'].forEach((id) => { const s = document.getElementById(id); if (s) io.observe(s); });
}

function revelar() {
  const els = $$('[data-rev]');
  if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('visto')); return; }
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } }), { threshold: .18, rootMargin: '0px 0px -6% 0px' });
  els.forEach((e) => io.observe(e));
}

/* =============== el reloj del horno (hora real de Buenos Aires) =============== */
const DIAS = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
function ahoraBA() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Argentina/Buenos_Aires', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
  return { dow, min: Number(p.hour) * 60 + Number(p.minute) };
}
function estadoHorno(forzado) {
  const ABRE = 19 * 60 + 30, CIERRA = 22 * 60 + 30;
  const { dow, min } = ahoraBA();
  let m = forzado;
  if (!m) m = dow === 1 ? 'lunes' : min < ABRE ? 'antes' : min < CIERRA ? 'abierto' : 'despues';
  const falta = Math.max(1, ABRE - min);
  const txt = {
    abierto: 'Fuego prendido · hasta 22:30',
    antes: forzado ? 'El fuego se prende a las 19:30' : `El fuego se prende en ${falta >= 60 ? `${Math.floor(falta / 60)} h ${String(falta % 60).padStart(2, '0')} min` : `${falta} min`}`,
    despues: dow === 0 ? 'Apagamos el fuego · volvemos el martes 19:30' : 'Apagamos el fuego · volvemos mañana 19:30',
    lunes: 'Hoy descansa el fuego · volvemos mañana 19:30',
  }[m];
  return { m, txt };
}
function reloj() {
  const q = new URLSearchParams(location.search).get('momento');
  const forzado = ['abierto', 'antes', 'despues', 'lunes'].includes(q) ? q : null;
  const hero = $('.hero');
  const pintar = () => { const e = estadoHorno(forzado); hero.dataset.momento = e.m; $('[data-estado-txt]').textContent = e.txt; };
  pintar(); setInterval(pintar, 60000);
}

/* =============== carta con stock =============== */
const thumb = (f) => f ? f.replace(/\.webp$/, '-t.webp') : '';
function textoStock(ctx, p) {
  const q = ctx.stockDe(p); if (q == null) return '';
  return q === 0 ? 'Se apagó por hoy' : q <= ctx.stockAviso ? `Últimas ${q}` : `Quedan ${q}`;
}
function brasaHTML(ctx, p) {
  const q = ctx.stockDe(p); if (q == null) return '';
  const base = Number(p.stockBase) || Math.max(q, 1);
  const n = Math.max(0, Math.min(1, q / base));
  return `<span class="brasa${q === 0 ? ' is-ceniza' : q <= ctx.stockAviso ? ' is-baja' : ''}" style="--n:${n.toFixed(2)}" aria-hidden="true"></span>`;
}
function plantilla(p, ctx) {
  const picor = Math.max(0, Math.min(3, Number(p.picor) || 0));
  const pedible = ctx.pedible(p);
  const precio = ctx.money(p.precio);
  const foto = p.foto ? `<span class="it__foto"><img src="${esc(ctx.asset(thumb(p.foto)))}" width="240" height="240" alt="" loading="lazy" decoding="async"></span>`
    : `<span class="it__foto it__foto--na">${LLAMA}</span>`;
  const consulta = !pedible && p.precio == null && !ctx.agotado(p)
    ? `<a class="it__wa" href="https://wa.me/${WA}?text=${encodeURIComponent(`Hola Lumbre! ¿Cuánto sale el ${p.nombre}?`)}" target="_blank" rel="noopener">Consultar precio</a>` : '';
  return `${foto}
    <div class="it__main">
      ${p.apodo ? `<span class="it__apodo">${esc(p.apodo)}</span>` : ''}
      <h3 class="it__n">${esc(p.nombre)}${picor ? `<span class="it__llamas" title="Picor ${picor} de 3" aria-label="Picor ${picor} de 3">${LLAMA.repeat(picor)}</span>` : ''}</h3>
      ${p.descripcion ? `<p class="it__d">${esc(p.descripcion)}</p>` : ''}
      <span class="it__stock">${brasaHTML(ctx, p)}${esc(textoStock(ctx, p))}</span>
    </div>
    <div class="it__der"><span class="it__stock it__stock--m">${brasaHTML(ctx, p)}${esc(textoStock(ctx, p))}</span>${precio ? `<span class="it__precio">${precio}</span>` : ''}${consulta}${pedible ? `<span class="it__qty" data-kit-qty="${esc(p.id)}"></span>` : ''}</div>`;
}

function carta(kit) {
  const sec = $('#carta'), cont = $('#carta-kit');
  const fotoImg = $('[data-foto-plato]'), fotoNom = $('[data-foto-nombre]');
  let prods = [], cats = [];
  let fotoActual = '';
  function verFoto(p) {
    if (!p || !p.foto || !fotoImg) return;
    const src = kit.asset(p.foto); if (src === fotoActual) return;
    fotoActual = src; fotoImg.classList.add('is-cambio');
    const pre = new Image(); pre.src = src;
    const poner = () => { fotoImg.src = src; fotoNom.textContent = p.nombre; requestAnimationFrame(() => fotoImg.classList.remove('is-cambio')); };
    pre.decode ? pre.decode().then(poner, poner) : (pre.onload = poner);
  }
  const panelActivo = () => $$('.kit-carta__panel', cont).find((x) => !x.hidden);
  function primeraFoto() { const pa = panelActivo(); if (!pa) return; const it = $$('.kit-item', pa).find((i) => i.offsetParent && prods.find((p) => p.id === i.dataset.id)?.foto); if (it) verFoto(prods.find((p) => p.id === it.dataset.id)); }
  function revisarPicor() {
    const pa = panelActivo(); if (!pa) return;
    $('.horno__vacio', pa)?.remove();
    const nivel = Number(sec.dataset.picor || 0); if (!nivel) return;
    const ok = (p) => (Number(p.picor) || 0) >= nivel;
    if ($$('.kit-item', pa).some((i) => ok(prods.find((p) => p.id === i.dataset.id) || {}))) return;
    const otra = cats.find((c) => prods.some((p) => p.categoria === c.id && ok(p)));
    const v = document.createElement('p'); v.className = 'horno__vacio';
    v.innerHTML = otra ? `En esta sección no hay gustos con ese picor. <button type="button" data-ir-cat="${esc(otra.id)}">Ver ${esc(otra.nombre)}</button>` : 'Hoy no hay gustos con ese picor.';
    $('.panel__head', pa)?.after(v);
  }
  function irA(id, scroll = true) {
    const tab = $(`.kit-tab[data-cat="${CSS.escape(id)}"]`, cont); if (!tab) return;
    tab.click();
    if (scroll && !esDesk()) { const y = cont.getBoundingClientRect().top + scrollY - (parseInt(getComputedStyle(html).getPropertyValue('--top')) || 64) - 4; scrollTo({ top: y, behavior: reducido ? 'auto' : 'smooth' }); }
    if (scroll && esDesk()) { const r = cont.getBoundingClientRect(); if (r.top < 0) scrollTo({ top: r.top + scrollY - 110, behavior: reducido ? 'auto' : 'smooth' }); }
  }

  document.addEventListener('kit:carta', (e) => {
    if (e.detail.el !== cont) return;
    prods = e.detail.productos; cats = e.detail.visibles.filter((c) => prods.some((p) => p.categoria === c.id));
    const tabs = $$('.kit-tab', cont);
    tabs.forEach((t) => { const n = prods.filter((p) => p.categoria === t.dataset.cat).length; if (!$('.tab__n', t)) t.insertAdjacentHTML('beforeend', `<span class="tab__n">${n}</span>`); });
    $$('.kit-carta__panel', cont).forEach((panel, i) => {
      const c = cats[i]; if (!c) return;
      const items = prods.filter((p) => p.categoria === c.id);
      const hay = items.filter((p) => kit.pedible(p)).length;
      panel.insertAdjacentHTML('afterbegin', `<div class="panel__head"><b>${esc(c.nombre)}</b><span>${items.length} ${items.length === 1 ? 'opción' : 'gustos'} · ${hay} para pedir hoy</span></div>`);
      const ant = cats[i - 1], sig = cats[i + 1];
      panel.insertAdjacentHTML('beforeend', `<div class="horno__nav"><button type="button" data-ir-cat="${esc(ant?.id || '')}" ${ant ? '' : 'disabled'}>← ${esc(ant?.nombre || '')}</button><button type="button" data-ir-cat="${esc(sig?.id || '')}" ${sig ? '' : 'disabled'}>${esc(sig?.nombre || '')} →</button></div>`);
    });
    $$('.kit-item', cont).forEach((it) => { const p = prods.find((x) => x.id === it.dataset.id); it.dataset.picor = String(Number(p?.picor) || 0); });
    revisarPicor(); primeraFoto();
    pintarHornoCard(kit, prods);
  });
  cont.addEventListener('click', (e) => {
    const ir = e.target.closest('[data-ir-cat]'); if (ir && ir.dataset.irCat) { irA(ir.dataset.irCat); return; }
    if (e.target.closest('.kit-tab')) requestAnimationFrame(() => { revisarPicor(); primeraFoto(); });
  });
  // foto del plato al costado (desktop, mouse)
  let pend = null;
  cont.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    const it = e.target.closest('.kit-item'); if (!it) return;
    if (pend) cancelAnimationFrame(pend);
    pend = requestAnimationFrame(() => verFoto(prods.find((p) => p.id === it.dataset.id)));
  });
  // picómetro
  $$('[data-picor-btn]').forEach((b) => b.addEventListener('click', () => {
    sec.dataset.picor = b.dataset.picorBtn;
    $$('[data-picor-btn]').forEach((x) => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on); });
    revisarPicor(); primeraFoto();
  }));
}

function pintarHornoCard(kit, prods) {
  const box = $('[data-horno-rows]'); if (!box) return;
  const con = prods.filter((p) => CAT_EMPANADAS(p) && kit.stockDe(p) != null);
  const estrella = con.find((p) => p.id === 'vacio' && kit.stockDe(p) > 0) || con.filter((p) => kit.stockDe(p) > 0).sort((a, b) => kit.stockDe(b) - kit.stockDe(a))[0];
  const pocas = con.filter((p) => p !== estrella && kit.stockDe(p) > 0).sort((a, b) => kit.stockDe(a) - kit.stockDe(b))[0];
  const off = con.find((p) => kit.stockDe(p) === 0);
  const fila = (p, cls, txt) => p ? `<span class="horno-card__row ${cls}"><span>${esc(p.nombre)}</span><b>${esc(txt)}</b></span>` : '';
  box.innerHTML = fila(estrella, '', `quedan ${kit.stockDe(estrella)}`) + fila(pocas, 'is-pocas', kit.stockDe(pocas) <= kit.stockAviso ? `últimas ${kit.stockDe(pocas)}` : `quedan ${kit.stockDe(pocas)}`) + fila(off, 'is-off', 'agotado');
}

/* =============== WOW: armá tu caja =============== */
function caja(kit) {
  const box = $('[data-caja]'), huecos = $('[data-huecos]'), bandeja = $('[data-bandeja]'), filtros = $('[data-filtros]');
  const cuenta = $('[data-caja-cuenta]'), extra = $('[data-caja-extra]'), btnCerrar = $('[data-cerrar-caja]'), btnVaciar = $('[data-vaciar]');
  let cap = 12, prods = [], cats = [], filtro = 'todas', llegando = 0, estabaLlena = false;
  box.dataset.cap = cap;

  const lineas = () => kit.carrito.lineas.filter((l) => !l.gc);
  const cantDe = (id) => lineas().filter((l) => l.id === id).reduce((s, l) => s + l.cant, 0);
  const enCaja = () => lineas().flatMap((l) => CAT_EMPANADAS(prods.find((p) => p.id === l.id)) ? Array(l.cant).fill(l.id) : []);

  function pintarCaja() {
    const items = enCaja(); const n = items.length;
    const llena = n >= cap;
    huecos.innerHTML = Array.from({ length: cap }, (_, i) => {
      const id = items[i]; const p = prods.find((x) => x.id === id);
      if (!p) return '<li class="hueco"></li>';
      const tarde = llegando && i === n - 1 && Date.now() - llegando < 200 ? ' style="animation-delay:.42s"' : '';
      return `<li class="hueco"><button type="button" data-sacar="${esc(id)}" aria-label="Sacar una de ${esc(p.nombre)}"${tarde}>${p.foto ? `<img src="${esc(kit.asset(thumb(p.foto)))}" width="240" height="240" alt="">` : ''}</button></li>`;
    }).join('');
    cuenta.textContent = `${Math.min(n, cap)} de ${cap}`;
    extra.textContent = n > cap ? ` + ${n - cap} en otra caja` : n === 0 ? 'Elegí tus gustos' : llena ? '¡Caja completa!' : `Faltan ${cap - n}`;
    box.classList.toggle('is-llena', llena);
    if (llena && !estabaLlena) box.classList.remove('is-abierta');
    $('[data-caja-lista]').textContent = `${cap === 12 ? 'Docena' : 'Media docena'} lista para el fuego`;
    estabaLlena = llena;
    btnCerrar.disabled = lineas().length === 0;
    btnCerrar.textContent = llena ? 'Cerrar la caja y pagar' : 'Cerrar la caja';
    btnVaciar.hidden = n === 0;
    pintarFichas();
  }
  function pintarFichas() {
    $$('.ficha', bandeja).forEach((f) => {
      const p = prods.find((x) => x.id === f.dataset.id); if (!p) return;
      const q = kit.stockDe(p), c = cantDe(p.id);
      const badge = $('.ficha__q', f);
      if (c) { if (badge) badge.textContent = c; else f.insertAdjacentHTML('afterbegin', `<b class="ficha__q">${c}</b>`); } else badge?.remove();
      f.classList.toggle('is-tope', q != null && c >= q && q > 0);
    });
  }
  function pintarBandeja() {
    const lista = prods.filter((p) => CAT_EMPANADAS(p) && (filtro === 'todas' || p.categoria === filtro));
    bandeja.innerHTML = lista.map((p) => {
      const ok = kit.pedible(p);
      return `<li><button type="button" class="ficha" data-id="${esc(p.id)}" ${ok ? '' : 'disabled'} aria-label="Sumar ${esc(p.nombre)}${ok ? '' : ' (agotado)'}">
        <span class="ficha__img${p.foto ? '' : ' ficha__img--na'}">${p.foto ? `<img src="${esc(kit.asset(thumb(p.foto)))}" width="240" height="240" alt="" draggable="false" loading="lazy" decoding="async">` : LLAMA}</span>
        <span class="ficha__n">${esc(p.nombre)}</span>
        <span class="ficha__s">${brasaHTML(kit, p)}${esc(textoStock(kit, p) || (ok ? '' : 'Consultar'))}</span></button></li>`;
    }).join('');
    pintarFichas();
  }
  function pintarFiltros() {
    const cs = cats.filter((c) => c.id !== 'sandwiches');
    filtros.innerHTML = [{ id: 'todas', nombre: 'Todas' }, ...cs].map((c) => `<button type="button" role="tab" aria-selected="${c.id === filtro}" class="${c.id === filtro ? 'is-on' : ''}" data-filtro="${esc(c.id)}">${esc(c.nombre)}</button>`).join('');
  }

  // vuelo de la ficha al próximo hueco
  function volar(desdeEl, p, aIndex) {
    if (reducido || !p.foto) return;
    const a = desdeEl.getBoundingClientRect();
    const h = huecos.children[Math.min(aIndex, cap - 1)]; if (!h) return;
    const b = h.getBoundingClientRect();
    const v = document.createElement('span'); v.className = 'ficha-vuelo';
    v.innerHTML = `<img src="${esc(kit.asset(thumb(p.foto)))}" alt="">`;
    Object.assign(v.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px' });
    document.body.appendChild(v);
    requestAnimationFrame(() => { v.style.transform = `translate(${b.left - a.left}px, ${b.top - a.top}px) scale(${b.width / a.width})`; });
    setTimeout(() => v.remove(), 560);
  }
  function sumar(id, desde, conVuelo = true) {
    const p = prods.find((x) => x.id === id); if (!p || !kit.pedible(p)) return;
    const q = kit.stockDe(p);
    if (q != null && cantDe(id) >= q) { kit.carrito.agregar(id, 1); desde?.classList.add('kit-bump'); setTimeout(() => desde?.classList.remove('kit-bump'), 460); return; }
    const idx = enCaja().length;
    if (conVuelo && desde) volar($('.ficha__img', desde) || desde, p, idx);
    llegando = conVuelo ? Date.now() : 0;
    kit.carrito.agregar(id, 1);
  }

  // clic / toque en una ficha
  let arrastro = false;
  bandeja.addEventListener('click', (e) => {
    const f = e.target.closest('.ficha'); if (!f || f.disabled) return;
    if (arrastro) { arrastro = false; return; }
    sumar(f.dataset.id, f);
  });
  // arrastrar con el mouse adentro de la caja
  if (conMouse) {
    let st = null;
    bandeja.addEventListener('pointerdown', (e) => {
      const f = e.target.closest('.ficha'); if (!f || f.disabled || e.pointerType !== 'mouse' || e.button !== 0) return;
      st = { f, x: e.clientX, y: e.clientY, g: null };
    });
    addEventListener('pointermove', (e) => {
      if (!st) return;
      if (!st.g && Math.hypot(e.clientX - st.x, e.clientY - st.y) > 6) {
        const p = prods.find((x) => x.id === st.f.dataset.id);
        st.g = document.createElement('span'); st.g.className = 'ficha-fantasma';
        st.g.innerHTML = p?.foto ? `<img src="${esc(kit.asset(thumb(p.foto)))}" alt="">` : '';
        document.body.appendChild(st.g); html.classList.add('arrastrando');
      }
      if (st.g) {
        st.g.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`; st.g.style.left = '0'; st.g.style.top = '0';
        const r = box.getBoundingClientRect();
        box.classList.toggle('is-encima', e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom);
      }
    });
    addEventListener('pointerup', () => {
      if (!st) return;
      if (st.g) {
        arrastro = true;
        const adentro = box.classList.contains('is-encima');
        box.classList.remove('is-encima'); html.classList.remove('arrastrando');
        const g = st.g; g.style.transition = 'opacity .25s, transform .25s'; g.style.opacity = '0';
        setTimeout(() => g.remove(), 260);
        if (adentro) sumar(st.f.dataset.id, null, false);
        setTimeout(() => { arrastro = false; }, 0);
      }
      st = null;
    });
  }
  huecos.addEventListener('click', (e) => { const b = e.target.closest('[data-sacar]'); if (b) kit.carrito.agregar(b.dataset.sacar, -1); });
  filtros.addEventListener('click', (e) => { const b = e.target.closest('[data-filtro]'); if (!b) return; filtro = b.dataset.filtro; pintarFiltros(); pintarBandeja(); });
  $$('[data-cap]').forEach((b) => b.addEventListener('click', () => {
    cap = Number(b.dataset.cap); box.dataset.cap = cap; estabaLlena = enCaja().length >= cap;
    $$('[data-cap]').forEach((x) => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on); });
    pintarCaja(); pintarBarra(kit, cap);
  }));
  $('[data-abrir-caja]').addEventListener('click', () => box.classList.add('is-abierta'));
  btnVaciar.addEventListener('click', () => { enCaja().length && kit.carrito.vaciar(); });

  document.addEventListener('kit:carta', (e) => {
    if (e.detail.el.id !== 'carta-kit') return;
    prods = e.detail.productos; cats = e.detail.visibles;
    pintarFiltros(); pintarBandeja(); pintarCaja();
  });
  document.addEventListener('kit:carrito', () => { pintarCaja(); pintarBarra(kit, cap); });
  return { get cap() { return cap; } };
}

/* =============== barra de la caja (celu) + contador del header =============== */
function pintarBarra(kit, cap = 12) {
  const c = kit.carrito.calc();
  const n = c.items.reduce((s, i) => s + i.cant, 0);
  const barra = $('[data-barra]'), nh = $('[data-caja-n]');
  nh.hidden = n === 0; nh.textContent = n;
  barra.hidden = n === 0;
  document.body.classList.toggle('con-barra', n > 0);
  $('[data-barra-t]').textContent = `Tu caja · ${n < cap ? `${n} de ${cap}` : `${n} ${n === 1 ? 'empanada' : 'empanadas'}`}`;
  $('[data-barra-total]').textContent = c.items.some((i) => i.precio == null) ? '' : (kit.money(c.total) || '');
}

/* =============== cuatro horas de fuego =============== */
function fuego() {
  const sec = $('#fuego'), pista = $('[data-pista]'), num = $('[data-reloj]');
  let dist = 0, top0 = 0, raf = 0;
  const reloj = (t) => { const h = Math.round(t * 4); num.textContent = t > .97 ? '4+' : String(h); };
  function medir() {
    if (!esDesk() || reducido) { sec.style.removeProperty('--alto-fuego'); pista.style.transform = ''; dist = 0; return; }
    pista.style.transform = '';
    dist = Math.max(0, pista.scrollWidth - innerWidth);
    sec.style.setProperty('--alto-fuego', dist > 40 ? `${innerHeight + dist + innerHeight * .35}px` : 'auto');
    top0 = sec.getBoundingClientRect().top + scrollY;
    mover();
  }
  function mover() {
    raf = 0;
    if (!dist) return;
    const recorrido = sec.offsetHeight - innerHeight;
    const t = Math.max(0, Math.min(1, (scrollY - top0) / Math.max(1, recorrido)));
    const tt = Math.max(0, Math.min(1, (t - .12) / .76));
    pista.style.transform = `translate3d(${-tt * dist}px, 0, 0)`;
    reloj(tt);
  }
  addEventListener('scroll', () => { if (dist && !raf) raf = requestAnimationFrame(mover); }, { passive: true });
  addEventListener('resize', () => { clearTimeout(medir.t); medir.t = setTimeout(medir, 150); }, { passive: true });
  pista.addEventListener('scroll', () => { if (esDesk()) return; const m = pista.scrollWidth - pista.clientWidth; reloj(m > 0 ? pista.scrollLeft / m : 0); }, { passive: true });
  // en el celu el reloj arranca a contar cuando la sección entra
  medir(); addEventListener('load', medir);
}

/* =============== galería: mazo (celu) y mosaico (desktop) =============== */
const FOTOS = [
  ['019', 'Empanada abierta con queso y cebolla caramelizada'], ['044', 'Dos empanadas abiertas con carne braseada'], ['030', 'Empanada repulgada con queso fundido'],
  ['039', 'Tanda de empanadas sobre una tabla redonda'], ['046', 'Empanada de pollo al curry abierta en las manos'], ['105', 'Vacío al malbec desmechado adentro de la empanada'],
  ['043', 'Empanadas recién horneadas sobre la mesa'],
];
function galeria() {
  const mazo = $('[data-mazo]'), mosaico = $('[data-mosaico]');
  mosaico.innerHTML = FOTOS.slice(0, 6).map(([n, alt], i) => `<li data-rev style="--d:${i % 3}"><img src="img/galeria/${n}.webp" srcset="img/galeria/${n}-s.webp 480w, img/galeria/${n}.webp 900w" sizes="(min-width: 1200px) 420px, 34vw" width="900" height="900" alt="${esc(alt)}" loading="lazy" decoding="async"></li>`).join('');
  const rots = [-3, 2.5, -1.5, 3, -2.5, 1.5, -1];
  mazo.innerHTML = FOTOS.map(([n, alt], i) => `<figure class="mazo__c" style="--rot:${rots[i]}deg"><img src="img/galeria/${n}-s.webp" width="480" height="480" alt="${esc(alt)}" loading="lazy" decoding="async" draggable="false"></figure>`).join('')
    + '<button type="button" class="saltar" data-mazo-sig>Ver la siguiente foto</button>';
  const orden = () => $$('.mazo__c', mazo).reverse(); // el último del DOM queda arriba
  function acomodar() { orden().forEach((c, k) => { c.style.setProperty('--k', Math.min(k, 3)); c.style.zIndex = String(50 - k); c.style.opacity = k > 3 ? '0' : '1'; }); }
  function tirar(dir) {
    const c = orden()[0]; if (!c) return;
    c.classList.add('is-tirada'); c.style.transform = `translateX(${dir * 130}%) rotate(${dir * 18}deg)`;
    setTimeout(() => { c.classList.remove('is-tirada'); c.style.transform = ''; mazo.prepend(c); acomodar(); }, 430);
  }
  acomodar();
  let st = null;
  mazo.addEventListener('pointerdown', (e) => { const c = orden()[0]; if (!c || !e.target.closest('.mazo__c')) return; st = { c, x: e.clientX, y: e.clientY, dx: 0, eje: null }; });
  mazo.addEventListener('pointermove', (e) => {
    if (!st) return;
    const dx = e.clientX - st.x, dy = e.clientY - st.y;
    if (!st.eje && Math.hypot(dx, dy) > 8) { st.eje = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'; if (st.eje === 'x') mazo.setPointerCapture(e.pointerId); }
    if (st.eje !== 'x') return;
    st.dx = dx; st.c.style.transition = 'none'; st.c.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
  });
  const soltar = () => {
    if (!st) return; const { c, dx, eje } = st; st = null; c.style.transition = '';
    if (eje === 'x' && Math.abs(dx) > 80) tirar(Math.sign(dx)); else c.style.transform = '';
  };
  mazo.addEventListener('pointerup', soltar); mazo.addEventListener('pointercancel', soltar);
  $('[data-mazo-sig]', mazo).addEventListener('click', () => tirar(1));
}

/* =============== evento privado =============== */
function eventos(kit) {
  const f = $('[data-evento]'), msg = $('[data-ev-msg]');
  const hoy = new Date(); const min = new Date(hoy.getTime() + 3 * 864e5);
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  f.fecha.min = iso(min); f.fecha.max = iso(new Date(hoy.getTime() + 120 * 864e5));
  $$('[data-inv]', f).forEach((b) => b.addEventListener('click', () => {
    const v = Math.max(10, Math.min(300, (Number(f.personas.value) || 0) + Number(b.dataset.inv))); f.personas.value = v;
  }));
  f.addEventListener('submit', async (e) => {
    e.preventDefault(); msg.textContent = '';
    const personas = Number(f.personas.value);
    const falta = [];
    if (!(personas >= 10 && personas <= 300)) falta.push('la cantidad de invitados (de 10 a 300)');
    if (!f.fecha.value || f.fecha.value < f.fecha.min) falta.push('una fecha con al menos 3 días de anticipación');
    if (!f.nombre.value.trim()) falta.push('tu nombre');
    if (f.telefono.value.replace(/\D/g, '').length < 8) falta.push('tu WhatsApp');
    if (falta.length) { msg.textContent = `Completá ${falta.join(', ')}.`; return; }
    const hora = f.hora.value || '20:00';
    const extras = $$('input[name="extra"]:checked', f).map((x) => x.value);
    const btn = $('[type="submit"]', f); btn.disabled = true;
    try {
      await kit.store.createReserva({ fecha: f.fecha.value, hora, personas, nombre: f.nombre.value.trim(), telefono: f.telefono.value.trim(), comentario: f.lugar.value.trim(), extras, servicio: hora === '12:00' ? 'mediodia' : 'noche' });
    } catch (err) { console.warn('[lumbre] evento', err); btn.disabled = false; msg.textContent = 'No pudimos guardar la consulta. Probá de nuevo o escribinos por WhatsApp.'; return; }
    const [y, m, d] = f.fecha.value.split('-').map(Number);
    const dia = `${['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][new Date(y, m - 1, d).getDay()]} ${d}/${m}`;
    const nombres = { parrilla: 'parrilla', horno: 'horno', empanadas: 'sumar empanadas' };
    const texto = [`Hola Lumbre! Quiero un presupuesto para un evento privado de sándwiches:`, '',
      `• Invitados: ${personas}`, `• Fecha: ${dia} (${hora === '12:00' ? 'mediodía' : 'noche'})`,
      extras.length ? `• En el lugar / extras: ${extras.map((x) => nombres[x]).join(', ')}` : '',
      f.lugar.value.trim() ? `• Dónde y qué festejamos: ${f.lugar.value.trim()}` : '', '', `Soy ${f.nombre.value.trim()} · ${f.telefono.value.trim()}`].filter((x, i, a) => x !== '' || (a[i - 1] && a[i - 1] !== '')).join('\n');
    const url = `https://wa.me/${WA}?text=${encodeURIComponent(texto)}`;
    f.innerHTML = `<div class="evento-ok"><span class="evento-ok__ico"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>
      <h3>¡Consulta enviada!</h3><p>${personas} invitados, ${esc(dia)}. Ya la ven en su panel y te pasan el presupuesto por WhatsApp.</p>
      <a class="btn btn--oro" href="${esc(url)}" target="_blank" rel="noopener">Abrir WhatsApp</a></div>`;
    window.open(url, '_blank', 'noopener');
  });
}

/* =============== arranque =============== */
header();
reloj();
galeria();
revelar();
fuego();
intro();
new IntersectionObserver(([e]) => html.classList.toggle('pasado-hero', !e.isIntersecting), { rootMargin: '0px 0px -40% 0px' }).observe($('.hero__in'));
const heroCh = chispas($('.hero__chispas'), { n: esDesk() ? 26 : 14, alto: .9 });
new IntersectionObserver(([e]) => (e.isIntersecting && !document.hidden ? heroCh.start() : heroCh.stop())).observe($('.hero'));
document.addEventListener('visibilitychange', () => (document.hidden ? heroCh.stop() : heroCh.start()));

(async () => {
  const kit = await initKit({
    config: 'cliente.json',
    carta: { template: plantilla, itemClass: 'it' },
    carrito: { fab: false, label: 'Tu caja' },
    imagenes: { lqip: 'img/lqip.json' },
  });
  window.lumbre = kit;
  carta(kit);
  caja(kit);
  eventos(kit);
  await kit.carrito.listo;
  pintarBarra(kit);
  // el kit pudo haber dibujado la carta antes de que escucháramos: la redibujamos una vez
  kit.cartas.forEach((c) => c.recargar());
})().catch((e) => console.error('[lumbre]', e));
