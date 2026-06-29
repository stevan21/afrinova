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

  const loginScreen = $('login'), appScreen = $('app'), viewEl = $('view'), titleEl = $('viewTitle');
  const state = { me: null, expertises: [], notes: [], reports: [], members: [], messages: [] };
  let editingExp = null, pendingFile = null, pendingURL = '', editNote = null, editReport = null, chatId = null;

  /* ====== Toast ====== */
  let toastT;
  function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }

  /* ====== Auth ====== */
  function showLogin() { appScreen.hidden = true; loginScreen.hidden = false; }
  async function enter() { loginScreen.hidden = true; appScreen.hidden = false; await setView('dashboard'); }
  $('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault(); $('loginErr').hidden = true;
    try { const res = await API.login($('loginUser').value.trim(), $('loginCode').value); API.setToken(res.token); state.me = res.user; await enter(); }
    catch (err) { $('loginErr').hidden = false; }
  });
  $('logout').addEventListener('click', async () => { await API.logout(); API.setToken(null); state.me = null; showLogin(); });

  /* ====== Navigation SPA ====== */
  const TITLES = { dashboard: 'Tableau de bord', expertises: 'Expertises', notes: 'Notes', rapports: 'Rapports', messages: 'Messages' };
  const ACTIVE = { ajouter: 'expertises' };
  const RENDER = { dashboard: renderDashboard, expertises: renderExpertises, ajouter: renderAjouter, notes: renderNotes, rapports: renderRapports, messages: renderMessages };

  async function setView(name) {
    titleEl.textContent = name === 'ajouter' ? (editingExp ? "Modifier l'expertise" : 'Ajouter une expertise') : TITLES[name];
    const act = ACTIVE[name] || name;
    document.querySelectorAll('#sideNav button').forEach(b => b.classList.toggle('active', b.dataset.view === act));
    viewEl.innerHTML = '<div class="empty">Chargement…</div>';
    closeSidebar();
    try { await ensureData(name); }
    catch (err) { viewEl.innerHTML = `<div class="panel"><div class="empty">⚠️ ${esc(err.message)}</div></div>`; return; }
    viewEl.innerHTML = RENDER[name]();
    bindView(name);
  }
  async function ensureData(name) {
    if (name === 'dashboard') { const [e, n, r] = await Promise.all([API.get('/expertises/'), API.get('/notes/'), API.get('/reports/')]); state.expertises = e; state.notes = n; state.reports = r; }
    else if (name === 'expertises' || name === 'ajouter') state.expertises = await API.get('/expertises/');
    else if (name === 'notes') state.notes = await API.get('/notes/');
    else if (name === 'rapports') state.reports = await API.get('/reports/');
    else if (name === 'messages') { const [m, msg] = await Promise.all([API.get('/members/'), API.get('/messages/')]); state.members = m; state.messages = msg; }
  }
  $('sideNav').addEventListener('click', (e) => { const b = e.target.closest('button[data-view]'); if (b) setView(b.dataset.view); });

  /* ====== Sidebar mobile ====== */
  const sidebar = $('sidebar'), backdrop = $('backdrop');
  const openSidebar = () => { sidebar.classList.add('open'); backdrop.classList.add('show'); };
  const closeSidebar = () => { sidebar.classList.remove('open'); backdrop.classList.remove('show'); };
  $('sideToggle').addEventListener('click', openSidebar);
  backdrop.addEventListener('click', closeSidebar);

  /* ====== Expertises ====== */
  function expTop(x) {
    if (x.photo) return `<div class="exp-top has-photo"><img src="${x.photo}" alt="${esc(x.name)}"></div>`;
    return `<div class="exp-top" style="background:${x.color || '#1B2A63'}"><span class="exp-ic">${esc(x.name ? x.name.trim()[0].toUpperCase() : '★')}</span></div>`;
  }
  function expCard(x, ro) {
    const actions = ro ? '' : `<div class="exp-actions"><button class="btn-icon edit" data-edit="${x.id}" title="Modifier">${IC.pencil}</button><button class="btn-icon" data-del="${x.id}" title="Supprimer">${IC.trash}</button></div>`;
    return `<div class="exp-card${x.id === editingExp ? ' editing' : ''}" data-k="${esc(norm(x.name + ' ' + (x.description || '')))}">${actions}${expTop(x)}<div class="exp-body"><h4>${esc(x.name)}</h4><p>${esc(x.description || '')}</p></div></div>`;
  }
  function renderDashboard() {
    const e = state.expertises, n = state.notes, r = state.reports;
    const stat = (c, ic, num, l, go) => `<div class="stat-card" ${go ? `data-go="${go}" style="cursor:pointer"` : ''}><div class="stat-ic" style="background:${c}">${ic}</div><div><b>${num}</b><span>${l}</span></div></div>`;
    return `
      <div class="stats-row" style="grid-template-columns:repeat(3,1fr);max-width:820px">
        ${stat('#1B2A63', IC.star, e.length, 'Expertises', 'expertises')}
        ${stat('#F47920', IC.note, n.length, 'Notes', 'notes')}
        ${stat('#2563C9', IC.report, r.length, 'Rapports', 'rapports')}
      </div>
      <div class="panel"><div class="panel-head"><h3>Aperçu des expertises</h3><button class="btn btn-primary btn-sm" data-go="ajouter">+ Ajouter</button></div>
        ${e.length ? `<div class="exp-grid">${e.slice(0, 6).map(x => expCard(x, true)).join('')}</div>` : `<div class="empty">${IC.inbox}<p>Aucune expertise. Cliquez sur « Ajouter ».</p></div>`}</div>`;
  }
  function renderExpertises() {
    const e = state.expertises;
    return `<div class="panel"><div class="panel-head"><h3>Liste des expertises (${e.length})</h3>
        <div class="form-actions"><input class="search" id="expSearch" type="search" placeholder="Rechercher…" /><button class="btn btn-primary btn-sm" data-go="ajouter">+ Ajouter</button></div></div>
      ${e.length ? `<div class="exp-grid">${e.map(x => expCard(x, false)).join('')}</div>` : `<div class="empty">${IC.inbox}<p>Aucune expertise. Ajoutez la première.</p></div>`}</div>`;
  }
  function renderAjouter() {
    const ed = editingExp ? state.expertises.find(x => x.id === editingExp) : null;
    pendingFile = null; pendingURL = ed ? (ed.photo || '') : '';
    return `<div class="panel" style="max-width:760px">
        <div class="panel-head"><h3>${ed ? "✏️ Modifier l'expertise" : '➕ Ajouter une expertise'}</h3>${ed ? '<span class="sub">' + esc(ed.name) + '</span>' : ''}</div>
        <form id="expForm">
          <div class="form-row">
            <div class="field"><label>Nom *</label><input id="eName" required value="${ed ? esc(ed.name) : ''}" placeholder="Ex. BTP…" /></div>
            <div class="field"><label>Couleur (fond par défaut)</label><input id="eColor" type="color" value="${ed ? (ed.color || '#1B2A63') : '#1B2A63'}" /></div>
          </div>
          <div class="field"><label>Description</label><textarea id="eDesc" placeholder="Décrivez ce domaine…">${ed ? esc(ed.description || '') : ''}</textarea></div>
          <div class="field"><label>Photo de l'expertise</label>
            <div class="photo-row"><div class="photo-preview" id="ePreview"></div>
              <div class="photo-controls"><input id="ePhoto" type="file" accept="image/*" /></div></div>
          </div>
          <div class="form-actions"><button class="btn btn-primary" type="submit">${ed ? '💾 Enregistrer' : "+ Ajouter l'expertise"}</button>
            <button class="btn btn-ghost" type="button" id="cancelEdit">Annuler</button></div>
        </form></div>`;
  }
  function renderPreview() {
    const p = $('ePreview'); if (!p) return;
    if (pendingURL) { p.innerHTML = `<img src="${pendingURL}" alt="">`; p.style.background = ''; }
    else { p.innerHTML = '<span>Aucune photo</span>'; p.style.background = ($('eColor') ? $('eColor').value : '#1B2A63'); }
  }

  /* ====== Notes ====== */
  function renderNotes() {
    const notes = state.notes;
    const ed = editNote ? notes.find(n => n.id === editNote) : null;
    return `<div class="panel" style="max-width:760px"><div class="panel-head"><h3>${ed ? '✏️ Modifier la note' : '📝 Nouvelle note'}</h3></div>
        <form id="noteForm"><div class="field"><label>Titre *</label><input id="nTitle" required value="${ed ? esc(ed.title) : ''}" placeholder="Titre" /></div>
          <div class="field"><label>Contenu</label><textarea id="nBody" rows="5" placeholder="Écrivez votre note…">${ed ? esc(ed.body || '') : ''}</textarea></div>
          <div class="form-actions"><button class="btn btn-primary" type="submit">${ed ? '💾 Enregistrer' : '+ Ajouter la note'}</button>${ed ? '<button class="btn btn-ghost" type="button" id="noteCancel">Annuler</button>' : ''}</div></form></div>
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
    return `<div class="panel" style="max-width:820px"><div class="panel-head"><h3>${ed ? '✏️ Modifier le rapport' : '📄 Nouveau rapport'}</h3></div>
        <form id="repForm">
          <div class="form-row"><div class="field"><label>Titre *</label><input id="rTitle" required value="${ed ? esc(ed.title) : ''}" placeholder="Ex. Rapport de chantier" /></div>
            <div class="field"><label>Auteur</label><input id="rAuthor" value="${ed ? esc(ed.author || '') : esc(state.me ? state.me.name : '')}" placeholder="Votre nom" /></div></div>
          <div class="form-row"><div class="field"><label>Date</label><input id="rDate" type="date" value="${ed ? (ed.date || today) : today}" /></div><div class="field"></div></div>
          <div class="field"><label>Contenu</label><textarea id="rBody" rows="8" placeholder="Rédigez le rapport…">${ed ? esc(ed.body || '') : ''}</textarea></div>
          <div class="form-actions"><button class="btn btn-primary" type="submit">${ed ? '💾 Enregistrer' : '+ Créer le rapport'}</button>${ed ? '<button class="btn btn-ghost" type="button" id="repCancel">Annuler</button>' : ''}</div></form></div>
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
        <div class="msg-list" id="msgList">${conv.length ? conv.map(m => `<div class="bubble ${m.sender === me.id ? 'sent' : 'recv'}">${nl2br(m.text)}<span class="b-time">${fmtDate(m.created)}</span></div>`).join('') : `<div class="msg-empty mini">Aucun message. Écrivez le premier 👋</div>`}</div>
        <form class="composer" id="msgForm"><input id="msgInput" placeholder="Votre message…" autocomplete="off" /><button class="msg-send" type="submit">➤</button></form>`;
    } else thread = `<div class="msg-placeholder">${IC.inbox}<p>Sélectionnez un membre à gauche pour discuter.</p></div>`;
    return `<div class="me-bar"><label>Connecté en tant que :</label> <b style="color:var(--navy)">${esc(me.name)}</b></div>
      <div class="msg-layout"><div class="msg-contacts">${list}</div><div class="msg-thread">${thread}</div></div>`;
  }

  /* ====== Événements ====== */
  function bindView(name) {
    viewEl.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => { if (b.dataset.go === 'ajouter') editingExp = null; setView(b.dataset.go); }));

    if (name === 'ajouter') {
      renderPreview();
      $('eColor').addEventListener('input', () => { if (!pendingURL) renderPreview(); });
      $('ePhoto').addEventListener('change', (e) => { const f = e.target.files[0]; if (!f) return; pendingFile = f; pendingURL = URL.createObjectURL(f); renderPreview(); });
      $('expForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nm = $('eName').value.trim(); if (!nm) return;
        const fd = new FormData();
        fd.append('name', nm); fd.append('description', $('eDesc').value.trim()); fd.append('color', $('eColor').value);
        if (pendingFile) fd.append('photo', pendingFile);
        try {
          if (editingExp) { await API.patchForm('/expertises/' + editingExp + '/', fd); editingExp = null; toast('Expertise mise à jour ✓'); }
          else { await API.postForm('/expertises/', fd); toast('Expertise ajoutée ✓'); }
          await setView('expertises');
        } catch (err) { alert(err.message); }
      });
      $('cancelEdit').addEventListener('click', () => { editingExp = null; setView('expertises'); });
    }

    if (name === 'expertises') {
      viewEl.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => { editingExp = +b.dataset.edit; setView('ajouter'); }));
      viewEl.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
        if (!confirm('Supprimer cette expertise ?')) return;
        await API.del('/expertises/' + b.dataset.del + '/'); toast('Supprimée'); await setView('expertises');
      }));
      filterCards('expSearch', '.exp-card');
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
    inbox: '<svg viewBox="0 0 24 24" fill="none"><path d="M3 13l3-8h12l3 8v6H3v-6Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M3 13h5l1.5 2.5h5L16 13h5" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>'
  };

  /* ====== Démarrage ====== */
  (async function () {
    if (API.getToken()) { try { state.me = await API.me(); await enter(); return; } catch (e) { API.setToken(null); } }
    showLogin();
  })();
})();
