import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/users/[id] - Get a specific user
export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { id } = params;
		const result = await query("SELECT * FROM patients WHERE patientid = $1", [
			id,
		]);

		if (result.rows.length === 0) {
			return NextResponse.json(
				{ success: false, error: "User not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			data: result.rows[0],
		});
	} catch (error) {
		console.error("Error fetching user:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to fetch user" },
			{ status: 500 }
		);
	}
}

// PUT /api/users/[id] - Update a user
export async function PUT(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { id } = params;
		const body = await request.json();
		const { name, email } = body;

		if (!name || !email) {
			return NextResponse.json(
				{ success: false, error: "Name and email are required" },
				{ status: 400 }
			);
		}

		const result = await query(
			"UPDATE users SET name = $1, email = $2, updated_at = NOW() WHERE id = $3 RETURNING *",
			[name, email, id]
		);

		if (result.rows.length === 0) {
			return NextResponse.json(
				{ success: false, error: "User not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			data: result.rows[0],
		});
	} catch (error) {
		console.error("Error updating user:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to update user" },
			{ status: 500 }
		);
	}
}

// DELETE /api/users/[id] - Delete a user
export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const { id } = params;
		const result = await query("DELETE FROM users WHERE id = $1 RETURNING *", [
			id,
		]);

		if (result.rows.length === 0) {
			return NextResponse.json(
				{ success: false, error: "User not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			message: "User deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting user:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to delete user" },
			{ status: 500 }
		);
	}
}
