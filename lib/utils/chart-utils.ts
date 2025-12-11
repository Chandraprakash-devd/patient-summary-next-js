/**
 * Extract CMT values from text using comprehensive pattern matching
 */
export function extractCMTFromText(text: string): {
	RE: number | null;
	LE: number | null;
} {
	if (!text || ["none", "nan", "no data"].includes(text.toLowerCase())) {
		return { RE: null, LE: null };
	}

	const noteNorm = text.trim().replace(/\s+/g, " ");

	let reValue: string | null = null;
	let leValue: string | null = null;

	// Pattern 1: Explicit RE/LE extraction
	const explicitRegex =
		/\b(RE|LE)\s*[-:;,]?\s*['"]?(\d+\s*(?:µm|um|mm|Mm|M)?)/gi;
	let match;
	while ((match = explicitRegex.exec(noteNorm)) !== null) {
		const eye = match[1].toUpperCase();
		const value = match[2].replace(/\s+/g, "").toUpperCase();
		if (eye === "RE") {
			reValue = value;
		} else if (eye === "LE") {
			leValue = value;
		}
	}

	// Pattern 2: CMT pattern extraction
	const cmtRegex = /\bcmt\s+(\d+)\s*(?:µm|um|mm)?/gi;
	const cmtMatches: string[] = [];
	while ((match = cmtRegex.exec(noteNorm)) !== null) {
		cmtMatches.push(match[1]);
	}

	// Pattern 3: Foveal Thickness extraction
	const fovealRegex =
		/Foveal\s+Thickness\s*[-:;,]?\s*(\d+\s*(?:µm|um|mm|Mm|M)?)/gi;
	const fovealMatches: string[] = [];
	while ((match = fovealRegex.exec(noteNorm)) !== null) {
		fovealMatches.push(match[1].replace(/\s+/g, "").toUpperCase());
	}

	// Combine all non-explicit matches
	const allMatches = [...cmtMatches, ...fovealMatches];

	// Assign values based on what we found
	if (reValue && leValue) {
		// Both eyes explicitly labeled
	} else if (reValue && !leValue && allMatches.length === 1) {
		leValue = allMatches[0];
	} else if (!reValue && leValue && allMatches.length === 1) {
		reValue = allMatches[0];
	} else if (!reValue && !leValue && allMatches.length >= 2) {
		reValue = allMatches[0];
		leValue = allMatches[1];
	} else if (!reValue && !leValue && allMatches.length === 1) {
		reValue = allMatches[0];
		leValue = allMatches[0];
	}

	// Parse values to numbers
	const parseValue = (val: string | null): number | null => {
		if (!val) return null;
		const numericStr = val.replace(/[^0-9]/g, "");
		const numeric = parseInt(numericStr, 10);
		if (isNaN(numeric) || numeric < 0 || numeric > 1500) {
			return null;
		}
		return numeric;
	};

	return {
		RE: parseValue(reValue),
		LE: parseValue(leValue),
	};
}

/**
 * Normalize condition name for consistent grouping
 */
export function normalizeConditionName(name: string): string {
	return name
		.trim()
		.replace(/\s+/g, " ")
		.replace(/[;,]+$/, "");
}

/**
 * Flatten nested procedure arrays
 */
export function flattenProcedureArray(arr: any[]): string[] {
	const result: string[] = [];

	arr.forEach((item: any) => {
		if (typeof item === "string") {
			result.push(item);
		} else if (Array.isArray(item)) {
			result.push(...flattenProcedureArray(item));
		}
	});

	return result;
}

/**
 * Check if a procedure string is a placeholder
 */
export function isProcedurePlaceholder(proc: string): boolean {
	const normalized = proc.trim().toLowerCase();
	return (
		normalized.includes("no re procedure") ||
		normalized.includes("no le procedure") ||
		normalized.includes("no be procedure") ||
		normalized === "no procedure" ||
		normalized === "none" ||
		normalized === "nil" ||
		normalized === "n/a" ||
		normalized === "-"
	);
}

/**
 * Get color for procedure type
 */
const procedureColorMap = new Map<string, string>();
const colorPalette: string[] = [
	"#00bcd4", // Cyan
	"#4ade80", // Green
	"#06b6d4", // Teal
	"#8b5cf6", // Purple
	"#f472b6", // Pink
	"#ef4444", // Red
	"#f97316", // Orange
	"#eab308", // Yellow
	"#3b82f6", // Blue
	"#ec4899", // Fuchsia
	"#10b981", // Emerald
	"#f59e0b", // Amber
	"#6366f1", // Indigo
	"#14b8a6", // Teal
	"#a855f7", // Violet
];
let colorIndex = 0;

export function getProcedureColor(procedureName: string): string {
	let color = procedureColorMap.get(procedureName);

	if (!color) {
		color = colorPalette[colorIndex % colorPalette.length];
		procedureColorMap.set(procedureName, color);
		colorIndex++;
	}

	return color;
}

/**
 * Reset procedure color mapping
 */
export function resetProcedureColors(): void {
	procedureColorMap.clear();
	colorIndex = 0;
}
