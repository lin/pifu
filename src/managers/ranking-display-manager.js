/**
 * 排名显示管理器 - 负责排名表格显示
 */
class RankingDisplayManager {
    constructor(dataProcessor) {
        this.dataProcessor = dataProcessor;
    }

    /**
     * 显示存假天数排名表
     */
    displaySavedDaysRanking() {
        const allNurses = this.dataProcessor.getAllNurses();
        const nurseStats = allNurses.map(nurse => {
            const totalSummary = this.dataProcessor.getNurseTotalSummary(nurse.nurseKey);
            if (!totalSummary) return null;
            
            // 使用包含初始值的累计存假天数（基础计算）
            const cumulativeSavedRestDays = this.dataProcessor.getCumulativeSavedRestDays(nurse.nurseKey);

            return {
                ...totalSummary,
                totalSavedRestDays: cumulativeSavedRestDays,
            };
        }).filter(summary => summary !== null)
          .sort((a, b) => b.totalSavedRestDays - a.totalSavedRestDays);

        // 计算基础存假天数的平均值（包含所有护士）- 基于以法定工作日标准
        const allNursesAverage = nurseStats.length > 0 
            ? nurseStats.reduce((sum, nurse) => sum + nurse.totalSavedRestDays, 0) / nurseStats.length 
            : 0;
        
        // 计算基础存假天数的平均值（排除指定护士）
        const excludedNurses = ['张雪野', '王鑫', '陈平'];
        const filteredNurseStats = nurseStats.filter(nurse => !excludedNurses.includes(nurse.nurseName));
        const averageTotal = filteredNurseStats.length > 0 
            ? filteredNurseStats.reduce((sum, nurse) => sum + nurse.totalSavedRestDays, 0) / filteredNurseStats.length 
            : 0;
        

        const html = `
            <table>
                <thead>
                    <tr>
                        <th>护士</th>
                        <th>初始存假</th>
                        <th>以法定工作日标准</th>
                        <th>同事之间（包括离职烂账）</th>
                    </tr>
                </thead>
                <tbody>
                    ${nurseStats.map((nurse, index) => {
                        const initialSavedRestDays = this.roundToHalf(this.dataProcessor.getInitialSavedRestDays(nurse.nurseName));
                        const totalSavedRestDays = this.roundToHalf(nurse.totalSavedRestDays);
                        const relativeToAllNurses = this.roundToHalf(nurse.totalSavedRestDays - allNursesAverage);
                        return `
                        <tr>
                            <td class="nurse-name">${nurse.nurseName}</td>
                            <td class="value ${initialSavedRestDays >= 0 ? 'positive' : 'negative'}">
                                ${initialSavedRestDays >= 0 ? `${initialSavedRestDays} 天` : `${initialSavedRestDays} 天`}
                            </td>
                            <td class="value ${totalSavedRestDays >= 0 ? 'positive' : 'negative'}">
                                ${totalSavedRestDays >= 0 ? `存 ${totalSavedRestDays} 天` : `欠 ${Math.abs(totalSavedRestDays)} 天`}
                            </td>
                            <td class="value ${relativeToAllNurses >= 0 ? 'positive' : 'negative'}">
                                ${relativeToAllNurses >= 0 ? `替同事多上 ${relativeToAllNurses} 天` : `欠同事 ${Math.abs(relativeToAllNurses)} 天`}
                            </td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        document.getElementById('savedDaysRankingTable').innerHTML = html;
    }

    /**
     * 将数字四舍五入到最近的0.5
     */
    roundToHalf(value) {
        return Math.round(value * 2) / 2;
    }
}