import { Schema, model, Document, Types } from "mongoose";

export interface INotification extends Document {
  userId: Types.ObjectId;
  applicationId?: Types.ObjectId;
  type: "follow_up" | "interview_prep" | "status_change";
  message: string;
  sentAt: Date;
  read: boolean;
}

const notificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  applicationId: { type: Schema.Types.ObjectId, ref: "Application" },
  type: {
    type: String,
    enum: ["follow_up", "interview_prep", "status_change"],
    required: true,
  },
  message: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
});

export const Notification = model<INotification>(
  "Notification",
  notificationSchema,
);
