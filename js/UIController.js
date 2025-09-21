/**
 * UI控制器 - 负责处理用户界面交互
 */
class UIController {
    constructor(dataProcessor) {
        this.dataProcessor = dataProcessor;
        
        // Initialize managers
        this.tabManager = new TabManager();
        this.selectionManager = new SelectionManager(dataProcessor);
        this.displayManager = new DisplayManager(dataProcessor);
        this.chartManager = new ChartManager(dataProcessor);
        
        // Set up callbacks
        this.setupCallbacks();
    }

    /**
     * 设置回调函数
     */
    setupCallbacks() {
        this.selectionManager.setCallbacks({
            onYearSelected: (year) => this.onYearSelected(year),
            onMonthSelected: (month) => this.onMonthSelected(month),
            onPersonSelected: (personKey) => this.onPersonSelected(personKey)
        });
    }

    /**
     * 初始化UI
     */
    initializeUI() {
        this.tabManager.setupTabEventListeners();
        this.selectionManager.populateYearButtons();
        this.selectionManager.populatePersonButtons();
        this.selectionManager.setDefaultSelections();
        // 在设置默认年份后再填充月份按钮，这样可以正确应用禁用状态
        this.selectionManager.populateMonthButtons();
        
        // Load URL parameters after all UI is ready
        setTimeout(() => {
            this.loadFromURLParams();
        }, 100);
        
        this.loadMonthlyStats();
        this.loadPersonDetails();
        this.loadOverviewData();
    }

    /**
     * 年份选择回调
     */
    onYearSelected(year) {
        this.loadMonthlyStats();
        this.tabManager.updateURL();
    }

    /**
     * 月份选择回调
     */
    onMonthSelected(month) {
        this.loadMonthlyStats();
        this.tabManager.updateURL();
    }

    /**
     * 护士选择回调
     */
    onPersonSelected(personKey) {
        this.loadPersonDetails();
        this.tabManager.updateURL();
    }



    /**
     * 加载月度统计
     */
    loadMonthlyStats() {
        const selectedYear = this.selectionManager.getSelectedYear();
        const selectedMonth = this.selectionManager.getSelectedMonth();
        
        if (!selectedYear || !selectedMonth) return;

        const monthKey = `${selectedYear}-${selectedMonth}`;
        if (!this.dataProcessor.monthlyData[monthKey]) return;

        const monthData = this.dataProcessor.monthlyData[monthKey];

        this.displayManager.displayMonthlySummary(monthData);
        this.displayManager.displayMonthlyTable(monthData);
    }

    /**
     * 加载个人详情
     */
    loadPersonDetails() {
        const personKey = this.selectionManager.getSelectedPerson();
        
        if (!personKey) return;

        this.displayManager.displayPersonOverview(personKey);
        this.displayManager.displayPersonMonthly(personKey);
    }

    /**
     * 加载总览数据
     */
    loadOverviewData() {
        this.displayManager.displaySavedDaysRanking();
        this.chartManager.displayAllNursesCumulativeSavedDaysChart();
    }



    /**
     * 从URL参数加载状态
     * @returns {boolean} 是否成功从URL参数加载
     */
    loadFromURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = this.tabManager.loadFromURLParams();
        
        if (!tab) return false;
        
        switch (tab) {
            case 'monthly':
                return this.selectionManager.loadMonthlyParams(urlParams);
            case 'person':
                return this.selectionManager.loadPersonParams(urlParams);
            case 'overview':
                return true; // Overview doesn't need additional params
            default:
                return false;
        }
    }
}