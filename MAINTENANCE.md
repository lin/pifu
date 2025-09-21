# 维护模式功能说明

## 概述
这个维护模式功能允许您轻松地使网站暂时不可用，以便进行维护工作。

## 文件说明

### 1. `maintenance.json` - 维护配置文件
这是控制维护模式的核心配置文件：

```json
{
  "enabled": false,
  "message": "网站正在维护中，请稍后再试。",
  "estimatedReturnTime": "预计恢复时间：2小时",
  "contactInfo": "如有紧急事务，请联系管理员。",
  "password": "admin123",
  "passwordHint": "联系管理员获取访问密码",
  "lastUpdated": "2024-01-01T00:00:00Z"
}
```

**配置项说明：**
- `enabled`: `true` 启用维护模式，`false` 禁用维护模式
- `message`: 显示给用户的主要维护信息
- `estimatedReturnTime`: 预计恢复时间
- `contactInfo`: 紧急联系方式
- `password`: 管理员绕过密码（用于紧急访问）
- `passwordHint`: 密码提示信息
- `lastUpdated`: 最后更新时间（自动更新）

### 2. `js/MaintenanceManager.js` - 维护管理器
JavaScript 模块，负责：
- 加载维护配置
- 显示/隐藏维护页面
- 管理维护模式状态

### 3. `toggle-maintenance.js` - 命令行工具
Node.js 脚本，用于快速切换维护模式。

## 使用方法

### 方法一：使用命令行工具（推荐）

```bash
# 启用维护模式
node toggle-maintenance.js enable

# 禁用维护模式
node toggle-maintenance.js disable

# 查看当前状态
node toggle-maintenance.js status

# 设置绕过密码
node toggle-maintenance.js set-password mypassword123

# 设置密码提示
node toggle-maintenance.js set-hint "联系管理员获取访问密码"

# 查看帮助
node toggle-maintenance.js help
```

### 方法二：手动编辑配置文件

1. 打开 `maintenance.json` 文件
2. 将 `"enabled"` 设置为 `true` 启用维护模式，或 `false` 禁用维护模式
3. 可选：修改其他配置项（消息、预计恢复时间等）
4. 保存文件

## 维护页面功能

当维护模式启用时，用户将看到：
- 专业的维护页面覆盖层
- 维护图标和动画效果
- 自定义的维护消息
- 预计恢复时间
- 紧急联系方式
- **管理员密码绕过功能**（新增）
  - 密码输入框
  - 密码提示信息
  - 验证按钮
  - 错误/成功提示
- 刷新页面按钮
- 最后更新时间

### 密码绕过功能

管理员可以通过输入正确的密码来绕过维护模式：
1. 在维护页面找到"管理员访问"部分
2. 输入预设的绕过密码
3. 点击"验证密码"按钮
4. 验证成功后即可正常访问网站

## 技术特性

- **响应式设计**: 在桌面和移动设备上都能正常显示
- **优雅的动画**: 包含淡入效果和脉冲动画
- **自动刷新**: 用户可以点击刷新按钮检查维护状态
- **配置灵活**: 可以自定义所有显示文本
- **非侵入式**: 维护代码不会影响正常网站功能

## 注意事项

1. **文件权限**: 确保 Web 服务器可以读取 `maintenance.json` 文件
2. **缓存**: 浏览器可能会缓存维护页面，建议用户刷新页面
3. **备份**: 建议在启用维护模式前备份重要数据
4. **测试**: 在正式使用前，建议先测试维护模式功能

## 故障排除

### 维护模式不生效
1. 检查 `maintenance.json` 文件是否存在且格式正确
2. 确认 `enabled` 字段设置为 `true`
3. 检查浏览器控制台是否有 JavaScript 错误
4. 尝试强制刷新页面（Ctrl+F5 或 Cmd+Shift+R）

### 无法禁用维护模式
1. 检查 `maintenance.json` 文件权限
2. 确认 `enabled` 字段设置为 `false`
3. 检查文件是否被其他进程锁定

## 自定义配置

您可以根据需要修改 `maintenance.json` 中的配置：

```json
{
  "enabled": true,
  "message": "系统升级中，预计明天上午恢复服务",
  "estimatedReturnTime": "预计恢复时间：明天上午 9:00",
  "contactInfo": "紧急事务请联系：admin@example.com",
  "lastUpdated": "2024-01-01T00:00:00Z"
}
```

修改后保存文件即可生效，无需重启服务器。