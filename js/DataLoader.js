/**
 * 数据加载器 - 负责加载各种配置和调整数据
 */
class DataLoader {
    constructor() {
        this.initialSavedRestDays = {};
        this.yearEndAdjustments = [];
    }

    /**
     * 加载初始存假天数数据
     */
    async loadInitialSavedRestDays() {
        try {
            const response = await fetch('data/config/initial_saved_rest_days.json');
            if (!response.ok) {
                console.warn('Failed to load initial saved rest days data, using default values');
                return;
            }
            const initialData = await response.json();
            
            // 将数据转换为以护士姓名为键的对象
            initialData.forEach(nurse => {
                this.initialSavedRestDays[nurse.name] = nurse.saved_rest_days;
            });
            
        } catch (error) {
            console.warn('Error loading initial saved rest days data:', error);
        }
    }

    /**
     * 加载年末调整数据
     */
    async loadYearEndAdjustments() {
        try {
            const response = await fetch('data/config/year_end_adjustments.json');
            this.yearEndAdjustments = await response.json();
        } catch (error) {
            console.error('Error loading year-end adjustments:', error);
            this.yearEndAdjustments = [];
        }
    }

    /**
     * 获取护士的初始存假天数
     * @param {string} nurseName - 护士姓名
     * @returns {number} 初始存假天数，如果没有数据则返回0
     */
    getInitialSavedRestDays(nurseName) {
        return this.initialSavedRestDays[nurseName] || 0;
    }

    /**
     * 获取年末调整数据
     * @returns {Array} 年末调整数据数组
     */
    getYearEndAdjustments() {
        return this.yearEndAdjustments;
    }
}