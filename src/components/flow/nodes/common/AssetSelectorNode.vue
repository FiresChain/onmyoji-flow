<script setup lang="ts">
import { computed, ref, inject, onMounted, onBeforeUnmount } from "vue";
import type { CSSProperties } from "vue";
import { toTextStyle } from "@/ts/nodeStyle";
import { useNodeAppearance } from "@/ts/useNodeAppearance";
import { resolveAssetUrl } from "@/utils/assetUrl";

const currentAsset = ref({
  name: "未选择资产",
  avatar: "",
  library: "shikigami",
});
const getNode = inject("getNode") as (() => any) | undefined;
const zIndex = ref(1);
let intervalId: number | null = null;

// 使用轮询方式定期更新 zIndex
onMounted(() => {
  const node = getNode?.();
  if (node) {
    zIndex.value = node.zIndex ?? 1;

    // 每 100ms 检查一次 zIndex 是否变化
    intervalId = window.setInterval(() => {
      const currentZIndex = node.zIndex ?? 1;
      if (zIndex.value !== currentZIndex) {
        zIndex.value = currentZIndex;
      }
    }, 100);
  }
});

onBeforeUnmount(() => {
  if (intervalId !== null) {
    clearInterval(intervalId);
  }
});

const { containerStyle, textStyle } = useNodeAppearance({
  onPropsChange(props) {
    if (props.selectedAsset) {
      currentAsset.value = props.selectedAsset;
    }
    if (props.assetLibrary && !props.selectedAsset) {
      // 如果切换了资产库但没有选中资产，更新占位文本
      currentAsset.value = {
        name: "未选择资产",
        avatar: "",
        library: props.assetLibrary,
      };
    }
  },
});

const mergedContainerStyle = computed<CSSProperties>(() => ({
  ...containerStyle.value,
  boxSizing: "border-box",
}));
const normalizedAvatar = computed(
  () => resolveAssetUrl(currentAsset.value.avatar) as string,
);
const hasSelectedAsset = computed(() => !!currentAsset.value.avatar);
</script>

<template>
  <div class="node-content" :style="mergedContainerStyle">
    <div class="zindex-badge">{{ zIndex }}</div>
    <template v-if="hasSelectedAsset">
      <div class="asset-media">
        <img
          :src="normalizedAvatar"
          :alt="currentAsset.name"
          class="asset-image"
          draggable="false"
        />
      </div>
      <div class="name-text" :style="textStyle" :title="currentAsset.name">
        {{ currentAsset.name }}
      </div>
    </template>
    <template v-else>
      <div class="placeholder-wrap">
        <div class="placeholder-text" :style="textStyle">点击选择资产</div>
        <div class="placeholder-sub" :style="textStyle">未选择资产</div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.node-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100%;
  height: 100%;
  padding: 6px;
  gap: 4px;
  overflow: hidden;
}
.zindex-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(64, 158, 255, 0.9);
  color: white;
  font-size: 12px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 10px;
  z-index: 10;
  pointer-events: none;
}
.asset-media {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.asset-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.placeholder-text {
  color: #909399;
  font-size: 12px;
  line-height: 1.2;
  text-align: center;
}
.placeholder-wrap {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.placeholder-sub {
  width: 100%;
  color: #606266;
  font-size: 12px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}
.name-text {
  position: absolute;
  left: 6px;
  right: 6px;
  bottom: 6px;
  z-index: 2;
  padding: 2px 6px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  font-size: 12px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}
</style>
