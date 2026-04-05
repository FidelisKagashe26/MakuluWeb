import type { Announcement } from "@/data/content";

export function isAnnouncementActive(today: Date, startDate: string, endDate: string) {
  const current = today.getTime();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  return current >= start && current <= end;
}

export function getVisibleAnnouncements(items: Announcement[], today = new Date()) {
  return items.filter((item) => isAnnouncementActive(today, item.startDate, item.endDate));
}
