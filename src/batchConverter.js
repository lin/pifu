const HospitalShiftConverter = require('./csvConverter');
const fs = require('fs');
const path = require('path');

class BatchShiftConverter {
    constructor() {
        this.converter = new HospitalShiftConverter();
        this.csvDir = path.join(__dirname, '..', 'csv');
        this.outputDir = path.join(__dirname, '..', 'output');
    }

    /**
     * Generate list of expected CSV files from start date to end date
     * @param {string} startDate - Format: "YYYY-MM" (e.g., "2014-04")
     * @param {string} endDate - Format: "YYYY-MM" (e.g., "2020-01")
     * @returns {Array} Array of expected filenames
     */
    generateFileList(startDate, endDate) {
        const files = [];
        const [startYear, startMonth] = startDate.split('-').map(Number);
        const [endYear, endMonth] = endDate.split('-').map(Number);

        let currentYear = startYear;
        let currentMonth = startMonth;

        while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
            const monthStr = currentMonth.toString().padStart(2, '0');
            files.push(`${currentYear}-${monthStr}.csv`);

            currentMonth++;
            if (currentMonth > 12) {
                currentMonth = 1;
                currentYear++;
            }
        }

        return files;
    }

    /**
     * Check which files exist and which are missing
     * @param {Array} expectedFiles - List of expected filenames
     * @returns {Object} Object with existing and missing files
     */
    checkFileAvailability(expectedFiles) {
        const existing = [];
        const missing = [];

        expectedFiles.forEach(filename => {
            const filePath = path.join(this.csvDir, filename);
            if (fs.existsSync(filePath)) {
                existing.push(filename);
            } else {
                missing.push(filename);
            }
        });

        return { existing, missing };
    }

    /**
     * Convert a single CSV file and return the records
     * @param {string} filename - CSV filename
     * @returns {Array} Array of shift records
     */
    convertSingleFile(filename) {
        try {
            const filePath = path.join(this.csvDir, filename);
            console.log(`Processing ${filename}...`);
            
            const records = this.converter.convertCsvToJson(filePath);
            console.log(`  ✓ Converted ${records.length} records`);
            
            return records;
        } catch (error) {
            console.error(`  ✗ Error processing ${filename}: ${error.message}`);
            return [];
        }
    }

    /**
     * Convert all files in the date range and combine into single database
     * @param {string} startDate - Format: "YYYY-MM"
     * @param {string} endDate - Format: "YYYY-MM"
     * @returns {Object} Combined database with metadata
     */
    convertDateRange(startDate, endDate) {
        console.log(`\n🏥 Hospital Shift Batch Converter`);
        console.log(`📅 Converting files from ${startDate} to ${endDate}\n`);

        // Generate expected file list
        const expectedFiles = this.generateFileList(startDate, endDate);
        console.log(`Expected ${expectedFiles.length} files in date range`);

        // Check file availability
        const { existing, missing } = this.checkFileAvailability(expectedFiles);
        console.log(`Found ${existing.length} files, ${missing.length} missing`);

        if (missing.length > 0) {
            console.log(`\n⚠️  Missing files:`);
            missing.forEach(file => console.log(`   - ${file}`));
        }

        if (existing.length === 0) {
            throw new Error('No CSV files found in the specified date range');
        }

        console.log(`\n🔄 Processing ${existing.length} files...\n`);

        // Convert all existing files
        const allRecords = [];
        const fileStats = [];
        let totalProcessed = 0;
        let totalErrors = 0;

        existing.forEach((filename, index) => {
            try {
                const records = this.convertSingleFile(filename);
                
                if (records.length > 0) {
                    allRecords.push(...records);
                    fileStats.push({
                        filename,
                        recordCount: records.length,
                        status: 'success'
                    });
                    totalProcessed++;
                } else {
                    fileStats.push({
                        filename,
                        recordCount: 0,
                        status: 'empty'
                    });
                }
            } catch (error) {
                console.error(`Error processing ${filename}: ${error.message}`);
                fileStats.push({
                    filename,
                    recordCount: 0,
                    status: 'error',
                    error: error.message
                });
                totalErrors++;
            }

            // Progress indicator
            const progress = Math.round(((index + 1) / existing.length) * 100);
            if ((index + 1) % 5 === 0 || index === existing.length - 1) {
                console.log(`Progress: ${progress}% (${index + 1}/${existing.length} files)`);
            }
        });

        // Sort records by date for chronological order
        console.log(`\n📊 Sorting ${allRecords.length} records chronologically...`);
        allRecords.sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));

        // Generate comprehensive statistics
        const statistics = this.generateCombinedStatistics(allRecords);
        const metadata = this.generateMetadata(startDate, endDate, fileStats, allRecords);

        console.log(`\n✅ Batch conversion completed!`);
        console.log(`   📁 Files processed: ${totalProcessed}/${existing.length}`);
        console.log(`   📊 Total records: ${allRecords.length}`);
        console.log(`   👥 Unique nurses: ${statistics.uniqueNurses}`);
        console.log(`   📅 Date range: ${metadata.actualDateRange.start} to ${metadata.actualDateRange.end}`);

        return {
            records: allRecords,
            statistics,
            metadata,
            fileStats
        };
    }

    /**
     * Generate comprehensive statistics for the combined database
     * @param {Array} allRecords - All shift records
     * @returns {Object} Combined statistics
     */
    generateCombinedStatistics(allRecords) {
        const stats = {
            totalRecords: allRecords.length,
            uniqueNurses: 0,
            totalWorkValue: 0,
            dateRange: { start: null, end: null },
            yearlyBreakdown: {},
            nurseStatistics: {},
            shiftTypeDistribution: {},
            workPatterns: {
                totalWorkDays: 0,
                totalRestDays: 0,
                nightShifts: 0,
                dayShifts: 0,
                weekendWork: 0,
                holidayWork: 0
            }
        };

        // Process each record
        allRecords.forEach(record => {
            // Basic totals
            stats.totalWorkValue += record.workValue;
            
            // Date range
            if (!stats.dateRange.start || record.fullDate < stats.dateRange.start) {
                stats.dateRange.start = record.fullDate;
            }
            if (!stats.dateRange.end || record.fullDate > stats.dateRange.end) {
                stats.dateRange.end = record.fullDate;
            }

            // Yearly breakdown
            const year = record.year;
            if (!stats.yearlyBreakdown[year]) {
                stats.yearlyBreakdown[year] = {
                    records: 0,
                    workValue: 0,
                    nurses: new Set()
                };
            }
            stats.yearlyBreakdown[year].records++;
            stats.yearlyBreakdown[year].workValue += record.workValue;
            stats.yearlyBreakdown[year].nurses.add(record.nurseId);

            // Nurse statistics
            const nurseKey = `${record.nurseId}-${record.nurseName}`;
            if (!stats.nurseStatistics[nurseKey]) {
                stats.nurseStatistics[nurseKey] = {
                    nurseId: record.nurseId,
                    nurseName: record.nurseName,
                    totalRecords: 0,
                    totalWorkValue: 0,
                    workDays: 0,
                    restDays: 0,
                    firstAppearance: record.fullDate,
                    lastAppearance: record.fullDate,
                    yearsActive: new Set()
                };
            }

            const nurseStats = stats.nurseStatistics[nurseKey];
            nurseStats.totalRecords++;
            nurseStats.totalWorkValue += record.workValue;
            nurseStats.yearsActive.add(record.year);
            
            if (record.fullDate < nurseStats.firstAppearance) {
                nurseStats.firstAppearance = record.fullDate;
            }
            if (record.fullDate > nurseStats.lastAppearance) {
                nurseStats.lastAppearance = record.fullDate;
            }

            if (record.isWorkDay) {
                nurseStats.workDays++;
                stats.workPatterns.totalWorkDays++;
            } else {
                nurseStats.restDays++;
                stats.workPatterns.totalRestDays++;
            }

            // Shift type distribution
            if (!stats.shiftTypeDistribution[record.shiftCode]) {
                stats.shiftTypeDistribution[record.shiftCode] = 0;
            }
            stats.shiftTypeDistribution[record.shiftCode]++;

            // Work patterns
            if (record.isNightShift) stats.workPatterns.nightShifts++;
            if (record.isDayShift) stats.workPatterns.dayShifts++;
            if (record.isWeekend && record.isWorkDay) stats.workPatterns.weekendWork++;
            if (record.isHoliday && record.isWorkDay) stats.workPatterns.holidayWork++;
        });

        // Convert nurse years active sets to counts
        Object.values(stats.nurseStatistics).forEach(nurseStats => {
            nurseStats.yearsActiveCount = nurseStats.yearsActive.size;
            delete nurseStats.yearsActive; // Remove Set for JSON serialization
        });

        // Convert yearly nurse sets to counts
        Object.values(stats.yearlyBreakdown).forEach(yearStats => {
            yearStats.uniqueNurses = yearStats.nurses.size;
            delete yearStats.nurses; // Remove Set for JSON serialization
        });

        stats.uniqueNurses = Object.keys(stats.nurseStatistics).length;

        return stats;
    }

    /**
     * Generate metadata about the conversion process
     * @param {string} startDate - Requested start date
     * @param {string} endDate - Requested end date
     * @param {Array} fileStats - File processing statistics
     * @param {Array} allRecords - All records
     * @returns {Object} Metadata
     */
    generateMetadata(startDate, endDate, fileStats, allRecords) {
        const actualDates = allRecords.map(r => r.fullDate);
        
        return {
            conversionDate: new Date().toISOString(),
            requestedDateRange: { start: startDate, end: endDate },
            actualDateRange: {
                start: Math.min(...actualDates),
                end: Math.max(...actualDates)
            },
            filesProcessed: fileStats.length,
            filesSuccessful: fileStats.filter(f => f.status === 'success').length,
            filesWithErrors: fileStats.filter(f => f.status === 'error').length,
            filesEmpty: fileStats.filter(f => f.status === 'empty').length,
            fileDetails: fileStats,
            converterVersion: "1.0.0"
        };
    }

    /**
     * Save the combined database to files
     * @param {Object} database - Complete database object
     * @param {string} startDate - Start date for filename
     * @param {string} endDate - End date for filename
     */
    saveCombinedDatabase(database, startDate, endDate) {
        // Ensure output directory exists
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }

        const baseFilename = `hospital_shifts_${startDate}_to_${endDate}`;
        
        // Save complete database
        const databaseFile = path.join(this.outputDir, `${baseFilename}_database.json`);
        fs.writeFileSync(databaseFile, JSON.stringify(database, null, 2));
        console.log(`💾 Complete database saved: ${databaseFile}`);

        // Save records only (for lighter loading)
        const recordsFile = path.join(this.outputDir, `${baseFilename}_records.json`);
        fs.writeFileSync(recordsFile, JSON.stringify(database.records, null, 2));
        console.log(`📊 Records array saved: ${recordsFile}`);

        // Save statistics summary
        const statsFile = path.join(this.outputDir, `${baseFilename}_statistics.json`);
        fs.writeFileSync(statsFile, JSON.stringify(database.statistics, null, 2));
        console.log(`📈 Statistics saved: ${statsFile}`);

        // Save metadata
        const metadataFile = path.join(this.outputDir, `${baseFilename}_metadata.json`);
        fs.writeFileSync(metadataFile, JSON.stringify(database.metadata, null, 2));
        console.log(`ℹ️  Metadata saved: ${metadataFile}`);

        return {
            databaseFile,
            recordsFile,
            statsFile,
            metadataFile
        };
    }

    /**
     * Main batch conversion function
     * @param {string} startDate - Start date (YYYY-MM)
     * @param {string} endDate - End date (YYYY-MM)
     * @returns {Object} Complete conversion results
     */
    convertBatch(startDate = "2014-04", endDate = "2020-01") {
        try {
            const database = this.convertDateRange(startDate, endDate);
            const files = this.saveCombinedDatabase(database, startDate, endDate);
            
            console.log(`\n🎉 Batch conversion completed successfully!`);
            console.log(`📁 Output files created: ${Object.keys(files).length}`);
            
            return {
                ...database,
                outputFiles: files
            };
        } catch (error) {
            console.error(`❌ Batch conversion failed: ${error.message}`);
            throw error;
        }
    }
}

// Export for use as module
module.exports = BatchShiftConverter;

// CLI usage
if (require.main === module) {
    const startDate = process.argv[2] || "2014-04";
    const endDate = process.argv[3] || "2020-01";
    
    console.log(`Starting batch conversion from ${startDate} to ${endDate}...`);
    
    const batchConverter = new BatchShiftConverter();
    try {
        batchConverter.convertBatch(startDate, endDate);
    } catch (error) {
        console.error('Batch conversion failed:', error.message);
        process.exit(1);
    }
}