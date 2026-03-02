import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import YysEditorEmbed, { type GraphData } from '@/YysEditorEmbed.vue';

const createFlowEditorStub = (payload: GraphData) => defineComponent({
  name: 'FlowEditor',
  emits: ['graph-data-change'],
  setup(_, { emit, expose }) {
    expose({
      resizeCanvas: () => {},
      getGraphData: () => payload,
      setGraphData: () => {}
    });
    return () => h(
      'button',
      {
        class: 'flow-editor-stub',
        onClick: () => emit('graph-data-change', payload)
      },
      'emit-graph-data-change'
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
});
