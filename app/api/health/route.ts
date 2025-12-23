import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "@/lib/db-utils";

// GET /api/health - Check API and database health
export async function GET() {
	try {
		const dbHealthy = await checkDatabaseConnection();

		const healthStatus = {
			status: dbHealthy ? "healthy" : "unhealthy",
			timestamp: new Date().toISOString(),
			database: dbHealthy ? "connected" : "disconnected",
			api: "running",
		};

		return NextResponse.json(healthStatus, {
			status: dbHealthy ? 200 : 503,
		});
	} catch (error) {
		console.error("Health check failed:", error);
		return NextResponse.json(
			{
				status: "unhealthy",
				timestamp: new Date().toISOString(),
				database: "error",
				api: "running",
				error: "Health check failed",
			},
			{ status: 503 }
		);
	}
}
