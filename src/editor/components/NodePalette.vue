<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import {
  buildAssetNodeCreateProperties,
  getAssetDataSource,
  readNodeCreateSizeConfig,
  resolveCreateNodeSize,
  type AssetLibraryId,
} from "@/features/assets/public";
import { getLogicFlowInstance, useLogicFlowScope } from "@/ts/useLogicFlow";
import { useEditorI18n } from "@/editor/context/useEditorI18n";
import { useEditorAssetUrlResolver } from "@/editor/context/useEditorContext";
import {
  createNodePalette,
  type NodePaletteItem,
} from "@/editor/node-types/palette";

const logicFlowScope = useLogicFlowScope();
const { t } = useEditorI18n();
const resolveAssetUrl = useEditorAssetUrlResolver();
const MIN_PANEL_WIDTH = 220;
const MAX_PANEL_WIDTH = 420;
const DEFAULT_PANEL_WIDTH = 260;
const panelWidth = ref(DEFAULT_PANEL_WIDTH);
const isResizing = ref(false);
const panelStyle = computed(() => ({
  width: `${panelWidth.value}px`,
}));
let resizeStartX = 0;
let resizeStartWidth = DEFAULT_PANEL_WIDTH;
let prevBodyCursor = "";
let prevBodyUserSelect = "";
const assetLibraries: AssetLibraryId[] = [
  "shikigami",
  "yuhun",
  "onmyoji",
  "onmyojiSkill",
  "hunling",
];
const assetPreviewByLibrary = computed(() => {
  const output: Partial<Record<AssetLibraryId, string>> = {};
  assetLibraries.forEach((library) => {
    const firstAsset = getAssetDataSource(library)?.[0] as
      | { avatar?: string }
      | undefined;
    output[library] =
      typeof firstAsset?.avatar === "string"
        ? (resolveAssetUrl(firstAsset.avatar) as string)
        : "";
  });
  return output;
});

const componentGroups = computed(() =>
  createNodePalette({
    t,
    assetPreviewByLibrary: assetPreviewByLibrary.value,
  }),
);

const handleMouseDown = (e: MouseEvent, component: NodePaletteItem) => {
  e.preventDefault(); // 阻止文字选中
  const lf = getLogicFlowInstance(logicFlowScope);
  if (!lf) return;
  const nextProperties = component.createProperties();
  const sizeConfig = readNodeCreateSizeConfig();
  const resolvedSize = resolveCreateNodeSize(component.type, {
    assetLibrary: nextProperties.assetLibrary,
    config: sizeConfig,
  });
  if (component.type === "assetSelector") {
    Object.assign(
      nextProperties,
      buildAssetNodeCreateProperties(nextProperties, { config: sizeConfig }),
    );
  }
  if (resolvedSize) {
    nextProperties.width = resolvedSize.width;
    nextProperties.height = resolvedSize.height;
    const style =
      nextProperties.style &&
      typeof nextProperties.style === "object" &&
      !Array.isArray(nextProperties.style)
        ? (nextProperties.style as Record<string, unknown>)
        : {};
    nextProperties.style = {
      ...style,
      width: resolvedSize.width,
      height: resolvedSize.height,
    };
  }
  lf.dnd.startDrag({
    type: component.type,
    properties: nextProperties,
  });
};

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
  panelWidth.value = clampPanelWidth(resizeStartWidth + deltaX);
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
    class="components-panel"
    :class="{ 'is-resizing': isResizing }"
    :style="panelStyle"
  >
    <h3>{{ t("flow.components.title") }}</h3>
    <!-- 使用两层遍历生成界面元素 -->
    <div
      v-for="group in componentGroups"
      :key="group.id"
      class="components-group"
    >
      <div class="group-title">{{ group.title }}</div>
      <div class="components-list">
        <div
          v-for="component in group.components"
          :key="component.id"
          class="component-item"
          :title="component.description"
          :aria-label="component.description"
          @mousedown="(e) => handleMouseDown(e, component)"
        >
          <div class="component-icon">
            <img
              v-if="component.icon"
              class="component-icon-image"
              :src="component.icon"
              :alt="component.name"
              loading="lazy"
            />
            <i v-else class="el-icon-plus"></i>
          </div>
          <div class="component-info">
            <div class="component-name">{{ component.name }}</div>
          </div>
        </div>
      </div>
    </div>
    <div
      class="resize-handle"
      role="separator"
      aria-orientation="vertical"
      :aria-valuemin="MIN_PANEL_WIDTH"
      :aria-valuemax="MAX_PANEL_WIDTH"
      :aria-valuenow="panelWidth"
      @mousedown="handleResizeMouseDown"
    ></div>
  </div>
</template>

<style scoped>
.components-panel {
  padding: 10px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 10px;
  min-width: 220px;
  max-width: 420px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}

.components-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.component-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 86px;
  padding: 6px 4px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  background-color: white;
  transition: all 0.3s;
  text-align: center;
  gap: 4px;
}

.component-item:hover {
  background-color: #f2f6fc;
  border-color: #c6e2ff;
}

.component-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ecf5ff;
  border-radius: 4px;
  overflow: hidden;
}

.component-icon-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.component-info {
  width: 100%;
}

.component-name {
  font-weight: bold;
  line-height: 1.2;
  font-size: 12px;
  word-break: break-word;
}

.components-group {
  margin-bottom: 18px;
}

.group-title {
  font-weight: bold;
  font-size: 15px;
  margin-bottom: 6px;
  color: #333;
}

.resize-handle {
  position: absolute;
  top: 0;
  right: -4px;
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

.components-panel:hover .resize-handle::before,
.components-panel.is-resizing .resize-handle::before {
  background-color: #c6e2ff;
}
</style>
