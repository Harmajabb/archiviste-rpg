import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  Events,
  AttachmentBuilder,
  MessageFlags,
  type ChatInputCommandInteraction,
  type TextBasedChannel,
} from "discord.js";
import { fetchAllMessages, isHrp } from "./fetch-messages.js";
import { buildDocx, type RpBlock } from "./build-docx.js";

// Les "intents" disent à Discord ce que le bot a le droit de voir.
// MessageContent est indispensable pour lire le TEXTE des messages
// (à activer aussi dans le Developer Portal, onglet Bot).
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.once(Events.ClientReady, (c) => {
  console.log(`Connecté en tant que ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== "export") return;

  try {
    await handleExport(interaction);
  } catch (error) {
    console.error(error);
    const message = "Oups, l'export a échoué. Vérifie que j'ai bien accès à ce salon (Voir le salon + Lire l'historique).";
    if (interaction.deferred || interaction.replied) await interaction.editReply(message);
    else await interaction.reply({ content: message, flags: MessageFlags.Ephemeral });
  }
});

async function handleExport(interaction: ChatInputCommandInteraction) {
  const channel = (interaction.options.getChannel("salon") ?? interaction.channel) as TextBasedChannel | null;
  const includeHrp = interaction.options.getBoolean("inclure_hrp") ?? false;

  if (!channel || !("messages" in channel)) {
    await interaction.reply({ content: "Je ne peux pas lire ce salon.", flags: MessageFlags.Ephemeral });
    return;
  }

  // Discord exige une réponse en moins de 3 s. Récupérer des milliers
  // de messages prend plus longtemps : on "diffère" donc la réponse.
  // Ephemeral = seule la personne qui lance la commande voit le résultat.
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  let lastUpdate = Date.now();
  const messages = await fetchAllMessages(channel, async (count) => {
    if (Date.now() - lastUpdate > 3000) {           // petite barre de progression
      lastUpdate = Date.now();
      await interaction.editReply(`Lecture en cours... ${count} messages`);
    }
  });

  // Regroupe les messages consécutifs du même auteur en une seule "réplique".
  const blocks: RpBlock[] = [];
  for (const msg of messages) {
    if (msg.author.bot || msg.system) continue;

    // cleanContent remplace déjà les mentions <@123> par @Pseudo.
    let text = msg.cleanContent;
    if (!includeHrp && isHrp(text)) continue;

    for (const file of msg.attachments.values()) {
      text += `\n[Pièce jointe : ${file.name}]`;
    }
    if (!text.trim()) continue;

    // Le pseudo sur le serveur (souvent le nom du personnage en RP).
    const author = msg.member?.displayName ?? msg.author.globalName ?? msg.author.username;
    const last = blocks[blocks.length - 1];

    // Même auteur, moins de 10 min d'écart > on continue la même réplique.
    if (last && last.author === author && msg.createdAt.getTime() - last.date.getTime() < 10 * 60_000) {
      last.lines.push(...text.split("\n"));
      last.date = msg.createdAt;
    } else {
      blocks.push({ author, date: msg.createdAt, lines: text.split("\n") });
    }
  }

  if (blocks.length === 0) {
    await interaction.editReply("Aucun message de RP trouvé dans ce salon.");
    return;
  }

  const channelName = "name" in channel && channel.name ? channel.name : "rp";
  const buffer = await buildDocx({
    title: channelName,
    serverName: interaction.guild?.name ?? "Discord",
    blocks,
  });

  const file = new AttachmentBuilder(buffer, { name: `${channelName}.docx` });
  await interaction.editReply({
    content: `Voilà ! ${messages.length} messages lus, ${blocks.length} répliques exportées.`,
    files: [file],
  });
}

client.login(process.env.DISCORD_TOKEN);
