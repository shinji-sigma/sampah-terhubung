import type { Photo } from "./types";

// Photos and incidents must already be filtered by the caller's RLS session.
export function withPhotoContext(
  photos: Photo[],
  incidents: { id: string }[],
  tasks: { id: string; incident_id: string }[],
): Photo[] {
  const visible = new Set(incidents.map((i) => i.id));
  const context = new Map(tasks.map((t) => [t.id, t.incident_id]));
  return photos.map((p) => {
    const incident = p.task_id ? context.get(p.task_id) : undefined;
    return {
      ...p,
      incident_id: incident && visible.has(incident) ? incident : null,
    };
  });
}
