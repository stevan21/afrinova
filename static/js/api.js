/* ===================================================================
   AFRINOVA — Client API (fetch + token)
   Communique avec le backend Django REST (/api/...).
   =================================================================== */
window.AfrinovaAPI = (function () {
  'use strict';
  const BASE = '/api';
  const TKEY = 'afrinova_token';

  const getToken = () => localStorage.getItem(TKEY);
  const setToken = (t) => { if (t) localStorage.setItem(TKEY, t); else localStorage.removeItem(TKEY); };

  async function req(method, path, body, isForm, sansToken) {
    const headers = {};
    const t = sansToken ? null : getToken();
    if (t) headers['Authorization'] = 'Token ' + t;
    let payload;
    if (isForm) { payload = body; }                       // FormData : pas de Content-Type (auto)
    else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }

    const res = await fetch(BASE + path, { method, headers, body: payload });

    /* Un token périmé fait rejeter la requête à l'authentification, avant même
       la vérification des droits : le serveur répond 401 y compris sur les
       points d'entrée publics. Un visiteur qui s'est connecté à l'admin par le
       passé voyait donc le parc et le questionnaire rester vides, et ses
       demandes n'étaient plus enregistrées. On oublie le token et on retente
       une fois en anonyme — rien n'a été exécuté côté serveur, le rejeu est
       sans effet de bord. Les pages qui exigent une session reçoivent le même
       401 qu'avant et renvoient vers la connexion. */
    if (res.status === 401 && t) {
      setToken(null);
      return req(method, path, body, isForm, true);
    }

    if (res.status === 204) return null;
    let data = null;
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) { try { data = await res.json(); } catch (e) {} }
    if (!res.ok) {
      let msg = (data && (data.detail || (typeof data === 'object' ? Object.values(data).flat().join(' ') : data))) || ('Erreur ' + res.status);
      const err = new Error(msg); err.status = res.status; err.data = data; throw err;
    }
    return data;
  }

  return {
    getToken, setToken,
    get: (p) => req('GET', p),
    post: (p, b) => req('POST', p, b),
    put: (p, b) => req('PUT', p, b),
    patch: (p, b) => req('PATCH', p, b),
    del: (p) => req('DELETE', p),
    postForm: (p, fd) => req('POST', p, fd, true),
    putForm: (p, fd) => req('PUT', p, fd, true),
    patchForm: (p, fd) => req('PATCH', p, fd, true),
    login: (username, password) => req('POST', '/auth/login', { username, password }),
    me: () => req('GET', '/auth/me'),
    logout: () => req('POST', '/auth/logout').catch(() => {}),
  };
})();
