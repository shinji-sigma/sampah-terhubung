import type {
  Incident,
  Schedule,
  ScheduleException,
  ScheduleRun,
} from "./types";
export function recurrence(incidents: Incident[], now: Date, days = 30) {
  const cutoff = now.getTime() - days * 86400000;
  const counts = new Map<string, Incident[]>();
  for (const i of incidents) {
    const time = Date.parse(i.verified_at);
    if (time < cutoff || time > now.getTime()) continue;
    if (
      i.previous_incident_id &&
      (!i.previous_closed_at ||
        Date.parse(i.observed_at) <= Date.parse(i.previous_closed_at))
    )
      continue;
    const existing = counts.get(i.point_id) ?? [];
    if (!existing.some((e) => e.id === i.id))
      counts.set(i.point_id, [...existing, i]);
  }
  return counts;
}
export function scheduleOn(
  schedule: Schedule,
  date: string,
  exceptions: ScheduleException[],
  runs: ScheduleRun[],
) {
  const day = new Date(date + "T12:00:00+07:00").getUTCDay();
  if (
    date < schedule.valid_from ||
    date > schedule.valid_until ||
    !schedule.weekdays.includes(day)
  )
    return null;
  const changes = exceptions
    .filter((e) => e.schedule_id === schedule.id && e.date === date)
    .sort(
      (a, b) =>
        a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id),
    );
  const exception = changes.at(-1);
  return {
    date,
    schedule,
    exception,
    cancelled: exception?.cancelled ?? false,
    confirmed: !!schedule.confirmed_at,
    start: exception?.start_time ?? schedule.start_time,
    end: exception?.end_time ?? schedule.end_time,
    run: runs.find((e) => e.schedule_id === schedule.id && e.date === date),
  };
}
export function jakartaDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
export function csvCell(value: unknown) {
  const text = String(value ?? "");
  const safe =
    // eslint-disable-next-line no-control-regex -- Detect control prefixes before spreadsheet formulas.
    /^[\s\u0000-\u001f]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text)
      ? "'" + text
      : text;
  return '"' + safe.replaceAll('"', '""') + '"';
}
export function csv(rows: unknown[][]) {
  return "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}
