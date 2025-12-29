"use client";

import { useEffect, useState } from "react";
import {
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	ComposedChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartData, MetricConfig, ProcedureData } from "@/types/patient";
import { useTheme } from "next-themes";
import { format, parseISO } from "date-fns";
import { Syringe, Zap, Cookie, Scissors, Flashlight } from "lucide-react";

interface PositionedProcedure extends ProcedureData {
	position: number;
	offsetIndex: number;
}

interface LineChartProps {
	data: ChartData;
	metrics: MetricConfig[];
	showVA?: boolean;
	showIOP?: boolean;
	showCMT?: boolean;
	showProcedures?: boolean;
}

export function LineChart({
	data,
	metrics,
	showVA = true,
	showIOP = true,
	showCMT = true,
	showProcedures = true,
}: LineChartProps) {
	const { theme } = useTheme();
	const [mounted, setMounted] = useState(false);
	const [positionedProcedures, setPositionedProcedures] = useState<
		PositionedProcedure[]
	>([]);
	const [tooltipData, setTooltipData] = useState<{
		visible: boolean;
		x: number;
		y: number;
		procedure: ProcedureData | null;
	}>({ visible: false, x: 0, y: 0, procedure: null });

	useEffect(() => {
		setMounted(true);
	}, []);

	// Calculate procedure positions
	useEffect(() => {
		if (!data.procedures.length) return;

		const allDates = [
			...data.visualAcuityData.map((d) => new Date(d.x)),
			...data.iopData.map((d) => new Date(d.x)),
			...data.cmtData.map((d) => new Date(d.x)),
			...data.procedures.map((p) => new Date(p.date)),
		].filter((d) => !isNaN(d.getTime()));

		if (!allDates.length) return;

		const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
		const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));
		const timeRange = maxDate.getTime() - minDate.getTime();

		const getProcedurePosition = (dateStr: string): number => {
			const date = new Date(dateStr);
			const datePosition = date.getTime() - minDate.getTime();
			return (datePosition / timeRange) * 100;
		};

		const procedures = data.procedures.map((proc) => ({
			...proc,
			position: getProcedurePosition(proc.date),
			offsetIndex: 0,
		}));

		procedures.sort((a, b) => a.position - b.position);

		const OVERLAP_THRESHOLD = 1.2;

		for (let i = 0; i < procedures.length; i++) {
			const currentProc = procedures[i];
			let maxOffsetInRange = 0;

			for (let j = 0; j < i; j++) {
				const prevProc = procedures[j];
				const distance = Math.abs(currentProc.position - prevProc.position);

				if (distance < OVERLAP_THRESHOLD) {
					maxOffsetInRange = Math.max(
						maxOffsetInRange,
						prevProc.offsetIndex + 1
					);
				}
			}

			currentProc.offsetIndex = maxOffsetInRange;
		}

		setPositionedProcedures(procedures);
	}, [data]);

	if (!mounted) {
		return (
			<Card className="overflow-visible">
				<CardContent>
					<div className="h-[400px] flex items-center justify-center">
						<p className="text-muted-foreground">Loading chart...</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	const isDark = theme === "dark";

	// Calculate dynamic IOP range
	const iopValues = data.iopData.map((d) => d.y).filter((v) => v != null);
	const iopMin = iopValues.length ? Math.min(...iopValues) : 0;
	const iopMax = iopValues.length ? Math.max(...iopValues) : 40;

	// Count active metrics
	const activeMetrics = [showVA, showIOP, showCMT].filter(Boolean).length;

	// Normalize functions to map metrics to their respective sections
	const normalizeVA = (value: number) => {
		const range = 1.5 - -2;
		const normalized = (value - -2) / range;
		const sectionHeight = 100 / activeMetrics;
		const sectionIndex = [showVA, showIOP, showCMT].filter(
			(v, i) => v && i < 0
		).length;
		const startY = 100 - (sectionIndex + 1) * sectionHeight;
		return startY + normalized * sectionHeight;
	};

	const normalizeIOP = (value: number) => {
		const min = Math.min(0, Math.floor(iopMin / 5) * 5);
		const max = Math.max(40, Math.ceil(iopMax / 5) * 5);
		const range = max - min;
		const normalized = (value - min) / range;
		const sectionHeight = 100 / activeMetrics;
		const sectionIndex = [showVA, showIOP, showCMT].filter(
			(v, i) => v && i < 1
		).length;
		const startY = 100 - (sectionIndex + 1) * sectionHeight;
		return startY + normalized * sectionHeight;
	};

	const normalizeCMT = (value: number) => {
		const range = 1000 - 0;
		const normalized = (value - 0) / range;
		const sectionHeight = 100 / activeMetrics;
		const sectionIndex = [showVA, showIOP, showCMT].filter(
			(v, i) => v && i < 2
		).length;
		const startY = 100 - (sectionIndex + 1) * sectionHeight;
		return startY + normalized * sectionHeight;
	};

	// Combine all data points by date
	const combinedData = new Map<string, any>();

	// Add VA data
	if (showVA) {
		data.visualAcuityData.forEach((point) => {
			if (!combinedData.has(point.x)) {
				combinedData.set(point.x, { date: point.x });
			}
			const entry = combinedData.get(point.x)!;
			entry.va = point.yNumeric;
			entry.vaNormalized = normalizeVA(point.yNumeric);
			entry.vaLabel = point.y;
			entry.nv = point.nv;
		});
	}

	// Add IOP data
	if (showIOP) {
		data.iopData.forEach((point) => {
			if (!combinedData.has(point.x)) {
				combinedData.set(point.x, { date: point.x });
			}
			const entry = combinedData.get(point.x)!;
			entry.iop = point.y;
			entry.iopNormalized = normalizeIOP(point.y);
		});
	}

	// Add CMT data
	if (showCMT) {
		data.cmtData.forEach((point) => {
			if (!combinedData.has(point.x)) {
				combinedData.set(point.x, { date: point.x });
			}
			const entry = combinedData.get(point.x)!;
			entry.cmt = point.y;
			entry.cmtNormalized = normalizeCMT(point.y);
		});
	}

	const chartData = Array.from(combinedData.values()).sort((a, b) =>
		a.date.localeCompare(b.date)
	);

	// Custom tooltip
	const CustomTooltip = ({ active, payload }: any) => {
		if (!active || !payload || payload.length === 0) return null;

		const data = payload[0].payload;

		return (
			<div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
				<p className="font-semibold mb-2">
					{format(parseISO(data.date), "dd MMM yyyy")}
				</p>
				{data.vaLabel && (
					<div className="flex items-center gap-2 mb-1">
						<div
							className="w-3 h-3 rounded-full"
							style={{
								backgroundColor: isDark
									? metrics[0].colorDark
									: metrics[0].colorLight,
							}}
						/>
						<span>VA: {data.vaLabel}</span>
						{data.nv && (
							<span className="text-muted-foreground">({data.nv})</span>
						)}
					</div>
				)}
				{data.iop !== undefined && (
					<div className="flex items-center gap-2 mb-1">
						<div
							className="w-3 h-3 rounded-full"
							style={{
								backgroundColor: isDark
									? metrics[1].colorDark
									: metrics[1].colorLight,
							}}
						/>
						<span>IOP: {data.iop} mmHg</span>
					</div>
				)}
				{data.cmt !== undefined && (
					<div className="flex items-center gap-2">
						<div
							className="w-3 h-3 rounded-full"
							style={{
								backgroundColor: isDark
									? metrics[2].colorDark
									: metrics[2].colorLight,
							}}
						/>
						<span>CMT: {data.cmt} µm</span>
					</div>
				)}
			</div>
		);
	};

	// Check if at least one metric is enabled
	const hasAnyMetric = showVA || showIOP || showCMT;

	if (chartData.length === 0 && positionedProcedures.length === 0) {
		return (
			<Card className="overflow-visible">
				<CardContent>
					<div className="h-[400px] flex items-center justify-center">
						<p className="text-muted-foreground">No data available</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	if (!hasAnyMetric) {
		return (
			<Card className="overflow-visible">
				<CardContent>
					<div className="h-[400px] flex items-center justify-center">
						<p className="text-muted-foreground">
							Please enable at least one metric (VA, IOP, or CMT) to view the
							chart
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	// Calculate IOP ticks for custom labels
	const iopMinScale = Math.min(0, Math.floor(iopMin / 5) * 5);
	const iopMaxScale = Math.max(40, Math.ceil(iopMax / 5) * 5);
	const iopRange = iopMaxScale - iopMinScale;
	const iopStep = iopRange > 30 ? 10 : 5;
	const iopTicks = [];
	for (let i = iopMaxScale; i >= iopMinScale; i -= iopStep) {
		iopTicks.push(i);
	}

	const handleProcedureMouseEnter = (
		e: React.MouseEvent<HTMLDivElement>,
		procedure: ProcedureData
	) => {
		const target = e.currentTarget;
		const rect = target.getBoundingClientRect();
		const containerRect = target
			.closest(".procedures-overlay")
			?.getBoundingClientRect();

		if (!containerRect) return;

		setTooltipData({
			visible: true,
			x: rect.left - containerRect.left + rect.width / 2,
			y: rect.top - containerRect.top - 10,
			procedure,
		});
	};

	const handleProcedureMouseLeave = () => {
		setTooltipData({ visible: false, x: 0, y: 0, procedure: null });
	};

	// Calculate section height percentage for each metric
	const sectionHeight = 100 / activeMetrics;

	return (
		<Card className="overflow-visible">
			<CardContent className="overflow-visible">
				<div className="relative">
					{/* Procedures Overlay */}
					{showProcedures && positionedProcedures.length > 0 && (
						<div className="procedures-overlay absolute top-0 left-[60px] right-5 h-[30px] z-10">
							{positionedProcedures.map((procedure, idx) => {
								const Icon =
									procedure.type === "injection"
										? Syringe
										: procedure.type === "laser"
										? Cookie
										: procedure.type === "surgery"
										? Cookie
										: Flashlight;
								return (
									<div
										key={idx}
										className="absolute top-0 cursor-pointer transition-transform hover:scale-110"
										style={{
											left: `calc(${procedure.position}% + ${
												procedure.offsetIndex * 0.4
											}%)`,
											transform: "translateX(-50%)",
										}}
										onMouseEnter={(e) =>
											handleProcedureMouseEnter(e, procedure)
										}
										onMouseLeave={handleProcedureMouseLeave}
									>
										<Icon
											className="w-4 h-4"
											style={{ color: procedure.color }}
										/>
									</div>
								);
							})}

							{/* Tooltip */}
							{tooltipData.visible && tooltipData.procedure && (
								<div
									className="absolute pointer-events-none z-50 animate-in fade-in-0 zoom-in-95 duration-200"
									style={{
										left: `${tooltipData.x}px`,
										top: `${tooltipData.y}px`,
										transform: "translateX(-30%) translateY(80%)",
									}}
								>
									<div className="bg-background border rounded-lg shadow-lg p-3 text-sm whitespace-nowrap">
										<div className="font-semibold mb-1">
											{tooltipData.procedure.name}
										</div>
										<div className="text-muted-foreground text-xs">
											{format(
												parseISO(tooltipData.procedure.date),
												"MMM d, yyyy"
											)}
										</div>
										{tooltipData.procedure.count &&
											tooltipData.procedure.count > 1 && (
												<div className="text-muted-foreground text-xs mt-1 italic">
													Occurred {tooltipData.procedure.count} times
												</div>
											)}
									</div>
								</div>
							)}
						</div>
					)}

					<div className="pt-[45px]">
						<ResponsiveContainer width="100%" height={400}>
							<ComposedChart
								data={chartData}
								margin={{ top: 20, right: 20, bottom: 20, left: 60 }}
							>
								<CartesianGrid strokeDasharray="3 3" opacity={0.3} />
								<XAxis
									dataKey="date"
									tickFormatter={(date) => format(parseISO(date), "MMM yy")}
									style={{ fontSize: "12px" }}
								/>

								{/* Single Y-Axis on left only */}
								<YAxis yAxisId="unified" domain={[0, 100]} hide />

								<Tooltip content={<CustomTooltip />} cursor={false} />

								{/* Lines */}
								{showVA && (
									<Line
										yAxisId="unified"
										type="monotone"
										dataKey="vaNormalized"
										stroke={
											isDark ? metrics[0].colorDark : metrics[0].colorLight
										}
										strokeWidth={2}
										dot={{ r: 4 }}
										connectNulls
									/>
								)}

								{showIOP && (
									<Line
										yAxisId="unified"
										type="monotone"
										dataKey="iopNormalized"
										stroke={
											isDark ? metrics[1].colorDark : metrics[1].colorLight
										}
										strokeWidth={2}
										dot={{ r: 4 }}
										connectNulls
									/>
								)}

								{showCMT && (
									<Line
										yAxisId="unified"
										type="monotone"
										dataKey="cmtNormalized"
										stroke={
											isDark ? metrics[2].colorDark : metrics[2].colorLight
										}
										strokeWidth={2}
										dot={{ r: 4 }}
										connectNulls
									/>
								)}
							</ComposedChart>
						</ResponsiveContainer>
					</div>

					<div className="absolute left-0 top-20 bottom-5 w-14 flex flex-col text-[11px] pointer-events-none">
						{showVA && (
							<div
								className="flex flex-col justify-between"
								style={{
									height: `${sectionHeight}%`,
									color: isDark ? metrics[0].colorDark : metrics[0].colorLight,
								}}
							>
								<div className="text-right pr-2">6/6</div>
								<div className="text-right pr-2">6/18</div>
								<div className="text-right pr-2">6/60</div>
								<div className="text-right pr-2">CF</div>
								<div className="text-right pr-2">HM</div>
								<div className="text-right pr-2">PL</div>
							</div>
						)}
						{showIOP && (
							<div
								className="flex flex-col justify-between"
								style={{
									height: `${sectionHeight}%`,
									color: isDark ? metrics[1].colorDark : metrics[1].colorLight,
								}}
							>
								{iopTicks.map((tick) => (
									<div key={tick} className="text-right pr-2">
										{tick}
									</div>
								))}
							</div>
						)}
						{showCMT && (
							<div
								className="flex flex-col justify-between"
								style={{
									height: `${sectionHeight}%`,
									color: isDark ? metrics[2].colorDark : metrics[2].colorLight,
								}}
							>
								<div className="text-right pr-2">1000</div>
								<div className="text-right pr-2">750</div>
								<div className="text-right pr-2">500</div>
								<div className="text-right pr-2">250</div>
								<div className="text-right pr-2">0</div>
							</div>
						)}
					</div>
				</div>

				{/* Legend */}
				<div className="flex flex-wrap gap-4 mt-4 justify-center">
					{showVA && (
						<div className="flex items-center gap-2">
							<div
								className="w-3 h-3 rounded-full"
								style={{
									backgroundColor: isDark
										? metrics[0].colorDark
										: metrics[0].colorLight,
								}}
							/>
							<span className="text-sm">Visual Acuity</span>
						</div>
					)}
					{showIOP && (
						<div className="flex items-center gap-2">
							<div
								className="w-3 h-3 rounded-full"
								style={{
									backgroundColor: isDark
										? metrics[1].colorDark
										: metrics[1].colorLight,
								}}
							/>
							<span className="text-sm">IOP (mmHg)</span>
						</div>
					)}
					{showCMT && (
						<div className="flex items-center gap-2">
							<div
								className="w-3 h-3 rounded-full"
								style={{
									backgroundColor: isDark
										? metrics[2].colorDark
										: metrics[2].colorLight,
								}}
							/>
							<span className="text-sm">CMT (µm)</span>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
