import { Linter, type Rule } from "eslint";
import { describe, expect, it } from "vitest";

import globalBoundaryConfig from "../../eslint-rules/config/global-boundaries.js";
import moduleBoundariesRule from "../../eslint-rules/module-boundaries.js";

const projectRoot = "/virtual-onmyoji-flow";
const linter = new Linter({ cwd: projectRoot });
linter.defineRule("module-boundaries", moduleBoundariesRule as Rule.RuleModule);
const {
  BROWSER_STATE_GLOBALS,
  createCoreDocumentRestrictedGlobalsRule,
  createStoreRestrictedGlobalsRule,
} = globalBoundaryConfig;

const verify = (code: string, filename: string) =>
  linter.verify(
    code,
    {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      rules: { "module-boundaries": "error" },
    },
    `${projectRoot}/src/${filename}`,
  );

describe("feature module ESLint boundary", () => {
  it("allows public feature entry points and the exact team-code legacy adapter", () => {
    expect(
      verify(
        'import { normalizeAsset } from "@/features/assets/public";',
        "editor/commands/example.ts",
      ),
    ).toEqual([]);
    expect(
      verify(
        'import { normalizeAsset } from "../assets/public";',
        "features/workspace/normalize.ts",
      ),
    ).toEqual([]);
    expect(
      verify(
        'import { convertTeamCode } from "@/utils/teamCodeService";',
        "features/workspace/teamCodeImportAdapter.ts",
      ),
    ).toEqual([]);
  });

  it("rejects feature deep imports through aliases and relative paths", () => {
    expect(
      verify(
        'import { normalizeAsset } from "@/features/assets/model/normalizeAsset";',
        "editor/commands/example.ts",
      )[0]?.messageId,
    ).toBe("featurePublic");
    expect(
      verify(
        'import { normalizeAsset } from "../assets/model/normalizeAsset";',
        "features/workspace/normalize.ts",
      )[0]?.messageId,
    ).toBe("featurePublic");
  });

  it("rejects forbidden layer directions and LogicFlow SDK imports", () => {
    expect(
      verify(
        'import { createEditorContext } from "@/editor/context/EditorContext";',
        "core/document/normalizeGraph.ts",
      )[0]?.messageId,
    ).toBe("forbiddenLayer");
    expect(
      verify(
        'import data from "@/data/assets/shikigami.json";',
        "shared/platform/catalog.ts",
      )[0]?.messageId,
    ).toBe("forbiddenLayer");
    expect(
      verify(
        'import LogicFlow from "@logicflow/core";',
        "shells/embed/runtime.ts",
      )[0]?.messageId,
    ).toBe("logicflowInLayer");
    expect(
      verify(
        'import "@logicflow/core/lib/style/index.css";',
        "shells/embed/PreviewCanvas.vue",
      ),
    ).toEqual([]);
    expect(
      verify(
        'import "@logicflow/core/lib/style/runtime.js";',
        "shells/embed/PreviewCanvas.vue",
      )[0]?.messageId,
    ).toBe("logicflowInLayer");
  });

  it("allows no other legacy-container dependency", () => {
    expect(
      verify(
        'import { convertTeamCode } from "@/utils/teamCodeService";',
        "features/workspace/useDocumentCommands.ts",
      )[0]?.messageId,
    ).toBe("legacyContainer");
    expect(
      verify(
        'import { helper } from "@/utils/other";',
        "features/workspace/teamCodeImportAdapter.ts",
      )[0]?.messageId,
    ).toBe("legacyContainer");
  });

  it("checks re-exports, dynamic imports, and require calls", () => {
    const samples = [
      'export { normalizeAsset } from "@/features/assets/model/normalizeAsset";',
      'export * from "@/features/assets/model/normalizeAsset";',
      'const module = import("@/features/assets/model/normalizeAsset");',
      'const module = require("@/features/assets/model/normalizeAsset");',
    ];

    samples.forEach((code) => {
      expect(verify(code, "editor/commands/example.ts")[0]?.messageId).toBe(
        "featurePublic",
      );
    });
  });

  it("keeps serializable stores behind injected DOM and storage adapters", () => {
    BROWSER_STATE_GLOBALS.forEach((globalName: string) => {
      const messages = linter.verify(
        `export const value = ${globalName};`,
        {
          parserOptions: { ecmaVersion: "latest", sourceType: "module" },
          rules: {
            "no-restricted-globals": createStoreRestrictedGlobalsRule(),
          },
        },
        `${projectRoot}/src/features/workspace/filesStore.ts`,
      );

      expect(messages[0]?.ruleId).toBe("no-restricted-globals");
    });

    expect(
      linter.verify(
        "export const read = (document) => document.value;",
        {
          parserOptions: { ecmaVersion: "latest", sourceType: "module" },
          rules: {
            "no-restricted-globals": createStoreRestrictedGlobalsRule(),
          },
        },
        `${projectRoot}/src/features/workspace/filesStore.ts`,
      ),
    ).toEqual([]);
  });

  it("keeps core documents independent from browser state", () => {
    BROWSER_STATE_GLOBALS.forEach((globalName: string) => {
      const messages = linter.verify(
        `export const value = ${globalName};`,
        {
          parserOptions: { ecmaVersion: "latest", sourceType: "module" },
          rules: {
            "no-restricted-globals": createCoreDocumentRestrictedGlobalsRule(),
          },
        },
        `${projectRoot}/src/core/document/types.ts`,
      );

      expect(messages[0]?.ruleId).toBe("no-restricted-globals");
    });
  });

  it("rejects framework packages from core documents", () => {
    for (const dependency of [
      "vue",
      "@vue/runtime-core",
      "pinia",
      "element-plus",
      "@logicflow/core",
    ]) {
      expect(
        verify(
          `import value from "${dependency}";`,
          "core/document/types.ts",
        )[0]?.messageId,
      ).toBe("documentFrameworkDependency");
    }
  });

  it("rejects editor context imports from serializable stores", () => {
    expect(
      verify(
        'import { createEditorContext } from "@/editor/context/EditorContext";',
        "features/workspace/filesStore.ts",
      )[0]?.messageId,
    ).toBe("storeDependency");
  });
});
