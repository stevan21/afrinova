/* ===================================================================
   AFRINOVA — Panneau d'administration (SPA) sur API Django REST
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
  const state = { me: null, members: [], expertises: [], devis: [], reports: [], messages: [] };
  let current = 'dashboard', devisFilter = 'all', chatId = null, editingChef = null;

  /* ====== Toast ====== */
  let toastT;
  function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }

  /* ====== Authentification ====== */
  function showLogin() { appScreen.hidden = true; loginScreen.hidden = false; }
  async function enter() { loginScreen.hidden = true; appScreen.hidden = false; await setView('dashboard'); }

  $('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('loginErr').hidden = true;
    try {
      const res = await API.login($('loginUser').value.trim(), $('loginCode').value);
      API.setToken(res.token);
      if (!res.user.is_staff) { location.replace('expert.html'); return; }
      state.me = res.user; await enter();
    } catch (err) { $('loginErr').textContent = 'Identifiants incorrects.'; $('loginErr').hidden = false; }
  });
  $('logout').addEventListener('click', async () => { await API.logout(); API.setToken(null); state.me = null; showLogin(); });

  /* ====== Navigation SPA ====== */
  const TITLES = { dashboard: 'Tableau de bord', chefs: 'Chefs de projet', expertises: 'Expertises', rapports: 'Rapports', devis: 'Devis', messages: 'Messages' };
  const RENDER = { dashboard: renderDashboard, chefs: renderChefs, expertises: renderExpertises, rapports: renderRapports, devis: renderDevis, messages: renderMessages };

  async function setView(name) {
    current = name;
    titleEl.textContent = TITLES[name];
    document.querySelectorAll('#sideNav button').forEach(b => b.classList.toggle('active', b.dataset.view === name));
    viewEl.innerHTML = '<div class="empty">Chargement…</div>';
    closeSidebar();
    try { await ensureData(name); }
    catch (err) { viewEl.innerHTML = `<div class="panel"><div class="empty">⚠️ ${esc(err.message)}</div></div>`; return; }
    viewEl.innerHTML = RENDER[name]();
    bindView(name);
  }
  async function ensureData(name) {
    if (name === 'dashboard') { const [d, m, r] = await Promise.all([API.get('/devis/'), API.get('/members/'), API.get('/reports/')]); state.devis = d; state.members = m; state.reports = r; }
    else if (name === 'chefs') { const [m, e] = await Promise.all([API.get('/members/'), API.get('/expertises/')]); state.members = m; state.expertises = e; }
    else if (name === 'expertises') state.expertises = await API.get('/expertises/');
    else if (name === 'rapports') state.reports = await API.get('/reports/');
    else if (name === 'devis') state.devis = await API.get('/devis/');
    else if (name === 'messages') { const [m, msg] = await Promise.all([API.get('/members/'), API.get('/messages/')]); state.members = m; state.messages = msg; }
  }
  $('sideNav').addEventListener('click', (e) => { const b = e.target.closest('button[data-view]'); if (b) { editingChef = null; setView(b.dataset.view); } });

  /* ====== Sidebar mobile ====== */
  const sidebar = $('sidebar'), backdrop = $('backdrop');
  const openSidebar = () => { sidebar.classList.add('open'); backdrop.classList.add('show'); };
  const closeSidebar = () => { sidebar.classList.remove('open'); backdrop.classList.remove('show'); };
  $('sideToggle').addEventListener('click', openSidebar);
  backdrop.addEventListener('click', closeSidebar);

  /* ====== Vue : Tableau de bord ====== */
  function renderDashboard() {
    const devis = state.devis, members = state.members, reports = state.reports;
    const nouveaux = devis.filter(d => (d.status || 'nouveau') === 'nouveau').length;
    const traites = devis.filter(d => d.status === 'traité').length;
    const stat = (c, ic, n, l) => `<div class="stat-card"><div class="stat-ic" style="background:${c}">${ic}</div><div><b>${n}</b><span>${l}</span></div></div>`;
    const recent = devis.slice(0, 5);
    return `
      <div class="stats-row">
        ${stat('#1B2A63', IC.doc, devis.length, 'Devis reçus')}
        ${stat('#F47920', IC.bell, nouveaux, 'Nouveaux devis')}
        ${stat('#1AAA5E', IC.check, traites, 'Devis traités')}
        ${stat('#2563C9', IC.users, members.length, 'Chefs de projet')}
      </div>
      <div class="panel">
        <div class="panel-head"><h3>Derniers devis</h3><button class="btn btn-ghost btn-sm" data-go="devis">Tout voir</button></div>
        ${recent.length ? `<div class="table-wrap"><table>
          <thead><tr><th>Date</th><th>Client</th><th>Service</th><th>Statut</th></tr></thead>
          <tbody>${recent.map(d => `<tr><td class="mini">${fmtDate(d.created)}</td>
            <td><span class="cell-strong">${esc(d.name)}</span><br><span class="mini">${esc(d.email || d.phone || '')}</span></td>
            <td>${esc(d.service || '—')}</td><td>${badge(d.status)}</td></tr>`).join('')}</tbody>
        </table></div>` : emptyBox('Aucun devis pour le moment.')}
      </div>`;
  }

  /* ====== Vue : Chefs de projet (membres) ====== */
  function renderChefs() {
    const chefs = state.members;
    const ed = editingChef ? chefs.find(c => c.id === editingChef) : null;
    const POLES = ['Direction', 'BTP', 'Informatique', 'Santé numérique', 'Immigration', 'Échange de devises', 'Location de voitures', 'Multiservices', 'Entretien & Nettoyage', 'Autre'];
    return `
      <div class="panel">
        <div class="panel-head"><h3>${ed ? '✏️ Modifier le chef de projet' : 'Ajouter un chef de projet'}</h3><span class="sub">${ed ? esc(ed.name) : 'Crée aussi son compte de connexion'}</span></div>
        <form id="chefForm">
          <div class="form-row">
            <div class="field"><label>Nom complet *</label><input id="cName" required value="${ed ? esc(ed.name) : ''}" placeholder="Ex. Jean Mbarga" /></div>
            <div class="field"><label>Poste</label><input id="cPoste" value="${ed ? esc(ed.poste || '') : 'Chef de projet'}" placeholder="Chef de projet" /></div>
          </div>
          <div class="form-row">
            ${ed
        ? `<div class="field"><label>Identifiant (login)</label><input value="(inchangé)" disabled /></div>
                 <div class="field"><label>Réinitialiser le mot de passe</label><input id="cPass" placeholder="laisser vide pour ne pas changer" /></div>`
        : `<div class="field"><label>Identifiant (login) *</label><input id="cUser" required placeholder="jean" autocomplete="off" /></div>
                 <div class="field"><label>Mot de passe *</label><input id="cPass" required placeholder="••••••" /></div>`}
          </div>
          <div class="form-row">
            <div class="field"><label>Pôle géré (page service)</label><select id="cExp">
              <option value="">— Aucun pôle —</option>
              ${(state.expertises || []).map(e => `<option value="${e.id}"${ed && ed.expertise === e.id ? ' selected' : ''}>${esc(e.name)}</option>`).join('')}
            </select></div>
            <div class="field"><label>Téléphone</label><input id="cPhone" value="${ed ? esc(ed.phone || '') : ''}" placeholder="+237 6XX XX XX XX" /></div>
          </div>
          <div class="form-row">
            <div class="field"><label>Email</label><input id="cEmail" type="email" value="${ed ? esc(ed.email || '') : ''}" placeholder="nom@afrinova.com" /></div>
            <div class="field"><label>Photo ${ed ? '(remplacer)' : '(optionnelle)'}</label><input id="cPhoto" type="file" accept="image/*" /></div>
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" type="submit">${ed ? '💾 Enregistrer' : '+ Ajouter le chef de projet'}</button>
            ${ed ? '<button class="btn btn-ghost" type="button" id="chefCancel">Annuler</button>' : ''}
          </div>
        </form>
      </div>
      <div class="panel">
        <div class="panel-head"><h3>Équipe (${chefs.length})</h3></div>
        ${chefs.length ? `<div class="chefs-grid">${chefs.map(chefCard).join('')}</div>` : emptyBox('Aucun chef de projet enregistré.')}
      </div>`;
  }
  function chefCard(c) {
    const ava = c.photo ? `<img src="${c.photo}" alt="${esc(c.name)}">` : esc(initials(c.name));
    return `<div class="chef-card">
      <button class="btn-icon chef-edit" data-edit-chef="${c.id}" title="Modifier">${IC.pencil}</button>
      <button class="btn-icon chef-del" data-del-chef="${c.id}" title="Supprimer">${IC.trash}</button>
      <div class="chef-ava" style="background:${avaColor(c.name)}">${ava}</div>
      <h4>${esc(c.name)}</h4>
      <span class="chef-pole">${esc(c.pole || '—')}</span>
      <div class="chef-info">
        ${c.poste ? esc(c.poste) + '<br>' : ''}
        ${c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a><br>` : ''}
        ${c.phone ? `<a href="tel:${esc(c.phone).replace(/\s/g, '')}">${esc(c.phone)}</a>` : ''}
      </div>
    </div>`;
  }

  /* ====== Vue : Expertises ====== */
  function renderExpertises() {
    const exps = state.expertises;
    return `
      <div class="panel">
        <div class="panel-head"><h3>Ajouter une expertise</h3></div>
        <form id="expForm">
          <div class="form-row">
            <div class="field"><label>Nom *</label><input id="eName" required placeholder="Ex. BTP, Informatique…" /></div>
            <div class="field"><label>Couleur</label><input id="eColor" type="color" value="#1B2A63" /></div>
          </div>
          <div class="field"><label>Description</label><textarea id="eDesc" placeholder="Décrivez ce domaine…"></textarea></div>
          <div class="field"><label>Photo (optionnelle)</label><input id="ePhoto" type="file" accept="image/*" /></div>
          <button class="btn btn-primary" type="submit">+ Ajouter l'expertise</button>
        </form>
      </div>
      <div class="panel">
        <div class="panel-head"><h3>Expertises (${exps.length})</h3>
          <a class="btn btn-ghost btn-sm" href="expert.html" target="_blank" rel="noopener">Ouvrir l'Espace Expert ↗</a></div>
        ${exps.length ? `<div class="exp-grid">${exps.map(expCard).join('')}</div>` : emptyBox('Aucune expertise enregistrée.')}
      </div>`;
  }
  function expCard(x) {
    const top = x.photo
      ? `<div class="exp-top has-photo"><img src="${x.photo}" alt="${esc(x.name)}"></div>`
      : `<div class="exp-top" style="background:${x.color || '#1B2A63'}"><span class="exp-ic">${esc(x.name ? x.name.trim()[0].toUpperCase() : '★')}</span></div>`;
    return `<div class="exp-card">
      <button class="btn-icon exp-del" data-del-exp="${x.id}" title="Supprimer">${IC.trash}</button>
      ${top}
      <div class="exp-body"><h4>${esc(x.name)}</h4><p>${esc(x.description || '')}</p></div>
    </div>`;
  }

  /* ====== Vue : Rapports ====== */
  function renderRapports() {
    const reports = state.reports;
    return `
      <div class="panel">
        <div class="panel-head"><h3>Tous les rapports (${reports.length})</h3>
          <div class="toolbar" style="margin:0">
            <input class="search" id="repSearch" type="search" placeholder="Rechercher…" />
            <a class="btn btn-ghost btn-sm" href="expert.html" target="_blank" rel="noopener">Créer dans l'Espace Expert ↗</a>
          </div></div>
        ${reports.length ? `<div class="report-list">${reports.map(reportRow).join('')}</div>` : emptyBox('Aucun rapport pour le moment.')}
      </div>`;
  }
  function reportRow(r) {
    return `<div class="report-card" data-k="${esc(norm(r.title + ' ' + (r.author || '') + ' ' + (r.body || '')))}">
      <div class="report-info">
        <h4>${esc(r.title)}</h4>
        <div class="mini">${r.author ? esc(r.author) + ' · ' : ''}${r.date ? fmtDay(r.date) : fmtDay(r.created)}</div>
        <p class="report-full" id="full-${r.id}" hidden>${nl2br(r.body || '')}</p>
        <p class="report-prev mini" id="prev-${r.id}">${esc(snippet(r.body, 160))}</p>
      </div>
      <div class="report-actions">
        <button class="btn btn-ghost btn-sm" data-viewrep="${r.id}">Voir</button>
        <button class="btn-icon" data-print="${r.id}" title="Imprimer / PDF">${IC.print}</button>
        <button class="btn-icon" data-drep="${r.id}" title="Supprimer">${IC.trash}</button>
      </div>
    </div>`;
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

  /* ====== Vue : Devis ====== */
  function renderDevis() {
    let devis = state.devis;
    if (devisFilter !== 'all') devis = devis.filter(d => (d.status || 'nouveau') === devisFilter);
    return `
      <div class="panel">
        <div class="toolbar">
          <select class="status-select" id="devisFilter">
            <option value="all">Tous les statuts</option><option value="nouveau">Nouveaux</option>
            <option value="en cours">En cours</option><option value="traité">Traités</option>
          </select><span class="grow"></span>
          <button class="btn btn-ghost btn-sm" id="exportCsv">⬇ Exporter CSV</button>
        </div>
        ${devis.length ? `<div class="table-wrap"><table>
          <thead><tr><th>Date</th><th>Client</th><th>Contact</th><th>Service</th><th>Message</th><th>Statut</th><th></th></tr></thead>
          <tbody>${devis.map(devisRow).join('')}</tbody></table></div>` : emptyBox('Aucun devis ' + (devisFilter !== 'all' ? 'avec ce statut.' : 'pour le moment.'))}
      </div>`;
  }
  function devisRow(d) {
    const st = d.status || 'nouveau';
    return `<tr>
      <td class="mini">${fmtDate(d.created)}</td>
      <td class="cell-strong">${esc(d.name)}</td>
      <td class="mini">${d.email ? `<a href="mailto:${esc(d.email)}">${esc(d.email)}</a><br>` : ''}${d.phone ? esc(d.phone) : ''}</td>
      <td>${esc(d.service || '—')}</td>
      <td class="cell-msg">${esc(d.message || '')}</td>
      <td><select class="status-select" data-status="${d.id}">
        ${['nouveau', 'en cours', 'traité'].map(s => `<option value="${s}"${s === st ? ' selected' : ''}>${s}</option>`).join('')}</select></td>
      <td><button class="btn-icon" data-del-devis="${d.id}" title="Supprimer">${IC.trash}</button></td>
    </tr>`;
  }
  function exportCsv() {
    const devis = state.devis;
    if (!devis.length) { toast('Aucun devis à exporter'); return; }
    const cols = ['created', 'name', 'email', 'phone', 'service', 'message', 'status'];
    const head = ['Date', 'Nom', 'Email', 'Téléphone', 'Service', 'Message', 'Statut'];
    const cell = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const rows = devis.map(d => cols.map(c => cell(c === 'created' ? fmtDate(d.created) : d[c])).join(';'));
    const csv = '﻿' + head.join(';') + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'afrinova-devis-' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click(); URL.revokeObjectURL(a.href); toast('Export CSV téléchargé ✓');
  }

  /* ====== Vue : Messages ====== */
  function memberAva(c, s) { const inner = c.photo ? `<img src="${c.photo}" alt="">` : esc(initials(c.name)); return `<span class="m-ava" style="width:${s}px;height:${s}px;background:${avaColor(c.name)}">${inner}</span>`; }
  function renderMessages() {
    const me = state.me;
    const contacts = state.members.filter(c => c.user_id !== me.id);
    if (!contacts.length) {
      return `<div class="panel"><div class="empty">${IC.inbox}<p>Aucun autre membre. Ajoutez des <b>chefs de projet</b>, puis revenez ici.</p></div></div>`;
    }
    const msgs = state.messages;
    const lastOf = (uid) => msgs.filter(m => (m.sender === me.id && m.recipient === uid) || (m.sender === uid && m.recipient === me.id)).slice(-1)[0];
    const unreadOf = (uid) => msgs.filter(m => m.sender === uid && m.recipient === me.id && !m.read).length;
    contacts.sort((a, b) => { const la = lastOf(a.user_id), lb = lastOf(b.user_id); return (lb ? lb.created : '').localeCompare(la ? la.created : ''); });

    const list = contacts.map(c => {
      const last = lastOf(c.user_id), un = unreadOf(c.user_id);
      return `<button class="contact-item${c.user_id === chatId ? ' active' : ''}" data-chat="${c.user_id}">
        ${memberAva(c, 42)}
        <div class="contact-main"><div class="contact-top"><b>${esc(c.name)}</b>${last ? `<span class="mini">${fmtDay(last.created)}</span>` : ''}</div>
          <span class="contact-prev mini">${last ? (last.sender === me.id ? 'Vous : ' : '') + esc(snippet(last.text, 30)) : 'Démarrer la conversation'}</span></div>
        ${un ? `<span class="unread">${un}</span>` : ''}</button>`;
    }).join('');

    let thread;
    const c = contacts.find(x => x.user_id === chatId);
    if (c) {
      const conv = msgs.filter(m => (m.sender === me.id && m.recipient === chatId) || (m.sender === chatId && m.recipient === me.id));
      thread = `<div class="thread-head">${memberAva(c, 38)}<div><b>${esc(c.name)}</b><br><span class="mini">${c.pole ? esc(c.pole) : 'Membre'}</span></div></div>
        <div class="msg-list" id="msgList">${conv.length ? conv.map(m => `<div class="bubble ${m.sender === me.id ? 'sent' : 'recv'}">${nl2br(m.text)}<span class="b-time">${fmtDate(m.created)}</span></div>`).join('') : `<div class="msg-empty mini">Aucun message. Écrivez le premier 👋</div>`}</div>
        <form class="composer" id="msgForm"><input id="msgInput" placeholder="Votre message…" autocomplete="off" /><button class="msg-send" type="submit">➤</button></form>`;
    } else { thread = `<div class="msg-placeholder">${IC.inbox}<p>Sélectionnez un membre à gauche pour discuter.</p></div>`; }

    return `<div class="me-bar"><label>Connecté en tant que :</label> <b style="color:var(--navy)">${esc(me.name)}</b></div>
      <div class="msg-layout"><div class="msg-contacts">${list}</div><div class="msg-thread">${thread}</div></div>`;
  }

  /* ====== Liaisons d'événements ====== */
  function bindView(name) {
    const go = viewEl.querySelector('[data-go]');
    if (go) go.addEventListener('click', () => setView(go.dataset.go));

    if (name === 'chefs') {
      $('chefForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.append('name', $('cName').value.trim());
        fd.append('poste', $('cPoste').value.trim());
        fd.append('expertise', $('cExp').value);
        fd.append('phone', $('cPhone').value.trim());
        fd.append('email', $('cEmail').value.trim());
        if ($('cPhoto').files[0]) fd.append('photo', $('cPhoto').files[0]);
        if ($('cPass') && $('cPass').value) fd.append('password', $('cPass').value);
        try {
          if (editingChef) { await API.putForm('/members/' + editingChef + '/', fd); editingChef = null; toast('Chef de projet mis à jour ✓'); }
          else { fd.append('username', $('cUser').value.trim()); await API.postForm('/members/', fd); toast('Chef de projet ajouté ✓'); }
          await setView('chefs');
        } catch (err) { alert(err.message); }
      });
      const cc = $('chefCancel'); if (cc) cc.addEventListener('click', () => { editingChef = null; setView('chefs'); });
      viewEl.querySelectorAll('[data-edit-chef]').forEach(b => b.addEventListener('click', () => { editingChef = +b.dataset.editChef; setView('chefs'); window.scrollTo({ top: 0, behavior: 'smooth' }); }));
      viewEl.querySelectorAll('[data-del-chef]').forEach(b => b.addEventListener('click', async () => {
        if (!confirm('Supprimer ce chef de projet (et son compte) ?')) return;
        if (editingChef === +b.dataset.delChef) editingChef = null;
        await API.del('/members/' + b.dataset.delChef + '/'); toast('Supprimé'); await setView('chefs');
      }));
    }

    if (name === 'expertises') {
      $('expForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.append('name', $('eName').value.trim());
        fd.append('description', $('eDesc').value.trim());
        fd.append('color', $('eColor').value);
        if ($('ePhoto').files[0]) fd.append('photo', $('ePhoto').files[0]);
        try { await API.postForm('/expertises/', fd); toast('Expertise ajoutée ✓'); await setView('expertises'); }
        catch (err) { alert(err.message); }
      });
      viewEl.querySelectorAll('[data-del-exp]').forEach(b => b.addEventListener('click', async () => {
        if (!confirm('Supprimer cette expertise ?')) return;
        await API.del('/expertises/' + b.dataset.delExp + '/'); toast('Supprimée'); await setView('expertises');
      }));
    }

    if (name === 'rapports') {
      viewEl.querySelectorAll('[data-viewrep]').forEach(b => b.addEventListener('click', () => {
        const id = b.dataset.viewrep, full = $('full-' + id), prev = $('prev-' + id), open = full.hidden;
        full.hidden = !open; if (prev) prev.hidden = open; b.textContent = open ? 'Réduire' : 'Voir';
      }));
      viewEl.querySelectorAll('[data-print]').forEach(b => b.addEventListener('click', () => printReport(+b.dataset.print)));
      viewEl.querySelectorAll('[data-drep]').forEach(b => b.addEventListener('click', async () => {
        if (!confirm('Supprimer ce rapport ?')) return;
        await API.del('/reports/' + b.dataset.drep + '/'); toast('Rapport supprimé'); await setView('rapports');
      }));
      const s = $('repSearch');
      if (s) s.addEventListener('input', () => { const q = norm(s.value); viewEl.querySelectorAll('.report-card').forEach(c => { c.style.display = c.dataset.k.includes(q) ? '' : 'none'; }); });
    }

    if (name === 'devis') {
      const f = $('devisFilter'); f.value = devisFilter;
      f.addEventListener('change', () => { devisFilter = f.value; setView('devis'); });
      viewEl.querySelectorAll('[data-status]').forEach(sel => sel.addEventListener('change', async () => {
        await API.patch('/devis/' + sel.dataset.status + '/', { status: sel.value }); toast('Statut mis à jour'); await setView('devis');
      }));
      viewEl.querySelectorAll('[data-del-devis]').forEach(b => b.addEventListener('click', async () => {
        if (!confirm('Supprimer ce devis ?')) return;
        await API.del('/devis/' + b.dataset.delDevis + '/'); toast('Devis supprimé'); await setView('devis');
      }));
      $('exportCsv').addEventListener('click', exportCsv);
    }

    if (name === 'messages') {
      viewEl.querySelectorAll('[data-chat]').forEach(b => b.addEventListener('click', async () => {
        chatId = +b.dataset.chat;
        try { await API.post('/messages/mark_read/', { contact: chatId }); } catch (e) {}
        await setView('messages');
      }));
      const form = $('msgForm');
      if (form) form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const txt = $('msgInput').value.trim(); if (!txt) return;
        await API.post('/messages/', { recipient: chatId, text: txt });
        await setView('messages');
      });
      const ml = $('msgList'); if (ml) ml.scrollTop = ml.scrollHeight;
    }
  }

  /* ====== Utilitaires UI ====== */
  function badge(st) { st = st || 'nouveau'; const map = { 'nouveau': ['b-nouveau', 'Nouveau'], 'en cours': ['b-encours', 'En cours'], 'traité': ['b-traite', 'Traité'] }; const [cls, lbl] = map[st] || map['nouveau']; return `<span class="badge ${cls}">${lbl}</span>`; }
  function emptyBox(msg) { return `<div class="empty">${IC.inbox}<p>${esc(msg)}</p></div>`; }

  const IC = {
    doc: '<svg viewBox="0 0 24 24" fill="none"><path d="M7 3h7l4 4v14H7V3Z" stroke="#fff" stroke-width="1.7" stroke-linejoin="round"/><path d="M13 3v5h5" stroke="#fff" stroke-width="1.7"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" stroke="#fff" stroke-width="1.7" stroke-linejoin="round"/><path d="M10 19a2 2 0 0 0 4 0" stroke="#fff" stroke-width="1.7"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4 4 10-10" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3" stroke="#fff" stroke-width="1.7"/><path d="M4 19c.6-3 2.6-4.5 5-4.5S13.4 16 14 19M16 6a2.6 2.6 0 0 1 0 5" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    pencil: '<svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M4 20h4L18.5 9.5a2 2 0 0 0 0-2.9l-1.1-1.1a2 2 0 0 0-2.9 0L4 16v4Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M13.4 6.6l4 4" stroke="currentColor" stroke-width="1.7"/></svg>',
    print: '<svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M6 9V3h12v6M6 18H4v-7h16v7h-2M8 14h8v7H8v-7Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    inbox: '<svg viewBox="0 0 24 24" fill="none"><path d="M3 13l3-8h12l3 8v6H3v-6Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M3 13h5l1.5 2.5h5L16 13h5" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>'
  };

  /* ====== Démarrage ====== */
  (async function () {
    if (API.getToken()) {
      try { const u = await API.me(); if (u.is_staff) { state.me = u; await enter(); return; } else { location.replace('expert.html'); return; } } catch (e) {}
      API.setToken(null);
    }
    showLogin();
  })();
})();
