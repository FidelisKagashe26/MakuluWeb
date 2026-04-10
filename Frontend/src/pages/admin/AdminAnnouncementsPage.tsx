import { useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useApiQuery } from "@/hooks/useApiQuery";
import AppDropdown from "@/components/common/AppDropdown";
import SabbathAnnouncementWizard from "@/components/admin/SabbathAnnouncementWizard";
import SabbathAnnouncementPreview from "@/components/announcements/SabbathAnnouncementPreview";
import {
  createAnnouncement,
  deleteAnnouncement,
  fetchAnnouncements,
  type AnnouncementItem,
  type AnnouncementStatus,
  type AnnouncementType,
  type AnnouncementWorkflowStatus,
  type SabbathAnnouncementDocument,
  updateAnnouncement
} from "@/services/adminService";
import {
  createAnnouncementDocumentFromAnnouncement,
  createEmptyAnnouncementDocument,
  getAnnouncementCompletedCount,
  getAnnouncementStepDefinitions,
  prepareAnnouncementDocumentForSave
} from "@/lib/sabbathAnnouncementDocument";

const typeOptions: Array<{
  value: AnnouncementType;
  label: string;
  itemLabel: string;
  description: string;
}> = [
  {
    value: "ongoing",
    label: "Matukio ya Kawaida",
    itemLabel: "tukio",
    description: "Matukio ya kawaida yanayoweza kuwekwa kwa tarehe yoyote."
  },
  {
    value: "sabbath",
    label: "Matukio ya Sabato",
    itemLabel: "tukio la Sabato",
    description: "Matukio na matangazo maalum ya Sabato."
  },
  {
    value: "emergency",
    label: "Matukio ya Dharura",
    itemLabel: "tukio la dharura",
    description: "Matukio ya haraka yanayohitaji kuonekana mara moja."
  }
];

const statusFilterOptions = [
  { value: "", label: "Status zote" },
  { value: "draft", label: "Rasimu" },
  { value: "scheduled", label: "Yajayo" },
  { value: "active", label: "Yanayoendelea" },
  { value: "expired", label: "Yaliyopita" }
];

function getTypeMeta(type: AnnouncementType) {
  return typeOptions.find((option) => option.value === type) || typeOptions[0];
}

function getStatusTone(status: AnnouncementStatus) {
  if (status === "active") return "bg-emerald-100 text-emerald-700";
  if (status === "scheduled") return "bg-church-100 text-church-700";
  if (status === "expired") return "bg-slate-200 text-slate-700";
  return "bg-amber-100 text-amber-700";
}

function getStatusLabel(status: AnnouncementStatus) {
  if (status === "scheduled") return "Yajayo";
  if (status === "active") return "Yanayoendelea";
  if (status === "expired") return "Yaliyopita";
  return "Rasimu";
}

function getWorkflowStatusLabel(status: AnnouncementWorkflowStatus) {
  return status === "published" ? "Imechapishwa" : "Rasimu";
}

function getScheduleLabel(item: AnnouncementItem) {
  if (!item.startDate || !item.endDate) return "No schedule";
  return `${format(new Date(item.startDate), "dd MMM yyyy, HH:mm")} - ${format(new Date(item.endDate), "dd MMM yyyy, HH:mm")}`;
}

function getDisplayDate(value?: string) {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";
  return format(date, "dd MMM yyyy, HH:mm");
}

function getAnnouncementProgressText(item: AnnouncementItem) {
  if (!item.documentData) return "No document data";

  const completed = getAnnouncementCompletedCount(item.documentData, item.type);
  const total = getAnnouncementStepDefinitions(item.type).length;
  const rawDate = String(item.documentData.announcementDate || "").trim();
  const parsedDate = rawDate ? new Date(`${rawDate}T00:00:00`) : null;
  const dateLabel = parsedDate && !Number.isNaN(parsedDate.getTime()) ? format(parsedDate, "dd MMM yyyy") : "";

  return `${completed}/${total} hatua zimejazwa${dateLabel ? ` | ${dateLabel}` : ""}`;
}

function getExcerpt(item: AnnouncementItem) {
  if (item.documentData) {
    return getAnnouncementProgressText(item);
  }

  const fromSummary = String(item.summary || "").trim();
  if (fromSummary) return fromSummary;

  const plain = String(item.content || "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!plain) return "No content";
  return plain.length > 180 ? `${plain.slice(0, 180)}...` : plain;
}

function toEditorText(input: string) {
  const raw = String(input || "");
  if (!/[<>]/.test(raw)) return raw;

  return raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getFullContent(item: AnnouncementItem) {
  if (item.documentData) {
    return getAnnouncementProgressText(item);
  }

  const content = toEditorText(String(item.content || "")).trim();
  if (content) return content;

  const summary = String(item.summary || "").trim();
  return summary || "No content";
}

function getNewestActiveAnnouncementId(items: AnnouncementItem[], type: AnnouncementType) {
  return items.find((item) => item.type === type && item.status === "active")?.id || "";
}

function resolveErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object") {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    const message = String(response?.data?.message || "").trim();
    if (message) return message;
  }

  return fallback;
}

export default function AdminAnnouncementsPage() {
  const { hasPermission } = useAuth();
  const [activeType, setActiveType] = useState<AnnouncementType>("ongoing");
  const [statusFilterByType, setStatusFilterByType] = useState<Record<AnnouncementType, AnnouncementStatus | "">>({
    sabbath: "",
    ongoing: "",
    emergency: ""
  });
  const [searchByType, setSearchByType] = useState<Record<AnnouncementType, string>>({
    sabbath: "",
    ongoing: "",
    emergency: ""
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [composerType, setComposerType] = useState<AnnouncementType | null>(null);
  const [announcementDocument, setAnnouncementDocument] = useState<SabbathAnnouncementDocument>(() =>
    createEmptyAnnouncementDocument("sabbath")
  );
  const [documentStepIndex, setDocumentStepIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const { data, isLoading, error, refetch } = useApiQuery(
    () =>
      fetchAnnouncements({
        page: 1,
        limit: 120
      }),
    []
  );

  const rows = useMemo(() => data?.data ?? [], [data]);
  const countsByType = useMemo(
    () =>
      rows.reduce<Record<AnnouncementType, number>>(
        (counts, row) => {
          counts[row.type] += 1;
          return counts;
        },
        { sabbath: 0, ongoing: 0, emergency: 0 }
      ),
    [rows]
  );
  const activeStatusFilter = statusFilterByType[activeType];
  const activeSearch = searchByType[activeType].trim().toLowerCase();
  const activeRows = useMemo(
    () =>
      rows.filter((item) => {
        if (item.type !== activeType) return false;
        if (activeStatusFilter && item.status !== activeStatusFilter) return false;
        if (!activeSearch) return true;

        return (
          String(item.title || "").toLowerCase().includes(activeSearch) ||
          String(item.summary || "").toLowerCase().includes(activeSearch) ||
          String(item.content || "").toLowerCase().includes(activeSearch) ||
          String(item.updatedByName || "").toLowerCase().includes(activeSearch)
        );
      }),
    [rows, activeType, activeSearch, activeStatusFilter]
  );
  const newestActiveId = useMemo(() => getNewestActiveAnnouncementId(rows, activeType), [rows, activeType]);
  const expandedRow = useMemo(() => activeRows.find((row) => row.id === expandedId) || null, [activeRows, expandedId]);
  const activeTypeMeta = getTypeMeta(activeType);
  const canCreate = hasPermission("create");
  const canUpdate = hasPermission("update");
  const canDelete = hasPermission("delete");
  const canPublish = hasPermission("publish");
  const canSaveCurrentDraft = editingId ? canUpdate : canCreate;
  const isComposerOpen = composerType !== null;
  const composerAnnouncementType = composerType || activeType;

  const closeComposer = (nextType: AnnouncementType = activeType) => {
    setEditingId(null);
    setComposerType(null);
    setAnnouncementDocument(createEmptyAnnouncementDocument(nextType));
    setDocumentStepIndex(0);
  };

  const openComposer = (type: AnnouncementType) => {
    setActiveType(type);
    setExpandedId(null);
    setEditingId(null);
    setComposerType(type);
    setAnnouncementDocument(createEmptyAnnouncementDocument(type));
    setDocumentStepIndex(0);
  };

  const handleTypeChange = (nextType: AnnouncementType) => {
    if (nextType === activeType) return;
    if (isComposerOpen) {
      const shouldContinue = window.confirm("Switching categories will close the current editor. Continue?");
      if (!shouldContinue) return;
      closeComposer(nextType);
    }

    setActiveType(nextType);
    setExpandedId(null);
  };

  const saveDocumentDraft = async (goToNextStep = false) => {
    if (!(canCreate || canUpdate)) {
      toast.error("Huna ruhusa ya kuhifadhi rasimu.");
      return;
    }

    const stepDefinitions = getAnnouncementStepDefinitions(composerAnnouncementType);
    const currentStep = stepDefinitions[Math.min(documentStepIndex, stepDefinitions.length - 1)];
    const nextStepNumber = goToNextStep ? documentStepIndex + 2 : documentStepIndex + 1;
    const payload = {
      type: composerAnnouncementType,
      workflowStatus: "draft" as AnnouncementWorkflowStatus,
      documentData: prepareAnnouncementDocumentForSave(
        announcementDocument,
        currentStep.id,
        nextStepNumber,
        composerAnnouncementType
      )
    };

    setIsSaving(true);
    try {
      const saved = editingId ? await updateAnnouncement(editingId, payload) : await createAnnouncement(payload);
      const nextDocument = createAnnouncementDocumentFromAnnouncement(saved);

      setEditingId(saved.id);
      setComposerType(composerAnnouncementType);
      setAnnouncementDocument(nextDocument);
      setDocumentStepIndex(
        goToNextStep ? Math.min(documentStepIndex + 1, stepDefinitions.length - 1) : Math.min(documentStepIndex, stepDefinitions.length - 1)
      );
      toast.success(editingId ? "Hatua imehifadhiwa." : "Rasimu imeundwa na hatua imehifadhiwa.");
      await refetch();
    } catch (saveError) {
      toast.error(resolveErrorMessage(saveError, "Imeshindikana kuhifadhi hatua hii."));
    } finally {
      setIsSaving(false);
    }
  };

  const publishDocumentAnnouncement = async () => {
    if (!canPublish) {
      toast.error("Huna ruhusa ya kuchapisha tukio hili.");
      return;
    }

    const stepDefinitions = getAnnouncementStepDefinitions(composerAnnouncementType);
    const currentStep = stepDefinitions[Math.min(documentStepIndex, stepDefinitions.length - 1)];
    const payload = {
      type: composerAnnouncementType,
      workflowStatus: "published" as AnnouncementWorkflowStatus,
      documentData: prepareAnnouncementDocumentForSave(
        announcementDocument,
        currentStep.id,
        documentStepIndex + 1,
        composerAnnouncementType
      )
    };

    setIsSaving(true);
    try {
      const saved = editingId ? await updateAnnouncement(editingId, payload) : await createAnnouncement(payload);
      toast.success(
        editingId
          ? `${getTypeMeta(composerAnnouncementType).itemLabel} limechapishwa.`
          : `${getTypeMeta(composerAnnouncementType).itemLabel} limeundwa na kuchapishwa.`
      );
      setExpandedId(saved.id);
      setActiveType(composerAnnouncementType);
      closeComposer(composerAnnouncementType);
      await refetch();
    } catch (publishError) {
      toast.error(resolveErrorMessage(publishError, "Imeshindikana kuchapisha tukio."));
    } finally {
      setIsSaving(false);
    }
  };

  const editRow = (row: AnnouncementItem) => {
    setActiveType(row.type);
    setExpandedId(row.id);
    setEditingId(row.id);
    setComposerType(row.type);

    const nextDocument = createAnnouncementDocumentFromAnnouncement(row);
    const stepDefinitions = getAnnouncementStepDefinitions(row.type);

    setAnnouncementDocument(nextDocument);
    setDocumentStepIndex(Math.min(Math.max((nextDocument.progress.lastStep || 1) - 1, 0), stepDefinitions.length - 1));
  };

  const toggleView = (announcementId: string) => {
    setExpandedId((current) => (current === announcementId ? null : announcementId));
  };

  const removeRow = async (announcementId: string) => {
    if (!canDelete) return;
    if (!window.confirm("Unataka kufuta tukio hili?")) return;

    try {
      await deleteAnnouncement(announcementId);
      toast.success("Tukio limefutwa.");
      if (editingId === announcementId) {
        closeComposer(activeType);
      }
      if (expandedId === announcementId) {
        setExpandedId(null);
      }
      await refetch();
    } catch (deleteError) {
      toast.error(resolveErrorMessage(deleteError, "Imeshindikana kufuta tukio."));
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-white">Usimamizi wa Matukio</h1>
      </header>

      <section className="flex flex-wrap gap-3">
        {typeOptions.map((option) => {
          const isActive = option.value === activeType;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleTypeChange(option.value)}
              className={[
                "inline-flex items-center gap-3 rounded-md border px-4 py-2.5 text-sm font-semibold transition",
                isActive
                  ? "border-church-300/60 bg-church-600/20 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
                  : "border-white/10 bg-white/[0.03] text-slate-200 hover:border-white/20 hover:bg-white/[0.05]"
              ].join(" ")}
              aria-pressed={isActive}
            >
              <span>{option.label}</span>
              <span className="rounded-md bg-white/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-200">
                {countsByType[option.value]}
              </span>
            </button>
          );
        })}
      </section>

      {isLoading ? <p className="text-sm text-slate-300">Inapakia matukio...</p> : null}
      {error ? <p className="text-sm text-rose-300">Imeshindikana kupakia matukio.</p> : null}

      <section className="rounded-md bg-white/[0.03] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">{activeTypeMeta.label}</h2>
            <p className="text-sm text-slate-400">{activeTypeMeta.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-slate-200">
              {activeRows.length} matukio
            </span>
            {canCreate ? (
              <button type="button" className="admin-btn-primary" onClick={() => openComposer(activeType)}>
                + Ongeza {activeTypeMeta.itemLabel}
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_13rem]">
          <input
            className="form-input"
            placeholder={`Tafuta ndani ya ${activeTypeMeta.label.toLowerCase()}...`}
            value={searchByType[activeType]}
            onChange={(event) =>
              setSearchByType((current) => ({
                ...current,
                [activeType]: event.target.value
              }))
            }
          />
          <AppDropdown
            value={activeStatusFilter}
            options={statusFilterOptions}
            onChange={(value) =>
              setStatusFilterByType((current) => ({
                ...current,
                [activeType]: value as AnnouncementStatus | ""
              }))
            }
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {statusFilterOptions.map((option) => {
            const selected = activeStatusFilter === option.value;
            return (
              <button
                key={`quick-status-${option.value || "all"}`}
                type="button"
                onClick={() =>
                  setStatusFilterByType((current) => ({
                    ...current,
                    [activeType]: option.value as AnnouncementStatus | ""
                  }))
                }
                className={[
                  "rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] transition",
                  selected
                    ? "border-church-300/60 bg-church-600/20 text-white"
                    : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.06]"
                ].join(" ")}
              >
                {option.label}
              </button>
            );
          })}
          <p className="text-xs text-slate-400">
            Status inahesabiwa kiotomatiki kwa kutumia tarehe za Start/End kwenye hatua ya Publish Settings.
          </p>
        </div>

        {isComposerOpen ? (
          <SabbathAnnouncementWizard
            announcementType={composerAnnouncementType}
            value={announcementDocument}
            stepIndex={documentStepIndex}
            isSaving={isSaving}
            isEditing={Boolean(editingId)}
            canSave={canSaveCurrentDraft}
            canPublish={canPublish}
            onChange={setAnnouncementDocument}
            onClose={() => closeComposer(activeType)}
            onStepChange={setDocumentStepIndex}
            onSaveDraft={(goToNextStep) => void saveDocumentDraft(goToNextStep)}
            onPublish={() => void publishDocumentAnnouncement()}
          />
        ) : null}

        <div className="mt-4 overflow-x-auto rounded-md border border-white/10">
          <table className="min-w-full text-sm text-slate-100">
            <thead>
              <tr className="bg-white/[0.05] text-left">
                <th className="w-16 px-3 py-2">S/N</th>
                <th className="min-w-[18rem] px-3 py-2">Jina la Tukio</th>
                <th className="px-3 py-2">Status</th>
                <th className="min-w-[16rem] px-3 py-2">Ratiba</th>
                <th className="min-w-[14rem] px-3 py-2">Imehaririwa</th>
                <th className="px-3 py-2">Vitendo</th>
              </tr>
            </thead>
            <tbody>
              {activeRows.length ? (
                activeRows.map((row, index) => {
                  const isExpanded = expandedId === row.id;
                  const isNewest = row.id === newestActiveId;

                  return (
                    <tr key={row.id} className="border-t border-white/10 align-top">
                      <td className="px-3 py-3 font-semibold text-slate-300">{index + 1}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-white">{row.title}</p>
                          {isNewest ? (
                            <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                              New
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs leading-5 text-slate-300">{getExcerpt(row)}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex rounded-md px-2 py-1 text-[11px] font-semibold uppercase ${getStatusTone(row.status)}`}>
                          {getStatusLabel(row.status)}
                        </span>
                        <p className="mt-1 text-xs uppercase tracking-[0.08em] text-slate-400">
                          {getWorkflowStatusLabel(row.workflowStatus)}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-xs leading-5 text-slate-300">{getScheduleLabel(row)}</td>
                      <td className="px-3 py-3 text-xs leading-5 text-slate-300">
                        <p>{row.updatedByName || "Unknown"}</p>
                        <p className="text-slate-400">{getDisplayDate(row.updatedAt)}</p>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="admin-btn-ghost px-2.5 py-1.5"
                            onClick={() => toggleView(row.id)}
                          >
                            {isExpanded ? "Funga" : "Tazama"}
                          </button>
                          {canUpdate ? (
                            <button type="button" className="admin-btn-ghost px-2.5 py-1.5" onClick={() => editRow(row)}>
                              Hariri
                            </button>
                          ) : null}
                          {canDelete ? (
                            <button type="button" className="admin-btn-danger px-2.5 py-1.5" onClick={() => void removeRow(row.id)}>
                              Futa
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr className="border-t border-white/10">
                  <td colSpan={6} className="px-3 py-6 text-center text-sm text-slate-400">
                    Hakuna matukio kwenye kundi hili.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {expandedRow ? (
          <div className="mt-4 rounded-md border border-white/10 bg-slate-950/20 p-4">
            <div className="grid gap-4 lg:grid-cols-[1.35fr_0.9fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  {expandedRow.documentData ? `${getTypeMeta(expandedRow.type).label} preview` : "Full content"}
                </p>
                <div className="mt-2">
                  {expandedRow.documentData ? (
                    <SabbathAnnouncementPreview
                      document={expandedRow.documentData}
                      announcementType={expandedRow.type}
                    />
                  ) : (
                    <div className="whitespace-pre-line rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm leading-6 text-slate-100">
                      {getFullContent(expandedRow)}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Summary</p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">
                    {expandedRow.documentData ? getAnnouncementProgressText(expandedRow) : expandedRow.summary || getExcerpt(expandedRow)}
                  </p>
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Details</p>
                  <div className="mt-2 space-y-2 text-sm text-slate-200">
                    <p>Category: {getTypeMeta(expandedRow.type).label}</p>
                    <p>Status: {getStatusLabel(expandedRow.status)}</p>
                    <p>Workflow: {getWorkflowStatusLabel(expandedRow.workflowStatus)}</p>
                    {expandedRow.documentData ? <p>Progress: {getAnnouncementProgressText(expandedRow)}</p> : null}
                    <p>Start: {getDisplayDate(expandedRow.startDate)}</p>
                    <p>End: {getDisplayDate(expandedRow.endDate)}</p>
                    <p>Created: {getDisplayDate(expandedRow.createdAt)}</p>
                    <p>Updated: {getDisplayDate(expandedRow.updatedAt)}</p>
                    <p>Updated by: {expandedRow.updatedByName || "Unknown"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
