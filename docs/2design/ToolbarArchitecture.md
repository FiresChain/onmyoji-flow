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
7. 接线行为回归：`toolbar-wiring.regression`
8. workspace/dialog 边界分支回归：`useToolbarWorkspaceCommands` + `useToolbarDialogState`
9. import/export 失败与边界分支回归：`useToolbarImportExportCommands`
10. 导入对话框接线回归：`toolbar-wiring.regression`（json/teamCode/qr）
11. import/export 架构守卫补强：`toolbar-architecture.guard`

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

## Task 6 落地（架构边界守卫）

新增：`src/__tests__/toolbar-architecture.guard.test.ts`

守卫目标：

- 约束 `Toolbar.vue` 必须通过 composables 接线（导入导出、素材、规则、工作区、对话框状态）。
- 约束导入导出实现留在 `useToolbarImportExportCommands`，`Toolbar.vue` 仅保留按钮/输入控件接线。
- 约束素材管理实现留在 `useToolbarAssetManagement`，`Toolbar.vue` 仅保留弹窗与生命周期接线。
- 约束规则管理实现留在 `useToolbarRuleManagement`，`Toolbar.vue` 仅保留规则管理模板与命令接线。
- 约束工作区控制命令实现留在 `useToolbarWorkspaceCommands`，避免实现回流到 `Toolbar.vue`。
- 约束更新日志/反馈/水印状态实现留在 `useToolbarDialogState`，`Toolbar.vue` 仅保留按钮与生命周期接线。

## Task 7 落地（接线行为回归）

新增：`src/__tests__/toolbar-wiring.regression.test.ts`

回归目标：

- 验证生命周期接线不回退：`onMounted` 仍调用 `mountAssetManagement` 与 `mountDialogState`，`onBeforeUnmount` 仍调用 `disposeAssetManagement`。
- 验证顶栏关键按钮命令链路不回退：按钮点击继续触发对应 composable 命令（import/export、asset、rule、workspace、dialog）。

## Task 8 落地（workspace/dialog 边界分支补强）

增强：`src/__tests__/useToolbarWorkspaceCommands.test.ts`、`src/__tests__/useToolbarDialogState.test.ts`

回归目标：

- `workspace`：
  - 补齐 `handleClearCanvas` 取消分支（确认取消后不触发画布操作与状态回写）。
  - 补齐无 LogicFlow 实例分支（仍回写 active file 并提示成功）。
  - 补齐无 active file 分支（仅执行画布清理，不回写 tab）。
- `dialog`：
  - 补齐 `mountDialogState` 同版本 no-op 分支。
  - 补齐水印配置初始化边界（持久化值读取 + 非数字输入回退默认值）。

## Task 9 落地（ImportExport 失败与边界分支补强）

增强：`src/__tests__/useToolbarImportExportCommands.test.ts`

回归目标：

- JSON 导入：补齐解析失败和无文件 no-op 分支，保持错误提示与重置行为不变。
- 阵容码导入：补齐转换失败分支，保持 loading 回收与错误提示行为不变。
- 二维码导入：补齐无文件 no-op 与识别失败分支，保持输入回填/清理语义不变。
- 截图链路：补齐空快照与水印处理失败分支，保持错误提示与预览状态守卫不变。

## Task 10 落地（Toolbar 导入对话框接线回归）

增强：`src/__tests__/toolbar-wiring.regression.test.ts`

回归目标：

- 导入来源切换后，导入对话框按钮链路仍指向既有命令，不回退到 `Toolbar.vue` 内实现。
- “选择 JSON 文件” 继续触发 `triggerJsonFileImport`。
- “导入阵容码” 继续触发 `handleTeamCodeImport`。
- “选择二维码图片” 继续触发 `triggerTeamCodeQrImport`。

## Task 11 落地（ImportExport 架构守卫补强）

增强：`src/__tests__/toolbar-architecture.guard.test.ts`

回归目标：

- `Toolbar.vue` 不应包含 import/export 具体实现片段（teamCode 转换、QR 识别、截图/水印细节、关键错误处理）。
- `useToolbarImportExportCommands.ts` 需保留对应实现片段与关键错误处理路径。
- `Toolbar.vue` 仅保留命令接线与模板绑定，不承载实现逻辑。
