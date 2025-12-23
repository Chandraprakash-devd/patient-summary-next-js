import { Pool } from "pg";

// Database configuration
const dbConfig = {
	user: process.env.DB_USER || "postgres",
	host: process.env.DB_HOST || "localhost",
	database: process.env.DB_NAME || "your_database",
	password: process.env.DB_PASSWORD || "password",
	port: parseInt(process.env.DB_PORT || "5432"),
	ssl:
		process.env.NODE_ENV === "production"
			? { rejectUnauthorized: false }
			: false,
};

// Create a connection pool
const pool = new Pool(dbConfig);

// Test connection
pool.on("connect", () => {
	console.log("Connected to PostgreSQL database");
});

pool.on("error", (err) => {
	console.error("Database connection error:", err);
});

export default pool;

// Helper function to execute queries
export const query = async (text: string, params?: any[]) => {
	const client = await pool.connect();
	try {
		const result = await client.query(text, params);
		return result;
	} catch (error) {
		console.error("Database query error:", error);
		throw error;
	} finally {
		client.release();
	}
};
