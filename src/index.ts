import dotenv from "dotenv";
dotenv.config();
import express, { Request, Response } from "express";
import { connectMongoDB, connectPostgreSQL } from "./config/database";
import authRoute from "../src/routes/authRoute";
import applicationsRoute from "./routes/applicationsRoute";
import { errorHandler } from "./middleware/errorHandler";
import resumeRoutes from "./routes/resumesRoute";
import aiRoutes from "./routes/aiRoute";

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

// Error Handling Middleware
app.use(errorHandler);

// Start server only after databases are connected
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
