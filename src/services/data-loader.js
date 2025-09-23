/**
 * 数据加载器 - 负责加载各种配置和调整数据
 */
class DataLoader {
    constructor() {
        this.initialSavedRestDays = {};
        this.yearEndAdjustments = [];
        this.includePandemicData = false; // true = include pandemic data, false = exclude pandemic data
        this.datasets = {
            'pre-pandemic': null,
            'post-pandemic': null
        };
    }

    /**
     * 加载初始存假天数数据
     */
    async loadInitialSavedRestDays() {
        try {
            const response = await fetch('data/config/initial_saved_rest_days.json');
            if (!response.ok) {
                console.warn('Failed to load initial saved rest days data, using default values');
                return;
            }
            const initialData = await response.json();
            
            // 将数据转换为以护士姓名为键的对象
            initialData.forEach(nurse => {
                this.initialSavedRestDays[nurse.name] = nurse.saved_rest_days;
            });
            
        } catch (error) {
            console.warn('Error loading initial saved rest days data:', error);
        }
    }

    /**
     * 加载年末调整数据
     */
    async loadYearEndAdjustments() {
        try {
            const response = await fetch('data/config/year_end_adjustments.json');
            this.yearEndAdjustments = await response.json();
        } catch (error) {
            console.error('Error loading year-end adjustments:', error);
            this.yearEndAdjustments = [];
        }
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
     * 获取年末调整数据
     * @returns {Array} 年末调整数据数组
     */
    getYearEndAdjustments() {
        return this.yearEndAdjustments;
    }

    /**
     * 加载预疫情数据
     */
    async loadPrePandemicData() {
        try {
            const response = await fetch('./data/processed/hospital_shifts_2014-04_to_2020-01_database.json');
            if (!response.ok) {
                throw new Error('Failed to load pre-pandemic data');
            }
            this.datasets['pre-pandemic'] = await response.json();
            console.log('Pre-pandemic data loaded successfully');
        } catch (error) {
            console.error('Error loading pre-pandemic data:', error);
            throw error;
        }
    }

    /**
     * 加载后疫情数据
     */
    async loadPostPandemicData() {
        try {
            const response = await fetch('./data/processed/hospital_shifts_2020-02_to_2020-05_database.json');
            if (!response.ok) {
                throw new Error('Failed to load post-pandemic data');
            }
            this.datasets['post-pandemic'] = await response.json();
            console.log('Post-pandemic data loaded successfully');
        } catch (error) {
            console.error('Error loading post-pandemic data:', error);
            throw error;
        }
    }

    /**
     * 加载所有数据集
     */
    async loadAllDatasets() {
        await Promise.all([
            this.loadPrePandemicData(),
            this.loadPostPandemicData()
        ]);
    }

    /**
     * 切换是否包含疫情数据
     * @param {boolean} includePandemic - true = include pandemic data, false = exclude pandemic data
     */
    setIncludePandemicData(includePandemic) {
        this.includePandemicData = includePandemic;
        console.log(`Pandemic data ${includePandemic ? 'included' : 'excluded'}`);
    }

    /**
     * 获取当前数据集（根据是否包含疫情数据决定）
     * @returns {Object} 当前数据集
     */
    getCurrentDataset() {
        if (this.includePandemicData) {
            return this.getCombinedDataset();
        } else {
            return this.datasets['pre-pandemic'];
        }
    }

    /**
     * 获取组合数据集（预疫情 + 后疫情）
     * @returns {Object} 组合数据集
     */
    getCombinedDataset() {
        if (!this.datasets['pre-pandemic'] || !this.datasets['post-pandemic']) {
            console.error('Both datasets must be loaded to create combined dataset');
            return null;
        }

        const prePandemic = this.datasets['pre-pandemic'];
        const postPandemic = this.datasets['post-pandemic'];

        // 合并记录
        const combinedRecords = [...prePandemic.records, ...postPandemic.records];
        
        // 按日期排序
        combinedRecords.sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));

        // 合并统计信息
        const combinedStatistics = this.combineStatistics(prePandemic.statistics, postPandemic.statistics, combinedRecords);

        // 合并元数据
        const combinedMetadata = {
            ...prePandemic.metadata,
            actualDateRange: {
                start: Math.min(...combinedRecords.map(r => r.fullDate)),
                end: Math.max(...combinedRecords.map(r => r.fullDate))
            },
            requestedDateRange: {
                start: prePandemic.metadata.requestedDateRange.start,
                end: postPandemic.metadata.requestedDateRange.end
            },
            filesProcessed: prePandemic.metadata.filesProcessed + postPandemic.metadata.filesProcessed,
            filesSuccessful: prePandemic.metadata.filesSuccessful + postPandemic.metadata.filesSuccessful,
            filesWithErrors: prePandemic.metadata.filesWithErrors + postPandemic.metadata.filesWithErrors,
            filesEmpty: prePandemic.metadata.filesEmpty + postPandemic.metadata.filesEmpty,
            fileDetails: [...prePandemic.metadata.fileDetails, ...postPandemic.metadata.fileDetails]
        };

        return {
            records: combinedRecords,
            statistics: combinedStatistics,
            metadata: combinedMetadata
        };
    }

    /**
     * 合并统计信息
     * @param {Object} preStats - 预疫情统计
     * @param {Object} postStats - 后疫情统计
     * @param {Array} combinedRecords - 合并后的记录
     * @returns {Object} 合并后的统计信息
     */
    combineStatistics(preStats, postStats, combinedRecords) {
        return {
            totalRecords: combinedRecords.length,
            uniqueNurses: Math.max(preStats.uniqueNurses, postStats.uniqueNurses),
            totalWorkValue: preStats.totalWorkValue + postStats.totalWorkValue,
            dateRange: {
                start: Math.min(...combinedRecords.map(r => r.fullDate)),
                end: Math.max(...combinedRecords.map(r => r.fullDate))
            },
            yearlyBreakdown: this.combineYearlyBreakdown(preStats.yearlyBreakdown, postStats.yearlyBreakdown),
            nurseStatistics: this.combineNurseStatistics(preStats.nurseStatistics, postStats.nurseStatistics),
            shiftTypeDistribution: this.combineShiftTypeDistribution(preStats.shiftTypeDistribution, postStats.shiftTypeDistribution),
            workPatterns: {
                totalWorkDays: preStats.workPatterns.totalWorkDays + postStats.workPatterns.totalWorkDays,
                totalRestDays: preStats.workPatterns.totalRestDays + postStats.workPatterns.totalRestDays,
                nightShifts: preStats.workPatterns.nightShifts + postStats.workPatterns.nightShifts,
                dayShifts: preStats.workPatterns.dayShifts + postStats.workPatterns.dayShifts,
                weekendWork: preStats.workPatterns.weekendWork + postStats.workPatterns.weekendWork,
                holidayWork: preStats.workPatterns.holidayWork + postStats.workPatterns.holidayWork
            }
        };
    }

    /**
     * 合并年度分解数据
     */
    combineYearlyBreakdown(preBreakdown, postBreakdown) {
        const combined = { ...preBreakdown };
        Object.keys(postBreakdown).forEach(year => {
            if (combined[year]) {
                combined[year].records += postBreakdown[year].records;
                combined[year].workValue += postBreakdown[year].workValue;
                combined[year].uniqueNurses = Math.max(combined[year].uniqueNurses, postBreakdown[year].uniqueNurses);
            } else {
                combined[year] = { ...postBreakdown[year] };
            }
        });
        return combined;
    }

    /**
     * 合并护士统计数据
     */
    combineNurseStatistics(preNurseStats, postNurseStats) {
        const combined = { ...preNurseStats };
        Object.keys(postNurseStats).forEach(nurseKey => {
            if (combined[nurseKey]) {
                combined[nurseKey].totalRecords += postNurseStats[nurseKey].totalRecords;
                combined[nurseKey].totalWorkValue += postNurseStats[nurseKey].totalWorkValue;
                combined[nurseKey].workDays += postNurseStats[nurseKey].workDays;
                combined[nurseKey].restDays += postNurseStats[nurseKey].restDays;
                combined[nurseKey].lastAppearance = postNurseStats[nurseKey].lastAppearance;
                combined[nurseKey].yearsActiveCount = Math.max(combined[nurseKey].yearsActiveCount, postNurseStats[nurseKey].yearsActiveCount);
            } else {
                combined[nurseKey] = { ...postNurseStats[nurseKey] };
            }
        });
        return combined;
    }

    /**
     * 合并班次类型分布
     */
    combineShiftTypeDistribution(preDistribution, postDistribution) {
        const combined = { ...preDistribution };
        Object.keys(postDistribution).forEach(shiftType => {
            combined[shiftType] = (combined[shiftType] || 0) + postDistribution[shiftType];
        });
        return combined;
    }

    /**
     * 获取指定数据集
     * @param {string} dataset - 'pre-pandemic' or 'post-pandemic'
     * @returns {Object} 指定数据集
     */
    getDataset(dataset) {
        return this.datasets[dataset];
    }

    /**
     * 获取当前数据集名称
     * @returns {string} 当前数据集名称
     */
    getCurrentDatasetName() {
        return this.includePandemicData ? 'with-pandemic' : 'without-pandemic';
    }
}