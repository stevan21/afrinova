/* ===================================================================
   AFRINOVA — Jeu d'icônes partagé

   Remplace les emojis, qui dépendaient de la police du système : les
   drapeaux s'affichaient en lettres sur Windows, et les pictogrammes
   couleur juraient avec les icônes au trait du reste du site.

   Toutes les icônes sont en 24x24, tracées en currentColor : elles
   prennent donc la couleur du texte qui les entoure.
   Les drapeaux, eux, sont en couleurs réelles et en 24x16.
   =================================================================== */
window.AfrinovaIcons = (function () {
  'use strict';

  const svg = (contenu, vb) =>
    `<svg viewBox="${vb || '0 0 24 24'}" fill="none" aria-hidden="true" focusable="false">${contenu}</svg>`;

  const trait = 'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';

  /* ---- Pictogrammes au trait ---- */
  const I = {
    // Objectifs de l'évaluation immigration
    etude: svg(`<path d="M12 4 2.5 9 12 14l9.5-5L12 4Z" ${trait}/>
                <path d="M6.5 11.2V16c0 1.4 2.5 2.6 5.5 2.6s5.5-1.2 5.5-2.6v-4.8" ${trait}/>
                <path d="M21.5 9v5" ${trait}/>`),
    travail: svg(`<rect x="2.5" y="7" width="19" height="13" rx="2" ${trait}/>
                  <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" ${trait}/>
                  <path d="M2.5 12.5h19M11 12v2h2v-2" ${trait}/>`),
    // Avion vu de dessus : lisible même réduit à 18 px
    tourisme: svg(`<path d="M12 2.6c.75 0 1.3.6 1.3 1.35v5.2l7.4 4.35v2.1l-7.4-2.2v4.15l2.35 1.7v1.6L12 20.05l-3.65.8v-1.6l2.35-1.7v-4.15l-7.4 2.2v-2.1l7.4-4.35v-5.2c0-.75.55-1.35 1.3-1.35Z" ${trait}/>`),

    // Divers, pour l'espace de gestion
    voiture: svg(`<path d="M3 13l1.5-4.5A2 2 0 0 1 6.4 7h11.2a2 2 0 0 1 1.9 1.5L21 13v5h-2v-2H5v2H3v-5Z" ${trait}/>
                  <circle cx="7" cy="16" r="1.2" fill="currentColor"/>
                  <circle cx="17" cy="16" r="1.2" fill="currentColor"/>`),
    etiquette: svg(`<path d="M3 12.6V4.5A1.5 1.5 0 0 1 4.5 3h8.1a2 2 0 0 1 1.4.6l7 7a2 2 0 0 1 0 2.8l-6.6 6.6a2 2 0 0 1-2.8 0l-7-7a2 2 0 0 1-.6-1.4Z" ${trait}/>
                    <circle cx="7.8" cy="7.8" r="1.4" ${trait}/>`),
    oeil: svg(`<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" ${trait}/>
               <circle cx="12" cy="12" r="2.8" ${trait}/>`),
    crayon: svg(`<path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3Z" ${trait}/>
                 <path d="M15 6.5 17.5 9" ${trait}/>`),
    disquette: svg(`<path d="M5 3h11l3 3v15H5V3Z" ${trait}/>
                    <path d="M8 3v6h7V3M8 14h8v7H8v-7Z" ${trait}/>`),
    alerte: svg(`<path d="M12 3.8 2.8 19.4h18.4L12 3.8Z" ${trait}/>
                 <path d="M12 10v4M12 16.8h.01" ${trait}/>`),
    note: svg(`<path d="M6 3h12v18H6V3Z" ${trait}/>
               <path d="M9 8h6M9 12h6M9 16h3" ${trait}/>`),
    document: svg(`<path d="M6 3h9l4 4v14H6V3Z" ${trait}/>
                   <path d="M14 3v5h5M9 13h6M9 17h4" ${trait}/>`),
    telephone: svg(`<path d="M6.5 3h3l1.5 4-2 1.4a12 12 0 0 0 5.6 5.6L16 12l4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.2 2 2 0 0 1 6.5 3Z" ${trait}/>`),
    lieu: svg(`<path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z" ${trait}/>
               <circle cx="12" cy="10" r="2.6" ${trait}/>`),
    horloge: svg(`<circle cx="12" cy="12" r="9" ${trait}/><path d="M12 7v5.2l3.2 2" ${trait}/>`),
    enveloppe: svg(`<rect x="2.5" y="5" width="19" height="14" rx="2" ${trait}/>
                    <path d="m3.5 7 8.5 6 8.5-6" ${trait}/>`),
    globe: svg(`<circle cx="12" cy="12" r="9" ${trait}/>
                <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" ${trait}/>`),
    chantier: svg(`<path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-3" ${trait}/>
                   <path d="M9 9h.01M9 13h.01M9 17h.01" ${trait}/>`),
    ordinateur: svg(`<rect x="2.5" y="4" width="19" height="12.5" rx="1.6" ${trait}/>
                     <path d="M8 20.5h8M9.5 9 7.5 11l2 2M14.5 9l2 2-2 2" ${trait}/>`),
    mobile: svg(`<rect x="6.5" y="2.5" width="11" height="19" rx="2.4" ${trait}/>
                 <path d="M10.5 18.5h3" ${trait}/>`),
    banque: svg(`<path d="M3 9.5 12 4l9 5.5" ${trait}/>
                 <path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18" ${trait}/>`),
    avion: svg(`<path d="M21 15.5 13.5 12V6.2a1.6 1.6 0 0 0-3.2 0V12L2.8 15.5v2.2l7.5-2.2v3.3l-2.3 1.5v1.2l3.9-1 3.9 1v-1.2l-2.3-1.5v-3.3l7.5 2.2v-2.2Z" ${trait}/>`),
    atterrissage: svg(`<path d="M3 20.5h18" ${trait}/>
                       <path d="M20.4 15.6 4.6 13l-.9-6 2.4.7 1.6 3.2 4.6.8L9.7 4.2l2.6.7 4.6 6.7 3.1.6a1.3 1.3 0 0 1 .4 2.4Z" ${trait}/>`),
    valide: svg(`<circle cx="12" cy="12" r="9" ${trait}/><path d="m8 12.3 2.7 2.7L16 9.7" ${trait}/>`),
    main: svg(`<path d="M11 20a6 6 0 0 1-6-6v-3.5a1.2 1.2 0 0 1 2.4 0V13" ${trait}/>
               <path d="M7.4 12V5.2a1.3 1.3 0 0 1 2.6 0V11M10 11V4.2a1.3 1.3 0 0 1 2.6 0V11M12.6 11.5V6.2a1.3 1.3 0 0 1 2.6 0V14" ${trait}/>
               <path d="M15.2 12.4 17 10a1.3 1.3 0 0 1 2.1 1.5L17 15.5V20" ${trait}/>`),
    question: svg(`<circle cx="12" cy="12" r="9" ${trait}/>
                   <path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .9-1 1.6v.4" ${trait}/>
                   <path d="M12 17.2h.01" ${trait}/>`),
    loupe: svg(`<circle cx="11" cy="11" r="7" ${trait}/><path d="m20 20-3.6-3.6" ${trait}/>`)
  };

  /* ---- Drapeaux, en couleurs réelles ---- */
  const cadre = '<rect x=".5" y=".5" width="23" height="15" rx="2" fill="none" stroke="rgba(0,0,0,.18)"/>';
  const clip = (id, contenu) =>
    `<svg viewBox="0 0 24 16" aria-hidden="true" focusable="false">
       <defs><clipPath id="${id}"><rect width="24" height="16" rx="2"/></clipPath></defs>
       <g clip-path="url(#${id})">${contenu}</g>${cadre}
     </svg>`;

  const D = {
    canada: clip('dc', `<rect width="24" height="16" fill="#fff"/>
      <rect width="6" height="16" fill="#D52B1E"/><rect x="18" width="6" height="16" fill="#D52B1E"/>
      <path fill="#D52B1E" d="M12 3.3c.42 1.05.92 1.95 1.5 2.7l1.6-.5-.4 1.75 2.2-.4-1 1.9 1.1.7-3.1 2.2.4 1.2-2.6-.4v2.6h-1.4v-2.6l-2.6.4.4-1.2-3.1-2.2 1.1-.7-1-1.9 2.2.4-.4-1.75 1.6.5c.58-.75 1.08-1.65 1.5-2.7Z"/>`),
    france: clip('df', `<rect width="8" height="16" fill="#0055A4"/>
      <rect x="8" width="8" height="16" fill="#fff"/><rect x="16" width="8" height="16" fill="#EF4135"/>`),
    belgique: clip('db', `<rect width="8" height="16" fill="#000"/>
      <rect x="8" width="8" height="16" fill="#FAE042"/><rect x="16" width="8" height="16" fill="#ED2939"/>`),
    allemagne: clip('da', `<rect width="24" height="5.34" fill="#000"/>
      <rect y="5.34" width="24" height="5.33" fill="#DD0000"/>
      <rect y="10.67" width="24" height="5.33" fill="#FFCE00"/>`),
    royaume_uni: clip('du', `<rect width="24" height="16" fill="#012169"/>
      <path d="M0 0 24 16M24 0 0 16" stroke="#fff" stroke-width="3.2"/>
      <path d="M0 0 24 16M24 0 0 16" stroke="#C8102E" stroke-width="1.9"/>
      <path d="M12 0v16M0 8h24" stroke="#fff" stroke-width="5.3"/>
      <path d="M12 0v16M0 8h24" stroke="#C8102E" stroke-width="3.2"/>`),
    etats_unis: clip('de', `<rect width="24" height="16" fill="#fff"/>
      ${[0, 2, 4, 6, 8, 10, 12].map((i) =>
        `<rect y="${i * 1.23}" width="24" height="1.23" fill="#B22234"/>`).join('')}
      <rect width="10" height="8.6" fill="#3C3B6E"/>
      ${[1.6, 4.3, 7].map((y) => [1.4, 4, 6.6, 8.8].map((x) =>
        `<circle cx="${x}" cy="${y}" r=".55" fill="#fff"/>`).join('')).join('')}`),
    autre_europe: clip('dp', `<rect width="24" height="16" fill="#003399"/>
      ${Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 - 90) * Math.PI / 180;
        return `<circle cx="${(12 + 4.6 * Math.cos(a)).toFixed(2)}" cy="${(8 + 4.6 * Math.sin(a)).toFixed(2)}" r=".8" fill="#FFCC00"/>`;
      }).join('')}`)
  };

  return { icone: (nom) => I[nom] || '', drapeau: (nom) => D[nom] || '', I: I, D: D };
})();
