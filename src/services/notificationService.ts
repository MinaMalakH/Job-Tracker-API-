import transporter from "../config/nodemailer";
import { Notification } from "../models/Notification";
import { Application } from "../models/Application";
import { User } from "../models/User";

export class NotificationService {
  static async sendFollowUpReminder(application: any) {
    const user = await User.findById(application.userId);
    if (!user || !user.email) return;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Follow-up Reminder: ${application.position} at ${application.company}`,
      text: `Hi ${user.name || "there"},\n\nIt's been over a week since you applied to ${application.position} at ${application.company}. No response yet — consider sending a polite follow-up email!\n\nApplication link: ${application.jobUrl || "N/A"}\n\nBest,\nJobTracker`,
      html: `<p>Hi ${user.name || "there"},</p>
             <p>It's been over a week since you applied to <strong>${application.position}</strong> at <strong>${application.company}</strong>. No response yet — consider sending a polite follow-up!</p>
             <p><a href="${application.jobUrl || "#"}">View application</a></p>
             <p>Best,<br>JobTracker</p>`,
    };

    try {
      await transporter.sendMail(mailOptions);
      // Save notification in DB
      await Notification.create({
        userId: application.userId,
        applicationId: application._id,
        type: "follow_up",
        message: `Follow-up reminder sent for ${application.position} at ${application.company}`,
      });

      // Mark as sent (add field if needed)
      await Application.findByIdAndUpdate(application._id, {
        $set: { followUpSent: true, followUpDate: new Date() },
      });
    } catch (err) {
      console.error("Failed to send email:", err);
    }
  }

  static async getUserNotifications(userId: string) {
    return Notification.find({ userId }).sort({ sentAt: -1 }).lean();
  }
}
