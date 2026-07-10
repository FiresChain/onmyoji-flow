import { defineComponent, h, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import updateLogs from "@/data/updateLog.json";
import AboutDialogs from "@/shells/standalone/AboutDialogs.vue";

const DialogStub = defineComponent({
  name: "ElDialog",
  inheritAttrs: false,
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    width: {
      type: String,
      required: true,
    },
  },
  emits: ["update:modelValue"],
  setup(props, { attrs, slots }) {
    return () =>
      h(
        "section",
        {
          "data-dialog": attrs["data-dialog"],
          "data-visible": String(props.modelValue),
          "data-title": props.title,
          "data-width": props.width,
        },
        props.modelValue ? slots.default?.() : [],
      );
  },
});

type AboutDialogsExposed = {
  showUpdateLog(): void;
  showFeedbackForm(): void;
};

const translate = (key: string) => `translated:${key}`;

const createWrapper = () =>
  mount(AboutDialogs, {
    props: {
      contactImageUrl: "/assets/Other/Contact.png",
      translate,
    },
    global: {
      stubs: {
        ElDialog: DialogStub,
      },
    },
  });

const getDialog = (
  wrapper: ReturnType<typeof createWrapper>,
  name: "update-log" | "feedback",
) => wrapper.get(`[data-dialog="${name}"]`);

describe("AboutDialogs", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens the update log once for a new app version and persists it", async () => {
    const wrapper = createWrapper();
    await nextTick();

    expect(getDialog(wrapper, "update-log").attributes("data-visible")).toBe(
      "true",
    );
    expect(localStorage.getItem("appVersion")).toBe(updateLogs[0].version);
  });

  it("keeps the update log closed when the stored version is current", () => {
    localStorage.setItem("appVersion", updateLogs[0].version);

    const wrapper = createWrapper();

    expect(getDialog(wrapper, "update-log").attributes("data-visible")).toBe(
      "false",
    );
    expect(getDialog(wrapper, "feedback").attributes("data-visible")).toBe(
      "false",
    );
  });

  it("exposes dialog toggles and preserves titles, widths, and content", async () => {
    localStorage.setItem("appVersion", updateLogs[0].version);
    const wrapper = createWrapper();
    const exposed = wrapper.vm as unknown as AboutDialogsExposed;

    exposed.showUpdateLog();
    exposed.showFeedbackForm();
    await nextTick();

    const updateDialog = getDialog(wrapper, "update-log");
    const feedbackDialog = getDialog(wrapper, "feedback");
    expect(updateDialog.attributes()).toMatchObject({
      "data-visible": "true",
      "data-title": "translated:updateLog",
      "data-width": "60%",
    });
    expect(updateDialog.text()).toContain(
      `translated:updateLog.versionPrefix ${updateLogs[0].version} - ${updateLogs[0].date}`,
    );
    expect(updateDialog.text()).toContain(updateLogs[0].changes[0]);
    expect(feedbackDialog.attributes()).toMatchObject({
      "data-visible": "true",
      "data-title": "translated:feedback",
      "data-width": "60%",
    });
    expect(feedbackDialog.text()).toContain("translated:feedback.contactTitle");
    expect(feedbackDialog.get("img").attributes("src")).toBe(
      "/assets/Other/Contact.png",
    );

    exposed.showUpdateLog();
    exposed.showFeedbackForm();
    await nextTick();
    expect(getDialog(wrapper, "update-log").attributes("data-visible")).toBe(
      "false",
    );
    expect(getDialog(wrapper, "feedback").attributes("data-visible")).toBe(
      "false",
    );
  });

  it("stays usable when browser storage access throws", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage read denied");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage write denied");
    });

    const wrapper = createWrapper();
    await nextTick();

    expect(getDialog(wrapper, "update-log").attributes("data-visible")).toBe(
      "true",
    );
  });
});
