import type LogicFlow from "@logicflow/core";
import type { EdgeData, NodeData, Position } from "@logicflow/core";

import type { ShortcutHandler } from "./keyboardShortcuts";

export interface EditorContextMenuOptions {
  instance: LogicFlow;
  bringToFront: (nodeId?: string) => void;
  bringForward: (nodeId?: string) => void;
  sendBackward: (nodeId?: string) => void;
  sendToBack: (nodeId?: string) => void;
  deleteNode: (nodeId: string) => void;
  deleteSelectedElements: ShortcutHandler;
  groupSelectedNodes: ShortcutHandler;
  ungroupSelectedNodes: ShortcutHandler;
  toggleLockSelected: ShortcutHandler;
  toggleVisibilitySelected: ShortcutHandler;
}

export function configureEditorContextMenu(
  options: EditorContextMenuOptions,
): void {
  const {
    instance,
    bringToFront,
    bringForward,
    sendBackward,
    sendToBack,
    deleteNode,
    deleteSelectedElements,
    groupSelectedNodes,
    ungroupSelectedNodes,
    toggleLockSelected,
    toggleVisibilitySelected,
  } = options;

  instance.extension.menu.addMenuConfig({
    nodeMenu: [
      {
        text: "置于顶层",
        callback(node: NodeData) {
          bringToFront(node.id);
        },
      },
      {
        text: "上移一层",
        callback(node: NodeData) {
          bringForward(node.id);
        },
      },
      {
        text: "下移一层",
        callback(node: NodeData) {
          sendBackward(node.id);
        },
      },
      {
        text: "置于底层",
        callback(node: NodeData) {
          sendToBack(node.id);
        },
      },
      { text: "---" },
      {
        text: "组合 (Ctrl+G)",
        callback() {
          groupSelectedNodes();
        },
      },
      {
        text: "解组 (Ctrl+U)",
        callback() {
          ungroupSelectedNodes();
        },
      },
      { text: "---" },
      {
        text: "锁定/解锁 (Ctrl+L)",
        callback() {
          toggleLockSelected();
        },
      },
      {
        text: "显示/隐藏 (Ctrl+Shift+H)",
        callback() {
          toggleVisibilitySelected();
        },
      },
      { text: "---" },
      {
        text: "删除节点 (Del)",
        callback(node: NodeData) {
          deleteNode(node.id);
        },
      },
    ],
    edgeMenu: [
      {
        text: "删除边",
        callback(edge: EdgeData) {
          instance.deleteEdge(edge.id);
        },
      },
    ],
    graphMenu: [
      {
        text: "添加节点",
        callback(data: Position) {
          instance.addNode({
            type: "rect",
            x: data.x,
            y: data.y,
          });
        },
      },
      { text: "提示：使用 Ctrl+V 粘贴" },
    ],
  });

  instance.extension.menu.setMenuByType({
    type: "lf:defaultSelectionMenu",
    menu: [
      {
        text: "组合 (Ctrl+G)",
        callback() {
          groupSelectedNodes();
        },
      },
      {
        text: "解组 (Ctrl+U)",
        callback() {
          ungroupSelectedNodes();
        },
      },
      { text: "---" },
      {
        text: "锁定/解锁 (Ctrl+L)",
        callback() {
          toggleLockSelected();
        },
      },
      {
        text: "显示/隐藏 (Ctrl+Shift+H)",
        callback() {
          toggleVisibilitySelected();
        },
      },
      { text: "---" },
      {
        text: "删除选中 (Del)",
        callback() {
          deleteSelectedElements();
        },
      },
    ],
  });
}
