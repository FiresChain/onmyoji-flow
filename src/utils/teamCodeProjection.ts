import { getAssetDataSource } from "@/configs/assetCatalog";
import type { AssetLibraryId } from "@/types/assets";
import type { GraphNode, RootDocument } from "@/ts/schema";

type SelectedAsset = NonNullable<GraphNode["properties"]["selectedAsset"]>;
type CatalogAsset = {
  id: string;
  name: string;
  avatar: string;
  [key: string]: any;
};
type DecodedMember = {
  index: number;
  kind: "onmyoji" | "shikigami";
  occupied: boolean;
  id: number | null;
  skills: { id: number; level: number }[];
  yuhunSetGroups: number[][];
  twoPieceEffectIds: number[];
};
type DecodedResponse = {
  slotCount: number;
  teamName: string | null;
  formation: {
    version: number;
    teamDescription: string;
    members: DecodedMember[];
  };
};

const TWO_PIECE_NAMES: Record<number, string> = {
  0: "攻击加成",
  1: "暴击",
  2: "暴击伤害",
  4: "效果命中",
  5: "效果抵抗",
  6: "生命加成",
  7: "防御加成",
};
const SHIKIGAMI_SCOPE = ["shikigami-yuhun", "shikigami-shikigami"];
const TEAM_SCOPE = ["team-shikigami", "team-yuhun", "team-shikigami-yuhun"];
const id = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;
const validId = (value: unknown): value is number =>
  Number.isSafeInteger(value) && Number(value) > 0;

const catalogMap = (library: AssetLibraryId) =>
  new Map<string, CatalogAsset>(
    getAssetDataSource(library, "zh").map((item) => [
      item.id,
      item as CatalogAsset,
    ]),
  );

const catalogAsset = (
  library: AssetLibraryId,
  assetId: string,
  catalog: Map<string, CatalogAsset>,
  fallbackName: string,
): SelectedAsset => {
  const matched = catalog.get(assetId);
  return {
    ...matched,
    id: assetId,
    assetId: `${library}:${assetId}`,
    library,
    name: matched?.name || fallbackName,
    avatar: matched?.avatar || "",
    source: "team-code",
  };
};

const makeMainAsset = (
  member: DecodedMember,
  library: "onmyoji" | "shikigami",
  catalog: Map<string, CatalogAsset>,
) =>
  catalogAsset(
    library,
    String(member.id),
    catalog,
    `${library === "onmyoji" ? "阴阳师" : "式神"}#${member.id}`,
  );

const onmyojiSkills = (
  member: DecodedMember,
  catalog: Map<string, CatalogAsset>,
): SelectedAsset[] => {
  const seen = new Set<string>();
  return (Array.isArray(member.skills) ? member.skills : []).flatMap(
    (skill) => {
      if (!validId(skill?.id)) return [];
      const skillId =
        skill.id < 100 ? Number(member.id) * 100 + skill.id : skill.id;
      const key = `${member.id}:${skillId}`;
      if (seen.has(key)) return [];
      seen.add(key);
      const asset = catalogAsset(
        "onmyojiSkill",
        key,
        catalog,
        `技能#${skillId}`,
      );
      const level =
        Number.isSafeInteger(skill.level) && skill.level > 0 ? skill.level : 0;
      return [
        {
          ...asset,
          onmyojiId: String(member.id),
          skillId: String(skillId),
          name: level ? `${asset.name} Lv${level}` : asset.name,
        },
      ];
    },
  );
};

const shikigamiYuhun = (
  member: DecodedMember,
  catalog: Map<string, CatalogAsset>,
): SelectedAsset[] => {
  const groups = Array.isArray(member.yuhunSetGroups)
    ? member.yuhunSetGroups
    : [];
  const assets = groups.flatMap((group, index) => {
    if (!Array.isArray(group)) return [];
    const ids = [...new Set(group)]
      .filter(validId)
      .map((value) =>
        value < 1000 ? `300${String(value).padStart(3, "0")}` : String(value),
      );
    if (!ids.length) return [];
    const choices = ids.map((setId) =>
      catalogAsset("yuhun", setId, catalog, `御魂#${setId}`),
    );
    if (choices.length === 1) return choices;
    const groupId = `team-code-set-group-${index}-${ids.join("-")}`;
    const alternatives = choices.map((choice) => choice.name || "");
    return [
      {
        id: groupId,
        assetId: `yuhun:${groupId}`,
        library: "yuhun" as const,
        name: `任选套装（${alternatives.join(" / ")}）`,
        shortName: "任选套装",
        type: "team-code-set-group",
        alternatives,
        avatar: "",
        source: "team-code",
      },
    ];
  });
  if (!assets.length)
    assets.push(catalogAsset("yuhun", "300000", catalog, "散件"));
  const effects = Array.isArray(member.twoPieceEffectIds)
    ? member.twoPieceEffectIds
    : [];
  for (const effectId of new Set(effects)) {
    const name = TWO_PIECE_NAMES[effectId];
    if (!name) continue;
    assets.push({
      id: `team-code-two-piece-effect-${effectId}`,
      assetId: `yuhun:team-code-two-piece-effect-${effectId}`,
      library: "yuhun",
      name,
      shortName: name,
      type: "team-code-two-piece-effect",
      avatar: "",
      source: "team-code",
    });
  }
  return assets;
};

const nodeStyle = (width: number, height: number, radius = 4) => ({
  width,
  height,
  rotate: 0,
  fill: "#ffffff",
  stroke: "#dcdfe6",
  strokeWidth: 0,
  radius,
  opacity: 1,
  shadow: { color: "rgba(0,0,0,0.1)", blur: 4, offsetX: 0, offsetY: 2 },
});

const assetNode = (
  library: AssetLibraryId,
  selectedAsset: SelectedAsset,
  x: number,
  y: number,
): GraphNode => {
  const size =
    library === "shikigami"
      ? [180, 180]
      : library === "onmyoji"
        ? [147, 147]
        : library === "onmyojiSkill"
          ? [68, 67]
          : [75, 75];
  return {
    id: id("asset"),
    type: "assetSelector",
    x,
    y,
    zIndex: 1,
    properties: {
      assetLibrary: library,
      selectedAsset,
      width: size[0],
      height: size[1],
      assetName: {
        visible: false,
        labelNodeId: null,
        offsetX: 0,
        offsetY: 78,
        lastSyncedAssetName: selectedAsset.name,
      },
      meta: { visible: true, locked: false },
      style: {
        ...nodeStyle(
          size[0],
          size[1],
          library === "shikigami" ? 200 : library === "onmyojiSkill" ? 100 : 4,
        ),
        fill:
          library === "yuhun" || library === "onmyojiSkill"
            ? "transparent"
            : "#ffffff",
        strokeWidth:
          library === "onmyoji" || library === "onmyojiSkill" ? 1 : 0,
      },
    } as GraphNode["properties"],
  };
};

const textNode = (
  content: string,
  x: number,
  y: number,
  fontSize: number,
): GraphNode => ({
  id: id("text"),
  type: "textNode",
  x,
  y,
  zIndex: 10,
  properties: {
    text: { content, rich: false },
    width: 860,
    height: 84,
    meta: { visible: true, locked: false },
    style: {
      ...nodeStyle(860, 84),
      fill: "transparent",
      stroke: "",
      strokeWidth: 0,
      shadow: { color: "transparent", blur: 0, offsetX: 0, offsetY: 0 },
      textStyle: { fontSize, align: "left", color: "#303133" },
    },
  } as GraphNode["properties"],
});

const groupNode = (
  groupId: string,
  x: number,
  y: number,
  width: number,
  height: number,
  children: string[],
  name: string,
  kind: "team" | "shikigami",
  zIndex: number,
  ruleEnabled = true,
): GraphNode => ({
  id: groupId,
  type: "dynamic-group",
  x,
  y,
  zIndex,
  children,
  properties: {
    children,
    collapsible: true,
    isCollapsed: false,
    width,
    height,
    collapsedWidth: 100,
    collapsedHeight: 60,
    radius: 6,
    isRestrict: false,
    autoResize: false,
    transformWithContainer: false,
    autoToFront: true,
    meta: { visible: true, locked: false },
    style: {
      ...nodeStyle(width, height),
      fill: kind === "team" ? "transparent" : "#ffffff",
      strokeWidth: kind === "team" ? 2 : 1,
    },
    groupMeta: {
      version: 1,
      groupKind: kind,
      groupName: name,
      ruleEnabled,
      ruleScope: kind === "team" ? TEAM_SCOPE : SHIKIGAMI_SCOPE,
    },
  } as GraphNode["properties"],
});

const secondaryPosition = (
  x: number,
  y: number,
  index: number,
  total: number,
  isOnmyoji: boolean,
) => {
  if (isOnmyoji) {
    if (total <= 1) return { x: x + 32, y: y + 63 };
    if (total === 2) return { x: x + (index ? 65 : 0), y: y + 63 };
    return {
      x: x - 20 + (index % 2) * 65,
      y: y + 56 + Math.floor(index / 2) * 58,
    };
  }
  if (total <= 1) return { x: x + 52, y: y + 63 };
  if (total === 2) return { x: x + 20 + index * 41, y: y + 63 };
  return {
    x: x + 8 + (index % 3) * 41,
    y: y + 51 + Math.floor(index / 3) * 46,
  };
};

/** Build the Flow document from decoded IDs and the catalog already loaded from R2. */
export const projectTeamCodeFormation = (
  input: unknown,
  options: { formationValidation?: boolean } = {},
): RootDocument => {
  const source = input as DecodedResponse;
  const members = source?.formation?.members;
  if (
    source?.slotCount !== 6 ||
    source?.formation?.version !== 1 ||
    !Array.isArray(members) ||
    members.length !== 6
  )
    throw new Error(
      source?.slotCount === 7
        ? "当前七槽位阵容暂不支持导入"
        : "阵容码响应缺少完整的六槽位数据",
    );
  if (
    members.some(
      (member, index) =>
        member?.index !== index ||
        member.kind !== (index === 0 ? "onmyoji" : "shikigami") ||
        typeof member.occupied !== "boolean" ||
        (member.occupied && !validId(member.id)),
    )
  )
    throw new Error("阵容码成员顺序、类型或 ID 无效");

  const catalog = {
    onmyoji: catalogMap("onmyoji"),
    shikigami: catalogMap("shikigami"),
    onmyojiSkill: catalogMap("onmyojiSkill"),
    yuhun: catalogMap("yuhun"),
  };
  const teamName =
    typeof source.teamName === "string" && source.teamName.trim()
      ? source.teamName.trim()
      : "官方阵容码";
  const description =
    typeof source.formation.teamDescription === "string"
      ? source.formation.teamDescription
      : "";
  const nodes: GraphNode[] = [textNode(teamName, 644, 352, 32)];
  if (description) nodes.push(textNode(description, 644, 680, 24));
  const memberGroups: GraphNode[] = [];
  members.forEach((member, index) => {
    if (!member.occupied) return;
    const x = 320 + index * 260;
    const y = 520;
    const isOnmyoji = index === 0;
    const main = makeMainAsset(
      member,
      isOnmyoji ? "onmyoji" : "shikigami",
      isOnmyoji ? catalog.onmyoji : catalog.shikigami,
    );
    const secondary = isOnmyoji
      ? onmyojiSkills(member, catalog.onmyojiSkill)
      : shikigamiYuhun(member, catalog.yuhun);
    const mainNode = assetNode(
      isOnmyoji ? "onmyoji" : "shikigami",
      main,
      isOnmyoji ? x - 32 : x,
      isOnmyoji ? y + 7 : y,
    );
    nodes.push(mainNode);
    const childIds = [mainNode.id];
    secondary.forEach((asset, secondaryIndex) => {
      const position = secondaryPosition(
        x,
        y,
        secondaryIndex,
        secondary.length,
        isOnmyoji,
      );
      const node = assetNode(
        isOnmyoji ? "onmyojiSkill" : "yuhun",
        asset,
        position.x,
        position.y,
      );
      nodes.push(node);
      childIds.push(node.id);
    });
    if (options.formationValidation) {
      const height =
        223 +
        Math.max(0, Math.ceil(secondary.length / (isOnmyoji ? 2 : 3)) - 1) * 56;
      const group = groupNode(
        id("group"),
        x,
        y,
        216,
        height,
        childIds,
        isOnmyoji ? "阴阳师" : main.name || `式神${index}`,
        "shikigami",
        -9999 + index,
        !isOnmyoji,
      );
      nodes.push(group);
      memberGroups.push(group);
    }
  });
  if (options.formationValidation && memberGroups.length) {
    const left = Math.min(
      ...memberGroups.map(
        (group) => group.x! - group.properties.style.width / 2,
      ),
    );
    const right = Math.max(
      ...memberGroups.map(
        (group) => group.x! + group.properties.style.width / 2,
      ),
    );
    const top = Math.min(
      ...memberGroups.map(
        (group) => group.y! - group.properties.style.height / 2,
      ),
    );
    const bottom = Math.max(
      ...memberGroups.map(
        (group) => group.y! + group.properties.style.height / 2,
      ),
    );
    const width = Math.max(300, Math.ceil(right - left + 112));
    const height = Math.max(240, Math.ceil(bottom - top + 88));
    nodes.push(
      groupNode(
        id("group"),
        Math.round((left + right) / 2),
        Math.round((top + bottom) / 2),
        width,
        height,
        memberGroups.map((group) => group.id),
        `${teamName}·队伍`,
        "team",
        -10020,
      ),
    );
  }
  const fileId = id("f");
  const now = Date.now();
  return {
    schemaVersion: "1.0.0",
    fileList: [
      {
        id: fileId,
        name: teamName,
        label: teamName,
        type: "FLOW",
        visible: true,
        graphRawData: { nodes, edges: [] },
        transform: { SCALE_X: 1, SCALE_Y: 1, TRANSLATE_X: 0, TRANSLATE_Y: 0 },
        createdAt: now,
        updatedAt: now,
      },
    ],
    activeFile: teamName,
    activeFileId: fileId,
  };
};
