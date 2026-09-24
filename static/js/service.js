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

  /* ---- Compteurs automatiques (Prestations / Réalisations) ----
     - Chaque pôle démarre à un chiffre entre COMPTEUR_MIN et COMPTEUR_MAX.
     - Chaque semaine (depuis COMPTEUR_DEBUT), on ajoute +1 ou +2.
     - Le « hasard » dépend du pôle et du numéro de semaine : tous les
       visiteurs voient le même chiffre, qui ne change pas en rafraîchissant.
     - Si le vrai nombre saisi dans l'admin est plus grand, c'est lui qui s'affiche. */
  const COMPTEUR_DEBUT = Date.UTC(2026, 8, 21); // lundi 21 septembre 2026 (mois 8 = septembre)
  const COMPTEUR_MIN = 5;
  const COMPTEUR_MAX = 12;
  const UNE_SEMAINE = 7 * 24 * 60 * 60 * 1000;

  // Transforme un texte en nombre stable (même texte => même nombre).
  function hash(txt) {
    let h = 2166136261;
    for (let i = 0; i < txt.length; i++) {
      h ^= txt.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    // mélange final pour bien répartir les chiffres
    h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return h >>> 0;
  }

  function compteur(pole, type, vraiNombre) {
    const cle = pole + ':' + type;
    let total = COMPTEUR_MIN + (hash(cle) % (COMPTEUR_MAX - COMPTEUR_MIN + 1));
    const semaines = Math.max(0, Math.floor((Date.now() - COMPTEUR_DEBUT) / UNE_SEMAINE));
    for (let s = 1; s <= semaines; s++) {
      total += 1 + (hash(cle + ':' + s) % 2); // +1 ou +2
    }
    return Math.max(total, vraiNombre || 0);
  }

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
      [compteur(slug, 'prestations', d.prestations.length), 'Prestations'],
      [compteur(slug, 'realisations', d.realisations.length), 'Réalisations'],
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
          : `<span class="work-emoji"><svg class="svc-ico" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 9h.01M9 13h.01M9 17h.01" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`}
            <span class="work-badge">${esc(d.name)}</span>
          </div>
          <div class="work-body">
            <h3>${esc(r.title)}</h3>
            <p>${esc(r.description || '')}</p>
            <div class="work-meta"><span>${r.lieu ? '<svg class="meta-ico" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="10" r="2.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>' + esc(r.lieu) : ''}</span><span>${esc(r.year || '')}</span></div>
          </div>
        </article>`).join('');
    } else { realSec.style.display = 'none'; }
  })();
})();
