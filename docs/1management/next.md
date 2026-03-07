我正在开发 onmyoji-flow 项目（阴阳师编辑器），这是一个基于 Vue 3 + LogicFlow 的可视化编辑器。

请按以下流程工作：

1. **读取计划**：先读取 docs/1management/plan.md，了解项目当前状态和下一步行动计划

2. **确认任务**：根据 plan.md 中的"下一步行动计划"，向我确认要开发哪个功能

3. **开发实现**：
   - 使用 Serena 的符号工具高效读取代码
   - 使用 Context7 的查询Logic-flow相关文档
   - 遵循项目现有的代码风格和架构
   - 关键文件位置：
     - 画布：src/components/flow/FlowEditor.vue
     - 属性面板：src/components/flow/panels/
     - Store：src/ts/useStore.ts
     - Schema：src/ts/schema.ts

4. **等待测试**：开发完成后，等我测试并确认功能正常

5. **更新文档**：测试通过后，更新 docs/1management/plan.md：
   - 更新相关模块的完成度
   - 标记已完成的步骤
   - 更新总体完成度百分比

技术栈：Vue 3 + Vite + LogicFlow + Pinia + Element Plus

当前状态（对齐 plan.md）：
- ✅ 阶段 1 完成（独立编辑器）
- ✅ 阶段 2 完成（组件化改造）
- 🔄 阶段 3 进行中（wiki 集成稳定化）
- 📅 当前里程碑时间点：Milestone 3 预计 2026-03 第 1 周收尾

当前优先级（对齐 plan.md）：
- 🔴 高优先级：步骤 6 剩余项“优化加载性能”
- 🟡 中优先级：Milestone 3 剩余项“文档完善”
- 🟢 低优先级：交互体验持续打磨（Notion 块体验对齐）

请开始第一步：读取 plan.md 并按以上优先级确认下一步任务。
