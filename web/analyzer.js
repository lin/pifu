class HospitalShiftAnalyzer {
    constructor() {
        this.database = null;
        this.currentTab = 'monthly';
        this.monthlyData = {};
        this.personData = {};
        this.urlParams = new URLSearchParams(window.location.search);
        this.init();
    }

    async init() {
        try {
            await this.loadDatabase();
            this.processData();
            this.initializeUI();
            this.hideLoading();
        } catch (error) {
            console.error('Failed to initialize analyzer:', error);
            this.showError('Failed to load hospital shift data');
        }
    }

    async loadDatabase() {
        try {
            const response = await fetch('../output/hospital_shifts_2014-04_to_2020-01_database.json');
            if (!response.ok) {
                throw new Error('Failed to load database');
            }
            this.database = await response.json();
            console.log('Database loaded:', this.database.statistics.totalRecords, 'records');
        } catch (error) {
            console.error('Error loading database:', error);
            throw error;
        }
    }

    processData() {
        this.processMonthlyData();
        this.processPersonData();
    }

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

    initializeUI() {
        this.populateYearButtons();
        this.populateMonthButtons();
        this.populatePersonButtons();
        this.populatePersonYearButtons();
        this.applyUrlParameters();
        this.setDefaultSelections();
        this.loadMonthlyStats();
        this.loadOverviewData();
    }


    populateYearButtons() {
        const years = [...new Set(Object.keys(this.monthlyData).map(key => key.split('-')[0]))].sort();
        const yearButtons = document.getElementById('yearButtons');
        
        yearButtons.innerHTML = '';
        years.forEach(year => {
            const button = document.createElement('button');
            button.className = 'selection-btn';
            button.textContent = year;
            button.setAttribute('data-value', year);
            button.onclick = () => this.setSelectedYear(year);
            yearButtons.appendChild(button);
        });
    }

    populateMonthButtons() {
        const monthButtons = document.getElementById('monthButtons');
        const months = [
            { num: '01', name: '1月' }, { num: '02', name: '2月' }, { num: '03', name: '3月' },
            { num: '04', name: '4月' }, { num: '05', name: '5月' }, { num: '06', name: '6月' },
            { num: '07', name: '7月' }, { num: '08', name: '8月' }, { num: '09', name: '9月' },
            { num: '10', name: '10月' }, { num: '11', name: '11月' }, { num: '12', name: '12月' }
        ];
        
        monthButtons.innerHTML = '';
        months.forEach(month => {
            const button = document.createElement('button');
            button.className = 'selection-btn';
            button.textContent = month.name;
            button.setAttribute('data-value', month.num);
            button.onclick = () => this.setSelectedMonth(month.num);
            monthButtons.appendChild(button);
        });
    }

    populatePersonButtons() {
        const persons = Object.values(this.personData).sort((a, b) => a.nurseName.localeCompare(b.nurseName));
        const personButtons = document.getElementById('personButtons');
        
        personButtons.innerHTML = '';
        persons.forEach(person => {
            const button = document.createElement('button');
            button.className = 'selection-btn';
            button.textContent = person.nurseName;
            button.setAttribute('data-value', `${person.nurseId}-${person.nurseName}`);
            button.onclick = () => this.setSelectedPerson(`${person.nurseId}-${person.nurseName}`);
            personButtons.appendChild(button);
        });
    }

    populatePersonYearButtons() {
        const years = [...new Set(this.database.records.map(r => r.year))].sort();
        const personYearButtons = document.getElementById('personYearButtons');
        
        // Keep the "All Years" button and add year buttons
        years.forEach(year => {
            const button = document.createElement('button');
            button.className = 'selection-btn';
            button.textContent = year;
            button.setAttribute('data-value', year);
            button.onclick = () => this.setPersonYear(year);
            personYearButtons.appendChild(button);
        });
    }

    loadMonthlyStats() {
        const selectedYear = this.getSelectedYear();
        const selectedMonth = this.getSelectedMonth();
        
        if (!selectedYear || !selectedMonth) return;
        
        const monthKey = `${selectedYear}-${selectedMonth}`;
        if (!this.monthlyData[monthKey]) return;

        const monthData = this.monthlyData[monthKey];

        this.displayMonthlySummary(monthData);
        this.displayMonthlyTable(monthData);
        this.updateUrl();
    }

    displayMonthlySummary(monthData) {
        const nurses = Object.values(monthData.nurses);
        const totalWorkValue = nurses.reduce((sum, nurse) => sum + nurse.workValue, 0);
        const totalNurses = nurses.length;
        const avgWorkValue = totalNurses > 0 ? (totalWorkValue / totalNurses).toFixed(1) : 0;
        const totalSavedRestDays = nurses.reduce((sum, nurse) => sum + nurse.savedRestDays, 0);

        // 计算总的存假描述
        const totalSavedRestText = totalSavedRestDays >= 0 
            ? `存了 ${totalSavedRestDays} 天`
            : `欠假 ${Math.abs(totalSavedRestDays)} 天`;

        const summaryHTML = `<h3>${monthData.year}年${monthData.month}月 汇总</h3>`;

        document.getElementById('monthlySummary').innerHTML = summaryHTML;
    }

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
    }

    loadPersonDetails() {
        const personKey = this.getSelectedPerson();
        const selectedYear = this.getSelectedPersonYear();
        
        if (!personKey || !this.personData[personKey]) return;

        const personData = this.personData[personKey];
        this.displayPersonOverview(personData);
        this.displayPersonMonthly(personData, selectedYear);
        this.displayPersonCalendar(personData, selectedYear);
        this.updateUrl();
    }

    displayPersonOverview(personData) {
        const avgWorkValue = personData.totalRecords > 0 ? (personData.totalWorkValue / personData.totalRecords).toFixed(2) : 0;
        const careerSpan = this.calculateCareerSpan(personData.firstDate, personData.lastDate);

        const overviewHTML = `
            <h2><i class="fas fa-user-nurse"></i> ${personData.nurseName} (编号: ${personData.nurseId})</h2>
            <div class="person-stats">
                <div class="person-stat">
                    <span class="value">${personData.totalRecords}</span>
                    <span class="label">总天数</span>
                </div>
                <div class="person-stat">
                    <span class="value">${personData.totalWorkValue}</span>
                    <span class="label">总工作价值</span>
                </div>
                <div class="person-stat">
                    <span class="value">${avgWorkValue}</span>
                    <span class="label">平均工作价值/天</span>
                </div>
                <div class="person-stat">
                    <span class="value">${personData.yearsActiveCount}</span>
                    <span class="label">工作年限</span>
                </div>
                <div class="person-stat">
                    <span class="value">${careerSpan}</span>
                    <span class="label">职业跨度</span>
                </div>
                <div class="person-stat">
                    <span class="value">${personData.firstDate}</span>
                    <span class="label">首次记录</span>
                </div>
                <div class="person-stat">
                    <span class="value">${personData.lastDate}</span>
                    <span class="label">最后记录</span>
                </div>
            </div>
        `;

        document.getElementById('personOverview').innerHTML = overviewHTML;
    }

    displayPersonMonthly(personData, selectedYear) {
        const years = selectedYear ? [selectedYear] : Object.keys(personData.years).sort();
        
        let monthlyHTML = '<h3><i class="fas fa-calendar-month"></i> 月度明细</h3><div class="monthly-grid">';

        years.forEach(year => {
            if (!personData.years[year]) return;
            
            const yearData = personData.years[year];
            const months = Object.keys(yearData.months).sort((a, b) => parseInt(a) - parseInt(b));

            months.forEach(monthNum => {
                const monthData = yearData.months[monthNum];
                const monthKey = `${year}-${String(monthNum).padStart(2, '0')}`;
                const monthStats = this.monthlyData[monthKey];
                const legalWorkdayCount = monthStats ? monthStats.totalDays - monthStats.legalHolidays : monthData.totalDays;
                const savedRestDays = legalWorkdayCount - monthData.workValue;
                const workRate = legalWorkdayCount > 0 ? (monthData.workValue / legalWorkdayCount * 100).toFixed(1) : 0;

                monthlyHTML += `
                    <div class="month-card">
                        <h4>${year}年${monthNum}月</h4>
                        <div class="month-stats">
                            <div class="month-stat">
                                <span class="label">总天数:</span>
                                <span class="value">${monthData.totalDays}</span>
                            </div>
                            <div class="month-stat">
                                <span class="label">工作天数:</span>
                                <span class="value">${monthData.workDays}</span>
                            </div>
                            <div class="month-stat">
                                <span class="label">工作价值:</span>
                                <span class="value">${monthData.workValue}</span>
                            </div>
                            <div class="month-stat">
                                <span class="label">法定工作日:</span>
                                <span class="value">${legalWorkdayCount}</span>
                            </div>
                            <div class="month-stat">
                                <span class="label">节省休息天数:</span>
                                <span class="value">${savedRestDays}</span>
                            </div>
                            <div class="month-stat">
                                <span class="label">工作率:</span>
                                <span class="value">${workRate}%</span>
                            </div>
                        </div>
                    </div>
                `;
            });
        });

        monthlyHTML += '</div>';
        document.getElementById('personMonthly').innerHTML = monthlyHTML;
    }

    displayPersonCalendar(personData, selectedYear) {
        const years = selectedYear ? [selectedYear] : Object.keys(personData.years).sort();
        
        let calendarHTML = '<h3><i class="fas fa-calendar"></i> 日历视图</h3>';

        years.forEach(year => {
            if (!personData.years[year]) return;
            
            const yearData = personData.years[year];
            calendarHTML += `<div class="calendar-year"><h4>${year}</h4>`;

            for (let month = 1; month <= 12; month++) {
                if (!yearData.months[month]) continue;
                
                const monthData = yearData.months[month];
                calendarHTML += this.generateMonthCalendar(year, month, monthData);
            }

            calendarHTML += '</div>';
        });

        document.getElementById('personCalendar').innerHTML = calendarHTML;
    }

    generateMonthCalendar(year, month, monthData) {
        const monthName = this.getMonthName(month);
        const daysInMonth = new Date(year, month, 0).getDate();
        const firstDay = new Date(year, month - 1, 1).getDay();
        
        let calendarHTML = `
            <div class="calendar-month">
                <div class="calendar-header">
                    <h4>${year}年${month}月</h4>
                    <div>工作价值: ${monthData.workValue} | 工作天数: ${monthData.workDays}</div>
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
                let dayClass = 'calendar-day';
                if (dayData.isWorkDay) {
                    dayClass += ' work';
                } else if (dayData.workType === 'sick_leave') {
                    dayClass += ' sick';
                } else if (dayData.isHoliday) {
                    dayClass += ' holiday';
                } else {
                    dayClass += ' rest';
                }

                calendarHTML += `
                    <div class="${dayClass}" title="${dayData.description}">
                        <div class="day-number">${day}</div>
                        <div class="shift-type">${dayData.shiftCode}</div>
                    </div>
                `;
            } else {
                calendarHTML += `<div class="calendar-day"><div class="day-number">${day}</div></div>`;
            }
        }

        calendarHTML += '</div></div>';
        return calendarHTML;
    }

    loadOverviewData() {
        this.displayTopPerformers();
        this.displayShiftDistribution();
        this.displayYearlyTrends();
        this.displayWorkPatterns();
    }

    displayTopPerformers() {
        const nurses = Object.values(this.personData)
            .sort((a, b) => b.totalWorkValue - a.totalWorkValue)
            .slice(0, 5);

        const html = nurses.map((nurse, index) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee;">
                <div>
                    <strong>${index + 1}. ${nurse.nurseName}</strong><br>
                    <small>${nurse.totalWorkValue} 工作单位，共 ${nurse.totalRecords} 天</small>
                </div>
                <div style="text-align: right;">
                    <strong>${(nurse.totalWorkValue / nurse.totalRecords).toFixed(2)}</strong><br>
                    <small>平均/天</small>
                </div>
            </div>
        `).join('');

        document.getElementById('topPerformers').innerHTML = html;
    }

    displayShiftDistribution() {
        const distribution = this.database.statistics.shiftTypeDistribution;
        const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
        
        const sorted = Object.entries(distribution)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8);

        const html = sorted.map(([shiftType, count]) => {
            const percentage = ((count / total) * 100).toFixed(1);
            return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #eee;">
                    <span><strong>${shiftType || 'Empty'}</strong></span>
                    <span>${count.toLocaleString()} (${percentage}%)</span>
                </div>
            `;
        }).join('');

        document.getElementById('shiftDistribution').innerHTML = html;
    }

    displayYearlyTrends() {
        const yearly = this.database.statistics.yearlyBreakdown;
        
        const html = Object.entries(yearly).map(([year, data]) => {
            const avgWorkPerNurse = (data.workValue / data.uniqueNurses).toFixed(1);
            return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee;">
                    <div>
                        <strong>${year}年</strong><br>
                        <small>${data.uniqueNurses} 名护士</small>
                    </div>
                    <div style="text-align: right;">
                        <strong>${data.workValue}</strong> 工作单位<br>
                        <small>平均 ${avgWorkPerNurse}/护士</small>
                    </div>
                </div>
            `;
        }).join('');

        document.getElementById('yearlyTrends').innerHTML = html;
    }

    displayWorkPatterns() {
        const patterns = this.database.statistics.workPatterns;
        const totalDays = patterns.totalWorkDays + patterns.totalRestDays;
        const workRate = ((patterns.totalWorkDays / totalDays) * 100).toFixed(1);

        const html = `
            <div style="padding: 10px; border-bottom: 1px solid #eee;">
                <strong>工作率:</strong> ${workRate}%
            </div>
            <div style="padding: 10px; border-bottom: 1px solid #eee;">
                <strong>总工作天数:</strong> ${patterns.totalWorkDays.toLocaleString()}
            </div>
            <div style="padding: 10px; border-bottom: 1px solid #eee;">
                <strong>夜班:</strong> ${patterns.nightShifts.toLocaleString()}
            </div>
            <div style="padding: 10px; border-bottom: 1px solid #eee;">
                <strong>白班:</strong> ${patterns.dayShifts.toLocaleString()}
            </div>
            <div style="padding: 10px; border-bottom: 1px solid #eee;">
                <strong>周末工作:</strong> ${patterns.weekendWork.toLocaleString()}
            </div>
            <div style="padding: 10px;">
                <strong>假日工作:</strong> ${patterns.holidayWork.toLocaleString()}
            </div>
        `;

        document.getElementById('workPatterns').innerHTML = html;
    }

    // Utility functions
    getMonthName(month) {
        const monthNames = [
            '1月', '2月', '3月', '4月', '5月', '6月',
            '7月', '8月', '9月', '10月', '11月', '12月'
        ];
        return monthNames[month - 1];
    }

    calculateCareerSpan(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const years = Math.floor(diffDays / 365);
        const months = Math.floor((diffDays % 365) / 30);
        return `${years}年 ${months}个月`;
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    showError(message) {
        document.getElementById('loading').innerHTML = `
            <i class="fas fa-exclamation-triangle" style="color: #e74c3c;"></i>
            <p style="color: #e74c3c;">加载失败: ${message}</p>
        `;
    }

    // URL Parameter Management
    applyUrlParameters() {
        // Apply tab parameter
        const tab = this.urlParams.get('tab');
        if (tab && ['monthly', 'person', 'overview'].includes(tab)) {
            this.currentTab = tab;
            this.showTabFromUrl(tab);
        }

        // Apply monthly view parameters
        const year = this.urlParams.get('year');
        const month = this.urlParams.get('month');
        
        if (year) {
            // Set year button as active
            const yearBtn = document.querySelector(`#yearButtons [data-value="${year}"]`);
            if (yearBtn) {
                document.querySelectorAll('#yearButtons .selection-btn').forEach(btn => btn.classList.remove('active'));
                yearBtn.classList.add('active');
                this.updateAvailableMonths(year);
            }
        }
        
        if (month) {
            // Set month button as active
            const monthBtn = document.querySelector(`#monthButtons [data-value="${month.padStart(2, '0')}"]`);
            if (monthBtn) {
                document.querySelectorAll('#monthButtons .selection-btn').forEach(btn => btn.classList.remove('active'));
                monthBtn.classList.add('active');
            }
        }


        // Apply person view parameters
        const nurseId = this.urlParams.get('nurse');
        const nurseName = this.urlParams.get('nurseName');
        if (nurseId) {
            const personKey = nurseName ? `${nurseId}-${nurseName}` : 
                Object.keys(this.personData).find(key => key.startsWith(`${nurseId}-`));
            
            if (personKey && this.personData[personKey]) {
                const personBtn = document.querySelector(`#personButtons [data-value="${personKey}"]`);
                if (personBtn) {
                    document.querySelectorAll('#personButtons .selection-btn').forEach(btn => btn.classList.remove('active'));
                    personBtn.classList.add('active');
                }
            }
        }

        // Apply year filter for person view
        const personYear = this.urlParams.get('personYear');
        if (personYear) {
            const personYearBtn = document.querySelector(`#personYearButtons [data-value="${personYear}"]`);
            if (personYearBtn) {
                document.querySelectorAll('#personYearButtons .selection-btn').forEach(btn => btn.classList.remove('active'));
                personYearBtn.classList.add('active');
            }
        }
    }

    updateUrl() {
        const params = new URLSearchParams();
        
        // Add current tab
        params.set('tab', this.currentTab);

        // Add parameters based on current tab
        if (this.currentTab === 'monthly') {
            const selectedYear = this.getSelectedYear();
            const selectedMonth = this.getSelectedMonth();
            
            if (selectedYear) {
                params.set('year', selectedYear);
            }
            if (selectedMonth) {
                params.set('month', selectedMonth);
            }

        } else if (this.currentTab === 'person') {
            const personKey = this.getSelectedPerson();
            if (personKey) {
                const [nurseId, nurseName] = personKey.split('-');
                params.set('nurse', nurseId);
                if (nurseName) {
                    params.set('nurseName', nurseName);
                }
            }

            const selectedYear = this.getSelectedPersonYear();
            if (selectedYear) {
                params.set('personYear', selectedYear);
            }
        }

        // Update URL without refreshing the page
        const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
        window.history.replaceState({}, '', newUrl);
    }

    showTabFromUrl(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Remove active class from all tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });

        // Show selected tab and mark button as active
        document.getElementById(tabName).classList.add('active');
        
        // Find and activate the corresponding tab button
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            if (button.onclick && button.onclick.toString().includes(tabName)) {
                button.classList.add('active');
            } else if (button.getAttribute('onclick') && button.getAttribute('onclick').includes(tabName)) {
                button.classList.add('active');
            }
        });

        this.currentTab = tabName;
    }

    // Generate shareable URLs
    generateShareableUrl(type, params = {}) {
        const baseUrl = window.location.origin + window.location.pathname;
        const urlParams = new URLSearchParams();

        switch (type) {
            case 'monthly':
                urlParams.set('tab', 'monthly');
                if (params.year) urlParams.set('year', params.year);
                if (params.month) urlParams.set('month', params.month);
                if (params.sortBy) urlParams.set('sortBy', params.sortBy);
                break;

            case 'person':
                urlParams.set('tab', 'person');
                if (params.nurseId) urlParams.set('nurse', params.nurseId);
                if (params.nurseName) urlParams.set('nurseName', params.nurseName);
                if (params.year) urlParams.set('personYear', params.year);
                break;

            case 'overview':
                urlParams.set('tab', 'overview');
                break;
        }

        return `${baseUrl}?${urlParams.toString()}`;
    }

    // Selection methods
    setSelectedYear(year) {
        document.querySelectorAll('#yearButtons .selection-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`#yearButtons [data-value="${year}"]`).classList.add('active');
        this.updateAvailableMonths(year);
        this.loadMonthlyStats();
    }

    setSelectedMonth(month) {
        document.querySelectorAll('#monthButtons .selection-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`#monthButtons [data-value="${month}"]`).classList.add('active');
        this.loadMonthlyStats();
    }

    setSelectedPerson(personKey) {
        document.querySelectorAll('#personButtons .selection-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`#personButtons [data-value="${personKey}"]`).classList.add('active');
        this.loadPersonDetails();
    }

    setPersonYear(year) {
        document.querySelectorAll('#personYearButtons .selection-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`#personYearButtons [data-value="${year}"]`).classList.add('active');
        this.loadPersonDetails();
    }


    // Getter methods
    getSelectedYear() {
        const activeBtn = document.querySelector('#yearButtons .selection-btn.active');
        return activeBtn ? activeBtn.getAttribute('data-value') : null;
    }

    getSelectedMonth() {
        const activeBtn = document.querySelector('#monthButtons .selection-btn.active');
        return activeBtn ? activeBtn.getAttribute('data-value') : null;
    }

    getSelectedPerson() {
        const activeBtn = document.querySelector('#personButtons .selection-btn.active');
        return activeBtn ? activeBtn.getAttribute('data-value') : null;
    }

    getSelectedPersonYear() {
        const activeBtn = document.querySelector('#personYearButtons .selection-btn.active');
        return activeBtn ? activeBtn.getAttribute('data-value') : '';
    }


    // Update available months based on selected year
    updateAvailableMonths(selectedYear) {
        const monthButtons = document.querySelectorAll('#monthButtons .selection-btn');
        monthButtons.forEach(btn => {
            const month = btn.getAttribute('data-value');
            const monthKey = `${selectedYear}-${month}`;
            if (this.monthlyData[monthKey]) {
                btn.disabled = false;
                btn.style.opacity = '1';
            } else {
                btn.disabled = true;
                btn.style.opacity = '0.3';
            }
        });

        // Auto-select first available month if current selection is not available
        const currentMonth = this.getSelectedMonth();
        const currentMonthKey = `${selectedYear}-${currentMonth}`;
        if (!this.monthlyData[currentMonthKey]) {
            // Find first available month
            const availableMonth = Array.from(monthButtons).find(btn => 
                !btn.disabled && this.monthlyData[`${selectedYear}-${btn.getAttribute('data-value')}`]
            );
            if (availableMonth) {
                this.setSelectedMonth(availableMonth.getAttribute('data-value'));
            }
        }
    }

    // Set default selections
    setDefaultSelections() {
        // Skip if URL parameters were applied
        if (this.urlParams.toString()) return;

        // Default to first available year and month
        const years = [...new Set(Object.keys(this.monthlyData).map(key => key.split('-')[0]))].sort();
        if (years.length > 0) {
            this.setSelectedYear(years[0]);
        }

        // Default to first person
        const persons = Object.values(this.personData).sort((a, b) => a.nurseName.localeCompare(b.nurseName));
        if (persons.length > 0) {
            this.setSelectedPerson(`${persons[0].nurseId}-${persons[0].nurseName}`);
        }
    }

    displayAllYearsTable() {
        // 汇总所有年份的数据并生成表格
        const allYearsData = Object.values(this.monthlyData).reduce((acc, monthData) => {
            Object.values(monthData.nurses).forEach(nurse => {
                if (!acc[nurse.nurseId]) {
                    acc[nurse.nurseId] = { ...nurse, workValue: 0, savedRestDays: 0 };
                }
                acc[nurse.nurseId].workValue += nurse.workValue;
                acc[nurse.nurseId].savedRestDays += nurse.savedRestDays;
            });
            return acc;
        }, {});

        this.displayTable(allYearsData);
    }

    displayAllMonthsTable() {
        // 汇总该年所有月份的数据并生成表格
        const yearData = Object.keys(this.monthlyData)
            .filter(key => key.startsWith(this.selectedYear))
            .reduce((acc, key) => {
                const monthData = this.monthlyData[key];
                Object.values(monthData.nurses).forEach(nurse => {
                    if (!acc[nurse.nurseId]) {
                        acc[nurse.nurseId] = { ...nurse, workValue: 0, savedRestDays: 0 };
                    }
                    acc[nurse.nurseId].workValue += nurse.workValue;
                    acc[nurse.nurseId].savedRestDays += nurse.savedRestDays;
                });
                return acc;
            }, {});

        this.displayTable(yearData);
    }

    displayTable(data) {
        const tableHTML = `
            <table class="stats-table">
                <thead>
                    <tr>
                        <th>护士</th>
                        <th class="key-metric">存假</th>
                        <th class="key-metric">上班天数</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.values(data).map(nurse => `
                        <tr>
                            <td class="nurse-name">${nurse.nurseName}</td>
                            <td class="key-metric saved-rest">${nurse.savedRestDays >= 0 ? `存了 ${nurse.savedRestDays} 天` : `欠假 ${Math.abs(nurse.savedRestDays)} 天`}</td>
                            <td class="key-metric work-value">${nurse.workValue} 天</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        document.getElementById('monthlyStats').innerHTML = tableHTML;
    }
}

// Tab switching functionality
function showTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    // Show selected tab and mark button as active
    document.getElementById(tabName).classList.add('active');
    if (event && event.target) {
        event.target.classList.add('active');
    }

    // Update current tab and URL
    if (window.analyzer) {
        window.analyzer.currentTab = tabName;
        window.analyzer.updateUrl();
        
        // Load data for specific tabs
        if (tabName === 'person') {
            window.analyzer.loadPersonDetails();
        }
    }
}

// Initialize the analyzer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.analyzer = new HospitalShiftAnalyzer();
});

// Global functions for HTML event handlers
function loadMonthlyStats() {
    if (window.analyzer) {
        window.analyzer.loadMonthlyStats();
    }
}

function loadPersonDetails() {
    if (window.analyzer) {
        window.analyzer.loadPersonDetails();
    }
}


function setPersonYear(year) {
    if (window.analyzer) {
        window.analyzer.setPersonYear(year);
    }
}