import { createApp } from "vue";
import App from "./App.vue";

import ElementPlus, { ElMessageBox } from "element-plus";
import "element-plus/dist/index.css";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";

import Vue3DraggableResizable from "vue3-draggable-resizable";
// default styles
import "vue3-draggable-resizable/dist/Vue3DraggableResizable.css";

import { createI18n } from "vue-i18n";

// 引入语言文件
import zh from "./locales/zh.json";
import ja from "./locales/ja.json";
import en from "./locales/en.json";

import { createPinia } from "pinia"; // 导入 Pinia
import { useFilesStore } from "./ts/useStore";

const app = createApp(App);

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// 定义支持的语言列表
const supportedLanguages = ["zh", "ja", "en"];

const normalizeLocale = (input) => {
  if (typeof input !== "string") return "";
  const value = input.trim().toLowerCase();
  if (!value) return "";
  const short = value.split("-")[0];
  return supportedLanguages.includes(short) ? short : "";
};

const resolveLocale = () => {
  const queryLocale =
    typeof window !== "undefined"
      ? normalizeLocale(new URLSearchParams(window.location.search).get("lang"))
      : "";
  const storedLocale =
    typeof localStorage !== "undefined"
      ? normalizeLocale(localStorage.getItem("yys-editor.locale"))
      : "";
  const browserLocale =
    typeof navigator !== "undefined" ? normalizeLocale(navigator.language) : "";
  const locale = queryLocale || storedLocale || browserLocale || "zh";

  if (typeof localStorage !== "undefined" && queryLocale && queryLocale !== storedLocale) {
    localStorage.setItem("yys-editor.locale", queryLocale);
  }

  return locale;
};

const locale = resolveLocale();

const i18n = createI18n({
  locale: locale, // 设置默认语言
  fallbackLocale: "zh", // 设置备用语言
  messages: {
    zh,
    ja,
    en,
  },
});

const messageBoxLocaleMap = {
  zh: { confirm: "确定", cancel: "取消" },
  ja: { confirm: "確認", cancel: "キャンセル" },
  en: { confirm: "Confirm", cancel: "Cancel" },
};
const messageBoxLocale = messageBoxLocaleMap[locale] || messageBoxLocaleMap.zh;

// 设置ElMessageBox的默认配置
ElMessageBox.defaults = {
  confirmButtonText: messageBoxLocale.confirm,
  cancelButtonText: messageBoxLocale.cancel,
  type: "warning", // 默认类型为警告
  center: true, // 文字居中
  customClass: "my-message-box", // 自定义类名，用于CSS样式覆盖
};

const pinia = createPinia(); // 创建 Pinia 实例

app
  .use(pinia) // 使用 Pinia
  .use(i18n)
  .use(ElementPlus)
  .use(Vue3DraggableResizable)
  .mount("#app");

const filesStore = useFilesStore();
