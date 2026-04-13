import { api } from "@/lib/api";
import type { AxiosProgressEvent } from "axios";

type ApiResponse<T> = {
  ok: boolean;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type MediaCategory = "image" | "video";
export type AnnouncementType = "emergency" | "sabbath" | "ongoing";
export type AnnouncementWorkflowStatus = "draft" | "published";
export type AnnouncementStatus = "draft" | "scheduled" | "active" | "expired";
export type EventStatus = "draft" | "upcoming" | "ongoing" | "past";

export type SabbathAnnouncementStepId =
  | "church_header"
  | "announcement_date"
  | "announcement_items"
  | "midweek_workers"
  | "today_sabbath_workers"
  | "next_week_sabbath_workers"
  | "deacons_on_duty"
  | "fellowship"
  | "publish_settings";

export type SabbathAnnouncementHeader = {
  line1: string;
  line2: string;
  line3: string;
  line4: string;
  line5: string;
};

export type SabbathMidweekWorkerRow = {
  id: string;
  day: string;
  chairperson: string;
  secretary: string;
};

export type SabbathTodayWorkerRow = {
  id: string;
  role: string;
  chairperson: string;
};

export type SabbathNextWeekWorkerRow = {
  id: string;
  role: string;
  chairperson: string;
};

export type SabbathFellowshipRow = {
  id: string;
  name: string;
  fromChurch: string;
  toChurch: string;
};

export type SabbathAnnouncementProgress = {
  lastStep: number;
  completedStepIds: SabbathAnnouncementStepId[];
};

export type SabbathPublishWindow = {
  startDate: string;
  endDate: string;
};

export type SabbathAnnouncementDocument = {
  header: SabbathAnnouncementHeader;
  announcementDate: string;
  announcementItems: string[];
  midweekWorkers: SabbathMidweekWorkerRow[];
  todaySabbathWorkers: SabbathTodayWorkerRow[];
  nextWeekSabbathWorkers: SabbathNextWeekWorkerRow[];
  deaconsOnDuty: string[];
  fellowship: SabbathFellowshipRow[];
  publishWindow: SabbathPublishWindow;
  progress: SabbathAnnouncementProgress;
};

export type MediaItem = {
  id: string;
  category: MediaCategory;
  mediaCategoryId: string;
  mediaCategoryName?: string;
  title: string;
  description: string;
  imageUrl: string;
  videoUrl: string;
  thumbnailUrl: string;
  createdAt: string;
  updatedAt: string;
  videoEmbedUrl?: string | null;
};

export type MediaCategoryItem = {
  id: string;
  type: MediaCategory;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type AnnouncementItem = {
  id: string;
  title: string;
  summary: string;
  content: string;
  type: AnnouncementType;
  workflowStatus: AnnouncementWorkflowStatus;
  status: AnnouncementStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  createdByName?: string;
  updatedById?: string;
  updatedByName?: string;
  documentData?: SabbathAnnouncementDocument | null;
};

export type DepartmentCommitteeMemberItem = {
  id: string;
  name: string;
  title: string;
  description: string;
};

export type DepartmentItem = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  createdAt: string;
  committee: DepartmentCommitteeMemberItem[];
};

export type DepartmentReportItem = {
  id: string;
  departmentId: string;
  title: string;
  content: string;
  reportDate: string;
  author: string;
};

export type DepartmentDetailItem = DepartmentItem & {
  reports: DepartmentReportItem[];
};

export type LeaderItem = {
  id: string;
  name: string;
  title: string;
  biography: string;
  imageUrl: string;
  order: number;
};

export type GroupItem = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  youtubeLink: string;
  youtubeEmbedUrl?: string | null;
  type: string;
};

export type EventItem = {
  id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  category: string;
  actionLabel: string;
  isFeatured: boolean;
  location: string;
  startDate: string;
  endDate: string;
  isPublished: boolean;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
  createdById?: string;
  createdByName?: string;
  updatedById?: string;
  updatedByName?: string;
};

export async function fetchDashboard() {
  const response = await api.get<ApiResponse<unknown>>("/admin/dashboard");
  return response.data.data as {
    stats: {
      totalIdara: number;
      totalViongozi: number;
      activeMatangazo: number;
      totalReports: number;
      totalImages: number;
      totalVideos: number;
    };
    recentActivities: Array<{
      id: string;
      action: string;
      entity: string;
      userName: string;
      detail: string;
      createdAt: string;
    }>;
  };
}

export async function fetchSiteSettings() {
  const response = await api.get<ApiResponse<Record<string, unknown>>>("/admin/site-settings");
  return response.data.data;
}

export async function updateSiteSettings(payload: Record<string, unknown>) {
  const response = await api.put<ApiResponse<Record<string, unknown>>>(
    "/admin/site-settings",
    payload
  );
  return response.data.data;
}

type UploadedImageData = {
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
};

export function normalizeUploadPath(uploadPath: string) {
  const raw = String(uploadPath || "").trim();
  if (!raw) return "";

  try {
    const parsed = new URL(raw);
    const pathName = String(parsed.pathname || "");
    const lowerPathName = pathName.toLowerCase();
    if (lowerPathName.startsWith("/uploads/")) {
      const joined = `${pathName}${parsed.search || ""}`;
      return normalizeUploadPath(joined);
    }
    return raw;
  } catch {
    // ignore invalid absolute URL parse and continue with raw string.
  }

  const normalized = raw.replace(/\\/g, "/");
  const lower = normalized.toLowerCase();
  const uploadsIndex = lower.indexOf("/uploads/");
  if (uploadsIndex >= 0) {
    return normalized.slice(uploadsIndex);
  }

  if (lower.startsWith("uploads/")) {
    return `/${normalized}`;
  }

  return normalized;
}

export function resolvePublicUploadUrl(uploadPath: string) {
  const normalizedPath = normalizeUploadPath(uploadPath);
  if (!normalizedPath) return "";

  try {
    const apiBase = String(api.defaults.baseURL || "");
    const apiUrl = new URL(apiBase, window.location.origin);
    return new URL(normalizedPath, apiUrl.origin).toString();
  } catch {
    return normalizedPath;
  }
}

function mapMediaUrls(item: MediaItem): MediaItem {
  return {
    ...item,
    imageUrl: resolvePublicUploadUrl(String(item?.imageUrl || "")),
    thumbnailUrl: resolvePublicUploadUrl(String(item?.thumbnailUrl || ""))
  };
}

function mapDepartmentUrls(item: DepartmentItem): DepartmentItem {
  return {
    ...item,
    imageUrl: resolvePublicUploadUrl(String(item?.imageUrl || ""))
  };
}

function mapDepartmentDetailUrls(item: DepartmentDetailItem): DepartmentDetailItem {
  return {
    ...mapDepartmentUrls(item),
    reports: Array.isArray(item?.reports) ? item.reports : []
  };
}

function mapLeaderUrls(item: LeaderItem): LeaderItem {
  return {
    ...item,
    imageUrl: resolvePublicUploadUrl(String(item?.imageUrl || ""))
  };
}

function mapGroupUrls(item: GroupItem): GroupItem {
  return {
    ...item,
    imageUrl: resolvePublicUploadUrl(String(item?.imageUrl || ""))
  };
}

function mapEventUrls(item: EventItem): EventItem {
  return {
    ...item,
    imageUrl: resolvePublicUploadUrl(String(item?.imageUrl || ""))
  };
}

export async function uploadSiteImage(
  file: File,
  onProgress?: (percent: number) => void
) {
  const payload = new FormData();
  payload.append("image", file);

  onProgress?.(1);

  const response = await api.post<ApiResponse<UploadedImageData>>("/admin/uploads/image", payload, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000,
    onUploadProgress: (event: AxiosProgressEvent) => {
      const ratio =
        typeof event.progress === "number"
          ? event.progress
          : Number(event.total || 0) > 0
            ? Number(event.loaded || 0) / Number(event.total || 1)
            : 0;

      const percent = Math.max(1, Math.min(99, Math.round(ratio * 100)));
      onProgress?.(percent);
    }
  });

  onProgress?.(100);
  return resolvePublicUploadUrl(String(response.data?.data?.path || ""));
}

export async function uploadSiteDocument(file: File) {
  const payload = new FormData();
  payload.append("document", file);

  const response = await api.post<ApiResponse<UploadedImageData>>(
    "/admin/uploads/document",
    payload,
    {
      headers: { "Content-Type": "multipart/form-data" }
    }
  );

  return {
    url: normalizeUploadPath(String(response.data?.data?.path || "")),
    fileName: String(response.data?.data?.originalName || response.data?.data?.fileName || "")
  };
}

export async function fetchAdminMedia(params?: {
  category?: MediaCategory;
  mediaCategoryId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const response = await api.get<ApiResponse<MediaItem[]>>("/admin/media", { params });
  return {
    ...response.data,
    data: (response.data.data || []).map(mapMediaUrls)
  };
}

export async function createMedia(payload: Record<string, unknown>) {
  const response = await api.post<ApiResponse<MediaItem>>("/admin/media", payload);
  return mapMediaUrls(response.data.data);
}

export async function updateMedia(mediaId: string, payload: Record<string, unknown>) {
  const response = await api.put<ApiResponse<MediaItem>>(`/admin/media/${mediaId}`, payload);
  return mapMediaUrls(response.data.data);
}

export async function deleteMedia(mediaId: string) {
  await api.delete(`/admin/media/${mediaId}`);
}

export async function fetchPublicMedia(params?: {
  category?: MediaCategory;
  mediaCategoryId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const response = await api.get<ApiResponse<MediaItem[]>>("/public/media", { params });
  return {
    ...response.data,
    data: (response.data.data || []).map(mapMediaUrls)
  };
}

export async function fetchAdminMediaCategories(params?: {
  type?: MediaCategory;
  search?: string;
}) {
  const response = await api.get<ApiResponse<MediaCategoryItem[]>>("/admin/media-categories", { params });
  return response.data;
}

export async function createMediaCategory(payload: { type: MediaCategory; name: string }) {
  const response = await api.post<ApiResponse<MediaCategoryItem>>("/admin/media-categories", payload);
  return response.data.data;
}

export async function deleteMediaCategory(categoryId: string) {
  await api.delete(`/admin/media-categories/${categoryId}`);
}

export async function updateMediaCategory(categoryId: string, payload: { name: string }) {
  const response = await api.put<ApiResponse<MediaCategoryItem>>(
    `/admin/media-categories/${categoryId}`,
    payload
  );
  return response.data.data;
}

export async function fetchPublicMediaCategories(params?: {
  type?: MediaCategory;
  search?: string;
}) {
  const response = await api.get<ApiResponse<MediaCategoryItem[]>>("/public/media-categories", { params });
  return response.data;
}

export async function fetchDepartments(params?: { search?: string; page?: number; limit?: number }) {
  const response = await api.get<ApiResponse<DepartmentItem[]>>("/admin/departments", { params });
  return {
    ...response.data,
    data: (response.data.data || []).map(mapDepartmentUrls)
  };
}

export async function fetchDepartmentDetail(departmentId: string) {
  const response = await api.get<ApiResponse<DepartmentDetailItem>>(`/admin/departments/${departmentId}`);
  return mapDepartmentDetailUrls(response.data.data);
}

export async function fetchPublicDepartments(params?: { search?: string; page?: number; limit?: number }) {
  const response = await api.get<ApiResponse<DepartmentItem[]>>("/public/departments", { params });
  return {
    ...response.data,
    data: (response.data.data || []).map(mapDepartmentUrls)
  };
}

export async function fetchPublicDepartmentDetail(departmentId: string) {
  const response = await api.get<ApiResponse<DepartmentDetailItem>>(`/public/departments/${departmentId}`);
  return mapDepartmentDetailUrls(response.data.data);
}

export async function createDepartment(payload: Record<string, unknown>) {
  const response = await api.post<ApiResponse<DepartmentItem>>("/admin/departments", payload);
  return mapDepartmentUrls(response.data.data);
}

export async function updateDepartment(departmentId: string, payload: Record<string, unknown>) {
  const response = await api.put<ApiResponse<DepartmentItem>>(`/admin/departments/${departmentId}`, payload);
  return mapDepartmentUrls(response.data.data);
}

export async function deleteDepartment(departmentId: string) {
  await api.delete(`/admin/departments/${departmentId}`);
}

export async function createCommitteeMember(
  departmentId: string,
  payload: Record<string, unknown>
) {
  const response = await api.post<ApiResponse<any>>(
    `/admin/departments/${departmentId}/committee`,
    payload
  );
  return response.data.data;
}

export async function updateCommitteeMember(
  departmentId: string,
  memberId: string,
  payload: Record<string, unknown>
) {
  const response = await api.put<ApiResponse<any>>(
    `/admin/departments/${departmentId}/committee/${memberId}`,
    payload
  );
  return response.data.data;
}

export async function deleteCommitteeMember(departmentId: string, memberId: string) {
  await api.delete(`/admin/departments/${departmentId}/committee/${memberId}`);
}

export async function createDepartmentReport(
  departmentId: string,
  payload: Record<string, unknown>
) {
  const response = await api.post<ApiResponse<any>>(
    `/admin/departments/${departmentId}/reports`,
    payload
  );
  return response.data.data;
}

export async function updateDepartmentReport(
  departmentId: string,
  reportId: string,
  payload: Record<string, unknown>
) {
  const response = await api.put<ApiResponse<any>>(
    `/admin/departments/${departmentId}/reports/${reportId}`,
    payload
  );
  return response.data.data;
}

export async function deleteDepartmentReport(departmentId: string, reportId: string) {
  await api.delete(`/admin/departments/${departmentId}/reports/${reportId}`);
}

export async function fetchLeaders(params?: { page?: number; limit?: number; sort?: string }) {
  const response = await api.get<ApiResponse<LeaderItem[]>>("/admin/leaders", { params });
  return {
    ...response.data,
    data: (response.data.data || []).map(mapLeaderUrls)
  };
}

export async function fetchPublicLeaders(params?: { page?: number; limit?: number; sort?: string }) {
  const response = await api.get<ApiResponse<LeaderItem[]>>("/public/leaders", { params });
  return {
    ...response.data,
    data: (response.data.data || []).map(mapLeaderUrls)
  };
}

export async function createLeader(payload: Record<string, unknown>) {
  const response = await api.post<ApiResponse<LeaderItem>>("/admin/leaders", payload);
  return mapLeaderUrls(response.data.data);
}

export async function updateLeader(leaderId: string, payload: Record<string, unknown>) {
  const response = await api.put<ApiResponse<LeaderItem>>(`/admin/leaders/${leaderId}`, payload);
  return mapLeaderUrls(response.data.data);
}

export async function deleteLeader(leaderId: string) {
  await api.delete(`/admin/leaders/${leaderId}`);
}

export async function fetchGroups(params?: { search?: string; page?: number; limit?: number }) {
  const response = await api.get<ApiResponse<GroupItem[]>>("/admin/groups", { params });
  return {
    ...response.data,
    data: (response.data.data || []).map(mapGroupUrls)
  };
}

export async function fetchPublicGroups(params?: { search?: string; page?: number; limit?: number }) {
  const response = await api.get<ApiResponse<GroupItem[]>>("/public/groups", { params });
  return {
    ...response.data,
    data: (response.data.data || []).map(mapGroupUrls)
  };
}

export async function createGroup(payload: Record<string, unknown>) {
  const response = await api.post<ApiResponse<GroupItem>>("/admin/groups", payload);
  return mapGroupUrls(response.data.data);
}

export async function updateGroup(groupId: string, payload: Record<string, unknown>) {
  const response = await api.put<ApiResponse<GroupItem>>(`/admin/groups/${groupId}`, payload);
  return mapGroupUrls(response.data.data);
}

export async function deleteGroup(groupId: string) {
  await api.delete(`/admin/groups/${groupId}`);
}

export async function fetchEvents(params?: {
  status?: EventStatus | "";
  search?: string;
  page?: number;
  limit?: number;
}) {
  const response = await api.get<ApiResponse<EventItem[]>>("/admin/events", { params });
  return {
    ...response.data,
    data: (response.data.data || []).map(mapEventUrls)
  };
}

export async function fetchPublicEvents(params?: {
  status?: EventStatus | "";
  search?: string;
  page?: number;
  limit?: number;
}) {
  const response = await api.get<ApiResponse<EventItem[]>>("/public/events", { params });
  return {
    ...response.data,
    data: (response.data.data || []).map(mapEventUrls)
  };
}

export async function createEvent(payload: Record<string, unknown>) {
  const response = await api.post<ApiResponse<EventItem>>("/admin/events", payload);
  return mapEventUrls(response.data.data);
}

export async function updateEvent(eventId: string, payload: Record<string, unknown>) {
  const response = await api.put<ApiResponse<EventItem>>(`/admin/events/${eventId}`, payload);
  return mapEventUrls(response.data.data);
}

export async function deleteEvent(eventId: string) {
  await api.delete(`/admin/events/${eventId}`);
}

export async function fetchReports(params?: { departmentId?: string; search?: string; page?: number; limit?: number }) {
  const response = await api.get<ApiResponse<any[]>>("/admin/reports", { params });
  return response.data;
}

export async function createReport(payload: FormData) {
  const response = await api.post<ApiResponse<any>>("/admin/reports", payload, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data.data;
}

export async function fetchAnnouncements(params?: {
  status?: AnnouncementStatus | "";
  type?: AnnouncementType;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const response = await api.get<ApiResponse<AnnouncementItem[]>>("/admin/announcements", { params });
  return response.data;
}

export async function fetchPublicAnnouncements(params?: {
  status?: AnnouncementStatus | "";
  type?: AnnouncementType;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const response = await api.get<ApiResponse<AnnouncementItem[]>>("/public/announcements", { params });
  return response.data;
}

function resolvePublicApiOrigin() {
  try {
    const apiBase = String(api.defaults.baseURL || "");
    const apiUrl = new URL(apiBase, window.location.origin);
    return apiUrl.origin;
  } catch {
    return window.location.origin;
  }
}

export function resolveAnnouncementPdfUrl(announcementId: string, layout: "a4" | "slides") {
  const origin = resolvePublicApiOrigin();
  return `${origin}/api/public/announcements/${announcementId}/pdf?layout=${layout}`;
}

export async function createAnnouncement(payload: Record<string, unknown>) {
  const response = await api.post<ApiResponse<AnnouncementItem>>("/admin/announcements", payload);
  return response.data.data;
}

export async function updateAnnouncement(announcementId: string, payload: Record<string, unknown>) {
  const response = await api.put<ApiResponse<AnnouncementItem>>(
    `/admin/announcements/${announcementId}`,
    payload
  );
  return response.data.data;
}

export async function deleteAnnouncement(announcementId: string) {
  await api.delete(`/admin/announcements/${announcementId}`);
}

export async function fetchUsers() {
  const response = await api.get<ApiResponse<any[]>>("/admin/users");
  return response.data.data;
}

export async function createUser(payload: Record<string, unknown>) {
  const response = await api.post<ApiResponse<any>>("/admin/users", payload);
  return response.data.data;
}

export async function updateUser(userId: string, payload: Record<string, unknown>) {
  const response = await api.put<ApiResponse<any>>(`/admin/users/${userId}`, payload);
  return response.data.data;
}

export async function deleteUser(userId: string) {
  await api.delete(`/admin/users/${userId}`);
}
