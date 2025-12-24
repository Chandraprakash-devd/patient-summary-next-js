import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/patient/[uid] - Get patient data from database
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ uid: string }> }
) {
	try {
		const { uid } = await params;

		// Fetch visit summary data (contains JSON data for charts)
		const visitSummaryResult = await query(
			"SELECT uid, totalvisit, json_data, updated FROM visit_summary WHERE uid = $1",
			[uid]
		);

		// Fetch patient clinical summaries
		const clinicalSummaryResult = await query(
			"SELECT uid, visit_count, first_visit, last_visit, mr_no, re_summary, le_summary, be_summary, clinical_note, created_at FROM patient_clinical_summaries WHERE uid = $1",
			[uid]
		);

		if (visitSummaryResult.rows.length === 0) {
			return NextResponse.json(
				{ success: false, error: "Patient not found" },
				{ status: 404 }
			);
		}

		const visitSummary = visitSummaryResult.rows[0];
		const clinicalSummary = clinicalSummaryResult.rows[0] || null;

		return NextResponse.json({
			success: true,
			data: {
				uid: visitSummary.uid,
				totalVisit: visitSummary.totalvisit,
				jsonData: visitSummary.json_data,
				updated: visitSummary.updated,
				clinicalSummary: clinicalSummary
					? {
							uid: clinicalSummary.uid,
							visitCount: clinicalSummary.visit_count,
							firstVisit: clinicalSummary.first_visit,
							lastVisit: clinicalSummary.last_visit,
							mrNo: clinicalSummary.mr_no,
							reSummary: clinicalSummary.re_summary,
							leSummary: clinicalSummary.le_summary,
							beSummary: clinicalSummary.be_summary,
							clinicalNote: clinicalSummary.clinical_note,
							createdAt: clinicalSummary.created_at,
					  }
					: null,
			},
		});
	} catch (error) {
		console.error("Error fetching patient data:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to fetch patient data" },
			{ status: 500 }
		);
	}
}
