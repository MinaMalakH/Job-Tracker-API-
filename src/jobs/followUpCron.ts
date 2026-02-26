// Create daily cron job for follow-ups

import cron from "node-cron";
import { Application } from "../models/Application";
import { NotificationService } from "../services/notificationService";

const runDailyFollowUps = () => {
  cron.schedule("0 9 * * * ", async () => {
    // 9:00 AM every day
    console.log("Running daily follow-up check...");

    const today = new Date();
    const applications = await Application.find({
      status: { $in: ["applied", "screening"] },
      followUpSent: { $ne: true },
      appliedDate: {
        $lte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), // older than 7 days
      },
    });

    for (const app of applications) {
      await NotificationService.sendFollowUpReminder(app);
    }

    console.log(`Processed ${applications.length} follow-up reminders`);
  });
  console.log("Follow-up cron job scheduled (daily at 9:00 AM)");
};

export default runDailyFollowUps;
