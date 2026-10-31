# RP Export Bot

Bot Discord qui transforme un salon de RP en document Word, avec la commande `/export`.

- Récupère **tout** l'historique du salon (même des milliers de messages)
- Regroupe les messages consécutifs d'un même joueur en une seule réplique
- Garde la mise en forme : *italique*, **gras**, __souligné__, ~~barré~~
- Ajoute un séparateur à chaque nouveau jour de jeu
- Ignore les messages hors-RP `(( ... ))`, `// ...`, `[HRP]` sauf si tu demandes de les garder
- Le fichier n'est visible que par la personne qui lance la commande
- On ne peut exporter que les salons auxquels on a soi-même accès
- Fonctionne sur autant de serveurs que tu veux (bot public)

---

## 1. Créer le bot sur Discord

1. Va sur le [Discord Developer Portal](https://discord.com/developers/applications) > **New Application**, donne-lui un nom.
2. Onglet **General Information** > copie l'**Application ID** (c'est ton `CLIENT_ID`).
3. Onglet **Bot** :
   - **Reset Token** > copie le token (c'est ton `DISCORD_TOKEN`, garde-le secret !)
   - Active **Message Content Intent** (sinon le bot voit des messages vides)
4. Onglet **OAuth2 > URL Generator** :
   - Scopes : `bot` et `applications.commands`
   - Permissions : `View Channels`, `Read Message History`, `Send Messages`, `Attach Files`
   - Ouvre l'URL générée et invite le bot sur ton serveur.
5. Dans Discord : **Paramètres > Avancés > Mode développeur** activé, puis clic droit sur ton serveur > **Copier l'identifiant du serveur** (c'est ton `GUILD_ID`).

## 2. Installer le projet

Il te faut [Node.js](https://nodejs.org) 22 ou plus récent.

```bash
npm install
cp .env.example .env     # puis remplis les 3 valeurs dans .env
npm run deploy:dev       # enregistre /export sur ton serveur de test (instantané)
npm start                # lance le bot
```

Tu dois voir `Connecté en tant que ...`. Le bot fonctionne tant que ce terminal reste ouvert.
`npm run deploy` (sans `:dev`) enregistre `/export` sur **tous** les serveurs où le bot est invité : c'est ce qu'utilise le serveur d'hébergement

## 3. Utiliser le bot

Dans n'importe quel salon :

- `/export` > exporte le salon actuel
- `/export salon:#la-taverne` > exporte un autre salon (ou un fil)
- `/export inclure_hrp:True` > garde aussi les messages hors-RP

---

##  Organisation du code

| Fichier | Rôle |
|---|---|
| `src/command.ts` | Définit la commande `/export` et ses options |
| `src/deploy-commands.ts` | Enregistre la commande auprès de Discord |
| `src/index.ts` | Le bot : reçoit `/export`, lit les messages, renvoie le fichier |
| `src/fetch-messages.ts` | Récupère tout l'historique, 100 messages à la fois |
| `src/build-docx.ts` | Construit le document Word (librairie `docx`) |
| `ecosystem.config.cjs` | Configuration de pm2 (le gardien du bot sur le serveur) |
| `scripts/installer-serveur.sh` | Installation automatique sur un serveur Ubuntu |
| `scripts/mettre-a-jour.sh` | Mise à jour du bot sur le serveur |
