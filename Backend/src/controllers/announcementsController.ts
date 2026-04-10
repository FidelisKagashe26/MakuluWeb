import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Request, Response } from "express";
import { clearApiCache } from "../middleware/cacheMiddleware.js";
import {
  createAnnouncement,
  deleteAnnouncement,
  findAnnouncementById,
  listActiveAnnouncements,
  listAnnouncements,
  listPublicAnnouncements,
  updateAnnouncement
} from "../models/announcementsModel.js";
import { getSiteSettings } from "../models/siteSettingsModel.js";
import {
  buildAnnouncementDocumentDerivedFields,
  validateAnnouncementDocumentForPublish
} from "../utils/sabbathAnnouncementDocument.js";
import { paginate } from "../utils/pagination.js";

const ANNOUNCEMENT_TYPES = ["emergency", "sabbath", "ongoing"];
const WORKFLOW_STATUSES = ["draft", "published"];

type PdfAlign = "left" | "center" | "right" | "justify";
type PdfFont = "regular" | "bold";

type PdfLine = {
  text: string;
  align: PdfAlign;
  size: number;
  font: PdfFont;
  color?: "dark" | "white";
};

type PdfTheme = {
  pageWidth: number;
  pageHeight: number;
  marginX: number;
  contentTopY: number;
  contentBottomY: number;
  lineHeight: number;
  maxChars: number;
  headerLine1Y: number;
  logoX: number;
  logoY: number;
  logoW: number;
  logoH: number;
};

type PdfHeaderMeta = {
  phone: string;
  email: string;
};

type LogoAsset = {
  hex: string;
  width: number;
  height: number;
};

type EmbeddedFontAsset = {
  baseFontName: string;
  hex: string;
  rawLength: number;
  widths: number[];
  ascent: number;
  descent: number;
  capHeight: number;
  bbox: [number, number, number, number];
  italicAngle: number;
  flags: number;
  stemV: number;
  missingWidth: number;
};

type EmbeddedFontSet = {
  regular: EmbeddedFontAsset | null;
  bold: EmbeddedFontAsset | null;
};

type PdfFontPlan = {
  regularFontObject: string;
  boldFontObject: string;
  extraObjects: Array<{ id: number; content: string }>;
  nextObjectId: number;
};

let cachedLogoAsset: LogoAsset | null | undefined;
let cachedEmbeddedFonts: EmbeddedFontSet | undefined;

const controllerDir = path.dirname(fileURLToPath(import.meta.url));
const logoCandidates = [
  path.resolve(controllerDir, "../assets/AdventistLogoPDF.webp"),
  path.resolve(controllerDir, "../assets/adventistLogo.jpg"),
  path.resolve(process.cwd(), "src/assets/adventistLogo.jpg"),
  path.resolve(process.cwd(), "Backend/src/assets/adventistLogo.jpg")
];
const regularFontCandidates = [
  path.resolve(controllerDir, "../assets/times.ttf"),
  path.resolve(process.cwd(), "src/assets/times.ttf"),
  path.resolve(process.cwd(), "Backend/src/assets/times.ttf"),
  "C:\\Windows\\Fonts\\times.ttf"
];
const boldFontCandidates = [
  path.resolve(controllerDir, "../assets/timesbd.ttf"),
  path.resolve(process.cwd(), "src/assets/timesbd.ttf"),
  path.resolve(process.cwd(), "Backend/src/assets/timesbd.ttf"),
  "C:\\Windows\\Fonts\\timesbd.ttf"
];

function normalizeType(input: unknown) {
  const value = String(input || "").trim().toLowerCase();
  return ANNOUNCEMENT_TYPES.includes(value) ? value : "";
}

function normalizeWorkflowStatus(input: unknown) {
  const value = String(input || "").trim().toLowerCase();
  return WORKFLOW_STATUSES.includes(value) ? value : "";
}

function decodeHtmlEntities(input: string) {
  return String(input || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function stripHtmlToPlainText(input: string) {
  return decodeHtmlEntities(
    String(input || "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<li[^>]*>/gi, "- ")
      .replace(/<\/li>/gi, "\n")
      .replace(/<\/h[1-6]>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function stripHtmlInline(input: string) {
  return decodeHtmlEntities(String(input || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function inferSummary(summary: string, content: string) {
  const cleanedSummary = String(summary || "").trim();
  if (cleanedSummary) return cleanedSummary;

  const plain = stripHtmlToPlainText(content).replace(/\s+/g, " ").trim();
  if (!plain) return "";
  if (plain.length <= 220) return plain;
  return `${plain.slice(0, 220).trimEnd()}...`;
}

function normalizeAnnouncementInput(body: any) {
  const type = normalizeType(body?.type) || "ongoing";
  const workflowStatus = normalizeWorkflowStatus(body?.workflowStatus) || "draft";
  let title = String(body?.title || "").trim();
  let content = String(body?.content || "").trim();
  let summary = inferSummary(String(body?.summary || ""), content);
  let startDate = String(body?.startDate || "").trim();
  let endDate = String(body?.endDate || "").trim();
  let documentData = null;

  if (body?.documentData) {
    const derived = buildAnnouncementDocumentDerivedFields(type, body?.documentData);
    title = derived.title;
    content = derived.content;
    summary = derived.summary;
    documentData = derived.documentData;
    if (derived.startDate) startDate = derived.startDate;
    if (derived.endDate) endDate = derived.endDate;
  }

  return { title, summary, content, type, workflowStatus, startDate, endDate, documentData };
}

function isValidDate(input: string) {
  if (!input) return false;
  const ts = new Date(input).getTime();
  return !Number.isNaN(ts);
}

function sanitizePdfText(input: string) {
  return String(input || "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, "?");
}

function wrapText(text: string, maxChars: number) {
  const output: string[] = [];
  const chunks = String(text || "").split("\n");

  chunks.forEach((chunk) => {
    const line = chunk.trim();
    if (!line) {
      output.push("");
      return;
    }

    const words = line.split(/\s+/);
    let current = "";

    words.forEach((word) => {
      const probe = current ? `${current} ${word}` : word;
      if (probe.length <= maxChars) {
        current = probe;
      } else {
        if (current) output.push(current);

        if (word.length > maxChars) {
          for (let i = 0; i < word.length; i += maxChars) {
            output.push(word.slice(i, i + maxChars));
          }
          current = "";
        } else {
          current = word;
        }
      }
    });

    if (current) output.push(current);
  });

  return output;
}

function extractBlocksFromHtml(contentHtml: string, bodySize: number, maxChars: number) {
  const blocks: PdfLine[] = [];
  const html = String(contentHtml || "").replace(/\r\n/g, "\n").replace(/<br\s*\/?>/gi, "\n");
  const blockRegex = /<(h[1-6]|p|div|li)([^>]*)>([\s\S]*?)<\/\1>/gi;

  let match: RegExpExecArray | null;
  while ((match = blockRegex.exec(html))) {
    const tag = String(match[1] || "").toLowerCase();
    const attrs = String(match[2] || "");
    const rawInner = String(match[3] || "");

    const alignFromStyle = attrs.match(/text-align\s*:\s*(left|center|right)/i)?.[1]?.toLowerCase();
    const alignFromAttr = attrs.match(/align\s*=\s*['\"]?(left|center|right)/i)?.[1]?.toLowerCase();
    const align = (alignFromStyle || alignFromAttr || "left") as PdfAlign;

    const innerText = stripHtmlInline(rawInner);
    if (!innerText) continue;

    const text = tag === "li" ? `* ${innerText}` : innerText;
    const lineSize = /^h[1-6]$/.test(tag) ? bodySize + 2 : bodySize;
    const font: PdfFont = /^h[1-6]$/.test(tag) ? "bold" : "regular";

    const wrapped = wrapText(text, maxChars);
    wrapped.forEach((lineText) => {
      blocks.push({ text: lineText, align, size: lineSize, font, color: "dark" });
    });

    blocks.push({ text: "", align: "left", size: bodySize, font: "regular", color: "dark" });
  }

  if (blocks.length > 0) return blocks;

  const fallback = wrapText(stripHtmlToPlainText(contentHtml), maxChars);
  fallback.forEach((lineText) => {
    blocks.push({ text: lineText, align: "left", size: bodySize, font: "regular", color: "dark" });
  });

  return blocks;
}

function formatAnnouncementType(type: string) {
  if (type === "emergency") return "Matukio ya dharura";
  if (type === "sabbath") return "Matukio ya Sabato";
  return "Matukio ya kawaida";
}

function formatAnnouncementDocumentTitle(type: string) {
  if (type === "emergency") return "MATUKIO YA DHARURA";
  if (type === "sabbath") return "MATUKIO YA SIKU YA SABATO";
  return "MATUKIO YA KAWAIDA";
}

function formatStructuredAnnouncementTitle(type: string, announcementDate: string) {
  const baseTitle = type === "sabbath" ? "MATANGAZO YA SABATO" : formatAnnouncementDocumentTitle(type);
  return announcementDate ? `${baseTitle} YA TAREHE ${announcementDate}` : baseTitle;
}

function getStructuredAnnouncementHeaderLines(documentData: any, fallback: string[] = []) {
  const header = documentData?.header || {};
  const lines = [
    String(header.line1 || "").trim(),
    String(header.line2 || "").trim(),
    String(header.line3 || "").trim(),
    String(header.line4 || "").trim(),
    String(header.line5 || "").trim()
  ].filter(Boolean);

  return lines.length ? lines : fallback;
}

function shouldRenderStructuredExtendedSections(type: string) {
  return type === "sabbath";
}

function formatAnnouncementStatus(status: string) {
  if (status === "active") return "Active";
  if (status === "scheduled") return "Scheduled";
  if (status === "expired") return "Expired";
  return "Draft";
}

function formatSchedule(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) return "Not scheduled";
  return `${new Date(startDate).toLocaleString()} - ${new Date(endDate).toLocaleString()}`;
}

function buildNumberedBodyLines(content: string, maxChars: number, fontSize: number) {
  const lines: PdfLine[] = [];
  const plain = stripHtmlToPlainText(content || "")
    .replace(/\bCENTRAL\s+TANZANIAN\s+FIELD\b/gi, "")
    .replace(/\bDODOMA\s+MAKULU\s+SDA\s+CHURCH\b/gi, "")
    .replace(/\b0\d{8,9}\s*,\s*0\d{8,9}\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  const normalized = plain.replace(/([.!?])\s*(\d+[\.\)]\s+)/g, "$1\n$2");
  const paragraphs = normalized
    .split(/\n+/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (!paragraphs.length) return lines;

  const explicitNumbering = paragraphs.filter((paragraph) => /^\d+[\.\)]\s+/.test(paragraph));

  if (explicitNumbering.length > 0) {
    explicitNumbering.forEach((paragraph) => {
      const match = paragraph.match(/^(\d+)[\.\)]\s+(.*)$/);
      if (!match) return;

      const numberPrefix = `${match[1]}. `;
      const text = String(match[2] || "").trim();
      if (!text) return;

      const wrapped = wrapText(text, Math.max(maxChars - numberPrefix.length, 8));
      if (wrapped.length === 0) return;

      lines.push({
        text: `${numberPrefix}${wrapped[0]}`,
        align: "left",
        size: fontSize,
        font: "regular",
        color: "dark"
      });

      const hangingPrefix = " ".repeat(numberPrefix.length);
      wrapped.slice(1).forEach((line) =>
        lines.push({
          text: `${hangingPrefix}${line}`,
          align: "left",
          size: fontSize,
          font: "regular",
          color: "dark"
        })
      );
    });

    return lines;
  }

  paragraphs.forEach((paragraph, index) => {
    const prefix = `${index + 1}. `;
    const wrapped = wrapText(paragraph, Math.max(maxChars - prefix.length, 8));
    if (wrapped.length === 0) return;

    lines.push({
      text: `${prefix}${wrapped[0]}`,
      align: "left",
      size: fontSize,
      font: "regular",
      color: "dark"
    });

    const hangingPrefix = " ".repeat(prefix.length);
    wrapped.slice(1).forEach((line) =>
      lines.push({
        text: `${hangingPrefix}${line}`,
        align: "left",
        size: fontSize,
        font: "regular",
        color: "dark"
      })
    );
  });

  return lines;
}

function getTheme(layout: "a4" | "slides"): PdfTheme {
  if (layout === "slides") {
    const pageWidth = 1280;
    const marginX = 82;
    const logoW = 72;
    return {
      pageWidth,
      pageHeight: 720,
      marginX,
      contentTopY: 556,
      contentBottomY: 60,
      lineHeight: 34,
      maxChars: 88,
      headerLine1Y: 646,
      logoX: pageWidth - marginX - logoW,
      logoY: 628,
      logoW,
      logoH: 72
    };
  }

  const pageWidth = 595;
  const marginX = 40;
  const logoW = 38;
  return {
    pageWidth,
    pageHeight: 842,
    marginX,
    contentTopY: 726,
    contentBottomY: 64,
    lineHeight: 17,
    maxChars: 92,
    headerLine1Y: 800,
    logoX: pageWidth - marginX - logoW,
    logoY: 780,
    logoW,
    logoH: 38
  };
}

function parseJpegSize(buffer: Buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return { width: 225, height: 225 };
  }

  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    if (marker === 0xc0 || marker === 0xc2) {
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      return { width, height };
    }

    if (marker === 0xd9 || marker === 0xda) break;

    if (offset + 4 >= buffer.length) break;
    const length = buffer.readUInt16BE(offset + 2);
    if (!length) break;
    offset += 2 + length;
  }

  return { width: 225, height: 225 };
}

async function getLogoAsset(): Promise<LogoAsset | null> {
  if (cachedLogoAsset !== undefined) return cachedLogoAsset;

  for (const candidate of logoCandidates) {
    try {
      const bytes = await readFile(candidate);
      if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
        continue;
      }
      const size = parseJpegSize(bytes);
      cachedLogoAsset = {
        hex: `${bytes.toString("hex")}>`,
        width: size.width,
        height: size.height
      };
      return cachedLogoAsset;
    } catch {
      // try next path
    }
  }

  cachedLogoAsset = null;
  return cachedLogoAsset;
}

function scaleTrueTypeMetric(value: number, unitsPerEm: number) {
  if (!unitsPerEm) return value;
  return Math.round((value * 1000) / unitsPerEm);
}

function getTrueTypeTables(buffer: Buffer) {
  if (buffer.length < 12) return new Map<string, { offset: number; length: number }>();

  const numTables = buffer.readUInt16BE(4);
  const tables = new Map<string, { offset: number; length: number }>();

  for (let index = 0; index < numTables; index += 1) {
    const entryOffset = 12 + index * 16;
    if (entryOffset + 16 > buffer.length) break;
    const tag = buffer.toString("ascii", entryOffset, entryOffset + 4);
    const offset = buffer.readUInt32BE(entryOffset + 8);
    const length = buffer.readUInt32BE(entryOffset + 12);
    tables.set(tag, { offset, length });
  }

  return tables;
}

function getTrueTypeTable(buffer: Buffer, tables: Map<string, { offset: number; length: number }>, tag: string) {
  const table = tables.get(tag);
  if (!table) return null;
  if (table.offset + table.length > buffer.length) return null;
  return table;
}

function readFixedPoint16_16(buffer: Buffer, offset: number) {
  return buffer.readInt32BE(offset) / 65536;
}

function lookupGlyphInFormat4(buffer: Buffer, subtableOffset: number, charCode: number) {
  const segCount = buffer.readUInt16BE(subtableOffset + 6) / 2;
  const endCodesOffset = subtableOffset + 14;
  const startCodesOffset = endCodesOffset + segCount * 2 + 2;
  const idDeltasOffset = startCodesOffset + segCount * 2;
  const idRangeOffsetsOffset = idDeltasOffset + segCount * 2;

  for (let index = 0; index < segCount; index += 1) {
    const endCode = buffer.readUInt16BE(endCodesOffset + index * 2);
    if (charCode > endCode) continue;

    const startCode = buffer.readUInt16BE(startCodesOffset + index * 2);
    if (charCode < startCode) return 0;

    const idDelta = buffer.readInt16BE(idDeltasOffset + index * 2);
    const idRangeOffset = buffer.readUInt16BE(idRangeOffsetsOffset + index * 2);

    if (idRangeOffset === 0) {
      return (charCode + idDelta + 0x10000) % 0x10000;
    }

    const glyphOffset =
      idRangeOffsetsOffset + index * 2 + idRangeOffset + (charCode - startCode) * 2;

    if (glyphOffset + 2 > buffer.length) return 0;

    const glyphId = buffer.readUInt16BE(glyphOffset);
    if (glyphId === 0) return 0;
    return (glyphId + idDelta + 0x10000) % 0x10000;
  }

  return 0;
}

function lookupGlyphInFormat12(buffer: Buffer, subtableOffset: number, charCode: number) {
  const numGroups = buffer.readUInt32BE(subtableOffset + 12);
  let groupOffset = subtableOffset + 16;

  for (let index = 0; index < numGroups; index += 1) {
    if (groupOffset + 12 > buffer.length) return 0;

    const startCharCode = buffer.readUInt32BE(groupOffset);
    const endCharCode = buffer.readUInt32BE(groupOffset + 4);
    const startGlyphId = buffer.readUInt32BE(groupOffset + 8);

    if (charCode >= startCharCode && charCode <= endCharCode) {
      return startGlyphId + (charCode - startCharCode);
    }

    if (charCode < startCharCode) return 0;
    groupOffset += 12;
  }

  return 0;
}

function lookupGlyphId(
  buffer: Buffer,
  cmapTableOffset: number,
  cmapTableLength: number,
  charCode: number
) {
  const recordCount = buffer.readUInt16BE(cmapTableOffset + 2);
  const candidates: Array<{ priority: number; offset: number }> = [];

  for (let index = 0; index < recordCount; index += 1) {
    const recordOffset = cmapTableOffset + 4 + index * 8;
    if (recordOffset + 8 > buffer.length) break;

    const platformId = buffer.readUInt16BE(recordOffset);
    const encodingId = buffer.readUInt16BE(recordOffset + 2);
    const relativeOffset = buffer.readUInt32BE(recordOffset + 4);
    const subtableOffset = cmapTableOffset + relativeOffset;
    if (subtableOffset + 2 > buffer.length) continue;
    if (subtableOffset > cmapTableOffset + cmapTableLength) continue;

    let priority = 99;
    if (platformId === 3 && encodingId === 1) priority = 1;
    else if (platformId === 3 && encodingId === 0) priority = 2;
    else if (platformId === 0) priority = 3;

    if (priority < 99) candidates.push({ priority, offset: subtableOffset });
  }

  candidates.sort((left, right) => left.priority - right.priority);

  for (const candidate of candidates) {
    const format = buffer.readUInt16BE(candidate.offset);
    if (format === 4) {
      return lookupGlyphInFormat4(buffer, candidate.offset, charCode);
    }

    if (format === 12) {
      return lookupGlyphInFormat12(buffer, candidate.offset, charCode);
    }
  }

  return 0;
}

function buildEmbeddedFontAsset(
  buffer: Buffer,
  baseFontName: string,
  defaultFlags: number,
  defaultStemV: number
): EmbeddedFontAsset | null {
  const tables = getTrueTypeTables(buffer);
  const head = getTrueTypeTable(buffer, tables, "head");
  const hhea = getTrueTypeTable(buffer, tables, "hhea");
  const hmtx = getTrueTypeTable(buffer, tables, "hmtx");
  const cmap = getTrueTypeTable(buffer, tables, "cmap");

  if (!head || !hhea || !hmtx || !cmap) return null;

  const unitsPerEm = buffer.readUInt16BE(head.offset + 18);
  const xMin = scaleTrueTypeMetric(buffer.readInt16BE(head.offset + 36), unitsPerEm);
  const yMin = scaleTrueTypeMetric(buffer.readInt16BE(head.offset + 38), unitsPerEm);
  const xMax = scaleTrueTypeMetric(buffer.readInt16BE(head.offset + 40), unitsPerEm);
  const yMax = scaleTrueTypeMetric(buffer.readInt16BE(head.offset + 42), unitsPerEm);
  const ascender = scaleTrueTypeMetric(buffer.readInt16BE(hhea.offset + 4), unitsPerEm);
  const descender = scaleTrueTypeMetric(buffer.readInt16BE(hhea.offset + 6), unitsPerEm);
  const numberOfHMetrics = buffer.readUInt16BE(hhea.offset + 34);

  let capHeight = ascender;
  let missingWidth = 500;
  let flags = defaultFlags;
  let stemV = defaultStemV;

  const os2 = getTrueTypeTable(buffer, tables, "OS/2");
  if (os2) {
    if (os2.length >= 4) {
      missingWidth = Math.max(scaleTrueTypeMetric(buffer.readInt16BE(os2.offset + 2), unitsPerEm), 250);
    }

    if (os2.length >= 8) {
      const weightClass = buffer.readUInt16BE(os2.offset + 4);
      if (weightClass >= 700) {
        flags |= 262144;
        stemV = 120;
      }
    }

    if (os2.length >= 90) {
      capHeight = scaleTrueTypeMetric(buffer.readInt16BE(os2.offset + 88), unitsPerEm);
    }
  }

  let italicAngle = 0;
  const post = getTrueTypeTable(buffer, tables, "post");
  if (post && post.length >= 8) {
    italicAngle = readFixedPoint16_16(buffer, post.offset + 4);
    if (italicAngle !== 0) {
      flags |= 64;
    }
  }

  const lastAdvanceWidthOffset = hmtx.offset + Math.max(numberOfHMetrics - 1, 0) * 4;
  const lastAdvanceWidth =
    lastAdvanceWidthOffset + 2 <= buffer.length ? buffer.readUInt16BE(lastAdvanceWidthOffset) : unitsPerEm;

  const widths: number[] = [];
  for (let charCode = 32; charCode <= 126; charCode += 1) {
    const glyphId = lookupGlyphId(buffer, cmap.offset, cmap.length, charCode);
    let advanceWidth = lastAdvanceWidth;

    if (glyphId > 0) {
      const metricIndex = Math.min(glyphId, Math.max(numberOfHMetrics - 1, 0));
      const metricOffset = hmtx.offset + metricIndex * 4;
      if (metricOffset + 2 <= buffer.length) {
        advanceWidth = buffer.readUInt16BE(metricOffset);
      }
    }

    widths.push(scaleTrueTypeMetric(advanceWidth, unitsPerEm));
  }

  return {
    baseFontName,
    hex: `${buffer.toString("hex")}>`,
    rawLength: buffer.length,
    widths,
    ascent: ascender,
    descent: descender,
    capHeight,
    bbox: [xMin, yMin, xMax, yMax],
    italicAngle,
    flags,
    stemV,
    missingWidth
  };
}

async function loadEmbeddedFont(
  candidates: string[],
  baseFontName: string,
  defaultFlags: number,
  defaultStemV: number
) {
  for (const candidate of candidates) {
    try {
      const bytes = await readFile(candidate);
      const parsed = buildEmbeddedFontAsset(bytes, baseFontName, defaultFlags, defaultStemV);
      if (parsed) return parsed;
    } catch {
      // try next path
    }
  }

  return null;
}

async function getEmbeddedFonts(): Promise<EmbeddedFontSet> {
  if (cachedEmbeddedFonts) return cachedEmbeddedFonts;

  const [regular, bold] = await Promise.all([
    loadEmbeddedFont(regularFontCandidates, "TimesNewRomanPSMT", 34, 80),
    loadEmbeddedFont(boldFontCandidates, "TimesNewRomanPS-BoldMT", 34, 120)
  ]);

  cachedEmbeddedFonts = { regular, bold };
  return cachedEmbeddedFonts;
}

function buildPdfFontPlan(startObjectId: number, fonts: EmbeddedFontSet): PdfFontPlan {
  let nextObjectId = startObjectId;
  const extraObjects: Array<{ id: number; content: string }> = [];

  const buildFontObject = (font: EmbeddedFontAsset | null, fallbackBaseFont: string) => {
    if (!font) {
      return `<< /Type /Font /Subtype /Type1 /BaseFont /${fallbackBaseFont} >>`;
    }

    const descriptorId = nextObjectId;
    nextObjectId += 1;
    const fileObjectId = nextObjectId;
    nextObjectId += 1;

    extraObjects.push({
      id: descriptorId,
      content:
        `<< /Type /FontDescriptor /FontName /${font.baseFontName} /Flags ${font.flags} ` +
        `/FontBBox [${font.bbox.join(" ")}] /ItalicAngle ${font.italicAngle.toFixed(2)} ` +
        `/Ascent ${font.ascent} /Descent ${font.descent} /CapHeight ${font.capHeight} ` +
        `/StemV ${font.stemV} /MissingWidth ${font.missingWidth} /FontFile2 ${fileObjectId} 0 R >>`
    });
    extraObjects.push({
      id: fileObjectId,
      content:
        `<< /Length ${font.hex.length} /Length1 ${font.rawLength} /Filter /ASCIIHexDecode >>\nstream\n${font.hex}\nendstream`
    });

    return (
      `<< /Type /Font /Subtype /TrueType /BaseFont /${font.baseFontName} ` +
      `/FirstChar 32 /LastChar 126 /Widths [${font.widths.join(" ")}] ` +
      `/FontDescriptor ${descriptorId} 0 R /Encoding /WinAnsiEncoding >>`
    );
  };

  return {
    regularFontObject: buildFontObject(fonts.regular, "Times-Roman"),
    boldFontObject: buildFontObject(fonts.bold, "Times-Bold"),
    extraObjects,
    nextObjectId
  };
}

function getEmbeddedFontForStyle(font: PdfFont) {
  if (!cachedEmbeddedFonts) return null;
  return font === "bold" ? cachedEmbeddedFonts.bold : cachedEmbeddedFonts.regular;
}

function estimateTextWidth(text: string, fontSize: number, font: PdfFont = "regular") {
  const safeText = sanitizePdfText(text);
  const embeddedFont = getEmbeddedFontForStyle(font);

  if (!embeddedFont) {
    return safeText.length * fontSize * 0.46;
  }

  let totalUnits = 0;
  for (const char of safeText) {
    const code = char.charCodeAt(0);
    if (code >= 32 && code <= 126) {
      totalUnits += embeddedFont.widths[code - 32] ?? embeddedFont.missingWidth;
    } else {
      totalUnits += embeddedFont.missingWidth;
    }
  }

  return (totalUnits * fontSize) / 1000;
}

type WrappedPdfTextLine = {
  text: string;
  isLastLine: boolean;
};

function splitWordToWidth(word: string, fontSize: number, font: PdfFont, maxWidth: number) {
  const segments: string[] = [];
  let cursor = String(word || "");

  while (cursor) {
    let chunk = "";

    for (const char of cursor) {
      const probe = `${chunk}${char}`;
      if (!chunk || estimateTextWidth(probe, fontSize, font) <= maxWidth) {
        chunk = probe;
        continue;
      }
      break;
    }

    if (!chunk) {
      chunk = cursor.slice(0, 1);
    }

    segments.push(chunk);
    cursor = cursor.slice(chunk.length);
  }

  return segments;
}

function wrapTextToWidth(text: string, fontSize: number, maxWidth: number, font: PdfFont = "regular") {
  return wrapTextByWidth(text, fontSize, font, maxWidth).map((line) => line.text);
}

function wrapTextByWidth(text: string, fontSize: number, font: PdfFont, maxWidth: number) {
  const lines: WrappedPdfTextLine[] = [];
  const paragraphs = String(text || "")
    .replace(/\r\n/g, "\n")
    .split("\n");

  paragraphs.forEach((paragraph) => {
    const normalized = paragraph.replace(/\s+/g, " ").trim();
    if (!normalized) return;

    const paragraphLines: string[] = [];
    let current = "";

    const pushSegment = (segment: string) => {
      const probe = current ? `${current} ${segment}` : segment;
      if (!current || estimateTextWidth(probe, fontSize, font) <= maxWidth) {
        current = probe;
        return;
      }

      paragraphLines.push(current);
      current = segment;
    };

    normalized.split(" ").forEach((word) => {
      if (estimateTextWidth(word, fontSize, font) <= maxWidth) {
        pushSegment(word);
        return;
      }

      splitWordToWidth(word, fontSize, font, maxWidth).forEach((segment) => pushSegment(segment));
    });

    if (current) {
      paragraphLines.push(current);
    }

    paragraphLines.forEach((line, index) => {
      lines.push({ text: line, isLastLine: index === paragraphLines.length - 1 });
    });
  });

  return lines;
}

function formatSabbathAnnouncementDate(input: string) {
  if (!input) return "";

  const date = new Date(`${input}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function drawAlignedText(
  text: string,
  x: number,
  y: number,
  fontSize: number,
  font: PdfFont,
  align: PdfAlign = "left",
  color: "dark" | "white" = "dark",
  maxWidth = 0
) {
  if (!text) return "";

  const fontRef = font === "bold" ? "F2" : "F1";
  const safeText = sanitizePdfText(text);
  const availableWidth = maxWidth || estimateTextWidth(text, fontSize, font);
  const textWidth = estimateTextWidth(text, fontSize, font);
  let drawX = x;
  let wordSpacingCommand = "";

  if (align === "center") {
    drawX = x + (availableWidth - textWidth) / 2;
  } else if (align === "right") {
    drawX = x + availableWidth - textWidth;
  } else if (align === "justify" && maxWidth > textWidth) {
    const spaces = (safeText.match(/ /g) || []).length;
    if (spaces > 0) {
      const extraWidth = maxWidth - textWidth;
      if (extraWidth > 0.2) {
        wordSpacingCommand = ` ${(extraWidth / spaces).toFixed(3)} Tw`;
      }
    }
  }

  const colorCommand = color === "white" ? "1 1 1 rg" : "0.07 0.07 0.07 rg";
  return `${colorCommand} BT /${fontRef} ${fontSize} Tf ${Math.max(drawX, 0)} ${y} Td${wordSpacingCommand} (${safeText}) Tj ET\n`;
}

function drawLine(x1: number, y1: number, x2: number, y2: number, width = 0.5, stroke = "0.70 0.70 0.70 RG") {
  return `${stroke} ${width} w ${x1} ${y1} m ${x2} ${y2} l S\n`;
}

function drawRect(x: number, y: number, width: number, height: number, stroke = "0.72 0.72 0.72 RG", lineWidth = 0.5) {
  return `${stroke} ${lineWidth} w ${x} ${y} ${width} ${height} re S\n`;
}

function drawTable(
  x: number,
  topY: number,
  columnWidths: number[],
  headers: string[],
  rows: string[][],
  fontSize: number,
  rowHeight: number
) {
  const totalWidth = columnWidths.reduce((sum, value) => sum + value, 0);
  const totalRows = rows.length + 1;
  const height = totalRows * rowHeight;
  const bottomY = topY - height;
  let stream = drawRect(x, bottomY, totalWidth, height);

  let currentX = x;
  for (let i = 0; i < columnWidths.length - 1; i += 1) {
    currentX += columnWidths[i];
    stream += drawLine(currentX, topY, currentX, bottomY);
  }

  for (let rowIndex = 1; rowIndex < totalRows; rowIndex += 1) {
    const lineY = topY - rowIndex * rowHeight;
    stream += drawLine(x, lineY, x + totalWidth, lineY);
  }

  let headerX = x;
  headers.forEach((header, index) => {
    stream += drawAlignedText(header, headerX + 4, topY - rowHeight + 5, fontSize, "bold");
    headerX += columnWidths[index];
  });

  rows.forEach((row, rowIndex) => {
    let rowX = x;
    row.forEach((cell, cellIndex) => {
      stream += drawAlignedText(cell, rowX + 4, topY - (rowIndex + 2) * rowHeight + 5, fontSize, "regular");
      rowX += columnWidths[cellIndex];
    });
  });

  return { stream, bottomY };
}

function buildSabbathA4PageStreams(announcement: any, hasLogo: boolean) {
  const documentData = announcement?.documentData || {};
  const announcementDate = formatSabbathAnnouncementDate(String(documentData.announcementDate || ""));
  const showExtendedSections = shouldRenderStructuredExtendedSections(String(announcement?.type || ""));
  const pageWidth = 595;
  const pageHeight = 842;
  const rightBarWidth = 62;
  const rightBarX = pageWidth - rightBarWidth;
  const contentLeft = 48;
  const contentRight = rightBarX - 48;
  const contentWidth = contentRight - contentLeft;
  const baseFontSize = 12;
  const lineHeight = 18;
  const tableRowHeight = 18;
  const sectionGap = 24;
  const footerY = 34;
  const bottomLimitY = 96;
  const pageContentStartY = 784;
  const firstHeaderStartY = 756;
  const numberedPrefixWidth = 20;
  const midweekTableColumns = [36, 150, 118, 118];
  const compactTableColumns = [36, 194, 192];
  const tableColumns = [36, 150, 118, 118];
  const fellowshipColumns = [36, 150, 118, 118];
  const midweekTableWidth = midweekTableColumns.reduce((sum, value) => sum + value, 0);
  const compactTableWidth = compactTableColumns.reduce((sum, value) => sum + value, 0);
  const standardTableWidth = tableColumns.reduce((sum, value) => sum + value, 0);
  const fellowshipTableWidth = fellowshipColumns.reduce((sum, value) => sum + value, 0);
  const midweekTableX = contentLeft + (contentWidth - midweekTableWidth) / 2;
  const compactTableX = contentLeft + (contentWidth - compactTableWidth) / 2;
  const standardTableX = contentLeft + (contentWidth - standardTableWidth) / 2;
  const fellowshipTableX = contentLeft + (contentWidth - fellowshipTableWidth) / 2;

  const buildPageBackground = () => {
    let stream = "";
    stream += `0.93 0.93 0.93 rg 0 0 ${pageWidth} ${pageHeight} re f\n`;
    stream += `0.77 0.82 0.93 rg ${rightBarX} 0 ${rightBarWidth} ${pageHeight} re f\n`;
    return stream;
  };

  const buildLogo = () => {
    if (!hasLogo) return "";
    const logoHeight = 86;
    return `q ${rightBarWidth} 0 0 ${logoHeight} ${rightBarX} ${pageHeight - logoHeight} cm /Im1 Do Q\n`;
  };

  type PageBuffer = {
    stream: string;
    y: number;
  };

  const pages: PageBuffer[] = [];

  const createPage = (isFirstPage: boolean) => {
    const page: PageBuffer = {
      stream: buildPageBackground() + buildLogo(),
      y: isFirstPage ? 0 : pageContentStartY
    };
    pages.push(page);
    return page;
  };

  const getCurrentPage = () => pages[pages.length - 1];
  const addPage = () => createPage(false);
  const ensureSpace = (requiredHeight: number) => {
    let page = getCurrentPage();
    if (page.y - requiredHeight < bottomLimitY) {
      page = addPage();
    }
    return page;
  };
  const addGap = (amount: number) => {
    if (amount <= 0) return;
    const page = getCurrentPage();
    if (page.y - amount < bottomLimitY) {
      addPage();
      return;
    }
    page.y -= amount;
  };

  const headerLines = getStructuredAnnouncementHeaderLines(documentData);

  const firstPage = createPage(true);
  let y = firstHeaderStartY;
  headerLines.forEach((line) => {
    firstPage.stream += drawAlignedText(line, contentLeft, y, baseFontSize, "bold", "center", "dark", contentWidth);
    y -= lineHeight;
  });

  y -= 14;
  const title = formatStructuredAnnouncementTitle(String(announcement?.type || ""), announcementDate);
  firstPage.stream += drawAlignedText(title, contentLeft, y, baseFontSize, "bold", "center", "dark", contentWidth);
  const underlineWidth = estimateTextWidth(title, baseFontSize, "bold");
  const underlineX = contentLeft + (contentWidth - underlineWidth) / 2;
  firstPage.stream += drawLine(underlineX, y - 2, underlineX + underlineWidth, y - 2, 0.6, "0.10 0.10 0.10 RG");
  firstPage.y = y - 34;

  const renderSectionTitle = (text: string, minContentHeight: number) => {
    addGap(sectionGap);
    const page = ensureSpace(lineHeight + minContentHeight);
    page.stream += drawAlignedText(text, contentLeft, page.y, baseFontSize, "bold", "center", "dark", contentWidth);
    page.y -= lineHeight;
  };

  const renderNumberedParagraphs = (entries: string[]) => {
    const textX = contentLeft + numberedPrefixWidth;
    const textWidth = contentWidth - numberedPrefixWidth;

    entries.forEach((entry, index) => {
      const wrappedLines = wrapTextByWidth(String(entry || "").trim(), baseFontSize, "regular", textWidth);
      if (wrappedLines.length === 0) return;

      wrappedLines.forEach((line, lineIndex) => {
        const page = ensureSpace(lineHeight);
        if (lineIndex === 0) {
          page.stream += drawAlignedText(`${index + 1}.`, contentLeft, page.y, baseFontSize, "regular");
        }

        page.stream += drawAlignedText(
          line.text,
          textX,
          page.y,
          baseFontSize,
          "regular",
          line.isLastLine ? "left" : "justify",
          "dark",
          textWidth
        );
        page.y -= lineHeight;
      });

      addGap(6);
    });
  };

  const renderSimpleList = (entries: string[]) => {
    const textX = contentLeft + numberedPrefixWidth;
    const textWidth = contentWidth - numberedPrefixWidth;

    entries.forEach((entry, index) => {
      const wrappedLines = wrapTextByWidth(String(entry || "").trim(), baseFontSize, "regular", textWidth);
      if (wrappedLines.length === 0) return;

      wrappedLines.forEach((line, lineIndex) => {
        const page = ensureSpace(lineHeight);
        if (lineIndex === 0) {
          page.stream += drawAlignedText(`${index + 1}.`, contentLeft + 4, page.y, baseFontSize, "regular");
        }

        page.stream += drawAlignedText(
          line.text,
          textX,
          page.y,
          baseFontSize,
          "regular",
          line.isLastLine ? "left" : "justify",
          "dark",
          textWidth
        );
        page.y -= lineHeight;
      });
    });
  };

  const renderSimpleListBox = (entries: string[]) => {
    const normalizedEntries = entries.map((entry) => String(entry || "").trim()).filter(Boolean);
    const boxWidth = Math.round(contentWidth * 0.82);
    const boxX = contentLeft + (contentWidth - boxWidth) / 2;
    const paddingX = 12;
    const paddingY = 8;
    const rowGap = 4;
    const numberWidth = 26;
    const textX = boxX + paddingX + numberWidth;
    const textWidth = boxWidth - paddingX * 2 - numberWidth;
    const rows = normalizedEntries.map((entry, index) => ({
      number: `${index + 1}.`,
      lines: wrapTextByWidth(entry, baseFontSize, "regular", textWidth)
    }));

    if (!rows.length) {
      const page = ensureSpace(lineHeight + paddingY * 2);
      const boxHeight = lineHeight + paddingY * 2;
      const bottomY = page.y - boxHeight;
      page.stream += drawRect(boxX, bottomY, boxWidth, boxHeight);
      page.y = bottomY;
      return;
    }

    let rowIndex = 0;
    while (rowIndex < rows.length) {
      let page = getCurrentPage();
      let chunkHeight = 0;
      const chunkRows: typeof rows = [];

      while (rowIndex < rows.length) {
        const row = rows[rowIndex];
        const rowHeight = Math.max(row.lines.length, 1) * lineHeight + rowGap;
        const nextChunkHeight = chunkRows.length === 0 ? rowHeight : chunkHeight + rowHeight;
        const totalHeightWithPadding = nextChunkHeight + paddingY * 2;

        if (page.y - totalHeightWithPadding < bottomLimitY) {
          if (chunkRows.length === 0) {
            page = addPage();
            continue;
          }
          break;
        }

        chunkRows.push(row);
        chunkHeight = nextChunkHeight;
        rowIndex += 1;
      }

      if (!chunkRows.length) {
        continue;
      }

      const boxHeight = chunkHeight + paddingY * 2;
      const bottomY = page.y - boxHeight;
      page.stream += drawRect(boxX, bottomY, boxWidth, boxHeight);

      let cursorY = page.y - paddingY - lineHeight + 2;
      chunkRows.forEach((row, chunkIndex) => {
        row.lines.forEach((line, lineIndex) => {
          if (lineIndex === 0) {
            page.stream += drawAlignedText(row.number, boxX + paddingX, cursorY, baseFontSize, "regular");
          }

          page.stream += drawAlignedText(
            line.text,
            textX,
            cursorY,
            baseFontSize,
            "regular",
            line.isLastLine ? "left" : "justify",
            "dark",
            textWidth
          );
          cursorY -= lineHeight;
        });

        if (chunkIndex < chunkRows.length - 1) {
          const dividerY = cursorY + lineHeight / 2;
          page.stream += drawLine(boxX, dividerY, boxX + boxWidth, dividerY);
        }

        cursorY -= rowGap;
      });

      page.y = bottomY;
    }
  };

  const renderTableSection = (
    titleText: string,
    headers: string[],
    rows: string[][],
    columnWidths: number[],
    tableX: number
  ) => {
    renderSectionTitle(titleText, tableRowHeight * 2);

    let rowIndex = 0;
    const totalRows = rows.length;

    while (rowIndex < totalRows || (totalRows === 0 && rowIndex === 0)) {
      let page = getCurrentPage();
      const availableHeight = page.y - bottomLimitY;
      const rowsFit = Math.floor(availableHeight / tableRowHeight) - 1;

      if (rowsFit < 0 || (totalRows > rowIndex && rowsFit < 1)) {
        page = addPage();
        continue;
      }

      const chunkRows =
        totalRows === 0 ? [] : rows.slice(rowIndex, rowIndex + Math.max(rowsFit, 1));
      const table = drawTable(tableX, page.y, columnWidths, headers, chunkRows, baseFontSize, tableRowHeight);
      page.stream += table.stream;
      page.y = table.bottomY;

      if (totalRows === 0) break;
      rowIndex += chunkRows.length;

      if (rowIndex < totalRows) {
        addPage();
      }
    }
  };

  const items = Array.isArray(documentData.announcementItems) ? documentData.announcementItems : [];
  renderNumberedParagraphs(items);

  if (showExtendedSections) {
    const midweekRows = (Array.isArray(documentData.midweekWorkers) ? documentData.midweekWorkers : []).map(
      (row: any, index: number) => [
        `${index + 1}.`,
        String(row.day || "").trim(),
        String(row.chairperson || "").trim(),
        String(row.secretary || "").trim()
      ]
    );
    if (midweekRows.length) {
      renderTableSection(
        "WAHUDUMU KATIKATI YA WIKI",
        ["S/N", "SIKU", "MWENYEKITI", "KATIBU"],
        midweekRows,
        midweekTableColumns,
        midweekTableX
      );
    }

    const todayRows = (Array.isArray(documentData.todaySabbathWorkers) ? documentData.todaySabbathWorkers : []).map(
      (row: any, index: number) => [
        `${index + 1}.`,
        String(row.role || "").trim(),
        String(row.chairperson || "").trim()
      ]
    );
    if (todayRows.length) {
      renderTableSection(
        "WAHUDUMU WA SABATO YA LEO",
        ["S/N", "SIKU", "MWENYEKITI"],
        todayRows,
        compactTableColumns,
        compactTableX
      );
    }

    const nextRows = (Array.isArray(documentData.nextWeekSabbathWorkers) ? documentData.nextWeekSabbathWorkers : []).map(
      (row: any, index: number) => [
        `${index + 1}.`,
        String(row.role || "").trim(),
        String(row.chairperson || "").trim()
      ]
    );
    if (nextRows.length) {
      renderTableSection(
        "WAHUDUMU WA WIKI IJAYO",
        ["S/N", "SIKU", "MWENYEKITI"],
        nextRows,
        compactTableColumns,
        compactTableX
      );
    }

    const deacons = Array.isArray(documentData.deaconsOnDuty) ? documentData.deaconsOnDuty : [];
    if (deacons.length) {
      renderSectionTitle("MASHEMASI WA ZAMU", lineHeight * 2);
      addGap(6);
      renderSimpleListBox(deacons);
    }

    const fellowshipRows = (Array.isArray(documentData.fellowship) ? documentData.fellowship : []).map((row: any, index: number) => [
      `${index + 1}.`,
      String(row.name || "").trim(),
      String(row.fromChurch || "").trim(),
      String(row.toChurch || "").trim()
    ]);
    if (fellowshipRows.length) {
      renderTableSection(
        "SHIRIKA",
        ["S/N", "JINA", "KUTOKA", "KUINGIA"],
        fellowshipRows,
        fellowshipColumns,
        fellowshipTableX
      );
    }
  }

  const totalPages = pages.length;
  pages.forEach((page, index) => {
    page.stream += drawAlignedText(
      `Page ${index + 1} of ${totalPages}`,
      contentLeft,
      footerY,
      10,
      "regular",
      "center",
      "dark",
      contentWidth
    );
  });

  return pages.map((page) => page.stream);
}

function buildSabbathSlidesPageStreams(announcement: any, logoAsset: LogoAsset | null) {
  const documentData = announcement?.documentData || {};
  const announcementDate = formatSabbathAnnouncementDate(String(documentData.announcementDate || ""));
  const showExtendedSections = shouldRenderStructuredExtendedSections(String(announcement?.type || ""));
  const pageWidth = 1280;
  const pageHeight = 720;
  const rightBarWidth = 133;
  const rightBarX = pageWidth - rightBarWidth;
  const contentLeft = 103;
  const contentRight = rightBarX - 103;
  const contentWidth = contentRight - contentLeft;
  const sectionTitleFontSize = 28;
  const contentFontSize = 28;
  const smallTextFontSize = 20;
  const tableFontSize = 20;
  const footerFontSize = 20;
  const coverHeaderFontSize = 30;
  const coverHeaderLineHeight = 34;
  const coverTitleFontSize = 56;
  const coverTitleLineHeight = 60;
  const coverTitleGap = 42;
  const headerLineHeight = 24;
  const contentLineHeight = 34;
  const tableRowHeight = 32;
  const sectionGap = 38;
  const footerY = 24;
  const bottomLimitY = 76;
  const pageContentStartY = 654;
  const numberedPrefixWidth = 36;
  const fullPageContentHeight = pageContentStartY - bottomLimitY;
  const sourceContentWidth = 437;
  const buildScaledColumns = (sourceColumns: number[]) => {
    const sourceWidth = sourceColumns.reduce((sum, value) => sum + value, 0);
    const targetWidth = Math.round((sourceWidth / sourceContentWidth) * contentWidth);
    let usedWidth = 0;

    return sourceColumns.map((sourceWidthValue, index) => {
      if (index === sourceColumns.length - 1) {
        return targetWidth - usedWidth;
      }

      const scaledWidth = Math.round((sourceWidthValue / sourceWidth) * targetWidth);
      usedWidth += scaledWidth;
      return scaledWidth;
    });
  };
  const midweekTableColumns = buildScaledColumns([36, 150, 118, 118]);
  const compactTableColumns = buildScaledColumns([36, 194, 192]);
  const fellowshipColumns = buildScaledColumns([36, 150, 118, 118]);
  const midweekTableWidth = midweekTableColumns.reduce((sum, value) => sum + value, 0);
  const compactTableWidth = compactTableColumns.reduce((sum, value) => sum + value, 0);
  const fellowshipTableWidth = fellowshipColumns.reduce((sum, value) => sum + value, 0);
  const midweekTableX = contentLeft + (contentWidth - midweekTableWidth) / 2;
  const compactTableX = contentLeft + (contentWidth - compactTableWidth) / 2;
  const fellowshipTableX = contentLeft + (contentWidth - fellowshipTableWidth) / 2;
  const headerLines = getStructuredAnnouncementHeaderLines(documentData, [
    "KANISA LA WAADVENTISTA WASABATO",
    "JIMBO LA KATI MWA TANZANIA",
    "MTAA WA KISASA",
    "DODOMA MAKULU",
    "0767525234, 0658625234 & 0764543645"
  ]);

  const buildPageBackground = () => {
    let stream = "";
    stream += `0.93 0.93 0.93 rg 0 0 ${pageWidth} ${pageHeight} re f\n`;
    stream += `0.77 0.82 0.93 rg ${rightBarX} 0 ${rightBarWidth} ${pageHeight} re f\n`;
    return stream;
  };

  const buildLogo = () => {
    if (!logoAsset) return "";
    const logoWidth = rightBarWidth;
    const safeLogoWidth = Math.max(logoAsset.width, 1);
    const logoHeight = Math.max(48, Math.round((logoAsset.height / safeLogoWidth) * logoWidth));
    return `q ${logoWidth} 0 0 ${logoHeight} ${rightBarX} ${pageHeight - logoHeight} cm /Im1 Do Q\n`;
  };

  type PageBuffer = {
    stream: string;
    y: number;
  };

  const pages: PageBuffer[] = [];

  const createPage = (isFirstPage: boolean) => {
    const page: PageBuffer = {
      stream: buildPageBackground() + buildLogo(),
      y: isFirstPage ? 0 : pageContentStartY
    };
    pages.push(page);
    return page;
  };

  const getCurrentPage = () => pages[pages.length - 1];
  const addPage = () => createPage(false);
  const ensureSpace = (requiredHeight: number) => {
    let page = getCurrentPage();
    if (page.y - requiredHeight < bottomLimitY) {
      page = addPage();
    }
    return page;
  };
  const addGap = (amount: number) => {
    if (amount <= 0) return;
    const page = getCurrentPage();
    if (page.y - amount < bottomLimitY) {
      addPage();
      return;
    }
    page.y -= amount;
  };

  const title = formatStructuredAnnouncementTitle(String(announcement?.type || ""), announcementDate);
  const coverPage = createPage(true);
  const coverTitleLines = wrapTextByWidth(title, coverTitleFontSize, "bold", contentWidth).map((line) => line.text);
  const coverHeaderBlockHeight = Math.max((headerLines.length - 1) * coverHeaderLineHeight, 0);
  const coverTitleBlockHeight = Math.max((coverTitleLines.length - 1) * coverTitleLineHeight, 0);
  const coverBlockHeight = coverHeaderBlockHeight + coverTitleGap + coverTitleBlockHeight;
  let y = Math.round(pageHeight / 2 + coverBlockHeight / 2);

  headerLines.forEach((line) => {
    coverPage.stream += drawAlignedText(line, contentLeft, y, coverHeaderFontSize, "bold", "center", "dark", contentWidth);
    y -= coverHeaderLineHeight;
  });

  y -= coverTitleGap;
  let lastTitleBaselineY = y;
  coverTitleLines.forEach((line) => {
    lastTitleBaselineY = y;
    coverPage.stream += drawAlignedText(line, contentLeft, y, coverTitleFontSize, "bold", "center", "dark", contentWidth);
    y -= coverTitleLineHeight;
  });

  const longestTitleLine =
    coverTitleLines.reduce((longest, line) =>
      estimateTextWidth(line, coverTitleFontSize, "bold") > estimateTextWidth(longest, coverTitleFontSize, "bold")
        ? line
        : longest
    , coverTitleLines[0] || title);
  const underlineWidth = estimateTextWidth(longestTitleLine, coverTitleFontSize, "bold");
  const underlineX = contentLeft + (contentWidth - underlineWidth) / 2;
  coverPage.stream += drawLine(
    underlineX,
    lastTitleBaselineY - 6,
    underlineX + underlineWidth,
    lastTitleBaselineY - 6,
    0.8,
    "0.10 0.10 0.10 RG"
  );

  // Announcements begin on the slide after the cover page.
  addPage();

  const renderSectionTitle = (text: string, minContentHeight: number) => {
    addGap(sectionGap);
    const page = ensureSpace(contentLineHeight + minContentHeight);
    page.stream += drawAlignedText(text, contentLeft, page.y, sectionTitleFontSize, "bold", "center", "dark", contentWidth);
    page.y -= contentLineHeight;
  };

  const renderNumberedParagraphs = (entries: string[]) => {
    const textX = contentLeft + numberedPrefixWidth;
    const textWidth = contentWidth - numberedPrefixWidth;

    entries.forEach((entry, index) => {
      const wrappedLines = wrapTextByWidth(String(entry || "").trim(), contentFontSize, "regular", textWidth);
      if (wrappedLines.length === 0) return;
      const entryHeight = wrappedLines.length * contentLineHeight + 8;
      const currentPage = getCurrentPage();
      if (currentPage.y - entryHeight < bottomLimitY) {
        const freshFits = pageContentStartY - entryHeight >= bottomLimitY;
        if (freshFits || currentPage.y < pageContentStartY) {
          addPage();
        }
      }

      wrappedLines.forEach((line, lineIndex) => {
        const page = ensureSpace(contentLineHeight);
        if (lineIndex === 0) {
          page.stream += drawAlignedText(`${index + 1}.`, contentLeft, page.y, contentFontSize, "regular");
        }

        page.stream += drawAlignedText(
          line.text,
          textX,
          page.y,
          contentFontSize,
          "regular",
          line.isLastLine ? "left" : "justify",
          "dark",
          textWidth
        );
        page.y -= contentLineHeight;
      });

      addGap(8);
    });
  };

  const measureSimpleListBoxHeight = (entries: string[]) => {
    const normalizedEntries = entries.map((entry) => String(entry || "").trim()).filter(Boolean);
    const paddingY = 12;
    const rowGap = 6;
    const numberWidth = 40;
    const boxWidth = Math.round(contentWidth * 0.82);
    const textWidth = boxWidth - 18 * 2 - numberWidth;
    const rows = normalizedEntries.map((entry) => wrapTextByWidth(entry, smallTextFontSize, "regular", textWidth));

    if (!rows.length) {
      return contentLineHeight + paddingY * 2;
    }

    const contentHeight = rows.reduce((total, lines) => total + Math.max(lines.length, 1) * headerLineHeight + rowGap, 0);
    return contentHeight + paddingY * 2;
  };

  const renderSimpleListBox = (entries: string[]) => {
    const normalizedEntries = entries.map((entry) => String(entry || "").trim()).filter(Boolean);
    const boxWidth = Math.round(contentWidth * 0.82);
    const boxX = contentLeft + (contentWidth - boxWidth) / 2;
    const paddingX = 18;
    const paddingY = 12;
    const rowGap = 6;
    const numberWidth = 40;
    const textX = boxX + paddingX + numberWidth;
    const textWidth = boxWidth - paddingX * 2 - numberWidth;
    const rows = normalizedEntries.map((entry, index) => ({
      number: `${index + 1}.`,
      lines: wrapTextByWidth(entry, smallTextFontSize, "regular", textWidth)
    }));
    const fullBoxHeight = measureSimpleListBoxHeight(entries);

    if (getCurrentPage().y - fullBoxHeight < bottomLimitY) {
      const freshFits = pageContentStartY - fullBoxHeight >= bottomLimitY;
      if (freshFits || getCurrentPage().y < pageContentStartY) {
        addPage();
      }
    }

    if (!rows.length) {
      const page = ensureSpace(contentLineHeight + paddingY * 2);
      const boxHeight = contentLineHeight + paddingY * 2;
      const bottomY = page.y - boxHeight;
      page.stream += drawRect(boxX, bottomY, boxWidth, boxHeight);
      page.y = bottomY;
      return;
    }

    let rowIndex = 0;
    while (rowIndex < rows.length) {
      let page = getCurrentPage();
      let chunkHeight = 0;
      const chunkRows: typeof rows = [];

      while (rowIndex < rows.length) {
        const row = rows[rowIndex];
        const rowHeight = Math.max(row.lines.length, 1) * headerLineHeight + rowGap;
        const nextChunkHeight = chunkRows.length === 0 ? rowHeight : chunkHeight + rowHeight;
        const totalHeightWithPadding = nextChunkHeight + paddingY * 2;

        if (page.y - totalHeightWithPadding < bottomLimitY) {
          if (chunkRows.length === 0) {
            page = addPage();
            continue;
          }
          break;
        }

        chunkRows.push(row);
        chunkHeight = nextChunkHeight;
        rowIndex += 1;
      }

      if (!chunkRows.length) {
        continue;
      }

      const boxHeight = chunkHeight + paddingY * 2;
      const bottomY = page.y - boxHeight;
      page.stream += drawRect(boxX, bottomY, boxWidth, boxHeight);

      let cursorY = page.y - paddingY - headerLineHeight + 2;
      chunkRows.forEach((row, chunkIndex) => {
        row.lines.forEach((line, lineIndex) => {
          if (lineIndex === 0) {
            page.stream += drawAlignedText(row.number, boxX + paddingX, cursorY, smallTextFontSize, "regular");
          }

          page.stream += drawAlignedText(
            line.text,
            textX,
            cursorY,
            smallTextFontSize,
            "regular",
            line.isLastLine ? "left" : "justify",
            "dark",
            textWidth
          );
          cursorY -= headerLineHeight;
        });

        if (chunkIndex < chunkRows.length - 1) {
          const dividerY = cursorY + headerLineHeight / 2;
          page.stream += drawLine(boxX, dividerY, boxX + boxWidth, dividerY);
        }

        cursorY -= rowGap;
      });

      page.y = bottomY;
    }
  };

  const renderTableSection = (
    titleText: string,
    headers: string[],
    rows: string[][],
    columnWidths: number[],
    tableX: number
  ) => {
    renderSectionTitle(titleText, tableRowHeight * 2);

    let rowIndex = 0;
    const totalRows = rows.length;

    while (rowIndex < totalRows || (totalRows === 0 && rowIndex === 0)) {
      let page = getCurrentPage();
      const availableHeight = page.y - bottomLimitY;
      const rowsFit = Math.floor(availableHeight / tableRowHeight) - 1;

      if (rowsFit < 0 || (totalRows > rowIndex && rowsFit < 1)) {
        page = addPage();
        continue;
      }

      const chunkRows =
        totalRows === 0 ? [] : rows.slice(rowIndex, rowIndex + Math.max(rowsFit, 1));
      const table = drawTable(tableX, page.y, columnWidths, headers, chunkRows, tableFontSize, tableRowHeight);
      page.stream += table.stream;
      page.y = table.bottomY;

      if (totalRows === 0) break;
      rowIndex += chunkRows.length;

      if (rowIndex < totalRows) {
        addPage();
      }
    }
  };

  const items = Array.isArray(documentData.announcementItems) ? documentData.announcementItems : [];
  renderNumberedParagraphs(items);

  if (showExtendedSections) {
    const midweekRows = (Array.isArray(documentData.midweekWorkers) ? documentData.midweekWorkers : []).map(
      (row: any, index: number) => [
        `${index + 1}.`,
        String(row.day || "").trim(),
        String(row.chairperson || "").trim(),
        String(row.secretary || "").trim()
      ]
    );
    if (midweekRows.length) {
      renderTableSection(
        "WAHUDUMU KATIKATI YA WIKI",
        ["S/N", "SIKU", "MWENYEKITI", "KATIBU"],
        midweekRows,
        midweekTableColumns,
        midweekTableX
      );
    }

    const todayRows = (Array.isArray(documentData.todaySabbathWorkers) ? documentData.todaySabbathWorkers : []).map(
      (row: any, index: number) => [
        `${index + 1}.`,
        String(row.role || "").trim(),
        String(row.chairperson || "").trim()
      ]
    );
    if (todayRows.length) {
      renderTableSection(
        "WAHUDUMU WA SABATO YA LEO",
        ["S/N", "SIKU", "MWENYEKITI"],
        todayRows,
        compactTableColumns,
        compactTableX
      );
    }

    const nextRows = (Array.isArray(documentData.nextWeekSabbathWorkers) ? documentData.nextWeekSabbathWorkers : []).map(
      (row: any, index: number) => [
        `${index + 1}.`,
        String(row.role || "").trim(),
        String(row.chairperson || "").trim()
      ]
    );
    if (nextRows.length) {
      renderTableSection(
        "WAHUDUMU WA WIKI IJAYO",
        ["S/N", "SIKU", "MWENYEKITI"],
        nextRows,
        compactTableColumns,
        compactTableX
      );
    }

    const deacons = Array.isArray(documentData.deaconsOnDuty) ? documentData.deaconsOnDuty : [];
    if (deacons.length) {
      renderSectionTitle(
        "MASHEMASI WA ZAMU",
        Math.min(measureSimpleListBoxHeight(deacons) + 6, fullPageContentHeight - contentLineHeight)
      );
      addGap(6);
      renderSimpleListBox(deacons);
    }

    const fellowshipRows = (Array.isArray(documentData.fellowship) ? documentData.fellowship : []).map((row: any, index: number) => [
      `${index + 1}.`,
      String(row.name || "").trim(),
      String(row.fromChurch || "").trim(),
      String(row.toChurch || "").trim()
    ]);
    if (fellowshipRows.length) {
      renderTableSection(
        "SHIRIKA",
        ["S/N", "JINA", "KUTOKA", "KUINGIA"],
        fellowshipRows,
        fellowshipColumns,
        fellowshipTableX
      );
    }
  }

  const totalPages = Math.max(pages.length - 1, 1);
  pages.slice(1).forEach((page, index) => {
    page.stream += drawAlignedText(
      `Page ${index + 1} of ${totalPages}`,
      contentLeft,
      footerY,
      footerFontSize,
      "regular",
      "center",
      "dark",
      contentWidth
    );
  });

  return pages.map((page) => page.stream);
}

async function buildSabbathAnnouncementA4Pdf(announcement: any) {
  const logoAsset = await getLogoAsset();
  const embeddedFonts = await getEmbeddedFonts();
  const pageStreams = buildSabbathA4PageStreams(announcement, Boolean(logoAsset));
  const baseObjects = 4;
  const pageObjects = pageStreams.length * 2;
  const firstPageObjectId = 5;
  const fontPlan = buildPdfFontPlan(firstPageObjectId + pageObjects, embeddedFonts);
  const logoObjectId = logoAsset ? fontPlan.nextObjectId : null;
  const totalObjects = fontPlan.nextObjectId - 1 + (logoAsset ? 1 : 0);
  const offsets: number[] = new Array(totalObjects + 1).fill(0);
  const pageWidth = 595;
  const pageHeight = 842;
  let pdf = "%PDF-1.4\n";

  const appendObject = (objectId: number, content: string) => {
    offsets[objectId] = Buffer.byteLength(pdf, "utf8");
    pdf += `${objectId} 0 obj\n${content}\nendobj\n`;
  };

  appendObject(1, "<< /Type /Catalog /Pages 2 0 R >>");
  const kids = pageStreams.map((_, index) => `${firstPageObjectId + index * 2} 0 R`).join(" ");
  appendObject(2, `<< /Type /Pages /Kids [${kids}] /Count ${pageStreams.length} >>`);
  appendObject(3, fontPlan.regularFontObject);
  appendObject(4, fontPlan.boldFontObject);

  pageStreams.forEach((stream, index) => {
    const pageObjectId = firstPageObjectId + index * 2;
    const contentObjectId = pageObjectId + 1;
    const xObjectRef = logoObjectId ? `/XObject << /Im1 ${logoObjectId} 0 R >>` : "";

    appendObject(
      pageObjectId,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> ${xObjectRef} >> /Contents ${contentObjectId} 0 R >>`
    );

    const streamLength = Buffer.byteLength(stream, "utf8");
    appendObject(contentObjectId, `<< /Length ${streamLength} >>\nstream\n${stream}endstream`);
  });

  fontPlan.extraObjects.forEach((fontObject) => {
    appendObject(fontObject.id, fontObject.content);
  });

  if (logoObjectId && logoAsset) {
    appendObject(
      logoObjectId,
      `<< /Type /XObject /Subtype /Image /Width ${logoAsset.width} /Height ${logoAsset.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCIIHexDecode /DCTDecode] /Length ${logoAsset.hex.length} >>\nstream\n${logoAsset.hex}\nendstream`
    );
  }

  const xrefStart = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${totalObjects + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let i = 1; i <= totalObjects; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
}

async function buildSabbathAnnouncementSlidesPdf(announcement: any) {
  const logoAsset = await getLogoAsset();
  const embeddedFonts = await getEmbeddedFonts();
  const pageStreams = buildSabbathSlidesPageStreams(announcement, logoAsset);
  const baseObjects = 4;
  const pageObjects = pageStreams.length * 2;
  const firstPageObjectId = 5;
  const fontPlan = buildPdfFontPlan(firstPageObjectId + pageObjects, embeddedFonts);
  const logoObjectId = logoAsset ? fontPlan.nextObjectId : null;
  const totalObjects = fontPlan.nextObjectId - 1 + (logoAsset ? 1 : 0);
  const offsets: number[] = new Array(totalObjects + 1).fill(0);
  const pageWidth = 1280;
  const pageHeight = 720;
  let pdf = "%PDF-1.4\n";

  const appendObject = (objectId: number, content: string) => {
    offsets[objectId] = Buffer.byteLength(pdf, "utf8");
    pdf += `${objectId} 0 obj\n${content}\nendobj\n`;
  };

  appendObject(1, "<< /Type /Catalog /Pages 2 0 R >>");
  const kids = pageStreams.map((_, index) => `${firstPageObjectId + index * 2} 0 R`).join(" ");
  appendObject(2, `<< /Type /Pages /Kids [${kids}] /Count ${pageStreams.length} >>`);
  appendObject(3, fontPlan.regularFontObject);
  appendObject(4, fontPlan.boldFontObject);

  pageStreams.forEach((stream, index) => {
    const pageObjectId = firstPageObjectId + index * 2;
    const contentObjectId = pageObjectId + 1;
    const xObjectRef = logoObjectId ? `/XObject << /Im1 ${logoObjectId} 0 R >>` : "";

    appendObject(
      pageObjectId,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> ${xObjectRef} >> /Contents ${contentObjectId} 0 R >>`
    );

    const streamLength = Buffer.byteLength(stream, "utf8");
    appendObject(contentObjectId, `<< /Length ${streamLength} >>\nstream\n${stream}endstream`);
  });

  fontPlan.extraObjects.forEach((fontObject) => {
    appendObject(fontObject.id, fontObject.content);
  });

  if (logoObjectId && logoAsset) {
    appendObject(
      logoObjectId,
      `<< /Type /XObject /Subtype /Image /Width ${logoAsset.width} /Height ${logoAsset.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCIIHexDecode /DCTDecode] /Length ${logoAsset.hex.length} >>\nstream\n${logoAsset.hex}\nendstream`
    );
  }

  const xrefStart = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${totalObjects + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let i = 1; i <= totalObjects; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
}

function buildPdfPages(announcement: any, theme: PdfTheme, headerMeta: PdfHeaderMeta) {
  const isSlidesLayout = theme.pageWidth > 1000;
  const bodySize = isSlidesLayout ? 26 : 12;
  const bodyLines = buildNumberedBodyLines(announcement.content || "", theme.maxChars, bodySize);

  const firstPageLines: PdfLine[] = [];
  firstPageLines.push({
    text: "JIMBO LA KATI MWA TANZANIA",
    align: "center",
    size: isSlidesLayout ? 24 : 13,
    font: "bold",
    color: "dark"
  });

  firstPageLines.push({
    text: "KANISA LA WASABATO DODOMA MAKULU",
    align: "center",
    size: isSlidesLayout ? 24 : 13,
    font: "bold",
    color: "dark"
  });
  
  if (headerMeta.phone) {
    firstPageLines.push({
      text: headerMeta.phone,
      align: "center",
      size: isSlidesLayout ? 18 : 11,
      font: "regular",
      color: "dark"
    });
  }
  
  if (headerMeta.email) {
    firstPageLines.push({
      text: headerMeta.email,
      align: "center",
      size: isSlidesLayout ? 18 : 11,
      font: "regular",
      color: "dark"
    });
  }
  firstPageLines.push({ text: "", align: "left", size: bodySize, font: "regular", color: "dark" });
  firstPageLines.push({
    text: formatAnnouncementDocumentTitle(announcement.type),
    align: "center",
    size: isSlidesLayout ? 34 : 14,
    font: "bold",
    color: "dark"
  });
  firstPageLines.push({ text: "", align: "left", size: bodySize, font: "regular", color: "dark" });

  const linesPerPage = Math.max(
    Math.floor((theme.contentTopY - theme.contentBottomY) / theme.lineHeight),
    1
  );
  const pages: PdfLine[][] = [];

  const firstCapacity = Math.max(linesPerPage - firstPageLines.length, 1);
  pages.push([...firstPageLines, ...bodyLines.slice(0, firstCapacity)]);

  let cursor = firstCapacity;
  while (cursor < bodyLines.length) {
    const capacity = Math.max(linesPerPage, 1);
    pages.push(bodyLines.slice(cursor, cursor + capacity));
    cursor += capacity;
  }

  return pages;
}

async function buildAnnouncementPdf(
  announcement: any,
  layout: "a4" | "slides",
  headerMeta: PdfHeaderMeta
) {
  if (layout === "a4" && announcement?.documentData) {
    return buildSabbathAnnouncementA4Pdf(announcement);
  }

  if (layout === "slides" && announcement?.documentData) {
    return buildSabbathAnnouncementSlidesPdf(announcement);
  }

  const theme = getTheme(layout);
  const pages = buildPdfPages(announcement, theme, headerMeta);
  const logoAsset = await getLogoAsset();
  const embeddedFonts = layout === "slides" ? { regular: null, bold: null } : await getEmbeddedFonts();
  const baseObjects = 4;
  const pageObjects = pages.length * 2;
  const firstPageObjectId = 5;
  const fontPlan =
    layout === "slides"
      ? {
          regularFontObject: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
          boldFontObject: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
          extraObjects: [],
          nextObjectId: firstPageObjectId + pageObjects
        }
      : buildPdfFontPlan(firstPageObjectId + pageObjects, embeddedFonts);
  const logoObjectId = logoAsset ? fontPlan.nextObjectId : null;
  const totalObjects = fontPlan.nextObjectId - 1 + (logoAsset ? 1 : 0);

  const offsets: number[] = new Array(totalObjects + 1).fill(0);
  let pdf = "%PDF-1.4\n";

  const appendObject = (objectId: number, content: string) => {
    offsets[objectId] = Buffer.byteLength(pdf, "utf8");
    pdf += `${objectId} 0 obj\n${content}\nendobj\n`;
  };

  appendObject(1, "<< /Type /Catalog /Pages 2 0 R >>");

  const kids = pages
    .map((_, index) => `${firstPageObjectId + index * 2} 0 R`)
    .join(" ");

  appendObject(2, `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);
  appendObject(3, fontPlan.regularFontObject);
  appendObject(4, fontPlan.boldFontObject);

  pages.forEach((pageLines, index) => {
    const pageObjectId = firstPageObjectId + index * 2;
    const contentObjectId = pageObjectId + 1;

    const xObjectRef = logoObjectId ? `/XObject << /Im1 ${logoObjectId} 0 R >>` : "";
    appendObject(
      pageObjectId,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${theme.pageWidth} ${theme.pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> ${xObjectRef} >> /Contents ${contentObjectId} 0 R >>`
    );

    let stream = "";

    // Background and decorations.
    stream += `0.97 0.98 1 rg 0 0 ${theme.pageWidth} ${theme.pageHeight} re f\n`;
    stream += `0.22 0.30 0.72 rg 0 ${theme.pageHeight - 92} ${theme.pageWidth} 92 re f\n`;
    const dividerY = theme.pageHeight - 98;
    stream += `0.55 0.67 0.95 RG 1.1 w ${theme.marginX} ${dividerY} m ${theme.pageWidth - theme.marginX} ${dividerY} l S\n`;

    // Logo (real image when available).
    if (logoObjectId && logoAsset) {
      stream += `q ${theme.logoW} 0 0 ${theme.logoH} ${theme.logoX} ${theme.logoY} cm /Im1 Do Q\n`;
    } else {
      stream += `0.11 0.24 0.62 rg ${theme.logoX} ${theme.logoY} ${theme.logoW} ${theme.logoH} re f\n`;
      stream += `1 1 1 rg BT /F2 ${theme.pageWidth > 1000 ? 16 : 10} Tf ${
        theme.logoX + 6
      } ${theme.logoY + theme.logoH / 2 - 4} Td (SDA) Tj ET\n`;
    }

    // Header center text.
    const churchTitle = sanitizePdfText("DODOMA MAKULU SDA CHURCH");

    const churchSize = theme.pageWidth > 1000 ? 34 : 19;

    const centerXChurch = (theme.pageWidth - churchTitle.length * churchSize * 0.45) / 2;

    stream += `1 1 1 rg BT /F2 ${churchSize} Tf ${Math.max(centerXChurch, theme.marginX)} ${
      theme.headerLine1Y
    } Td (${churchTitle}) Tj ET\n`;

    // Main content text.
    let y = theme.contentTopY;
    const contentWidth = theme.pageWidth - theme.marginX * 2;

    pageLines.forEach((line) => {
      if (!line.text) {
        y -= theme.lineHeight;
        return;
      }

      const text = sanitizePdfText(line.text);
      const roughWidth = text.length * line.size * 0.46;

      let x = theme.marginX;
      if (line.align === "center") {
        x = theme.marginX + (contentWidth - roughWidth) / 2;
      } else if (line.align === "right") {
        x = theme.marginX + contentWidth - roughWidth;
      }

      const fontRef = line.font === "bold" ? "F2" : "F1";
      if (line.color === "white") {
        stream += "1 1 1 rg ";
      } else {
        stream += "0.08 0.14 0.35 rg ";
      }
      stream += `BT /${fontRef} ${line.size} Tf ${Math.max(x, theme.marginX)} ${y} Td (${text}) Tj ET\n`;
      y -= theme.lineHeight;
    });

    const streamLength = Buffer.byteLength(stream, "utf8");
    appendObject(contentObjectId, `<< /Length ${streamLength} >>\nstream\n${stream}endstream`);
  });

  fontPlan.extraObjects.forEach((fontObject) => {
    appendObject(fontObject.id, fontObject.content);
  });

  if (logoObjectId && logoAsset) {
    appendObject(
      logoObjectId,
      `<< /Type /XObject /Subtype /Image /Width ${logoAsset.width} /Height ${logoAsset.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCIIHexDecode /DCTDecode] /Length ${logoAsset.hex.length} >>\nstream\n${logoAsset.hex}\nendstream`
    );
  }

  const xrefStart = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${totalObjects + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let i = 1; i <= totalObjects; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
}

export async function getAnnouncements(req: Request, res: Response) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const status = String(req.query.status || "");
    const type = normalizeType(req.query.type);
    const search = String(req.query.search || "").trim().toLowerCase();

    const source = await listAnnouncements({ includeDraft: true });
    const filtered = source.filter((item) => {
      if (status && item.status !== status) return false;
      if (type && item.type !== type) return false;
      if (!search) return true;

      return (
        String(item.title || "").toLowerCase().includes(search) ||
        String(item.summary || "").toLowerCase().includes(search) ||
        String(item.content || "").toLowerCase().includes(search) ||
        String(item.updatedByName || "").toLowerCase().includes(search)
      );
    });

    const { items, meta } = paginate(filtered, page, limit);
    return res.json({ ok: true, data: items, meta });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function getPublicAnnouncements(req: Request, res: Response) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 50);
    const status = String(req.query.status || "");
    const type = normalizeType(req.query.type);
    const search = String(req.query.search || "").trim().toLowerCase();
    const source = await listPublicAnnouncements();

    const filtered = source.filter((item) => {
      if (status && item.status !== status) return false;
      if (type && item.type !== type) return false;
      if (!search) return true;

      return (
        String(item.title || "").toLowerCase().includes(search) ||
        String(item.summary || "").toLowerCase().includes(search) ||
        String(item.content || "").toLowerCase().includes(search)
      );
    });

    const { items, meta } = paginate(filtered, page, limit);
    return res.json({ ok: true, data: items, meta });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function getActiveAnnouncements(req: Request, res: Response) {
  try {
    const type = normalizeType(req.query.type);
    const items = await listActiveAnnouncements();
    const filtered = type ? items.filter((item) => item.type === type) : items;
    return res.json({ ok: true, data: filtered });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function createAnnouncementHandler(req: Request, res: Response) {
  const payload = normalizeAnnouncementInput(req.body || {});
  if (!payload.title) {
    return res.status(400).json({ ok: false, message: "Title inahitajika." });
  }

  if (payload.workflowStatus === "published") {
    if (payload.documentData) {
      const documentValidation = validateAnnouncementDocumentForPublish(payload.type, payload.documentData);
      if (documentValidation) {
        return res.status(400).json({ ok: false, message: documentValidation });
      }
    }

    if (!isValidDate(payload.startDate) || !isValidDate(payload.endDate)) {
      return res.status(400).json({
        ok: false,
        message: "Published announcement lazima iwe na startDate na endDate sahihi."
      });
    }

    if (new Date(payload.startDate).getTime() > new Date(payload.endDate).getTime()) {
      return res.status(400).json({
        ok: false,
        message: "startDate haiwezi kuwa kubwa kuliko endDate."
      });
    }
  }

  try {
    const created = await createAnnouncement({
      ...payload,
      createdById: req.auth?.id || "",
      createdByName: req.auth?.fullName || "",
      updatedById: req.auth?.id || "",
      updatedByName: req.auth?.fullName || ""
    });

    clearApiCache();
    return res.status(201).json({ ok: true, data: created });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function updateAnnouncementHandler(req: Request, res: Response) {
  try {
    const announcement = await findAnnouncementById(req.params.announcementId);
    if (!announcement) {
      return res.status(404).json({ ok: false, message: "Tangazo halijapatikana." });
    }

    const payload = normalizeAnnouncementInput({ ...announcement, ...(req.body || {}) });
    if (!payload.title) {
      return res.status(400).json({ ok: false, message: "Title inahitajika." });
    }

    if (payload.workflowStatus === "published") {
      if (payload.documentData) {
        const documentValidation = validateAnnouncementDocumentForPublish(payload.type, payload.documentData);
        if (documentValidation) {
          return res.status(400).json({ ok: false, message: documentValidation });
        }
      }

      if (!isValidDate(payload.startDate) || !isValidDate(payload.endDate)) {
        return res.status(400).json({
          ok: false,
          message: "Published announcement lazima iwe na startDate na endDate sahihi."
        });
      }

      if (new Date(payload.startDate).getTime() > new Date(payload.endDate).getTime()) {
        return res.status(400).json({
          ok: false,
          message: "startDate haiwezi kuwa kubwa kuliko endDate."
        });
      }
    }

    const updated = await updateAnnouncement(announcement.id, {
      ...payload,
      updatedById: req.auth?.id || "",
      updatedByName: req.auth?.fullName || ""
    });

    clearApiCache();
    return res.json({ ok: true, data: updated });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function deleteAnnouncementHandler(req: Request, res: Response) {
  try {
    const success = await deleteAnnouncement(req.params.announcementId);
    if (!success) {
      return res.status(404).json({ ok: false, message: "Tangazo halijapatikana." });
    }

    clearApiCache();
    return res.json({ ok: true, message: "Tangazo limefutwa." });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function downloadAnnouncementPdf(req: Request, res: Response) {
  try {
    const announcement = await findAnnouncementById(req.params.announcementId);
    if (!announcement) {
      return res.status(404).json({ ok: false, message: "Tangazo halijapatikana." });
    }

    if (announcement.workflowStatus !== "published") {
      return res.status(404).json({ ok: false, message: "Tangazo halipo public." });
    }

    const layout = String(req.query.layout || "a4").toLowerCase() === "slides" ? "slides" : "a4";
    const siteSettings = await getSiteSettings();
    const headerMeta: PdfHeaderMeta = {
      phone: String(siteSettings?.contactInfo?.phone || "").trim(),
      email: String(siteSettings?.contactInfo?.email || "").trim()
    };
    const pdfBuffer = await buildAnnouncementPdf(announcement, layout, headerMeta);
    const slug = String(announcement.title || "announcement")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${slug || "announcement"}-${layout}.pdf"`);
    return res.send(pdfBuffer);
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}
