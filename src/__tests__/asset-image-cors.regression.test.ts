import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import GenericImageSelector from "@/components/common/GenericImageSelector.vue";
import type { SelectorConfig } from "@/types/selector";

const passthroughStub = defineComponent({
  template: "<div><slot /></div>",
});

const buttonStub = defineComponent({
  emits: ["click"],
  template: '<button type="button" @click="$emit(\'click\')"><slot /></button>',
});

const config: SelectorConfig = {
  title: "选择式神",
  dataSource: [
    {
      id: "604",
      name: "测试式神",
      avatar:
        "https://onmyoji-assets.fireschain.org/assets/Shikigami/ssr/604.png",
    },
  ],
  groups: [{ label: "全部", name: "ALL" }],
  itemRender: {
    imageField: "avatar",
    labelField: "name",
  },
  searchable: false,
};

describe("asset image CORS loading", () => {
  it("loads selector thumbnails as anonymous CORS images", () => {
    const wrapper = mount(GenericImageSelector, {
      props: {
        config,
        modelValue: true,
      },
      global: {
        stubs: {
          "el-dialog": passthroughStub,
          "el-tabs": passthroughStub,
          "el-tab-pane": passthroughStub,
          "el-space": passthroughStub,
          "el-button": buttonStub,
          "el-input": true,
        },
      },
    });

    const thumbnail = wrapper.get("img.selector-image-frame");
    expect(thumbnail.attributes("crossorigin")).toBe("anonymous");
    expect(thumbnail.attributes("src")).toBe(
      "https://onmyoji-assets.fireschain.org/assets/Shikigami/ssr/604.png",
    );
    expect(wrapper.find('[style*="background-image"]').exists()).toBe(false);
  });
});
