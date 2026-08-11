/* ===================================================================
   AFRINOVA — Assistant virtuel (chatbot)
   Widget autonome : injecte son style + son HTML, aucune dépendance.
   Logique par mots-clés (fonctionne hors-ligne, sans serveur).
   =================================================================== */
(function () {
  'use strict';

  /* ----- Coordonnées / constantes ----- */
  const TEL1 = '+237 659 23 22 92';
  const TEL2 = '+237 652 76 97 09';
  const WA = 'https://wa.me/237659232292?text=' + encodeURIComponent("Bonjour AFRINOVA, je souhaite des informations.");
  const EMAIL = 'service@afrinovagroupe.com';
  const ADRESSE = 'Obili, Yaoundé — Cameroun';

  /* ----- index.html et service.html sont dans le même dossier : chemins relatifs simples ----- */
  const HOME = '';
  const link = (href, label) => `<a href="${href}" class="afb-link">${label}</a>`;

  const SERVICES = [
    { slug: 'btp',           name: 'BTP',                  kw: ['btp', 'construction', 'batiment', 'maison', 'chantier', 'travaux public', 'genie civil', 'renovation', 'voirie', 'maconnerie'] },
    { slug: 'informatique',  name: 'Informatique',         kw: ['informatique', 'site', 'web', 'application', 'app', 'logiciel', 'erp', 'reseau', 'cyber', 'digital', 'numerique', 'developpement', 'ordinateur'] },
    { slug: 'sante',         name: 'Santé numérique',      kw: ['sante', 'medecin', 'medical', 'teleconsultation', 'telemedecine', 'clinique', 'hopital', 'patient', 'soin'] },
    { slug: 'immigration',   name: 'Immigration',          kw: ['immigration', 'visa', 'etude', 'etudier', 'etranger', 'voyage', 'travail a', 'sejour', 'installation', 'canada', 'france', 'europe'] },
    { slug: 'devises',       name: 'Échange de devises',   kw: ['devise', 'change', 'transfert', 'argent', 'monnaie', 'euro', 'dollar', 'financier', 'finance'] },
    { slug: 'location',      name: 'Location de véhicules', page: 'location.html', kw: ['location', 'voiture', 'vehicule', 'auto', 'chauffeur', 'transfert aeroport', 'deplacement', 'taxi', 'louer', 'reserver un vehicule'] },
    { slug: 'multiservices', name: 'Multiservices',        kw: ['multiservice', 'multi service', 'conciergerie', 'externalisation', 'plusieurs', 'divers'] },
    { slug: 'entretien-nettoyage', name: 'Entretien & Nettoyage', kw: ['entretien', 'nettoyage', 'nettoyer', 'menage', 'proprete', 'propre', 'maintenance', 'jardinage', 'jardin', 'espaces verts', 'elagage', 'vitrerie', 'repassage', 'femme de menage', 'plomberie', 'climatisation'] }
  ];
  // Certains pôles ont leur page dédiée (ex. location) plutôt que la page service générique.
  const svcHref = (slug) => {
    const s = SERVICES.find((x) => x.slug === slug);
    return HOME + (s && s.page ? s.page : `service.html?p=${slug}`);
  };

  /* ----- Style ----- */
  const css = `
  .afb-root{--n:#1B2A63;--o:#F47920;font-family:'Plus Jakarta Sans',system-ui,sans-serif}
  .afb-launch{position:fixed;right:24px;bottom:24px;width:62px;height:62px;border-radius:50%;border:0;cursor:pointer;z-index:60;
    background:linear-gradient(145deg,var(--n),var(--o));color:#fff;display:grid;place-items:center;
    box-shadow:0 14px 30px -8px rgba(27,42,99,.55);transition:transform .25s cubic-bezier(.22,.61,.36,1)}
  .afb-launch:hover{transform:translateY(-3px) scale(1.05)}
  .afb-launch svg{width:30px;height:30px}
  .afb-launch .afb-close-ic{display:none}
  .afb-root.open .afb-launch .afb-chat-ic{display:none}
  .afb-root.open .afb-launch .afb-close-ic{display:block}
  .afb-pulse{position:fixed;right:24px;bottom:24px;width:62px;height:62px;border-radius:50%;z-index:59;pointer-events:none;
    box-shadow:0 0 0 0 rgba(244,121,32,.5);animation:afbpulse 2.2s infinite}
  .afb-root.open .afb-pulse{display:none}
  @keyframes afbpulse{to{box-shadow:0 0 0 18px rgba(244,121,32,0)}}
  .afb-panel{position:fixed;right:24px;bottom:98px;width:360px;max-width:calc(100vw - 32px);height:520px;max-height:calc(100vh - 130px);
    background:#fff;border-radius:20px;overflow:hidden;z-index:60;display:flex;flex-direction:column;
    box-shadow:0 30px 70px -20px rgba(27,42,99,.45);border:1px solid #e6eaf4;
    opacity:0;transform:translateY(16px) scale(.98);pointer-events:none;transform-origin:bottom right;
    transition:opacity .3s cubic-bezier(.22,.61,.36,1),transform .3s cubic-bezier(.22,.61,.36,1)}
  .afb-root.open .afb-panel{opacity:1;transform:none;pointer-events:auto}
  .afb-head{background:linear-gradient(135deg,var(--n),#121E47);color:#fff;padding:16px 18px;display:flex;align-items:center;gap:12px}
  .afb-ava{width:42px;height:42px;border-radius:12px;background:#fff;display:grid;place-items:center;overflow:hidden;flex-shrink:0}
  .afb-ava img{width:100%;height:100%;object-fit:cover}
  .afb-head h4{margin:0;font-family:'Poppins',sans-serif;font-size:1rem;line-height:1.2}
  .afb-head span{font-size:.78rem;opacity:.85;display:flex;align-items:center;gap:5px}
  .afb-dot{width:8px;height:8px;border-radius:50%;background:#36d07f;display:inline-block}
  .afb-x{margin-left:auto;background:rgba(255,255,255,.15);border:0;color:#fff;width:30px;height:30px;border-radius:9px;cursor:pointer;font-size:1.1rem;line-height:1}
  .afb-x:hover{background:rgba(255,255,255,.28)}
  .afb-body{flex:1;overflow-y:auto;padding:18px;background:#f5f7fc;display:flex;flex-direction:column;gap:12px}
  .afb-msg{max-width:84%;padding:10px 14px;border-radius:14px;font-size:.9rem;line-height:1.5;animation:afbin .3s ease}
  @keyframes afbin{from{opacity:0;transform:translateY(8px)}}
  .afb-bot{background:#fff;color:#16203f;align-self:flex-start;border-bottom-left-radius:4px;box-shadow:0 4px 12px -8px rgba(27,42,99,.3)}
  .afb-user{background:var(--n);color:#fff;align-self:flex-end;border-bottom-right-radius:4px}
  .afb-ic{width:15px;height:15px;vertical-align:-3px;margin-right:.15rem;display:inline-block}
  .afb-msg a.afb-link{color:var(--o);font-weight:700;text-decoration:none}
  .afb-msg a.afb-link:hover{text-decoration:underline}
  .afb-bot b{color:var(--n)}
  .afb-chips{display:flex;flex-wrap:wrap;gap:8px;padding:0 18px 14px;background:#f5f7fc}
  .afb-chip{background:#fff;border:1.5px solid #dbe1f0;color:var(--n);font-weight:600;font-size:.82rem;
    padding:.5rem .9rem;border-radius:999px;cursor:pointer;transition:.2s;font-family:inherit}
  .afb-chip:hover{background:var(--n);color:#fff;border-color:var(--n)}
  .afb-input{display:flex;gap:8px;padding:12px;border-top:1px solid #e6eaf4;background:#fff}
  .afb-input input{flex:1;border:1.5px solid #e6eaf4;border-radius:999px;padding:.6rem 1rem;font-family:inherit;font-size:.9rem;outline:none}
  .afb-input input:focus{border-color:var(--o)}
  .afb-send{width:42px;height:42px;border-radius:50%;border:0;background:var(--o);color:#fff;cursor:pointer;flex-shrink:0;display:grid;place-items:center}
  .afb-send:hover{background:#e96c12}
  .afb-send svg{width:18px;height:18px}
  .afb-typing{display:flex;gap:4px;align-items:center}
  .afb-typing span{width:7px;height:7px;border-radius:50%;background:#9aa3bd;animation:afbb 1s infinite}
  .afb-typing span:nth-child(2){animation-delay:.15s}.afb-typing span:nth-child(3){animation-delay:.3s}
  @keyframes afbb{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-5px);opacity:1}}
  @media (max-width:480px){.afb-panel{right:16px;bottom:90px}.afb-launch,.afb-pulse{right:16px;bottom:16px}}
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ----- DOM ----- */
  const root = document.createElement('div');
  root.className = 'afb-root';
  root.innerHTML = `
    <div class="afb-pulse"></div>
    <button class="afb-launch" id="afbLaunch" aria-label="Ouvrir l'assistant">
      <svg class="afb-chat-ic" viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.7-.84L3 21l1.84-5.8A8.5 8.5 0 1 1 21 11.5Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
      <svg class="afb-close-ic" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    </button>
    <div class="afb-panel" role="dialog" aria-label="Assistant AFRINOVA">
      <div class="afb-head">
        <div class="afb-ava"><img src="/static/assets/logo.jpeg" alt="AFRINOVA"></div>
        <div>
          <h4>Assistant AFRINOVA</h4>
          <span><i class="afb-dot"></i> En ligne — réponse immédiate</span>
        </div>
        <button class="afb-x" id="afbClose" aria-label="Fermer">&times;</button>
      </div>
      <div class="afb-body" id="afbBody"></div>
      <div class="afb-chips" id="afbChips"></div>
      <form class="afb-input" id="afbForm">
        <input id="afbInput" type="text" placeholder="Écrivez votre message…" autocomplete="off" />
        <button class="afb-send" type="submit" aria-label="Envoyer">
          <svg viewBox="0 0 24 24" fill="none"><path d="M4 12l16-8-6 16-3-6-7-2Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" fill="currentColor"/></svg>
        </button>
      </form>
    </div>`;
  document.body.appendChild(root);

  const body = root.querySelector('#afbBody');
  const chipsBox = root.querySelector('#afbChips');
  const form = root.querySelector('#afbForm');
  const input = root.querySelector('#afbInput');

  /* ----- Helpers ----- */
  const scrollDown = () => { body.scrollTop = body.scrollHeight; };
  function pushUser(text) {
    const d = document.createElement('div');
    d.className = 'afb-msg afb-user';
    d.textContent = text;
    body.appendChild(d); scrollDown();
  }
  function pushBot(html) {
    const d = document.createElement('div');
    d.className = 'afb-msg afb-bot';
    d.innerHTML = html;
    body.appendChild(d); scrollDown();
  }
  function botTyping(html, chips) {
    const t = document.createElement('div');
    t.className = 'afb-msg afb-bot';
    t.innerHTML = '<div class="afb-typing"><span></span><span></span><span></span></div>';
    body.appendChild(t); scrollDown();
    setTimeout(() => {
      t.remove();
      pushBot(html);
      if (chips) setChips(chips);
    }, 600);
  }
  function setChips(list) {
    chipsBox.innerHTML = '';
    (list || []).forEach((c) => {
      const b = document.createElement('button');
      b.className = 'afb-chip';
      b.type = 'button';
      b.textContent = c;
      b.addEventListener('click', () => handle(c));
      chipsBox.appendChild(b);
    });
  }

  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  const DEFAULT_CHIPS = ['Nos services', 'Contact', 'Demander un devis', 'Horaires', 'Le fondateur'];

  /* ----- Réponses ----- */
  function contactReply() {
    return `<svg class="afb-ic" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6.5 3h3l1.5 4-2 1.4a12 12 0 0 0 5.6 5.6L16 12l4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.2 2 2 0 0 1 6.5 3Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg> Vous pouvez nous joindre&nbsp;:<br>
      • Tél&nbsp;: <a class="afb-link" href="tel:+237659232292">${TEL1}</a><br>
      • Tél&nbsp;: <a class="afb-link" href="tel:+237652769709">${TEL2}</a><br>
      • <a class="afb-link" href="${WA}" target="_blank" rel="noopener">Discuter sur WhatsApp</a><br>
      • Email&nbsp;: <a class="afb-link" href="mailto:${EMAIL}">${EMAIL}</a><br>
      • <svg class="afb-ic" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="10" r="2.6" stroke="currentColor" stroke-width="1.8"/></svg> ${ADRESSE}`;
  }
  function servicesReply() {
    const list = SERVICES.map(s => '• ' + link(svcHref(s.slug), s.name)).join('<br>');
    return `Nous réunissons <b>7 pôles d'expertise</b>&nbsp;:<br>${list}<br><br>Cliquez sur un pôle pour voir le détail, ou dites-moi lequel vous intéresse.`;
  }
  function devisReply() {
    return `Pour un <b>devis gratuit</b>, le plus simple&nbsp;:<br>
      • Remplir le ${link(HOME + 'index.html#contact', 'formulaire de contact')}<br>
      • Ou nous écrire sur <a class="afb-link" href="${WA}" target="_blank" rel="noopener">WhatsApp</a><br>
      • Ou appeler le <a class="afb-link" href="tel:+237659232292">${TEL1}</a><br><br>
      Dites-moi le <b>pôle concerné</b> et quelques détails, je vous oriente !`;
  }

  function detect(text) {
    const t = norm(text);
    const has = (arr) => arr.some(k => t.includes(k));

    // pôle spécifique
    for (const s of SERVICES) {
      if (s.kw.some(k => t.includes(norm(k)))) {
        return botTyping(
          `<b>${s.name}</b> — c'est l'un de nos pôles ! ${link(svcHref(s.slug), 'Voir la page détaillée →')}<br><br>Souhaitez-vous un devis ou nous contacter ?`,
          ['Demander un devis', 'Contact', 'Nos services']
        );
      }
    }
    if (has(['bonjour', 'salut', 'bonsoir', 'hello', 'coucou', 'hey', 'cc'])) {
      return botTyping('Bonjour ! Ravi de vous accueillir chez AFRINOVA. Que puis-je faire pour vous ?', DEFAULT_CHIPS);
    }
    if (has(['devis', 'prix', 'tarif', 'cout', 'combien', 'estimation', 'budget'])) {
      return botTyping(devisReply(), ['Nos services', 'Contact']);
    }
    if (has(['contact', 'telephone', 'numero', 'appel', 'joindre', 'email', 'mail', 'adresse', 'bureau', 'obili', 'ou etes', 'localisation', 'whatsapp', 'situe'])) {
      return botTyping(contactReply(), ['Demander un devis', 'Horaires']);
    }
    if (has(['horaire', 'heure', 'ouvert', 'ouverture', 'ferme', 'quand'])) {
      return botTyping('<svg class="afb-ic" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 7v5.2l3.2 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg> Nous sommes ouverts du <b>lundi au samedi</b>, de <b>8h00 à 19h00</b>.', ['Contact', 'Nos services']);
    }
    if (has(['fondateur', 'directeur', 'patron', 'choudja', 'alain', 'dirigeant', 'createur', 'gerant'])) {
      return botTyping(`Le fondateur & dirigeant d'AFRINOVA est <b>Choudja Alain</b>. ${link(HOME + 'index.html#founder', 'Découvrir son mot →')}`, DEFAULT_CHIPS);
    }
    if (has(['service', 'pole', 'pôle', 'que faites', 'proposez', 'activite', 'metier', 'quoi', 'aide', 'faites vous'])) {
      return botTyping(servicesReply(), ['Demander un devis', 'Contact']);
    }
    if (has(['merci', 'thanks', 'top', 'parfait', 'super'])) {
      return botTyping('Avec plaisir. Je reste disponible si vous avez d\'autres questions !', DEFAULT_CHIPS);
    }
    if (has(['bye', 'au revoir', 'a plus', 'ciao'])) {
      return botTyping('Merci de votre visite et à bientôt chez AFRINOVA !', DEFAULT_CHIPS);
    }
    // fallback
    return botTyping(
      `Je n'ai pas tout saisi, mais je peux vous aider sur&nbsp;:<br>${servicesReply()}<br><br>Ou contactez directement un conseiller&nbsp;: <a class="afb-link" href="${WA}" target="_blank" rel="noopener">WhatsApp</a>.`,
      DEFAULT_CHIPS
    );
  }

  /* mappe les libellés de boutons vers les intentions */
  function handle(text) {
    pushUser(text);
    setChips([]);
    const t = norm(text);
    if (t.includes('service')) return botTyping(servicesReply(), ['Demander un devis', 'Contact']);
    if (t.includes('devis')) return botTyping(devisReply(), ['Nos services', 'Contact']);
    if (t.includes('contact')) return botTyping(contactReply(), ['Demander un devis', 'Horaires']);
    if (t.includes('horaire')) return botTyping('<svg class="afb-ic" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 7v5.2l3.2 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg> Nous sommes ouverts du <b>lundi au samedi</b>, de <b>8h00 à 19h00</b>.', ['Contact', 'Nos services']);
    if (t.includes('fondateur')) return botTyping(`Le fondateur & dirigeant d'AFRINOVA est <b>Choudja Alain</b>. ${link(HOME + 'index.html#founder', 'Découvrir son mot →')}`, DEFAULT_CHIPS);
    return detect(text);
  }

  /* ----- Événements ----- */
  const launch = root.querySelector('#afbLaunch');
  let greeted = false;
  function toggle() {
    root.classList.toggle('open');
    if (root.classList.contains('open')) {
      input.focus();
      if (!greeted) {
        greeted = true;
        botTyping("Bonjour et bienvenue chez <b>AFRINOVA</b> !<br>Je suis votre assistant virtuel. Comment puis-je vous aider aujourd'hui ?", DEFAULT_CHIPS);
      }
    }
  }
  launch.addEventListener('click', toggle);
  root.querySelector('#afbClose').addEventListener('click', toggle);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = input.value.trim();
    if (!v) return;
    input.value = '';
    handle(v);
  });
})();
