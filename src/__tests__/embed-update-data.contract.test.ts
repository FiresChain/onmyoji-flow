import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import YysEditorEmbed, { type GraphData } from '@/YysEditorEmbed.vue';
import flowEditorSource from '@/components/flow/FlowEditor.vue?raw';
import flowEditorRuntimeSource from '@/components/flow/composables/useFlowEditorRuntime.ts?raw';

const createFlowEditorStub = (payload: GraphData) => defineComponent({
  name: 'FlowEditor',
  props: {
    showPropertyPanel: {
      type: Boolean,
      default: true
    },
    height: {
      type: String,
      default: '100%'
    },
    enableLabel: {
      type: Boolean,
      default: false
    },
    configSnapGridEnabled: {
      type: Boolean,
      default: true
    },
    configSnaplineEnabled: {
      type: Boolean,
      default: true
    },
    configKeyboardEnabled: {
      type: Boolean,
      default: true
    }
  },
  emits: ['graph-data-change'],
  setup(props, { emit, expose }) {
    expose({
      resizeCanvas: () => {},
      getGraphData: () => payload,
      setGraphData: () => {}
    });
    return () => h(
      'button',
      {
        class: 'flow-editor-stub',
        'data-show-property-panel': String(props.showPropertyPanel),
        'data-config-snap-grid-enabled': String(props.configSnapGridEnabled),
        'data-config-snapline-enabled': String(props.configSnaplineEnabled),
        'data-config-keyboard-enabled': String(props.configKeyboardEnabled),
        onClick: () => emit('graph-data-change', payload)
      },
      'emit-graph-data-change'
    );
  }
});

const createFlowEditorMultiChangeStub = (payloads: GraphData[]) => defineComponent({
  name: 'FlowEditor',
  props: {
    showPropertyPanel: {
      type: Boolean,
      default: true
    },
    height: {
      type: String,
      default: '100%'
    },
    enableLabel: {
      type: Boolean,
      default: false
    },
    configSnapGridEnabled: {
      type: Boolean,
      default: true
    },
    configSnaplineEnabled: {
      type: Boolean,
      default: true
    },
    configKeyboardEnabled: {
      type: Boolean,
      default: true
    }
  },
  emits: ['graph-data-change'],
  setup(props, { emit, expose }) {
    expose({
      resizeCanvas: () => {},
      getGraphData: () => payloads[payloads.length - 1] ?? { nodes: [], edges: [] },
      setGraphData: () => {}
    });
    return () => h(
      'div',
      {
        class: 'flow-editor-multi-stub',
        'data-show-property-panel': String(props.showPropertyPanel),
        'data-config-snap-grid-enabled': String(props.configSnapGridEnabled),
        'data-config-snapline-enabled': String(props.configSnaplineEnabled),
        'data-config-keyboard-enabled': String(props.configKeyboardEnabled)
      },
      payloads.map((payload, index) => h(
        'button',
        {
          class: `flow-editor-stub-${index}`,
          onClick: () => emit('graph-data-change', payload)
        },
        `emit-graph-data-change-${index}`
      ))
    );
  }
});

describe('YysEditorEmbed update:data contract', () => {
  it('emits update:data in edit mode when FlowEditor reports graph data change', async () => {
    const payload: GraphData = {
      nodes: [
        {
          id: 'node-1',
          type: 'rect',
          x: 120,
          y: 240
        }
      ],
      edges: []
    };

    const wrapper = mount(YysEditorEmbed, {
      props: {
        mode: 'edit',
        showToolbar: false,
        showComponentPanel: false
      },
      global: {
        stubs: {
          FlowEditor: createFlowEditorStub(payload),
          Toolbar: true,
          ComponentsPanel: true,
          DialogManager: true
        }
      }
    });

    await wrapper.find('.flow-editor-stub').trigger('click');

    expect(wrapper.emitted('update:data')).toEqual([[payload]]);
  });

  it('forwards every graph-data-change emission in edit mode without dropping events', async () => {
    const payloads: GraphData[] = [
      {
        nodes: [{ id: 'node-drop-path', type: 'rect', x: 100, y: 120 }],
        edges: []
      },
      {
        nodes: [{ id: 'text-update-path', type: 'text', x: 120, y: 140, text: { value: 'changed' } }],
        edges: []
      },
      {
        nodes: [{ id: 'edge-adjust-path', type: 'rect', x: 150, y: 180 }],
        edges: [
          {
            id: 'edge-1',
            type: 'polyline',
            sourceNodeId: 'edge-adjust-path',
            targetNodeId: 'edge-adjust-path'
          }
        ]
      }
    ];

    const wrapper = mount(YysEditorEmbed, {
      props: {
        mode: 'edit',
        showToolbar: false,
        showComponentPanel: false
      },
      global: {
        stubs: {
          FlowEditor: createFlowEditorMultiChangeStub(payloads),
          Toolbar: true,
          ComponentsPanel: true,
          DialogManager: true
        }
      }
    });

    await wrapper.find('.flow-editor-stub-0').trigger('click');
    await wrapper.find('.flow-editor-stub-1').trigger('click');
    await wrapper.find('.flow-editor-stub-2').trigger('click');

    expect(wrapper.emitted('update:data')).toEqual(payloads.map((payload) => [payload]));
  });

  it('keeps FlowEditor runtime wiring for initialization and core mutation event paths', () => {
    const flowEditorRequiredSnippets = [
      'useFlowEditorRuntime',
      'mountFlowEditorRuntime({',
      'configSnapGridEnabled?: boolean;',
      'configSnaplineEnabled?: boolean;',
      'configKeyboardEnabled?: boolean;',
      '() => props.configSnapGridEnabled',
      '() => props.configSnaplineEnabled',
      '() => props.configKeyboardEnabled'
    ];
    flowEditorRequiredSnippets.forEach((snippet) => {
      expect(flowEditorSource).toContain(snippet);
    });

    const runtimeRequiredSnippets = [
      'lf.value = new LogicFlow({',
      'setLogicFlowInstance(lfInstance, logicFlowScope);',
      'lfInstance.on(EventType.NODE_ADD',
      "lfInstance.on('node:dnd-add'",
      'lfInstance.on(EventType.NODE_PROPERTIES_CHANGE',
      'lfInstance.on(EventType.NODE_PROPERTIES_DELETE',
      'lfInstance.on(EventType.NODE_DROP',
      'lfInstance.on(EventType.TEXT_UPDATE',
      'lfInstance.on(EventType.LABEL_UPDATE',
      'lfInstance.on(EventType.EDGE_ADD',
      'lfInstance.on(EventType.EDGE_DELETE',
      'lfInstance.on(EventType.EDGE_ADJUST',
      'lfInstance.on(EventType.EDGE_EXCHANGE_NODE',
      'lfInstance.on(EventType.HISTORY_CHANGE'
    ];
    runtimeRequiredSnippets.forEach((snippet) => {
      expect(flowEditorRuntimeSource).toContain(snippet);
    });
  });

  it('applies showPropertyPanel and config(grid/snapline/keyboard) in edit mode', async () => {
    const payload: GraphData = {
      nodes: [
        {
          id: 'node-legacy',
          type: 'rect',
          x: 10,
          y: 20
        }
      ],
      edges: []
    };

    const wrapper = mount(YysEditorEmbed, {
      props: {
        mode: 'edit',
        showToolbar: false,
        showComponentPanel: false,
        showPropertyPanel: false,
        config: {
          grid: false,
          snapline: false,
          keyboard: false
        }
      },
      global: {
        stubs: {
          FlowEditor: createFlowEditorStub(payload),
          Toolbar: true,
          ComponentsPanel: true,
          DialogManager: true
        }
      }
    });

    expect(wrapper.find('.flow-editor-stub').exists()).toBe(true);
    expect(wrapper.find('.flow-editor-stub').attributes('data-show-property-panel')).toBe('false');
    expect(wrapper.find('.flow-editor-stub').attributes('data-config-snap-grid-enabled')).toBe('false');
    expect(wrapper.find('.flow-editor-stub').attributes('data-config-snapline-enabled')).toBe('false');
    expect(wrapper.find('.flow-editor-stub').attributes('data-config-keyboard-enabled')).toBe('false');

    await wrapper.find('.flow-editor-stub').trigger('click');
    expect(wrapper.emitted('update:data')).toEqual([[payload]]);

    await wrapper.setProps({
      showPropertyPanel: true,
      config: {
        grid: true,
        snapline: true,
        keyboard: true
      }
    });
    expect(wrapper.find('.flow-editor-stub').attributes('data-show-property-panel')).toBe('true');
    expect(wrapper.find('.flow-editor-stub').attributes('data-config-snap-grid-enabled')).toBe('true');
    expect(wrapper.find('.flow-editor-stub').attributes('data-config-snapline-enabled')).toBe('true');
    expect(wrapper.find('.flow-editor-stub').attributes('data-config-keyboard-enabled')).toBe('true');
  });
});
