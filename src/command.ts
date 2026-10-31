import { SlashCommandBuilder, ChannelType, InteractionContextType } from "discord.js";

// Définition de la commande /export telle qu'elle apparaîtra dans Discord.
//
// Par défaut, tous les membres peuvent l'utiliser. Chaque admin de serveur
// peut la réserver à certains rôles (ex. les MJ) sans toucher au code :
// Paramètres du serveur > Intégrations > ton bot > /export.
export const exportCommand = new SlashCommandBuilder()
  .setName("export")
  .setDescription("Exporte le texte d'un salon de RP en document Word")
  .setContexts(InteractionContextType.Guild) // uniquement dans un serveur, pas en MP
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
