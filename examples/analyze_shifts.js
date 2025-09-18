const HospitalShiftConverter = require('../src/csvConverter');
const fs = require('fs');
const path = require('path');

/**
 * Example analysis functions for hospital shift data
 */
class ShiftAnalyzer {
    constructor(records) {
        this.records = records;
    }

    /**
     * Find nurses with highest workload
     * @param {number} limit - Number of top nurses to return
     * @returns {Array} Top nurses by work value
     */
    getTopWorkers(limit = 5) {
        const nurseWorkload = {};
        
        this.records.forEach(record => {
            const key = `${record.nurseId}-${record.nurseName}`;
            if (!nurseWorkload[key]) {
                nurseWorkload[key] = {
                    nurseId: record.nurseId,
                    nurseName: record.nurseName,
                    totalWorkValue: 0,
                    workDays: 0
                };
            }
            nurseWorkload[key].totalWorkValue += record.workValue;
            if (record.isWorkDay) nurseWorkload[key].workDays++;
        });

        return Object.values(nurseWorkload)
            .sort((a, b) => b.totalWorkValue - a.totalWorkValue)
            .slice(0, limit);
    }

    /**
     * Analyze weekend and holiday work patterns
     * @returns {Object} Weekend and holiday analysis
     */
    analyzeWeekendHolidayWork() {
        const analysis = {
            weekendWork: {},
            holidayWork: {},
            totalWeekendShifts: 0,
            totalHolidayShifts: 0
        };

        this.records.forEach(record => {
            const key = `${record.nurseId}-${record.nurseName}`;
            
            if (record.isWeekend && record.isWorkDay) {
                if (!analysis.weekendWork[key]) {
                    analysis.weekendWork[key] = {
                        nurseName: record.nurseName,
                        count: 0,
                        workValue: 0
                    };
                }
                analysis.weekendWork[key].count++;
                analysis.weekendWork[key].workValue += record.workValue;
                analysis.totalWeekendShifts++;
            }

            if (record.isHoliday && record.isWorkDay) {
                if (!analysis.holidayWork[key]) {
                    analysis.holidayWork[key] = {
                        nurseName: record.nurseName,
                        count: 0,
                        workValue: 0
                    };
                }
                analysis.holidayWork[key].count++;
                analysis.holidayWork[key].workValue += record.workValue;
                analysis.totalHolidayShifts++;
            }
        });

        return analysis;
    }

    /**
     * Find shift patterns for each nurse
     * @returns {Object} Shift patterns analysis
     */
    analyzeShiftPatterns() {
        const patterns = {};

        this.records.forEach(record => {
            const key = `${record.nurseId}-${record.nurseName}`;
            if (!patterns[key]) {
                patterns[key] = {
                    nurseName: record.nurseName,
                    consecutiveWork: 0,
                    consecutiveRest: 0,
                    maxConsecutiveWork: 0,
                    maxConsecutiveRest: 0,
                    shiftChanges: 0,
                    lastShiftType: null
                };
            }

            const pattern = patterns[key];
            
            if (record.isWorkDay) {
                pattern.consecutiveWork++;
                if (pattern.consecutiveRest > 0) {
                    pattern.maxConsecutiveRest = Math.max(pattern.maxConsecutiveRest, pattern.consecutiveRest);
                    pattern.consecutiveRest = 0;
                }
            } else {
                pattern.consecutiveRest++;
                if (pattern.consecutiveWork > 0) {
                    pattern.maxConsecutiveWork = Math.max(pattern.maxConsecutiveWork, pattern.consecutiveWork);
                    pattern.consecutiveWork = 0;
                }
            }

            if (pattern.lastShiftType && pattern.lastShiftType !== record.workType) {
                pattern.shiftChanges++;
            }
            pattern.lastShiftType = record.workType;
        });

        // Finalize max consecutive counts
        Object.values(patterns).forEach(pattern => {
            pattern.maxConsecutiveWork = Math.max(pattern.maxConsecutiveWork, pattern.consecutiveWork);
            pattern.maxConsecutiveRest = Math.max(pattern.maxConsecutiveRest, pattern.consecutiveRest);
        });

        return patterns;
    }

    /**
     * Generate monthly summary report
     * @returns {Object} Monthly summary
     */
    generateMonthlySummary() {
        const summary = {
            totalNurses: new Set(this.records.map(r => r.nurseId)).size,
            totalShifts: this.records.length,
            totalWorkValue: this.records.reduce((sum, r) => sum + r.workValue, 0),
            shiftTypeDistribution: {},
            workDaysByWeekday: {},
            averageWorkValuePerNurse: 0
        };

        // Count shift types
        this.records.forEach(record => {
            if (!summary.shiftTypeDistribution[record.shiftCode]) {
                summary.shiftTypeDistribution[record.shiftCode] = 0;
            }
            summary.shiftTypeDistribution[record.shiftCode]++;

            if (record.isWorkDay) {
                if (!summary.workDaysByWeekday[record.weekday]) {
                    summary.workDaysByWeekday[record.weekday] = 0;
                }
                summary.workDaysByWeekday[record.weekday]++;
            }
        });

        summary.averageWorkValuePerNurse = summary.totalWorkValue / summary.totalNurses;

        return summary;
    }
}

// Example usage
function runAnalysisExample() {
    console.log('=== Hospital Shift Analysis Example ===\n');

    // Load converted data
    const dataFile = path.join(__dirname, '..', 'output', '2014-04_converted.json');
    if (!fs.existsSync(dataFile)) {
        console.log('Please run the converter first: node src/csvConverter.js csv/2014-04.csv');
        return;
    }

    const records = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    const analyzer = new ShiftAnalyzer(records);

    // 1. Top workers
    console.log('📊 TOP 5 HARDEST WORKERS:');
    const topWorkers = analyzer.getTopWorkers(5);
    topWorkers.forEach((worker, index) => {
        console.log(`${index + 1}. ${worker.nurseName} - ${worker.totalWorkValue} work units (${worker.workDays} days)`);
    });

    // 2. Weekend and holiday analysis
    console.log('\n🏖️ WEEKEND & HOLIDAY WORK ANALYSIS:');
    const weekendHoliday = analyzer.analyzeWeekendHolidayWork();
    console.log(`Total weekend shifts: ${weekendHoliday.totalWeekendShifts}`);
    console.log(`Total holiday shifts: ${weekendHoliday.totalHolidayShifts}`);
    
    console.log('\nTop weekend workers:');
    Object.values(weekendHoliday.weekendWork)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .forEach((worker, index) => {
            console.log(`${index + 1}. ${worker.nurseName} - ${worker.count} weekend shifts`);
        });

    // 3. Shift patterns
    console.log('\n🔄 SHIFT PATTERN ANALYSIS:');
    const patterns = analyzer.analyzeShiftPatterns();
    Object.values(patterns)
        .sort((a, b) => b.maxConsecutiveWork - a.maxConsecutiveWork)
        .slice(0, 3)
        .forEach((pattern, index) => {
            console.log(`${index + 1}. ${pattern.nurseName} - Max ${pattern.maxConsecutiveWork} consecutive work days, ${pattern.shiftChanges} shift changes`);
        });

    // 4. Monthly summary
    console.log('\n📈 MONTHLY SUMMARY:');
    const summary = analyzer.generateMonthlySummary();
    console.log(`Total nurses: ${summary.totalNurses}`);
    console.log(`Total shifts recorded: ${summary.totalShifts}`);
    console.log(`Total work value: ${summary.totalWorkValue}`);
    console.log(`Average work value per nurse: ${summary.averageWorkValuePerNurse.toFixed(1)}`);
    
    console.log('\nShift type distribution:');
    Object.entries(summary.shiftTypeDistribution)
        .sort((a, b) => b[1] - a[1])
        .forEach(([type, count]) => {
            console.log(`  ${type}: ${count} times`);
        });

    console.log('\nWork days by weekday:');
    Object.entries(summary.workDaysByWeekday)
        .forEach(([day, count]) => {
            console.log(`  ${day}: ${count} work shifts`);
        });

    console.log('\n✅ Analysis complete! Check the output/ folder for detailed JSON and CSV files.');
}

// Run if called directly
if (require.main === module) {
    runAnalysisExample();
}

module.exports = ShiftAnalyzer;