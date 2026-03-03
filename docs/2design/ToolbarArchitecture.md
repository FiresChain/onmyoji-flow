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
12. import/export 定时与清理分支补强：`useToolbarImportExportCommands`
13. 导入对话框状态复位接线回归：`toolbar-wiring.regression`
14. import/export 架构守卫再收紧：`toolbar-architecture.guard`
15. import/export 定时与 DOM 归属守卫细化：`toolbar-architecture.guard`
16. import/export 生命周期清理与状态复位边界补强：`useToolbarImportExportCommands`
17. 导入对话框多轮循环接线回归：`toolbar-wiring.regression`
18. import/export 架构守卫细化（二次）：定时语义与 DOM 归属模式守卫：`toolbar-architecture.guard`

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

## Task 12 落地（ImportExport 定时与清理分支补强）

增强：`src/__tests__/useToolbarImportExportCommands.test.ts`

回归目标：

- `handlePreviewData` 补齐序列化失败分支，保持失败提示与弹窗状态守卫不变。
- `copyDataToClipboard` 补齐剪贴板失败分支，保持错误提示语义不变。
- `downloadImage` 补齐空预览 no-op 与下载后关闭预览分支。
- `handleClose` 补齐预览关闭清理分支（`previewImage` 清空 + `done` 回调执行）。

## Task 13 落地（Toolbar 导入对话框状态复位接线回归）

增强：`src/__tests__/toolbar-wiring.regression.test.ts`

回归目标：

- “导入”按钮继续命中 `openImportDialog`，并保持导入弹窗打开链路不变。
- 来源切换到 `teamCode` 并关闭弹窗后，再次打开时仍恢复默认来源 `json`，且输入状态复位不变。
- 导入弹窗命令链路保持 `json/teamCode/qr` 三路径接线：`triggerJsonFileImport` / `handleTeamCodeImport` / `triggerTeamCodeQrImport`。

## Task 14 落地（ImportExport 架构守卫再收紧）

增强：`src/__tests__/toolbar-architecture.guard.test.ts`

回归目标：

- `Toolbar.vue` 不应出现 import/export 的 DOM 与定时实现片段（`document.createElement('input'/'a')`、`FileReader`、剪贴板写入与导出/预览定时细节）。
- `useToolbarImportExportCommands.ts` 需保留上述实现片段，确保 import/export 实现归属仍在 composable。
- 补齐 import/export 关键错误处理路径守卫（数据预览失败、复制失败、文件格式错误、截图关键错误）以防实现回流或语义漂移。

## Task 15 落地（ImportExport 架构守卫细化：定时与 DOM 归属）

增强：`src/__tests__/toolbar-architecture.guard.test.ts`

回归目标：

- `Toolbar.vue` 不应出现 import/export 的 DOM 细节语句（`document.createElement('input'/'a')`、`FileReader`、`navigator.clipboard.writeText`）。
- `Toolbar.vue` 不应出现 import/export 的定时语义片段（导出 `2000ms`、预览 `100ms`）。
- `useToolbarImportExportCommands.ts` 必须保留上述 DOM 与定时实现片段，确保实现责任边界继续稳定在 composable。

## Task 16 落地（ImportExport 生命周期清理与状态复位边界补强）

增强：`src/__tests__/useToolbarImportExportCommands.test.ts`

回归目标：

- `triggerTeamCodeQrImport` 在 `teamCodeQrInputRef` 为空时保持 no-op，不触发副作用。
- `openImportDialog` 重复调用时持续保持来源重置为 `json`、输入清空、弹窗打开语义（幂等）。
- `triggerJsonFileImport` 失败路径后保持导入弹窗状态语义不变（维持关闭），且不污染来源与输入状态。
- `handleTeamCodeQrImport` 成功/失败/无文件三分支均保持 `decoding` 状态回收与文件 input 清理语义不变。

## Task 17 落地（Toolbar 导入对话框多轮循环接线回归）

增强：`src/__tests__/toolbar-wiring.regression.test.ts`

回归目标：

- 覆盖“打开 -> 切换来源 -> 关闭 -> 再打开”连续两轮循环，验证每轮打开后默认来源仍回到 `json`。
- 每轮均校验 `json/teamCode/qr` 三路径按钮继续命中既有 composable 命令：`triggerJsonFileImport` / `handleTeamCodeImport` / `triggerTeamCodeQrImport`。
- 校验“导入”按钮触发次数与 `openImportDialog` 调用次数一致，防止接线链路漂移。

## Task 18 落地（ImportExport 架构守卫细化：模式级定时与 DOM 归属）

增强：`src/__tests__/toolbar-architecture.guard.test.ts`

回归目标：

- 在既有片段守卫之外，新增模式级守卫，防止 `Toolbar.vue` 回流 `document.createElement('input'/'a')`、`FileReader`、`navigator.clipboard.writeText` 等 import/export DOM 实现细节。
- 新增模式级守卫，防止 `Toolbar.vue` 回流导出 `2000ms` 与预览 `100ms` 的 import/export 定时实现语义。
- 约束 `useToolbarImportExportCommands.ts` 必须保留 `handleExport` 与 `handlePreviewData` 对应的定时实现（`2000ms` / `100ms`）及既有实现归属。
