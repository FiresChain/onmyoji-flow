<script setup lang="ts">
import { useDialogs } from "@/editor/context/useDialogs";
import { useEditorContext } from "@/editor/context/useEditorContext";

const props = defineProps<{
  node: any;
}>();

const { openDialog } = useDialogs();
const editorContext = useEditorContext();

const handleOpenDialog = () => {
  const lf = editorContext.runtime.value?.instance;
  const node = props.node;
  if (!lf || !node) return;

  const currentData = node.properties?.property;
  openDialog("property", currentData, node, (updatedData) => {
    lf.setProperties(node.id, {
      ...node.properties,
      property: updatedData,
    });
  });
};
</script>

<template>
  <div class="property-section">
    <div class="section-header">属性设置</div>
    <div class="property-item">
      <el-button type="primary" @click="handleOpenDialog" style="width: 100%"
        >设置属性</el-button
      >
    </div>
  </div>
</template>
