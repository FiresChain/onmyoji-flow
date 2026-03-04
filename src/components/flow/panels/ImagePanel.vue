<script setup lang="ts">
import { reactive, watch } from "vue";
import { getLogicFlowInstance, useLogicFlowScope } from "@/ts/useLogicFlow";
import { normalizeNodeStyle } from "@/ts/nodeStyle";
import { useSafeI18n } from "@/ts/useSafeI18n";

type FitMode = "contain" | "cover" | "fill";

const props = defineProps<{
  node: any;
}>();
const logicFlowScope = useLogicFlowScope();
const { t } = useSafeI18n({
  "flow.image.title": "图片设置",
  "flow.image.url": "图片 URL",
  "flow.image.urlPlaceholder": "输入图片链接或上传文件",
  "flow.image.upload": "上传文件",
  "flow.image.uploadHint": "本地上传将以 base64 保存",
  "flow.image.fit": "显示模式",
  "flow.image.fit.contain": "自适应",
  "flow.image.fit.cover": "填充",
  "flow.image.fit.fill": "拉伸",
  "flow.image.size": "宽 / 高",
  "flow.image.preview": "预览",
  "flow.image.previewAlt": "预览",
});

type ImageForm = {
  url: string;
  fit: FitMode;
  width: number;
  height: number;
};

const imageForm = reactive<ImageForm>({
  url: "",
  fit: "contain",
  width: 180,
  height: 120,
});

const parseNumber = (value: any, fallback: number) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const getImageProps = (node?: any): ImageForm => {
  const props = node?.properties ?? {};
  const style = normalizeNodeStyle(props.style, {
    width: props.width ?? node?.width,
    height: props.height ?? node?.height,
  });
  return {
    url: props.image?.url ?? props.url ?? "",
    fit: (props.image?.fit ?? props.fit ?? "contain") as FitMode,
    width: parseNumber(style.width, 180),
    height: parseNumber(style.height, 120),
  };
};

watch(
  () => props.node,
  (node) => {
    if (!node) {
      imageForm.url = "";
      imageForm.fit = "contain";
      imageForm.width = 180;
      imageForm.height = 120;
      return;
    }
    const next = getImageProps(node);
    imageForm.url = next.url || "";
    imageForm.fit = next.fit;
    imageForm.width = next.width;
    imageForm.height = next.height;
  },
  { immediate: true, deep: true },
);

const applyImageChanges = (partial: Partial<ImageForm>) => {
  const lf = getLogicFlowInstance(logicFlowScope);
  const node = props.node;
  if (!lf || !node) return;

  const baseProps = node.properties || {};
  const merged = { ...getImageProps(node), ...partial };
  const currentStyle = normalizeNodeStyle(baseProps.style, {
    width: baseProps.width ?? node.width,
    height: baseProps.height ?? node.height,
  });
  const nextStyle = normalizeNodeStyle(
    { ...currentStyle, width: merged.width, height: merged.height },
    { width: merged.width, height: merged.height },
  );

  const nextProps = {
    ...baseProps,
    ...merged,
    style: nextStyle,
    width: nextStyle.width,
    height: nextStyle.height,
    image: {
      ...(baseProps.image || {}),
      url: merged.url,
      fit: merged.fit,
    },
    url: merged.url,
  };

  Object.assign(imageForm, merged);
  lf.setProperties(node.id, nextProps);
};

const handleImageUpload = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    const result = evt.target?.result as string;
    if (result) {
      applyImageChanges({ url: result });
    }
    if (input) input.value = "";
  };
  reader.readAsDataURL(file);
};

const handleImageUrlChange = () => {
  applyImageChanges({ url: imageForm.url });
};

const handleSizeChange = () => {
  applyImageChanges({ width: imageForm.width, height: imageForm.height });
};

const handleFitChange = (val: FitMode) => {
  applyImageChanges({ fit: val });
};
</script>

<template>
  <div class="property-section">
    <div class="section-header">{{ t("flow.image.title") }}</div>

    <div class="property-item">
      <div class="property-label">{{ t("flow.image.url") }}</div>
      <div class="property-value">
        <el-input
          v-model="imageForm.url"
          size="small"
          :placeholder="t('flow.image.urlPlaceholder')"
          style="width: 100%"
          @change="handleImageUrlChange"
        />
      </div>
    </div>

    <div class="property-item">
      <div class="property-label">{{ t("flow.image.upload") }}</div>
      <div class="property-value upload-row">
        <input
          class="upload-input"
          type="file"
          accept="image/*"
          @change="handleImageUpload"
        />
        <span class="upload-hint">{{ t("flow.image.uploadHint") }}</span>
      </div>
    </div>

    <div class="property-item">
      <div class="property-label">{{ t("flow.image.fit") }}</div>
      <div class="property-value">
        <el-select
          v-model="imageForm.fit"
          size="small"
          style="width: 100%"
          @change="handleFitChange"
        >
          <el-option :label="t('flow.image.fit.contain')" value="contain" />
          <el-option :label="t('flow.image.fit.cover')" value="cover" />
          <el-option :label="t('flow.image.fit.fill')" value="fill" />
        </el-select>
      </div>
    </div>

    <div class="property-item size-item">
      <div class="property-label">{{ t("flow.image.size") }}</div>
      <div class="property-value size-inputs">
        <el-input-number
          v-model="imageForm.width"
          :min="40"
          :max="1000"
          size="small"
          style="width: 120px"
          @change="handleSizeChange"
        />
        <span class="size-divider">×</span>
        <el-input-number
          v-model="imageForm.height"
          :min="40"
          :max="1000"
          size="small"
          style="width: 120px"
          @change="handleSizeChange"
        />
      </div>
    </div>

    <div v-if="imageForm.url" class="property-item">
      <div class="property-label">{{ t("flow.image.preview") }}</div>
      <div class="property-value image-preview">
        <img :src="imageForm.url" :alt="t('flow.image.previewAlt')" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.property-value.upload-row {
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: left;
}

.upload-input {
  flex: 1;
}

.upload-hint {
  color: #909399;
  font-size: 12px;
}

.size-item .property-value {
  text-align: left;
}

.size-inputs {
  display: flex;
  align-items: center;
  gap: 6px;
}

.size-divider {
  color: #909399;
  font-size: 12px;
}

.image-preview {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 6px;
  background: #fafafa;
  text-align: center;
}

.image-preview img {
  max-width: 100%;
  max-height: 140px;
  display: block;
  margin: 0 auto;
}
</style>
