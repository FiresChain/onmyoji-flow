import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { createPinia, type Pinia } from 'pinia';
import { useFilesStore } from '@/ts/useStore';
import {
  createLogicFlowScope,
  destroyLogicFlowInstance,
  provideLogicFlowScope,
  setLogicFlowInstance,
  type LogicFlowScope
} from '@/ts/useLogicFlow';
import { destroyCanvasSettingsScope, useCanvasSettings } from '@/ts/useCanvasSettings';

vi.mock('element-plus', () => ({
  ElMessageBox: {
    confirm: vi.fn()
  }
}));

vi.mock('../ts/useGlobalMessage', () => ({
  useGlobalMessage: () => ({
    showMessage: vi.fn()
  })
}));

type FilesStore = ReturnType<typeof useFilesStore>;

type StoreHarness = {
  pinia: Pinia;
  scope: LogicFlowScope;
  store: FilesStore;
  unmount: () => void;
};

const createRootDocument = (prefix: string) => ({
  schemaVersion: '1.0.0',
  fileList: [
    {
      id: `${prefix}-1`,
      name: `${prefix}-1`,
      label: `${prefix}-1`,
      visible: true,
      type: 'FLOW',
      graphRawData: {
        nodes: [{ id: `${prefix}-source`, type: 'rect', x: 10, y: 10 }],
        edges: []
      },
      transform: {
        SCALE_X: 1,
        SCALE_Y: 1,
        TRANSLATE_X: 0,
        TRANSLATE_Y: 0
      }
    },
    {
      id: `${prefix}-2`,
      name: `${prefix}-2`,
      label: `${prefix}-2`,
      visible: true,
      type: 'FLOW',
      graphRawData: {
        nodes: [{ id: `${prefix}-target`, type: 'rect', x: 20, y: 20 }],
        edges: []
      },
      transform: {
        SCALE_X: 1,
        SCALE_Y: 1,
        TRANSLATE_X: 0,
        TRANSLATE_Y: 0
      }
    }
  ],
  activeFileId: `${prefix}-1`,
  activeFile: `${prefix}-1`
});

const createScopedStoreHarness = (): StoreHarness => {
  const pinia = createPinia();
  const scope = createLogicFlowScope();
  let store: FilesStore | null = null;

  const Harness = defineComponent({
    setup() {
      provideLogicFlowScope(scope);
      store = useFilesStore(pinia);
      store.bindLogicFlowScope(scope);
      return () => h('div');
    }
  });

  const wrapper = mount(Harness, {
    global: {
      plugins: [pinia]
    }
  });

  if (!store) {
    throw new Error('store not initialized');
  }

  return {
    pinia,
    scope,
    store,
    unmount: () => wrapper.unmount()
  };
};

const createLogicFlowMock = (nodeId: string, zIndex: number) => ({
  destroy: vi.fn(),
  getGraphRawData: vi.fn(() => ({
    nodes: [{ id: nodeId, type: 'rect', x: 100, y: 100 }],
    edges: []
  })),
  getTransform: vi.fn(() => ({
    SCALE_X: 1,
    SCALE_Y: 1,
    TRANSLATE_X: 0,
    TRANSLATE_Y: 0
  })),
  getNodeModelById: vi.fn(() => ({ zIndex }))
});

describe('multi-instance embed isolation regression', () => {
  const activeScopes = new Set<LogicFlowScope>();
  const cleanups: Array<() => void> = [];

  const registerHarness = () => {
    const harness = createScopedStoreHarness();
    activeScopes.add(harness.scope);
    cleanups.push(harness.unmount);
    return harness;
  };

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanups.splice(0).forEach((cleanup) => cleanup());
    activeScopes.forEach((scope) => {
      destroyLogicFlowInstance(scope);
      destroyCanvasSettingsScope(scope);
    });
    activeScopes.clear();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    localStorage.clear();
  });

  it('isolates active file and file list between instance A/B', () => {
    const editorA = registerHarness();
    const editorB = registerHarness();

    editorA.store.importData(createRootDocument('a'));
    editorB.store.importData(createRootDocument('b'));

    expect(editorA.store.fileList.map((file) => file.id)).toEqual(['a-1', 'a-2']);
    expect(editorB.store.fileList.map((file) => file.id)).toEqual(['b-1', 'b-2']);
    expect(editorA.store.activeFileId).toBe('a-1');
    expect(editorB.store.activeFileId).toBe('b-1');

    editorA.store.setActiveFile('a-2');
    editorA.store.removeTab('a-1');

    expect(editorA.store.activeFileId).toBe('a-2');
    expect(editorA.store.fileList.map((file) => file.id)).toEqual(['a-2']);
    expect(editorB.store.activeFileId).toBe('b-1');
    expect(editorB.store.fileList.map((file) => file.id)).toEqual(['b-1', 'b-2']);
  });

  it('isolates canvas switch/save/update writes between instance A/B', () => {
    const editorA = registerHarness();
    const editorB = registerHarness();
    const lfA = createLogicFlowMock('lf-a-node', 11);
    const lfB = createLogicFlowMock('lf-b-node', 22);

    setLogicFlowInstance(lfA as any, editorA.scope);
    setLogicFlowInstance(lfB as any, editorB.scope);

    editorA.store.importData(createRootDocument('a'));
    editorB.store.importData(createRootDocument('b'));

    editorA.store.setActiveFile('a-2');

    expect(lfA.getGraphRawData).toHaveBeenCalledTimes(1);
    expect(lfB.getGraphRawData).toHaveBeenCalledTimes(0);
    expect((editorA.store.getTab('a-1') as any)?.graphRawData?.nodes?.[0]).toMatchObject({
      id: 'lf-a-node',
      zIndex: 11
    });
    expect((editorB.store.getTab('b-1') as any)?.graphRawData?.nodes?.[0]?.id).toBe('b-source');

    editorB.store.updateTab('b-1');

    expect(lfA.getGraphRawData).toHaveBeenCalledTimes(1);
    expect(lfB.getGraphRawData).toHaveBeenCalledTimes(1);
    expect((editorB.store.getTab('b-1') as any)?.graphRawData?.nodes?.[0]).toMatchObject({
      id: 'lf-b-node',
      zIndex: 22
    });
    expect((editorA.store.getTab('a-1') as any)?.graphRawData?.nodes?.[0]?.id).toBe('lf-a-node');
  });

  it('isolates canvas settings between instance scopes', () => {
    const scopeA = createLogicFlowScope();
    const scopeB = createLogicFlowScope();
    activeScopes.add(scopeA);
    activeScopes.add(scopeB);

    const settingsA = useCanvasSettings(scopeA);
    const settingsB = useCanvasSettings(scopeB);

    settingsA.selectionEnabled.value = false;
    settingsA.snapGridEnabled.value = false;
    settingsA.snaplineEnabled.value = false;

    expect(settingsB.selectionEnabled.value).toBe(true);
    expect(settingsB.snapGridEnabled.value).toBe(true);
    expect(settingsB.snaplineEnabled.value).toBe(true);
  });
});
