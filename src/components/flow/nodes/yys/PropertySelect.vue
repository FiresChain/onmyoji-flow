<template>
  <YuhunSelect
    :showSelectYuhun="showYuhunSelect"
    :currentYuhun="currentYuhun"
    @closeSelectYuhun="closeYuhunSelect"
    @updateYuhun="updateYuhunSelect"
  />

  <el-dialog v-model="show" :title="t('yys.selector.dialogTitle')" width="80%">
    <el-form :model="property" label-width="120px">
      <el-tabs v-model="activeTab">
        <!-- 基础属性选项卡 -->
        <el-tab-pane :label="t('yys.selector.tab.basic')" name="basic">
          <el-form-item :label="t('yys.selector.propertyType')">
            <el-select v-model="property.type" @change="handleTypeChange">
              <el-option
                v-for="type in propertyTypes"
                :key="type.value"
                :label="type.label"
                :value="type.value"
              />
            </el-select>
          </el-form-item>

          <!-- 攻击属性 -->
          <div v-if="property.type === 'attack'">
            <el-form-item :label="t('yys.selector.attackType')">
              <el-radio-group v-model="property.attackType">
                <el-radio label="fixed" size="large">{{
                  t("yys.selector.fixedValue")
                }}</el-radio>
                <el-radio label="percentage" size="large">{{
                  t("yys.selector.percentageValue")
                }}</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item :label="t('yys.selector.attackValue')">
              <el-input-number
                v-model="property.attackValue"
                :min="0"
                :precision="property.attackType === 'percentage' ? 1 : 0"
              />
              <span v-if="property.attackType === 'percentage'">%</span>
            </el-form-item>
          </div>

          <!-- 生命属性 -->
          <div v-if="property.type === 'health'">
            <el-form-item :label="t('yys.selector.healthType')">
              <el-radio-group v-model="property.healthType">
                <el-radio label="fixed" size="large">{{
                  t("yys.selector.fixedValue")
                }}</el-radio>
                <el-radio label="percentage" size="large">{{
                  t("yys.selector.percentageValue")
                }}</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item :label="t('yys.selector.healthValue')">
              <el-input-number
                v-model="property.healthValue"
                :min="0"
                :precision="property.healthType === 'percentage' ? 1 : 0"
              />
              <span v-if="property.healthType === 'percentage'">%</span>
            </el-form-item>
          </div>

          <!-- 防御属性 -->
          <div v-if="property.type === 'defense'">
            <el-form-item :label="t('yys.selector.defenseType')">
              <el-radio-group v-model="property.defenseType">
                <el-radio label="fixed" size="large">{{
                  t("yys.selector.fixedValue")
                }}</el-radio>
                <el-radio label="percentage" size="large">{{
                  t("yys.selector.percentageValue")
                }}</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item :label="t('yys.selector.defenseValue')">
              <el-input-number
                v-model="property.defenseValue"
                :min="0"
                :precision="property.defenseType === 'percentage' ? 1 : 0"
              />
              <span v-if="property.defenseType === 'percentage'">%</span>
            </el-form-item>
          </div>

          <!-- 速度属性 -->
          <div v-if="property.type === 'speed'">
            <el-form-item :label="t('yys.selector.speedValue')">
              <el-input-number
                v-model="property.speedValue"
                :min="0"
                :precision="0"
              />
            </el-form-item>
          </div>

          <!-- 暴击相关属性 -->
          <div v-if="property.type === 'crit'">
            <el-form-item :label="t('yys.selector.critRate')">
              <el-input-number
                v-model="property.critRate"
                :min="0"
                :max="100"
                :precision="1"
              />
              <span>%</span>
            </el-form-item>
          </div>

          <div v-if="property.type === 'critDmg'">
            <el-form-item :label="t('yys.selector.critDamage')">
              <el-input-number
                v-model="property.critDmg"
                :min="0"
                :precision="1"
              />
              <span>%</span>
            </el-form-item>
          </div>

          <!-- 效果命中与抵抗 -->
          <div v-if="property.type === 'effectHit'">
            <el-form-item :label="t('yys.selector.effectHit')">
              <el-input-number
                v-model="property.effectHitValue"
                :min="0"
                :precision="1"
              />
              <span>%</span>
            </el-form-item>
          </div>

          <div v-if="property.type === 'effectResist'">
            <el-form-item :label="t('yys.selector.effectResist')">
              <el-input-number
                v-model="property.effectResistValue"
                :min="0"
                :precision="1"
              />
              <span>%</span>
            </el-form-item>
          </div>

          <!-- 所有属性都显示的字段 -->
          <el-form-item :label="t('yys.selector.priority')">
            <el-select v-model="property.priority">
              <el-option
                :label="t('yys.selector.priority.required')"
                value="required"
              />
              <el-option
                :label="t('yys.selector.priority.recommended')"
                value="recommended"
              />
              <el-option
                :label="t('yys.selector.priority.optional')"
                value="optional"
              />
            </el-select>
          </el-form-item>
        </el-tab-pane>

        <!-- 式神要求选项卡 -->
        <el-tab-pane :label="t('yys.selector.tab.shikigami')" name="shikigami">
          <el-form-item :label="t('yys.property.levelRequired')">
            <el-radio-group v-model="property.levelRequired" class="ml-4">
              <el-radio value="40" size="large">40</el-radio>
              <el-radio value="0" size="large">{{
                t("yys.property.sacrifice")
              }}</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item :label="t('yys.property.skillRequired')">
            <el-radio-group v-model="property.skillRequiredMode" class="ml-4">
              <el-radio value="all" size="large">{{
                t("yys.property.skillAll")
              }}</el-radio>
              <el-radio value="111" size="large">111</el-radio>
              <el-radio value="custom" size="large">{{
                t("yys.property.skillCustom")
              }}</el-radio>
            </el-radio-group>
            <div
              v-if="property.skillRequiredMode === 'custom'"
              style="display: flex; flex-direction: row; gap: 10px; width: 100%"
            >
              <el-select
                v-for="(value, index) in property.skillRequired"
                :key="index"
                :placeholder="value"
                style="margin-bottom: 10px"
                @change="updateSkillRequired(index, $event)"
              >
                <el-option label="*" value="X" />
                <el-option label="1" value="1" />
                <el-option label="2" value="2" />
                <el-option label="3" value="3" />
                <el-option label="4" value="4" />
                <el-option label="5" value="5" />
              </el-select>
            </div>
          </el-form-item>
        </el-tab-pane>

        <!-- 御魂要求选项卡 -->
        <el-tab-pane :label="t('yys.selector.tab.yuhun')" name="yuhun">
          <div style="display: flex; flex-direction: row; width: 100%">
            <div style="display: flex; flex-direction: column; width: 50%">
              <el-form-item :label="t('yys.property.yuhunSet')">
                <div
                  style="
                    display: flex;
                    flex-direction: row;
                    flex-wrap: wrap;
                    gap: 5px;
                  "
                >
                  <img
                    v-for="(effect, index) in property.yuhun.yuhunSetEffect"
                    :key="index"
                    style="width: 50px; height: 50px"
                    :src="effect.avatar"
                    class="image"
                    @click="openYuhunSelect(index)"
                  />
                  <el-button type="primary" @click="openYuhunSelect(-1)">
                    <el-icon :size="20">
                      <CirclePlus />
                    </el-icon>
                  </el-button>
                </div>
              </el-form-item>

              <el-form-item :label="t('yys.selector.yuhunTarget')">
                <el-select
                  v-model="yuhunTarget"
                  @change="handleYuhunTargetChange"
                >
                  <el-option
                    v-for="option in yuhunTargetOptions"
                    :key="option.value"
                    :label="t(option.label)"
                    :value="option.value"
                  />
                </el-select>
              </el-form-item>
            </div>

            <div style="display: flex; flex-direction: column; width: 50%">
              <el-form-item :label="t('yys.property.slot2Main')">
                <el-select
                  multiple
                  collapse-tags
                  collapse-tags-tooltip
                  :max-collapse-tags="2"
                  v-model="property.yuhun.property2"
                >
                  <el-option
                    :label="t('yuhun_property.fullName.Attack')"
                    value="Attack"
                  />
                  <el-option
                    :label="t('yuhun_property.fullName.Defense')"
                    value="Defense"
                  />
                  <el-option
                    :label="t('yuhun_property.fullName.Health')"
                    value="Health"
                  />
                  <el-option
                    :label="t('yuhun_property.fullName.Speed')"
                    value="Speed"
                  />
                </el-select>
              </el-form-item>

              <el-form-item :label="t('yys.property.slot4Main')">
                <el-select
                  multiple
                  collapse-tags
                  collapse-tags-tooltip
                  :max-collapse-tags="2"
                  v-model="property.yuhun.property4"
                >
                  <el-option
                    :label="t('yuhun_property.fullName.Attack')"
                    value="Attack"
                  />
                  <el-option
                    :label="t('yuhun_property.fullName.Defense')"
                    value="Defense"
                  />
                  <el-option
                    :label="t('yuhun_property.fullName.Health')"
                    value="Health"
                  />
                  <el-option
                    :label="t('yuhun_property.fullName.ControlHit')"
                    value="ControlHit"
                  />
                  <el-option
                    :label="t('yuhun_property.fullName.ControlMiss')"
                    value="ControlMiss"
                  />
                </el-select>
              </el-form-item>

              <el-form-item :label="t('yys.property.slot6Main')">
                <el-select
                  multiple
                  collapse-tags
                  collapse-tags-tooltip
                  :max-collapse-tags="2"
                  v-model="property.yuhun.property6"
                >
                  <el-option
                    :label="t('yuhun_property.fullName.Attack')"
                    value="Attack"
                  />
                  <el-option
                    :label="t('yuhun_property.fullName.Defense')"
                    value="Defense"
                  />
                  <el-option
                    :label="t('yuhun_property.fullName.Health')"
                    value="Health"
                  />
                  <el-option
                    :label="t('yuhun_property.fullName.Crit')"
                    value="Crit"
                  />
                  <el-option
                    :label="t('yuhun_property.fullName.CritDamage')"
                    value="CritDamage"
                  />
                </el-select>
              </el-form-item>
            </div>
          </div>
        </el-tab-pane>

        <!-- 效果指标选项卡 -->
        <el-tab-pane :label="t('yys.selector.tab.effect')" name="effect">
          <el-form-item :label="t('yys.selector.expectedDamage')">
            <el-input-number v-model="property.expectedDamage" :min="0" />
          </el-form-item>

          <el-form-item :label="t('yys.selector.survivalRate')">
            <el-slider
              v-model="property.survivalRate"
              :step="10"
              :marks="{
                0: t('yys.selector.survivalMark.weak'),
                50: t('yys.selector.survivalMark.medium'),
                100: t('yys.selector.survivalMark.strong'),
              }"
            />
          </el-form-item>

          <el-form-item :label="t('yys.selector.damageType')">
            <el-select v-model="property.damageType">
              <el-option
                :label="t('yys.selector.damageType.normal')"
                value="normal"
              />
              <el-option
                :label="t('yys.selector.damageType.skill')"
                value="skill"
              />
              <el-option
                :label="t('yys.selector.damageType.balanced')"
                value="balanced"
              />
            </el-select>
          </el-form-item>
        </el-tab-pane>
      </el-tabs>

      <el-form-item :label="t('yys.property.extraDescription')">
        <el-input v-model="property.description" type="textarea" />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="confirm">{{
          t("common.confirm")
        }}</el-button>
        <el-button @click="emit('closePropertySelect')">{{
          t("common.cancel")
        }}</el-button>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { CirclePlus } from "@element-plus/icons-vue";
import { useSafeI18n } from "@/ts/useSafeI18n";
// import YuhunSelect from "@/components/flow/nodes/yys/YuhunSelect.vue";

// 获取当前的 i18n 实例
const { t } = useSafeI18n();

const props = defineProps({
  currentProperty: {
    type: Object,
    default: () => ({
      type: "attack",
      priority: "optional",
      description: "",
    }),
  },
  showPropertySelect: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["closePropertySelect", "updateProperty"]);

const show = computed({
  get() {
    return props.showPropertySelect;
  },
  set(value) {
    if (!value) {
      emit("closePropertySelect");
    }
  },
});

const property = ref({});
const activeTab = ref("basic");
const yuhunTarget = ref("");
const yuhunTargetOptions = ref([]);
const showYuhunSelect = ref(false);
const currentYuhun = ref({});
const yuhunSelectIndex = ref(-1);

const propertyTypes = ref([
  { label: t("yys.selector.type.attack"), value: "attack" },
  { label: t("yys.selector.type.health"), value: "health" },
  { label: t("yys.selector.type.defense"), value: "defense" },
  { label: t("yys.selector.type.speed"), value: "speed" },
  { label: t("yys.selector.type.crit"), value: "crit" },
  { label: t("yys.selector.type.critDmg"), value: "critDmg" },
  { label: t("yys.selector.type.effectHit"), value: "effectHit" },
  { label: t("yys.selector.type.effectResist"), value: "effectResist" },
]);

watch(
  () => props.currentProperty,
  (newVal) => {
    if (newVal) {
      property.value = JSON.parse(JSON.stringify(newVal));
    }
  },
  { deep: true, immediate: true },
);

const handleTypeChange = (newType) => {
  // Reset related fields when type changes
};

const updateSkillRequired = (index, value) => {
  property.value.skillRequired[index] = value;
};

const openYuhunSelect = (index) => {
  yuhunSelectIndex.value = index;
  showYuhunSelect.value = true;
};

const closeYuhunSelect = () => {
  showYuhunSelect.value = false;
};

const updateYuhunSelect = (yuhun) => {
  if (yuhunSelectIndex.value === -1) {
    property.value.yuhun.yuhunSetEffect.push(yuhun);
  } else {
    property.value.yuhun.yuhunSetEffect[yuhunSelectIndex.value] = yuhun;
  }
  closeYuhunSelect();
};

const handleYuhunTargetChange = (value) => {
  // Handle change
};

const confirm = () => {
  emit("updateProperty", property.value);
};
</script>

<style scoped>
.el-form-item {
  margin-bottom: 18px;
}

.image {
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}
</style>
