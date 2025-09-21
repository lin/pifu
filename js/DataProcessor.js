/**
 * 数据处理器 - 负责处理和计算医院排班数据
 * 现在作为各个专门模块的协调器
 */
class DataProcessor {
    constructor(database) {
        this.database = database;
        
        // 初始化各个专门模块
        this.dataLoader = new DataLoader();
        this.dataAdjuster = new DataAdjuster();
        this.monthlyProcessor = new MonthlyProcessor();
        this.summaryGenerator = new SummaryGenerator();
        this.dataQueries = new DataQueries(this.dataLoader, this.summaryGenerator);
        
        // 保持向后兼容性的属性
        this.monthlyData = {};
        this.personData = {};
        this.monthlySummaryData = {};
    }

    /**
     * 处理所有数据
     */
    async processData() {
        // 加载配置数据
        await this.dataLoader.loadInitialSavedRestDays();
        await this.dataLoader.loadYearEndAdjustments();
        
        // 调整数据
        this.dataAdjuster.adjustNightShiftDayValues(this.database.records);
        this.dataAdjuster.adjustSupportWorkValues(this.database.records);
        
        // 处理各种数据
        this.monthlyProcessor.processMonthlyData(this.database.records);
        this.processPersonData(this.database.records);
        this.summaryGenerator.generateMonthlySummaryData(
            this.monthlyProcessor.getAllMonthlyData(), 
            this.dataLoader.getYearEndAdjustments()
        );
        
        // 保持向后兼容性
        this.monthlyData = this.monthlyProcessor.getAllMonthlyData();
        this.monthlySummaryData = this.summaryGenerator.getAllMonthlySummaryData();
    }

    /**
     * 处理个人数据 - 简化版本，只生成UI需要的护士列表
     * @param {Array} records - 数据库记录数组
     */
    processPersonData(records) {
        const personStats = {};

        records.forEach(record => {
            const nurseKey = `${record.nurseId}-${record.nurseName}`;
            
            if (!personStats[nurseKey]) {
                personStats[nurseKey] = {
                    nurseId: record.nurseId,
                    nurseName: record.nurseName,
                    totalRecords: 0,
                    totalWorkValue: 0,
                    firstDate: record.fullDate,
                    lastDate: record.fullDate
                };
            }

            const personData = personStats[nurseKey];
            personData.totalRecords++;
            personData.totalWorkValue += record.workValue;
            
            if (record.fullDate < personData.firstDate) {
                personData.firstDate = record.fullDate;
            }
            if (record.fullDate > personData.lastDate) {
                personData.lastDate = record.fullDate;
            }
        });

        this.personData = personStats;
    }

    // 以下方法委托给相应的专门模块，保持向后兼容性

    /**
     * 获取指定年月的月度数据
     * @param {number} year - 年份
     * @param {number} month - 月份
     * @returns {Object} 该月的完整数据
     */
    getMonthlyData(year, month) {
        return this.dataQueries.getMonthlyData(this.monthlyProcessor, year, month);
    }

    /**
     * 获取指定护士的月度汇总数据
     * @param {string} nurseKey - 护士键值 (nurseId-nurseName)
     * @returns {Object} 护士的所有月度数据
     */
    getNurseMonthlySummary(nurseKey) {
        return this.dataQueries.getNurseMonthlySummary(nurseKey);
    }

    /**
     * 获取指定护士指定月份的数据
     * @param {string} nurseKey - 护士键值
     * @param {string} monthKey - 月份键值 (YYYY-MM)
     * @returns {Object} 该护士该月的统计数据
     */
    getNurseMonthData(nurseKey, monthKey) {
        return this.dataQueries.getNurseMonthData(nurseKey, monthKey);
    }

    /**
     * 获取所有护士的总计统计
     * @param {string} nurseKey - 护士键值
     * @returns {Object} 护士的总计统计数据
     */
    getNurseTotalSummary(nurseKey) {
        return this.dataQueries.getNurseTotalSummary(nurseKey);
    }

    /**
     * 获取所有护士列表
     * @returns {Array} 护士列表
     */
    getAllNurses() {
        return this.dataQueries.getAllNurses();
    }

    /**
     * 获取护士的初始存假天数
     * @param {string} nurseName - 护士姓名
     * @returns {number} 初始存假天数，如果没有数据则返回0
     */
    getInitialSavedRestDays(nurseName) {
        return this.dataQueries.getInitialSavedRestDays(nurseName);
    }

    /**
     * 获取护士的累计存假天数（包含初始值）
     * @param {string} nurseKey - 护士键值
     * @param {string} monthKey - 月份键值（可选，如果不提供则返回总累计）
     * @returns {number} 累计存假天数
     */
    getCumulativeSavedRestDays(nurseKey, monthKey = null) {
        return this.dataQueries.getCumulativeSavedRestDays(nurseKey, monthKey);
    }

    /**
     * 获取月份名称
     * @param {number} month - 月份
     * @returns {string} 月份名称
     */
    getMonthName(month) {
        return this.monthlyProcessor.getMonthName(month);
    }
}