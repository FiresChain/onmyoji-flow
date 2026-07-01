import { describe, expect, it } from "vitest";
import { getTeamCodeCopyItems } from "@/utils/teamCodeCopy";
import type { GraphData } from "@/YysEditorEmbed.vue";

const createTeamNode = (
  id: string,
  teamCode: Record<string, unknown>,
  groupName = "队伍",
) => ({
  id,
  type: "dynamic-group",
  x: 0,
  y: 0,
  properties: {
    groupMeta: {
      version: 1,
      groupKind: "team",
      groupName,
      teamCode,
    },
  },
});

describe("getTeamCodeCopyItems", () => {
  it("extracts enabled team long code by default", () => {
    const graphData: GraphData = {
      nodes: [
        createTeamNode("team-1", {
          enabled: true,
          shortCode: "SHORT",
          longCode: "LONG",
          preferred: "long",
          label: "复制一队",
        }),
      ],
      edges: [],
    };

    expect(getTeamCodeCopyItems(graphData)).toEqual([
      {
        id: "team-1",
        label: "复制一队",
        code: "LONG",
        groupName: "队伍",
      },
    ]);
  });

  it("prefers short code when configured", () => {
    const graphData: GraphData = {
      nodes: [
        createTeamNode("team-short", {
          enabled: true,
          shortCode: "SHORT",
          longCode: "LONG",
          preferred: "short",
          label: "",
        }),
      ],
      edges: [],
    };

    expect(getTeamCodeCopyItems(graphData)[0]).toMatchObject({
      id: "team-short",
      label: "复制阵容码",
      code: "SHORT",
    });
  });

  it("ignores disabled, shikigami, and empty-code groups", () => {
    const graphData: GraphData = {
      nodes: [
        createTeamNode("disabled", {
          enabled: false,
          shortCode: "SHORT",
          longCode: "LONG",
          preferred: "long",
        }),
        {
          id: "shikigami",
          type: "dynamic-group",
          x: 0,
          y: 0,
          properties: {
            groupMeta: {
              version: 1,
              groupKind: "shikigami",
              groupName: "式神组",
              teamCode: {
                enabled: true,
                shortCode: "IGNORED",
                longCode: "IGNORED",
              },
            },
          },
        },
        createTeamNode("empty", {
          enabled: true,
          shortCode: "   ",
          longCode: "",
          preferred: "long",
        }),
      ],
      edges: [],
    };

    expect(getTeamCodeCopyItems(graphData)).toEqual([]);
  });
});
