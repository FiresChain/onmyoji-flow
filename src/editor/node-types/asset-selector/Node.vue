<script setup lang="ts">
import { computed, ref } from "vue";
import type { CSSProperties } from "vue";
import { toTextStyle } from "@/editor/nodeStyle";
import { useNodeAppearance } from "@/ts/useNodeAppearance";
import { useEditorAssetUrlResolver } from "@/editor/context/useEditorContext";

const currentAsset = ref({
  name: "未选择资产",
  avatar: "",
  library: "shikigami",
});
const resolveAssetUrl = useEditorAssetUrlResolver();

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
