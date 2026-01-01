/**
 * Decompress vision string from "618P" to "6/18P"
 */
export function decompressVision(compressed: string): string {
	if (!compressed) return "";

	// Handle special cases
	const upper = compressed.toUpperCase().trim();
	if (["CF", "HM", "PL", "LP", "NLP", "NPL", "FCMF", "FCF"].includes(upper)) {
		return upper;
	}

	// Check if already in fraction format
	if (compressed.includes("/")) {
		return compressed;
	}

	// Decompress: "618P" -> "6/18P", "66" -> "6/6"
	const match = compressed.match(/^(\d)(\d+)(.*)$/);
	if (match) {
		const [, first, rest, suffix] = match;
		return `${first}/${rest}${suffix}`;
	}

	return compressed;
}

/**
 * Convert VA to numeric value for plotting (LogMAR-based)
 */
export function convertVAToNumeric(va: string): number | null {
	if (!va) return null;

	const upper = va.toUpperCase().trim();

	// LogMAR conversion lookup
	const snellenToLogMAR: { [key: string]: number } = {
		"6/6": 0.0,
		"6/7.5": 0.1,
		"6/9": 0.18,
		"6/12": 0.3,
		"6/15": 0.4,
		"6/18": 0.48,
		"6/24": 0.6,
		"6/30": 0.7,
		"6/36": 0.78,
		"6/48": 0.9,
		"6/60": 1.0,
		"6/120": 1.3,
		"20/20": 0.0,
		"20/25": 0.1,
		"20/30": 0.18,
		"20/40": 0.3,
		"20/50": 0.4,
		"20/60": 0.48,
		"20/80": 0.6,
		"20/100": 0.7,
		"20/120": 0.78,
		"20/160": 0.9,
		"20/200": 1.0,
	};

	if (snellenToLogMAR[upper]) {
		return 1.5 - snellenToLogMAR[upper];
	}

	// Calculate for any fraction
	if (upper.includes("/")) {
		const parts = upper.split("/");
		if (parts.length === 2) {
			const numerator = parseFloat(parts[0]);
			const denominator = parseFloat(parts[1]);
			if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
				const logMAR = Math.log10(denominator / numerator);
				return 1.5 - logMAR;
			}
		}
	}

	// Near vision (N notation)
	if (upper.startsWith("N")) {
		const num = parseFloat(upper.substring(1));
		if (!isNaN(num)) {
			const logMAR = Math.log10(num / 6);
			return 1.5 - logMAR;
		}
	}

	// Special cases
	if (upper.includes("CF")) return -0.5;
	if (upper === "HM") return -1.0;
	if (upper === "PL" || upper === "LP") return -1.5;
	if (
		upper === "NLP" ||
		upper === "NO PL" ||
		upper === "NAS" ||
		upper === "NPL"
	)
		return -2.0;

	return null;
}

/**
 * Get VA scale labels for chart
 */
export function getVAScaleLabels(): string[] {
	return ["6/6", "6/18", "6/60", "CF", "HM", "PL"];
}

/**
 * Convert numeric VA value back to Snellen notation
 */
export function convertNumericToSnellen(numericValue: number): string {
	// Reverse the LogMAR conversion
	const logMAR = 1.5 - numericValue;

	// Common Snellen values lookup with more precise matching
	const logMARToSnellen: { [key: string]: string } = {
		"0.00": "6/6",
		"0.10": "6/7.5",
		"0.18": "6/9",
		"0.30": "6/12",
		"0.40": "6/15",
		"0.48": "6/18",
		"0.60": "6/24",
		"0.70": "6/30",
		"0.78": "6/36",
		"0.90": "6/48",
		"1.00": "6/60",
		"1.30": "6/120",
	};

	// Find closest match with tolerance
	const tolerance = 0.05;
	for (const [logMARStr, snellen] of Object.entries(logMARToSnellen)) {
		const logMARValue = parseFloat(logMARStr);
		if (Math.abs(logMAR - logMARValue) <= tolerance) {
			return snellen;
		}
	}

	// Handle special cases
	if (logMAR >= 2.0) return "NLP";
	if (logMAR >= 1.5) return "PL";
	if (logMAR >= 1.0) return "HM";
	if (logMAR >= 0.5) return "CF";

	// Calculate approximate Snellen for other values
	const denominator = Math.round(6 * Math.pow(10, logMAR));
	return `6/${denominator}`;
}
