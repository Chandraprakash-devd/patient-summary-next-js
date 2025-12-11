"use client";

import { useEffect, useState } from "react";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Cell,
	LabelList,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GanttData } from "@/types/patient";
import { useTheme } from "next-themes";
import { format, parseISO, differenceInDays } from "date-fns";

interface GanttChartProps {
	data: GanttData[];
	title: string;
	barColorLight?: string;
	barColorDark?: string;
}

interface ProcessedGanttItem {
	task: string;
	start: string;
	end: string;
	dosage?: string;
	track: number;
	startTime: number;
	endTime: number;
	startOffset: number;
	duration: number;
	displayDuration: number;
	label: string;
}

export function GanttChart({
	data,
	title,
	barColorLight = "#f4a462",
	barColorDark = "#e23670",
}: GanttChartProps) {
	const { theme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{title}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="h-[300px] flex items-center justify-center">
						<p className="text-muted-foreground">Loading chart...</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (!data || data.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{title}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="h-[300px] flex items-center justify-center">
						<p className="text-muted-foreground">No data available</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	const isDark = theme === "dark";
	const barColor = isDark ? barColorDark : barColorLight;

	// Assign tracks to avoid overlaps
	const assignTracksToOverlappingItems = (
		data: GanttData[]
	): ProcessedGanttItem[] => {
		const items: ProcessedGanttItem[] = data
			.map((item) => ({
				task: item.task,
				start: item.start,
				end: item.end,
				dosage: item.dosage,
				track: 0,
				startTime: new Date(item.start).getTime(),
				endTime: new Date(item.end).getTime(),
				startOffset: 0,
				duration: 0,
				displayDuration: 0,
				label: "",
			}))
			.sort((a, b) => {
				if (a.startTime !== b.startTime) {
					return a.startTime - b.startTime;
				}
				return a.endTime - b.endTime;
			});

		const trackEndTimes: number[] = [];

		items.forEach((item) => {
			let assignedTrack = -1;

			for (let i = 0; i < trackEndTimes.length; i++) {
				if (trackEndTimes[i] <= item.startTime) {
					assignedTrack = i;
					break;
				}
			}

			if (assignedTrack === -1) {
				assignedTrack = trackEndTimes.length;
				trackEndTimes.push(item.endTime);
			} else {
				trackEndTimes[assignedTrack] = item.endTime;
			}

			item.track = assignedTrack;
		});

		return items;
	};

	const processedData = assignTracksToOverlappingItems(data);

	// Find the earliest date
	const minDate = new Date(Math.min(...processedData.map((d) => d.startTime)));

	const minDurationDays = 30;

	// Calculate offsets and durations
	processedData.forEach((item) => {
		const startOffset = differenceInDays(new Date(item.start), minDate);
		const actualDuration = differenceInDays(
			new Date(item.end),
			new Date(item.start)
		);
		const displayDuration = Math.max(actualDuration, minDurationDays);

		item.startOffset = startOffset;
		item.duration = actualDuration;
		item.displayDuration = displayDuration;
		item.label = `Track ${item.track}`;
	});

	// Custom tooltip
	const CustomTooltip = ({ active, payload }: any) => {
		if (!active || !payload || payload.length === 0) return null;

		const data = payload[0].payload;

		return (
			<div className="bg-background border rounded-lg shadow-lg p-3 text-sm max-w-xs">
				<p className="font-semibold mb-2">{data.task}</p>
				<p className="text-muted-foreground">
					Start: {format(parseISO(data.start), "dd MMM yyyy")}
				</p>
				<p className="text-muted-foreground">
					End: {format(parseISO(data.end), "dd MMM yyyy")}
				</p>
				{data.dosage && (
					<p className="text-muted-foreground mt-1">Dosage: {data.dosage}</p>
				)}
				<p className="text-muted-foreground mt-1">
					Duration: {data.duration} day{data.duration !== 1 ? "s" : ""}
				</p>
			</div>
		);
	};

	// Custom label renderer
	const renderCustomLabel = (props: any) => {
		const { x, y, width, height, index } = props;
		const item = processedData[index];

		// Only show label if bar is wide enough
		if (width < 40) {
			return (
				<text
					x={x + width / 2}
					y={y + height / 2}
					fill="currentColor"
					textAnchor="middle"
					dominantBaseline="middle"
					fontSize="11"
				>
					...
				</text>
			);
		}

		let label = item.task;
		const maxChars = Math.floor(width / 7); // Approximate characters that fit

		if (label.length > maxChars) {
			label = label.substring(0, maxChars - 3) + "...";
		}

		return (
			<text
				x={x + width / 2}
				y={y + height / 2}
				fill="currentColor"
				textAnchor="middle"
				dominantBaseline="middle"
				fontSize="11"
			>
				{label}
			</text>
		);
	};

	// Calculate chart height based on number of tracks
	const barHeight = 30;
	const padding = 150;
	const chartHeight = Math.max(300, processedData.length * barHeight + padding);

	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width="100%" height={chartHeight}>
					<BarChart
						data={processedData}
						layout="vertical"
						margin={{ top: 30, right: 10, left: 10, bottom: 20 }}
						barCategoryGap="15%"
					>
						<CartesianGrid strokeDasharray="5 5" opacity={0.3} />
						<XAxis
							type="number"
							tickFormatter={(value) => {
								const date = new Date(minDate);
								date.setDate(date.getDate() + value);
								return format(date, "dd/MM/yyyy");
							}}
							style={{ fontSize: "11px" }}
						/>
						<YAxis type="category" dataKey="label" hide />
						<Tooltip content={<CustomTooltip />} cursor={false} />
						{/* Invisible offset bar for positioning */}
						<Bar
							dataKey="startOffset"
							fill="transparent"
							stackId="stack"
							isAnimationActive={false}
						/>
						{/* Visible duration bar */}
						<Bar
							dataKey="displayDuration"
							fill={barColor}
							radius={6}
							stackId="stack"
							barSize={16}
						>
							{processedData.map((_, index) => (
								<Cell key={`cell-${index}`} fill={barColor} />
							))}
							<LabelList content={renderCustomLabel} />
						</Bar>
					</BarChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}
