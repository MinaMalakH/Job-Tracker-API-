import mongoose from "mongoose";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

/*********************MongoDB Connection*********************/
export const connectMongoDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URL;
    if (!mongoUri) {
      throw new Error("MONGO_URL is not defined in .env");
    }
    await mongoose.connect(mongoUri);
    // These options are commonly used (newer versions of Mongoose are more forgiving)
    // You can remove them later if you prefer defaults
    console.log(`✅ MongoDB connected successfully`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1); // Exit if Mongo fails (you can change this behavior later)
  }
};
/*********************PostgreSQL Connection*********************/

export const pgPool = new Pool({
  connectionString: process.env.POSTGRES_URI,
  // Optional: max: 20, idleTimeoutMillis: 30000, connectionTimeoutMillis: 2000
});

export const connectPostgreSQL = async (): Promise<void> => {
  try {
    const client = await pgPool.connect();
    console.log("✅ PostgreSQL connected successfully");
    client.release(); // Release the client back to the pool
  } catch (error) {
    console.error("❌ PostgreSQL connection error:", error);
    process.exit(1);
  }
};
