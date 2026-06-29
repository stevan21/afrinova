/* ===================================================================
   AFRINOVA — Données des pôles (contenu des pages de détail)
   Pour modifier une page : éditez simplement l'entrée correspondante.
   =================================================================== */
window.AFRINOVA_SERVICES = {

  /* ---------------------------------------------------------- BTP */
  btp: {
    name: "BTP",
    color: "#1B2A63",
    tagline: "Bâtiment & Travaux Publics — nous bâtissons des ouvrages durables.",
    icon: '<svg viewBox="0 0 24 24" fill="none"><path d="M3 21h18M6 21V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v16M15 21V9h3a1 1 0 0 1 1 1v11M9 8h3M9 12h3M9 16h3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    intro: [
      "Le pôle BTP d'AFRINOVA conçoit, construit et rénove des ouvrages de qualité, du logement individuel aux infrastructures collectives. Nos équipes pilotent chaque chantier de l'étude jusqu'à la livraison, dans le respect des délais, du budget et des normes en vigueur.",
      "Maçonnerie, gros œuvre, second œuvre, voirie ou réhabilitation : nous mobilisons les bons savoir-faire et un suivi rigoureux pour transformer vos projets en réalisations solides et pérennes."
    ],
    stats: [
      { n: "100%", l: "chantiers suivis" },
      { n: "R+4", l: "jusqu'aux immeubles" },
      { n: "0", l: "compromis sur la qualité" }
    ],
    prestations: [
      { t: "Construction neuve", d: "Maisons, immeubles et bâtiments commerciaux livrés clés en main." },
      { t: "Gros œuvre & second œuvre", d: "Fondations, structures, maçonnerie, finitions et aménagements." },
      { t: "Rénovation & réhabilitation", d: "Remise à neuf, extension et mise aux normes de bâtiments existants." },
      { t: "Génie civil & voirie", d: "Routes, réseaux, assainissement et ouvrages d'aménagement urbain." },
      { t: "Maîtrise d'ouvrage déléguée", d: "Coordination des intervenants, planning et contrôle qualité du chantier." },
      { t: "Étude & devis", d: "Conseil technique, métré et chiffrage détaillé avant travaux." }
    ],
    realisations: [
      { t: "Résidence Les Palmiers", d: "Construction d'un immeuble résidentiel R+4 livré clés en main.", lieu: "Douala", annee: "2024" },
      { t: "Réhabilitation de voirie", d: "Réfection de plusieurs kilomètres de route urbaine et réseaux associés.", lieu: "Yaoundé", annee: "2023" },
      { t: "Villa moderne", d: "Construction d'une villa contemporaine avec finitions haut de gamme.", lieu: "Obili, Yaoundé", annee: "2024" },
      { t: "Bâtiment commercial", d: "Édification d'un local commercial avec aménagement intérieur complet.", lieu: "Douala", annee: "2022" }
    ],
    atouts: ["Respect des délais", "Devis transparent", "Matériaux de qualité", "Suivi de chantier rigoureux"]
  },

  /* ------------------------------------------------- Informatique */
  informatique: {
    name: "Informatique",
    color: "#F47920",
    tagline: "Développement, infrastructure et transformation digitale sur mesure.",
    icon: '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="12" rx="1.5" stroke="currentColor" stroke-width="1.6"/><path d="M8 20h8M9.5 9l-2 2 2 2M14.5 9l2 2-2 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    intro: [
      "Le pôle Informatique accompagne entreprises et institutions dans leur transformation numérique : sites web, applications mobiles, logiciels de gestion, infrastructure réseau et cybersécurité. Nous concevons des solutions sur mesure, fiables et faciles à utiliser.",
      "De l'idée au déploiement, nos développeurs et ingénieurs vous accompagnent avec des technologies modernes et un vrai sens du résultat."
    ],
    stats: [
      { n: "Web", l: "& mobile" },
      { n: "24/7", l: "supervision possible" },
      { n: "100%", l: "sur mesure" }
    ],
    prestations: [
      { t: "Sites web & e-commerce", d: "Sites vitrines, boutiques en ligne et paiement mobile intégré." },
      { t: "Applications mobiles", d: "Applications Android & iOS performantes et intuitives." },
      { t: "Logiciels de gestion (ERP)", d: "Outils sur mesure : commercial, stock, facturation, RH." },
      { t: "Infrastructure & réseau", d: "Installation, câblage, serveurs et solutions cloud." },
      { t: "Cybersécurité", d: "Audit, protection des données et sauvegarde sécurisée." },
      { t: "Maintenance & support", d: "Assistance technique et suivi continu de vos systèmes." }
    ],
    realisations: [
      { t: "Plateforme e-commerce", d: "Site marchand avec paiement mobile et tableau de bord de gestion.", lieu: "Web", annee: "2024" },
      { t: "Logiciel de gestion (ERP)", d: "Solution de gestion commerciale et de stock pour une PME.", lieu: "Sur mesure", annee: "2023" },
      { t: "Application mobile de suivi", d: "App de suivi d'activité avec notifications et tableau de bord.", lieu: "Mobile", annee: "2024" },
      { t: "Refonte de site institutionnel", d: "Nouveau site responsive avec espace d'administration.", lieu: "Web", annee: "2023" }
    ],
    atouts: ["Technologies modernes", "Solutions évolutives", "Accompagnement de A à Z", "Support réactif"]
  },

  /* ----------------------------------------------- Santé numérique */
  sante: {
    name: "Santé numérique",
    color: "#1AAA5E",
    tagline: "Rendre les soins plus accessibles grâce au numérique.",
    icon: '<svg viewBox="0 0 24 24" fill="none"><rect x="6" y="2.5" width="12" height="19" rx="2.5" stroke="currentColor" stroke-width="1.6"/><path d="M8 12h2l1.2-2.5L13 15l1-3h2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    intro: [
      "Le pôle Santé numérique met la technologie au service du bien-être : téléconsultation, dossier médical dématérialisé et applications de suivi. Nous aidons patients et professionnels de santé à gagner en efficacité et en proximité.",
      "Nos solutions e-santé sont pensées pour être simples, sécurisées et adaptées aux réalités du terrain."
    ],
    stats: [
      { n: "e-santé", l: "solutions dédiées" },
      { n: "24/7", l: "accès aux données" },
      { n: "100%", l: "confidentialité" }
    ],
    prestations: [
      { t: "Téléconsultation", d: "Mise en relation patients-médecins par vidéo et prise de rendez-vous." },
      { t: "Dossier médical digital", d: "Centralisation sécurisée des informations et antécédents du patient." },
      { t: "Applications de suivi", d: "Suivi des traitements, rappels et indicateurs de santé." },
      { t: "Gestion de cabinet/clinique", d: "Agenda, dossiers et facturation pour structures de soins." },
      { t: "Sensibilisation & prévention", d: "Plateformes d'information et de campagnes de santé." }
    ],
    realisations: [
      { t: "Application de téléconsultation", d: "Mise en relation patients-médecins avec dossier médical en ligne.", lieu: "Mobile", annee: "2024" },
      { t: "Plateforme de prise de RDV", d: "Réservation en ligne de consultations pour un centre médical.", lieu: "Web", annee: "2023" },
      { t: "Carnet de santé numérique", d: "Suivi dématérialisé des antécédents et ordonnances.", lieu: "Mobile", annee: "2024" }
    ],
    atouts: ["Données sécurisées", "Interface simple", "Accessible partout", "Adapté au terrain"]
  },

  /* -------------------------------------------------- Immigration */
  immigration: {
    name: "Immigration",
    color: "#6B3FA0",
    tagline: "Votre accompagnement pour étudier, travailler et vous installer à l'étranger.",
    icon: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" stroke="currentColor" stroke-width="1.6"/></svg>',
    intro: [
      "Le pôle Immigration vous accompagne dans toutes vos démarches à l'international : visa, études, travail et installation. Nous vous guidons pas à pas, de la constitution du dossier jusqu'à votre arrivée à destination.",
      "Notre objectif : maximiser vos chances de réussite grâce à un accompagnement personnalisé, sérieux et transparent."
    ],
    stats: [
      { n: "A→Z", l: "accompagnement" },
      { n: "Visa", l: "études & travail" },
      { n: "100%", l: "dossiers suivis" }
    ],
    prestations: [
      { t: "Visa & titres de séjour", d: "Constitution et suivi des dossiers de demande de visa." },
      { t: "Études à l'étranger", d: "Choix d'établissement, inscription et préparation du départ." },
      { t: "Immigration professionnelle", d: "Recherche d'opportunités et démarches de travail à l'étranger." },
      { t: "Préparation du dossier", d: "Vérification des pièces, traduction et lettres de motivation." },
      { t: "Installation & intégration", d: "Conseils logement, formalités et premiers pas sur place." }
    ],
    realisations: [
      { t: "Programme « Études à l'étranger »", d: "Accompagnement de dossiers visa et inscription universitaire.", lieu: "International", annee: "2023" },
      { t: "Dossiers de visa travail", d: "Constitution de dossiers professionnels et suivi des démarches.", lieu: "International", annee: "2024" },
      { t: "Regroupement & installation", d: "Accompagnement complet jusqu'à l'arrivée à destination.", lieu: "International", annee: "2024" }
    ],
    atouts: ["Accompagnement personnalisé", "Dossiers solides", "Transparence totale", "Suivi jusqu'à l'arrivée"]
  },

  /* --------------------------------------------- Échange de devises */
  devises: {
    name: "Échange de devises",
    color: "#1B8A6B",
    tagline: "Change, transfert et services financiers fiables et rapides.",
    icon: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 8h13l-3-3M20 16H7l3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    intro: [
      "Le pôle Échange de devises propose des opérations de change multi-devises, des transferts d'argent et des conseils financiers, avec des taux transparents et une exécution rapide et sécurisée.",
      "Particuliers ou professionnels, nous vous offrons un service de confiance pour toutes vos opérations."
    ],
    stats: [
      { n: "Multi", l: "devises" },
      { n: "Rapide", l: "& sécurisé" },
      { n: "Taux", l: "transparents" }
    ],
    prestations: [
      { t: "Change multi-devises", d: "Achat et vente de devises aux meilleures conditions." },
      { t: "Transfert d'argent", d: "Envoi et réception sécurisés, en local comme à l'international." },
      { t: "Conseil financier", d: "Accompagnement sur vos opérations et la gestion du risque de change." },
      { t: "Solutions pour entreprises", d: "Gestion des paiements et opérations en devises pour professionnels." }
    ],
    realisations: [
      { t: "Ouverture d'un bureau de change", d: "Mise en place d'un point de change multi-devises avec transfert sécurisé.", lieu: "Agence", annee: "2024" },
      { t: "Service de transfert", d: "Déploiement d'un service d'envoi et réception d'argent.", lieu: "Agence", annee: "2023" },
      { t: "Accompagnement entreprise", d: "Gestion des opérations en devises pour une société import-export.", lieu: "Pro", annee: "2024" }
    ],
    atouts: ["Taux transparents", "Transactions sécurisées", "Exécution rapide", "Service de confiance"]
  },

  /* ---------------------------------------------- Location voitures */
  location: {
    name: "Location de voitures",
    color: "#2563C9",
    tagline: "Une flotte entretenue pour tous vos déplacements.",
    icon: '<svg viewBox="0 0 24 24" fill="none"><path d="M3 13l1.5-4.5A2 2 0 0 1 6.4 7h11.2a2 2 0 0 1 1.9 1.5L21 13v5h-2v-2H5v2H3v-5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="7" cy="16" r="1.3" fill="currentColor"/><circle cx="17" cy="16" r="1.3" fill="currentColor"/></svg>',
    intro: [
      "Le pôle Location de voitures met à votre disposition une flotte entretenue pour vos déplacements personnels et professionnels : courte ou longue durée, avec ou sans chauffeur, en ville comme à l'international.",
      "Confort, fiabilité et ponctualité : nous nous occupons de votre mobilité pour que vous puissiez vous concentrer sur l'essentiel."
    ],
    stats: [
      { n: "24/7", l: "réservation" },
      { n: "Chauffeur", l: "sur demande" },
      { n: "Flotte", l: "entretenue" }
    ],
    prestations: [
      { t: "Location courte durée", d: "Véhicules à la journée, au week-end ou à la semaine." },
      { t: "Location longue durée", d: "Solutions au mois pour particuliers et entreprises." },
      { t: "Avec chauffeur", d: "Déplacements professionnels et événements en toute sérénité." },
      { t: "Transfert aéroport", d: "Prise en charge et dépose ponctuelles à l'aéroport." },
      { t: "Service événementiel", d: "Véhicules pour mariages, cérémonies et événements VIP." }
    ],
    realisations: [
      { t: "Service flotte & transferts", d: "Flotte avec chauffeur pour déplacements professionnels et événements.", lieu: "Aéroport", annee: "2024" },
      { t: "Location longue durée PME", d: "Mise à disposition de véhicules au mois pour une entreprise.", lieu: "Yaoundé", annee: "2023" },
      { t: "Prestation événementielle", d: "Véhicules VIP avec chauffeur pour une cérémonie.", lieu: "Douala", annee: "2024" }
    ],
    atouts: ["Véhicules entretenus", "Chauffeurs professionnels", "Ponctualité", "Tarifs adaptés"]
  },

  /* ------------------------------------------------- Multiservices */
  multiservices: {
    name: "Multiservices",
    color: "#243375",
    tagline: "Une réponse unique à vos besoins variés, clés en main.",
    icon: '<svg viewBox="0 0 24 24" fill="none"><circle cx="8" cy="9" r="2.4" stroke="currentColor" stroke-width="1.6"/><circle cx="16" cy="9" r="2.4" stroke="currentColor" stroke-width="1.6"/><path d="M3.5 19c.6-2.6 2.4-4 4.5-4s3.9 1.4 4.5 4M12 19c.6-2.6 2.4-4 4.5-4s3.9 1.4 4.5 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    intro: [
      "Le pôle Multiservices coordonne l'ensemble de nos expertises pour vous offrir des solutions intégrées et clés en main. Un seul interlocuteur, plusieurs métiers : nous orchestrons vos projets, quelle que soit leur nature.",
      "Besoin d'une réponse sur mesure mêlant plusieurs domaines ? Nous construisons la solution qui vous ressemble."
    ],
    stats: [
      { n: "7", l: "pôles coordonnés" },
      { n: "1", l: "seul interlocuteur" },
      { n: "360°", l: "accompagnement" }
    ],
    prestations: [
      { t: "Solutions sur mesure", d: "Des prestations combinées selon vos besoins précis." },
      { t: "Conciergerie professionnelle", d: "Gestion de vos démarches et services du quotidien." },
      { t: "Externalisation", d: "Délégation de tâches et de services à des équipes dédiées." },
      { t: "Coordination de projets", d: "Pilotage de projets mobilisant plusieurs de nos pôles." }
    ],
    realisations: [
      { t: "Projet multi-pôles", d: "Coordination BTP + Informatique pour un client professionnel.", lieu: "Yaoundé", annee: "2024" },
      { t: "Service de conciergerie", d: "Gestion d'un ensemble de démarches pour un particulier.", lieu: "Obili", annee: "2023" },
      { t: "Externalisation de services", d: "Délégation de services support pour une entreprise.", lieu: "Douala", annee: "2024" }
    ],
    atouts: ["Un seul interlocuteur", "Solutions intégrées", "Flexibilité totale", "Gain de temps"]
  }
};
