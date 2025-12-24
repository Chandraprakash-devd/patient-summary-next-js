import {
	PatientData,
	PatientSummary,
	PatientWithClinicalSummary,
} from "@/types/patient";

// Cache for loaded patient data
const patientCache = new Map<string, PatientData>();
const summariesCache = new Map<string, PatientSummary>();
const patientListCache = new Map<string, any>();
let summariesLoaded = false;
let patientListLoaded = false;

/**
 * Load patient summaries from database API
 */
export async function loadSummaries(): Promise<void> {
	if (summariesLoaded) return;

	try {
		const response = await fetch("/api/patient-summaries");
		const result = await response.json();

		if (!result.success) {
			throw new Error(result.error || "Failed to load summaries");
		}

		const data = result.data;
		Object.keys(data).forEach((uid) => {
			const item = data[uid] || { re: "", le: "", be: "" };
			summariesCache.set(uid, {
				re: item.re ?? "",
				le: item.le ?? "",
				be: item.be ?? "",
			});
		});

		summariesLoaded = true;
		console.log(
			`✅ Loaded ${summariesCache.size} patient summaries from database`
		);
	} catch (error) {
		console.error("❌ Failed to load patient summaries from database:", error);
	}
}

/**
 * Get summary for a specific patient UID
 */
export function getSummary(uid: string): PatientSummary {
	const summary = summariesCache.get(uid);
	if (summary) {
		return summary;
	}
	return { re: "", le: "", be: "" };
}

/**
 * Check if summary exists for UID
 */
export function hasSummary(uid: string): boolean {
	return summariesCache.has(uid);
}

/**
 * Get all UIDs that have summaries
 */
export function getAllSummaryUIDs(): string[] {
	return Array.from(summariesCache.keys());
}

/**
 * Load a single patient by UID from database API
 */
export async function loadPatientByUID(
	uid: string
): Promise<PatientData | null> {
	// Check cache first
	if (patientCache.has(uid)) {
		return patientCache.get(uid)!;
	}

	try {
		const response = await fetch(`/api/patient/${uid}`);
		if (!response.ok) {
			console.error(`Failed to load patient ${uid}: ${response.statusText}`);
			return null;
		}

		const result = await response.json();
		if (!result.success) {
			console.error(`Failed to load patient ${uid}: ${result.error}`);
			return null;
		}

		// Transform database response to PatientData format
		const dbData = result.data;
		const patientData: PatientData = dbData.jsonData; // The JSON data contains the patient structure

		patientCache.set(uid, patientData);
		return patientData;
	} catch (error) {
		console.error(`Failed to load patient ${uid}:`, error);
		return null;
	}
}

/**
 * Load a single patient with clinical summary by UID from database API
 */
export async function loadPatientWithClinicalSummary(
	uid: string
): Promise<PatientWithClinicalSummary | null> {
	try {
		const response = await fetch(`/api/patient/${uid}`);
		if (!response.ok) {
			console.error(`Failed to load patient ${uid}: ${response.statusText}`);
			return null;
		}

		const result = await response.json();
		if (!result.success) {
			console.error(`Failed to load patient ${uid}: ${result.error}`);
			return null;
		}

		// Transform database response
		const dbData = result.data;
		const patientData: PatientData = dbData.jsonData; // The JSON data contains the patient structure

		// Cache the patient data
		patientCache.set(uid, patientData);

		return {
			patientData,
			clinicalSummary: dbData.clinicalSummary,
		};
	} catch (error) {
		console.error(
			`Failed to load patient with clinical summary ${uid}:`,
			error
		);
		return null;
	}
}

/**
 * Load patient list from database API
 */
async function loadPatientList(): Promise<void> {
	if (patientListLoaded) return;

	try {
		const response = await fetch("/api/patients");
		const result = await response.json();

		if (!result.success) {
			throw new Error(result.error || "Failed to load patient list");
		}

		result.data.forEach((patient: any) => {
			patientListCache.set(patient.uid, patient);
		});

		patientListLoaded = true;
		console.log(`✅ Loaded ${patientListCache.size} patients from database`);
	} catch (error) {
		console.error("❌ Failed to load patient list from database:", error);
	}
}

/**
 * Get all available patient UIDs from database
 */
export async function getAllPatientUIDs(): Promise<string[]> {
	await loadPatientList();
	return Array.from(patientListCache.keys());
}

/**
 * Load all patients (for initial loading or preloading)
 */
export async function loadAllPatients(): Promise<Map<string, PatientData>> {
	const uids = await getAllPatientUIDs();
	const loadPromises = uids.map((uid) => loadPatientByUID(uid));
	await Promise.all(loadPromises);
	return patientCache;
}

/**
 * Get patient count from database
 */
export async function getPatientFileCount(): Promise<number> {
	await loadPatientList();
	return patientListCache.size;
}

/**
 * Clear the cache
 */
export function clearCache(): void {
	patientCache.clear();
	summariesCache.clear();
	patientListCache.clear();
	summariesLoaded = false;
	patientListLoaded = false;
}
