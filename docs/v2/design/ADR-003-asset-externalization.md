# ADR-003: 资产加载外部化

## 状态

已采纳

## 背景

当前 `src/data/assets/` 目录包含完整的资产 JSON 数据（shikigami.json 2961行、yuhun.json 1138行等）和 manifest.json。这些数据按月更新。

当库作为 npm 包发布时，这些数据被打包在库内。资产更新需要发版，流程重且不必要。此外 wiki 嵌入场景中，资产图片从 wiki 自身的 `/assets/` 目录加载，与库内置的路径可能不一致。

## 决策

将资产数据从库中剥离：

- 库只提供资产加载接口（`setAssetBaseUrl`、`resolveAssetUrl`）
- 节点注册时只定义节点类型和组件，不绑定具体资产数据
- 独立 app 模式下，资产数据由 app 层引入（`src/data/assets/` 保留在 app 层）
- 库模式下，消费方（wiki）通过 `setAssetBaseUrl()` 指定资产路径

## 理由

1. **解耦发版**：资产数据月更，库框架稳定。分离后资产更新不需要库发版
2. **消费方灵活**：wiki、独立 app、未来 Electron 各自管理自己的资产源
3. **包体积**：库产物不含资产 JSON 和图片，体积显著减小

## 影响

- `src/data/assets/` 目录从库构建中排除，仅在 app 模式下引入
- `assetCatalog.ts` 的导入路径需要按构建模式区分
- 资产选择器节点（assetSelector）通过接口获取资产列表，而非直接 import
- 库模式下组件面板中资产选择器（式神/御魂等）正常显示，无资产数据时打开空白面板，行为与有数据时完全一致
