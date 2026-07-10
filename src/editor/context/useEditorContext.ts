import { hasInjectionContext, inject, provide, type InjectionKey } from "vue";

import {
  getEditorContextFromGraphModel,
  type EditorContext,
} from "./EditorContext";
import { resolveAssetUrl as resolveCompatibilityAssetUrl } from "@/features/assets/public";

export const EDITOR_CONTEXT_KEY: InjectionKey<EditorContext> = Symbol(
  "onmyoji-flow:editor-context-key",
);

type GetGraph = () => unknown;

const resolveInjectedEditorContext = (): EditorContext | null => {
  if (!hasInjectionContext()) return null;

  const directlyInjected = inject(EDITOR_CONTEXT_KEY, null);
  if (directlyInjected) return directlyInjected;

  // vue-node-registry mounts node components in a separate createApp and only
  // bridges its graphModel through this injection.
  const getGraph = inject<GetGraph | null>("getGraph", null);
  if (!getGraph) return null;

  try {
    return getEditorContextFromGraphModel(getGraph());
  } catch {
    return null;
  }
};

export function provideEditorContext(context: EditorContext): EditorContext {
  provide(EDITOR_CONTEXT_KEY, context);
  return context;
}

export function tryUseEditorContext(): EditorContext | null {
  return resolveInjectedEditorContext();
}

export function useEditorContext(): EditorContext {
  const context = resolveInjectedEditorContext();
  if (!context) {
    throw new Error(
      "EditorContext is unavailable. Provide it or attach it to the injected graphModel.",
    );
  }
  return context;
}

export function useEditorAssetUrlResolver(): (value: unknown) => unknown {
  const context = resolveInjectedEditorContext();
  return (value) =>
    typeof value === "string"
      ? (context?.resolveAssetUrl(value) ?? resolveCompatibilityAssetUrl(value))
      : value;
}
