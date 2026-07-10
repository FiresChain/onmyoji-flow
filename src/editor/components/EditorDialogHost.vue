<script setup lang="ts">
import GenericImageSelector from "@/components/common/GenericImageSelector.vue";
import PropertySelectDialog from "@/editor/node-types/property-rule/PropertySelectDialog.vue";
import { useDialogs } from "@/ts/useDialogs";

const { dialogs, closeDialog, closeGenericSelector } = useDialogs();
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
  <GenericImageSelector
    v-if="dialogs.generic.show && dialogs.generic.config"
    v-model="dialogs.generic.show"
    :config="dialogs.generic.config"
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
