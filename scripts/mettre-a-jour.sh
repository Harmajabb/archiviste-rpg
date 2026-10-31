#!/usr/bin/env bash
# À lancer sur le serveur après y avoir envoyé une nouvelle version du code.
#   bash scripts/mettre-a-jour.sh
set -euo pipefail
cd "$(dirname "$0")/.."

npm ci
npm run deploy
pm2 restart rp-export-bot
echo "Bot mis à jour et redémarré."
