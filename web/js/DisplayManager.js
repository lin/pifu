/**
 * 显示管理器 - 负责渲染和显示数据
 */
class DisplayManager {
    constructor(dataProcessor) {
        this.dataProcessor = dataProcessor;
    }

    /**
     * 显示月度汇总
     */
    displayMonthlySummary(monthData) {
        const summaryHTML = `<h3>${monthData.year}年${monthData.month}月 汇总</h3>`;
        document.getElementById('monthlySummary').innerHTML = summaryHTML;
    }

    /**
     * 显示月度统计表格
     */
    displayMonthlyTable(monthData) {
        let nurses = Object.values(monthData.nurses);

        // Sort nurses by name for consistent display
        nurses.sort((a, b) => a.nurseName.localeCompare(b.nurseName));

        const tableHTML = `
            <table class="stats-table">
                <thead>
                    <tr>
                        <th>护士</th>
                        <th class="key-metric">存假</th>
                        <th class="key-metric">上班天数</th>
                        <th>法定工作日</th>
                    </tr>
                </thead>
                <tbody>
                    ${nurses.map(nurse => {
                        const savedRestText = nurse.savedRestDays >= 0 
                            ? `存了 ${nurse.savedRestDays} 天`
                            : `欠假 ${Math.abs(nurse.savedRestDays)} 天`;
                        const isNegative = nurse.savedRestDays < 0;
                        
                        return `
                        <tr>
                            <td class="nurse-name">${nurse.nurseName}</td>
                            <td class="key-metric saved-rest" ${isNegative ? 'data-negative="true"' : ''}>${savedRestText}</td>
                            <td class="key-metric work-value">${nurse.workValue} 天</td>
                            <td class="legal-days">${nurse.legalWorkdayCount} 天</td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;

        document.getElementById('monthlyStats').innerHTML = tableHTML;
        
        // 添加月度日历显示
        this.displayMonthlyCalendar(monthData);
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
     * 显示个人概览
     */
    displayPersonOverview(nurseKey) {
        // 使用新的 monthlySummaryData 获取总计统计
        const totalSummary = this.dataProcessor.getNurseTotalSummary(nurseKey);
        
        if (!totalSummary) {
            document.getElementById('personOverview').innerHTML = '<p>没有找到该护士的统计数据</p>';
            return;
        }

        const overviewHTML = `
            <h2><i class="fas fa-user-nurse"></i> ${totalSummary.nurseName} (编号: ${totalSummary.nurseId})</h2>
            <div class="person-stats">
                <div class="person-stat key-summary">
                    <span class="value">${totalSummary.totalSavedRestDays >= 0 ? `存了 ${totalSummary.totalSavedRestDays} 天` : `欠假 ${Math.abs(totalSummary.totalSavedRestDays)} 天`}</span>
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
        
        // 生成图表
        this.displayPersonCharts(nurseKey);
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
                const calendarHTML = this.generateMonthCalendar(
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
                const supportLeaveTypes = new Set(['sick_leave', 'marriage_leave', 'maternity_leave']);
                
                let restValue = 0;
                if (alwaysRestTypes.has(dayData.workType)) {
                    restValue = 1; // Always rest
                } else if (supportLeaveTypes.has(dayData.workType)) {
                    restValue = dayData.isHoliday ? 1 : 0; // Rest only on legal holidays
                }
                
                // Calculate effective value: workValue - restValue + (isLegalHoliday ? 1 : 0)
                const effectiveValue = dayData.workValue - restValue + (dayData.isHoliday ? 1 : 0);
                
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
                        <div class="work-value">工作量：${dayData.workValue}天</div>
                        <div class="rest-value">休息量：${displayRestValue}天</div>
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
     * 显示个人图表
     */
    displayPersonCharts(nurseKey) {
        const nurseSummary = this.dataProcessor.getNurseMonthlySummary(nurseKey);
        
        if (!nurseSummary || !nurseSummary.months) {
            return;
        }

        // 按时间排序的月度数据
        const sortedMonths = Object.values(nurseSummary.months)
            .sort((a, b) => {
                if (a.year !== b.year) return a.year - b.year;
                return a.month - b.month;
            });

        // 准备数据
        const labels = sortedMonths.map(m => `${m.year}-${String(m.month).padStart(2, '0')}`);
        
        // 累计数据
        let accumulatedSavedRest = 0;
        let accumulatedWorkedDays = 0;
        let accumulatedRestDays = 0;
        
        const accumulatedSavedRestData = [];
        const monthlySavedRestData = [];
        const accumulatedWorkedDaysData = [];
        const monthlyWorkedDaysData = [];
        const accumulatedRestDaysData = [];
        const monthlyRestDaysData = [];

        sortedMonths.forEach(monthData => {
            // 月度数据
            monthlySavedRestData.push(monthData.savedRestDays);
            monthlyWorkedDaysData.push(monthData.workedDays);
            
            // 有效休息日 = 总天数 - 工作天数 - 法定假日
            const effectiveRestDays = monthData.totalDays - monthData.workedDays - monthData.holidayDays;
            monthlyRestDaysData.push(effectiveRestDays);
            
            // 累计数据
            accumulatedSavedRest += monthData.savedRestDays;
            accumulatedWorkedDays += monthData.workedDays;
            accumulatedRestDays += effectiveRestDays;
            
            accumulatedSavedRestData.push(accumulatedSavedRest);
            accumulatedWorkedDaysData.push(accumulatedWorkedDays);
            accumulatedRestDaysData.push(accumulatedRestDays);
        });

        // 销毁现有图表
        this.destroyExistingCharts();

        // 创建图表 - 按组排序：月度图表优先，然后是累计图表
        // 存假天数组
        this.createChart('monthlySavedRestChart', '月度存假天数', labels, monthlySavedRestData, '#dc2626');
        this.createChart('accumulatedSavedRestChart', '累计存假天数', labels, accumulatedSavedRestData, '#dc2626');
        
        // 有效工作日组
        this.createChart('monthlyWorkedDaysChart', '月度有效工作日', labels, monthlyWorkedDaysData, '#059669');
        this.createChart('accumulatedWorkedDaysChart', '累计有效工作日', labels, accumulatedWorkedDaysData, '#059669');
        
        // 有效休息日组
        this.createChart('monthlyRestDaysChart', '月度有效休息日', labels, monthlyRestDaysData, '#3b82f6');
        this.createChart('accumulatedRestDaysChart', '累计有效休息日', labels, accumulatedRestDaysData, '#3b82f6');
    }

    /**
     * 创建图表
     */
    createChart(canvasId, label, labels, data, color) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        // Set canvas height explicitly
        ctx.style.height = '500px';
        ctx.height = 500;

        // 判断是否为累计图表
        const isAccumulated = canvasId.includes('accumulated');
        
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: data,
                    borderColor: color,
                    backgroundColor: color + (isAccumulated ? '15' : '08'),
                    borderWidth: isAccumulated ? 3 : 2,
                    fill: isAccumulated,
                    tension: 0.2,
                    pointBackgroundColor: color,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: isAccumulated ? 5 : 4,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: color,
                        borderWidth: 1,
                        displayColors: false,
                        callbacks: {
                            title: function(context) {
                                return context[0].label;
                            },
                            label: function(context) {
                                return `${label}: ${context.parsed.y} 天`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '月份',
                            color: '#64748b',
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: '#f1f5f9'
                        },
                        ticks: {
                            color: '#64748b'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: '天数',
                            color: '#64748b',
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: '#f1f5f9'
                        },
                        ticks: {
                            color: '#64748b'
                        }
                    }
                }
            }
        });

        // 存储图表实例以便后续销毁
        if (!this.chartInstances) {
            this.chartInstances = {};
        }
        this.chartInstances[canvasId] = chart;
    }

    /**
     * 销毁现有图表
     */
    destroyExistingCharts() {
        if (this.chartInstances) {
            Object.values(this.chartInstances).forEach(chart => {
                if (chart) {
                    chart.destroy();
                }
            });
            this.chartInstances = {};
        }
    }

    /**
     * 创建总览页面的柱状图
     */
    createOverviewBarChart(canvasId, label, labels, data, color) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        // 销毁现有图表
        if (this.chartInstances && this.chartInstances[canvasId]) {
            this.chartInstances[canvasId].destroy();
        }

        // Set canvas height explicitly
        ctx.style.height = '500px';
        ctx.height = 500;

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: data,
                    backgroundColor: color + '40',
                    borderColor: color,
                    borderWidth: 2,
                    borderRadius: 4,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: color,
                        borderWidth: 1,
                        displayColors: false,
                        callbacks: {
                            title: function(context) {
                                return context[0].label;
                            },
                            label: function(context) {
                                return `${label}: ${context.parsed.y} 天`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '护士',
                            color: '#64748b',
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#64748b',
                            maxRotation: 45,
                            minRotation: 0
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: '天数',
                            color: '#64748b',
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: '#f1f5f9'
                        },
                        ticks: {
                            color: '#64748b'
                        }
                    }
                }
            }
        });

        // 存储图表实例
        if (!this.chartInstances) {
            this.chartInstances = {};
        }
        this.chartInstances[canvasId] = chart;
    }

    /**
     * 获取月份名称
     */
    getMonthName(month) {
        const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        return months[month - 1] || month;
    }
}