# onmyoji-flow 功能规格 v2

> 本文档定义 onmyoji-flow 重构后的目标状态。不描述当前实现，只描述"应该做什么"。

## 1. 产品定位

onmyoji-flow 是阴阳师策略图编辑工具，提供两种使用形态：

| 形态 | 类比 | 入口 | 核心能力 |
|------|------|------|----------|
| 独立编辑器 | draw.io | `npm run dev` / GitHub Pages | 完整画布编辑 |
| Wiki 嵌入 | Confluence 插件 | `@rookie4show/onmyoji-flow` npm 包 | 图表渲染 + 弹窗编辑 |

两者共享同一套核心库，通过 npm 包消费。

## 2. 架构分层

```
@rookie4show/onmyoji-flow
│
├── 核心层 (Core)
│   ├── 数据模型 — RootDocument schema、校验、版本迁移
│   ├── 节点注册表 — 单一来源，所有节点类型统一注册
│   ├── 资产加载接口 — 可扩展的资产路径解析，不内置资产数据
│   └── 导入/导出 — JSON 序列化、队伍编码解析
│
├── 渲染器 (FlowRenderer)
│   ├── 输入：RootDocument JSON 或 graphRawData
│   ├── 输出：可视化图表 DOM
│   ├── 职责：数据标准化、边界计算、资产 URL 解析、只读渲染
│   └── 约束：不持有编辑状态，不响应画布编辑操作
│
└── 编辑器 (FlowEditor)
    ├── 输入：RootDocument JSON
    ├── 输出：编辑后的 RootDocument JSON
    ├── 职责：画布交互、节点 CRUD、属性编辑、对齐分布、图层、分组
    └── 约束：依赖渲染器进行节点渲染，自身只管理编辑状态
```

## 3. FlowRenderer 功能规格

### 3.1 输入/输出

**输入：**
```typescript
interface FlowRendererProps {
  data: RootDocument | GraphData   // 兼容两种格式
  width?: number                    // 容器宽度，默认 100%
  height?: number | 'auto'         // 容器高度，默认 auto（根据内容计算）
  assetBaseUrl?: string            // 资产图片基地址
}
```

**输出：**
- 渲染好的图表 DOM 节点
- 无编辑交互（不可拖拽、不可选中、不可修改）

### 3.2 数据标准化

渲染器必须处理以下输入变体，统一转换为标准 GraphData：

| 输入格式 | 来源 | 处理方式 |
|----------|------|----------|
| `RootDocument`（完整格式） | 独立编辑器导出、wiki 块内嵌 JSON | 提取 `fileList[activeFileId].graphRawData` |
| `GraphData`（扁平格式） | API 返回、旧格式数据 | 直接使用 `{ nodes, edges }` |
| 含 legacy 字段的节点 | 历史数据 | 运行 `migrateToV1` 迁移 |

标准化逻辑由库内部完成，调用方无需预处理。

### 3.3 资产 URL 解析

渲染器负责将节点中的资产引用解析为可加载的 URL：

- 相对路径（`/assets/shikigami/xxx.png`）→ 拼接 `assetBaseUrl`
- 绝对 URL → 直接使用
- 无效/缺失 URL → 降级为占位图

### 3.4 自适应布局

- 当 `height="auto"` 时，根据图表内容边界自动计算高度
- 当容器尺寸变化时，图表应自适应缩放
- 图表应在容器内居中显示

### 3.5 支持的节点渲染

| 节点类型 | 渲染内容 |
|----------|----------|
| `imageNode` | 图片 + 可选文字标注 |
| `assetSelector` | 资产头像 + 属性标签（式神/御魂/阴阳师等） |
| `textNode` | 富文本内容 |
| `vectorNode` | SVG 矢量图形 + 平铺填充 |
| `rect` | 矩形容器 |
| `ellipse` | 椭圆容器 |
| `dynamic-group` | 可折叠分组容器 + 子节点 |

### 3.6 Wiki 块交互层

在 wiki 编辑场景中，渲染器之上需要一层块结构交互（由 wiki 侧实现，库提供支持）：

- 块选择（选中当前 flow 块）
- 块操作按钮：编辑、剪切、删除、上移、下移
- 点击"编辑" → 打开 FlowEditor 弹窗

这些交互不属于渲染器本身，但渲染器需要提供：
- 点击/选中事件回调，以便宿主层叠加操作 UI
- 合理的 DOM 结构，便于宿主层定位和包裹

## 4. FlowEditor 功能规格

### 4.1 输入/输出

**输入：**
```typescript
interface FlowEditorProps {
  data?: RootDocument              // 初始数据，空则创建默认画布
  width?: string | number          // 容器宽度
  height?: string | number         // 容器高度
  assetBaseUrl?: string            // 资产图片基地址
  showToolbar?: boolean            // 是否显示工具栏，默认 true
  showComponentPanel?: boolean     // 是否显示组件面板，默认 true
  showPropertyPanel?: boolean      // 是否显示属性面板，默认 true
  config?: EditorConfig            // 编辑器配置
}
```

**输出：**
```typescript
interface FlowEditorExposed {
  getGraphData(): RootDocument     // 获取当前画布数据
  setGraphData(data: RootDocument): void  // 设置画布数据
  fitView(): void                  // 适应画布
  zoom(scale: number): void        // 缩放
  resetZoom(): void                // 重置缩放
  translateCenter(): void          // 居中
}
```

### 4.2 画布操作

| 能力 | 描述 |
|------|------|
| 平移 | 鼠标右键拖拽或触摸板滚动 |
| 缩放 | 鼠标滚轮 / 快捷键 |
| 框选 | 框选模式下拖拽选中多个节点 |
| 网格吸附 | 开关控制，节点拖拽时吸附到网格 |
| 参考线 | 开关控制，拖拽时显示对齐参考线 |
| 小地图 | 缩略导航 |

### 4.3 节点操作

| 能力 | 描述 |
|------|------|
| 创建 | 从组件面板拖拽到画布 |
| 选中 | 单击选中，Shift+点击多选 |
| 移动 | 拖拽移动，方向键微调 |
| 删除 | Delete/Backspace 删除选中 |
| 调整大小 | 拖拽节点边缘/角点 |
| 分组 | 选中多个节点 → 组合为动态分组 |
| 取消分组 | 选中分组 → 取消组合 |
| 锁定 | 锁定后不可移动/删除 |
| 可见性 | 隐藏/显示节点 |

### 4.4 属性编辑

选中节点后，右侧属性面板显示：

| 属性类别 | 内容 |
|----------|------|
| 基础属性 | 位置 (x, y)、尺寸 (width, height) |
| 样式属性 | 填充色、边框色、边框宽度、边框样式、圆角、透明度 |
| 文字属性 | 字号、字体颜色、文字对齐 |
| 节点特有 | 根据节点类型不同（如 assetSelector 的资产选择） |

### 4.5 对齐与分布

选中 2+ 节点：左对齐、右对齐、上对齐、下对齐、水平居中、垂直居中
选中 3+ 节点：水平等距分布、垂直等距分布

### 4.6 图层控制

- 置顶 / 置底
- 上移一层 / 下移一层

### 4.7 多文件管理

| 能力 | 描述 |
|------|------|
| 多 Tab | 创建、切换、关闭标签页 |
| 数据隔离 | 每个 Tab 独立的画布数据 |
| 自动保存 | 保存到 localStorage（standalone 模式） |
| 导出 | 下载为 JSON 文件 |
| 导入 | 从 JSON 文件导入 |
| 队伍编码导入 | 从游戏队伍编码字符串导入阵容，支持 QR 扫码 |

### 4.8 截图导出

- 将当前画布导出为图片
- 支持添加水印

### 4.9 快捷键

| 快捷键 | 操作 |
|--------|------|
| Delete / Backspace | 删除选中 |
| Ctrl+Z / Ctrl+Y | 撤销 / 重做 |
| Ctrl+G | 组合 |
| Ctrl+Shift+G | 取消组合 |
| 方向键 | 微调选中节点位置 |
| Ctrl+A | 全选 |

### 4.10 多语言

UI 支持中文（默认）、日文、英文。通过配置切换，不依赖浏览器语言自动判断。

## 5. 数据模型

### 5.1 RootDocument

```typescript
interface RootDocument {
  schemaVersion: number           // 当前版本 1
  fileList: FlowFile[]            // 文件列表
  activeFileId: string            // 当前激活文件 ID
}

interface FlowFile {
  id: string                      // 文件唯一 ID
  label: string                   // 显示标签
  name: string                    // 文件名
  visible: boolean                // 是否可见
  type: 'FLOW'                    // 文件类型
  graphRawData?: GraphData        // 画布数据
  transform?: {                   // 画布变换状态
    SCALE_X: number
    SCALE_Y: number
    TRANSLATE_X: number
    TRANSLATE_Y: number
  }
}
```

### 5.2 GraphData

```typescript
interface GraphData {
  nodes: NodeData[]
  edges: EdgeData[]
}
```

LogicFlow 原生格式，节点和边的数据结构由 LogicFlow 框架定义，自定义节点通过 `properties` 扩展。

### 5.3 版本迁移

数据模型变更必须通过 `migrateToVX` 函数链式迁移。加载数据时自动检测版本并执行迁移。

## 6. 资产加载接口

### 6.1 设计原则

库不内置资产数据（式神、御魂等 JSON 和图片）。资产数据由消费方提供，库通过接口加载。

### 6.2 API

```typescript
// 设置资产基地址（图片从这里加载）
setAssetBaseUrl(url: string): void

// 获取当前资产基地址
getAssetBaseUrl(): string

// 解析资产相对路径为完整 URL
resolveAssetUrl(relativePath: string): string
```

### 6.3 独立 app 模式

资产数据打包在 `src/data/assets/` 目录，通过 `assetCatalog.ts` 静态导入。`assetBaseUrl` 默认为 app 的 base URL。

### 6.4 库模式（wiki 嵌入）

消费方通过 `setAssetBaseUrl()` 指定资产路径。库负责在渲染时拼接完整 URL。

## 7. 库公开 API

> **Breaking Change**：本次重构重新设计公开 API，不保留旧的 `YysEditorEmbed` / `YysEditorPreview` 导出名。wiki 侧后续重新集成。

```typescript
// 渲染器
export { FlowRenderer } from './components/FlowRenderer.vue'

// 编辑器
export { FlowEditor } from './components/FlowEditor.vue'

// 资产 URL 管理
export { setAssetBaseUrl, getAssetBaseUrl, resolveAssetUrl }

// 规则引擎
export { DEFAULT_GROUP_RULES_CONFIG, validateGraphGroupRules }

// 规则存储
export { GROUP_RULES_STORAGE_KEY, readGroupRules, writeGroupRules, clearGroupRules }

// 自定义资产存储
export { CUSTOM_ASSET_STORAGE_KEY }

// 类型导出
export type { FlowRendererProps }
export type { FlowEditorProps, FlowEditorExposed }
export type { RootDocument, FlowFile, GraphData }
export type { FlowPlugin, FlowNodeRegistration }
```

## 8. 产品约束

### 8.1 独立编辑器

- 纯前端 SPA，无需后端
- 数据持久化到 localStorage
- 构建产物：标准 Vite SPA
- 部署：GitHub Pages

### 8.2 库模式

- 构建产物：ES Module + UMD + CSS
- 外部依赖：vue、element-plus、pinia（由消费方提供）
- 不内置资产数据
- 组件面板中资产选择器（式神/御魂等）正常显示，无资产数据时打开空白面板，行为一致
- SSR：当前不要求，未来 SEO 需求时再评估（wiki 侧 markdown 内容已可被搜索引擎索引）

### 8.3 不在范围内

以下功能明确不在本次重构范围内：

- Electron 打包（未来规划，当前抽象持久化接口即可）
- AI Agent 规则集成（未来规划，等待真实用户）
- 资产数据管理（独立维护，按月更新）
- SSR 支持（未来 SEO 需求时再评估）
- Wiki 侧适配（onmyoji-flow 重构完成后，wiki 侧重新集成新 API）
