# Refactory Session Log

Purpose:

1. Keep cross-session continuity for refactor work.
2. Ensure different Codex conversations follow the same execution standard.
3. Provide a quick resume point for new sessions.

---

## Entry Template

Copy this block and append at the top for each new refactor session.

```md
## [YYYY-MM-DD] Session N - <Short Goal>

- Refactory Scope:
  - Phase:
  - Task:
- In Scope Files:
  - `<path>`
- Out of Scope:
  - `<explicitly not touched>`
- Decisions:
  - `<decision 1>`
- Checks:
  - `npm test`: pass/fail/not-run
  - `npm run lint`: pass/fail/not-run
  - `npm run typecheck`: pass/fail/not-run
  - `prettier --check`: pass/fail/not-run
  - `npm run build:lib`: pass/fail/not-run
- Risks / Follow-up:
  - `<risk or blocker>`
- Next Recommended Unit:
  - `<next atomic refactor unit>`
```

---

## Log Entries

## [2026-03-03] Session 100 - Reinforce Timer Determinism Under Dual-Window Hybrid Flush and Chained Rebatch Zero-Residual Loops

- Refactory Scope:
  - Phase: Phase 2
  - Task: ImportExport 双窗口混合 flush + 链式即时 rebatch 零残留循环（`useToolbarImportExportCommands`，仅测试补强）
- In Scope Files:
  - `src/__tests__/useToolbarImportExportCommands.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增 dual-window hybrid flush + chained rebatch zero-residual loops 回归：在 5 组交错变体中，前两批均在 `99ms` 阈值前执行 `runOnlyPendingTimers`，持续锁定 `preview/export/updateTab` 计数无漂移。
  - 每组在两次 pre-threshold flush 后立即链式触发后续两批，并按 `99ms -> 1ms -> 1899ms -> 1ms` 分段推进，持续验证无提前触发。
  - 在每次 flush 后、每组批次收束后、全流程结束后均断言 `vi.getTimerCount() === 0`，强化零残留定时器清理约束。
  - 更新 `ToolbarArchitecture.md` Task 59，记录本轮双窗口混合 flush 与链式 rebatch 循环计时确定性边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 断言依赖 fake timers 与当前 `setTimeout` 调度语义；若后续导入/导出调度机制改变，需要同步调整分段窗口与计数期望。
- Next Recommended Unit:
  - Phase 2 下一原子任务：回到 `toolbar-wiring.regression`，继续补强导入弹窗结构锚点在“slot/footer + class 漂移 + 分支顺序漂移 + 同文案同属性假动作”复合噪声下的作用域唯一命中边界（仅测试补强）。

## [2026-03-03] Session 99 - Enforce Import-Dialog Local Ownership and Slot-Footer Branch-Pair AST Invariants

- Refactory Scope:
  - Phase: Phase 2
  - Task: Toolbar 导入模板局部不变量：slot-footer 归属 + 分支互斥 + action-pair AST（`toolbar-architecture.guard`，仅测试补强）
- In Scope Files:
  - `src/__tests__/toolbar-architecture.guard.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增导入弹窗局部 AST 守卫：`import-form/importSource/teamCodeInput` 在全模板与导入弹窗局部持续唯一，并继续严格归属导入表单，不漂移到 form 外或导入弹窗外。
  - 新增 slot-footer 分支配对守卫：footer 三按钮保持“关闭 + `json(v-if)` + `teamCode(v-else)`”顺序稳定，显式禁止分支互换与 `v-else-if` 漂移。
  - 新增二维码 action/input 配对守卫：`team-code-qr-actions` 内继续锁定 `ref + @change + accept="image/*"` 唯一接线，并通过索引对比断言“配对存在但不依赖固定先后顺序”。
  - 继续通过 AST 守卫约束 `Toolbar.vue` 为接线层，不回流 `teamCodeService` 与 import/export 实现依赖，`useToolbarImportExportCommands` 入参键保持完整。
  - 更新 `ToolbarArchitecture.md` Task 58，记录本轮导入模板局部不变量与 action-pair AST 边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 局部模板守卫仍依赖当前导入弹窗模板结构与命令命名；若后续改为子组件封装或模板重排，需要同步更新局部匹配与 AST 断言。
- Next Recommended Unit:
  - Phase 2 下一原子任务：补强 `useToolbarImportExportCommands` 在“重复 pre-threshold flush + 双分段窗口 + 链式即时 rebatch”场景下的计时确定性与零残留定时器守卫（仅测试补强）。

## [2026-03-03] Session 98 - Harden Import-Dialog Anchoring Under Combined Slot-Footer Class-Drift and Footer-Order Fake-Action Noise Matrix

- Refactory Scope:
  - Phase: Phase 2
  - Task: Toolbar 导入弹窗结构锚点：复合漂移噪声矩阵（`toolbar-wiring.regression`，仅测试补强）
- In Scope Files:
  - `src/__tests__/toolbar-wiring.regression.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增 combined noise matrix `ElDialog` stub：在非导入弹窗同时注入假 `import-form` / 假 `dialog-footer` / 假 `team-code-qr-actions`，并叠加 slot/footer 组合漂移、class 漂移、footer 分支顺序漂移、同文案按钮、同 `accept="image/*"` 假 actions 与额外噪声按钮。
  - 在 `teamCode` 分支继续收敛“广义候选 + 作用域过滤”断言：含同 `accept="image/*"` 与同文案按钮的假 actions 不被误命中，真实二维码动作块保持导入弹窗作用域内唯一命中。
  - 新增 8 轮“打开/切换来源/关闭/重开（含关闭后污染态）”回归，持续校验 `openImportDialog + json/teamCode/qr` 三路径命令计数对齐。
  - 更新 `ToolbarArchitecture.md` Task 57，记录本轮复合漂移噪声矩阵结构锚点边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 结构锚点守卫仍依赖导入区按钮文案、`dialog-footer`/`team-code-qr-actions` class 与二维码 input 属性；后续若模板重排或文案调整，需要同步更新作用域匹配与计数断言。
- Next Recommended Unit:
  - Phase 2 下一原子任务：继续收紧 `toolbar-architecture.guard` 的导入弹窗局部模板不变量（slot-footer 归属 + 分支互斥 + action-pair AST 守卫，仅测试补强）。

## [2026-03-03] Session 97 - Reinforce Timer Determinism Under Hybrid Flush-Window Loops and Chained Rebatch Zero-Residual Isolation

- Refactory Scope:
  - Phase: Phase 2
  - Task: ImportExport 混合 flush 窗口 + 链式即时 rebatch 隔离（`useToolbarImportExportCommands`，仅测试补强）
- In Scope Files:
  - `src/__tests__/useToolbarImportExportCommands.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增 hybrid flush-window loops + chained rebatch zero-residual isolation 回归：在 4 组交错变体中，前两批均于 `99ms` 阈值前执行 `runOnlyPendingTimers`，持续锁定 `preview/export/updateTab` 计数无漂移。
  - 每组在两次 flush 后继续链式触发后续批次（至少两次 rebatch），并对后续批次按 `99ms -> 1ms -> 1899ms -> 1ms` 分段推进，显式验证无提前触发。
  - 在每次 flush 后、每组批次收束后、全流程结束后均断言 `vi.getTimerCount() === 0`，强化零残留定时器清理约束。
  - 更新 `ToolbarArchitecture.md` Task 56，记录本轮混合 flush 窗口与链式 rebatch 计时确定性边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 断言依赖 fake timers 与当前 `setTimeout` 调度语义；若后续导入/导出调度机制改变，需要同步调整分段窗口与计数期望。
- Next Recommended Unit:
  - Phase 2 下一原子任务：回到 `toolbar-wiring.regression`，继续补强导入弹窗结构锚点在“slot/footer 组合漂移 + 同文案同属性假动作”噪声矩阵下的作用域唯一命中与计数对齐守卫（仅测试补强）。

## [2026-03-03] Session 96 - Enforce Import-Dialog Slot-Footer Ownership and Action-Pair AST Guards

- Refactory Scope:
  - Phase: Phase 2
  - Task: Toolbar 导入模板局部不变量：slot-footer 归属 + 分支顺序互斥 + 接线配对 AST 守卫（`toolbar-architecture.guard`，仅测试补强）
- In Scope Files:
  - `src/__tests__/toolbar-architecture.guard.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增导入弹窗局部守卫：`import-form/importSource/teamCodeInput` 在全模板与导入弹窗局部保持唯一，且 `importSource/teamCodeInput` 绑定继续严格归属导入表单，不漂移到 form 外或导入弹窗外。
  - 新增 footer 顺序互斥守卫：关闭按钮 + `json(v-if)` + `teamCode(v-else)` 三按钮顺序固定，显式禁止分支互换与 `v-else-if` 漂移。
  - 新增二维码 action-pair 守卫：`team-code-qr-actions` 保持唯一，继续锁定 `ref + @change + accept="image/*"`，并额外约束“按钮/输入配对存在但不依赖固定先后顺序”。
  - 继续通过 AST 守卫确认 `Toolbar.vue` 仅接线层，不回流 `teamCodeService` 与 import/export 实现依赖，`useToolbarImportExportCommands` 入参键保持完整。
  - 更新 `ToolbarArchitecture.md` Task 55，记录本轮 slot-footer ownership 与 action-pair AST 守卫边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 局部模板守卫仍依赖当前导入弹窗模板结构与命令命名；若后续改为子组件封装或模板重排，需要同步更新局部匹配与 AST 断言。
- Next Recommended Unit:
  - Phase 2 下一原子任务：补强 `useToolbarImportExportCommands` 在“重复 pre-threshold flush + 分段窗口 + 链式即时 rebatch”场景下的计时确定性与零残留定时器守卫（仅测试补强）。

## [2026-03-03] Session 95 - Harden Import-Dialog Anchoring Under Slot-Footer Drift and Same-Attr Fake-Action Noise Matrix

- Refactory Scope:
  - Phase: Phase 2
  - Task: Toolbar 导入弹窗结构锚点：slot/footer 组合漂移 + 同文案同属性假动作块噪声（`toolbar-wiring.regression`，仅测试补强）
- In Scope Files:
  - `src/__tests__/toolbar-wiring.regression.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增 slot-footer drift same-attr fake-action noise matrix `ElDialog` stub：在非导入弹窗注入同文案假按钮（`选择 JSON 文件` / `导入阵容码` / `选择二维码图片`）、假 `import-form` / 假 `team-code-qr-actions`（含 `accept="image/*"`）与额外噪声按钮，并叠加 slot/footer 组合漂移。
  - 在 `teamCode` 分支继续收紧“广义候选 + 作用域收敛”断言：含同 `accept="image/*"` 的假 actions 不被误命中，真实二维码动作块仍仅归属导入弹窗作用域。
  - 新增 7 轮“打开/切换来源/关闭/重开（含关闭后污染态）”回归，持续校验 `openImportDialog + json/teamCode/qr` 三路径命令计数对齐。
  - 更新 `ToolbarArchitecture.md` Task 54，记录本轮 slot/footer 组合漂移 + 同属性假动作噪声矩阵边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 结构锚点守卫仍依赖导入区按钮文案与二维码 input 属性；若后续模板文案或结构重排，需要同步更新作用域匹配和计数断言。
- Next Recommended Unit:
  - Phase 2 下一原子任务：继续收紧 `toolbar-architecture.guard` 的导入弹窗局部模板不变量（slot-footer 归属 + 分支顺序互斥 + action-pair AST 守卫，仅测试补强）。

## [2026-03-03] Session 94 - Reinforce Timer Determinism Under Repeated Pre-Threshold Flush and Chained Immediate Rebatch Isolation

- Refactory Scope:
  - Phase: Phase 2
  - Task: ImportExport 重复 pre-threshold flush + 链式即时 rebatch 隔离（`useToolbarImportExportCommands`，仅测试补强）
- In Scope Files:
  - `src/__tests__/useToolbarImportExportCommands.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增 repeated pre-threshold flush + chained immediate rebatch isolation 回归：在 4 组交错变体中，前两批均于 `99ms` 阈值前执行 `runOnlyPendingTimers`，持续锁定 `preview/export/updateTab` 计数无漂移。
  - 将“每次 flush 后立即触发新批次”链式化执行（至少两次 rebatch）：首批 flush 后立刻进入第二批 flush，再进入分段推进批次，验证批次隔离稳定。
  - 对后续批次按 `99ms -> 1ms -> 1899ms -> 1ms` 分段推进，显式验证无提前触发（`1ms` 前 export 不触发，`1899ms` 后仍不提前）。
  - 在每次 flush 后、每组批次收束后、全流程结束后均断言 `vi.getTimerCount() === 0`，强化零残留定时器清理约束。
  - 更新 `ToolbarArchitecture.md` Task 53，记录本轮重复 pre-threshold flush 与链式 rebatch 隔离确定性边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 断言依赖 fake timers 与当前 `setTimeout` 调度语义；若后续导入/导出调度机制改变，需要同步调整分段窗口与计数期望。
- Next Recommended Unit:
  - Phase 2 下一原子任务：回到 `toolbar-wiring.regression`，继续补强导入弹窗结构锚点在“slot/footer 组合漂移 + 假动作块同文案/同属性”噪声下的作用域唯一命中与计数对齐守卫（仅测试补强）。

## [2026-03-03] Session 93 - Enforce Import-Dialog Footer-Order and Local-Form Ownership AST Guards

- Refactory Scope:
  - Phase: Phase 2
  - Task: Toolbar 导入模板局部不变量：表单归属 + footer 顺序与互斥 AST 守卫（`toolbar-architecture.guard`，仅测试补强）
- In Scope Files:
  - `src/__tests__/toolbar-architecture.guard.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增导入弹窗局部 ownership 守卫：`import-form/importSource/teamCodeInput` 在全模板与导入弹窗局部保持唯一，且绑定严格归属导入表单（不漂移到 form 外/弹窗外）。
  - 新增 footer 顺序互斥守卫：关闭按钮 + `json(v-if)` + `teamCode(v-else)` 三按钮顺序固定，显式禁止 `v-else-if` 与分支互换。
  - 新增二维码接线唯一守卫：`team-code-qr-actions` 唯一，二维码 input 继续保持 `ref + @change + accept="image/*"`，并断言导入弹窗外不存在 `teamCodeQrInputRef/handleTeamCodeQrImport/triggerTeamCodeQrImport` 接线。
  - 新增 AST 边界守卫：`Toolbar.vue` 继续仅为接线层，不回流 `teamCodeService` 与 import/export 实现依赖，`useToolbarImportExportCommands` 入参键保持完整。
  - 对断言误伤做收敛：移除对全模板通用 `accept="image/*"` 的否定约束，改为只校验 teamCode 二维码专属接线，避免干扰素材上传输入。
  - 更新 `ToolbarArchitecture.md` Task 52，记录本轮局部模板不变量与 AST 守卫边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 局部模板守卫仍依赖当前导入弹窗模板结构；若后续改为子组件封装或模板重排，需要同步更新局部匹配与 AST 断言。
- Next Recommended Unit:
  - Phase 2 下一原子任务：补强 `useToolbarImportExportCommands` 在“重复 pre-threshold flush + 链式即时 rebatch”场景下的计时确定性与零残留定时器守卫。

## [2026-03-03] Session 92 - Harden Import-Dialog Anchoring Under Footer-Order Drift and Same-Class Fake-Anchor Noise Matrix

- Refactory Scope:
  - Phase: Phase 2
  - Task: Toolbar 导入弹窗结构锚点：footer 分支顺序漂移 + 同 class 假锚点组合噪声（`toolbar-wiring.regression`，仅测试补强）
- In Scope Files:
  - `src/__tests__/toolbar-wiring.regression.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增 footer-order-drift same-class fake-anchor noise matrix `ElDialog` stub：在非导入弹窗注入同 class 假锚点（`import-form` / `dialog-footer` / `team-code-qr-actions`）与同文案假按钮（`选择 JSON 文件` / `导入阵容码` / `选择二维码图片`），并叠加额外噪声按钮。
  - 新增 footer 顺序漂移断言：假 footer 内动作按钮顺序显式与真实导入弹窗分支顺序不同，仍只允许真实导入弹窗结构锚点唯一命中。
  - 在 `teamCode` 分支继续校验“广义候选 + 作用域收敛”：含 `accept="image/*"` 的假 actions 不被误命中，真实二维码动作块仅归属导入弹窗作用域。
  - 新增 6 轮“打开/切换来源/关闭/重开（含关闭后污染态）”回归，持续校验 `openImportDialog + json/teamCode/qr` 三路径命令计数对齐。
  - 更新 `ToolbarArchitecture.md` Task 51，记录本轮 footer-order drift + same-class fake-anchor 噪声矩阵边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 结构锚点守卫仍依赖导入区按钮文本与二维码 input 属性；若后续模板文案或按钮结构重排，需要同步更新定位条件与计数断言。
- Next Recommended Unit:
  - Phase 2 下一原子任务：继续收紧 `toolbar-architecture.guard` 的导入弹窗局部模板不变量（表单归属 + footer 顺序与互斥 AST 守卫，含二维码接线唯一性）。

## [2026-03-03] Session 91 - Reinforce Timer Determinism Under Alternating Pre-Threshold Flush Loops and Immediate Rebatch Isolation

- Refactory Scope:
  - Phase: Phase 2
  - Task: ImportExport 重复阈值前 flush 循环 + 即时新批次隔离（`useToolbarImportExportCommands`，仅测试补强）
- In Scope Files:
  - `src/__tests__/useToolbarImportExportCommands.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增 alternating pre-threshold flush loops + immediate rebatch isolation 回归：4 组交错矩阵中，前两批均在 `99ms` 阈值前执行 `runOnlyPendingTimers`，持续锁定 `preview/export/updateTab` 计数无漂移。
  - 在每组前两批 flush 后立即触发新批次，并按 `99ms -> 1ms -> 1899ms -> 1ms` 分段推进，验证 `preview/export` 无提前触发且批次隔离稳定。
  - 在每次 flush 后、每组批次收束后、全流程结束后重复断言 `vi.getTimerCount() === 0`，确保无幽灵定时器残留。
  - 更新 `ToolbarArchitecture.md` Task 50，记录本轮 alternating pre-threshold flush loops 与即时 rebatch 隔离确定性边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 断言依赖 fake timers 与当前 `setTimeout` 调度模型；若后续导入/导出调度策略调整，需要同步更新分段窗口与计数期望。
- Next Recommended Unit:
  - Phase 2 下一原子任务：回到 `toolbar-wiring.regression`，继续补强导入弹窗结构锚点在“footer 分支顺序漂移 + 同 class 假锚点”组合噪声下的作用域唯一命中与计数对齐守卫（仅测试补强）。

## [2026-03-03] Session 90 - Enforce Import-Dialog Local-Template Ownership and Footer Adjacency AST Guards

- Refactory Scope:
  - Phase: Phase 2
  - Task: Toolbar 导入模板局部不变量：表单归属 + footer 相邻互斥 AST 守卫（`toolbar-architecture.guard`，仅测试补强）
- In Scope Files:
  - `src/__tests__/toolbar-architecture.guard.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增导入弹窗局部模板归属守卫：`import-form/importSource/teamCodeInput` 在全模板与导入弹窗局部保持唯一，且绑定仅归属导入表单（不漂移到 form 外或导入弹窗外）。
  - 新增 footer 相邻互斥守卫：关闭按钮 + `json(v-if)` + `teamCode(v-else)` 三按钮顺序保持稳定，显式禁止 `v-else-if` 漂移。
  - 新增二维码接线唯一守卫：`team-code-qr-actions` 唯一，二维码 input 继续保持 `ref + @change + accept="image/*"` 接线不变量。
  - 继续通过 AST 断言锁定 `Toolbar.vue` 为接线层，不回流 `teamCodeService` 与 import/export 实现依赖，并保持 `useToolbarImportExportCommands` 入参键完整。
  - 更新 `ToolbarArchitecture.md` Task 49，记录本轮局部模板不变量与 AST 守卫边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 模板守卫依赖当前导入弹窗结构与按钮顺序；若后续改为子组件封装或模板重排，需要同步更新局部匹配规则与 AST 断言。
- Next Recommended Unit:
  - Phase 2 下一原子任务：补强 `useToolbarImportExportCommands` 在“重复 pre-threshold flush + 即时新批次隔离”场景下的计时确定性与零残留定时器守卫。

## [2026-03-03] Session 89 - Harden Import-Dialog Anchoring Under Command-Order and Class-Drift Noise Matrix

- Refactory Scope:
  - Phase: Phase 2
  - Task: Toolbar 导入弹窗结构锚点：命令顺序漂移 + class 漂移噪声矩阵（`toolbar-wiring.regression`，仅测试补强）
- In Scope Files:
  - `src/__tests__/toolbar-wiring.regression.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增 command-order + class-drift noise matrix `ElDialog` stub：在非导入弹窗注入同 class 假结构（`import-form` / `dialog-footer` / `team-code-qr-actions`）与同文案假按钮（`选择 JSON 文件` / `导入阵容码` / `选择二维码图片`），并叠加额外噪声按钮与命令顺序漂移。
  - 在 `teamCode` 分支增加“广义候选 + 作用域收敛”断言：同 `accept="image/*"` 的假 `team-code-qr-actions` 不被误命中，真实二维码动作块继续仅归属导入弹窗作用域。
  - 新增 5 轮“打开/切换来源/关闭/重开（含关闭后污染态）”回归，持续校验 `openImportDialog + json/teamCode/qr` 三路径命令计数无漂移。
  - 更新 `ToolbarArchitecture.md` Task 48，记录本轮 command-order/class-drift 噪声矩阵结构锚点边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 结构锚点守卫仍依赖导入区按钮文本与二维码 input 属性；若后续模板文案或按钮结构重排，需要同步更新定位条件与计数断言。
- Next Recommended Unit:
  - Phase 2 下一原子任务：继续收紧 `toolbar-architecture.guard` 的导入弹窗局部模板不变量（表单归属 + footer 相邻互斥 AST 守卫，含二维码接线唯一性）。

## [2026-03-03] Session 88 - Extend Timer Determinism with Repeated Pre-Threshold Flush Loops and Multi-Rebatch Isolation

- Refactory Scope:
  - Phase: Phase 2
  - Task: ImportExport 阈值前 flush 变体矩阵（三次）+ 批次隔离补强（`useToolbarImportExportCommands`，仅测试补强）
- In Scope Files:
  - `src/__tests__/useToolbarImportExportCommands.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增 repeated pre-threshold flush loops 回归：每组执行两轮 `99ms` 阈值前 `runOnlyPendingTimers`，持续锁定 `preview/export/updateTab` 计数无漂移。
  - 在每组前两批 pre-threshold flush 收束后继续触发第三批，并按 `99ms -> 1ms -> 1899ms -> 1ms` 分段推进，验证无提前触发且批次隔离稳定。
  - 在每次 flush 后、每组批次收束后、全流程结束后重复断言 `vi.getTimerCount() === 0`，确保无幽灵定时器残留。
  - 更新 `ToolbarArchitecture.md` Task 47，记录本轮 repeated pre-threshold flush loops 与多批次隔离确定性边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 断言依赖 fake timers 与 `setTimeout` 调度语义；若后续导入/导出调度机制改变，需同步调整窗口分段与计数期望。
- Next Recommended Unit:
  - Phase 2 下一原子任务：继续补强 `toolbar-wiring.regression` 与 `toolbar-architecture.guard` 的导入弹窗结构噪声与局部模板守卫联动回归（仅测试补强，不改语义）。

## [2026-03-03] Session 87 - Tighten Import-Dialog Local-Template Adjacency and Unique Wiring AST Guards

- Refactory Scope:
  - Phase: Phase 2
  - Task: Toolbar 导入模板局部不变量：结构相邻性 + 接线唯一性 AST 守卫补强（`toolbar-architecture.guard`，仅测试补强）
- In Scope Files:
  - `src/__tests__/toolbar-architecture.guard.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增导入弹窗局部模板相邻性守卫：footer 三按钮保持关闭 + `json(v-if)` + `teamCode(v-else)` 相邻互斥结构，显式禁止 `v-else-if` 漂移。
  - 新增局部绑定归属守卫：`import-form` / `importSource` / `teamCodeInput` 在全模板与导入弹窗局部保持唯一，且绑定不漂移到导入表单结构外。
  - 新增二维码接线唯一守卫：`team-code-qr-actions` 块唯一，并锁定二维码 input 继续保持 `ref + @change + accept="image/*"` 接线。
  - 新增 AST 边界守卫：`useToolbarImportExportCommands` 调用参数键继续完整，`Toolbar.vue` 不回流 `teamCodeService` 与 import/export 实现依赖。
  - 更新 `ToolbarArchitecture.md` Task 46，记录本轮导入模板局部不变量与接线唯一性 AST 边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 守卫依赖当前导入 footer 模板顺序与按钮分支表达式；若后续改为子组件封装或模板重排，需要同步更新结构匹配与 AST 断言。
- Next Recommended Unit:
  - Phase 2 下一原子任务：补强 `useToolbarImportExportCommands` 在“重复 pre-threshold flush + 多批次隔离”下的计时确定性（仅测试补强，不改语义）。

## [2026-03-03] Session 86 - Reinforce Import-Dialog Anchoring Under Label-Drift and Fake-Command Noise Matrix

- Refactory Scope:
  - Phase: Phase 2
  - Task: Toolbar 导入弹窗结构锚点：文案漂移 + 假命令噪声矩阵补强（`toolbar-wiring.regression`，仅测试补强）
- In Scope Files:
  - `src/__tests__/toolbar-wiring.regression.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增 label-drift fake-command noise matrix `ElDialog` stub：在非导入弹窗注入同文案假按钮（`选择 JSON 文件`/`导入阵容码`/`选择二维码图片`）与假 `import-form`/`team-code-qr-actions` 锚点。
  - 新增多轮“打开/切换来源/关闭/重开（含关闭后污染态）”回归，持续校验 `openImportDialog + json/teamCode/qr` 三路径命令计数对齐。
  - 在 `teamCode` 分支增加“同文案 + 同 `accept="image/*"`”广义候选校验，锁定真实二维码 actions 仅归属导入弹窗作用域，假 actions 不误归属。
  - 更新 `ToolbarArchitecture.md` Task 45，记录本轮 label-drift + fake-command 噪声矩阵作用域守卫边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 结构锚点守卫仍依赖导入 footer 按钮顺序与文案；若后续模板改为子组件封装或文案迁移，需要同步更新作用域匹配断言。
- Next Recommended Unit:
  - Phase 2 下一原子任务：继续收紧 `toolbar-architecture.guard` 的导入弹窗局部不变量（结构相邻性 + 接线唯一性 AST 守卫）。

## [2026-03-03] Session 85 - Harden Timer Determinism Across Repeated Pre-Threshold Flush Matrices and Rebatch Isolation

- Refactory Scope:
  - Phase: Phase 2
  - Task: ImportExport 阈值前 flush 变体矩阵（二次）+ 批次隔离补强（`useToolbarImportExportCommands`，仅测试补强）
- In Scope Files:
  - `src/__tests__/useToolbarImportExportCommands.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增 repeated pre-threshold flush 变体矩阵回归：3 组交错变体在 `99ms` 阈值前执行 `runOnlyPendingTimers`，持续锁定 `preview/export` 与 `updateTab` 计数无漂移。
  - 在每组首批 flush 后触发新批次，并按 `99ms -> 1ms -> 1899ms -> 1ms` 分段推进，持续验证 `updateTab/preview/export` 计数稳定且无提前触发。
  - 在每次 flush 后、每组批次收束后、全流程结束后重复断言 `vi.getTimerCount() === 0`，确保不存在幽灵定时器并维持批次隔离确定性。
  - 更新 `ToolbarArchitecture.md` Task 44，记录本轮 repeated pre-threshold flush matrix 与 rebatch 隔离边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 断言依赖 fake timers 与当前 `setTimeout` 宏任务调度模型；若后续调度机制变更，需要同步调整分段窗口与计数期望。
- Next Recommended Unit:
  - Phase 2 下一原子任务：继续在 `toolbar-wiring.regression` 与 `toolbar-architecture.guard` 补强导入弹窗局部结构噪声变体守卫（仅测试补强，不改语义）。

## [2026-03-03] Session 84 - Tighten Import-Dialog Footer Branch Exclusivity and Local Binding Uniqueness

- Refactory Scope:
  - Phase: Phase 2
  - Task: Toolbar 导入模板局部不变量：footer 分支互斥与唯一绑定再收紧（`toolbar-architecture.guard`，仅测试补强）
- In Scope Files:
  - `src/__tests__/toolbar-architecture.guard.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增导入弹窗局部守卫：`import-form`、`v-model="importSource"`、`v-model="teamCodeInput"` 在全模板与导入弹窗局部均保持唯一，且局部绑定继续归属导入表单结构。
  - 新增来源选项完整性守卫：导入弹窗局部来源选项维持 `json/teamCode` 唯一且完整，不允许新增分支漂移。
  - 新增 footer 分支互斥强化守卫：`triggerJsonFileImport` 的 `v-if` 与 `handleTeamCodeImport` 的 `v-else` 继续唯一、相邻，且显式禁止 `v-else-if` 回流。
  - 持续锁定二维码接线同域不变量：`team-code-qr-actions` 继续唯一，二维码 input 仍保留 `ref + @change + accept="image/*"`，并保持 `Toolbar.vue` 接线层依赖边界。
  - 更新 `ToolbarArchitecture.md` Task 43，记录本轮导入模板局部不变量收紧边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 局部模板守卫依赖当前导入 footer 按钮顺序与模板结构；若后续改为子组件封装或模板重排，需要同步更新结构匹配断言。
- Next Recommended Unit:
  - Phase 2 下一原子任务：补强 `useToolbarImportExportCommands` 在“多变体阈值前 flush + 新批次隔离”下的计时确定性与零残留定时器守卫。

## [2026-03-03] Session 83 - Strengthen Import-Dialog Scope Anchoring Under Nested Slot-Footer Noise Matrix

- Refactory Scope:
  - Phase: Phase 2
  - Task: Toolbar 导入弹窗结构锚点：嵌套 slot-wrapper + slot/footer 混合噪声矩阵回归补强（`toolbar-wiring.regression`，仅测试补强）
- In Scope Files:
  - `src/__tests__/toolbar-wiring.regression.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增 nested slot-footer 噪声矩阵 `ElDialog` stub：在非导入弹窗同时注入多层 slot-wrapper、`slot/footer` 噪声和 `import-form`/`team-code-qr-actions` 假锚点节点。
  - 将 `teamCode` 分支二维码动作块判定收紧为“`选择二维码图片` 按钮 + `accept="image/*"` input”联合条件，确保真假锚点共存时仅命中真实导入弹窗作用域。
  - 新增 5 轮“打开/切换来源/关闭/重开（含关闭后污染态）”回归，持续校验 `openImportDialog + json/teamCode/qr` 三路径计数无漂移。
  - 更新 `ToolbarArchitecture.md` Task 42，记录本轮 nested slot-footer noise matrix 结构锚点边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 结构锚点守卫仍依赖导入区按钮文本与二维码 input 属性；若后续模板文案或输入属性迁移，需要同步更新作用域识别条件。
- Next Recommended Unit:
  - Phase 2 下一原子任务：收紧 `toolbar-architecture.guard` 的导入弹窗局部模板不变量（footer 分支互斥与局部唯一绑定）。

## [2026-03-03] Session 82 - Reinforce Timer Determinism Across Pre-Threshold Flush Matrix and Rebatch Isolation

- Refactory Scope:
  - Phase: Phase 2
  - Task: ImportExport 阈值前 flush 变体矩阵 + 批次隔离确定性补强（`useToolbarImportExportCommands`，仅测试补强）
- In Scope Files:
  - `src/__tests__/useToolbarImportExportCommands.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增“阈值前 flush 变体矩阵”回归：两组交错触发变体均在 `99ms` 阈值前执行 `runOnlyPendingTimers`，锁定 `preview/export` 计数与 `updateTab` 计数无漂移。
  - 在每个变体首批 flush 后立即触发新批次，并按 `99ms -> 1ms -> 1899ms -> 1ms` 分段推进，持续校验 `preview/export` 延迟计数稳定且无提前触发。
  - 在每次 flush 收束后、每次批次收尾后以及全流程收束后均断言 `vi.getTimerCount() === 0`，确保无幽灵定时器残留并维持批次隔离确定性。
  - 更新 `ToolbarArchitecture.md` Task 41，记录本轮 pre-threshold flush 变体矩阵与 rebatch 隔离边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 断言依赖 fake timers 与当前 `setTimeout` 调度语义；若后续导入/导出调度机制迁移，需要同步调整窗口分段与计数期望。
- Next Recommended Unit:
  - Phase 2 下一原子任务：继续在 `toolbar-wiring.regression`/`toolbar-architecture.guard` 补强导入弹窗局部结构锚点与分支边界变体守卫（仅测试补强，不改语义）。

## [2026-03-03] Session 81 - Tighten Import-Dialog Local Template Exclusivity and Branch Invariants

- Refactory Scope:
  - Phase: Phase 2
  - Task: Toolbar 导入模板局部结构不变量：分支互斥与局部唯一性（`toolbar-architecture.guard`，仅测试补强）
- In Scope Files:
  - `src/__tests__/toolbar-architecture.guard.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增导入弹窗局部模板不变量守卫：`import-form`、`v-model="importSource"`、`v-model="teamCodeInput"` 在全模板与导入弹窗局部均保持唯一。
  - 新增来源选项完整性守卫：导入弹窗局部模板仅保留 `json/teamCode` 两个来源选项，且各自唯一。
  - 新增 footer 分支互斥守卫：`triggerJsonFileImport` 按钮保持 `v-if` 唯一，`handleTeamCodeImport` 按钮保持 `v-else` 唯一，并锁定相邻互斥结构不回退。
  - 持续收紧二维码接线同域守卫：`team-code-qr-actions` 唯一，二维码 input 继续保持 `ref="teamCodeQrInputRef" + @change="handleTeamCodeQrImport" + accept="image/*"`；`Toolbar.vue` script 继续仅接线层不回流实现依赖。
  - 更新 `ToolbarArchitecture.md` Task 40，记录本轮导入模板局部唯一性与互斥分支边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 局部模板互斥守卫依赖当前 `v-if/v-else` 结构与模板顺序；若后续改为条件组件封装，需要同步更新结构正则断言。
- Next Recommended Unit:
  - Phase 2 下一原子任务：补强 `useToolbarImportExportCommands` 在“阈值前 flush 变体矩阵 + 新批次隔离”下的计时确定性与零残留定时器守卫（仅测试补强，不改语义）。

## [2026-03-03] Session 80 - Harden Import-Dialog Anchoring Against Slot-Wrapper Structural-Noise Variants

- Refactory Scope:
  - Phase: Phase 2
  - Task: Toolbar 导入弹窗结构锚点 slot-wrapper 混合噪声回归补强（`toolbar-wiring.regression`，仅测试补强）
- In Scope Files:
  - `src/__tests__/toolbar-wiring.regression.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增 `slot-wrapper` 结构噪声 `ElDialog` stub 变体：在非导入弹窗同时注入多层 footer 噪声、`import-form` 假锚点与 QR actions 噪声节点，覆盖 slot-wrapper 混合噪声场景。
  - 将导入弹窗作用域定位 helper 收敛为“`import-form + dialog-footer` 结构锚点 + 导入分支按钮文本”联合判定，避免被 slot-wrapper 假锚点误命中。
  - 新增多轮“打开/切换来源/关闭/重开”回归（4 轮），持续校验 `openImportDialog + json/teamCode/qr` 三路径计数对齐，并断言真实 `team-code-qr-actions` 仅归属导入弹窗作用域。
  - 更新 `ToolbarArchitecture.md` Task 39，记录本轮 slot-wrapper mixed-noise 结构锚点边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 结构锚点守卫仍依赖当前导入 footer 按钮文案与 class 组合；若后续模板文案或 class 迁移，需要同步更新作用域匹配断言。
- Next Recommended Unit:
  - Phase 2 下一原子任务：继续补强 `toolbar-architecture.guard` 的导入弹窗局部模板互斥与局部唯一性守卫（仅测试补强，不改语义）。

## [2026-03-03] Session 79 - Reinforce Timer Determinism Under Pre-Threshold Flush and Rebatch Isolation

- Refactory Scope:
  - Phase: Phase 2
  - Task: ImportExport 阈值前 flush + 重批次隔离确定性补强（`useToolbarImportExportCommands`，仅测试补强）
- In Scope Files:
  - `src/__tests__/useToolbarImportExportCommands.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增“阈值前 flush”回归：首批交错触发后仅推进 `99ms`，随后执行 `runOnlyPendingTimers`，验证 `preview/export` 计数在局部 flush 收束后不漂移。
  - 在首批次 flush 后触发新批次，按 `99ms -> 1ms -> 1899ms -> 1ms` 分段推进，持续锁定 `updateTab` 即时计数、`preview/export` 延时计数稳定且无提前触发。
  - 在局部 flush 后和批次收尾后分别补充 `vi.getTimerCount() === 0` 清理断言，确保无幽灵定时器残留。
  - 更新 `ToolbarArchitecture.md` Task 38，记录本轮 pre-threshold flush + rebatch 隔离确定性边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 定时守卫依赖 fake timers 与当前 `setTimeout` 宏任务调度语义；若后续迁移到其他调度机制，需要同步调整分段窗口与计数断言。
- Next Recommended Unit:
  - Phase 2 下一原子任务：继续补强 `toolbar-wiring.regression` / `toolbar-architecture.guard` 的导入弹窗结构变体守卫（仅测试补强，不改语义）。

## [2026-03-03] Session 78 - Tighten Import-Dialog Local Template Invariants in Toolbar Architecture Guard

- Refactory Scope:
  - Phase: Phase 2
  - Task: Toolbar 导入模板局部结构不变量再收紧（`toolbar-architecture.guard`，仅测试补强）
- In Scope Files:
  - `src/__tests__/toolbar-architecture.guard.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增“导入弹窗局部模板”守卫：`import-form` 锚点与 `v-model="importSource"` 绑定在全模板与导入弹窗局部模板内均保持唯一。
  - 将来源选项收紧为导入表单局部结构断言：`json/teamCode` 两项完整且唯一，避免来源分支漂移。
  - 新增 `team-code-qr-actions` 同域守卫：二维码按钮与二维码 input（`ref="teamCodeQrInputRef" + @change="handleTeamCodeQrImport" + accept="image/*"`）继续位于同一局部结构块。
  - 补充接线层边界守卫：`Toolbar.vue` script 继续不导入 `teamCodeService`，且不回流 import/export 实现细节调用。
  - 更新 `ToolbarArchitecture.md` Task 37，记录本轮导入模板局部不变量边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 局部模板守卫依赖当前 `Toolbar.vue` 模板组织与标签属性命名；若后续改为子组件封装或模板重排，需要同步更新局部提取正则与断言。
- Next Recommended Unit:
  - Phase 2 下一原子任务：在 `useToolbarImportExportCommands` 补强“阈值前 flush + 新批次”定时确定性与零残留定时器守卫。

## [2026-03-03] Session 77 - Harden Import-Dialog Scope Anchoring Against Mixed Structural-Noise Variants

- Refactory Scope:
  - Phase: Phase 2
  - Task: Toolbar 导入弹窗结构锚点混合噪声回归补强（`toolbar-wiring.regression`，仅测试补强）
- In Scope Files:
  - `src/__tests__/toolbar-wiring.regression.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 在 `ElDialog` 测试 stub 新增 mixed-structural-noise 变体：为非导入弹窗同时注入多个 `dialog-footer` 噪声与额外结构噪声节点（`dialog-structure-noise` / `import-form-noise` / `team-code-qr-actions-noise`）。
  - 新增回归用例，验证导入弹窗在混合噪声下仍唯一命中 `import-form + dialog-footer` 结构锚点。
  - 在 `teamCode` 分支下增加噪声隔离断言：真实 `team-code-qr-actions` 继续全局唯一且仅位于导入弹窗作用域内，噪声节点不会被误归属。
  - 在 mixed-noise 多轮“打开/切换来源/关闭/重开”循环中继续校验 `openImportDialog + json/teamCode/qr` 三路径命令计数持续对齐。
  - 更新 `ToolbarArchitecture.md` Task 36，记录本轮 mixed structural-noise 作用域守卫边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 守卫仍依赖导入弹窗结构类名（`import-form` / `dialog-footer` / `team-code-qr-actions`）；若后续模板命名或结构迁移，需要同步更新锚点断言。
- Next Recommended Unit:
  - Phase 2 下一原子任务：在 `toolbar-architecture.guard` 继续收紧导入弹窗局部模板不变量（唯一来源绑定与二维码 input 接线细节守卫）。

## [2026-03-03] Session 76 - Reinforce Segmented Timer Cleanup Determinism with Partial-Flush Rebatching

- Refactory Scope:
  - Phase: Phase 2
  - Task: ImportExport 分段推进 + 局部 flush + 重批次确定性补强（`useToolbarImportExportCommands`，仅测试补强）
- In Scope Files:
  - `src/__tests__/useToolbarImportExportCommands.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增“中途局部 flush”回归：首批交错触发后按 `99ms -> 1ms` 分段推进，随后在导出窗口未到达前执行 `runOnlyPendingTimers`，校验预览/导出计数与定时器队列收束行为稳定。
  - 在局部 flush 后追加新批次，继续按 `99ms -> 1ms -> 1899ms -> 1ms` 分段推进，锁定 `updateTab`、`preview`、`export` 计数不漂移且无提前触发。
  - 增补批次中途与收尾的 `vi.getTimerCount() === 0` 守卫，验证不存在幽灵定时器残留。
  - 更新 `ToolbarArchitecture.md` Task 35，记录本轮 partial-flush rebatching 的确定性边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 断言依赖 fake timers 的宏任务调度模型；若后续导出/预览调度迁移到非 `setTimeout` 机制，需同步调整分段窗口与队列计数守卫。
- Next Recommended Unit:
  - Phase 2 下一原子任务：继续在 `toolbar-wiring.regression` 与 `toolbar-architecture.guard` 补强导入弹窗结构变体守卫（仅测试补强，不改语义）。

## [2026-03-03] Session 75 - Tighten Import-Template Structural Invariants in Toolbar Architecture Guard

- Refactory Scope:
  - Phase: Phase 2
  - Task: Toolbar 导入模板结构不变量守卫再收紧（`toolbar-architecture.guard`，仅测试补强）
- In Scope Files:
  - `src/__tests__/toolbar-architecture.guard.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 将导入模板守卫收敛到“导入数据”弹窗局部模板，校验 `importSource` 绑定入口唯一，并且来源选项仅保留 `json/teamCode` 两项。
  - 补充二维码 input 接线不变量守卫：`team-code-qr-actions` 唯一，且二维码 input 继续保持 `ref="teamCodeQrInputRef" + @change="handleTeamCodeQrImport" + accept="image/*"`。
  - 延续接线层边界守卫：`Toolbar.vue` script 继续不回流 `teamCodeService` 与 import/export 实现依赖。
  - 更新 `ToolbarArchitecture.md` Task 34，记录本轮模板结构不变量边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 模板守卫依赖当前导入弹窗结构与属性名；若后续改为子组件封装或属性重命名，需同步更新 guard 正则与局部块提取逻辑。
- Next Recommended Unit:
  - Phase 2 下一原子任务：补强 `useToolbarImportExportCommands` 在“分段推进 + 中途局部 flush + 新批次”场景的计时与定时器收束确定性守卫。

## [2026-03-03] Session 74 - Harden Import-Dialog Structural Anchoring Against Footer-Noise Regressions

- Refactory Scope:
  - Phase: Phase 2
  - Task: Toolbar 导入弹窗结构锚点抗噪声回归（`toolbar-wiring.regression`，仅测试补强）
- In Scope Files:
  - `src/__tests__/toolbar-wiring.regression.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 在测试 stub 中为非导入弹窗注入额外 `dialog-footer` 噪声节点，验证导入弹窗结构锚点（`import-form + dialog-footer`）在噪声场景下仍唯一命中。
  - 补充 `teamCode` 来源下的全局作用域断言：`team-code-qr-actions` 全局唯一并且仅位于导入弹窗作用域内，不串到其它弹窗 footer。
  - 新增 footer-noise + 多轮重开回归，持续校验 `openImportDialog` 与 `json/teamCode/qr` 三路径命令计数对齐，不发生漂移。
  - 更新 `ToolbarArchitecture.md` Task 33，记录本轮结构锚点抗噪声边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 抗噪声守卫依赖当前结构类名（`import-form` / `dialog-footer` / `team-code-qr-actions`）；后续模板命名调整时需同步更新选择器断言。
- Next Recommended Unit:
  - Phase 2 下一原子任务：收紧 `toolbar-architecture.guard` 的导入模板结构不变量（唯一 `importSource` 绑定、二维码输入 `ref/@change/accept` 接线、接线层边界守卫）。

## [2026-03-03] Session 73 - Strengthen Import/Export Timer Cleanup Determinism Across Segmented Batches

- Refactory Scope:
  - Phase: Phase 2
  - Task: ImportExport 定时窗口清理确定性补强（`useToolbarImportExportCommands`，仅测试补强）
- In Scope Files:
  - `src/__tests__/useToolbarImportExportCommands.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 在分段窗口回归（`99ms -> 1ms -> 1899ms -> 1ms`）中增加 `vi.getTimerCount()` 断言，锁定交错触发后定时队列在每个窗口的剩余数与预览/导出计数严格一致。
  - 在“中途 `runOnlyPendingTimers` 后触发新批次”回归中补充定时队列断言，验证首批收束后无残留，新批次在同分段窗口下计数不漂移。
  - 新增批次收尾 `runOnlyPendingTimers + getTimerCount() === 0` 守卫，确保无幽灵定时器残留。
  - 保持既有失败分支语义不变，仅补确定性与清理断言，不修改 import/export 实现。
  - 更新 `ToolbarArchitecture.md` Task 32，记录本轮定时清理确定性边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 断言依赖 fake timers 的 `getTimerCount` 语义；若后续调度机制迁移到非 `setTimeout` 路径，需同步调整计时窗口与队列计数守卫。
- Next Recommended Unit:
  - Phase 2 下一原子任务：继续补强 `toolbar-wiring.regression` 与 `toolbar-architecture.guard` 的导入弹窗结构变体守卫（仅测试补强，保持语义不变）。

## [2026-03-03] Session 72 - Add Import-Dialog Wiring Parameter Invariants to Toolbar Architecture Guard

- Refactory Scope:
  - Phase: Phase 2
  - Task: Toolbar 导入接线参数不变量守卫补强（`toolbar-architecture.guard`，仅测试补强）
- In Scope Files:
  - `src/__tests__/toolbar-architecture.guard.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增 AST 守卫：`useToolbarImportExportCommands` 调用参数对象必须保留 `state/importSource/teamCodeInput/teamCodeQrInputRef` 接线键。
  - 新增 AST 守卫：`importSource` 默认初始化保持 `ref<'json' | 'teamCode'>('json')`，防止来源默认值与类型约束漂移。
  - 模板守卫补强：锁定 `importSource` 的 `json/teamCode` 分支接线与二维码入口双接线（`@click` + `@change`）继续存在。
  - 保持 `Toolbar.vue` 仅接线层，不回流 `convertTeamCodeToRootDocument` / `decodeTeamCodeFromQrImage` / 截图水印实现依赖。
  - 更新 `ToolbarArchitecture.md` Task 31，记录本轮导入接线参数不变量边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - AST 守卫依赖当前 `script setup` 结构与 `ref` 初始化写法；若后续迁移到工厂函数或重命名，需要同步更新守卫断言。
- Next Recommended Unit:
  - Phase 2 下一原子任务：补强 `useToolbarImportExportCommands` 在分段推进 + flush + 新批次下的定时清理确定性守卫（仅测试补强）。

## [2026-03-03] Session 71 - Harden Import-Dialog Structural Scope Exclusivity in Toolbar Wiring Regression

- Refactory Scope:
  - Phase: Phase 2
  - Task: Toolbar 导入弹窗结构作用域排他性回归（`toolbar-wiring.regression`，仅测试补强）
- In Scope Files:
  - `src/__tests__/toolbar-wiring.regression.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 在导入弹窗作用域 helper 中增加 `.dialog-footer` 排他性守卫：导入作用域必须唯一，且显式断言存在其它非导入 footer，防止结构定位误命中。
  - 保持结构锚点定位策略（`import-form` + `dialog-footer`），并在 `teamCode` 来源下显式校验 `team-code-qr-actions` 仍位于同一导入弹窗作用域。
  - 保持 `json/teamCode` 来源绑定可见性断言与 `openImportDialog + json/teamCode/qr` 多轮切换/重开计数对齐语义不变。
  - 更新 `ToolbarArchitecture.md` Task 30，记录本轮结构作用域排他性回归边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 排他性守卫依赖当前 `dialog-footer` 与导入弹窗结构类名；若后续模板结构变更，需要同步更新结构锚点断言。
- Next Recommended Unit:
  - Phase 2 下一原子任务：在 `toolbar-architecture.guard` 增加导入接线参数与来源分支不变量守卫（仅测试补强）。

## [2026-03-03] Session 70 - Harden Import/Export Timer Window Boundary Determinism Regression

- Refactory Scope:
  - Phase: Phase 2
  - Task: ImportExport 定时窗口边界确定性补强（`useToolbarImportExportCommands`，仅测试补强）
- In Scope Files:
  - `src/__tests__/useToolbarImportExportCommands.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增分段窗口回归：在交错触发后按 `99ms -> 1ms -> 1899ms -> 1ms` 推进 fake timers，逐段锁定 `updateTab` 即时计数、`100ms` 预览计数与 `2000ms` 导出计数无提前触发。
  - 新增“多批次交错 + 中途 flush”回归：首批次完成窗口验证后执行 `runOnlyPendingTimers`，再触发第二批交错命令并复验同一分段窗口下计数不漂移。
  - 既有失败分支语义保持不变，仅补充确定性断言，不调整 import/export 运行逻辑。
  - 更新 `ToolbarArchitecture.md` Task 29，记录本轮定时窗口边界守卫内容。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 本组断言依赖 fake timers 与 `setTimeout` 调度语义；若后续改为任务队列/节流器实现，需要同步调整时间窗口断言策略。
- Next Recommended Unit:
  - Phase 2 下一原子任务：继续在 `toolbar-wiring.regression` 与 `toolbar-architecture.guard` 间补充导入弹窗结构变体（仅测试补强，保持语义不变）。

## [2026-03-03] Session 69 - Add Import-Dialog Source-Branch Wiring Invariants to Toolbar Architecture Guard

- Refactory Scope:
  - Phase: Phase 2
  - Task: Toolbar 导入弹窗模板接线结构守卫补强（`toolbar-architecture.guard`，仅测试补强）
- In Scope Files:
  - `src/__tests__/toolbar-architecture.guard.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增模板级守卫，锁定导入来源分支接线不变量：`json` 分支保留 `v-if="importSource === 'json'" + @click="triggerJsonFileImport"`，`teamCode` 分支保留 `v-else + @click="handleTeamCodeImport"`。
  - 新增二维码入口双接线守卫：`@click="triggerTeamCodeQrImport"` 与 `@change="handleTeamCodeQrImport"` 必须同时存在，并保留 `team-code-qr-actions` 结构锚点。
  - 模板提取逻辑改为匹配外层完整 `<template>`，避免被内层 `template #footer` 提前截断造成守卫误报。
  - 保持并重申 `Toolbar.vue` script 不回流 import/export 实现依赖（`convertTeamCodeToRootDocument` / `decodeTeamCodeFromQrImage` / 截图水印实现辅助）。
  - 更新 `ToolbarArchitecture.md` Task 28，记录本轮接线结构不变量边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 模板级守卫依赖当前模板结构与属性命名；若后续切换为子组件封装或指令重命名，需要同步调整不变量断言。
- Next Recommended Unit:
  - Phase 2 下一原子任务：补强 `useToolbarImportExportCommands` 在分段推进计时窗口（99ms/1ms/1899ms/1ms）与多批次交错下的确定性回归。

## [2026-03-03] Session 68 - Decouple Import Dialog Scope Regression from Title-Based Selector

- Refactory Scope:
  - Phase: Phase 2
  - Task: Toolbar 导入弹窗作用域去标题耦合回归（`toolbar-wiring.regression`，仅测试补强）
- In Scope Files:
  - `src/__tests__/toolbar-wiring.regression.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 移除导入弹窗作用域对 `title="导入数据"` 的依赖，改为结构锚点组合定位：`import-form` + `dialog-footer`（并结合 `team-code-qr-actions` 做来源分支可见性守卫）。
  - `ElForm` stub 保留模板属性透传，确保结构锚点定位与真实模板类名对齐，避免回归断言误依赖 stub 实现细节。
  - 保持 `json/teamCode` 来源可见性断言与 `openImportDialog` + `triggerJsonFileImport` / `handleTeamCodeImport` / `triggerTeamCodeQrImport` 多轮计数对齐语义不变。
  - 更新 `ToolbarArchitecture.md` Task 27，记录本轮去标题耦合回归边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 新断言依赖导入弹窗结构类名（`import-form` / `dialog-footer` / `team-code-qr-actions`）；若未来模板命名调整，需要同步更新结构锚点。
- Next Recommended Unit:
  - Phase 2 下一原子任务：在 `toolbar-architecture.guard` 增加导入弹窗来源分支接线不变量守卫（json/teamCode 分支 + 二维码入口接线）。

## [2026-03-03] Session 67 - Strengthen Interleaved Import/Export Timing Determinism Regression

- Refactory Scope:
  - Phase: Phase 2
  - Task: ImportExport 交错触发时序确定性补强（`handleExport` / `handlePreviewData`，仅测试补强）
- In Scope Files:
  - `src/__tests__/useToolbarImportExportCommands.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增“多轮交错触发”回归：交替触发 `handlePreviewData` 与 `handleExport`，逐步断言 `updateTab` 立即计数、`100ms` 预览计数、`2000ms` 导出计数关系稳定不漂移。
  - 新增“同轮双顺序”回归：在单轮内覆盖 `preview -> export` 与 `export -> preview` 两种顺序，断言两类顺序下延时计数与即时计数一致。
  - 保持既有失败分支断言与语义不变，仅补充时序确定性断言。
  - 更新 `ToolbarArchitecture.md` Task 26，记录本轮交错时序边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 时序回归依赖 `setTimeout` + fake timers；若后续调度机制迁移（例如队列/微任务/节流器），需同步更新断言窗口与计数策略。
- Next Recommended Unit:
  - Phase 2 下一原子任务：继续补 `toolbar-wiring.regression` 的导入弹窗结构定位鲁棒性（降低对标题属性定位耦合，保持语义不变）。

## [2026-03-03] Session 66 - Add AST Guard for Toolbar Composable Import Ownership and Command Destructuring Completeness

- Refactory Scope:
  - Phase: Phase 2
  - Task: Toolbar 架构守卫 AST 完整性补强（composable 导入/调用归属 + import/export 命令解构完整性）
- In Scope Files:
  - `src/__tests__/toolbar-architecture.guard.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 为架构守卫 AST 扫描补充 `importDeclarations` 与 `variableDeclarations` 采集，支持“导入声明 + 调用归属 + 解构字段”三层结构断言。
  - 新增守卫：`Toolbar.vue` script 必须保留并调用 5 个 composable（ImportExport/Asset/Rule/Workspace/Dialog），且调用参数维持对象编排入口。
  - 新增守卫：`useToolbarImportExportCommands` 的解构命令集合必须完整覆盖导入/导出/预览/截图链路命令，防止接线缺项。
  - 新增守卫：`Toolbar.vue` script 不得直接导入 `teamCodeService` 或 import/export 实现依赖标识，保持实现职责不回流。
  - 更新 `ToolbarArchitecture.md` Task 25，记录本轮 AST 完整性边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 新增 AST 守卫依赖当前 `script setup` 与命令命名；若后续批量重命名或迁移到独立模块，需同步更新断言项。
- Next Recommended Unit:
  - Phase 2 下一原子任务：补强 `useToolbarImportExportCommands` 在 `handleExport` 与 `handlePreviewData` 交错触发下的时序确定性回归（仅测试补强）。

## [2026-03-03] Session 65 - Harden Toolbar Wiring Regression Against Selector Brittleness and Call-Count Drift

- Refactory Scope:
  - Phase: Phase 2
  - Task: Toolbar 接线回归抗脆弱补强（来源状态绑定可见性 + 多轮切换/重开计数对齐，纯测试补强）
- In Scope Files:
  - `src/__tests__/toolbar-wiring.regression.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 导入弹窗可见性断言由“单一按钮文案匹配”收敛为“来源状态 + 结构选择器”联合守卫：通过导入对话框容器作用域与 footer/二维码区域结构断言按钮可见性，减少文案耦合。
  - 在 `json` 与 `teamCode` 来源切换时，分别断言来源命令按钮与二维码入口显隐，保持与 `importSource` 状态强绑定。
  - 多轮来源切换与重开导入弹窗中，持续断言 `openImportDialog`、`triggerJsonFileImport`、`handleTeamCodeImport`、`triggerTeamCodeQrImport` 计数同轮对齐，防止调用漂移。
  - 更新 `ToolbarArchitecture.md` Task 24，记录本轮抗脆弱补强边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 导入对话框作用域当前通过 `title="导入数据"` 定位，若后续标题文案调整需同步更新该定位策略。
- Next Recommended Unit:
  - Phase 2 下一原子任务：为 `toolbar-architecture.guard` 增加 composable 导入与命令解构完整性 AST 守卫（仅测试补强，不改语义）。

## [2026-03-03] Session 64 - Extend Toolbar Wiring Regression for Import Source-Toggle Visibility and Call-Count Stability

- Refactory Scope:
  - Phase: Phase 2
  - Task: 增强 `toolbar-wiring.regression`，覆盖导入来源切换可见性与命令计数稳定性（仅测试补强，不改语义）
- In Scope Files:
  - `src/__tests__/toolbar-wiring.regression.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增来源切换可见性守卫：`json` 来源仅展示 JSON 导入按钮；`teamCode` 来源展示阵容码与二维码入口。
  - 新增单轮多次来源来回切换回归，验证 `triggerJsonFileImport` / `handleTeamCodeImport` / `triggerTeamCodeQrImport` 三路径持续命中既有 composable 命令。
  - 新增跨轮打开导入弹窗计数守卫，锁定 `openImportDialog` 与三路径命令计数持续对齐，不发生多调/少调漂移。
  - 更新 `ToolbarArchitecture.md` Task 23，记录本轮来源切换可见性与计数漂移回归边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 当前回归基于按钮文本匹配与组件 stub；后续若导入对话框文案/结构调整，需同步更新选择器与可见性断言。
- Next Recommended Unit:
  - Phase 2 下一原子任务：继续补 `toolbar-architecture.guard` 与 `toolbar-wiring.regression` 的结构鲁棒性（例如弱化对文案选择器的依赖，仍保持语义不变）。

## [2026-03-03] Session 63 - Strengthen Import/Export Command Determinism and Ref-Event Edge Coverage

- Refactory Scope:
  - Phase: Phase 2
  - Task: 补齐 `useToolbarImportExportCommands` 的确定性与 ref 事件边界回归（仅测试补强，不改语义）
- In Scope Files:
  - `src/__tests__/useToolbarImportExportCommands.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增 `triggerTeamCodeQrImport` ref 存在路径，锁定触发次数与 `click` 调用次数严格一致。
  - 新增 `handleTeamCodeQrImport` 在 `event.target` 缺失/异常输入时的 no-op 回归，锁定 `decodingTeamCodeQr` 与输入状态不被污染。
  - 新增 `handleExport` 多次触发计数回归，锁定 `updateTab` 立即执行与 `2000ms` 延时导出计数关系稳定。
  - 新增 `handlePreviewData` 多次触发计数回归，锁定 `updateTab` 与 `100ms` 延时序列化/弹窗打开计数关系稳定。
  - 更新 `ToolbarArchitecture.md` Task 22，记录本轮确定性与事件边界补强。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 当前计数稳定性回归依赖 fake timers 与 JSON stringify spy；若后续内部异步机制从 `setTimeout` 切换为其它调度方式，需同步调整断言策略。
- Next Recommended Unit:
  - Phase 2 下一原子任务：扩展 `toolbar-wiring.regression`，补导入来源切换可见性与多次切换后的命令计数稳定性回归。

## [2026-03-03] Session 62 - Add AST-Level Toolbar Architecture Guard for Import/Export Ownership Boundaries

- Refactory Scope:
  - Phase: Phase 2
  - Task: `toolbar-architecture.guard` 增加 AST 级边界守卫，降低字符串/模式匹配误报（仅测试补强）
- In Scope Files:
  - `src/__tests__/toolbar-architecture.guard.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 在架构守卫中新增 AST 扫描工具，针对 `Toolbar.vue` script setup 做调用级边界断言，避免仅依赖字符串/正则导致误报。
  - AST 级守卫明确限制 `Toolbar.vue` script 不承载 import/export 实现调用（`document.createElement`、`FileReader`、`navigator.clipboard.writeText` 与 import/export 语义定时回调）。
  - AST 级守卫明确 `useToolbarImportExportCommands.ts` 仍持有上述实现归属，并保留导出 `2000ms` / 预览 `100ms` 定时语义。
  - 更新 `ToolbarArchitecture.md` Task 21，记录本轮 AST 边界守卫补强内容。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - AST 守卫依赖当前 `script setup` 结构与调用名称；若后续发生结构性迁移（例如拆分到独立 TS 模块），需同步更新扫描目标与断言策略。
- Next Recommended Unit:
  - Phase 2 下一原子任务：补齐 `useToolbarImportExportCommands` 的确定性与 ref 事件边界回归（no-op 防污染 + 计数时序稳定性）。

## [2026-03-03] Session 61 - Extend Toolbar Wiring Regression with Closed-State Pollution Reset and Counter Alignment Guards

- Refactory Scope:
  - Phase: Phase 2
  - Task: 增强 `toolbar-wiring.regression`，验证导入对话框多轮循环中的关闭后污染态恢复与命令计数对齐（仅测试补强）
- In Scope Files:
  - `src/__tests__/toolbar-wiring.regression.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 进度更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 在两轮循环回归中新增“关闭后污染来源/输入”步骤，验证下一轮打开仍恢复默认来源 `json` 与空输入。
  - 增补命令计数守卫：`openImportDialog`、`triggerJsonFileImport`、`handleTeamCodeImport`、`triggerTeamCodeQrImport` 在多轮循环后均与导入触发轮次一致。
  - 保持既有 `json/teamCode/qr` 三路径按钮接线断言，确保循环后链路不漂移。
  - 更新 `ToolbarArchitecture.md` Task 20，记录本轮多轮接线回归补强边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 回归仍依赖组件 stub 与按钮文本选择，后续若导入弹窗模板结构或文案调整，需同步更新选择器与断言策略。
- Next Recommended Unit:
  - Phase 2 下一原子任务：在 `toolbar-architecture.guard` 引入 AST 级边界守卫，减少源码片段/模式匹配误报（保持行为不变）。

## [2026-03-03] Session 60 - Harden Import/Export Lifecycle Cleanup with Repeated-Failure and In-Flight Recovery Guards

- Refactory Scope:
  - Phase: Phase 2
  - Task: 补强 `useToolbarImportExportCommands` 生命周期清理与状态复位边界（重复失败幂等 + in-flight 回收，纯测试补强）
- In Scope Files:
  - `src/__tests__/useToolbarImportExportCommands.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 进度更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增 `triggerJsonFileImport` 连续解析失败回归，锁定失败后导入弹窗保持关闭、来源保持 `json`、输入保持原值的幂等语义。
  - 新增 `handleTeamCodeQrImport` 异步 in-flight 回归，验证成功/失败分支处理中 `decodingTeamCodeQr=true`，结束后统一回收为 `false`。
  - 在 in-flight 成功/失败分支统一断言文件 input 清理语义（`target.value=''`）不回退。
  - 更新 `ToolbarArchitecture.md` Task 19，记录本轮生命周期边界补强。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 该组回归依赖 `FileReader` 与二维码解析 mock，后续若浏览器 API 适配层改造，需要同步更新 mock 注入路径。
- Next Recommended Unit:
  - Phase 2 下一原子任务：扩展 `toolbar-wiring.regression`，补多轮循环中的命令计数对齐与来源复位守卫（保持语义不变）。

## [2026-03-03] Session 59 - Refine Toolbar Architecture Guard with Pattern-Level Timing and DOM Ownership Assertions

- Refactory Scope:
  - Phase: Phase 2
  - Task: 继续收紧 `toolbar-architecture.guard`，通过模式级断言锁定 import/export 的定时与 DOM 实现归属（仅测试补强）
- In Scope Files:
  - `src/__tests__/toolbar-architecture.guard.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 进度更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 在既有片段匹配守卫基础上，补充正则模式守卫，禁止 `Toolbar.vue` 回流 import/export DOM 细节：`document.createElement('input'/'a')`、`FileReader`、`navigator.clipboard.writeText`。
  - 补充正则模式守卫，禁止 `Toolbar.vue` 回流 import/export 定时语义实现（导出 `2000ms`、预览 `100ms` 片段）。
  - 新增 composable 定时实现归属断言：`handleExport` 的 `2000ms` 与 `handlePreviewData` 的 `100ms` 必须保留在 `useToolbarImportExportCommands.ts`。
  - 更新 `ToolbarArchitecture.md` Task 18，记录本轮模式级守卫补强。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 该守卫仍属于源码模式匹配策略，若实现重排或函数命名变化，需同步更新模式断言以避免误报。
- Next Recommended Unit:
  - Phase 2 下一原子任务：补强 `useToolbarImportExportCommands` 生命周期清理边界（in-flight 状态回收与重复失败幂等守卫）。

## [2026-03-03] Session 58 - Extend Toolbar Wiring Regression for Repeated Import Dialog State-Reset Cycles

- Refactory Scope:
  - Phase: Phase 2
  - Task: 增强 `toolbar-wiring.regression`，验证导入对话框多轮开关循环后接线与默认来源恢复不变（仅测试补强）
- In Scope Files:
  - `src/__tests__/toolbar-wiring.regression.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 进度更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 将导入回归用例扩展为两轮“打开 -> 切换来源 -> 关闭 -> 再打开”循环，逐轮断言默认来源恢复为 `json`、输入重置语义不回退。
  - 在每一轮中均断言 `json/teamCode/qr` 三路径按钮继续命中既有 composable 命令。
  - 增加触发计数守卫：`openImportDialog` 调用次数必须与“导入”按钮触发次数一致，防止接线链路漂移。
  - 更新 `ToolbarArchitecture.md` Task 17，记录多轮循环接线回归边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 该回归依赖组件 stub 与按钮文案匹配，后续若导入对话框结构或文案调整，需同步更新选择器与断言。
- Next Recommended Unit:
  - Phase 2 下一原子任务：在 `toolbar-architecture.guard` 增补 AST 级边界断言，降低源码片段匹配的误报风险（保持行为不变）。

## [2026-03-03] Session 57 - Harden Import/Export Lifecycle Cleanup and Dialog Reset Regression Coverage

- Refactory Scope:
  - Phase: Phase 2
  - Task: 补齐 `useToolbarImportExportCommands` 生命周期清理与状态复位边界回归（仅测试补强，不改语义）
- In Scope Files:
  - `src/__tests__/useToolbarImportExportCommands.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 进度更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增 `triggerTeamCodeQrImport` 空 ref no-op 回归，锁定空引用时无副作用。
  - 扩展 `openImportDialog` 重复调用幂等回归，持续断言来源恢复 `json`、输入清空与弹窗打开语义。
  - 强化 `triggerJsonFileImport` 失败分支，断言失败后导入弹窗维持关闭，并保持来源/输入状态不被污染。
  - 保持并补强 `handleTeamCodeQrImport` 三分支回归（成功/失败/无文件）对 `decoding` 回收与 input 清理断言。
  - 更新 `ToolbarArchitecture.md` Task 16，记录本次生命周期清理边界补强。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 当前生命周期回归仍以 DOM/FileReader mock 驱动，后续若浏览器 API 包装层调整，需同步维护 mock 注入方式。
- Next Recommended Unit:
  - Phase 2 下一原子任务：扩展 `toolbar-wiring.regression`，覆盖导入对话框多轮开关循环后的默认来源恢复与命令接线稳定性。

## [2026-03-03] Session 56 - Refine Toolbar Architecture Guard for Import/Export Timing and DOM Ownership Details

- Refactory Scope:
  - Phase: Phase 2
  - Task: 继续收紧 `toolbar-architecture.guard`，明确 import/export 的 DOM 与定时实现归属在 composable（仅测试补强）
- In Scope Files:
  - `src/__tests__/toolbar-architecture.guard.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 进度更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 扩展 `Toolbar.vue` 禁止片段，显式覆盖 import/export 的 DOM 实现语句：`document.createElement('input'/'a')`、`FileReader`、`navigator.clipboard.writeText`。
  - 补强 import/export 定时语义归属守卫：导出 `2000ms` 与预览 `100ms` 相关实现片段必须留在 `useToolbarImportExportCommands.ts`。
  - 保留并强化 import/export 关键错误路径守卫（`文件格式错误`、`数据预览失败`、`复制失败`、截图关键错误）以防实现回流到 `Toolbar.vue`。
  - 更新 `ToolbarArchitecture.md` Task 15，记录本次定时与 DOM 归属边界补强。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 该守卫仍是源码片段匹配，后续若重排实现或重命名关键变量，需同步更新断言片段以避免误报。
- Next Recommended Unit:
  - Phase 2 下一原子任务：补强 `useToolbarImportExportCommands` 生命周期清理与状态复位边界（仅测试补强，不改语义）。

## [2026-03-03] Session 55 - Tighten Toolbar Architecture Guard for Import/Export Timer and DOM Ownership

- Refactory Scope:
  - Phase: Phase 2
  - Task: 收紧 `toolbar-architecture.guard`，约束 import/export 的 DOM/定时实现归属在 composable，`Toolbar.vue` 仅保留接线与模板（仅测试补强）
- In Scope Files:
  - `src/__tests__/toolbar-architecture.guard.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 进度更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 扩展 `Toolbar` 禁止片段，覆盖 import/export 的 DOM 细节（`document.createElement('input'/'a')`）、`FileReader`、剪贴板写入与导出/预览定时实现片段。
  - 扩展 composable 必须片段，要求保留上述 DOM/定时实现与 `navigator.clipboard.writeText` 细节。
  - 补充 import/export 关键错误处理守卫：`数据预览失败`、`复制失败`、`文件格式错误`、截图关键错误路径。
  - 更新 `ToolbarArchitecture.md` Task 14，记录本次架构守卫收紧边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 架构守卫仍基于源码片段匹配，后续若重命名或调整实现顺序需同步更新守卫片段以避免误报。
- Next Recommended Unit:
  - Phase 2 下一原子任务：补一轮 import/export 守卫的 AST 级断言（替代部分字符串片段匹配）以降低误报风险，保持行为不变。

## [2026-03-03] Session 54 - Extend Toolbar Wiring Regression for Import Dialog State-Reset Paths

- Refactory Scope:
  - Phase: Phase 2
  - Task: 扩展 `toolbar-wiring.regression`，验证导入对话框开关与来源切换后的状态复位链路不变（仅测试补强）
- In Scope Files:
  - `src/__tests__/toolbar-wiring.regression.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 进度更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 扩展导入接线回归，覆盖“点击导入仍命中 `openImportDialog`”并断言打开后默认来源保持 `json`。
  - 增补来源切换到 `teamCode` 后关闭再打开场景，断言来源与输入状态按既有链路复位。
  - 保持并强化导入弹窗 `json/teamCode/qr` 三路径命令接线断言（`triggerJsonFileImport` / `handleTeamCodeImport` / `triggerTeamCodeQrImport`）。
  - 更新 `ToolbarArchitecture.md` Task 13，记录导入对话框状态复位接线回归边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 该回归仍基于组件 stub 环境，若后续导入弹窗模板结构调整较大，按钮文本选择器与 stub 渲染策略需要同步维护。
- Next Recommended Unit:
  - Phase 2 下一原子任务：收紧 `toolbar-architecture.guard`，锁定 import/export 的 DOM/定时实现归属在 composable，Toolbar 仅保留接线与模板。

## [2026-03-03] Session 53 - Harden Import/Export Timer and Cleanup Regression Coverage

- Refactory Scope:
  - Phase: Phase 2
  - Task: 补齐 `useToolbarImportExportCommands` 的“定时/关闭/清理”边界分支回归（仅测试补强，不改语义）
- In Scope Files:
  - `src/__tests__/useToolbarImportExportCommands.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 进度更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 补齐 `handlePreviewData` 序列化失败分支，验证失败提示与预览弹窗守卫不变。
  - 补齐 `copyDataToClipboard` 失败路径，验证剪贴板异常时错误提示不变。
  - 补齐 `downloadImage` 空预览 no-op 与下载后关闭预览两条边界。
  - 补齐 `handleClose` 清理分支，验证关闭时 `previewImage` 清空并执行 `done` 回调。
  - 更新 `ToolbarArchitecture.md` Task 12，记录本次定时与清理回归补强边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 失败分支回归仍依赖 mock 环境（`navigator.clipboard`、`JSON.stringify` 异常注入），后续若浏览器 API 兼容层调整需同步维护测试注入方式。
- Next Recommended Unit:
  - Phase 2 下一原子任务：扩展 `toolbar-wiring.regression`，补齐导入对话框来源切换后的状态复位接线回归。

## [2026-03-03] Session 52 - Tighten Toolbar Architecture Guard for Import/Export Implementation Ownership

- Refactory Scope:
  - Phase: Phase 2
  - Task: 加强 `toolbar-architecture.guard`，明确 import/export 具体实现归属在 composable，`Toolbar.vue` 仅保留接线与模板层（仅测试补强）
- In Scope Files:
  - `src/__tests__/toolbar-architecture.guard.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 进度更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 扩展 import/export 守卫的 `Toolbar` 禁止片段：teamCode 转换、QR 识别、快照/水印实现细节与关键错误处理语句。
  - 扩展 composable 必须片段：`convertTeamCodeToRootDocument`、`decodeTeamCodeFromQrImage`、`getSnapshotBase64`、动态 group 快照隐藏与水印处理实现。
  - 增补导入相关接线片段守卫（`openImportDialog`/`triggerJsonFileImport`/`triggerTeamCodeQrImport`），确保 `Toolbar` 仅做命令绑定。
  - 更新 `ToolbarArchitecture.md` Task 11，记录 import/export 架构守卫补强目标。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 守卫仍以代码片段字符串匹配为主，后续重命名或重排实现时需同步更新守卫片段以避免误报。
- Next Recommended Unit:
  - Phase 2 下一原子任务：补强 import/export composable 的生命周期清理守卫（例如 DOM input/reset 约束）并保持行为不变。

## [2026-03-03] Session 51 - Extend Toolbar Wiring Regression for Import Dialog Command Paths

- Refactory Scope:
  - Phase: Phase 2
  - Task: 扩展 `toolbar-wiring.regression`，验证导入对话框 `json/teamCode/qr` 命令链路在来源切换后保持不变（仅测试补强）
- In Scope Files:
  - `src/__tests__/toolbar-wiring.regression.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 进度更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 在接线回归中新增导入对话框链路用例，覆盖“导入来源切换后按钮仍命中既有 composable 命令”。
  - 为测试稳定性补齐 `el-dialog` / `el-form` / `el-form-item` slot 渲染 stub，避免 UI 组件 stub 吞掉对话框按钮节点。
  - 新增并断言三条导入路径：`triggerJsonFileImport`、`handleTeamCodeImport`、`triggerTeamCodeQrImport`。
  - 更新 `ToolbarArchitecture.md` Task 10，记录本次接线回归边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 该回归仍基于组件测试 stub 环境，后续若导入对话框结构变化较大，需同步维护 stub/文案匹配以避免误报。
- Next Recommended Unit:
  - Phase 2 下一原子任务：收紧 `toolbar-architecture.guard`，锁定 import/export 实现归属在 composable、Toolbar 仅保留接线和模板层。

## [2026-03-03] Session 50 - Harden Import/Export Failure and Edge Regression Coverage

- Refactory Scope:
  - Phase: Phase 2
  - Task: 补齐 `useToolbarImportExportCommands` 关键失败分支与边界分支回归（仅测试补强）
- In Scope Files:
  - `src/__tests__/useToolbarImportExportCommands.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 进度更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - JSON 导入补齐解析失败与无文件 no-op 回归，保持导入失败提示与输入重置行为不变。
  - 阵容码导入补齐转换失败路径回归，验证 loading 回收、弹窗状态与错误提示链路不变。
  - 二维码导入补齐无文件 no-op 与识别失败路径，验证输入重置与错误提示行为不变。
  - 截图链路补齐空快照与水印处理失败路径，验证预览状态守卫与错误提示不变。
  - 更新 `ToolbarArchitecture.md` Task 9，记录本次仅测试补强边界，不改运行语义。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - JSON 读取失败分支仍主要依赖 `FileReader` mock 驱动，若后续需要可增补真实文件读取异常注入的浏览器层集成回归。
- Next Recommended Unit:
  - Phase 2 下一原子任务：扩展 `toolbar-wiring.regression`，锁定导入对话框来源切换后的 `json/teamCode/qr` 命令链路。

## [2026-03-03] Session 49 - Harden Workspace/Dialog Regression Coverage for Edge Branches

- Refactory Scope:
  - Phase: Phase 2
  - Task: 补强 `useToolbarWorkspaceCommands` 与 `useToolbarDialogState` 的关键失败分支与边界分支回归（仅测试补强）
- In Scope Files:
  - `src/__tests__/useToolbarWorkspaceCommands.test.ts`
  - `src/__tests__/useToolbarDialogState.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 进度更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - `workspace` 新增 `handleClearCanvas` 三类分支回归：取消 no-op、无 LogicFlow 实例、无 active file 守卫。
  - `dialog` 新增 `mountDialogState` 同版本 no-op 回归与水印初始化边界回归（持久化值读取 + 非数字回退默认值）。
  - 更新 `ToolbarArchitecture.md` Task 8，记录本次仅测试补强边界，不改运行语义。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - `workspace` 回归仍以 store/logicflow mock 为主，若后续需要验证更深集成路径可增补与 `Toolbar.vue` 的端到端触发场景。
- Next Recommended Unit:
  - Phase 2 下一原子任务：为 `useToolbarImportExportCommands` 补失败分支回归（文件读取异常、二维码识别失败、快照空结果）在 `Toolbar` 级接线场景下的行为守卫。

## [2026-03-03] Session 48 - Add Toolbar Wiring Regression for Lifecycle and Command Bindings

- Refactory Scope:
  - Phase: Phase 2
  - Task: 新增 `Toolbar` 接线回归，验证生命周期接线与按钮命令链路行为不变
- In Scope Files:
  - `src/__tests__/toolbar-wiring.regression.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 进度更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增 `toolbar-wiring.regression`，通过 mock composables + 挂载 `Toolbar.vue` 验证 `onMounted/onBeforeUnmount` 接线不回退。
  - 同一回归测试验证顶栏关键按钮点击继续触发对应 composable 命令（import/export、asset、rule、workspace、dialog）。
  - 更新 `ToolbarArchitecture.md` 增补 Task 7，明确接线回归目标与覆盖点。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 该回归主要锁定“按钮 -> composable 方法”链路；若未来引入中间适配层，需补更细粒度断言避免链路断开但表面按钮仍可点击。
- Next Recommended Unit:
  - Phase 2 下一原子任务：补强 `useToolbarWorkspaceCommands` 与 `useToolbarDialogState` 的失败/边界分支回归（仅测试补强，不改语义）。

## [2026-03-03] Session 47 - Broaden Toolbar Architecture Guard Across All Composable Boundaries

- Refactory Scope:
  - Phase: Phase 2
  - Task: 扩展 `Toolbar` 架构守卫覆盖全部已拆分 composables（import/export、asset、rule、workspace、dialog），确保 `Toolbar.vue` 保持编排/模板层
- In Scope Files:
  - `src/__tests__/toolbar-architecture.guard.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 进度更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 在 `toolbar-architecture.guard` 中新增 import/export、asset、rule 三组边界守卫，统一采用“Toolbar 保留接线 + 实现停留 composable”断言模型。
  - 保留既有 workspace/dialog 守卫并与新增守卫并行，形成 5 组 composable 全覆盖。
  - 更新 `ToolbarArchitecture.md` Task 6，明确五类 composable 的守卫目标与边界说明。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 守卫仍基于关键片段字符串匹配，后续若重命名方法或文案需同步维护测试片段，避免出现“语义未变但守卫误报”。
- Next Recommended Unit:
  - Phase 2 下一原子任务：补充 `Toolbar` 生命周期与按钮命令接线回归测试，锁定 mount/dispose 与命令触发链路。

## [2026-03-02] Session 46 - Add Toolbar Architecture Guard Tests for Composable Wiring Boundaries

- Refactory Scope:
  - Phase: Phase 2
  - Task: 新增 `Toolbar` 结构守卫回归，确保命令实现留在 composables、Toolbar 保持编排/模板层角色，行为不变
- In Scope Files:
  - `src/__tests__/toolbar-architecture.guard.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 进度更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增架构守卫测试，约束 `Toolbar.vue` 必须通过 composables 接线命令层，不直接承载工作区命令和对话框状态实现。
  - 守卫覆盖工作区命令与对话框状态两条关键边界：`useToolbarWorkspaceCommands` 与 `useToolbarDialogState`。
  - 文档补充 Task 6 边界说明，明确结构守卫目标与覆盖点。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 当前守卫基于关键代码片段匹配，后续若进行大规模重命名需同步更新守卫片段以维持有效性。
- Next Recommended Unit:
  - Phase 2 下一原子任务：为 `Toolbar` 命令编排层补充更细粒度的单测边界（例如 composable 入参契约守卫），继续保持行为不变。

## [2026-03-02] Session 45 - Extract Toolbar Dialog State Orchestration into useToolbarDialogState

- Refactory Scope:
  - Phase: Phase 2
  - Task: 将 `Toolbar` 中更新日志/反馈/水印设置对话框状态编排抽离到 composable，保持行为不变
- In Scope Files:
  - `src/components/Toolbar.vue`
  - `src/components/composables/useToolbarDialogState.ts`
  - `src/__tests__/useToolbarDialogState.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 进度更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增 `useToolbarDialogState`，承接更新日志开关、反馈开关、水印设置状态与持久化命令。
  - `Toolbar.vue` 保留模板与按钮绑定，通过 composable 返回的方法接线，不改交互文案与 UI 结构。
  - 将版本首开更新日志逻辑迁移到 `mountDialogState`，保持 embed 模式下不触发该逻辑。
  - 新增最小回归测试，覆盖版本首开、开关切换、水印设置持久化与对话框关闭行为。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - Toolbar 架构边界仍缺显式守卫测试，后续需补充以防命令实现回流到单文件。
- Next Recommended Unit:
  - Phase 2 下一原子任务：新增 Toolbar 架构守卫回归，确保命令实现留在 composables、Toolbar 保持编排/模板层角色。

## [2026-03-02] Session 44 - Extract Toolbar Workspace Commands Orchestration into useToolbarWorkspaceCommands

- Refactory Scope:
  - Phase: Phase 2
  - Task: 将 `Toolbar` 中工作区控制命令编排（`loadExample` / `handleResetWorkspace` / `handleClearCanvas`）抽离到 composable，保持行为不变
- In Scope Files:
  - `src/components/Toolbar.vue`
  - `src/components/composables/useToolbarWorkspaceCommands.ts`
  - `src/__tests__/useToolbarWorkspaceCommands.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 进度更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增 `useToolbarWorkspaceCommands`，承接 `loadExample`、`handleResetWorkspace`、`handleClearCanvas` 命令编排。
  - `Toolbar.vue` 保持模板与命令接线角色，通过 composable 暴露命令接入既有按钮，不调整 UI 或交互文案。
  - 新增最小回归测试，覆盖示例加载确认/取消、重置确认/取消、清空画布后 LogicFlow 与 active tab 状态回写行为。
  - 更新 `ToolbarArchitecture.md`，补齐工作区控制命令拆分边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 更新日志/反馈/水印设置等对话框状态编排仍在 `Toolbar.vue`，下一原子单元需继续拆分以收敛职责边界。
- Next Recommended Unit:
  - Phase 2 下一原子任务：抽离 `Toolbar` 对话框状态编排到 `useToolbarDialogState`（保持行为不变）。

## [2026-03-02] Session 43 - Extract Toolbar Rule Management Orchestration into useToolbarRuleManagement

- Refactory Scope:
  - Phase: Phase 2
  - Task: 将 `Toolbar` 中规则管理编排逻辑抽离到 composable，保持行为不变
- In Scope Files:
  - `src/components/Toolbar.vue`
  - `src/components/composables/useToolbarRuleManagement.ts`
  - `src/__tests__/useToolbarRuleManagement.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 进度更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增 `useToolbarRuleManagement`，承接规则管理 draft、规则/变量导入导出、规则编辑器状态与保存校验、应用与恢复默认等编排。
  - `Toolbar.vue` 保留模板层，仅通过 composable 返回的 refs/methods 接线规则管理对话框与操作按钮。
  - 新增最小回归测试，覆盖规则管理关键行为（打开重载、导入归一化、应用生效、恢复默认、编辑保存校验）。
  - 更新 `ToolbarArchitecture.md`，补齐 Task 3 后 Toolbar 命令层拆分边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - `Toolbar` 仍包含工作区控制与截图水印设置逻辑，后续如继续 Phase 2 可按原子单元评估是否进一步拆分。
- Next Recommended Unit:
  - Phase 2 下一原子任务：为 `Toolbar` 剩余命令层（工作区重置/清空、示例加载）补结构守卫回归，防止编排回流到单文件。

## [2026-03-02] Session 42 - Extract Toolbar Asset Management Orchestration into useToolbarAssetManagement

- Refactory Scope:
  - Phase: Phase 2
  - Task: 将 `Toolbar` 中素材管理编排逻辑抽离到 composable，保持行为不变
- In Scope Files:
  - `src/components/Toolbar.vue`
  - `src/components/composables/useToolbarAssetManagement.ts`
  - `src/__tests__/useToolbarAssetManagement.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `Toolbar` 导入/导出/预览编排继续重构
  - `Toolbar` 规则管理编排拆分
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 进度更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增 `useToolbarAssetManagement`，承接素材分类状态、列表刷新、上传、删除、存储订阅与销毁编排。
  - `Toolbar.vue` 改为通过 composable 暴露的 API 接线素材管理模板与生命周期（`mountAssetManagement` / `disposeAssetManagement`）。
  - 新增最小回归测试，覆盖素材管理关键行为：挂载刷新+订阅、上传成功/失败、删除后刷新。
  - 在 `ToolbarArchitecture.md` 增量补齐 Task 2 边界说明，保持 Phase 2 拆分文档连续性。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 规则管理编排仍集中在 `Toolbar.vue`，仍是当前复杂度主要来源。
- Next Recommended Unit:
  - Phase 2 下一原子任务：抽离 `Toolbar` 规则管理编排到 `useToolbarRuleManagement`（保持行为不变）。

## [2026-03-02] Session 41 - Extract Toolbar Import/Export and Preview Commands into useToolbarImportExportCommands

- Refactory Scope:
  - Phase: Phase 2
  - Task: 将 `Toolbar` 中导入/导出/预览相关命令编排抽离到 composable，保持行为不变
- In Scope Files:
  - `src/components/Toolbar.vue`
  - `src/components/composables/useToolbarImportExportCommands.ts`
  - `src/__tests__/useToolbarImportExportCommands.test.ts`
  - `docs/2design/ToolbarArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `Toolbar` 素材管理编排拆分
  - `Toolbar` 规则管理编排拆分
  - `FlowEditor` 新增重构任务
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 进度更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增 `useToolbarImportExportCommands`，承接 `Toolbar` 内导入/导出/预览命令（含 JSON 导入、阵容码导入、二维码识别、数据预览、截图预览与下载）。
  - `Toolbar.vue` 改为仅保留状态与接线，模板调用点保持原命令名与行为时序不变。
  - 新增最小回归测试，覆盖导出延迟语义、数据预览负载生成、导入流程（阵容码/二维码）与截图前置错误分支。
  - 新增 `ToolbarArchitecture.md`，记录 Phase 2 拆分边界与 Task 1 已落地的命令层职责。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - `Toolbar` 仍保留素材管理与规则管理编排，文件复杂度尚未完全收敛；需继续按原子单元拆分。
- Next Recommended Unit:
  - Phase 2 下一原子任务：抽离 `Toolbar` 素材管理编排到 `useToolbarAssetManagement`（保持行为不变）。

## [2026-03-02] Session 40 - Extract Flow Canvas Interaction Wiring into useFlowCanvasInteraction

- Refactory Scope:
  - Phase: Phase 2
  - Task: 将 `FlowEditor` 画布交互运行时杂项（右键拖拽、contextmenu 抑制、ResizeObserver/window resize 接线与清理）抽离到 composable，保持行为不变
- In Scope Files:
  - `src/components/flow/FlowEditor.vue`
  - `src/components/flow/composables/useFlowCanvasInteraction.ts`
  - `src/components/flow/composables/useFlowEditorRuntime.ts`
  - `src/__tests__/useFlowCanvasInteraction.test.ts`
  - `docs/2design/FlowEditorArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `Toolbar` 拆分
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 进度更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增 `useFlowCanvasInteraction`，承接 `FlowEditor` 中右键拖拽、contextmenu 抑制、`resizeCanvas` 与 resize 接线/清理逻辑。
  - `FlowEditor` 改为在生命周期中调用 `mountCanvasInteraction/disposeCanvasInteraction`，并继续通过 `defineExpose` 暴露同名 `resizeCanvas`。
  - `useFlowEditorRuntime` 移除画布交互 wiring，聚焦 LogicFlow 运行时初始化与事件编排，职责边界更清晰。
  - 新增最小回归测试，覆盖关键交互事件（右键拖拽与 contextmenu 抑制）和 resize 接线清理行为不变。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 交互与 runtime 拆分后 composable 数量增加，后续需补结构守卫测试避免接口漂移导致接线遗漏。
- Next Recommended Unit:
  - Phase 2 下一原子任务：补 `FlowEditor` composables 组合边界的结构守卫回归（确保 runtime/layer/groupRule/canvas 关键接线片段不回退）。

## [2026-03-02] Session 39 - Extract Flow Group-Rule Orchestration into useFlowGroupRuleOrchestrator

- Refactory Scope:
  - Phase: Phase 2
  - Task: 将 `FlowEditor` 中 group rule 校验编排（refresh/schedule、共享配置订阅触发、告警定位）抽离到 composable，保持行为不变
- In Scope Files:
  - `src/components/flow/FlowEditor.vue`
  - `src/components/flow/composables/useFlowGroupRuleOrchestrator.ts`
  - `src/components/flow/composables/useFlowEditorRuntime.ts`
  - `src/__tests__/useFlowGroupRuleOrchestrator.test.ts`
  - `docs/2design/FlowEditorArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `Toolbar` 拆分
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 进度更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增 `useFlowGroupRuleOrchestrator`，承接 `refreshGroupRuleWarnings`、`scheduleGroupRuleValidation`、`locateProblemNode` 与共享配置订阅编排。
  - `FlowEditor` 改为通过 composable 获取 `groupRuleWarnings` 与相关编排方法，保留原有模板与命令调用点不变。
  - 将 `subscribeSharedGroupRulesConfig` 从 `useFlowEditorRuntime` 中移除，避免运行时接线层与规则编排层职责混杂。
  - 新增最小回归测试，覆盖“告警调度刷新”、“告警定位”、“共享配置订阅触发即时校验”三条关键行为路径。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 画布交互运行时（右键拖拽、contextmenu 抑制、resize 接线）仍在 `FlowEditor` 与 runtime 间分散，下一步需继续拆分以完成 Phase 2 既定边界。
- Next Recommended Unit:
  - Phase 2 下一原子任务：抽离画布交互运行时杂项到 `useFlowCanvasInteraction`（保持事件语义与清理行为不变）。

## [2026-03-02] Session 38 - Extract Flow Layer Commands into useFlowLayerCommands

- Refactory Scope:
  - Phase: Phase 2
  - Task: 将 `FlowEditor` 中图层命令逻辑（`bringToFront/sendToBack/bringForward/sendBackward`）抽离到 composable，保持行为不变
- In Scope Files:
  - `src/components/flow/FlowEditor.vue`
  - `src/components/flow/composables/useFlowLayerCommands.ts`
  - `src/__tests__/useFlowLayerCommands.test.ts`
  - `docs/2design/FlowEditorArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `Toolbar` 拆分
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 进度更新
  - Phase 1 / Phase 3 内容
- Decisions:
  - 新增 `useFlowLayerCommands`，将四个图层命令从 `FlowEditor` 迁移到 composable，并保持命令签名与执行路径不变。
  - `FlowEditor` 仅替换为组合式接线：通过 `useFlowLayerCommands({ lf, selectedNode })` 获取并透传给 runtime，不改外部契约。
  - 新增最小回归测试，覆盖四个命令的关键行为（置顶、置底、上移、下移）与 selectedNode 回退路径，确保迁移后行为一致。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 当前仅完成图层命令迁移；group rule 校验编排与画布交互运行时杂项仍在 `FlowEditor` 主体，需继续按 Phase 2 原子单元拆分。
- Next Recommended Unit:
  - Phase 2 下一原子任务：抽离 group rule 校验编排到 `useFlowGroupRuleOrchestrator`（保持告警刷新/定位行为不变）。

## [2026-03-02] Session 37 - Extract FlowEditor Runtime Wiring into useFlowEditorRuntime

- Refactory Scope:
  - Phase: Phase 2
  - Task: 将 `FlowEditor` 中 “LogicFlow 实例初始化 + 事件绑定” 抽离到独立 composable，保持行为不变
- In Scope Files:
  - `src/components/flow/FlowEditor.vue`
  - `src/components/flow/composables/useFlowEditorRuntime.ts`
  - `src/__tests__/embed-update-data.contract.test.ts`
  - `docs/2design/FlowEditorArchitecture.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `Toolbar` 拆分
  - `groupRules` 规则语义调整
  - `docs/1management/plan.md` 进度更新
- Decisions:
  - 新增 `useFlowEditorRuntime`，承接 `FlowEditor` 原 `onMounted` 中的 LogicFlow 初始化、节点注册、快捷键/右键菜单接线、关键图数据变更事件监听与运行时订阅清理。
  - `FlowEditor` 保留原有业务命令与渲染逻辑，仅改为调用 `mountFlowEditorRuntime(...)` 并在 `onBeforeUnmount` 执行 disposer。
  - 更新契约守卫测试：将“关键事件监听片段”检查从 `FlowEditor.vue` 转移到新 composable，同时保留 `FlowEditor` 对配置 props 的接线守卫，确保外部契约不变。
  - 新增 `FlowEditorArchitecture.md` 最小文档，明确渲染层与运行时编排层边界。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 本次为“位置迁移型重构”，事件绑定仍较集中于单个 runtime composable；后续继续拆分时需避免跨文件循环依赖。
- Next Recommended Unit:
  - Phase 2 下一原子任务：在不改语义前提下拆分 `FlowEditor` 图层命令与 group rule 编排逻辑边界（仍不触及 Toolbar）。

## [2026-03-02] Session 36 - Apply Embed config(grid/snapline/keyboard) with Minimal Scope

- Refactory Scope:
  - Phase: Phase 1
  - Task: 落地 `config` 最小可用实现（至少 `grid/snapline/keyboard`），并同步文档与契约
- In Scope Files:
  - `src/YysEditorEmbed.vue`
  - `src/components/flow/FlowEditor.vue`
  - `src/__tests__/embed-update-data.contract.test.ts`
  - `docs/2design/ComponentArchitecture.md`
  - `docs/3build/YysEditorEmbed.md`
  - `docs/3build/EMBED_README.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `config` 复杂配置系统与其余字段深度实现（如 `theme/locale`）
  - `docs/1management/plan.md` 进度更新
  - Phase 2/3 重构任务
- Decisions:
  - `YysEditorEmbed` 新增 `resolvedEmbedConfig`，对 `config.grid/snapline/keyboard` 做默认值归一化后透传到 `FlowEditor`。
  - `FlowEditor` 增加最小配置 props：`configSnapGridEnabled`、`configSnaplineEnabled`、`configKeyboardEnabled`（默认 `true`），并通过现有状态/能力最小接线：
    - `grid`：写入 `snapGridEnabled` 并复用现有 `applySnapGrid`；
    - `snapline`：写入 `snaplineEnabled` 并复用现有 snapline 行为；
    - `keyboard`：通过 `lfInstance.keyboard.enable/disable` 切换。
  - 新增契约测试断言 `showPropertyPanel` 与 `config(grid/snapline/keyboard)` 在 edit 模式透传生效，并补结构守卫覆盖配置接线关键片段。
  - 文档同步声明：`config` 已最小生效三字段，其余字段仍为兼容保留状态。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - `snapline` 目前沿用现有开关行为模型（最小接线）；如需更细粒度语义（例如完全关闭吸附计算）需后续单独任务评估。
- Next Recommended Unit:
  - Phase 1 收尾：补一条针对 `config` 其余字段状态（`theme/locale` 未实现）的文档/测试守卫，避免后续误读为已生效。

## [2026-03-02] Session 35 - Implement showPropertyPanel in Embed Edit Mode (Path A, Minimal Wiring)

- Refactory Scope:
  - Phase: Phase 1
  - Task: 走 A 路径落地 `showPropertyPanel` 最小可用实现，使其在 embed edit 模式真正生效
- In Scope Files:
  - `src/components/flow/FlowEditor.vue`
  - `src/YysEditorEmbed.vue`
  - `src/__tests__/embed-update-data.contract.test.ts`
  - `docs/2design/ComponentArchitecture.md`
  - `docs/3build/YysEditorEmbed.md`
  - `docs/3build/EMBED_README.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `config` 运行时能力实现（留在后续 Task 3）
  - `docs/1management/plan.md` 进度更新
  - Phase 2/3 重构任务
- Decisions:
  - `FlowEditor` 新增 `showPropertyPanel` prop（默认 `true`），并以 `v-if` 控制右侧 `PropertyPanel` 渲染。
  - `YysEditorEmbed` 在 edit 模式向 `FlowEditor` 透传 `showPropertyPanel`，保持默认行为不变（默认仍显示属性面板）。
  - 契约测试将 `showPropertyPanel` 从“兼容 no-op”改为“可生效”，并保留 `config` 当前阶段的兼容保留定位。
  - 文档同步移除 `showPropertyPanel` 的 no-op 描述，仅保留 `config` no-op 声明，确保文档与运行时一致。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 当前只实现属性面板显示开关，不涉及布局/样式策略调整；宿主如对极窄宽度布局有额外要求，需后续单独评估。
- Next Recommended Unit:
  - Phase 1: 实现 `config` 的最小可用能力（至少 `grid/snapline/keyboard`）并同步文档与契约测试。

## [2026-03-02] Session 34 - Harden update:data Contract Coverage for Embed Edit Mutations

- Refactory Scope:
  - Phase: Phase 1
  - Task: 补强嵌入编辑模式 `update:data` 契约覆盖，补齐“有修改但可能漏发”的关键事件路径（最小补线）
- In Scope Files:
  - `src/components/flow/FlowEditor.vue`
  - `src/__tests__/embed-update-data.contract.test.ts`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `showPropertyPanel/config` 运行时实现（A 路径留在后续任务）
  - `docs/1management/plan.md` 进度更新
  - Phase 2/3 重构任务
- Decisions:
  - 在 `FlowEditor` 中为 `graph-data-change` 增加关键变更事件补线：`NODE_PROPERTIES_DELETE`、`NODE_DROP`、`TEXT_UPDATE`、`LABEL_UPDATE`、`EDGE_ADJUST`、`EDGE_EXCHANGE_NODE`，并将历史监听统一为 `EventType.HISTORY_CHANGE`。
  - 扩展 `embed-update-data.contract` 回归：新增“连续多次变更事件转发不丢失”用例，确保 edit 模式对 `graph-data-change` 的逐次透传稳定。
  - 增加结构守卫测试，约束 `FlowEditor` 保持对核心变更事件的 `graph-data-change` 监听接线，降低后续回归漏网风险。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 新增事件与 `history:change` 可能在单次用户动作中产生多次 `update:data`；当前按“宁可不漏发”处理，后续如需降噪可再做节流/去重原子任务。
- Next Recommended Unit:
  - Phase 1: 执行 A 路径，落地 `showPropertyPanel` 的最小可用实现并同步文档/契约测试。

## [2026-03-02] Session 33 - Align showPropertyPanel/config Contract as Compatibility No-op

- Refactory Scope:
  - Phase: Phase 1
  - Task: 收敛 `showPropertyPanel/config` 的文档声明与运行时行为，选择 B（兼容保留 + 文档标记 no-op）
- In Scope Files:
  - `docs/2design/ComponentArchitecture.md`
  - `docs/3build/YysEditorEmbed.md`
  - `docs/3build/EMBED_README.md`
  - `src/__tests__/embed-update-data.contract.test.ts`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/YysEditorEmbed.vue` 运行时能力实现（选择 B，不新增行为）
  - `docs/1management/plan.md` 进度更新
  - Phase 2/3 重构任务
- Decisions:
  - 明确决策为 B：`showPropertyPanel` 与 `config` 保留在 API 以兼容存量接入，但当前版本视为 no-op，不承诺运行时效果。
  - 在 `ComponentArchitecture`、`YysEditorEmbed` 使用文档和 `EMBED_README` 同步标注 no-op 与兼容声明，移除“当前生效”暗示。
  - 增加契约回归测试，验证在传入 `showPropertyPanel/config` 时嵌入编辑模式行为保持兼容且不影响 `update:data` 事件链路。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 当前对 `showPropertyPanel/config` 的需求仍可能存在；若后续需要恢复能力，应以单独原子任务实现并补运行时/契约测试。
- Next Recommended Unit:
  - Phase 1 后续：若业务确认需要上述能力，选择 A 路径实现最小运行时接线并在文档中移除 no-op 标记。

## [2026-03-02] Session 32 - Emit update:data in Embed Edit Mode via Minimal Wiring

- Refactory Scope:
  - Phase: Phase 1
  - Task: 在嵌入编辑模式补齐 `update:data` 实时触发能力（最小事件透传/接线）
- In Scope Files:
  - `src/components/flow/FlowEditor.vue`
  - `src/YysEditorEmbed.vue`
  - `src/__tests__/embed-update-data.contract.test.ts`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - 新业务功能扩展
  - `docs/1management/plan.md` 进度更新
  - Phase 2/3 重构任务
- Decisions:
  - `FlowEditor` 新增 `graph-data-change` 事件，在已有图数据变更相关节点（`NODE_ADD/NODE_DELETE/EDGE_ADD/EDGE_DELETE/NODE_PROPERTIES_CHANGE` + `history:change`）发出当前 `getGraphRawData()`。
  - `YysEditorEmbed` 在 edit 模式下接收 `graph-data-change` 并直接透传为对外 `update:data`，不改 `save/cancel` 行为。
  - 新增最小契约测试，验证编辑模式下 FlowEditor 上报数据变更时会触发 `update:data`。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - `graph-data-change` 事件当前依赖 LogicFlow 事件覆盖面；如后续出现漏触发场景，可补充更细颗粒度事件映射回归。
- Next Recommended Unit:
  - Phase 1: 收敛 `showPropertyPanel/config` 的对外契约与运行时行为（实现最小能力或文档废弃声明）。

## [2026-03-02] Session 31 - Document Instance Isolation Strategy with ADR-004

- Refactory Scope:
  - Phase: Phase 1
  - Task: 将已落地的实例隔离策略（`LogicFlowScope` + `useCanvasSettings` scope + `bindLogicFlowScope`）同步到设计文档，消除文档/实现漂移
- In Scope Files:
  - `docs/2design/ComponentArchitecture.md`
  - `docs/2design/ADR-004-instance-isolation.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/**` 运行时代码改动
  - `docs/1management/plan.md` 进度更新
  - Phase 2/3 重构任务
- Decisions:
  - 在 `ComponentArchitecture` 中将“状态隔离策略”从“局部 Pinia”升级为“以 `LogicFlowScope` 为中心的三层隔离（LogicFlow 实例 / CanvasSettings / filesStore 绑定）”。
  - 新增 `ADR-004-instance-isolation`，固化实例边界、模块职责、后续约束，避免后续回退到隐式全局共享状态。
  - 本任务仅做文档对齐，不修改任何运行时代码，保持语义不变。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 对外 Embed API 契约仍有漂移（`update:data` 与 `showPropertyPanel/config`），需在后续原子任务继续收敛。
- Next Recommended Unit:
  - Phase 1: 以最小接线方式补齐嵌入编辑模式 `update:data` 实时触发并新增最小契约测试。

## [2026-03-02] Session 30 - Add Multi-Instance Embed Isolation Regression Coverage

- Refactory Scope:
  - Phase: Phase 1
  - Task: 新增“同页多实例嵌入互不影响”回归测试，覆盖实例状态隔离、画布写入隔离、画布设置隔离
- In Scope Files:
  - `src/__tests__/multi-instance-embed-isolation.test.ts`
  - `src/ts/useStore.ts`
  - `src/App.vue`
  - `src/YysEditorEmbed.vue`
  - `src/components/Toolbar.vue`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `docs/1management/plan.md` 进度更新
  - Phase 2/3 架构拆分与数据模型重构
  - 新业务功能与 UI 扩展
- Decisions:
  - 新增 `multi-instance-embed-isolation` 回归套件，覆盖三类隔离：`activeFileId/fileList`、`switch/save/update` 写入边界、`useCanvasSettings` scope 隔离。
  - 测试实施过程中发现 `useStore` 在 store 初始化阶段无法可靠读取组件注入上下文，导致 scope 绑定不稳定；引入 `filesStore.bindLogicFlowScope(scope)` 显式绑定机制。
  - 在 `App`、`YysEditorEmbed`、`Toolbar` 中补最小接线，确保各实例 store 使用对应 `LogicFlowScope`，避免 `updateTab/setActiveFile` 误读其他实例画布。
  - 保持运行时语义不变：仅增加上下文绑定入口，不改 `setActiveFile/updateTab/importData` 业务流程。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 当前回归覆盖重点在 store/composable 级隔离，后续可按需补充 UI 级（双实例真实挂载交互）端到端回归。
- Next Recommended Unit:
  - Phase 1 收尾：对外文档（ComponentArchitecture）补齐“store scope 显式绑定”说明，避免后续接入方误用。

## [2026-03-02] Session 29 - Scope Canvas Settings State to Editor Instance Context

- Refactory Scope:
  - Phase: Phase 1
  - Task: 将 `useCanvasSettings` 改为实例级作用域状态，并与 `LogicFlowScope` 对齐，消除跨实例设置串扰
- In Scope Files:
  - `src/ts/useCanvasSettings.ts`
  - `src/components/flow/FlowEditor.vue`
  - `src/__tests__/useCanvasSettings.scope.test.ts`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `docs/1management/plan.md` 进度更新
  - 业务功能与 UI 扩展
  - 多实例回归覆盖任务（留在下一原子任务）
- Decisions:
  - `useCanvasSettings` 由模块级共享 `ref` 改为 `Map<LogicFlowScope, CanvasSettingsState>`，每个作用域独立维护 `selectionEnabled/snapGridEnabled/snaplineEnabled`。
  - `useCanvasSettings` 支持可选 `scope` 参数；默认通过 `useLogicFlowScope()` 解析当前编辑器作用域，与 Task 1 的上下文机制对齐。
  - 新增 `destroyCanvasSettingsScope` 并在 `FlowEditor` 卸载时按作用域清理，避免长生命周期页面中的状态残留。
  - 新增 scope 隔离单测，覆盖“同 scope 共享、跨 scope 隔离、销毁后重建恢复默认值”。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 当前仍缺少“同页多实例嵌入”端到端回归覆盖，需要在下一任务补齐跨实例状态/画布操作/画布设置完整回归。
- Next Recommended Unit:
  - Phase 1: 增加多实例隔离回归测试（状态、画布操作、画布设置）并仅做最小必要接线。

## [2026-03-02] Session 28 - Isolate useLogicFlow State by Editor Scope Context

- Refactory Scope:
  - Phase: Phase 1
  - Task: 将 `useLogicFlow` 从模块级单例改为“实例级上下文作用域”，并完成最小接线，避免同页多编辑器实例互相污染
- In Scope Files:
  - `src/ts/useLogicFlow.ts`
  - `src/components/flow/FlowEditor.vue`
  - `src/App.vue`
  - `src/YysEditorEmbed.vue`
  - `src/components/Toolbar.vue`
  - `src/components/flow/ComponentsPanel.vue`
  - `src/components/flow/PropertyPanel.vue`
  - `src/components/flow/panels/AssetSelectorPanel.vue`
  - `src/components/flow/panels/DynamicGroupPanel.vue`
  - `src/components/flow/panels/ImagePanel.vue`
  - `src/components/flow/panels/PropertyRulePanel.vue`
  - `src/components/flow/panels/StylePanel.vue`
  - `src/components/flow/panels/TextPanel.vue`
  - `src/components/flow/panels/VectorPanel.vue`
  - `src/ts/useStore.ts`
  - `src/__tests__/useLogicFlow.scope.test.ts`
  - `src/__tests__/useStore.test.ts`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `docs/1management/plan.md` 进度更新
  - `useCanvasSettings` 实例隔离（留在下一个原子任务）
  - UI/业务功能扩展与 Phase 2/3 重构
- Decisions:
  - 在 `useLogicFlow` 中引入 `LogicFlowScope` 概念，使用 `Map<scope, LogicFlow>` 存储实例，保留 `set/get/destroy` 既有 API 形态并新增可选 `scope` 参数。
  - 新增 `createLogicFlowScope`、`provideLogicFlowScope`、`useLogicFlowScope`，通过 provide/inject 在同一编辑器子树内绑定作用域。
  - `App` 与 `YysEditorEmbed` 分别提供独立 scope，`FlowEditor` 在对应 scope 注册/销毁实例；Toolbar/组件面板/属性面板/store 读取时显式使用同一 scope。
  - 补充 `useLogicFlow` 作用域隔离测试，并调整 `useStore` 相关 mock 以覆盖新增 scope 依赖。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 当前仅隔离 LogicFlow 实例，`useCanvasSettings` 仍是模块共享状态，仍存在多实例设置串扰风险。
- Next Recommended Unit:
  - Phase 1: 将 `useCanvasSettings` 改为实例级状态并与当前 `LogicFlowScope` 对齐。

## [2026-03-02] Session 27 - Enforce Lint Typecheck and Prettier Checks in CI

- Refactory Scope:
  - Phase: Phase 0 / quality gate hardening
  - Task: 在主 workflow 强制执行 `lint + typecheck + prettier --check`，不改业务逻辑
- In Scope Files:
  - `.github/workflows/build-pages.yml`
  - `package.json`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `docs/1management/plan.md` 进度更新
  - 业务实现与状态管理逻辑
  - ESLint 边界规则语义
- Decisions:
  - `package.json` 将 `lint` 调整为“检查模式”（移除 `--fix`），并新增 `lint:fix` 保留本地自动修复能力。
  - `package.json` 新增 `format:check` 脚本：`prettier --check "src/**/*.{js,ts,vue}"`。
  - `.github/workflows/build-pages.yml` 在构建前新增 `Lint`、`Typecheck`、`Prettier Check` 三个强制步骤，任何一步失败都会阻断 build/deploy。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `npm run format:check`: fail（当前基线存在 77 个文件不符合 Prettier）
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 由于已接入 `format:check` 强制闸门，当前分支在 CI 上会被该检查阻断，需后续单独原子任务统一执行 Prettier 对齐并评估差异影响。
- Next Recommended Unit:
  - Phase 0: 执行一次“仅格式化”的原子单元（限定 `src/**/*.{js,ts,vue}`），跑全量回归并单独提交，解除 Prettier gate 阻断。

## [2026-03-02] Session 26 - Add Enumerable Guard for Centralized State Write Boundary Config

- Refactory Scope:
  - Phase: Phase 1
  - Task: 为 `state-write-boundaries.config.js` 增加可枚举边界守卫并补结构探针，防止新增 `*-boundary` 规则绕过集中配置源
- In Scope Files:
  - `eslint-rules/state-write-boundaries.config.js`
  - `src/__tests__/state-write-boundaries.config.test.ts`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `docs/1management/plan.md` 进度更新
  - `src/ts/useStore.ts` 运行时逻辑
  - CI workflow 与脚本治理
- Decisions:
  - 在集中配置中新增 `listStateWriteBoundaryIdentifiers()` 导出，提供边界标识可枚举能力。
  - `createStateWriteBoundaryOptions()` 返回值改为数组/对象浅拷贝，避免规则侧意外修改集中配置原对象。
  - 新增结构探针测试：自动枚举 `eslint-rules/*-boundary.js`，要求规则文件必须引用 `state-write-boundaries.config` 且声明的 `stateIdentifier` 与集中配置枚举列表一一对应。
  - 保持既有边界规则语义不变，不修改 `active-file-id-boundary`/`file-list-boundary` 触发逻辑与文案。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 当前守卫覆盖命名模式为 `*-boundary.js`；若后续规则文件命名脱离该模式，需同步调整探针匹配策略。
- Next Recommended Unit:
  - Phase 0/1 gate: 在 CI 强制执行 `lint + typecheck + prettier --check`，补齐质量闸门。

## [2026-03-02] Session 25 - Fix filesStore Persistence Fallback to Avoid Global localStorage Clear

- Refactory Scope:
  - Phase: Phase 1
  - Task: 修复 `useStore` 持久化异常分支的全局 `localStorage.clear()` 风险，仅清理 `filesStore` 命名空间并补最小防回归守卫
- In Scope Files:
  - `src/ts/useStore.ts`
  - `src/__tests__/useStore.test.ts`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `docs/1management/plan.md` 进度更新
  - ESLint 边界治理（集中配置守卫）
  - CI 质量闸门补齐
- Decisions:
  - 将 `saveStateToLocalStorage` 异常恢复路径由 `localStorage.clear()` 调整为 `clearFilesStoreLocalStorage()`，避免清空非本业务 key。
  - 在 `useStore` 结构测试中新增守卫：禁止出现 `localStorage.clear()`，并要求 `saveStateToLocalStorage` 通过 `clearFilesStoreLocalStorage` 执行命名空间清理。
  - 保持既有运行时语义不变：仅在保存失败时重试写入 `filesStore`，不改动正常保存流程与状态结构。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 当前守卫为结构性测试，未注入“磁盘配额触发”运行时故障模拟；后续可按需补一条故障注入用例验证重试分支行为。
- Next Recommended Unit:
  - Phase 1: 为 `eslint-rules/state-write-boundaries.config.js` 增加“可枚举边界守卫”，防止新增 boundary 规则绕过集中配置源。

## [2026-03-02] Session 24 - Centralize State Write Boundary Mapping Config (No Semantic Change)

- Refactory Scope:
  - Phase: Phase 1
  - Task: 将 `activeFileId` 与 `fileList` 的白名单/运行时禁写入口映射收敛到单一配置源，并让 `active-file-id-boundary` 与 `file-list-boundary` 统一从该配置创建规则
- In Scope Files:
  - `eslint-rules/state-write-boundaries.config.js`
  - `eslint-rules/active-file-id-boundary.js`
  - `eslint-rules/file-list-boundary.js`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/ts/useStore.ts` 运行时逻辑改动
  - `src/App.vue` 与 UI 交互改造
  - 数据结构重设计
  - 新业务功能
  - `docs/1management/plan.md` 进度更新
- Decisions:
  - 新增集中配置 `state-write-boundaries.config.js`，统一维护两个状态字段的 `allowedWriteFunctions` 与 `runtimeEntryFunctions` 映射。
  - `active-file-id-boundary` 与 `file-list-boundary` 改为通过 `createStateWriteBoundaryOptions(...)` 读取同一配置源后传入既有工厂 `createStateWriteBoundaryRule`。
  - 保持 lint 报错文案、白名单集合、运行时禁写集合与规则触发语义完全不变；不改动任何运行时代码。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 当前配置通过状态字段 key（`activeFileId`/`fileList`）查找；后续若新增边界规则，需在同一配置源补齐并保持命名一致。
- Next Recommended Unit:
  - Phase 1: 将集中配置扩展为“可枚举边界清单”并补一条轻量结构守卫，防止新增规则文件绕过集中配置源。

## [2026-03-02] Session 23 - Add fileList Write Boundary Rule via Reusable Factory

- Refactory Scope:
  - Phase: Phase 1
  - Task: 基于已落地 `create-state-write-boundary-rule` 工厂新增并接线 `fileList.value` 写入边界规则（第二个状态字段示例），保持现有语义不变
- In Scope Files:
  - `eslint-rules/file-list-boundary.js`
  - `.eslintrc.cjs`
  - `src/__tests__/useStore.test.ts`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/ts/useStore.ts` 运行时逻辑改动
  - `src/App.vue` 与 UI 交互改造
  - 数据结构重设计
  - 新业务功能
  - `docs/1management/plan.md` 进度更新
- Decisions:
  - 新增 ESLint 本地规则 `file-list-boundary`，复用 `createStateWriteBoundaryRule`，仅约束 `fileList.value = ...` 赋值。
  - 规则白名单写入入口限定为 `importData`、`initializeWithPrompt`、`resetWorkspace`；运行时禁写入口限定为 `setActiveFile`、`addTab`、`removeTab`、`setVisible`、`deleteFile`、`renameFile`。
  - `.eslintrc.cjs` 在 `src/ts/useStore.ts` 覆盖中启用 `file-list-boundary:error`，与 `active-file-id-boundary` 并行生效。
  - 新增结构性防回归测试，校验 `fileList.value` 写入函数集合与运行时入口禁写约束。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
  - `npx eslint eslint-rules/__file_list_boundary_probe__.js --no-eslintrc --rulesdir ./eslint-rules --rule "file-list-boundary:error"`: pass（探针验证语义，预期报错 7 条；白名单写入与 `push/splice` 无报错）
- Risks / Follow-up:
  - 规则当前依赖 `src/ts/useStore.ts` 与函数命名约定；后续若重命名入口函数或状态标识，需要同步更新规则配置与结构守卫测试。
- Next Recommended Unit:
  - Phase 1: 基于同一工厂为第三个高风险状态字段补齐写入边界规则，并将白名单/禁写入口映射集中到单一配置源。

## [2026-03-02] Session 22 - Extract Reusable State Write Boundary Rule Factory (activeFileId first)

- Refactory Scope:
  - Phase: Phase 1
  - Task: 将 `active-file-id-boundary` 抽象为可复用的“状态写入边界规则工厂”，先落地 `activeFileId`，并保持现有语义不变
- In Scope Files:
  - `eslint-rules/active-file-id-boundary.js`
  - `eslint-rules/create-state-write-boundary-rule.js`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/ts/useStore.ts` 运行时逻辑改动
  - `src/App.vue` 与 UI 交互改造
  - 数据结构重设计
  - 新业务功能
  - `docs/1management/plan.md` 进度更新
- Decisions:
  - 提取通用工厂 `createStateWriteBoundaryRule`，复用原有 AST 判定逻辑（函数包围域识别 + 成员赋值识别）。
  - `active-file-id-boundary` 改为工厂配置包装，保留原白名单入口（`switchActiveFile`、`setActiveFileForBootstrap`）、运行时禁写入口（`setActiveFile`、`addTab`、`removeTab`、`setVisible`、`deleteFile`）与报错文案。
  - 不修改运行时代码与测试结构，仅重构静态规则实现结构。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
  - `npx eslint eslint-rules/__boundary_probe__.js --no-eslintrc --rulesdir ./eslint-rules --rule "active-file-id-boundary:error"`: pass（探针验证语义，预期报错 6 条；白名单写入无报错）
- Risks / Follow-up:
  - 工厂文件位于 `eslint-rules/`，若后续新增同目录规则需避免命名冲突并保持配置显式。
- Next Recommended Unit:
  - Phase 1: 在不改变运行时行为前提下，为第二个高风险状态字段接入同一工厂并补最小化探针验证。

## [2026-03-02] Session 21 - Verify activeFileId ESLint Boundary Migration and Keep Semantics Unchanged

- Refactory Scope:
  - Phase: Phase 1
  - Task: 校验并确认 `activeFileId` 写入边界已由独立脚本检查迁移到 ESLint 规则层，且白名单入口与运行时语义保持不变
- In Scope Files:
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/App.vue` 与 UI 交互改造
  - 数据结构重设计
  - 新业务功能
  - `docs/1management/plan.md` 进度更新
- Decisions:
  - 复核现状后确认迁移已落地：本地规则 `active-file-id-boundary` 已接入 lint 流程，独立脚本 `scripts/check-active-file-id-boundary.cjs` 已移除。
  - 保持运行时代码不变：`src/ts/useStore.ts` 仍仅在 `switchActiveFile` 与 `setActiveFileForBootstrap` 写入 `activeFileId.value`。
  - 追加临时 ESLint 探针验证：`setActiveFile` 直写 `activeFileId.value` 会报错，`switchActiveFile` 写入通过。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 规则当前依赖函数名与文件路径约定；若后续重命名 `useStore.ts` 或入口函数名，需要同步更新规则/配置与结构性测试。
- Next Recommended Unit:
  - Phase 1: 将关键状态写入边界规则模板化，评估覆盖 `activeFileId` 以外的高风险状态字段。

## [2026-03-02] Session 20 - Upgrade activeFileId Write Boundary to ESLint Rule Layer

- Refactory Scope:
  - Phase: Phase 1
  - Task: 将 `activeFileId` 写入边界约束从独立脚本检查升级为 ESLint 本地规则层，保持白名单入口与运行时语义不变
- In Scope Files:
  - `.eslintrc.cjs`
  - `eslint-rules/active-file-id-boundary.js`
  - `eslint-rules/package.json`
  - `package.json`
  - `package-lock.json`
  - `scripts/check-active-file-id-boundary.cjs` (removed)
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/App.vue` 与 UI 交互改造
  - 数据结构重设计
  - 新业务功能
  - `docs/1management/plan.md` 进度更新
- Decisions:
  - 新增本地 ESLint 规则 `active-file-id-boundary`，在语法树层面约束 `activeFileId.value` 仅允许由 `switchActiveFile` 与 `setActiveFileForBootstrap` 写入。
  - 对 `src/ts/useStore.ts` 启用 `@typescript-eslint/parser`，并在 `.eslintrc.cjs` 中仅对该文件启用边界规则，避免扩大无关 lint 面。
  - `npm run lint` 改为通过 ESLint 自身执行边界检查（`lint:active-file-boundary`），移除独立脚本 `scripts/check-active-file-id-boundary.cjs`。
  - 保持 `src/ts/useStore.ts` 与运行时行为不变，仅迁移静态约束承载层。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 规则当前绑定 `src/ts/useStore.ts` 路径与 `activeFileId` 标识符命名；若后续重命名文件或状态字段需同步更新 ESLint 规则与配置。
- Next Recommended Unit:
  - Phase 1: 将“关键状态写入边界”抽象为可复用 ESLint 规则模板，并逐步覆盖其他高风险状态字段。

## [2026-03-02] Session 19 - Enforce activeFileId Runtime Write Boundary in Static Check Layer

- Refactory Scope:
  - Phase: Phase 1
  - Task: 在静态检查层新增 `activeFileId` 运行时写入边界约束，禁止运行时路径直接写入，仅允许白名单入口 `switchActiveFile` / `setActiveFileForBootstrap`
- In Scope Files:
  - `package.json`
  - `scripts/check-active-file-id-boundary.cjs`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/App.vue` 与 UI 交互改造
  - 数据结构重设计
  - 新业务功能
  - `docs/1management/plan.md` 进度更新
- Decisions:
  - 新增静态检查脚本 `check-active-file-id-boundary.cjs`，基于 TypeScript AST 校验 `useStore.ts` 中 `activeFileId.value = ...` 的写入函数白名单。
  - 将该检查接入 `npm run lint`，使其在 lint/静态检查阶段即可阻断未来运行时入口（如 `setActiveFile/addTab/removeTab/setVisible/deleteFile`）的直写回归。
  - 保持运行时代码与行为不变，不改动 `src/ts/useStore.ts`。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 当前边界约束针对 `src/ts/useStore.ts` 的 `activeFileId` 写入路径；若未来重命名文件/变量需同步更新该静态检查脚本。
- Next Recommended Unit:
  - Phase 1: 将同类“关键状态写入边界”规则扩展到其他高风险状态字段，并评估统一到 ESLint 自定义规则插件。

## [2026-03-02] Session 18 - Add Anti-Regression Guards for activeFileId Runtime Write Boundary

- Refactory Scope:
  - Phase: Phase 1
  - Task: 为 `useStore` 建立 `activeFileId` 写入边界防回归守卫，确保运行时切换路径不绕过 `switchActiveFile`，初始化/恢复路径保持独立且行为不变
- In Scope Files:
  - `src/__tests__/useStore.test.ts`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/App.vue` 与 UI 交互改造
  - 数据结构重设计
  - 新业务功能
  - `docs/1management/plan.md` 进度更新
- Decisions:
  - 不修改 `useStore.ts` 运行时行为，仅通过测试补强守卫。
  - 新增 AST 结构性测试：约束 `activeFileId.value = ...` 仅允许出现在 `setActiveFileForBootstrap` 与 `switchActiveFile`。
  - 新增结构性调用链测试：`setActiveFile/addTab/removeTab/setVisible` 必须调用 `switchActiveFile`，`deleteFile` 必须通过 `removeTab` 触发切换路径。
  - 补充初始化/恢复优先级回归测试：`activeFileId` 无效时回退 `activeFile(name)`，再回退首文件；并确认 `initializeWithPrompt/importData/resetWorkspace` 不触发 LogicFlow 数据回写。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 当前“写入边界”守卫基于源码结构（符号命名与调用关系）；后续若发生重命名需同步更新测试。
- Next Recommended Unit:
  - Phase 1: 在 lint/静态规则层增加 `activeFileId` 运行时直写禁令（仅允许白名单函数写入），将当前测试守卫前移到开发期。

## [2026-03-02] Session 17 - Clarify activeFileId Write Boundary Between Runtime Switch and Bootstrap Paths

- Refactory Scope:
  - Phase: Phase 1
  - Task: 收敛并明确 `useStore` 中 `activeFileId` 写入边界：运行时切换路径只通过统一入口 `switchActiveFile`，初始化/恢复路径与运行时职责分离并保持行为不变
- In Scope Files:
  - `src/ts/useStore.ts`
  - `src/__tests__/useStore.test.ts`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/App.vue` 与 UI 交互改造
  - 数据结构重设计
  - `docs/1management/plan.md` 进度更新
- Decisions:
  - 在 `useStore` 新增初始化/恢复专用入口 `setActiveFileForBootstrap`，用于 `importData / initializeWithPrompt / resetWorkspace` 的 `activeFileId` 设置，避免引入运行时切换副作用。
  - 提炼 `resolvePreferredActiveId`，统一恢复优先级（`activeFileId` > `activeFile(name)` > 首文件），保持历史行为不变。
  - 保留并明确注释 `switchActiveFile` 为运行时唯一切换入口；运行时相关路径继续通过该入口切换活动文件。
  - 增补测试断言初始化默认、localStorage 恢复、导入、重置路径不触发 LogicFlow 数据回写；保留并复用既有切换单测覆盖“单次保存 + 不串写”。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 运行时“只通过统一入口”的约束当前是代码约定 + 测试行为约束，尚未引入静态限制（例如禁止直接写 `activeFileId` 的 lint 规则）。
- Next Recommended Unit:
  - Phase 1: 增加针对 `useStore` 的结构性防回归测试（覆盖所有运行时入口对 `switchActiveFile` 的行为契约），并评估引入轻量静态约束防止未来直接写 `activeFileId`。

## [2026-03-02] Session 16 - Extract switchActiveFile and Converge Active-File Switching Paths

- Refactory Scope:
  - Phase: Phase 1
  - Task: 提炼并收敛 `useStore` 内部统一活动文件切换入口 `switchActiveFile`，统一 `addTab / setVisible / deleteFile / removeTab` 的切换写法，消除散落 `activeFileId` 写路径并保持无重复保存与无串写
- In Scope Files:
  - `src/ts/useStore.ts`
  - `src/__tests__/useStore.test.ts`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/App.vue` 与 UI 交互改造
  - 数据结构设计调整
  - `docs/1management/plan.md` 进度更新
- Decisions:
  - 在 `useStore` 新增内部 `switchActiveFile(nextActiveId, options)`，封装切换、来源文件保存与必要持久化。
  - `addTab / removeTab / setVisible(隐藏活动文件分支) / setActiveFile` 改为统一调用 `switchActiveFile`，移除这些路径中直接写 `activeFileId` 的散落语句。
  - `setVisible` 隐藏活动文件切换时改为“先切换目标，再显式 `updateTab(sourceId)`”的一次性路径，避免重复保存和来源歧义。
  - 新增回归测试覆盖 `addTab` 与 `removeTab` 切换场景，补齐四类操作（`addTab / setVisible / deleteFile / removeTab`）的切换保存次数与 `graphRawData` 防串写断言。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - `addTab` 仍保持“先保存旧文件、切换新文件不额外落盘”的既有策略；如需“新增后立即持久化新 active 选择”需独立原子单元评估。
- Next Recommended Unit:
  - Phase 1: 审计 `useStore` 其余 `activeFileId` 直接写入点（初始化/恢复路径除外）并评估是否继续收敛为统一入口。

## [2026-03-02] Session 15 - Converge App/useStore Save Boundary on Active File Switch

- Refactory Scope:
  - Phase: Phase 1
  - Task: 收敛 `App.vue` 与 `useStore` 的保存职责边界，统一“切换活动文件时谁负责保存旧文件”，消除重复保存路径并保持不发生跨文件 `graphRawData` 串写
- In Scope Files:
  - `src/App.vue`
  - `src/ts/useStore.ts`
  - `src/__tests__/useStore.test.ts`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - 其他组件/模块重构
  - UI 交互改版
  - `docs/1management/plan.md` 进度更新
- Decisions:
  - 将活动文件切换时的“保存旧文件”职责收敛到 store：`setActiveFile` 在切换后显式 `updateTab(previousId)`。
  - `App.vue` 中 `activeFileId` 监听不再执行 `updateTab(oldId)`，仅负责渲染新活动文件数据。
  - `el-tabs` 的 `v-model` 改为通过 `activeFileModel` 调用 `filesStore.setActiveFile(...)`，避免直接写 `activeFileId`。
  - 新增回归断言：切换活动文件只触发一次保存路径，且目标文件 `graphRawData` 不被来源串写。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - store 内仍存在少量直接写 `activeFileId` 的路径（如删除/隐藏等分支中的特定切换场景），当前行为安全但尚未完全统一为单一切换入口。
- Next Recommended Unit:
  - Phase 1: 提炼统一的 `switchActiveFile` 内部入口，收敛 `addTab/setVisible/deleteFile/removeTab` 的活动文件切换写法并补回归测试。

## [2026-03-02] Session 14 - Converge Save-Source Binding After Hiding/Deleting Active File

- Refactory Scope:
  - Phase: Phase 0/P1 bridge
  - Task: 收敛“删除/隐藏活动文件”后的保存来源绑定策略，避免 `activeFile` 切换后从错误来源同步 `graphRawData`
- In Scope Files:
  - `src/ts/useStore.ts`
  - `src/__tests__/useStore.test.ts`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/**` 其他状态管理与组件重构
  - UI/交互改动
  - `docs/1management/plan.md` 进度更新
- Decisions:
  - `setVisible` 在“隐藏活动文件”分支改为先 `updateTab(targetId)`，显式将当前画布保存回来源文件，再切换 `activeFileId` 并 `persistState()`。
  - `deleteFile` 删除 `updateTab(activeFileId)` 路径，改为删除后仅 `persistState()`，避免把当前画布误写到新的活动文件。
  - 新增回归测试覆盖“隐藏活动文件”和“删除活动文件”后的跨文件串写防护。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - `App.vue` 的 `activeFileId` 监听仍会在切换时调用 `updateTab(oldId)`，当前不会导致跨文件串写，但会产生重复保存；可在后续原子单元继续收敛。
- Next Recommended Unit:
  - Phase 1: 收敛 `App.vue` 切换监听与 store 保存职责边界（避免重复保存，统一“谁负责保存旧文件”）。

## [2026-03-02] Session 13 - Fix Cross-File Overwrite Risk for Non-Active File Operations

- Refactory Scope:
  - Phase: Phase 0/P1 bridge
  - Task: 修复 `setVisible` / `renameFile` / `deleteFile` 在非活动文件操作时的潜在串写风险（避免将当前画布数据写入非活动目标文件）
- In Scope Files:
  - `src/ts/useStore.ts`
  - `src/__tests__/useStore.test.ts`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - 其他 store/组件重构
  - UI/交互改动
  - `docs/1management/plan.md` 进度更新
- Decisions:
  - 抽取 `persistState()` 作为“仅持久化不做画布同步”的路径。
  - `setVisible` / `renameFile`：当目标文件非活动时仅更新元数据并 `persistState()`，不再触发 `updateTab(targetId)`。
  - `deleteFile`：当删除目标为非活动文件时，仅删除并 `persistState()`，不触发画布同步。
  - 保持目标为活动文件时的原有 `updateTab(...)` 行为，避免扩大本次原子单元范围。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - 当前 `deleteFile` 在“删除活动文件”分支仍会在 `removeTab` 后执行 `updateTab(activeFileId)`；是否需要进一步收敛为“显式保存来源文件”应作为独立原子单元评估。
- Next Recommended Unit:
  - Phase 1: 审计并收敛“活动文件删除/隐藏后的保存来源绑定”策略，避免切换时来源文件不明确。

## [2026-03-02] Session 12 - Fix Cross-File Overwrite Risk on Active File Switch

- Refactory Scope:
  - Phase: Phase 0/P1 bridge
  - Task: 修复 `setActiveFile -> updateTab(targetId)` 导致切换时可能将当前画布写入目标文件的问题，并补回归测试
- In Scope Files:
  - `src/ts/useStore.ts`
  - `src/__tests__/useStore.test.ts`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/**` 其他状态管理重构
  - UI/交互层改动
  - `docs/1management/plan.md` 进度更新
- Decisions:
  - `setActiveFile` 调整为“仅切换 activeFileId，不做目标文件写入”，并增加“切换到同一文件直接返回”保护。
  - 新增单测覆盖“切换到目标文件后，目标文件 graphRawData 不被当前画布数据串写”。
- Checks:
  - `npm test`: pass
  - `npm run lint`: pass
  - `npm run typecheck`: pass
  - `prettier --check`: not-run
  - `npm run build:lib`: not-run
- Risks / Follow-up:
  - `setVisible` / `renameFile` 当前仍通过 `updateTab(targetId)` 落盘；若操作非当前激活文件，仍存在同类跨文件写入风险，需要独立原子单元处理。
- Next Recommended Unit:
  - Phase 0/P1 bridge: 审计并修复 `setVisible` / `renameFile` / `deleteFile` 对非活动文件调用 `updateTab(targetId)` 的潜在串写路径，并补针对性回归测试。

## [2026-03-02] Session 11 - Refactory Plan Refresh (Status + Risk + DoD Tightening)

- Refactory Scope:
  - Phase: Governance refresh
  - Task: 更新 `Refactory.md`，补充当前执行状态、已知高风险、质量闸门强度和 DoD 约束
- In Scope Files:
  - `docs/2design/Refactory.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/**` 业务代码修改
  - CI/workflow 实际实现改动
  - `docs/1management/plan.md` 进度数字调整
- Decisions:
  - 将 Phase 0 状态改为“部分完成”，并显式列出已完成/未完成项。
  - 将“文件切换误写目标文件数据”提升为 Refactory 风险条目并加入建议提交顺序。
  - 将 lint 目标从“可执行”升级为“可约束”（需要明确规则集）。
  - 将 compat 类型声明视为过渡债务，要求设退出计划。
  - 在 DoD 中加入 session log 与基线文档一致性要求。
- Checks:
  - `docs diff`: pass (`Refactory.md` 仅新增治理信息，无代码行为变更)
  - `npm test`: not-run (docs-only session)
  - `npm run lint`: not-run (docs-only session)
  - `npm run typecheck`: not-run (docs-only session)
  - `prettier --check`: not-run (docs-only session)
  - `npm run build:lib`: not-run (docs-only session)
- Risks / Follow-up:
  - Refactory 计划已更新，但对应的代码修复和 CI 补齐尚未执行，需要尽快进入下一原子单元。
- Next Recommended Unit:
  - Phase 0/P1 bridge: 修复 `setActiveFile -> updateTab(targetId)` 造成的文件切换误写风险，并补回归测试。

## [2026-03-02] Session 10 - Phase 0 Typecheck Baseline Batch 5 (Yys Import Typing + YysRank API Alignment + useSafeI18n Rest Inference)

- Refactory Scope:
  - Phase: Phase 0
  - Task: typecheck 基线收敛第五批：Yys 导入结果类型收窄、YysRank store API 对齐、useSafeI18n rest 参数推断
- In Scope Files:
  - `src/components/Yys.vue`
  - `src/components/YysRank.vue`
  - `src/ts/useSafeI18n.ts`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/**` 其他业务逻辑重构
  - LogicFlow 兼容声明层（`src/types/logicflow-*.d.ts`）
  - CI 其他子任务
  - `docs/1management/plan.md` 进度数字更新
- Decisions:
  - In `Yys.vue/importGroups`, narrow `FileReader` result to `string`, validate imported payload as array, and replace `groups` via in-place `splice` to satisfy readonly props contract.
  - In `YysRank.vue`, add missing `removeGroupElement(positionIndex)` handler so template invocation matches current list mutation API and avoids unresolved setup binding.
  - In `useSafeI18n.ts`, infer translation rest-argument element types from `useI18n().t` parameters and switch to arity-based invocation (`t(key)` / `t(key, arg1)` / `t(key, arg1, arg2)`) to avoid spread tuple mismatch while keeping one-arg call sites compatible.
- Checks:
  - `npm run typecheck`: pass (first run surfaced 4 scoped errors in `Yys.vue`/`YysRank.vue`/`useSafeI18n.ts`; final run all clear)
  - `npm test`: not-run (out of current atomic unit)
  - `npm run lint`: not-run (out of current atomic unit)
  - `prettier --check`: not-run (out of current atomic unit)
  - `npm run build:lib`: not-run (out of current atomic unit)
- Risks / Follow-up:
  - `YysRank.vue` 当前删除行为为静默本地删除（保留至少 1 项），未引入确认弹窗/消息提示；如需与 `Yys.vue` 完全一致可在后续 UX 对齐单元统一处理。
- Next Recommended Unit:
  - Phase 0 / 类型收敛补强：聚焦 `src/components/flow/nodes/yys/**` 与 `Toolbar.vue` 的 i18n 参数契约细化（在不改变运行行为前提下收窄 `t` 调用参数类型）。

## [2026-03-02] Session 9 - Phase 0 Typecheck Baseline Batch 4 (Non-LogicFlow Remaining Types Convergence)

- Refactory Scope:
  - Phase: Phase 0
  - Task: typecheck 基线收敛第四批：非 LogicFlow 剩余类型收敛（`AssetSelectorNode` 样式类型、`PropertySelectNode` 字段推断、规则配置类型契约）
- In Scope Files:
  - `src/components/flow/nodes/common/AssetSelectorNode.vue`
  - `src/components/flow/nodes/yys/PropertySelectNode.vue`
  - `src/utils/groupRulesConfigSource.ts`
  - `src/components/Toolbar.vue`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/**` 其他业务逻辑重构
  - LogicFlow 兼容声明层（`src/types/logicflow-*.d.ts`）
  - CI 其他子任务
  - `docs/1management/plan.md` 进度数字更新
- Decisions:
  - In `AssetSelectorNode`, type merged style as `CSSProperties` to satisfy Vue `:style` contract without runtime change.
  - In `PropertySelectNode`, introduce `PropertyNodeData` and `normalizeProperty` to make `value/description` access type-safe while preserving permissive payload fields.
  - In `groupRulesConfigSource` and `Toolbar`, normalize rule map/filter intermediate typing to `ExpressionRuleDefinition | null`, and normalize severity with union-safe helper to align with `ExpressionRuleDefinition` contract.
  - In `Toolbar`, constrain snapshot result typing to `string | { data?: string }` before reading `.data`.
- Checks:
  - `npm run typecheck`: fail (in-scope errors resolved; remaining out-of-scope errors: `src/components/Yys.vue`, `src/components/YysRank.vue`, `src/ts/useSafeI18n.ts`)
  - `npm test`: not-run (out of current atomic unit)
  - `npm run lint`: not-run (out of current atomic unit)
  - `prettier --check`: not-run (out of current atomic unit)
  - `npm run build:lib`: not-run (out of current atomic unit)
- Risks / Follow-up:
  - `PropertySelectNode` now uses a normalized permissive shape with index signature; later schema-tightening should centralize a shared property payload type to avoid local duplication.
  - Typecheck baseline is still non-green due out-of-scope modules.
- Next Recommended Unit:
  - Phase 0 / typecheck 基线收敛第五批：处理 `Yys.vue` 导入结果类型收窄、`YysRank.vue` store API 对齐、`useSafeI18n.ts` rest 参数推断。

## [2026-03-02] Session 8 - Phase 0 Typecheck Baseline Batch 3 (Non-LogicFlow Deterministic Typing Fixes)

- Refactory Scope:
  - Phase: Phase 0
  - Task: typecheck 基线收敛第三批：修复非 LogicFlow 的确定性类型错误（`FlowEditor` 语法残留、`nodeStyle` 导出契约、`ProjectExplorer` store API 对齐）
- In Scope Files:
  - `src/components/flow/FlowEditor.vue`
  - `src/ts/nodeStyle.ts`
  - `src/components/ProjectExplorer.vue`
  - `src/ts/useStore.ts`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - LogicFlow 兼容声明层（`src/types/logicflow-*.d.ts`）进一步调整
  - CI 其他子任务
  - `docs/1management/plan.md` 进度数字更新
- Decisions:
  - Remove stray token in `FlowEditor.vue` (`return;t` -> `return;`) to eliminate deterministic TS parser/name error without behavior change.
  - Normalize `nodeStyle` radius fallback typing and re-export `NodeStyle` from `src/ts/nodeStyle.ts` to satisfy existing import contract in `StylePanel` / `useNodeAppearance`.
  - Keep `ProjectExplorer` call sites unchanged by adding backward-compatible file operations in files store (`setActiveFile`, `setVisible`, `deleteFile`, `renameFile`), and remove macro import conflicts in `ProjectExplorer.vue`.
- Checks:
  - `npm run typecheck`: fail (scoped target errors resolved; remaining failures are in other modules: `AssetSelectorNode`, `PropertySelectNode`, `Toolbar`, `Yys`, `YysRank`, `useSafeI18n`, `groupRulesConfigSource`)
  - `npm test`: not-run (out of current atomic unit)
  - `npm run lint`: not-run (out of current atomic unit)
  - `prettier --check`: not-run (out of current atomic unit)
  - `npm run build:lib`: not-run (out of current atomic unit)
- Risks / Follow-up:
  - Added store compatibility methods mutate existing file entries by id/name; behavior is backward-compatible but should be consolidated into a single file-management API in a later refactor pass.
  - Typecheck remains non-green due unrelated typing debt outside this unit.
- Next Recommended Unit:
  - Phase 0 / typecheck 基线收敛第四批：处理 `AssetSelectorNode` 样式类型、`PropertySelectNode` 字段推断、`groupRulesConfigSource` 与 `Toolbar` 的规则类型契约。

## [2026-03-02] Session 7 - Phase 0 Typecheck Baseline Batch 2 (LogicFlow Type Compatibility)

- Refactory Scope:
  - Phase: Phase 0
  - Task: typecheck 基线收敛第二批：LogicFlow 相关类型适配（导出类型、插件扩展 API、节点模型签名兼容）
- In Scope Files:
  - `tsconfig.json`
  - `src/types/logicflow-core-compat.d.ts`
  - `src/types/logicflow-extension-compat.d.ts`
  - `src/types/logicflow-vue-node-registry-compat.d.ts`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/**` 业务逻辑重构（仅类型层兼容）
  - CI 其他子任务
  - `docs/1management/plan.md` 进度数字更新
- Decisions:
  - Add a dedicated LogicFlow compatibility declaration layer in `src/types` and route `@logicflow/core`, `@logicflow/extension`, `@logicflow/vue-node-registry` type resolution to local shims via `tsconfig.json` paths.
  - Keep runtime imports and behavior unchanged; only relax/normalize typing contracts for current codebase compatibility:
    - re-export and normalize commonly used `@logicflow/core` data/model types,
    - widen extension menu plugin surface typing (`addMenuConfig`, `setMenuByType`),
    - loosen vue-node-registry `register` config typing for optional `component/model`.
  - Tune node/data signatures in compat declarations to match existing usage patterns (for example `addNode` without pre-supplied `id`, node model `resize(deltaX, deltaY)` override compatibility).
- Checks:
  - `npm run typecheck`: fail (LogicFlow-related type errors removed from baseline; remaining failures are non-LogicFlow issues such as `FlowEditor.vue` stray token `t`, nodeStyle/export/store/i18n typing drifts)
  - `npm test`: not-run (out of current atomic unit)
  - `npm run lint`: not-run (out of current atomic unit)
  - `prettier --check`: not-run (out of current atomic unit)
  - `npm run build:lib`: not-run (out of current atomic unit)
- Risks / Follow-up:
  - LogicFlow type compatibility now depends on local shim declarations; when upgrading LogicFlow major/minor versions, these shims should be reviewed together with runtime API changes.
  - Typecheck is still non-green due unrelated non-LogicFlow debt.
- Next Recommended Unit:
  - Phase 0 / typecheck 基线收敛第三批：修复非 LogicFlow 的确定性类型错误（优先 `FlowEditor.vue` 语法残留、`nodeStyle` 导出契约、`ProjectExplorer` store API 对齐）。

## [2026-03-02] Session 6 - Phase 0 Typecheck Baseline Batch 1 (Declarations + Test Env Types)

- Refactory Scope:
  - Phase: Phase 0
  - Task: typecheck 基线收敛第一批：补齐声明与测试环境类型（最小铺垫）
- In Scope Files:
  - `tsconfig.json`
  - `src/types/global.d.ts`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/**` 业务逻辑重构
  - CI 其他子任务
  - `docs/1management/plan.md` 进度数字更新
- Decisions:
  - Extend tsconfig type environment with `vitest/globals` and raise `lib` to `ES2021` to cover test globals and `replaceAll` typing.
  - Add a dedicated `src/types/global.d.ts` for minimal baseline declarations: `*.vue` module shim, `NodeJS.Timeout` fallback typing, and shared `FlowFile` global interface used by schema typing.
  - Keep all implementation files unchanged; only declaration/environment setup is included in this unit.
- Checks:
  - `npm run typecheck`: fail (improved baseline; test globals/missing module declarations/FlowFile/replaceAll related errors cleared, remaining failures are business/library typing mismatches in `src/**`)
  - `npm test`: not-run (out of current atomic unit)
  - `npm run lint`: not-run (out of current atomic unit)
  - `prettier --check`: not-run (out of current atomic unit)
  - `npm run build:lib`: not-run (out of current atomic unit)
- Risks / Follow-up:
  - Remaining type errors are now concentrated in LogicFlow API type mismatches, component prop/inference issues, and store contract drifts; these require scoped source-level typing fixes in later units.
- Next Recommended Unit:
  - Phase 0 / typecheck 基线收敛第二批：聚焦 `LogicFlow` 相关类型适配（`@logicflow/core` 导出类型与节点模型签名）并保持单元最小化。

## [2026-03-02] Session 5 - Phase 0 Add and Validate Typecheck Script (vue-tsc --noEmit)

- Refactory Scope:
  - Phase: Phase 0
  - Task: 4.0.2-2 新增并验证 typecheck 脚本（`vue-tsc --noEmit`）
- In Scope Files:
  - `package.json`
  - `tsconfig.json`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/**`
  - CI 其他子任务
  - `docs/1management/plan.md` 进度数字更新
- Decisions:
  - Add `typecheck` script in `package.json` with exact command `vue-tsc --noEmit`.
  - Add `typescript` and `vue-tsc` to `devDependencies` so the script is executable in local repo baseline.
  - Add minimal root `tsconfig.json` because repository baseline had no `tsconfig*.json`, which blocks `vue-tsc` startup.
  - Keep scope limited to script executability; do not fix existing source typing issues in this unit.
- Checks:
  - `npm run typecheck`: fail (command executes successfully, then reports existing baseline type errors in `src/**`)
  - `npm test`: not-run (out of current atomic unit)
  - `npm run lint`: not-run (out of current atomic unit)
  - `prettier --check`: not-run (out of current atomic unit)
  - `npm run build:lib`: not-run (out of current atomic unit)
- Risks / Follow-up:
  - Typecheck is now wired but currently non-green due existing repository type debt (Vue/LogicFlow typing mismatches, missing declarations, and test globals typing).
- Next Recommended Unit:
  - Phase 0 (follow-up): establish a scoped typecheck-baseline remediation unit (start with declaration/test-env typing and missing module references) to move `npm run typecheck` toward pass.

## [2026-03-02] Session 4 - Phase 0 Enable Executable ESLint Config with Vue Parsing

- Refactory Scope:
  - Phase: Phase 0
  - Task: 4.0.2-1 补齐并验证 ESLint 可执行配置（含 `.vue` 解析）
- In Scope Files:
  - `.eslintrc.cjs`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/**`
  - typecheck/CI 其他子任务
  - `docs/1management/plan.md` 进度数字更新
- Decisions:
  - Add a minimal root ESLint config to make `npm run lint` executable for this repository baseline.
  - Use `vue-eslint-parser` for `.vue` files and set `parserOptions.parser = false` to avoid blocking on mixed script syntax in current `.vue` sources during this atomic unit.
  - Keep this unit focused on executability and `.vue` file handling only, without introducing rule hardening.
- Checks:
  - `npm run lint`: pass
  - `npm test`: not-run (out of current atomic unit)
  - `npm run typecheck`: not-run (out of current atomic unit)
  - `prettier --check`: not-run (out of current atomic unit)
  - `npm run build:lib`: not-run (out of current atomic unit)
- Risks / Follow-up:
  - Current `.vue` script blocks are not deeply linted yet; a follow-up unit should add TypeScript-aware parsing/rules with explicit dependency alignment.
- Next Recommended Unit:
  - Phase 0, task 4.0.2-2: 新增并验证 `typecheck` 脚本（`vue-tsc --noEmit`）并确认与现有代码基线兼容。

## [2026-03-02] Session 3 - Phase 0 Align Status/Priority Between plan.md and next.md

- Refactory Scope:
  - Phase: Phase 0
  - Task: 4.0.1-4 对齐 `plan.md` 与 `next.md` 的状态与优先级一致性
- In Scope Files:
  - `docs/1management/plan.md`
  - `docs/1management/next.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/**`
  - CI/workflow/package.json changes
  - `docs/2design/**` edits
  - `plan.md` 进度数字更新
- Decisions:
  - Use `plan.md` as the single source of truth for current phase status/priority and update only conflicting parts in `next.md`.
  - Replace outdated priorities in `next.md` with remaining work items that are explicitly marked as in-progress/todo in `plan.md`.
  - Keep this session docs-only and avoid unrelated wording cleanup.
- Checks:
  - `git diff -- docs/1management/next.md`: pass (only status/priority section changed in `next.md`)
  - `rg -n "阶段 3 进行中|优化加载性能|文档完善|Notion 块体验" docs/1management/next.md`: pass
  - `legacy-priority-strings check`: pass (`撤销重做系统` / `textNode 富文本编辑` / `矢量节点 MVP、导出增强` no longer present)
  - `npm test`: not-run (docs-only session)
  - `npm run lint`: not-run (docs-only session)
  - `npm run typecheck`: not-run (docs-only session)
  - `prettier --check`: not-run (docs-only session)
  - `npm run build:lib`: not-run (docs-only session)
- Risks / Follow-up:
  - `plan.md` currently has no dedicated "下一步行动计划" section; `next.md` now aligns to existing phase/milestone status and remaining items only.
- Next Recommended Unit:
  - Phase 0, task 4.0.2-1: 补齐并验证 ESLint 可执行配置（含 `.vue` 解析）。

## [2026-03-02] Session 2 - Phase 0 Naming Drift Cleanup in Management Docs

- Refactory Scope:
  - Phase: Phase 0
  - Task: 文档命名漂移清理（管理文档）
- In Scope Files:
  - `docs/1management/plan.md`
  - `docs/1management/next.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - `src/**`
  - CI/workflow/package.json changes
  - `docs/2design/**` edits
  - `plan.md` progress number changes
- Decisions:
  - Normalize project naming to `onmyoji-flow` and package naming to `@rookie4show/onmyoji-flow` only within this atomic unit.
  - Keep component symbol names (for example `YysEditorEmbed`) unchanged to avoid API drift outside this scope.
  - Keep this session docs-only and avoid any implementation refactor.
- Checks:
  - `rg -n "yys-editor" docs/1management/plan.md docs/1management/next.md`: pass (no stale project/package naming remains)
  - `git diff -- docs/1management/plan.md docs/1management/next.md docs/1management/refactory-session-log.md`: pass (changes constrained to in-scope files)
  - `npm test`: not-run (docs-only session)
  - `npm run lint`: not-run (docs-only session)
  - `npm run typecheck`: not-run (docs-only session)
  - `prettier --check`: not-run (docs-only session)
  - `npm run build:lib`: not-run (docs-only session)
- Risks / Follow-up:
  - `plan.md` still includes historical class/symbol names prefixed with `YysEditor*`; these were intentionally preserved because they refer to concrete component APIs.
  - `plan.md` and `next.md` priority/status alignment still needs a dedicated consistency unit.
- Next Recommended Unit:
  - Phase 0, task 4.0.1-4: align status/priority consistency between `docs/1management/plan.md` and `docs/1management/next.md`.

## [2026-03-02] Session 1 - Create Project Baseline Document

- Refactory Scope:
  - Phase: Phase 0
  - Task: 4.0.1-1 establish `docs/1management/project-baseline.md`
- In Scope Files:
  - `docs/1management/project-baseline.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - Any `src/` refactor
  - `plan.md`/`next.md` status alignment updates
  - CI workflow edits
  - Broad historical naming replacement
- Decisions:
  - Use `onmyoji-flow` and `@rookie4show/onmyoji-flow` as canonical identifiers in baseline doc.
  - Record current branch convention and workflow trigger branch side by side to avoid hidden drift.
  - Keep this session docs-only as a single atomic unit.
- Checks:
  - `npm test`: not-run (docs-only session)
  - `npm run lint`: not-run (docs-only session)
  - `npm run typecheck`: not-run (`typecheck` script not yet defined; docs-only session)
  - `prettier --check`: not-run (docs-only session)
  - `npm run build:lib`: not-run (docs-only session)
- Risks / Follow-up:
  - `plan.md` still contains historical legacy naming drift and needs a dedicated naming-alignment unit.
  - Branch convention (`develop`) and workflow trigger (`master`) remain inconsistent and need governance alignment.
- Next Recommended Unit:
  - Phase 0, task: naming drift cleanup in `docs/1management/plan.md` and `docs/1management/next.md` (scope-limited docs refactor).

## [2026-03-02] Session 0 - Initialize Refactory Cross-Session Constraints

- Refactory Scope:
  - Phase: Governance bootstrap
  - Task: Add Codex cross-session consistency rules and handoff log mechanism
- In Scope Files:
  - `AGENTS.md`
  - `docs/1management/refactory-session-log.md`
- Out of Scope:
  - Source code refactor in `src/`
  - CI/tooling implementation changes
- Decisions:
  - Enforce one atomic refactor unit per session.
  - Require mandatory handoff log update for each refactor session.
  - Require first-response scope contract in future refactor sessions.
- Checks:
  - `npm test`: not-run (docs-only change)
  - `npm run lint`: not-run (docs-only change)
  - `npm run typecheck`: not-run (docs-only change)
  - `prettier --check`: not-run (docs-only change)
  - `npm run build:lib`: not-run (docs-only change)
- Risks / Follow-up:
  - Other tools (Cursor/Claude) will still need mirrored rule files to get equivalent behavior.
- Next Recommended Unit:
  - Phase 0, task: create `project-baseline.md` and align naming/link drift in docs.
