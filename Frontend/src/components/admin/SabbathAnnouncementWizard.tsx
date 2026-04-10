import type {
  AnnouncementType,
  SabbathAnnouncementDocument,
  SabbathFellowshipRow,
  SabbathMidweekWorkerRow,
  SabbathNextWeekWorkerRow,
  SabbathTodayWorkerRow
} from "@/services/adminService";
import SabbathAnnouncementPreview from "@/components/announcements/SabbathAnnouncementPreview";
import {
  createFellowshipRow,
  createMidweekWorkerRow,
  createNextWeekWorkerRow,
  createTodayWorkerRow,
  getAnnouncementCompletedCount,
  getAnnouncementStepDefinitions
} from "@/lib/sabbathAnnouncementDocument";

type Props = {
  announcementType: AnnouncementType;
  value: SabbathAnnouncementDocument;
  stepIndex: number;
  isSaving: boolean;
  isEditing: boolean;
  canSave: boolean;
  canPublish: boolean;
  onChange: (nextValue: SabbathAnnouncementDocument) => void;
  onClose: () => void;
  onStepChange: (nextIndex: number) => void;
  onSaveDraft: (goToNextStep?: boolean) => void;
  onPublish: () => void;
};

const ANNOUNCEMENT_WIZARD_META: Record<
  AnnouncementType,
  {
    createTitle: string;
    editTitle: string;
    publishingLabel: string;
  }
> = {
  sabbath: {
    createTitle: "Create Sabbath announcement",
    editTitle: "Continue Sabbath announcement setup",
    publishingLabel: "This Sabbath announcement"
  },
  ongoing: {
    createTitle: "Create event",
    editTitle: "Continue event setup",
    publishingLabel: "This event"
  },
  emergency: {
    createTitle: "Create emergency event",
    editTitle: "Continue emergency event setup",
    publishingLabel: "This emergency event"
  }
};

function StepButton({
  active,
  complete,
  index,
  title,
  onClick
}: {
  active: boolean;
  complete: boolean;
  index: number;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-md border px-3 py-2 text-left transition",
        active
          ? "border-church-300/60 bg-church-600/20 text-white"
          : "border-white/10 bg-white/[0.03] text-slate-200 hover:border-white/20 hover:bg-white/[0.05]"
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Step {index + 1}</span>
        <span
          className={[
            "rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase",
            complete ? "bg-emerald-200 text-emerald-800" : "bg-white/10 text-slate-300"
          ].join(" ")}
        >
          {complete ? "Saved" : "Pending"}
        </span>
      </div>
      <p className="mt-2 text-sm font-semibold text-current">{title}</p>
    </button>
  );
}

function SectionHint({ text }: { text: string }) {
  return <p className="text-sm text-slate-400">{text}</p>;
}

function TableHeader({ labels, gridClassName }: { labels: string[]; gridClassName: string }) {
  return (
    <div className={`grid gap-2 ${gridClassName}`}>
      {labels.map((label) => (
        <p key={label} className="hidden text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 md:block">
          {label}
        </p>
      ))}
      <span className="hidden md:block" />
    </div>
  );
}

export default function SabbathAnnouncementWizard({
  announcementType,
  value,
  stepIndex,
  isSaving,
  isEditing,
  canSave,
  canPublish,
  onChange,
  onClose,
  onStepChange,
  onSaveDraft,
  onPublish
}: Props) {
  const wizardMeta = ANNOUNCEMENT_WIZARD_META[announcementType];
  const stepDefinitions = getAnnouncementStepDefinitions(announcementType);
  const boundedStepIndex = Math.min(Math.max(stepIndex, 0), stepDefinitions.length - 1);
  const activeStep = stepDefinitions[boundedStepIndex];
  const completedCount = getAnnouncementCompletedCount(value, announcementType);
  const isPublishStep = activeStep.id === "publish_settings";

  const toDateTimeInput = (dateValue: string) => {
    if (!dateValue) return "";
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return "";
    const pad = (entry: number) => String(entry).padStart(2, "0");
    return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
  };

  const toIsoValue = (dateValue: string) => {
    if (!dateValue) return "";
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toISOString();
  };

  const setHeaderField = (field: keyof SabbathAnnouncementDocument["header"], fieldValue: string) => {
    onChange({
      ...value,
      header: {
        ...value.header,
        [field]: fieldValue
      }
    });
  };

  const setAnnouncementLines = (field: "announcementItems" | "deaconsOnDuty", raw: string) => {
    onChange({
      ...value,
      [field]: raw.split(/\r?\n/)
    });
  };

  const updateMidweekRow = (index: number, field: keyof SabbathMidweekWorkerRow, fieldValue: string) => {
    const nextRows = value.midweekWorkers.map((row, rowIndex) =>
      rowIndex === index
        ? {
            ...row,
            [field]: fieldValue
          }
        : row
    );

    onChange({ ...value, midweekWorkers: nextRows });
  };

  const updateTodayRows = (
    index: number,
    field: keyof SabbathTodayWorkerRow,
    fieldValue: string
  ) => {
    const nextRows = value.todaySabbathWorkers.map((row, rowIndex) =>
      rowIndex === index
        ? {
            ...row,
            [field]: fieldValue
          }
        : row
    );

    onChange({ ...value, todaySabbathWorkers: nextRows });
  };

  const updateNextWeekRows = (index: number, field: keyof SabbathNextWeekWorkerRow, fieldValue: string) => {
    const nextRows = value.nextWeekSabbathWorkers.map((row, rowIndex) =>
      rowIndex === index
        ? {
            ...row,
            [field]: fieldValue
          }
        : row
    );

    onChange({ ...value, nextWeekSabbathWorkers: nextRows });
  };

  const updateFellowshipRow = (index: number, field: keyof SabbathFellowshipRow, fieldValue: string) => {
    const nextRows = value.fellowship.map((row, rowIndex) =>
      rowIndex === index
        ? {
            ...row,
            [field]: fieldValue
          }
        : row
    );

    onChange({ ...value, fellowship: nextRows });
  };

  const removeMidweekRow = (index: number) => {
    const nextRows = value.midweekWorkers.filter((_, rowIndex) => rowIndex !== index);
    onChange({ ...value, midweekWorkers: nextRows.length ? nextRows : [createMidweekWorkerRow()] });
  };

  const removeTodayRow = (index: number) => {
    const nextRows = value.todaySabbathWorkers.filter((_, rowIndex) => rowIndex !== index);
    onChange({ ...value, todaySabbathWorkers: nextRows.length ? nextRows : [createTodayWorkerRow()] });
  };

  const removeNextWeekRow = (index: number) => {
    const nextRows = value.nextWeekSabbathWorkers.filter((_, rowIndex) => rowIndex !== index);
    onChange({ ...value, nextWeekSabbathWorkers: nextRows.length ? nextRows : [createNextWeekWorkerRow()] });
  };

  const removeFellowshipRow = (index: number) => {
    const nextRows = value.fellowship.filter((_, rowIndex) => rowIndex !== index);
    onChange({ ...value, fellowship: nextRows.length ? nextRows : [createFellowshipRow()] });
  };

  return (
    <article className="mt-4 rounded-md border border-white/10 bg-slate-950/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-white">
            {isEditing ? wizardMeta.editTitle : wizardMeta.createTitle}
          </h3>
          <p className="text-sm text-slate-400">
            Save each section as you complete it. Any admin with access can return later and continue editing the same draft.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-md bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-slate-200">
            {completedCount}/{stepDefinitions.length} saved
          </span>
          <button type="button" className="admin-btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[15rem_minmax(0,1fr)_22rem]">
        <div className="grid gap-2 self-start">
          {stepDefinitions.map((step, index) => (
            <StepButton
              key={step.id}
              active={index === boundedStepIndex}
              complete={value.progress.completedStepIds.includes(step.id)}
              index={index}
              title={step.title}
              onClick={() => onStepChange(index)}
            />
          ))}
        </div>

        <div className="space-y-4 rounded-md border border-white/10 bg-white/[0.03] p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-church-300">Step {boundedStepIndex + 1}</p>
            <h4 className="mt-1 text-lg font-bold text-white">{activeStep.title}</h4>
            <SectionHint text={activeStep.description} />
          </div>

          {activeStep.id === "church_header" ? (
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm font-semibold">
                <span>Header line 1</span>
                <input
                  className="form-input"
                  value={value.header.line1}
                  onChange={(event) => setHeaderField("line1", event.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                <span>Header line 2</span>
                <input
                  className="form-input"
                  value={value.header.line2}
                  onChange={(event) => setHeaderField("line2", event.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                <span>Header line 3</span>
                <input
                  className="form-input"
                  value={value.header.line3}
                  onChange={(event) => setHeaderField("line3", event.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                <span>Header line 4</span>
                <input
                  className="form-input"
                  value={value.header.line4}
                  onChange={(event) => setHeaderField("line4", event.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold md:col-span-2">
                <span>Header line 5</span>
                <input
                  className="form-input"
                  value={value.header.line5}
                  onChange={(event) => setHeaderField("line5", event.target.value)}
                />
              </label>
            </div>
          ) : null}

          {activeStep.id === "announcement_date" ? (
            <label className="grid gap-1 text-sm font-semibold md:max-w-xs">
              <span>Announcement date</span>
              <input
                className="form-input"
                type="date"
                value={value.announcementDate}
                onChange={(event) => onChange({ ...value, announcementDate: event.target.value })}
              />
            </label>
          ) : null}

          {activeStep.id === "announcement_items" ? (
            <label className="grid gap-1 text-sm font-semibold">
              <span>Announcement items</span>
              <textarea
                className="form-input"
                rows={12}
                placeholder={"Write one item per line.\nExample:\nChurch board meeting after service\nYouth choir practice at 4 PM"}
                value={value.announcementItems.join("\n")}
                onChange={(event) => setAnnouncementLines("announcementItems", event.target.value)}
              />
            </label>
          ) : null}

          {activeStep.id === "midweek_workers" ? (
            <div className="space-y-3">
              <TableHeader labels={["Day", "Chairperson", "Secretary"]} gridClassName="md:grid-cols-[1.1fr_1fr_1fr_auto]" />
              {value.midweekWorkers.map((row, index) => (
                <div key={row.id} className="grid gap-2 md:grid-cols-[1.1fr_1fr_1fr_auto]">
                  <input
                    className="form-input"
                    placeholder="Day"
                    value={row.day}
                    onChange={(event) => updateMidweekRow(index, "day", event.target.value)}
                  />
                  <input
                    className="form-input"
                    placeholder="Chairperson"
                    value={row.chairperson}
                    onChange={(event) => updateMidweekRow(index, "chairperson", event.target.value)}
                  />
                  <input
                    className="form-input"
                    placeholder="Secretary"
                    value={row.secretary}
                    onChange={(event) => updateMidweekRow(index, "secretary", event.target.value)}
                  />
                  <button type="button" className="admin-btn-danger" onClick={() => removeMidweekRow(index)}>
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="admin-btn-ghost"
                onClick={() => onChange({ ...value, midweekWorkers: [...value.midweekWorkers, createMidweekWorkerRow()] })}
              >
                + Add row
              </button>
            </div>
          ) : null}

          {activeStep.id === "today_sabbath_workers" ? (
            <div className="space-y-3">
              <TableHeader labels={["Role", "Chairperson"]} gridClassName="md:grid-cols-[1.2fr_1fr_auto]" />
              {value.todaySabbathWorkers.map((row, index) => (
                <div key={row.id} className="grid gap-2 md:grid-cols-[1.2fr_1fr_auto]">
                  <input
                    className="form-input"
                    placeholder="Role"
                    value={row.role}
                    onChange={(event) => updateTodayRows(index, "role", event.target.value)}
                  />
                  <input
                    className="form-input"
                    placeholder="Chairperson"
                    value={row.chairperson}
                    onChange={(event) => updateTodayRows(index, "chairperson", event.target.value)}
                  />
                  <button
                    type="button"
                    className="admin-btn-danger"
                    onClick={() => removeTodayRow(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="admin-btn-ghost"
                onClick={() => onChange({ ...value, todaySabbathWorkers: [...value.todaySabbathWorkers, createTodayWorkerRow()] })}
              >
                + Add row
              </button>
            </div>
          ) : null}

          {activeStep.id === "next_week_sabbath_workers" ? (
            <div className="space-y-3">
              <TableHeader labels={["Role", "Chairperson"]} gridClassName="md:grid-cols-[1.2fr_1fr_auto]" />
              {value.nextWeekSabbathWorkers.map((row, index) => (
                <div key={row.id} className="grid gap-2 md:grid-cols-[1.2fr_1fr_auto]">
                  <input
                    className="form-input"
                    placeholder="Role"
                    value={row.role}
                    onChange={(event) => updateNextWeekRows(index, "role", event.target.value)}
                  />
                  <input
                    className="form-input"
                    placeholder="Chairperson"
                    value={row.chairperson}
                    onChange={(event) => updateNextWeekRows(index, "chairperson", event.target.value)}
                  />
                  <button
                    type="button"
                    className="admin-btn-danger"
                    onClick={() => removeNextWeekRow(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="admin-btn-ghost"
                onClick={() =>
                  onChange({
                    ...value,
                    nextWeekSabbathWorkers: [...value.nextWeekSabbathWorkers, createNextWeekWorkerRow()]
                  })
                }
              >
                + Add row
              </button>
            </div>
          ) : null}

          {activeStep.id === "deacons_on_duty" ? (
            <label className="grid gap-1 text-sm font-semibold">
              <span>Deacons on duty</span>
              <textarea
                className="form-input"
                rows={10}
                placeholder={"Write one deacon per line.\nExample:\nJohn Doe\nJane Doe"}
                value={value.deaconsOnDuty.join("\n")}
                onChange={(event) => setAnnouncementLines("deaconsOnDuty", event.target.value)}
              />
            </label>
          ) : null}

          {activeStep.id === "fellowship" ? (
            <div className="space-y-3">
              <TableHeader labels={["Name", "From", "To"]} gridClassName="md:grid-cols-[1fr_1fr_1fr_auto]" />
              {value.fellowship.map((row, index) => (
                <div key={row.id} className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto]">
                  <input
                    className="form-input"
                    placeholder="Name"
                    value={row.name}
                    onChange={(event) => updateFellowshipRow(index, "name", event.target.value)}
                  />
                  <input
                    className="form-input"
                    placeholder="From"
                    value={row.fromChurch}
                    onChange={(event) => updateFellowshipRow(index, "fromChurch", event.target.value)}
                  />
                  <input
                    className="form-input"
                    placeholder="To"
                    value={row.toChurch}
                    onChange={(event) => updateFellowshipRow(index, "toChurch", event.target.value)}
                  />
                  <button type="button" className="admin-btn-danger" onClick={() => removeFellowshipRow(index)}>
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="admin-btn-ghost"
                onClick={() => onChange({ ...value, fellowship: [...value.fellowship, createFellowshipRow()] })}
              >
                + Add row
              </button>
            </div>
          ) : null}

          {activeStep.id === "publish_settings" ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-sm font-semibold">
                  <span>Live start date/time</span>
                  <input
                    className="form-input"
                    type="datetime-local"
                    value={toDateTimeInput(value.publishWindow.startDate)}
                    onChange={(event) =>
                      onChange({
                        ...value,
                        publishWindow: {
                          ...value.publishWindow,
                          startDate: toIsoValue(event.target.value)
                        }
                      })
                    }
                  />
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  <span>Live end date/time</span>
                  <input
                    className="form-input"
                    type="datetime-local"
                    value={toDateTimeInput(value.publishWindow.endDate)}
                    onChange={(event) =>
                      onChange({
                        ...value,
                        publishWindow: {
                          ...value.publishWindow,
                          endDate: toIsoValue(event.target.value)
                        }
                      })
                    }
                  />
                </label>
              </div>

              <div className="rounded-md border border-white/10 bg-slate-950/30 p-3 text-sm text-slate-200">
                <p className="font-semibold text-white">Publishing rule</p>
                <p className="mt-2 text-slate-300">
                  {wizardMeta.publishingLabel} will appear as <span className="font-semibold text-church-200">Scheduled</span> before the start time,
                  <span className="font-semibold text-emerald-300"> Active</span> during the live window, and
                  <span className="font-semibold text-slate-200"> Expired</span> after the end time.
                </p>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
            <button
              type="button"
              className="admin-btn-ghost"
              disabled={isSaving || !canSave}
              onClick={() => onSaveDraft(false)}
            >
              {isSaving ? "Saving..." : "Save this step"}
            </button>
            <button
              type="button"
              className="admin-btn-primary"
              disabled={isSaving || !canSave || boundedStepIndex >= stepDefinitions.length - 1}
              onClick={() => onSaveDraft(true)}
            >
              {isSaving ? "Saving..." : "Save and next"}
            </button>
            {isPublishStep ? (
              <button
                type="button"
                className="admin-btn-primary"
                disabled={isSaving || !canSave || !canPublish}
                onClick={onPublish}
              >
                {isSaving ? "Saving..." : "Publish announcement"}
              </button>
            ) : null}
          </div>
        </div>

        <aside className="self-start xl:sticky xl:top-6">
          <div className="space-y-3 rounded-md border border-white/10 bg-white/[0.03] p-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-church-300">Live preview</p>
              <p className="text-sm text-slate-400">A compact A4 preview stays visible while you fill each section.</p>
            </div>
            <div className="max-h-[calc(100vh-10rem)] overflow-auto pr-1">
              <SabbathAnnouncementPreview document={value} announcementType={announcementType} compact />
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}
