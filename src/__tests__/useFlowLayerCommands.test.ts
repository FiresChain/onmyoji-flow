import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { useFlowLayerCommands } from "@/components/flow/composables/useFlowLayerCommands";

interface MockNode {
  id: string;
  zIndex: number;
  setZIndex: ReturnType<typeof vi.fn>;
}

function createMockNode(id: string, zIndex: number): MockNode {
  const node: MockNode = {
    id,
    zIndex,
    setZIndex: vi.fn((nextZIndex: number) => {
      node.zIndex = nextZIndex;
    }),
  };
  return node;
}

function createMockLogicFlow(nodes: MockNode[]) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  return {
    graphModel: { nodes },
    setElementZIndex: vi.fn(),
    getNodeModelById: vi.fn((nodeId: string) => nodeMap.get(nodeId) ?? null),
  };
}

describe("useFlowLayerCommands", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps bringToFront behavior with selected node fallback", () => {
    const node = createMockNode("node-a", 3);
    const lf = ref(createMockLogicFlow([node]) as any);
    const selectedNode = ref<{ id?: string } | null>({ id: "node-a" });
    const { bringToFront } = useFlowLayerCommands({ lf, selectedNode });

    bringToFront();

    expect((lf.value as any).setElementZIndex).toHaveBeenCalledTimes(1);
    expect((lf.value as any).setElementZIndex).toHaveBeenCalledWith(
      "node-a",
      "top",
    );
  });

  it("keeps sendToBack behavior by setting target zIndex to min-1", () => {
    const nodeA = createMockNode("node-a", 2);
    const nodeB = createMockNode("node-b", 5);
    const nodeC = createMockNode("node-c", 8);
    const lf = ref(createMockLogicFlow([nodeA, nodeB, nodeC]) as any);
    const selectedNode = ref<{ id?: string } | null>(null);
    const { sendToBack } = useFlowLayerCommands({ lf, selectedNode });

    sendToBack("node-c");

    expect(nodeC.setZIndex).toHaveBeenCalledTimes(1);
    expect(nodeC.setZIndex).toHaveBeenCalledWith(1);
    expect(nodeC.zIndex).toBe(1);
  });

  it("keeps bringForward behavior by incrementing zIndex by one", () => {
    const node = createMockNode("node-a", 9);
    const lf = ref(createMockLogicFlow([node]) as any);
    const selectedNode = ref<{ id?: string } | null>({ id: "node-a" });
    const { bringForward } = useFlowLayerCommands({ lf, selectedNode });

    bringForward();

    expect(node.setZIndex).toHaveBeenCalledTimes(1);
    expect(node.setZIndex).toHaveBeenCalledWith(10);
    expect(node.zIndex).toBe(10);
  });

  it("keeps sendBackward behavior by decrementing zIndex by one", () => {
    const node = createMockNode("node-a", 9);
    const lf = ref(createMockLogicFlow([node]) as any);
    const selectedNode = ref<{ id?: string } | null>({ id: "node-a" });
    const { sendBackward } = useFlowLayerCommands({ lf, selectedNode });

    sendBackward();

    expect(node.setZIndex).toHaveBeenCalledTimes(1);
    expect(node.setZIndex).toHaveBeenCalledWith(8);
    expect(node.zIndex).toBe(8);
  });
});
