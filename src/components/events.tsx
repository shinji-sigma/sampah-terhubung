"use client";
import type { CleanupEvent, Region, Workspace } from "@/lib/types";
import { dateTime, incidentReference, shortId } from "@/lib/types";
import { ActionForm, localDateTime, type Field } from "./forms";
import { PhotoStrip, SectionTitle, Status } from "./primitives";
const required = (
  name: string,
  label: string,
  type: Field["type"] = "text",
): Field => ({ name, label, type, required: true });
export function Events({
  events,
  w,
  region,
  coordinator,
  refresh,
  login,
  now,
  preview = false,
  onSchedule,
}: {
  now: Date;
  events: CleanupEvent[];
  w: Workspace | null;
  region: Region | null;
  coordinator: boolean;
  refresh: () => void;
  login: () => void;
  preview?: boolean;
  onSchedule: () => void;
}) {
  const visible = coordinator && w ? w.events : events;
  return (
    <>
      <SectionTitle
        eyebrow="BERGERAK BERSAMA"
        title="Kegiatan lingkungan"
        description="Pembersihan terencana, dengan penanggung jawab dan tujuan pengangkutan yang jelas."
      />
      {coordinator && w && region && (
        <details>
          <summary>Rencanakan kegiatan</summary>
          <ActionForm
            op="event.create"
            fixed={{ region_id: region.id }}
            fields={[
              required("title", "Nama kegiatan"),
              required("location", "Lokasi / patokan"),
              {
                name: "point_id",
                label: "Titik terkait",
                type: "select",
                options: w.points.map((p) => ({ value: p.id, label: p.label })),
              },
              {
                name: "incident_id",
                label: "Insiden terkait",
                type: "select",
                options: w.incidents.map((i) => ({
                  value: i.id,
                  label:
                    incidentReference(
                      i.id,
                      w.incidents.map((x) => x.id),
                    ) +
                    " · " +
                    i.public_label,
                })),
              },
              {
                ...required("starts_at", "Jadwal mulai", "datetime-local"),
                initial: localDateTime(new Date(now.getTime() + 7 * 86400000)),
              },
              {
                ...required("capacity", "Kapasitas peserta", "number"),
                min: 1,
                max: 500,
                initial: "15",
              },
              required("pic", "PIC kegiatan"),
              required("duties", "Pembagian tugas", "textarea"),
              required("equipment", "Alat yang diperlukan", "textarea"),
              { name: "transporter", label: "Pengangkut" },
              {
                name: "pickup_at",
                label: "Waktu pengambilan",
                type: "datetime-local",
              },
              { name: "destination", label: "Tujuan pengangkutan" },
              {
                name: "transport_confirmed",
                label: "Pengangkut, waktu, dan tujuan sudah dikonfirmasi",
                type: "checkbox",
              },
            ]}
            label="Simpan sebagai draf"
            onDone={refresh}
          />
        </details>
      )}
      {!visible.length ? (
        <div className="empty-state">
          <h3>Belum ada kegiatan diterbitkan</h3>
          <p>
            Rencana kegiatan akan tampil setelah koordinator mengonfirmasi
            penanggung jawab dan pengangkutan.
          </p>
          <button className="text-button" onClick={onSchedule}>
            Lihat jadwal pengangkutan →
          </button>
          {coordinator && (
            <p className="small-muted">
              Gunakan “Rencanakan kegiatan” untuk menyiapkan draf.
            </p>
          )}
        </div>
      ) : (
        visible.map((e) => {
          const joined = w?.registrations.some(
            (r) => r.event_id === e.id && r.user_id === w.profile.id,
          );
          const members =
            w?.registrations.filter((r) => r.event_id === e.id) || [];
          const count = coordinator ? members.length : e.participants;
          return (
            <article className="card event-card" key={e.id}>
              <div className="card-heading">
                <h3>{e.title}</h3>
                <Status value={e.status} />
              </div>
              <p className="event-location">{e.location}</p>
              <dl className="facts">
                <div>
                  <dt>Jadwal</dt>
                  <dd>{dateTime(e.starts_at)}</dd>
                </div>
                <div>
                  <dt>Peserta</dt>
                  <dd>
                    {count === undefined
                      ? "Belum dimuat"
                      : count + " / " + e.capacity}
                  </dd>
                </div>
                <div>
                  <dt>PIC</dt>
                  <dd>{e.pic}</dd>
                </div>
                <div>
                  <dt>Tugas & alat</dt>
                  <dd>
                    {e.duties}
                    <br />
                    {e.equipment}
                  </dd>
                </div>
              </dl>
              <div className="transport">
                <strong>Rencana pengangkutan</strong>
                <p>
                  {e.transporter || "Pengangkut belum dikonfirmasi"} ·{" "}
                  {dateTime(e.pickup_at)}
                </p>
                <p>Tujuan: {e.destination || "Belum ditetapkan"}</p>
                <span
                  className={
                    "badge " + (e.transport_confirmed ? "good" : "warn")
                  }
                >
                  {e.transport_confirmed
                    ? "✓ Rencana dikonfirmasi"
                    : "! Belum dikonfirmasi"}
                </span>
              </div>
              {e.status === "published" &&
                new Date(e.starts_at) > now &&
                (w ? (
                  <>
                    <ActionForm
                      op={joined ? "event.leave" : "event.join"}
                      fixed={{ id: e.id }}
                      label={
                        joined ? "Batalkan keikutsertaan" : "Daftar kegiatan"
                      }
                      tone={joined ? "secondary" : "teal"}
                      onDone={refresh}
                    />
                    {joined && (
                      <p className="notice good">
                        Anda terdaftar. Tugas:{" "}
                        {members.find((r) => r.user_id === w.profile.id)?.duty}
                      </p>
                    )}
                  </>
                ) : (
                  <button
                    className="button teal"
                    onClick={login}
                    disabled={preview}
                    aria-describedby={
                      preview ? "event-preview-" + e.id : undefined
                    }
                  >
                    Masuk untuk mendaftar
                  </button>
                ))}
              {preview && (
                <p className="small-muted" id={"event-preview-" + e.id}>
                  Pendaftaran tidak tersedia di pratinjau statis.
                </p>
              )}
              {coordinator && w && e.status === "draft" && (
                <>
                  <details>
                    <summary>Lengkapi konfirmasi pengangkutan</summary>
                    <ActionForm
                      op="event.transport"
                      fixed={{ id: e.id, version: e.version }}
                      fields={[
                        {
                          ...required("transporter", "Pengangkut"),
                          initial: e.transporter,
                        },
                        {
                          ...required(
                            "pickup_at",
                            "Waktu pengambilan",
                            "datetime-local",
                          ),
                          initial: e.pickup_at
                            ? localDateTime(new Date(e.pickup_at))
                            : undefined,
                        },
                        {
                          ...required("destination", "Tujuan"),
                          initial: e.destination,
                        },
                        {
                          name: "transport_confirmed",
                          label: "Ketiga hal sudah dikonfirmasi",
                          type: "checkbox",
                          initial: String(e.transport_confirmed),
                        },
                      ]}
                      label="Simpan rencana"
                      onDone={refresh}
                    />
                  </details>
                  <ActionForm
                    op="event.publish"
                    fixed={{ id: e.id, version: e.version }}
                    label="Terbitkan kegiatan"
                    onDone={refresh}
                  />
                </>
              )}
              {coordinator && w && e.status === "published" && (
                <>
                  <details>
                    <summary>Peserta dan pembagian tugas</summary>
                    {!members.length ? (
                      <p>Belum ada peserta.</p>
                    ) : (
                      members.map((m) => (
                        <div className="inset" key={m.user_id}>
                          <p>
                            {w.profiles.find((p) => p.id === m.user_id)
                              ?.display_name ||
                              "Peserta #" + shortId(m.user_id)}{" "}
                            · {m.duty}
                          </p>
                          <ActionForm
                            op="event.duty"
                            fixed={{
                              id: e.id,
                              version: e.version,
                              user_id: m.user_id,
                            }}
                            fields={[
                              {
                                ...required("duty", "Tugas peserta"),
                                initial: m.duty,
                              },
                            ]}
                            label="Tetapkan tugas"
                            onDone={refresh}
                          />
                        </div>
                      ))
                    )}
                  </details>
                  <details>
                    <summary>Catat hasil kegiatan</summary>
                    <p>
                      Penyelesaian kegiatan tidak menutup insiden. Koordinator
                      tetap memeriksa bukti penanganan insiden.
                    </p>
                    <ActionForm
                      op="event.complete"
                      fixed={{ id: e.id, version: e.version }}
                      fields={[
                        {
                          ...required(
                            "performed_at",
                            "Waktu pelaksanaan",
                            "datetime-local",
                          ),
                          initial: localDateTime(now),
                        },
                        required(
                          "completion_note",
                          "Tindakan dan hasil",
                          "textarea",
                        ),
                        {
                          ...required(
                            "transport_status",
                            "Status pengangkutan",
                            "select",
                          ),
                          options: [
                            {
                              value: "Sudah diangkut",
                              label: "Sudah diangkut",
                            },
                            {
                              value: "Tertunda — perlu tindak lanjut",
                              label: "Tertunda — perlu tindak lanjut",
                            },
                          ],
                        },
                      ]}
                      photos
                      label="Simpan hasil kegiatan"
                      onDone={refresh}
                    />
                  </details>
                </>
              )}
              {e.status === "completed" && (
                <>
                  <p className="notice info">
                    Pengangkutan: {e.transport_status}
                  </p>
                  <p>{e.completion_note}</p>
                </>
              )}
              {coordinator && w && (
                <PhotoStrip
                  photos={w.photos.filter((p) => p.event_id === e.id)}
                />
              )}
            </article>
          );
        })
      )}
    </>
  );
}
