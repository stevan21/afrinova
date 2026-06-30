/* ===================================================================
   AFRINOVA — Page de détail d'un service (service.html?p=slug)
   Contenu dynamique depuis l'API (/api/services/<slug>/).
   =================================================================== */
(function () {
  'use strict';
  const API = window.AfrinovaAPI;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const params = new URLSearchParams(window.location.search);
  const slug = (params.get('p') || '').trim().toLowerCase();
  if (!slug) { location.replace('index.html#services'); return; }

  (async function () {
    let d;
    try { d = await API.get('/services/' + encodeURIComponent(slug) + '/'); }
    catch (e) { location.replace('index.html#services'); return; }

    const color = d.color || '#1B2A63';
    document.title = d.name + ' — AFRINOVA';
    document.documentElement.style.setProperty('--svc', color);
    const tm = document.querySelector('meta[name="theme-color"]');
    if (tm) tm.setAttribute('content', color);

    /* ---- Hero ---- */
    $('crumbName').textContent = d.name;
    $('svcName').textContent = d.name;
    $('svcTagline').textContent = d.tagline || '';
    $('svcIcon').innerHTML = d.photo
      ? `<img src="${d.photo}" alt="${esc(d.name)}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">`
      : `<span style="font-family:'Poppins',sans-serif;font-weight:800;font-size:3rem;color:#fff">${esc((d.name || '?').trim()[0].toUpperCase())}</span>`;

    /* ---- Intro (description) ---- */
    const paras = String(d.description || '').split(/\n{2,}|\r?\n/).filter((x) => x.trim());
    $('svcIntro').innerHTML = paras.length
      ? paras.map((p) => `<p>${esc(p)}</p>`).join('')
      : '<p>Les informations de ce pôle seront bientôt disponibles.</p>';

    /* ---- Aside : compteurs + atouts ---- */
    $('svcStats').innerHTML = [
      [d.prestations.length, 'Prestations'],
      [d.realisations.length, 'Réalisations'],
    ].map(([n, l]) => `<div class="svc-stat"><strong>${n}</strong><span>${l}</span></div>`).join('');
    $('svcAtouts').innerHTML = ['Équipe dédiée', 'Devis transparent', 'Qualité & délais', 'Suivi personnalisé']
      .map((a) => `<li>${a}</li>`).join('');

    /* ---- Prestations ---- */
    const presSec = $('svcPrestations').closest('section');
    if (d.prestations.length) {
      $('svcPrestations').innerHTML = d.prestations.map((p) => `
        <article class="presta-card">
          <span class="presta-check" aria-hidden="true">✓</span>
          <div><h3>${esc(p.title)}</h3><p>${esc(p.description || '')}</p></div>
        </article>`).join('');
    } else { presSec.style.display = 'none'; }

    /* ---- Réalisations ---- */
    const realSec = $('svcRealisations').closest('section');
    const note = realSec.querySelector('.work-note');
    if (note) note.remove();
    if (d.realisations.length) {
      $('svcRealisations').innerHTML = d.realisations.map((r) => `
        <article class="work-card" style="--c:${color}">
          <div class="work-cover">
            ${r.photo
          ? `<img src="${r.photo}" alt="${esc(r.title)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">`
          : `<span class="work-emoji" style="font-size:2.2rem">🏗️</span>`}
            <span class="work-badge">${esc(d.name)}</span>
          </div>
          <div class="work-body">
            <h3>${esc(r.title)}</h3>
            <p>${esc(r.description || '')}</p>
            <div class="work-meta"><span>${r.lieu ? '📍 ' + esc(r.lieu) : ''}</span><span>${esc(r.year || '')}</span></div>
          </div>
        </article>`).join('');
    } else { realSec.style.display = 'none'; }
  })();
})();
