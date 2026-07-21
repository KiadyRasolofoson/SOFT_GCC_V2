---
name: rapport-session
description: 'Use when the user says to put something in the report, create a report, write the session report, or document what was done in the rapport folder. Generates a detailed markdown report under rapport/YYYY-MM-DD/ using the session date and a normalized filename.'
argument-hint: 'Sujet du rapport'
---

# Rapport de session

## Quand utiliser ce skill
- Quand l'utilisateur demande de mettre le travail dans le rapport.
- Quand l'utilisateur demande un rapport détaillé de ce qui a été fait.
- Quand il faut créer un fichier de compte rendu dans `rapport/` avec la date de la session.

## Objectif
Créer automatiquement un rapport Markdown clair, détaillé et daté, dans le dossier `rapport/<YYYY-MM-DD>/`, en décrivant précisément ce qui a été fait pendant la session.

## Convention de sortie
- Dossier cible : `rapport/<date-de-session>/`
- Nom de fichier : `Rapport_<Sujet_Normalise>.md`
- Si le dossier de la date n'existe pas, le créer.
- Si un rapport du même sujet existe déjà pour la même date, le mettre à jour au lieu d'en créer un doublon, sauf demande contraire.
- Utiliser la date de la session courante comme référence principale.

## Structure attendue du rapport
Le rapport doit être rédigé en français et contenir, au minimum, les sections suivantes :

1. Titre clair avec le sujet du travail.
2. Date de la session.
3. Projet ou périmètre concerné.
4. Résumé bref du besoin ou du problème.
5. Travail réalisé, avec des sous-sections si nécessaire.
6. Fichiers créés et modifiés.
7. Vérifications effectuées.
8. Résultats, limites ou risques restants, si applicable.

## Règles de rédaction
- Décrire les actions concrètes, pas seulement l'intention.
- Mentionner les fichiers, dossiers, composants, scripts ou routes touchés quand c'est pertinent.
- Indiquer les vérifications réelles effectuées, comme un build, des tests ou une validation manuelle.
- Rester factuel et précis.
- Éviter les formulations vagues du type "j'ai amélioré" sans expliquer ce qui a changé.

## Modèle de contenu conseillé
Utiliser une forme proche de celle-ci :

```markdown
# Rapport — <Sujet>

**Date :** <YYYY-MM-DD>
**Projet :** <nom du projet>
**Périmètre :** <zone concernée>

## Résumé

<résumé court du travail effectué>

## Travail réalisé

### 1. <Étape ou bloc fonctionnel>
<description détaillée>

### 2. <Étape ou bloc fonctionnel>
<description détaillée>

## Fichiers créés et modifiés

- <chemin du fichier> — <rôle ou changement>

## Vérification

- <commande ou validation>
```

## Comportement attendu de l'agent
- Si l'utilisateur dit explicitement de mettre quelque chose dans le rapport, produire ce rapport dans `rapport/<date-de-session>/`.
- S'il manque un sujet précis, dériver un titre à partir du travail effectué.
- Si la session a déjà produit un fichier de rapport pour ce jour, continuer dans ce même fichier ou le compléter de manière cohérente.
- Conserver un style proche des rapports existants du projet.