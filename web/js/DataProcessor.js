/**
 * 数据处理器 - 负责处理和计算医院排班数据
 */
class DataProcessor {
    constructor(database) {
        this.database = database;
        this.monthlyData = {};
        this.personData = {};
        this.monthlySummaryData = {}; // 每个护士每个月的汇总数据
        this.initialSavedRestDays = {}; // 初始存假天数
    }

    /**
     * 处理所有数据
     */
    async processData() {
        await this.loadInitialSavedRestDays();
        this.adjustNightShiftDayValues();
        this.adjustSupportWorkValues();
        this.processMonthlyData();
        this.processPersonData();
        this.generateMonthlySummaryData();
    }

    /**
     * 加载初始存假天数数据
     */
    async loadInitialSavedRestDays() {
        try {
            const response = await fetch('initial_saved_rest_days.json');
            if (!response.ok) {
                console.warn('Failed to load initial saved rest days data, using default values');
                return;
            }
            const initialData = await response.json();
            
            // 将数据转换为以护士姓名为键的对象
            initialData.forEach(nurse => {
                this.initialSavedRestDays[nurse.name] = nurse.saved_rest_days;
            });
            
            console.log('Loaded initial saved rest days:', this.initialSavedRestDays);
            console.log('Initial saved rest days loaded for nurses:', Object.keys(this.initialSavedRestDays));
        } catch (error) {
            console.warn('Error loading initial saved rest days data:', error);
        }
    }

    /**
     * 调整夜班下班日的工作价值
     * 如果前一天是'小'（小夜班），当天是'下'（下班日），则将'下'的工作价值从1改为0.5
     */
    adjustNightShiftDayValues() {
        // 按护士分组记录
        const nurseRecords = {};
        
        this.database.records.forEach(record => {
            const nurseKey = `${record.nurseId}-${record.nurseName}`;
            if (!nurseRecords[nurseKey]) {
                nurseRecords[nurseKey] = [];
            }
            nurseRecords[nurseKey].push(record);
        });

        // 对每个护士的记录按日期排序并检查
        Object.keys(nurseRecords).forEach(nurseKey => {
            const records = nurseRecords[nurseKey].sort((a, b) => {
                // 按年、月、日排序
                if (a.year !== b.year) return a.year - b.year;
                if (a.month !== b.month) return a.month - b.month;
                return a.day - b.day;
            });

            // 检查连续的日期
            for (let i = 1; i < records.length; i++) {
                const prevRecord = records[i - 1];
                const currRecord = records[i];
                
                // 检查是否是连续的日期（同一个月内）
                const isConsecutiveDays = 
                    prevRecord.year === currRecord.year &&
                    prevRecord.month === currRecord.month &&
                    prevRecord.day === currRecord.day - 1;
                
                // 如果前一天是'小'，当天是'下'，则调整工作价值
                if (isConsecutiveDays && 
                    prevRecord.shiftCode === '小' && 
                    currRecord.shiftCode === '下') {
                    
                    console.log(`调整 ${nurseKey} 在 ${currRecord.year}-${currRecord.month}-${currRecord.day} 的'下'班工作价值从 ${currRecord.workValue} 改为 0.5`);
                    currRecord.workValue = 0.5;
                }
            }
        });
    }

    /**
     * 调整支持性工作和假期的工作价值
     * 对于支持工作类型和各种假期，如果是法定假日则工作价值为0，否则为1
     */
    adjustSupportWorkValues() {
        // 定义支持性工作类型（包括各种假期）
        const supportWorkTypes = new Set([
            'group_work', 'fever_ward', 'isolation_ward', 
            'ophthalmology_2', 'icu_work', 'neurology_work',
            'sick_leave', 'marriage_leave', 'maternity_leave'
        ]);

        // 遍历所有记录
        this.database.records.forEach(record => {
            if (supportWorkTypes.has(record.workType)) {
                const newWorkValue = record.isHoliday ? 0 : 1;
                
                if (record.workValue !== newWorkValue) {
                    console.log(`调整 ${record.nurseName} 在 ${record.year}-${record.month}-${record.day} 的'${record.shiftCode}'工作价值从 ${record.workValue} 改为 ${newWorkValue} (${record.isHoliday ? '法定假日' : '工作日'})`);
                    record.workValue = newWorkValue;
                }
            }
        });
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
     * 获取护士的初始存假天数
     * @param {string} nurseName - 护士姓名
     * @returns {number} 初始存假天数，如果没有数据则返回0
     */
    getInitialSavedRestDays(nurseName) {
        return this.initialSavedRestDays[nurseName] || 0;
    }

    /**
     * 获取护士的累计存假天数（包含初始值）
     * @param {string} nurseKey - 护士键值
     * @param {string} monthKey - 月份键值（可选，如果不提供则返回总累计）
     * @returns {number} 累计存假天数
     */
    getCumulativeSavedRestDays(nurseKey, monthKey = null) {
        const nurseSummary = this.getNurseMonthlySummary(nurseKey);
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
            
            // Debug logging
            if (nurseSummary.nurseName === '马磊' || nurseSummary.nurseName === '付伟') {
                console.log(`Cumulative calculation for ${nurseSummary.nurseName}:`, {
                    initialValue,
                    monthlyTotal: totalSavedRestDays - initialValue,
                    total: totalSavedRestDays
                });
            }
            
            return totalSavedRestDays;
        }
    }

    /**
     * 获取月份名称
     */
    getMonthName(month) {
        const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        return months[month - 1] || month;
    }
}