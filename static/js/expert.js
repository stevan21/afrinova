/* ===================================================================
   AFRINOVA — Espace Expert (SPA) sur API Django REST
   Expertises (photo) · Notes · Rapports · Messages
   =================================================================== */
(function () {
  'use strict';
  const API = window.AfrinovaAPI;

  /* ====== Helpers ====== */
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtDate = (iso) => { const d = new Date(iso); return isNaN(d) ? '—' : d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); };
  const fmtDay = (iso) => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('fr-FR'); };
  const initials = (n) => (n || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const AVA = ['#1B2A63', '#F47920', '#1AAA5E', '#6B3FA0', '#1B8A6B', '#2563C9', '#C2410C'];
  const avaColor = (n) => AVA[(n || '').length % AVA.length];
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const snippet = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n) + '…' : s; };
  const nl2br = (s) => esc(s).replace(/\n/g, '<br>');
  const emptyBox = (msg) => `<div class="empty">${IC.inbox}<p>${esc(msg)}</p></div>`;

  const loginScreen = $('login'), appScreen = $('app'), viewEl = $('view'), titleEl = $('viewTitle');
  const state = { me: null, service: null, notes: [], reports: [], members: [], messages: [], vehicules: [], reservations: [] };
  let pendingFile = null, pendingURL = '', editNote = null, editReport = null, chatId = null;
  let editPres = null, editReal = null, pendingRealFile = null;
  let editingVeh = null;
  const fcfa = (n) => Number(n || 0).toLocaleString('fr-FR') + ' FCFA';
  const myExpId = () => (state.me && state.me.member && state.me.member.expertise) || null;

  /* ====== Toast ====== */
  let toastT;
  function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }

  /* ====== Auth ====== */
  function showLogin() { appScreen.hidden = true; loginScreen.hidden = false; }
  async function enter() {
    loginScreen.hidden = true; appScreen.hidden = false;
    await refreshLocationTabs();
    await setView('dashboard');
  }
  $('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault(); $('loginErr').hidden = true;
    try { const res = await API.login($('loginUser').value.trim(), $('loginCode').value); API.setToken(res.token); state.me = res.user; await enter(); }
    catch (err) { $('loginErr').hidden = false; }
  });
  $('logout').addEventListener('click', async () => { await API.logout(); API.setToken(null); state.me = null; showLogin(); });

  /* ====== Navigation SPA ====== */
  const TITLES = { dashboard: 'Tableau de bord', service: 'Ma page service', location: 'Mes véhicules', reservations: 'Réservations', notes: 'Notes', rapports: 'Rapports', messages: 'Messages' };
  const RENDER = { dashboard: renderDashboard, service: renderService, location: renderLocation, reservations: renderReservations, notes: renderNotes, rapports: renderRapports, messages: renderMessages };

  async function setView(name) {
    titleEl.textContent = TITLES[name] || '';
    document.querySelectorAll('#sideNav button').forEach(b => b.classList.toggle('active', b.dataset.view === name));
    viewEl.innerHTML = '<div class="empty">Chargement…</div>';
    closeSidebar();
    try { await ensureData(name); }
    catch (err) { viewEl.innerHTML = `<div class="panel"><div class="empty">${IC.alert} ${esc(err.message)}</div></div>`; return; }
    viewEl.innerHTML = RENDER[name]();
    bindView(name);
  }
  async function loadMyService() { try { return await API.get('/my-service/'); } catch (e) { return null; } }
  async function ensureData(name) {
    if (name === 'dashboard') { const [s, n, r] = await Promise.all([loadMyService(), API.get('/notes/'), API.get('/reports/')]); state.service = s; state.notes = n; state.reports = r; }
    else if (name === 'service') state.service = await loadMyService();
    else if (name === 'notes') state.notes = await API.get('/notes/');
    else if (name === 'rapports') state.reports = await API.get('/reports/');
    else if (name === 'messages') { const [m, msg] = await Promise.all([API.get('/members/'), API.get('/messages/')]); state.members = m; state.messages = msg; }
    else if (name === 'location') state.vehicules = await API.get('/vehicules/?expertise=' + (myExpId() || 0));
    else if (name === 'reservations') { const [r, v] = await Promise.all([API.get('/reservations/'), API.get('/vehicules/?expertise=' + (myExpId() || 0))]); state.reservations = r; state.vehicules = v; }
  }

  /* Les onglets « véhicules » n'ont de sens que pour le pôle qui gère un parc. */
  async function refreshLocationTabs() {
    const exp = myExpId();
    let show = false;
    if (exp) {
      const name = norm((state.me.member && state.me.member.expertise_name) || '');
      show = name.includes('location') || name.includes('vehicule') || name.includes('voiture');
      if (!show) {
        // Sinon : on affiche quand même si ce pôle a déjà des véhicules.
        try { show = (await API.get('/vehicules/?expertise=' + exp)).length > 0; } catch (e) {}
      }
    }
    const a = $('navLocation'), b = $('navReservations');
    if (a) a.hidden = !show;
    if (b) b.hidden = !show;
  }
  $('sideNav').addEventListener('click', (e) => { const b = e.target.closest('button[data-view]'); if (b) { editPres = null; editReal = null; setView(b.dataset.view); } });

  /* ====== Sidebar mobile ====== */
  const sidebar = $('sidebar'), backdrop = $('backdrop');
  const openSidebar = () => { sidebar.classList.add('open'); backdrop.classList.add('show'); };
  const closeSidebar = () => { sidebar.classList.remove('open'); backdrop.classList.remove('show'); };
  $('sideToggle').addEventListener('click', openSidebar);
  backdrop.addEventListener('click', closeSidebar);

  /* ====== Tableau de bord ====== */
  function renderDashboard() {
    const s = state.service, n = state.notes, r = state.reports;
    const stat = (c, ic, num, l, go) => `<div class="stat-card" ${go ? `data-go="${go}" style="cursor:pointer"` : ''}><div class="stat-ic" style="background:${c}">${ic}</div><div><b>${num}</b><span>${l}</span></div></div>`;
    const pole = s
      ? `<div class="panel"><div class="panel-head"><h3>Mon pôle : ${esc(s.name)}</h3>
          <div class="form-actions"><a class="btn btn-ghost btn-sm" href="service.html?p=${esc(s.slug)}" target="_blank" rel="noopener">Voir la page publique ↗</a>
            <button class="btn btn-primary btn-sm" data-go="service">Gérer ma page</button></div></div>
          <p style="color:var(--muted)">${esc(s.description || "Ajoutez une description, des prestations et des réalisations à votre page service.")}</p></div>`
      : `<div class="panel"><div class="empty">${IC.inbox}<p>Aucun pôle ne vous est affecté.<br>Contactez l'administrateur pour qu'il vous affecte un pôle.</p></div></div>`;
    return `
      <div class="stats-row" style="grid-template-columns:repeat(3,1fr);max-width:820px">
        ${stat('#1B2A63', IC.star, s ? (s.prestations.length + s.realisations.length) : 0, 'Éléments de ma page', s ? 'service' : null)}
        ${stat('#F47920', IC.note, n.length, 'Notes', 'notes')}
        ${stat('#2563C9', IC.report, r.length, 'Rapports', 'rapports')}
      </div>
      ${pole}`;
  }

  /* ====== Ma page service (édition du pôle affecté) ====== */
  function renderService() {
    const s = state.service;
    if (!s) return `<div class="panel"><div class="empty">${IC.inbox}<p>Aucun pôle ne vous est affecté.<br>Contactez l'administrateur.</p></div></div>`;
    pendingFile = null; pendingURL = s.photo || ''; pendingRealFile = null;
    const edP = editPres ? s.prestations.find(p => p.id === editPres) : null;
    const edR = editReal ? s.realisations.find(r => r.id === editReal) : null;
    return `
      <div class="panel" style="max-width:860px">
        <div class="panel-head"><h3>Ma page : ${esc(s.name)}</h3>
          <a class="btn btn-ghost btn-sm" href="service.html?p=${esc(s.slug)}" target="_blank" rel="noopener">Voir en ligne ↗</a></div>
        <form id="poleForm">
          <div class="field"><label>Slogan</label><input id="pTagline" value="${esc(s.tagline || '')}" placeholder="Ex. Construire l'avenir, durablement" /></div>
          <div class="field"><label>Description du pôle</label><textarea id="pDesc" rows="5" placeholder="Présentez votre domaine…">${esc(s.description || '')}</textarea></div>
          <div class="form-row">
            <div class="field"><label>Couleur</label><input id="pColor" type="color" value="${s.color || '#1B2A63'}" /></div>
            <div class="field"><label>Photo / visuel du pôle</label>
              <div class="photo-row"><div class="photo-preview" id="ePreview"></div><div class="photo-controls"><input id="pPhoto" type="file" accept="image/*" /></div></div></div>
          </div>
          <div class="form-actions"><button class="btn btn-primary" type="submit">${IC.save} Enregistrer la présentation</button></div>
        </form>
      </div>

      <div class="panel" style="max-width:860px">
        <div class="panel-head"><h3>Prestations (${s.prestations.length})</h3></div>
        <form id="presForm" class="form-row" style="align-items:flex-end">
          <div class="field" style="flex:1"><label>Titre *</label><input id="presTitle" required value="${edP ? esc(edP.title) : ''}" placeholder="Ex. Gros œuvre" /></div>
          <div class="field" style="flex:2"><label>Description</label><input id="presDesc" value="${edP ? esc(edP.description || '') : ''}" placeholder="Courte description" /></div>
          <div class="form-actions"><button class="btn btn-primary" type="submit">${edP ? '${IC.save}' : '+ Ajouter'}</button>${edP ? '<button class="btn btn-ghost" type="button" id="presCancel">Annuler</button>' : ''}</div>
        </form>
        ${s.prestations.length ? `<div class="report-list" style="margin-top:16px">${s.prestations.map(presRow).join('')}</div>` : `<div class="empty">${IC.inbox}<p>Aucune prestation.</p></div>`}
      </div>

      <div class="panel" style="max-width:860px">
        <div class="panel-head"><h3>Réalisations (${s.realisations.length})</h3></div>
        <form id="realForm">
          <div class="form-row">
            <div class="field"><label>Titre *</label><input id="realTitle" required value="${edR ? esc(edR.title) : ''}" placeholder="Ex. Résidence Les Palmiers" /></div>
            <div class="field"><label>Lieu</label><input id="realLieu" value="${edR ? esc(edR.lieu || '') : ''}" placeholder="Ex. Douala" /></div>
          </div>
          <div class="form-row">
            <div class="field"><label>Année</label><input id="realYear" value="${edR ? esc(edR.year || '') : ''}" placeholder="Ex. 2024" /></div>
            <div class="field"><label>Photo ${edR ? '(remplacer)' : ''}</label><input id="realPhoto" type="file" accept="image/*" /></div>
          </div>
          <div class="field"><label>Description</label><textarea id="realDesc" rows="3" placeholder="Décrivez la réalisation…">${edR ? esc(edR.description || '') : ''}</textarea></div>
          <div class="form-actions"><button class="btn btn-primary" type="submit">${edR ? '${IC.save} Enregistrer' : '+ Ajouter la réalisation'}</button>${edR ? '<button class="btn btn-ghost" type="button" id="realCancel">Annuler</button>' : ''}</div>
        </form>
        ${s.realisations.length ? `<div class="exp-grid" style="margin-top:18px">${s.realisations.map(realCard).join('')}</div>` : `<div class="empty">${IC.inbox}<p>Aucune réalisation.</p></div>`}
      </div>`;
  }
  function presRow(p) {
    return `<div class="report-card"><div class="report-info"><h4>${esc(p.title)}</h4><p>${esc(p.description || '')}</p></div>
      <div class="report-actions"><button class="btn-icon edit" data-epres="${p.id}" title="Modifier">${IC.pencil}</button><button class="btn-icon" data-dpres="${p.id}" title="Supprimer">${IC.trash}</button></div></div>`;
  }
  function realCard(r) {
    const top = r.photo ? `<div class="exp-top has-photo"><img src="${r.photo}" alt="${esc(r.title)}"></div>` : `<div class="exp-top" style="background:${state.service.color || '#1B2A63'}"><span class="exp-ic">${IC.site}</span></div>`;
    return `<div class="exp-card"><div class="exp-actions"><button class="btn-icon edit" data-ereal="${r.id}" title="Modifier">${IC.pencil}</button><button class="btn-icon" data-dreal="${r.id}" title="Supprimer">${IC.trash}</button></div>${top}
      <div class="exp-body"><h4>${esc(r.title)}</h4><p>${esc(r.description || '')}</p><div class="mini" style="margin-top:6px">${r.lieu ? '${IC.pin} ' + esc(r.lieu) + (r.year ? ' · ' : '') : ''}${esc(r.year || '')}</div></div></div>`;
  }
  function renderPreview() {
    const p = $('ePreview'); if (!p) return;
    if (pendingURL) { p.innerHTML = `<img src="${pendingURL}" alt="">`; p.style.background = ''; }
    else { p.innerHTML = '<span>Aucune photo</span>'; p.style.background = ($('pColor') ? $('pColor').value : '#1B2A63'); }
  }

  /* ====== Notes ====== */
  function renderNotes() {
    const notes = state.notes;
    const ed = editNote ? notes.find(n => n.id === editNote) : null;
    return `<div class="panel" style="max-width:760px"><div class="panel-head"><h3>${ed ? '${IC.pencil} Modifier la note' : '${IC.memo} Nouvelle note'}</h3></div>
        <form id="noteForm"><div class="field"><label>Titre *</label><input id="nTitle" required value="${ed ? esc(ed.title) : ''}" placeholder="Titre" /></div>
          <div class="field"><label>Contenu</label><textarea id="nBody" rows="5" placeholder="Écrivez votre note…">${ed ? esc(ed.body || '') : ''}</textarea></div>
          <div class="form-actions"><button class="btn btn-primary" type="submit">${ed ? '${IC.save} Enregistrer' : '+ Ajouter la note'}</button>${ed ? '<button class="btn btn-ghost" type="button" id="noteCancel">Annuler</button>' : ''}</div></form></div>
      <div class="panel"><div class="panel-head"><h3>Mes notes (${notes.length})</h3><input class="search" id="noteSearch" type="search" placeholder="Rechercher…" /></div>
        ${notes.length ? `<div class="notes-grid">${notes.map(noteCard).join('')}</div>` : `<div class="empty">${IC.inbox}<p>Aucune note.</p></div>`}</div>`;
  }
  function noteCard(n) {
    return `<div class="note-card" data-k="${esc(norm(n.title + ' ' + (n.body || '')))}"><div class="note-head"><h4>${esc(n.title)}</h4>
      <div class="exp-actions" style="position:static"><button class="btn-icon edit" data-enote="${n.id}" title="Modifier">${IC.pencil}</button><button class="btn-icon" data-dnote="${n.id}" title="Supprimer">${IC.trash}</button></div></div>
      <p>${nl2br(snippet(n.body, 240))}</p><div class="note-date mini">${fmtDate(n.updated)}</div></div>`;
  }

  /* ====== Rapports ====== */
  function renderRapports() {
    const reports = state.reports;
    const ed = editReport ? reports.find(r => r.id === editReport) : null;
    const today = new Date().toISOString().slice(0, 10);
    return `<div class="panel" style="max-width:820px"><div class="panel-head"><h3>${ed ? '${IC.pencil} Modifier le rapport' : '${IC.page} Nouveau rapport'}</h3></div>
        <form id="repForm">
          <div class="form-row"><div class="field"><label>Titre *</label><input id="rTitle" required value="${ed ? esc(ed.title) : ''}" placeholder="Ex. Rapport de chantier" /></div>
            <div class="field"><label>Auteur</label><input id="rAuthor" value="${ed ? esc(ed.author || '') : esc(state.me ? state.me.name : '')}" placeholder="Votre nom" /></div></div>
          <div class="form-row"><div class="field"><label>Date</label><input id="rDate" type="date" value="${ed ? (ed.date || today) : today}" /></div><div class="field"></div></div>
          <div class="field"><label>Contenu</label><textarea id="rBody" rows="8" placeholder="Rédigez le rapport…">${ed ? esc(ed.body || '') : ''}</textarea></div>
          <div class="form-actions"><button class="btn btn-primary" type="submit">${ed ? '${IC.save} Enregistrer' : '+ Créer le rapport'}</button>${ed ? '<button class="btn btn-ghost" type="button" id="repCancel">Annuler</button>' : ''}</div></form></div>
      <div class="panel"><div class="panel-head"><h3>Mes rapports (${reports.length})</h3><input class="search" id="repSearch" type="search" placeholder="Rechercher…" /></div>
        ${reports.length ? `<div class="report-list">${reports.map(reportRow).join('')}</div>` : `<div class="empty">${IC.inbox}<p>Aucun rapport.</p></div>`}</div>`;
  }
  function reportRow(r) {
    return `<div class="report-card" data-k="${esc(norm(r.title + ' ' + (r.author || '') + ' ' + (r.body || '')))}">
      <div class="report-info"><h4>${esc(r.title)}</h4><div class="mini">${r.author ? esc(r.author) + ' · ' : ''}${r.date ? fmtDay(r.date) : fmtDay(r.created)}</div><p>${esc(snippet(r.body, 160))}</p></div>
      <div class="report-actions"><button class="btn-icon" data-print="${r.id}" title="Imprimer / PDF">${IC.print}</button><button class="btn-icon edit" data-erep="${r.id}" title="Modifier">${IC.pencil}</button><button class="btn-icon" data-drep="${r.id}" title="Supprimer">${IC.trash}</button></div></div>`;
  }
  function printReport(id) {
    const r = state.reports.find(x => x.id === id); if (!r) return;
    const w = window.open('', '_blank');
    w.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>${esc(r.title)}</title>
      <style>body{font-family:Arial,sans-serif;color:#16203f;max-width:780px;margin:40px auto;padding:0 24px;line-height:1.6}
      .hd{border-bottom:3px solid #F47920;padding-bottom:14px;margin-bottom:22px}.hd b{font-size:1.4rem;color:#1B2A63}
      .meta{color:#6b7390;font-size:.9rem;margin-bottom:24px}h1{color:#1B2A63;font-size:1.6rem;margin:0 0 6px}.body{white-space:pre-wrap}
      .ft{margin-top:40px;border-top:1px solid #ddd;padding-top:12px;color:#9aa3bd;font-size:.8rem}</style></head>
      <body><div class="hd"><b>AFRI<span style="color:#F47920">NOVA</span></b></div><h1>${esc(r.title)}</h1>
      <div class="meta">${r.author ? 'Par ' + esc(r.author) + ' — ' : ''}${r.date ? fmtDay(r.date) : fmtDay(r.created)}</div>
      <div class="body">${esc(r.body || '')}</div><div class="ft">Document AFRINOVA.</div>
      <script>window.onload=function(){window.print();}<\/script></body></html>`);
    w.document.close();
  }

  /* ====== Messages ====== */
  function memberAva(c, s) { const inner = c.photo ? `<img src="${c.photo}" alt="">` : esc(initials(c.name)); return `<span class="m-ava" style="width:${s}px;height:${s}px;background:${avaColor(c.name)}">${inner}</span>`; }
  function renderMessages() {
    const me = state.me;
    const contacts = state.members.filter(c => c.user_id !== me.id);
    if (!contacts.length) return `<div class="panel"><div class="empty">${IC.inbox}<p>Aucun autre membre disponible.</p></div></div>`;
    const msgs = state.messages;
    const lastOf = (uid) => msgs.filter(m => (m.sender === me.id && m.recipient === uid) || (m.sender === uid && m.recipient === me.id)).slice(-1)[0];
    const unreadOf = (uid) => msgs.filter(m => m.sender === uid && m.recipient === me.id && !m.read).length;
    contacts.sort((a, b) => { const la = lastOf(a.user_id), lb = lastOf(b.user_id); return (lb ? lb.created : '').localeCompare(la ? la.created : ''); });
    const list = contacts.map(c => {
      const last = lastOf(c.user_id), un = unreadOf(c.user_id);
      return `<button class="contact-item${c.user_id === chatId ? ' active' : ''}" data-chat="${c.user_id}">${memberAva(c, 42)}
        <div class="contact-main"><div class="contact-top"><b>${esc(c.name)}</b>${last ? `<span class="mini">${fmtDay(last.created)}</span>` : ''}</div>
        <span class="contact-prev mini">${last ? (last.sender === me.id ? 'Vous : ' : '') + esc(snippet(last.text, 30)) : 'Démarrer la conversation'}</span></div>${un ? `<span class="unread">${un}</span>` : ''}</button>`;
    }).join('');
    let thread;
    const c = contacts.find(x => x.user_id === chatId);
    if (c) {
      const conv = msgs.filter(m => (m.sender === me.id && m.recipient === chatId) || (m.sender === chatId && m.recipient === me.id));
      thread = `<div class="thread-head">${memberAva(c, 38)}<div><b>${esc(c.name)}</b><br><span class="mini">${c.pole ? esc(c.pole) : 'Membre'}</span></div></div>
        <div class="msg-list" id="msgList">${conv.length ? conv.map(m => `<div class="bubble ${m.sender === me.id ? 'sent' : 'recv'}">${nl2br(m.text)}<span class="b-time">${fmtDate(m.created)}</span></div>`).join('') : `<div class="msg-empty mini">Aucun message. Écrivez le premier</div>`}</div>
        <form class="composer" id="msgForm"><input id="msgInput" placeholder="Votre message…" autocomplete="off" /><button class="msg-send" type="submit"><svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M3.4 11.9 20 4l-7.9 16.6-2-6.7-6.7-2Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg></button></form>`;
    } else thread = `<div class="msg-placeholder">${IC.inbox}<p>Sélectionnez un membre à gauche pour discuter.</p></div>`;
    return `<div class="me-bar"><label>Connecté en tant que :</label> <b style="color:var(--navy)">${esc(me.name)}</b></div>
      <div class="msg-layout"><div class="msg-contacts">${list}</div><div class="msg-thread">${thread}</div></div>`;
  }

  /* ====== Événements ====== */
  function bindView(name) {
    viewEl.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => setView(b.dataset.go)));

    if (name === 'location') {
      const form = $('vehForm');
      if (form) form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.append('name', $('vName').value.trim());
        fd.append('year', $('vYear').value.trim());
        fd.append('expertise', myExpId());
        fd.append('price_ville', $('vVille').value || 0);
        fd.append('price_hors_ville', $('vHorsVille').value || 0);
        fd.append('remise', $('vRemise').value.trim());
        fd.append('available', $('vAvail').value === '1' ? 'true' : 'false');
        fd.append('description', $('vDesc').value.trim());
        if ($('vPhoto').files[0]) fd.append('photo', $('vPhoto').files[0]);
        try {
          let veh;
          if (editingVeh) { veh = await API.patchForm('/vehicules/' + editingVeh + '/', fd); toast('Véhicule mis à jour ✓'); }
          else { veh = await API.postForm('/vehicules/', fd); toast('Véhicule ajouté ✓'); }
          const extra = $('vPhotos').files;
          for (let i = 0; i < extra.length; i++) {
            const pf = new FormData();
            pf.append('vehicule', veh.id);
            pf.append('image', extra[i]);
            pf.append('order', i);
            await API.postForm('/vehicule-photos/', pf);
          }
          editingVeh = null;
          await setView('location');
        } catch (err) { alert(err.message); }
      });
      const vc = $('vehCancel'); if (vc) vc.addEventListener('click', () => { editingVeh = null; setView('location'); });
      viewEl.querySelectorAll('[data-edit-veh]').forEach(b => b.addEventListener('click', () => {
        editingVeh = +b.dataset.editVeh; setView('location'); window.scrollTo({ top: 0, behavior: 'smooth' });
      }));
      viewEl.querySelectorAll('[data-del-veh]').forEach(b => b.addEventListener('click', async () => {
        if (!confirm('Supprimer ce véhicule et ses photos ?')) return;
        if (editingVeh === +b.dataset.delVeh) editingVeh = null;
        await API.del('/vehicules/' + b.dataset.delVeh + '/'); toast('Véhicule supprimé'); await setView('location');
      }));
      viewEl.querySelectorAll('[data-del-photo]').forEach(b => b.addEventListener('click', async () => {
        if (!confirm('Supprimer cette photo ?')) return;
        await API.del('/vehicule-photos/' + b.dataset.delPhoto + '/'); toast('Photo supprimée'); await setView('location');
      }));
    }

    if (name === 'reservations') {
      viewEl.querySelectorAll('[data-resa-status]').forEach(sel => sel.addEventListener('change', async () => {
        await API.patch('/reservations/' + sel.dataset.resaStatus + '/', { status: sel.value });
        toast('Statut mis à jour'); await setView('reservations');
      }));
    }

    if (name === 'service' && state.service) {
      const sid = state.service.id;
      // Présentation du pôle
      renderPreview();
      const pc = $('pColor'); if (pc) pc.addEventListener('input', () => { if (!pendingFile) renderPreview(); });
      const pp = $('pPhoto'); if (pp) pp.addEventListener('change', (e) => { const f = e.target.files[0]; if (!f) return; pendingFile = f; pendingURL = URL.createObjectURL(f); renderPreview(); });
      $('poleForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.append('tagline', $('pTagline').value.trim());
        fd.append('description', $('pDesc').value.trim());
        fd.append('color', $('pColor').value);
        if (pendingFile) fd.append('photo', pendingFile);
        try { await API.patchForm('/expertises/' + sid + '/', fd); toast('Présentation enregistrée ✓'); await setView('service'); }
        catch (err) { alert(err.message); }
      });
      // Prestations
      $('presForm').addEventListener('submit', async (e) => {
        e.preventDefault(); const t = $('presTitle').value.trim(); if (!t) return;
        const body = { expertise: sid, title: t, description: $('presDesc').value.trim() };
        try {
          if (editPres) { await API.patch('/prestations/' + editPres + '/', body); editPres = null; toast('Prestation modifiée ✓'); }
          else { await API.post('/prestations/', body); toast('Prestation ajoutée ✓'); }
          await setView('service');
        } catch (err) { alert(err.message); }
      });
      const presC = $('presCancel'); if (presC) presC.addEventListener('click', () => { editPres = null; setView('service'); });
      viewEl.querySelectorAll('[data-epres]').forEach(b => b.addEventListener('click', () => { editPres = +b.dataset.epres; setView('service'); window.scrollTo({ top: 0, behavior: 'smooth' }); }));
      viewEl.querySelectorAll('[data-dpres]').forEach(b => b.addEventListener('click', async () => {
        if (!confirm('Supprimer cette prestation ?')) return;
        await API.del('/prestations/' + b.dataset.dpres + '/'); if (editPres === +b.dataset.dpres) editPres = null; toast('Supprimée'); await setView('service');
      }));
      // Réalisations
      const rp = $('realPhoto'); if (rp) rp.addEventListener('change', (e) => { pendingRealFile = e.target.files[0] || null; });
      $('realForm').addEventListener('submit', async (e) => {
        e.preventDefault(); const t = $('realTitle').value.trim(); if (!t) return;
        const fd = new FormData();
        fd.append('expertise', sid); fd.append('title', t);
        fd.append('description', $('realDesc').value.trim());
        fd.append('lieu', $('realLieu').value.trim());
        fd.append('year', $('realYear').value.trim());
        if (pendingRealFile) fd.append('photo', pendingRealFile);
        try {
          if (editReal) { await API.patchForm('/realisations/' + editReal + '/', fd); editReal = null; toast('Réalisation modifiée ✓'); }
          else { await API.postForm('/realisations/', fd); toast('Réalisation ajoutée ✓'); }
          await setView('service');
        } catch (err) { alert(err.message); }
      });
      const realC = $('realCancel'); if (realC) realC.addEventListener('click', () => { editReal = null; setView('service'); });
      viewEl.querySelectorAll('[data-ereal]').forEach(b => b.addEventListener('click', () => { editReal = +b.dataset.ereal; setView('service'); window.scrollTo({ top: 0, behavior: 'smooth' }); }));
      viewEl.querySelectorAll('[data-dreal]').forEach(b => b.addEventListener('click', async () => {
        if (!confirm('Supprimer cette réalisation ?')) return;
        await API.del('/realisations/' + b.dataset.dreal + '/'); if (editReal === +b.dataset.dreal) editReal = null; toast('Supprimée'); await setView('service');
      }));
    }

    if (name === 'notes') {
      $('noteForm').addEventListener('submit', async (e) => {
        e.preventDefault(); const t = $('nTitle').value.trim(); if (!t) return;
        const body = { title: t, body: $('nBody').value.trim() };
        try {
          if (editNote) { await API.patch('/notes/' + editNote + '/', body); editNote = null; toast('Note enregistrée ✓'); }
          else { await API.post('/notes/', body); toast('Note ajoutée ✓'); }
          await setView('notes');
        } catch (err) { alert(err.message); }
      });
      const nc = $('noteCancel'); if (nc) nc.addEventListener('click', () => { editNote = null; setView('notes'); });
      viewEl.querySelectorAll('[data-enote]').forEach(b => b.addEventListener('click', () => { editNote = +b.dataset.enote; setView('notes'); window.scrollTo({ top: 0, behavior: 'smooth' }); }));
      viewEl.querySelectorAll('[data-dnote]').forEach(b => b.addEventListener('click', async () => {
        if (!confirm('Supprimer cette note ?')) return;
        await API.del('/notes/' + b.dataset.dnote + '/'); if (editNote === +b.dataset.dnote) editNote = null; toast('Note supprimée'); await setView('notes');
      }));
      filterCards('noteSearch', '.note-card');
    }

    if (name === 'rapports') {
      $('repForm').addEventListener('submit', async (e) => {
        e.preventDefault(); const t = $('rTitle').value.trim(); if (!t) return;
        const body = { title: t, author: $('rAuthor').value.trim(), date: $('rDate').value || null, body: $('rBody').value.trim() };
        try {
          if (editReport) { await API.patch('/reports/' + editReport + '/', body); editReport = null; toast('Rapport enregistré ✓'); }
          else { await API.post('/reports/', body); toast('Rapport créé ✓'); }
          await setView('rapports');
        } catch (err) { alert(err.message); }
      });
      const rc = $('repCancel'); if (rc) rc.addEventListener('click', () => { editReport = null; setView('rapports'); });
      viewEl.querySelectorAll('[data-erep]').forEach(b => b.addEventListener('click', () => { editReport = +b.dataset.erep; setView('rapports'); window.scrollTo({ top: 0, behavior: 'smooth' }); }));
      viewEl.querySelectorAll('[data-drep]').forEach(b => b.addEventListener('click', async () => {
        if (!confirm('Supprimer ce rapport ?')) return;
        await API.del('/reports/' + b.dataset.drep + '/'); if (editReport === +b.dataset.drep) editReport = null; toast('Rapport supprimé'); await setView('rapports');
      }));
      viewEl.querySelectorAll('[data-print]').forEach(b => b.addEventListener('click', () => printReport(+b.dataset.print)));
      filterCards('repSearch', '.report-card');
    }

    if (name === 'messages') {
      viewEl.querySelectorAll('[data-chat]').forEach(b => b.addEventListener('click', async () => {
        chatId = +b.dataset.chat;
        try { await API.post('/messages/mark_read/', { contact: chatId }); } catch (e) {}
        await setView('messages');
      }));
      const form = $('msgForm');
      if (form) form.addEventListener('submit', async (e) => {
        e.preventDefault(); const txt = $('msgInput').value.trim(); if (!txt) return;
        await API.post('/messages/', { recipient: chatId, text: txt }); await setView('messages');
      });
      const ml = $('msgList'); if (ml) ml.scrollTop = ml.scrollHeight;
    }
  }
  /* ====== Vue : Mes véhicules ====== */
  function renderLocation() {
    const vehs = state.vehicules;
    const ed = editingVeh ? vehs.find(v => v.id === editingVeh) : null;
    const exp = myExpId();
    if (!exp) return `<div class="panel">${emptyBox("Aucun pôle ne vous est affecté. Demandez à l'administrateur.")}</div>`;
    return `
      <div class="panel">
        <div class="panel-head"><h3>${ed ? '${IC.pencil} Modifier le véhicule' : 'Ajouter un véhicule'}</h3>
          <span class="sub">${ed ? esc(ed.name) : 'Il apparaîtra sur la page Location du site'}</span></div>
        <form id="vehForm">
          <div class="form-row">
            <div class="field"><label>Nom du véhicule *</label><input id="vName" required value="${ed ? esc(ed.name) : ''}" placeholder="Ex. Toyota Corolla" /></div>
            <div class="field"><label>Année</label><input id="vYear" value="${ed ? esc(ed.year || '') : ''}" placeholder="Ex. 2021" /></div>
          </div>
          <div class="form-row">
            <div class="field"><label>Prix en ville / jour (FCFA)</label><input id="vVille" type="number" min="0" value="${ed ? ed.price_ville : 0}" /></div>
            <div class="field"><label>Prix hors ville / jour (FCFA)</label><input id="vHorsVille" type="number" min="0" value="${ed ? ed.price_hors_ville : 0}" /></div>
          </div>
          <div class="form-row">
            <div class="field"><label>Remise sur plusieurs jours</label>
              <input id="vRemise" maxlength="200" value="${ed ? esc(ed.remise || '') : ''}" placeholder="Ex. Remise à partir de 3 jours, nous consulter" />
              <span class="hint">Texte affiché tel quel au client. Laissez vide s'il n'y a pas de remise.</span></div>
            <div class="field"><label>Disponibilité</label><select id="vAvail">
              <option value="1"${!ed || ed.available ? ' selected' : ''}>Disponible</option>
              <option value="0"${ed && !ed.available ? ' selected' : ''}>Indisponible (loué)</option>
            </select></div>
          </div>
          <div class="field"><label>Description</label><textarea id="vDesc" placeholder="Boîte automatique, 5 places, climatisation…">${ed ? esc(ed.description || '') : ''}</textarea></div>
          <div class="form-row">
            <div class="field"><label>Photo principale ${ed ? '(remplacer)' : ''}</label><input id="vPhoto" type="file" accept="image/*" /></div>
            <div class="field"><label>Photos supplémentaires (plusieurs)</label><input id="vPhotos" type="file" accept="image/*" multiple /></div>
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" type="submit">${ed ? '${IC.save} Enregistrer' : '+ Ajouter le véhicule'}</button>
            ${ed ? '<button class="btn btn-ghost" type="button" id="vehCancel">Annuler</button>' : ''}
          </div>
        </form>
      </div>
      <div class="panel">
        <div class="panel-head"><h3>Mon parc (${vehs.length})</h3>
          <a class="btn btn-ghost btn-sm" href="location.html" target="_blank" rel="noopener">Voir la page ↗</a></div>
        ${vehs.length ? `<div class="chefs-grid">${vehs.map(vehCard).join('')}</div>` : emptyBox('Aucun véhicule pour le moment.')}
      </div>`;
  }
  function vehCard(v) {
    const pics = (v.photo ? 1 : 0) + (v.photos || []).length;
    const cover = v.photo ? `<img src="${v.photo}" alt="${esc(v.name)}">`
      : ((v.photos || [])[0] ? `<img src="${v.photos[0].image}" alt="${esc(v.name)}">` : IC.car);
    return `<div class="chef-card">
      <button class="btn-icon chef-edit" data-edit-veh="${v.id}" title="Modifier">${IC.pencil}</button>
      <button class="btn-icon chef-del" data-del-veh="${v.id}" title="Supprimer">${IC.trash}</button>
      <div class="chef-ava" style="background:#2563C9;border-radius:12px">${cover}</div>
      <h4>${esc(v.name)}</h4>
      <span class="chef-pole">${v.available ? 'Disponible' : 'Indisponible'}${v.year ? ' · ' + esc(v.year) : ''}</span>
      <div class="chef-info">
        ${v.price_ville ? 'Ville : ' + fcfa(v.price_ville) + ' / jour<br>' : 'Ville : sur demande<br>'}
        ${v.price_hors_ville ? 'Hors ville : ' + fcfa(v.price_hors_ville) + ' / jour<br>' : 'Hors ville : sur demande<br>'}
        ${v.remise ? `<span class="mini">${IC.tag} ${esc(v.remise)}</span><br>` : ''}
        <span class="mini">${pics} photo${pics > 1 ? 's' : ''}</span>
        ${(v.photos || []).length ? `<br>${v.photos.map(p => `<button class="btn-icon" data-del-photo="${p.id}" title="Supprimer cette photo">${IC.trash}</button>`).join('')}` : ''}
      </div>
    </div>`;
  }

  /* ====== Vue : Réservations (celles de mon pôle) ====== */
  function renderReservations() {
    const list = state.reservations;
    const ST = ['nouvelle', 'confirmée', 'terminée', 'annulée'];
    return `
      <div class="panel">
        <div class="panel-head"><h3>Demandes reçues (${list.length})</h3>
          <span class="sub">Les réservations portant sur vos véhicules</span></div>
        ${list.length ? `<div class="table-wrap"><table>
          <thead><tr><th>Reçue le</th><th>Client</th><th>Contact</th><th>Véhicule</th><th>Période</th><th>Trajet</th><th>Chauffeur</th><th>Message</th><th>Statut</th></tr></thead>
          <tbody>${list.map(r => {
            const st = r.status || 'nouvelle';
            const periode = (r.date_debut ? fmtDay(r.date_debut) : '?') + ' → ' + (r.date_fin ? fmtDay(r.date_fin) : '?');
            return `<tr>
              <td class="mini">${fmtDate(r.created)}</td>
              <td class="cell-strong">${esc(r.name)}</td>
              <td class="mini">${r.email ? `<a href="mailto:${esc(r.email)}">${esc(r.email)}</a><br>` : ''}${r.phone ? esc(r.phone) : ''}</td>
              <td>${esc(r.vehicule_name || 'À conseiller')}</td>
              <td class="mini">${periode}</td>
              <td class="mini">${esc(r.zone_label || '')}</td>
              <td>${r.avec_chauffeur ? 'Oui' : 'Non'}</td>
              <td class="cell-msg">${esc(r.message || '')}</td>
              <td><select class="status-select" data-resa-status="${r.id}">
                ${ST.map(s => `<option value="${s}"${s === st ? ' selected' : ''}>${s}</option>`).join('')}</select></td>
            </tr>`;
          }).join('')}</tbody></table></div>` : emptyBox('Aucune réservation pour le moment.')}
      </div>`;
  }

  function filterCards(searchId, sel) {
    const s = $(searchId); if (!s) return;
    s.addEventListener('input', () => { const q = norm(s.value); viewEl.querySelectorAll(sel).forEach(c => { c.style.display = c.dataset.k.includes(q) ? '' : 'none'; }); });
  }

  /* ====== Icônes ====== */
  const IC = {
    trash: '<svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    pencil: '<svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M4 20h4L18.5 9.5a2 2 0 0 0 0-2.9l-1.1-1.1a2 2 0 0 0-2.9 0L4 16v4Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M13.4 6.6l4 4" stroke="currentColor" stroke-width="1.7"/></svg>',
    print: '<svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M6 9V3h12v6M6 18H4v-7h16v7h-2M8 14h8v7H8v-7Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" width="24" height="24"><path d="M12 3l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 21l-5.2 2.9 1-5.8L3.6 9.1l5.8-.8L12 3Z" stroke="#fff" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    note: '<svg viewBox="0 0 24 24" fill="none" width="24" height="24"><rect x="4" y="3" width="16" height="18" rx="2" stroke="#fff" stroke-width="1.7"/><path d="M8 8h8M8 12h8M8 16h4" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/></svg>',
    report: '<svg viewBox="0 0 24 24" fill="none" width="24" height="24"><path d="M6 3h9l4 4v14H6V3Z" stroke="#fff" stroke-width="1.7" stroke-linejoin="round"/><path d="M14 3v5h5M9 13v4M12 11v6M15 15v2" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/></svg>',
    inbox: '<svg viewBox="0 0 24 24" fill="none"><path d="M3 13l3-8h12l3 8v6H3v-6Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M3 13h5l1.5 2.5h5L16 13h5" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    save: '<svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M5 3h11l3 3v15H5V3Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 3v6h7V3M8 14h8v7H8v-7Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M12 3.8 2.8 19.4h18.4L12 3.8Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 10v4M12 16.8h.01" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    car: '<svg viewBox="0 0 24 24" fill="none" width="34" height="34"><path d="M3 13l1.5-4.5A2 2 0 0 1 6.4 7h11.2a2 2 0 0 1 1.9 1.5L21 13v5h-2v-2H5v2H3v-5Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7" cy="16" r="1.2" fill="currentColor"/><circle cx="17" cy="16" r="1.2" fill="currentColor"/></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M3 12.6V4.5A1.5 1.5 0 0 1 4.5 3h8.1a2 2 0 0 1 1.4.6l7 7a2 2 0 0 1 0 2.8l-6.6 6.6a2 2 0 0 1-2.8 0l-7-7a2 2 0 0 1-.6-1.4Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7.8" cy="7.8" r="1.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="2.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    memo: '<svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M6 3h12v18H6V3Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 8h6M9 12h6M9 16h3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    page: '<svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M6 3h9l4 4v14H6V3Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 3v5h5M9 13h6M9 17h4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    site: '<svg viewBox="0 0 24 24" fill="none" width="34" height="34"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 9h.01M9 13h.01M9 17h.01" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="10" r="2.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  /* ====== Démarrage ====== */
  (async function () {
    if (API.getToken()) { try { state.me = await API.me(); await enter(); return; } catch (e) { API.setToken(null); } }
    showLogin();
  })();
})();
