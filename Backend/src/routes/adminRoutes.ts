import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";
import { PERMISSIONS, ROLES } from "../utils/constants.js";
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
  requirePermission(PERMISSIONS.VIEW),
  getDashboardStats
);

router.get("/site-settings", requirePermission(PERMISSIONS.UPDATE), getSettings);
router.put("/site-settings", requirePermission(PERMISSIONS.UPDATE), saveSettings);
router.post(
  "/uploads/image",
  requirePermission(PERMISSIONS.UPDATE),
  uploadImage,
  compressUploadedImage,
  uploadImageHandler
);
router.post(
  "/uploads/document",
  requirePermission(PERMISSIONS.UPDATE),
  uploadDocument,
  uploadDocumentHandler
);

router.get("/departments", requirePermission(PERMISSIONS.VIEW), getDepartments);
router.get("/departments/:departmentId", requirePermission(PERMISSIONS.VIEW), getDepartmentDetail);
router.post("/departments", requirePermission(PERMISSIONS.CREATE), createDepartmentHandler);
router.put("/departments/:departmentId", requirePermission(PERMISSIONS.UPDATE), updateDepartmentHandler);
router.delete(
  "/departments/:departmentId",
  requirePermission(PERMISSIONS.DELETE),
  deleteDepartmentHandler
);

router.post(
  "/departments/:departmentId/committee",
  requirePermission(PERMISSIONS.CREATE),
  createCommitteeMemberHandler
);
router.put(
  "/departments/:departmentId/committee/:memberId",
  requirePermission(PERMISSIONS.UPDATE),
  updateCommitteeMemberHandler
);
router.delete(
  "/departments/:departmentId/committee/:memberId",
  requirePermission(PERMISSIONS.DELETE),
  deleteCommitteeMemberHandler
);

router.post(
  "/departments/:departmentId/reports",
  requirePermission(PERMISSIONS.CREATE),
  createDepartmentReportHandler
);
router.put(
  "/departments/:departmentId/reports/:reportId",
  requirePermission(PERMISSIONS.UPDATE),
  updateDepartmentReportHandler
);
router.delete(
  "/departments/:departmentId/reports/:reportId",
  requirePermission(PERMISSIONS.DELETE),
  deleteDepartmentReportHandler
);

router.get("/leaders", requirePermission(PERMISSIONS.VIEW), getLeaders);
router.post("/leaders", requirePermission(PERMISSIONS.CREATE), createLeaderHandler);
router.put("/leaders/:leaderId", requirePermission(PERMISSIONS.UPDATE), updateLeaderHandler);
router.delete("/leaders/:leaderId", requirePermission(PERMISSIONS.DELETE), deleteLeaderHandler);

router.get("/groups", requirePermission(PERMISSIONS.VIEW), getGroups);
router.post("/groups", requirePermission(PERMISSIONS.CREATE), createGroupHandler);
router.put("/groups/:groupId", requirePermission(PERMISSIONS.UPDATE), updateGroupHandler);
router.delete("/groups/:groupId", requirePermission(PERMISSIONS.DELETE), deleteGroupHandler);

router.get("/reports", requirePermission(PERMISSIONS.VIEW), getReports);
router.post(
  "/reports",
  requirePermission(PERMISSIONS.CREATE),
  uploadReportFiles,
  createReportHandler
);
router.put(
  "/reports/:reportId",
  requirePermission(PERMISSIONS.UPDATE),
  uploadReportFiles,
  updateReportHandler
);
router.delete("/reports/:reportId", requirePermission(PERMISSIONS.DELETE), deleteReportHandler);
router.get(
  "/reports/:reportId/attachments/:attachmentId/download",
  requirePermission(PERMISSIONS.VIEW),
  downloadReportAttachment
);

router.get("/announcements", requirePermission(PERMISSIONS.VIEW), getAnnouncements);
router.post(
  "/announcements",
  requirePermission(PERMISSIONS.PUBLISH),
  createAnnouncementHandler
);
router.put(
  "/announcements/:announcementId",
  requirePermission(PERMISSIONS.PUBLISH),
  updateAnnouncementHandler
);
router.delete(
  "/announcements/:announcementId",
  requirePermission(PERMISSIONS.DELETE),
  deleteAnnouncementHandler
);

router.get("/media", requirePermission(PERMISSIONS.VIEW), getMedia);
router.post("/media", requirePermission(PERMISSIONS.CREATE), createMediaHandler);
router.put("/media/:mediaId", requirePermission(PERMISSIONS.UPDATE), updateMediaHandler);
router.delete("/media/:mediaId", requirePermission(PERMISSIONS.DELETE), deleteMediaHandler);
router.get("/media-categories", requirePermission(PERMISSIONS.VIEW), getMediaCategories);
router.post(
  "/media-categories",
  requirePermission(PERMISSIONS.CREATE),
  createMediaCategoryHandler
);
router.put(
  "/media-categories/:categoryId",
  requirePermission(PERMISSIONS.UPDATE),
  updateMediaCategoryHandler
);
router.delete(
  "/media-categories/:categoryId",
  requirePermission(PERMISSIONS.DELETE),
  deleteMediaCategoryHandler
);

router.get("/users", requirePermission(PERMISSIONS.VIEW), getUsers);
router.post("/users", requirePermission(PERMISSIONS.CREATE), createUserHandler);
router.put("/users/:userId", requirePermission(PERMISSIONS.UPDATE), updateUserHandler);
router.delete("/users/:userId", requirePermission(PERMISSIONS.DELETE), deleteUserHandler);

router.get("/roles", (_req, res) => {
  res.json({
    ok: true,
    data: Object.values(ROLES)
  });
});

export default router;
