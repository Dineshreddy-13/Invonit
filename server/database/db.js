import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { DATABASE_URL } from "../config/env.js";
import * as schema from "./schemas/index.js";

const { Pool } = pg;
const pool = new Pool({ connectionString: DATABASE_URL });

export const db = drizzle(pool, { schema });

export const connectDB = async () => {
  try {
    await pool.query("SELECT 1");
    console.log('Database connected.');
  }catch(error) {
    console.error("Database connection failed: ", error);
    process.exit(1);
  }
};