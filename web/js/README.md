# 医院排班分析器 - 模块化架构

## 架构概览

重构后的分析器采用模块化设计，将功能分离到不同的类中，使代码更易理解和维护。

## 文件结构

```
web/js/
├── README.md                    # 本文件 - 架构说明
├── HospitalShiftAnalyzer.js    # 主控制器 - 协调各个模块
├── DataProcessor.js            # 数据处理器 - 处理和计算数据
├── UIController.js             # UI控制器 - 处理用户交互
└── DisplayManager.js           # 显示管理器 - 渲染和显示数据
```

## 模块说明

### 1. HospitalShiftAnalyzer.js (主控制器)
**职责**: 应用的入口点，协调各个模块的工作

**主要功能**:
- 初始化应用
- 加载数据库
- 创建和协调其他模块
- 设置标签页导航
- 错误处理

**关键方法**:
- `init()`: 应用初始化
- `loadDatabase()`: 加载JSON数据库
- `initializeModules()`: 创建其他模块实例
- `setupTabNavigation()`: 设置标签页切换

### 2. DataProcessor.js (数据处理器)
**职责**: 处理原始数据，计算统计信息

**主要功能**:
- 处理月度统计数据
- 处理个人数据
- 计算存假、法定工作日等关键指标

**关键方法**:
- `processData()`: 处理所有数据
- `processMonthlyData()`: 处理月度统计
- `processPersonData()`: 处理个人数据
- `generateMonthlySummaryData()`: 生成月度汇总数据
- `getNurseMonthlySummary()`: 获取护士月度汇总
- `getNurseMonthData()`: 获取护士特定月份数据
- `getNurseTotalSummary()`: 获取护士总计统计

**数据结构**:
- `monthlyData`: 按年月组织的统计数据
- `personData`: 按护士组织的个人数据
- `monthlySummaryData`: 每个护士每个月的汇总统计数据

### 3. UIController.js (UI控制器)
**职责**: 处理用户界面交互和状态管理

**主要功能**:
- 填充按钮选项
- 处理用户选择
- URL参数管理
- 加载相应数据

**关键方法**:
- `initializeUI()`: 初始化界面
- `populateYearButtons()`: 填充年份选择
- `populateMonthButtons()`: 填充月份选择
- `setSelectedYear/Month/Person()`: 处理选择变化
- `updateUrl()`: 更新URL参数

### 4. DisplayManager.js (显示管理器)
**职责**: 渲染和显示数据到DOM

**主要功能**:
- 渲染月度统计表格
- 生成日历视图
- 显示个人概览
- 格式化数据显示

**关键方法**:
- `displayMonthlyTable()`: 显示月度统计表格
- `displayMonthlyCalendar()`: 显示月度日历
- `displayPersonOverview()`: 显示个人概览
- `generateMonthCalendar()`: 生成日历HTML

## 数据流

```
1. 加载数据库 (JSON)
   ↓
2. DataProcessor 处理数据
   ↓
3. UIController 初始化界面
   ↓
4. 用户交互 → UIController 处理
   ↓
5. DisplayManager 渲染显示
```

## 关键计算逻辑

### 存假计算
```javascript
// 每个护士每个月的存假计算
nurseData.legalWorkdayCount = nurseData.totalDays - nurseHolidays;
nurseData.savedRestDays = nurseData.workValue - nurseData.legalWorkdayCount;
```

### 个人总计算
```javascript
// 累加所有月份的数据
totalWorkValue += nurseMonthData.workValue;
totalLegalWorkdays += nurseMonthData.legalWorkdayCount;
totalSavedRestDays += nurseMonthData.savedRestDays;
```

## 使用方式

1. **HTML引用**:
   ```html
   <script src="js/DataProcessor.js"></script>
   <script src="js/DisplayManager.js"></script>
   <script src="js/UIController.js"></script>
   <script src="js/HospitalShiftAnalyzer.js"></script>
   ```

2. **自动初始化**:
   页面加载完成后自动创建 `HospitalShiftAnalyzer` 实例

## 优势

1. **模块化**: 每个类有明确的职责
2. **可维护性**: 易于理解和修改
3. **可扩展性**: 容易添加新功能
4. **调试友好**: 问题定位更容易
5. **代码复用**: 模块可以独立测试和重用

## monthlySummaryData 数据结构

新增的 `monthlySummaryData` 为每个护士的每个月提供标准化的统计数据：

```javascript
monthlySummaryData = {
    "nurseId-nurseName": {
        nurseId: "护士编号",
        nurseName: "护士姓名",
        months: {
            "2014-04": {
                year: 2014,
                month: 4,
                monthName: "4月",
                monthKey: "2014-04",
                
                // 核心统计数据
                legalWorkdays: 22,        // 法定工作日
                workedDays: 20.5,        // 上班天数(workValue)
                savedRestDays: -1.5,     // 存假 (workedDays - legalWorkdays)
                
                // 辅助数据
                totalDays: 25,           // 在职天数
                holidayDays: 3,          // 法定假日天数
                workRate: "93.2",        // 工作率
                originalData: {...}      // 原始数据引用
            }
        }
    }
}
```

## API 方法

- `getNurseMonthlySummary(nurseKey)`: 获取护士所有月份数据
- `getNurseMonthData(nurseKey, monthKey)`: 获取护士特定月份数据
- `getNurseTotalSummary(nurseKey)`: 获取护士总计统计
- `getAllNurses()`: 获取所有护士列表

## 使用示例

```javascript
// 获取护士的总计统计
const totalStats = dataProcessor.getNurseTotalSummary("1-张三");
console.log(`张三总存假: ${totalStats.totalSavedRestDays} 天`);

// 获取护士特定月份数据
const monthData = dataProcessor.getNurseMonthData("1-张三", "2014-04");
console.log(`张三2014年4月存假: ${monthData.savedRestDays} 天`);
```

## 扩展指南

- **添加新统计**: 在 `DataProcessor` 中添加计算逻辑
- **新的显示方式**: 在 `DisplayManager` 中添加渲染方法
- **新的交互**: 在 `UIController` 中添加处理逻辑
- **新功能**: 在 `HospitalShiftAnalyzer` 中协调各模块
- **使用统一数据**: 优先使用 `monthlySummaryData` 获取标准化统计