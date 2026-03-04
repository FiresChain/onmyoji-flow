import type LogicFlow from "@logicflow/core";
import type { BaseNodeModel } from "@logicflow/core";
import type { Ref } from "vue";

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

  const alignmentButtons: { key: AlignType; label: string }[] = [
    { key: "left", label: "左对齐" },
    { key: "right", label: "右对齐" },
    { key: "top", label: "上对齐" },
    { key: "bottom", label: "下对齐" },
    { key: "hcenter", label: "水平居中" },
    { key: "vcenter", label: "垂直居中" },
  ];

  const distributeButtons: { key: DistributeType; label: string }[] = [
    { key: "horizontal", label: "水平等距" },
    { key: "vertical", label: "垂直等距" },
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
      showMessage("warning", "请选择至少两个节点再执行对齐");
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
      showMessage("warning", "请选择至少三个节点再执行分布");
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
