/**
 * 月度数据处理器 - 负责处理月度统计数据
 */
class MonthlyProcessor {
    constructor() {
        this.monthlyData = {};
    }

    /**
     * 处理月度统计数据
     * @param {Array} records - 数据库记录数组
     */
    processMonthlyData(records) {
        const monthlyStats = {};

        // Group records by year-month
        records.forEach(record => {
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
     * 获取指定年月的月度数据
     * @param {number} year - 年份
     * @param {number} month - 月份
     * @returns {Object} 该月的完整数据
     */
    getMonthlyData(year, month) {
        const monthKey = `${year}-${String(month).padStart(2, '0')}`;
        return this.monthlyData[monthKey] || null;
    }

    /**
     * 获取所有月度数据
     * @returns {Object} 所有月度数据
     */
    getAllMonthlyData() {
        return this.monthlyData;
    }

    /**
     * 获取月份名称
     * @param {number} month - 月份
     * @returns {string} 月份名称
     */
    getMonthName(month) {
        const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        return months[month - 1] || month;
    }
}