# Améliorations UX — Plan de Carrière (backlog fonctionnel)

> Source : revue UX du module Plan de Carrière (SOFT_GCC_V2).
> Chaque ligne est une fonctionnalité à implémenter, avec priorité, motif et critère d'acceptation.
> Légende priorité : **P1** = à faire rapidement (fort impact / effort modéré) · **P2** = moyen terme · **P3** = polish.
> Avancement : ✅ **UX-01**, **UX-02**, **UX-02-bis**, **UX-03** implémentés (V2).

---

## P1 — Navigation & contexte

### ✅ UX-01 · Actions de ligne dans la liste (Détail / Modifier)
- **Motif (C1)** : la liste ne propose que « Voir carrière » ; les routes `modifier/:id` et `detail/:id` existent mais sont inaccessibles depuis l'UI.
- **Critère d'acceptation** :
  - Chaque ligne de la liste expose au minimum **Modifier** et **Détail** (et « Clôturer » pour les plans actifs).
  - Les actions renvoient vers `/carrieres/fiche/modifier/:id` et `/carrieres/fiche/detail/:id`.

### ✅ UX-02 · Colonnes Type d'affectation + État dans la liste
- **Motif (C1)** : la colonne « Plan de carrière » (numéro) est ambiguë ; on ne distingue ni le type (Nomination/Avancement/Dispo), ni l'état (Actif/Archivé), ni le plan courant.
- **Critère d'acceptation** :
  - Colonne **Type** avec badge (Nomination / Avancement / Mise en disponibilité).
  - Colonne **État** avec badge (Actif / Archivé), le plan courant étant mis en évidence.

### ✅ UX-02-bis · Indication du plan courant
- **Motif** : l'utilisateur doit identifier d'un coup d'œil l'affectation **en cours** vs l'historique.
- **Critère d'acceptation** : le dernier plan actif d'un employé est marqué « Courant » dans la liste et l'onglet Carrières.

### ✅ UX-03 · Carte « Situation actuelle » à la sélection de l'employé
- **Motif (C2)** : lors d'une **Nomination**, aucune vision du poste/département/salaire **actuels** de l'employé (l'Avancement pré-remplit, pas la Nomination).
- **Critère d'acceptation** : dès la sélection d'un employé (tous types), une carte affiche : poste actuel, département, catégorie/classe, salaire de base, RIB (lien vers la fiche). Utilisée comme contrôle d'éligibilité.

---

## P1 — Saisie & formulaire

### UX-04 · Confirmation avant changement de type d'affectation
- **Motif (C3)** : basculer Nomination → Avancement **réinitialise** les champs du sous-formulaire sans avertissement (perte de saisie).
- **Critère d'acceptation** :
  - Si des champs du sous-formulaire sont remplis, un dialogue de confirmation s'affiche avant la bascule.
  - (Option) Conserver les valeurs par type.

### UX-05 · Formulaire guidé (stepper) pour la création/édition
- **Motif (C4)** : formulaire long, tout déroulé (Identification → Organisation → Rémunération/Classification → actions).
- **Critère d'acceptation** :
  - Étapes : 1. Identification · 2. Organisation · 3. Rémunération & Classification · 4. Récapitulatif.
  - Navigation avant/arrière, validation d'étape, récapitulatif avant enregistrement.

### UX-06 · Récapitulatif global des erreurs + focus premier champ invalide
- **Motif (C5)** : erreurs par champ présentes, mais pas de vision globale ni de navigation vers la première erreur.
- **Critère d'acceptation** :
  - Bandeau « N erreur(s) à corriger » en haut du formulaire.
  - Focus automatique (et scroll) vers le premier champ en erreur à la soumission.

### UX-07 · Feedback de succès après enregistrement
- **Motif (C8)** : aucune notification après Enregistrer.
- **Critère d'acceptation** : toast de confirmation (n° de décision) + redirection explicite (fiche employé onglet Carrières).

---

## P2 — Filtres & affichage

### UX-08 · Filtres enrichis et libellés explicites
- **Motif (C6)** : deux `<input type="date">` sans libellé ; pas de filtre « Type d'affectation » ni « État ».
- **Critère d'acceptation** :
  - Filtres ajoutés : Type d'affectation, État.
  - Les champs date portent des libellés (Du / Au) et des placeholders.
  - Cohérence visuelle avec le design system `gcc-*`.

### UX-09 · Explication du salaire net estimé
- **Motif (C7)** : champ net en lecture seule, formule opaque.
- **Critère d'acceptation** : hint « Net estimé = base × (1 − taux de charges) » + affichage du taux appliqué (ex. « −20 % »).

### UX-10 · Alerte RIB actionnable
- **Motif (C9)** : l'avertissement RIB existe mais est discret et sans action.
- **Critère d'acceptation** : alerte plus visible (icône/couleur) + lien « Saisir le RIB » vers la fiche employé.

---

## P3 — Polish

### UX-11 · Onglet Carrières : séparer plan courant vs historique
- **Motif (C10)** : l'historique de la fiche employé doit distinguer l'affectation en cours des précédentes.
- **Critère d'acceptation** : section « Affectation actuelle » (carte) + liste chronologique des anciens plans avec badges.

### UX-12 · Selects recherchables sur les référentiels longs
- **Motif (C11)** : Département/Catégorie/Classe utilisent des selects simples.
- **Critère d'acceptation** : bascule en `gcc-searchable-select` pour les listes volumineuses.

---

## Synthèse

| Priorité | IDs | Impact |
|---|---|---|
| P1 — Navigation & contexte | UX-01, UX-02, UX-02-bis, UX-03 | Visibilité, parcours, éligibilité |
| P1 — Saisie & formulaire | UX-04, UX-05, UX-06, UX-07 | Sécurité de saisie, guidage |
| P2 — Filtres & affichage | UX-08, UX-09, UX-10 | Lisibilité, transparence |
| P3 — Polish | UX-11, UX-12 | Confort |
