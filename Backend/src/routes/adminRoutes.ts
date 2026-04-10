import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { requireAnySection, requireSection } from "../middleware/permissionMiddleware.js";
import { ADMIN_SECTIONS, PERMISSIONS, ROLE_PERMISSIONS, ROLE_SECTION_ACCESS, ROLES } from "../utils/constants.js";
import { getDashboardStats } from "../controllers/dashboardController.js";
import { getSettings, saveSettings } from "../controllers/siteSettingsController.js";
import {
  createCommitteeMemberHandler,
  createDepartmentHandler,
  createDepartmentReportHandler,
  deleteCommitteeMemberHandler,
  deleteDepartmentHandler,
  deleteDepartmentReportHandler,
  getDepartmentDetail,
  getDepartments,
  updateCommitteeMemberHandler,
  updateDepartmentHandler,
  updateDepartmentReportHandler
} from "../controllers/departmentsController.js";
import {
  createLeaderHandler,
  deleteLeaderHandler,
  getLeaders,
  updateLeaderHandler
} from "../controllers/leadersController.js";
import {
  createGroupHandler,
  deleteGroupHandler,
  getGroups,
  updateGroupHandler
} from "../controllers/groupsController.js";
import {
  createReportHandler,
  deleteReportHandler,
  downloadReportAttachment,
  getReports,
  updateReportHandler
} from "../controllers/reportsController.js";
import {
  createAnnouncementHandler,
  deleteAnnouncementHandler,
  getAnnouncements,
  updateAnnouncementHandler
} from "../controllers/announcementsController.js";
import {
  createEventHandler,
  deleteEventHandler,
  getEvents,
  updateEventHandler
} from "../controllers/eventsController.js";
import {
  createMediaHandler,
  deleteMediaHandler,
  getMedia,
  updateMediaHandler
} from "../controllers/mediaController.js";
import {
  createMediaCategoryHandler,
  deleteMediaCategoryHandler,
  getMediaCategories,
  updateMediaCategoryHandler
} from "../controllers/mediaCategoriesController.js";
import {
  createUserHandler,
  deleteUserHandler,
  getUsers,
  updateUserHandler
} from "../controllers/usersController.js";
import { uploadDocument, uploadImage, uploadReportFiles } from "../middleware/uploadMiddleware.js";
import { compressUploadedImage } from "../middleware/imageCompressionMiddleware.js";
import { uploadDocumentHandler, uploadImageHandler } from "../controllers/uploadController.js";

const router = Router();

router.use(authenticate);

router.get(
  "/dashboard",
  requireSection(ADMIN_SECTIONS.DASHBOARD, PERMISSIONS.VIEW),
  getDashboardStats
);

router.get(
  "/site-settings",
  requireAnySection([ADMIN_SECTIONS.SETTINGS, ADMIN_SECTIONS.LIBRARY], PERMISSIONS.UPDATE),
  getSettings
);
router.put(
  "/site-settings",
  requireAnySection([ADMIN_SECTIONS.SETTINGS, ADMIN_SECTIONS.LIBRARY], PERMISSIONS.UPDATE),
  saveSettings
);
router.post(
  "/uploads/image",
  requireAnySection(
    [
      ADMIN_SECTIONS.SETTINGS,
      ADMIN_SECTIONS.LIBRARY,
      ADMIN_SECTIONS.MEDIA,
      ADMIN_SECTIONS.ANNOUNCEMENTS,
      ADMIN_SECTIONS.DEPARTMENTS,
      ADMIN_SECTIONS.LEADERS,
      ADMIN_SECTIONS.GROUPS
    ],
    PERMISSIONS.UPDATE
  ),
  uploadImage,
  compressUploadedImage,
  uploadImageHandler
);
router.post(
  "/uploads/document",
  requireAnySection([ADMIN_SECTIONS.LIBRARY, ADMIN_SECTIONS.REPORTS], PERMISSIONS.UPDATE),
  uploadDocument,
  uploadDocumentHandler
);

router.get("/departments", requireSection(ADMIN_SECTIONS.DEPARTMENTS, PERMISSIONS.VIEW), getDepartments);
router.get("/departments/:departmentId", requireSection(ADMIN_SECTIONS.DEPARTMENTS, PERMISSIONS.VIEW), getDepartmentDetail);
router.post("/departments", requireSection(ADMIN_SECTIONS.DEPARTMENTS, PERMISSIONS.CREATE), createDepartmentHandler);
router.put("/departments/:departmentId", requireSection(ADMIN_SECTIONS.DEPARTMENTS, PERMISSIONS.UPDATE), updateDepartmentHandler);
router.delete(
  "/departments/:departmentId",
  requireSection(ADMIN_SECTIONS.DEPARTMENTS, PERMISSIONS.DELETE),
  deleteDepartmentHandler
);

router.post(
  "/departments/:departmentId/committee",
  requireSection(ADMIN_SECTIONS.DEPARTMENTS, PERMISSIONS.CREATE),
  createCommitteeMemberHandler
);
router.put(
  "/departments/:departmentId/committee/:memberId",
  requireSection(ADMIN_SECTIONS.DEPARTMENTS, PERMISSIONS.UPDATE),
  updateCommitteeMemberHandler
);
router.delete(
  "/departments/:departmentId/committee/:memberId",
  requireSection(ADMIN_SECTIONS.DEPARTMENTS, PERMISSIONS.DELETE),
  deleteCommitteeMemberHandler
);

router.post(
  "/departments/:departmentId/reports",
  requireSection(ADMIN_SECTIONS.DEPARTMENTS, PERMISSIONS.CREATE),
  createDepartmentReportHandler
);
router.put(
  "/departments/:departmentId/reports/:reportId",
  requireSection(ADMIN_SECTIONS.DEPARTMENTS, PERMISSIONS.UPDATE),
  updateDepartmentReportHandler
);
router.delete(
  "/departments/:departmentId/reports/:reportId",
  requireSection(ADMIN_SECTIONS.DEPARTMENTS, PERMISSIONS.DELETE),
  deleteDepartmentReportHandler
);

router.get("/leaders", requireSection(ADMIN_SECTIONS.LEADERS, PERMISSIONS.VIEW), getLeaders);
router.post("/leaders", requireSection(ADMIN_SECTIONS.LEADERS, PERMISSIONS.CREATE), createLeaderHandler);
router.put("/leaders/:leaderId", requireSection(ADMIN_SECTIONS.LEADERS, PERMISSIONS.UPDATE), updateLeaderHandler);
router.delete("/leaders/:leaderId", requireSection(ADMIN_SECTIONS.LEADERS, PERMISSIONS.DELETE), deleteLeaderHandler);

router.get("/groups", requireSection(ADMIN_SECTIONS.GROUPS, PERMISSIONS.VIEW), getGroups);
router.post("/groups", requireSection(ADMIN_SECTIONS.GROUPS, PERMISSIONS.CREATE), createGroupHandler);
router.put("/groups/:groupId", requireSection(ADMIN_SECTIONS.GROUPS, PERMISSIONS.UPDATE), updateGroupHandler);
router.delete("/groups/:groupId", requireSection(ADMIN_SECTIONS.GROUPS, PERMISSIONS.DELETE), deleteGroupHandler);

router.get("/reports", requireSection(ADMIN_SECTIONS.REPORTS, PERMISSIONS.VIEW), getReports);
router.post(
  "/reports",
  requireSection(ADMIN_SECTIONS.REPORTS, PERMISSIONS.CREATE),
  uploadReportFiles,
  createReportHandler
);
router.put(
  "/reports/:reportId",
  requireSection(ADMIN_SECTIONS.REPORTS, PERMISSIONS.UPDATE),
  uploadReportFiles,
  updateReportHandler
);
router.delete("/reports/:reportId", requireSection(ADMIN_SECTIONS.REPORTS, PERMISSIONS.DELETE), deleteReportHandler);
router.get(
  "/reports/:reportId/attachments/:attachmentId/download",
  requireSection(ADMIN_SECTIONS.REPORTS, PERMISSIONS.VIEW),
  downloadReportAttachment
);

router.get("/announcements", requireSection(ADMIN_SECTIONS.ANNOUNCEMENTS, PERMISSIONS.VIEW), getAnnouncements);
router.post(
  "/announcements",
  requireSection(ADMIN_SECTIONS.ANNOUNCEMENTS, PERMISSIONS.PUBLISH),
  createAnnouncementHandler
);
router.put(
  "/announcements/:announcementId",
  requireSection(ADMIN_SECTIONS.ANNOUNCEMENTS, PERMISSIONS.PUBLISH),
  updateAnnouncementHandler
);
router.delete(
  "/announcements/:announcementId",
  requireSection(ADMIN_SECTIONS.ANNOUNCEMENTS, PERMISSIONS.DELETE),
  deleteAnnouncementHandler
);

router.get("/events", requireSection(ADMIN_SECTIONS.ANNOUNCEMENTS, PERMISSIONS.VIEW), getEvents);
router.post("/events", requireSection(ADMIN_SECTIONS.ANNOUNCEMENTS, PERMISSIONS.CREATE), createEventHandler);
router.put("/events/:eventId", requireSection(ADMIN_SECTIONS.ANNOUNCEMENTS, PERMISSIONS.UPDATE), updateEventHandler);
router.delete("/events/:eventId", requireSection(ADMIN_SECTIONS.ANNOUNCEMENTS, PERMISSIONS.DELETE), deleteEventHandler);

router.get("/media", requireSection(ADMIN_SECTIONS.MEDIA, PERMISSIONS.VIEW), getMedia);
router.post("/media", requireSection(ADMIN_SECTIONS.MEDIA, PERMISSIONS.CREATE), createMediaHandler);
router.put("/media/:mediaId", requireSection(ADMIN_SECTIONS.MEDIA, PERMISSIONS.UPDATE), updateMediaHandler);
router.delete("/media/:mediaId", requireSection(ADMIN_SECTIONS.MEDIA, PERMISSIONS.DELETE), deleteMediaHandler);
router.get("/media-categories", requireSection(ADMIN_SECTIONS.MEDIA, PERMISSIONS.VIEW), getMediaCategories);
router.post(
  "/media-categories",
  requireSection(ADMIN_SECTIONS.MEDIA, PERMISSIONS.CREATE),
  createMediaCategoryHandler
);
router.put(
  "/media-categories/:categoryId",
  requireSection(ADMIN_SECTIONS.MEDIA, PERMISSIONS.UPDATE),
  updateMediaCategoryHandler
);
router.delete(
  "/media-categories/:categoryId",
  requireSection(ADMIN_SECTIONS.MEDIA, PERMISSIONS.DELETE),
  deleteMediaCategoryHandler
);

router.get("/users", requireSection(ADMIN_SECTIONS.USERS, PERMISSIONS.VIEW), getUsers);
router.post("/users", requireSection(ADMIN_SECTIONS.USERS, PERMISSIONS.CREATE), createUserHandler);
router.put("/users/:userId", requireSection(ADMIN_SECTIONS.USERS, PERMISSIONS.UPDATE), updateUserHandler);
router.delete("/users/:userId", requireSection(ADMIN_SECTIONS.USERS, PERMISSIONS.DELETE), deleteUserHandler);

router.get("/roles", requireSection(ADMIN_SECTIONS.USERS, PERMISSIONS.VIEW), (_req, res) => {
  res.json({
    ok: true,
    data: {
      roles: Object.values(ROLES),
      permissions: ROLE_PERMISSIONS,
      sections: ROLE_SECTION_ACCESS
    }
  });
});

export default router;
