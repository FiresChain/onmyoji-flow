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
19. import/export 生命周期清理边界补强（二次）：重复失败幂等与 in-flight 回收守卫：`useToolbarImportExportCommands`
20. 导入对话框多轮循环接线回归（二次）：关闭后污染态恢复与链路计数对齐守卫：`toolbar-wiring.regression`
21. import/export 架构守卫 AST 级补强：脚本边界调用归属与定时语义归属守卫：`toolbar-architecture.guard`
22. import/export 命令确定性与 ref 事件边界补强：`useToolbarImportExportCommands`
23. 导入来源切换可见性与命令计数漂移回归：`toolbar-wiring.regression`
24. Toolbar 接线回归抗脆弱补强：来源状态绑定可见性断言与跨轮计数漂移守卫：`toolbar-wiring.regression`
25. Toolbar 架构守卫 AST 完整性补强：composable 导入/调用归属与命令解构完整性守卫：`toolbar-architecture.guard`
26. ImportExport 交错触发时序确定性补强：`useToolbarImportExportCommands`
27. Toolbar 导入弹窗作用域去标题耦合回归：结构锚点定位守卫：`toolbar-wiring.regression`
28. Toolbar 导入弹窗模板接线结构守卫补强：来源分支不变量与二维码双入口接线守卫：`toolbar-architecture.guard`
29. ImportExport 定时窗口边界确定性补强：分段推进与多批次交错计数守卫：`useToolbarImportExportCommands`
30. Toolbar 导入弹窗结构作用域排他性回归：结构锚点 exclusivity 与多轮计数对齐守卫：`toolbar-wiring.regression`
31. Toolbar 导入接线参数不变量守卫补强：调用参数键 + 来源分支 + 接线层边界守卫：`toolbar-architecture.guard`
32. ImportExport 定时窗口清理确定性补强：分段推进 + flush + 新批次无漂移守卫：`useToolbarImportExportCommands`
33. Toolbar 导入弹窗结构锚点抗噪声回归：footer-noise 下作用域排他与多轮计数对齐守卫：`toolbar-wiring.regression`
34. Toolbar 导入模板结构不变量守卫再收紧：唯一来源绑定 + QR input 接线细节 + 接线层边界守卫：`toolbar-architecture.guard`
35. ImportExport 分段推进 + 局部 flush + 重批次确定性补强：计数稳定与零残留定时器守卫：`useToolbarImportExportCommands`
36. Toolbar 导入弹窗结构锚点混合噪声回归补强：多 footer 噪声 + 额外结构噪声节点下作用域排他与计数对齐守卫：`toolbar-wiring.regression`
37. Toolbar 导入模板局部结构不变量再收紧：局部 `import-form` 唯一来源绑定 + QR actions 同域接线 + 接线层依赖边界守卫：`toolbar-architecture.guard`
38. ImportExport 阈值前 flush + 重批次隔离确定性补强：99ms 前 flush 与新批次分段窗口计数/定时器零残留守卫：`useToolbarImportExportCommands`
39. Toolbar 导入弹窗结构锚点 slot-wrapper 混合噪声回归补强：结构锚点定位在 slot-wrapper 假锚点共存下继续唯一命中并保持多轮计数对齐：`toolbar-wiring.regression`
40. Toolbar 导入模板局部结构不变量再收紧：导入弹窗局部唯一性 + 来源分支互斥 + QR 接线同域守卫：`toolbar-architecture.guard`
41. ImportExport 阈值前 flush 变体矩阵 + 批次隔离确定性补强：99ms 前 flush、多批次分段推进与定时器零残留守卫：`useToolbarImportExportCommands`
42. Toolbar 导入弹窗结构锚点再补强：嵌套 slot-wrapper + slot/footer 混合噪声矩阵下唯一命中与多轮计数对齐守卫：`toolbar-wiring.regression`
43. Toolbar 导入模板局部不变量再收紧：footer 分支互斥、相邻结构稳定与局部唯一绑定守卫：`toolbar-architecture.guard`
44. ImportExport 阈值前 flush 变体矩阵（二次）+ 批次隔离补强：重复变体下分段推进计数稳定与零残留定时器守卫：`useToolbarImportExportCommands`
45. Toolbar 导入弹窗结构锚点补强：文案漂移 + 假命令噪声矩阵下作用域唯一命中与多轮计数对齐守卫：`toolbar-wiring.regression`

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

## Task 19 落地（ImportExport 生命周期清理边界补强：重复失败与 in-flight 回收）

增强：`src/__tests__/useToolbarImportExportCommands.test.ts`

回归目标：

- 补充 `triggerJsonFileImport` 连续失败回归，锁定失败后导入弹窗持续关闭、来源保持 `json`、输入不被污染（幂等语义不回退）。
- 补充 `handleTeamCodeQrImport` in-flight 状态回归，验证成功/失败异步分支在处理中 `decoding` 置为 `true`，收尾后统一回收为 `false`。
- 在上述异步分支中统一断言文件 input 清理语义保持不变，避免生命周期清理边界回退。

## Task 20 落地（Toolbar 导入对话框多轮循环接线回归：污染态恢复与计数对齐）

增强：`src/__tests__/toolbar-wiring.regression.test.ts`

回归目标：

- 在两轮“打开 -> 切换来源 -> 关闭 -> 再打开”循环中，新增“关闭后人为污染来源/输入”场景，验证下一轮打开仍恢复默认来源 `json` 与空输入。
- 增补命令计数对齐守卫：`openImportDialog`、`triggerJsonFileImport`、`handleTeamCodeImport`、`triggerTeamCodeQrImport` 在多轮循环后均与“导入”按钮触发轮次一致。
- 保持 `Toolbar.vue` 仅作为接线层，确保多轮循环不发生命令链路漂移。

## Task 21 落地（ImportExport 架构守卫 AST 级补强）

增强：`src/__tests__/toolbar-architecture.guard.test.ts`

回归目标：

- 在既有字符串/模式守卫基础上，增加 AST 级边界守卫，锁定 `Toolbar.vue` script 区域不回流 import/export 实现调用（`document.createElement`、`FileReader`、`navigator.clipboard.writeText`、import/export 语义定时回调）。
- 通过 AST 断言 `useToolbarImportExportCommands.ts` 继续持有上述调用归属（包含 `input/a` 节点创建、二维码读取与剪贴板写入调用）。
- 通过 AST 断言导出 `2000ms` 与预览 `100ms` 定时语义仍归属 `useToolbarImportExportCommands`，避免接线层与命令层边界漂移。

## Task 22 落地（ImportExport 命令确定性与 ref 事件边界补强）

增强：`src/__tests__/useToolbarImportExportCommands.test.ts`

回归目标：

- `triggerTeamCodeQrImport` 在 `teamCodeQrInputRef` 存在时，`click` 调用次数与触发次数严格一致，不产生额外副作用。
- `handleTeamCodeQrImport` 在 `event.target` 缺失或异常输入时保持 no-op，且 `decodingTeamCodeQr`/输入状态不被污染。
- `handleExport` 与 `handlePreviewData` 多次连续触发时，`updateTab` 立即调用与延时执行（`2000ms` / `100ms`）计数关系保持稳定，不漂移。

## Task 23 落地（Toolbar 导入来源切换可见性与计数漂移回归）

增强：`src/__tests__/toolbar-wiring.regression.test.ts`

回归目标：

- 导入弹窗在 `json/teamCode` 来源切换时，按钮可见性保持与既有命令接线一致（`json` 显示 JSON 导入按钮；`teamCode` 显示阵容码与二维码入口）。
- 单轮内多次来源来回切换后，`json/teamCode/qr` 三路径仍命中既有 composable 命令（`triggerJsonFileImport` / `handleTeamCodeImport` / `triggerTeamCodeQrImport`）。
- 跨轮打开导入弹窗后，`openImportDialog` 与三路径命令调用计数持续对齐，不多调/不少调，防止接线计数漂移。

## Task 24 落地（Toolbar 接线回归抗脆弱补强：来源状态绑定可见性 + 跨轮计数守卫）

增强：`src/__tests__/toolbar-wiring.regression.test.ts`

回归目标：

- 导入弹窗可见性断言从“单一文案匹配”收敛为“来源状态 + 结构选择器”联合守卫：`json` 来源仅暴露 JSON 导入命令入口，`teamCode` 来源暴露阵容码与二维码入口。
- 在多轮来源切换与重开导入弹窗场景下，持续断言 `openImportDialog` 与 `triggerJsonFileImport` / `handleTeamCodeImport` / `triggerTeamCodeQrImport` 调用计数同轮对齐，避免计数漂移。
- 保持 `Toolbar.vue` 仅接线语义，不引入 UI/业务语义变更，仅提升测试稳定性与可维护性。

## Task 25 落地（Toolbar 架构守卫 AST 完整性补强：composable 导入/命令解构）

增强：`src/__tests__/toolbar-architecture.guard.test.ts`

回归目标：

- 通过 AST 守卫 `Toolbar.vue` script 必须保留 5 个 composable 的导入与调用归属：`ImportExport` / `Asset` / `Rule` / `Workspace` / `Dialog`。
- 通过 AST 守卫 `useToolbarImportExportCommands` 的解构命令集合完整（导入/导出/预览/截图相关命令不可缺失）。
- 通过 AST 守卫 `Toolbar.vue` script 不应直接导入 `teamCodeService` 或 import/export 实现依赖，保持接线层职责边界稳定。

## Task 26 落地（ImportExport 交错触发时序确定性补强）

增强：`src/__tests__/useToolbarImportExportCommands.test.ts`

回归目标：

- 在 `handleExport` 与 `handlePreviewData` 多轮交错触发下，持续断言 `updateTab` 立即执行，`100ms` 预览与 `2000ms` 导出计数关系稳定且无漂移。
- 在同一轮内覆盖“先预览后导出”与“先导出后预览”两种顺序，确保双顺序下计数一致且定时语义不回退。
- 保持既有失败分支语义与实现行为不变，仅补齐时序确定性断言。

## Task 27 落地（Toolbar 导入弹窗作用域去标题耦合回归）

增强：`src/__tests__/toolbar-wiring.regression.test.ts`

回归目标：

- 导入弹窗作用域定位从标题文案依赖迁移为结构锚点组合守卫（`import-form` + `dialog-footer` + `team-code-qr-actions`），避免对 `title="导入数据"` 单点耦合。
- 保持并验证 `json/teamCode` 来源绑定的可见性断言不回退：`json` 仅暴露 JSON 导入入口，`teamCode` 暴露阵容码与二维码入口。
- 保持并验证 `openImportDialog` 与 `json/teamCode/qr` 三路径命令在多轮切换/重开场景中的计数持续对齐，不发生漂移。

## Task 28 落地（Toolbar 导入弹窗模板接线结构守卫补强）

增强：`src/__tests__/toolbar-architecture.guard.test.ts`

回归目标：

- 在 `Toolbar.vue` 模板守卫中锁定导入来源分支不变量：`json` 分支按钮必须保留 `v-if="importSource === 'json'" + @click="triggerJsonFileImport"`，`teamCode` 分支按钮必须保留 `v-else + @click="handleTeamCodeImport"`。
- 锁定二维码入口双接线不变量：`@click="triggerTeamCodeQrImport"` 与 `@change="handleTeamCodeQrImport"` 必须同时保留，且 `team-code-qr-actions` 结构锚点存在。
- 保持 `Toolbar.vue` 仅做接线层边界，不回流 `convertTeamCodeToRootDocument` / `decodeTeamCodeFromQrImage` / 截图水印实现依赖到 script 层。

## Task 29 落地（ImportExport 定时窗口边界确定性补强）

增强：`src/__tests__/useToolbarImportExportCommands.test.ts`

回归目标：

- 在 `handleExport` / `handlePreviewData` 交错触发后，按 `99ms -> 1ms -> 1899ms -> 1ms` 分段推进，锁定 `updateTab` 即时计数、`100ms` 预览计数、`2000ms` 导出计数均稳定且无提前触发。
- 增加“多批次交错 + 中途 flush 后再触发新一批”回归，验证第二批的预览/导出计数在同一分段窗口下持续对齐、不漂移。
- 保持既有失败分支语义不变（序列化失败、导入失败、二维码失败等），仅补确定性断言，不改实现逻辑。

## Task 30 落地（Toolbar 导入弹窗结构作用域排他性回归）

增强：`src/__tests__/toolbar-wiring.regression.test.ts`

回归目标：

- 导入弹窗作用域定位继续使用结构锚点组合（`import-form` + `dialog-footer`），并在 `teamCode` 来源下显式校验 `team-code-qr-actions` 仍位于同一导入弹窗作用域内。
- 显式校验导入弹窗作用域对 `.dialog-footer` 的排他性：导入作用域唯一，且存在其它非导入弹窗 footer，不应被误命中。
- 保持并验证 `json/teamCode` 来源绑定可见性断言与 `openImportDialog + json/teamCode/qr` 三路径命令在多轮切换/重开场景中的计数持续对齐。

## Task 31 落地（Toolbar 导入接线参数不变量守卫补强）

增强：`src/__tests__/toolbar-architecture.guard.test.ts`

回归目标：

- 新增 AST 守卫：`useToolbarImportExportCommands` 调用参数对象必须保留 `state/importSource/teamCodeInput/teamCodeQrInputRef` 接线键。
- 新增 AST 守卫：`importSource` 默认初始化必须保持 `ref<'json' | 'teamCode'>('json')`。
- 新增模板守卫：`importSource` 的 `json/teamCode` 分支与二维码入口双接线（`@click="triggerTeamCodeQrImport"` + `@change="handleTeamCodeQrImport"`）继续存在。
- 保持 `Toolbar.vue` 仅做接线层边界，不回流 import/export 实现依赖。

## Task 32 落地（ImportExport 定时窗口清理确定性补强）

增强：`src/__tests__/useToolbarImportExportCommands.test.ts`

回归目标：

- 在交错触发后按 `99ms -> 1ms -> 1899ms -> 1ms` 分段推进，持续锁定 `updateTab` 即时计数、`100ms` 预览计数、`2000ms` 导出计数稳定且无提前触发。
- 在“中途 `runOnlyPendingTimers`/flush 后再触发新批次”场景，持续验证第二批分段窗口下计数无漂移。
- 增加定时器清理断言（`vi.getTimerCount()`），确保批次收束后无幽灵定时器残留，且既有失败分支语义不变。

## Task 33 落地（Toolbar 导入弹窗结构锚点抗噪声回归）

增强：`src/__tests__/toolbar-wiring.regression.test.ts`

回归目标：

- 在存在额外 `dialog-footer` 噪声节点时，导入弹窗作用域仍唯一命中结构锚点组合（`import-form` + `dialog-footer`），不串到其它弹窗 footer。
- 在 `teamCode` 来源下，`team-code-qr-actions` 继续仅位于导入弹窗作用域内，不受全局 footer 噪声干扰。
- 在 footer-noise + 多轮“打开/切换来源/关闭/重开”循环中，`openImportDialog` 与 `json/teamCode/qr` 三路径命令计数持续对齐，不发生漂移。

## Task 34 落地（Toolbar 导入模板结构不变量守卫再收紧）

增强：`src/__tests__/toolbar-architecture.guard.test.ts`

回归目标：

- 将导入模板守卫收敛到导入弹窗局部结构，锁定 `importSource` 绑定入口唯一（`v-model="importSource"`）且 `json/teamCode` 两个来源选项持续存在。
- 收紧二维码入口结构锚点：`team-code-qr-actions` 唯一且二维码 input 继续保持 `ref="teamCodeQrInputRef" + @change="handleTeamCodeQrImport" + accept="image/*"` 接线不变量。
- 持续守卫 `Toolbar.vue` 为接线层，不回流 `teamCodeService` 与 import/export 实现依赖。

## Task 35 落地（ImportExport 分段推进 + 局部 flush + 重批次确定性补强）

增强：`src/__tests__/useToolbarImportExportCommands.test.ts`

回归目标：

- 在交错触发后继续按 `99ms -> 1ms -> 1899ms -> 1ms` 分段推进，锁定 `updateTab` 即时计数、`preview/export` 延时计数稳定且无提前触发。
- 新增“中途 `runOnlyPendingTimers` 局部 flush 后触发新批次”场景，验证 re-batch 后分段窗口计数不漂移。
- 在局部 flush 和批次收束后均增加 `vi.getTimerCount() === 0` 清理断言，确保无幽灵定时器残留。

## Task 36 落地（Toolbar 导入弹窗结构锚点混合噪声回归补强）

增强：`src/__tests__/toolbar-wiring.regression.test.ts`

回归目标：

- 在“多个非导入弹窗 `dialog-footer` 噪声 + 额外结构噪声节点（`dialog-structure-noise`）”并存时，导入弹窗仍唯一命中结构锚点组合（`import-form` + `dialog-footer`）。
- 在 `teamCode` 来源下，`team-code-qr-actions` 继续仅位于导入弹窗作用域内，不被结构噪声节点误命中。
- 在 mixed-structural-noise + 多轮“打开/切换来源/关闭/重开”循环中，`openImportDialog` 与 `json/teamCode/qr` 三路径命令计数持续对齐。

## Task 37 落地（Toolbar 导入模板局部结构不变量再收紧）

增强：`src/__tests__/toolbar-architecture.guard.test.ts`

回归目标：

- 锁定导入弹窗局部模板中 `import-form` 与 `v-model="importSource"` 绑定入口全局唯一且局部唯一，不回流到其它对话框模板。
- 锁定 `json/teamCode` 来源选项在导入表单局部模板中保持唯一且完整（无额外来源分支）。
- 锁定 `team-code-qr-actions` 结构锚点唯一，二维码 input 接线持续保持 `ref="teamCodeQrInputRef" + @change="handleTeamCodeQrImport" + accept="image/*"`，且与 `triggerTeamCodeQrImport` 同域。
- 持续守卫 `Toolbar.vue` 为接线层，不回流 `teamCodeService` 与 import/export 实现依赖。

## Task 38 落地（ImportExport 阈值前 flush + 重批次隔离确定性补强）

增强：`src/__tests__/useToolbarImportExportCommands.test.ts`

回归目标：

- 在交错触发后先推进 `99ms`，随后执行 `runOnlyPendingTimers`（阈值前 flush），验证 `preview/export` 计数在首批次收束时无漂移，且 `vi.getTimerCount()` 归零。
- flush 后触发新批次，按 `99ms -> 1ms -> 1899ms -> 1ms` 分段推进，持续锁定 `updateTab` 即时计数、`preview/export` 延时计数稳定且无提前触发。
- 在 flush 收束后与批次收尾后分别断言 `vi.getTimerCount() === 0`，确保无幽灵定时器残留。

## Task 39 落地（Toolbar 导入弹窗结构锚点 slot-wrapper 混合噪声回归补强）

增强：`src/__tests__/toolbar-wiring.regression.test.ts`

回归目标：

- 在“多个非导入弹窗 footer 噪声 + slot-wrapper 结构噪声（含 `import-form` 假锚点）”并存时，导入弹窗仍唯一命中 `import-form + dialog-footer` 结构锚点。
- 在 `teamCode` 来源下，真实 `team-code-qr-actions` 继续仅归属导入弹窗作用域，不被 slot-wrapper 噪声节点误命中。
- 在 slot-wrapper mixed-noise 多轮“打开/切换来源/关闭/重开”循环中，`openImportDialog + json/teamCode/qr` 三路径命令计数持续对齐。

## Task 40 落地（Toolbar 导入模板局部结构不变量：分支互斥与局部唯一性）

增强：`src/__tests__/toolbar-architecture.guard.test.ts`

回归目标：

- 锁定导入弹窗局部模板中 `import-form`、`importSource` 绑定入口、`teamCodeInput` 绑定入口在全模板与导入弹窗局部均保持唯一。
- 锁定 `json/teamCode` 来源选项在导入弹窗局部模板内保持完整且唯一，不新增额外来源分支。
- 锁定 footer 行为按钮分支互斥：`triggerJsonFileImport` 按钮保持 `v-if` 且唯一，`handleTeamCodeImport` 按钮保持 `v-else` 且唯一，并维持相邻互斥结构。
- 锁定 `team-code-qr-actions` 与二维码 input 接线继续保持 `ref="teamCodeQrInputRef" + @change="handleTeamCodeQrImport" + accept="image/*"`，并持续守卫 `Toolbar.vue` 仅为接线层。

## Task 41 落地（ImportExport 阈值前 flush 变体矩阵 + 批次隔离确定性）

增强：`src/__tests__/useToolbarImportExportCommands.test.ts`

回归目标：

- 新增“阈值前 flush 变体矩阵”回归：交错触发后统一在 `99ms` 阈值前执行 `runOnlyPendingTimers`，验证 `preview/export` 计数在各变体下不漂移且 flush 后 `vi.getTimerCount() === 0`。
- 在每个变体首批 flush 后触发新批次，按 `99ms -> 1ms -> 1899ms -> 1ms` 分段推进，持续锁定 `updateTab` 即时计数、`preview/export` 延时计数稳定且无提前触发。
- 在变体循环收尾与全流程收束后重复断言 `vi.getTimerCount() === 0`，确保批次隔离下无幽灵定时器残留。

## Task 42 落地（Toolbar 导入弹窗结构锚点：嵌套 slot-footer 噪声矩阵回归）

增强：`src/__tests__/toolbar-wiring.regression.test.ts`

回归目标：

- 在“多层 slot-wrapper + slot/footer 噪声 + `import-form`/`team-code-qr-actions` 假锚点”并存时，导入弹窗仍唯一命中 `import-form + dialog-footer` 结构锚点。
- 在 `teamCode` 来源下，仅真实二维码动作块（含 `选择二维码图片` 按钮 + `accept="image/*"` input）归属导入弹窗作用域，假锚点不误命中。
- 在 nested noise matrix 多轮“打开/切换来源/关闭/重开（含关闭后污染态）”循环中，`openImportDialog + json/teamCode/qr` 三路径命令计数持续对齐。

## Task 43 落地（Toolbar 导入模板局部不变量：footer 分支互斥与唯一绑定再收紧）

增强：`src/__tests__/toolbar-architecture.guard.test.ts`

回归目标：

- 锁定 `import-form`、`v-model="importSource"`、`v-model="teamCodeInput"` 在全模板与导入弹窗局部模板中均保持唯一，且局部绑定继续归属导入表单。
- 锁定 `json/teamCode` 来源选项在导入弹窗局部模板内唯一且完整，不引入额外来源分支。
- 锁定 footer 行为按钮严格互斥且相邻结构不漂移：`triggerJsonFileImport` 按钮保持 `v-if` 唯一，`handleTeamCodeImport` 按钮保持 `v-else` 唯一且不存在 `v-else-if`。
- 锁定 `team-code-qr-actions` 与二维码 input 接线继续保持 `ref="teamCodeQrInputRef" + @change="handleTeamCodeQrImport" + accept="image/*"`，并持续守卫 `Toolbar.vue` 仅接线层边界。

## Task 44 落地（ImportExport 阈值前 flush 变体矩阵（二次）+ 批次隔离）

增强：`src/__tests__/useToolbarImportExportCommands.test.ts`

回归目标：

- 在三组以上交错变体中，首批统一推进到 `99ms` 并执行 `runOnlyPendingTimers`，持续锁定 `preview/export` 计数与 `updateTab` 计数无漂移。
- 每组首批 flush 后触发新批次，并按 `99ms -> 1ms -> 1899ms -> 1ms` 分段推进，持续验证 `updateTab/preview/export` 计数稳定且无提前触发。
- 在每次 flush 后、每组批次收束后、全流程结束后都断言 `vi.getTimerCount() === 0`，确保批次隔离下无幽灵定时器残留。

## Task 45 落地（Toolbar 导入弹窗结构锚点：文案漂移 + 假命令噪声矩阵）

增强：`src/__tests__/toolbar-wiring.regression.test.ts`

回归目标：

- 在非导入弹窗注入同文案假按钮（`选择 JSON 文件` / `导入阵容码` / `选择二维码图片`）以及假 `import-form`/`team-code-qr-actions` 锚点时，导入弹窗作用域仍唯一命中真实 `import-form + dialog-footer` 结构锚点。
- 在 `teamCode` 来源下，真实二维码动作块继续仅归属导入弹窗作用域，带同文案与同 `accept="image/*"` 的假 actions 不被误归属。
- 在 label-drift fake-command 噪声矩阵的多轮“打开/切换来源/关闭/重开（含关闭后污染态）”循环中，`openImportDialog + json/teamCode/qr` 三路径命令计数持续对齐。
