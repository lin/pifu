/**
 * 日历显示管理器 - 负责日历生成和显示
 */
class CalendarDisplayManager {
    constructor(dataProcessor) {
        this.dataProcessor = dataProcessor;
    }

    /**
     * 显示月度日历
     */
    displayMonthlyCalendar(monthData) {
        const nurses = Object.values(monthData.nurses).sort((a, b) => a.nurseName.localeCompare(b.nurseName));
        
        let calendarHTML = '<div class="monthly-calendars"><h3><i class="fas fa-calendar"></i> 月度日历视图</h3>';
        
        nurses.forEach(nurse => {
            // 获取该护士当月的详细数据
            const nurseRecords = this.dataProcessor.database.records.filter(record => 
                record.year === monthData.year && 
                record.month === monthData.month && 
                record.nurseId === nurse.nurseId
            );
            
            // 构建月度数据结构
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
            
            calendarHTML += `<div class="nurse-calendar">
                ${this.generateMonthCalendar(monthData.year, monthData.month, nurseMonthData, nurse)}
            </div>`;
        });
        
        calendarHTML += '</div>';
        
        // 将日历添加到月度统计容器中
        const monthlyStatsContainer = document.getElementById('monthlyStats');
        monthlyStatsContainer.innerHTML += calendarHTML;
    }

    /**
     * 生成月度日历
     */
    generateMonthCalendar(year, month, monthData, nurse = null) {
        const monthName = this.getMonthName(month);
        const daysInMonth = new Date(year, month, 0).getDate();
        const firstDay = new Date(year, month - 1, 1).getDay();
        
        // 构建标题内容
        let titleContent = `${year}年${month}月`;
        let subtitleContent = `上班天数: ${monthData.workValue} | 工作日天数: ${monthData.workDays}`;
        
        if (nurse) {
            titleContent = `${nurse.nurseName} - ${year}年${month}月`;
            const savedRestText = nurse.savedRestDays >= 0 
                ? `存了 ${nurse.savedRestDays} 天`
                : `欠假 ${Math.abs(nurse.savedRestDays)} 天`;
            subtitleContent = `${savedRestText} | 上班天数: ${monthData.workValue} | 工作日天数: ${monthData.workDays}`;
        }
        
        let calendarHTML = `
            <div class="calendar-month">
                <div class="calendar-header">
                    <h4>${titleContent}</h4>
                    <div>${subtitleContent}</div>
                </div>
                <div class="calendar-grid">
                    <div class="calendar-day header">日</div>
                    <div class="calendar-day header">一</div>
                    <div class="calendar-day header">二</div>
                    <div class="calendar-day header">三</div>
                    <div class="calendar-day header">四</div>
                    <div class="calendar-day header">五</div>
                    <div class="calendar-day header">六</div>
        `;

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            calendarHTML += '<div class="calendar-day"></div>';
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayData = monthData.days[day];
            if (dayData) {
                // Calculate rest value based on work type and holiday status
                const alwaysRestTypes = new Set(['rest']);
                const supportLeaveTypes = new Set(['sick_leave', 'marriage_leave', 'maternity_leave'
                    ,'group_work', 'fever_ward', 'isolation_ward', 'ophthalmology_2',
                    'icu_work', 'neurology_work'
                ]);
                
                let restValue = 0;
                if (alwaysRestTypes.has(dayData.workType)) {
                    restValue = 1; // Always rest
                } else if (supportLeaveTypes.has(dayData.workType)) {
                    restValue = dayData.isHoliday ? 1 : 0; // Rest only on legal holidays
                }
                
                // Calculate effective value: workValue - restValue + (isLegalHoliday ? 1 : 0)
                const effectiveValue = dayData.workValue - restValue + (dayData.isHoliday ? 1 : -1);
                
                // Determine background color class based on effective value
                let dayClass = 'calendar-day';
                if (effectiveValue > 0) {
                    dayClass += ' effective-positive';  // Green
                } else if (effectiveValue < 0) {
                    dayClass += ' effective-negative';  // Yellow
                } else {
                    dayClass += ' effective-zero';      // Blue
                }
                
                // Use the same rest value logic as effective value calculation
                const displayRestValue = restValue;
                
                // Prepare legal holiday row
                const legalHolidayRow = dayData.isHoliday ? '<div class="legal-holiday">法定休息日</div>' : '';
                
                calendarHTML += `
                    <div class="${dayClass}" title="${dayData.description}">
                        <div class="day-number">${day}</div>
                        <div class="shift-type">${dayData.shiftCode}</div>
                        <div class="work-value">
                            <span class="label-full">工作量：</span><span class="label-mobile">工作：</span>${dayData.workValue}天
                        </div>
                        <div class="rest-value">
                            <span class="label-full">休息量：</span><span class="label-mobile">休息：</span>${displayRestValue}天
                        </div>
                        ${legalHolidayRow}
                    </div>
                `;
            } else {
                calendarHTML += `<div class="calendar-day"><div class="day-number">${day}</div></div>`;
            }
        }

        calendarHTML += '</div></div>';
        return calendarHTML;
    }

    /**
     * 获取月份名称
     */
    getMonthName(month) {
        const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        return months[month - 1] || month;
    }
}