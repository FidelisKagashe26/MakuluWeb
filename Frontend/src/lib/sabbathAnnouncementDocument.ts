import type {
  AnnouncementItem,
  AnnouncementType,
  SabbathAnnouncementDocument,
  SabbathAnnouncementStepId,
  SabbathFellowshipRow,
  SabbathMidweekWorkerRow,
  SabbathNextWeekWorkerRow,
  SabbathTodayWorkerRow
} from "@/services/adminService";

export type AnnouncementDocumentStepDefinition = {
  id: SabbathAnnouncementStepId;
  title: string;
  description: string;
};

export const SABBATH_STEP_DEFINITIONS: AnnouncementDocumentStepDefinition[] = [
  {
    id: "church_header",
    title: "Church Header",
    description: "Fill the five top header lines shown on the Sabbath announcement layout."
  },
  {
    id: "announcement_date",
    title: "Announcement Date",
    description: "Set the main date for the Sabbath announcement."
  },
  {
    id: "announcement_items",
    title: "Announcement List",
    description: "Enter the numbered list of announcements."
  },
  {
    id: "midweek_workers",
    title: "Midweek Workers",
    description: "Fill the table for workers in the middle of the week."
  },
  {
    id: "today_sabbath_workers",
    title: "Today's Sabbath Workers",
    description: "Fill the table for the current Sabbath."
  },
  {
    id: "next_week_sabbath_workers",
    title: "Next Week Sabbath Workers",
    description: "Fill the table for the following Sabbath."
  },
  {
    id: "deacons_on_duty",
    title: "Deacons On Duty",
    description: "Enter the list of deacons on duty."
  },
  {
    id: "fellowship",
    title: "Fellowship Table",
    description: "Fill the fellowship table with names and movement details."
  },
  {
    id: "publish_settings",
    title: "Publish Settings",
    description: "Choose when this Sabbath announcement goes live and when it expires."
  }
];

const COMPACT_STEP_IDS: SabbathAnnouncementStepId[] = [
  "church_header",
  "announcement_date",
  "announcement_items",
  "publish_settings"
];

const COMPACT_STEP_DEFINITIONS = SABBATH_STEP_DEFINITIONS.filter((step) => COMPACT_STEP_IDS.includes(step.id));

const STEP_DEFINITIONS_BY_TYPE: Record<AnnouncementType, AnnouncementDocumentStepDefinition[]> = {
  sabbath: SABBATH_STEP_DEFINITIONS,
  ongoing: COMPACT_STEP_DEFINITIONS,
  emergency: COMPACT_STEP_DEFINITIONS
};

function createRowId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
}

function getAllowedStepIds(type: AnnouncementType) {
  return new Set(getAnnouncementStepDefinitions(type).map((step) => step.id));
}

function filterCompletedStepIds(stepIds: SabbathAnnouncementStepId[], type: AnnouncementType) {
  const allowedStepIds = getAllowedStepIds(type);
  return stepIds.filter((stepId) => allowedStepIds.has(stepId));
}

function clampLastStep(lastStep: number, type: AnnouncementType) {
  return Math.min(Math.max(lastStep, 1), getAnnouncementStepDefinitions(type).length);
}

export function getAnnouncementStepDefinitions(type: AnnouncementType) {
  return STEP_DEFINITIONS_BY_TYPE[type] || SABBATH_STEP_DEFINITIONS;
}

export function createMidweekWorkerRow(): SabbathMidweekWorkerRow {
  return {
    id: createRowId("midweek"),
    day: "",
    chairperson: "",
    secretary: ""
  };
}

export function createTodayWorkerRow(): SabbathTodayWorkerRow {
  return {
    id: createRowId("today"),
    role: "",
    chairperson: ""
  };
}

export function createNextWeekWorkerRow(): SabbathNextWeekWorkerRow {
  return {
    id: createRowId("next"),
    role: "",
    chairperson: ""
  };
}

export function createFellowshipRow(): SabbathFellowshipRow {
  return {
    id: createRowId("fellowship"),
    name: "",
    fromChurch: "",
    toChurch: ""
  };
}

function normalizeTextArray(input: unknown, ensureOne = false) {
  const values = Array.isArray(input)
    ? input.map((item) => String(item || ""))
    : typeof input === "string"
      ? String(input)
          .split(/\r?\n/)
          .map((item) => item.trim())
      : [];

  const cleaned = values.map((item) => item.trim());
  if (cleaned.length) return cleaned;
  return ensureOne ? [""] : [];
}

function normalizeMidweekRows(input: unknown, ensureOne = false): SabbathMidweekWorkerRow[] {
  const rows = Array.isArray(input)
    ? input.map((row, index) => ({
        id: String((row as SabbathMidweekWorkerRow | undefined)?.id || "") || `midweek-${index + 1}`,
        day: String((row as SabbathMidweekWorkerRow | undefined)?.day || ""),
        chairperson: String((row as SabbathMidweekWorkerRow | undefined)?.chairperson || ""),
        secretary: String((row as SabbathMidweekWorkerRow | undefined)?.secretary || "")
      }))
    : [];

  if (rows.length) return rows;
  return ensureOne ? [createMidweekWorkerRow()] : [];
}

function normalizeTodayRows(input: unknown, ensureOne = false): SabbathTodayWorkerRow[] {
  const rows = Array.isArray(input)
    ? input.map((row, index) => ({
        id: String((row as SabbathTodayWorkerRow | undefined)?.id || "") || `today-${index + 1}`,
        role: String((row as SabbathTodayWorkerRow | undefined)?.role || ""),
        chairperson: String((row as SabbathTodayWorkerRow | undefined)?.chairperson || "")
      }))
    : [];

  if (rows.length) return rows;
  return ensureOne ? [createTodayWorkerRow()] : [];
}

function normalizeNextWeekRows(input: unknown, ensureOne = false): SabbathNextWeekWorkerRow[] {
  const rows = Array.isArray(input)
    ? input.map((row, index) => ({
        id: String((row as SabbathNextWeekWorkerRow | undefined)?.id || "") || `next-${index + 1}`,
        role: String((row as SabbathNextWeekWorkerRow | undefined)?.role || ""),
        chairperson: String((row as SabbathNextWeekWorkerRow | undefined)?.chairperson || "")
      }))
    : [];

  if (rows.length) return rows;
  return ensureOne ? [createNextWeekWorkerRow()] : [];
}

function normalizeFellowshipRows(input: unknown, ensureOne = false): SabbathFellowshipRow[] {
  const rows = Array.isArray(input)
    ? input.map((row, index) => ({
        id: String((row as SabbathFellowshipRow | undefined)?.id || "") || `fellowship-${index + 1}`,
        name: String((row as SabbathFellowshipRow | undefined)?.name || ""),
        fromChurch: String((row as SabbathFellowshipRow | undefined)?.fromChurch || ""),
        toChurch: String((row as SabbathFellowshipRow | undefined)?.toChurch || "")
      }))
    : [];

  if (rows.length) return rows;
  return ensureOne ? [createFellowshipRow()] : [];
}

export function createEmptySabbathDocument(): SabbathAnnouncementDocument {
  return {
    header: {
      line1: "",
      line2: "",
      line3: "",
      line4: "",
      line5: ""
    },
    announcementDate: "",
    announcementItems: [""],
    midweekWorkers: [createMidweekWorkerRow()],
    todaySabbathWorkers: [createTodayWorkerRow()],
    nextWeekSabbathWorkers: [createNextWeekWorkerRow()],
    deaconsOnDuty: [""],
    fellowship: [createFellowshipRow()],
    publishWindow: {
      startDate: "",
      endDate: ""
    },
    progress: {
      lastStep: 1,
      completedStepIds: []
    }
  };
}

export function createEmptyAnnouncementDocument(type: AnnouncementType): SabbathAnnouncementDocument {
  return normalizeAnnouncementDocument(createEmptySabbathDocument(), type);
}

function computeCompletedStepIds(document: SabbathAnnouncementDocument): SabbathAnnouncementStepId[] {
  const output: SabbathAnnouncementStepId[] = [];
  const hasHeader = Object.values(document.header).some((value) => String(value || "").trim());
  if (hasHeader) output.push("church_header");
  if (document.announcementDate) output.push("announcement_date");
  if (document.announcementItems.some((item) => String(item || "").trim())) output.push("announcement_items");
  if (document.midweekWorkers.some((row) => row.day || row.chairperson || row.secretary)) output.push("midweek_workers");
  if (document.todaySabbathWorkers.some((row) => row.role || row.chairperson)) {
    output.push("today_sabbath_workers");
  }
  if (document.nextWeekSabbathWorkers.some((row) => row.role || row.chairperson)) {
    output.push("next_week_sabbath_workers");
  }
  if (document.deaconsOnDuty.some((item) => String(item || "").trim())) output.push("deacons_on_duty");
  if (document.fellowship.some((row) => row.name || row.fromChurch || row.toChurch)) output.push("fellowship");
  if (document.publishWindow.startDate || document.publishWindow.endDate) output.push("publish_settings");
  return output;
}

export function normalizeSabbathDocument(input?: Partial<SabbathAnnouncementDocument> | null): SabbathAnnouncementDocument {
  const source = input && typeof input === "object" ? input : {};
  const header: Partial<SabbathAnnouncementDocument["header"]> =
    source.header && typeof source.header === "object" ? source.header : {};
  const baseDocument: SabbathAnnouncementDocument = {
    header: {
      line1: String(header.line1 || ""),
      line2: String(header.line2 || ""),
      line3: String(header.line3 || ""),
      line4: String(header.line4 || ""),
      line5: String(header.line5 || "")
    },
    announcementDate: String(source.announcementDate || ""),
    announcementItems: normalizeTextArray(source.announcementItems, true),
    midweekWorkers: normalizeMidweekRows(source.midweekWorkers, true),
    todaySabbathWorkers: normalizeTodayRows(source.todaySabbathWorkers, true),
    nextWeekSabbathWorkers: normalizeNextWeekRows(source.nextWeekSabbathWorkers, true),
    deaconsOnDuty: normalizeTextArray(source.deaconsOnDuty, true),
    fellowship: normalizeFellowshipRows(source.fellowship, true),
    publishWindow: {
      startDate: String(source.publishWindow?.startDate || ""),
      endDate: String(source.publishWindow?.endDate || "")
    },
    progress: {
      lastStep: Math.min(
        Math.max(Number(source.progress?.lastStep || 1), 1),
        SABBATH_STEP_DEFINITIONS.length
      ),
      completedStepIds: Array.isArray(source.progress?.completedStepIds)
        ? source.progress!.completedStepIds.filter((stepId): stepId is SabbathAnnouncementStepId =>
            SABBATH_STEP_DEFINITIONS.some((step) => step.id === stepId)
          )
        : []
    }
  };

  if (!baseDocument.progress.completedStepIds.length) {
    baseDocument.progress.completedStepIds = computeCompletedStepIds(baseDocument);
  }

  return baseDocument;
}

export function normalizeAnnouncementDocument(
  input: Partial<SabbathAnnouncementDocument> | null | undefined,
  type: AnnouncementType
) {
  const normalized = normalizeSabbathDocument(input);
  return {
    ...normalized,
    progress: {
      lastStep: clampLastStep(normalized.progress.lastStep, type),
      completedStepIds: filterCompletedStepIds(normalized.progress.completedStepIds, type)
    }
  };
}

function sanitizeTextArray(values: string[]) {
  return values.map((item) => String(item || "").trim()).filter(Boolean);
}

export function prepareSabbathDocumentForSave(
  input: SabbathAnnouncementDocument,
  currentStepId: SabbathAnnouncementStepId,
  lastStep: number
): SabbathAnnouncementDocument {
  const document = normalizeSabbathDocument(input);
  const completedStepIds = new Set<SabbathAnnouncementStepId>(document.progress.completedStepIds);
  completedStepIds.add(currentStepId);

  return {
    header: {
      line1: document.header.line1.trim(),
      line2: document.header.line2.trim(),
      line3: document.header.line3.trim(),
      line4: document.header.line4.trim(),
      line5: document.header.line5.trim()
    },
    announcementDate: document.announcementDate.trim(),
    announcementItems: sanitizeTextArray(document.announcementItems),
    midweekWorkers: document.midweekWorkers
      .map((row) => ({
        id: row.id || createRowId("midweek"),
        day: row.day.trim(),
        chairperson: row.chairperson.trim(),
        secretary: row.secretary.trim()
      }))
      .filter((row) => row.day || row.chairperson || row.secretary),
    todaySabbathWorkers: document.todaySabbathWorkers
      .map((row) => ({
        id: row.id || createRowId("today"),
        role: row.role.trim(),
        chairperson: row.chairperson.trim()
      }))
      .filter((row) => row.role || row.chairperson),
    nextWeekSabbathWorkers: document.nextWeekSabbathWorkers
      .map((row) => ({
        id: row.id || createRowId("next"),
        role: row.role.trim(),
        chairperson: row.chairperson.trim()
      }))
      .filter((row) => row.role || row.chairperson),
    deaconsOnDuty: sanitizeTextArray(document.deaconsOnDuty),
    fellowship: document.fellowship
      .map((row) => ({
        id: row.id || createRowId("fellowship"),
        name: row.name.trim(),
        fromChurch: row.fromChurch.trim(),
        toChurch: row.toChurch.trim()
      }))
      .filter((row) => row.name || row.fromChurch || row.toChurch),
    publishWindow: {
      startDate: document.publishWindow.startDate.trim(),
      endDate: document.publishWindow.endDate.trim()
    },
    progress: {
      lastStep: Math.min(Math.max(lastStep, 1), SABBATH_STEP_DEFINITIONS.length),
      completedStepIds: Array.from(completedStepIds)
    }
  };
}

export function prepareAnnouncementDocumentForSave(
  input: SabbathAnnouncementDocument,
  currentStepId: SabbathAnnouncementStepId,
  lastStep: number,
  type: AnnouncementType
) {
  const document = prepareSabbathDocumentForSave(input, currentStepId, lastStep);
  const completedStepIds = new Set(filterCompletedStepIds(document.progress.completedStepIds, type));
  completedStepIds.add(currentStepId);

  return {
    ...document,
    progress: {
      lastStep: clampLastStep(lastStep, type),
      completedStepIds: Array.from(completedStepIds)
    }
  };
}

export function getSabbathCompletedCount(document?: Partial<SabbathAnnouncementDocument> | null) {
  return normalizeSabbathDocument(document).progress.completedStepIds.length;
}

export function getAnnouncementCompletedCount(
  document: Partial<SabbathAnnouncementDocument> | null | undefined,
  type: AnnouncementType
) {
  return normalizeAnnouncementDocument(document, type).progress.completedStepIds.length;
}

export function createSabbathDocumentFromAnnouncement(item: AnnouncementItem): SabbathAnnouncementDocument {
  if (item.documentData) {
    const normalized = normalizeSabbathDocument(item.documentData);
    return normalizeSabbathDocument({
      ...normalized,
      publishWindow: {
        startDate: normalized.publishWindow.startDate || String(item.startDate || ""),
        endDate: normalized.publishWindow.endDate || String(item.endDate || "")
      }
    });
  }

  const lines = String(item.content || "")
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  const fallback = createEmptySabbathDocument();
  fallback.announcementDate = String(item.startDate || "").slice(0, 10);
  fallback.announcementItems = lines.length ? lines : [""];
  fallback.publishWindow = {
    startDate: String(item.startDate || ""),
    endDate: String(item.endDate || "")
  };
  return normalizeSabbathDocument(fallback);
}

export function createAnnouncementDocumentFromAnnouncement(item: AnnouncementItem): SabbathAnnouncementDocument {
  return normalizeAnnouncementDocument(createSabbathDocumentFromAnnouncement(item), item.type);
}
