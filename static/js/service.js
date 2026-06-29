/* ===================================================================
   AFRINOVA — Rendu d'une page de pôle (service.html?p=slug)
   =================================================================== */
(function () {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const slug = (params.get('p') || '').toLowerCase();
  const data = (window.AFRINOVA_SERVICES || {})[slug];

  // Pôle inconnu → retour à la liste des services
  if (!data) {
    window.location.replace('index.html#services');
    return;
  }

  const $ = (id) => document.getElementById(id);
  const color = data.color;

  /* ---- Méta & couleur d'accent ---- */
  document.title = data.name + ' — AFRINOVA';
  document.documentElement.style.setProperty('--svc', color);
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.setAttribute('content', color);

  /* ---- Hero ---- */
  $('crumbName').textContent = data.name;
  $('svcName').textContent = data.name;
  $('svcTagline').textContent = data.tagline;
  $('svcIcon').innerHTML = data.icon;

  /* ---- Intro ---- */
  $('svcIntro').innerHTML = data.intro.map((p) => `<p>${p}</p>`).join('');

  /* ---- Statistiques ---- */
  if (data.stats) {
    $('svcStats').innerHTML = data.stats.map((s) =>
      `<div class="svc-stat"><strong>${s.n}</strong><span>${s.l}</span></div>`
    ).join('');
  }

  /* ---- Atouts ---- */
  $('svcAtouts').innerHTML = (data.atouts || []).map((a) => `<li>${a}</li>`).join('');

  /* ---- Prestations ---- */
  $('svcPrestations').innerHTML = data.prestations.map((p) => `
    <article class="presta-card">
      <span class="presta-check" aria-hidden="true">✓</span>
      <div>
        <h3>${p.t}</h3>
        <p>${p.d}</p>
      </div>
    </article>`).join('');

  /* ---- Réalisations ---- */
  $('svcRealisations').innerHTML = data.realisations.map((r) => `
    <article class="work-card" style="--c:${color}">
      <div class="work-cover">
        <span class="work-emoji">${data.icon}</span>
        <span class="work-badge">${data.name}</span>
      </div>
      <div class="work-body">
        <h3>${r.t}</h3>
        <p>${r.d}</p>
        <div class="work-meta"><span>📍 ${r.lieu}</span><span>${r.annee}</span></div>
      </div>
    </article>`).join('');
})();
