/**
 * UI控制器 - 负责处理用户界面交互
 */
class UIController {
    constructor(dataProcessor) {
        this.dataProcessor = dataProcessor;
        this.currentTab = 'monthly';
    }

    /**
     * 初始化UI
     */
    initializeUI() {
        this.populateYearButtons();
        this.populatePersonButtons();
        this.setDefaultSelections();
        // 在设置默认年份后再填充月份按钮，这样可以正确应用禁用状态
        this.populateMonthButtons();
        this.loadMonthlyStats();
        this.loadPersonDetails();
        this.loadOverviewData();
    }

    /**
     * 填充年份按钮
     */
    populateYearButtons() {
        const years = [...new Set(Object.keys(this.dataProcessor.monthlyData).map(key => key.split('-')[0]))].sort();
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

    /**
     * 填充月份按钮
     */
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
            
            // 检查是否需要禁用（2014年前三个月）
            const selectedYear = this.getSelectedYear();
            const isDisabled = selectedYear === '2014' && ['01', '02', '03'].includes(month.num);
            
            if (isDisabled) {
                button.disabled = true;
                button.classList.add('disabled');
                button.title = '该月份无数据';
            } else {
                button.onclick = () => this.setSelectedMonth(month.num);
            }
            
            monthButtons.appendChild(button);
        });
        
        // 设置默认月份选择
        if (!document.querySelector('#monthButtons .selection-btn.active')) {
            const selectedYear = this.getSelectedYear();
            if (selectedYear === '2014') {
                const aprilBtn = document.querySelector('#monthButtons [data-value="04"]');
                if (aprilBtn && !aprilBtn.disabled) {
                    aprilBtn.classList.add('active');
                }
            } else {
                const firstMonthBtn = document.querySelector('#monthButtons .selection-btn:not(.disabled)');
                if (firstMonthBtn) firstMonthBtn.classList.add('active');
            }
        }
    }

    /**
     * 填充护士按钮
     */
    populatePersonButtons() {
        const persons = Object.values(this.dataProcessor.personData).sort((a, b) => a.nurseName.localeCompare(b.nurseName));
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


    /**
     * 设置选中的年份
     */
    setSelectedYear(year) {
        document.querySelectorAll('#yearButtons .selection-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`#yearButtons [data-value="${year}"]`).classList.add('active');
        
        // 重新填充月份按钮以更新禁用状态
        this.populateMonthButtons();
        
        // 如果选择了2014年，确保选择有效的月份
        if (year === '2014') {
            const currentMonth = this.getSelectedMonth();
            if (['01', '02', '03'].includes(currentMonth)) {
                // 如果当前选择的是无效月份，切换到4月
                this.setSelectedMonth('04');
                return; // setSelectedMonth 会调用 loadMonthlyStats
            }
        }
        
        this.loadMonthlyStats();
    }

    /**
     * 设置选中的月份
     */
    setSelectedMonth(month) {
        document.querySelectorAll('#monthButtons .selection-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`#monthButtons [data-value="${month}"]`).classList.add('active');
        this.loadMonthlyStats();
    }

    /**
     * 设置选中的护士
     */
    setSelectedPerson(personKey) {
        document.querySelectorAll('#personButtons .selection-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`#personButtons [data-value="${personKey}"]`).classList.add('active');
        this.loadPersonDetails();
    }


    /**
     * 获取当前选中的年份
     */
    getSelectedYear() {
        const activeBtn = document.querySelector('#yearButtons .selection-btn.active');
        return activeBtn ? activeBtn.getAttribute('data-value') : null;
    }

    /**
     * 获取当前选中的月份
     */
    getSelectedMonth() {
        const activeBtn = document.querySelector('#monthButtons .selection-btn.active');
        return activeBtn ? activeBtn.getAttribute('data-value') : null;
    }

    /**
     * 获取当前选中的护士
     */
    getSelectedPerson() {
        const activeBtn = document.querySelector('#personButtons .selection-btn.active');
        return activeBtn ? activeBtn.getAttribute('data-value') : null;
    }



    /**
     * 设置默认选择
     */
    setDefaultSelections() {
        // Set default year to 2014
        if (!document.querySelector('#yearButtons .selection-btn.active')) {
            const year2014Btn = document.querySelector('#yearButtons [data-value="2014"]');
            if (year2014Btn) {
                year2014Btn.classList.add('active');
            } else {
                // 如果2014年不存在，选择第一个可用年份
                const firstYearBtn = document.querySelector('#yearButtons .selection-btn');
                if (firstYearBtn) firstYearBtn.classList.add('active');
            }
        }

        // 月份按钮的默认选择将在 populateMonthButtons 之后单独处理

        // Set default person (first available)
        if (!document.querySelector('#personButtons .selection-btn.active')) {
            const firstPersonBtn = document.querySelector('#personButtons .selection-btn');
            if (firstPersonBtn) firstPersonBtn.classList.add('active');
        }

    }


    /**
     * 加载月度统计
     */
    loadMonthlyStats() {
        const selectedYear = this.getSelectedYear();
        const selectedMonth = this.getSelectedMonth();
        
        if (!selectedYear || !selectedMonth) return;

        const monthKey = `${selectedYear}-${selectedMonth}`;
        if (!this.dataProcessor.monthlyData[monthKey]) return;

        const monthData = this.dataProcessor.monthlyData[monthKey];

        this.displayMonthlySummary(monthData);
        this.displayMonthlyTable(monthData);
    }

    /**
     * 加载个人详情
     */
    loadPersonDetails() {
        const personKey = this.getSelectedPerson();
        
        if (!personKey) return;

        this.displayPersonOverview(personKey);
        this.displayPersonMonthly(personKey);
    }

    /**
     * 加载总览数据
     */
    loadOverviewData() {
        this.displaySavedDaysRanking();
        this.displaySavedDaysChart();
        this.displayWorkedDaysRanking();
        this.displayWorkedDaysChart();
        this.displayRestDaysRanking();
        this.displayRestDaysChart();
    }

    /**
     * 显示存假天数排名表
     */
    displaySavedDaysRanking() {
        const allNurses = this.dataProcessor.getAllNurses();
        const nurseStats = allNurses.map(nurse => {
            const totalSummary = this.dataProcessor.getNurseTotalSummary(nurse.nurseKey);
            return totalSummary;
        }).filter(summary => summary !== null)
          .sort((a, b) => b.totalSavedRestDays - a.totalSavedRestDays);

        const html = `
            <table>
                <thead>
                    <tr>
                        <th>排名</th>
                        <th>护士姓名</th>
                        <th>护士编号</th>
                        <th>总存假天数</th>
                    </tr>
                </thead>
                <tbody>
                    ${nurseStats.map((nurse, index) => `
                        <tr>
                            <td class="rank">#${index + 1}</td>
                            <td class="nurse-name">${nurse.nurseName}</td>
                            <td>${nurse.nurseId}</td>
                            <td class="value ${nurse.totalSavedRestDays >= 0 ? 'positive' : 'negative'}">
                                ${nurse.totalSavedRestDays >= 0 ? `存了 ${nurse.totalSavedRestDays} 天` : `欠假 ${Math.abs(nurse.totalSavedRestDays)} 天`}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        document.getElementById('savedDaysRankingTable').innerHTML = html;
    }

    /**
     * 显示存假天数对比图表
     */
    displaySavedDaysChart() {
        const allNurses = this.dataProcessor.getAllNurses();
        const nurseStats = allNurses.map(nurse => {
            const totalSummary = this.dataProcessor.getNurseTotalSummary(nurse.nurseKey);
            return totalSummary;
        }).filter(summary => summary !== null)
          .sort((a, b) => b.totalSavedRestDays - a.totalSavedRestDays);

        const labels = nurseStats.map(nurse => nurse.nurseName);
        const data = nurseStats.map(nurse => nurse.totalSavedRestDays);

        this.displayManager.createOverviewBarChart('savedDaysBarChart', '存假天数对比', labels, data, '#dc2626');
    }

    /**
     * 显示有效工作日排名表
     */
    displayWorkedDaysRanking() {
        const allNurses = this.dataProcessor.getAllNurses();
        const nurseStats = allNurses.map(nurse => {
            const totalSummary = this.dataProcessor.getNurseTotalSummary(nurse.nurseKey);
            return totalSummary;
        }).filter(summary => summary !== null)
          .sort((a, b) => b.totalWorkedDays - a.totalWorkedDays);

        const html = `
            <table>
                <thead>
                    <tr>
                        <th>排名</th>
                        <th>护士姓名</th>
                        <th>护士编号</th>
                        <th>总有效工作日</th>
                    </tr>
                </thead>
                <tbody>
                    ${nurseStats.map((nurse, index) => `
                        <tr>
                            <td class="rank">#${index + 1}</td>
                            <td class="nurse-name">${nurse.nurseName}</td>
                            <td>${nurse.nurseId}</td>
                            <td class="value positive">${nurse.totalWorkedDays} 天</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        document.getElementById('workedDaysRankingTable').innerHTML = html;
    }

    /**
     * 显示有效工作日对比图表
     */
    displayWorkedDaysChart() {
        const allNurses = this.dataProcessor.getAllNurses();
        const nurseStats = allNurses.map(nurse => {
            const totalSummary = this.dataProcessor.getNurseTotalSummary(nurse.nurseKey);
            return totalSummary;
        }).filter(summary => summary !== null)
          .sort((a, b) => b.totalWorkedDays - a.totalWorkedDays);

        const labels = nurseStats.map(nurse => nurse.nurseName);
        const data = nurseStats.map(nurse => nurse.totalWorkedDays);

        this.displayManager.createOverviewBarChart('workedDaysBarChart', '有效工作日对比', labels, data, '#059669');
    }

    /**
     * 显示有效休息日排名表
     */
    displayRestDaysRanking() {
        const allNurses = this.dataProcessor.getAllNurses();
        const nurseStats = allNurses.map(nurse => {
            const nurseSummary = this.dataProcessor.getNurseMonthlySummary(nurse.nurseKey);
            if (!nurseSummary || !nurseSummary.months) return null;

            // 计算总有效休息日：每月的 (totalDays - workedDays - holidayDays) 之和
            let totalRestDays = 0;
            Object.values(nurseSummary.months).forEach(monthData => {
                const monthRestDays = monthData.totalDays - monthData.workedDays - monthData.holidayDays;
                totalRestDays += monthRestDays;
            });

            return {
                nurseId: nurseSummary.nurseId,
                nurseName: nurseSummary.nurseName,
                totalRestDays: totalRestDays
            };
        }).filter(summary => summary !== null);
        
        nurseStats.sort((a, b) => b.totalRestDays - a.totalRestDays);

        const html = `
            <table>
                <thead>
                    <tr>
                        <th>排名</th>
                        <th>护士姓名</th>
                        <th>护士编号</th>
                        <th>总有效休息日</th>
                    </tr>
                </thead>
                <tbody>
                    ${nurseStats.map((nurse, index) => `
                        <tr>
                            <td class="rank">#${index + 1}</td>
                            <td class="nurse-name">${nurse.nurseName}</td>
                            <td>${nurse.nurseId}</td>
                            <td class="value positive">${nurse.totalRestDays} 天</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        document.getElementById('restDaysRankingTable').innerHTML = html;
    }

    /**
     * 显示有效休息日对比图表
     */
    displayRestDaysChart() {
        const allNurses = this.dataProcessor.getAllNurses();
        const nurseStats = allNurses.map(nurse => {
            const nurseSummary = this.dataProcessor.getNurseMonthlySummary(nurse.nurseKey);
            if (!nurseSummary || !nurseSummary.months) return null;

            // 计算总有效休息日：每月的 (totalDays - workedDays - holidayDays) 之和
            let totalRestDays = 0;
            Object.values(nurseSummary.months).forEach(monthData => {
                const monthRestDays = monthData.totalDays - monthData.workedDays - monthData.holidayDays;
                totalRestDays += monthRestDays;
            });

            return {
                nurseId: nurseSummary.nurseId,
                nurseName: nurseSummary.nurseName,
                totalRestDays: totalRestDays
            };
        }).filter(summary => summary !== null);
        
        nurseStats.sort((a, b) => b.totalRestDays - a.totalRestDays);

        const labels = nurseStats.map(nurse => nurse.nurseName);
        const data = nurseStats.map(nurse => nurse.totalRestDays);

        this.displayManager.createOverviewBarChart('restDaysBarChart', '有效休息日对比', labels, data, '#3b82f6');
    }
}