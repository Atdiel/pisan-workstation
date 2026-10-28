import { authManager } from './auth.js';

const GRAPH = 'https://graph.microsoft.com/v1.0';

export interface PlannerTask {
  id: string;
  title: string;
  percentComplete: number;
  dueDateTime: string | null;
  planId: string;
  bucketId: string;
  assignments?: Record<string, unknown>;
}

export interface PlannerTaskDetails {
  id: string;
  description: string | null;
  checklist?: Record<string, unknown>;
  references?: Record<string, unknown>;
  previewType?: string;
}

export interface PlannerTaskPatch {
  title?: string;
  percentComplete?: number;
  dueDateTime?: string | null;
  bucketId?: string;
  assignments?: Record<string, unknown>;
}

export interface PlannerTaskDetailsPatch {
  description?: string;
  checklist?: Record<string, unknown>;
  references?: Record<string, unknown>;
  previewType?: string;
}

async function graphRequest(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const accessToken = await authManager.getGraphToken();
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Microsoft Graph ${response.status}: ${body}`);
  }

  return response;
}

async function getEtag(url: string): Promise<string> {
  const response = await graphRequest(url);
  const fromHeader = response.headers.get('etag');
  if (fromHeader) return fromHeader;

  const data = (await response.json()) as { '@odata.etag'?: string };
  if (!data['@odata.etag']) {
    throw new Error('Microsoft Graph no devolvió el ETag de la tarea');
  }
  return data['@odata.etag'];
}

/** Tareas de Planner asignadas al usuario autenticado (con paginación). */
export async function listPlannerTasks(): Promise<PlannerTask[]> {
  let url: string | undefined = `${GRAPH}/me/planner/tasks`;
  const tasks: PlannerTask[] = [];

  while (url) {
    const response = await graphRequest(url);
    const page = (await response.json()) as {
      value: PlannerTask[];
      '@odata.nextLink'?: string;
    };
    tasks.push(...page.value);
    url = page['@odata.nextLink'];
  }

  return tasks.filter(
    (task) => task.assignments && Object.keys(task.assignments).length > 0,
  );
}

/** Detalle extendido (descripción, checklist, referencias). */
export async function getPlannerTaskDetails(
  taskId: string,
): Promise<PlannerTaskDetails> {
  const response = await graphRequest(
    `${GRAPH}/planner/tasks/${encodeURIComponent(taskId)}/details`,
  );
  return (await response.json()) as PlannerTaskDetails;
}

/** Actualización de la tarea (requiere If-Match con el ETag vigente). */
export async function updatePlannerTask(
  taskId: string,
  patch: PlannerTaskPatch,
): Promise<void> {
  const url = `${GRAPH}/planner/tasks/${encodeURIComponent(taskId)}`;
  const etag = await getEtag(url);

  await graphRequest(url, {
    method: 'PATCH',
    headers: { 'If-Match': etag },
    body: JSON.stringify(patch),
  });
}

/** Actualización de descripción/checklist (ETag propio del recurso details). */
export async function updatePlannerTaskDetails(
  taskId: string,
  patch: PlannerTaskDetailsPatch,
): Promise<void> {
  const url = `${GRAPH}/planner/tasks/${encodeURIComponent(taskId)}/details`;
  const etag = await getEtag(url);

  await graphRequest(url, {
    method: 'PATCH',
    headers: { 'If-Match': etag },
    body: JSON.stringify(patch),
  });
}
