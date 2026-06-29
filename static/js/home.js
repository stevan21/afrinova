/* ===================================================================
   AFRINOVA — Accueil : remplit la section Services depuis l'API.
   Amélioration progressive : si l'API est indisponible (ou ouverture
   en file://), on garde les cartes statiques déjà présentes.
   =================================================================== */
(async function () {
  'use strict';
  const grid = document.querySelector('.services-grid');
  if (!grid || !window.AfrinovaAPI) return;

  let exps;
  try { exps = await AfrinovaAPI.get('/expertises/'); }
  catch (e) { return; }                                  // serveur absent → cartes statiques conservées
  if (!Array.isArray(exps) || !exps.length) return;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  const SLUG = {
    'btp': 'btp', 'informatique': 'informatique', 'sante numerique': 'sante',
    'immigration': 'immigration', 'echange de devises': 'devises',
    'location de voitures': 'location', 'multiservices': 'multiservices'
  };
  const DATA = window.AFRINOVA_SERVICES || {};
  const arrow = '<svg viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function iconHtml(x, slug) {
    if (x.photo) return `<div class="service-icon photo"><img src="${x.photo}" alt="${esc(x.name)}"></div>`;
    if (slug && DATA[slug] && DATA[slug].icon) return `<div class="service-icon">${DATA[slug].icon}</div>`;
    const letter = x.name ? x.name.trim()[0].toUpperCase() : '★';
    return `<div class="service-icon"><span class="ic-letter">${esc(letter)}</span></div>`;
  }

  const cards = exps.map((x) => {
    const slug = SLUG[norm(x.name)] || null;
    const href = slug ? `service.html?p=${slug}` : '#contact';
    return `<a class="service-card service-link reveal in" href="${href}" style="--c:${x.color || '#1B2A63'}">
      ${iconHtml(x, slug)}
      <h3>${esc(x.name)}</h3>
      <p>${esc(x.description || '')}</p>
      <span class="service-more">Voir le détail ${arrow}</span>
    </a>`;
  }).join('');

  const cta = `<article class="service-card cta-card reveal in">
      <h3>Un besoin particulier&nbsp;?</h3>
      <p>Parlez-nous de votre projet. Nous construisons la solution qui vous ressemble.</p>
      <a href="#contact" class="btn btn-light">Demander un devis</a>
    </article>`;

  grid.innerHTML = cards + cta;
})();
