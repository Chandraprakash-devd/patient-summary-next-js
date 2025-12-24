import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/patients - Get all patients list
export async function GET() {
	try {
		// Get all patients from visit_summary table with basic info
		const result = await query(`
			SELECT 
				vs.uid,
				vs.totalvisit,
				pcs.visit_count,
				pcs.first_visit,
				pcs.last_visit,
				pcs.mr_no
			FROM visit_summary vs
			LEFT JOIN patient_clinical_summaries pcs ON vs.uid = pcs.uid
			ORDER BY vs.uid
		`);

		return NextResponse.json({
			success: true,
			data: result.rows.map((row) => ({
				uid: row.uid,
				totalVisit: row.totalvisit,
				visitCount: row.visit_count,
				firstVisit: row.first_visit,
				lastVisit: row.last_visit,
				mrNo: row.mr_no,
			})),
		});
	} catch (error) {
		console.error("Error fetching patients:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to fetch patients" },
			{ status: 500 }
		);
	}
}
