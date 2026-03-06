<template>
  <div class="toolbar" :class="{ 'toolbar--embed': props.isEmbed }">
    <div class="toolbar-actions">
      <el-dropdown trigger="click">
        <el-button type="primary" icon="FolderOpened">
          {{ t("toolbar.menu.file") }}
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="openImportDialog">{{
              t("import")
            }}</el-dropdown-item>
            <el-dropdown-item @click="handleExport">{{
              t("export")
            }}</el-dropdown-item>
            <el-dropdown-item @click="handlePreviewData">{{
              t("previewData")
            }}</el-dropdown-item>
            <el-dropdown-item @click="prepareCapture">{{
              t("prepareCapture")
            }}</el-dropdown-item>
            <el-dropdown-item v-if="!props.isEmbed" @click="loadExample">{{
              t("loadExample")
            }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-dropdown trigger="click">
        <el-button type="primary" icon="Setting">
          {{ t("toolbar.menu.settings") }}
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="openRuleManager">{{
              t("toolbar.menu.settings.rule")
            }}</el-dropdown-item>
            <el-dropdown-item @click="openNodeSizeDialog">{{
              t("toolbar.menu.settings.theme")
            }}</el-dropdown-item>
            <el-dropdown-item @click="openWatermarkDialog">{{
              t("toolbar.menu.settings.watermark")
            }}</el-dropdown-item>
            <el-dropdown-item @click="openAssetManager">{{
              t("toolbar.menu.settings.asset")
            }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-dropdown v-if="!props.isEmbed" trigger="click">
        <el-button type="info" icon="QuestionFilled">
          {{ t("toolbar.menu.help") }}
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="showUpdateLog">{{
              t("updateLog")
            }}</el-dropdown-item>
            <el-dropdown-item @click="showFeedbackForm">{{
              t("feedback")
            }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <div class="toolbar-actions-legacy" aria-hidden="true">
        <el-button @click="openImportDialog">{{ t("import") }}</el-button>
        <el-button @click="handleExport">{{ t("export") }}</el-button>
        <el-button @click="handlePreviewData">{{ t("previewData") }}</el-button>
        <el-button @click="prepareCapture">{{ t("prepareCapture") }}</el-button>
        <el-button @click="openWatermarkDialog">{{ t("setWatermark") }}</el-button>
        <el-button @click="openAssetManager">{{ t("assetManager") }}</el-button>
        <el-button @click="openRuleManager">{{ t("ruleManager") }}</el-button>
        <el-button v-if="!props.isEmbed" @click="loadExample">{{
          t("loadExample")
        }}</el-button>
        <el-button v-if="!props.isEmbed" @click="showUpdateLog">{{
          t("updateLog")
        }}</el-button>
        <el-button v-if="!props.isEmbed" @click="showFeedbackForm">{{
          t("feedback")
        }}</el-button>
      </div>

      <el-button type="danger" @click="handleResetWorkspace">{{
        t("resetWorkspace")
      }}</el-button>
      <el-button type="warning" plain @click="handleClearCanvas">{{
        t("clearCanvas")
      }}</el-button>
    </div>
    <div class="toolbar-controls">
      <el-switch
        v-model="selectionEnabled"
        size="small"
        inline-prompt
        :active-text="t('switch.selection.on')"
        :inactive-text="t('switch.selection.off')"
      />
      <el-switch
        v-model="snapGridEnabled"
        size="small"
        inline-prompt
        :active-text="t('switch.snapGrid.on')"
        :inactive-text="t('switch.snapGrid.off')"
      />
      <el-switch
        v-model="snaplineEnabled"
        size="small"
        inline-prompt
        :active-text="t('switch.snapline.on')"
        :inactive-text="t('switch.snapline.off')"
      />
      <el-select
        v-model="currentLanguage"
        size="small"
        class="locale-select"
        @change="handleLanguageChange"
      >
        <el-option
          v-for="option in languageOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>
    </div>

    <!-- 更新日志对话框 -->
    <el-dialog
      v-if="!props.isEmbed"
      v-model="state.showUpdateLogDialog"
      :title="t('updateLog')"
      width="60%"
    >
      <ul>
        <li v-for="(log, index) in updateLogs" :key="index">
          <strong>{{ t("updateLog.versionPrefix") }} {{ log.version }} - {{ log.date }}</strong>
          <ul>
            <li v-for="(change, idx) in log.changes" :key="idx">
              {{ change }}
            </li>
          </ul>
        </li>
      </ul>
    </el-dialog>

    <!-- 问题反馈对话框 -->
    <el-dialog
      v-if="!props.isEmbed"
      v-model="state.showFeedbackFormDialog"
      :title="t('feedback')"
      width="60%"
    >
      <span style="font-size: 24px">{{ t("feedback.contactTitle") }}</span>
      <br />
      <img
        :src="contactImageUrl"
        style="
          cursor: pointer;
          vertical-align: bottom;
          width: 200px;
          height: auto;
        "
      />
    </el-dialog>

    <!-- 预览弹窗 -->
    <el-dialog
      id="preview-container"
      v-model="state.previewVisible"
      width="80%"
      height="80%"
      :before-close="handleClose"
    >
      <div style="max-height: 500px; overflow-y: auto">
        <img
          v-if="state.previewImage"
          :src="state.previewImage"
          :alt="t('preview.alt')"
          style="width: 100%; display: block"
        />
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="state.previewVisible = false">{{
          t("common.cancel")
        }}</el-button>
        <el-button type="primary" @click="downloadImage">{{
          t("common.download")
        }}</el-button>
      </span>
    </el-dialog>

    <!-- 水印设置弹窗 -->
    <el-dialog
      v-model="state.showWatermarkDialog"
      :title="t('setWatermark')"
      width="30%"
    >
      <el-form>
        <el-form-item :label="t('watermark.text')">
          <el-input v-model="watermark.text"></el-input>
        </el-form-item>
        <el-form-item :label="t('watermark.fontSize')">
          <el-input-number
            v-model="watermark.fontSize"
            :min="10"
            :max="100"
          ></el-input-number>
        </el-form-item>
        <el-form-item :label="t('watermark.color')">
          <el-color-picker v-model="watermark.color"></el-color-picker>
        </el-form-item>
        <el-form-item :label="t('watermark.rows')">
          <el-input-number
            v-model="watermark.rows"
            :min="1"
            :max="10"
          ></el-input-number>
        </el-form-item>
        <el-form-item :label="t('watermark.cols')">
          <el-input-number
            v-model="watermark.cols"
            :min="1"
            :max="10"
          ></el-input-number>
        </el-form-item>
        <el-form-item :label="t('watermark.angle')">
          <el-input-number
            v-model="watermark.angle"
            :min="-90"
            :max="90"
          ></el-input-number>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="state.showWatermarkDialog = false">{{
            t("common.cancel")
          }}</el-button>
          <el-button type="primary" @click="applyWatermarkSettings">{{
            t("common.confirm")
          }}</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showNodeSizeDialog"
      :title="t('nodeSize.title')"
      width="640px"
    >
      <div class="node-size-grid">
        <div class="node-size-row node-size-row--header">
          <span class="node-size-label"></span>
          <span class="node-size-dimension">{{ t("nodeSize.width") }}</span>
          <span class="node-size-dimension">{{ t("nodeSize.height") }}</span>
          <span class="node-size-dimension">{{
            t("nodeSize.section.assetStyle")
          }}</span>
          <span class="node-size-dimension">{{
            t("nodeSize.section.assetName")
          }}</span>
        </div>
        <div class="node-size-row">
          <span class="node-size-label">{{ t("flow.components.image.name") }}</span>
          <el-input-number
            v-model="nodeSizeDraft.imageNode.width"
            :min="40"
            :max="1200"
            controls-position="right"
            size="small"
          />
          <el-input-number
            v-model="nodeSizeDraft.imageNode.height"
            :min="40"
            :max="1200"
            controls-position="right"
            size="small"
          />
          <span class="node-size-placeholder">-</span>
          <span class="node-size-placeholder">-</span>
        </div>
        <div
          v-for="library in nodeSizeLibraries"
          :key="library"
          class="node-size-row"
        >
          <span class="node-size-label">{{ t(`assetLibrary.${library}`) }}</span>
          <el-input-number
            v-model="nodeSizeDraft.assetSelectorByLibrary[library].width"
            :min="40"
            :max="1200"
            controls-position="right"
            size="small"
          />
          <el-input-number
            v-model="nodeSizeDraft.assetSelectorByLibrary[library].height"
            :min="40"
            :max="1200"
            controls-position="right"
            size="small"
          />
          <el-button
            size="small"
            class="node-size-action"
            @click="openThemeDetailDialog(library, 'nodeStyle')"
          >
            {{ t("common.edit") }}
          </el-button>
          <el-button
            size="small"
            class="node-size-action"
            @click="openThemeDetailDialog(library, 'name')"
          >
            {{ t("common.edit") }}
          </el-button>
        </div>
      </div>
      <div class="node-theme-toggle">
        <span class="node-size-label">{{ t("nodeSize.enableTheme") }}</span>
        <el-switch v-model="nodeSizeDraft.assetThemeEnabled" />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleResetNodeSizeConfig">{{
            t("nodeSize.reset")
          }}</el-button>
          <el-button
            type="primary"
            plain
            :loading="state.applyingThemeToCurrent"
            @click="applyThemeToCurrentCanvas"
          >
            {{ t("nodeSize.applyCurrent") }}
          </el-button>
          <el-button @click="showNodeSizeDialog = false">{{
            t("common.close")
          }}</el-button>
          <el-button type="primary" @click="applyNodeSizeConfig">{{
            t("common.confirm")
          }}</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showThemeDetailDialog"
      :title="themeDetailDialogTitle"
      width="620px"
      @closed="themeDetailDraft = null"
    >
      <div
        v-if="themeDetailMode === 'nodeStyle' && themeDetailDraft"
        class="node-theme-grid"
      >
        <div class="node-theme-item">
          <span class="node-size-label">{{ t("flow.style.fill") }}</span>
          <el-color-picker v-model="themeDetailDraft.nodeStyle.fill" />
        </div>
        <div class="node-theme-item">
          <span class="node-size-label">{{ t("flow.style.stroke") }}</span>
          <el-color-picker v-model="themeDetailDraft.nodeStyle.stroke" />
        </div>
        <div class="node-theme-item">
          <span class="node-size-label">{{ t("flow.style.stroke") }} px</span>
          <el-input-number
            v-model="themeDetailDraft.nodeStyle.strokeWidth"
            :min="0"
            :max="20"
            controls-position="right"
            size="small"
          />
        </div>
        <div class="node-theme-item">
          <span class="node-size-label">{{ t("flow.style.radius") }}</span>
          <el-input-number
            v-model="themeDetailDraft.nodeStyle.radius"
            :min="0"
            :max="200"
            controls-position="right"
            size="small"
          />
        </div>
        <div class="node-theme-item node-theme-item--full">
          <span class="node-size-label">{{ t("flow.style.opacity") }}</span>
          <el-slider
            v-model="themeDetailDraft.nodeStyle.opacity"
            :min="0"
            :max="1"
            :step="0.05"
            show-input
            :show-input-controls="false"
          />
        </div>
      </div>
      <div v-else-if="themeDetailDraft" class="node-theme-grid">
        <div class="node-theme-item">
          <span class="node-size-label">{{ t("assetPanel.nameVisible") }}</span>
          <el-switch v-model="themeDetailDraft.name.show" />
        </div>
        <div class="node-theme-item">
          <span class="node-size-label">{{ t("nodeSize.nameOffsetX") }}</span>
          <el-input-number
            v-model="themeDetailDraft.name.offsetX"
            :min="-600"
            :max="600"
            controls-position="right"
            size="small"
          />
        </div>
        <div class="node-theme-item">
          <span class="node-size-label">{{ t("nodeSize.nameOffsetY") }}</span>
          <el-input-number
            v-model="themeDetailDraft.name.offsetY"
            :min="-600"
            :max="600"
            controls-position="right"
            size="small"
          />
        </div>
        <div class="node-theme-item">
          <span class="node-size-label">{{ t("nodeSize.nameWidth") }}</span>
          <el-input-number
            v-model="themeDetailDraft.name.width"
            :min="40"
            :max="1200"
            controls-position="right"
            size="small"
          />
        </div>
        <div class="node-theme-item">
          <span class="node-size-label">{{ t("nodeSize.nameHeight") }}</span>
          <el-input-number
            v-model="themeDetailDraft.name.height"
            :min="20"
            :max="1200"
            controls-position="right"
            size="small"
          />
        </div>
        <div class="node-theme-item">
          <span class="node-size-label">{{ t("nodeSize.textColor") }}</span>
          <el-color-picker v-model="themeDetailDraft.name.textStyle.color" />
        </div>
        <div class="node-theme-item">
          <span class="node-size-label">{{ t("nodeSize.fontSize") }}</span>
          <el-input-number
            v-model="themeDetailDraft.name.textStyle.fontSize"
            :min="8"
            :max="96"
            controls-position="right"
            size="small"
          />
        </div>
        <div class="node-theme-item">
          <span class="node-size-label">{{ t("nodeSize.fontWeight") }}</span>
          <el-select v-model="themeDetailDraft.name.textStyle.fontWeight" size="small">
            <el-option :label="t('flow.style.weight.300')" :value="300" />
            <el-option :label="t('flow.style.weight.400')" :value="400" />
            <el-option :label="t('flow.style.weight.500')" :value="500" />
            <el-option :label="t('flow.style.weight.600')" :value="600" />
            <el-option :label="t('flow.style.weight.700')" :value="700" />
          </el-select>
        </div>
        <div class="node-theme-item">
          <span class="node-size-label">{{ t("nodeSize.lineHeight") }}</span>
          <el-input-number
            v-model="themeDetailDraft.name.textStyle.lineHeight"
            :min="0.8"
            :max="3"
            :step="0.1"
            controls-position="right"
            size="small"
          />
        </div>
        <div class="node-theme-item">
          <span class="node-size-label">{{ t("flow.style.textAlign") }}</span>
          <el-select v-model="themeDetailDraft.name.textStyle.align" size="small">
            <el-option :label="t('flow.style.align.left')" value="left" />
            <el-option :label="t('flow.style.align.center')" value="center" />
            <el-option :label="t('flow.style.align.right')" value="right" />
          </el-select>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="confirmThemeDetailDialog">{{
            t("common.confirm")
          }}</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 数据预览对话框 -->
    <el-dialog
      v-model="state.showDataPreviewDialog"
      :title="t('previewData')"
      width="70%"
    >
      <div style="max-height: 600px; overflow-y: auto">
        <pre
          style="
            background: #f5f5f5;
            padding: 16px;
            border-radius: 4px;
            font-size: 12px;
            line-height: 1.5;
          "
          >{{ state.previewDataContent }}</pre
        >
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="state.showDataPreviewDialog = false">{{
            t("common.close")
          }}</el-button>
          <el-button type="primary" @click="copyDataToClipboard">{{
            t("copyClipboard")
          }}</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="state.showImportDialog" title="导入数据" width="560px">
      <el-form label-width="88px" class="import-form">
        <el-form-item :label="t('importDialog.source')">
          <el-radio-group v-model="importSource">
            <el-radio-button label="json">{{
              t("importDialog.source.json")
            }}</el-radio-button>
            <el-radio-button label="teamCode">{{
              t("importDialog.source.teamCode")
            }}</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item
          v-if="importSource === 'teamCode'"
          :label="t('importDialog.teamCode')"
        >
          <el-input
            v-model="teamCodeInput"
            type="textarea"
            :rows="7"
            :placeholder="t('importDialog.teamCodePlaceholder')"
          />
        </el-form-item>
        <el-form-item v-if="importSource === 'teamCode'" :label="t('importDialog.qr')">
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
              {{ t("importDialog.qrChoose") }}
            </el-button>
            <span class="team-code-qr-tip">{{ t("importDialog.qrTip") }}</span>
          </div>
        </el-form-item>
        <el-alert
          v-if="importSource === 'teamCode'"
          type="info"
          :closable="false"
          show-icon
          :title="t('importDialog.alert')"
        />
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="state.showImportDialog = false">{{
            t("common.cancel")
          }}</el-button>
          <el-button
            v-if="importSource === 'json'"
            type="primary"
            @click="triggerJsonFileImport"
          >
            {{ t("importDialog.chooseJson") }}
          </el-button>
          <el-button
            v-else
            type="primary"
            :loading="state.importingTeamCode"
            @click="handleTeamCodeImport"
          >
            {{ t("importDialog.importTeamCode") }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 素材管理对话框 -->
    <el-dialog
      v-model="state.showAssetManagerDialog"
      :title="t('assetManager')"
      width="70%"
    >
      <div class="asset-manager-actions">
        <input
          ref="assetUploadInputRef"
          type="file"
          accept="image/*"
          class="asset-upload-input"
          @change="handleAssetManagerUpload"
        />
        <el-button
          size="small"
          type="primary"
          @click="triggerAssetManagerUpload"
        >
          {{ t("assetManager.uploadCurrent") }}
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
                :style="{
                  backgroundImage: `url('${resolveAssetUrl(item.avatar)}')`,
                }"
              />
              <div class="asset-manager-name">{{ item.name }}</div>
              <el-button
                size="small"
                text
                type="danger"
                @click="removeManagedAsset(library.id, item)"
              >
                {{ t("common.delete") }}
              </el-button>
            </div>
          </div>
          <el-empty
            v-if="getManagedAssets(library.id).length === 0"
            :description="t('assetManager.empty', { label: library.label })"
          />
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <!-- 规则管理对话框 -->
    <el-dialog
      v-model="state.showRuleManagerDialog"
      :title="t('ruleManager')"
      width="80%"
    >
      <div class="rule-manager-actions">
        <el-button size="small" type="primary" @click="addExpressionRule">{{
          t("ruleManager.addRule")
        }}</el-button>
        <el-button size="small" type="primary" plain @click="addRuleVariable">{{
          t("ruleManager.addVariable")
        }}</el-button>
        <el-button size="small" @click="exportRuleBundle">{{
          t("ruleManager.exportBundle")
        }}</el-button>
        <el-button size="small" @click="triggerRuleBundleImport">{{
          t("ruleManager.importBundle")
        }}</el-button>
        <el-button size="small" @click="reloadRuleManagerDraft">{{
          t("ruleManager.reload")
        }}</el-button>
        <el-button size="small" type="success" @click="applyRuleManagerConfig">{{
          t("ruleManager.apply")
        }}</el-button>
        <el-button
          size="small"
          type="warning"
          plain
          @click="restoreDefaultRuleConfig"
          >{{ t("ruleManager.restoreDefault") }}</el-button>
        <input
          ref="ruleBundleImportInputRef"
          type="file"
          accept=".json,application/json"
          class="asset-upload-input"
          @change="handleRuleBundleImport"
        />
      </div>

      <el-tabs v-model="ruleManagerTab" class="rule-manager-tabs">
        <el-tab-pane :label="t('ruleManager.tab.rules')" name="rules">
          <div class="rule-table-wrap">
            <el-table
              v-if="ruleConfigDraft.expressionRules.length > 0"
              :data="ruleConfigDraft.expressionRules"
              size="small"
              border
              class="rule-table"
            >
              <el-table-column :label="t('ruleManager.column.enabled')" width="70" align="center">
                <template #default="{ row }">
                  <el-checkbox v-model="row.enabled" />
                </template>
              </el-table-column>
              <el-table-column :label="t('ruleManager.column.severity')" width="110" align="center">
                <template #default="{ row }">
                  <el-select
                    v-model="row.severity"
                    size="small"
                    :class="[
                      'rule-inline-select',
                      'severity-select',
                      `severity-select--${row.severity || 'warning'}`,
                    ]"
                  >
                    <el-option :label="t('ruleSeverity.warning')" value="warning" />
                    <el-option :label="t('ruleSeverity.error')" value="error" />
                    <el-option :label="t('ruleSeverity.info')" value="info" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column :label="t('ruleManager.column.scope')" width="130" align="center">
                <template #default="{ row }">
                  <el-select
                    v-model="row.scopeKind"
                    size="small"
                    class="rule-inline-select"
                  >
                    <el-option :label="t('ruleScope.team')" value="team" />
                    <el-option :label="t('ruleScope.shikigami')" value="shikigami" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column
                prop="id"
                :label="t('ruleManager.column.id')"
                min-width="180"
                show-overflow-tooltip
              />
              <el-table-column
                :label="t('ruleManager.column.condition')"
                min-width="260"
                show-overflow-tooltip
              >
                <template #default="{ row }">
                  <span class="rule-cell-ellipsis">{{ row.condition }}</span>
                </template>
              </el-table-column>
              <el-table-column
                :label="t('ruleManager.column.message')"
                min-width="180"
                show-overflow-tooltip
              >
                <template #default="{ row }">
                  <span class="rule-cell-ellipsis">{{ row.message }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="t('ruleManager.column.actions')" width="140" fixed="right">
                <template #default="{ $index }">
                  <el-button
                    size="small"
                    text
                    type="primary"
                    @click="openExpressionRuleEditor($index)"
                    >{{ t("common.edit") }}</el-button>
                  <el-button
                    size="small"
                    text
                    type="danger"
                    @click="removeExpressionRule($index)"
                    >{{ t("common.delete") }}</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else :description="t('ruleManager.emptyRules')" />
          </div>
        </el-tab-pane>

        <el-tab-pane :label="t('ruleManager.tab.variables')" name="variables">
          <div class="variable-list">
            <div
              v-for="(item, index) in ruleConfigDraft.ruleVariables"
              :key="`${item.key}-${index}`"
              class="variable-item"
            >
              <el-form-item :label="t('ruleManager.variable.key')" class="variable-key">
                <el-input
                  v-model="item.key"
                  :placeholder="t('ruleManager.variable.keyPlaceholder')"
                />
              </el-form-item>
              <el-form-item :label="t('ruleManager.variable.value')" class="variable-value">
                <el-input
                  v-model="item.value"
                  type="textarea"
                  :rows="2"
                  :placeholder="t('ruleManager.variable.valuePlaceholder')"
                />
              </el-form-item>
              <el-button
                size="small"
                text
                type="danger"
                @click="removeRuleVariable(index)"
                >{{ t("common.delete") }}</el-button>
            </div>
            <el-empty
              v-if="ruleConfigDraft.ruleVariables.length === 0"
              :description="t('ruleManager.emptyVariables')"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane :label="t('ruleManager.tab.docs')" name="docs">
          <div class="rule-docs">
            <h4>{{ t("ruleManager.docs.scope") }}</h4>
            <pre>{{ ruleScopeDoc }}</pre>
            <h4>{{ t("ruleManager.docs.context") }}</h4>
            <pre>{{ ruleContextDoc }}</pre>
            <h4>{{ t("ruleManager.docs.syntax") }}</h4>
            <pre>{{ ruleSyntaxDoc }}</pre>
            <h4>{{ t("ruleManager.docs.functions") }}</h4>
            <pre>{{ ruleFunctionDoc }}</pre>
            <h4>{{ t("ruleManager.docs.examples") }}</h4>
            <pre>{{ ruleExamplesDoc }}</pre>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <el-dialog v-model="ruleEditorVisible" :title="t('ruleEditor.title')" width="56%">
      <el-form
        v-if="ruleEditorDraft"
        label-width="96px"
        class="rule-editor-form"
      >
        <el-form-item :label="t('ruleEditor.enabled')">
          <el-switch v-model="ruleEditorDraft.enabled" />
        </el-form-item>
        <el-form-item :label="t('ruleEditor.id')">
          <el-input
            v-model="ruleEditorDraft.id"
            :placeholder="t('ruleEditor.idPlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('ruleEditor.severity')">
          <el-select
            v-model="ruleEditorDraft.severity"
            :class="[
              'severity-select',
              `severity-select--${ruleEditorDraft.severity || 'warning'}`,
            ]"
            style="width: 100%"
          >
            <el-option :label="t('ruleSeverity.warning')" value="warning" />
            <el-option :label="t('ruleSeverity.error')" value="error" />
            <el-option :label="t('ruleSeverity.info')" value="info" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('ruleEditor.scope')">
          <el-select v-model="ruleEditorDraft.scopeKind" style="width: 100%">
            <el-option :label="t('ruleScope.team')" value="team" />
            <el-option :label="t('ruleScope.shikigami')" value="shikigami" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('ruleEditor.code')">
          <el-input
            v-model="ruleEditorDraft.code"
            :placeholder="t('ruleEditor.codePlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('ruleEditor.condition')">
          <el-input
            v-model="ruleEditorDraft.condition"
            type="textarea"
            :rows="3"
            :placeholder="t('ruleEditor.conditionPlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('ruleEditor.message')">
          <el-input
            v-model="ruleEditorDraft.message"
            :placeholder="t('ruleEditor.messagePlaceholder')"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelRuleEditor">{{ t("common.cancel") }}</el-button>
          <el-button type="primary" @click="saveRuleEditor">{{
            t("common.save")
          }}</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { ElDropdown, ElDropdownItem, ElDropdownMenu } from "element-plus";
import updateLogs from "../data/updateLog.json";
import { useFilesStore } from "@/ts/useStore";
import { useGlobalMessage } from "@/ts/useGlobalMessage";
import { getLogicFlowInstance, useLogicFlowScope } from "@/ts/useLogicFlow";
import { useCanvasSettings } from "@/ts/useCanvasSettings";
import { useSafeI18n } from "@/ts/useSafeI18n";
import type { Pinia } from "pinia";
import { ASSET_LIBRARY_IDS, type AssetLibraryId } from "@/types/assets";
import { resolveAssetUrl } from "@/utils/assetUrl";
import { applyAssetThemeToCurrentFile } from "@/utils/assetTheme";
import {
  type AssetThemeConfig,
  cloneNodeCreateSizeConfig,
  DEFAULT_NODE_CREATE_SIZE_CONFIG,
  normalizeNodeCreateSizeConfig,
  readNodeCreateSizeConfig,
  resolveAssetThemeEnabled,
  writeNodeCreateSizeConfig,
} from "@/utils/nodeCreateSizeConfig";
import { useToolbarImportExportCommands } from "@/components/composables/useToolbarImportExportCommands";
import { useToolbarAssetManagement } from "@/components/composables/useToolbarAssetManagement";
import { useToolbarRuleManagement } from "@/components/composables/useToolbarRuleManagement";
import { useToolbarWorkspaceCommands } from "@/components/composables/useToolbarWorkspaceCommands";
import { useToolbarDialogState } from "@/components/composables/useToolbarDialogState";
import { useToolbarCanvasRefresh } from "@/components/composables/useToolbarCanvasRefresh";

const props = withDefaults(
  defineProps<{
    isEmbed?: boolean;
    piniaInstance?: Pinia;
  }>(),
  {
    isEmbed: false,
  },
);

const filesStore = props.piniaInstance
  ? useFilesStore(props.piniaInstance)
  : useFilesStore();
const logicFlowScope = useLogicFlowScope();
filesStore.bindLogicFlowScope(logicFlowScope);
const contactImageUrl = resolveAssetUrl("/assets/Other/Contact.png") as string;
const { showMessage } = useGlobalMessage();
const { selectionEnabled, snapGridEnabled, snaplineEnabled } =
  useCanvasSettings();

type SupportedLocale = "zh" | "ja" | "en";
const LOCALE_STORAGE_KEY = "yys-editor.locale";
const normalizeLocale = (input: unknown): SupportedLocale => {
  const value =
    typeof input === "string" ? input.trim().toLowerCase().split("-")[0] : "";
  if (value === "ja" || value === "en") {
    return value;
  }
  return "zh";
};
const safeI18n = useSafeI18n();
const t = safeI18n.t;
const getLocale =
  typeof (safeI18n as any).getLocale === "function"
    ? (safeI18n as any).getLocale
    : () => "zh";
const setLocale =
  typeof (safeI18n as any).setLocale === "function"
    ? (safeI18n as any).setLocale
    : (_nextLocale: string) => {};

const currentLanguage = ref<SupportedLocale>(normalizeLocale(getLocale()));

const languageOptions = computed(() => [
  { value: "zh" as const, label: t("locale.zh") },
  { value: "ja" as const, label: t("locale.ja") },
  { value: "en" as const, label: t("locale.en") },
]);

const handleLanguageChange = (nextLocale: SupportedLocale) => {
  const normalized = normalizeLocale(nextLocale);
  currentLanguage.value = normalized;
  setLocale(normalized);
  localStorage.setItem(LOCALE_STORAGE_KEY, normalized);
};

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
  previewDataContent: "", // 存储预览的数据内容
  applyingThemeToCurrent: false,
});
const importSource = ref<"json" | "teamCode">("json");
const teamCodeInput = ref("");
const teamCodeQrInputRef = ref<HTMLInputElement | null>(null);
const {
  watermark,
  showUpdateLog,
  showFeedbackForm,
  openWatermarkDialog,
  applyWatermarkSettings,
  mountDialogState,
} = useToolbarDialogState({
  state,
  isEmbed: props.isEmbed,
  currentAppVersion: updateLogs[0].version,
});
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

const { refreshLogicFlowCanvas } = useToolbarCanvasRefresh({
  filesStore,
  logicFlowScope,
});

const { loadExample, handleResetWorkspace, handleClearCanvas } =
  useToolbarWorkspaceCommands({
    filesStore,
    logicFlowScope,
    showMessage,
    refreshLogicFlowCanvas,
  });

const nodeSizeLibraries: AssetLibraryId[] = [...ASSET_LIBRARY_IDS];
const showNodeSizeDialog = ref(false);
const nodeSizeDraft = ref(readNodeCreateSizeConfig());
const showThemeDetailDialog = ref(false);
const themeDetailLibrary = ref<AssetLibraryId>("shikigami");
const themeDetailMode = ref<"nodeStyle" | "name">("nodeStyle");
const themeDetailDraft = ref<AssetThemeConfig | null>(null);
const cloneAssetThemeDraft = (value: AssetThemeConfig): AssetThemeConfig => ({
  nodeStyle: {
    ...value.nodeStyle,
  },
  name: {
    ...value.name,
    textStyle: {
      ...value.name.textStyle,
    },
  },
});
const themeDetailDialogTitle = computed(() => {
  const sectionKey =
    themeDetailMode.value === "nodeStyle"
      ? "nodeSize.section.assetStyle"
      : "nodeSize.section.assetName";
  return `${t(`assetLibrary.${themeDetailLibrary.value}`)} · ${t(sectionKey)}`;
});
const clearThemeDetailDialog = () => {
  showThemeDetailDialog.value = false;
  themeDetailDraft.value = null;
};

const openThemeDetailDialog = (
  library: AssetLibraryId,
  mode: "nodeStyle" | "name",
) => {
  themeDetailLibrary.value = library;
  themeDetailMode.value = mode;
  themeDetailDraft.value = cloneAssetThemeDraft(
    nodeSizeDraft.value.assetThemeByLibrary[library],
  );
  showThemeDetailDialog.value = true;
};
const confirmThemeDetailDialog = () => {
  if (!themeDetailDraft.value) {
    clearThemeDetailDialog();
    return;
  }
  nodeSizeDraft.value.assetThemeByLibrary[themeDetailLibrary.value] =
    cloneAssetThemeDraft(themeDetailDraft.value);
  clearThemeDetailDialog();
};

const openNodeSizeDialog = () => {
  nodeSizeDraft.value = readNodeCreateSizeConfig();
  showNodeSizeDialog.value = true;
};

const applyNodeSizeConfig = () => {
  nodeSizeDraft.value = writeNodeCreateSizeConfig(nodeSizeDraft.value);
  showNodeSizeDialog.value = false;
  showMessage("success", t("nodeSize.message.applied"));
};

const applyThemeToCurrentCanvas = () => {
  const logicFlowInstance = getLogicFlowInstance(logicFlowScope);
  if (!logicFlowInstance) {
    showMessage("error", t("nodeSize.message.applyCurrentFailed"));
    return;
  }
  if (!resolveAssetThemeEnabled({ config: nodeSizeDraft.value })) {
    showMessage("warning", t("nodeSize.message.themeDisabled"));
    return;
  }
  state.applyingThemeToCurrent = true;
  try {
    nodeSizeDraft.value = normalizeNodeCreateSizeConfig(nodeSizeDraft.value);
    applyAssetThemeToCurrentFile(logicFlowInstance as any, {
      config: nodeSizeDraft.value,
    });
    showMessage("success", t("nodeSize.message.applyCurrentSuccess"));
  } finally {
    state.applyingThemeToCurrent = false;
  }
};

const handleResetNodeSizeConfig = () => {
  nodeSizeDraft.value = cloneNodeCreateSizeConfig(
    DEFAULT_NODE_CREATE_SIZE_CONFIG,
  );
  showMessage("success", t("nodeSize.message.reset"));
};

onMounted(() => {
  mountAssetManagement();
  mountDialogState();
});

onBeforeUnmount(() => {
  disposeAssetManagement();
});

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

.toolbar-actions :deep(.el-dropdown) {
  flex-shrink: 0;
}

.toolbar-actions-legacy {
  display: none;
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

.title {
  flex-grow: 1;
  text-align: center;
  font-size: 16px;
}

.left,
.right {
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

.node-size-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
  margin-bottom: 10px;
}

.node-size-row {
  display: grid;
  grid-template-columns: 1fr 120px 120px 120px 120px;
  gap: 10px;
  align-items: center;
}

.node-size-label {
  font-size: 13px;
  color: #303133;
}

.node-size-row--header {
  margin-bottom: 2px;
}

.node-size-dimension {
  font-size: 12px;
  color: #909399;
  text-align: center;
}

.node-size-placeholder {
  text-align: center;
  color: #c0c4cc;
  font-size: 12px;
}

.node-size-action {
  width: 100%;
}

.node-theme-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0 10px;
}

.node-theme-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
}

.node-theme-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.node-theme-item :deep(.el-select),
.node-theme-item :deep(.el-input-number),
.node-theme-item :deep(.el-slider) {
  flex: 1;
}

.node-theme-item--full {
  grid-column: 1 / -1;
}

@media (max-width: 900px) {
  .variable-item {
    grid-template-columns: 1fr;
  }
  .node-size-row {
    grid-template-columns: 1fr;
    justify-items: stretch;
  }
  .node-theme-grid {
    grid-template-columns: 1fr;
  }
}
</style>
