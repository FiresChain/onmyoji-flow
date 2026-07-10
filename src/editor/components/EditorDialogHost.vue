<script setup lang="ts">
import { AssetPickerDialog } from "@/features/assets/public";
import PropertySelectDialog from "@/editor/node-types/property-rule/PropertySelectDialog.vue";
import { useEditorAssetUrlResolver } from "@/editor/context/useEditorContext";
import { useDialogs } from "@/editor/context/useDialogs";
import { useEditorI18n } from "@/editor/context/useEditorI18n";

const { dialogs, closeDialog, closeGenericSelector } = useDialogs();
const { t } = useEditorI18n();
const resolveAssetUrl = useEditorAssetUrlResolver();
</script>

<template>
  <PropertySelectDialog
    v-if="dialogs.property.show"
    :showPropertySelect="dialogs.property.show"
    :currentProperty="dialogs.property.data"
    @closePropertySelect="closeDialog('property')"
    @updateProperty="
      (data) => {
        dialogs.property.callback?.(data);
        closeDialog('property');
      }
    "
  />
  <AssetPickerDialog
    v-if="dialogs.generic.show && dialogs.generic.config"
    v-model="dialogs.generic.show"
    :config="dialogs.generic.config"
    :translate="t"
    :resolve-asset-url="resolveAssetUrl"
    @select="
      (data) => {
        dialogs.generic.callback?.(data);
        closeGenericSelector();
      }
    "
    @update:modelValue="
      (value) => {
        if (!value) closeGenericSelector();
      }
    "
  />
</template>
