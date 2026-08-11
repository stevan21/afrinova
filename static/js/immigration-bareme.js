/* ===================================================================
   AFRINOVA — Barème d'évaluation des dossiers d'immigration

   CE FICHIER EST FAIT POUR ÊTRE MODIFIÉ SANS TOUCHER AU RESTE DU CODE.
   Les seuils financiers et les pondérations évoluent avec la
   réglementation : relisez-les régulièrement et corrigez ici.

   Les montants sont en EUROS par personne. Ils sont affichés au client
   en euros et en FCFA (parité fixe 1 € = 655,957 FCFA).

   Dernière révision des seuils : voir REVISION ci-dessous.
   =================================================================== */
window.AfrinovaBareme = (function () {
  'use strict';

  const REVISION = 'août 2026';

  /* ------------------------------------------------------------------
     PAYS
     fonds  = ressources attendues, en euros, par personne
              (études : pour une année ; travail : à l'installation ;
               tourisme : pour un séjour d'environ deux semaines)
     langue = langue principale attendue dans le dossier
     ------------------------------------------------------------------ */
  const PAYS = {
    canada: {
      nom: 'Canada', drapeau: '🇨🇦', langue: 'les deux',
      fonds: { etude: 14000, travail: 10000, tourisme: 2500 },
      remarque: "Système à points très encadré : les critères sont publics et " +
                "peu discrétionnaires. Le Québec applique ses propres règles."
    },
    france: {
      nom: 'France', drapeau: '🇫🇷', langue: 'français',
      fonds: { etude: 7400, travail: 6000, tourisme: 1000 },
      remarque: "Passage par Campus France obligatoire pour les études. " +
                "La cohérence du projet pèse autant que les chiffres."
    },
    belgique: {
      nom: 'Belgique', drapeau: '🇧🇪', langue: 'français',
      fonds: { etude: 8500, travail: 7000, tourisme: 1000 },
      remarque: "Prise en charge financière possible par un garant (annexe 32)."
    },
    allemagne: {
      nom: 'Allemagne', drapeau: '🇩🇪', langue: 'allemand',
      fonds: { etude: 11900, travail: 8000, tourisme: 1200 },
      remarque: "Compte bloqué (Sperrkonto) exigé pour les études. " +
                "Carte bleue européenne pour les profils qualifiés."
    },
    royaume_uni: {
      nom: 'Royaume-Uni', drapeau: '🇬🇧', langue: 'anglais',
      fonds: { etude: 12000, travail: 9000, tourisme: 2000 },
      remarque: "Système à points. Un sponsor agréé est indispensable " +
                "pour les études comme pour le travail."
    },
    etats_unis: {
      nom: 'États-Unis', drapeau: '🇺🇸', langue: 'anglais',
      fonds: { etude: 20000, travail: 12000, tourisme: 3000 },
      remarque: "Décision très discrétionnaire, prise en entretien consulaire. " +
                "Les attaches au pays d'origine sont déterminantes."
    },
    autre_europe: {
      nom: 'Autre pays d\'Europe', drapeau: '🇪🇺', langue: 'les deux',
      fonds: { etude: 9000, travail: 7000, tourisme: 1200 },
      remarque: "Estimation moyenne pour l'espace Schengen. " +
                "Les seuils varient sensiblement d'un pays à l'autre."
    }
  };

  const MOTIFS = {
    etude: { nom: 'Étudier', icone: '🎓', duree: 'une année d\'études' },
    travail: { nom: 'Travailler', icone: '💼', duree: 'l\'installation' },
    tourisme: { nom: 'Tourisme / visite', icone: '✈️', duree: 'le séjour' }
  };

  /* ------------------------------------------------------------------
     CRITÈRES
     - motifs  : à quels objectifs la question s'applique
     - poids   : points maximum, par motif (le total fait 100 par motif)
     - bareme  : part des points obtenue pour chaque réponse (0 à 1)
     - conseil : affiché au client quand il perd des points
     ------------------------------------------------------------------ */
  const CRITERES = [
    {
      id: 'age',
      libelle: 'Âge',
      motifs: ['etude', 'travail', 'tourisme'],
      poids: { etude: 10, travail: 10, tourisme: 4 },
      question: 'Quel âge avez-vous ?',
      type: 'nombre', min: 15, max: 80, suffixe: 'ans', placeholder: 'Ex. 27',
      // Paliers : le premier dont la borne haute couvre la valeur l'emporte
      paliers: {
        etude: [
          { jusqua: 17, part: 0.6 }, { jusqua: 25, part: 1 },
          { jusqua: 30, part: 0.85 }, { jusqua: 35, part: 0.6 },
          { jusqua: 99, part: 0.3 }
        ],
        travail: [
          { jusqua: 20, part: 0.6 }, { jusqua: 35, part: 1 },
          { jusqua: 45, part: 0.75 }, { jusqua: 55, part: 0.45 },
          { jusqua: 99, part: 0.2 }
        ],
        tourisme: [{ jusqua: 99, part: 1 }]
      },
      conseil: {
        etude: "Au-delà de 30 ans, un projet d'études doit être solidement " +
               "justifié : expliquez en quoi il prolonge votre parcours.",
        travail: "Les systèmes à points favorisent les moins de 35 ans. " +
                 "Compensez par l'expérience et une offre d'emploi ferme."
      }
    },
    {
      id: 'diplome',
      libelle: 'Niveau d\'études',
      motifs: ['etude', 'travail'],
      poids: { etude: 14, travail: 16 },
      question: 'Quel est votre diplôme le plus élevé ?',
      type: 'choix',
      options: [
        { v: 'aucun', l: 'Aucun diplôme', part: 0.1 },
        { v: 'bac', l: 'Baccalauréat', part: 0.45 },
        { v: 'bac2', l: 'Bac +2 (BTS, DUT…)', part: 0.65 },
        { v: 'licence', l: 'Licence (Bac +3)', part: 0.8 },
        { v: 'master', l: 'Master (Bac +5)', part: 1 },
        { v: 'doctorat', l: 'Doctorat', part: 1 }
      ],
      conseil: {
        etude: "Un niveau d'études plus élevé renforce la crédibilité du projet.",
        travail: "Faites évaluer votre diplôme par l'organisme du pays visé : " +
                 "un diplôme reconnu vaut davantage qu'un diplôme équivalent."
      }
    },
    {
      id: 'langue',
      libelle: 'Niveau de langue',
      motifs: ['etude', 'travail'],
      poids: { etude: 18, travail: 16 },
      question: 'Votre niveau dans la langue du pays visé',
      type: 'choix',
      options: [
        { v: 'debutant', l: 'Débutant, aucun test passé', part: 0.1 },
        { v: 'intermediaire', l: 'Intermédiaire, sans test officiel', part: 0.4 },
        { v: 'test_moyen', l: 'Test officiel, score moyen (B1/B2)', part: 0.75 },
        { v: 'test_bon', l: 'Test officiel, bon score (C1/C2)', part: 1 },
        { v: 'natif', l: 'Langue maternelle ou scolarisation dans cette langue', part: 1 }
      ],
      conseil: {
        etude: "Un test officiel (TCF, TEF, IELTS, TOEFL, TestDaF) change " +
               "beaucoup le poids du dossier. C'est souvent le levier le plus rapide.",
        travail: "Sans test officiel, la plupart des systèmes à points " +
                 "n'accordent aucun point pour la langue."
      }
    },
    {
      id: 'experience',
      libelle: 'Expérience professionnelle',
      motifs: ['travail'],
      poids: { travail: 18 },
      question: 'Années d\'expérience dans votre métier',
      type: 'nombre', min: 0, max: 50, suffixe: 'ans', placeholder: 'Ex. 5',
      paliers: {
        travail: [
          { jusqua: 0, part: 0 }, { jusqua: 1, part: 0.25 },
          { jusqua: 3, part: 0.55 }, { jusqua: 5, part: 0.8 },
          { jusqua: 99, part: 1 }
        ]
      },
      conseil: {
        travail: "Rassemblez des attestations d'employeur datées et signées : " +
                 "une expérience non prouvée n'est pas comptée."
      }
    },
    {
      id: 'admission',
      libelle: 'Admission dans un établissement',
      motifs: ['etude'],
      poids: { etude: 22 },
      question: 'Où en êtes-vous de votre inscription ?',
      type: 'choix',
      options: [
        { v: 'rien', l: 'Aucune démarche entamée', part: 0 },
        { v: 'candidature', l: 'Candidatures envoyées, sans réponse', part: 0.35 },
        { v: 'conditionnelle', l: 'Admission conditionnelle reçue', part: 0.7 },
        { v: 'definitive', l: 'Lettre d\'acceptation définitive', part: 1 }
      ],
      conseil: {
        etude: "C'est le point le plus lourd du dossier : sans lettre " +
               "d'acceptation d'un établissement reconnu, aucune demande de " +
               "visa études n'aboutit."
      }
    },
    {
      id: 'offre',
      libelle: 'Offre d\'emploi',
      motifs: ['travail'],
      poids: { travail: 25 },
      question: 'Avez-vous une offre d\'emploi dans ce pays ?',
      type: 'choix',
      options: [
        { v: 'rien', l: 'Aucune, je cherche encore', part: 0 },
        { v: 'entretiens', l: 'Entretiens en cours', part: 0.3 },
        { v: 'promesse', l: 'Promesse d\'embauche non signée', part: 0.6 },
        { v: 'contrat', l: 'Contrat signé', part: 0.9 },
        { v: 'contrat_permis', l: 'Contrat signé et employeur agréé pour le permis', part: 1 }
      ],
      conseil: {
        travail: "Sans employeur, visez d'abord un visa de recherche d'emploi " +
                 "quand le pays en propose un, ou un programme à points " +
                 "sans offre préalable comme Entrée Express."
      }
    },
    {
      id: 'attaches',
      libelle: 'Attaches au Cameroun',
      motifs: ['tourisme'],
      poids: { tourisme: 26 },
      question: 'Qu\'est-ce qui prouve que vous rentrerez ?',
      type: 'multi',
      options: [
        { v: 'emploi', l: 'Emploi stable ou entreprise', part: 0.35 },
        { v: 'famille', l: 'Conjoint ou enfants au pays', part: 0.3 },
        { v: 'biens', l: 'Bien immobilier ou terrain', part: 0.2 },
        { v: 'etudes', l: 'Études en cours', part: 0.15 }
      ],
      conseil: {
        tourisme: "C'est le premier motif de refus d'un visa touristique. " +
                  "Le consulat cherche la preuve que vous avez de bonnes " +
                  "raisons de rentrer : bulletins de salaire, titre de " +
                  "propriété, acte de mariage."
      }
    },
    {
      id: 'hebergement',
      libelle: 'Hébergement sur place',
      motifs: ['tourisme'],
      poids: { tourisme: 12 },
      question: 'Où logerez-vous ?',
      type: 'choix',
      options: [
        { v: 'rien', l: 'Rien de prévu', part: 0 },
        { v: 'reservation', l: 'Réservation d\'hôtel', part: 0.7 },
        { v: 'invitation', l: 'Attestation d\'accueil ou invitation', part: 1 }
      ],
      conseil: {
        tourisme: "Une attestation d'accueil signée par un résident, ou des " +
                  "réservations couvrant tout le séjour, sont attendues."
      }
    },
    {
      id: 'duree',
      libelle: 'Durée du séjour',
      motifs: ['tourisme'],
      poids: { tourisme: 8 },
      question: 'Combien de jours comptez-vous rester ?',
      type: 'nombre', min: 1, max: 180, suffixe: 'jours', placeholder: 'Ex. 15',
      paliers: {
        tourisme: [
          { jusqua: 21, part: 1 }, { jusqua: 45, part: 0.75 },
          { jusqua: 90, part: 0.45 }, { jusqua: 999, part: 0.2 }
        ]
      },
      conseil: {
        tourisme: "Un séjour court et daté rassure. Une demande de trois mois " +
                  "sans justification appelle des questions."
      }
    },
    {
      id: 'fonds',
      libelle: 'Ressources financières',
      motifs: ['etude', 'travail', 'tourisme'],
      poids: { etude: 22, travail: 7, tourisme: 24 },
      question: 'De quelle somme disposez-vous (vous ou votre garant) ?',
      type: 'argent', placeholder: 'Montant en FCFA',
      // Comparé au seuil du pays : voir noterFonds()
      conseil: {
        etude: "Les fonds doivent être disponibles et traçables depuis " +
               "plusieurs mois. Un versement récent et important attire l'attention.",
        travail: "Prévoyez de quoi vivre le temps de percevoir votre premier salaire.",
        tourisme: "Comptez le voyage, l'hébergement et la vie sur place, " +
                  "avec une marge."
      }
    },
    {
      id: 'voyages',
      libelle: 'Historique de voyage',
      motifs: ['etude', 'tourisme'],
      poids: { etude: 6, tourisme: 18 },
      question: 'Avez-vous déjà voyagé hors d\'Afrique centrale ?',
      type: 'choix',
      options: [
        { v: 'jamais', l: 'Jamais', part: 0.25 },
        { v: 'afrique', l: 'Oui, en Afrique seulement', part: 0.5 },
        { v: 'un', l: 'Oui, un séjour en Europe / Amérique / Asie', part: 0.85 },
        { v: 'plusieurs', l: 'Oui, plusieurs séjours, tous respectés', part: 1 }
      ],
      conseil: {
        tourisme: "Un premier voyage n'est pas rédhibitoire, mais un historique " +
                  "de séjours respectés rassure beaucoup. Commencer par une " +
                  "destination moins exigeante peut être une stratégie."
      }
    },
    {
      id: 'refus',
      libelle: 'Antécédents de visa',
      motifs: ['etude', 'travail', 'tourisme'],
      poids: { etude: 8, travail: 8, tourisme: 12 },
      question: 'Avez-vous déjà essuyé un refus de visa ?',
      type: 'choix',
      options: [
        { v: 'non', l: 'Non, jamais', part: 1 },
        { v: 'un_ancien', l: 'Un refus, il y a plus de deux ans', part: 0.7 },
        { v: 'un_recent', l: 'Un refus dans les deux dernières années', part: 0.4 },
        { v: 'plusieurs', l: 'Plusieurs refus', part: 0.15 }
      ],
      conseil: {
        etude: "Un refus antérieur n'interdit rien, mais la nouvelle demande " +
               "doit montrer ce qui a changé depuis.",
        travail: "Identifiez le motif exact du refus précédent : il figure sur " +
                 "la notification et doit être traité de front.",
        tourisme: "Ne masquez jamais un refus : une déclaration inexacte pèse " +
                  "plus lourd que le refus lui-même."
      }
    }
  ];

  /* ------------------------------------------------------------------
     Verdicts selon le score obtenu
     ------------------------------------------------------------------ */
  const VERDICTS = [
    { min: 75, cle: 'solide', titre: 'Dossier solide',
      texte: "Votre profil réunit l'essentiel de ce qui est attendu. " +
             "Le travail porte maintenant sur la qualité des pièces justificatives." },
    { min: 55, cle: 'favorable', titre: 'Favorable, avec des réserves',
      texte: "Votre dossier est recevable, mais deux ou trois points le fragilisent. " +
             "Les corriger avant de déposer change nettement vos chances." },
    { min: 35, cle: 'fragile', titre: 'Dossier à renforcer',
      texte: "En l'état, la demande serait risquée. Plusieurs éléments importants " +
             "manquent : mieux vaut les construire avant de déposer." },
    { min: 0, cle: 'insuffisant', titre: 'Insuffisant en l\'état',
      texte: "Les conditions de base ne sont pas réunies pour l'instant. " +
             "Un accompagnement sur plusieurs mois est nécessaire avant d'envisager un dépôt." }
  ];

  return { REVISION, PAYS, MOTIFS, CRITERES, VERDICTS, FCFA_PAR_EURO: 655.957 };
})();
