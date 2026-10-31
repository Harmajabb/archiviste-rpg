#!/usr/bin/env bash
# Installe et lance le bot sur un serveur Ubuntu (ex. Oracle Cloud).
# À lancer depuis le dossier du projet :   bash scripts/installer-serveur.sh
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "Fichier .env introuvable. Crée-le d'abord :  cp .env.example .env  puis  nano .env"
  exit 1
fi

echo "1/5 Installation de Node.js..."
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
node -v

echo "2/5 Installation de pm2..."
command -v pm2 >/dev/null || sudo npm install -g pm2

echo "3/5 Installation des dépendances du bot..."
npm ci

echo "4/5 Enregistrement de la commande /export…"
npm run deploy

echo "5/5 Démarrage du bot..."
pm2 startOrReload ecosystem.config.cjs
pm2 save
# Relance automatiquement le bot quand le serveur redémarre.
sudo env PATH="$PATH:/usr/bin" "$(command -v pm2)" startup systemd -u "$USER" --hp "$HOME" >/dev/null

echo ""
echo "C'est en ligne ! Commandes utiles :"
echo "   pm2 status                > le bot tourne-t-il ?"
echo "   pm2 logs rp-export-bot    > voir ce qu'il raconte (Ctrl+C pour quitter)"
echo "   pm2 restart rp-export-bot > le redémarrer"
