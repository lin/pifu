const fs = require('fs');
const path = require('path');

class HospitalShiftConverter {
    constructor() {
        // Shift type mappings with work values and descriptions
        this.shiftTypes = {
            '休': { workValue: 0, workType: 'rest', description: 'Rest day' },
            '小': { workValue: 1, workType: 'night_shift_small', description: 'Night shift (small)' },
            '大': { workValue: 1, workType: 'night_shift_big', description: 'Night shift (big)' },
            '夜': { workValue: 1, workType: 'night_shift_whole', description: 'Night shift (whole)' },
            '白': { workValue: 1, workType: 'day_shift', description: 'Day shift' },
            '半': { workValue: 0.5, workType: 'day_shift_half', description: 'Day shift (half)' },
            '病假': { workValue: 0, workType: 'sick_leave', description: 'Sick leave' },
            '产假': { workValue: 0, workType: 'maternity_leave', description: 'Maternity leave' },
            '下': { workValue: 1, workType: 'night_shift_day', description: 'Night shift day (rest but counted as work)' },
            '公休日': { workValue: 0, workType: 'legal_holiday', description: 'Legal holiday' },
            '群力': { workValue: 0, workType: 'group_work', description: 'Group work (work day with 0 value)' },
            '哺乳半': { workValue: 0.5, workType: 'nursing_half', description: 'Nursing half shift (0.5 work value)' },
            '神内': { workValue: 0, workType: 'neurology_work', description: 'Neurology work (work day with 0 value)' }
        };

        // Weekday mappings
        this.weekdays = {
            '星期一': { english: 'Monday', number: 1 },
            '星期二': { english: 'Tuesday', number: 2 },
            '星期三': { english: 'Wednesday', number: 3 },
            '星期四': { english: 'Thursday', number: 4 },
            '星期五': { english: 'Friday', number: 5 },
            '星期六': { english: 'Saturday', number: 6 },
            '星期日': { english: 'Sunday', number: 0 }
        };
    }

    /**
     * Parse CSV file and convert to structured JSON
     * @param {string} csvFilePath - Path to the CSV file
     * @returns {Array} Array of shift records
     */
    convertCsvToJson(csvFilePath) {
        try {
            const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
            const lines = csvContent.trim().split('\n');
            
            if (lines.length < 4) {
                throw new Error('Invalid CSV format: insufficient rows');
            }

            // Extract year and month from filename (e.g., "2014-04.csv" -> year: 2014, month: 4)
            const filename = path.basename(csvFilePath, '.csv');
            const [year, month] = filename.split('-').map(Number);
            
            if (!year || !month) {
                throw new Error('Could not extract year/month from filename');
            }

            // Parse header rows
            const daysRow = lines[0].split(',').slice(2); // Skip first two columns
            const weekdaysRow = lines[1].split(',').slice(2);
            const holidaysRow = lines[2].split(',').slice(2);

            // Validate that we have the expected number of days
            const daysInMonth = new Date(year, month, 0).getDate();
            if (daysRow.length !== daysInMonth) {
                console.warn(`Warning: Expected ${daysInMonth} days but found ${daysRow.length} columns`);
            }

            const results = [];

            // Process each nurse (starting from row 4, index 3)
            for (let i = 3; i < lines.length; i++) {
                const row = lines[i].split(',');
                if (row.length < 3) continue; // Skip invalid rows

                const nurseId = parseInt(row[0]) || null;
                const nurseName = row[1] || '';
                
                // Skip if no nurse ID or name
                if (!nurseId || !nurseName.trim()) continue;

                // Process each day for this nurse
                for (let dayIndex = 0; dayIndex < daysRow.length; dayIndex++) {
                    const day = parseInt(daysRow[dayIndex]);
                    if (!day || day < 1 || day > 31) continue;

                    const shiftValue = row[dayIndex + 2] || ''; // +2 to skip ID and name columns
                    if (!shiftValue.trim()) continue; // Skip empty cells

                    const weekdayText = weekdaysRow[dayIndex] || '';
                    const isHoliday = (holidaysRow[dayIndex] || '').trim() === 'Y';
                    
                    // Get shift information
                    const shiftInfo = this.shiftTypes[shiftValue] || {
                        workValue: 0,
                        workType: 'unknown',
                        description: `Unknown shift type: ${shiftValue}`
                    };

                    // Get weekday information
                    const weekdayInfo = this.weekdays[weekdayText] || {
                        english: 'Unknown',
                        number: -1
                    };

                    // Create full date
                    const fullDate = new Date(year, month - 1, day);
                    const dateString = fullDate.toISOString().split('T')[0];

                    // Create record
                    const record = {
                        fullDate: dateString,
                        dateObject: fullDate,
                        year: year,
                        month: month,
                        day: day,
                        isHoliday: isHoliday,
                        nurseName: nurseName.trim(),
                        nurseId: nurseId,
                        workValue: shiftInfo.workValue,
                        workType: shiftInfo.workType,
                        shiftCode: shiftValue,
                        weekday: weekdayInfo.english,
                        weekdayNumber: weekdayInfo.number,
                        weekdayText: weekdayText,
                        description: shiftInfo.description,
                        isWorkDay: shiftInfo.workValue > 0,
                        isRestDay: shiftInfo.workValue === 0,
                        isNightShift: shiftInfo.workType.includes('night'),
                        isDayShift: shiftInfo.workType.includes('day'),
                        isLeave: shiftInfo.workType.includes('leave'),
                        isWeekend: weekdayInfo.number === 0 || weekdayInfo.number === 6
                    };

                    results.push(record);
                }
            }

            return results;
        } catch (error) {
            console.error('Error converting CSV:', error.message);
            throw error;
        }
    }

    /**
     * Generate statistics for each person
     * @param {Array} records - Array of shift records
     * @returns {Object} Statistics by person
     */
    generatePersonStatistics(records) {
        const stats = {};

        records.forEach(record => {
            const key = `${record.nurseId}-${record.nurseName}`;
            
            if (!stats[key]) {
                stats[key] = {
                    nurseId: record.nurseId,
                    nurseName: record.nurseName,
                    totalDays: 0,
                    workDays: 0,
                    restDays: 0,
                    totalWorkValue: 0,
                    nightShifts: 0,
                    dayShifts: 0,
                    halfShifts: 0,
                    sickLeave: 0,
                    maternityLeave: 0,
                    holidayWork: 0,
                    weekendWork: 0,
                    shiftTypes: {}
                };
            }

            const personStats = stats[key];
            personStats.totalDays++;
            personStats.totalWorkValue += record.workValue;

            if (record.isWorkDay) {
                personStats.workDays++;
            } else {
                personStats.restDays++;
            }

            if (record.isNightShift) {
                personStats.nightShifts++;
            } else if (record.isDayShift) {
                personStats.dayShifts++;
            }

            if (record.workValue === 0.5) {
                personStats.halfShifts++;
            }

            if (record.workType === 'sick_leave') {
                personStats.sickLeave++;
            } else if (record.workType === 'maternity_leave') {
                personStats.maternityLeave++;
            }

            if (record.isHoliday && record.isWorkDay) {
                personStats.holidayWork++;
            }

            if (record.isWeekend && record.isWorkDay) {
                personStats.weekendWork++;
            }

            // Count shift types
            if (!personStats.shiftTypes[record.shiftCode]) {
                personStats.shiftTypes[record.shiftCode] = 0;
            }
            personStats.shiftTypes[record.shiftCode]++;
        });

        return stats;
    }

    /**
     * Save results to JSON file
     * @param {string} inputCsvPath - Original CSV file path
     * @param {Array} records - Converted records
     * @param {Object} statistics - Person statistics
     */
    saveResults(inputCsvPath, records, statistics) {
        const baseFilename = path.basename(inputCsvPath, '.csv');
        const outputDir = path.join(path.dirname(inputCsvPath), '..', 'output');
        
        // Create output directory if it doesn't exist
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Save detailed records
        const recordsFile = path.join(outputDir, `${baseFilename}_converted.json`);
        fs.writeFileSync(recordsFile, JSON.stringify(records, null, 2));
        console.log(`Detailed records saved to: ${recordsFile}`);

        // Save statistics
        const statsFile = path.join(outputDir, `${baseFilename}_statistics.json`);
        fs.writeFileSync(statsFile, JSON.stringify(statistics, null, 2));
        console.log(`Statistics saved to: ${statsFile}`);

        // Save summary CSV for easy viewing
        const csvLines = ['Nurse ID,Nurse Name,Total Days,Work Days,Rest Days,Total Work Value,Night Shifts,Day Shifts,Half Shifts,Sick Leave,Holiday Work,Weekend Work'];
        Object.values(statistics).forEach(stat => {
            csvLines.push([
                stat.nurseId,
                stat.nurseName,
                stat.totalDays,
                stat.workDays,
                stat.restDays,
                stat.totalWorkValue,
                stat.nightShifts,
                stat.dayShifts,
                stat.halfShifts,
                stat.sickLeave,
                stat.holidayWork,
                stat.weekendWork
            ].join(','));
        });

        const summaryFile = path.join(outputDir, `${baseFilename}_summary.csv`);
        fs.writeFileSync(summaryFile, csvLines.join('\n'));
        console.log(`Summary CSV saved to: ${summaryFile}`);

        return {
            recordsFile,
            statsFile,
            summaryFile,
            totalRecords: records.length,
            totalNurses: Object.keys(statistics).length
        };
    }

    /**
     * Main conversion function
     * @param {string} csvFilePath - Path to CSV file to convert
     * @returns {Object} Conversion results
     */
    convert(csvFilePath) {
        console.log(`Converting ${csvFilePath}...`);
        
        const records = this.convertCsvToJson(csvFilePath);
        const statistics = this.generatePersonStatistics(records);
        const results = this.saveResults(csvFilePath, records, statistics);
        
        console.log(`\nConversion completed:`);
        console.log(`- Total records: ${results.totalRecords}`);
        console.log(`- Total nurses: ${results.totalNurses}`);
        console.log(`- Files created: ${Object.keys(results).filter(k => k.endsWith('File')).length}`);
        
        return {
            records,
            statistics,
            files: results
        };
    }
}

// Export for use as module
module.exports = HospitalShiftConverter;

// CLI usage
if (require.main === module) {
    const csvFile = process.argv[2];
    if (!csvFile) {
        console.log('Usage: node csvConverter.js <csv-file-path>');
        console.log('Example: node csvConverter.js csv/2014-04.csv');
        process.exit(1);
    }

    const converter = new HospitalShiftConverter();
    try {
        converter.convert(csvFile);
    } catch (error) {
        console.error('Conversion failed:', error.message);
        process.exit(1);
    }
}