/**
 * 汇总数据生成器 - 负责生成月度汇总数据
 */
class SummaryGenerator {
    constructor() {
        this.monthlySummaryData = {};
    }

    /**
     * 生成月度汇总数据 - 为每个护士的每个月计算关键统计
     * @param {Object} monthlyData - 月度数据
     * @param {Array} yearEndAdjustments - 年末调整数据
     */
    generateMonthlySummaryData(monthlyData, yearEndAdjustments) {
        this.monthlySummaryData = {};

        // 遍历所有月度数据
        Object.keys(monthlyData).forEach(monthKey => {
            const monthData = monthlyData[monthKey];
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
                
                let monthlyLegalWorkdays = nurseData.totalDays - nurseHolidays;  // 法定工作日
                let monthlyWorkedDays = nurseData.workValue;                     // 上班天数(工作价值总和)
                
                // Apply year-end adjustments for December months
                if (parseInt(month) === 12 ||
                    (parseInt(year) === 2020 && parseInt(month) === 1)) {
                    // Add 15 days work value for winter and summer holidays
                    monthlyWorkedDays += year === "2014" ? 5 : year == '2020' ? 10 : 15;
                    
                    // Apply year-end adjustments from JSON file
                    const nurseName = nurseData.nurseName;                    
                    const yearInt = parseInt(year);
                    const nurseAdjustments = yearEndAdjustments.filter(
                        adj => adj.name === nurseName && adj.year === yearInt
                    );
                    
                    nurseAdjustments.forEach(adjustment => {
                        // Remove the specified holiday days from total effective work days
                        monthlyWorkedDays -= adjustment.removeHolidayDays;
                    });
                }
                
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
     * 获取所有月度汇总数据
     * @returns {Object} 所有月度汇总数据
     */
    getAllMonthlySummaryData() {
        return this.monthlySummaryData;
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