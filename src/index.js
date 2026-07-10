// 库入口文件
import "element-plus/dist/index.css";
import "vue3-draggable-resizable/dist/Vue3DraggableResizable.css";
import YysEditorEmbed from "./YysEditorEmbed.vue";
export {
  setAssetBaseUrl,
  getAssetBaseUrl,
  resolveAssetUrl,
  CUSTOM_ASSET_STORAGE_KEY,
} from "./features/assets/public";
export {
  DEFAULT_GROUP_RULES_CONFIG,
  GROUP_RULES_STORAGE_KEY,
  validateGraphGroupRules,
  readSharedGroupRulesConfig,
  writeSharedGroupRulesConfig,
  clearSharedGroupRulesConfig,
} from "./features/group-rules/public";

// 导出组件
export { YysEditorEmbed };
export { YysEditorEmbed as YysEditorPreview }; // 别名导出，用于 wiki 预览场景

// 默认导出
export default YysEditorEmbed;

// 类型导出
export * from "./core/document/types";
export * from "./YysEditorEmbed.vue";
export * from "./flowRuntime";
