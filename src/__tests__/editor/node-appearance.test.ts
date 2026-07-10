import { EventType } from "@logicflow/core";
import { mount } from "@vue/test-utils";
import { defineComponent, nextTick } from "vue";
import { describe, expect, it, vi } from "vitest";

import { useNodeAppearance } from "@/editor/node-types/useNodeAppearance";

type EventHandler = (payload: any) => void;

const createEventCenter = () => {
  const handlers = new Map<string, Set<EventHandler>>();
  return {
    on: vi.fn((event: string, handler: EventHandler) => {
      const eventHandlers = handlers.get(event) ?? new Set<EventHandler>();
      eventHandlers.add(handler);
      handlers.set(event, eventHandlers);
    }),
    off: vi.fn((event: string, handler: EventHandler) => {
      handlers.get(event)?.delete(handler);
    }),
    emit(event: string, payload: any) {
      handlers.get(event)?.forEach((handler) => handler(payload));
    },
  };
};

const mountAppearance = (node: any, eventCenter: any) => {
  let appearance: ReturnType<typeof useNodeAppearance> | null = null;
  const onPropsChange = vi.fn();
  const wrapper = mount(
    defineComponent({
      setup() {
        appearance = useNodeAppearance({ onPropsChange });
        return () => null;
      },
    }),
    {
      global: {
        provide: {
          getNode: () => node,
          getGraph: () => ({ eventCenter }),
        },
      },
    },
  );

  if (!appearance) {
    throw new Error("Node appearance API was not created");
  }
  return { appearance, onPropsChange, wrapper };
};

describe("node appearance lifecycle", () => {
  it("isolates graph listeners and removes each listener on unmount", async () => {
    const firstEvents = createEventCenter();
    const secondEvents = createEventCenter();
    const first = mountAppearance(
      {
        id: "first",
        width: 180,
        height: 90,
        properties: { style: { fill: "#111111" } },
      },
      firstEvents,
    );
    const second = mountAppearance(
      {
        id: "second",
        width: 240,
        height: 120,
        properties: { style: { fill: "#222222" } },
      },
      secondEvents,
    );

    expect(first.appearance.style.value).toMatchObject({
      fill: "#111111",
      width: 180,
      height: 90,
    });
    expect(second.appearance.style.value.fill).toBe("#222222");

    firstEvents.emit(EventType.NODE_PROPERTIES_CHANGE, {
      id: "first",
      properties: { style: { fill: "#abcdef" } },
    });
    await nextTick();

    expect(first.appearance.style.value.fill).toBe("#abcdef");
    expect(second.appearance.style.value.fill).toBe("#222222");
    expect(first.onPropsChange).toHaveBeenLastCalledWith(
      { style: { fill: "#abcdef" } },
      expect.objectContaining({ id: "first" }),
    );

    first.wrapper.unmount();
    second.wrapper.unmount();

    expect(firstEvents.off).toHaveBeenCalledWith(
      EventType.NODE_PROPERTIES_CHANGE,
      expect.any(Function),
    );
    expect(secondEvents.off).toHaveBeenCalledWith(
      EventType.NODE_PROPERTIES_CHANGE,
      expect.any(Function),
    );
  });
});
