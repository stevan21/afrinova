/* ===================================================================
   AFRINOVA — Évaluation de dossier d'immigration
   Questionnaire par étapes, score calculé dans le navigateur à partir
   du barème (immigration-bareme.js). Aucune donnée ne part tant que le
   visiteur n'a pas demandé à être rappelé.
   =================================================================== */
(function () {
  'use strict';
  const B = window.AfrinovaBareme;
  const ICO = window.AfrinovaIcons;
  const API = window.AfrinovaAPI;
  const WHATSAPP = '237659232292';

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nombre = (n) => Math.round(n).toLocaleString('fr-FR');
  const fcfa = (n) => nombre(n) + ' FCFA';
  const enFcfa = (euros) => euros * B.FCFA_PAR_EURO;

  const carte = $('immCard');

  /* État du questionnaire */
  const etat = { etape: 0, pays: null, motif: null, reponses: {}, resultat: null };

  const ETAPES = ['Destination', 'Objectif', 'Votre profil', 'Résultat'];

  /* ---------------- Calcul du score ---------------- */

  // Un critère « nombre » : on prend le premier palier qui couvre la valeur
  function partPalier(critere, motif, valeur) {
    const paliers = (critere.paliers || {})[motif] || [];
    for (const p of paliers) {
      if (valeur <= p.jusqua) return p.part;
    }
    return paliers.length ? paliers[paliers.length - 1].part : 0;
  }

  // Les fonds sont notés relativement au seuil attendu par le pays
  function partFonds(montantFcfa, seuilEuros) {
    if (!montantFcfa || !seuilEuros) return 0;
    const ratio = (montantFcfa / B.FCFA_PAR_EURO) / seuilEuros;
    if (ratio >= 1.2) return 1;
    if (ratio >= 1) return 0.9;
    if (ratio >= 0.75) return 0.65;
    if (ratio >= 0.5) return 0.4;
    if (ratio >= 0.25) return 0.2;
    return 0.05;
  }

  function partObtenue(critere, motif, reponse, pays) {
    if (reponse === undefined || reponse === null || reponse === '') return 0;
    if (critere.id === 'fonds') return partFonds(Number(reponse), B.PAYS[pays].fonds[motif]);
    if (critere.type === 'nombre') return partPalier(critere, motif, Number(reponse));
    if (critere.type === 'multi') {
      const choisis = Array.isArray(reponse) ? reponse : [];
      const somme = critere.options
        .filter((o) => choisis.includes(o.v))
        .reduce((t, o) => t + o.part, 0);
      return Math.min(1, somme);
    }
    const opt = critere.options.find((o) => o.v === reponse);
    return opt ? opt.part : 0;
  }

  const criteresDuMotif = (motif) => B.CRITERES.filter((c) => c.motifs.includes(motif));

  function evaluer() {
    const { pays, motif, reponses } = etat;
    const details = [];
    let obtenus = 0, maximum = 0;

    criteresDuMotif(motif).forEach((c) => {
      const poids = c.poids[motif];
      const part = partObtenue(c, motif, reponses[c.id], pays);
      const pts = Math.round(part * poids);
      obtenus += pts;
      maximum += poids;
      details.push({
        id: c.id, libelle: c.libelle, pts: pts, poids: poids, part: part,
        conseil: part < 0.7 ? (c.conseil || {})[motif] : null
      });
    });

    const score = maximum ? Math.round((obtenus / maximum) * 100) : 0;
    const verdict = B.VERDICTS.find((v) => score >= v.min) || B.VERDICTS[B.VERDICTS.length - 1];
    // Les points faibles, du plus pénalisant au moins pénalisant
    const faibles = details
      .filter((d) => d.conseil)
      .sort((a, b) => (b.poids - b.pts) - (a.poids - a.pts));

    return { score: score, verdict: verdict, details: details, faibles: faibles };
  }

  /* ---------------- Rendu des étapes ---------------- */

  function majProgression() {
    const prog = $('immProgress');
    if (etat.etape === 0) { prog.hidden = true; return; }
    prog.hidden = false;
    $('immProgressFill').style.width = ((etat.etape + 1) / ETAPES.length * 100) + '%';
    $('immProgressTxt').textContent =
      'Étape ' + (etat.etape + 1) + ' sur ' + ETAPES.length + ' — ' + ETAPES[etat.etape];
  }

  function vueDestination() {
    const cartes = Object.entries(B.PAYS).map(([cle, p]) => `
      <button type="button" class="imm-pays" data-pays="${cle}">
        <span class="imm-pays-drapeau">${ICO.drapeau(cle)}</span>
        <span class="imm-pays-nom">${esc(p.nom)}</span>
      </button>`).join('');
    return `
      <h2>Où souhaitez-vous aller&nbsp;?</h2>
      <p class="imm-sous">Les critères et les montants attendus changent d'un pays à l'autre.</p>
      <div class="imm-pays-grille">${cartes}</div>`;
  }

  function vueObjectif() {
    const p = B.PAYS[etat.pays];
    const choix = Object.entries(B.MOTIFS).map(([cle, m]) => `
      <button type="button" class="imm-motif" data-motif="${cle}">
        <span class="imm-motif-icone">${ICO.icone(m.icone)}</span>
        <span>
          <strong>${esc(m.nom)}</strong>
          <small>Ressources attendues : ${fcfa(enFcfa(p.fonds[cle]))}</small>
        </span>
      </button>`).join('');
    return `
      <h2><span class="imm-drapeau-titre">${ICO.drapeau(etat.pays)}</span> ${esc(p.nom)}</h2>
      <p class="imm-sous">${esc(p.remarque)}</p>
      <div class="imm-motifs">${choix}</div>
      <button type="button" class="imm-retour" data-retour="0">← Changer de destination</button>`;
  }

  function champ(c) {
    const val = etat.reponses[c.id];
    if (c.type === 'choix') {
      return c.options.map((o) => `
        <label class="imm-opt${val === o.v ? ' is-on' : ''}">
          <input type="radio" name="${c.id}" value="${o.v}"${val === o.v ? ' checked' : ''} />
          <span>${esc(o.l)}</span>
        </label>`).join('');
    }
    if (c.type === 'multi') {
      const choisis = Array.isArray(val) ? val : [];
      return `<p class="imm-aide">Cochez tout ce qui s'applique.</p>` +
        c.options.map((o) => `
          <label class="imm-opt${choisis.includes(o.v) ? ' is-on' : ''}">
            <input type="checkbox" name="${c.id}" value="${o.v}"${choisis.includes(o.v) ? ' checked' : ''} />
            <span>${esc(o.l)}</span>
          </label>`).join('');
    }
    if (c.id === 'fonds') {
      const seuil = enFcfa(B.PAYS[etat.pays].fonds[etat.motif]);
      return `
        <p class="imm-aide">Attendu pour ${esc(B.MOTIFS[etat.motif].duree)} :
           <strong>${fcfa(seuil)}</strong></p>
        <div class="imm-champ-suffixe">
          <input type="number" name="${c.id}" min="0" step="10000"
                 value="${val != null ? esc(val) : ''}" placeholder="${esc(c.placeholder)}"
                 inputmode="numeric" />
          <span>FCFA</span>
        </div>`;
    }
    return `
      <div class="imm-champ-suffixe">
        <input type="number" name="${c.id}" min="${c.min}" max="${c.max}"
               value="${val != null ? esc(val) : ''}" placeholder="${esc(c.placeholder)}"
               inputmode="numeric" />
        <span>${esc(c.suffixe)}</span>
      </div>`;
  }

  function vueProfil() {
    const blocs = criteresDuMotif(etat.motif).map((c, i) => `
      <fieldset class="imm-bloc" data-critere="${c.id}">
        <legend><span class="imm-num">${i + 1}</span>${esc(c.question)}</legend>
        ${champ(c)}
      </fieldset>`).join('');
    return `
      <h2>Parlez-nous de votre profil</h2>
      <p class="imm-sous">${criteresDuMotif(etat.motif).length} questions. Répondez au plus juste :
        un résultat honnête vous sert davantage qu'un bon score.</p>
      <form id="immForm">${blocs}
        <p class="imm-err" id="immErr" hidden></p>
        <button type="submit" class="btn btn-primary btn-block imm-valider">Voir mon évaluation</button>
      </form>
      <button type="button" class="imm-retour" data-retour="1">← Changer d'objectif</button>`;
  }

  function vueResultat() {
    const r = etat.resultat;
    const p = B.PAYS[etat.pays];
    const m = B.MOTIFS[etat.motif];

    const barres = r.details.map((d) => `
      <li>
        <div class="imm-ligne">
          <span>${esc(d.libelle)}</span>
          <strong>${d.pts}<small>/${d.poids}</small></strong>
        </div>
        <div class="imm-jauge"><span style="width:${Math.round(d.part * 100)}%"></span></div>
      </li>`).join('');

    const conseils = r.faibles.length
      ? `<div class="imm-conseils">
           <h3>Ce qu'il faut renforcer</h3>
           ${r.faibles.map((d) => `
             <div class="imm-conseil">
               <h4>${esc(d.libelle)} <span>${d.pts}/${d.poids} points</span></h4>
               <p>${esc(d.conseil)}</p>
             </div>`).join('')}
         </div>`
      : `<div class="imm-conseils">
           <h3>Aucune faiblesse majeure détectée</h3>
           <p>Votre profil coche les critères principaux. L'enjeu se déplace sur
              la qualité et la cohérence des pièces que vous fournirez.</p>
         </div>`;

    return `
      <div class="imm-resultat imm-${r.verdict.cle}">
        <div class="imm-score">
          <div class="imm-score-chiffre"><strong>${r.score}</strong><span>/100</span></div>
          <div>
            <h2>${esc(r.verdict.titre)}</h2>
            <p class="imm-score-ou">
              <span class="imm-ico-inline">${ICO.icone(m.icone)}</span>${esc(m.nom)}
              <span class="imm-sep">—</span>
              <span class="imm-drapeau-inline">${ICO.drapeau(etat.pays)}</span>${esc(p.nom)}
            </p>
          </div>
        </div>
        <p class="imm-verdict-txt">${esc(r.verdict.texte)}</p>
      </div>

      <h3 class="imm-titre-detail">Le détail du calcul</h3>
      <ul class="imm-detail">${barres}</ul>

      ${conseils}

      <div class="imm-suite">
        <h3>Faire reprendre ce dossier par un conseiller</h3>
        <p>Nous vous rappelons pour construire le dossier point par point.
           Vos réponses sont transmises avec votre demande, vous n'aurez pas à tout répéter.</p>
        <div class="field">
          <label for="immNom">Nom complet</label>
          <input type="text" id="immNom" autocomplete="name" placeholder="Ex. Jean Mbarga" />
        </div>
        <div class="field">
          <label for="immTel">Téléphone WhatsApp</label>
          <div class="input-prefix">
            <span>+237</span>
            <input type="tel" id="immTel" inputmode="numeric" autocomplete="tel"
                   placeholder="6 99 88 77 66" />
          </div>
        </div>
        <p class="imm-err" id="immErrContact" hidden></p>
        <button type="button" class="btn btn-primary btn-block" id="immEnvoyer">
          Envoyer mon dossier sur WhatsApp
        </button>
        <p class="imm-note" id="immNote" role="status"></p>
      </div>

      <div class="imm-refaire">
        <button type="button" data-retour="2">← Modifier mes réponses</button>
        <button type="button" data-retour="0">Recommencer</button>
      </div>`;
  }

  const VUES = [vueDestination, vueObjectif, vueProfil, vueResultat];

  function afficher() {
    carte.innerHTML = VUES[etat.etape]();
    majProgression();
    carte.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------------- Interactions ---------------- */

  carte.addEventListener('click', (e) => {
    const pays = e.target.closest('[data-pays]');
    if (pays) { etat.pays = pays.dataset.pays; etat.etape = 1; afficher(); return; }

    const motif = e.target.closest('[data-motif]');
    if (motif) {
      // Changer d'objectif rend caduques les réponses précédentes
      if (etat.motif && etat.motif !== motif.dataset.motif) etat.reponses = {};
      etat.motif = motif.dataset.motif;
      etat.etape = 2;
      afficher();
      return;
    }

    const retour = e.target.closest('[data-retour]');
    if (retour) { etat.etape = Number(retour.dataset.retour); afficher(); return; }

    if (e.target.closest('#immEnvoyer')) envoyer();
  });

  // Mémorise les réponses au fil de la saisie
  carte.addEventListener('change', (e) => {
    const el = e.target;
    if (!el.name) return;
    const critere = B.CRITERES.find((c) => c.id === el.name);
    if (!critere) return;

    if (critere.type === 'multi') {
      const coches = [...carte.querySelectorAll(`input[name="${el.name}"]:checked`)];
      etat.reponses[el.name] = coches.map((x) => x.value);
    } else {
      etat.reponses[el.name] = el.value;
    }

    // Reflet visuel de la sélection
    const bloc = el.closest('.imm-bloc');
    if (bloc) {
      bloc.querySelectorAll('.imm-opt').forEach((lab) => {
        const input = lab.querySelector('input');
        lab.classList.toggle('is-on', input.checked);
      });
    }
  });

  carte.addEventListener('submit', (e) => {
    if (e.target.id !== 'immForm') return;
    e.preventDefault();

    // Toutes les questions comptent : une non-réponse fausserait le score
    const manquants = criteresDuMotif(etat.motif).filter((c) => {
      const v = etat.reponses[c.id];
      if (c.type === 'multi') return !Array.isArray(v) || !v.length;
      return v === undefined || v === null || v === '';
    });

    const err = $('immErr');
    if (manquants.length) {
      err.textContent = manquants.length === 1
        ? 'Il reste une question sans réponse : ' + manquants[0].libelle.toLowerCase() + '.'
        : 'Il reste ' + manquants.length + ' questions sans réponse.';
      err.hidden = false;
      const bloc = carte.querySelector(`[data-critere="${manquants[0].id}"]`);
      if (bloc) bloc.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    err.hidden = true;

    etat.resultat = evaluer();
    etat.etape = 3;
    afficher();
  });

  /* ---------------- Envoi au conseiller ---------------- */

  function messageWhatsApp(nom, tel) {
    const r = etat.resultat;
    const lignes = [
      'Bonjour AFRINOVA, voici mon évaluation immigration.',
      '',
      'Nom : ' + nom,
      'Téléphone : ' + tel,
      'Destination : ' + B.PAYS[etat.pays].nom,
      'Objectif : ' + B.MOTIFS[etat.motif].nom,
      'Score obtenu : ' + r.score + '/100 — ' + r.verdict.titre,
      ''
    ];
    r.details.forEach((d) => lignes.push('- ' + d.libelle + ' : ' + d.pts + '/' + d.poids));
    if (r.faibles.length) {
      lignes.push('', 'À renforcer : ' + r.faibles.map((d) => d.libelle).join(', '));
    }
    return lignes.join('\n');
  }

  function envoyer() {
    const nom = $('immNom').value.trim();
    const telLocal = $('immTel').value.replace(/\D/g, '');
    const err = $('immErrContact');

    if (!nom) { err.textContent = 'Indiquez votre nom.'; err.hidden = false; $('immNom').focus(); return; }
    if (telLocal.length < 8) {
      err.textContent = 'Numéro incomplet (8 chiffres minimum).';
      err.hidden = false; $('immTel').focus(); return;
    }
    err.hidden = true;

    const tel = '+237 ' + telLocal;
    const url = 'https://wa.me/' + WHATSAPP + '?text=' +
      encodeURIComponent(messageWhatsApp(nom, tel));

    // Ouverture synchrone, sinon le bloqueur de fenêtres surgissantes l'empêche
    const fen = window.open(url, '_blank');

    API.post('/evaluations-immigration/', {
      name: nom,
      phone: tel,
      pays: B.PAYS[etat.pays].nom,
      motif: B.MOTIFS[etat.motif].nom,
      score: etat.resultat.score,
      verdict: etat.resultat.verdict.titre,
      reponses: etat.reponses,
      points_faibles: etat.resultat.faibles.map((d) => d.libelle)
    }).catch(() => { /* la demande part sur WhatsApp de toute façon */ });

    if (!fen) { window.location.href = url; return; }
    const note = $('immNote');
    note.className = 'imm-note is-ok';
    note.textContent = 'WhatsApp est ouvert : envoyez le message pour finaliser votre demande.';
    $('immEnvoyer').disabled = true;
  }

  /* ---------------- Démarrage ---------------- */
  $('immRevision').textContent = B.REVISION;
  afficher();
})();
