"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { getAllPatientUIDs } from "@/lib/services/patient-data.service";
import { useEffect, useState } from "react";

export default function Home() {
	const [patientUIDs, setPatientUIDs] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadPatients = async () => {
			try {
				const uids = await getAllPatientUIDs();
				setPatientUIDs(uids);
			} catch (error) {
				console.error("Failed to load patient UIDs:", error);
			} finally {
				setLoading(false);
			}
		};

		loadPatients();
	}, []);

	return (
		<div className="min-h-screen bg-background">
			<header className="border-b">
				<div className="container mx-auto px-4 py-4 flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold">Aravind Visual</h1>
						<p className="text-sm text-muted-foreground">
							Patient Data Visualization
						</p>
					</div>
					<ThemeToggle />
				</div>
			</header>

			<main className="container mx-auto px-4 py-8">
				<div className="mb-6">
					<h2 className="text-xl font-semibold mb-2">Patient List</h2>
					<p className="text-muted-foreground">
						Select a patient to view their medical records and visualizations
					</p>
					{!loading && (
						<Badge variant="secondary" className="mt-2">
							{patientUIDs.length} Patients
						</Badge>
					)}
				</div>

				{loading ? (
					<div className="flex items-center justify-center py-12">
						<p className="text-muted-foreground">Loading patients...</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
						{patientUIDs.map((uid) => (
							<Link key={uid} href={`/patient/${uid}`}>
								<Card className="hover:shadow-lg transition-shadow cursor-pointer">
									<CardHeader>
										<CardTitle className="text-lg">Patient {uid}</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-sm text-muted-foreground">UID: {uid}</p>
										<Badge variant="outline" className="mt-2">
											View Records
										</Badge>
									</CardContent>
								</Card>
							</Link>
						))}
					</div>
				)}
			</main>
		</div>
	);
}
