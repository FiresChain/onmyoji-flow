<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import PropertyRulePanel from "./panels/PropertyRulePanel.vue";
import ImagePanel from "./panels/ImagePanel.vue";
import TextPanel from "./panels/TextPanel.vue";
import StylePanel from "./panels/StylePanel.vue";
import AssetSelectorPanel from "./panels/AssetSelectorPanel.vue";
import VectorPanel from "./panels/VectorPanel.vue";
import DynamicGroupPanel from "./panels/DynamicGroupPanel.vue";
import { ASSET_LIBRARIES } from "@/types/nodeTypes";
import { getLogicFlowInstance, useLogicFlowScope } from "@/ts/useLogicFlow";
import { useSafeI18n } from "@/ts/useSafeI18n";

const logicFlowScope = useLogicFlowScope();
const { t } = useSafeI18n();
const MIN_PANEL_WIDTH = 240;
const MAX_PANEL_WIDTH = 460;
const DEFAULT_PANEL_WIDTH = 280;

const props = defineProps({
  height: {
    type: String,
    default: "100%",
  },
  node: {
    type: Object,
    default: null,
  },
});

const selectedNode = computed(() => props.node);
const hasNodeSelected = computed(() => !!selectedNode.value);
const panelWidth = ref(DEFAULT_PANEL_WIDTH);
const isResizing = ref(false);
const panelStyle = computed(() => ({
  height: props.height,
  width: `${panelWidth.value}px`,
}));
let resizeStartX = 0;
let resizeStartWidth = DEFAULT_PANEL_WIDTH;
let prevBodyCursor = "";
let prevBodyUserSelect = "";

const nodeType = computed(() => {
  if (!selectedNode.value) return "";
  return selectedNode.value.type || "default";
});

const activeTab = ref("game");

const panelMap: Record<string, any> = {
  propertySelect: PropertyRulePanel,
  imageNode: ImagePanel,
  textNode: TextPanel,
  assetSelector: AssetSelectorPanel,
  vectorNode: VectorPanel,
  "dynamic-group": DynamicGroupPanel,
};

const panelComponent = computed(() => panelMap[nodeType.value] || null);

// 判断是否支持节点类型切换（仅资产选择器节点支持）
const supportsTypeSwitch = computed(() => nodeType.value === "assetSelector");

// 当前资产库类型
const currentAssetLibrary = computed({
  get: () => selectedNode.value?.properties?.assetLibrary || "shikigami",
  set: (value) => {
    const lf = getLogicFlowInstance(logicFlowScope);
    if (!lf || !selectedNode.value) return;

    lf.setProperties(selectedNode.value.id, {
      ...selectedNode.value.properties,
      assetLibrary: value,
      selectedAsset: null, // 切换类型时清空已选资产
    });
  },
});

const getAssetLibraryLabel = (libraryId: string) =>
  t(`assetLibrary.${libraryId}`);

const clampPanelWidth = (nextWidth: number) =>
  Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, nextWidth));

const stopResize = () => {
  if (!isResizing.value) return;
  isResizing.value = false;
  window.removeEventListener("mousemove", handleResizeMouseMove);
  window.removeEventListener("mouseup", stopResize);
  document.body.style.cursor = prevBodyCursor;
  document.body.style.userSelect = prevBodyUserSelect;
};

const handleResizeMouseMove = (event: MouseEvent) => {
  if (!isResizing.value) return;
  const deltaX = event.clientX - resizeStartX;
  panelWidth.value = clampPanelWidth(resizeStartWidth - deltaX);
};

const handleResizeMouseDown = (event: MouseEvent) => {
  if (event.button !== 0) return;
  event.preventDefault();
  isResizing.value = true;
  resizeStartX = event.clientX;
  resizeStartWidth = panelWidth.value;
  prevBodyCursor = document.body.style.cursor;
  prevBodyUserSelect = document.body.style.userSelect;
  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none";
  window.addEventListener("mousemove", handleResizeMouseMove);
  window.addEventListener("mouseup", stopResize);
};

onBeforeUnmount(() => {
  stopResize();
});
</script>

<template>
  <div
    class="property-panel"
    :class="{ 'is-resizing': isResizing }"
    :style="panelStyle"
  >
    <div
      class="resize-handle"
      role="separator"
      aria-orientation="vertical"
      :aria-valuemin="MIN_PANEL_WIDTH"
      :aria-valuemax="MAX_PANEL_WIDTH"
      :aria-valuenow="panelWidth"
      @mousedown="handleResizeMouseDown"
    ></div>
    <div class="panel-header">
      <h3>{{ t("flow.property.title") }}</h3>
    </div>

    <div v-if="!hasNodeSelected" class="no-selection">
      <div class="no-selection-text">
        <p>{{ t("flow.property.empty.selectNode") }}</p>
        <p class="no-selection-tip">
          {{ t("flow.property.empty.assetTip") }}
        </p>
      </div>
    </div>

    <div v-else class="property-content">
      <!-- Tab 切换 -->
      <el-tabs v-model="activeTab" class="property-tabs">
        <!-- 游戏属性 Tab -->
        <el-tab-pane :label="t('flow.property.tab.game')" name="game">
          <div class="property-section">
            <div class="section-header">
              {{ t("flow.property.section.basic") }}
            </div>
            <div class="property-item">
              <div class="property-label">
                {{ t("flow.property.label.nodeId") }}
              </div>
              <div class="property-value">{{ selectedNode.id }}</div>
            </div>
            <div class="property-item">
              <div class="property-label">
                {{ t("flow.property.label.nodeType") }}
              </div>
              <div class="property-value">{{ nodeType }}</div>
            </div>
          </div>

          <!-- 节点类型切换（仅资产选择器支持） -->
          <div v-if="supportsTypeSwitch" class="property-section">
            <div class="section-header">
              {{ t("flow.property.section.selectorType") }}
            </div>
            <div class="property-item">
              <div class="property-label">
                {{ t("flow.property.label.assetType") }}
              </div>
              <el-select
                v-model="currentAssetLibrary"
                :placeholder="t('flow.property.placeholder.assetType')"
                style="width: 100%"
              >
                <el-option
                  v-for="lib in ASSET_LIBRARIES"
                  :key="lib.id"
                  :label="getAssetLibraryLabel(lib.id)"
                  :value="lib.id"
                />
              </el-select>
            </div>
          </div>

          <!-- 特定节点属性面板 -->
          <component
            v-if="panelComponent"
            :is="panelComponent"
            :node="selectedNode"
          />
          <div v-else class="property-section">
            <div class="section-header">
              {{ t("flow.property.section.none") }}
            </div>
            <div class="property-item">
              <div class="property-value">
                {{ t("flow.property.value.none") }}
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 图像属性 Tab -->
        <el-tab-pane :label="t('flow.property.tab.style')" name="style">
          <StylePanel :node="selectedNode" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<style scoped>
.property-panel {
  background-color: #f5f7fa;
  border-left: 1px solid #e4e7ed;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

.panel-header {
  padding: 10px;
  border-bottom: 1px solid #e4e7ed;
  background-color: #e4e7ed;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.no-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
  font-size: 14px;
  padding: 20px;
  text-align: center;
}

.no-selection-text {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.no-selection-tip {
  font-size: 12px;
  color: #606266;
  margin: 0;
}

.property-content {
  padding: 10px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.property-tabs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.property-tabs :deep(.el-tabs__content) {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.property-tabs :deep(.el-tab-pane) {
  min-height: 0;
}

.property-section {
  margin-bottom: 20px;
  background-color: white;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  overflow: hidden;
}

.section-header {
  font-weight: bold;
  padding: 10px;
  background-color: #ecf5ff;
  border-bottom: 1px solid #dcdfe6;
}

.property-item {
  padding: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.property-item:last-child {
  border-bottom: none;
}

.property-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 5px;
}

.property-value {
  font-size: 14px;
  word-break: break-all;
}

.resize-handle {
  position: absolute;
  top: 0;
  left: 0;
  width: 8px;
  height: 100%;
  cursor: col-resize;
  z-index: 20;
}

.resize-handle::before {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  transform: translateX(-50%);
  background: transparent;
  transition: background-color 0.2s ease;
}

.property-panel:hover .resize-handle::before,
.property-panel.is-resizing .resize-handle::before {
  background-color: #c6e2ff;
}
</style>
