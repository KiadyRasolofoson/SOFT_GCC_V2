# Soft GCC V2

Application de gestion des compétences et des carrières (SoftTalent) : API ASP.NET Core, frontend Angular, et ancien frontend React conservé le temps de la migration.

## Structure

```
SOFT_GCC_V2/
  BACKEND/              API .NET (Clean Architecture)
  frontend/             Frontend Angular (application courante)
  old_frontend/         Ancien frontend React (Vite)
  LicenseGenerator/     Générateur de licences (CLI)
  LicenseGenerator.UI/  Générateur de licences (interface Avalonia)
  docs/                 Documentation d'utilisation
```

## Démarrage

### API

```bash
cd BACKEND
dotnet run --project src/SoftGcc.Api
```

L'API écoute sur `http://localhost:5189`.

### Frontend Angular

```bash
cd frontend
npm install
npm start
```

Ouvre `http://localhost:4201`. Détails : [frontend/README.md](frontend/README.md).

### Ancien frontend React

```bash
cd old_frontend
npm install
npm run dev
```

Détails : [old_frontend/README.md](old_frontend/README.md).

## Documentation

- [Guide d'utilisation des licences](docs/GUIDE_UTILISATION_LICENCES.md)
- [Architecture du licensing](docs/README-LICENSING.md)
- [Scripts SQL du module d'évaluation](docs/scripts-sql-evaluations.md)
