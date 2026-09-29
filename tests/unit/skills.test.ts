import { describe, expect, it } from "@jest/globals";
import {
  resolveSkillFilePath,
  getPlankaSkillMarkdown,
  getPlankaServerInstructions,
  GENERIC_PLANKA_SERVER_INSTRUCTIONS,
  BUSINESS_PLANKA_SERVER_INSTRUCTIONS,
  hasCustomBusinessSkill,
} from "../../common/skills.js";
import { createKanbanServer } from "../../index.js";

describe("common/skills", () => {
  it("should resolve the skill file path", () => {
    const resolved = resolveSkillFilePath();
    expect(resolved).toBeDefined();
    expect(resolved.endsWith(".md")).toBe(true);
  });

  it("should load the markdown skill content", () => {
    const markdown = getPlankaSkillMarkdown();
    expect(markdown).toBeDefined();
    expect(markdown).toContain("Planka Kanban Operations Skill");
  });

  it("should have generic server instructions defined", () => {
    expect(GENERIC_PLANKA_SERVER_INSTRUCTIONS).toBeDefined();
    expect(GENERIC_PLANKA_SERVER_INSTRUCTIONS).toContain("DUPLICATE PREVENTION");
    expect(GENERIC_PLANKA_SERVER_INSTRUCTIONS).toContain("TASK HIERARCHY");
    expect(GENERIC_PLANKA_SERVER_INSTRUCTIONS).toContain("planka://skills/planka-operations");
  });

  it("should return the correct instructions based on custom skill availability", () => {
    const instructions = getPlankaServerInstructions();
    expect(instructions).toBeDefined();
    if (hasCustomBusinessSkill()) {
      expect(instructions).toBe(BUSINESS_PLANKA_SERVER_INSTRUCTIONS);
    } else {
      expect(instructions).toBe(GENERIC_PLANKA_SERVER_INSTRUCTIONS);
    }
  });

  it("should instantiate server with instructions and skill capabilities", () => {
    const server = createKanbanServer();
    expect(server).toBeDefined();
    expect(server.server).toBeDefined();
  });
});
