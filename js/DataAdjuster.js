/**
 * 数据调整器 - 负责调整工作价值和特殊规则
 */
class DataAdjuster {
    constructor() {
        this.holidayAdjustments = {};
    }

    /**
     * 调整夜班下班日的工作价值
     * 如果前一天是'小'（小夜班），当天是'下'（下班日），则将'下'的工作价值从1改为0.5
     * @param {Array} records - 数据库记录数组
     */
    adjustNightShiftDayValues(records) {
        // 按护士分组记录
        const nurseRecords = {};
        
        records.forEach(record => {
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
                    
                    currRecord.workValue = 0.5;
                }
            }
        });
    }

    /**
     * 调整支持性工作和假期的工作价值
     * 对于支持工作类型和各种假期，如果是法定假日则工作价值为0，否则为1
     * @param {Array} records - 数据库记录数组
     */
    adjustSupportWorkValues(records) {
        // 定义支持性工作类型（包括各种假期）
        const supportWorkTypes = new Set([
            'group_work', 'fever_ward', 'isolation_ward', 
            'ophthalmology_2', 'icu_work', 'neurology_work',
            'sick_leave', 'marriage_leave', 'maternity_leave'
        ]);

        // 遍历所有记录
        records.forEach(record => {
            if (supportWorkTypes.has(record.workType)) {
                const newWorkValue = record.isHoliday ? 0 : 1;
                
                if (record.workValue !== newWorkValue) {
                    record.workValue = newWorkValue;
                }
            }
        });
    }
}