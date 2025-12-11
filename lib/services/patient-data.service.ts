import { PatientData, PatientSummary } from '@/types/patient';

// List of all patient JSON filenames
const PATIENT_FILES = [
  '0003332771',
  '0005655098',
  '0009687282',
  '0010904095',
  '0011285844',
  '0011400902',
  '0012275037',
  '0013650399',
  '0014857333',
  '0014944010',
  '0015256042',
  '0015544396',
  '0016092240',
  '0016565877',
  '0016669482',
  '0016712107',
  '0017373092',
  '0017659198',
  '0017684556',
  '0017826959',
  '0018069526',
  '0018576839',
  '0018672756',
  '0018778471',
  '0018851656',
  '0019023751',
  '0019104480',
  '0019382550',
  '0019551250',
  '0019718733',
  '0020058637',
  '0020163579',
  '0020264606',
  '0020319841',
  '0020408193',
  '0020956509',
  '0021016408',
  '0021034319',
  '0022577896',
  '0023111959',
];

// Cache for loaded patient data
const patientCache = new Map<string, PatientData>();
const summariesCache = new Map<string, PatientSummary>();
let summariesLoaded = false;

/**
 * Load patient summaries from JSON file
 */
export async function loadSummaries(): Promise<void> {
  if (summariesLoaded) return;

  try {
    const response = await fetch('/assets/patient-summaries.json');
    const data = await response.json();

    Object.keys(data).forEach((uid) => {
      const item = data[uid] || { re: '', le: '', be: '' };
      summariesCache.set(uid, {
        re: item.re ?? '',
        le: item.le ?? '',
        be: item.be ?? '',
      });
    });

    summariesLoaded = true;
    console.log(`✅ Loaded ${summariesCache.size} patient summaries`);
  } catch (error) {
    console.error('❌ Failed to load patient summaries:', error);
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
  return { re: '', le: '', be: '' };
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
 * Load a single patient file by UID
 */
export async function loadPatientByUID(
  uid: string
): Promise<PatientData | null> {
  // Check cache first
  if (patientCache.has(uid)) {
    return patientCache.get(uid)!;
  }

  try {
    const response = await fetch(`/patient_data/patient_data_all/${uid}.json`);
    if (!response.ok) {
      console.error(`Failed to load patient ${uid}: ${response.statusText}`);
      return null;
    }

    const data: PatientData = await response.json();
    patientCache.set(uid, data);
    return data;
  } catch (error) {
    console.error(`Failed to load patient file ${uid}:`, error);
    return null;
  }
}

/**
 * Get all available patient UIDs
 */
export function getAllPatientUIDs(): string[] {
  return PATIENT_FILES;
}

/**
 * Load all patients (for initial loading or preloading)
 */
export async function loadAllPatients(): Promise<Map<string, PatientData>> {
  const loadPromises = PATIENT_FILES.map((uid) => loadPatientByUID(uid));
  await Promise.all(loadPromises);
  return patientCache;
}

/**
 * Get patient count
 */
export function getPatientFileCount(): number {
  return PATIENT_FILES.length;
}

/**
 * Clear the cache
 */
export function clearCache(): void {
  patientCache.clear();
  summariesCache.clear();
  summariesLoaded = false;
}
