import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/users - Get all users
export async function GET() {
	try {
		const result = await query("SELECT * FROM users");
		return NextResponse.json({
			success: true,
			data: result.rows,
		});
	} catch (error) {
		console.error("Error fetching users:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to fetch users" },
			{ status: 500 }
		);
	}
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { name, email } = body;

		if (!name || !email) {
			return NextResponse.json(
				{ success: false, error: "Name and email are required" },
				{ status: 400 }
			);
		}

		const result = await query(
			"INSERT INTO users (name, email, created_at) VALUES ($1, $2, NOW()) RETURNING *",
			[name, email]
		);

		return NextResponse.json(
			{
				success: true,
				data: result.rows[0],
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("Error creating user:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to create user" },
			{ status: 500 }
		);
	}
}
