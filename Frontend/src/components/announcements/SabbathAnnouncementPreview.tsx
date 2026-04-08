import { format } from "date-fns";
import type { AnnouncementType, SabbathAnnouncementDocument } from "@/services/adminService";

type Props = {
  document: SabbathAnnouncementDocument;
  announcementType?: AnnouncementType;
  className?: string;
  compact?: boolean;
};

function formatAnnouncementDate(value: string) {
  if (!value) return "";
  const parsed = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(parsed.getTime())) return "";
  return format(parsed, "dd/MM/yyyy");
}

function PreviewTable({
  headers,
  rows,
  widths,
  compact = false
}: {
  headers: string[];
  rows: string[][];
  widths?: string[];
  compact?: boolean;
}) {
  return (
    <div className="overflow-auto">
      <table
        className={[
          "min-w-full border border-[#b7b7b7] leading-[1.5] text-[#111]",
          compact ? "text-[10px]" : "text-[11px]"
        ].join(" ")}
      >
        <colgroup>
          {headers.map((header, index) => (
            <col key={header} style={widths?.[index] ? { width: widths[index] } : undefined} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} className="border border-[#b7b7b7] px-2 py-1 text-left font-bold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, rowIndex) => (
              <tr key={`${headers[0]}-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`${rowIndex}-${cellIndex}`} className="border border-[#b7b7b7] px-2 py-1 align-top">
                    {cell || "\u00A0"}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={headers.length} className="border border-[#b7b7b7] px-2 py-2 text-center text-[#666]">
                No entries yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function getPreviewTitle(type: AnnouncementType, announcementDate: string) {
  if (type === "emergency") {
    return announcementDate ? `Matangazo ya Dharura ya tarehe ${announcementDate}` : "Matangazo ya Dharura";
  }

  if (type === "ongoing") {
    return announcementDate ? `Matangazo Endelevu ya tarehe ${announcementDate}` : "Matangazo Endelevu";
  }

  return announcementDate ? `Matangazo ya Sabato ya tarehe ${announcementDate}` : "Matangazo ya Sabato";
}

export default function SabbathAnnouncementPreview({
  document,
  announcementType = "sabbath",
  className = "",
  compact = false
}: Props) {
  const headerLines = [
    document.header.line1,
    document.header.line2,
    document.header.line3,
    document.header.line4,
    document.header.line5
  ].filter(Boolean);
  const announcementDate = formatAnnouncementDate(document.announcementDate);
  const announcementItems = document.announcementItems.filter(Boolean);
  const showExtendedSections = announcementType === "sabbath";
  const midweekRows = document.midweekWorkers.filter((row) => row.day || row.chairperson || row.secretary);
  const todayRows = document.todaySabbathWorkers.filter((row) => row.role || row.chairperson);
  const nextWeekRows = document.nextWeekSabbathWorkers.filter((row) => row.role || row.chairperson);
  const deacons = document.deaconsOnDuty.filter(Boolean);
  const fellowshipRows = document.fellowship.filter((row) => row.name || row.fromChurch || row.toChurch);
  const railWidth = compact ? 50 : 74;
  const contentRightPadding = compact ? 54 : 78;
  const shellClasses = compact
    ? "sabbath-preview-shell overflow-hidden rounded-2xl border border-white/10 bg-[#0a1438]/70 shadow-none"
    : "sabbath-preview-shell overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100 shadow-[0_16px_38px_rgba(15,23,42,0.1)]";
  const viewportClasses = compact ? "overflow-auto p-1.5" : "overflow-auto p-2 sm:p-2 md:p-3";
  const paperClasses = compact
    ? "sabbath-preview-paper relative mx-auto w-full max-w-[440px] overflow-hidden bg-[#e6e6e6] px-3 py-3 shadow-[0_16px_38px_rgba(15,23,42,0.16)]"
    : "sabbath-preview-paper relative mx-auto w-full sm:min-w-[720px] sm:max-w-[820px] overflow-hidden bg-[#e6e6e6] px-3 sm:px-4 md:px-8 py-3 sm:py-4 md:py-6 shadow-[0_18px_44px_rgba(15,23,42,0.14)]";
  const headerTextSize = compact ? "text-[9px]" : "text-[11px]";
  const bodyTextSize = compact ? "text-[9px]" : "text-[11px]";
  const numberColumnWidth = compact ? "14px" : "16px";
  const sectionSpacing = compact ? "mt-3" : "mt-5";
  const titleMargin = compact ? "mt-3" : "mt-5";
  const bodySpacing = compact ? "space-y-1.5" : "space-y-2.5";

  return (
    <div className={`${shellClasses} ${className}`}>
      <div className={viewportClasses}>
        <div
          className={paperClasses}
          style={{ fontFamily: '"Times New Roman", Times, serif', lineHeight: 1.4 }}
        >
          <div className="absolute inset-y-0 right-0 bg-[#c6d1eb]" style={{ width: `${railWidth}px` }} />
          <div
            className="absolute right-0 top-0 flex justify-center bg-[#214d81]"
            style={{ width: `${railWidth}px`, paddingTop: compact ? "4px" : "8px", paddingBottom: compact ? "4px" : "8px" }}
          >
            <img
              src="/adventistLogo.png"
              alt="Adventist logo"
              className={compact ? "h-6 w-6 object-contain" : "h-10 w-10 object-contain"}
            />
          </div>

          <div className="relative" style={{ paddingRight: `${contentRightPadding}px` }}>
            <header className={`text-center font-bold uppercase tracking-[0.02em] ${headerTextSize}`}>
              {headerLines.map((line) => (
                <p key={line} className={compact ? "mb-0 leading-tight" : "mb-0.5"}>
                  {line}
                </p>
              ))}
            </header>

            <section className={titleMargin}>
              <h3 className={`inline-block border-b border-[#222] pb-0 font-bold uppercase ${headerTextSize} ${compact ? "leading-tight" : ""}`}>
                {getPreviewTitle(announcementType, announcementDate)}
              </h3>
            </section>

            <section className={`mt-4 ${bodySpacing} ${bodyTextSize}`}>
              {announcementItems.map((item, index) => (
                <div
                  key={`announcement-${index}`}
                  className="grid gap-1"
                  style={{ gridTemplateColumns: `${numberColumnWidth} minmax(0, 1fr)` }}
                >
                  <span className="font-normal">{index + 1}.</span>
                  <p className="m-0 text-justify">{item}</p>
                </div>
              ))}
            </section>

            {showExtendedSections && midweekRows.length ? (
              <section className={sectionSpacing}>
                <h4 className={`text-center font-bold uppercase ${headerTextSize}`}>Wahudumu katikati ya wiki</h4>
                <div className="mt-2">
                  <PreviewTable
                    headers={["S/N", "SIKU", "MWENYEKITI", "KATIBU"]}
                    widths={["10%", "30%", "30%", "30%"]}
                    compact={compact}
                    rows={midweekRows.map((row, index) => [
                      `${index + 1}.`,
                      row.day,
                      row.chairperson,
                      row.secretary
                    ])}
                  />
                </div>
              </section>
            ) : null}

            {showExtendedSections && todayRows.length ? (
              <section className={sectionSpacing}>
                <h4 className={`text-center font-bold uppercase ${headerTextSize}`}>Wahudumu wa Sabato ya leo</h4>
                <div className="mt-2">
                  <PreviewTable
                    headers={["S/N", "SIKU", "MWENYEKITI"]}
                    widths={["10%", "45%", "45%"]}
                    compact={compact}
                    rows={todayRows.map((row, index) => [
                      `${index + 1}.`,
                      row.role,
                      row.chairperson
                    ])}
                  />
                </div>
              </section>
            ) : null}

            {showExtendedSections && nextWeekRows.length ? (
              <section className={sectionSpacing}>
                <h4 className={`text-center font-bold uppercase ${headerTextSize}`}>Wahudumu wa wiki ijayo</h4>
                <div className="mt-2">
                  <PreviewTable
                    headers={["S/N", "SIKU", "MWENYEKITI"]}
                    widths={["10%", "45%", "45%"]}
                    compact={compact}
                    rows={nextWeekRows.map((row, index) => [
                      `${index + 1}.`,
                      row.role,
                      row.chairperson
                    ])}
                  />
                </div>
              </section>
            ) : null}

            {showExtendedSections && deacons.length ? (
              <section className={sectionSpacing}>
                <h4 className={`text-center font-bold uppercase ${headerTextSize}`}>Mashemasi wa zamu</h4>
                <div className={`mt-2 space-y-1 ${bodyTextSize}`}>
                  {deacons.map((name, index) => (
                    <div
                      key={`deacon-${index}`}
                      className="grid gap-1"
                      style={{ gridTemplateColumns: `${numberColumnWidth} minmax(0, 1fr)` }}
                    >
                      <span>{index + 1}.</span>
                      <p className="m-0">{name}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {showExtendedSections && fellowshipRows.length ? (
              <section className={sectionSpacing}>
                <h4 className={`text-center font-bold uppercase ${headerTextSize}`}>Shirika</h4>
                <div className="mt-2">
                  <PreviewTable
                    headers={["S/N", "JINA", "KUTOKA", "KUINGIA"]}
                    widths={["10%", "30%", "30%", "30%"]}
                    compact={compact}
                    rows={fellowshipRows.map((row, index) => [
                      `${index + 1}.`,
                      row.name,
                      row.fromChurch,
                      row.toChurch
                    ])}
                  />
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
