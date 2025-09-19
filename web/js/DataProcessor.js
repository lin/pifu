/**
 * 数据处理器 - 负责处理和计算医院排班数据
 */
class DataProcessor {
    constructor(database) {
        this.database = database;
        this.monthlyData = {};
        this.personData = {};
        this.monthlySummaryData = {}; // 每个护士每个月的汇总数据
    }

    /**
     * 处理所有数据
     */
    processData() {
        this.processMonthlyData();
        this.processPersonData();
        this.generateMonthlySummaryData();
    }

    /**
     * 处理月度统计数据
     */
    processMonthlyData() {
        const monthlyStats = {};

        // Group records by year-month
        this.database.records.forEach(record => {
            const monthKey = `${record.year}-${String(record.month).padStart(2, '0')}`;
            
            if (!monthlyStats[monthKey]) {
                monthlyStats[monthKey] = {
                    year: record.year,
                    month: record.month,
                    monthName: this.getMonthName(record.month),
                    totalDays: 0,
                    legalHolidays: 0,
                    nurses: {}
                };
            }

            const monthData = monthlyStats[monthKey];
            const nurseKey = `${record.nurseId}-${record.nurseName}`;

            if (!monthData.nurses[nurseKey]) {
                monthData.nurses[nurseKey] = {
                    nurseId: record.nurseId,
                    nurseName: record.nurseName,
                    totalDays: 0,
                    workDays: 0,
                    restDays: 0,
                    workValue: 0,
                    holidayWork: 0,
                    weekendWork: 0,
                    nightShifts: 0,
                    dayShifts: 0,
                    sickLeave: 0,
                    maternityLeave: 0,
                    shiftTypes: {}
                };
            }

            const nurseData = monthData.nurses[nurseKey];
            
            // Count total days in month and holidays
            monthData.totalDays = Math.max(monthData.totalDays, record.day);
            if (record.isHoliday) {
                // Count holidays per nurse (some nurses might not have records on certain days)
                if (!monthData.nurseHolidays) {
                    monthData.nurseHolidays = {};
                }
                if (!monthData.nurseHolidays[nurseKey]) {
                    monthData.nurseHolidays[nurseKey] = 0;
                }
                monthData.nurseHolidays[nurseKey]++;
            }

            // Update nurse statistics
            nurseData.totalDays++;
            nurseData.workValue += record.workValue;
            
            if (record.isWorkDay) {
                nurseData.workDays++;
            } else {
                nurseData.restDays++;
            }

            if (record.isHoliday && record.isWorkDay) {
                nurseData.holidayWork++;
            }

            if (record.isWeekend && record.isWorkDay) {
                nurseData.weekendWork++;
            }

            if (record.isNightShift) {
                nurseData.nightShifts++;
            } else if (record.isDayShift) {
                nurseData.dayShifts++;
            }

            if (record.workType === 'sick_leave') {
                nurseData.sickLeave++;
            } else if (record.workType === 'maternity_leave') {
                nurseData.maternityLeave++;
            }

            // Count shift types
            if (!nurseData.shiftTypes[record.shiftCode]) {
                nurseData.shiftTypes[record.shiftCode] = 0;
            }
            nurseData.shiftTypes[record.shiftCode]++;
        });

        // Calculate legal workday count and saved rest days for each nurse
        Object.keys(monthlyStats).forEach(monthKey => {
            const monthData = monthlyStats[monthKey];
            
            Object.keys(monthData.nurses).forEach(nurseKey => {
                const nurseData = monthData.nurses[nurseKey];
                // 每个护士的法定工作日 = 该护士在职天数 - 该护士的法定假日天数
                const nurseHolidays = monthData.nurseHolidays && monthData.nurseHolidays[nurseKey] ? monthData.nurseHolidays[nurseKey] : 0;
                nurseData.legalWorkdayCount = nurseData.totalDays - nurseHolidays;
                // 存假 = 上班天数(workValue) - 法定工作日
                nurseData.savedRestDays = nurseData.workValue - nurseData.legalWorkdayCount;
                nurseData.workRate = nurseData.legalWorkdayCount > 0 ? (nurseData.workValue / nurseData.legalWorkdayCount * 100).toFixed(1) : 0;
            });
        });

        this.monthlyData = monthlyStats;
    }

    /**
     * 处理个人数据
     */
    processPersonData() {
        const personStats = {};

        this.database.records.forEach(record => {
            const nurseKey = `${record.nurseId}-${record.nurseName}`;
            
            if (!personStats[nurseKey]) {
                personStats[nurseKey] = {
                    nurseId: record.nurseId,
                    nurseName: record.nurseName,
                    years: {},
                    totalRecords: 0,
                    totalWorkValue: 0,
                    firstDate: record.fullDate,
                    lastDate: record.fullDate,
                    yearsActive: new Set()
                };
            }

            const personData = personStats[nurseKey];
            personData.totalRecords++;
            personData.totalWorkValue += record.workValue;
            personData.yearsActive.add(record.year);
            
            if (record.fullDate < personData.firstDate) {
                personData.firstDate = record.fullDate;
            }
            if (record.fullDate > personData.lastDate) {
                personData.lastDate = record.fullDate;
            }

            // Group by year
            if (!personData.years[record.year]) {
                personData.years[record.year] = {
                    months: {},
                    totalRecords: 0,
                    totalWorkValue: 0
                };
            }

            const yearData = personData.years[record.year];
            yearData.totalRecords++;
            yearData.totalWorkValue += record.workValue;

            // Group by month within year
            const monthKey = record.month;
            if (!yearData.months[monthKey]) {
                yearData.months[monthKey] = {
                    monthName: this.getMonthName(record.month),
                    days: {},
                    totalDays: 0,
                    workDays: 0,
                    workValue: 0
                };
            }

            const monthData = yearData.months[monthKey];
            monthData.totalDays++;
            monthData.workValue += record.workValue;
            if (record.isWorkDay) {
                monthData.workDays++;
            }

            // Store individual day data
            monthData.days[record.day] = {
                date: record.fullDate,
                weekday: record.weekday,
                isHoliday: record.isHoliday,
                isWeekend: record.isWeekend,
                workValue: record.workValue,
                workType: record.workType,
                shiftCode: record.shiftCode,
                description: record.description,
                isWorkDay: record.isWorkDay
            };
        });

        // Convert sets to counts for JSON serialization
        Object.values(personStats).forEach(person => {
            person.yearsActiveCount = person.yearsActive.size;
            delete person.yearsActive;
        });

        this.personData = personStats;
    }

    /**
     * 生成月度汇总数据 - 为每个护士的每个月计算关键统计
     */
    generateMonthlySummaryData() {
        this.monthlySummaryData = {};

        // 遍历所有月度数据
        Object.keys(this.monthlyData).forEach(monthKey => {
            const monthData = this.monthlyData[monthKey];
            const [year, month] = monthKey.split('-');

            // 遍历该月的所有护士
            Object.keys(monthData.nurses).forEach(nurseKey => {
                const nurseData = monthData.nurses[nurseKey];
                
                // 初始化护士数据结构
                if (!this.monthlySummaryData[nurseKey]) {
                    this.monthlySummaryData[nurseKey] = {
                        nurseId: nurseData.nurseId,
                        nurseName: nurseData.nurseName,
                        months: {}
                    };
                }

                // 计算该护士该月的关键统计
                const nurseHolidays = monthData.nurseHolidays && monthData.nurseHolidays[nurseKey] 
                    ? monthData.nurseHolidays[nurseKey] : 0;
                
                const monthlyLegalWorkdays = nurseData.totalDays - nurseHolidays;  // 法定工作日
                const monthlyWorkedDays = nurseData.workValue;                     // 上班天数(工作价值总和)
                const monthlySavedRestDays = monthlyWorkedDays - monthlyLegalWorkdays; // 存假

                // 存储该月数据
                this.monthlySummaryData[nurseKey].months[monthKey] = {
                    year: parseInt(year),
                    month: parseInt(month),
                    monthName: this.getMonthName(parseInt(month)),
                    monthKey: monthKey,
                    
                    // 核心统计数据
                    legalWorkdays: monthlyLegalWorkdays,      // 法定工作日
                    workedDays: monthlyWorkedDays,            // 上班天数(workValue)
                    savedRestDays: monthlySavedRestDays,      // 存假
                    
                    // 辅助数据
                    totalDays: nurseData.totalDays,          // 在职天数
                    holidayDays: nurseHolidays,              // 法定假日天数
                    workRate: monthlyLegalWorkdays > 0 ? 
                        (monthlyWorkedDays / monthlyLegalWorkdays * 100).toFixed(1) : 0,
                    
                    // 原始数据引用
                    originalData: nurseData
                };
            });
        });

        console.log('Generated monthly summary data for', Object.keys(this.monthlySummaryData).length, 'nurses');
    }

    /**
     * 获取指定护士的月度汇总数据
     * @param {string} nurseKey - 护士键值 (nurseId-nurseName)
     * @returns {Object} 护士的所有月度数据
     */
    getNurseMonthlySummary(nurseKey) {
        return this.monthlySummaryData[nurseKey] || null;
    }

    /**
     * 获取指定护士指定月份的数据
     * @param {string} nurseKey - 护士键值
     * @param {string} monthKey - 月份键值 (YYYY-MM)
     * @returns {Object} 该护士该月的统计数据
     */
    getNurseMonthData(nurseKey, monthKey) {
        const nurseSummary = this.getNurseMonthlySummary(nurseKey);
        return nurseSummary ? nurseSummary.months[monthKey] : null;
    }

    /**
     * 获取所有护士的总计统计
     * @param {string} nurseKey - 护士键值
     * @returns {Object} 护士的总计统计数据
     */
    getNurseTotalSummary(nurseKey) {
        const nurseSummary = this.getNurseMonthlySummary(nurseKey);
        if (!nurseSummary) return null;

        let totalLegalWorkdays = 0;
        let totalWorkedDays = 0;
        let totalSavedRestDays = 0;
        let totalMonths = 0;

        Object.values(nurseSummary.months).forEach(monthData => {
            totalLegalWorkdays += monthData.legalWorkdays;
            totalWorkedDays += monthData.workedDays;
            totalSavedRestDays += monthData.savedRestDays;
            totalMonths++;
        });

        return {
            nurseId: nurseSummary.nurseId,
            nurseName: nurseSummary.nurseName,
            totalLegalWorkdays,
            totalWorkedDays,
            totalSavedRestDays,
            totalMonths,
            avgLegalWorkdays: totalMonths > 0 ? (totalLegalWorkdays / totalMonths).toFixed(1) : 0,
            avgWorkedDays: totalMonths > 0 ? (totalWorkedDays / totalMonths).toFixed(1) : 0,
            avgSavedRestDays: totalMonths > 0 ? (totalSavedRestDays / totalMonths).toFixed(1) : 0
        };
    }

    /**
     * 获取所有护士列表
     * @returns {Array} 护士列表
     */
    getAllNurses() {
        return Object.keys(this.monthlySummaryData).map(nurseKey => ({
            nurseKey,
            nurseId: this.monthlySummaryData[nurseKey].nurseId,
            nurseName: this.monthlySummaryData[nurseKey].nurseName
        }));
    }

    /**
     * 获取月份名称
     */
    getMonthName(month) {
        const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        return months[month - 1] || month;
    }
}