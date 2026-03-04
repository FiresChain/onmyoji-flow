import type LogicFlow from "@logicflow/core";
import type { BaseNodeModel } from "@logicflow/core";
import type { Ref } from "vue";
import { useSafeI18n } from "@/ts/useSafeI18n";

export type AlignType =
  | "left"
  | "right"
  | "top"
  | "bottom"
  | "hcenter"
  | "vcenter";
export type DistributeType = "horizontal" | "vertical";

type MessageType = "success" | "warning" | "info" | "error";

interface UseFlowArrangeCommandsOptions {
  lf: Ref<LogicFlow | null>;
  showMessage: (type: MessageType, message: string) => void;
  getSelectedNodeModelsFiltered: () => BaseNodeModel[];
}

interface SelectedRect {
  model: BaseNodeModel;
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export function useFlowArrangeCommands(options: UseFlowArrangeCommandsOptions) {
  const { lf, showMessage, getSelectedNodeModelsFiltered } = options;
  const { t } = useSafeI18n({
    "flowEditor.align.left": "左对齐",
    "flowEditor.align.right": "右对齐",
    "flowEditor.align.top": "上对齐",
    "flowEditor.align.bottom": "下对齐",
    "flowEditor.align.hcenter": "水平居中",
    "flowEditor.align.vcenter": "垂直居中",
    "flowEditor.distribute.horizontal": "水平等距",
    "flowEditor.distribute.vertical": "垂直等距",
    "flowEditor.message.alignNeedTwo": "请选择至少两个节点再执行对齐",
    "flowEditor.message.distributeNeedThree": "请选择至少三个节点再执行分布",
  });

  const alignmentButtons: { key: AlignType; labelKey: string }[] = [
    { key: "left", labelKey: "flowEditor.align.left" },
    { key: "right", labelKey: "flowEditor.align.right" },
    { key: "top", labelKey: "flowEditor.align.top" },
    { key: "bottom", labelKey: "flowEditor.align.bottom" },
    { key: "hcenter", labelKey: "flowEditor.align.hcenter" },
    { key: "vcenter", labelKey: "flowEditor.align.vcenter" },
  ];

  const distributeButtons: { key: DistributeType; labelKey: string }[] = [
    { key: "horizontal", labelKey: "flowEditor.distribute.horizontal" },
    { key: "vertical", labelKey: "flowEditor.distribute.vertical" },
  ];

  const getSelectedRects = (): SelectedRect[] => {
    const lfInstance = lf.value;
    if (!lfInstance) return [];
    const actionable = getSelectedNodeModelsFiltered();
    return actionable.map((model: BaseNodeModel) => {
      const bounds = model.getBounds();
      const width = bounds.maxX - bounds.minX;
      const height = bounds.maxY - bounds.minY;
      return {
        model,
        bounds,
        width,
        height,
        centerX: (bounds.maxX + bounds.minX) / 2,
        centerY: (bounds.maxY + bounds.minY) / 2,
      };
    });
  };

  const alignSelected = (direction: AlignType) => {
    const rects = getSelectedRects();
    if (rects.length < 2) {
      showMessage("warning", t("flowEditor.message.alignNeedTwo"));
      return;
    }

    const minX = Math.min(...rects.map((item) => item.bounds.minX));
    const maxX = Math.max(...rects.map((item) => item.bounds.maxX));
    const minY = Math.min(...rects.map((item) => item.bounds.minY));
    const maxY = Math.max(...rects.map((item) => item.bounds.maxY));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    rects.forEach(({ model, width, height }) => {
      let targetX = model.x;
      let targetY = model.y;

      switch (direction) {
        case "left":
          targetX = minX + width / 2;
          break;
        case "right":
          targetX = maxX - width / 2;
          break;
        case "hcenter":
          targetX = centerX;
          break;
        case "top":
          targetY = minY + height / 2;
          break;
        case "bottom":
          targetY = maxY - height / 2;
          break;
        case "vcenter":
          targetY = centerY;
          break;
      }

      model.moveTo(targetX, targetY);
    });
  };

  const distributeSelected = (type: DistributeType) => {
    const rects = getSelectedRects();
    if (rects.length < 3) {
      showMessage("warning", t("flowEditor.message.distributeNeedThree"));
      return;
    }

    const sorted = [...rects].sort((a, b) =>
      type === "horizontal"
        ? a.bounds.minX - b.bounds.minX
        : a.bounds.minY - b.bounds.minY,
    );
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    if (type === "horizontal") {
      const totalWidth = sorted.reduce((sum, item) => sum + item.width, 0);
      const gap =
        (last.bounds.maxX - first.bounds.minX - totalWidth) /
        (sorted.length - 1);
      let cursor = first.bounds.minX + first.width;

      for (let i = 1; i < sorted.length - 1; i += 1) {
        cursor += gap;
        const item = sorted[i];
        item.model.moveTo(cursor + item.width / 2, item.centerY);
        cursor += item.width;
      }
    } else {
      const totalHeight = sorted.reduce((sum, item) => sum + item.height, 0);
      const gap =
        (last.bounds.maxY - first.bounds.minY - totalHeight) /
        (sorted.length - 1);
      let cursor = first.bounds.minY + first.height;

      for (let i = 1; i < sorted.length - 1; i += 1) {
        cursor += gap;
        const item = sorted[i];
        item.model.moveTo(item.centerX, cursor + item.height / 2);
        cursor += item.height;
      }
    }
  };

  return {
    alignmentButtons,
    distributeButtons,
    alignSelected,
    distributeSelected,
  };
}
