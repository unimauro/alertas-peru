/* =====================================================================
   Alertas Perú — demo · app.js (vanilla JS)
   Carga data/*.json y renderiza 3 módulos + "Mapa de la distancia".
   ===================================================================== */

'use strict';

/* --------------------------------------------------------------------
   Capitales de los 25 departamentos (lat, lng). Datos geográficos
   conocidos — se usan para ubicar marcadores mientras el team-lead
   inyecta el GeoJSON real de polígonos departamentales.
   La clave está NORMALIZADA (sin tildes, minúsculas) para hacer match
   con el campo "departamento" del JSON de datos.
   -------------------------------------------------------------------- */
const CAPITALES = {
  'amazonas':        { capital: 'Chachapoyas',       lat: -6.2317,  lng: -77.8694 },
  'ancash':          { capital: 'Huaraz',            lat: -9.5278,  lng: -77.5278 },
  'apurimac':        { capital: 'Abancay',           lat: -13.6339, lng: -72.8814 },
  'arequipa':        { capital: 'Arequipa',          lat: -16.4090, lng: -71.5375 },
  'ayacucho':        { capital: 'Ayacucho',          lat: -13.1588, lng: -74.2232 },
  'cajamarca':       { capital: 'Cajamarca',         lat: -7.1617,  lng: -78.5128 },
  'callao':          { capital: 'Callao',            lat: -12.0565, lng: -77.1181 },
  'cusco':           { capital: 'Cusco',             lat: -13.5319, lng: -71.9675 },
  'huancavelica':    { capital: 'Huancavelica',      lat: -12.7869, lng: -74.9731 },
  'huanuco':         { capital: 'Huánuco',           lat: -9.9306,  lng: -76.2422 },
  'ica':             { capital: 'Ica',               lat: -14.0678, lng: -75.7286 },
  'junin':           { capital: 'Huancayo',          lat: -12.0686, lng: -75.2103 },
  'la libertad':     { capital: 'Trujillo',          lat: -8.1120,  lng: -79.0288 },
  'lambayeque':      { capital: 'Chiclayo',          lat: -6.7714,  lng: -79.8409 },
  'lima':            { capital: 'Lima',              lat: -12.0464, lng: -77.0428 },
  'loreto':          { capital: 'Iquitos',           lat: -3.7437,  lng: -73.2516 },
  'madre de dios':   { capital: 'Puerto Maldonado',  lat: -12.5933, lng: -69.1891 },
  'moquegua':        { capital: 'Moquegua',          lat: -17.1934, lng: -70.9356 },
  'pasco':           { capital: 'Cerro de Pasco',    lat: -10.6827, lng: -76.2564 },
  'piura':           { capital: 'Piura',             lat: -5.1945,  lng: -80.6328 },
  'puno':            { capital: 'Puno',              lat: -15.8402, lng: -70.0219 },
  'san martin':      { capital: 'Moyobamba',         lat: -6.0342,  lng: -76.9717 },
  'tacna':           { capital: 'Tacna',             lat: -18.0066, lng: -70.2463 },
  'tumbes':          { capital: 'Tumbes',            lat: -3.5669,  lng: -80.4515 },
  'ucayali':         { capital: 'Pucallpa',          lat: -8.3791,  lng: -74.5539 }
};

function normDept(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita tildes
    .trim();
}

/* --------------------------------------------------------------------
   Umbrales de alerta (semáforo). Editables por módulo/indicador.
   Nivel según valor: >= crit -> crítico; >= warn -> alerta; resto -> ok.
   -------------------------------------------------------------------- */
const UMBRALES = {
  anemia:    { crit: 40, warn: 25 },  // % prevalencia anemia infantil
  dci:       { crit: 20, warn: 12 },  // % desnutrición crónica infantil
  bajo_peso: { crit: 10, warn: 7 }    // % bajo peso al nacer
};

function nivel(valor, umbral) {
  if (valor == null || isNaN(valor)) return 'na';
  if (valor >= umbral.crit) return 'crit';
  if (valor >= umbral.warn) return 'warn';
  return 'ok';
}
const ETIQUETA = { crit: 'Crítico', warn: 'Alerta', ok: 'Normal', na: 's/d' };
const COLOR = { crit: '#d91023', warn: '#e0a52e', ok: '#2fbf71', na: '#6b7596' };

/* Paleta Chart.js alineada al tema */
const CHART_FONT = "Inter, system-ui, sans-serif";
const GRID = 'rgba(255,255,255,0.06)';
const TICK = '#9aa5c0';

/* --------------------------------------------------------------------
   Helpers de DOM
   -------------------------------------------------------------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function el(tag, attrs = {}, html) {
  const n = document.createElement(tag);
  for (const k in attrs) {
    if (k === 'class') n.className = attrs[k];
    else n.setAttribute(k, attrs[k]);
  }
  if (html != null) n.innerHTML = html;
  return n;
}

function chip(lvl) {
  if (lvl === 'na') return '<span class="chip" style="color:#9aa5c0;border:1px solid #333a52">s/d</span>';
  return `<span class="chip ${lvl}">${ETIQUETA[lvl]}</span>`;
}

function fuenteLink(url, label = 'fuente') {
  if (!url) return '';
  return `<a class="fuente" href="${url}" target="_blank" rel="noopener">${label}</a>`;
}

async function cargar(ruta) {
  const r = await fetch(ruta);
  if (!r.ok) throw new Error(`No se pudo cargar ${ruta} (${r.status})`);
  return r.json();
}

/* --------------------------------------------------------------------
   Navegación por tabs
   -------------------------------------------------------------------- */
function initTabs() {
  $$('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.tab').forEach(b => { b.classList.remove('is-active'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('is-active'); btn.setAttribute('aria-selected', 'true');
      const id = btn.dataset.tab;
      $$('.panel').forEach(p => { p.hidden = true; p.classList.remove('is-active'); });
      const panel = $('#panel-' + id);
      panel.hidden = false; panel.classList.add('is-active');
      // Leaflet necesita recalcular tamaño cuando el contenedor estaba oculto
      if (id === 'dit' && window._ditMap) setTimeout(() => window._ditMap.invalidateSize(), 60);
    });
  });
}

/* ====================================================================
   MÓDULO 1 — Desarrollo Infantil Temprano
   ==================================================================== */
function renderDIT(data) {
  const meta = data.meta || {};
  const nac = data.nacional || {};
  const deps = (data.departamentos || []).slice();

  // Fuente / subtítulo
  if (meta.fuente || (meta.fuentes_url && meta.fuentes_url.length)) {
    const link = (meta.fuentes_url && meta.fuentes_url[0]) || '#';
    $('#dit-fuente').innerHTML =
      `Anemia infantil, desnutrición crónica y bajo peso al nacer por departamento. ` +
      `${meta.anio ? '· ' + meta.anio + ' ' : ''}${fuenteLink(link, meta.fuente || 'fuente oficial')}`;
  }

  // KPIs nacionales
  const kpiBox = $('#dit-kpis');
  kpiBox.innerHTML = '';
  const kpis = [
    { label: 'Anemia infantil', val: nac.anemia, u: '%', umbral: UMBRALES.anemia, sub: '6 a 35 meses' },
    { label: 'Desnutrición crónica', val: nac.dci, u: '%', umbral: UMBRALES.dci, sub: 'menores de 5 años' },
    { label: 'Bajo peso al nacer', val: nac.bajo_peso, u: '%', umbral: UMBRALES.bajo_peso, sub: 'recién nacidos' }
  ];
  kpis.forEach(k => {
    const lv = nivel(k.val, k.umbral);
    kpiBox.appendChild(el('div', { class: 'kpi lvl-' + lv }, `
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-value">${k.val != null ? k.val : '—'}<small>${k.u}</small></div>
      <div class="kpi-sub">${k.sub} · ${chip(lv)}</div>
    `));
  });

  // Mapa Leaflet
  renderDITMap(deps);

  // Ranking (orden desc por anemia)
  const rank = deps.slice().sort((a, b) => (b.anemia || 0) - (a.anemia || 0));
  const tbl = $('#dit-ranking');
  tbl.innerHTML = `<thead><tr>
      <th class="rank-pos">#</th><th>Departamento</th>
      <th style="text-align:right">Anemia</th><th>Alerta</th><th></th>
    </tr></thead>`;
  const tb = el('tbody');
  rank.forEach((d, i) => {
    const lv = nivel(d.anemia, UMBRALES.anemia);
    tb.appendChild(el('tr', {}, `
      <td class="rank-pos">${i + 1}</td>
      <td class="dept">${d.departamento}</td>
      <td class="val">${d.anemia != null ? d.anemia + '%' : '—'}</td>
      <td>${chip(lv)}</td>
      <td>${fuenteLink(d.fuente_url)}</td>
    `));
  });
  tbl.appendChild(tb);

  // Mapa de la distancia (brecha vs referente)
  initDistancia(deps);
}

function renderDITMap(deps) {
  if (typeof L === 'undefined') { $('#dit-map').innerHTML = '<p class="error-msg">Leaflet no disponible.</p>'; return; }
  const map = L.map('dit-map', { scrollWheelZoom: false, attributionControl: true })
    .setView([-9.2, -75.0], 5);
  window._ditMap = map;

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 10, minZoom: 4
  }).addTo(map);

  // PLACEHOLDER GeoJSON: el team-lead inyecta polígonos reales aquí.
  // Mientras tanto, marcadores por capital de departamento.
  deps.forEach(d => {
    const info = CAPITALES[normDept(d.departamento)];
    if (!info) return;
    const lv = nivel(d.anemia, UMBRALES.anemia);
    const r = 8 + (d.anemia || 0) * 0.22;
    L.circleMarker([info.lat, info.lng], {
      radius: Math.min(r, 26), color: COLOR[lv], fillColor: COLOR[lv],
      fillOpacity: 0.55, weight: 2
    }).addTo(map).bindPopup(`
      <div class="map-popup">
        <b>${d.departamento}</b> · ${info.capital}
        <div class="row"><span>Anemia</span><span>${d.anemia != null ? d.anemia + '%' : '—'}</span></div>
        <div class="row"><span>Desnutrición</span><span>${d.dci != null ? d.dci + '%' : '—'}</span></div>
        <div class="row"><span>Bajo peso</span><span>${d.bajo_peso != null ? d.bajo_peso + '%' : '—'}</span></div>
        <div class="row"><span>Estado</span><span>${ETIQUETA[lv]}</span></div>
      </div>`);
  });
}

/* --- Mapa de la distancia --- */
let _distChart = null;
function initDistancia(deps) {
  const sel = $('#dit-ref');
  sel.innerHTML = '<option value="__best__">Mejor del país</option>';
  deps.slice().sort((a, b) => a.departamento.localeCompare(b.departamento))
    .forEach(d => sel.appendChild(el('option', { value: d.departamento }, d.departamento)));
  sel.value = 'Lima';
  if (sel.value !== 'Lima') sel.value = '__best__';
  sel.onchange = () => drawDistancia(deps, sel.value);
  drawDistancia(deps, sel.value);
}

function drawDistancia(deps, ref) {
  if (typeof Chart === 'undefined') { return; }
  let refVal;
  if (ref === '__best__') refVal = Math.min(...deps.map(d => d.anemia).filter(v => v != null));
  else { const r = deps.find(d => d.departamento === ref); refVal = r ? r.anemia : 0; }

  // brecha = valor dep - referente (positivo = peor que el referente)
  const rows = deps.map(d => ({ dep: d.departamento, brecha: +( (d.anemia || 0) - refVal ).toFixed(1) }))
    .sort((a, b) => b.brecha - a.brecha);

  const labels = rows.map(r => r.dep);
  const vals = rows.map(r => r.brecha);
  const colors = vals.map(v => v <= 0 ? '#2fbf71' : (v >= 15 ? '#d91023' : '#e0a52e'));

  if (_distChart) _distChart.destroy();
  _distChart = new Chart($('#dit-chart'), {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Puntos porcentuales de brecha', data: vals, backgroundColor: colors, borderRadius: 4 }] },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c => `Brecha: ${c.parsed.x > 0 ? '+' : ''}${c.parsed.x} pp` } }
      },
      scales: {
        x: { grid: { color: GRID }, ticks: { color: TICK, font: { family: CHART_FONT } }, title: { display: true, text: 'puntos porcentuales vs. referente', color: TICK } },
        y: { grid: { display: false }, ticks: { color: TICK, font: { family: CHART_FONT, size: 11 } } }
      }
    }
  });
}

/* ====================================================================
   MÓDULO 2 — Fenómeno El Niño
   ==================================================================== */
function renderNino(data) {
  const meta = data.meta || {};
  const est = data.estado_actual || {};
  if (meta.fuente) {
    const link = (meta.fuentes_url && meta.fuentes_url[0]) || est.fuente_url || '#';
    $('#nino-fuente').innerHTML = `Estado actual, regiones en riesgo y antecedentes. ${fuenteLink(link, meta.fuente)}`;
  }

  const lvAlerta = (est.alerta_enfen || '').toLowerCase().includes('roj') ? 'crit'
    : (est.alerta_enfen || '').toLowerCase().includes('amar') || (est.alerta_enfen || '').toLowerCase().includes('vigil') ? 'warn' : 'ok';
  $('#nino-estado').innerHTML = `
    <div class="estado-card">
      <div class="l">Condición actual</div>
      <div class="v">${est.condicion || '—'}</div>
      ${chip(lvAlerta)} ${fuenteLink(est.fuente_url)}
    </div>
    <div class="estado-card">
      <div class="l">Alerta ENFEN</div>
      <div class="v">${est.alerta_enfen || '—'}</div>
    </div>
    <div class="estado-card">
      <div class="l">Pronóstico verano</div>
      <div class="v" style="font-size:16px">${est.pronostico_verano || '—'}</div>
    </div>`;

  // Regiones en riesgo
  const tbl = $('#nino-regiones');
  tbl.innerHTML = `<thead><tr><th>Región</th><th>Riesgo</th><th>Nivel</th><th></th></tr></thead>`;
  const tb = el('tbody');
  (data.regiones_riesgo || []).forEach(r => {
    const lv = (r.nivel || '').toLowerCase().startsWith('alt') ? 'crit'
      : (r.nivel || '').toLowerCase().startsWith('med') ? 'warn' : 'ok';
    tb.appendChild(el('tr', {}, `
      <td class="dept">${r.region}</td>
      <td style="color:var(--muted)">${r.riesgo || '—'}</td>
      <td>${chip(lv)}</td>
      <td>${fuenteLink(r.fuente_url)}</td>`));
  });
  tbl.appendChild(tb);

  // Antecedentes
  const ul = $('#nino-antecedentes');
  ul.innerHTML = '';
  (data.antecedentes || []).forEach(a => {
    ul.appendChild(el('li', {}, `
      <div class="tl-top"><span class="tl-title">${a.evento}</span></div>
      <div class="tl-desc">${a.impacto || ''} ${fuenteLink(a.fuente_url)}</div>`));
  });
}

/* ====================================================================
   MÓDULO 3 — Lagunas glaciares peligrosas
   ==================================================================== */
function renderGlaciares(data) {
  const meta = data.meta || {};
  const res = data.resumen || {};
  if (meta.fuente) {
    const link = (meta.fuentes_url && meta.fuentes_url[0]) || '#';
    $('#glaciares-fuente').innerHTML = `Inventario, monitoreo y antecedentes de aluviones. ${fuenteLink(link, meta.fuente)}`;
  }

  const sinSensores = (res.lagunas_peligrosas != null && res.lagunas_con_sensores != null)
    ? res.lagunas_peligrosas - res.lagunas_con_sensores : null;
  const pctSensores = (res.lagunas_peligrosas) ? Math.round((res.lagunas_con_sensores / res.lagunas_peligrosas) * 100) : null;

  const kpiBox = $('#glaciares-kpis');
  kpiBox.innerHTML = '';
  const kpis = [
    { label: 'Lagunas peligrosas', val: res.lagunas_peligrosas, sub: 'identificadas en el inventario', lvl: 'crit' },
    { label: 'Con sensores / monitoreo', val: res.lagunas_con_sensores, sub: pctSensores != null ? pctSensores + '% del total peligroso' : '', lvl: 'warn' },
    { label: 'Sin monitoreo', val: sinSensores, sub: 'brecha de vigilancia', lvl: 'crit' }
  ];
  kpis.forEach(k => {
    kpiBox.appendChild(el('div', { class: 'kpi lvl-' + k.lvl }, `
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-value">${k.val != null ? k.val : '—'}</div>
      <div class="kpi-sub">${k.sub}</div>`));
  });

  // Chart por región (apilado: con sensores vs sin)
  const porRegion = (data.por_region || []).slice().sort((a, b) => (b.lagunas_peligrosas || 0) - (a.lagunas_peligrosas || 0));
  if (typeof Chart !== 'undefined' && porRegion.length) {
    const labels = porRegion.map(r => r.region);
    const con = porRegion.map(r => r.con_sensores || 0);
    const sin = porRegion.map(r => (r.lagunas_peligrosas || 0) - (r.con_sensores || 0));
    new Chart($('#glaciares-chart'), {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Con monitoreo', data: con, backgroundColor: '#2fbf71', borderRadius: 4 },
          { label: 'Sin monitoreo', data: sin, backgroundColor: '#d91023', borderRadius: 4 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: TICK, font: { family: CHART_FONT } } } },
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { color: TICK, font: { family: CHART_FONT } } },
          y: { stacked: true, grid: { color: GRID }, ticks: { color: TICK, font: { family: CHART_FONT }, precision: 0 } }
        }
      }
    });
  }

  // Antecedentes de aluviones
  const ul = $('#glaciares-antecedentes');
  ul.innerHTML = '';
  (data.antecedentes || []).forEach(a => {
    ul.appendChild(el('li', {}, `
      <div class="tl-top">
        <span class="tl-title">${a.lugar || a.evento || ''}</span>
        <span class="tl-year">${a.anio || ''}</span>
      </div>
      <div class="tl-desc">${a.evento || ''}${a.victimas ? ' · ' + a.victimas + ' víctimas' : ''}</div>`));
  });
}

/* ====================================================================
   CTA suscripción (solo UI)
   ==================================================================== */
function initSubscribe() {
  const form = $('#subscribe-form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const email = $('#subscribe-email').value.trim();
    const msg = $('#subscribe-msg');
    msg.hidden = false;
    msg.textContent = `✓ Demo: registraríamos ${email} para el resumen semanal de alertas. (Sin envío real.)`;
    form.reset();
  });
}

/* ====================================================================
   Bootstrap
   ==================================================================== */
async function init() {
  initTabs();
  initSubscribe();

  // DIT
  try {
    const dit = await cargar('data/dit.json');
    renderDIT(dit);
    if (dit.meta && dit.meta.anio) $('#lastUpdated').textContent = 'Actualizado: ' + dit.meta.anio;
  } catch (err) {
    $('#dit-kpis').innerHTML = `<p class="error-msg">Error cargando DIT: ${err.message}</p>`;
  }

  // Niño
  try { renderNino(await cargar('data/nino.json')); }
  catch (err) { $('#nino-estado').innerHTML = `<p class="error-msg">Error cargando El Niño: ${err.message}</p>`; }

  // Glaciares
  try { renderGlaciares(await cargar('data/glaciares.json')); }
  catch (err) { $('#glaciares-kpis').innerHTML = `<p class="error-msg">Error cargando glaciares: ${err.message}</p>`; }
}

document.addEventListener('DOMContentLoaded', init);
