import LogicFlow, { EventType } from '@logicflow/core';
import type { BaseNodeModel, EdgeData, NodeData, Position } from '@logicflow/core';
import { nextTick, type Ref } from 'vue';
import { Menu, Label, Snapshot, SelectionSelect, MiniMap, Control, DynamicGroup } from '@logicflow/extension';
import { register } from '@logicflow/vue-node-registry';
import PropertySelectNode from '../nodes/yys/PropertySelectNode.vue';
import ImageNode from '../nodes/common/ImageNode.vue';
import AssetSelectorNode from '../nodes/common/AssetSelectorNode.vue';
import TextNode from '../nodes/common/TextNode.vue';
import TextNodeModel from '../nodes/common/TextNodeModel';
import VectorNode from '../nodes/common/VectorNode.vue';
import VectorNodeModel from '../nodes/common/VectorNodeModel';
import { setLogicFlowInstance, type LogicFlowScope } from '@/ts/useLogicFlow';

type ShortcutHandler = (event?: KeyboardEvent) => boolean | void;

export interface FlowEditorRuntimeOptions {
  lf: Ref<LogicFlow | null>;
  flowHostRef: Ref<HTMLElement | null>;
  containerRef: Ref<HTMLElement | null>;
  logicFlowScope: LogicFlowScope;
  enableLabel: boolean;
  configSnapGridEnabled: boolean;
  configSnaplineEnabled: boolean;
  configKeyboardEnabled: boolean;
  snaplineEnabled: Ref<boolean>;
  snapGridEnabled: Ref<boolean>;
  selectionEnabled: Ref<boolean>;
  selectedNode: Ref<any>;
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
  handleArrowMove: (direction: 'left' | 'right' | 'up' | 'down', event?: KeyboardEvent) => boolean | void;
  normalizeNodeModel: (model: BaseNodeModel) => void;
  scheduleGroupRuleValidation: (delay?: number) => void;
  emitGraphDataChange: () => void;
  sanitizeGraphLabels: () => void;
  updateSelectedCount: () => void;
  normalizeAllNodes: () => void;
  logClipboardDebug: (stage: string, payload?: Record<string, unknown>) => void;
  applyKeyboardEnabled: (enabled: boolean) => void;
  applySelectionSelect: (enabled: boolean) => void;
  handleCanvasMouseDown: (event: MouseEvent) => void;
  handleCanvasContextMenu: (event: MouseEvent) => void;
  queueCanvasResize: () => void;
  resizeCanvas: () => void;
  handleWindowResize: () => void;
}

function registerNodes(lfInstance: LogicFlow) {
  register({ type: 'propertySelect', component: PropertySelectNode }, lfInstance);
  register({ type: 'imageNode', component: ImageNode }, lfInstance);
  register({ type: 'assetSelector', component: AssetSelectorNode }, lfInstance);
  register({ type: 'textNode', component: TextNode, model: TextNodeModel }, lfInstance);
  register({ type: 'vectorNode', component: VectorNode, model: VectorNodeModel }, lfInstance);
}

export function useFlowEditorRuntime() {
  const mountFlowEditorRuntime = (options: FlowEditorRuntimeOptions) => {
    const {
      lf,
      flowHostRef,
      containerRef,
      logicFlowScope,
      enableLabel,
      configSnapGridEnabled,
      configSnaplineEnabled,
      configKeyboardEnabled,
      snaplineEnabled,
      snapGridEnabled,
      selectionEnabled,
      selectedNode,
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
      handleArrowMove,
      normalizeNodeModel,
      scheduleGroupRuleValidation,
      emitGraphDataChange,
      sanitizeGraphLabels,
      updateSelectedCount,
      normalizeAllNodes,
      logClipboardDebug,
      applyKeyboardEnabled,
      applySelectionSelect,
      handleCanvasMouseDown,
      handleCanvasContextMenu,
      queueCanvasResize,
      resizeCanvas,
      handleWindowResize
    } = options;

    let containerResizeObserver: ResizeObserver | null = null;

    lf.value = new LogicFlow({
      container: containerRef.value,
      grid: { type: 'dot', size: 10 },
      stopMoveGraph: true,
      allowResize: true,
      allowRotate: true,
      overlapMode: -1,
      snapline: snaplineEnabled.value,
      keyboard: {
        enabled: true
      },
      style: {
        text: {
          color: '#333333',
          fontSize: 14,
          background: {
            fill: '#ffffff',
            stroke: '#dcdfe6',
            strokeWidth: 1,
            radius: 4
          }
        },
        nodeText: {
          color: '#333333',
          fontSize: 14
        }
      },
      plugins: [
        DynamicGroup,
        Menu,
        ...(enableLabel ? [Label] : []),
        Snapshot,
        SelectionSelect,
        MiniMap,
        Control
      ],
      pluginsOptions: {
        label: {
          isMultiple: false,
          textOverflowMode: 'wrap'
        },
        miniMap: {
          isShowHeader: false,
          isShowCloseIcon: true,
          width: 200,
          height: 140,
          rightPosition: 16,
          bottomPosition: 16
        }
      }
    });

    const lfInstance = lf.value;
    if (!lfInstance) {
      return () => {};
    }

    lfInstance.keyboard.off(['backspace']);

    const bindShortcut = (keys: string | string[], handler: (event?: KeyboardEvent) => boolean | void) => {
      lfInstance.keyboard.on(keys, (event: KeyboardEvent) => handler(event));
    };

    bindShortcut(['del', 'backspace'], deleteSelectedElements);
    bindShortcut(['left'], (event) => handleArrowMove('left', event));
    bindShortcut(['right'], (event) => handleArrowMove('right', event));
    bindShortcut(['up'], (event) => handleArrowMove('up', event));
    bindShortcut(['down'], (event) => handleArrowMove('down', event));
    bindShortcut(['cmd + g', 'ctrl + g'], groupSelectedNodes);
    bindShortcut(['cmd + u', 'ctrl + u'], ungroupSelectedNodes);
    bindShortcut(['cmd + l', 'ctrl + l'], toggleLockSelected);
    bindShortcut(['cmd + shift + h', 'ctrl + shift + h'], toggleVisibilitySelected);

    lfInstance.extension.menu.addMenuConfig({
      nodeMenu: [
        {
          text: '置于顶层',
          callback(node: NodeData) {
            bringToFront(node.id);
          }
        },
        {
          text: '上移一层',
          callback(node: NodeData) {
            bringForward(node.id);
          }
        },
        {
          text: '下移一层',
          callback(node: NodeData) {
            sendBackward(node.id);
          }
        },
        {
          text: '置于底层',
          callback(node: NodeData) {
            sendToBack(node.id);
          }
        },
        {
          text: '---'
        },
        {
          text: '组合 (Ctrl+G)',
          callback() {
            groupSelectedNodes();
          }
        },
        {
          text: '解组 (Ctrl+U)',
          callback() {
            ungroupSelectedNodes();
          }
        },
        {
          text: '---'
        },
        {
          text: '锁定/解锁 (Ctrl+L)',
          callback() {
            toggleLockSelected();
          }
        },
        {
          text: '显示/隐藏 (Ctrl+Shift+H)',
          callback() {
            toggleVisibilitySelected();
          }
        },
        {
          text: '---'
        },
        {
          text: '删除节点 (Del)',
          callback(node: NodeData) {
            deleteNode(node.id);
          }
        }
      ],
      edgeMenu: [
        {
          text: '删除边',
          callback(edge: EdgeData) {
            lfInstance.deleteEdge(edge.id);
          }
        }
      ],
      graphMenu: [
        {
          text: '添加节点',
          callback(data: Position) {
            lfInstance.addNode({
              type: 'rect',
              x: data.x,
              y: data.y
            });
          }
        },
        {
          text: '提示：使用 Ctrl+V 粘贴'
        }
      ]
    });

    lfInstance.extension.menu.setMenuByType({
      type: 'lf:defaultSelectionMenu',
      menu: [
        {
          text: '组合 (Ctrl+G)',
          callback() {
            groupSelectedNodes();
          }
        },
        {
          text: '解组 (Ctrl+U)',
          callback() {
            ungroupSelectedNodes();
          }
        },
        {
          text: '---'
        },
        {
          text: '锁定/解锁 (Ctrl+L)',
          callback() {
            toggleLockSelected();
          }
        },
        {
          text: '显示/隐藏 (Ctrl+Shift+H)',
          callback() {
            toggleVisibilitySelected();
          }
        },
        {
          text: '---'
        },
        {
          text: '删除选中 (Del)',
          callback() {
            deleteSelectedElements();
          }
        }
      ]
    });

    registerNodes(lfInstance);
    setLogicFlowInstance(lfInstance, logicFlowScope);
    snapGridEnabled.value = configSnapGridEnabled;
    snaplineEnabled.value = configSnaplineEnabled;
    applyKeyboardEnabled(configKeyboardEnabled);
    applySelectionSelect(selectionEnabled.value);
    containerRef.value?.addEventListener('mousedown', handleCanvasMouseDown);
    containerRef.value?.addEventListener('contextmenu', handleCanvasContextMenu, true);

    lfInstance.on(EventType.NODE_ADD, ({ data }) => {
      if (!data?.id) {
        logClipboardDebug('node:add-invalid-payload', {
          payload: data ?? null
        });
        return;
      }
      const model = lfInstance.getNodeModelById(data.id);
      if (model) {
        normalizeNodeModel(model);
        model.setZIndex(1000);
        (model as any)._isNewNode = true;
      }
      scheduleGroupRuleValidation();
      emitGraphDataChange();
    });

    lfInstance.on('node:dnd-add', ({ data }) => {
      if (!data?.id) return;
      const model = lfInstance.getNodeModelById(data.id);
      if (model) {
        model.setZIndex(1000);
        (model as any)._isNewNode = true;
      }
      scheduleGroupRuleValidation();
      emitGraphDataChange();
    });

    lfInstance.on(EventType.GRAPH_RENDERED, () => {
      sanitizeGraphLabels();
      applySelectionSelect(selectionEnabled.value);
      normalizeAllNodes();
      scheduleGroupRuleValidation(0);
    });

    lfInstance.on(EventType.NODE_CLICK, ({ data }) => {
      selectedNode.value = data;
    });

    lfInstance.on(EventType.BLANK_CLICK, () => {
      selectedNode.value = null;
      updateSelectedCount();
    });

    lfInstance.on(EventType.NODE_PROPERTIES_CHANGE, (data) => {
      const nodeId = data.id;
      if (selectedNode.value && nodeId === selectedNode.value.id) {
        if (data.properties) {
          selectedNode.value = {
            ...selectedNode.value,
            properties: data.properties
          };
        }
      }
      const model = lfInstance.getNodeModelById(nodeId);
      if (model) normalizeNodeModel(model);
      scheduleGroupRuleValidation();
      emitGraphDataChange();
    });

    lfInstance.on(EventType.NODE_PROPERTIES_DELETE, () => {
      scheduleGroupRuleValidation();
      emitGraphDataChange();
    });
    lfInstance.on(EventType.NODE_DROP, () => {
      emitGraphDataChange();
    });
    lfInstance.on(EventType.TEXT_UPDATE, () => {
      emitGraphDataChange();
    });
    lfInstance.on(EventType.LABEL_UPDATE, () => {
      emitGraphDataChange();
    });
    lfInstance.on(EventType.NODE_DELETE, () => {
      scheduleGroupRuleValidation();
      emitGraphDataChange();
    });
    lfInstance.on(EventType.EDGE_ADD, () => {
      scheduleGroupRuleValidation();
      emitGraphDataChange();
    });
    lfInstance.on(EventType.EDGE_DELETE, () => {
      scheduleGroupRuleValidation();
      emitGraphDataChange();
    });
    lfInstance.on(EventType.EDGE_ADJUST, () => {
      emitGraphDataChange();
    });
    lfInstance.on(EventType.EDGE_EXCHANGE_NODE, () => {
      scheduleGroupRuleValidation();
      emitGraphDataChange();
    });
    lfInstance.on(EventType.HISTORY_CHANGE, () => {
      emitGraphDataChange();
    });

    lfInstance.on('selection:selected', () => {
      sanitizeGraphLabels();
      updateSelectedCount();
      logClipboardDebug('selection:selected');
    });
    lfInstance.on('selection:drop', () => {
      sanitizeGraphLabels();
      updateSelectedCount();
      logClipboardDebug('selection:drop');
    });

    nextTick(() => {
      queueCanvasResize();
    });
    if (typeof ResizeObserver !== 'undefined') {
      containerResizeObserver = new ResizeObserver(() => {
        resizeCanvas();
      });
      if (flowHostRef.value) {
        containerResizeObserver.observe(flowHostRef.value);
      }
      if (containerRef.value && containerRef.value !== flowHostRef.value) {
        containerResizeObserver.observe(containerRef.value);
      }
    }
    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
      containerResizeObserver?.disconnect();
      containerResizeObserver = null;
      containerRef.value?.removeEventListener('mousedown', handleCanvasMouseDown);
      containerRef.value?.removeEventListener('contextmenu', handleCanvasContextMenu, true);
    };
  };

  return {
    mountFlowEditorRuntime
  };
}
