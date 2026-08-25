"""Contenu métier du référentiel de compétences (familles, définitions, paliers 1-4, matrices emplois).

Ce module ne contient que des données. L'exécution est faite par seed_referentiel.py,
qui appelle l'API `api/skill-referential` (les règles de publication restent côté domaine).
"""

# ---------------------------------------------------------------------------
# Familles : (domaine existant, nom de la famille, description)
# Les codes sont alloués séquentiellement par l'API (FAM-00001, FAM-00002, ...).
# ---------------------------------------------------------------------------
FAMILIES: list[tuple[str, str, str]] = [
    ("Langage de programmation", "Langages back-end", "Langages utilisés pour les services et traitements serveur."),
    ("Langage de programmation", "Langages web", "Langages exécutés dans le navigateur ou côté serveur web."),
    ("Langage de programmation", "Requêtage de données", "Langages d'interrogation des bases de données."),
    ("Frameworks", "Frameworks front-end", "Socles techniques des interfaces web."),
    ("Frameworks", "Frameworks back-end", "Socles techniques des services et applications serveur."),
    ("Développement mobile", "Développement mobile natif", "Développement spécifique à une plateforme mobile."),
    ("Développement mobile", "Développement mobile multiplateforme", "Une base de code pour plusieurs plateformes mobiles."),
    ("Architecture logiciel", "Architecture et conception", "Structuration des applications, des interfaces et des flux."),
    ("Gestion de version", "Gestion de version", "Travail collaboratif sur le code source."),
    ("SQL", "Bases de données relationnelles", "Modélisation et exploitation des bases relationnelles."),
    ("NoSql", "Bases de données NoSQL", "Modélisation et exploitation des bases non relationnelles."),
    ("Conteneurs", "Conteneurisation et orchestration", "Empaquetage et exploitation des applications conteneurisées."),
    ("CI/CD", "Intégration et déploiement continus", "Automatisation des chaînes de construction et de livraison."),
    ("Cloud", "Plateformes cloud", "Exploitation des services d'infrastructure et applicatifs cloud."),
    ("Administration système", "Administration système et réseaux", "Exploitation des serveurs, des services et des réseaux."),
    ("Administration système", "Sécurité des systèmes et des données", "Protection des applications, des systèmes et des données."),
    ("Tests unitaires et fonctionnels", "Tests automatisés", "Outillage d'exécution automatique des tests."),
    ("Tests unitaires et fonctionnels", "Pratiques et méthodes de test", "Démarches de test intégrées au développement."),
    ("Analyse de données", "Manipulation et analyse de données", "Préparation, calcul et exploration des jeux de données."),
    ("Machine Learning", "Apprentissage automatique", "Conception, entraînement et évaluation de modèles."),
    ("Business Intelligence", "Restitution et visualisation", "Mise à disposition d'indicateurs métier."),
    ("Compétences fonctionnelles", "Analyse métier", "Recueil, formalisation et cadrage du besoin."),
    ("Compétences fonctionnelles", "Pilotage et méthodes", "Conduite des travaux, méthodes et normes."),
    ("Compétences comportementales (Soft Skills)", "Relation et communication", "Interaction avec les autres et transmission de l'information."),
    ("Compétences comportementales (Soft Skills)", "Efficacité personnelle", "Organisation de son travail et gestion des aléas."),
    ("Compétences comportementales (Soft Skills)", "Analyse et innovation", "Compréhension des situations et production de solutions."),
]

# ---------------------------------------------------------------------------
# Descripteurs génériques (archétypes) — le texte reste observable et gradué.
# ---------------------------------------------------------------------------
ARCHETYPES: dict[str, list[str]] = {
    "outil": [
        "Connaît le vocabulaire et les principes {de_name}. Produit {objet} simples en partant d'un exemple existant "
        "et fait valider son travail par un collègue plus expérimenté.",
        "Produit {objet} en autonomie sur les cas courants, corrige les anomalies simples et s'appuie sur la "
        "documentation sans sollicitation permanente.",
        "Conçoit {objet} sur des cas complexes, optimise l'existant, relit le travail des autres et fait appliquer "
        "les bonnes pratiques dans l'équipe.",
        "Fait référence sur {name} dans l'organisation : arbitre les choix structurants, traite les incidents "
        "critiques, forme les équipes et fait évoluer les standards internes.",
    ],
    "methode": [
        "Comprend l'intérêt {de_name} et participe à {objet} dans un cadre défini et animé par un tiers.",
        "Met en œuvre {objet} sur son périmètre, en autonomie sur les situations courantes.",
        "Structure {objet} sur des sujets complexes ou transverses, arbitre les écarts et accompagne ses collègues.",
        "Définit les standards {de_name} pour l'organisation, forme les équipes et pilote leur amélioration continue.",
    ],
}


def elide(name: str) -> str:
    """« de Kubernetes » mais « d'Angular » : élision devant une voyelle."""
    first = name.lstrip(".").lstrip()[:1].lower()
    return f"d'{name}" if first in "aeiouéèêî" else f"de {name}"

# ---------------------------------------------------------------------------
# Compétences : nom exact -> définition, famille, catégorie, paliers 1-4
# Deux formes : archétype + objet, ou 4 descripteurs explicites (`levels`).
# ---------------------------------------------------------------------------
SKILLS: dict[str, dict] = {
    # --- Langages -----------------------------------------------------------
    "Javascript": {
        "family": "Langages web",
        "category": "Technical",
        "definition": "Langage de programmation du web, utilisé dans le navigateur et côté serveur pour rendre "
                      "les interfaces et les services interactifs.",
        "archetype": "outil",
        "objet": "des scripts et des composants Javascript",
    },
    "Python": {
        "family": "Langages back-end",
        "category": "Technical",
        "definition": "Langage polyvalent utilisé pour l'automatisation, les traitements de données et les "
                      "services back-end.",
        "archetype": "outil",
        "objet": "des scripts et des modules Python",
    },
    "C#": {
        "family": "Langages back-end",
        "category": "Technical",
        "definition": "Langage objet de la plateforme .NET, utilisé pour les applications métier et les services "
                      "back-end.",
        "archetype": "outil",
        "objet": "des composants et des services C#",
    },
    "Java": {
        "family": "Langages back-end",
        "category": "Technical",
        "definition": "Langage objet utilisé pour les applications d'entreprise et les services back-end à forte "
                      "volumétrie.",
        "archetype": "outil",
        "objet": "des composants et des services Java",
    },
    "Php": {
        "family": "Langages web",
        "category": "Technical",
        "definition": "Langage serveur utilisé pour les applications et les sites web dynamiques.",
        "archetype": "outil",
        "objet": "des pages et des services PHP",
    },
    "Go": {
        "family": "Langages back-end",
        "category": "Technical",
        "definition": "Langage compilé orienté services concurrents et outillage d'infrastructure.",
        "archetype": "outil",
        "objet": "des services et des outils Go",
    },
    "C++": {
        "family": "Langages back-end",
        "category": "Technical",
        "definition": "Langage compilé utilisé pour les traitements exigeants en performance et les composants "
                      "proches du système.",
        "archetype": "outil",
        "objet": "des composants C++",
    },
    "Kotlin": {
        "family": "Développement mobile natif",
        "category": "Technical",
        "definition": "Langage de référence du développement Android, également utilisé côté serveur.",
        "archetype": "outil",
        "objet": "des écrans et des modules Kotlin",
    },
    "Swift": {
        "family": "Développement mobile natif",
        "category": "Technical",
        "definition": "Langage du développement natif iOS et macOS.",
        "archetype": "outil",
        "objet": "des écrans et des modules Swift",
    },
    "SQL": {
        "family": "Bases de données relationnelles",
        "category": "Technical",
        "definition": "Langage d'interrogation et de manipulation des bases de données relationnelles.",
        "archetype": "outil",
        "objet": "des requêtes et des modèles de données",
    },
    # --- Frameworks ---------------------------------------------------------
    "Angular": {
        "family": "Frameworks front-end",
        "category": "Technical",
        "definition": "Framework front-end structurant pour construire des applications web complètes et "
                      "maintenables.",
        "archetype": "outil",
        "objet": "des composants et des services Angular",
    },
    "React": {
        "family": "Frameworks front-end",
        "category": "Technical",
        "definition": "Bibliothèque front-end orientée composants pour construire des interfaces web réactives.",
        "archetype": "outil",
        "objet": "des composants React",
    },
    "Vue.js": {
        "family": "Frameworks front-end",
        "category": "Technical",
        "definition": "Framework front-end progressif pour construire des interfaces web à base de composants.",
        "archetype": "outil",
        "objet": "des composants Vue.js",
    },
    ".NET": {
        "family": "Frameworks back-end",
        "category": "Technical",
        "definition": "Plateforme applicative Microsoft pour développer des services et des applications back-end.",
        "archetype": "outil",
        "objet": "des applications et des services .NET",
    },
    "Spring": {
        "family": "Frameworks back-end",
        "category": "Technical",
        "definition": "Framework Java pour construire des services back-end et des API d'entreprise.",
        "archetype": "outil",
        "objet": "des services Spring",
    },
    "Django": {
        "family": "Frameworks back-end",
        "category": "Technical",
        "definition": "Framework Python pour construire des applications web et des API complètes.",
        "archetype": "outil",
        "objet": "des applications Django",
    },
    "Flutter": {
        "family": "Développement mobile multiplateforme",
        "category": "Technical",
        "definition": "Framework multiplateforme produisant une application mobile unique pour Android et iOS.",
        "archetype": "outil",
        "objet": "des écrans Flutter",
    },
    "React Native": {
        "family": "Développement mobile multiplateforme",
        "category": "Technical",
        "definition": "Framework multiplateforme permettant de développer des applications mobiles en Javascript.",
        "archetype": "outil",
        "objet": "des écrans React Native",
    },
    # --- Architecture -------------------------------------------------------
    "API REST / SOAP": {
        "family": "Architecture et conception",
        "category": "Technical",
        "definition": "Conception et consommation d'interfaces de service permettant à des applications "
                      "d'échanger des données.",
        "archetype": "outil",
        "objet": "des interfaces REST ou SOAP",
    },
    "Conception technique et fonctionnelle": {
        "family": "Architecture et conception",
        "category": "Technical",
        "definition": "Traduction d'un besoin métier en solution : découpage applicatif, flux de données, "
                      "choix techniques et documentation associée.",
        "levels": [
            "Rédige une conception détaillée sur un périmètre restreint, à partir d'un cadre et d'un modèle "
            "fournis par un concepteur plus expérimenté.",
            "Conçoit en autonomie une fonctionnalité complète : découpage, modèle de données, interfaces, et "
            "documente ses choix de façon exploitable par l'équipe.",
            "Conçoit une solution sur un périmètre complexe ou multi-applicatif, argumente les alternatives, "
            "évalue les impacts et fait relire ses choix par les parties prenantes.",
            "Fixe les principes de conception de l'organisation, arbitre les écarts entre applications, "
            "accompagne les concepteurs et garantit la cohérence du système d'information.",
        ],
    },
    # --- Gestion de version -------------------------------------------------
    "Git / gestion de version (GitHub, GitLab)": {
        "family": "Gestion de version",
        "category": "Technical",
        "definition": "Gestion collaborative des versions du code source : branches, revues, fusions et "
                      "historique des modifications.",
        "levels": [
            "Récupère le code, valide ses modifications et pousse sa branche en suivant la procédure de l'équipe.",
            "Gère ses branches en autonomie, résout les conflits simples, soumet des demandes de fusion lisibles "
            "et prend en compte les remarques de revue.",
            "Définit la stratégie de branches d'un projet, mène des revues exigeantes, résout les fusions "
            "complexes et répare un historique dégradé.",
            "Fixe les conventions de contribution de l'organisation, outille et automatise les contrôles, "
            "et forme les équipes aux pratiques de revue.",
        ],
    },
    # --- Conteneurs ---------------------------------------------------------
    "Docker": {
        "family": "Conteneurisation et orchestration",
        "category": "Technical",
        "definition": "Conteneurisation des applications pour obtenir des environnements reproductibles.",
        "archetype": "outil",
        "objet": "des images et des conteneurs",
    },
    "Kubernetes": {
        "family": "Conteneurisation et orchestration",
        "category": "Technical",
        "definition": "Orchestration de conteneurs pour déployer et exploiter des applications à l'échelle.",
        "archetype": "outil",
        "objet": "des déploiements Kubernetes",
    },
    # --- CI/CD --------------------------------------------------------------
    "Jenkins": {
        "family": "Intégration et déploiement continus",
        "category": "Technical",
        "definition": "Automatisation des chaînes de construction, de test et de déploiement avec Jenkins.",
        "archetype": "outil",
        "objet": "des pipelines Jenkins",
    },
    "GitLab CI": {
        "family": "Intégration et déploiement continus",
        "category": "Technical",
        "definition": "Automatisation des chaînes d'intégration et de déploiement dans GitLab.",
        "archetype": "outil",
        "objet": "des pipelines GitLab CI",
    },
    "Github Actions": {
        "family": "Intégration et déploiement continus",
        "category": "Technical",
        "definition": "Automatisation des chaînes d'intégration et de déploiement dans GitHub.",
        "archetype": "outil",
        "objet": "des workflows GitHub Actions",
    },
    # --- Cloud --------------------------------------------------------------
    "AWS": {
        "family": "Plateformes cloud",
        "category": "Technical",
        "definition": "Exploitation des services d'infrastructure et applicatifs d'Amazon Web Services.",
        "archetype": "outil",
        "objet": "des ressources AWS",
    },
    "Azure": {
        "family": "Plateformes cloud",
        "category": "Technical",
        "definition": "Exploitation des services d'infrastructure et applicatifs de Microsoft Azure.",
        "archetype": "outil",
        "objet": "des ressources Azure",
    },
    "Google cloud": {
        "family": "Plateformes cloud",
        "category": "Technical",
        "definition": "Exploitation des services d'infrastructure et applicatifs de Google Cloud Platform.",
        "archetype": "outil",
        "objet": "des ressources Google Cloud",
    },
    # --- Administration & sécurité -----------------------------------------
    "Administration système": {
        "family": "Administration système et réseaux",
        "category": "Technical",
        "definition": "Installation, exploitation et maintien en conditions opérationnelles des serveurs et "
                      "des services.",
        "levels": [
            "Réalise les opérations courantes d'exploitation en suivant une procédure écrite et escalade les "
            "situations non prévues.",
            "Installe et configure un serveur ou un service en autonomie, diagnostique les incidents courants "
            "et applique les correctifs.",
            "Conçoit l'architecture d'exploitation d'un service, industrialise les installations et traite les "
            "incidents complexes en production.",
            "Définit les standards d'exploitation de l'organisation, arbitre les choix d'infrastructure et "
            "pilote la remise en service lors des incidents majeurs.",
        ],
    },
    "Sécurité des applications web (OWASP, SSL, authentification)": {
        "family": "Sécurité des systèmes et des données",
        "category": "Technical",
        "definition": "Protection des applications web : authentification, chiffrement des échanges et "
                      "traitement des vulnérabilités courantes du référentiel OWASP.",
        "levels": [
            "Connaît les vulnérabilités web les plus courantes et applique les règles de sécurité imposées par "
            "l'équipe (mots de passe, HTTPS, validation des entrées).",
            "Développe des fonctionnalités sans introduire de faille courante, met en place l'authentification "
            "et corrige les vulnérabilités simples remontées par les outils.",
            "Analyse la surface d'attaque d'une application, conçoit les mécanismes d'authentification et "
            "d'autorisation, et corrige des vulnérabilités complexes.",
            "Définit les exigences de sécurité applicative de l'organisation, arbitre les risques résiduels et "
            "accompagne les équipes lors des incidents de sécurité.",
        ],
    },
    "Protection des données (RGPD, chiffrement)": {
        "family": "Sécurité des systèmes et des données",
        "category": "Technical",
        "definition": "Mise en conformité du traitement des données personnelles et protection technique des "
                      "données sensibles.",
        "levels": [
            "Identifie les données personnelles qu'il manipule et respecte les consignes de confidentialité et "
            "de conservation.",
            "Applique les règles de protection dans son travail : minimisation, chiffrement, gestion des accès, "
            "et signale les traitements à risque.",
            "Instruit un traitement de bout en bout : base légale, durée, mesures techniques, et corrige les "
            "écarts constatés sur son périmètre.",
            "Définit la politique de protection des données de l'organisation, instruit les demandes des "
            "personnes concernées et pilote la réponse aux violations de données.",
        ],
    },
    "Tests de vulnérabilité et audits": {
        "family": "Sécurité des systèmes et des données",
        "category": "Technical",
        "definition": "Recherche de vulnérabilités et conduite d'audits de sécurité sur les systèmes et les "
                      "applications.",
        "levels": [
            "Exécute un scan de vulnérabilités outillé et restitue les résultats bruts.",
            "Conduit un test sur un périmètre délimité, qualifie les faux positifs et propose des correctifs "
            "priorisés.",
            "Conçoit et mène un audit complet, exploite des vulnérabilités enchaînées et rédige un rapport "
            "exploitable par les équipes techniques et le management.",
            "Définit la stratégie de tests de sécurité de l'organisation, encadre les prestataires et arbitre "
            "les priorités de remédiation.",
        ],
    },
    # --- Tests --------------------------------------------------------------
    "JUnit": {
        "family": "Tests automatisés",
        "category": "Technical",
        "definition": "Écriture de tests unitaires automatisés pour le code Java.",
        "archetype": "outil",
        "objet": "des tests JUnit",
    },
    "Jest": {
        "family": "Tests automatisés",
        "category": "Technical",
        "definition": "Écriture de tests unitaires automatisés pour le code Javascript et TypeScript.",
        "archetype": "outil",
        "objet": "des tests Jest",
    },
    "Selenium": {
        "family": "Tests automatisés",
        "category": "Technical",
        "definition": "Automatisation des tests fonctionnels d'interface web.",
        "archetype": "outil",
        "objet": "des scénarios Selenium",
    },
    "Automatisation des tests": {
        "family": "Tests automatisés",
        "category": "Technical",
        "definition": "Industrialisation des tests : couverture, exécution automatique et intégration dans la "
                      "chaîne de livraison.",
        "levels": [
            "Exécute une campagne de tests automatisés existante et rend compte des échecs.",
            "Écrit et maintient des tests automatisés sur son périmètre et les intègre à la chaîne "
            "d'intégration continue.",
            "Définit la stratégie de test d'un projet : niveaux de test, couverture attendue, jeux de données, "
            "et réduit le temps d'exécution.",
            "Fixe la stratégie de test de l'organisation, outille les équipes et arbitre l'effort "
            "d'automatisation au regard du risque.",
        ],
    },
    "Méthodologies : TDD, BDD": {
        "family": "Pratiques et méthodes de test",
        "category": "Technical",
        "definition": "Développement piloté par les tests (TDD) et par le comportement (BDD) pour sécuriser "
                      "les évolutions.",
        "archetype": "methode",
        "objet": "des cycles de développement pilotés par les tests",
    },
    # --- Données & ML -------------------------------------------------------
    "Pandas": {
        "family": "Manipulation et analyse de données",
        "category": "Technical",
        "definition": "Manipulation, nettoyage et agrégation de jeux de données tabulaires en Python.",
        "archetype": "outil",
        "objet": "des traitements de données avec Pandas",
    },
    "NumPy": {
        "family": "Manipulation et analyse de données",
        "category": "Technical",
        "definition": "Calcul numérique et manipulation de tableaux performants en Python.",
        "archetype": "outil",
        "objet": "des calculs vectoriels NumPy",
    },
    "scikit-learn": {
        "family": "Apprentissage automatique",
        "category": "Technical",
        "definition": "Construction et évaluation de modèles d'apprentissage automatique classiques.",
        "archetype": "outil",
        "objet": "des modèles scikit-learn",
    },
    "TensorFlow": {
        "family": "Apprentissage automatique",
        "category": "Technical",
        "definition": "Construction et entraînement de modèles d'apprentissage profond avec TensorFlow.",
        "archetype": "outil",
        "objet": "des modèles TensorFlow",
    },
    "PyTorch": {
        "family": "Apprentissage automatique",
        "category": "Technical",
        "definition": "Construction et entraînement de modèles d'apprentissage profond avec PyTorch.",
        "archetype": "outil",
        "objet": "des modèles PyTorch",
    },
    # --- BI -----------------------------------------------------------------
    "Power BI": {
        "family": "Restitution et visualisation",
        "category": "Technical",
        "definition": "Modélisation et restitution d'indicateurs métier sous forme de rapports et de tableaux "
                      "de bord Power BI.",
        "archetype": "outil",
        "objet": "des rapports Power BI",
    },
    "Tableau": {
        "family": "Restitution et visualisation",
        "category": "Technical",
        "definition": "Modélisation et restitution d'indicateurs métier sous forme de visualisations Tableau.",
        "archetype": "outil",
        "objet": "des visualisations Tableau",
    },
    # --- Fonctionnel --------------------------------------------------------
    "Analyse des besoins métier": {
        "family": "Analyse métier",
        "category": "Transversal",
        "definition": "Recueil, questionnement et formalisation du besoin d'un métier pour le rendre "
                      "exploitable par une équipe de réalisation.",
        "levels": [
            "Recueille un besoin exprimé et le restitue fidèlement à l'écrit, avec l'appui d'un analyste plus "
            "expérimenté.",
            "Conduit un entretien de recueil, distingue le besoin de la solution et formalise des règles de "
            "gestion vérifiables sur un périmètre délimité.",
            "Cadre un besoin complexe ou contradictoire, met en évidence les impacts sur les processus et "
            "arbitre les priorités avec le métier.",
            "Structure la démarche d'analyse de l'organisation, arbitre les besoins entre directions et "
            "professionnalise les analystes.",
        ],
    },
    "Rédaction de cahiers des charges": {
        "family": "Analyse métier",
        "category": "Transversal",
        "definition": "Formalisation écrite des exigences fonctionnelles, techniques et contractuelles d'un "
                      "projet ou d'un lot.",
        "levels": [
            "Complète un cahier des charges existant en suivant un modèle et un plan imposés.",
            "Rédige un cahier des charges sur un périmètre délimité : exigences, critères d'acceptation, "
            "contraintes, sans ambiguïté pour le lecteur.",
            "Rédige un cahier des charges structurant, tient la traçabilité des exigences et l'utilise comme "
            "référence lors des recettes et des négociations.",
            "Définit les standards documentaires de l'organisation, relit les documents structurants et "
            "sécurise leur dimension contractuelle.",
        ],
    },
    "Méthodes agiles (Scrum, Kanban)": {
        "family": "Pilotage et méthodes",
        "category": "Transversal",
        "definition": "Organisation du travail en cycles courts avec Scrum ou Kanban : rituels, priorisation "
                      "et amélioration continue.",
        "levels": [
            "Participe aux rituels et tient son tableau à jour dans un cadre animé par un tiers.",
            "Travaille en autonomie dans le cadre agile : découpage de ses tâches, engagement d'itération, "
            "respect du flux et remontée des obstacles.",
            "Anime les rituels d'une équipe, fait émerger les blocages, ajuste le flux et fait progresser la "
            "prévisibilité des livraisons.",
            "Diffuse la pratique agile au-delà de l'équipe, accompagne les managers et adapte le cadre aux "
            "contraintes de l'organisation.",
        ],
    },
    "Gestion de projet (Jira, Trello, MS Project)": {
        "family": "Pilotage et méthodes",
        "category": "Managerial",
        "definition": "Pilotage d'un projet : périmètre, planning, charge, risques et communication aux parties "
                      "prenantes, outillé par Jira, Trello ou MS Project.",
        "levels": [
            "Tient à jour l'avancement de ses tâches dans l'outil et alerte sur ses propres retards.",
            "Pilote un lot ou un petit projet : planning, charge, suivi des risques et reporting régulier.",
            "Pilote un projet complet avec plusieurs contributeurs : arbitrages de périmètre, gestion des "
            "risques, tenue des engagements et communication au commanditaire.",
            "Pilote un portefeuille de projets, arbitre les ressources entre projets et installe les pratiques "
            "de pilotage de l'organisation.",
        ],
    },
    "Respect des normes et standards (ISO, ITIL, etc.)": {
        "family": "Pilotage et méthodes",
        "category": "Transversal",
        "definition": "Application des normes, référentiels et procédures internes applicables à l'activité "
                      "(qualité, exploitation, sécurité).",
        "levels": [
            "Connaît les procédures applicables à son poste et les applique lorsqu'elles lui sont rappelées.",
            "Applique les procédures de façon systématique, produit les traces attendues et signale les écarts "
            "qu'il constate.",
            "Décline une norme en procédures utilisables par l'équipe, contrôle leur application et traite les "
            "non-conformités.",
            "Porte le référentiel au niveau de l'organisation, prépare les audits et pilote les plans d'action "
            "de mise en conformité.",
        ],
    },
    "Veille technologique": {
        "family": "Pilotage et méthodes",
        "category": "Transversal",
        "definition": "Suivi organisé des évolutions techniques du domaine et restitution de ce qui est utile "
                      "à l'organisation.",
        "levels": [
            "Se tient informé des évolutions de son périmètre lorsqu'on lui indique les sources.",
            "Organise sa veille, teste les nouveautés pertinentes et en informe son équipe.",
            "Structure la veille d'une équipe, évalue les technologies au regard des besoins réels et "
            "argumente une recommandation d'adoption.",
            "Pilote la veille de l'organisation, éclaire les décisions d'investissement technique et anime les "
            "communautés internes.",
        ],
    },
    # --- Comportemental -----------------------------------------------------
    "Travail en équipe": {
        "family": "Relation et communication",
        "category": "Behavioral",
        "definition": "Contribution effective au résultat collectif : partage d'information, entraide et "
                      "respect des engagements pris envers les autres.",
        "levels": [
            "Réalise sa part du travail et informe l'équipe de son avancement lorsqu'on le lui demande.",
            "Partage spontanément l'information utile, tient ses engagements envers les autres et demande ou "
            "propose de l'aide au bon moment.",
            "Fait avancer le collectif : facilite la coordination, désamorce les tensions et intègre les "
            "nouveaux arrivants.",
            "Crée les conditions de la coopération entre équipes ou entités, arbitre les intérêts divergents "
            "et sert de référence en matière de comportement collectif.",
        ],
    },
    "Communication claire et efficace": {
        "family": "Relation et communication",
        "category": "Behavioral",
        "definition": "Transmission d'un message compris du premier coup, à l'oral comme à l'écrit, en "
                      "s'adaptant à l'interlocuteur.",
        "levels": [
            "Transmet une information factuelle simple ; son écrit est compréhensible après reformulation.",
            "Structure son message, l'adapte à un interlocuteur technique ou métier et vérifie qu'il a été "
            "compris.",
            "Explique un sujet complexe à un public non spécialiste, argumente une position et conduit une "
            "réunion sensible sans perdre son auditoire.",
            "Porte le discours de l'organisation devant des instances ou des tiers, sert de référence "
            "rédactionnelle et forme les autres à la clarté.",
        ],
    },
    "Capacité d’adaptation": {
        "family": "Efficacité personnelle",
        "category": "Behavioral",
        "definition": "Maintien de son efficacité lorsque le contexte, les priorités ou les outils changent.",
        "levels": [
            "Accepte un changement de consigne et reprend son travail après explication du nouveau cadre.",
            "Se réorganise seul face à un imprévu courant et reste opérationnel sur un nouvel outil ou un "
            "nouveau processus.",
            "Reste efficace dans un contexte instable, aide les autres à absorber le changement et propose des "
            "ajustements d'organisation.",
            "Conduit le changement pour un collectif : anticipe les impacts, lève les résistances et maintient "
            "le niveau de service pendant la transition.",
        ],
    },
    "Résolution de problèmes": {
        "family": "Analyse et innovation",
        "category": "Behavioral",
        "definition": "Traitement d'une difficulté jusqu'à sa résolution durable : diagnostic, options, "
                      "décision et vérification.",
        "levels": [
            "Signale le problème avec les éléments factuels et applique la solution qu'on lui indique.",
            "Diagnostique et résout seul les problèmes courants de son périmètre, et vérifie que la solution "
            "tient.",
            "Traite des problèmes complexes ou récurrents : remonte à la cause racine, compare les options et "
            "supprime la cause plutôt que le symptôme.",
            "Prend en charge les situations critiques et transverses, structure la démarche de résolution et "
            "capitalise pour éviter la réapparition.",
        ],
    },
    "Autonomie": {
        "family": "Efficacité personnelle",
        "category": "Behavioral",
        "definition": "Capacité à produire le résultat attendu sans supervision rapprochée, en sachant quand "
                      "solliciter un appui.",
        "levels": [
            "Avance sur des tâches cadrées avec des points de contrôle rapprochés.",
            "Prend en charge une activité courante de bout en bout, organise son travail et rend compte sans "
            "qu'on le lui demande.",
            "Prend en charge un périmètre complet dans un cadre peu défini, prend les décisions de son niveau "
            "et escalade à bon escient.",
            "Prend en charge des sujets nouveaux ou ambigus, définit lui-même le cadre de travail et sécurise "
            "l'autonomie des autres.",
        ],
    },
    "Esprit d’analyse": {
        "family": "Analyse et innovation",
        "category": "Behavioral",
        "definition": "Décomposition d'une situation ou d'un jeu d'informations pour en tirer des conclusions "
                      "fondées.",
        "levels": [
            "Rassemble les informations demandées et les restitue de façon ordonnée.",
            "Distingue les faits des interprétations, identifie les éléments déterminants d'une situation "
            "courante et en tire une conclusion argumentée.",
            "Analyse une situation complexe aux données incomplètes ou contradictoires, met en évidence les "
            "corrélations et quantifie les impacts.",
            "Éclaire des décisions structurantes par son analyse, contredit les évidences avec méthode et "
            "élève le niveau d'exigence analytique du collectif.",
        ],
    },
    "Esprit critique": {
        "family": "Analyse et innovation",
        "category": "Behavioral",
        "definition": "Mise à l'épreuve des informations, des solutions et de ses propres conclusions avant de "
                      "décider.",
        "levels": [
            "Pose des questions lorsqu'une consigne ou une information lui paraît incohérente.",
            "Vérifie ses sources, teste ses hypothèses et exprime un désaccord argumenté sur son périmètre.",
            "Challenge une solution ou une décision devant un collectif, en distinguant les faits, les "
            "hypothèses et les partis pris.",
            "Instaure une culture d'examen contradictoire : sait remettre en cause un choix engagé et faire "
            "changer une décision sur la base d'arguments.",
        ],
    },
    "Créativité": {
        "family": "Analyse et innovation",
        "category": "Behavioral",
        "definition": "Production de solutions nouvelles et utiles là où les réponses habituelles ne "
                      "fonctionnent pas.",
        "levels": [
            "Contribue à une recherche d'idées lorsqu'elle est animée par un tiers.",
            "Propose des améliorations concrètes sur son périmètre et sort du mode opératoire habituel quand "
            "il ne suffit plus.",
            "Fait émerger des solutions inédites sur des problèmes ouverts, les prototype et les fait accepter.",
            "Installe les conditions de l'innovation dans le collectif : cadre les expérimentations, accepte "
            "l'échec et transforme les idées en réalisations.",
        ],
    },
    "Gestion du stress et des priorités": {
        "family": "Efficacité personnelle",
        "category": "Behavioral",
        "definition": "Maintien de la qualité du travail et de la relation sous charge, avec un ordre de "
                      "priorité assumé.",
        "levels": [
            "Signale une surcharge et suit les priorités fixées par son responsable.",
            "Hiérarchise ses tâches seul, tient ses délais sur une charge normale et reste maître de lui en "
            "situation tendue.",
            "Arbitre des priorités contradictoires, protège son équipe des injonctions dispersées et garde une "
            "posture stable en situation dégradée.",
            "Pilote une situation de crise : fixe le cap, sécurise les priorités de plusieurs équipes et "
            "maintient un climat de travail tenable.",
        ],
    },
    "Curiosité technologique": {
        "family": "Analyse et innovation",
        "category": "Behavioral",
        "definition": "Intérêt actif pour les techniques nouvelles et capacité à les apprendre par soi-même.",
        "levels": [
            "Suit les formations proposées et s'informe des nouveautés qu'on lui signale.",
            "Explore de sa propre initiative les technologies utiles à son travail et les met en pratique.",
            "Évalue une technologie nouvelle avec méthode, en mesure l'apport réel et partage ses "
            "enseignements avec l'équipe.",
            "Repère les ruptures technologiques utiles à l'organisation, entraîne les autres dans la montée en "
            "compétence et sécurise les choix d'adoption.",
        ],
    },
}

# ---------------------------------------------------------------------------
# Matrices emplois-compétences : poste -> [(compétence, exigence, niveau attendu)]
# Exigence : C = Critical, R = Required, D = Desired
# ---------------------------------------------------------------------------
BASELINE = [
    ("Travail en équipe", "R", 2),
    ("Communication claire et efficace", "R", 2),
    ("Autonomie", "R", 2),
]

POSITION_PACKS: dict[str, list[tuple[str, str, int]]] = {
    "Développeur Front-end": [
        ("Javascript", "C", 3), ("Angular", "C", 3), ("React", "R", 2),
        ("Git / gestion de version (GitHub, GitLab)", "C", 3), ("API REST / SOAP", "R", 2),
        ("Jest", "R", 2), ("Méthodes agiles (Scrum, Kanban)", "R", 2),
        ("Résolution de problèmes", "R", 3), ("Curiosité technologique", "D", 2),
    ],
    "Développeur Back-end": [
        ("Java", "C", 3), ("C#", "R", 3), ("SQL", "C", 3), ("API REST / SOAP", "C", 3),
        ("Spring", "R", 2), ("Git / gestion de version (GitHub, GitLab)", "C", 3),
        ("Docker", "R", 2), ("JUnit", "R", 2),
        ("Sécurité des applications web (OWASP, SSL, authentification)", "R", 2),
        ("Méthodes agiles (Scrum, Kanban)", "R", 2), ("Esprit d’analyse", "R", 3),
    ],
    "Développeur Full-stack": [
        ("Javascript", "C", 3), ("Angular", "R", 3), ("C#", "C", 3), ("SQL", "R", 3),
        ("API REST / SOAP", "C", 3), ("Git / gestion de version (GitHub, GitLab)", "C", 3),
        ("Docker", "R", 2), ("Méthodes agiles (Scrum, Kanban)", "R", 2),
        ("Résolution de problèmes", "R", 3),
    ],
    "Développeur Mobile (iOS / Android)": [
        ("Kotlin", "C", 3), ("Swift", "R", 2), ("Flutter", "R", 3), ("React Native", "D", 2),
        ("Git / gestion de version (GitHub, GitLab)", "C", 3), ("API REST / SOAP", "R", 2),
    ],
    "Intégrateur Web": [
        ("Javascript", "C", 2), ("React", "R", 2), ("Vue.js", "D", 2),
        ("Git / gestion de version (GitHub, GitLab)", "R", 2),
    ],
    "Ingénieur logiciel": [
        ("Java", "C", 3), ("C#", "R", 3), ("Conception technique et fonctionnelle", "C", 3),
        ("SQL", "R", 3), ("Git / gestion de version (GitHub, GitLab)", "C", 3),
        ("Méthodologies : TDD, BDD", "R", 2), ("Docker", "R", 2),
    ],
    "Lead développeur": [
        ("Conception technique et fonctionnelle", "C", 3),
        ("Git / gestion de version (GitHub, GitLab)", "C", 3),
        ("Méthodes agiles (Scrum, Kanban)", "C", 3),
        ("Gestion de projet (Jira, Trello, MS Project)", "R", 3),
        ("Javascript", "R", 3), ("C#", "R", 3),
        ("Travail en équipe", "C", 3), ("Communication claire et efficace", "C", 3),
    ],
    "Architecte logiciel": [
        ("Conception technique et fonctionnelle", "C", 4), ("API REST / SOAP", "C", 3),
        ("Docker", "R", 3), ("Kubernetes", "R", 2), ("SQL", "R", 3),
        ("Sécurité des applications web (OWASP, SSL, authentification)", "R", 3),
        ("Esprit d’analyse", "C", 3),
    ],
    "Architecte cloud": [
        ("AWS", "C", 3), ("Azure", "R", 3), ("Google cloud", "D", 2), ("Kubernetes", "C", 3),
        ("Docker", "C", 3), ("Conception technique et fonctionnelle", "C", 3),
        ("Sécurité des applications web (OWASP, SSL, authentification)", "R", 3),
    ],
    "Architecte solutions": [
        ("Conception technique et fonctionnelle", "C", 4), ("API REST / SOAP", "C", 3),
        ("Analyse des besoins métier", "C", 3),
        ("Respect des normes et standards (ISO, ITIL, etc.)", "R", 2),
    ],
    "Urbaniste SI": [
        ("Conception technique et fonctionnelle", "C", 3), ("Analyse des besoins métier", "C", 3),
        ("Respect des normes et standards (ISO, ITIL, etc.)", "C", 3),
        ("Gestion de projet (Jira, Trello, MS Project)", "R", 2),
    ],
    "Administrateur systèmes": [
        ("Administration système", "C", 3), ("Docker", "R", 2),
        ("Sécurité des applications web (OWASP, SSL, authentification)", "R", 2),
        ("Protection des données (RGPD, chiffrement)", "R", 2),
        ("Git / gestion de version (GitHub, GitLab)", "D", 2),
    ],
    "Administrateur réseaux": [
        ("Administration système", "C", 3),
        ("Sécurité des applications web (OWASP, SSL, authentification)", "R", 2),
        ("Protection des données (RGPD, chiffrement)", "R", 2),
    ],
    "Technicien informatique (IT Support)": [
        ("Administration système", "R", 2), ("Communication claire et efficace", "C", 3),
        ("Résolution de problèmes", "C", 2),
    ],
    "Ingénieur systèmes et réseaux": [
        ("Administration système", "C", 3), ("Docker", "R", 2), ("Kubernetes", "D", 2),
        ("Sécurité des applications web (OWASP, SSL, authentification)", "R", 3),
    ],
    "Ingénieur cloud": [
        ("AWS", "C", 3), ("Azure", "R", 2), ("Kubernetes", "C", 3), ("Docker", "C", 3),
        ("Github Actions", "R", 2), ("Administration système", "R", 2),
    ],
    "Technicien déploiement": [
        ("Administration système", "R", 2), ("Jenkins", "D", 2),
        ("Git / gestion de version (GitHub, GitLab)", "R", 2),
    ],
    "Analyste sécurité": [
        ("Sécurité des applications web (OWASP, SSL, authentification)", "C", 3),
        ("Tests de vulnérabilité et audits", "C", 3),
        ("Protection des données (RGPD, chiffrement)", "C", 3),
        ("Administration système", "R", 2), ("Esprit d’analyse", "C", 3),
    ],
    "Consultant cybersécurité": [
        ("Sécurité des applications web (OWASP, SSL, authentification)", "C", 3),
        ("Tests de vulnérabilité et audits", "C", 3),
        ("Protection des données (RGPD, chiffrement)", "C", 3),
        ("Communication claire et efficace", "R", 3),
    ],
    "Responsable sécurité (RSSI)": [
        ("Sécurité des applications web (OWASP, SSL, authentification)", "C", 4),
        ("Protection des données (RGPD, chiffrement)", "C", 4),
        ("Respect des normes et standards (ISO, ITIL, etc.)", "C", 3),
        ("Gestion de projet (Jira, Trello, MS Project)", "R", 3),
        ("Communication claire et efficace", "C", 3),
    ],
    "Pentester / Ethical hacker": [
        ("Tests de vulnérabilité et audits", "C", 4),
        ("Sécurité des applications web (OWASP, SSL, authentification)", "C", 3),
        ("Python", "R", 3), ("Administration système", "R", 2),
    ],
    "Data Analyst": [
        ("SQL", "C", 3), ("Pandas", "R", 3), ("Power BI", "C", 3), ("Tableau", "R", 2),
        ("NumPy", "R", 2), ("Esprit d’analyse", "C", 3),
    ],
    "Data Scientist": [
        ("Python", "C", 3), ("Pandas", "C", 3), ("NumPy", "C", 3), ("scikit-learn", "C", 3),
        ("TensorFlow", "R", 2), ("PyTorch", "D", 2), ("SQL", "R", 3), ("Esprit d’analyse", "C", 3),
    ],
    "Ingénieur Data / Data Engineer": [
        ("Python", "C", 3), ("SQL", "C", 3), ("Pandas", "R", 3), ("Docker", "R", 2),
    ],
    "Spécialiste Machine Learning": [
        ("scikit-learn", "C", 3), ("TensorFlow", "C", 3), ("PyTorch", "R", 3), ("Python", "C", 3),
    ],
    "Testeur / QA": [
        ("Automatisation des tests", "C", 3), ("Selenium", "R", 2),
        ("Méthodologies : TDD, BDD", "R", 2), ("Esprit d’analyse", "R", 3),
    ],
    "Analyste qualité": [
        ("Automatisation des tests", "R", 2),
        ("Respect des normes et standards (ISO, ITIL, etc.)", "C", 3), ("Esprit d’analyse", "C", 3),
    ],
    "Automaticien de test": [
        ("Selenium", "C", 3), ("Automatisation des tests", "C", 3), ("Jest", "R", 2),
        ("JUnit", "R", 2), ("Git / gestion de version (GitHub, GitLab)", "R", 2),
    ],
    "Responsable assurance qualité logicielle": [
        ("Automatisation des tests", "C", 3),
        ("Respect des normes et standards (ISO, ITIL, etc.)", "C", 3),
        ("Gestion de projet (Jira, Trello, MS Project)", "R", 3),
        ("Communication claire et efficace", "C", 3),
    ],
    "Chef de projet informatique": [
        ("Gestion de projet (Jira, Trello, MS Project)", "C", 3),
        ("Méthodes agiles (Scrum, Kanban)", "C", 3), ("Analyse des besoins métier", "R", 3),
        ("Communication claire et efficace", "C", 3), ("Gestion du stress et des priorités", "R", 3),
    ],
    "Product Owner": [
        ("Analyse des besoins métier", "C", 3), ("Rédaction de cahiers des charges", "C", 3),
        ("Méthodes agiles (Scrum, Kanban)", "C", 3), ("Communication claire et efficace", "C", 3),
    ],
    "Scrum Master": [
        ("Méthodes agiles (Scrum, Kanban)", "C", 4), ("Communication claire et efficace", "C", 3),
        ("Travail en équipe", "C", 3), ("Gestion du stress et des priorités", "R", 3),
    ],
    "PMO (Project Management Officer)": [
        ("Gestion de projet (Jira, Trello, MS Project)", "C", 3),
        ("Respect des normes et standards (ISO, ITIL, etc.)", "R", 3),
        ("Communication claire et efficace", "R", 3),
    ],
    "Consultant fonctionnel / AMOA": [
        ("Analyse des besoins métier", "C", 3), ("Rédaction de cahiers des charges", "C", 3),
        ("Conception technique et fonctionnelle", "R", 2), ("Communication claire et efficace", "C", 3),
    ],
    "Responsable informatique": [
        ("Gestion de projet (Jira, Trello, MS Project)", "C", 3), ("Administration système", "R", 2),
        ("Sécurité des applications web (OWASP, SSL, authentification)", "R", 2),
        ("Respect des normes et standards (ISO, ITIL, etc.)", "R", 3),
        ("Communication claire et efficace", "C", 3),
    ],
    "Tech Lead / Team Lead": [
        ("Conception technique et fonctionnelle", "C", 3),
        ("Git / gestion de version (GitHub, GitLab)", "C", 3),
        ("Méthodes agiles (Scrum, Kanban)", "C", 3), ("Travail en équipe", "C", 3),
        ("Communication claire et efficace", "C", 3),
    ],
    "Formateur IT": [
        ("Communication claire et efficace", "C", 4), ("Veille technologique", "C", 3),
        ("Travail en équipe", "R", 3),
    ],
    "Rédacteur technique": [
        ("Rédaction de cahiers des charges", "C", 3), ("Communication claire et efficace", "C", 3),
        ("Esprit d’analyse", "R", 2),
    ],
    "Support applicatif": [
        ("SQL", "R", 2), ("Communication claire et efficace", "C", 3),
        ("Résolution de problèmes", "C", 3),
    ],
    "Developpeur Junior": [
        ("Javascript", "R", 2), ("C#", "R", 2), ("SQL", "R", 2),
        ("Git / gestion de version (GitHub, GitLab)", "C", 2),
        ("Méthodes agiles (Scrum, Kanban)", "R", 2), ("Curiosité technologique", "R", 2),
    ],
    "Developpeur Débutant(e)": [
        ("Javascript", "R", 2), ("SQL", "R", 2),
        ("Git / gestion de version (GitHub, GitLab)", "C", 2), ("Curiosité technologique", "R", 2),
    ],
    "Apprenti Developpeur": [
        ("Javascript", "R", 1), ("SQL", "R", 1),
        ("Git / gestion de version (GitHub, GitLab)", "C", 1), ("Curiosité technologique", "R", 2),
    ],
    "Tech-expert": [
        ("Conception technique et fonctionnelle", "C", 3), ("Administration système", "R", 3),
        ("Résolution de problèmes", "C", 3), ("Veille technologique", "R", 3),
    ],
    "Ingénieur informatique": [
        ("Conception technique et fonctionnelle", "C", 3), ("SQL", "R", 3),
        ("Administration système", "R", 2), ("Git / gestion de version (GitHub, GitLab)", "R", 2),
    ],
    "Superviseur technique": [
        ("Gestion de projet (Jira, Trello, MS Project)", "C", 3),
        ("Respect des normes et standards (ISO, ITIL, etc.)", "R", 3),
        ("Travail en équipe", "C", 3), ("Gestion du stress et des priorités", "R", 3),
    ],
    "Superviseur Tech Adjoint - Tec": [
        ("Gestion de projet (Jira, Trello, MS Project)", "R", 2),
        ("Respect des normes et standards (ISO, ITIL, etc.)", "R", 2),
        ("Travail en équipe", "C", 3),
    ],
    "Technicien(ne) Support Informa": [
        ("Administration système", "R", 2), ("Communication claire et efficace", "C", 3),
        ("Résolution de problèmes", "C", 2),
    ],
    "Formateur Outils Numérique": [
        ("Communication claire et efficace", "C", 3), ("Veille technologique", "R", 2),
        ("Capacité d’adaptation", "R", 3),
    ],
    "Chagé d'Intérg. de Solution de": [
        ("Analyse des besoins métier", "C", 3), ("Conception technique et fonctionnelle", "R", 2),
        ("Gestion de projet (Jira, Trello, MS Project)", "R", 2),
    ],
    "Responsable des logiciels Méti": [
        ("Analyse des besoins métier", "C", 3), ("Gestion de projet (Jira, Trello, MS Project)", "C", 3),
        ("Respect des normes et standards (ISO, ITIL, etc.)", "R", 2),
        ("Communication claire et efficace", "C", 3),
    ],
    "Ressources Humaines": [
        ("Communication claire et efficace", "C", 3),
        ("Respect des normes et standards (ISO, ITIL, etc.)", "R", 2),
        ("Protection des données (RGPD, chiffrement)", "R", 2),
    ],
    "Marketing": [
        ("Communication claire et efficace", "C", 3), ("Créativité", "C", 3),
        ("Veille technologique", "R", 2),
    ],
    "Responsable Marketing": [
        ("Communication claire et efficace", "C", 3), ("Créativité", "C", 3),
        ("Gestion de projet (Jira, Trello, MS Project)", "R", 3), ("Esprit d’analyse", "R", 3),
    ],
    "comptable": [
        ("Respect des normes et standards (ISO, ITIL, etc.)", "C", 3), ("Esprit d’analyse", "R", 3),
        ("Protection des données (RGPD, chiffrement)", "R", 2),
    ],
    "Contrôleur de gestion": [
        ("Esprit d’analyse", "C", 3), ("Respect des normes et standards (ISO, ITIL, etc.)", "C", 3),
        ("Power BI", "R", 2),
    ],
    "Logistique": [
        ("Respect des normes et standards (ISO, ITIL, etc.)", "R", 2),
        ("Gestion du stress et des priorités", "R", 2),
    ],
    "Responsable Logistique": [
        ("Gestion de projet (Jira, Trello, MS Project)", "R", 3),
        ("Respect des normes et standards (ISO, ITIL, etc.)", "C", 3),
        ("Gestion du stress et des priorités", "R", 3),
    ],
    "Gestionnaire approvisionnement": [
        ("Respect des normes et standards (ISO, ITIL, etc.)", "R", 2), ("Esprit d’analyse", "R", 2),
        ("Gestion du stress et des priorités", "R", 2),
    ],
    "Stagiaire": [
        ("Curiosité technologique", "R", 2), ("Capacité d’adaptation", "R", 2),
    ],
}

# Packs par mot-clé du libellé de poste, appliqués quand aucun pack explicite n'existe.
KEYWORD_PACKS: list[tuple[tuple[str, ...], list[tuple[str, str, int]]]] = [
    (
        ("directeur", "directrice", "gérant", "gérante", "direction"),
        [
            ("Gestion de projet (Jira, Trello, MS Project)", "C", 3),
            ("Communication claire et efficace", "C", 3),
            ("Esprit critique", "C", 3),
            ("Respect des normes et standards (ISO, ITIL, etc.)", "R", 3),
            ("Gestion du stress et des priorités", "R", 3),
        ],
    ),
    (
        ("responsable", "resp.", "resp ", "chef"),
        [
            ("Gestion de projet (Jira, Trello, MS Project)", "C", 3),
            ("Communication claire et efficace", "C", 3),
            ("Respect des normes et standards (ISO, ITIL, etc.)", "R", 2),
            ("Gestion du stress et des priorités", "R", 3),
        ],
    ),
    (
        ("commercial", "commerciale", "clientèle", "ventes", "biz"),
        [
            ("Communication claire et efficace", "C", 3),
            ("Capacité d’adaptation", "R", 3),
            ("Gestion du stress et des priorités", "R", 2),
        ],
    ),
    (
        ("consultant", "consultant(e)", "formateur", "formatrice"),
        [
            ("Communication claire et efficace", "C", 3),
            ("Analyse des besoins métier", "R", 2),
            ("Capacité d’adaptation", "R", 3),
        ],
    ),
    (
        ("developpeur", "développeur"),
        [
            ("Javascript", "R", 2),
            ("SQL", "R", 2),
            ("Git / gestion de version (GitHub, GitLab)", "C", 2),
            ("Curiosité technologique", "R", 2),
        ],
    ),
    (
        ("technicien", "techicien", "automaticien", "conducteur", "massicotier", "brocheur", "offset", "typo"),
        [
            ("Respect des normes et standards (ISO, ITIL, etc.)", "R", 2),
            ("Résolution de problèmes", "R", 2),
        ],
    ),
    (
        ("assistant", "assistante", "assisitante", "administateur des ventes", "administratif"),
        [
            ("Communication claire et efficace", "C", 3),
            ("Respect des normes et standards (ISO, ITIL, etc.)", "R", 2),
        ],
    ),
    (
        ("agent", "gardien", "chauffeur", "coursier", "jardinier", "entretien", "ménage", "magasinier", "finition"),
        [
            ("Respect des normes et standards (ISO, ITIL, etc.)", "R", 2),
        ],
    ),
]

# Compétences laissées volontairement en brouillon (à trancher par les RH).
SKIP_SKILLS = {"Test"}
# Données de test créées par l'agent : archivage.
ARCHIVE_SKILLS = {"TEST-AGENT-UI Design"}

KIND_MAP = {"C": "Critical", "R": "Required", "D": "Desired"}
