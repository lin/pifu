/**
 * 数据查询器 - 负责数据检索和查询方法
 */
class DataQueries {
    constructor(dataLoader, summaryGenerator) {
        this.dataLoader = dataLoader;
        this.summaryGenerator = summaryGenerator;
    }

    /**
     * 获取护士的初始存假天数
     * @param {string} nurseName - 护士姓名
     * @returns {number} 初始存假天数，如果没有数据则返回0
     */
    getInitialSavedRestDays(nurseName) {
        return this.dataLoader.getInitialSavedRestDays(nurseName);
    }

    /**
     * 获取护士的累计存假天数（包含初始值）
     * @param {string} nurseKey - 护士键值
     * @param {string} monthKey - 月份键值（可选，如果不提供则返回总累计）
     * @returns {number} 累计存假天数
     */
    getCumulativeSavedRestDays(nurseKey, monthKey = null) {
        const nurseSummary = this.summaryGenerator.getNurseMonthlySummary(nurseKey);
        if (!nurseSummary) return 0;

        const initialValue = this.getInitialSavedRestDays(nurseSummary.nurseName);
        
        if (monthKey) {
            // 返回到指定月份的累计值
            const sortedMonths = Object.values(nurseSummary.months)
                .sort((a, b) => {
                    if (a.year !== b.year) return a.year - b.year;
                    return a.month - b.month;
                });
            
            let cumulative = initialValue;
            for (const monthData of sortedMonths) {
                if (monthData.monthKey === monthKey) {
                    break;
                }
                cumulative += monthData.savedRestDays;
            }
            return cumulative;
        } else {
            // 返回总累计值
            let totalSavedRestDays = initialValue;
            Object.values(nurseSummary.months).forEach(monthData => {
                totalSavedRestDays += monthData.savedRestDays;
            });
            
            return totalSavedRestDays;
        }
    }

    /**
     * 获取指定年月的月度数据
     * @param {Object} monthlyProcessor - 月度数据处理器实例
     * @param {number} year - 年份
     * @param {number} month - 月份
     * @returns {Object} 该月的完整数据
     */
    getMonthlyData(monthlyProcessor, year, month) {
        return monthlyProcessor.getMonthlyData(year, month);
    }

    /**
     * 获取指定护士的月度汇总数据
     * @param {string} nurseKey - 护士键值 (nurseId-nurseName)
     * @returns {Object} 护士的所有月度数据
     */
    getNurseMonthlySummary(nurseKey) {
        return this.summaryGenerator.getNurseMonthlySummary(nurseKey);
    }

    /**
     * 获取指定护士指定月份的数据
     * @param {string} nurseKey - 护士键值
     * @param {string} monthKey - 月份键值 (YYYY-MM)
     * @returns {Object} 该护士该月的统计数据
     */
    getNurseMonthData(nurseKey, monthKey) {
        return this.summaryGenerator.getNurseMonthData(nurseKey, monthKey);
    }

    /**
     * 获取所有护士的总计统计
     * @param {string} nurseKey - 护士键值
     * @returns {Object} 护士的总计统计数据
     */
    getNurseTotalSummary(nurseKey) {
        return this.summaryGenerator.getNurseTotalSummary(nurseKey);
    }

    /**
     * 获取所有护士列表
     * @returns {Array} 护士列表
     */
    getAllNurses() {
        return this.summaryGenerator.getAllNurses();
    }
}