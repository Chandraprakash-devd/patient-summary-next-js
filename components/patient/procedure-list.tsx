"use client";

import { ProcedureItem } from "@/types/patient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Syringe, Zap, Cookie } from "lucide-react";
import { getSvgForProcedure } from "@/lib/utils/data-processing";

interface ProcedureListProps {
	procedures: ProcedureItem[];
	compact?: boolean;
}

export function ProcedureList({
	procedures,
	compact = false,
}: ProcedureListProps) {
	if (procedures.length === 0) {
		return null;
	}

	if (compact) {
		return (
			<table className="w-full border-collapse border rounded text-sm">
				<thead>
					<tr>
						<th className="text-left font-semibold px-2 py-2 bg-muted/50 border-b">
							Type
						</th>
						<th className="text-left font-semibold px-2 py-2 bg-muted/50 border-b">
							Item
						</th>
					</tr>
				</thead>
				<tbody>
					{procedures.map((procedure, index) => {
						const { svg, color } = getSvgForProcedure(procedure.item);
						const Icon = svg === "injection" ? Syringe : Cookie;

						return (
							<tr key={index}>
								<td className="px-2 py-2.5 border-b last:border-b-0">
									<div className="flex items-center gap-1.5" style={{ color }}>
										<Icon className="h-4 w-4" />
										<span className="whitespace-nowrap">{procedure.type}</span>
									</div>
								</td>
								<td className="px-2 py-2.5 border-b last:border-b-0">
									{procedure.item}
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Procedures</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-2">
					{procedures.map((procedure, index) => {
						const { svg, color } = getSvgForProcedure(procedure.item);
						const Icon = svg === "injection" ? Syringe : Cookie;

						return (
							<div
								key={index}
								className="flex items-center gap-3 p-2 rounded-md bg-muted/50"
							>
								<div
									className="p-2 rounded-md"
									style={{ backgroundColor: `${color}20` }}
								>
									<Icon className="h-4 w-4" style={{ color }} />
								</div>
								<div className="flex-1">
									<p className="text-sm font-medium">{procedure.item}</p>
									<Badge variant="secondary" className="text-xs mt-1">
										{procedure.type}
									</Badge>
								</div>
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
