# Soft GCC — frontend Angular

Application Angular 22 (Tailwind + Angular Material) branchée sur l’API Soft GCC.
Le React `front_soft_gcc/` reste en place pendant la migration.

## Démarrage

```bash
cd frontend
npm install
npm start
```

Ouvre `http://localhost:4201` (le design-system utilise déjà le port 4200).

API attendue : `http://localhost:5189/api` (voir `src/environments/environment.ts`).

## Périmètre actuel

- Connexion (`/login`)
- Menu dynamique (`GET /Module/my-modules`)
- Tableau de bord (`/soft-gcc/tableau-de-bord`)
- Pages non trouvées / non encore migrées
