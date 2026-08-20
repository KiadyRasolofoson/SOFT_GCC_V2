# Système de Licensing on-premise (RSA 4096)

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ÉDITEUR                                          │
│                                                                     │
│  ┌─ LicenseGenerator.UI (Avalonia/GUI) ─┐                           │
│  │  Formulaire → Signe → Active via API │                           │
│  └──────────────────────────────────────┘                           │
│                                                                     │
│  ┌─ LicenseGenerator (CLI) ─┐                                       │
│  │  Ligne de commande → Signe → Fichier de sortie                   │
│  └──────────────────────────┘                                       │
│                                                                     │
│  private.key ──→ Signe le payload JSON ──→ base64(payload|signature)│
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼  Distribution de la clé (email, fichier)
┌──────────────────────────────────────────────────────────────────────┐
│                     APPLICATION CLIENTE (ASP.NET Core)               │
│                                                                      │
│  LicenseController ──→ LicenseService ──→ LicenseValidator           │
│       │                                        │                     │
│       │                                   public.key (embarquée)     │
│       │                                        │                     │
│       ▼                                        ▼                     │
│  ApplicationDbContext ←── LicenseValidationResult                    │
│       │                                                              │
│       ▼                                                              │
│  LicenseCheckMiddleware (vérifie les routes protégées)               │
└──────────────────────────────────────────────────────────────────────┘
```

## Flux complet

### 1. Génération des clés

```bash
cd BACKEND/
chmod +x generate-keys.sh
./generate-keys.sh
```

Génère `keys/private.key` et `keys/public.key`.

⚠️ **Sécurité** : Ajoutez `keys/` au `.gitignore`. Ne distribuez jamais `private.key`.

### 2. Embarquement de la clé publique

1. Ouvrez `Application/Services/license/RsaPublicKeyProvider.cs`
2. Remplacez la constante `PublicKeyPem` par le contenu de `keys/public.key`
3. Recompilez l'application

La clé publique est compilée DANS le binaire — pas de fichier externe au runtime.

### 3. Génération d'une licence (côté éditeur)

Deux outils sont disponibles : une **interface graphique desktop** (Avalonia UI, recommandée pour Linux) et un **outil en ligne de commande** (pour le scripting/automatisation).

#### 3a. Interface graphique (LicenseGenerator.UI) — Recommandé

```bash
cd LicenseGenerator.UI/
dotnet run
```

L'interface permet de :
- Saisir le formulaire (Customer ID, Machine ID, durée en mois ou date d'expiration, type, fonctionnalités)
- Sélectionner la clé privée RSA via un explorateur de fichiers
- Configurer l'URL de l'API backend
- Générer la licence et l'activer automatiquement dans la base de données
- Copier la clé dans le presse-papier

> **Prérequis** : .NET 8 SDK. Fonctionne sur Linux, macOS et Windows.

#### 3b. Ligne de commande (LicenseGenerator) — Scripting/Automatisation

```bash
cd LicenseGenerator/
dotnet run -- \
  --customer-id "CLIENT001" \
  --machine-id "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2" \
  --expire-at "2027-12-31" \
  --license-type "Enterprise" \
  --features "ModuleA,ModuleB,ModuleC" \
  --private-key-file "../BACKEND/keys/private.key" \
  --output "./license_CLIENT001.key"
```

Arguments :
| Argument | Requis | Description |
|---|---|---|
| `--customer-id` | Oui | Identifiant du client |
| `--machine-id` | Oui | MachineId fourni par le client |
| `--expire-at` | Non | Date d'expiration (défaut : +1 an) |
| `--license-type` | Non | Trial, Standard, Enterprise (défaut : Standard) |
| `--features` | Non | Fonctionnalités séparées par des virgules |
| `--private-key-file` | Non | Chemin vers private.key (défaut : ./private.key) |
| `--output` | Non | Fichier de sortie pour la clé générée |

### 4. Activation côté client

```http
POST /api/license/activate
Content-Type: application/json

{
    "licenseKey": "base64_encoded_license_key_here"
}
```

Réponse succès (200) :
```json
{
    "isValid": true,
    "expireAt": "2027-12-31T23:59:59Z",
    "licenseType": "Enterprise",
    "features": ["ModuleA", "ModuleB", "ModuleC"],
    "customerId": "CLIENT001",
    "machineId": "a1b2c3...",
    "licenseId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "errorReason": "None",
    "errorMessage": null
}
```

Réponse erreur (400) :
```json
{
    "isValid": false,
    "errorReason": "InvalidSignature",
    "errorMessage": "La signature RSA ne correspond pas au payload."
}
```

### 5. Vérification du statut

```http
GET /api/license/status
```

Retourne le statut actuel de la licence avec revalidation complète de la signature.

## Structure du payload signé

```json
{
    "licenseId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "customerId": "CLIENT001",
    "machineId": "a1b2c3d4...",
    "issuedAt": "2026-07-10T12:00:00Z",
    "expireAt": "2027-12-31T23:59:59Z",
    "licenseType": "Enterprise",
    "features": ["ModuleA", "ModuleB"]
}
```

Format final : **base64(payload_json | signature_base64)**

## Sécurité

### Protections implémentées

1. **Signature RSA 4096 bits** — Toute modification du payload invalide la signature
2. **Binding machine** — Le MachineId est DANS le payload signé (pas de réassociation sans re-signature)
3. **Revalidation complète** — `GetStatus()` revalide la signature à chaque appel (pas de confiance en la base)
4. **Cache mémoire 5 min** — Throttle sans sacrifier la sécurité
5. **Anti-clock-rollback** — Stockage de `last_validated_at` + rejet si heure système antérieure
6. **Clé publique embarquée** — Pas de fichier à distribuer, pas de substitution possible
7. **GUID unique par licence** — Permet une future révocation

### Contre-mesures

| Attaque | Protection |
|---|---|
| Modification du payload | Signature invalide |
| Réassociation à une autre machine | MachineId dans le payload signé |
| Remplacement de public.key | Clé compilée dans le binaire |
| Avancement de l'horloge | Vérification `ExpireAt > UtcNow` |
| Recul de l'horloge | Vérification `UtcNow > last_validated_at` |
| Réutilisation d'anciennes clés | `IssuedAt` + `ExpireAt` dans le payload |
| Rejeu d'activation | GUID unique + date d'émission |
| Reverse engineering du validateur | Logique en code managé (obfuscation recommandée) |

## Fichiers du système

| Fichier | Rôle |
|---|---|
| `Core/Entities/license/License.cs` | Entité EF Core |
| `Application/Dtos/LicenseDto/LicenseActivateDto.cs` | DTO d'activation |
| `Application/Dtos/LicenseDto/LicenseValidationResult.cs` | Résultat de validation + enum ErrorReason |
| `Application/Services/license/LicenseValidator.cs` | Validateur statique (partagé) |
| `Application/Services/license/RsaPublicKeyProvider.cs` | Cache singleton de la clé publique |
| `Application/Services/license/LicenseService.cs` | Service DI (Scoped) |
| `Controllers/license/LicenseController.cs` | API endpoints |
| `Middleware/LicenseCheckMiddleware.cs` | Middleware de vérification |
| `generate-keys.sh` | Script de génération des clés |
| `bdd/01_CREATE_LICENSE_TABLE.sql` | Script SQL de création de la table |
| `LicenseGenerator/Program.cs` | Outil CLI de génération de licence |
| `LicenseGenerator.UI/` | Interface graphique Avalonia (Linux/macOS/Windows) |
| `soft_carriere_competence.Tests/LicenseValidatorTests.cs` | Tests unitaires |

## Recommandations

1. **Rotation des clés** : Régénérez les clés chaque année et planifiez une mise à jour
2. **Obfuscation** : Utilisez un obfuscateur .NET (ConfuserEx, Obfuscar) pour protéger le validateur
3. **Révocation** : Le GUID de licence permet d'implémenter une liste de révocation (via un service distant optionnel)
4. **Journalisation** : Activez les logs pour les tentatives d'activation échouées (tentative de fraude)
