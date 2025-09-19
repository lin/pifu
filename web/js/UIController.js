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
        this.setupTabEventListeners();
        this.populateYearButtons();
        this.populatePersonButtons();
        this.setDefaultSelections();
        // 在设置默认年份后再填充月份按钮，这样可以正确应用禁用状态
        this.populateMonthButtons();
        
        // Load URL parameters after all UI is ready
        setTimeout(() => {
            this.loadFromURLParams();
        }, 100);
        
        this.loadMonthlyStats();
        this.loadPersonDetails();
        this.loadOverviewData();
    }

    /**
     * 设置标签页事件监听器
     */
    setupTabEventListeners() {
        document.querySelectorAll('.tab-button').forEach(tabButton => {
            tabButton.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab || e.target.closest('[data-tab]').dataset.tab;
                if (tabName) {
                    this.switchTab(tabName);
                }
            });
        });
    }

    /**
     * 切换标签页
     */
    switchTab(tabName) {
        // Remove active class from all tabs
        document.querySelectorAll('.tab-button').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Hide all tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Set active tab
        const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
        const tabContent = document.getElementById(tabName);
        
        if (tabButton && tabContent) {
            tabButton.classList.add('active');
            tabContent.classList.add('active');
            this.updateURL();
        }
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
                return; // setSelectedMonth 会调用 loadMonthlyStats 和 updateURL
            }
        }
        
        this.loadMonthlyStats();
        this.updateURL();
    }

    /**
     * 设置选中的月份
     */
    setSelectedMonth(month) {
        document.querySelectorAll('#monthButtons .selection-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`#monthButtons [data-value="${month}"]`).classList.add('active');
        this.loadMonthlyStats();
        this.updateURL();
    }

    /**
     * 设置选中的护士
     */
    setSelectedPerson(personKey) {
        document.querySelectorAll('#personButtons .selection-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`#personButtons [data-value="${personKey}"]`).classList.add('active');
        this.loadPersonDetails();
        this.updateURL();
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
        this.displayAllNursesCumulativeSavedDaysChart();
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
     * 显示所有护士累计存假天数趋势图表
     */
    displayAllNursesCumulativeSavedDaysChart() {
        // 只显示选定的5个护士
        const selectedNurseNames = ['马磊', '付伟', '尤嘉', '李如心', '赵蕊'];
        const allNurses = this.dataProcessor.getAllNurses();
        const selectedNurses = allNurses.filter(nurse => 
            selectedNurseNames.includes(nurse.nurseName)
        );
        
        // 获取所有月份数据
        const allMonths = new Set();
        selectedNurses.forEach(nurse => {
            const nurseSummary = this.dataProcessor.getNurseMonthlySummary(nurse.nurseKey);
            if (nurseSummary && nurseSummary.months) {
                Object.keys(nurseSummary.months).forEach(monthKey => {
                    allMonths.add(monthKey);
                });
            }
        });
        
        // 按时间顺序排序月份
        const sortedMonths = Array.from(allMonths).sort();
        
        // 为每个护士创建数据集
        const datasets = [];
        const colors = [
            '#dc2626', // Red - 马磊
            '#059669', // Green - 付伟  
            '#7c3aed', // Purple - 尤嘉
            '#ea580c', // Orange - 李如心
            '#0ea5e9'  // Blue - 赵蕊
        ];
        
        selectedNurses.forEach((nurse, index) => {
            const nurseSummary = this.dataProcessor.getNurseMonthlySummary(nurse.nurseKey);
            if (!nurseSummary || !nurseSummary.months) return;
            
            // 计算累计存假天数
            let cumulativeSavedRest = 0;
            const cumulativeData = sortedMonths.map(monthKey => {
                const monthData = nurseSummary.months[monthKey];
                if (monthData) {
                    cumulativeSavedRest += monthData.savedRestDays;
                }
                return cumulativeSavedRest;
            });
            
            const color = colors[index % colors.length];
            datasets.push({
                label: nurseSummary.nurseName,
                data: cumulativeData,
                borderColor: color,
                backgroundColor: color + '20',
                borderWidth: 3,
                fill: false,
                tension: 0.4,
                pointBackgroundColor: 'transparent',
                pointBorderColor: 'transparent',
                pointBorderWidth: 0,
                pointRadius: 0,
                pointHoverRadius: 0
            });
        });
        
        // 格式化月份标签
        const monthLabels = sortedMonths.map(monthKey => {
            const [year, month] = monthKey.split('-');
            return `${year}-${month}`;
        });
        
        // 创建图表
        const ctx = document.getElementById('allNursesCumulativeSavedDaysChart');
        if (!ctx) return;
        
        // 设置固定高度为666px
        ctx.style.height = '666px !important';
        ctx.style.maxHeight = '666px !important';
        ctx.style.minHeight = '666px !important';
        ctx.height = 666;
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthLabels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        align: 'start',
                        labels: {
                            usePointStyle: false,
                            boxWidth: 20,
                            boxHeight: 20,
                            padding: 20,
                            font: {
                                size: 12,
                                weight: '500'
                            },
                            color: '#334155',
                            generateLabels: function(chart) {
                                const original = Chart.defaults.plugins.legend.labels.generateLabels;
                                const labels = original.call(this, chart);
                                // Add custom styling for better visibility
                                labels.forEach(label => {
                                    label.fillStyle = label.strokeStyle;
                                    label.lineWidth = 3;
                                });
                                return labels;
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderWidth: 1,
                        displayColors: true,
                        usePointStyle: true,
                        callbacks: {
                            title: function(context) {
                                return context[0].label;
                            },
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y} 天`;
                            },
                            labelColor: function(context) {
                                return {
                                    borderColor: context.dataset.borderColor,
                                    backgroundColor: context.dataset.borderColor,
                                    borderWidth: 3,
                                    borderDash: [],
                                    pointStyle: 'line'
                                };
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
                                weight: 500
                            }
                        },
                        ticks: {
                            color: '#64748b',
                            font: {
                                size: 11
                            },
                            maxRotation: 45
                        },
                        grid: {
                            color: '#e2e8f0',
                            drawBorder: false
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: '累计存假天数',
                            color: '#64748b',
                            font: {
                                size: 12,
                                weight: 500
                            }
                        },
                        ticks: {
                            color: '#64748b',
                            font: {
                                size: 11
                            }
                        },
                        grid: {
                            color: '#e2e8f0',
                            drawBorder: false
                        }
                    }
                }
            }
        });
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

    /**
     * 从URL参数加载状态
     * @returns {boolean} 是否成功从URL参数加载
     */
    loadFromURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        
        if (!tab) return false;
        
        // Set active tab
        this.setActiveTab(tab);
        
        switch (tab) {
            case 'monthly':
                return this.loadMonthlyParams(urlParams);
            case 'person':
                return this.loadPersonParams(urlParams);
            case 'overview':
                return true; // Overview doesn't need additional params
            default:
                return false;
        }
    }

    /**
     * 加载月度统计页面的URL参数
     */
    loadMonthlyParams(urlParams) {
        const year = urlParams.get('year');
        const month = urlParams.get('month');
        let loaded = false;
        
        if (year) {
            const yearButton = document.querySelector(`#yearButtons [data-value="${year}"]`);
            if (yearButton) {
                this.setSelectedYear(year);
                loaded = true;
            }
        }
        
        if (month) {
            // Month buttons are already populated, find and select
            const monthButton = document.querySelector(`#monthButtons [data-value="${month}"]`);
            if (monthButton && !monthButton.disabled) {
                this.setSelectedMonth(month);
                loaded = true;
            }
        }
        
        return loaded;
    }

    /**
     * 加载个人页面的URL参数
     */
    loadPersonParams(urlParams) {
        const nurse = urlParams.get('nurse');
        
        if (nurse) {
            // Find the nurse button by nurse ID
            const personButtons = document.querySelectorAll('#personButtons .selection-btn');
            for (const button of personButtons) {
                const nurseKey = button.getAttribute('data-value');
                if (nurseKey && nurseKey.startsWith(nurse + '-')) {
                    this.setSelectedPerson(nurseKey);
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * 设置活动标签页
     */
    setActiveTab(tabName) {
        // Remove active class from all tabs
        document.querySelectorAll('.tab-button').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Hide all tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Set active tab
        const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
        const tabContent = document.getElementById(tabName);
        
        if (tabButton && tabContent) {
            tabButton.classList.add('active');
            tabContent.classList.add('active');
        }
    }

    /**
     * 更新URL参数
     */
    updateURL() {
        const urlParams = new URLSearchParams();
        
        // Get current active tab
        const activeTab = document.querySelector('.tab-button.active');
        if (!activeTab) return;
        
        const tabName = activeTab.dataset.tab;
        urlParams.set('tab', tabName);
        
        switch (tabName) {
            case 'monthly':
                const selectedYear = this.getSelectedYear();
                const selectedMonth = this.getSelectedMonth();
                if (selectedYear) urlParams.set('year', selectedYear);
                if (selectedMonth) urlParams.set('month', selectedMonth);
                break;
                
            case 'person':
                const selectedPerson = this.getSelectedPerson();
                if (selectedPerson) {
                    const nurseId = selectedPerson.split('-')[0];
                    urlParams.set('nurse', nurseId);
                }
                break;
                
            case 'overview':
                // No additional params needed for overview
                break;
        }
        
        // Update URL without page reload
        const newURL = window.location.pathname + '?' + urlParams.toString();
        window.history.pushState({}, '', newURL);
    }
}