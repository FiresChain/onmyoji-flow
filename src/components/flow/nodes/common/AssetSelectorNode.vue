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
</script>

<template>
  <div class="node-content" :style="mergedContainerStyle">
    <img
      v-if="currentAsset.avatar"
      :src="normalizedAvatar"
      :alt="currentAsset.name"
      class="asset-image"
      draggable="false"
    />
    <div v-else class="placeholder-text" :style="textStyle">点击选择资产</div>
  </div>
</template>

<style scoped>
.node-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.asset-image {
  width: 85%;
  height: 85%;
  object-fit: cover;
}
.placeholder-text {
  color: #909399;
  font-size: 12px;
}
</style>
