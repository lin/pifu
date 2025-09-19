/**
 * 医院排班分析器主类 - 协调各个模块
 */
class HospitalShiftAnalyzer {
    constructor() {
        this.database = null;
        this.dataProcessor = null;
        this.uiController = null;
        this.displayManager = null;
        this.currentTab = 'monthly';
        this.init();
    }

    /**
     * 初始化分析器
     */
    async init() {
        try {
            await this.loadDatabase();
            this.initializeModules();
            this.processData();
            this.initializeUI();
            this.setupTabNavigation();
            this.hideLoading();
        } catch (error) {
            console.error('Failed to initialize analyzer:', error);
            this.showError('Failed to load hospital shift data');
        }
    }

    /**
     * 加载数据库
     */
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

    /**
     * 初始化各个模块
     */
    initializeModules() {
        this.dataProcessor = new DataProcessor(this.database);
        this.displayManager = new DisplayManager(this.dataProcessor);
        this.uiController = new UIController(this.dataProcessor);
        
        // 将显示管理器的方法绑定到UI控制器
        this.uiController.displayMonthlySummary = this.displayManager.displayMonthlySummary.bind(this.displayManager);
        this.uiController.displayMonthlyTable = this.displayManager.displayMonthlyTable.bind(this.displayManager);
        this.uiController.displayPersonOverview = this.displayManager.displayPersonOverview.bind(this.displayManager);
        this.uiController.displayPersonMonthly = this.displayManager.displayPersonMonthly.bind(this.displayManager);
        
        // 绑定displayManager实例到UIController，以便访问其他方法
        this.uiController.displayManager = this.displayManager;
    }

    /**
     * 处理数据
     */
    processData() {
        this.dataProcessor.processData();
    }

    /**
     * 初始化UI
     */
    initializeUI() {
        this.uiController.initializeUI();
    }

    /**
     * 设置标签页导航
     */
    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                
                // Remove active class from all buttons and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked button and corresponding content
                button.classList.add('active');
                document.getElementById(targetTab).classList.add('active');
                
                this.currentTab = targetTab;
                
                // Load appropriate data for the tab
                if (targetTab === 'monthly') {
                    this.uiController.loadMonthlyStats();
                } else if (targetTab === 'person') {
                    this.uiController.loadPersonDetails();
                } else if (targetTab === 'overview') {
                    this.uiController.loadOverviewData();
                }
            });
        });
    }

    /**
     * 隐藏加载界面
     */
    hideLoading() {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    /**
     * 显示错误信息
     */
    showError(message) {
        const errorElement = document.getElementById('error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        this.hideLoading();
    }

    /**
     * 计算职业跨度（保留用于兼容性）
     */
    calculateCareerSpan(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const years = Math.floor(diffDays / 365);
        const months = Math.floor((diffDays % 365) / 30);
        return `${years}年${months}个月`;
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new HospitalShiftAnalyzer();
});