"use client";
import { useState } from "react";
import { AdminList, AdminDataTable } from "./admin-data-table";
import { ActionForm, reasonField, localDateTime, type Field } from "./forms";
import {
  Empty,
  PhotoStrip,
  Status,
  Timeline,
  SectionTitle,
} from "./primitives";
import {
  dateTime,
  shortId,
  incidentReference,
  type Workspace,
  type Region,
} from "@/lib/types";
import { recurrence, jakartaDate } from "@/lib/rules";
import { EvidenceDetails } from "./evidence-details";
const required = (
  name: string,
  label: string,
  type: Field["type"] = "text",
): Field => ({ name, label, type, required: true });
const optional = (
  name: string,
  label: string,
  options: Field["options"],
): Field => ({ name, label, type: "select", options });
export function Coordinator({
  w,
  region,
  refresh,
  now,
}: {
  w: Workspace;
  region: Region;
  refresh: () => void;
  now: Date;
}) {
  const workers = w.memberships
    .filter((m) => m.region_id === region.id && m.active && m.role === "worker")
    .map((m) => ({
      value: m.user_id,
      label:
        w.profiles.find((p) => p.id === m.user_id)?.display_name ||
        shortId(m.user_id),
    }));
  const open = w.incidents
    .filter((i) => i.status !== "closed")
    .map((i) => ({
      value: i.id,
      label:
        incidentReference(
          i.id,
          w.incidents.map((x) => x.id),
        ) +
        " · " +
        i.public_label,
    }));
  const points = w.points.map((p) => ({ value: p.id, label: p.label }));
  const pending = w.reports.filter((r) => r.status === "pending");
  return (
    <>
      <SectionTitle
        level={1}
        eyebrow="RUANG KOORDINASI"
        title="Yang perlu ditindaklanjuti"
        description="Periksa laporan, tentukan penanggung jawab, dan pastikan pekerjaan selesai."
      />
      <div className="metrics">
        <div>
          <strong>{pending.length}</strong>
          <span>Menunggu validasi</span>
        </div>
        <div>
          <strong>
            {w.tasks.filter((t) => t.status === "offered").length}
          </strong>
          <span>Tugas belum diterima</span>
        </div>
        <div>
          <strong>
            {w.incidents.filter((i) => i.status === "awaiting_review").length}
          </strong>
          <span>Bukti perlu diperiksa</span>
        </div>
      </div>
      <h3>Antrean laporan</h3>
      {pending.length === 0 ? (
        <Empty>Antrean validasi kosong.</Empty>
      ) : (
        <AdminList
          admin={w.profile.is_admin}
          title="Antrean laporan"
          columns={["Lokasi", "Referensi", "Kategori", "Status", "Diamati"]}
          rows={pending.map((r) => ({
            id: r.id,
            cells: [
              r.landmark,
              shortId(r.id),
              r.category,
              r.status,
              r.observed_at,
            ],
          }))}
          filterColumns={[2, 3]}
        >
          {pending.map((r) => (
            <article className="card" key={r.id}>
              <div className="card-heading">
                <h3>{r.landmark}</h3>
                <Status value={r.status} />
              </div>
              <p>{r.description}</p>
              <small>
                #{shortId(r.id)} · Diamati {dateTime(r.observed_at)} ·{" "}
                {r.category}
              </small>
              <EvidenceDetails report={r} />
              <PhotoStrip
                photos={w.photos.filter((p) => p.report_id === r.id)}
              />
              {r.hidden && (
                <p className="notice warn">
                  Konten disembunyikan oleh moderator; tetap tersedia untuk
                  pemeriksaan operasional.
                </p>
              )}
              <details>
                <summary>Validasi atau tautkan duplikat</summary>
                <p>
                  Gunakan insiden terbuka untuk kejadian yang sama. Titik lama
                  hanya untuk kejadian baru sesudah penanganan sebelumnya.
                  Patokan publik harus aman dibagikan.
                </p>
                <ActionForm
                  op="report.validate"
                  fixed={{ id: r.id, version: r.version }}
                  fields={[
                    optional(
                      "incident_id",
                      "Tautkan ke insiden terbuka (duplikat)",
                      open,
                    ),
                    optional(
                      "point_id",
                      "Titik yang sudah ada (kejadian baru)",
                      points,
                    ),
                    {
                      name: "public_label",
                      label: "Patokan aman untuk publik",
                      hint: "Wajib untuk insiden baru. Jangan cantumkan identitas, nomor rumah privat, atau kontak.",
                    },
                  ]}
                  label="Validasi laporan"
                  onDone={refresh}
                />
              </details>
              <details>
                <summary>Tolak dengan alasan</summary>
                <ActionForm
                  op="report.reject"
                  fixed={{ id: r.id, version: r.version }}
                  fields={[reasonField]}
                  label="Tolak laporan"
                  tone="danger"
                  onDone={refresh}
                />
              </details>
            </article>
          ))}
        </AdminList>
      )}
      <h3>Insiden wilayah</h3>
      {w.incidents.length === 0 ? (
        <Empty>Belum ada insiden tervalidasi.</Empty>
      ) : (
        <AdminList
          admin={w.profile.is_admin}
          title="Insiden wilayah"
          columns={["Lokasi", "Referensi", "Status", "Validasi"]}
          rows={w.incidents.map((i) => ({
            id: i.id,
            cells: [
              i.public_label,
              incidentReference(
                i.id,
                w.incidents.map((x) => x.id),
              ),
              i.status,
              i.verified_at,
            ],
          }))}
          filterColumns={[2]}
        >
          {w.incidents.map((i) => (
            <article className="card" key={i.id} id={"incident-" + i.id}>
              <div className="card-heading">
                <h3>{i.public_label}</h3>
                <Status value={i.status} />
              </div>
              <small>
                #
                {incidentReference(
                  i.id,
                  w.incidents.map((x) => x.id),
                )}{" "}
                · {w.reports.filter((r) => r.incident_id === i.id).length}{" "}
                laporan pendukung · Validasi {dateTime(i.verified_at)}
              </small>
              {w.tasks
                .filter((t) => t.incident_id === i.id)
                .map((t) => (
                  <div className="inset" key={t.id}>
                    <strong>
                      {w.profiles.find((p) => p.id === t.worker_id)
                        ?.display_name || "Petugas wilayah"}{" "}
                      ·{" "}
                      {t.status === "verified"
                        ? "Pekerjaan diperiksa"
                        : undefined}
                    </strong>
                    <Status value={t.status} />
                    <p>
                      Perkiraan tindak lanjut {dateTime(t.due_at)}. Bukan
                      jaminan waktu layanan.
                    </p>
                    {t.reason && <p>Alasan: {t.reason}</p>}
                    {t.blocker && (
                      <p className="notice warn">Kendala: {t.blocker}</p>
                    )}
                    {t.action_taken && (
                      <p>
                        Tindakan: {t.action_taken} · {dateTime(t.performed_at)}
                      </p>
                    )}
                    {t.destination && (
                      <p>Tujuan pengangkutan: {t.destination}</p>
                    )}
                    <PhotoStrip
                      photos={w.photos.filter((p) => p.task_id === t.id)}
                    />
                  </div>
                ))}
              {["verified", "assigned", "working"].includes(i.status) && (
                <details>
                  <summary>
                    {i.status === "verified"
                      ? "Tugaskan petugas"
                      : "Alihkan penugasan"}
                  </summary>
                  {!workers.length ? (
                    <p className="notice warn">
                      Belum ada petugas aktif. Koordinator wilayah bertanggung
                      jawab menindaklanjuti kapasitas; administrator dapat
                      menetapkan petugas.
                    </p>
                  ) : (
                    <ActionForm
                      op="incident.assign"
                      fixed={{ id: i.id, version: i.version }}
                      fields={[
                        {
                          name: "worker_id",
                          label: "Petugas aktif",
                          type: "select",
                          options: workers,
                          required: true,
                        },
                        {
                          ...required(
                            "due_at",
                            "Perkiraan waktu tindak lanjut",
                            "datetime-local",
                          ),
                          initial: localDateTime(
                            new Date(now.getTime() + 86400000),
                          ),
                        },
                        reasonField,
                      ]}
                      label="Tugaskan petugas"
                      onDone={refresh}
                    />
                  )}
                </details>
              )}
              {i.status === "awaiting_review" && (
                <details open>
                  <summary>Periksa bukti penanganan</summary>
                  <ActionForm
                    op="incident.review"
                    fixed={{ id: i.id, version: i.version }}
                    fields={[
                      reasonField,
                      {
                        name: "approved",
                        label:
                          "Bukti cukup: tutup sebagai Selesai terverifikasi",
                        type: "checkbox",
                        hint: "Jika tidak dicentang, kembalikan untuk perbaikan dengan alasan.",
                      },
                    ]}
                    label="Simpan hasil pemeriksaan"
                    onDone={refresh}
                  />
                </details>
              )}
              {i.status === "closed" && (
                <details>
                  <summary>Buka kembali kejadian lama</summary>
                  <p>
                    Hanya jika pemeriksaan membuktikan pekerjaan lama belum
                    selesai. Ini tidak menambah kejadian baru.
                  </p>
                  <ActionForm
                    op="incident.reopen"
                    fixed={{ id: i.id, version: i.version }}
                    fields={[reasonField]}
                    label="Buka kembali pekerjaan"
                    onDone={refresh}
                  />
                </details>
              )}
              <details>
                <summary>Riwayat penanganan</summary>
                <Timeline
                  history={w.history.filter(
                    (h) => h.entity_type === "incident" && h.entity_id === i.id,
                  )}
                />
              </details>
            </article>
          ))}
        </AdminList>
      )}
      {w.profile.is_admin && (
        <AdminDataTable
          title="Penugasan wilayah"
          columns={["Lokasi", "Petugas", "Status", "Tindak lanjut", "Kendala"]}
          filterColumns={[1, 2]}
          rows={w.tasks.map((t) => ({
            id: t.id,
            cells: [
              w.incidents.find((i) => i.id === t.incident_id)?.public_label,
              w.profiles.find((p) => p.id === t.worker_id)?.display_name ||
                shortId(t.worker_id),
              t.status,
              t.due_at,
              t.blocker || "—",
            ],
            detail: (
              <>
                <p>{t.action_taken}</p>
                <p>{t.reason}</p>
                <p>{t.destination}</p>
                <PhotoStrip
                  photos={w.photos.filter((p) => p.task_id === t.id)}
                />
              </>
            ),
          }))}
        />
      )}
      <h3>Tanggapan pelapor</h3>
      {w.feedback.filter((f) => !f.reviewed_at).length === 0 ? (
        <Empty>Belum ada tanggapan yang perlu ditinjau.</Empty>
      ) : (
        <AdminList
          admin={w.profile.is_admin}
          title="Tanggapan pelapor"
          columns={["Referensi", "Tanggapan"]}
          rows={w.feedback
            .filter((f) => !f.reviewed_at)
            .map((f) => ({ id: f.id, cells: [shortId(f.report_id), f.note] }))}
          filterColumns={[]}
        >
          {w.feedback
            .filter((f) => !f.reviewed_at)
            .map((f) => (
              <article className="card" key={f.id}>
                <p>
                  #{shortId(f.report_id)}: {f.note}
                </p>
                <ActionForm
                  op="feedback.review"
                  fixed={{ id: f.id }}
                  fields={[reasonField]}
                  label="Catat peninjauan"
                  onDone={refresh}
                />
              </article>
            ))}
        </AdminList>
      )}
    </>
  );
}
export function Worker({
  w,
  refresh,
  now,
}: {
  w: Workspace;
  refresh: () => void;
  now: Date;
}) {
  const tasks = w.tasks
    .filter((t) => t.worker_id === w.profile.id)
    .sort((a, b) => {
      const active = (status: string) =>
        ["offered", "accepted", "submitted"].includes(status) ? 0 : 1;
      return (
        active(a.status) - active(b.status) || a.due_at.localeCompare(b.due_at)
      );
    });
  return (
    <>
      <SectionTitle
        level={1}
        eyebrow="RUANG PETUGAS"
        title="Pekerjaan saya"
        description="Terima penugasan sebelum mulai. Catat kendala dan bukti sesudah penanganan."
      />
      {!tasks.length ? (
        <Empty>Belum ada tugas untuk Anda di wilayah ini.</Empty>
      ) : (
        tasks.map((t) => (
          <article className="card" key={t.id}>
            <div className="card-heading">
              <h3>
                {w.incidents.find((i) => i.id === t.incident_id)
                  ?.public_label || "Pekerjaan wilayah"}
              </h3>
              <Status value={t.status} />
            </div>
            <p>Perkiraan tindak lanjut: {dateTime(t.due_at)}</p>
            {t.status === "offered" && (
              <>
                <ActionForm
                  op="task.accept"
                  fixed={{ id: t.id, version: t.version }}
                  label="Terima dan mulai tugas"
                  onDone={refresh}
                />
                <details>
                  <summary>Tolak penugasan</summary>
                  <ActionForm
                    op="task.reject"
                    fixed={{ id: t.id, version: t.version }}
                    fields={[reasonField]}
                    label="Tolak dengan alasan"
                    tone="danger"
                    onDone={refresh}
                  />
                </details>
              </>
            )}
            {t.blocker && <p className="notice warn">Kendala: {t.blocker}</p>}
            {t.reason && <p>{t.reason}</p>}
            {t.status === "accepted" && (
              <>
                <details>
                  <summary>Catat kendala</summary>
                  <ActionForm
                    op="task.block"
                    fixed={{ id: t.id, version: t.version }}
                    fields={[reasonField]}
                    label="Simpan kendala"
                    onDone={refresh}
                  />
                </details>
                <details open>
                  <summary>Kirim bukti penanganan</summary>
                  <ActionForm
                    op="task.evidence"
                    fixed={{ id: t.id, version: t.version }}
                    fields={[
                      required(
                        "action_taken",
                        "Tindakan yang dilakukan",
                        "textarea",
                      ),
                      {
                        ...required(
                          "performed_at",
                          "Waktu pekerjaan",
                          "datetime-local",
                        ),
                        initial: localDateTime(now),
                      },
                      {
                        name: "moved",
                        label: "Sampah dipindahkan / diangkut",
                        type: "checkbox",
                      },
                      {
                        name: "destination",
                        label: "Tujuan pengangkutan",
                        hint: "Wajib jika sampah dipindahkan. Dipindahkan tidak berarti didaur ulang.",
                      },
                    ]}
                    photos
                    label="Kirim untuk pemeriksaan"
                    onDone={refresh}
                  />
                </details>
              </>
            )}
            <PhotoStrip photos={w.photos.filter((p) => p.task_id === t.id)} />
            <details>
              <summary>Riwayat pekerjaan</summary>
              <Timeline
                history={w.history.filter((h) => h.entity_id === t.incident_id)}
              />
            </details>
          </article>
        ))
      )}
    </>
  );
}
export function MyReports({
  w,
  refresh,
}: {
  w: Workspace;
  refresh: () => void;
}) {
  const reports = w.reports.filter((r) => r.reporter_id === w.profile.id);
  return (
    <>
      <SectionTitle
        level={1}
        title="Laporan saya"
        description="Laporan menunggu validasi hanya dapat dibaca oleh Anda dan koordinator."
      />
      {!reports.length ? (
        <Empty>Anda belum mengirim laporan di wilayah ini.</Empty>
      ) : (
        <AdminList
          admin={w.profile.is_admin}
          title="Laporan saya"
          columns={["Lokasi", "Referensi", "Status", "Dikirim"]}
          rows={reports.map((r) => ({
            id: r.id,
            cells: [r.landmark, shortId(r.id), r.status, r.created_at],
          }))}
          filterColumns={[2]}
        >
          {reports.map((r) => {
            const i = w.incidents.find((i) => i.id === r.incident_id);
            return (
              <article className="card" key={r.id}>
                <div className="card-heading">
                  <h3>{r.landmark}</h3>
                  <Status value={i?.status || r.status} />
                </div>
                <p>{r.description}</p>
                <EvidenceDetails report={r} />
                <small>
                  #{shortId(r.id)} · Dikirim {dateTime(r.created_at)} · Diamati{" "}
                  {dateTime(r.observed_at)}
                </small>
                {r.reason && (
                  <p className="notice bad">Alasan penolakan: {r.reason}</p>
                )}
                <PhotoStrip
                  photos={w.photos.filter(
                    (p) =>
                      p.report_id === r.id ||
                      (!!i &&
                        (p.incident_id === i.id ||
                          w.tasks.some(
                            (t) => t.id === p.task_id && t.incident_id === i.id,
                          ))),
                  )}
                />
                <Timeline
                  history={w.history.filter(
                    (h) =>
                      h.entity_id === r.id || h.entity_id === r.incident_id,
                  )}
                />
                {r.status === "validated" && (
                  <details>
                    <summary>Beri tanggapan penanganan</summary>
                    <p>
                      Tanggapan masuk ke antrean koordinator dan tidak mengubah
                      status pekerjaan secara otomatis.
                    </p>
                    <ActionForm
                      op="report.feedback"
                      fixed={{ id: r.id }}
                      fields={[reasonField]}
                      label="Kirim tanggapan"
                      onDone={refresh}
                    />
                    {w.feedback
                      .filter((f) => f.report_id === r.id)
                      .map((f) => (
                        <p key={f.id}>
                          {f.note} ·{" "}
                          {f.reviewed_at
                            ? "Ditinjau: " + f.review_note
                            : "Menunggu peninjauan"}
                        </p>
                      ))}
                  </details>
                )}
              </article>
            );
          })}
        </AdminList>
      )}
    </>
  );
}
export function PreventionPanel({
  w,
  region,
  refresh,
  now,
}: {
  w: Workspace;
  region: Region;
  refresh: () => void;
  now: Date;
}) {
  const counts = recurrence(w.incidents, now, region.recurrence_days);
  const recurrent = w.points.filter(
    (p) => (counts.get(p.id)?.length ?? 0) >= region.recurrence_count,
  );
  return (
    <>
      <SectionTitle
        level={1}
        title="Titik berulang & pencegahan"
        description={`Ambang tinjauan: ${region.recurrence_count} kejadian berbeda dalam ${region.recurrence_days} hari. Laporan pendukung dan pembukaan kembali tidak menambah kejadian.`}
      />
      {!recurrent.length ? (
        <Empty>Belum ada titik yang mencapai ambang tinjauan.</Empty>
      ) : (
        <AdminList
          admin={w.profile.is_admin}
          title="Titik berulang"
          columns={["Titik", "Kejadian", "Periode hari"]}
          rows={recurrent.map((p) => ({
            id: p.id,
            cells: [
              p.label,
              counts.get(p.id)?.length ?? 0,
              region.recurrence_days,
            ],
          }))}
          filterColumns={[]}
        >
          {recurrent.map((p) => (
            <article key={p.id} className="card">
              <h3>{p.label}</h3>
              <p>
                {counts.get(p.id)?.length} kejadian tervalidasi dalam{" "}
                {region.recurrence_days} hari terakhir.
              </p>
              <ul>
                {counts.get(p.id)?.map((i) => (
                  <li key={i.id}>
                    #
                    {incidentReference(
                      i.id,
                      w.incidents.map((x) => x.id),
                    )}{" "}
                    · {dateTime(i.verified_at)} · <Status value={i.status} />
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </AdminList>
      )}
      <details>
        <summary>Catat tindakan pencegahan</summary>
        <ActionForm
          op="prevention.create"
          fields={[
            {
              ...required("point_id", "Titik", "select"),
              options: w.points.map((p) => ({ value: p.id, label: p.label })),
            },
            required(
              "hypothesis",
              "Dugaan penyebab (perlu konfirmasi)",
              "textarea",
            ),
            required("basis", "Dasar pengamatan", "textarea"),
            required("action", "Tindakan pencegahan", "textarea"),
            required("pic", "Penanggung jawab"),
            {
              ...required("evaluate_on", "Tanggal evaluasi", "date"),
              initial: jakartaDate(new Date(now.getTime() + 7 * 86400000)),
            },
          ]}
          label="Simpan pencegahan"
          onDone={refresh}
        />
      </details>
      <AdminList
        admin={w.profile.is_admin}
        title="Tindakan pencegahan"
        columns={["Titik", "Tindakan", "PIC", "Evaluasi", "Status"]}
        rows={w.preventions.map((p) => ({
          id: p.id,
          cells: [
            w.points.find((x) => x.id === p.point_id)?.label,
            p.action,
            p.pic,
            p.evaluate_on,
            p.result ? "Dievaluasi" : "Belum dievaluasi",
          ],
        }))}
        filterColumns={[2, 4]}
      >
        {w.preventions.map((p) => (
          <article className="card" key={p.id}>
            <h3>{w.points.find((x) => x.id === p.point_id)?.label}</h3>
            <span className="badge warn">
              Dugaan penyebab: perlu konfirmasi
            </span>
            <p>{p.hypothesis}</p>
            <p>Dasar: {p.basis}</p>
            <p>Tindakan: {p.action}</p>
            <small>
              PIC: {p.pic} · Evaluasi {p.evaluate_on}
            </small>
            {p.result ? (
              <p className="notice good">Hasil evaluasi: {p.result}</p>
            ) : (
              <ActionForm
                op="prevention.evaluate"
                fixed={{ id: p.id, version: p.version }}
                fields={[
                  required("result", "Hasil pengamatan evaluasi", "textarea"),
                ]}
                label="Catat evaluasi"
                onDone={refresh}
              />
            )}
          </article>
        ))}
      </AdminList>
    </>
  );
}
export function ScheduleManager({
  w,
  region,
  refresh,
  now,
}: {
  w: Workspace;
  region: Region;
  refresh: () => void;
  now: Date;
}) {
  const isCoord =
    w.profile.is_admin ||
    w.memberships.some(
      (m) =>
        m.user_id === w.profile.id &&
        m.region_id === region.id &&
        m.role === "coordinator" &&
        m.active,
    );
  return (
    <>
      {isCoord && (
        <details>
          <summary>Tambah aturan jadwal</summary>
          <ActionForm
            op="schedule.save"
            fixed={{ region_id: region.id }}
            fields={[
              required("service", "Jenis layanan"),
              required("zone", "Titik atau zona"),
              {
                ...required(
                  "weekdays",
                  "Hari berulang (angka dipisahkan koma)",
                ),
                hint: "0 Minggu, 1 Senin, 2 Selasa, 3 Rabu, 4 Kamis, 5 Jumat, 6 Sabtu.",
              },
              required("start_time", "Mulai", "time"),
              required("end_time", "Sampai", "time"),
              {
                ...required("valid_from", "Berlaku mulai", "date"),
                initial: jakartaDate(now),
              },
              required("valid_until", "Berlaku sampai", "date"),
              required("source", "Sumber konfirmasi"),
              {
                name: "confirmed",
                label: "Sudah dikonfirmasi oleh pengelola",
                type: "checkbox",
              },
              optional(
                "worker_id",
                "Petugas jadwal",
                w.memberships
                  .filter(
                    (m) =>
                      m.region_id === region.id &&
                      m.role === "worker" &&
                      m.active,
                  )
                  .map((m) => ({
                    value: m.user_id,
                    label:
                      w.profiles.find((p) => p.id === m.user_id)
                        ?.display_name || shortId(m.user_id),
                  })),
              ),
            ]}
            label="Simpan aturan"
            onDone={refresh}
          />
        </details>
      )}
      <AdminList
        admin={w.profile.is_admin}
        title="Aturan jadwal"
        columns={[
          "Layanan",
          "Zona",
          "Mulai",
          "Sampai",
          "Berlaku mulai",
          "Berlaku sampai",
          "Konfirmasi",
        ]}
        rows={w.schedules.map((s) => ({
          id: s.id,
          cells: [
            s.service,
            s.zone,
            s.start_time,
            s.end_time,
            s.valid_from,
            s.valid_until,
            s.confirmed_at ? "Dikonfirmasi" : "Belum dikonfirmasi",
          ],
        }))}
        filterColumns={[1, 6]}
      >
        {w.schedules.map((s) => (
          <article className="card" key={s.id}>
            <h3>
              {s.service} · {s.zone}
            </h3>
            <p>
              {s.valid_from} — {s.valid_until}
            </p>
            {isCoord && (
              <details>
                <summary>Konfirmasi / ganti aturan mulai tanggal baru</summary>
                <p>
                  Aturan lama dan pelaksanaan historis tetap disimpan. Untuk
                  perubahan satu hari, gunakan bagian perubahan tanggal.
                </p>
                <ActionForm
                  op="schedule.save"
                  fixed={{
                    id: s.id,
                    version: s.version,
                    region_id: region.id,
                    service: s.service,
                    zone: s.zone,
                    ...(s.worker_id ? { worker_id: s.worker_id } : {}),
                  }}
                  fields={[
                    {
                      ...required(
                        "weekdays",
                        "Hari berulang (angka dipisahkan koma)",
                      ),
                      initial: s.weekdays.join(","),
                      hint: "0 Minggu, 1 Senin, 2 Selasa, 3 Rabu, 4 Kamis, 5 Jumat, 6 Sabtu.",
                    },
                    {
                      ...required("start_time", "Mulai", "time"),
                      initial: s.start_time.slice(0, 5),
                    },
                    {
                      ...required("end_time", "Sampai", "time"),
                      initial: s.end_time.slice(0, 5),
                    },
                    {
                      ...required(
                        "valid_from",
                        "Aturan baru berlaku mulai",
                        "date",
                      ),
                      initial: jakartaDate(new Date(now.getTime() + 86400000)),
                    },
                    {
                      ...required("valid_until", "Berlaku sampai", "date"),
                      initial: s.valid_until,
                    },
                    {
                      ...required("source", "Sumber konfirmasi"),
                      initial: s.source,
                    },
                    {
                      name: "confirmed",
                      label: "Sumber dan jam layanan sudah dikonfirmasi",
                      type: "checkbox",
                      initial: "true",
                    },
                  ]}
                  label="Simpan aturan pengganti"
                  onDone={refresh}
                />
              </details>
            )}
            {isCoord && (
              <details>
                <summary>Perubahan satu tanggal</summary>
                <ActionForm
                  op="schedule.exception"
                  fixed={{ id: s.id }}
                  fields={[
                    required("date", "Tanggal layanan", "date"),
                    {
                      name: "cancelled",
                      label: "Dibatalkan / ditunda tanpa jam pengganti",
                      type: "checkbox",
                    },
                    {
                      name: "start_time",
                      label: "Jam pengganti mulai",
                      type: "time",
                    },
                    { name: "end_time", label: "Sampai", type: "time" },
                    reasonField,
                  ]}
                  label="Catat perubahan"
                  onDone={refresh}
                />
              </details>
            )}
            {(isCoord || s.worker_id === w.profile.id) && (
              <details>
                <summary>Catat pelaksanaan aktual</summary>
                <ActionForm
                  op="schedule.run"
                  fixed={{ id: s.id }}
                  fields={[
                    required("date", "Tanggal layanan", "date"),
                    {
                      ...required(
                        "actual_at",
                        "Waktu aktual",
                        "datetime-local",
                      ),
                      initial: localDateTime(now),
                    },
                    reasonField,
                  ]}
                  label="Simpan pelaksanaan"
                  onDone={refresh}
                />
              </details>
            )}
            {w.exceptions
              .filter((e) => e.schedule_id === s.id)
              .map((e) => (
                <p key={e.id}>
                  <small>
                    Riwayat perubahan {e.date}: {e.reason} (
                    {e.cancelled
                      ? "Dibatalkan"
                      : e.start_time + "–" + e.end_time}
                    )
                  </small>
                </p>
              ))}
          </article>
        ))}
      </AdminList>
    </>
  );
}
export function Admin({ w, refresh }: { w: Workspace; refresh: () => void }) {
  const [editingRegion, setEditingRegion] = useState<string | null>(null);

  const moderationItems = [
    ...w.reports.map((r) => ({
      id: r.id,
      label: r.landmark,
      hidden: r.hidden,
      type: "report" as const,
    })),
    ...w.incidents.map((i) => ({
      id: i.id,
      label: i.public_label,
      hidden: i.hidden,
      type: "incident" as const,
    })),
  ];

  return (
    <>
      <SectionTitle
        level={1}
        title="Administrasi Wilayah & Pengguna"
        description="Pengelolaan master wilayah layanan, penunjukan hak akses koordinator & petugas, serta moderasi data publik dalam format tabel terstruktur."
      />

      {/* 1. MASTER WILAYAH LAYANAN */}
      <section className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-base font-bold text-slate-800">
            Daftar Wilayah Layanan
          </h3>
          <details className="text-sm">
            <summary className="button secondary text-xs py-1.5 px-3">
              + Tambah Wilayah Baru
            </summary>
            <div className="card p-4 mt-2">
              <ActionForm
                op="admin.region"
                fields={[
                  required("name", "Nama wilayah"),
                  required("coverage", "Cakupan layanan"),
                  required("owner_label", "Pemilik operasional"),
                  required("lat", "Lintang pusat", "number"),
                  required("lng", "Bujur pusat", "number"),
                  {
                    name: "active",
                    label: "Aktifkan layanan",
                    type: "checkbox",
                  },
                  reasonField,
                ]}
                label="Simpan wilayah baru"
                onDone={refresh}
              />
            </div>
          </details>
        </div>

        <AdminDataTable
          title="Wilayah layanan"
          columns={[
            "Nama Wilayah",
            "Cakupan",
            "Pemilik / PIC",
            "Koordinat",
            "Ambang",
            "Status",
          ]}
          filterColumns={[5]}
          rows={w.regions.map((r) => ({
            id: r.id,
            cells: [
              r.name,
              r.coverage,
              r.owner_label,
              `${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}`,
              `${r.recurrence_count}x / ${r.recurrence_days}h`,
              r.active ? "Aktif" : "Non-Aktif",
            ],
            detail: (
              <div>
                <h4>Ubah Konfigurasi: {r.name}</h4>
                <ActionForm
                  op="admin.region"
                  fixed={{ id: r.id, version: r.version }}
                  fields={[
                    {
                      name: "active",
                      label: "Layanan aktif",
                      type: "checkbox",
                      initial: String(r.active),
                    },
                    {
                      ...required(
                        "recurrence_count",
                        "Ambang jumlah kejadian",
                        "number",
                      ),
                      initial: String(r.recurrence_count),
                      min: 2,
                      max: 20,
                    },
                    {
                      ...required("recurrence_days", "Periode hari", "number"),
                      initial: String(r.recurrence_days),
                      min: 1,
                      max: 365,
                    },
                    reasonField,
                  ]}
                  label="Perbarui wilayah"
                  onDone={refresh}
                />
              </div>
            ),
          }))}
        />

        {/* Modal/Drawer Edit Wilayah Terpilih */}
        {editingRegion && (
          <div className="card p-4 mt-3 border-teal-500/50 bg-teal-50/20">
            {(() => {
              const r = w.regions.find((x) => x.id === editingRegion);
              if (!r) return null;
              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-800">
                      Ubah Konfigurasi: {r.name}
                    </h4>
                    <button
                      className="text-xs text-slate-500 hover:text-slate-800"
                      onClick={() => setEditingRegion(null)}
                    >
                      ✕ Tutup
                    </button>
                  </div>
                  <ActionForm
                    op="admin.region"
                    fixed={{ id: r.id, version: r.version }}
                    fields={[
                      {
                        name: "active",
                        label: "Layanan aktif",
                        type: "checkbox",
                        initial: String(r.active),
                      },
                      {
                        ...required(
                          "recurrence_count",
                          "Ambang jumlah kejadian",
                          "number",
                        ),
                        initial: String(r.recurrence_count),
                        min: 2,
                        max: 20,
                      },
                      {
                        ...required(
                          "recurrence_days",
                          "Periode hari",
                          "number",
                        ),
                        initial: String(r.recurrence_days),
                        min: 1,
                        max: 365,
                      },
                      reasonField,
                    ]}
                    label="Perbarui wilayah"
                    onDone={() => {
                      setEditingRegion(null);
                      refresh();
                    }}
                  />
                </div>
              );
            })()}
          </div>
        )}
      </section>

      {/* 2. TABEL HAK AKSES DAN PENUGASAN (MEMBERSHIP) */}
      <section className="space-y-3 mt-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-base font-bold text-slate-800">
            Penunjukan Hak Akses Pengelola
          </h3>
          <details className="text-sm">
            <summary className="button secondary text-xs py-1.5 px-3">
              + Tetapkan Akses Akun
            </summary>
            <div className="card p-4 mt-2">
              <ActionForm
                op="admin.membership"
                fields={[
                  {
                    ...required("region_id", "Wilayah", "select"),
                    options: w.regions.map((r) => ({
                      value: r.id,
                      label: r.name,
                    })),
                  },
                  {
                    ...required("user_id", "Akun pengguna", "select"),
                    options: w.profiles.map((p) => ({
                      value: p.id,
                      label: p.display_name + " · " + shortId(p.id),
                    })),
                  },
                  {
                    ...required("role", "Peran", "select"),
                    options: [
                      { value: "coordinator", label: "Koordinator Wilayah" },
                      { value: "worker", label: "Petugas Lapangan" },
                    ],
                  },
                  {
                    name: "active",
                    label: "Akses aktif",
                    type: "checkbox",
                    initial: "true",
                  },
                  reasonField,
                ]}
                label="Simpan penunjukan peran"
                onDone={refresh}
              />
            </div>
          </details>
        </div>

        <AdminDataTable
          title="Hak akses pengelola"
          columns={["Nama Pengguna", "Wilayah", "Peran", "Status"]}
          filterColumns={[1, 2, 3]}
          rows={w.memberships.map((m) => {
            const prof = w.profiles.find((p) => p.id === m.user_id);
            const reg = w.regions.find((r) => r.id === m.region_id);
            return {
              id: `${m.user_id}-${m.region_id}`,
              cells: [
                prof?.display_name || "Akun (" + shortId(m.user_id) + ")",
                reg?.name || m.region_id,
                m.role === "coordinator" ? "Koordinator" : "Petugas",
                m.active ? "Aktif" : "Dicabut",
              ],
            };
          })}
        />
      </section>

      {/* 3. TABEL MODERASI KONTEN */}
      <section className="space-y-3 mt-6">
        <h3 className="text-base font-bold text-slate-800">
          Tabel Moderasi Konten Wilayah
        </h3>
        <p className="text-xs text-slate-500">
          Admin dapat menyembunyikan aduan fiktif atau foto tak pantas dari
          pandangan publik.
        </p>

        <AdminDataTable
          title="Moderasi konten"
          columns={["Tipe Entitas", "Label / Lokasi", "Status Moderasi"]}
          filterColumns={[0, 2]}
          rows={moderationItems.map((item) => ({
            id: item.id,
            cells: [
              item.type === "report" ? "Laporan Warga" : "Insiden Publik",
              item.label,
              item.hidden ? "Disembunyikan" : "Terlihat Publik",
            ],
            detail: (
              <div>
                <h4>Moderasi: {item.label}</h4>
                <p>
                  Status saat ini:{" "}
                  {item.hidden
                    ? "Disembunyikan dari publik"
                    : "Terlihat oleh publik"}
                </p>
                <ActionForm
                  op="admin.moderate"
                  fixed={{
                    id: item.id,
                    entity_type: item.type,
                    hidden: !item.hidden,
                  }}
                  fields={[reasonField]}
                  label={
                    item.hidden
                      ? "Konfirmasi Pulihkan"
                      : "Konfirmasi Sembunyikan"
                  }
                  onDone={refresh}
                />
              </div>
            ),
          }))}
        />
      </section>

      {/* 4. RIWAYAT AUDIT ADMINISTRATIF */}
      <section className="space-y-3 mt-6">
        <h3 className="text-base font-bold text-slate-800">
          Riwayat Audit Administratif
        </h3>
        <AdminDataTable
          title="Audit administratif"
          columns={["Tanggal", "Aksi", "Catatan", "Referensi"]}
          filterColumns={[1]}
          rows={w.history
            .filter((h) => h.entity_type === "admin")
            .map((h) => ({
              id: String(h.id),
              cells: [h.created_at, h.action, h.note, h.entity_id],
            }))}
        />
        <AdminDataTable
          title="Titik wilayah layanan"
          columns={["Nama Titik", "Wilayah", "Lintang", "Bujur"]}
          filterColumns={[1]}
          rows={w.points.map((p) => ({
            id: p.id,
            cells: [
              p.label,
              w.regions.find((r) => r.id === p.region_id)?.name || p.region_id,
              p.lat !== null ? p.lat.toFixed(4) : "—",
              p.lng !== null ? p.lng.toFixed(4) : "—",
            ],
          }))}
        />
      </section>
    </>
  );
}
