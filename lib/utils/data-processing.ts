import {
	PatientData,
	ChartData,
	ProcedureData,
	VADataPoint,
	TimeDataPoint,
	GanttData,
	Disease,
	ProcedureItem,
} from "@/types/patient";

// Color palette for procedure visualization
const COLOR_PALETTE: string[] = [
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
];

// Track procedure colors and color index
const procedureColorMap = new Map<string, string>();
let colorIndex = 0;

/**
 * Generate patient summary text
 */
export function generatePatientSummary(
	patientData: PatientData,
	selectedEye: "Right Eye" | "Left Eye" | "Both Eyes",
	ganttData: GanttData[],
	procedures: ProcedureItem[],
	diseases: Disease[]
): string {
	const eyeAbbr =
		selectedEye === "Right Eye"
			? "RE"
			: selectedEye === "Left Eye"
			? "LE"
			: "eyes";

	const diagnoses =
		ganttData.map((d) => d.task).join(", ") || "no recorded diagnoses";
	const procList =
		procedures.map((p) => p.item).join(", ") || "no recorded procedures";
	const systemicConditions =
		diseases.map((d) => d.name).join(", ") || "no systemic conditions";

	return `The patient (UID: ${patientData.p.uid}) with conditions including ${diagnoses} in the ${eyeAbbr} has undergone procedures such as ${procList}. The patient's history includes ${systemicConditions}. Visual acuity, IOP, and CMT have been monitored over ${patientData.p.v} visits from ${patientData.p.f} to ${patientData.p.l}.`;
}

/**
 * Extract diseases from systemic conditions (s.h field)
 */
export function getDiseases(patientData: PatientData): Disease[] {
	const diseasesMap = new Map<string, string>();

	const ignoreList = [
		"remarks",
		"remark",
		"identification marks",
		"identification mark",
		"id marks",
		"id mark",
		"others",
	];

	(patientData.visits || []).forEach((visit) => {
		if (visit.s && visit.s.h) {
			const diseases = visit.s.h
				.split(";")
				.map((d) => d.trim())
				.filter((d) => d !== "")
				.filter((d) => !ignoreList.includes(d.toLowerCase()));

			const formattedDate = formatDate(visit.d);

			diseases.forEach((disease) => {
				const trimmed = disease.trim();
				if (trimmed && !diseasesMap.has(trimmed)) {
					diseasesMap.set(trimmed, formattedDate);
				}
			});
		}
	});

	return Array.from(diseasesMap.entries()).map(([name, date]) => ({
		name,
		date,
	}));
}

/**
 * Calculate years and months ago from a date string (DD/MM/YYYY)
 */
export function getYearsAgo(dateStr: string): string {
	if (!dateStr) return "";

	const [day, month, year] = dateStr.split("/").map(Number);
	const date = new Date(year, month - 1, day);

	if (isNaN(date.getTime())) return "";

	const now = new Date();
	let years = now.getFullYear() - date.getFullYear();
	let months = now.getMonth() - date.getMonth();

	if (months < 0) {
		years--;
		months += 12;
	}

	if (now.getDate() < date.getDate()) {
		months--;
		if (months < 0) {
			years--;
			months += 12;
		}
	}

	if (years > 0 && months > 0) {
		return `${years} years ${months} months`;
	} else if (years > 0) {
		return `${years} years`;
	} else {
		return `${months} months`;
	}
}

/**
 * Classify procedure type based on comprehensive keyword matching
 */
function classifyProcedureType(procedureName: string): string {
	const name = procedureName.toLowerCase().trim();

	// Comprehensive injection keywords
	const injectionKeywords = [
		// Generic injection terms
		"injection",
		"inj",
		"intravitreal",
		"ivt",
		"ivi",

		// Anti-VEGF agents
		"avastin",
		"bevacizumab",
		"lucentis",
		"ranibizumab",
		"eylea",
		"aflibercept",
		"pagenax",
		"accentrix",
		"beovu",
		"brolucizumab",
		"vabysmo",
		"faricimab",

		// Steroids
		"ozurdex",
		"dexamethasone",
		"tricort",
		"triamcinolone",
		"kenalog",
		"iluvien",
		"fluocinolone",

		// Other injectables
		"jetrea",
		"ocriplasmin",
		"macugen",
		"pegaptanib",
		"retisert",

		// Common injection abbreviations
		"anti-vegf",
		"antivegf",
		"oceva",
		"ranieyes",
		"razumab",
	];

	// Laser procedure keywords
	const laserKeywords = [
		// Laser types
		"laser",
		"photocoagulation",
		"pfc",
		"argon",
		"diode",
		"micropulse",
		"pascal",
		"pattern scan",

		// Specific laser procedures
		"panretinal photocoagulation",
		"prp",
		"focal laser",
		"grid laser",
		"macular laser",
		"scatter laser",
		"peripheral laser",
		"retinal photocoagulation",
		"laser photocoagulation",

		// PDT
		"photodynamic therapy",
		"pdt",
		"verteporfin",
		"visudyne",
	];

	// Surgical procedures
	const surgicalKeywords = [
		"vitrectomy",
		"ppv",
		"pars plana vitrectomy",
		"membrane peel",
		"epiretinal membrane",
		"macular hole",
		"retinal detachment",
		"scleral buckle",
		"pneumatic retinopexy",
		"endolaser",
		"endophotocoagulation",
		"silicone oil",
		"gas tamponade",
		"c3f8",
		"sf6",
		"air tamponade",
	];

	// Check for injections first (most specific)
	if (injectionKeywords.some((keyword) => name.includes(keyword))) {
		return "Injection";
	}

	// Check for laser procedures
	if (laserKeywords.some((keyword) => name.includes(keyword))) {
		return "Laser";
	}

	// Check for surgical procedures
	if (surgicalKeywords.some((keyword) => name.includes(keyword))) {
		return "Surgery";
	}

	// Default to procedure for anything else
	return "Procedure";
}

/**
 * Check if procedure data uses the new format (Las/inj/surg)
 */
function isNewProcedureFormat(pr: any): boolean {
	const hasNewFormat =
		pr &&
		(pr.Las !== undefined || pr.inj !== undefined || pr.surg !== undefined);

	// Only log if there's actual data or if it's the new format
	if (hasNewFormat) {
		const hasData =
			(pr.Las && pr.Las.some((arr: any[]) => arr.length > 0)) ||
			(pr.inj && pr.inj.some((arr: any[]) => arr.length > 0)) ||
			(pr.surg && pr.surg.some((arr: any[]) => arr.length > 0));

		if (hasData) {
			console.log("🔍 Found new format with data:", {
				pr,
				hasLas: pr?.Las !== undefined,
				hasInj: pr?.inj !== undefined,
				hasSurg: pr?.surg !== undefined,
				isNewFormat: hasNewFormat,
			});
		}
	}

	return hasNewFormat;
}

/**
 * Extract procedures from new format (Las/inj/surg)
 * @param eyeIndex 0 for RE, 1 for LE, 2 for BE
 */
function getProceduresFromNewFormat(
	patientData: PatientData,
	eyeIndex: number
): ProcedureItem[] {
	console.log("📋 Processing new format procedures for eyeIndex:", eyeIndex);
	const procCount = new Map<string, number>();

	// First, let's see if we can find the visit with procedures (2024-04-09 in sample)
	const visitsWithProcedures = (patientData.visits || []).filter((visit) => {
		if (!visit.pr || !isNewProcedureFormat(visit.pr)) return false;
		const pr = visit.pr as any;
		return (
			(pr.Las && pr.Las.some((arr: any[]) => arr.length > 0)) ||
			(pr.inj && pr.inj.some((arr: any[]) => arr.length > 0)) ||
			(pr.surg && pr.surg.some((arr: any[]) => arr.length > 0))
		);
	});

	console.log(
		"📋 Found visits with procedures:",
		visitsWithProcedures.map((v) => v.d)
	);

	(patientData.visits || []).forEach((visit, visitIndex) => {
		console.log(`📅 Visit ${visitIndex} (${visit.d}):`, visit.pr);

		if (visit.pr && isNewProcedureFormat(visit.pr)) {
			const pr = visit.pr as any;

			// Process Lasers
			if (pr.Las && Array.isArray(pr.Las)) {
				console.log("🔥 Processing Lasers:", pr.Las);
				const laserProcs = pr.Las[eyeIndex];
				console.log(`🔥 Laser procs for eye ${eyeIndex}:`, laserProcs);

				if (Array.isArray(laserProcs) && laserProcs.length > 0) {
					// laserProcs is directly an array of procedure objects, not nested arrays
					laserProcs.forEach((proc: any, procIndex: number) => {
						console.log(`🔥 Laser proc ${procIndex}:`, proc);
						if (proc && proc.procedure_type) {
							const name = proc.laser_type
								? `${proc.procedure_type} - ${proc.laser_type}`
								: proc.procedure_type;
							console.log("🔥 Adding laser procedure:", name);
							procCount.set(name, (procCount.get(name) || 0) + 1);
						}
					});
				}
			}

			// Process Injections
			if (pr.inj && Array.isArray(pr.inj)) {
				console.log("💉 Processing Injections:", pr.inj);
				const injProcs = pr.inj[eyeIndex];
				console.log(`💉 Injection procs for eye ${eyeIndex}:`, injProcs);

				if (Array.isArray(injProcs) && injProcs.length > 0) {
					// injProcs is directly an array of procedure objects, not nested arrays
					injProcs.forEach((proc: any, procIndex: number) => {
						console.log(`💉 Injection proc ${procIndex}:`, proc);
						if (proc && proc.procedure_type) {
							console.log(
								"💉 Adding injection procedure:",
								proc.procedure_type
							);
							procCount.set(
								proc.procedure_type,
								(procCount.get(proc.procedure_type) || 0) + 1
							);
						}
					});
				}
			}

			// Process Surgeries
			if (pr.surg && Array.isArray(pr.surg)) {
				console.log("🔪 Processing Surgeries:", pr.surg);
				const surgProcs = pr.surg[eyeIndex];
				console.log(`🔪 Surgery procs for eye ${eyeIndex}:`, surgProcs);

				if (Array.isArray(surgProcs) && surgProcs.length > 0) {
					// surgProcs is directly an array of procedure objects, not nested arrays
					surgProcs.forEach((proc: any, procIndex: number) => {
						console.log(`🔪 Surgery proc ${procIndex}:`, proc);
						if (proc && proc.procedure_type) {
							console.log("🔪 Adding surgery procedure:", proc.procedure_type);
							procCount.set(
								proc.procedure_type,
								(procCount.get(proc.procedure_type) || 0) + 1
							);
						}
					});
				}
			}
		}
	});

	const result = Array.from(procCount.entries()).map(([name, count]) => {
		// Determine type based on which category it came from
		let type = "Procedure";

		// Check if this procedure came from Las, inj, or surg by looking at the name patterns
		if (
			name.includes("Laser") ||
			name.includes("PRP") ||
			name.includes("Photocoagulation")
		) {
			type = "Laser";
		} else if (
			name.includes("Injection") ||
			name.includes("Anti-VEGF") ||
			name.includes("Steroid")
		) {
			type = "Injection";
		} else if (
			name.includes("Surgery") ||
			name.includes("Vitrectomy") ||
			name.includes("Membrane")
		) {
			type = "Surgery";
		}

		return { type, item: `${name}${count > 1 ? ` (${count}x)` : ""}` };
	});

	console.log("📋 Final processed procedures from new format:", result);
	console.log("📋 Procedure count map:", Array.from(procCount.entries()));
	return result;
}

/**
 * Extract procedures from new format for line chart
 * @param eyeIndex 0 for RE, 1 for LE, 2 for BE
 */
function getProceduresFromNewFormatForChart(
	patientData: PatientData,
	eyeIndex: number
): ProcedureData[] {
	console.log(
		"📊 getProceduresFromNewFormatForChart called with eyeIndex:",
		eyeIndex
	);
	const procedures: ProcedureData[] = [];

	(patientData.visits || []).forEach((visit, visitIndex) => {
		const date = visit.d;
		console.log(`📊 Chart processing visit ${visitIndex} (${date}):`, visit.pr);

		if (!date || !visit.pr || !isNewProcedureFormat(visit.pr)) return;

		const pr = visit.pr as any;

		// Process Lasers
		if (pr.Las && Array.isArray(pr.Las)) {
			console.log("📊🔥 Chart processing Lasers:", pr.Las);
			const laserProcs = pr.Las[eyeIndex];
			if (Array.isArray(laserProcs) && laserProcs.length > 0) {
				// laserProcs is directly an array of procedure objects, not nested arrays
				laserProcs.forEach((proc: any) => {
					if (proc && proc.procedure_type) {
						const name = proc.laser_type
							? `${proc.procedure_type} - ${proc.laser_type}`
							: proc.procedure_type;
						const color = getProcedureColor(name);
						console.log("📊🔥 Adding laser to chart:", {
							date,
							name,
							color,
						});
						procedures.push({ date, type: "laser", name, color });
					}
				});
			}
		}

		// Process Injections
		if (pr.inj && Array.isArray(pr.inj)) {
			const injProcs = pr.inj[eyeIndex];
			if (Array.isArray(injProcs) && injProcs.length > 0) {
				// injProcs is directly an array of procedure objects, not nested arrays
				injProcs.forEach((proc: any) => {
					if (proc && proc.procedure_type) {
						const color = getProcedureColor(proc.procedure_type);
						procedures.push({
							date,
							type: "injection",
							name: proc.procedure_type,
							color,
						});
					}
				});
			}
		}

		// Process Surgeries
		if (pr.surg && Array.isArray(pr.surg)) {
			const surgProcs = pr.surg[eyeIndex];
			if (Array.isArray(surgProcs) && surgProcs.length > 0) {
				// surgProcs is directly an array of procedure objects, not nested arrays
				surgProcs.forEach((proc: any) => {
					if (proc && proc.procedure_type) {
						const color = getProcedureColor(proc.procedure_type);
						procedures.push({
							date,
							type: "surgery",
							name: proc.procedure_type,
							color,
						});
					}
				});
			}
		}
	});

	console.log("📊 Final chart procedures from new format:", procedures);
	return procedures;
}
/**
 * Extract procedures from pr.act (actual procedures) or new format (Las/inj/surg)
 * @param eyeIndex 0 for RE, 1 for LE, 2 for BE
 */
export function getProcedures(
	patientData: PatientData,
	eyeIndex: number
): ProcedureItem[] {
	console.log("🚀 getProcedures called with eyeIndex:", eyeIndex);
	console.log("🚀 Patient data visits count:", patientData.visits?.length || 0);
	console.log("🚀 Patient UID:", patientData.p?.uid);

	// Log all visit dates to see what we're processing
	const visitDates = (patientData.visits || []).map((v) => v.d);
	console.log("🚀 Visit dates:", visitDates);

	// Check if any visit uses the new format
	const hasNewFormat = (patientData.visits || []).some(
		(visit) => visit.pr && isNewProcedureFormat(visit.pr)
	);

	console.log("🚀 Has new format:", hasNewFormat);

	if (hasNewFormat) {
		console.log("🚀 Using new format processing");
		return getProceduresFromNewFormat(patientData, eyeIndex);
	}

	console.log("🚀 Using old format processing");
	// Fallback to old format processing
	const procCount = new Map<string, number>();

	(patientData.visits || []).forEach((visit) => {
		if (visit.pr && (visit.pr as any).act) {
			const actProcs = (visit.pr as any).act;

			if (Array.isArray(actProcs)) {
				let proceduresToCheck: string[] = [];

				// For BE (Both Eyes), check both RE and LE procedures
				if (eyeIndex === 2) {
					if (actProcs[0] && Array.isArray(actProcs[0])) {
						const flattened = flattenProcedureArray(actProcs[0]);
						proceduresToCheck = proceduresToCheck.concat(
							flattened.filter((p) => p && typeof p === "string")
						);
					}
					if (actProcs[1] && Array.isArray(actProcs[1])) {
						const flattened = flattenProcedureArray(actProcs[1]);
						proceduresToCheck = proceduresToCheck.concat(
							flattened.filter((p) => p && typeof p === "string")
						);
					}
				} else {
					// For specific eye (RE or LE)
					if (actProcs[eyeIndex] && Array.isArray(actProcs[eyeIndex])) {
						const flattened = flattenProcedureArray(actProcs[eyeIndex]);
						proceduresToCheck = flattened.filter(
							(p) => p && typeof p === "string"
						);
					}
				}

				proceduresToCheck.forEach((proc) => {
					const name = proc.trim();
					const isPlaceholder = isProcedurePlaceholder(name);

					if (name && !isPlaceholder) {
						procCount.set(name, (procCount.get(name) || 0) + 1);
					}
				});
			}
		}
	});

	return Array.from(procCount.entries()).map(([name, count]) => {
		const type = classifyProcedureType(name);
		return { type, item: `${name}${count > 1 ? ` (${count}x)` : ""}` };
	});
}

/**
 * Get SVG icon and color for a procedure
 */
export function getSvgForProcedure(procedureItem: string): {
	svg: string;
	color: string;
} {
	const name = procedureItem.replace(/\s*\(\d+x\)$/, "");

	// For new format, determine type based on procedure name patterns
	let type: string;

	// Check for laser procedures
	if (
		name.includes("Laser") ||
		name.includes("PRP") ||
		name.includes("Photocoagulation") ||
		name.includes("Retina Laser") ||
		name.includes("Accessible PRP")
	) {
		type = "Laser";
	}
	// Check for injection procedures
	else if (
		name.includes("Injection") ||
		name.includes("Anti-VEGF") ||
		name.includes("Steroid") ||
		name.includes("Intravitreal") ||
		name.includes("Bevacizumab") ||
		name.includes("Ranibizumab")
	) {
		type = "Injection";
	}
	// Check for surgical procedures
	else if (
		name.includes("Surgery") ||
		name.includes("Vitrectomy") ||
		name.includes("Membrane") ||
		name.includes("Retinal Detachment") ||
		name.includes("Scleral Buckle")
	) {
		type = "Surgery";
	}
	// Fallback to classification function for old format
	else {
		type = classifyProcedureType(name);
	}

	let svg: string;
	switch (type) {
		case "Injection":
			svg = "injection";
			break;
		case "Laser":
			svg = "laser";
			break;
		case "Surgery":
			svg = "surgery";
			break;
		default:
			svg = "procedure";
			break;
	}

	return {
		svg,
		color: getProcedureColor(name),
	};
}

/**
 * Build gantt data from visit observations
 */
export function getGanttData(
	patientData: PatientData,
	section: string,
	eyeIndex: number
): GanttData[] {
	const sectionFieldMap: {
		[key: string]: { parent: string; field: string };
	} = {
		diagnosis: { parent: "diag", field: "" },
		background_retina: { parent: "fu", field: "br" },
		foveal_reflex: { parent: "fu", field: "mf" },
		conjunctiva: { parent: "at", field: "cj" },
		media: { parent: "fu", field: "me" },
		anterior_chamber: { parent: "at", field: "ac" },
		iris: { parent: "at", field: "ir" },
		disc: { parent: "fu", field: "di" },
		pupil: { parent: "at", field: "pu" },
		vessels: { parent: "fu", field: "ve" },
		undilated_fundus: { parent: "fu", field: "rem" },
		lens: { parent: "at", field: "lens" },
	};

	const mapping = sectionFieldMap[section];
	if (!mapping) {
		console.warn(`No field mapping found for section: ${section}`);
		return [];
	}

	// Special handling for diagnosis
	if (section === "diagnosis") {
		return getDiagnosisGanttData(patientData, eyeIndex);
	}

	const conditionMap = new Map<string, { start: string; end: string }>();
	let currentCondition: string | null = null;
	let conditionStart: string | null = null;

	const sortedVisits = [...(patientData.visits || [])].sort((a, b) =>
		a.d.localeCompare(b.d)
	);

	sortedVisits.forEach((visit, index) => {
		const visitDate = visit.d;
		const parentObj = (visit as any)[mapping.parent];

		if (!parentObj) return;

		let value: any = parentObj[mapping.field];

		if (Array.isArray(value)) {
			value = value[eyeIndex] || value[0];
		}

		if (!value || value.trim() === "") {
			if (currentCondition && conditionStart) {
				const prevDate = sortedVisits[index - 1]?.d || visitDate;
				updateConditionMap(
					conditionMap,
					currentCondition,
					conditionStart,
					prevDate
				);
				currentCondition = null;
				conditionStart = null;
			}
			return;
		}

		const normalizedValue = normalizeConditionName(value);

		if (normalizedValue !== currentCondition) {
			if (currentCondition && conditionStart) {
				const prevDate = sortedVisits[index - 1]?.d || visitDate;
				updateConditionMap(
					conditionMap,
					currentCondition,
					conditionStart,
					prevDate
				);
			}

			currentCondition = normalizedValue;
			conditionStart = visitDate;
		}
	});

	if (currentCondition && conditionStart) {
		const lastVisit = sortedVisits[sortedVisits.length - 1];
		updateConditionMap(
			conditionMap,
			currentCondition,
			conditionStart,
			lastVisit.d
		);
	}

	return Array.from(conditionMap.entries())
		.map(([task, { start, end }]) => ({ task, start, end }))
		.filter((d) => d.start && d.end);
}

/**
 * Extract diagnosis data and build gantt timelines
 */
function getDiagnosisGanttData(
	patientData: PatientData,
	eyeIndex: number
): GanttData[] {
	const diagMap = new Map<string, { start: string; end: string }>();
	const diagTracker = new Map<string, { start: string; lastSeen: string }>();

	const sortedVisits = [...(patientData.visits || [])].sort((a, b) =>
		a.d.localeCompare(b.d)
	);

	sortedVisits.forEach((visit) => {
		const visitDate = visit.d;

		if (visit.diag && Array.isArray(visit.diag)) {
			const currentDiagnoses = new Set<string>();

			let diagArray = visit.diag[eyeIndex];

			if (typeof diagArray === "string") {
				diagArray = diagArray.trim() ? [diagArray] : [];
			}

			if (diagArray && Array.isArray(diagArray)) {
				diagArray.forEach((diag: string) => {
					if (diag && diag.trim()) {
						let cleanDiag = diag
							.trim()
							.replace(/\s*×\s*\d+\s*$/, "")
							.trim();
						const normalizedDiag = normalizeConditionName(cleanDiag);

						if (normalizedDiag) {
							currentDiagnoses.add(normalizedDiag);
						}
					}
				});
			}

			// Include "Both Eyes" (index 2) diagnoses for Right Eye and Left Eye
			if (eyeIndex === 0 || eyeIndex === 1) {
				let bothEyesDiag = visit.diag[2];

				if (typeof bothEyesDiag === "string") {
					bothEyesDiag = bothEyesDiag.trim() ? [bothEyesDiag] : [];
				}

				if (bothEyesDiag && Array.isArray(bothEyesDiag)) {
					bothEyesDiag.forEach((diag: string) => {
						if (diag && diag.trim()) {
							let cleanDiag = diag
								.trim()
								.replace(/\s*×\s*\d+\s*$/, "")
								.trim();
							const normalizedDiag = normalizeConditionName(cleanDiag);

							if (normalizedDiag) {
								currentDiagnoses.add(normalizedDiag);
							}
						}
					});
				}
			}

			currentDiagnoses.forEach((normalizedDiag) => {
				if (!diagTracker.has(normalizedDiag)) {
					diagTracker.set(normalizedDiag, {
						start: visitDate,
						lastSeen: visitDate,
					});
				} else {
					const tracking = diagTracker.get(normalizedDiag)!;
					tracking.lastSeen = visitDate;
				}
			});

			diagTracker.forEach((tracking, diag) => {
				if (!currentDiagnoses.has(diag) && tracking.lastSeen !== visitDate) {
					updateConditionMap(diagMap, diag, tracking.start, tracking.lastSeen);
					diagTracker.delete(diag);
				}
			});
		}
	});

	diagTracker.forEach((tracking, diag) => {
		updateConditionMap(diagMap, diag, tracking.start, tracking.lastSeen);
	});

	return Array.from(diagMap.entries())
		.map(([task, { start, end }]) => ({ task, start, end }))
		.filter((d) => d.start && d.end);
}

/**
 * Build medications gantt from visit medications
 */
export function getMedicationsGanttData(patientData: PatientData): GanttData[] {
	const medMap = new Map<
		string,
		{
			start: string;
			end: string;
			dosage: string;
		}
	>();

	(patientData.visits || []).forEach((visit) => {
		if (visit.m && Array.isArray(visit.m)) {
			const visitDate = visit.d;

			visit.m.forEach((med) => {
				if (!med || typeof med !== "object") return;

				const drugName = med.name?.trim();
				if (!drugName) return;

				let eyeLabel = "";
				if (med.eye === 1 || med.eye === "1") {
					eyeLabel = " (RE)";
				} else if (med.eye === 2 || med.eye === "2") {
					eyeLabel = " (LE)";
				} else if (med.eye === 3 || med.eye === "3") {
					eyeLabel = " (BE)";
				}

				const task = `${drugName}${eyeLabel}`;

				const dosageStr =
					med.dos && med.fre
						? `${med.dos} x ${med.fre}`
						: med.dos
						? med.dos
						: "";

				const start = visitDate;
				const end = visitDate;

				if (start && end) {
					const entry = medMap.get(task) || {
						start: "9999-12-31",
						end: "0001-01-01",
						dosage: dosageStr,
					};

					if (start < entry.start) {
						entry.start = start;
						if (dosageStr) entry.dosage = dosageStr;
					}
					if (end > entry.end) {
						entry.end = end;
					}

					medMap.set(task, entry);
				}
			});
		}
	});

	return Array.from(medMap.entries())
		.map(([task, { start, end, dosage }]) => ({
			task,
			start,
			end,
			dosage,
		}))
		.filter((d) => d.start !== "9999-12-31" && d.end !== "0001-01-01");
}

/**
 * Extract line chart data (VA, IOP, CMT, Procedures)
 */
export function getLineChartData(
	patientData: PatientData,
	eyeIndex: number
): ChartData {
	const procedures: ProcedureData[] = [];
	const visualAcuityData: VADataPoint[] = [];
	const iopData: TimeDataPoint[] = [];
	const cmtData: TimeDataPoint[] = [];

	(patientData.visits || []).forEach((visit) => {
		const date = visit.d;
		if (!date) return;

		// Extract Procedures - handle both old and new formats
		if (visit.pr) {
			console.log("📈 LineChart processing visit procedures:", visit.pr);

			if (isNewProcedureFormat(visit.pr)) {
				console.log("📈 Using new format for line chart");
				// Use new format extraction
				const newFormatProcs = getProceduresFromNewFormatForChart(
					{ p: patientData.p, visits: [visit] },
					eyeIndex
				);
				console.log("📈 New format procs for line chart:", newFormatProcs);
				procedures.push(...newFormatProcs);
			} else if ((visit.pr as any).act) {
				console.log("📈 Using old format for line chart");
				// Use old format extraction
				const actProcs = (visit.pr as any).act;
				if (Array.isArray(actProcs) && actProcs[eyeIndex]) {
					const eyeProcs = actProcs[eyeIndex];
					if (Array.isArray(eyeProcs)) {
						const flattened = flattenProcedureArray(eyeProcs);
						flattened.forEach((proc) => {
							if (
								proc &&
								typeof proc === "string" &&
								proc.trim() &&
								!isProcedurePlaceholder(proc)
							) {
								const name = proc.trim();
								const procedureType = classifyProcedureType(name);
								const type = procedureType.toLowerCase();
								const color = getProcedureColor(name);
								procedures.push({ date, type, name, color } as ProcedureData);
							}
						});
					}
				}
			}
		}

		// Extract Visual Acuity
		if (visit.vi) {
			let dvVA: string | null = null;
			let nvVA: string | null = null;

			if (
				visit.vi.dist &&
				Array.isArray(visit.vi.dist) &&
				visit.vi.dist[eyeIndex]
			) {
				const distData = visit.vi.dist[eyeIndex];
				const rawVA = distData.va || distData.ucva;
				if (rawVA) {
					dvVA = decompressVision(rawVA);
				}
			}

			if (visit.vi.nr && Array.isArray(visit.vi.nr) && visit.vi.nr[eyeIndex]) {
				const nrData = visit.vi.nr[eyeIndex];
				if (nrData.va) {
					nvVA = decompressVision(nrData.va);
				}
			}

			if (dvVA) {
				const numericValue = convertVAToNumeric(dvVA);
				if (numericValue !== null) {
					visualAcuityData.push({
						x: date,
						y: dvVA,
						yNumeric: numericValue,
						nv: nvVA,
					});
				}
			}
		}

		// Extract IOP
		if (visit.inv && visit.inv.iop) {
			let iopValue: number | null = null;

			if (Array.isArray(visit.inv.iop)) {
				const iopStr = visit.inv.iop[eyeIndex];
				if (iopStr && iopStr !== "Not Measurable") {
					iopValue = parseFloat(iopStr);
				}
			} else if (typeof visit.inv.iop === "string") {
				if (visit.inv.iop !== "Not Measurable") {
					iopValue = parseFloat(visit.inv.iop);
				}
			}

			if (iopValue !== null && !isNaN(iopValue) && iopValue > 0) {
				iopData.push({ x: date, y: iopValue });
			}
		}

		// Extract CMT
		if (visit.inv && visit.inv.sp && visit.inv.sp.r) {
			const cmtValues = extractCMTFromText(visit.inv.sp.r);
			const cmtValue = eyeIndex === 0 ? cmtValues.RE : cmtValues.LE;

			if (cmtValue !== null) {
				cmtData.push({ x: date, y: cmtValue });
			}
		}
	});

	console.log("📈 Final getLineChartData result:", {
		proceduresCount: procedures.length,
		procedures: procedures,
		visualAcuityDataCount: visualAcuityData.length,
		iopDataCount: iopData.length,
		cmtDataCount: cmtData.length,
	});

	return {
		procedures,
		visualAcuityData,
		iopData,
		cmtData,
	};
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Helper to update condition map with merged date ranges
 */
function updateConditionMap(
	map: Map<string, { start: string; end: string }>,
	condition: string,
	start: string,
	end: string
): void {
	if (!condition || !start || !end) return;

	const existing = map.get(condition);
	if (!existing) {
		map.set(condition, { start, end });
	} else {
		if (start < existing.start) existing.start = start;
		if (end > existing.end) existing.end = end;
	}
}

/**
 * Normalize condition names for consistent grouping
 */
function normalizeConditionName(name: string): string {
	return name
		.trim()
		.replace(/\s+/g, " ")
		.replace(/[;,]+$/, "");
}

/**
 * Check if a procedure string is a placeholder
 */
function isProcedurePlaceholder(proc: string): boolean {
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
 * Flatten nested procedure arrays
 */
function flattenProcedureArray(arr: any[]): string[] {
	const result: string[] = [];

	arr.forEach((item) => {
		if (typeof item === "string") {
			result.push(item);
		} else if (Array.isArray(item)) {
			result.push(...flattenProcedureArray(item));
		}
	});

	return result;
}

/**
 * Get color for a procedure name
 */
function getProcedureColor(procedureName: string): string {
	let color = procedureColorMap.get(procedureName);

	if (!color) {
		color = COLOR_PALETTE[colorIndex % COLOR_PALETTE.length];
		procedureColorMap.set(procedureName, color);
		colorIndex++;
	}

	return color;
}

/**
 * Decompress vision string from "618P" to "6/18P"
 */
function decompressVision(compressed: string): string {
	if (!compressed) return "";

	const upper = compressed.toUpperCase().trim();
	if (["CF", "HM", "PL", "LP", "NLP", "NPL", "FCMF", "FCF"].includes(upper)) {
		return upper;
	}

	if (compressed.includes("/")) {
		return compressed;
	}

	const match = compressed.match(/^(\d)(\d+)(.*)$/);
	if (match) {
		const [, first, rest, suffix] = match;
		return `${first}/${rest}${suffix}`;
	}

	return compressed;
}

/**
 * Convert VA to numeric value for plotting
 */
function convertVAToNumeric(va: string): number | null {
	if (!va) return null;

	const upper = va.toUpperCase().trim();

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

	if (upper.startsWith("N")) {
		const num = parseFloat(upper.substring(1));
		if (!isNaN(num)) {
			const logMAR = Math.log10(num / 6);
			return 1.5 - logMAR;
		}
	}

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
 * Extract CMT values from text using comprehensive pattern matching
 */
function extractCMTFromText(text: string): {
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

	const allMatches = [...cmtMatches, ...fovealMatches];

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
 * Format date from YYYY-MM-DD to DD/MM/YYYY
 */
export function formatDate(dateStr: string): string {
	if (!dateStr) return "";

	const [year, month, day] = dateStr.split("-");
	return `${day}/${month}/${year}`;
}

/**
 * Reset procedure color map (useful when switching patients)
 */
export function resetProcedureColors(): void {
	procedureColorMap.clear();
	colorIndex = 0;
}
