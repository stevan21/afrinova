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
  // Associe un nom de pôle à une icône SVG prédéfinie (sinon photo / initiale)
  const ICON_KEY = {
    'btp': 'btp', 'informatique': 'informatique', 'sante numerique': 'sante',
    'immigration': 'immigration', 'echange de devises': 'devises',
    'location de voitures': 'location', 'multiservices': 'multiservices',
    'entretien & nettoyage': 'entretien'
  };
  const DATA = window.AFRINOVA_SERVICES || {};
  const arrow = '<svg viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function iconHtml(x) {
    if (x.photo) return `<div class="service-icon photo"><img src="${x.photo}" alt="${esc(x.name)}"></div>`;
    const key = ICON_KEY[norm(x.name)];
    if (key && DATA[key] && DATA[key].icon) return `<div class="service-icon">${DATA[key].icon}</div>`;
    const letter = x.name ? x.name.trim()[0].toUpperCase() : '★';
    return `<div class="service-icon"><span class="ic-letter">${esc(letter)}</span></div>`;
  }

  // Deux pôles ont leur page dédiée plutôt que la page service générique :
  // location (catalogue + réservation) et immigration (évaluation de dossier).
  const PAGES_DEDIEES = [
    { motif: /location|vehicule|voiture/, page: 'location.html' },
    { motif: /immigration|visa/, page: 'immigration.html' }
  ];
  const pageDe = (x) => {
    const n = norm(x.name);
    const trouve = PAGES_DEDIEES.find((p) => p.motif.test(n));
    return trouve ? trouve.page : null;
  };

  const cards = exps.map((x) => {
    const href = pageDe(x) || (x.slug ? `service.html?p=${x.slug}` : '#contact');
    return `<a class="service-card service-link reveal in" href="${href}" style="--c:${x.color || '#1B2A63'}">
      ${iconHtml(x)}
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
