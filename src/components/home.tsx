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
  onRegion: () => void;
  onSchedule: () => void;
  onReport: () => void;
  onEvents: () => void;
  showIntro: boolean;
  animateIntro: boolean;
  onIntroSeen: () => void;
}) {
  const incidentIds = data.incidents.map((i) => i.id);
  const RegionHeading = showIntro ? "h2" : "h1";
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
    </>
  );
}
