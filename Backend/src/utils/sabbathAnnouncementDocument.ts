const SABBATH_STEP_IDS = [
  "church_header",
  "announcement_date",
  "announcement_items",
  "midweek_workers",
  "today_sabbath_workers",
  "next_week_sabbath_workers",
  "deacons_on_duty",
  "fellowship",
  "publish_settings"
];

const COMPACT_STEP_IDS = [
  "church_header",
  "announcement_date",
  "announcement_items",
  "publish_settings"
];

const STEP_IDS_BY_TYPE = {
  sabbath: SABBATH_STEP_IDS,
  ongoing: COMPACT_STEP_IDS,
  emergency: COMPACT_STEP_IDS
} as const;

type AnnouncementDocumentType = keyof typeof STEP_IDS_BY_TYPE;

function toTrimmedString(input: unknown) {
  return String(input || "").trim();
}

function normalizeAnnouncementDocumentType(input: unknown): AnnouncementDocumentType {
  const value = toTrimmedString(input).toLowerCase();
  return value === "ongoing" || value === "emergency" ? value : "sabbath";
}

function getAllowedStepIds(typeInput: unknown) {
  return new Set(STEP_IDS_BY_TYPE[normalizeAnnouncementDocumentType(typeInput)]);
}

function normalizeTextArray(input: unknown) {
  if (Array.isArray(input)) {
    return input.map((item) => toTrimmedString(item)).filter(Boolean);
  }

  if (typeof input === "string") {
    return String(input)
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeRows(input: unknown, fields: string[], prefix: string) {
  if (!Array.isArray(input)) return [];

  return input
    .map((entry, index) => {
      const source = entry && typeof entry === "object" ? entry : {};
      const row = {
        id: toTrimmedString((source as Record<string, unknown>).id) || `${prefix}-${index + 1}`
      } as Record<string, string>;

      fields.forEach((field) => {
        row[field] = toTrimmedString((source as Record<string, unknown>)[field]);
      });

      return row;
    })
    .filter((row) => fields.some((field) => row[field]));
}

function clampStep(step: unknown) {
  const value = Number(step || 1);
  if (!Number.isFinite(value)) return 1;
  return Math.min(Math.max(Math.round(value), 1), SABBATH_STEP_IDS.length);
}

function computeCompletedStepIds(documentData: any, typeInput: unknown = "sabbath") {
  const output: string[] = [];
  const header = documentData?.header || {};

  if (Object.values(header).some((value) => toTrimmedString(value))) output.push("church_header");
  if (toTrimmedString(documentData?.announcementDate)) output.push("announcement_date");
  if (Array.isArray(documentData?.announcementItems) && documentData.announcementItems.length) output.push("announcement_items");
  if (Array.isArray(documentData?.midweekWorkers) && documentData.midweekWorkers.length) output.push("midweek_workers");
  if (Array.isArray(documentData?.todaySabbathWorkers) && documentData.todaySabbathWorkers.length) {
    output.push("today_sabbath_workers");
  }
  if (Array.isArray(documentData?.nextWeekSabbathWorkers) && documentData.nextWeekSabbathWorkers.length) {
    output.push("next_week_sabbath_workers");
  }
  if (Array.isArray(documentData?.deaconsOnDuty) && documentData.deaconsOnDuty.length) output.push("deacons_on_duty");
  if (Array.isArray(documentData?.fellowship) && documentData.fellowship.length) output.push("fellowship");
  if (toTrimmedString(documentData?.publishWindow?.startDate) || toTrimmedString(documentData?.publishWindow?.endDate)) {
    output.push("publish_settings");
  }

  const allowedStepIds = getAllowedStepIds(typeInput);
  return output.filter((stepId) => allowedStepIds.has(stepId));
}

export function normalizeSabbathAnnouncementDocument(input: unknown) {
  const source = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const header = source.header && typeof source.header === "object" ? (source.header as Record<string, unknown>) : {};
  const progress = source.progress && typeof source.progress === "object" ? (source.progress as Record<string, unknown>) : {};

  const documentData = {
    header: {
      line1: toTrimmedString(header.line1),
      line2: toTrimmedString(header.line2),
      line3: toTrimmedString(header.line3),
      line4: toTrimmedString(header.line4),
      line5: toTrimmedString(header.line5)
    },
    announcementDate: toTrimmedString(source.announcementDate),
    announcementItems: normalizeTextArray(source.announcementItems),
    midweekWorkers: normalizeRows(source.midweekWorkers, ["day", "chairperson", "secretary"], "midweek"),
    todaySabbathWorkers: normalizeRows(
      source.todaySabbathWorkers,
      ["role", "chairperson"],
      "today"
    ),
    nextWeekSabbathWorkers: normalizeRows(
      source.nextWeekSabbathWorkers,
      ["role", "chairperson"],
      "next"
    ),
    deaconsOnDuty: normalizeTextArray(source.deaconsOnDuty),
    fellowship: normalizeRows(source.fellowship, ["name", "fromChurch", "toChurch"], "fellowship"),
    publishWindow: {
      startDate: toTrimmedString((source.publishWindow as Record<string, unknown> | undefined)?.startDate),
      endDate: toTrimmedString((source.publishWindow as Record<string, unknown> | undefined)?.endDate)
    },
    progress: {
      lastStep: clampStep(progress.lastStep),
      completedStepIds: Array.isArray(progress.completedStepIds)
        ? progress.completedStepIds
            .map((stepId) => toTrimmedString(stepId))
            .filter((stepId, index, values) => SABBATH_STEP_IDS.includes(stepId) && values.indexOf(stepId) === index)
        : []
    }
  };

  if (!documentData.progress.completedStepIds.length) {
    documentData.progress.completedStepIds = computeCompletedStepIds(documentData, "sabbath");
  }

  return documentData;
}

function formatAnnouncementDate(input: string) {
  if (!input) return "";

  const date = new Date(`${input}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function toDayBoundaryIso(input: string, endOfDay = false) {
  if (!input) return "";

  const date = new Date(`${input}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";

  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }

  return date.toISOString();
}

function buildRowsSection(title: string, rows: Array<Record<string, string>>, keys: string[]) {
  if (!rows.length) return "";

  return [
    title,
    ...rows.map((row, index) => {
      const values = keys.map((key) => toTrimmedString(row[key])).filter(Boolean);
      return `${index + 1}. ${values.join(" | ")}`;
    })
  ]
    .filter(Boolean)
    .join("\n");
}

function getAnnouncementDocumentLabels(typeInput: unknown) {
  const type = normalizeAnnouncementDocumentType(typeInput);
  if (type === "emergency") {
    return {
      listTitle: "Emergency Announcements",
      draftTitle: "Emergency Announcement Draft",
      summaryLabel: "Emergency announcement"
    };
  }

  if (type === "ongoing") {
    return {
      listTitle: "Ongoing Announcements",
      draftTitle: "Ongoing Announcement Draft",
      summaryLabel: "Ongoing announcement"
    };
  }

  return {
    listTitle: "Sabbath Announcements",
    draftTitle: "Sabbath Announcement Draft",
    summaryLabel: "Sabbath announcement"
  };
}

export function buildAnnouncementDocumentDerivedFields(typeInput: unknown, documentDataInput: unknown) {
  const type = normalizeAnnouncementDocumentType(typeInput);
  const documentData = normalizeSabbathAnnouncementDocument(documentDataInput);
  const formattedDate = formatAnnouncementDate(documentData.announcementDate);
  const labels = getAnnouncementDocumentLabels(type);
  const allowedStepIds = getAllowedStepIds(type);
  const title = formattedDate ? `${labels.listTitle} - ${formattedDate}` : labels.draftTitle;

  const sections = [];
  const headerLines = Object.values(documentData.header).filter(Boolean);
  if (headerLines.length && allowedStepIds.has("church_header")) {
    sections.push(["Church Header", ...headerLines].join("\n"));
  }
  if (formattedDate && allowedStepIds.has("announcement_date")) {
    sections.push(`Announcement Date\n${formattedDate}`);
  }
  if (documentData.announcementItems.length && allowedStepIds.has("announcement_items")) {
    sections.push(
      ["Announcement List", ...documentData.announcementItems.map((item, index) => `${index + 1}. ${item}`)].join("\n")
    );
  }

  if (allowedStepIds.has("midweek_workers")) {
    const midweekSection = buildRowsSection("Midweek Workers", documentData.midweekWorkers, [
      "day",
      "chairperson",
      "secretary"
    ]);
    if (midweekSection) sections.push(midweekSection);
  }

  if (allowedStepIds.has("today_sabbath_workers")) {
    const todaySection = buildRowsSection("Today's Sabbath Workers", documentData.todaySabbathWorkers, [
      "role",
      "chairperson"
    ]);
    if (todaySection) sections.push(todaySection);
  }

  if (allowedStepIds.has("next_week_sabbath_workers")) {
    const nextWeekSection = buildRowsSection("Next Week Sabbath Workers", documentData.nextWeekSabbathWorkers, [
      "role",
      "chairperson"
    ]);
    if (nextWeekSection) sections.push(nextWeekSection);
  }

  if (documentData.deaconsOnDuty.length && allowedStepIds.has("deacons_on_duty")) {
    sections.push(
      ["Deacons On Duty", ...documentData.deaconsOnDuty.map((name, index) => `${index + 1}. ${name}`)].join("\n")
    );
  }

  if (allowedStepIds.has("fellowship")) {
    const fellowshipSection = buildRowsSection("Fellowship Table", documentData.fellowship, [
      "name",
      "fromChurch",
      "toChurch"
    ]);
    if (fellowshipSection) sections.push(fellowshipSection);
  }

  const firstItem = documentData.announcementItems.find(Boolean) || "";
  const summarySource =
    firstItem ||
    (formattedDate ? `${labels.summaryLabel} for ${formattedDate}` : labels.draftTitle);
  const summary =
    summarySource.length > 220 ? `${summarySource.slice(0, 220).trimEnd()}...` : summarySource;

  return {
    documentData: {
      ...documentData,
      progress: {
        ...documentData.progress,
        completedStepIds: computeCompletedStepIds(documentData, type)
      }
    },
    title,
    summary,
    content: sections.join("\n\n"),
    startDate: documentData.publishWindow.startDate || toDayBoundaryIso(documentData.announcementDate),
    endDate: documentData.publishWindow.endDate || toDayBoundaryIso(documentData.announcementDate, true)
  };
}

export function validateAnnouncementDocumentForPublish(typeInput: unknown, documentDataInput: unknown) {
  const labels = getAnnouncementDocumentLabels(typeInput);
  const documentData = normalizeSabbathAnnouncementDocument(documentDataInput);

  if (!documentData.announcementDate) {
    return `Announcement date is required before publishing this ${labels.summaryLabel.toLowerCase()}.`;
  }

  if (!documentData.publishWindow.startDate || !documentData.publishWindow.endDate) {
    return `Live start and end date are required before publishing this ${labels.summaryLabel.toLowerCase()}.`;
  }

  const start = new Date(documentData.publishWindow.startDate).getTime();
  const end = new Date(documentData.publishWindow.endDate).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return `Live start and end date must be valid before publishing this ${labels.summaryLabel.toLowerCase()}.`;
  }

  if (start > end) {
    return "Live start date cannot be later than live end date.";
  }

  return "";
}

export function buildSabbathAnnouncementDerivedFields(documentDataInput: unknown) {
  return buildAnnouncementDocumentDerivedFields("sabbath", documentDataInput);
}

export function validateSabbathAnnouncementForPublish(documentDataInput: unknown) {
  return validateAnnouncementDocumentForPublish("sabbath", documentDataInput);
}
