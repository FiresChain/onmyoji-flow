<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from "vue";
import { useNodeAppearance } from "@/ts/useNodeAppearance";

const vectorConfig = ref({
  kind: "rect",
  svgContent: "",
  path: "",
  tileWidth: 50,
  tileHeight: 50,
  fill: "#409EFF",
  stroke: "#303133",
  strokeWidth: 1,
});

const nodeSize = ref({ width: 200, height: 200 });
let syncRafId: number | null = null;
let pendingVectorConfig: Record<string, any> | null = null;
let pendingNodeSize: { width: number; height: number } | null = null;

const flushPendingSync = () => {
  if (pendingVectorConfig) {
    Object.assign(vectorConfig.value, pendingVectorConfig);
    pendingVectorConfig = null;
  }
  if (pendingNodeSize) {
    nodeSize.value = pendingNodeSize;
    pendingNodeSize = null;
  }
  syncRafId = null;
};

const scheduleSync = () => {
  if (typeof requestAnimationFrame === "undefined") {
    flushPendingSync();
    return;
  }
  if (syncRafId !== null) {
    cancelAnimationFrame(syncRafId);
  }
  syncRafId = requestAnimationFrame(flushPendingSync);
};

const { containerStyle } = useNodeAppearance({
  onPropsChange(props, node) {
    if (props.vector) {
      pendingVectorConfig = { ...props.vector };
    }
    if (node) {
      pendingNodeSize = {
        width: node.width,
        height: node.height,
      };
    }
    // 使用 requestAnimationFrame 防抖，减少快速缩放时的重复重绘
    scheduleSync();
  },
});

onBeforeUnmount(() => {
  if (syncRafId !== null && typeof cancelAnimationFrame !== "undefined") {
    cancelAnimationFrame(syncRafId);
    syncRafId = null;
  }
});

const patternId = `vector-pattern-${Math.random().toString(36).slice(2, 11)}`;

// 生成 SVG 内容
const svgContent = computed(() => {
  const { kind, path, tileWidth, tileHeight, fill, stroke, strokeWidth } =
    vectorConfig.value;

  if (kind === "fancyFrame") {
    const width = Math.max(40, nodeSize.value.width);
    const height = Math.max(40, nodeSize.value.height);
    const outerStroke = Math.max(1, strokeWidth || 1);
    const corner = Math.max(
      12,
      Math.min(28, Math.floor(Math.min(width, height) * 0.12)),
    );
    const insetA = outerStroke / 2 + 3;
    const insetB = insetA + 10;
    const gradId = `${patternId}-grad`;
    const glowId = `${patternId}-glow`;
    const stepX = Math.max(18, Math.min(140, tileWidth || 50));
    const stepY = Math.max(18, Math.min(140, tileHeight || 50));
    const motifSize = Math.max(2, Math.min(7, Math.min(stepX, stepY) * 0.12));
    const sideDotRadius = Math.max(1.3, Math.min(3.6, motifSize * 0.65));

    const topStartX = insetB + corner * 0.6;
    const topEndX = width - insetB - corner * 0.6;
    const verticalStartY = insetB + corner * 0.6;
    const verticalEndY = height - insetB - corner * 0.6;

    const topSpan = Math.max(0, topEndX - topStartX);
    const verticalSpan = Math.max(0, verticalEndY - verticalStartY);
    const topCount = Math.max(1, Math.floor(topSpan / stepX) + 1);
    const sideCount = Math.max(1, Math.floor(verticalSpan / stepY) + 1);
    const topGap = topCount > 1 ? topSpan / (topCount - 1) : 0;
    const sideGap = sideCount > 1 ? verticalSpan / (sideCount - 1) : 0;

    const repeatedMotifs: string[] = [];
    for (let i = 0; i < topCount; i += 1) {
      const x = topCount > 1 ? topStartX + i * topGap : width / 2;
      const topY = insetB - 1;
      const bottomY = height - insetB + 1;
      repeatedMotifs.push(
        `<path d="M ${x} ${topY - motifSize} L ${x + motifSize} ${topY} L ${x} ${topY + motifSize} L ${x - motifSize} ${topY} Z" fill="${fill}" fill-opacity="0.78" />`,
      );
      repeatedMotifs.push(
        `<path d="M ${x} ${bottomY - motifSize} L ${x + motifSize} ${bottomY} L ${x} ${bottomY + motifSize} L ${x - motifSize} ${bottomY} Z" fill="${fill}" fill-opacity="0.78" />`,
      );
    }

    for (let i = 0; i < sideCount; i += 1) {
      const y = sideCount > 1 ? verticalStartY + i * sideGap : height / 2;
      const leftX = insetB - 1;
      const rightX = width - insetB + 1;
      repeatedMotifs.push(
        `<circle cx="${leftX}" cy="${y}" r="${sideDotRadius}" fill="${fill}" fill-opacity="0.82" />`,
      );
      repeatedMotifs.push(
        `<circle cx="${rightX}" cy="${y}" r="${sideDotRadius}" fill="${fill}" fill-opacity="0.82" />`,
      );
    }

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${stroke}" />
            <stop offset="45%" stop-color="${fill}" />
            <stop offset="100%" stop-color="${stroke}" />
          </linearGradient>
          <filter id="${glowId}" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect
          x="${insetA}"
          y="${insetA}"
          width="${Math.max(0, width - insetA * 2)}"
          height="${Math.max(0, height - insetA * 2)}"
          rx="${corner}"
          ry="${corner}"
          fill="${fill}"
          fill-opacity="0.1"
          stroke="url(#${gradId})"
          stroke-width="${outerStroke + 1}"
          filter="url(#${glowId})"
        />
        <rect
          x="${insetB}"
          y="${insetB}"
          width="${Math.max(0, width - insetB * 2)}"
          height="${Math.max(0, height - insetB * 2)}"
          rx="${Math.max(6, corner - 8)}"
          ry="${Math.max(6, corner - 8)}"
          fill="none"
          stroke="${stroke}"
          stroke-width="${Math.max(1, outerStroke - 0.4)}"
          stroke-opacity="0.8"
          stroke-dasharray="${Math.max(6, stepX * 0.48)} ${Math.max(4, stepX * 0.24)}"
        />

        <path d="M ${insetA + 4} ${insetA + corner} L ${insetA + 4} ${insetA + 4} L ${insetA + corner} ${insetA + 4}" fill="none" stroke="${fill}" stroke-width="${outerStroke + 1}" />
        <path d="M ${width - insetA - corner} ${insetA + 4} L ${width - insetA - 4} ${insetA + 4} L ${width - insetA - 4} ${insetA + corner}" fill="none" stroke="${fill}" stroke-width="${outerStroke + 1}" />
        <path d="M ${insetA + 4} ${height - insetA - corner} L ${insetA + 4} ${height - insetA - 4} L ${insetA + corner} ${height - insetA - 4}" fill="none" stroke="${fill}" stroke-width="${outerStroke + 1}" />
        <path d="M ${width - insetA - corner} ${height - insetA - 4} L ${width - insetA - 4} ${height - insetA - 4} L ${width - insetA - 4} ${height - insetA - corner}" fill="none" stroke="${fill}" stroke-width="${outerStroke + 1}" />

        ${repeatedMotifs.join("")}
      </svg>
    `;
  }

  let shapeElement = "";
  switch (kind) {
    case "rect":
      shapeElement = `<rect x="0" y="0" width="${tileWidth}" height="${tileHeight}"
                            fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
      break;
    case "ellipse":
      shapeElement = `<ellipse cx="${tileWidth / 2}" cy="${tileHeight / 2}"
                               rx="${tileWidth / 2 - strokeWidth}" ry="${tileHeight / 2 - strokeWidth}"
                               fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
      break;
    case "path":
      shapeElement = `<path d="${path || "M 0 0"}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
      break;
    case "svg":
      shapeElement = vectorConfig.value.svgContent || "";
      break;
    case "polygon":
      // 默认三角形
      const points = `0,${tileHeight} ${tileWidth / 2},0 ${tileWidth},${tileHeight}`;
      shapeElement = `<polygon points="${points}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
      break;
  }

  return `
    <svg width="${nodeSize.value.width}" height="${nodeSize.value.height}"
         xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="${patternId}"
                 x="0" y="0"
                 width="${tileWidth}"
                 height="${tileHeight}"
                 patternUnits="userSpaceOnUse">
          ${shapeElement}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#${patternId})" />
    </svg>
  `;
});
</script>

<template>
  <div class="vector-node" :style="containerStyle">
    <div class="vector-content" v-html="svgContent"></div>
  </div>
</template>

<style scoped>
.vector-node {
  width: 100%;
  height: 100%;
  overflow: hidden;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.vector-content {
  width: 100%;
  height: 100%;
}

.vector-content :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
