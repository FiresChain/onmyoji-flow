# 组件化改造设计文档

> 当前状态（2026-07-10）：Feature-module Phases 1-8 已落地。standalone/embed
> shells、独立 `PreviewCanvas`、Embed composables 与根组件薄 facade 均已进入生产
> 路径，目录边界/dead-code/CI 质量闸门已启用。依赖方向以
> [ModuleArchitecture.md](./ModuleArchitecture.md) 为准。

## 背景与目标

### 为什么需要组件化改造

**历史问题（组件化前）**：

- onmyoji-flow 是一个独立的单页应用（SPA）
- 只能作为独立应用运行
- 无法嵌入到其他项目中

**目标**：

- 将 onmyoji-flow 改造为可嵌入的 Vue 组件
- 支持在 onmyoji-wiki 中作为块插件使用
- 保持独立应用功能不变（双重角色）

### 预期效果

**角色 1：独立编辑器**（保持不变）

- 完整的流程图编辑应用
- 支持本地运行和使用
- 完整的 UI（工具栏、组件库、属性面板）

**角色 2：可嵌入组件**（新增）

- 作为 onmyoji-wiki 的块插件
- 支持预览/编辑模式
- 轻量级，只包含核心编辑功能
- 数据接口清晰

---

## 技术方案

### 核心思路

历史方案通过共享组件新增嵌入式入口。当前实现已在保持公开契约不变的前提下，
完成薄 facade + shell 组装：

- `App.vue` 仅启动 `StandaloneEditorShell`。
- `YysEditorEmbed.vue` 仅保留公开 props/emits/expose，并组装 `EmbedEditorShell`。
- 只读画布由 `PreviewCanvas` 承担；数据同步、尺寸观察和 viewport 操作分别进入实例级 composable。
- shell 只协调 `EditorPort`，不直接保存领域状态或调用 LogicFlow API。

下列目录图记录迁移前的共享组件方案，不代表重构目标目录：

```
onmyoji-flow/
├── src/
│   ├── App.vue                    # 独立应用（保持不变）
│   ├── YysEditorEmbed.vue         # 嵌入式组件（新增）⭐
│   ├── components/                # 共享组件
│   │   ├── flow/
│   │   │   ├── FlowEditor.vue     # 画布核心（共享）
│   │   │   ├── PropertyPanel.vue  # 属性面板（共享）
│   │   │   └── ComponentsPanel.vue # 组件库（共享）
│   │   └── [历史共享工具栏，现已删除]
│   └── ts/
│       ├── useStore.ts            # 状态管理（共享）
│       └── useLogicFlow.ts        # LogicFlow 封装（共享）
└── dist/                          # 构建输出
    ├── onmyoji-flow.es.js         # ES Module（库模式）
    └── onmyoji-flow.umd.js        # UMD（库模式）
```

### 架构设计

#### 1. 双模式架构

```
┌─────────────────────────────────────────────────────────┐
│                    onmyoji-flow 项目                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐         ┌──────────────────┐     │
│  │   独立应用模式    │         │   嵌入组件模式    │     │
│  │   (App.vue)      │         │ (YysEditorEmbed) │     │
│  └──────────────────┘         └──────────────────┘     │
│          │                            │                 │
│          └────────────┬───────────────┘                 │
│                       ↓                                 │
│              ┌─────────────────┐                        │
│              │   共享核心组件   │                        │
│              ├─────────────────┤                        │
│              │ FlowEditor.vue  │                        │
│              │ PropertyPanel   │                        │
│              │ ComponentsPanel │                        │
│              │ Toolbar         │                        │
│              └─────────────────┘                        │
│                       ↓                                 │
│              ┌─────────────────┐                        │
│              │   状态管理层     │                        │
│              ├─────────────────┤                        │
│              │ useStore        │                        │
│              │ useLogicFlow    │                        │
│              │ useCanvasSettings│                       │
│              └─────────────────┘                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### 2. 嵌入式组件模式切换

```
┌─────────────────────────────────────────────────────────┐
│              YysEditorEmbed 组件                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Props: { mode: 'preview' | 'edit', data: GraphData }   │
│                                                          │
│  ┌──────────────────┐         ┌──────────────────┐     │
│  │   预览模式        │         │   编辑模式        │     │
│  │   (preview)      │         │   (edit)         │     │
│  ├──────────────────┤         ├──────────────────┤     │
│  │ ✅ 画布（只读）   │         │ ✅ 画布（可编辑） │     │
│  │ ❌ 工具栏        │         │ ✅ 工具栏         │     │
│  │ ❌ 组件库        │         │ ✅ 组件库         │     │
│  │ ❌ 属性面板      │         │ ✅ 属性面板       │     │
│  │ ❌ 交互          │         │ ✅ 完整交互       │     │
│  └──────────────────┘         └──────────────────┘     │
│                                                          │
│  Emits: { 'update:data', 'save', 'cancel', 'error' }    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 数据模型

### Props 接口

```typescript
interface YysEditorEmbedProps {
  // 初始数据（LogicFlow GraphData 格式）
  data?: GraphData;

  // 模式：preview（预览）/ edit（编辑）
  mode?: "preview" | "edit";

  // 尺寸
  width?: string | number;
  height?: string | number;

  // UI 控制（仅在 edit 模式有效）
  showToolbar?: boolean;
  showPropertyPanel?: boolean; // 编辑模式下控制属性面板显示
  showComponentPanel?: boolean;

  // 配置选项（已生效：grid/snapline/keyboard/locale）
  config?: EditorConfig;
}

// LogicFlow 标准数据格式
interface GraphData {
  nodes: NodeData[];
  edges: EdgeData[];
}

interface NodeData {
  id: string;
  type: string;
  x: number;
  y: number;
  properties?: Record<string, any>;
  text?: { value: string };
}

interface EdgeData {
  id: string;
  type: string;
  sourceNodeId: string;
  targetNodeId: string;
  properties?: Record<string, any>;
}

// 编辑器配置（当前实现：grid/snapline/keyboard/locale）
interface EditorConfig {
  // 画布配置
  grid?: boolean;
  snapline?: boolean;
  keyboard?: boolean;

  // 主题
  theme?: "light" | "dark";

  // 语言
  locale?: "zh" | "ja" | "en";
}
```

### Emits 接口

```typescript
interface YysEditorEmbedEmits {
  // 数据变更（实时）
  "update:data": (data: GraphData) => void;

  // 保存（用户点击保存按钮）
  save: (data: GraphData) => void;

  // 取消（用户点击取消按钮）
  cancel: () => void;

  // 错误
  error: (error: Error) => void;
}
```

### 默认值

```typescript
const defaultProps = {
  mode: "edit",
  width: "100%",
  height: "600px",
  showToolbar: true,
  showPropertyPanel: true, // 编辑模式默认显示属性面板
  showComponentPanel: true,
  config: {
    // 当前实现已生效（grid/snapline/keyboard/locale）
    grid: true,
    snapline: true,
    keyboard: true,
    theme: "light",
    locale: "zh",
  },
};
```

### 契约状态（2026-03）

1. `showPropertyPanel`：在 `mode='edit'` 下生效，用于控制右侧属性面板显示；默认值 `true`。
2. `config`：`grid/snapline/keyboard/locale` 已接入实例上下文；运行时更新
   `config.locale` 只影响当前 Embed 实例。
3. `config.theme` 仍为兼容保留，暂未接入运行时消费。

---

## 实现细节

### 0. Feature-module 迁移约束

1. `YysEditorEmbed` 的 props、emits、exposed methods、默认/命名导出和
   `YysEditorPreview` 别名保持兼容。
2. edit 与 preview 每次挂载创建独立 `EditorContext`；runtime、settings、dialogs、
   locale、asset resolver、timer 和 observer 不跨实例共享。
3. preview 的自定义 `plugins` / `nodeRegistrations` 保持当前替换语义；不借此次
   重构扩展 edit-mode 行为。
4. `setAssetBaseUrl` 仍是兼容默认值 API，但组件创建时将默认值复制进实例 resolver。
5. Embed workspace 使用内存 adapter，不读取或写入 standalone 的 `filesStore` key。
6. 根 facade 与 Embed 的 data-sync/resize/viewport 路径通过 `EditorPort` 协调，不直接
   获取 LogicFlow 实例；`EditorToolbar` 仅为截图和主题应用保留既有窄 editor bridge。

### 0.1 Phase 4 阶段快照（历史）

1. `App.vue` 与每个 `YysEditorEmbed` 挂载分别创建 `EditorContext`。runtime、
   `EditorPort`、画布 settings、dialog、locale 与 asset resolver 均由该实例拥有；
   vue-node-registry 创建的独立 Vue app 通过 graphModel bridge 获取同一实例上下文。
2. `useLogicFlow`、`useCanvasSettings`、`useDialogs`、`useSafeI18n` 与 `useStore` 仅保留
   兼容 facade，不再维护模块级可变 Map、ref 或 reactive 单例。
3. workspace 的仓库内部入口为 `features/workspace/public.ts`：
   `filesStore` 只保存可序列化状态，`FilesPersistence` 管理存储和 debounce，
   `WorkspaceSession` 协调 `EditorPort`，`documentTransfer` 负责迁移、校验和 JSON 往返。
4. 文件切换顺序固定为“capture 当前文件 -> 更新 active ID -> render 目标文件”；
   metadata 更新不得把当前画布写入非 active 文件。
5. standalone 继续使用 `filesStore` localStorage key，损坏恢复只删除该 key；Embed
   始终使用实例级 memory persistence，并在 Pinia action 后恢复宿主 active Pinia。
6. `WorkspaceSession` 的 autosave interval、`FilesPersistence` 的 debounce timer、Embed
   timer/ResizeObserver 和 Context runtime 都在卸载路径清理，dispose 为幂等操作。
7. 该阶段 standalone/embed shell 与 preview composable 尚未拆分，后续已由 Phase 7
   完成。

### 0.2 Phase 5 阶段快照（历史）

1. Phase 5 时 `App.vue` 与 `YysEditorEmbed.vue` 直接组装 `NodePalette`、`FlowEditor` 和
   `EditorDialogHost`；`FlowEditor` 再组装 `CanvasControls`、`ProblemsDock` 与
   `Inspector`。
2. runtime、commands 与 node-types 已迁入 `src/editor`。节点 View、Model、Inspector、
   默认值与 registration 按类型共置，edit/preview 共用默认 registry。
3. LogicFlow event、keyboard、DOM listener、timer、RAF、ResizeObserver 与规则订阅均由
   实例 disposer 清理；mount 失败执行逆序回滚，stale disposer 不清理替代实例。
4. 该阶段 shell 和独立 PreviewCanvas 尚未落地；后续已由 Phase 7 完成。

### 0.3 Phase 6 阶段快照（历史）

1. workspace、assets、group-rules、capture 与 locale 已迁入 `features/*`；跨模块调用
   通过各 feature 的 `public.ts`。
2. `WorkspaceDialogHost`、`AssetsDialogHost`、`GroupRuleDialogHost` 与
   `CaptureDialogHost` 按职责持有业务 dialog、draft 和 repository 状态；disposer 由
   实际 mount listener/subscription 的模块持有，group-rule 校验订阅仍由 editor
   runtime 清理。locale 由实例 `EditorContext` 和 `features/locale` 服务驱动。
3. `shells/common/EditorCommandBar.vue` 是受控、emit-only UI，只发 command、settings
   和 locale 更新事件，不访问 LogicFlow、storage 或 feature repository。
4. 当时的 toolbar 过渡 facade 负责组装 feature hosts、调用 workspace services、保存
   standalone locale 偏好，并提供截图/主题应用所需的窄 editor bridge；该文件已在
   Phase 7 删除，职责由 `shells/common/EditorToolbar.vue` 与 shell 承接。
5. `filesStore`、`yys-editor.custom-assets.v1`、
   `yys-editor.node-create-size.v1`、`yys-editor.group-rules.v1`、
   `yys-editor.locale` 与 watermark keys 保持不变；`setAssetBaseUrl` 及现有 package
   exports 保持兼容。
6. 阵容码继续通过 workspace adapter 调用旧服务；本阶段未移动
   `teamCodeService.ts`，也未创建 `features/team-code`。

### 0.4 Phase 7 阶段快照（2026-07-10）

1. `App.vue` 只挂载 `StandaloneEditorShell`；`YysEditorEmbed.vue` 只声明并转发公开
   props、emits、type exports 与 exposed methods。
2. `StandaloneEditorShell` 创建实例 `EditorContext`，继续使用 `filesStore` key 的
   localStorage persistence、autosave、文件 tabs 与 app-only `AboutDialogs`。
3. `EmbedEditorShell` 为每个实例创建独立 Pinia、memory persistence 和
   `WorkspaceSession`；所有 store action 后恢复宿主 active Pinia，不读取或写入
   standalone workspace key。
4. `PreviewCanvas` 只负责 preview runtime 的创建、替换与释放。非空自定义
   `plugins` / `nodeRegistrations` 完整替换预设，空数组回退默认；edit runtime 不消费
   这些 preview-only props。
5. `useEmbedDataSync` 负责 GraphData normalize、preview dynamic-group 隐藏与实例 asset
   resolver；`useEmbedResize` 通过 `EditorPort` resize 并观察、释放根容器
   ResizeObserver；`useEmbedViewport` 通过 `EditorPort` 实现 fit、zoom、reset、center
   与 transform 读取。
6. `setAssetBaseUrl` 仍是兼容默认值 API；Embed 创建时快照该默认值，后续全局更新不
   影响已挂载实例。`config.locale` 与显式 `assetBaseUrl` 更新仅影响当前实例。
7. `shells/common/EditorToolbar.vue` 组装 emit-only `EditorCommandBar` 与 feature hosts；
   standalone shell 额外接入更新日志/反馈，Embed 不持久化 locale。
8. 该阶段目录依赖 lint、dead-code 与完整 CI gates 尚未实施，后续已由 Phase 8 完成。

### 0.5 Phase 8 当前实现（2026-07-10）

1. `FlowEditor`、palette、Inspector 与各节点 Inspector 直接使用实例
   `EditorContext`；旧 `useLogicFlow` / `useCanvasSettings` facade 已删除，runtime
   expected-instance 清理语义保持不变。
2. dialogs、节点外观与通用消息分别归属 `editor/context/useDialogs.ts`、
   `editor/node-types/useNodeAppearance.ts` 与 `shared/ui/useGlobalMessage.ts`；`src/ts`
   不再承载业务代码。
3. ESLint 覆盖全部 TS/Vue，并通过目录边界规则约束 layer direction、feature
   `public.ts`、store 依赖与 legacy container；阵容码 adapter 到旧 service 是唯一例外。
4. knip 检查不可达文件和依赖问题；CI 在 Pages 构建前运行 test、lint、typecheck、
   format-check、dead-code、`build:app` 与 `build:lib`。

### 1. YysEditorEmbed.vue 迁移前组件结构（历史记录）

> 下列代码仅记录早期组件化方案。当前生产路径为
> `editor/components/{NodePalette,FlowEditor,EditorDialogHost}.vue`，且公开数据同步、
> preview runtime 与实例 workspace 已不再使用此简化实现。

```vue
<template>
  <div
    class="yys-editor-embed"
    :class="{ 'preview-mode': mode === 'preview' }"
    :style="containerStyle"
  >
    <!-- 编辑模式：完整 UI -->
    <template v-if="mode === 'edit'">
      <!-- 工具栏 -->
      <Toolbar v-if="showToolbar" @save="handleSave" @cancel="handleCancel" />

      <!-- 主内容区 -->
      <div class="editor-content">
        <!-- 左侧组件库 -->
        <ComponentsPanel v-if="showComponentPanel" />

        <!-- 中间画布 -->
        <FlowEditor
          ref="flowEditorRef"
          :initial-data="data"
          @graph-data-change="handleDataChange"
        />
      </div>
    </template>

    <!-- 预览模式：只有画布 -->
    <template v-else>
      <FlowEditor ref="flowEditorRef" :initial-data="data" :readonly="true" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import FlowEditor from "./components/flow/FlowEditor.vue";
// 当时的共享 Toolbar 已在 Phase 7 删除。
import ComponentsPanel from "./components/flow/ComponentsPanel.vue";
import type { GraphData, EditorConfig } from "./ts/schema";

// Props
const props = withDefaults(
  defineProps<{
    data?: GraphData;
    mode?: "preview" | "edit";
    width?: string | number;
    height?: string | number;
    showToolbar?: boolean;
    showPropertyPanel?: boolean; // 编辑模式下控制属性面板显示
    showComponentPanel?: boolean;
    config?: EditorConfig; // 最小实现已生效（grid/snapline/keyboard）
  }>(),
  {
    mode: "edit",
    width: "100%",
    height: "600px",
    showToolbar: true,
    showPropertyPanel: true, // 编辑模式默认显示属性面板
    showComponentPanel: true,
  },
);

// Emits
const emit = defineEmits<{
  "update:data": [data: GraphData];
  save: [data: GraphData];
  cancel: [];
  error: [error: Error];
}>();

// Refs
const flowEditorRef = ref<InstanceType<typeof FlowEditor>>();

// Computed
const containerStyle = computed(() => ({
  width: typeof props.width === "number" ? `${props.width}px` : props.width,
  height: typeof props.height === "number" ? `${props.height}px` : props.height,
}));

// Methods
const handleDataChange = (data: GraphData) => {
  emit("update:data", data);
};

const handleSave = () => {
  try {
    const data = flowEditorRef.value?.getGraphData();
    if (data) {
      emit("save", data);
    }
  } catch (error) {
    emit("error", error as Error);
  }
};

const handleCancel = () => {
  emit("cancel");
};

// 公开方法（供父组件调用）
const getGraphData = () => {
  return flowEditorRef.value?.getGraphData();
};

const setGraphData = (data: GraphData) => {
  flowEditorRef.value?.setGraphData(data);
};

defineExpose({
  getGraphData,
  setGraphData,
});

// 监听 data 变化
watch(
  () => props.data,
  (newData) => {
    if (newData && flowEditorRef.value) {
      flowEditorRef.value.setGraphData(newData);
    }
  },
  { deep: true },
);

// 初始化
onMounted(() => {
  if (props.data && flowEditorRef.value) {
    flowEditorRef.value.setGraphData(props.data);
  }
});
</script>

<style scoped>
.yys-editor-embed {
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  overflow: hidden;
}

.editor-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.preview-mode {
  background: transparent;
}
</style>
```

### 2. 状态隔离策略

**问题**：同页多实例嵌入时，若沿用模块级共享状态，会出现跨实例互相污染（画布实例、画布设置、store 写入目标串扰）。

**历史过渡方案（已由 Phase 4 替换）**：曾以 `LogicFlowScope` Map 作为实例边界。

```typescript
// YysEditorEmbed.vue
import { createPinia } from "pinia";
import { useFilesStore } from "@/ts/useStore";
import { createLogicFlowScope, provideLogicFlowScope } from "@/ts/useLogicFlow";

// 1) 每个嵌入实例创建独立 Pinia
const localPinia = createPinia();

// 2) 每个嵌入实例创建并 provide 独立 LogicFlowScope
const logicFlowScope = provideLogicFlowScope(createLogicFlowScope());

// 3) store 显式绑定当前 scope，确保 updateTab/switch/save 读写本实例画布
const filesStore = useFilesStore(localPinia);
filesStore.bindLogicFlowScope(logicFlowScope);
```

```typescript
// FlowEditor.vue / useCanvasSettings.ts
import { useLogicFlowScope, setLogicFlowInstance } from "@/ts/useLogicFlow";
import { useCanvasSettings } from "@/ts/useCanvasSettings";

const scope = useLogicFlowScope();
setLogicFlowInstance(lfInstance, scope);
const { selectionEnabled, snapGridEnabled, snaplineEnabled } =
  useCanvasSettings(scope);
```

历史实现要点（不再代表当前代码）：

1. `useLogicFlow` 使用 `Map<LogicFlowScope, LogicFlow>` 管理实例，组件卸载时按 scope 销毁。
2. `useCanvasSettings` 使用 `Map<LogicFlowScope, CanvasSettingsState>` 管理画布设置，跨实例不共享开关状态。
3. `useStore` 通过 `bindLogicFlowScope(scope)` 显式绑定画布来源，避免切换文件时误写其他实例数据。

当前实现以每个 standalone/embed shell 创建的 `EditorContext` 为唯一实例边界。
生产组件直接注入该 Context；旧 `useLogicFlow`、`useCanvasSettings` 与 `src/ts`
compatibility facade 已删除，dialogs/i18n helper 保留在 `editor/context` 所有权内。
Embed 同时拥有独立 Pinia、memory persistence 与 WorkspaceSession；standalone 使用
`filesStore` key 的 localStorage persistence。组件卸载统一 dispose runtime、workspace、
timer、observer 与 subscription。

### 3. 样式隔离策略

**问题**：避免样式冲突

**方案**：

1. 使用 scoped styles
2. 添加命名空间前缀 `.yys-editor-embed`
3. 使用 CSS Modules（可选）

```vue
<style scoped>
.yys-editor-embed {
  /* 所有样式都在这个命名空间下 */
}
</style>
```

### 4. 构建配置

#### vite.config.ts（库模式）

```typescript
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

export default defineConfig({
  plugins: [vue()],

  build: {
    lib: {
      // 入口文件
      entry: resolve(__dirname, "src/YysEditorEmbed.vue"),
      name: "YysEditor",
      // 输出文件名
      fileName: (format) => `onmyoji-flow.${format}.js`,
    },
    rollupOptions: {
      // 外部化依赖（不打包进库）
      external: ["vue", "element-plus"],
      output: {
        // 全局变量名
        globals: {
          vue: "Vue",
          "element-plus": "ElementPlus",
        },
      },
    },
  },
});
```

#### package.json

```json
{
  "name": "@rookie4show/onmyoji-flow",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/onmyoji-flow.umd.js",
  "module": "./dist/onmyoji-flow.es.js",
  "exports": {
    ".": {
      "import": "./dist/onmyoji-flow.es.js",
      "require": "./dist/onmyoji-flow.umd.js"
    },
    "./style.css": "./dist/onmyoji-flow.css"
  },
  "files": [
    "dist/onmyoji-flow.css",
    "dist/onmyoji-flow.es.js",
    "dist/onmyoji-flow.es.js.map",
    "dist/onmyoji-flow.umd.js",
    "dist/onmyoji-flow.umd.js.map"
  ],
  "scripts": {
    "dev": "vite",
    "build": "vite build --config vite.config.lib.js",
    "build:lib": "vite build --config vite.config.lib.js"
  },
  "peerDependencies": {
    "vue": "^3.3.0",
    "element-plus": "^2.9.0",
    "pinia": "^3.0.0",
    "@logicflow/core": "^2.0.0",
    "@logicflow/extension": "^2.0.0",
    "@logicflow/vue-node-registry": "^1.0.0"
  }
}
```

---

## 使用示例

### 在 onmyoji-wiki 中使用

```vue
<template>
  <div class="yys-editor-block">
    <!-- 预览模式 -->
    <div v-if="!isEditing" @click="startEdit">
      <YysEditorEmbed mode="preview" :data="flowData" :height="400" />
      <button class="edit-btn">✏️ 编辑流程图</button>
    </div>

    <!-- 编辑模式（弹窗） -->
    <el-dialog v-model="isEditing" fullscreen>
      <YysEditorEmbed
        mode="edit"
        :data="flowData"
        :height="'100%'"
        @save="handleSave"
        @cancel="handleCancel"
        @error="handleError"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { YysEditorEmbed } from "@rookie4show/onmyoji-flow";
import "@rookie4show/onmyoji-flow/style.css";

const isEditing = ref(false);
const flowData = ref({
  nodes: [],
  edges: [],
});

const startEdit = () => {
  isEditing.value = true;
};

const handleSave = (data) => {
  flowData.value = data;
  isEditing.value = false;
  // 保存到文档
  saveToDocument(data);
};

const handleCancel = () => {
  isEditing.value = false;
};

const handleError = (error) => {
  console.error("编辑器错误:", error);
};
</script>
```

### 作为 npm 包安装

```bash
# 在 onmyoji-wiki 项目中
npm install file:../onmyoji-flow

# 或发布到 npm 后
npm install @rookie4show/onmyoji-flow
```

---

## 测试计划

### 功能测试

#### 预览模式

- [ ] 正确渲染流程图
- [ ] 只读，无法编辑
- [ ] 不显示工具栏、组件库、属性面板
- [ ] 响应式尺寸

#### 编辑模式

- [ ] 完整编辑功能
- [ ] 工具栏正常工作
- [ ] 组件库可拖拽
- [ ] 属性面板可编辑
- [ ] 保存/取消按钮触发正确事件

#### 数据接口

- [ ] Props 传入数据正确渲染
- [ ] 数据变更触发 update:data 事件
- [ ] 保存触发 save 事件
- [ ] 取消触发 cancel 事件
- [ ] 错误触发 error 事件

#### 状态隔离

- [ ] 多个实例互不影响
- [ ] 不污染全局状态
- [ ] 样式不冲突

### 集成测试

#### 在 wiki 中集成

- [ ] 可以正常引入
- [ ] 预览模式正常显示
- [ ] 编辑模式正常工作
- [ ] 数据保存正确
- [ ] 样式不冲突

### 性能测试

- [ ] 打包体积合理（< 500KB gzipped）
- [ ] 加载速度快
- [ ] 运行流畅，无卡顿

---

## 验收标准

### 功能完整性

- ✅ 支持预览和编辑模式
- ✅ 数据接口清晰（Props + Emits）
- ✅ 可以作为 npm 包引用
- ✅ 状态和样式隔离

### 兼容性

- ✅ 不影响独立应用功能
- ✅ 支持 Vue 3.3+
- ✅ 支持现代浏览器

### 文档完善

- ✅ API 文档
- ✅ 使用示例
- ✅ 集成指南

---

## 实现记录

### 2026-02-20

- 📝 创建组件化改造设计文档
- 📝 定义 Props 和 Emits 接口
- 📝 设计双模式架构
- 📝 规划状态隔离策略

---

**最后更新：** 2026-03-04
**文档版本：** v1.0.1
