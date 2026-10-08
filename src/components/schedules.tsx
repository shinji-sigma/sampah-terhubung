import { CalendarDays, Clock3, Truck } from "lucide-react";
import { scheduleOn } from "@/lib/rules";
import { dateTime, type PublicData } from "@/lib/types";
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
  const dates = Array.from({ length: compact ? 3 : 14 }, (_, index) =>
    new Date(Date.parse(start + "T12:00:00Z") + index * 86400000)
      .toISOString()
      .slice(0, 10),
  );
  const rows = dates.flatMap((date) =>
    data.schedules
      .map((s) => scheduleOn(s, date, data.exceptions, data.runs))
      .filter((x) => x !== null),
  );
  return !rows.length ? (
    <Empty>
      Belum ada jadwal untuk periode ini. Pengelola perlu mengonfirmasi layanan.
    </Empty>
  ) : (
    <div className="schedule-list">
      {rows.map((row) => (
        <article className="schedule-row" key={row.schedule.id + row.date}>
          <div className="date-tile">
            <span>
              {new Intl.DateTimeFormat("id-ID", {
                weekday: "short",
                timeZone: "Asia/Jakarta",
              }).format(new Date(row.date + "T12:00:00+07:00"))}
            </span>
            <strong>{row.date.slice(8)}</strong>
            <span>
              {new Intl.DateTimeFormat("id-ID", {
                month: "short",
                timeZone: "Asia/Jakarta",
              }).format(new Date(row.date + "T12:00:00+07:00"))}
            </span>
          </div>
          <div className="schedule-content">
            <div className="card-heading">
              <h3>{row.schedule.service}</h3>
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
                  ? "✓ Pelaksanaan tercatat"
                  : !row.confirmed
                    ? "! Belum dikonfirmasi"
                    : row.cancelled
                      ? "! Dibatalkan"
                      : row.exception
                        ? "↻ Perubahan tanggal"
                        : "✓ Jadwal dikonfirmasi"}
              </span>
            </div>
            <p>
              <Clock3 size={16} />{" "}
              {row.cancelled
                ? "Menunggu jadwal pengganti"
                : row.start.slice(0, 5) +
                  "–" +
                  row.end.slice(0, 5) +
                  " WIB"}{" "}
              · {row.schedule.zone}
            </p>
            {row.exception && (
              <p className="notice warn">{row.exception.reason}</p>
            )}
            {row.run && (
              <p className="notice good">
                <Truck size={16} /> Aktual {dateTime(row.run.actual_at)}:{" "}
                {row.run.note}
              </p>
            )}
            <small>
              Sumber: {row.schedule.source} ·{" "}
              {row.schedule.confirmed_at
                ? "Konfirmasi " + dateTime(row.schedule.confirmed_at)
                : "Rencana belum dikonfirmasi"}
            </small>
            {!compact && (
              <small>
                <CalendarDays size={14} /> Berlaku {row.schedule.valid_from}{" "}
                s.d. {row.schedule.valid_until} · Diperbarui{" "}
                {dateTime(row.schedule.updated_at)}
              </small>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
