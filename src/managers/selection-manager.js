/**
 * 选择管理器 - 负责处理年份、月份、护士选择逻辑
 */
class SelectionManager {
    constructor(dataProcessor) {
        this.dataProcessor = dataProcessor;
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
                return; // setSelectedMonth 会调用相关回调
            }
        }
        
        // 触发年份选择回调
        if (this.onYearSelected) {
            this.onYearSelected(year);
        }
    }

    /**
     * 设置选中的月份
     */
    setSelectedMonth(month) {
        document.querySelectorAll('#monthButtons .selection-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`#monthButtons [data-value="${month}"]`).classList.add('active');
        
        // 触发月份选择回调
        if (this.onMonthSelected) {
            this.onMonthSelected(month);
        }
    }

    /**
     * 设置选中的护士
     */
    setSelectedPerson(personKey) {
        document.querySelectorAll('#personButtons .selection-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`#personButtons [data-value="${personKey}"]`).classList.add('active');
        
        // 触发护士选择回调
        if (this.onPersonSelected) {
            this.onPersonSelected(personKey);
        }
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
     * 设置回调函数
     */
    setCallbacks(callbacks) {
        this.onYearSelected = callbacks.onYearSelected;
        this.onMonthSelected = callbacks.onMonthSelected;
        this.onPersonSelected = callbacks.onPersonSelected;
    }
}