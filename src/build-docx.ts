import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

/** Une "réplique" : un ou plusieurs messages consécutifs du même joueur. */
export interface RpBlock {
  author: string;
  date: Date;
  lines: string[];
}

interface DocInfo {
  title: string;      // nom du salon
  serverName: string;
  blocks: RpBlock[];
}

/**
 * Transforme le markdown Discord le plus courant en "TextRun" Word :
 *   ***gras italique***, **gras**, *italique*, _italique_, __souligné__, ~~barré~~
 * (Volontairement simple : pas de styles imbriqués.)
 */
function parseInline(text: string): TextRun[] {
  const pattern = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|__[^_]+__|\*[^*\s][^*]*\*|_[^_\s][^_]*_|~~[^~]+~~)/g;
  const runs: TextRun[] = [];

  for (const part of text.split(pattern)) {
    if (!part) continue;

    if (part.startsWith("***") && part.endsWith("***") && part.length > 6) {
      runs.push(new TextRun({ text: part.slice(3, -3), bold: true, italics: true }));
    } else if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      runs.push(new TextRun({ text: part.slice(2, -2), bold: true }));
    } else if (part.startsWith("__") && part.endsWith("__") && part.length > 4) {
      runs.push(new TextRun({ text: part.slice(2, -2), underline: {} }));
    } else if (part.startsWith("~~") && part.endsWith("~~") && part.length > 4) {
      runs.push(new TextRun({ text: part.slice(2, -2), strike: true }));
    } else if (
      ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) &&
      part.length > 2
    ) {
      runs.push(new TextRun({ text: part.slice(1, -1), italics: true }));
    } else {
      runs.push(new TextRun(part));
    }
  }
  return runs;
}

/** Nettoie quelques syntaxes propres à Discord. */
function cleanLine(line: string): string {
  return line
    .replace(/<a?:(\w+):\d+>/g, ":$1:")        // émojis perso <:nom:123> → :nom:
    .replace(/<t:(\d+)(:\w)?>/g, (_, ts) =>     // horodatages <t:1700000000:F>
      new Date(Number(ts) * 1000).toLocaleString("fr-FR"))
    .replace(/^-#\s+/, "")                       // petit texte "-# "
    .replace(/^>\s?/, "");                       // citations "> "
}

const formatDate = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/** Construit le document Word et le renvoie sous forme de Buffer. */
export async function buildDocx({ title, serverName, blocks }: DocInfo): Promise<Buffer> {
  const children: Paragraph[] = [];

  // En-tête du document
  children.push(
    new Paragraph({ text: title, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER })
  );

  if (blocks.length > 0) {
    const start = formatDate(blocks[0].date);
    const end = formatDate(blocks[blocks.length - 1].date);
    const authors = [...new Set(blocks.map((b) => b.author))].join(", ");

    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: `${serverName} · ${start === end ? start : `du ${start} au ${end}`}`, italics: true }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [new TextRun({ text: `Participants : ${authors}`, italics: true })],
      })
    );
  }

  // Le RP lui-même
  let currentDay = "";
  for (const block of blocks) {
    // Un séparateur à chaque nouveau jour de jeu.
    const day = formatDate(block.date);
    if (day !== currentDay) {
      currentDay = day;
      children.push(new Paragraph({ text: day, heading: HeadingLevel.HEADING_2, spacing: { before: 400 } }));
    }

    // Nom du joueur / personnage
    children.push(
      new Paragraph({
        spacing: { before: 240, after: 60 },
        children: [new TextRun({ text: block.author, bold: true, color: "5B3E96" })],
      })
    );

    // Son texte, ligne par ligne
    for (const raw of block.lines) {
      const line = cleanLine(raw);
      if (!line.trim()) continue;
      children.push(new Paragraph({ spacing: { after: 80 }, children: parseInline(line) }));
    }
  }

  const doc = new Document({
    creator: "RP Export Bot",
    title,
    styles: { default: { document: { run: { font: "Georgia", size: 24 } } } }, // 12 pt
    sections: [{ children }],
  });

  return Packer.toBuffer(doc);
}
