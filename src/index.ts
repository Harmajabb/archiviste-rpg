import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  Events,
  AttachmentBuilder,
  MessageFlags,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
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
    const message = "Oupsie, l'export a échoué. Vérifie que j'ai bien accès à ce salon (Voir le salon + Lire l'historique).";
    if (interaction.deferred || interaction.replied) await interaction.editReply(message);
    else await interaction.reply({ content: message, flags: MessageFlags.Ephemeral });
  }
});

async function handleExport(interaction: ChatInputCommandInteraction) {
  // inCachedGuild() garantit qu'on est dans un serveur et donne accès au membre complet.
  if (!interaction.inCachedGuild()) {
    await interaction.reply({ content: "Cette commande s'utilise dans un serveur.", flags: MessageFlags.Ephemeral });
    return;
  }

  const channelId = interaction.options.getChannel("salon")?.id ?? interaction.channelId;
  const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
  const includeHrp = interaction.options.getBoolean("inclure_hrp") ?? false;

  if (!channel || !channel.isTextBased()) {
    await interaction.reply({ content: "Je ne peux pas lire ce salon.", flags: MessageFlags.Ephemeral });
    return;
  }

  // Sécurité : la personne qui demande l'export doit pouvoir lire ce salon
  // elle-même. Sinon, n'importe qui pourrait exporter un salon privé.
  const needed = [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory];
  if (!channel.permissionsFor(interaction.member).has(needed)) {
    await interaction.reply({
      content: "Tu n'as pas accès à l'historique de ce salon, je ne peux pas l'exporter pour toi.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Et le bot aussi, pour donner un message clair plutôt qu'une erreur.
  const me = interaction.guild.members.me;
  if (!me || !channel.permissionsFor(me).has(needed)) {
    await interaction.reply({
      content:
        "Je n'ai pas accès à ce salon. Un admin doit autoriser mon rôle à **Voir le salon** et **Lire l'historique des messages**.",
      flags: MessageFlags.Ephemeral,
    });
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
