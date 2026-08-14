/* ===================================================================
   AFRINOVA — Page « Location de véhicules »
   Catalogue depuis l'API. Le client clique « Réserver », remplit un
   court formulaire : la demande part sur WhatsApp et une trace est
   enregistrée dans l'espace admin.
   =================================================================== */
(function () {
  'use strict';
  const API = window.AfrinovaAPI;
  const WHATSAPP = '237659232292';                       // numéro destinataire des demandes
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fcfa = (n) => Number(n).toLocaleString('fr-FR') + ' FCFA';

  /* Dates : « AAAA-MM-JJ » lu et écrit dans le fuseau du visiteur.
     new Date('2026-08-09') serait interprété en UTC et décalerait le jour. */
  const lireDate = (s) => {
    const p = String(s || '').split('-').map(Number);
    return p.length === 3 && !p.some(isNaN) ? new Date(p[0], p[1] - 1, p[2]) : null;
  };
  const iso = (d) => {
    const n = (x) => String(x).padStart(2, '0');
    return d.getFullYear() + '-' + n(d.getMonth() + 1) + '-' + n(d.getDate());
  };
  const jour = (s) => { const d = lireDate(s); return d ? d.toLocaleDateString('fr-FR') : s; };

  // Illustration affichée tant qu'un véhicule n'a pas sa propre photo
  const PHOTO_DEFAUT = (document.body.dataset.imgDefaut || '');

  // Recherche insensible à la casse et aux accents (« prado » trouve « Prado »)
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  const grid = $('locGrid');
  const ZONES = { ville: 'en ville', hors_ville: 'hors ville' };
  const prixZone = (v, z) => (z === 'hors_ville' ? v.price_hors_ville : v.price_ville) || 0;

  let vehicules = [];
  let zone = 'ville';                                    // tarif mis en avant sur les cartes
  let recherche = '';                                    // texte saisi dans la barre
  let selected = null;                                   // véhicule en cours de réservation

  /* ---------------- Chargement du parc ---------------- */
  async function load() {
    try {
      vehicules = await API.get('/vehicules/');
    } catch (e) {
      grid.innerHTML = '<p class="loc-empty">Le parc est momentanément indisponible. ' +
        'Appelez-nous au <a href="tel:+237659232292">+237 659 23 22 92</a>.</p>';
      return;
    }
    if (!Array.isArray(vehicules)) vehicules = [];
    render();
  }

  /* ---------------- Rendu des cartes ---------------- */
  /* Photos et vidéos partagent la même visionneuse : une seule liste, chaque
     entrée porte son type pour que l'affichage choisisse <img> ou <video>. */
  function mediasOf(v) {
    const list = [];
    if (v.photo) list.push({ type: 'photo', src: v.photo });
    (v.photos || []).forEach((p) => { if (p.image) list.push({ type: 'photo', src: p.image }); });
    (v.videos || []).forEach((w) => {
      if (w.video) list.push({ type: 'video', src: w.video, poster: w.poster || '' });
    });
    return list;
  }

  function card(v) {
    const medias = mediasOf(v);
    const cover = medias[0];
    let media;
    if (!cover) {
      media = `<img class="is-placeholder" src="${esc(PHOTO_DEFAUT)}" alt="${esc(v.name)}" loading="lazy">`;
    } else if (cover.type === 'video') {
      // Vidéo en couverture : on montre sa vignette, la lecture se fait dans la visionneuse
      media = cover.poster
        ? `<img src="${esc(cover.poster)}" alt="${esc(v.name)}" loading="lazy">`
        : `<video src="${esc(cover.src)}" preload="metadata" muted playsinline></video>`;
    } else {
      media = `<img src="${esc(cover.src)}" alt="${esc(v.name)}" loading="lazy">`;
    }

    let thumbs = '';
    if (medias.length > 1) {
      const vignette = (m) => (m.type === 'video'
        ? (m.poster ? `<img src="${esc(m.poster)}" alt="" loading="lazy">`
                    : `<video src="${esc(m.src)}" preload="metadata" muted></video>`) +
          '<span class="loc-thumb-play" aria-hidden="true">▶</span>'
        : `<img src="${esc(m.src)}" alt="" loading="lazy">`);
      const extra = medias.slice(1, 4).map((m, i) =>
        `<button class="loc-thumb" data-veh="${v.id}" data-i="${i + 1}"
           aria-label="${m.type === 'video' ? 'Vidéo' : 'Photo'} ${i + 2}">
           ${vignette(m)}</button>`).join('');
      const more = medias.length > 4
        ? `<button class="loc-thumb loc-thumb-more" data-veh="${v.id}" data-i="4"
             aria-label="Voir les ${medias.length} médias">+${medias.length - 4}</button>`
        : '';
      thumbs = `<div class="loc-thumbs">${extra}${more}</div>`;
    }

    const nbVideos = (v.videos || []).length;
    const badgeVideo = nbVideos
      ? `<span class="loc-badge-video">▶ ${nbVideos} vidéo${nbVideos > 1 ? 's' : ''}</span>` : '';
    const dispo = v.available !== false;

    // Tarif de la zone choisie en avant, l'autre rappelé en dessous
    const autre = zone === 'ville' ? 'hors_ville' : 'ville';
    const prix = prixZone(v, zone), prixAutre = prixZone(v, autre);
    const priceBlock = `<div class="loc-prices">
        <p class="loc-price-main">
          <strong>${prix ? fcfa(prix) : 'Sur demande'}</strong>
          <span>${prix ? '/jour ' + ZONES[zone] : ZONES[zone]}</span>
        </p>
        ${prixAutre ? `<p class="loc-price-alt">${ZONES[autre].replace(/^./, (c) => c.toUpperCase())} :
             ${fcfa(prixAutre)} /jour</p>` : ''}
        ${v.remise ? `<p class="loc-remise">${esc(v.remise)}</p>` : ''}
      </div>`;

    // Condition rappelée sur chaque véhicule : elle vaut pour tout le parc,
    // le client la voit sans avoir à ouvrir la fiche de réservation.
    const charges = `<p class="loc-charges">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" />
          <path d="M12 8h.01M12 11v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
        <span>Le carburant et les péages sont à la charge du client.</span>
      </p>`;

    // Ligne « 2021 · Douala » sous le nom, chaque partie facultative
    const meta = [v.year, v.ville].filter(Boolean).map(esc).join(' · ');

    return `<article class="loc-card${dispo ? '' : ' is-indispo'}">
      <div class="loc-card-media" data-veh="${v.id}" data-i="0">
        ${media}
        ${thumbs}
        <span class="loc-statut ${dispo ? 'is-dispo' : 'is-loue'}">${dispo ? 'Disponible' : 'Indisponible'}</span>
        ${badgeVideo}
        <span class="loc-pill">Avec ou sans chauffeur</span>
      </div>
      <div class="loc-card-body">
        <h3>${esc(v.name)}</h3>
        ${meta ? `<p class="loc-year">${meta}</p>` : ''}
        ${priceBlock}
        ${charges}
        ${dispo
          ? `<button class="btn btn-primary" data-reserve="${v.id}">Réserver</button>`
          : `<button class="btn btn-ghost" data-reserve="${v.id}">Demander une date</button>`}
      </div>
    </article>`;
  }

  // On cherche dans le nom, l'année, la ville et la description : « automatique »,
  // « Douala » ou « 7 places » ramènent le bon véhicule sans connaître son modèle.
  function correspond(v, q) {
    return norm([v.name, v.year, v.ville, v.description].join(' ')).includes(q);
  }

  function render() {
    if (!vehicules.length) {
      grid.innerHTML = '<p class="loc-empty">Aucun véhicule disponible pour le moment.</p>';
      return;
    }
    const q = norm(recherche).trim();
    const list = q ? vehicules.filter((v) => correspond(v, q)) : vehicules;
    grid.innerHTML = list.length
      ? list.map(card).join('')
      : `<p class="loc-empty">Aucun véhicule ne correspond à «&nbsp;${esc(recherche.trim())}&nbsp;».<br>
           <button type="button" class="loc-reset" id="locReset">Voir tout le parc</button></p>`;
  }

  /* ---------------- Recherche ---------------- */
  // Le parc tient en mémoire : filtrage immédiat, aucun appel réseau.
  $('locSearch').addEventListener('input', (e) => {
    recherche = e.target.value;
    render();
  });

  /* ---------------- Bascule du tarif affiché ---------------- */
  $('locFilters').addEventListener('click', (e) => {
    const b = e.target.closest('.loc-filter');
    if (!b) return;
    document.querySelectorAll('.loc-filter').forEach((x) => x.classList.remove('is-active'));
    b.classList.add('is-active');
    zone = b.dataset.f;
    render();
  });

  /* ---------------- Visionneuse ---------------- */
  const lb = $('locLightbox');
  let lbMedias = [], lbIdx = 0;

  function openLb(vehId, start) {
    const v = vehicules.find((x) => String(x.id) === String(vehId));
    if (!v) return;
    lbMedias = mediasOf(v);
    if (!lbMedias.length) return;
    lbIdx = Math.min(start || 0, lbMedias.length - 1);
    showLb();
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function showLb() {
    const m = lbMedias[lbIdx];
    const img = $('lbImg'), vid = $('lbVideo');
    vid.pause();                                         // la vidéo quittée ne joue pas en fond
    if (m.type === 'video') {
      vid.src = m.src;
      vid.poster = m.poster || '';
      vid.hidden = false;
      img.hidden = true;
      img.removeAttribute('src');
    } else {
      vid.removeAttribute('src');
      vid.load();
      vid.hidden = true;
      img.src = m.src;
      img.hidden = false;
    }
    $('lbCount').textContent = `${lbIdx + 1} / ${lbMedias.length}`;
    const multi = lbMedias.length > 1;
    $('lbPrev').style.display = multi ? '' : 'none';
    $('lbNext').style.display = multi ? '' : 'none';
  }
  function closeLb() {
    $('lbVideo').pause();
    lb.hidden = true;
    document.body.style.overflow = '';
  }
  function step(d) { lbIdx = (lbIdx + d + lbMedias.length) % lbMedias.length; showLb(); }

  $('lbClose').addEventListener('click', closeLb);
  $('lbPrev').addEventListener('click', () => step(-1));
  $('lbNext').addEventListener('click', () => step(1));
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });

  /* ---------------- Fenêtre de réservation ---------------- */
  const modal = $('resaModal');
  const note = $('resaNote');

  /* Coordonnées mémorisées d'une réservation à l'autre */
  const MEMO = 'afrinova_client';
  const memoLire = () => { try { return JSON.parse(localStorage.getItem(MEMO)) || {}; } catch (e) { return {}; } };
  const memoEcrire = (o) => { try { localStorage.setItem(MEMO, JSON.stringify(o)); } catch (e) {} };

  /* --- Durée de la location --- */
  function nbJours() {
    const a = lireDate($('rDebut').value), b = lireDate($('rFin').value);
    if (!a || !b) return 0;
    const ms = b - a;
    if (ms < 0) return 0;
    return Math.max(1, Math.round(ms / 86400000));
  }
  /* Rappel des conditions : la remise se négocie, aucun total n'est annoncé ici. */
  function majRecap() {
    const jours = nbJours();
    const recap = $('resaRecap');
    if (!jours || !selected) { recap.hidden = true; return; }
    const z = zoneChoisie();
    const prix = prixZone(selected, z);
    $('recapDuree').textContent = jours + (jours > 1 ? ' jours' : ' jour');
    $('recapZone').textContent = 'Tarif ' + ZONES[z];
    $('recapTarif').textContent = prix ? fcfa(prix) + ' / jour' : 'sur demande';
    $('recapRemise').textContent = selected.remise || '';
    $('recapRemise').hidden = !(jours > 1 && selected.remise);
    recap.hidden = false;
  }

  /* --- Erreurs par champ --- */
  function erreur(id, msg) {
    const el = $(id);
    el.textContent = msg || '';
    el.hidden = !msg;
  }
  function viderErreurs() {
    ['errDates', 'errName', 'errPhone'].forEach((i) => erreur(i, ''));
    note.textContent = ''; note.className = 'loc-form-note';
  }

  // Fermeture différée après un envoi : annulée si le client rouvre une fiche entre-temps
  let finTimer = null;

  function openModal(vehId) {
    selected = vehicules.find((x) => String(x.id) === String(vehId)) || null;
    if (!selected) return;

    if (finTimer) { clearTimeout(finTimer); finTimer = null; $('resaSubmit').disabled = false; }

    // Vignette : la première photo, ou l'affiche d'une vidéo, sinon l'illustration
    const premier = mediasOf(selected).find((m) => m.type === 'photo' || m.poster);
    $('resaThumb').src = premier ? (premier.type === 'photo' ? premier.src : premier.poster) : PHOTO_DEFAUT;
    $('resaThumb').alt = selected.name;
    $('resaTitle').textContent = selected.name;
    const prixVille = prixZone(selected, 'ville');
    $('resaVeh').textContent = [
      selected.year,
      selected.ville,
      prixVille ? fcfa(prixVille) + ' / jour en ville' : 'Tarif sur demande',
      selected.available === false ? 'Actuellement loué' : '',
    ].filter(Boolean).join(' · ');

    // La description ne tient pas sur la carte compacte : on la rappelle ici
    const desc = $('resaDesc');
    desc.textContent = selected.description || '';
    desc.hidden = !selected.description;

    // Le trajet part sur le tarif que le client consultait dans la liste
    activer($('segZone'), zone);

    // Coordonnées déjà connues
    const memo = memoLire();
    if (memo.nom && !$('rName').value) $('rName').value = memo.nom;
    if (memo.tel && !$('rPhone').value) $('rPhone').value = memo.tel;

    viderErreurs();
    majRecap();
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('rDebut').focus(), 50);
  }
  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
  }
  $('resaClose').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (!lb.hidden) closeLb(); else if (!modal.hidden) closeModal(); }
    if (lb.hidden) return;
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });

  /* ---------------- Clics dans la grille ---------------- */
  grid.addEventListener('click', (e) => {
    // « Voir tout le parc » : affiché quand la recherche ne donne rien
    if (e.target.closest('#locReset')) {
      $('locSearch').value = '';
      recherche = '';
      render();
      $('locSearch').focus();
      return;
    }

    const thumb = e.target.closest('.loc-thumb');
    if (thumb) { openLb(thumb.dataset.veh, Number(thumb.dataset.i)); return; }

    const media = e.target.closest('.loc-card-media');
    if (media) { openLb(media.dataset.veh, 0); return; }

    const btn = e.target.closest('[data-reserve]');
    if (btn) openModal(btn.dataset.reserve);
  });

  /* ---------------- Dates, raccourcis, trajet et chauffeur ---------------- */
  // On ne peut pas réserver dans le passé
  const today = iso(new Date());
  $('rDebut').min = today;
  $('rFin').min = today;

  // Le raccourci choisi ne vaut plus dès que le client règle une date à la main
  const oublierRaccourci = () =>
    $('resaQuick').querySelectorAll('button').forEach((x) => x.classList.remove('is-on'));

  $('rDebut').addEventListener('change', () => {
    $('rFin').min = $('rDebut').value || today;
    // Le retour ne peut pas précéder le départ : on le recale plutôt que de râler
    if ($('rFin').value && $('rFin').value < $('rDebut').value) $('rFin').value = $('rDebut').value;
    oublierRaccourci();
    erreur('errDates', '');
    majRecap();
  });
  $('rFin').addEventListener('change', () => { oublierRaccourci(); erreur('errDates', ''); majRecap(); });

  // Raccourcis de durée : départ aujourd'hui si rien n'est saisi
  $('resaQuick').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-days]');
    if (!b) return;
    const debut = $('rDebut').value || today;
    const fin = lireDate(debut);
    fin.setDate(fin.getDate() + Number(b.dataset.days));
    $('rDebut').value = debut;
    $('rFin').min = debut;
    $('rFin').value = iso(fin);
    oublierRaccourci();
    b.classList.add('is-on');
    erreur('errDates', '');
    majRecap();
  });

  /* Sélecteurs segmentés (trajet, chauffeur) : un seul bouton actif à la fois */
  const activer = (seg, valeur) =>
    seg.querySelectorAll('button').forEach((x) => x.classList.toggle('is-on', x.dataset.v === valeur));
  const valeurDe = (seg) => {
    const on = seg.querySelector('button.is-on');
    return on ? on.dataset.v : '';
  };
  [$('segZone'), $('segChauffeur')].forEach((seg) => {
    seg.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      activer(seg, b.dataset.v);
      majRecap();                                        // le trajet change le tarif rappelé
    });
  });
  const zoneChoisie = () => valeurDe($('segZone')) || 'ville';
  const avecChauffeur = () => valeurDe($('segChauffeur')) === '1';

  // Téléphone : on ne garde que les chiffres, le +237 est affiché en préfixe
  $('rPhone').addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.startsWith('237')) v = v.slice(3);
    e.target.value = v.slice(0, 12);
    erreur('errPhone', '');
  });
  $('rName').addEventListener('input', () => erreur('errName', ''));

  function messageWhatsApp(d) {
    const lignes = [
      'Bonjour AFRINOVA, je souhaite réserver un véhicule.',
      '',
      'Véhicule : ' + d.vehicule + (d.ville ? ' (' + d.ville + ')' : ''),
      'Du ' + jour(d.debut) + ' au ' + jour(d.fin) + ' (' + d.jours + (d.jours > 1 ? ' jours' : ' jour') + ')',
      'Trajet : ' + ZONES[d.zone],
      'Chauffeur : ' + (d.chauffeur ? 'oui' : 'non'),
      'Nom : ' + d.nom,
      'Téléphone : ' + d.tel,
    ];
    if (d.tarif) lignes.push('Tarif affiché : ' + fcfa(d.tarif) + ' / jour');
    if (d.jours > 1 && d.remise) lignes.push('Remise annoncée : ' + d.remise);
    if (d.message) lignes.push('Précisions : ' + d.message);
    lignes.push('', 'Noté : le carburant et les péages sont à ma charge.');
    return lignes.join('\n');
  }

  $('resaForm').addEventListener('submit', (e) => {
    e.preventDefault();
    viderErreurs();

    const debut = $('rDebut').value, fin = $('rFin').value;
    const nom = $('rName').value.trim();
    const telLocal = $('rPhone').value.replace(/\D/g, '');
    let premier = null;                                  // premier champ en faute, pour y amener le curseur

    if (!debut || !fin) { erreur('errDates', 'Indiquez vos dates de départ et de retour.'); premier = premier || $('rDebut'); }
    else if (fin < debut) { erreur('errDates', 'Le retour doit suivre le départ.'); premier = premier || $('rFin'); }
    if (!nom) { erreur('errName', 'Indiquez votre nom.'); premier = premier || $('rName'); }
    if (telLocal.length < 8) { erreur('errPhone', 'Numéro incomplet (8 chiffres minimum).'); premier = premier || $('rPhone'); }

    if (premier) { premier.focus(); return; }

    const tel = '+237 ' + telLocal;
    const chauffeur = avecChauffeur();
    const zoneResa = zoneChoisie();
    const msg = $('rMessage').value.trim();
    const jours = nbJours();
    const texte = messageWhatsApp({
      vehicule: selected ? selected.name + (selected.year ? ' (' + selected.year + ')' : '') : 'à conseiller',
      ville: selected ? selected.ville : '',
      debut, fin, jours, zone: zoneResa, chauffeur, nom, tel, message: msg,
      tarif: selected ? prixZone(selected, zoneResa) : 0,
      remise: selected ? selected.remise : '',
    });
    const url = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(texte);

    memoEcrire({ nom: nom, tel: telLocal });             // pré-remplissage la prochaine fois

    // Ouverture synchrone : sinon le bloqueur de fenêtres surgissantes l'empêche.
    const win = window.open(url, '_blank');

    // Trace côté admin — en arrière-plan, sans bloquer le client.
    API.post('/reservations/', {
      vehicule: selected ? selected.id : null,
      name: nom,
      phone: tel,
      date_debut: debut,
      date_fin: fin,
      zone: zoneResa,
      avec_chauffeur: chauffeur,
      message: msg,
    }).catch(() => { /* la demande part sur WhatsApp de toute façon */ });

    if (!win) {                                          // fenêtre bloquée : on navigue directement
      window.location.href = url;
      return;
    }
    note.classList.add('is-ok');
    note.textContent = 'WhatsApp est ouvert : envoyez le message pour confirmer votre demande.';
    $('resaSubmit').disabled = true;                     // évite un second envoi pendant le délai
    finTimer = setTimeout(() => {
      finTimer = null;
      $('resaForm').reset();
      $('resaRecap').hidden = true;
      activer($('segChauffeur'), '0');                   // reset() n'agit pas sur des <button>
      oublierRaccourci();
      $('resaSubmit').disabled = false;
      closeModal();
    }, 2500);
  });

  load();
})();
