import "dotenv/config";
import { REST, Routes } from "discord.js";
import { exportCommand } from "./command.js";

// À lancer une seule fois (puis à chaque modification de la commande) :
//   npm run deploy
// Ça enregistre /export auprès de Discord, sur ton serveur uniquement
// (instantané, contrairement à un enregistrement global qui peut prendre 1 h).

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;
if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
  throw new Error("Il manque DISCORD_TOKEN, CLIENT_ID ou GUILD_ID dans le fichier .env");
}

const rest = new REST().setToken(DISCORD_TOKEN);

await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
  body: [exportCommand.toJSON()],
});

console.log("Commande /export enregistrée sur ton serveur !");
