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
            await this.processData();
            this.initializeUI();
            this.setupTabNavigation();
            this.setupDatasetToggle();
            this.hideLoading();
        } catch (error) {
            console.error('Failed to initialize analyzer:', error);
            this.showError('Failed to load hospital shift data');
        }
    }

    /**
     * 加载数据库 - 现在由DataProcessor处理
     */
    async loadDatabase() {
        // 数据库加载现在由DataProcessor的DataLoader处理
        // 这里保留方法以保持向后兼容性
    }

    /**
     * 初始化各个模块
     */
    initializeModules() {
        this.dataProcessor = new DataProcessor();
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
    async processData() {
        await this.dataProcessor.processData();
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
     * 设置数据集切换按钮
     */
    setupDatasetToggle() {
        const toggleButton = document.getElementById('datasetToggle');
        const datasetLabel = document.getElementById('datasetLabel');
        
        if (!toggleButton || !datasetLabel) {
            console.error('Dataset toggle elements not found');
            return;
        }

        // 更新按钮状态
        this.updateToggleButton();

        toggleButton.addEventListener('click', () => {
            const currentIncludePandemic = this.getIncludePandemicData();
            const newIncludePandemic = !currentIncludePandemic;
            
            this.setIncludePandemicData(newIncludePandemic);
            this.updateToggleButton();
        });
    }

    /**
     * 更新切换按钮的显示状态
     */
    updateToggleButton() {
        const toggleButton = document.getElementById('datasetToggle');
        const datasetLabel = document.getElementById('datasetLabel');
        
        if (!toggleButton || !datasetLabel) return;

        const includePandemic = this.getIncludePandemicData();
        
        if (includePandemic) {
            toggleButton.classList.add('post-pandemic');
            toggleButton.innerHTML = '<i class="fas fa-virus"></i><span id="datasetLabel">包含疫情数据 (2014-04 至 2020-08)</span>';
        } else {
            toggleButton.classList.remove('post-pandemic');
            toggleButton.innerHTML = '<i class="fas fa-virus"></i><span id="datasetLabel">不包含疫情数据 (2014-04 至 2020-01)</span>';
        }
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
     * 切换是否包含疫情数据
     * @param {boolean} includePandemic - true = include pandemic data, false = exclude pandemic data
     */
    setIncludePandemicData(includePandemic) {
        this.dataProcessor.setIncludePandemicData(includePandemic);
        
        // 重新加载当前标签页的数据
        if (this.currentTab === 'monthly') {
            this.uiController.loadMonthlyStats();
        } else if (this.currentTab === 'person') {
            this.uiController.loadPersonDetails();
        } else if (this.currentTab === 'overview') {
            this.uiController.loadOverviewData();
        }
    }

    /**
     * 获取当前是否包含疫情数据
     * @returns {boolean} 是否包含疫情数据
     */
    getIncludePandemicData() {
        return this.dataProcessor.dataLoader.includePandemicData;
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
    window.hospitalShiftAnalyzer = new HospitalShiftAnalyzer();
});