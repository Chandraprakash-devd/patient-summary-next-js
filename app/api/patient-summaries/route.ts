import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/patient-summaries - Get all patient summaries
export async function GET() {
	try {
		const result = await query(`
			SELECT uid, re_summary, le_summary, be_summary 
			FROM patient_clinical_summaries 
			ORDER BY uid
		`);

		// Transform to match the expected format
		const summaries: Record<string, { re: string; le: string; be: string }> =
			{};

		result.rows.forEach((row) => {
			summaries[row.uid] = {
				re: row.re_summary || "",
				le: row.le_summary || "",
				be: row.be_summary || "",
			};
		});

		return NextResponse.json({
			success: true,
			data: summaries,
		});
	} catch (error) {
		console.error("Error fetching patient summaries:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to fetch patient summaries" },
			{ status: 500 }
		);
	}
}
