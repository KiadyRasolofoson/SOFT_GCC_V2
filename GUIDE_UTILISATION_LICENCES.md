# Guide d'utilisation du système de licences

> Système de licensing on-premise basé sur RSA 4096 bits — Protection par signature + binding machine.

---

## 1. Générer une licence pour un client (côté éditeur)

### 1.1 Prérequis

- .NET 8 SDK installé
- Le fichier `private.key` (NE JAMAIS distribuer ce fichier)
- Le `MachineId` fourni par le client

### 1.2 Commande de génération

```bash
cd LicenseGenerator/
dotnet run -- \
  --customer-id "CLIENT001" \
  --machine-id "a1b2c3d4..." \
  --expire-at "2027-12-31" \
  --license-type "Enterprise" \
  --features "ModuleA,ModuleB,ModuleC" \
  --private-key-file "../BACKEND/keys/private.key" \
  --output "./license_CLIENT001.key"
```

### 1.3 Arguments disponibles

| Argument | Requis | Description |
|---|---|---|
| `--customer-id` | ✅ Oui | Identifiant unique du client |
| `--machine-id` | ✅ Oui | MachineId récupéré depuis l'application cliente |
| `--expire-at` | ❌ Non (défaut: +1 an) | Date d'expiration (format: YYYY-MM-DD) |
| `--license-type` | ❌ Non (défaut: Standard) | `Trial`, `Standard` ou `Enterprise` |
| `--features` | ❌ Non (défaut: aucune) | Fonctionnalités séparées par des virgules |
| `--private-key-file` | ❌ Non (défaut: ./private.key) | Chemin vers la clé privée |
| `--output` | ❌ Non (défaut: stdout) | Fichier de sortie pour la clé générée |

### 1.4 Exemples

```bash
# Licence Trial valable 30 jours
dotnet run -- --customer-id "ESSENTIEL" --machine-id "abc123" --expire-at "2026-08-10" --license-type "Trial"

# Licence Enterprise avec fonctionnalités avancées
dotnet run -- --customer-id "CORPORATE" --machine-id "xyz789" --expire-at "2028-12-31" --license-type "Enterprise" --features "Reporting,API,MultiUser,SLA" --output "./corporate.key"
```

---

## 2. Activer une licence (côté client)

### 2.1 API d'activation

```http
POST /api/license/activate
Content-Type: application/json

{
    "licenseKey": "base64_encoded_license_key_here"
}
```

### 2.2 Réponse succès (200)

```json
{
    "isValid": true,
    "expireAt": "2027-12-31T23:59:59Z",
    "licenseType": "Enterprise",
    "features": ["ModuleA", "ModuleB", "ModuleC"],
    "customerId": "CLIENT001",
    "machineId": "a1b2c3d4...",
    "licenseId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "errorReason": "None",
    "errorMessage": null
}
```

### 2.3 Réponse erreur (400)

```json
{
    "isValid": false,
    "errorReason": "Expired",
    "errorMessage": "La licence a expiré le ..."
}
```

---

## 3. Vérifier le statut de la licence

```http
GET /api/license/status
```

Réponse : identique au format d'activation (200).

Le statut est **revalidé complètement** à chaque appel (signature + machine + expiration + clock rollback), avec un cache mémoire de 5 minutes pour éviter de saturer.

---

## 4. Codes d'erreur

| Raison | Signification | Action utilisateur |
|---|---|---|
| `None` | ✅ Licence valide | Tout va bien |
| `NoLicense` | Aucune licence activée | Aller dans les paramètres, activer une licence |
| `InvalidFormat` | Clé corrompue | Vérifier que la clé a été copiée intégralement |
| `InvalidSignature` | Clé falsifiée | Contacter l'éditeur, la clé a été modifiée |
| `Expired` | Licence expirée | Contacter l'éditeur pour un renouvellement |
| `MachineMismatch` | Changement de machine | Contacter l'éditeur avec le nouveau MachineId |
| `CorruptedPayload` | Données illisibles | Réessayer ou contacter l'éditeur |
| `ClockRollback` | Horloge système modifiée | Vérifier la date/heure du serveur |

---

## 5. Obtenir le MachineId (pour le client)

Le MachineId est un hash SHA256 unique et stable calculé automatiquement. Il combine le nom de machine, le nom d'utilisateur, la version OS et `/etc/machine-id` (sous Linux).

### 5.1 Via l'API dédiée (recommandé)

```http
GET /api/license/machine-id
```

Réponse :
```json
{
    "machineId": "a1b2c3d4e5f6..."
}
```

### 5.2 Via le statut de la licence

Si une licence est déjà activée, `GET /api/license/status` retourne aussi le `machineId` dans la réponse.

### 5.3 En ligne de commande (hors app)

```bash
# Linux
cat /etc/machine-id

# Windows
wmic csproduct get uuid
```

---

## 6. Renouvellement / Mise à jour

Pour renouveler une licence arrivée à expiration :

1. L'éditeur génère une **nouvelle licence** avec une nouvelle date `--expire-at`
2. Le client appelle `POST /api/license/activate` avec la nouvelle clé
3. L'ancienne licence est remplacée en base de données (upsert)

---

## 7. Dépannage

### 7.1 "Invalid object name 'license'" au démarrage

La table `license` n'existe pas en base. Exécutez le script SQL :

```bash
sqlcmd -S localhost -d Soft_GCC -i BACKEND/bdd/01_CREATE_LICENSE_TABLE.sql
```

Ou via votre outil SQL préféré (SSMS, Azure Data Studio, etc.)

### 7.2 Le middleware bloque tout

Si le middleware empêche l'accès alors qu'aucune licence n'est encore activée, les routes exclues sont :
- `/api/auth/*` — authentification
- `/api/license/*` — gestion des licences
- `/swagger/*` — Swagger UI
- `/health` — health check

Vous devez d'abord vous authentifier, puis activer la licence via `/api/license/activate`.

### 7.3 "ClockRollback" après un redémarrage

L'horloge système a reculé par rapport à la dernière validation stockée en base.
- Vérifiez que l'heure système est correcte (date, timezone, NTP)
- Si l'erreur persiste, l'éditeur peut fournir une nouvelle licence
- Le flag `is_clock_rollback_detected` en base permet de tracer l'incident

---

## 8. Bonnes pratiques

1. ✅ **Générer une licence par client** — Ne pas réutiliser la même licence sur plusieurs machines
2. ✅ **Distribuer la clé par email sécurisé** — Pas de clé en clair dans le code ou le chat
3. ✅ **Redémarrer l'application après activation** — Le middleware se synchronise automatiquement
4. ✅ **Configurer NTP** — Évite les faux positifs de clock rollback
5. ✅ **Sauvegarder `private.key`** — Dans un coffre-fort, pas dans le dépôt Git
6. ❌ **Ne jamais distribuer `private.key`** — La clé privée reste chez l'éditeur
