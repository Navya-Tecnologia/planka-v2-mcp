import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cachedSkillMarkdown: string | null = null;

/**
 * Checks whether a custom/private business skill path is explicitly configured and exists.
 */
export function hasCustomBusinessSkill(): boolean {
  return Boolean(process.env.MCP_SKILL_FILE_PATH && fs.existsSync(process.env.MCP_SKILL_FILE_PATH));
}

/**
 * Resolves the location of the Planka skill markdown file.
 * Prioritizes MCP_SKILL_FILE_PATH environment variable if set.
 */
export function resolveSkillFilePath(): string {
  if (process.env.MCP_SKILL_FILE_PATH && fs.existsSync(process.env.MCP_SKILL_FILE_PATH)) {
    return process.env.MCP_SKILL_FILE_PATH;
  }

  const candidatePaths = [
    path.resolve(__dirname, "../docs/skills/planka-kanban-skill.md"),
    path.resolve(__dirname, "../../docs/skills/planka-kanban-skill.md"),
    path.resolve(process.cwd(), "docs/skills/planka-kanban-skill.md"),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return candidatePaths[0];
}

/**
 * Reads the full Planka skill markdown content.
 */
export function getPlankaSkillMarkdown(): string {
  if (cachedSkillMarkdown) {
    return cachedSkillMarkdown;
  }

  const filePath = resolveSkillFilePath();
  try {
    if (fs.existsSync(filePath)) {
      cachedSkillMarkdown = fs.readFileSync(filePath, "utf-8");
      return cachedSkillMarkdown;
    }
  } catch (error) {
    console.error(`[WARN] Failed to load skill file from ${filePath}:`, error);
  }

  // Fallback inline content if file not found
  return `# Planka Kanban Operations Skill\n\nDefault operational guidelines for Planka Kanban management.`;
}

/**
 * Public generic instructions sent during initialize handshake to all standard MCP clients.
 */
export const GENERIC_PLANKA_SERVER_INSTRUCTIONS = `You are an expert Planka Kanban operations assistant. Follow these core protocols strictly when managing boards, cards, and tasks:

1. IDENTIFIER RESOLUTION: Users specify human-readable names (projects, boards, lists, users). Always resolve internal system IDs using lookup tools before modifying state.
2. DUPLICATE PREVENTION: Before creating a card, always scan the target board/list to verify if an active card already exists for the given topic or issue.
3. TITLE CONVENTIONS: Keep titles clear and concise, prefixed by category or ticket identifier when available (e.g. '[FEAT] New dashboard', '[BUG] Login fix').
4. TASK HIERARCHY: In Planka v2, checklists require: Card -> TaskList (checklist container) -> Task (item). Always create a task list with 'mcp_kanban_task_list_manager' before adding checklist items.
5. VERIFICATION: Verify all write operations by re-reading the card details, checklist, or membership state.
6. PLAYBOOKS & PROMPTS: Detailed operational guidelines are available on-demand via the MCP Resource 'planka://skills/planka-operations', and reusable workflows via MCP Prompts.`;

/**
 * Private business instructions sent when MCP_SKILL_FILE_PATH is configured.
 */
export const BUSINESS_PLANKA_SERVER_INSTRUCTIONS = `You are an expert Planka Kanban operations assistant. Follow these core protocols strictly when managing boards, cards, and tasks:

1. IDENTIFIER RESOLUTION: Users specify human-readable names (projects, boards, lists, users, OT numbers). Always resolve internal system IDs using lookup tools before modifying state.
2. DUPLICATE PREVENTION: Before creating a card, always scan active lists on the board. For work orders, look for existing cards titled '[OTxxxxx]'. If found, update the existing card in place rather than creating a duplicate.
3. TITLE CONVENTIONS:
   - Work Orders: '[OTxxxxx] <Cliente/Sitio> - <Trabajo>' (e.g. '[OT52453] Cliente - Sustitución batería').
   - Support Tasks: '<Cliente/Persona> - <Resumen corto>'.
4. TASK HIERARCHY: In Planka v2, checklists require: Card -> TaskList (checklist container) -> Task (item). Always create a task list with 'mcp_kanban_task_list_manager' before adding checklist items.
5. CLOSING WORK ORDERS: When an OT is completed, assign the label 'OT CERRADA' and add a comment: 'OT finalizada el día DD/MM/YYYY.'
6. VERIFICATION: Verify all write operations by re-reading the card details, checklist, or membership state.
7. DETAILED GUIDANCE: Detailed operational playbooks are available on-demand via the MCP Resource 'planka://skills/planka-operations', and reusable workflows via MCP Prompts.`;

export function getPlankaServerInstructions(): string {
  return hasCustomBusinessSkill() ? BUSINESS_PLANKA_SERVER_INSTRUCTIONS : GENERIC_PLANKA_SERVER_INSTRUCTIONS;
}

/**
 * Registers Planka skills, resources, and workflow prompts into the given McpServer.
 */
export function registerPlankaSkills(server: McpServer): void {
  // 1. Expose markdown skill as an MCP Resource
  server.registerResource(
    "planka-operations-skill",
    "planka://skills/planka-operations",
    {
      title: "Planka Kanban Operations Skill",
      description: "Operational manual, naming conventions, checklist templates, and lifecycle guidelines for Planka Kanban",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          text: getPlankaSkillMarkdown(),
          mimeType: "text/markdown",
        },
      ],
    })
  );

  // -------------------------------------------------------------
  // PUBLIC GENERIC PROMPTS (Always registered for all clients)
  // -------------------------------------------------------------

  // Prompt A: Crear tarjeta estructurada con checklist
  server.registerPrompt(
    "crear_tarjeta_con_checklist",
    {
      title: "Crear tarjeta con checklist y asignación",
      description: "Guía al modelo para crear una tarjeta estructurada en Planka, con lista de chequeo y miembro asignado",
      argsSchema: {
        titulo: z.string().describe("Título o nombre de la tarjeta"),
        boardName: z.string().optional().describe("Nombre del tablero destino"),
        listName: z.string().optional().describe("Nombre de la lista/columna (ej: 'To Do', 'Backlog', 'No iniciada')"),
        descripcion: z.string().optional().describe("Descripción detallada o contexto de la tarjeta"),
        usuarioAsignado: z.string().optional().describe("Nombre de usuario para asignar a la tarjeta"),
      },
    },
    ({ titulo, boardName, listName, descripcion, usuarioAsignado }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Crear una nueva tarjeta estructurada en Planka:
1. TABLERO Y LISTA: Localiza el tablero ${boardName ? `'${boardName}'` : 'deseado'} y la lista ${listName ? `'${listName}'` : 'de entrada'}.
2. PREVENCIÓN DE DUPLICADOS: Revisa que no exista ya una tarjeta con el título '${titulo}'.
3. CREAR TARJETA: Crea la tarjeta con título '${titulo}' ${descripcion ? `y descripción: "${descripcion}"` : ''}.
4. CHECKLIST: Crea un contenedor de tareas (TaskList) y agrega los pasos operativos necesarios.
5. ASIGNACIÓN: ${usuarioAsignado ? `Asigna la tarjeta al usuario '${usuarioAsignado}'.` : 'Deja la tarjeta pendiente de asignación.'}
6. VERIFICACIÓN: Consulta los detalles de la tarjeta creada y resume el ID y enlace resultante.`,
          },
        },
      ],
    })
  );

  // Prompt B: Auditar estado general del tablero
  server.registerPrompt(
    "auditar_tablero",
    {
      title: "Auditar estado general del tablero Kanban",
      description: "Inspecciona el tablero para verificar tarjetas sin asignar, tareas pendientes en checklists y estado de columnas",
      argsSchema: {
        boardName: z.string().optional().describe("Nombre del tablero a auditar"),
      },
    },
    ({ boardName }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Auditoría de estado del tablero ${boardName ? `'${boardName}'` : 'actual'} en Planka:
1. Obtén la lista de columnas/listas y las tarjetas activas.
2. Identifica tarjetas que no tienen miembros asignados.
3. Revisa tarjetas con tareas pendientes en sus listas de verificación (checklists).
4. Detecta columnas que puedan estar acumulando cuello de botella.
5. Presenta un informe conciso en español con sugerencias de acción.`,
          },
        },
      ],
    })
  );

  // Prompt C: Plantilla de checklist estándar
  server.registerPrompt(
    "plantilla_checklist",
    {
      title: "Aplicar plantilla de checklist a una tarjeta",
      description: "Añade una lista de verificación predefinida a una tarjeta (desarrollo, corrección de bug o tarea estándar)",
      argsSchema: {
        cardId: z.string().describe("ID de la tarjeta en Planka"),
        tipo: z.enum(["desarrollo", "bugfix", "estandar"]).describe("Tipo de plantilla ('desarrollo', 'bugfix', 'estandar')"),
      },
    },
    ({ cardId, tipo }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Generar checklist para la tarjeta ${cardId} (Plantilla: ${tipo}):
1. Consulta la tarjeta ${cardId} para verificar su estado actual.
2. Crea un TaskList titulado '${tipo === "desarrollo" ? "Pasos de Implementación" : tipo === "bugfix" ? "Resolución de Incidencia" : "Lista de Control"}'.
3. Añade los siguientes items:
${
  tipo === "desarrollo"
    ? `   - Clarificar requisitos y especificaciones
   - Implementar funcionalidad principal y pruebas unitarias
   - Revisión de código y validación de estilos
   - Pruebas manuales o de integración
   - Despliegue y verificación en entorno destino
   - Actualizar documentación y cerrar tarjeta`
    : tipo === "bugfix"
    ? `   - Reproducir incidencia y analizar logs
   - Identificar causa raíz en código o configuración
   - Implementar corrección y pruebas de regresión
   - Verificar en entorno local/test
   - Desplegar parche y validar resolución`
    : `   - Revisar requisitos iniciales y material
   - Ejecutar acciones operativas
   - Comprobar estándares de calidad
   - Registrar resultado y notificar interesados`
}
4. Verifica que los items se hayan creado correctamente en la tarjeta.`,
          },
        },
      ],
    })
  );

  // Prompt D: Resumir tablero por columnas
  server.registerPrompt(
    "resumir_tablero",
    {
      title: "Resumen ejecutivo del tablero por columnas",
      description: "Genera una tabla o resumen ordenado de las tarjetas activas agrupadas por columnas",
      argsSchema: {
        boardName: z.string().optional().describe("Nombre del tablero a resumir"),
      },
    },
    ({ boardName }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Genera un resumen ejecutivo del tablero ${boardName ? `'${boardName}'` : 'actual'} en Planka:
1. Consulta las listas y tarjetas del tablero.
2. Agrupa las tarjetas por columna.
3. Para cada columna, muestra el número total de tarjetas y una lista con: Título, Asignado y progreso de checklist.
4. Presenta el resumen de forma limpia en formato Markdown.`,
          },
        },
      ],
    })
  );

  // -------------------------------------------------------------
  // PRIVATE BUSINESS PROMPTS (Registered only when MCP_SKILL_FILE_PATH is set)
  // -------------------------------------------------------------
  if (hasCustomBusinessSkill()) {
    // Prompt 1: Crear o enriquecer tarea de OT
    server.registerPrompt(
      "crear_tarea_ot",
      {
        title: "Crear o enriquecer tarea de Orden de Trabajo (OT) [Privado]",
        description: "Guía al modelo para crear o actualizar una tarjeta de OT respetando nomenclatura [OTxxxxx] y evitando duplicados",
        argsSchema: {
          numeroOt: z.string().describe("Número visible de la OT (ej: 52453)"),
          cliente: z.string().describe("Nombre del cliente o instalación"),
          trabajo: z.string().describe("Descripción breve del trabajo"),
          tecnicoAsignado: z.string().optional().describe("Nombre de usuario del técnico a asignar"),
          boardName: z.string().optional().default("CLIENTES").describe("Nombre del tablero (por defecto CLIENTES)"),
        },
      },
      ({ numeroOt, cliente, trabajo, tecnicoAsignado, boardName }) => ({
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Protocolo para gestionar la OT ${numeroOt} en Planka:
1. TABLERO: Ubica el tablero '${boardName || "CLIENTES"}' dentro del proyecto de soporte.
2. PREVENCIÓN DE DUPLICADOS: Escanea las listas activas ('Pendiente asignacion', 'No iniciada', 'En proceso', 'En espera') buscando si ya existe una tarjeta con '[OT${numeroOt}]'.
3. ACCIÓN:
   - Si YA EXISTE: No crees una tarjeta nueva. Actualiza su descripción con los nuevos datos y aprovecha para revisar tareas pendientes.
   - Si NO EXISTE: Créala con título: '[OT${numeroOt}] ${cliente} - ${trabajo}'.
     - Lista destino: Si no hay técnico asignado, colócala en 'Pendiente asignacion'; si tiene técnico, en 'No iniciada' o 'En proceso'.
4. CHECKLIST OPERATIVO: Crea una lista de tareas (TaskList) dentro de la tarjeta y añade los pasos necesarios para completar el trabajo.
5. ASIGNACIÓN: ${tecnicoAsignado ? `Asigna la tarjeta al usuario '${tecnicoAsignado}' mediante membresía.` : "Deja la tarjeta pendiente de asignación."}
6. VERIFICACIÓN: Consulta los detalles de la tarjeta y reporta el ID, URL y resumen en español.`,
            },
          },
        ],
      })
    );

    // Prompt 2: Cerrar o finalizar OT
    server.registerPrompt(
      "cerrar_tarea_ot",
      {
        title: "Cerrar o finalizar tarea de OT en Planka [Privado]",
        description: "Aplica etiqueta OT CERRADA, registra comentario de finalización y actualiza el checklist",
        argsSchema: {
          numeroOt: z.string().describe("Número visible de la OT (ej: 52453)"),
          fechaCierre: z.string().optional().describe("Fecha de cierre en formato DD/MM/YYYY (opcional)"),
        },
      },
      ({ numeroOt, fechaCierre }) => {
        const fecha = fechaCierre || new Date().toLocaleDateString("es-ES");
        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Protocolo para finalizar la OT ${numeroOt} en Planka:
1. BÚSQUEDA: Localiza la tarjeta que contiene '[OT${numeroOt}]' en el tablero de soporte.
2. ETIQUETA: Asigna la etiqueta 'OT CERRADA' a la tarjeta.
3. COMENTARIO: Añade un comentario de auditoría: 'OT finalizada el día ${fecha}.'
4. CHECKLIST: Marca las tareas restantes como completadas si el trabajo concluyó satisfactoriamente.
5. VERIFICACIÓN: Consulta la tarjeta para confirmar que la etiqueta y el comentario quedaron guardados.`,
              },
            },
          ],
        };
      }
    );

    // Prompt 3: Auditar tablero de OTs
    server.registerPrompt(
      "auditar_tablero_ot",
      {
        title: "Auditar tarjetas de OT en tablero [Privado]",
        description: "Analiza el tablero para verificar consistencia en títulos [OTxxxxx], duplicados y estado de checklists",
        argsSchema: {
          boardName: z.string().optional().default("CLIENTES").describe("Nombre del tablero a auditar"),
        },
      },
      ({ boardName }) => ({
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Auditoría de calidad sobre el tablero '${boardName || "CLIENTES"}' de Planka:
1. Obtén la estructura del tablero (listas y tarjetas activas).
2. Comprueba que las tarjetas de OT comiencen exactamente con el formato '[OTxxxxx]' sin espacios.
3. Detecta posibles tarjetas duplicadas con el mismo número de OT.
4. Identifica tarjetas que no tengan checklist de seguimiento o que lleven tiempo sin asignar en 'Pendiente asignacion'.
5. Genera un informe conciso en español agrupado por listas con las recomendaciones detectadas.`,
            },
          },
        ],
      })
    );
  }
}
