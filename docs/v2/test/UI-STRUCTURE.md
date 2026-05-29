# UI 结构文档

基于源码分析的应用 UI 结构和功能说明。

## 工具栏 (Toolbar)

### 主要按钮

#### 1. 文件菜单 (el-dropdown)
- **按钮文本**: `{{ t("toolbar.menu.file") }}` → "文件"
- **触发方式**: 点击展开下拉菜单
- **子菜单项**:
  - **导入** (`openImportDialog`) - 打开导入对话框
  - **导出** (`handleExport`) - 导出当前数据为 JSON
  - **预览数据** (`handlePreviewData`) - 预览当前数据
  - **准备截图** (`prepareCapture`) - 准备截图功能
  - **加载示例** (`loadExample`) - 加载内置示例数据（非嵌入模式）

#### 2. 设置菜单 (el-dropdown)
- **按钮文本**: `{{ t("toolbar.menu.settings") }}` → "设置"
- **子菜单项**:
  - **规则管理** (`openRuleManager`)
  - **主题设置** (`openNodeSizeDialog`)
  - **水印设置** (`openWatermarkDialog`)
  - **素材管理** (`openAssetManager`)

#### 3. 帮助菜单 (el-dropdown)
- **按钮文本**: `{{ t("toolbar.menu.help") }}` → "帮助"
- **子菜单项**:
  - **更新日志** (`showUpdateLog`)
  - **问题反馈** (`showFeedbackForm`)

#### 4. 独立按钮
- **重置工作区** (`handleResetWorkspace`) - type="danger"
- **清空画布** (`handleClearCanvas`) - type="warning" plain

### 工具栏控制区 (toolbar-controls)
- **框选开关** - `selectionEnabled`
- **吸附开关** - `snapGridEnabled`
- **对齐线开关** - `snaplineEnabled`
- **语言选择** - el-select (中文/日文/英文)

## 组件面板

### 基础组件
- **长方形** - 可拖拽到画布
- **圆形** - 可拖拽到画布
- **动态分组** - 可拖拽到画布
- **图片** - 可拖拽到画布
- **文字** - 可拖拽到画布
- **矢量图** - 可拖拽到画布

### 阴阳师组件
- **资产**
- **式神**
- **御魂**
- **阴阳师**
- **阴阳师技能**
- **契灵**

## Tab 管理

- **Tab 容器**: el-tabs
- **新建 Tab**: 通过按钮或 Tab 栏的新建功能
- **Tab 切换**: 点击 Tab 标签
- **每个 Tab 独立数据**: 通过 filesStore 管理

## 对话框

### 更新日志对话框
- **触发**: 应用启动时自动显示（版本号变化）或通过帮助菜单
- **关闭**: ESC 键或点击关闭按钮
- **条件**: `localStorage.getItem("appVersion") !== currentAppVersion`

### 导入对话框
- **触发**: 文件菜单 → 导入
- **支持格式**:
  - JSON 文件
  - 阵容码（文本）
  - 阵容码二维码（图片）

### 其他对话框
- 导出预览
- 数据预览
- 水印设置
- 素材管理
- 规则管理
- 主题设置

## 数据持久化

### localStorage 使用
1. **版本号**: `appVersion` - 用于判断是否显示更新日志
2. **水印设置**: `watermark.*` - 水印相关配置
3. **语言设置**: `yys-editor.locale` - 当前语言
4. **画布数据**: 通过 filesStore 管理

### 文件管理 (filesStore)
- 多 Tab 支持
- 每个 Tab 独立的画布数据
- 自动保存到 localStorage

## 关键功能实现

### 加载示例 (loadExample)
- **位置**: 文件菜单 → 加载示例
- **实现**: `useToolbarWorkspaceCommands` composable
- **效果**: 加载预设的示例数据到当前画布

### 导入/导出
- **导出**: 将当前画布数据导出为 JSON
- **导入**: 支持 JSON 文件或阵容码

### 重置工作区 (handleResetWorkspace)
- **效果**: 清空所有 Tab 和数据，恢复初始状态
- **警告**: 危险操作，会清除所有数据

### 清空画布 (handleClearCanvas)
- **效果**: 清空当前 Tab 的画布内容
- **保留**: 其他 Tab 数据不受影响
