import { pgPool } from "../config/database";
import { Application } from "../models/Application";
import { Types } from "mongoose";

export class AnalyticService {
  static async updateMonthlyStats(userId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const apps = await Application.find({
      userId: new Types.ObjectId(userId),
      appliedDate: { $gte: monthStart },
    }).lean();

    if (apps.length === 0) return;

    const stats = {
      total_applications: apps.length,
      applied_count: apps.filter((a) => a.status === "applied").length,
      screening_count: apps.filter((a) => a.status === "screening").length,
      interview_count: apps.filter((a) => a.status === "interview").length,
      offer_count: apps.filter((a) => a.status === "offer").length,
      rejected_count: apps.filter((a) => a.status === "offer").length,
      avg_response_days: 0,
    };

    // Simple avg response time (days from apply to last update if not applied)
    const responded = apps.filter((a) => a.status !== "applied");
    if (responded.length > 0) {
      const totalDays = responded.reduce((sum, app) => {
        const days =
          (app.lastUpdated.getTime() - app.appliedDate.getTime()) /
          (1000 * 3600 * 24);
        return sum + days;
      }, 0);
      stats.avg_response_days = totalDays / responded.length;
    }
    // Upsert to postgreSQL

    await pgPool.query(
      `
        INSERT INTO application_stats(
            user_id,month,total_applications,applied_count,screening_count,
            interview_count,offer_count,rejected_count,avg_response_days
        )
            VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
            ON CONFLICT (user_id,month)
            DO UPDATE SET
        total_applications = EXCLUDED.total_applications,
        applied_count = EXCLUDED.applied_count,
        screening_count = EXCLUDED.screening_count,
        interview_count = EXCLUDED.interview_count,
        offer_count = EXCLUDED.offer_count,
        rejected_count = EXCLUDED.rejected_count,
        avg_response_days = EXCLUDED.avg_response_days
    `,
      [
        userId,
        monthStart,
        stats.total_applications,
        stats.applied_count,
        stats.screening_count,
        stats.interview_count,
        stats.offer_count,
        stats.rejected_count,
        stats.avg_response_days,
      ],
    );
  }

  static async getUserStats(userId: string) {
    const result = await pgPool.query(
      "SELECT * FROM application_stats WHERE user_id = $1 ORDER BY month DESC ",
      [userId],
    );
    return result.rows;
  }
}
