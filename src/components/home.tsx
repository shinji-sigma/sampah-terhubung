import { ArrowRight, ChevronDown, MapPin, Plus } from "lucide-react";
import type { PublicData, Region, Workspace } from "@/lib/types";
import { dateTime, incidentReference } from "@/lib/types";
import {
  Empty,
  PhotoStrip,
  SectionTitle,
  Status,
  Timeline,
} from "./primitives";
import { Schedules, ScheduleMetadata } from "./schedules";
import { IntroHero } from "./intro-hero";

export function HomeView({
  data,
  w,
  region,
  today,
  reportingAvailable,
  preview,
  loading = false,
  onRegion,
  onSchedule,
  onReport,
  onEvents,
  showIntro,
  animateIntro,
  onIntroSeen,
}: {
  data: PublicData;
  w: Workspace | null;
  region: Region | null;
  today: string;
  reportingAvailable: boolean;
  preview: boolean;
  loading?: boolean;
  onRegion: () => void;
  onSchedule: () => void;
  onReport: () => void;
  onEvents: () => void;
  onApiDocs?: () => void;
  onGuide?: () => void;
  showIntro: boolean;
  animateIntro: boolean;
  onIntroSeen: () => void;
}) {
  const incidentIds = data.incidents.map((i) => i.id);
  const RegionHeading = showIntro ? "h2" : "h1";

  if (loading) {
    return (
      <div className="home-loading" aria-busy="true">
        <p role="status" className="small-muted">Memuat data wilayah…</p>
        <div className="page-heading" aria-hidden="true">
          <div className="loading-heading">
            <div className="loading-placeholder loading-short" />
            <div className="loading-placeholder loading-title" />
          </div>
          <div className="loading-placeholder loading-button" />
        </div>
        <div className="service-grid" aria-hidden="true">
          {[0, 1, 2, 3].map((item) => (
            <div className="loading-panel" key={item}>
              <div className="loading-placeholder loading-title" />
              <div className="loading-placeholder loading-row" />
              <div className="loading-placeholder loading-row" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <>
      {showIntro && (
        <IntroHero
          animate={animateIntro}
          onSeen={onIntroSeen}
          signedIn={!!w}
          onSchedule={region ? onSchedule : onRegion}
        />
      )}
      <div className="page-heading">
        <div>
          <p className="region-eyebrow">Wilayah Saya</p>
          <RegionHeading className="selected-region">
            {region?.name || "Belum memilih wilayah"}
          </RegionHeading>
        </div>
        <button className="button secondary" onClick={onRegion}>
          <MapPin size={18} />
          Ganti wilayah
        </button>
      </div>
      <div className="service-grid">
        <section
          className="service-section nearest-schedule"
          aria-label="Jadwal terdekat"
        >
          <h2 className="visually-hidden">Pengangkutan terdekat</h2>
          <Schedules data={data} start={today} compact hideSources />
        </section>
        <aside className="report-prompt">
          <h2>Ada penumpukan sampah?</h2>
          <p>
            Sampaikan lokasi dan kondisi. Koordinator wilayah memeriksa laporan
            sebelum menugaskan petugas.
          </p>
          <button
            className="button primary"
            onClick={onReport}
            disabled={!reportingAvailable}
            aria-describedby="report-availability"
          >
            <Plus size={18} />
            {w ? "Buat laporan" : "Masuk untuk melapor"}
          </button>
          <p id="report-availability" className="small-muted">
            {preview
              ? "Pelaporan tidak tersedia di pratinjau statis."
              : !region?.active
                ? "Pelaporan belum aktif untuk wilayah ini."
                : !reportingAvailable
                  ? "Pelaporan tersedia setelah layanan terhubung."
                  : "Laporan dan foto bersifat privat sampai diperiksa."}
          </p>
        </aside>
        <aside className="source-note">
          <h2>Sumber jadwal</h2>
          <ScheduleMetadata services={data.schedules} compact />
        </aside>
        <section className="service-section handling-section">
          <SectionTitle
            title="Penanganan wilayah"
            description="Perkembangan insiden yang telah diperiksa koordinator."
          />
          {!data.incidents.length ? (
            <Empty>Belum ada penanganan tervalidasi yang dibagikan.</Empty>
          ) : (
            <div className="incident-list">
              {data.incidents.slice(0, 6).map((i) => {
                const histories =
                  w?.history
                    .filter((h) => h.entity_id === i.id)
                    .sort((a, b) => b.created_at.localeCompare(a.created_at)) ||
                  [];
                const tasks =
                  w?.tasks.filter((t) => t.incident_id === i.id) || [];
                const before =
                  w?.photos.filter((p) =>
                    w.reports.some(
                      (r) => r.id === p.report_id && r.incident_id === i.id,
                    ),
                  ) || [];
                const after =
                  w?.photos.filter(
                    (p) =>
                      p.incident_id === i.id ||
                      tasks.some((t) => t.id === p.task_id),
                  ) || [];
                return (
                  <details className="incident-detail" key={i.id}>
                    <summary>
                      <span className="incident-location">
                        <strong>{i.public_label}</strong>
                        <span className="small-muted">
                          #{incidentReference(i.id, incidentIds)} ·{" "}
                          {histories[0]
                            ? "Catatan terakhir " +
                              dateTime(histories[0].created_at)
                            : "Validasi " + dateTime(i.verified_at)}
                        </span>
                      </span>
                      <Status value={i.status} />
                      <ChevronDown size={18} />
                    </summary>
                    <div className="incident-body">
                      <dl className="facts">
                        <div>
                          <dt>Referensi lengkap</dt>
                          <dd className="reference-full">{i.id}</dd>
                        </div>
                        <div>
                          <dt>Validasi koordinator</dt>
                          <dd>{dateTime(i.verified_at)}</dd>
                        </div>
                      </dl>
                      {tasks.map((t) => (
                        <div className="task-record" key={t.id}>
                          <h3>
                            {w?.profiles.find((p) => p.id === t.worker_id)
                              ?.display_name || "Penugasan tercatat"}
                          </h3>
                          <Status value={t.status} />
                          <p>
                            Perkiraan tindak lanjut: {dateTime(t.due_at)}. Bukan
                            jaminan waktu layanan.
                          </p>
                          {t.blocker && (
                            <p className="notice warn">Kendala: {t.blocker}</p>
                          )}
                          {t.action_taken && (
                            <p>
                              {t.action_taken} · {dateTime(t.performed_at)}
                            </p>
                          )}
                          {t.destination && (
                            <p>Tujuan pengangkutan: {t.destination}</p>
                          )}
                        </div>
                      ))}
                      {(before.length > 0 || after.length > 0) && (
                        <div className="evidence-comparison">
                          <section>
                            <h3>Bukti laporan</h3>
                            {before.length ? (
                              <PhotoStrip photos={before} />
                            ) : (
                              <p className="small-muted">
                                Tidak tersedia untuk akun ini.
                              </p>
                            )}
                          </section>
                          <section>
                            <h3>Bukti sesudah</h3>
                            {after.length ? (
                              <PhotoStrip photos={after} />
                            ) : (
                              <p className="small-muted">
                                Belum tersedia untuk akun ini.
                              </p>
                            )}
                          </section>
                        </div>
                      )}
                      {histories.length ? (
                        <Timeline history={[...histories].reverse()} />
                      ) : (
                        <p className="small-muted">
                          Riwayat rinci dan bukti privat ditampilkan hanya untuk
                          akun yang memiliki akses. Waktu validasi bukan waktu
                          pembaruan status terakhir.
                        </p>
                      )}
                    </div>
                  </details>
                );
              })}
            </div>
          )}
        </section>
        <section className="service-section home-events">
          <SectionTitle
            title="Kegiatan lingkungan"
            action={
              <button className="text-button" onClick={onEvents}>
                Lihat kegiatan <ArrowRight size={16} />
              </button>
            }
          />
          {!data.events.length ? (
            <p className="muted">
              Belum ada kegiatan yang diterbitkan di wilayah ini.
            </p>
          ) : (
            <ul className="event-teasers">
              {data.events.slice(0, 3).map((e) => (
                <li key={e.id}>
                  <strong>{e.title}</strong>
                  <span>
                    {dateTime(e.starts_at)} · {e.location}
                  </span>
                  <span className="small-muted">
                    PIC: {e.pic} ·{" "}
                    {e.transport_confirmed
                      ? "Pengangkutan dikonfirmasi"
                      : "Pengangkutan belum dikonfirmasi"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <aside className="coverage-note">
          <h2>Cakupan layanan</h2>
          <p>
            {region?.coverage || "Pilih kawasan untuk melihat cakupan layanan."}
          </p>
          <dl>
            <dt>Pengelola wilayah</dt>
            <dd>{region?.owner_label || "Belum ditetapkan"}</dd>
          </dl>
          <p className="small-muted">
            Jadwal adalah rentang layanan yang dikonfirmasi, bukan pelacakan
            armada.
          </p>
        </aside>
      </div>

      {/* Keunggulan & Komparasi Platform (Nilai Pembeda Lomba UINIC 8.0) */}
      <section className="mt-8 p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-6">
        <div className="max-w-3xl space-y-2">
          <span className="text-xs uppercase font-bold text-teal-400 tracking-wider">
            Nilai Keunggulan & Diferensiasi
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-white">
            Mengapa Sampah Terhubung Berbeda?
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Menjembatani kesenjangan antara warga, koordinator lingkungan, dan armada kebersihan melalui alur kerja terstruktur yang tidak dimiliki platform aduan konvensional.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 font-bold flex items-center justify-center text-sm">
              01
            </div>
            <h3 className="font-bold text-white text-sm">Validasi 2-Tahap Anti-Hoaks</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Laporan warga diverifikasi koordinator wilayah sebelum penugasan armada. Mencegah perjalanan sia-sia dan laporan fiktif.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-sm">
              02
            </div>
            <h3 className="font-bold text-white text-sm">Jejak Status Transparan (Audit Trail)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Riwayat penanganan menggunakan stempel waktu WIB. Foto bukti hanya tersedia bagi pengguna berwenang; publik melihat ringkasan yang telah disetujui.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 font-bold flex items-center justify-center text-sm">
              03
            </div>
            <h3 className="font-bold text-white text-sm">Interoperabilitas & Open Data</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              REST API baca-saja tersedia untuk data publik. Sistem belum terhubung ke DLH atau Smart City; integrasi mitra membutuhkan kesepakatan dan pengujian terpisah.
            </p>
          </div>
        </div>

        <div className="notice info">
          <h3>Fokus prototipe</h3>
          <p>Koordinasi tingkat lingkungan: jadwal, pemeriksaan laporan, penugasan, dan kegiatan. Kecepatan layanan dan keunggulan dibanding platform lain belum diukur.</p>
          <p>Data, nama pengelola, dan gambar pada pratinjau adalah ilustrasi skenario, bukan bukti pilot atau dokumentasi lapangan.</p>
        </div>
      </section>
    </>
  );
}
