# Toolbar Architecture (Phase 2)

## 目标

在不改变行为语义的前提下，将 `Toolbar.vue` 按“命令编排层 / 数据管理层 / 视图层”拆分，降低单文件复杂度并保持 `YysEditorEmbed` 与 `FlowEditor` 兼容。

## 边界约束

- 不改 UI 表现。
- 不改业务语义。
- 不新增对外 API。
- 拆分后 `Toolbar.vue` 仅做模板绑定和编排接线。

## Phase 2 原子拆分计划

1. 导入/导出/预览命令编排：`useToolbarImportExportCommands`
2. 素材管理编排：`useToolbarAssetManagement`
3. 规则管理编排：`useToolbarRuleManagement`
4. 工作区控制命令编排：`useToolbarWorkspaceCommands`
5. 对话框状态编排：`useToolbarDialogState`
6. 架构边界守卫回归：`toolbar-architecture.guard`

## Task 1 落地（导入/导出/预览）

新增：`src/components/composables/useToolbarImportExportCommands.ts`

当前由该 composable 承接的命令：

- `handleExport`
- `handlePreviewData`
- `copyDataToClipboard`
- `openImportDialog`
- `triggerJsonFileImport`
- `triggerTeamCodeQrImport`
- `handleTeamCodeImport`
- `handleTeamCodeQrImport`
- `prepareCapture`
- `downloadImage`
- `handleClose`

`Toolbar.vue` 仍保留：

- 视图模板与按钮绑定。
- `state` / `watermark` 等现有响应式数据定义。
- 与本任务无关的规则管理、工作区控制逻辑。

## Task 2 落地（素材管理）

新增：`src/components/composables/useToolbarAssetManagement.ts`

当前由该 composable 承接的编排：

- 素材分类映射与当前分类状态
- 素材列表刷新（全量 / 按分类）
- 素材存储订阅与销毁（`mountAssetManagement` / `disposeAssetManagement`）
- 素材管理弹窗打开
- 素材上传触发与上传处理
- 素材删除处理

`Toolbar.vue` 调整为：

- 保留模板绑定与生命周期调用点（`onMounted` / `onBeforeUnmount`）。
- 通过 composable 暴露的 API 接线素材管理按钮与列表渲染。

## Task 3 落地（规则管理）

新增：`src/components/composables/useToolbarRuleManagement.ts`

当前由该 composable 承接的编排：

- 规则配置 draft 管理与重载
- 规则/变量导入导出
- 规则编辑器状态与保存校验
- 新增/删除规则、新增/删除变量
- 应用规则配置与恢复默认
- 规则文档说明文本

`Toolbar.vue` 调整为：

- 继续保留视图层模板与按钮/弹窗绑定。
- 通过 composable 返回的 refs/methods 接线规则管理 UI，不改外部行为与交互语义。

## Task 4 落地（工作区控制命令）

新增：`src/components/composables/useToolbarWorkspaceCommands.ts`

当前由该 composable 承接的命令：

- `loadExample`
- `handleResetWorkspace`
- `handleClearCanvas`

`Toolbar.vue` 调整为：

- 保留 `refreshLogicFlowCanvas` 与模板按钮绑定点。
- 通过 composable 返回命令接线工作区按钮，不改确认弹窗文案与执行语义。

## Task 5 落地（对话框状态编排）

新增：`src/components/composables/useToolbarDialogState.ts`

当前由该 composable 承接的编排：

- 更新日志对话框开关与版本首开逻辑
- 反馈对话框开关
- 水印设置状态初始化与持久化应用

`Toolbar.vue` 调整为：

- 水印按钮改为调用 `openWatermarkDialog` 接线方法。
- `onMounted` 通过 `mountDialogState` 执行版本首开逻辑，不改 embed 模式行为。
- 通过 composable 返回的 `watermark` 与命令接线既有水印设置弹窗，不改文案和 UI 结构。
