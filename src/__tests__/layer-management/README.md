# 图层管理测试

## 📁 文件说明

### ✅ 活跃的测试

- **`real-scenario.spec.ts`** - 真实场景测试（推荐使用）
  - 使用真实的 LogicFlow 实例
  - 模拟真实的用户操作流程
  - 能够发现真实的代码问题

### 📦 历史废弃测试说明

- 历史 `mock/integration/unit` 的 `.bak` 测试文件已在 2026-03 仓库卫生清理中移除。
- 如需追溯旧实现，请使用 Git 历史（`git log -- src/__tests__/layer-management`）。

---

## 🚀 运行测试

```bash
# 运行图层管理测试
npm test -- layer-management

# 只运行真实场景测试
npm test -- real-scenario

# 监听模式
npm run test:watch -- layer-management

# 查看详细输出
npm test -- layer-management --reporter=verbose
```

---

## 📊 测试结果

### 当前状态（9 个测试）

- ✅ **通过**: 5/9
- ❌ **失败**: 4/9

### 发现的问题

1. **zIndex 不会保存到数据中**
   - `getGraphRawData()` 返回的数据中没有 zIndex
   - 导致导出/导入数据会丢失图层信息

2. **置底操作逻辑错误**
   - 置底后 zIndex 变成 998/996
   - 应该是比所有节点都小的值

---

## 📝 测试场景

### ✅ 通过的测试

1. **场景1**: 创建节点并验证 zIndex 分配
2. **场景2**: 置顶操作（模拟右键菜单）
3. **场景4**: 上移一层操作
4. **场景5**: 下移一层操作
5. **场景8**: 边界情况 - 最顶层节点继续置顶

### ❌ 失败的测试

1. **场景3**: 置底操作（模拟右键菜单）
2. **场景6**: 数据预览验证（模拟 Toolbar.handlePreviewData）
3. **场景7**: 完整用户流程测试
4. **场景9**: 边界情况 - 最底层节点继续置底

---

## 🔧 如何修复

参考 `../README-测试报告.md` 中的解决方案。

---

## 📚 相关文档

- [测试规范文档](../TEST-RULES.md)
- [测试报告](../README-测试报告.md)
