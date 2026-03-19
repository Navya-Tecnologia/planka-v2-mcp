import * as projects from "./operations/projects.js";
import * as boards from "./operations/boards.js";

async function runPhase1() {
  console.log("🧪 PHASE 1: Project & Board Management");
  
  try {
    // 1. Create Project
    console.log("\n1. Creating Project: 'MCP Test Project'...");
    const project = await projects.createProject({
      name: "MCP Test Project",
      type: "shared"
    });
    console.log(`✅ Project created: ${project.name} (ID: ${project.id})`);

    // 2. List Projects
    console.log("\n2. Listing Projects...");
    const projectList = await projects.getProjects(1, 10);
    const found = projectList.items.find(p => p.id === project.id);
    if (found) {
      console.log(`✅ Project found in list.`);
    } else {
      throw new Error("❌ Project NOT found in list after creation!");
    }

    // 3. Create Board
    console.log("\n3. Creating Board: 'Verification Board'...");
    const board = await boards.createBoard({
      projectId: project.id,
      name: "Verification Board",
      position: 65535
    });
    console.log(`✅ Board created: ${board.name} (ID: ${board.id})`);

    // 4. Update Board
    console.log("\n4. Updating Board name to 'Verified Board'...");
    const updatedBoard = await boards.updateBoard(board.id, {
      name: "Verified Board"
    });
    console.log(`✅ Board updated: ${updatedBoard.name}`);

    console.log("\n✨ PHASE 1 COMPLETED SUCCESSFULLY");
    
    // Store IDs for next phase
    console.log("\n--- CONTEXT FOR NEXT PHASES ---");
    console.log(`PROJECT_ID=${project.id}`);
    console.log(`BOARD_ID=${board.id}`);
    
  } catch (error: any) {
    console.error("\n❌ PHASE 1 FAILED!");
    console.error(error.message || error);
    if (error.response) console.error(JSON.stringify(error.response, null, 2));
    process.exit(1);
  }
}

runPhase1();
