/**
 * 图表管理器 - 负责处理图表创建和管理
 */
class ChartManager {
    constructor(dataProcessor) {
        this.dataProcessor = dataProcessor;
    }

    /**
     * 将数字四舍五入到最近的0.5
     */
    roundToHalf(value) {
        return Math.round(value * 2) / 2;
    }

    /**
     * 显示6组护士累计存假天数趋势对比图表
     */
    displayAllNursesCumulativeSavedDaysChart() {
        // 定义6组护士对比
        const nursePairs = [
            { names: ['马磊', '张雪野'], chartId: 'cumulativeChart1' },
            { names: ['付伟', '赵蕊'], chartId: 'cumulativeChart2' },
            { names: ['徐莹', '荆小舟'], chartId: 'cumulativeChart3' },
            { names: ['付巍巍', '邹婷'], chartId: 'cumulativeChart4' },
            { names: ['尤嘉', '王鑫'], chartId: 'cumulativeChart5' },
            { names: ['钱璐', '陈平', '李如心'], chartId: 'cumulativeChart6' }
        ];
        
        // 为每组创建图表
        nursePairs.forEach((pair, pairIndex) => {
            this.createNursePairChart(pair.names, pair.chartId, pairIndex);
        });
    }
    
    /**
     * 创建护士对比图表
     */
    createNursePairChart(nurseNames, chartId, pairIndex) {
        const allNurses = this.dataProcessor.getAllNurses();
        const selectedNurses = allNurses.filter(nurse => 
            nurseNames.includes(nurse.nurseName)
        );
        
        if (selectedNurses.length === 0) return;
        
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
            '#dc2626', // Red
            '#059669', // Green  
            '#7c3aed', // Purple
            '#ea580c', // Orange
            '#0ea5e9', // Blue
            '#dc2626'  // Red (for 3rd nurse in group 6)
        ];
        
        selectedNurses.forEach((nurse, index) => {
            const nurseSummary = this.dataProcessor.getNurseMonthlySummary(nurse.nurseKey);
            if (!nurseSummary || !nurseSummary.months) return;
            
            // 计算累计存假天数（包含初始值）
            const initialValue = this.dataProcessor.getInitialSavedRestDays(nurseSummary.nurseName);
            let cumulativeSavedRest = initialValue;
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
        const ctx = document.getElementById(chartId);
        if (!ctx) return;
        
        // 计算动态高度：根据最大值和最小值的差异，每个差异值对应2px
        let maxValue = -Infinity;
        let minValue = Infinity;
        
        datasets.forEach(dataset => {
            dataset.data.forEach(value => {
                if (value > maxValue) maxValue = value;
                if (value < minValue) minValue = value;
            });
        });
        
        const valueRange = maxValue - minValue;
        
        const dynamicHeight = Math.max(300, Math.min(2000, valueRange * 3)); // 最小300px，最大800px，基础200px + 每差异值2px

        // 设置动态高度
        ctx.style.height = `${dynamicHeight}px !important`;
        ctx.style.maxHeight = `${dynamicHeight}px !important`;
        ctx.style.minHeight = `${dynamicHeight}px !important`;
        ctx.height = dynamicHeight;
        
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
                            padding: 15,
                            font: {
                                size: 11,
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
                                size: 11,
                                weight: 500
                            }
                        },
                        ticks: {
                            color: '#64748b',
                            font: {
                                size: 10
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
                                size: 11,
                                weight: 500
                            }
                        },
                        ticks: {
                            color: '#64748b',
                            font: {
                                size: 10
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
}