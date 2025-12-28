// Patient data type definitions

export interface PatientSummary {
	re: string;
	le: string;
	be: string;
}

export interface PatientClinicalSummary {
	uid: string;
	visitCount: number;
	firstVisit: string;
	lastVisit: string;
	mrNo: string;
	reSummary: string;
	leSummary: string;
	beSummary: string;
	clinicalNote: string;
	createdAt: string;
}

export interface PatientWithClinicalSummary {
	patientData: PatientData;
	clinicalSummary: PatientClinicalSummary | null;
}

export interface PatientInfo {
	uid: string;
	mr: string;
	v: number; // number of visits
	f: string; // first visit date
	l: string; // last visit date
}

export interface VisionData {
	sph?: string;
	cyl?: string;
	ax?: string;
	va?: string;
	ucva?: string;
	Glasses?: string;
	UCVA?: string;
	"With Spectacles"?: string;
	"UCVA With PH"?: string;
	None?: string;
}

export interface VisualAcuity {
	vis?: VisionData | VisionData[];
	dist?: VisionData[];
	nr?: VisionData[];
}

export interface AnteriorSegment {
	ac?: string | string[]; // anterior chamber
	ir?: string | string[]; // iris
	cj?: string | string[]; // conjunctiva
	pu?: string | string[]; // pupil
	lens?: string | string[];
	rem?: string;
}

export interface OcularMotility {
	om?: string | string[];
	cr?: string | string[];
	gl?: string | string[];
}

export interface Fundus {
	me?: string | string[]; // media
	di?: string | string[]; // disc
	ve?: string | string[]; // vessels
	br?: string | string[]; // background retina
	mf?: string | string[]; // macula foveal reflex
	uf?: string | string[]; // undilated fundus
	rem?: string | string[];
}

export interface Medication {
	name?: string;
	dos?: string; // dosage
	eye?: number | string; // 1=RE, 2=LE, 3=BE, 5=oral
	fre?: number | string; // frequency
}

export interface Procedure {
	adv?: (string[] | null)[]; // advised procedures [RE, LE]
	act?: (string[] | null)[]; // actual procedures [RE, LE]
}

// New procedure structure with pre-split categories
export interface NewProcedureStructure {
	Las?: (ProcedureDetail[][] | null)[]; // Lasers [RE, LE, BE]
	inj?: (ProcedureDetail[][] | null)[]; // Injections [RE, LE, BE]
	surg?: (ProcedureDetail[][] | null)[]; // Surgeries [RE, LE, BE]
}

export interface ProcedureDetail {
	eye: string; // "RE", "LE", "BE"
	laser_type?: string;
	procedure_type: string;
}

export interface Investigation {
	iop?: string | string[]; // intraocular pressure
	sp?: {
		r?: string; // special investigation report
		e?: string[]; // extracted values [RE, LE]
	};
}

export interface FollowUp {
	adv?: string; // advice
	uf?: string | string[];
}

export interface SystemicHistory {
	h?: string; // history (semicolon-separated)
}

export interface Opinion {
	ref?: string; // referral/opinion
}

export interface Visit {
	v: number; // visit number
	d: string; // date (YYYY-MM-DD)
	c: string; // consultation type (Initial, F1, F2, etc.)
	diag?: (string | string[])[]; // diagnosis [RE, LE, BE]
	vi?: VisualAcuity;
	at?: AnteriorSegment;
	om?: OcularMotility;
	fu?: Fundus;
	m?: Medication[];
	pr?: Procedure | NewProcedureStructure; // Support both old and new formats
	inv?: Investigation;
	fup?: FollowUp;
	s?: SystemicHistory;
	op?: Opinion;
	as?: {
		rem?: string;
	};
}

export interface PatientData {
	p: PatientInfo;
	visits: Visit[];
}

// Chart data types
export interface TimeDataPoint {
	x: string; // date
	y: number;
}

export interface VADataPoint {
	x: string; // date
	y: string; // visual acuity string (e.g., "6/18")
	yNumeric: number; // numeric value for plotting
	nv: string | null; // near vision
}

export interface ProcedureData {
	date: string;
	type: "injection" | "laser" | "surgery" | "procedure";
	name: string;
	color: string;
	count?: number;
}

export interface ChartData {
	procedures: ProcedureData[];
	visualAcuityData: VADataPoint[];
	iopData: TimeDataPoint[];
	cmtData: TimeDataPoint[];
}

export interface MetricConfig {
	name: string;
	color: string;
	colorLight?: string;
	colorDark?: string;
	min: number;
	max: number;
	step?: number;
	yAxisId: string;
}

export interface GanttData {
	task: string;
	start: string;
	end: string;
	dosage?: string;
}

export interface Disease {
	name: string;
	date: string;
}

export interface ProcedureItem {
	type: string;
	item: string;
}
