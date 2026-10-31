import type { Message, TextBasedChannel } from "discord.js";

/**
 * Récupère TOUS les messages d'un salon, du plus ancien au plus récent.
 *
 * L'API Discord ne renvoie que 100 messages maximum par requête.
 * On remonte donc l'historique par "pages" : à chaque tour, on demande
 * les 100 messages qui précèdent le plus ancien déjà récupéré,
 * jusqu'à ce que Discord ne renvoie plus rien.
 */
export async function fetchAllMessages(
  channel: TextBasedChannel,
  onProgress?: (count: number) => void
): Promise<Message[]> {
  const all: Message[] = [];
  let before: string | undefined; // id du plus ancien message récupéré

  while (true) {
    const batch = await channel.messages.fetch({ limit: 100, before });
    if (batch.size === 0) break;

    // La Collection arrive du plus récent au plus ancien.
    all.push(...batch.values());
    before = batch.last()!.id;

    onProgress?.(all.length);

    if (batch.size < 100) break; // dernière page atteinte
  }

  // On remet dans l'ordre de lecture : du plus ancien au plus récent.
  return all.reverse();
}

/** Un message de RP est "hors-RP" s'il commence par (( , // ou [HRP]. */
export function isHrp(content: string): boolean {
  const text = content.trim().toLowerCase();
  return text.startsWith("((") || text.startsWith("//") || text.startsWith("[hrp]");
}
