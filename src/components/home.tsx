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
  onApiDocs,
  onGuide,
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
      <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Memuat data wilayah">
        <div className="page-heading">
          <div className="space-y-2">
            <div className="h-4 w-28 bg-slate-200 rounded"></div>
            <div className="h-8 w-64 bg-slate-300 rounded"></div>
          </div>
          <div className="h-10 w-36 bg-slate-200 rounded-lg"></div>
        </div>
        <div className="service-grid">
          <div className="p-6 bg-slate-100 rounded-xl space-y-4">
            <div className="h-5 w-40 bg-slate-200 rounded"></div>
            <div className="space-y-2">
              <div className="h-12 bg-slate-200 rounded"></div>
              <div className="h-12 bg-slate-200 rounded"></div>
            </div>
          </div>
          <div className="p-6 bg-slate-100 rounded-xl space-y-4">
            <div className="h-5 w-48 bg-slate-200 rounded"></div>
            <div className="h-16 bg-slate-200 rounded"></div>
            <div className="h-10 w-32 bg-slate-300 rounded"></div>
          </div>
          <div className="p-6 bg-slate-100 rounded-xl space-y-4">
            <div className="h-5 w-32 bg-slate-200 rounded"></div>
            <div className="h-10 bg-slate-200 rounded"></div>
          </div>
          <div className="p-6 bg-slate-100 rounded-xl space-y-4 col-span-full">
            <div className="h-6 w-52 bg-slate-200 rounded"></div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="h-24 bg-slate-200 rounded"></div>
              <div className="h-24 bg-slate-200 rounded"></div>
            </div>
          </div>
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
                  w?.photos.filter((p) =>
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
              Setiap progres penanganan tercatat dengan foto bukti <em>before-after</em> dan stempel waktu WIB yang dapat diaudit publik.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 font-bold flex items-center justify-center text-sm">
              03
            </div>
            <h3 className="font-bold text-white text-sm">Interoperabilitas & Open Data</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dilengkapi RESTful API terbuka untuk integrasi jadwal dan data kebersihan dengan Smart City maupun DLH daerah.
            </p>
          </div>
        </div>

        {/* Tabel Komparasi */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Tabel Perbandingan dengan Solusi Eksisting
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-950/40">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700 text-slate-300 bg-slate-800/50">
                  <th className="py-2.5 px-3 font-semibold">Fitur / Parameter</th>
                  <th className="py-2.5 px-3 font-semibold text-teal-400">Sampah Terhubung</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-400">Aplikasi Aduan Umum (SP4N LAPOR)</th>
                  <th className="py-2.5 px-3 font-semibold text-slate-400">Grup WhatsApp Warga</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                <tr>
                  <td className="py-2.5 px-3 font-medium">Validasi Koordinator Wilayah</td>
                  <td className="py-2.5 px-3 font-semibold text-teal-400">✓ Ya (Lokal & Cepat)</td>
                  <td className="py-2.5 px-3 text-slate-400">✗ Birokrasi berjenjang</td>
                  <td className="py-2.5 px-3 text-slate-400">✗ Tidak terstruktur</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium">Bukti Riwayat Penanganan (Before-After)</td>
                  <td className="py-2.5 px-3 font-semibold text-teal-400">✓ Terverifikasi Digital</td>
                  <td className="py-2.5 px-3 text-slate-400">Sebagian</td>
                  <td className="py-2.5 px-3 text-slate-400">✗ Tenggelam dalam chat</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium">Jadwal Ritasi Terbuka</td>
                  <td className="py-2.5 px-3 font-semibold text-teal-400">✓ Terjadwal & Real-Time</td>
                  <td className="py-2.5 px-3 text-slate-400">✗ Tidak tersedia</td>
                  <td className="py-2.5 px-3 text-slate-400">✗ Mengandalkan pamflet</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium">Dukungan REST API Terbuka</td>
                  <td className="py-2.5 px-3 font-semibold text-teal-400">✓ Terbuka (OpenGov Ready)</td>
                  <td className="py-2.5 px-3 text-slate-400">✗ API Tertutup</td>
                  <td className="py-2.5 px-3 text-slate-400">✗ Tidak ada</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
