const fs = require('fs');
const path = require('path');

/**
 * Comprehensive analysis of the complete hospital shift database
 * Analyzes data from April 2014 to January 2020
 */
class CompleteDatabaseAnalyzer {
    constructor() {
        this.databaseFile = path.join(__dirname, '..', 'output', 'hospital_shifts_2014-04_to_2020-01_database.json');
        this.database = null;
    }

    /**
     * Load the complete database
     */
    loadDatabase() {
        if (!fs.existsSync(this.databaseFile)) {
            throw new Error('Database file not found. Please run the batch converter first.');
        }

        console.log('📊 Loading complete hospital shift database...');
        this.database = JSON.parse(fs.readFileSync(this.databaseFile, 'utf-8'));
        console.log(`✅ Loaded ${this.database.records.length} records for ${this.database.statistics.uniqueNurses} nurses`);
        return this.database;
    }

    /**
     * Generate comprehensive insights from the complete dataset
     */
    generateInsights() {
        if (!this.database) {
            this.loadDatabase();
        }

        const { records, statistics } = this.database;

        console.log('\n🏥 ===== COMPLETE HOSPITAL SHIFT DATABASE ANALYSIS =====');
        console.log(`📅 Period: April 2014 - January 2020 (${(2020 - 2014)} years)`);
        console.log(`📊 Total Records: ${records.length.toLocaleString()}`);
        console.log(`👥 Unique Nurses: ${statistics.uniqueNurses}`);
        console.log(`💼 Total Work Value: ${statistics.totalWorkValue.toLocaleString()}`);

        this.analyzeYearlyTrends();
        this.analyzeTopPerformers();
        this.analyzeWorkPatterns();
        this.analyzeNurseCareerSpans();
        this.analyzeShiftDistribution();
        this.analyzeSeasonalPatterns();
    }

    /**
     * Analyze yearly trends
     */
    analyzeYearlyTrends() {
        console.log('\n📈 YEARLY TRENDS:');
        const yearly = this.database.statistics.yearlyBreakdown;
        
        Object.entries(yearly).forEach(([year, data]) => {
            const avgWorkPerNurse = (data.workValue / data.uniqueNurses).toFixed(1);
            const avgRecordsPerNurse = (data.records / data.uniqueNurses).toFixed(1);
            
            console.log(`${year}: ${data.records} records, ${data.workValue} work units, ${data.uniqueNurses} nurses`);
            console.log(`      → Avg ${avgWorkPerNurse} work units/nurse, ${avgRecordsPerNurse} records/nurse`);
        });
    }

    /**
     * Analyze top performers across the entire period
     */
    analyzeTopPerformers() {
        console.log('\n🏆 TOP PERFORMERS (2014-2020):');
        const nurses = Object.values(this.database.statistics.nurseStatistics)
            .sort((a, b) => b.totalWorkValue - a.totalWorkValue)
            .slice(0, 5);

        nurses.forEach((nurse, index) => {
            const avgWorkPerDay = (nurse.totalWorkValue / nurse.totalRecords).toFixed(2);
            const workPercentage = ((nurse.workDays / nurse.totalRecords) * 100).toFixed(1);
            
            console.log(`${index + 1}. ${nurse.nurseName}`);
            console.log(`   📊 ${nurse.totalWorkValue} total work units over ${nurse.totalRecords} days`);
            console.log(`   💪 ${nurse.workDays} work days (${workPercentage}% of time)`);
            console.log(`   📅 Active: ${nurse.firstAppearance} → ${nurse.lastAppearance} (${nurse.yearsActiveCount} years)`);
            console.log(`   ⚡ Avg ${avgWorkPerDay} work units/day`);
        });
    }

    /**
     * Analyze work patterns
     */
    analyzeWorkPatterns() {
        console.log('\n🔄 WORK PATTERNS:');
        const patterns = this.database.statistics.workPatterns;
        const totalDays = patterns.totalWorkDays + patterns.totalRestDays;
        
        console.log(`Total Work Days: ${patterns.totalWorkDays.toLocaleString()} (${((patterns.totalWorkDays/totalDays)*100).toFixed(1)}%)`);
        console.log(`Total Rest Days: ${patterns.totalRestDays.toLocaleString()} (${((patterns.totalRestDays/totalDays)*100).toFixed(1)}%)`);
        console.log(`Night Shifts: ${patterns.nightShifts.toLocaleString()}`);
        console.log(`Day Shifts: ${patterns.dayShifts.toLocaleString()}`);
        console.log(`Weekend Work: ${patterns.weekendWork.toLocaleString()} shifts`);
        console.log(`Holiday Work: ${patterns.holidayWork.toLocaleString()} shifts`);
    }

    /**
     * Analyze nurse career spans
     */
    analyzeNurseCareerSpans() {
        console.log('\n👩‍⚕️ NURSE CAREER ANALYSIS:');
        const nurses = Object.values(this.database.statistics.nurseStatistics);
        
        // Calculate career lengths
        const careerLengths = nurses.map(nurse => {
            const start = new Date(nurse.firstAppearance);
            const end = new Date(nurse.lastAppearance);
            const daysSpan = (end - start) / (1000 * 60 * 60 * 24);
            return {
                name: nurse.nurseName,
                daysSpan,
                yearsSpan: (daysSpan / 365.25).toFixed(1),
                totalRecords: nurse.totalRecords,
                workValue: nurse.totalWorkValue
            };
        }).sort((a, b) => b.daysSpan - a.daysSpan);

        console.log('Longest serving nurses:');
        careerLengths.slice(0, 5).forEach((nurse, index) => {
            console.log(`${index + 1}. ${nurse.name}: ${nurse.yearsSpan} years (${nurse.totalRecords} total days, ${nurse.workValue} work units)`);
        });

        const avgCareerLength = careerLengths.reduce((sum, n) => sum + parseFloat(n.yearsSpan), 0) / careerLengths.length;
        console.log(`\nAverage career span: ${avgCareerLength.toFixed(1)} years`);
    }

    /**
     * Analyze shift type distribution
     */
    analyzeShiftDistribution() {
        console.log('\n📋 SHIFT TYPE DISTRIBUTION:');
        const distribution = this.database.statistics.shiftTypeDistribution;
        const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
        
        // Sort by frequency
        const sorted = Object.entries(distribution)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10); // Top 10 shift types

        sorted.forEach(([shiftType, count]) => {
            const percentage = ((count / total) * 100).toFixed(1);
            console.log(`${shiftType || 'Empty'}: ${count.toLocaleString()} (${percentage}%)`);
        });
    }

    /**
     * Analyze seasonal patterns by extracting month data
     */
    analyzeSeasonalPatterns() {
        console.log('\n🌸 SEASONAL WORK PATTERNS:');
        
        // Group records by month
        const monthlyWork = {};
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // Initialize months
        monthNames.forEach(month => {
            monthlyWork[month] = { workDays: 0, totalDays: 0, workValue: 0 };
        });

        this.database.records.forEach(record => {
            const month = monthNames[record.month - 1];
            monthlyWork[month].totalDays++;
            monthlyWork[month].workValue += record.workValue;
            if (record.isWorkDay) {
                monthlyWork[month].workDays++;
            }
        });

        console.log('Average work intensity by month:');
        monthNames.forEach(month => {
            const data = monthlyWork[month];
            const workRate = data.totalDays > 0 ? (data.workDays / data.totalDays * 100).toFixed(1) : 0;
            const avgWorkValue = data.totalDays > 0 ? (data.workValue / data.totalDays).toFixed(2) : 0;
            
            console.log(`${month}: ${workRate}% work rate, ${avgWorkValue} avg work value/day (${data.totalDays} total days)`);
        });
    }

    /**
     * Generate summary report
     */
    generateSummaryReport() {
        console.log('\n📄 EXECUTIVE SUMMARY:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const { statistics } = this.database;
        const avgWorkPerNurse = (statistics.totalWorkValue / statistics.uniqueNurses).toFixed(1);
        const avgRecordsPerNurse = (statistics.totalRecords / statistics.uniqueNurses).toFixed(0);
        
        console.log(`• Analyzed ${statistics.totalRecords.toLocaleString()} shift records across ${statistics.uniqueNurses} nurses`);
        console.log(`• Total work value: ${statistics.totalWorkValue.toLocaleString()} units`);
        console.log(`• Average work per nurse: ${avgWorkPerNurse} units`);
        console.log(`• Average records per nurse: ${avgRecordsPerNurse} days`);
        console.log(`• Data spans from ${statistics.dateRange.start} to ${statistics.dateRange.end}`);
        
        const workRate = (statistics.workPatterns.totalWorkDays / 
                         (statistics.workPatterns.totalWorkDays + statistics.workPatterns.totalRestDays) * 100).toFixed(1);
        console.log(`• Overall work rate: ${workRate}% of all recorded days`);
        
        console.log('\n🎯 This comprehensive database enables detailed analysis of:');
        console.log('  - Individual nurse performance and career progression');
        console.log('  - Seasonal and yearly workload trends');
        console.log('  - Shift pattern optimization');
        console.log('  - Resource allocation and planning');
        console.log('  - Compliance and overtime tracking');
    }
}

// Run analysis if called directly
if (require.main === module) {
    const analyzer = new CompleteDatabaseAnalyzer();
    try {
        analyzer.generateInsights();
        analyzer.generateSummaryReport();
    } catch (error) {
        console.error('❌ Analysis failed:', error.message);
        process.exit(1);
    }
}

module.exports = CompleteDatabaseAnalyzer;