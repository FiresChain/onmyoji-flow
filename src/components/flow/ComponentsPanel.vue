<script setup lang="ts">
import { computed } from "vue";
import { getLogicFlowInstance, useLogicFlowScope } from "@/ts/useLogicFlow";
import { useSafeI18n } from "@/ts/useSafeI18n";

const logicFlowScope = useLogicFlowScope();
const { t } = useSafeI18n({
  "flow.components.title": "组件库",
  "flow.components.group.basic": "基础组件",
  "flow.components.group.yys": "阴阳师",
  "flow.components.group.other": "其他游戏",
  "flow.components.rect.name": "长方形",
  "flow.components.rect.desc": "基础长方形节点",
  "flow.components.ellipse.name": "圆形",
  "flow.components.ellipse.desc": "基础圆形节点",
  "flow.components.dynamicGroup.name": "动态分组",
  "flow.components.dynamicGroup.desc": "可折叠的动态分组容器",
  "flow.components.image.name": "图片",
  "flow.components.image.desc": "可上传图片的节点",
  "flow.components.text.name": "文字编辑框",
  "flow.components.text.desc": "可编辑文本的节点",
  "flow.components.text.defaultHtml": "<p>请输入文本</p>",
  "flow.components.vector.name": "矢量图块",
  "flow.components.vector.desc": "可平铺的矢量图形，用于边框装饰",
  "flow.components.assetSelector.name": "资产选择器",
  "flow.components.assetSelector.desc": "通用资产选择器（式神/御魂等）",
  "flow.components.shikigami.name": "式神选择器",
  "flow.components.shikigami.desc": "用于选择式神的组件",
  "flow.components.yuhun.name": "御魂选择器",
  "flow.components.yuhun.desc": "用于选择御魂的组件",
  "flow.components.onmyoji.name": "阴阳师选择器",
  "flow.components.onmyoji.desc": "用于选择阴阳师的组件",
  "flow.components.onmyojiSkill.name": "阴阳师技能选择器",
  "flow.components.onmyojiSkill.desc": "用于选择阴阳师技能的组件",
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
