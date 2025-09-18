# Hospital Shift Data CSV to JSON Converter

This tool converts hospital shift CSV files into structured JSON data for analysis.

## Features

- **Comprehensive Data Structure**: Each shift record includes detailed metadata
- **Automatic Statistics**: Generates per-person statistics automatically  
- **Multiple Output Formats**: JSON for detailed analysis, CSV for spreadsheet viewing
- **Shift Type Recognition**: Handles all Chinese shift codes with proper work values
- **Holiday Detection**: Identifies and flags holiday work
- **Weekend Analysis**: Tracks weekend shift patterns

## Shift Code Mappings

| Chinese | Work Value | Type | Description |
|---------|------------|------|-------------|
| 休 | 0 | rest | Rest day |
| 小 | 1 | night_shift_small | Night shift (small) |
| 大 | 1 | night_shift_big | Night shift (big) |
| 夜 | 1 | night_shift_whole | Night shift (whole) |
| 白 | 1 | day_shift | Day shift |
| 半 | 0.5 | day_shift_half | Day shift (half) |
| 病假 | 0 | sick_leave | Sick leave |
| 产假 | 0 | maternity_leave | Maternity leave |
| 下 | 1 | night_shift_day | Night shift day (rest but counted as work) |

## Usage

### Basic Conversion
```bash
node src/csvConverter.js csv/2014-04.csv
```

### Programmatic Usage
```javascript
const HospitalShiftConverter = require('./src/csvConverter');

const converter = new HospitalShiftConverter();
const result = converter.convert('csv/2014-04.csv');

console.log(`Converted ${result.records.length} records for ${Object.keys(result.statistics).length} nurses`);
```

## Output Files

The converter generates three files in the `output/` directory:

### 1. `{filename}_converted.json`
Detailed array of shift records with complete metadata:
```json
{
  "fullDate": "2014-04-01",
  "year": 2014,
  "month": 4, 
  "day": 1,
  "isHoliday": false,
  "nurseName": "赵蕊",
  "nurseId": 1,
  "workValue": 1,
  "workType": "day_shift",
  "shiftCode": "白",
  "weekday": "Tuesday",
  "weekdayNumber": 2,
  "description": "Day shift",
  "isWorkDay": true,
  "isRestDay": false,
  "isNightShift": false,
  "isDayShift": true,
  "isLeave": false,
  "isWeekend": false
}
```

### 2. `{filename}_statistics.json`
Per-person statistics:
```json
{
  "1-赵蕊": {
    "nurseId": 1,
    "nurseName": "赵蕊",
    "totalDays": 30,
    "workDays": 21,
    "restDays": 9,
    "totalWorkValue": 20.5,
    "nightShifts": 9,
    "dayShifts": 12,
    "halfShifts": 1,
    "sickLeave": 0,
    "holidayWork": 5,
    "weekendWork": 5,
    "shiftTypes": {
      "休": 8,
      "白": 11,
      "小": 3
    }
  }
}
```

### 3. `{filename}_summary.csv`
Spreadsheet-friendly summary for quick viewing.

## Analysis Examples

Run the analysis example:
```bash
node examples/analyze_shifts.js
```

### Custom Analysis
```javascript
const records = require('./output/2014-04_converted.json');

// Find all night shifts
const nightShifts = records.filter(r => r.isNightShift);

// Calculate average work value by nurse
const avgByNurse = {};
records.forEach(record => {
  const key = record.nurseName;
  if (!avgByNurse[key]) avgByNurse[key] = { total: 0, count: 0 };
  avgByNurse[key].total += record.workValue;
  avgByNurse[key].count++;
});

Object.keys(avgByNurse).forEach(nurse => {
  avgByNurse[nurse].average = avgByNurse[nurse].total / avgByNurse[nurse].count;
});

// Find weekend workers
const weekendWorkers = records.filter(r => r.isWeekend && r.isWorkDay);
```

## Data Fields Reference

### Core Fields
- `fullDate`: ISO date string (YYYY-MM-DD)
- `year`, `month`, `day`: Numeric date components
- `nurseName`, `nurseId`: Nurse identification
- `workValue`: Numeric work value (0, 0.5, or 1)
- `workType`: Standardized work type code
- `shiftCode`: Original Chinese shift code

### Computed Fields
- `isHoliday`: Boolean - legal holiday
- `isWorkDay`: Boolean - has work value > 0
- `isRestDay`: Boolean - work value = 0
- `isNightShift`: Boolean - any night shift type
- `isDayShift`: Boolean - any day shift type
- `isLeave`: Boolean - sick/maternity leave
- `isWeekend`: Boolean - Saturday or Sunday
- `weekday`: English weekday name
- `weekdayNumber`: 0-6 (Sunday = 0)

## Error Handling

The converter includes robust error handling:
- Invalid CSV format detection
- Missing data validation
- Date parsing verification
- Automatic output directory creation

## Requirements

- Node.js
- CSV files in the expected format (see `csv/2014-04.csv` as example)

## File Structure Expected

```
csv/
  2014-04.csv    # Input file
output/          # Generated automatically
  2014-04_converted.json
  2014-04_statistics.json  
  2014-04_summary.csv
```