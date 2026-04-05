import type { Request, Response } from "express";
import { listActivities } from "../services/activityService.js";
import { listActiveAnnouncements } from "../models/announcementsModel.js";
import { DepartmentDbModel } from "../database/models/departmentDbModel.js";
import { LeaderDbModel } from "../database/models/leaderDbModel.js";
import { ReportDbModel } from "../database/models/reportDbModel.js";
import { MediaDbModel } from "../database/models/mediaDbModel.js";

export async function getDashboardStats(_req: Request, res: Response) {
  try {
    const [
      totalIdara,
      totalViongozi,
      totalReports,
      totalImages,
      totalVideos,
      activeAnnouncements,
      recentActivities
    ] = await Promise.all([
      DepartmentDbModel.countDocuments(),
      LeaderDbModel.countDocuments(),
      ReportDbModel.countDocuments(),
      MediaDbModel.countDocuments({ category: "image" }),
      MediaDbModel.countDocuments({ category: "video" }),
      listActiveAnnouncements(),
      listActivities(20)
    ]);

    const stats = {
      totalIdara,
      totalViongozi,
      activeMatangazo: activeAnnouncements.length,
      totalReports,
      totalImages,
      totalVideos
    };

    return res.json({
      ok: true,
      data: {
        stats,
        recentActivities
      }
    });
  } catch {
    return res.status(500).json({ ok: false, message: "Kuna hitilafu ya server." });
  }
}
