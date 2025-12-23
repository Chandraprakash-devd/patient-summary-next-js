import pool, { query } from "./db";

// Database utility functions

// Check if database connection is healthy
export async function checkDatabaseConnection(): Promise<boolean> {
	try {
		await query("SELECT 1");
		return true;
	} catch (error) {
		console.error("Database connection check failed:", error);
		return false;
	}
}

// Get database statistics
export async function getDatabaseStats() {
	try {
		const result = await query(`
      SELECT 
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation
      FROM pg_stats 
      WHERE schemaname = 'public'
      LIMIT 10
    `);
		return result.rows;
	} catch (error) {
		console.error("Error getting database stats:", error);
		throw error;
	}
}

// Execute multiple queries in a transaction
export async function executeTransaction(
	queries: Array<{ text: string; params?: any[] }>
) {
	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		const results = [];
		for (const queryObj of queries) {
			const result = await client.query(queryObj.text, queryObj.params);
			results.push(result);
		}

		await client.query("COMMIT");
		return results;
	} catch (error) {
		await client.query("ROLLBACK");
		console.error("Transaction failed:", error);
		throw error;
	} finally {
		client.release();
	}
}

// Gracefully close database connections
export async function closeDatabaseConnections() {
	try {
		await pool.end();
		console.log("Database connections closed");
	} catch (error) {
		console.error("Error closing database connections:", error);
	}
}
