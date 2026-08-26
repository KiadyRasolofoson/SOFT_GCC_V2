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

### Prérequis base de données (Windows)

SQL Server doit déjà être installé et démarré. Les chaînes de connexion utilisent l’**authentification Windows** (`Trusted_Connection`) et ne sont chargées que sous Windows, via [`BACKEND/src/SoftGcc.Api/appsettings.Windows.json`](BACKEND/src/SoftGcc.Api/appsettings.Windows.json). Sous Linux ce fichier n’est pas lu : définissez `ConnectionStrings__DefaultConnection` uniquement si vous ciblez SQL Server autrement.

Votre compte Windows doit pouvoir créer une base (`dbcreator` ou équivalent). Au premier `dotnet run` en Development, l’API :

1. Crée la base `Soft_GCC` si elle n’existe pas
2. Pose le schéma SQL de baseline si la table `Employee` est absente
3. Applique les migrations Entity Framework
4. Insère les données essentielles (rôles, permissions, modules) et un admin local si la table `Users` est vide

Compte créé uniquement sur une base vide : **`admin@local`** / **`Admin123!`**.

`p_sw` (paie) n’est **pas** créée automatiquement : elle reste optionnelle pour la synchro des employés. En production, désactivez l’auto-migration avec `"Database": { "ApplyOnStartup": false }` (ou omettez la clé hors Development).

Copiez [`BACKEND/src/SoftGcc.Api/appsettings.example.json`](BACKEND/src/SoftGcc.Api/appsettings.example.json) vers `appsettings.json` / `appsettings.Development.json` pour JWT, e-mail et licence — ces fichiers restent gitignorés.

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
