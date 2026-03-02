<template>
  <div class="toolbar" :class="{ 'toolbar--embed': props.isEmbed }">
    <div class="toolbar-actions">
      <el-button icon="Upload" type="primary" @click="openImportDialog">{{ t('import') }}</el-button>
      <el-button icon="Download" type="primary" @click="handleExport">{{ t('export') }}</el-button>
      <el-button icon="View" type="success" @click="handlePreviewData">数据预览</el-button>
      <el-button icon="Share" type="primary" @click="prepareCapture">{{ t('prepareCapture') }}</el-button>
      <el-button icon="Setting" type="primary" @click="state.showWatermarkDialog = true">{{ t('setWatermark') }}</el-button>
      <el-button icon="Picture" type="primary" plain @click="openAssetManager">素材管理</el-button>
      <el-button icon="EditPen" type="primary" plain @click="openRuleManager">规则管理</el-button>
      <el-button v-if="!props.isEmbed" type="info" @click="loadExample">{{ t('loadExample') }}</el-button>
      <el-button v-if="!props.isEmbed" type="info" @click="showUpdateLog">{{ t('updateLog') }}</el-button>
      <el-button v-if="!props.isEmbed" type="warning" @click="showFeedbackForm">{{ t('feedback') }}</el-button>
      <el-button type="danger" @click="handleResetWorkspace">重置工作区</el-button>
      <el-button type="warning" plain @click="handleClearCanvas">清空画布</el-button>
    </div>
    <div class="toolbar-controls">
      <el-switch
        v-model="selectionEnabled"
        size="small"
        inline-prompt
        active-text="框选开"
        inactive-text="框选关"
      />
      <el-switch
        v-model="snapGridEnabled"
        size="small"
        inline-prompt
        active-text="吸附开"
        inactive-text="吸附关"
      />
      <el-switch
        v-model="snaplineEnabled"
        size="small"
        inline-prompt
        active-text="对齐线开"
        inactive-text="对齐线关"
      />
    </div>

    <!-- 更新日志对话框 -->
    <el-dialog v-if="!props.isEmbed" v-model="state.showUpdateLogDialog" title="更新日志" width="60%">
      <ul>
        <li v-for="(log, index) in updateLogs" :key="index">
          <strong>版本 {{ log.version }} - {{ log.date }}</strong>
          <ul>
            <li v-for="(change, idx) in log.changes" :key="idx">{{ change }}</li>
          </ul>
        </li>
      </ul>
    </el-dialog>

    <!-- 问题反馈对话框 -->
    <el-dialog v-if="!props.isEmbed" v-model="state.showFeedbackFormDialog" title="更新日志" width="60%">
      <span style="font-size: 24px;">备注阴阳师</span>
      <br/>
      <img :src="contactImageUrl"
           style="cursor: pointer; vertical-align: bottom; width: 200px; height: auto;"/>
    </el-dialog>

    <!-- 预览弹窗 -->
    <el-dialog id="preview-container" v-model="state.previewVisible" width="80%" height="80%"
               :before-close="handleClose">
      <div style="max-height: 500px; overflow-y: auto;">
        <img v-if="state.previewImage" :src="state.previewImage" alt="Preview" style="width: 100%; display: block;"/>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="state.previewVisible = false">取 消</el-button>
        <el-button type="primary" @click="downloadImage">下 载</el-button>
      </span>
    </el-dialog>

    <!-- 水印设置弹窗 -->
    <el-dialog v-model="state.showWatermarkDialog" title="设置水印" width="30%">
      <el-form>
        <el-form-item label="水印文字">
          <el-input v-model="watermark.text"></el-input>
        </el-form-item>
        <el-form-item label="字体大小">
          <el-input-number v-model="watermark.fontSize" :min="10" :max="100"></el-input-number>
        </el-form-item>
        <el-form-item label="颜色">
          <el-color-picker v-model="watermark.color"></el-color-picker>
        </el-form-item>
        <el-form-item label="水印行数">
          <el-input-number v-model="watermark.rows" :min="1" :max="10"></el-input-number>
        </el-form-item>
        <el-form-item label="水印列数">
          <el-input-number v-model="watermark.cols" :min="1" :max="10"></el-input-number>
        </el-form-item>
        <el-form-item label="角度">
          <el-input-number v-model="watermark.angle" :min="-90" :max="90"></el-input-number>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="state.showWatermarkDialog = false">取消</el-button>
          <el-button type="primary" @click="applyWatermarkSettings">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 数据预览对话框 -->
    <el-dialog v-model="state.showDataPreviewDialog" title="数据预览" width="70%">
      <div style="max-height: 600px; overflow-y: auto;">
        <pre style="background: #f5f5f5; padding: 16px; border-radius: 4px; font-size: 12px; line-height: 1.5;">{{ state.previewDataContent }}</pre>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="state.showDataPreviewDialog = false">关闭</el-button>
          <el-button type="primary" @click="copyDataToClipboard">复制到剪贴板</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="state.showImportDialog" title="导入数据" width="560px">
      <el-form label-width="88px" class="import-form">
        <el-form-item label="导入来源">
          <el-radio-group v-model="importSource">
            <el-radio-button label="json">JSON 文件</el-radio-button>
            <el-radio-button label="teamCode">阵容码</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="importSource === 'teamCode'" label="阵容码">
          <el-input
            v-model="teamCodeInput"
            type="textarea"
            :rows="7"
            placeholder="请粘贴 #TA# 开头的阵容码"
          />
        </el-form-item>
        <el-form-item v-if="importSource === 'teamCode'" label="二维码">
          <div class="team-code-qr-actions">
            <input
              ref="teamCodeQrInputRef"
              type="file"
              accept="image/*"
              class="asset-upload-input"
              @change="handleTeamCodeQrImport"
            />
            <el-button
              type="primary"
              plain
              :loading="state.decodingTeamCodeQr"
              @click="triggerTeamCodeQrImport"
            >
              选择二维码图片
            </el-button>
            <span class="team-code-qr-tip">支持从截图或相册图片识别官方阵容码二维码</span>
          </div>
        </el-form-item>
        <el-alert
          v-if="importSource === 'teamCode'"
          type="info"
          :closable="false"
          show-icon
          title="支持粘贴阵容码字符串，或上传二维码图片自动识别。"
        />
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="state.showImportDialog = false">取消</el-button>
          <el-button
            v-if="importSource === 'json'"
            type="primary"
            @click="triggerJsonFileImport"
          >
            选择 JSON 文件
          </el-button>
          <el-button
            v-else
            type="primary"
            :loading="state.importingTeamCode"
            @click="handleTeamCodeImport"
          >
            导入阵容码
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 素材管理对话框 -->
    <el-dialog v-model="state.showAssetManagerDialog" title="素材管理" width="70%">
      <div class="asset-manager-actions">
        <input
          ref="assetUploadInputRef"
          type="file"
          accept="image/*"
          class="asset-upload-input"
          @change="handleAssetManagerUpload"
        />
        <el-button size="small" type="primary" @click="triggerAssetManagerUpload">
          上传当前分类素材
        </el-button>
      </div>

      <el-tabs v-model="assetManagerLibrary" class="asset-manager-tabs">
        <el-tab-pane
          v-for="library in assetLibraries"
          :key="library.id"
          :label="library.label"
          :name="library.id"
        >
          <div class="asset-manager-grid">
            <div
              v-for="item in getManagedAssets(library.id)"
              :key="item.id || `${item.name}-${item.avatar}`"
              class="asset-manager-item"
            >
              <div
                class="asset-manager-image"
                :style="{ backgroundImage: `url('${resolveAssetUrl(item.avatar)}')` }"
              />
              <div class="asset-manager-name">{{ item.name }}</div>
              <el-button
                size="small"
                text
                type="danger"
                @click="removeManagedAsset(library.id, item)"
              >
                删除
              </el-button>
            </div>
          </div>
          <el-empty
            v-if="getManagedAssets(library.id).length === 0"
            :description="`暂无${library.label}`"
          />
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <!-- 规则管理对话框 -->
    <el-dialog v-model="state.showRuleManagerDialog" title="规则管理" width="80%">
      <div class="rule-manager-actions">
        <el-button size="small" type="primary" @click="addExpressionRule">新增规则</el-button>
        <el-button size="small" type="primary" plain @click="addRuleVariable">新增变量</el-button>
        <el-button size="small" @click="exportRuleBundle">导出规则变量</el-button>
        <el-button size="small" @click="triggerRuleBundleImport">导入规则变量</el-button>
        <el-button size="small" @click="reloadRuleManagerDraft">重载当前配置</el-button>
        <el-button size="small" type="success" @click="applyRuleManagerConfig">应用并生效</el-button>
        <el-button size="small" type="warning" plain @click="restoreDefaultRuleConfig">恢复默认</el-button>
        <input
          ref="ruleBundleImportInputRef"
          type="file"
          accept=".json,application/json"
          class="asset-upload-input"
          @change="handleRuleBundleImport"
        />
      </div>

      <el-tabs v-model="ruleManagerTab" class="rule-manager-tabs">
        <el-tab-pane label="规则" name="rules">
          <div class="rule-table-wrap">
            <el-table
              v-if="ruleConfigDraft.expressionRules.length > 0"
              :data="ruleConfigDraft.expressionRules"
              size="small"
              border
              class="rule-table"
            >
              <el-table-column label="启用" width="70" align="center">
                <template #default="{ row }">
                  <el-checkbox v-model="row.enabled" />
                </template>
              </el-table-column>
              <el-table-column label="级别" width="110" align="center">
                <template #default="{ row }">
                  <el-select
                    v-model="row.severity"
                    size="small"
                    :class="['rule-inline-select', 'severity-select', `severity-select--${row.severity || 'warning'}`]"
                  >
                    <el-option label="warning" value="warning" />
                    <el-option label="error" value="error" />
                    <el-option label="info" value="info" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column prop="id" label="规则 ID" min-width="180" show-overflow-tooltip />
              <el-table-column label="条件" min-width="260" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="rule-cell-ellipsis">{{ row.condition }}</span>
                </template>
              </el-table-column>
              <el-table-column label="提示" min-width="180" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="rule-cell-ellipsis">{{ row.message }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="140" fixed="right">
                <template #default="{ $index }">
                  <el-button size="small" text type="primary" @click="openExpressionRuleEditor($index)">编辑</el-button>
                  <el-button size="small" text type="danger" @click="removeExpressionRule($index)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="暂无规则，点击“新增规则”创建" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="变量" name="variables">
          <div class="variable-list">
            <div
              v-for="(item, index) in ruleConfigDraft.ruleVariables"
              :key="`${item.key}-${index}`"
              class="variable-item"
            >
              <el-form-item label="Key" class="variable-key">
                <el-input v-model="item.key" placeholder="如: fire_supporters" />
              </el-form-item>
              <el-form-item label="Value" class="variable-value">
                <el-input
                  v-model="item.value"
                  type="textarea"
                  :rows="2"
                  placeholder="逗号或换行分隔，如：辉夜姬,座敷童子"
                />
              </el-form-item>
              <el-button size="small" text type="danger" @click="removeRuleVariable(index)">删除</el-button>
            </div>
            <el-empty v-if="ruleConfigDraft.ruleVariables.length === 0" description="暂无变量，点击“新增变量”创建" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="文档说明" name="docs">
          <div class="rule-docs">
            <h4>作用域约定</h4>
            <pre>{{ ruleScopeDoc }}</pre>
            <h4>可用上下文</h4>
            <pre>{{ ruleContextDoc }}</pre>
            <h4>支持语法</h4>
            <pre>{{ ruleSyntaxDoc }}</pre>
            <h4>支持函数</h4>
            <pre>{{ ruleFunctionDoc }}</pre>
            <h4>表达式示例</h4>
            <pre>{{ ruleExamplesDoc }}</pre>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <el-dialog v-model="ruleEditorVisible" title="编辑规则" width="56%">
      <el-form v-if="ruleEditorDraft" label-width="96px" class="rule-editor-form">
        <el-form-item label="启用">
          <el-switch v-model="ruleEditorDraft.enabled" />
        </el-form-item>
        <el-form-item label="规则 ID">
          <el-input v-model="ruleEditorDraft.id" placeholder="unique_rule_id" />
        </el-form-item>
        <el-form-item label="级别">
          <el-select
            v-model="ruleEditorDraft.severity"
            :class="['severity-select', `severity-select--${ruleEditorDraft.severity || 'warning'}`]"
            style="width: 100%"
          >
            <el-option label="warning" value="warning" />
            <el-option label="error" value="error" />
            <el-option label="info" value="info" />
          </el-select>
        </el-form-item>
        <el-form-item label="告警 code">
          <el-input v-model="ruleEditorDraft.code" placeholder="CUSTOM_EXPRESSION" />
        </el-form-item>
        <el-form-item label="条件表达式">
          <el-input
            v-model="ruleEditorDraft.condition"
            type="textarea"
            :rows="3"
            placeholder='示例：count(intersect(map(ctx.team.shikigamis, "name"), getVar("供火式神"))) == 0'
          />
        </el-form-item>
        <el-form-item label="提示文案">
          <el-input v-model="ruleEditorDraft.message" placeholder="规则提示文案" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelRuleEditor">取消</el-button>
          <el-button type="primary" @click="saveRuleEditor">保存</el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted, onBeforeUnmount, ref } from 'vue';
import updateLogs from "../data/updateLog.json"
import { useFilesStore } from "@/ts/useStore";
import { useGlobalMessage } from "@/ts/useGlobalMessage";
import { getLogicFlowInstance, useLogicFlowScope } from '@/ts/useLogicFlow';
import { useCanvasSettings } from '@/ts/useCanvasSettings';
import { useSafeI18n } from '@/ts/useSafeI18n';
import type { Pinia } from 'pinia';
import { resolveAssetUrl } from '@/utils/assetUrl';
import { useToolbarImportExportCommands } from '@/components/composables/useToolbarImportExportCommands';
import { useToolbarAssetManagement } from '@/components/composables/useToolbarAssetManagement';
import { useToolbarRuleManagement } from '@/components/composables/useToolbarRuleManagement';
import { useToolbarWorkspaceCommands } from '@/components/composables/useToolbarWorkspaceCommands';

const props = withDefaults(defineProps<{
  isEmbed?: boolean;
  piniaInstance?: Pinia;
}>(), {
  isEmbed: false
});

const filesStore = props.piniaInstance ? useFilesStore(props.piniaInstance) : useFilesStore();
const logicFlowScope = useLogicFlowScope();
filesStore.bindLogicFlowScope(logicFlowScope);
const contactImageUrl = resolveAssetUrl('/assets/Other/Contact.png') as string;
const { showMessage } = useGlobalMessage();
const { selectionEnabled, snapGridEnabled, snaplineEnabled } = useCanvasSettings();

const { t } = useSafeI18n({
  import: '导入',
  export: '导出',
  prepareCapture: '准备截图',
  setWatermark: '设置水印',
  loadExample: '加载样例',
  updateLog: '更新日志',
  feedback: '问题反馈'
});

// 定义响应式数据
const state = reactive({
  previewImage: null, // 用于存储预览图像的数据URL
  previewVisible: false, // 控制预览弹窗的显示状态
  showWatermarkDialog: false, // 控制水印设置弹窗的显示状态,
  showUpdateLogDialog: false, // 控制更新日志对话框的显示状态
  showFeedbackFormDialog: false, // 控制反馈表单对话框的显示状态
  showDataPreviewDialog: false, // 控制数据预览对话框的显示状态
  showImportDialog: false, // 控制导入来源对话框
  importingTeamCode: false, // 阵容码导入中
  decodingTeamCodeQr: false, // 阵容码二维码识别中
  showAssetManagerDialog: false, // 控制素材管理对话框的显示状态
  showRuleManagerDialog: false, // 控制规则管理对话框的显示状态
  previewDataContent: '', // 存储预览的数据内容
});
const importSource = ref<'json' | 'teamCode'>('json');
const teamCodeInput = ref('');
const teamCodeQrInputRef = ref<HTMLInputElement | null>(null);
const {
  assetLibraries,
  assetManagerLibrary,
  assetUploadInputRef,
  mountAssetManagement,
  disposeAssetManagement,
  openAssetManager,
  getManagedAssets,
  triggerAssetManagerUpload,
  handleAssetManagerUpload,
  removeManagedAsset,
} = useToolbarAssetManagement({
  state,
  showMessage,
});
const {
  ruleBundleImportInputRef,
  ruleManagerTab,
  ruleConfigDraft,
  ruleEditorVisible,
  ruleEditorDraft,
  ruleScopeDoc,
  ruleContextDoc,
  ruleSyntaxDoc,
  ruleFunctionDoc,
  ruleExamplesDoc,
  openRuleManager,
  addExpressionRule,
  addRuleVariable,
  exportRuleBundle,
  triggerRuleBundleImport,
  reloadRuleManagerDraft,
  applyRuleManagerConfig,
  restoreDefaultRuleConfig,
  handleRuleBundleImport,
  openExpressionRuleEditor,
  removeExpressionRule,
  removeRuleVariable,
  cancelRuleEditor,
  saveRuleEditor,
} = useToolbarRuleManagement({
  state,
  showMessage,
});

// 重新渲染 LogicFlow 画布的通用方法
const refreshLogicFlowCanvas = (message?: string) => {
  setTimeout(() => {
    const logicFlowInstance = getLogicFlowInstance(logicFlowScope);
    if (logicFlowInstance) {
      // 获取当前活动文件的数据
      const currentFileData = filesStore.getTab(filesStore.activeFileId);
      if (currentFileData) {
        // 清空画布并重新渲染
        logicFlowInstance.clearData();
        // 注意：此处根据你的画布 API 传入 graphRawData 或整个文件数据
        const data = (currentFileData as any).graphRawData || currentFileData;
        logicFlowInstance.render(data);
        console.log(message || 'LogicFlow 画布已重新渲染');
      }
    }
  }, 100); // 延迟一点确保数据更新完成
};

const {
  loadExample,
  handleResetWorkspace,
  handleClearCanvas,
} = useToolbarWorkspaceCommands({
  filesStore,
  logicFlowScope,
  showMessage,
  refreshLogicFlowCanvas,
});

const CURRENT_APP_VERSION = updateLogs[0].version;
const showUpdateLog = () => {
  state.showUpdateLogDialog = !state.showUpdateLogDialog;
};

onMounted(() => {
  mountAssetManagement();

  if (props.isEmbed) {
    return;
  }

  const lastVersion = localStorage.getItem('appVersion');

  if (lastVersion !== CURRENT_APP_VERSION) {
    // 如果版本号不同，则显示更新日志对话框
    state.showUpdateLogDialog = true;
    // 更新本地存储中的版本号为当前版本
    localStorage.setItem('appVersion', CURRENT_APP_VERSION);
  }
});

onBeforeUnmount(() => {
  disposeAssetManagement();
});


const showFeedbackForm = () => {
  state.showFeedbackFormDialog = !state.showFeedbackFormDialog;
};

const watermark = reactive({
  text: localStorage.getItem('watermark.text') || '示例水印',
  fontSize: Number(localStorage.getItem('watermark.fontSize')) || 30,
  color: localStorage.getItem('watermark.color') || 'rgba(184, 184, 184, 0.3)',
  angle: Number(localStorage.getItem('watermark.angle')) || -20,
  rows: Number(localStorage.getItem('watermark.rows')) || 1,
  cols: Number(localStorage.getItem('watermark.cols')) || 1,
});

const applyWatermarkSettings = () => {
  // 保存水印设置到 localStorage
  localStorage.setItem('watermark.text', watermark.text);
  localStorage.setItem('watermark.fontSize', String(watermark.fontSize));
  localStorage.setItem('watermark.color', watermark.color);
  localStorage.setItem('watermark.angle', String(watermark.angle));
  localStorage.setItem('watermark.rows', String(watermark.rows));
  localStorage.setItem('watermark.cols', String(watermark.cols));

  state.showWatermarkDialog = false;
};

const {
  handleExport,
  handlePreviewData,
  copyDataToClipboard,
  openImportDialog,
  triggerJsonFileImport,
  triggerTeamCodeQrImport,
  handleTeamCodeImport,
  handleTeamCodeQrImport,
  prepareCapture,
  downloadImage,
  handleClose,
} = useToolbarImportExportCommands({
  state,
  filesStore,
  logicFlowScope,
  importSource,
  teamCodeInput,
  teamCodeQrInputRef,
  watermark,
  showMessage,
  refreshLogicFlowCanvas,
});
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
  align-items: center;
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

.toolbar--embed .toolbar-actions {
  flex-wrap: nowrap;
}

.title {
  flex-grow: 1;
  text-align: center;
  font-size: 16px;
}

.left, .right {
  flex-basis: 120px;
  display: flex;
  gap: 8px;
}

.asset-manager-actions {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.import-form {
  margin-top: 4px;
}

.team-code-qr-actions {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
}

.team-code-qr-tip {
  font-size: 12px;
  color: #606266;
}

.asset-upload-input {
  display: none;
}

.asset-manager-tabs {
  min-height: 360px;
}

.asset-manager-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.asset-manager-item {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.asset-manager-image {
  width: 80px;
  height: 80px;
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
}

.asset-manager-name {
  width: 100%;
  text-align: center;
  font-size: 12px;
  color: #303133;
  word-break: break-all;
}

.rule-manager-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.rule-manager-tabs {
  min-height: 420px;
}

.rule-table-wrap,
.variable-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.variable-item {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 12px;
  background: #fafafa;
}

.rule-table :deep(.el-table__cell) {
  padding-top: 6px;
  padding-bottom: 6px;
}

.rule-inline-select {
  width: 100%;
}

.severity-select--warning :deep(.el-input__wrapper) {
  background: #fff7ed;
  box-shadow: inset 0 0 0 1px #fed7aa;
}

.severity-select--warning :deep(.el-input__inner) {
  color: #9a3412;
}

.severity-select--error :deep(.el-input__wrapper) {
  background: #fef2f2;
  box-shadow: inset 0 0 0 1px #fecaca;
}

.severity-select--error :deep(.el-input__inner) {
  color: #b91c1c;
}

.severity-select--info :deep(.el-input__wrapper) {
  background: #eff6ff;
  box-shadow: inset 0 0 0 1px #bfdbfe;
}

.severity-select--info :deep(.el-input__inner) {
  color: #1d4ed8;
}

.rule-cell-ellipsis {
  display: inline-block;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rule-editor-form :deep(.el-form-item) {
  margin-bottom: 14px;
}

.variable-item {
  display: grid;
  grid-template-columns: 220px 1fr auto;
  gap: 12px;
  align-items: start;
}

.variable-key,
.variable-value {
  margin-bottom: 0;
}

.rule-docs {
  max-height: 460px;
  overflow-y: auto;
  padding-right: 4px;
}

.rule-docs h4 {
  margin: 6px 0;
  color: #303133;
}

.rule-docs pre {
  margin: 0 0 12px;
  padding: 10px;
  border-radius: 6px;
  background: #f5f7fa;
  color: #606266;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 900px) {
  .variable-item {
    grid-template-columns: 1fr;
  }
}
</style>
