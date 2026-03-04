# Refactory 修复条目清单（执行版）

更新时间：2026-03-04  
适用范围：`onmyoji-flow` Refactory 后续修复执行（按原子单元推进）

## 1. 文档目的

本清单用于把以下两类来源收敛为可执行条目：

1. 设计主线：[`docs/2design/Refactory.md`](../2design/Refactory.md)
2. 会话沉淀：[`docs/1management/refactory-session-log.md`](./refactory-session-log.md) 中各 Session 的 `Next Recommended Unit`

执行原则：

1. 一次会话只处理一个原子条目。
2. 每完成一个条目，必须回写 `refactory-session-log.md`。
3. 未完成条目不跨阶段“跳过式并行”。

---

## 2. 状态说明

- `[ ]` 未开始
- `[~]` 进行中
- `[x]` 已完成

---

## 3. 修复条目（按优先级）

### High

- [x] **RFX-001（P0）恢复 lint gate 可执行稳定**
  - 目标：修复本地/CI 中 `npm run lint` 的解析器与依赖一致性问题，恢复 lint 作为硬闸门。
  - 主要文件：`package.json`、`package-lock.json`、`.eslintrc.cjs`、CI workflow
  - 来源：
    - `Refactory.md` 4.0.2-1 / 4.0.2-3
    - `Refactory.md` 3.1 “未完成项（CI 质量闸门）”
  - 验收：`npm run lint` 本地稳定通过，CI 必检通过。

- [x] **RFX-002（P0）执行一次仅格式化收敛单元**
  - 目标：清理当前 `prettier --check` 阻断项，恢复格式闸门。
  - 主要文件：`src/**/*.{js,ts,vue}`
  - 来源：
    - Session 27 `Next Recommended Unit`（仅格式化原子单元）
    - `Refactory.md` 4.0.2-3 / 5（文档与工程同步）
  - 验收：`npm run format:check` 通过，提交范围仅格式化。

- [ ] **RFX-003（P0）文档基线指标刷新**
  - 目标：刷新体积、命令、版本、完成度等陈旧指标，消除文档事实漂移。
  - 主要文件：`docs/1management/plan.md`、`docs/3build/*`、`README.md`（按实际需要）
  - 来源：
    - `Refactory.md` 2.1-5、3.1“文档指标陈旧”
    - `Refactory.md` 第 5 章文档维护总清单
  - 验收：文档中的构建产物、脚本、体积、状态与当前仓库一致。

- [ ] **RFX-004（P0/2 bridge）测试噪声 stub 参数化收敛**
  - 目标：对三份 Toolbar 大测试做噪声 stub 抽取/参数化，降低维护成本（不改语义）。
  - 主要文件：
    - `src/__tests__/useToolbarImportExportCommands.test.ts`
    - `src/__tests__/toolbar-wiring.regression.test.ts`
    - `src/__tests__/toolbar-architecture.guard.test.ts`
  - 来源：Session 113 `Next Recommended Unit`
  - 验收：相关测试通过，重复 stub 显著减少，断言语义不变。

### Medium

- [ ] **RFX-005（P0）仓库卫生清理**
  - 目标：清理 `.bak`、无引用旧实现、历史杂质，降低误用风险。
  - 主要文件：`src/**`（仅确认无引用后再删）、根目录杂质文件
  - 来源：`Refactory.md` 2.2-6 / 4.0.2-4 / 第 6 章
  - 验收：删除前有引用审计；删除后 test/typecheck 不回归。

- [ ] **RFX-006（P0）ESLint 规则强度治理**
  - 目标：从“可执行”提升到“可约束”，补齐核心规则集与关键反模式约束。
  - 主要文件：`.eslintrc.cjs`、`eslint-rules/*`
  - 来源：`Refactory.md` 3.1 未完成项、4.0.2-5、8-6 风险缓解
  - 验收：规则清单明确，关键反模式（高风险直写/未清理监听等）可被静态发现。

- [ ] **RFX-007（P2）FlowEditor/Toolbar 第一轮职责拆分**
  - 目标：按“命令层/编排层/UI 层”进行第一轮模块拆分，降低超大组件复杂度。
  - 主要文件：`src/components/flow/FlowEditor.vue`、`src/components/Toolbar.vue` 及其 composables
  - 来源：`Refactory.md` 4.2.2-1 / 4.2.2-2
  - 验收：组件体量下降，边界文档同步，关键路径回归测试通过。

- [ ] **RFX-008（P0）compat 类型声明退出计划**
  - 目标：给 `src/types/logicflow-*-compat.d.ts` 建立分阶段退出与替代策略。
  - 主要文件：`src/types/logicflow-*.d.ts`、`docs/2design/*`（如需新增 ADR）
  - 来源：`Refactory.md` 4.0.2-6、8-5 风险缓解
  - 验收：有明确“何时删、如何替换、何处验收”的计划与里程碑。

### Low

- [ ] **RFX-009（P1）图层字段语义统一（`meta.z` vs `zIndex`）**
  - 目标：统一单一语义字段并给出迁移策略（含 ADR）。
  - 主要文件：`docs/2design/DataModel.md`、`src/ts/schema.ts`、相关迁移逻辑
  - 来源：`Refactory.md` 2.3-1、4.1.1-2
  - 验收：文档/类型/运行时语义一致，无双轨字段冲突。

- [ ] **RFX-010（P3）RootDocument Schema 强约束闭环**
  - 目标：增加 JSON Schema 校验 + 导入导出校验 + 迁移回归测试。
  - 主要文件：`src/schemas/*`（新建）、`src/ts/schema.ts`、测试文件
  - 来源：`Refactory.md` 4.3.2 全条目
  - 验收：导出数据可过 schema；旧数据迁移无破坏；异常输入有稳定提示。

---

## 4. 推荐执行顺序（首轮）

1. `RFX-001` lint gate 恢复
2. `RFX-002` format baseline 收敛
3. `RFX-003` 文档指标刷新
4. `RFX-004` 测试噪声 stub 参数化
5. `RFX-005` 仓库卫生清理
6. `RFX-006` ESLint 强度治理
7. `RFX-007` 大组件拆分第一轮
8. `RFX-008` compat 声明退出计划
9. `RFX-009` 图层字段统一
10. `RFX-010` Schema 强约束闭环

---

## 5. 单条目执行模板（会话内使用）

建议每次会话在开始时复制以下模板，保证输出一致：

```md
### <RFX-ID> - <条目标题>
- Scope: <本次原子范围>
- In Scope Files:
  - `<path>`
- Out of Scope:
  - `<explicitly not touched>`
- Checks:
  - `npm test`: pass/fail/not-run
  - `npm run lint`: pass/fail/not-run
  - `npm run typecheck`: pass/fail/not-run
  - `npm run format:check`: pass/fail/not-run
  - `npm run build:lib`: pass/fail/not-run
- DoD:
  - `<可验证结果>`
```
