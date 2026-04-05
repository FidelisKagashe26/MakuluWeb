import type { Request, Response } from "express";
import { getSiteSettings, updateSiteSettings } from "../models/siteSettingsModel.js";
import { addActivity } from "../services/activityService.js";
import { clearApiCache } from "../middleware/cacheMiddleware.js";

export async function getSettings(_req: Request, res: Response) {
  try {
    res.setHeader("Cache-Control", "no-store");
    const settings = await getSiteSettings();
    return res.json({ ok: true, data: settings });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}

export async function saveSettings(req: Request, res: Response) {
  try {
    res.setHeader("Cache-Control", "no-store");
    const updated = await updateSiteSettings(req.body || {});
    clearApiCache();

    addActivity({
      userId: req.auth?.id,
      userName: req.auth?.fullName,
      action: "UPDATE",
      entity: "SITE_SETTINGS",
      entityId: "site_settings",
      detail: "Updated site settings"
    });

    return res.json({ ok: true, message: "Settings saved successfully.", data: updated });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}
