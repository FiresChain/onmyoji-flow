<template>
  <el-dialog
    v-model="showUpdateLogDialog"
    data-dialog="update-log"
    :title="t('updateLog')"
    width="60%"
  >
    <ul>
      <li v-for="(log, index) in updateLogs" :key="index">
        <strong>
          {{ t("updateLog.versionPrefix") }} {{ log.version }} -
          {{ log.date }}
        </strong>
        <ul>
          <li v-for="(change, changeIndex) in log.changes" :key="changeIndex">
            {{ change }}
          </li>
        </ul>
      </li>
    </ul>
  </el-dialog>

  <el-dialog
    v-model="showFeedbackFormDialog"
    data-dialog="feedback"
    :title="t('feedback')"
    width="60%"
  >
    <span style="font-size: 24px">{{ t("feedback.contactTitle") }}</span>
    <br />
    <img
      :src="props.contactImageUrl"
      style="
        cursor: pointer;
        vertical-align: bottom;
        width: 200px;
        height: auto;
      "
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

import updateLogs from "@/data/updateLog.json";
import { createSafeStorage } from "@/shared/platform/storage";

type Translate = (key: string, values?: Record<string, unknown>) => string;

const APP_VERSION_STORAGE_KEY = "appVersion";
const currentAppVersion = updateLogs[0]?.version ?? "";

const props = withDefaults(
  defineProps<{
    contactImageUrl: string;
    translate?: Translate;
  }>(),
  {
    translate: (key: string) => key,
  },
);

const showUpdateLogDialog = ref(false);
const showFeedbackFormDialog = ref(false);

const t = (key: string, values?: Record<string, unknown>) =>
  props.translate(key, values);

const showUpdateLog = () => {
  showUpdateLogDialog.value = !showUpdateLogDialog.value;
};

const showFeedbackForm = () => {
  showFeedbackFormDialog.value = !showFeedbackFormDialog.value;
};

onMounted(() => {
  const appVersionStorage = createSafeStorage(APP_VERSION_STORAGE_KEY);
  if (appVersionStorage.read() === currentAppVersion) {
    return;
  }
  showUpdateLogDialog.value = true;
  appVersionStorage.write(currentAppVersion);
});

defineExpose({
  showUpdateLog,
  showFeedbackForm,
});
</script>
