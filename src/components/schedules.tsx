import { Clock3 } from "lucide-react";
import { scheduleOn } from "@/lib/rules";
import { dateLabel, dateTime, type PublicData } from "@/lib/types";
import { Empty } from "./primitives";

export function Schedules({
  data,
  start,
  compact = false,
}: {
  data: PublicData;
  start: string;
  compact?: boolean;
}) {
  if (!start) return <Empty>Pilih tanggal untuk melihat jadwal.</Empty>;
  const dates = Array.from({ length: 14 }, (_, index) =>
    new Date(Date.parse(start + "T12:00:00Z") + index * 86400000)
      .toISOString()
      .slice(0, 10),
  );
  const allRows = dates.flatMap((date) =>
    data.schedules
      .map((s) => scheduleOn(s, date, data.exceptions, data.runs))
      .filter((x) => x !== null),
  );
  const rows = compact ? allRows.slice(0, 2) : allRows;
  const services = data.schedules.filter((s) =>
    rows.some((row) => row.schedule.id === s.id),
  );
  if (!rows.length)
    return (
      <Empty>
        Belum ada jadwal untuk periode ini. Pengelola perlu mengonfirmasi
        layanan.
      </Empty>
    );
  return (
    <>
      <div className={"schedule-list " + (compact ? "compact" : "")}>
        {rows.map((row) => (
          <article className="schedule-row" key={row.schedule.id + row.date}>
            <div className="schedule-date">
              <time dateTime={row.date}>
                {new Intl.DateTimeFormat("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "short",
                  timeZone: "Asia/Jakarta",
                }).format(new Date(row.date + "T12:00:00+07:00"))}
              </time>
              <strong>
                <Clock3 size={16} />
                {row.cancelled
                  ? "Dibatalkan"
                  : row.start.slice(0, 5) + "–" + row.end.slice(0, 5) + " WIB"}
              </strong>
            </div>
            <div className="schedule-content">
              <h3>{row.schedule.service}</h3>
              <p>{row.schedule.zone}</p>
              {row.exception && (
                <p className="schedule-change">
                  Perubahan: {row.exception.reason}
                </p>
              )}
              {row.run && (
                <p className="schedule-actual">
                  Aktual {dateTime(row.run.actual_at)} · {row.run.note}
                </p>
              )}
            </div>
            <span
              className={
                "badge " +
                (row.run
                  ? "good"
                  : !row.confirmed || row.cancelled
                    ? "warn"
                    : "info")
              }
            >
              {row.run
                ? "Pelaksanaan tercatat"
                : !row.confirmed
                  ? "Belum dikonfirmasi"
                  : row.cancelled
                    ? "Dibatalkan"
                    : row.exception
                      ? "Perubahan tanggal"
                      : "Jadwal dikonfirmasi"}
            </span>
          </article>
        ))}
      </div>
      {compact && (
        <p className="schedule-source">
          Sumber: {services.map((s) => s.source).join("; ")}
        </p>
      )}
      <details className="service-details">
        <summary>Sumber & ketentuan layanan</summary>
        {services.map((s) => (
          <dl className="service-facts" key={s.id}>
            <div>
              <dt>Layanan</dt>
              <dd>
                {s.service} · {s.zone}
              </dd>
            </div>
            <div>
              <dt>Sumber</dt>
              <dd>{s.source}</dd>
            </div>
            <div>
              <dt>Konfirmasi</dt>
              <dd>
                {s.confirmed_at
                  ? dateTime(s.confirmed_at)
                  : "Rencana belum dikonfirmasi"}
              </dd>
            </div>
            <div>
              <dt>Masa berlaku</dt>
              <dd>
                {dateLabel(s.valid_from)} – {dateLabel(s.valid_until)}
              </dd>
            </div>
            <div>
              <dt>Diperbarui</dt>
              <dd>{dateTime(s.updated_at)}</dd>
            </div>
          </dl>
        ))}
      </details>
    </>
  );
}
