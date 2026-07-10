import iconDynamicGroup from "@/assets/component-icons/dynamic-group.svg";
import iconEllipse from "@/assets/component-icons/ellipse.svg";
import iconImage from "@/assets/component-icons/image.svg";
import iconRect from "@/assets/component-icons/rect.svg";
import iconText from "@/assets/component-icons/text.svg";
import iconVector from "@/assets/component-icons/vector.svg";
import type { AssetLibraryId } from "@/features/assets/public";

import {
  ASSET_SELECTOR_NODE_TYPE,
  createAssetSelectorNodeProperties,
} from "./asset-selector/definition";
import {
  DYNAMIC_GROUP_NODE_TYPE,
  createDynamicGroupNodeProperties,
} from "./dynamic-group/definition";
import { IMAGE_NODE_TYPE, createImageNodeProperties } from "./image/definition";
import { TEXT_NODE_TYPE, createTextNodeProperties } from "./text/definition";
import {
  VECTOR_NODE_TYPE,
  createVectorNodeProperties,
} from "./vector/definition";

export interface NodePaletteItem {
  id: string;
  name: string;
  type: string;
  description: string;
  createProperties: () => Record<string, unknown>;
  icon: string;
}

export interface NodePaletteGroup {
  id: string;
  title: string;
  components: NodePaletteItem[];
}

export interface CreateNodePaletteOptions {
  t?: (key: string) => string;
  assetPreviewByLibrary?: Partial<Record<AssetLibraryId, string>>;
}

const createRectProperties = (): Record<string, unknown> => ({
  width: 150,
  height: 150,
  style: {
    background: "#fff",
    border: "2px solid black",
  },
});

const createEllipseProperties = (): Record<string, unknown> => ({
  width: 150,
  height: 150,
  style: {
    background: "#fff",
    border: "2px solid black",
    borderRadius: "50%",
  },
});

export const createNodePalette = (
  options: CreateNodePaletteOptions = {},
): NodePaletteGroup[] => {
  const t = options.t ?? ((key: string) => key);
  const previews = options.assetPreviewByLibrary ?? {};
  const createAssetItem = (
    id: string,
    nameKey: string,
    descriptionKey: string,
    library: AssetLibraryId,
  ): NodePaletteItem => ({
    id,
    name: t(nameKey),
    type: ASSET_SELECTOR_NODE_TYPE,
    description: t(descriptionKey),
    createProperties: () => createAssetSelectorNodeProperties(library),
    icon: previews[library] ?? "",
  });

  return [
    {
      id: "basic",
      title: t("flow.components.group.basic"),
      components: [
        {
          id: "rect",
          name: t("flow.components.rect.name"),
          type: "rect",
          description: t("flow.components.rect.desc"),
          createProperties: createRectProperties,
          icon: iconRect,
        },
        {
          id: "ellipse",
          name: t("flow.components.ellipse.name"),
          type: "ellipse",
          description: t("flow.components.ellipse.desc"),
          createProperties: createEllipseProperties,
          icon: iconEllipse,
        },
        {
          id: "dynamic-group",
          name: t("flow.components.dynamicGroup.name"),
          type: DYNAMIC_GROUP_NODE_TYPE,
          description: t("flow.components.dynamicGroup.desc"),
          createProperties: createDynamicGroupNodeProperties,
          icon: iconDynamicGroup,
        },
        {
          id: "image",
          name: t("flow.components.image.name"),
          type: IMAGE_NODE_TYPE,
          description: t("flow.components.image.desc"),
          createProperties: createImageNodeProperties,
          icon: iconImage,
        },
        {
          id: "text",
          name: t("flow.components.text.name"),
          type: TEXT_NODE_TYPE,
          description: t("flow.components.text.desc"),
          createProperties: () =>
            createTextNodeProperties(t("flow.components.text.defaultHtml")),
          icon: iconText,
        },
        {
          id: "vector",
          name: t("flow.components.vector.name"),
          type: VECTOR_NODE_TYPE,
          description: t("flow.components.vector.desc"),
          createProperties: createVectorNodeProperties,
          icon: iconVector,
        },
      ],
    },
    {
      id: "yys",
      title: t("flow.components.group.yys"),
      components: [
        createAssetItem(
          "asset-selector",
          "flow.components.assetSelector.name",
          "flow.components.assetSelector.desc",
          "shikigami",
        ),
        createAssetItem(
          "shikigami-select",
          "flow.components.shikigami.name",
          "flow.components.shikigami.desc",
          "shikigami",
        ),
        createAssetItem(
          "yuhun-select",
          "flow.components.yuhun.name",
          "flow.components.yuhun.desc",
          "yuhun",
        ),
        createAssetItem(
          "onmyoji-select",
          "flow.components.onmyoji.name",
          "flow.components.onmyoji.desc",
          "onmyoji",
        ),
        createAssetItem(
          "onmyoji-skill-select",
          "flow.components.onmyojiSkill.name",
          "flow.components.onmyojiSkill.desc",
          "onmyojiSkill",
        ),
        createAssetItem(
          "hunling-select",
          "flow.components.hunling.name",
          "flow.components.hunling.desc",
          "hunling",
        ),
      ],
    },
    {
      id: "other-game",
      title: t("flow.components.group.other"),
      components: [],
    },
  ];
};
