/* ===================================================================
   AFRINOVA — Connexion unifiée
   Tout le monde se connecte ici ; on redirige selon le rôle :
     - administrateur (is_staff)  → admin.html
     - membre / chef de projet    → expert.html
   =================================================================== */
(function () {
  'use strict';
  const API = window.AfrinovaAPI;
  const $ = (id) => document.getElementById(id);

  const destination = (user) => (user && user.is_staff ? 'admin.html' : 'expert.html');

  // Déjà connecté ? On redirige directement.
  (async function () {
    if (API.getToken()) {
      try { const u = await API.me(); location.replace(destination(u)); return; }
      catch (e) { API.setToken(null); }
    }
  })();

  $('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('loginErr').hidden = true;
    const btn = $('loginBtn');
    btn.disabled = true; btn.textContent = 'Connexion…';
    try {
      const res = await API.login($('loginUser').value.trim(), $('loginCode').value);
      API.setToken(res.token);
      location.replace(destination(res.user));
    } catch (err) {
      $('loginErr').hidden = false;
      btn.disabled = false; btn.textContent = 'Se connecter';
    }
  });
})();
