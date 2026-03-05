<script setup lang="ts">
import { computed } from "vue";
import { getLogicFlowInstance, useLogicFlowScope } from "@/ts/useLogicFlow";
import { useSafeI18n } from "@/ts/useSafeI18n";

const logicFlowScope = useLogicFlowScope();
const { t } = useSafeI18n();

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
</script>

<template>
  <div class="components-panel">
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
          @click="handleComponentClick(component)"
          @mousedown="(e) => handleMouseDown(e, component)"
        >
          <div class="component-icon">
            <i class="el-icon-plus"></i>
          </div>
          <div class="component-info">
            <div class="component-name">{{ component.name }}</div>
            <div class="component-desc">{{ component.description }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.components-panel {
  padding: 10px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 10px;
  width: 200px;
  display: flex;
  flex-direction: column;
}

.components-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.component-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  background-color: white;
  transition: all 0.3s;
}

.component-item:hover {
  background-color: #f2f6fc;
  border-color: #c6e2ff;
}

.component-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ecf5ff;
  border-radius: 4px;
  margin-right: 10px;
}

.component-info {
  flex: 1;
}

.component-name {
  font-weight: bold;
  margin-bottom: 4px;
}

.component-desc {
  font-size: 12px;
  color: #909399;
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
</style>
