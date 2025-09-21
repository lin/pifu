/**
 * 显示管理器 - 负责协调各个专门的显示管理器
 */
class DisplayManager {
    constructor(dataProcessor) {
        this.dataProcessor = dataProcessor;
        
        // 初始化各个专门的显示管理器
        this.monthlyDisplayManager = new MonthlyDisplayManager(dataProcessor);
        this.calendarDisplayManager = new CalendarDisplayManager(dataProcessor);
        this.personDisplayManager = new PersonDisplayManager(dataProcessor, this.calendarDisplayManager);
        this.chartDisplayManager = new ChartDisplayManager();
        this.rankingDisplayManager = new RankingDisplayManager(dataProcessor);
    }

    /**
     * 显示月度汇总
     */
    displayMonthlySummary(monthData) {
        this.monthlyDisplayManager.displayMonthlySummary(monthData);
    }

    /**
     * 显示月度统计表格
     */
    displayMonthlyTable(monthData) {
        this.monthlyDisplayManager.displayMonthlyTable(monthData);
        
        // 添加月度日历显示
        this.displayMonthlyCalendar(monthData);
    }

    /**
     * 显示月度日历
     */
    displayMonthlyCalendar(monthData) {
        this.calendarDisplayManager.displayMonthlyCalendar(monthData);
    }

    /**
     * 显示个人概览
     */
    displayPersonOverview(nurseKey) {
        this.personDisplayManager.displayPersonOverview(nurseKey);
        
        // 生成图表
        this.displayPersonCharts(nurseKey);
    }

    /**
     * 显示个人月度详情
     */
    displayPersonMonthly(nurseKey) {
        this.personDisplayManager.displayPersonMonthly(nurseKey);
    }

    /**
     * 生成月度日历 - 委托给CalendarDisplayManager
     */
    generateMonthCalendar(year, month, monthData, nurse = null) {
        return this.calendarDisplayManager.generateMonthCalendar(year, month, monthData, nurse);
    }

    /**
     * 显示个人图表
     */
    displayPersonCharts(nurseKey) {
        this.chartDisplayManager.displayPersonCharts(nurseKey, this.dataProcessor);
    }

    /**
     * 创建图表 - 委托给ChartDisplayManager
     */
    createChart(canvasId, label, labels, data, color, referenceLine = null) {
        this.chartDisplayManager.createChart(canvasId, label, labels, data, color, referenceLine);
    }

    /**
     * 创建总览页面的柱状图 - 委托给ChartDisplayManager
     */
    createOverviewBarChart(canvasId, label, labels, data, color) {
        this.chartDisplayManager.createOverviewBarChart(canvasId, label, labels, data, color);
    }

    /**
     * 销毁现有图表 - 委托给ChartDisplayManager
     */
    destroyExistingCharts() {
        this.chartDisplayManager.destroyExistingCharts();
    }

    /**
     * 显示存假天数排名表 - 委托给RankingDisplayManager
     */
    displaySavedDaysRanking() {
        this.rankingDisplayManager.displaySavedDaysRanking();
    }
}