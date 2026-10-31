import { SlashCommandBuilder, ChannelType } from "discord.js";

// Définition de la commande /export telle qu'elle apparaîtra dans Discord.
export const exportCommand = new SlashCommandBuilder()
  .setName("export")
  .setDescription("Exporte le texte d'un salon de RP en document Word")
  .addChannelOption((option) =>
    option
      .setName("salon")
      .setDescription("Salon ou fil à exporter (par défaut : le salon actuel)")
      .addChannelTypes(
        ChannelType.GuildText,
        ChannelType.PublicThread,
        ChannelType.PrivateThread,
        ChannelType.AnnouncementThread
      )
      .setRequired(false)
  )
  .addBooleanOption((option) =>
    option
      .setName("inclure_hrp")
      .setDescription("Garder les messages hors-RP, ex. (( ... )) ou // ... (par défaut : non)")
      .setRequired(false)
  );
