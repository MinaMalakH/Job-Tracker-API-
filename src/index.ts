import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import { connectMongoDB, connectPostgreSQL } from "./config/database";
import authRoute from "../src/routes/authRoute";
import applicationsRoute from "./routes/applicationsRoute";
import { errorHandler } from "./middleware/errorHandler";
import resumeRoutes from "./routes/resumesRoute";
import aiRoutes from "./routes/aiRoute";
import notificationRoutes from "./routes/notificationsRoute";
import swaggerUi from "swagger-ui-express";
import { specs } from "./config/swagger";

import "./queues/aiProcessor";

export { app };
// Start cron job in index.ts
import runDailyFollowUps from "./jobs/followUpCron";
runDailyFollowUps(); // schedules the job

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Routers

app.get("/", (req: Request, res: Response) => {
  res.send("Job Tracker API - Authentication Ready");
});

app.use("/api/auth", authRoute);
app.use("/api/applications", applicationsRoute);
app.use("/api/resumes", resumeRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Error Handling Middleware
app.use(errorHandler);

// Start server only after databases are connected
if (process.env.NODE_ENV !== "test") {
  const startServer = async () => {
    try {
      await connectMongoDB();
      await connectPostgreSQL();

      app.listen(PORT, () => {
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
      });
    } catch (err) {
      console.error("Server startup failed:", err);
      process.exit(1);
    }
  };

  startServer();
}
