import { Router } from "express";
import { cacheGet } from "../middleware/cacheMiddleware.js";
import { getSettings } from "../controllers/siteSettingsController.js";
import {
  downloadAnnouncementPdf,
  getActiveAnnouncements,
  getPublicAnnouncements
} from "../controllers/announcementsController.js";
import { getPublicEvents } from "../controllers/eventsController.js";
import { getDepartments, getDepartmentDetail } from "../controllers/departmentsController.js";
import { getLeaders } from "../controllers/leadersController.js";
import { getGroups } from "../controllers/groupsController.js";
import { getReports } from "../controllers/reportsController.js";
import { getMedia } from "../controllers/mediaController.js";
import { getMediaCategories } from "../controllers/mediaCategoriesController.js";

const router = Router();

router.get("/site-settings", getSettings);
router.get("/announcements", cacheGet(), getPublicAnnouncements);
router.get("/announcements/active", cacheGet(), getActiveAnnouncements);
router.get("/announcements/:announcementId/pdf", downloadAnnouncementPdf);
router.get("/events", cacheGet(), getPublicEvents);
router.get("/departments", cacheGet(), getDepartments);
router.get("/departments/:departmentId", cacheGet(), getDepartmentDetail);
router.get("/leaders", cacheGet(), getLeaders);
router.get("/groups", cacheGet(), getGroups);
router.get("/reports", cacheGet(), getReports);
router.get("/media", cacheGet(), getMedia);
router.get("/media-categories", cacheGet(), getMediaCategories);

export default router;
