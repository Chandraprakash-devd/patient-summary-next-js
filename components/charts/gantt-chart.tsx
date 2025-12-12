"use client";

import { useEffect, useState, useRef } from "react";
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
	groupIndex?: number;
	totalInGroup?: number;
	x: number;
	y: number;
	width: number;
	height: number;
}

export function GanttChart({
	data,
	title,
	barColorLight = "#f4a462",
	barColorDark = "#e23670",
}: GanttChartProps) {
	const { theme } = useTheme();
	const [mounted, setMounted] = useState(false);
	const [tooltip, setTooltip] = useState<{
		visible: boolean;
		x: number;
		y: number;
		item: ProcessedGanttItem | null;
	}>({ visible: false, x: 0, y: 0, item: null });
	const svgRef = useRef<SVGSVGElement>(null);

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

	const isDark = theme === "dark";
	const barColor = isDark ? barColorDark : barColorLight;

	// Process data and calculate positions
	const processData = (): ProcessedGanttItem[] => {
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
				groupIndex: 0,
				totalInGroup: 1,
				x: 0,
				y: 0,
				width: 0,
				height: 0,
			}))
			.sort((a, b) => {
				if (a.startTime !== b.startTime) {
					return a.startTime - b.startTime;
				}
				return a.endTime - b.endTime;
			});

		// First, group items by identical timeframes (exact same start and end times)
		const timeframeGroups = new Map<string, ProcessedGanttItem[]>();
		items.forEach((item) => {
			const timeframeKey = `${item.startTime}-${item.endTime}`;
			if (!timeframeGroups.has(timeframeKey)) {
				timeframeGroups.set(timeframeKey, []);
			}
			timeframeGroups.get(timeframeKey)!.push(item);
		});

		// Assign tracks: each unique timeframe gets its own track, overlapping items share the same track
		const processedItems: ProcessedGanttItem[] = [];
		let currentTrack = 0;

		timeframeGroups.forEach((group) => {
			if (group.length === 1) {
				// Single item - gets its own track
				const item = group[0];
				item.track = currentTrack;
				item.groupIndex = 0;
				item.totalInGroup = 1;
				processedItems.push(item);
				currentTrack++;
			} else {
				// Multiple items with identical timeframe - they overlap on the same track
				group.forEach((item, index) => {
					item.track = currentTrack;
					item.groupIndex = index;
					item.totalInGroup = group.length;
					processedItems.push(item);
				});
				currentTrack++;
			}
		});

		return processedItems;
	};

	const processedData = processData();

	// Chart dimensions and calculations
	const chartWidth = 1200; // Increased width
	const margin = { top: 40, right: 40, bottom: 60, left: 40 };
	const plotWidth = chartWidth - margin.left - margin.right;

	// Calculate track positions first to determine height
	const uniqueTracks = [
		...new Set(processedData.map((item) => item.track)),
	].sort((a, b) => a - b);
	const trackHeight = 50; // Fixed track height for better readability
	const plotHeight = uniqueTracks.length * trackHeight;
	const chartHeight = plotHeight + margin.top + margin.bottom;

	// Find date range
	const minDate = new Date(Math.min(...processedData.map((d) => d.startTime)));
	const maxDate = new Date(Math.max(...processedData.map((d) => d.endTime)));
	const totalDays = differenceInDays(maxDate, minDate) || 1;

	// Track height is already calculated above

	// Calculate item positions
	processedData.forEach((item) => {
		const startOffset = differenceInDays(new Date(item.start), minDate);
		const duration = Math.max(
			differenceInDays(new Date(item.end), new Date(item.start)),
			1
		);

		item.startOffset = startOffset;
		item.duration = duration;
		item.displayDuration = duration;

		// Calculate SVG positions
		const baseX = margin.left + (startOffset / totalDays) * plotWidth;
		let baseWidth = Math.max((duration / totalDays) * plotWidth, 80); // Minimum width of 80px

		const trackIndex = uniqueTracks.indexOf(item.track);
		const baseY = margin.top + trackIndex * trackHeight;

		// For items in the same group, offset them horizontally (overlapping)
		if (
			item.totalInGroup &&
			item.totalInGroup > 1 &&
			item.groupIndex !== undefined
		) {
			// Calculate horizontal offset for overlapping effect with more spacing
			const overlapOffset = (baseWidth * 0.4) / (item.totalInGroup - 1); // 40% overlap for better separation
			item.x = baseX + item.groupIndex * overlapOffset;
			item.width = baseWidth;

			// Vary height slightly for overlapped items to create visual distinction
			const heightVariation = item.groupIndex * 2; // 2px variation per item
			item.y = baseY + trackHeight * 0.15 + heightVariation;
			item.height = trackHeight * 0.7 - heightVariation;
		} else {
			// Single item - no offset needed
			item.x = baseX;
			item.width = baseWidth;
			item.y = baseY + trackHeight * 0.15;
			item.height = trackHeight * 0.7;
		}
	});

	// Event handlers
	const handleMouseEnter = (
		event: React.MouseEvent,
		item: ProcessedGanttItem
	) => {
		const rect = svgRef.current?.getBoundingClientRect();
		if (rect) {
			setTooltip({
				visible: true,
				x: event.clientX - rect.left,
				y: event.clientY - rect.top,
				item,
			});
		}
	};

	const handleMouseLeave = () => {
		setTooltip({ visible: false, x: 0, y: 0, item: null });
	};

	// Generate time axis ticks
	const generateTimeTicks = () => {
		const ticks = [];
		const tickCount = 6;
		for (let i = 0; i <= tickCount; i++) {
			const ratio = i / tickCount;
			const x = margin.left + ratio * plotWidth;
			const date = new Date(
				minDate.getTime() + ratio * (maxDate.getTime() - minDate.getTime())
			);
			ticks.push({ x, date, label: format(date, "dd/MM/yy") });
		}
		return ticks;
	};

	const timeTicks = generateTimeTicks();

	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent className="p-4">
				<div className="relative w-full max-w-4xl overflow-x-auto und rounded-lg">
					<svg
						ref={svgRef}
						width={chartWidth}
						height={chartHeight}
						className="border rounded min-w-full"
						viewBox={`0 0 ${chartWidth} ${chartHeight}`}
						preserveAspectRatio="xMidYMid meet"
					>
						{/* Grid lines */}
						<defs>
							<pattern
								id="grid"
								width="40"
								height="20"
								patternUnits="userSpaceOnUse"
							>
								<path
									d="M 40 0 L 0 0 0 20"
									fill="none"
									stroke="currentColor"
									strokeWidth="0.5"
									opacity="0.1"
								/>
							</pattern>
						</defs>
						<rect
							x={margin.left}
							y={margin.top}
							width={plotWidth}
							height={plotHeight}
							fill="url(#grid)"
						/>

						{/* Time axis */}
						<g>
							{timeTicks.map((tick, index) => (
								<g key={index}>
									<line
										x1={tick.x}
										y1={margin.top}
										x2={tick.x}
										y2={chartHeight - margin.bottom}
										stroke="currentColor"
										strokeWidth="0.5"
										opacity="0.3"
									/>
									<text
										x={tick.x}
										y={chartHeight - margin.bottom + 15}
										textAnchor="middle"
										fontSize="11"
										fill="currentColor"
										opacity="0.7"
									>
										{tick.label}
									</text>
								</g>
							))}
						</g>

						{/* Gantt bars */}
						<g>
							{processedData.map((item, index) => {
								// Enhanced visual differentiation for overlapping items
								const isOverlapped = item.totalInGroup && item.totalInGroup > 1;
								const groupIndex = item.groupIndex || 0;

								// Same color for all items
								const itemColor = barColor;

								// Opacity and stroke for better distinction
								const opacity = isOverlapped ? 0.9 : 1;
								const strokeWidth = isOverlapped ? 1.5 : 0;
								const strokeColor = isOverlapped ? "white" : "none";

								return (
									<g key={index}>
										<rect
											x={item.x}
											y={item.y}
											width={item.width}
											height={item.height}
											fill={itemColor}
											fillOpacity={opacity}
											rx="6"
											ry="6"
											stroke={strokeColor}
											strokeWidth={strokeWidth}
											style={{ cursor: "pointer" }}
											onMouseEnter={(e) => handleMouseEnter(e, item)}
											onMouseLeave={handleMouseLeave}
										/>
										{/* Label - only show on first item of overlapped group to reduce confusion */}
										{item.width > 60 && (!isOverlapped || groupIndex === 0) && (
											<text
												x={item.x + item.width / 2}
												y={item.y + item.height / 2}
												textAnchor="middle"
												dominantBaseline="middle"
												fontSize="11"
												fill={isDark ? "white" : "black"}
												fontWeight="600"
											>
												{isOverlapped && (item.totalInGroup || 0) > 1
													? `${item.totalInGroup || 0} items`
													: item.task.length > Math.floor(item.width / 8)
													? item.task.substring(
															0,
															Math.floor(item.width / 8) - 3
													  ) + "..."
													: item.task}
											</text>
										)}
									</g>
								);
							})}
						</g>
					</svg>

					{/* Custom Tooltip */}
					{tooltip.visible && tooltip.item && (
						<div
							className="absolute bg-background border rounded-lg shadow-lg p-3 text-sm max-w-xs z-10 pointer-events-none"
							style={{
								left: tooltip.x + 10,
								top: tooltip.y - 10,
							}}
						>
							<p className="font-semibold mb-2">{tooltip.item.task}</p>
							<p className="text-muted-foreground">
								Start: {format(parseISO(tooltip.item.start), "dd MMM yyyy")}
							</p>
							<p className="text-muted-foreground">
								End: {format(parseISO(tooltip.item.end), "dd MMM yyyy")}
							</p>
							{tooltip.item.dosage && (
								<p className="text-muted-foreground mt-1">
									Dosage: {tooltip.item.dosage}
								</p>
							)}
							<p className="text-muted-foreground mt-1">
								Duration: {tooltip.item.duration} day
								{tooltip.item.duration !== 1 ? "s" : ""}
							</p>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
