/**
 * CalculationExplanationLoader.js
 * Loads and displays calculation explanation content dynamically from JSON file
 */

class CalculationExplanationLoader {
    constructor() {
        this.calculationExplanation = null;
        this.jsonPath = 'data/config/calculation_explanation.json';
    }

    /**
     * Load calculation explanation data from JSON file
     * @returns {Promise<Object>} Calculation explanation data
     */
    async loadCalculationData() {
        try {
            const response = await fetch(this.jsonPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.calculationExplanation = await response.json();
            return this.calculationExplanation;
        } catch (error) {
            console.error('Error loading calculation explanation data:', error);
            // Fallback to default data if JSON loading fails
            this.calculationExplanation = this.getDefaultData();
            return this.calculationExplanation;
        }
    }

    /**
     * Get default calculation explanation data as fallback
     * @returns {Object} Default calculation explanation data
     */
    getDefaultData() {
        return {
            title: "计算说明",
            icon: "fas fa-calculator",
            rules: [
                {
                    type: "小夜，大夜，夜班，白班",
                    value: "等效于1个工作日"
                },
                {
                    type: "半白班",
                    value: "等效于0.5个工作日"
                },
                {
                    type: "下夜班",
                    value: "等效于1个工作日，如果前一天是 小夜班，那么等效于0.5个工作日"
                },
                {
                    type: "病假，婚假，产假",
                    value: "如果不是法定假日，那么等效于1个工作日"
                },
                {
                    type: "休",
                    value: "如果不是法定假日，那么等效于负一个工作日，也就是欠一个班"
                },
                {
                    type: "病假，婚假，产假，休",
                    value: "如果没有存假且连续一个月，那么后续的寒假或者暑假就被取消，具体哪些护士在哪个半年假期被取消，请看",
                    link: {
                        text: "year_end_adjustments.json",
                        url: "data/config/year_end_adjustments.json"
                    }
                },
                {
                    type: "群力，眼二，ICU，神内",
                    value: "如果不是法定假日，那么等效于1个工作日"
                },
                {
                    type: "哺乳休",
                    value: "等效于0.6875个工作日，也就是1.5÷8个工作日"
                },
                {
                    type: "哺乳半",
                    value: "等效于0.1875个工作日，也就是0.5半天工作日，加上1.5÷8个工作日"
                },
                {
                    type: "年末集中调整",
                    value: "年末会对寒暑假，以及当年特殊的无法平摊到每日的情况，进行集中调整，根据",
                    link: {
                        text: "year_end_adjustments.json",
                        url: "data/config/year_end_adjustments.json"
                    },
                    additionalText: "文件中每个护士的具体情况计算"
                }
            ]
        };
    }

    /**
     * Load calculation explanation into the specified container
     * @param {string} containerId - ID of the container element
     */
    async loadCalculationExplanation(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container with ID '${containerId}' not found`);
            return;
        }

        // Load data from JSON file first
        await this.loadCalculationData();
        
        container.innerHTML = this.generateCalculationExplanationHTML();
    }

    /**
     * Generate HTML for calculation explanation
     * @returns {string} HTML string
     */
    generateCalculationExplanationHTML() {
        let html = `
            <div class="calculation-explanation-section">
                <div class="calculation-explanation">
                    <ul>
        `;

        this.calculationExplanation.rules.forEach(rule => {
            html += `<li><strong>${rule.type}：</strong>${rule.value}`;
            
            if (rule.link) {
                html += ` <a href="${rule.link.url}" target="_blank">${rule.link.text}</a>`;
            }
            
            if (rule.additionalText) {
                html += rule.additionalText;
            }
            
            html += `</li>`;
        });

        html += `
                    </ul>
                </div>
            </div>
        `;

        return html;
    }

    /**
     * Initialize calculation explanation on page load
     */
    init() {
        // Load calculation explanation when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', async () => {
                await this.loadCalculationExplanation('calculationExplanationContainer');
            });
        } else {
            this.loadCalculationExplanation('calculationExplanationContainer');
        }
    }
}

// Auto-initialize when script loads
const calculationExplanationLoader = new CalculationExplanationLoader();
calculationExplanationLoader.init();