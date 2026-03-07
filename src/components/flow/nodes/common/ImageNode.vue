<script setup lang="ts">
import { ref } from "vue";
import { useNodeAppearance } from "@/ts/useNodeAppearance";
import { useSafeI18n } from "@/ts/useSafeI18n";

type FitMode = "contain" | "cover" | "fill";

const imageUrl = ref("");
const fit = ref<FitMode>("contain");
const { t } = useSafeI18n();

const { containerStyle } = useNodeAppearance({
  onPropsChange(props) {
    imageUrl.value = props.image?.url ?? props.url ?? "";
    fit.value = props.image?.fit ?? props.fit ?? "contain";
  },
});
</script>

<template>
  <div class="image-node" :style="containerStyle">
    <div class="image-wrapper">
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="t('flow.imageNode.alt')"
        :style="{ objectFit: fit }"
        draggable="false"
      />
      <div v-else class="placeholder">
        <div class="placeholder-text">
          {{ t("flow.imageNode.placeholder") }}
        </div>
        <div class="placeholder-hint">{{ t("flow.imageNode.hint") }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.image-node {
  width: 100%;
  height: 100%;
  min-width: 150px;
  min-height: 120px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background: #fff;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
}

.image-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
}

.image-wrapper img {
  width: 100%;
  height: 100%;
}

.placeholder {
  color: #909399;
  text-align: center;
  line-height: 1.4;
  padding: 12px;
}

.placeholder-text {
  font-weight: 600;
  margin-bottom: 4px;
}

.placeholder-hint {
  font-size: 12px;
}
</style>
