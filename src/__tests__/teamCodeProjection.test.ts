import { afterEach, expect, it, vi } from "vitest";
import { loadAssetCatalog } from "@/configs/assetCatalog";
import { validateRootDocumentV1 } from "@/ts/schema";
import { convertTeamCodeToRootDocument } from "@/utils/teamCodeService";

afterEach(() => vi.unstubAllGlobals());

it("uses decoded IDs and the R2 catalog to render repeated shikigami", async () => {
  const catalog = {
    schemaVersion: 1,
    catalogVersion: "1.0.3",
    generatedAt: "2026-09-23T00:00:00Z",
    libraries: {
      shikigami: [
        {
          id: "410",
          names: { zh: "招福达摩" },
          avatar: "/assets/Shikigami/material/410.png",
          rarity: "素材",
        },
      ],
      onmyoji: [
        {
          id: "10",
          names: { zh: "晴明" },
          avatar: "/assets/Onmyoji/hero_10_10.png",
        },
      ],
      onmyojiSkill: [
        {
          id: "10:1008",
          onmyojiId: "10",
          skillId: "1008",
          names: { zh: "言灵·星" },
          avatar: "/assets/OnmyojiSkill/1008.png",
        },
      ],
      yuhun: [
        {
          id: "300000",
          names: { zh: "散件" },
          avatar: "/assets/Yuhun/300000.png",
        },
      ],
      hunling: [],
    },
  };
  const empty = (index: number) => ({
    index,
    kind: "shikigami",
    occupied: false,
    id: null,
    skills: [],
    yuhunSetGroups: [],
    twoPieceEffectIds: [],
  });
  const decoded = {
    slotCount: 6,
    teamName: "达摩阵容",
    formation: {
      version: 1,
      teamDescription: "两个招福达摩",
      members: [
        {
          index: 0,
          kind: "onmyoji",
          occupied: true,
          id: 10,
          skills: [{ id: 8, level: 5 }],
          yuhunSetGroups: [],
          twoPieceEffectIds: [],
        },
        empty(1),
        empty(2),
        empty(3),
        ...[4, 5].map((index) => ({
          index,
          kind: "shikigami",
          occupied: true,
          id: 410,
          skills: [],
          yuhunSetGroups: [],
          twoPieceEffectIds: [],
        })),
      ],
    },
  };
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => catalog })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, data: decoded }),
      }),
  );

  await loadAssetCatalog("https://assets.example/assets/catalog.json");
  const root = await convertTeamCodeToRootDocument("#TA#CODE", {
    serviceUrl: "https://api.example/decode",
    formationValidation: true,
  });
  expect(validateRootDocumentV1(root).valid).toBe(true);
  const nodes = (root.fileList as any[])[0].graphRawData.nodes;
  const shikigami = nodes.filter(
    (node: any) => node.properties.assetLibrary === "shikigami",
  );
  expect(
    shikigami.map((node: any) => node.properties.selectedAsset.name),
  ).toEqual(["招福达摩", "招福达摩"]);
  expect(
    shikigami.map((node: any) => node.properties.selectedAsset.avatar),
  ).toEqual([
    "/assets/Shikigami/material/410.png",
    "/assets/Shikigami/material/410.png",
  ]);
  expect(
    nodes.filter((node: any) => node.type === "dynamic-group"),
  ).toHaveLength(4);
  expect(
    nodes.find((node: any) => node.properties.assetLibrary === "onmyojiSkill")
      .properties.selectedAsset.name,
  ).toBe("言灵·星 Lv5");
});
