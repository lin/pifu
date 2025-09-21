/**
 * 图表显示管理器 - 负责所有图表创建和管理
 */
class ChartDisplayManager {
    constructor() {
        this.chartInstances = {};
    }

    /**
     * 显示个人图表
     */
    displayPersonCharts(nurseKey, dataProcessor) {
        const nurseSummary = dataProcessor.getNurseMonthlySummary(nurseKey);
        
        if (!nurseSummary || !nurseSummary.months) {
            return;
        }

        // 按时间排序的月度数据
        const sortedMonths = Object.values(nurseSummary.months)
            .sort((a, b) => {
                if (a.year !== b.year) return a.year - b.year;
                return a.month - b.month;
            });

        // 准备数据
        const labels = sortedMonths.map(m => `${m.year}-${String(m.month).padStart(2, '0')}`);
        
        // 累计数据
        const initialValue = dataProcessor.getInitialSavedRestDays(nurseSummary.nurseName);
        let accumulatedSavedRest = initialValue;
        
        const accumulatedSavedRestData = [];
        const monthlySavedRestData = [];
        const monthlyWorkedDaysData = [];
        const monthlyRestDaysData = [];

        sortedMonths.forEach(monthData => {
            // 月度数据
            monthlySavedRestData.push(monthData.savedRestDays);
            monthlyWorkedDaysData.push(monthData.workedDays);
            
            // 有效休息日 = 总天数 - 工作天数 - 法定假日
            const effectiveRestDays = monthData.totalDays - monthData.workedDays - monthData.holidayDays;
            monthlyRestDaysData.push(effectiveRestDays);
            
            // 累计存假数据（包含初始值）
            accumulatedSavedRest += monthData.savedRestDays;
            accumulatedSavedRestData.push(accumulatedSavedRest);
        });

        // 销毁现有图表
        this.destroyExistingCharts();

        // 创建图表 - 按组排序：月度图表优先，然后是累计图表
        // 存假天数组 - 添加0天基线
        this.createChart('monthlySavedRestChart', '月度存假天数', labels, monthlySavedRestData, '#dc2626', 
            { value: 0, label: '零点基线', color: '#6b7280' });
        this.createChart('accumulatedSavedRestChart', '累计存假天数', labels, accumulatedSavedRestData, '#dc2626');
        
        // 有效工作日组 - 添加20.8天基线
        this.createChart('monthlyWorkedDaysChart', '月度有效工作日', labels, monthlyWorkedDaysData, '#059669',
            { value: 20.8, label: '标准工作日基线', color: '#059669' });
        
        // 有效休息日组 - 添加9.58天基线
        this.createChart('monthlyRestDaysChart', '月度有效休息日', labels, monthlyRestDaysData, '#3b82f6',
            { value: 9.58, label: '标准休息日基线', color: '#3b82f6' });
    }

    /**
     * 根据与参考线的偏差生成渐变颜色
     */
    generateGradientColors(data, referenceLine, baseColor) {
        if (!referenceLine) {
            return { 
                pointColors: new Array(data.length).fill(baseColor),
                borderColors: new Array(data.length).fill(baseColor),
                gradient: null
            };
        }

        const referenceValue = referenceLine.value;
        const deviations = data.map(value => Math.abs(value - referenceValue));
        const maxDeviation = Math.max(...deviations);
        
        const pointColors = [];
        const borderColors = [];

        data.forEach(value => {
            const deviation = Math.abs(value - referenceValue);
            const intensity = maxDeviation > 0 ? deviation / maxDeviation : 0;
            
            // 根据偏差方向和强度选择颜色
            if (value > referenceValue) {
                // 高于参考线 - 使用红色系渐变
                const red = Math.round(220 + (35 * intensity)); // 220-255
                const green = Math.round(38 - (20 * intensity)); // 38-18
                const blue = Math.round(38 - (20 * intensity)); // 38-18
                pointColors.push(`rgb(${red}, ${green}, ${blue})`);
                borderColors.push(`rgba(${red}, ${green}, ${blue}, 0.8)`);
            } else if (value < referenceValue) {
                // 低于参考线 - 使用蓝色系渐变
                const red = Math.round(59 - (30 * intensity)); // 59-29
                const green = Math.round(130 - (50 * intensity)); // 130-80
                const blue = Math.round(246 - (50 * intensity)); // 246-196
                pointColors.push(`rgb(${red}, ${green}, ${blue})`);
                borderColors.push(`rgba(${red}, ${green}, ${blue}, 0.8)`);
            } else {
                // 等于参考线 - 使用中性色
                pointColors.push('#6b7280');
                borderColors.push('rgba(107, 114, 128, 0.8)');
            }
        });

        return { pointColors, borderColors, data, referenceValue, maxDeviation };
    }

    /**
     * 创建Canvas渐变
     */
    createCanvasGradient(ctx, chartArea, gradientData) {
        if (!gradientData || !gradientData.data) {
            return null;
        }

        const { data, referenceValue, maxDeviation } = gradientData;
        
        // 创建水平渐变（从左到右）
        const gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
        
        // 为每个数据点添加渐变停止点
        data.forEach((value, index) => {
            const position = index / (data.length - 1); // 0 to 1
            const deviation = Math.abs(value - referenceValue);
            const intensity = maxDeviation > 0 ? deviation / maxDeviation : 0;
            
            let color;
            if (value > referenceValue) {
                // 高于参考线 - 红色系
                const red = Math.round(220 + (35 * intensity));
                const green = Math.round(38 - (20 * intensity));
                const blue = Math.round(38 - (20 * intensity));
                color = `rgba(${red}, ${green}, ${blue}, 0.8)`;
            } else if (value < referenceValue) {
                // 低于参考线 - 蓝色系
                const red = Math.round(59 - (30 * intensity));
                const green = Math.round(130 - (50 * intensity));
                const blue = Math.round(246 - (50 * intensity));
                color = `rgba(${red}, ${green}, ${blue}, 0.8)`;
            } else {
                // 等于参考线 - 中性色
                color = 'rgba(107, 114, 128, 0.8)';
            }
            
            gradient.addColorStop(position, color);
        });

        return gradient;
    }

    /**
     * 创建图表
     */
    createChart(canvasId, label, labels, data, color, referenceLine = null) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        // Set canvas height explicitly
        ctx.style.height = '600px';
        ctx.height = 500;

        // 判断是否为累计图表
        const isAccumulated = canvasId.includes('accumulated');
        
        // 生成基于偏差的渐变颜色
        const gradientColors = this.generateGradientColors(data, referenceLine, color);
        
        // 构建数据集数组，包含主数据和参考线
        const self = this; // 保存this引用
        const datasets = [{
            label: label,
            data: data,
            borderColor: function(context) {
                if (!referenceLine) return color;
                
                const chart = context.chart;
                const {ctx, chartArea} = chart;
                
                if (!chartArea) return color;
                
                return self.createCanvasGradient(ctx, chartArea, gradientColors);
            },
            backgroundColor: color + (isAccumulated ? '15' : '08'),
            borderWidth: isAccumulated ? 3 : 2,
            fill: isAccumulated,
            tension: 0.2,
            pointBackgroundColor: referenceLine ? gradientColors.pointColors : color,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: isAccumulated ? 0 : 4,
            pointHoverRadius: isAccumulated ? 0 : 7
        }];

        // 添加参考线数据集
        if (referenceLine !== null) {
            datasets.push({
                label: referenceLine.label,
                data: new Array(labels.length).fill(referenceLine.value),
                borderColor: referenceLine.color || '#64748b',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5],
                fill: false,
                tension: 0,
                pointRadius: 0,
                pointHoverRadius: 0,
                pointBackgroundColor: 'transparent',
                pointBorderColor: 'transparent'
            });
        }
        
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                resizeDelay: 0,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: referenceLine !== null,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 12
                            },
                            color: '#64748b'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: color,
                        borderWidth: 1,
                        displayColors: false,
                        callbacks: {
                            title: function(context) {
                                return context[0].label;
                            },
                            label: function(context) {
                                return `${label}: ${context.parsed.y} 天`;
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
                                size: 12,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: '#f1f5f9'
                        },
                        ticks: {
                            color: '#64748b'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: '天数',
                            color: '#64748b',
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: '#f1f5f9'
                        },
                        ticks: {
                            color: '#64748b'
                        }
                    }
                }
            }
        });

        // 添加resize事件监听器以防止图表高度增长
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const canvas = entry.target;
                if (canvas.style.height !== '600px') {
                    canvas.style.height = '600px';
                    chart.resize();
                }
            }
        });
        resizeObserver.observe(ctx);

        // 存储图表实例以便后续销毁
        this.chartInstances[canvasId] = chart;
    }

    /**
     * 创建总览页面的柱状图
     */
    createOverviewBarChart(canvasId, label, labels, data, color) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        // 销毁现有图表
        if (this.chartInstances && this.chartInstances[canvasId]) {
            this.chartInstances[canvasId].destroy();
        }

        // Set canvas height explicitly
        ctx.style.height = '600px';
        ctx.height = 500;

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: data,
                    backgroundColor: color + '40',
                    borderColor: color,
                    borderWidth: 2,
                    borderRadius: 4,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: color,
                        borderWidth: 1,
                        displayColors: false,
                        callbacks: {
                            title: function(context) {
                                return context[0].label;
                            },
                            label: function(context) {
                                return `${label}: ${context.parsed.y} 天`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '护士',
                            color: '#64748b',
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#64748b',
                            maxRotation: 45,
                            minRotation: 0
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: '天数',
                            color: '#64748b',
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: '#f1f5f9'
                        },
                        ticks: {
                            color: '#64748b'
                        }
                    }
                }
            }
        });

        // 存储图表实例
        this.chartInstances[canvasId] = chart;
    }

    /**
     * 销毁现有图表
     */
    destroyExistingCharts() {
        if (this.chartInstances) {
            Object.values(this.chartInstances).forEach(chart => {
                if (chart) {
                    chart.destroy();
                }
            });
            this.chartInstances = {};
        }
    }
}