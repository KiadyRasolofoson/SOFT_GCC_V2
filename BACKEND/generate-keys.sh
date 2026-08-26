#!/bin/bash
# ==============================================================================
# Script de génération des clés RSA pour le système de licensing
# 
# Génère une paire de clés RSA 4096 bits :
#   - private.key  : clé privée (à conserver côté éditeur, NE PAS DISTRIBUER)
#   - public.key   : clé publique (à embarquer dans l'application cliente)
#
# Usage :
#   chmod +x generate-keys.sh
#   ./generate-keys.sh
#
# Après génération :
#   1. Copiez le contenu de public.key dans RsaPublicKeyProvider.cs (constante PublicKeyPem)
#   2. Distribuez private.key à l'équipe qui utilisera LicenseGenerator
#   3. Ne JAMAIS inclure private.key dans le dépôt Git !
# ==============================================================================

set -euo pipefail

OUTPUT_DIR="$(dirname "$0")/keys"
PRIVATE_KEY="$OUTPUT_DIR/private.key"
PUBLIC_KEY="$OUTPUT_DIR/public.key"

echo "=== Génération des clés RSA 4096 ==="

# Crée le dossier de sortie
mkdir -p "$OUTPUT_DIR"

# Génération de la clé privée
echo "→ Génération de la clé privée..."
openssl genpkey -algorithm RSA -out "$PRIVATE_KEY" -pkeyopt rsa_keygen_bits:4096
echo "  ✓ Clé privée : $PRIVATE_KEY"

# Extraction de la clé publique
echo "→ Extraction de la clé publique..."
openssl pkey -in "$PRIVATE_KEY" -out "$PUBLIC_KEY" -pubout
echo "  ✓ Clé publique : $PUBLIC_KEY"

echo ""
echo "=== Résumé ==="
echo "Algorithme : RSA 4096 bits"
echo "Format      : PEM (PKCS#8)"
echo ""
echo "Pour embarquer la clé publique dans l'application :"
echo "  1. Ouvrez Application/Services/license/RsaPublicKeyProvider.cs"
echo "  2. Remplacez la constante PublicKeyPem par le contenu de $PUBLIC_KEY"
echo ""
echo "⚠️  IMPORTANT :"
echo "  - Ajoutez $OUTPUT_DIR au .gitignore"
echo "  - Ne distribuez JAMAIS private.key aux clients"
echo "  - Conservez private.key dans un coffre-fort sécurisé"
echo ""
echo "Terminé !"
