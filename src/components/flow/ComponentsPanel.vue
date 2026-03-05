<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { getAssetDataSource } from "@/configs/assetCatalog";
import iconDynamicGroup from "@/assets/component-icons/dynamic-group.svg";
import iconEllipse from "@/assets/component-icons/ellipse.svg";
import iconImage from "@/assets/component-icons/image.svg";
import iconRect from "@/assets/component-icons/rect.svg";
import iconText from "@/assets/component-icons/text.svg";
import iconVector from "@/assets/component-icons/vector.svg";
import type { AssetLibraryId } from "@/types/assets";
import { getLogicFlowInstance, useLogicFlowScope } from "@/ts/useLogicFlow";
import { useSafeI18n } from "@/ts/useSafeI18n";
import { resolveAssetUrl } from "@/utils/assetUrl";

const logicFlowScope = useLogicFlowScope();
const { t } = useSafeI18n();
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

// 使用嵌套结构定义组件分组
const componentGroups = computed(() => [
  {
    id: "basic",
    title: t("flow.components.group.basic"),
    components: [
      {
        id: "rect",
        name: t("flow.components.rect.name"),
        type: "rect",
        description: t("flow.components.rect.desc"),
        data: {
          width: 150,
          height: 150,
          style: { background: "#fff", border: "2px solid black" },
        },
        icon: iconRect,
      },
      {
        id: "ellipse",
        name: t("flow.components.ellipse.name"),
        type: "ellipse",
        description: t("flow.components.ellipse.desc"),
        data: {
          width: 150,
          height: 150,
          style: {
            background: "#fff",
            border: "2px solid black",
            borderRadius: "50%",
          },
        },
        icon: iconEllipse,
      },
      {
        id: "dynamic-group",
        name: t("flow.components.dynamicGroup.name"),
        type: "dynamic-group",
        description: t("flow.components.dynamicGroup.desc"),
        data: {
          children: [],
          groupMeta: {
            version: 1,
            groupKind: "team",
            ruleEnabled: true,
          },
          collapsible: true,
          isCollapsed: false,
          width: 420,
          height: 250,
          collapsedWidth: 100,
          collapsedHeight: 60,
          radius: 6,
          isRestrict: false,
          autoResize: false,
          transformWithContainer: false,
          autoToFront: true,
        },
        icon: iconDynamicGroup,
      },
      {
        id: "image",
        name: t("flow.components.image.name"),
        type: "imageNode",
        description: t("flow.components.image.desc"),
        data: {
          url: "",
          width: 180,
          height: 120,
        },
        icon: iconImage,
      },
      {
        id: "text",
        name: t("flow.components.text.name"),
        type: "textNode",
        description: t("flow.components.text.desc"),
        data: {
          text: {
            content: t("flow.components.text.defaultHtml"),
            rich: true,
          },
          width: 200,
          height: 120,
        },
        icon: iconText,
      },
      {
        id: "vector",
        name: t("flow.components.vector.name"),
        type: "vectorNode",
        description: t("flow.components.vector.desc"),
        data: {
          vector: {
            kind: "rect",
            tileWidth: 50,
            tileHeight: 50,
            fill: "#409EFF",
            stroke: "#303133",
            strokeWidth: 1,
          },
          width: 200,
          height: 200,
        },
        icon: iconVector,
      },
    ],
  },
  {
    id: "yys",
    title: t("flow.components.group.yys"),
    components: [
      {
        id: "asset-selector",
        name: t("flow.components.assetSelector.name"),
        type: "assetSelector",
        description: t("flow.components.assetSelector.desc"),
        data: {
          assetLibrary: "shikigami",
          selectedAsset: null,
        },
        icon: assetPreviewByLibrary.value.shikigami || "",
      },
      {
        id: "shikigami-select",
        name: t("flow.components.shikigami.name"),
        type: "assetSelector",
        description: t("flow.components.shikigami.desc"),
        data: {
          assetLibrary: "shikigami",
          selectedAsset: null,
        },
        icon: assetPreviewByLibrary.value.shikigami || "",
      },
      {
        id: "yuhun-select",
        name: t("flow.components.yuhun.name"),
        type: "assetSelector",
        description: t("flow.components.yuhun.desc"),
        data: {
          assetLibrary: "yuhun",
          selectedAsset: null,
        },
        icon: assetPreviewByLibrary.value.yuhun || "",
      },
      {
        id: "onmyoji-select",
        name: t("flow.components.onmyoji.name"),
        type: "assetSelector",
        description: t("flow.components.onmyoji.desc"),
        data: {
          assetLibrary: "onmyoji",
          selectedAsset: null,
        },
        icon: assetPreviewByLibrary.value.onmyoji || "",
      },
      {
        id: "onmyoji-skill-select",
        name: t("flow.components.onmyojiSkill.name"),
        type: "assetSelector",
        description: t("flow.components.onmyojiSkill.desc"),
        data: {
          assetLibrary: "onmyojiSkill",
          selectedAsset: null,
        },
        icon: assetPreviewByLibrary.value.onmyojiSkill || "",
      },
      {
        id: "hunling-select",
        name: t("flow.components.hunling.name"),
        type: "assetSelector",
        description: t("flow.components.hunling.desc"),
        data: {
          assetLibrary: "hunling",
          selectedAsset: null,
        },
        icon: assetPreviewByLibrary.value.hunling || "",
      },
    ],
  },
  {
    id: "other-game",
    title: t("flow.components.group.other"),
    components: [],
  },
]);

// 处理组件点击 - 可选：可直接创建节点
const handleComponentClick = (component) => {
  // 可选：实现点击直接添加节点到画布
};

const handleMouseDown = (e, component) => {
  e.preventDefault(); // 阻止文字选中
  const lf = getLogicFlowInstance(logicFlowScope);
  if (!lf) return;
  lf.dnd.startDrag({
    type: component.type,
    properties: component.data,
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
  <div class="components-panel" :class="{ 'is-resizing': isResizing }" :style="panelStyle">
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
          @click="handleComponentClick(component)"
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
