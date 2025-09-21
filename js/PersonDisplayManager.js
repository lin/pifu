/**
 * 个人显示管理器 - 负责个人概览和月度详情显示
 */
class PersonDisplayManager {
    constructor(dataProcessor, calendarDisplayManager) {
        this.dataProcessor = dataProcessor;
        this.calendarDisplayManager = calendarDisplayManager;
    }

    /**
     * 显示个人概览
     */
    displayPersonOverview(nurseKey) {
        // 使用新的 monthlySummaryData 获取总计统计
        const totalSummary = this.dataProcessor.getNurseTotalSummary(nurseKey);
        
        if (!totalSummary) {
            document.getElementById('personOverview').innerHTML = '<p>没有找到该护士的统计数据</p>';
            return;
        }

        // 使用包含初始值的累计存假天数
        const cumulativeSavedRestDays = this.dataProcessor.getCumulativeSavedRestDays(nurseKey);

        const overviewHTML = `
            <h2><i class="fas fa-user-nurse"></i> ${totalSummary.nurseName} (编号: ${totalSummary.nurseId})</h2>
            <div class="person-stats">
                <div class="person-stat key-summary">
                    <span class="value">${cumulativeSavedRestDays >= 0 ? `存了 ${cumulativeSavedRestDays} 天` : `欠假 ${Math.abs(cumulativeSavedRestDays)} 天`}</span>
                    <span class="label">总存假</span>
                </div>
                <div class="person-stat key-summary">
                    <span class="value">${totalSummary.totalWorkedDays} 天</span>
                    <span class="label">总上班天数</span>
                </div>
                <div class="person-stat key-summary">
                    <span class="value">${totalSummary.totalLegalWorkdays} 天</span>
                    <span class="label">总法定工作日</span>
                </div>
            </div>
        `;

        document.getElementById('personOverview').innerHTML = overviewHTML;
    }

    /**
     * 显示个人月度详情
     */
    displayPersonMonthly(nurseKey) {
        const nurseSummary = this.dataProcessor.getNurseMonthlySummary(nurseKey);
        
        if (!nurseSummary || !nurseSummary.months) {
            document.getElementById('personMonthly').innerHTML = '<p>没有找到该护士的月度数据</p>';
            return;
        }
        
        let monthlyHTML = '<h3><i class="fas fa-calendar-month"></i> 月度明细</h3><div class="person-monthly-calendars">';

        // 按年月排序
        const sortedMonths = Object.values(nurseSummary.months)
            .sort((a, b) => {
                if (a.year !== b.year) return a.year - b.year;
                return a.month - b.month;
            });

        // 为每个月生成日历
        sortedMonths.forEach(monthData => {
            // 获取该月该护士的完整月度数据
            const monthlyData = this.dataProcessor.getMonthlyData(monthData.year, monthData.month);
            if (monthlyData && monthlyData.nurses && monthlyData.nurses[nurseKey]) {
                const nurse = monthlyData.nurses[nurseKey];
                
                // 获取该护士当月的详细数据
                const nurseRecords = this.dataProcessor.database.records.filter(record => 
                    record.year === monthData.year && 
                    record.month === monthData.month && 
                    record.nurseId === nurse.nurseId
                );
                
                // 构建月度数据结构（与displayMonthlyCalendar相同的结构）
                const nurseMonthData = {
                    workValue: nurse.workValue,
                    workDays: nurse.workDays,
                    days: {}
                };
                
                nurseRecords.forEach(record => {
                    nurseMonthData.days[record.day] = {
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
                
                // 生成该护士该月的日历
                const calendarHTML = this.calendarDisplayManager.generateMonthCalendar(
                    monthData.year, 
                    monthData.month, 
                    nurseMonthData, 
                    nurse
                );
                
                monthlyHTML += calendarHTML;
            }
        });

        monthlyHTML += '</div>';
        document.getElementById('personMonthly').innerHTML = monthlyHTML;
    }
}