import { pgPool } from "../config/database";

async function createStatsTable() {
  const client = await pgPool.connect();
  try {
    await client.query(`
            CREATE TABLE IF NOT EXISTS application_stats(
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(50) NOT NULL,
                month DATE NOT NULL,                -- e.g. '2026-02-01'
                total_applications INT DEFAULT 0,
                applied_count INT DEFAULT 0,
                screening_count INT DEFAULT 0,
                interview_count INT DEFAULT 0,
                offer_count INT DEFAULT 0,
                rejected_count INT DEFAULT 0,
                avg_response_days DECIMAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id,month)
            )`);

    console.log("Application_stats table created or already exists");
  } catch (error) {
    console.error("Error creating table:", error);
  } finally {
    client.release();
    process.exit(0);
  }
}

createStatsTable();
