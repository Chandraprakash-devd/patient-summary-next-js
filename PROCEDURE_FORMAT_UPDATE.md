# Procedure Data Format Update

## Overview

Updated the procedures fetching logic to support the new JSON data structure where procedures are pre-split into categories.

## New Data Structure

```json
{
	"pr": {
		"Las": [
			[
				{
					"eye": "RE",
					"laser_type": "Accessible PRP",
					"procedure_type": "Retina Laser"
				}
			],
			[
				{
					"eye": "LE",
					"laser_type": "PRP",
					"procedure_type": "Retina Laser"
				}
			],
			[]
		],
		"inj": [[], [], []],
		"surg": [[], [], []]
	}
}
```

## Changes Made

### 1. Type Definitions (`types/patient.ts`)

- Added `NewProcedureStructure` interface for the new format
- Added `ProcedureDetail` interface for individual procedure objects
- Updated `Visit` interface to support both old and new procedure formats

### 2. Data Processing (`lib/utils/data-processing.ts`)

- Added `isNewProcedureFormat()` to detect new format
- Added `getProceduresFromNewFormat()` for extracting procedures from new structure
- Added `getProceduresFromNewFormatForChart()` for chart data extraction
- Updated `getProcedures()` to handle both formats automatically
- Updated `getLineChartData()` to process both formats
- Enhanced `getSvgForProcedure()` with better type detection for new format

## Key Features

- **Backward Compatibility**: Supports both old (`pr.act`) and new (`pr.Las/inj/surg`) formats
- **Automatic Detection**: Automatically detects which format is being used
- **No Breaking Changes**: Existing functionality remains intact
- **Enhanced Classification**: Better procedure type detection for new format

## Data Flow

1. Check if visit uses new format (`Las/inj/surg` fields present)
2. If new format: Extract from pre-split categories
3. If old format: Use existing keyword-based classification
4. Process and display procedures in UI components

## Benefits

- Eliminates need for keyword-based classification in new format
- More accurate procedure categorization
- Improved performance (no classification overhead)
- Cleaner data structure
