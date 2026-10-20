"use client";
import { useState } from "react";
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
  const [guestReg, setGuestReg] = useState<{ [eventId: string]: { name: string; phone: string } }>({});
  const [activeModalEvent, setActiveModalEvent] = useState<CleanupEvent | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestError, setGuestError] = useState("");

  const visible = coordinator && w ? w.events : events;
  return (
    <>
      <SectionTitle
        level={1}
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
          const isPast = new Date(e.starts_at) <= now;
          const isGuestRegistered = !!guestReg[e.id];
          const displayCount = (count || 0) + (isGuestRegistered ? 1 : 0);
          const isFull = displayCount >= e.capacity;

          return (
            <article className="card event-card" key={e.id}>
              <div className="card-heading">
                <h3>{e.title}</h3>
                {isPast ? (
                  <span className="badge muted">Pendaftaran Ditutup (Selesai)</span>
                ) : isFull ? (
                  <span className="badge warn">Kuota Penuh</span>
                ) : (
                  <Status value={e.status} />
                )}
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
                    {displayCount} / {e.capacity}
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

              {/* Status Pendaftaran & Tombol Aksi */}
              {isPast ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                  Jadwal kegiatan telah berlalu. Pendaftaran relawan ditutup otomatis.
                </div>
              ) : isGuestRegistered ? (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-800 space-y-1">
                  <strong>✓ Pendaftaran Relawan Berhasil!</strong>
                  <p>
                    Terima kasih, <strong>{guestReg[e.id].name}</strong> ({guestReg[e.id].phone}). Koordinator ({e.pic}) akan menghubungi Anda via WhatsApp menjelang kegiatan.
                  </p>
                </div>
              ) : e.status === "published" ? (
                w ? (
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
                        {members.find((r) => r.user_id === w.profile.id)?.duty || "Relawan Pelaksana"}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      className="button teal"
                      onClick={() => {
                        setActiveModalEvent(e);
                        setGuestError("");
                      }}
                      disabled={isFull}
                    >
                      {isFull ? "Kuota Penuh" : "Daftar Relawan Sekarang"}
                    </button>
                    <button
                      className="button secondary"
                      onClick={login}
                      disabled={preview}
                    >
                      Masuk dengan Akun
                    </button>
                  </div>
                )
              ) : null}

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

      {/* Modal Pendaftaran Relawan Tamu / Non-Login */}
      {activeModalEvent && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="guest-modal-title"
        >
          <div className="card modal-dialog max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <h3 id="guest-modal-title" className="text-base font-bold text-slate-800">
                  Daftar Relawan Kegiatan
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeModalEvent.title}
                </p>
              </div>
              <button
                className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1"
                onClick={() => setActiveModalEvent(null)}
                aria-label="Tutup form"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg space-y-1">
              <div><strong>Waktu:</strong> {dateTime(activeModalEvent.starts_at)}</div>
              <div><strong>Lokasi:</strong> {activeModalEvent.location}</div>
              <div><strong>Alat & Tugas:</strong> {activeModalEvent.duties}</div>
            </div>

            <form
              onSubmit={(ev) => {
                ev.preventDefault();
                if (!guestName.trim()) {
                  setGuestError("Mohon masukkan nama lengkap Anda.");
                  return;
                }
                if (!guestPhone.trim() || guestPhone.length < 8) {
                  setGuestError("Mohon masukkan nomor WhatsApp yang valid.");
                  return;
                }
                setGuestReg((prev) => ({
                  ...prev,
                  [activeModalEvent.id]: {
                    name: guestName.trim(),
                    phone: guestPhone.trim(),
                  },
                }));
                setActiveModalEvent(null);
                setGuestName("");
                setGuestPhone("");
                setGuestError("");
              }}
              className="space-y-3"
            >
              {guestError && (
                <div className="p-2.5 rounded bg-rose-50 text-rose-700 text-xs font-medium">
                  {guestError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="Contoh: Budi Prasetyo"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor WhatsApp / HP Aktif <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  className="input w-full"
                  placeholder="Contoh: 081234567890"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Koordinator akan membagikan titik kumpul via WA.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setActiveModalEvent(null)}
                >
                  Batal
                </button>
                <button type="submit" className="button teal">
                  Konfirmasi Keikutsertaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
