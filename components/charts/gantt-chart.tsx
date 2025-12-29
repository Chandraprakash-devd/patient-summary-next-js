"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GanttData } from "@/types/patient";
import { useTheme } from "next-themes";
import { format, parseISO, differenceInDays, addDays } from "date-fns";
import {
	ScatterChart,
	Scatter,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";

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
	startDay: number;
	duration: number;
	x: number;
	y: number;
	overlapGroup?: number;
	overlapIndex?: number;
}

// Custom shape component for Gantt bars with horizontal overlap for identical dates
const GanttBar = (props: any) => {
	const { cx, cy, payload, xAxisMap, barColor } = props;

	if (!payload || cx === undefined || cy === undefined) return null;

	// Get chart scale information for proportional scaling
	const xAxis = xAxisMap && xAxisMap[Object.keys(xAxisMap)[0]];
	const chartWidth = xAxis ? xAxis.width : 800;
	const domain = xAxis ? xAxis.scale.domain() : [0, 100];
	const domainRange = domain[1] - domain[0];

	// Calculate proportional bar width with safety constraints
	const pixelsPerDay = chartWidth / domainRange;

	// Use conservative scaling to prevent cutoff
	// Calculate available space for bars (excluding margins)
	const availableWidth = chartWidth - 120; // Account for margins
	const maxAllowedBarWidth = availableWidth * 0.3; // Max 30% of available width

	let barWidth;
	if (payload.duration <= 7) {
		// Short durations: use minimum width for visibility
		barWidth = Math.max(40, payload.duration * pixelsPerDay * 0.6);
	} else if (payload.duration <= 30) {
		// Medium durations: proportional scaling
		barWidth = payload.duration * pixelsPerDay * 0.7;
	} else {
		// Long durations: more conservative scaling
		barWidth = payload.duration * pixelsPerDay * 0.6;
	}

	// Ensure bars never exceed chart boundaries
	const finalBarWidth = Math.max(Math.min(barWidth, maxAllowedBarWidth), 35);
	const barHeight = 26; // Increased height for better visibility

	// For items with identical dates, create horizontal offset and visual differentiation
	const hasOverlapGroup = payload.overlapGroup !== undefined;
	const isOverlapping = hasOverlapGroup && payload.overlapIndex > 0;
	const horizontalOffset = isOverlapping
		? payload.overlapIndex * finalBarWidth * 0.8
		: 0;

	// Position bar to start at cx (which represents start day) plus horizontal offset
	const x = cx + horizontalOffset;
	const y = cy - barHeight / 2;

	// Simple visual differentiation for overlapped bars - use theme-appropriate color
	const fillColor = barColor || "#f4a462"; // Use passed color or fallback
	const strokeColor = hasOverlapGroup ? "#ffffff" : "none";
	const strokeWidth = hasOverlapGroup ? 1.5 : 0;

	return (
		<g>
			<rect
				x={x}
				y={y}
				width={finalBarWidth}
				height={barHeight}
				fill={fillColor}
				rx={4}
				ry={4}
				stroke={strokeColor}
				strokeWidth={strokeWidth}
			/>
			{finalBarWidth > 20 && (
				<text
					x={x + finalBarWidth / 2}
					y={cy}
					textAnchor="middle"
					dominantBaseline="middle"
					fontSize={finalBarWidth < 50 ? "10" : "11"}
					fill="black"
					fontWeight="500"
				>
					{(() => {
						if (finalBarWidth < 50) {
							// For smaller bars: show first two letters + ".."
							return payload.task.length >= 2
								? payload.task.substring(0, 2) + ".."
								: payload.task;
						} else {
							// For larger bars: use dynamic truncation based on width
							const maxChars = Math.floor(finalBarWidth / 7);
							return payload.task.length > maxChars
								? payload.task.substring(0, maxChars - 2) + ".."
								: payload.task;
						}
					})()}
				</text>
			)}
		</g>
	);
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, barColor }: any) => {
	if (active && payload && payload.length) {
		const data = payload[0].payload;
		return (
			<div
				className="bg-background border rounded-lg shadow-lg p-1.5 text-xs max-w-xs"
				style={{
					borderLeft: `4px solid ${barColor}`,
				}}
			>
				<p className="font-semibold mb-0.5 text-xs">{data.task}</p>
				{data.dosage && (
					<p className="text-muted-foreground mt-0.5 text-xs font-bold">
						Dosage: <span className="">{data.dosage}</span>
					</p>
				)}
				<p className="text-muted-foreground text-xs">
					Start: {format(parseISO(data.start), "dd MMM yyyy")}
				</p>
				<p className="text-muted-foreground text-xs">
					End: {format(parseISO(data.end), "dd MMM yyyy")}
				</p>

				{/* <p className="text-muted-foreground mt-0.5 text-xs">
					Duration: {data.duration} day{data.duration !== 1 ? "s" : ""}
				</p> */}
			</div>
		);
	}
	return null;
};

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
					<div className="min-h-[200px] flex items-center justify-center">
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
					<div className="min-h-[200px] flex items-center justify-center">
						<p className="text-muted-foreground">No data available</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	// Process data for scatter plot with horizontal overlap for identical dates
	const processData = (): {
		processedItems: ProcessedGanttItem[];
		minDate: Date;
	} => {
		// Find the earliest date to use as reference point
		const minDate = new Date(
			Math.min(...data.map((d) => new Date(d.start).getTime()))
		);

		// Sort by start date first
		const sortedData = [...data].sort(
			(a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
		);

		// Process items and calculate basic properties
		const basicItems = sortedData.map((item, index) => {
			const startDate = new Date(item.start);
			const endDate = new Date(item.end);
			const startDay = differenceInDays(startDate, minDate);
			const duration = Math.max(differenceInDays(endDate, startDate), 1);

			return {
				task: item.task,
				start: item.start,
				end: item.end,
				dosage: item.dosage,
				track: index,
				startDay,
				duration,
				x: startDay,
				y: 0, // Will be calculated later
				originalIndex: index,
			};
		});

		// Normalize start days to begin at 0
		const earliestStart = Math.min(...basicItems.map((item) => item.startDay));
		const normalizedItems = basicItems.map((item) => ({
			...item,
			x: item.startDay - earliestStart,
			startDay: item.startDay - earliestStart,
		}));

		// Group items with identical start and end dates
		const processedItems: ProcessedGanttItem[] = [];
		const processedIndices = new Set<number>();
		let currentTrack = 0;

		// Function to check if two items have identical dates
		const itemsHaveIdenticalDates = (item1: any, item2: any) => {
			return item1.start === item2.start && item1.end === item2.end;
		};

		// Process items to handle identical date overlaps
		for (let i = 0; i < normalizedItems.length; i++) {
			if (processedIndices.has(i)) continue;

			const currentItem = normalizedItems[i];

			// Find all items with identical start and end dates
			const identicalItems = normalizedItems.filter(
				(item, index) =>
					index >= i &&
					!processedIndices.has(index) &&
					itemsHaveIdenticalDates(currentItem, item)
			);

			if (identicalItems.length > 1) {
				// Multiple items with identical dates - place them on same Y level with horizontal offset
				identicalItems.forEach((item, overlapIndex) => {
					processedItems.push({
						...item,
						y: currentTrack * 2, // Same Y level for all identical items
						overlapGroup: currentTrack,
						overlapIndex: overlapIndex,
					});
					processedIndices.add(item.originalIndex);
				});
			} else {
				// Single item - normal positioning
				processedItems.push({
					...currentItem,
					y: currentTrack * 2,
				});
				processedIndices.add(i);
			}

			currentTrack++;
		}

		return { processedItems, minDate };
	};

	const { processedItems: processedData, minDate } = processData();

	// Calculate chart dimensions
	const maxEndDay = Math.max(
		...processedData.map((d) => d.startDay + d.duration)
	);
	const trackCount = processedData.length;

	// Determine bar color based on theme
	const barColor = theme === "dark" ? barColorDark : barColorLight;

	// Calculate the maximum duration to ensure adequate padding
	const maxDuration = Math.max(...processedData.map((d) => d.duration));

	// Calculate padding to prevent bar cutoff
	// Need substantial padding to account for the longest possible bar width
	const domainPadding = Math.max(maxDuration * 0.8, 30);

	// Calculate dynamic height based on number of items
	// Each item needs space for the bar plus spacing (we use y = index * 2)
	// Better scaling for large datasets
	const baseHeight = 50; // Further reduced base height
	const itemHeight = 28; // Further reduced per item height
	const dynamicHeight = Math.max(baseHeight + trackCount * itemHeight, 180);

	return (
		<Card>
			<CardHeader className="pb-0 pt-2">
				<CardTitle className="text-base">{title}</CardTitle>
			</CardHeader>
			<CardContent className="p-0 pb-1">
				<div
					className="w-full relative"
					style={{ height: `${dynamicHeight}px` }}
				>
					{/* Fixed Y-axis line */}
					<div
						className="absolute left-[59.5px] w-px bg-current opacity-60 z-10"
						style={{
							top: "2px",
							height: `${dynamicHeight - 50}px`,
						}}
					/>
					<ResponsiveContainer width="100%" height="100%">
						<ScatterChart
							data={processedData}
							margin={{ top: 2, right: 60, bottom: 20, left: 60 }}
						>
							<CartesianGrid strokeDasharray="3 3" opacity={0.2} />
							<XAxis
								type="number"
								dataKey="x"
								domain={[0, maxEndDay + domainPadding]}
								tickFormatter={(value) => {
									const dayOffset = Math.round(value);
									const actualDate = addDays(minDate, dayOffset);
									return format(actualDate, "dd-MM-yyyy");
								}}
								tick={{ fontSize: 10 }}
							/>
							<YAxis
								type="number"
								dataKey="y"
								domain={[-0.5, (trackCount - 1) * 2 + 0.5]}
								hide={true}
							/>
							<Tooltip content={<CustomTooltip barColor={barColor} />} />
							<Scatter
								data={processedData}
								shape={<GanttBar barColor={barColor} />}
							/>
						</ScatterChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	);
}
