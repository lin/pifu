/**
 * 月度显示管理器 - 负责月度汇总和表格显示
 */
class MonthlyDisplayManager {
    constructor(dataProcessor) {
        this.dataProcessor = dataProcessor;
    }

    /**
     * 显示月度汇总
     */
    displayMonthlySummary(monthData) {
        const summaryHTML = `<h3>${monthData.year}年${monthData.month}月 汇总</h3>`;
        document.getElementById('monthlySummary').innerHTML = summaryHTML;
    }

    /**
     * 显示月度统计表格
     */
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
                        <th class="key-metric">工作</th>
                        <th>应工作</th>
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
}