<template>
  <div class="toolbar" :class="{ 'toolbar--embed': props.isEmbed }">
    <div class="toolbar-actions">
      <el-dropdown data-menu="file" trigger="click">
        <el-button type="primary" icon="FolderOpened">
          {{ t("toolbar.menu.file") }}
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              data-command="import"
              @click="emitCommand('import')"
            >
              {{ t("import") }}
            </el-dropdown-item>
            <el-dropdown-item
              data-command="export"
              @click="emitCommand('export')"
            >
              {{ t("export") }}
            </el-dropdown-item>
            <el-dropdown-item
              data-command="preview-data"
              @click="emitCommand('preview-data')"
            >
              {{ t("previewData") }}
            </el-dropdown-item>
            <el-dropdown-item
              data-command="prepare-capture"
              @click="emitCommand('prepare-capture')"
            >
              {{ t("prepareCapture") }}
            </el-dropdown-item>
            <el-dropdown-item
              v-if="!props.isEmbed"
              data-command="load-example"
              @click="emitCommand('load-example')"
            >
              {{ t("loadExample") }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-dropdown data-menu="settings" trigger="click">
        <el-button type="primary" icon="Setting">
          {{ t("toolbar.menu.settings") }}
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              data-command="manage-rules"
              @click="emitCommand('manage-rules')"
            >
              {{ t("toolbar.menu.settings.rule") }}
            </el-dropdown-item>
            <el-dropdown-item
              data-command="configure-theme"
              @click="emitCommand('configure-theme')"
            >
              {{ t("toolbar.menu.settings.theme") }}
            </el-dropdown-item>
            <el-dropdown-item
              data-command="configure-watermark"
              @click="emitCommand('configure-watermark')"
            >
              {{ t("toolbar.menu.settings.watermark") }}
            </el-dropdown-item>
            <el-dropdown-item
              data-command="manage-assets"
              @click="emitCommand('manage-assets')"
            >
              {{ t("toolbar.menu.settings.asset") }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-dropdown v-if="!props.isEmbed" data-menu="help" trigger="click">
        <el-button type="info" icon="QuestionFilled">
          {{ t("toolbar.menu.help") }}
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              data-command="show-update-log"
              @click="emitCommand('show-update-log')"
            >
              {{ t("updateLog") }}
            </el-dropdown-item>
            <el-dropdown-item
              data-command="show-feedback"
              @click="emitCommand('show-feedback')"
            >
              {{ t("feedback") }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-button
        type="danger"
        data-command="reset-workspace"
        @click="emitCommand('reset-workspace')"
      >
        {{ t("resetWorkspace") }}
      </el-button>
      <el-button
        type="warning"
        plain
        data-command="clear-canvas"
        @click="emitCommand('clear-canvas')"
      >
        {{ t("clearCanvas") }}
      </el-button>
    </div>

    <div class="toolbar-controls">
      <el-switch
        data-control="selection"
        :model-value="props.selectionEnabled"
        size="small"
        inline-prompt
        :active-text="t('switch.selection.on')"
        :inactive-text="t('switch.selection.off')"
        @update:model-value="updateSelectionEnabled"
      />
      <el-switch
        data-control="snap-grid"
        :model-value="props.snapGridEnabled"
        size="small"
        inline-prompt
        :active-text="t('switch.snapGrid.on')"
        :inactive-text="t('switch.snapGrid.off')"
        @update:model-value="updateSnapGridEnabled"
      />
      <el-switch
        data-control="snapline"
        :model-value="props.snaplineEnabled"
        size="small"
        inline-prompt
        :active-text="t('switch.snapline.on')"
        :inactive-text="t('switch.snapline.off')"
        @update:model-value="updateSnaplineEnabled"
      />
      <el-select
        data-control="locale"
        :model-value="props.locale"
        size="small"
        class="locale-select"
        @update:model-value="updateLocale"
      >
        <el-option
          v-for="option in languageOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElDropdown, ElDropdownItem, ElDropdownMenu } from "element-plus";
import type { EditorCommand } from "./editorCommands";

type EditorLocale = "zh" | "ja" | "en";
type Translate = (key: string, values?: Record<string, unknown>) => string;

const props = withDefaults(
  defineProps<{
    isEmbed?: boolean;
    selectionEnabled?: boolean;
    snapGridEnabled?: boolean;
    snaplineEnabled?: boolean;
    locale?: EditorLocale;
    translate?: Translate;
  }>(),
  {
    isEmbed: false,
    selectionEnabled: true,
    snapGridEnabled: true,
    snaplineEnabled: true,
    locale: "zh",
    translate: (key: string) => key,
  },
);

const emit = defineEmits<{
  command: [command: EditorCommand];
  "update:selectionEnabled": [enabled: boolean];
  "update:snapGridEnabled": [enabled: boolean];
  "update:snaplineEnabled": [enabled: boolean];
  "update:locale": [locale: EditorLocale];
}>();

const t = (key: string, values?: Record<string, unknown>) =>
  props.translate(key, values);

const languageOptions = computed(() => [
  { value: "zh" as const, label: t("locale.zh") },
  { value: "ja" as const, label: t("locale.ja") },
  { value: "en" as const, label: t("locale.en") },
]);

const emitCommand = (command: EditorCommand) => {
  emit("command", command);
};

const updateSelectionEnabled = (value: unknown) => {
  emit("update:selectionEnabled", Boolean(value));
};

const updateSnapGridEnabled = (value: unknown) => {
  emit("update:snapGridEnabled", Boolean(value));
};

const updateSnaplineEnabled = (value: unknown) => {
  emit("update:snaplineEnabled", Boolean(value));
};

const updateLocale = (value: unknown) => {
  if (value === "zh" || value === "ja" || value === "en") {
    emit("update:locale", value);
  }
};
</script>

<style scoped>
.toolbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  min-height: 48px;
  background: #f8f8f8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 8px;
  z-index: 100;
  box-sizing: border-box;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  overflow-y: hidden;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
}

.toolbar-actions :deep(.el-dropdown) {
  flex-shrink: 0;
}

.toolbar--embed {
  position: relative;
  top: auto;
  left: auto;
  right: auto;
  height: auto;
  padding: 6px 8px;
  border-bottom: 1px solid #e4e7ed;
}

.toolbar-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 0;
  flex-shrink: 0;
}

.locale-select {
  width: 110px;
}

.toolbar--embed .toolbar-actions {
  flex-wrap: nowrap;
}
</style>
