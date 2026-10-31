import "dotenv/config";
import { REST, Routes } from "discord.js";
import { exportCommand } from "./command.js";

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;
if (!DISCORD_TOKEN || !CLIENT_ID) {
  throw new Error("Il manque DISCORD_TOKEN ou CLIENT_ID dans le fichier .env");
}

const devMode = process.argv.includes("--dev");
const rest = new REST().setToken(DISCORD_TOKEN);
const body = [exportCommand.toJSON()];

if (devMode) {
  if (!GUILD_ID) throw new Error("Le mode --dev a besoin de GUILD_ID dans le fichier .env");

  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body });
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
  console.log("/export enregistrée sur ton serveur de test uniquement.");
} else {
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body });
  if (GUILD_ID) {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });
  }
  console.log("/export enregistrée sur tous les serveurs où le bot est invité !");
  console.log("(Discord peut mettre quelques minutes à l'afficher partout.)");
}
