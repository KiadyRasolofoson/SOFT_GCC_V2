# État des modules Soft GCC

**Périmètre :** photographie de l’application **avant** l’ajout d’un vrai référentiel de compétences (langage commun, niveaux définis, versions, lien postes ↔ compétences).

Ce document sert à :
- lister ce qui existe déjà ;
- dire clairement ce qui manque ;
- proposer les évolutions de chaque module, **dans un langage métier**.

---

## Vue d’ensemble

| Module | Statut | En une phrase |
|---|---|---|
| 1. Référentiel de compétences | Partiel | Une liste de noms et de domaines, sans langage commun ni niveaux comparables |
| 2. Référentiel emplois / métiers | Partiel | Des nomenclatures de postes, pas de vraies fiches métier |
| 3. Évaluation des compétences | Présent | Campagnes, questionnaires, notation, historique — le module le plus abouti |
| 4. Entretiens | Présent (performance) | Entretien annuel / de performance, pas l’entretien professionnel légal français |
| 5. Parcours / mobilité interne | Partiel | Souhaits d’évolution, sans bourse d’emploi ni arbre de carrière |
| 6. Plan de développement individuel (PDI) | Léger | Objectifs saisis en entretien, pas un vrai plan d’actions |
| Reporting | Partiel | Tableau de bord RH, sans cartographie par service |
| Droits d’accès | Présent | Qui voit quoi (RH, manager, direction, salarié) |
| Workflows | Présent | Campagnes d’évaluation et validation hiérarchique |
| Notifications / relances | Présent | Cloche dans l’application et relances automatiques |

D’autres fonctions existent déjà à côté de cette liste (organigramme, effectifs, retraites, attestations, synchronisation des employés, assistant). Elles ne sont pas détaillées ici.

La **formation** n’est pas un module Soft GCC : elle sera gérée dans le projet **Soft Training**, avec une synchronisation entre les deux applications (besoins issus des écarts / du PDI, puis retours sur les formations suivies).

---

## 1. Référentiel de compétences

**Statut :** partiel

### Ce qui est déjà là

- Une bibliothèque de compétences (un nom par compétence) et des domaines, gérés dans les paramètres.
- Un niveau « acquis » sur chaque collaborateur, saisi comme un pourcentage (0 à 100).
- Un lien possible entre un poste et des compétences, mais peu exploité à l’écran.
- Des « lignes de compétence » utilisées surtout pour construire les questionnaires d’évaluation.

### Ce qui bloque aujourd’hui

- Pas de typologie claire (technique, comportementale, managériale, transverse) : seulement un domaine libre.
- Pas d’échelle commune avec une définition concrète par niveau. L’écran affiche trois étiquettes (Notions / Autonome / Expert), le bulletin classe autrement (seuils à 40 % et 70 %). Les comparaisons entre services ne sont pas fiables.
- On ne peut pas indiquer, pour un poste, le **niveau attendu** de façon visible et utilisable.
- Aucune version du référentiel : si on renomme ou redéfinit une compétence, l’historique n’est pas protégé.

### Modifications suggérées

- Transformer la liste de noms en **catalogue métier** : nom, définition claire, famille, type (technique / comportementale / managériale / transverse).
- Adopter **une seule échelle de maîtrise** (par exemple 4 niveaux : Notions, Application, Maîtrise, Expertise), avec une phrase concrète par niveau pour chaque compétence.
- Permettre de **publier** une compétence (brouillon → active) et de **l’archiver** plutôt que de la supprimer.
- Quand une définition change, **conserver l’ancienne version** pour ne pas fausser les évaluations déjà faites.
- Donner aux RH un écran pour rattacher les compétences aux postes (niveau attendu, compétence critique ou simplement souhaitée). C’est ce lien qui alimentera ensuite les écarts, la mobilité et le PDI.

---

## 2. Référentiel des emplois / métiers

**Statut :** partiel

### Ce qui est déjà là

- Les listes de base : poste, fonction, catégorie professionnelle, échelon, type de contrat, établissement, etc.
- Un « plan de carrière » qui est en réalité l’**historique des affectations** (poste, dates, salaire, décision) — pas une fiche métier.
- Des compétences associées au poste, surtout pour alimenter les évaluations.

### Ce qui bloque aujourd’hui

- Pas de fiche de poste / fiche métier (missions, responsabilités, compétences pondérées).
- Pas de familles ou filières **professionnelles**. La « filière » actuelle correspond à un parcours d’études.
- Pas de passerelles visualisées (vers quels métiers on peut évoluer).
- Les suggestions de postes se contentent de dire : « ce collaborateur a au moins une compétence en commun » — trop brut pour parler de parcours.

### Modifications suggérées

- Enrichir chaque poste d’une **fiche métier** : missions, responsabilités, compétences requises avec niveau attendu et importance (critique / souhaitée).
- S’appuyer sur le référentiel de compétences (module 1) pour que cette fiche soit la même partout.
- Introduire des familles de métiers et, plus tard, des **passerelles** (de quel poste vers quel poste, avec quels écarts à combler).
- Distinguer clairement à l’écran : « dossier d’affectation du salarié » et « fiche du métier ».

---

## 3. Évaluation des compétences

**Statut :** présent (module le plus abouti)

### Ce qui est déjà là

- Lancement de **campagnes** (période, type, superviseurs, relances).
- Questionnaire côté salarié (portail avec compte temporaire — encore sur l’ancien écran, l’API existe déjà).
- Notation côté manager (questions, commentaires, validation, export PDF).
- Plusieurs superviseurs possibles, et une délégation temporaire. Ce n’est **pas** un 360° (pas de pairs, N-1, clients).
- Historique des dossiers, scores, courbes d’évolution dans le temps.
- Mise à jour automatique du niveau du collaborateur après la notation.
- Quelques écarts affichés : bulletin individuel (maîtrisée / en cours / non acquise), compétences du poste visé (possédée / non possédée), taux de couverture au tableau de bord.

### Ce qui bloque aujourd’hui

- Les notes d’évaluation et les niveaux de compétence ne parlent **pas le même langage** (note sur 5, pourcentage, trois étiquettes, seuils du bulletin). Les données se mélangent.
- Après une campagne, **la même note globale** est recopiée sur toutes les compétences du dossier. On ne mesure pas vraiment chaque compétence.
- L’écart affiché sur la fiche employé (compétences RH / formation / langues) est **illustratif**, pas un vrai comparatif « poste actuel vs acquis ».
- Le questionnaire salarié n’est pas encore dans l’écran Angular actuel.

### Modifications suggérées

- Noter les compétences sur **la même échelle** que le référentiel (niveaux 1 à 4), pas en recopiant la moyenne de toute la campagne.
- Afficher sur la fiche du collaborateur les **vrais écarts** : niveau attendu du poste versus niveau acquis.
- Recalculer le bulletin et le taux de couverture avec cette même règle.
- Recréer le questionnaire salarié dans l’application actuelle, pour un parcours unique.
- Garder la note de campagne (performance) **à part** du niveau de maîtrise d’une compétence.

---

## 4. Entretiens professionnels et d’évaluation

**Statut :** présent, limité à la performance

### Ce qui est déjà là

- Campagne : planning, type, dates, superviseurs, relances.
- Entretien : créneau, compte-rendu (contexte, bilan, objectifs, synthèse), PDF.
- Validation par le manager, puis par la direction.
- Conservation des comptes-rendus et des scores.

### Ce qui bloque aujourd’hui

- Pas d’**entretien professionnel** distinct (obligation légale en France, tous les deux ans, avec traçabilité).
- Les types d’entretien (annuelle, trimestrielle, probatoire…) sont de simples libellés, pas un processus légal.

### Modifications suggérées

- Séparer deux processus : **entretien de performance** (déjà là) et **entretien professionnel** (cycle, échéance, preuves conservées).
- Préparer l’entretien avec la liste des compétences à discuter, issue du référentiel et des écarts du poste.
- Relier les objectifs de l’entretien à un plan de développement (voir module 6), plutôt que de les laisser uniquement dans le compte-rendu.

---

## 5. Parcours et mobilité interne

**Statut :** partiel

### Ce qui est déjà là

- Souhaits de mobilité : type, poste visé, motivation, disponibilité, priorité, suivi d’état.
- Comparaison des compétences du collaborateur avec celles du poste souhaité.
- Suggestions de postes à partir des compétences déjà détenues.
- Historique des affectations.
- Organigramme (N / N+1).

### Ce qui bloque aujourd’hui

- Pas de bourse aux emplois interne (postes ouverts visibles en interne).
- Pas de plans de succession, même légers, pour les postes clés.
- Pas d’arbre de carrière ni de passerelles métier.
- Le graphique des souhaits montre le **volume de demandes par mois**, pas un parcours.

### Modifications suggérées

- Comparer le poste visé avec des **niveaux** (attendu vs acquis), plus seulement « a / n’a pas la compétence ».
- Afficher un écart lisible : ce qui manque, de combien de niveaux, quelles compétences sont critiques.
- Plus tard : bourse interne, passerelles entre métiers, et un suivi léger des successeurs sur les postes sensibles.
- S’appuyer sur la fiche métier (module 2) et le référentiel (module 1) pour juger l’éligibilité de façon juste d’un service à l’autre.

---

## 6. Plan de développement individuel (PDI)

**Statut :** léger

### Ce qui est déjà là

- Objectifs saisis pendant l’entretien, avec un écran récapitulatif, un statut et un historique de progression.
- Des suggestions de formation apparaissent si une question d’évaluation est notée en dessous d’un seuil (catalogue interne actuel, à remplacer par Soft Training).

### Ce qui bloque aujourd’hui

- Pas de vrai PDI : pas d’actions typées (formation, mentorat, mission, lecture, etc.).
- Les objectifs vivent dans le compte-rendu d’entretien, pas dans un plan autonome lié aux écarts de compétences.
- Le lien avec la formation s’arrête à ces suggestions internes, sans suivi dans Soft Training.

### Modifications suggérées

- Créer un **plan de développement** rattaché au collaborateur, alimenté automatiquement par les écarts (compétences en dessous du niveau attendu).
- Chaque action a un type, une échéance, un responsable, un statut.
- Pour les actions de type formation : **envoyer le besoin vers Soft Training** (plutôt que de gérer un catalogue dans Soft GCC), puis récupérer le suivi (inscription, réalisation) pour clôturer l’action.
- Permettre au manager et au RH de suivre l’avancement entre deux entretiens, pas seulement le jour de l’entretien.

---

## Modules transverses

### Reporting / tableaux de bord

**Statut :** partiel

**Aujourd’hui :** effectif, taille du catalogue, postes, taux de couverture, souhaits d’évolution, attestations, répartitions (département, âge, expérience).

**Manque :** une carte des compétences par service, le suivi des compétences critiques, le taux d’entretiens réellement réalisés.

**Modifications suggérées :**
- Recalculer le taux de couverture avec la règle unique : « le titulaire du poste atteint-il le niveau attendu ? »
- Ajouter une vue par service / département et un focus sur les compétences marquées **critiques**.
- Suivre l’avancement des campagnes d’entretien (lancés / réalisés / validés).

### Droits et habilitations

**Statut :** présent

**Aujourd’hui :** rôles et permissions (consulter / gérer), menu selon le profil. Une évaluation n’est visible que par le salarié concerné, son superviseur, sa hiérarchie, les RH ou la direction.

**Modifications suggérées :**
- Distinguer clairement : consulter le catalogue, le modifier en brouillon, **publier** une compétence (plutôt réservé RH).
- Veiller à ce qu’un collaborateur ne voie que son profil et ses écarts, un manager son équipe, les RH le référentiel complet.

### Workflows de validation

**Statut :** présent

**Aujourd’hui :** campagne d’évaluation (brouillon → planifiée → en cours → terminée) et entretien (planifié → compte-rendu → validations manager puis direction).

**Modifications suggérées :**
- Ajouter un circuit simple pour le **référentiel** (brouillon → publié → archivé).
- Prévoir, plus tard, le même type de circuit pour le PDI et l’entretien professionnel.

### Notifications et relances

**Statut :** présent

**Aujourd’hui :** cloche dans l’application et relances automatiques des évaluations.

**Modifications suggérées :**
- Étendre les relances à la publication d’une fiche métier, aux écarts critiques, aux actions de PDI en retard, et à l’échéance d’entretien professionnel.

---

## Ordre recommandé des évolutions

Le référentiel de compétences (module 1) est la fondation. Tant qu’il n’est pas stabilisé, les écarts, la mobilité, le PDI et une partie du reporting resteront approximatifs.

1. **Module 1** — langage commun, échelle unique, versions, lien postes ↔ compétences.
2. **Modules 2 et 3** — fiches métier + évaluations qui utilisent la même échelle (et vrais écarts sur la fiche employé).
3. **Modules 5 et 6** — mobilité et PDI branchés sur ces écarts ; les besoins de formation partent vers **Soft Training**.
4. **Reporting** — tableaux de bord fiables (couverture, compétences critiques, entretiens réalisés).
5. **Module 4** — entretien professionnel légal, une fois les écarts et le PDI en place.

Les droits, workflows et notifications s’ajustent au fil de ces étapes, sans tout reconstruire.
