"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Leaf,
  Home,
  CalendarDays,
  ClipboardList,
  Users,
  BarChart3,
  Bell,
  MapPin,
  ChevronRight,
  Plus,
  Navigation,
  LogOut,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";
import type { PublicData, Workspace, Region } from "@/lib/types";
import { dateTime, dateLabel } from "@/lib/types";
import { jakartaDate } from "@/lib/rules";
import { ActionForm, api, localDateTime } from "./forms";
import { Empty, SectionTitle, Status } from "./primitives";
import { BrandLogo } from "./brand";
import { HomeView } from "./home";
import { Schedules } from "./schedules";
import {
  Coordinator,
  Worker,
  MyReports,
  PreventionPanel,
  ScheduleManager,
  Admin,
} from "./operations";
import { Events } from "./events";
import { ApiDocsView } from "./api-docs";
import { GuideView } from "./guide";

const Map = dynamic(() => import("./location-map"), {
  ssr: false,
  loading: () => (
    <p className="notice info">Memuat peta… Patokan manual tetap tersedia.</p>
  ),
});

export type View =
  | "home"
  | "schedule"
  | "report"
  | "mine"
  | "manage"
  | "events"
  | "summary"
  | "notifications"
  | "admin"
  | "login"
  | "region"
  | "prevention"
  | "api-docs"
  | "guide";

const initial: PublicData = {
  regions: [],
  schedules: [],
  exceptions: [],
  runs: [],
  incidents: [],
  events: [],
};

const nav = [
  { key: "home", label: "Beranda", icon: Home },
  { key: "schedule", label: "Jadwal angkut", icon: CalendarDays },
  { key: "mine", label: "Laporan saya", icon: ClipboardList },
  { key: "events", label: "Kegiatan", icon: Users },
  { key: "api-docs", label: "Integrasi API", icon: ShieldCheck },
  { key: "guide", label: "Panduan & SUS", icon: BarChart3 },
] as const;

export const pathToView: Record<string, View> = {
  "/": "home",
  "/jadwal": "schedule",
  "/laporan": "mine",
  "/laporan/baru": "report",
  "/kegiatan": "events",
  "/integrasi": "api-docs",
  "/panduan": "guide",
  "/admin": "admin",
  "/kelola": "manage",
  "/wilayah": "region",
};

export const viewToPath: Partial<Record<View, string>> = {
  home: "/",
  schedule: "/jadwal",
  mine: "/laporan",
  report: "/laporan/baru",
  events: "/kegiatan",
  "api-docs": "/integrasi",
  guide: "/panduan",
  admin: "/admin",
  manage: "/kelola",
  region: "/wilayah",
};

export default function Dashboard({
  configured,
  demo,
  previewData,
  initialNow,
  initialView,
}: {
  configured: boolean;
  demo: boolean;
  previewData?: PublicData;
  initialNow: string;
  initialView?: View;
}) {
  const [data, setData] = useState<PublicData>(previewData || initial),
    [w, setW] = useState<Workspace | null>(null),
    [selected, setSelected] = useState(""),
    [view, setView] = useState<View>(initialView || "home"),
    [busy, setBusy] = useState(configured),
    [error, setError] = useState(""),
    [search, setSearch] = useState(""),
    [gps, setGps] = useState<{
      lat: number;
      lng: number;
      region: Region;
    } | null>(null),
    [gpsMessage, setGpsMessage] = useState(""),
    [menu, setMenu] = useState(false),
    [heroSeen, setHeroSeen] = useState(false),
    [date, setDate] = useState(() => jakartaDate(new Date(initialNow))),
    [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null),
    [from, setFrom] = useState(() =>
      jakartaDate(new Date(Date.parse(initialNow) - 30 * 86400000)),
    ),
    [until, setUntil] = useState(() => jakartaDate(new Date(initialNow)));
  const [now, setNow] = useState(() => new Date(initialNow));
  const sequence = useRef(0);
  const hadWorkspace = useRef(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const preview = !!previewData;
  const region =
    data.regions.find((r) => r.id === selected) || data.regions[0] || null;
  const coordinator =
    !!w &&
    (w.profile.is_admin ||
      w.memberships.some(
        (m) =>
          m.user_id === w.profile.id &&
          m.region_id === region?.id &&
          m.active &&
          m.role === "coordinator",
      ));
  const worker =
    !!w &&
    w.memberships.some(
      (m) =>
        m.user_id === w.profile.id &&
        m.region_id === region?.id &&
        m.active &&
        m.role === "worker",
    );
  const role = w?.profile.is_admin
    ? "Administrator"
    : coordinator
      ? "Koordinator"
      : worker
        ? "Petugas"
        : "Pelapor";
  const markHeroSeen = useCallback(() => setHeroSeen(true), []);
  const unread = w?.notifications.filter((n) => !n.read_at).length || 0;
  useEffect(() => {
    if (!menu) return;
    document
      .querySelector<HTMLButtonElement>("#main-navigation button")
      ?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenu(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [menu]);
  const load = useCallback(async (current: string, signal?: AbortSignal) => {
    const version = ++sequence.current;
    const stale = () => signal?.aborted || version !== sequence.current;
    try {
      const response = await fetch(
        "/api/public" + (current ? "?region=" + current : ""),
        { signal, cache: "no-store" },
      );
      const next = await response.json();
      if (!response.ok) throw new Error(next.error);
      if (stale()) return;
      let chosen = current;
      if (!chosen) {
        try {
          chosen = localStorage.getItem("sampah-terhubung.region.v1") || "";
        } catch {
          /* preference persistence is optional */
        }
        if (!next.regions.some((r: Region) => r.id === chosen))
          chosen = next.regions[0]?.id || "";
        setSelected(chosen);
        if (chosen) {
          const response = await fetch("/api/public?region=" + chosen, {
            signal,
            cache: "no-store",
          });
          if (!response.ok)
            throw new Error("Informasi wilayah belum dapat dimuat.");
          Object.assign(next, await response.json());
        }
      }
      if (stale()) return;
      setData(next);
      setNow(new Date());
      setError("");
      if (chosen) {
        try {
          const response = await fetch("/api/workspace?region=" + chosen, {
            signal,
            cache: "no-store",
          });
          if (response.status === 401) {
            if (!stale()) setW(null);
            if (!stale() && hadWorkspace.current)
              setError(
                "Sesi berakhir. Masuk kembali untuk membuka data pribadi.",
              );
            if (!stale()) hadWorkspace.current = false;
          } else {
            const workspace = await response.json();
            if (!response.ok) {
              if (!stale()) setW(null);
              throw new Error(
                workspace.error || "Ruang kerja belum dapat dimuat. Coba lagi.",
              );
            }
            if (!stale()) {
              setW(workspace);
              hadWorkspace.current = true;
            }
          }
        } catch (error) {
          if (!stale()) {
            setW(null);
            hadWorkspace.current = false;
          }
          throw error;
        }
      }
    } catch (e) {
      if (stale()) return;
      setError(e instanceof Error ? e.message : "Layanan belum dapat dimuat.");
    } finally {
      if (!stale()) setBusy(false);
    }
  }, []);
  useEffect(() => {
    if (!configured || preview) return;
    const controller = new AbortController();
    void Promise.resolve().then(() => load(selected, controller.signal));
    return () => controller.abort();
  }, [configured, preview, selected, load]);
  useEffect(() => {
    const handlePopState = () => {
      const currentPath = window.location.pathname;
      const matched = pathToView[currentPath];
      if (matched) {
        setView(matched);
      }
    };
    window.addEventListener("popstate", handlePopState);
    const initialMatched = pathToView[window.location.pathname];
    if (initialMatched && !initialView) {
      setView(initialMatched);
    }
    return () => window.removeEventListener("popstate", handlePopState);
  }, [initialView]);

  const refresh = () => {
    if (configured && !preview) {
      setBusy(true);
      void load(region?.id || "");
    }
  };
  const go = (next: View) => {
    setView(next);
    setMenu(false);
    const path = viewToPath[next];
    if (path && typeof window !== "undefined" && window.location.pathname !== path) {
      window.history.pushState(null, "", path);
    }
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
    requestAnimationFrame(() =>
      document.getElementById("main")?.focus({ preventScroll: true }),
    );
  };
  const choose = (id: string) => {
    if (preview || id === selected) {
      setSelected(id);
      setGps(null);
      go("home");
      if (!preview) refresh();
      try {
        localStorage.setItem("sampah-terhubung.region.v1", id);
      } catch {
        /* Optional preference. */
      }
      return;
    }
    sequence.current++;
    setW(null);
    hadWorkspace.current = false;
    setData((previous) => ({
      ...previous,
      schedules: [],
      exceptions: [],
      runs: [],
      incidents: [],
      events: [],
    }));
    setSelected(id);
    setCoords(null);
    setGps(null);
    setBusy(configured);
    try {
      localStorage.setItem("sampah-terhubung.region.v1", id);
    } catch {
      /* Region preference is optional when device storage is unavailable. */
    }
    go("home");
  };
  const pick = useCallback(
    (lat: number, lng: number) => setCoords({ lat, lng }),
    [],
  );
  function suggestGps() {
    setGpsMessage("Mencari lokasi setelah izin Anda…");
    if (!navigator.geolocation) {
      setGpsMessage("GPS tidak tersedia. Pilih wilayah secara manual.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nearest = [...data.regions].sort(
          (a, b) =>
            (a.lat - position.coords.latitude) ** 2 +
            (a.lng - position.coords.longitude) ** 2 -
            ((b.lat - position.coords.latitude) ** 2 +
              (b.lng - position.coords.longitude) ** 2),
        )[0];
        if (!nearest) {
          setGpsMessage(
            "Belum ada daftar wilayah. Gunakan pemilihan manual setelah data tersedia.",
          );
          return;
        }
        setGps({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          region: nearest,
        });
        setGpsMessage(
          "GPS hanya saran; periksa cakupan dan konfirmasikan sendiri.",
        );
      },
      () =>
        setGpsMessage(
          "GPS tidak tersedia atau izin ditolak. Pilih wilayah manual; layanan tetap dapat digunakan.",
        ),
      { timeout: 10000, enableHighAccuracy: false },
    );
  }
  const login = () => go("login");
  const filteredIncidents =
    w?.incidents.filter(
      (i) =>
        jakartaDate(new Date(i.verified_at)) >= from &&
        jakartaDate(new Date(i.verified_at)) <= until,
    ) || [];
  const filteredReports =
    w?.reports.filter(
      (r) =>
        jakartaDate(new Date(r.created_at)) >= from &&
        jakartaDate(new Date(r.created_at)) <= until,
    ) || [];
  const matchingRegions = data.regions.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Langsung ke isi
      </a>
      <div className="main-shell">
        <header
          className={
            "topbar " + (coordinator || worker ? "has-role-navigation" : "")
          }
        >
          <div className="header-identity">
            <Link
              className="brand"
              href="/"
              aria-label="Sampah Terhubung beranda"
            >
              <BrandLogo />
            </Link>
            <div className="product-identity">
              <strong>Sampah Terhubung</strong>
              <p>Jadwal & penanganan wilayah</p>
            </div>
          </div>
          <nav
            className={"main-navigation " + (menu ? "visible" : "")}
            id="main-navigation"
            aria-label="Navigasi utama"
          >
            {nav.map((item) => (
              <button
                key={item.key}
                onClick={() => go(item.key)}
                className={view === item.key ? "active" : ""}
                aria-current={view === item.key ? "page" : undefined}
              >
                <item.icon size={20} />
                {item.label}
              </button>
            ))}
            {(coordinator || worker) && (
              <button
                className={view === "manage" ? "active" : ""}
                onClick={() => go("manage")}
              >
                <ShieldCheck size={20} />
                Ruang kerja
              </button>
            )}
            {coordinator && (
              <>
                <button
                  className={view === "prevention" ? "active" : ""}
                  onClick={() => go("prevention")}
                >
                  <Leaf size={20} />
                  Pencegahan
                </button>
                <button
                  className={view === "summary" ? "active" : ""}
                  onClick={() => go("summary")}
                >
                  <BarChart3 size={20} />
                  Ringkasan wilayah
                </button>
              </>
            )}
            {w?.profile.is_admin && (
              <button
                onClick={() => go("admin")}
                className={view === "admin" ? "active" : ""}
              >
                <ShieldCheck size={20} />
                Administrasi
              </button>
            )}
          </nav>{" "}
          <div className="header-actions">
            <button
              className="icon-button"
              aria-label={
                "Pemberitahuan" +
                (unread ? ", " + unread + " belum dibaca" : "")
              }
              onClick={() => go(w ? "notifications" : "login")}
              disabled={preview}
              title={
                preview
                  ? "Pemberitahuan tidak tersedia di pratinjau"
                  : undefined
              }
            >
              <Bell size={20} />
              {unread > 0 && <span className="notification-dot" />}
            </button>
            {w ? (
              <button
                className="account-button"
                aria-label={"Keluar dari akun " + w.profile.display_name}
                onClick={async () => {
                  try {
                    await api("/api/auth", { action: "logout" });
                    sequence.current++;
                    setW(null);
                    hadWorkspace.current = false;
                    go("home");
                    refresh();
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                <span className="avatar">{w.profile.display_name[0]}</span>
                <span>
                  {w.profile.display_name}
                  <small>{role}</small>
                </span>
                <LogOut size={16} />
              </button>
            ) : (
              <button
                className="button secondary small-button"
                onClick={login}
                disabled={preview}
                title={
                  preview ? "Login tidak tersedia di pratinjau" : undefined
                }
              >
                Masuk
              </button>
            )}
          </div>
          <button
            className="icon-button mobile-menu"
            ref={menuButton}
            aria-label={menu ? "Tutup navigasi" : "Buka navigasi"}
            aria-expanded={menu}
            aria-controls="main-navigation"
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </header>

        <main
          id="main"
          className={
            "main-content " +
            (view === "home" && !coordinator && !worker && !w?.profile.is_admin
              ? "has-intro"
              : "")
          }
          tabIndex={-1}
        >
          {demo && (
            <details className="simulation-note">
              <summary>
                {preview ? "Data simulasi · Pratinjau statis" : "Data simulasi"}
              </summary>
              <p>
                {preview &&
                  "Akun, pelaporan dan pendaftaran tidak tersedia di pratinjau. "}
                Wilayah, jadwal dan pengelola merupakan contoh. Bukan layanan
                pemerintah atau layanan aktif kampus; lokasi pilot belum
                dikonfirmasi.
              </p>
            </details>
          )}
          {!configured && !preview && (
            <div className="setup-notice">
              <strong>Backend Cloud belum dikonfigurasi</strong>
              <p>
                Administrator perlu mengisi konfigurasi lokal dan menyiapkan
                proyek Supabase. Jadwal, laporan, dan akun akan tersedia setelah
                koneksi berhasil diperiksa.
              </p>
              <a href="/preview">Lihat pratinjau antarmuka →</a>
            </div>
          )}
          {busy && (
            <p role="status" className="loading-bar">
              Memuat informasi wilayah…
            </p>
          )}
          {error && (
            <div className="notice bad" role="alert">
              {error}{" "}
              <button className="text-button" onClick={refresh}>
                Coba lagi
              </button>
            </div>
          )}
          {region && !region.active && (
            <p className="notice warn">
              Wilayah belum terlayani. Jadwal pengangkutan dan pelaporan belum
              aktif untuk {region.name}.
            </p>
          )}
          {view !== "home" && (
            <div className="current-region">
              <span>{region?.name || "Belum memilih wilayah"}</span>
              <button className="text-button" onClick={() => go("region")}>
                Ganti wilayah
              </button>
            </div>
          )}
          {view === "home" && (
            <HomeView
              showIntro={!coordinator && !worker && !w?.profile.is_admin}
              animateIntro={!heroSeen}
              onIntroSeen={markHeroSeen}
              data={data}
              w={w}
              region={region}
              today={jakartaDate(now)}
              reportingAvailable={configured && !preview && !!region?.active}
              preview={preview}
              loading={busy && !data.regions.length}
              onRegion={() => go("region")}
              onSchedule={() => go("schedule")}
              onReport={() => go(w ? "report" : "login")}
              onEvents={() => go("events")}
              onApiDocs={() => go("api-docs")}
              onGuide={() => go("guide")}
            />
          )}
          {view === "region" && (
            <>
              <SectionTitle
                level={1}
                eyebrow="WILAYAH SAYA"
                title="Temukan lingkungan Anda"
                description="Cari dan pilih kawasan secara manual. GPS bersifat opsional dan tetap memerlukan konfirmasi."
              />
              <div className="region-layout">
                <section className="region-selector">
                  <label className="field">
                    Cari wilayah
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Nama kawasan…"
                    />
                  </label>
                  <button className="button secondary" onClick={suggestGps}>
                    <Navigation size={18} />
                    Gunakan GPS untuk saran
                  </button>
                  {gpsMessage && (
                    <p className="notice info" role="status">
                      {gpsMessage}
                    </p>
                  )}
                  {gps && (
                    <div className="inset">
                      <strong>Saran terdekat: {gps.region.name}</strong>
                      <p>{gps.region.coverage}</p>
                      <small>
                        Kedekatan lokasi tidak memastikan cakupan layanan Anda.
                      </small>
                      <button
                        className="button primary"
                        onClick={() => choose(gps.region.id)}
                      >
                        Konfirmasi wilayah ini
                      </button>
                    </div>
                  )}
                  <div className="region-list">
                    {matchingRegions.map((r) => (
                      <button key={r.id} onClick={() => choose(r.id)}>
                        <MapPin />
                        <span>
                          <strong>{r.name}</strong>
                          <small>{r.coverage}</small>
                          <span
                            className={"badge " + (r.active ? "good" : "warn")}
                          >
                            {r.active
                              ? "Layanan aktif"
                              : "Wilayah belum terlayani"}
                          </span>
                        </span>
                        <ChevronRight />
                      </button>
                    ))}
                  </div>
                  {!matchingRegions.length && (
                    <Empty>
                      {data.regions.length
                        ? "Tidak ada wilayah yang cocok. Coba nama lain."
                        : "Daftar wilayah belum tersedia."}
                    </Empty>
                  )}
                </section>
                {region && (
                  <details className="region-map" open>
                    <summary>Peta pusat wilayah</summary>
                    <Map region={region} />
                  </details>
                )}
              </div>
            </>
          )}
          {view === "schedule" && (
            <>
              <SectionTitle
                level={1}
                eyebrow="LAYANAN WILAYAH"
                title="Jadwal pengangkutan"
                description="Bedakan rencana, perubahan tanggal, dan pelaksanaan yang sudah dicatat."
              />
              <div className="service-section schedule-page">
                <label className="field narrow">
                  Mulai tanggal
                  <input
                    type="date"
                    lang="id"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </label>
                <p className="period-label">
                  Periode: {dateLabel(date)} –{" "}
                  {dateLabel(
                    date
                      ? jakartaDate(
                          new Date(
                            Date.parse(date + "T12:00:00Z") + 13 * 86400000,
                          ),
                        )
                      : "",
                  )}
                </p>
                <Schedules data={data} start={date} />
              </div>
              {w && (coordinator || worker) && region && (
                <ScheduleManager
                  now={now}
                  w={w}
                  region={region}
                  refresh={refresh}
                />
              )}
            </>
          )}
          {view === "login" && (
            <>
              <SectionTitle
                level={1}
                title="Masuk ke lingkungan Anda"
                description="Akun pelapor untuk laporan dan kegiatan. Pengelola ditunjuk administrator setelah pemeriksaan."
              />
              {configured ? (
                <div className="auth-grid">
                  <section className="panel">
                    <h3>Masuk</h3>
                    <ActionForm
                      op="login"
                      auth
                      fields={[
                        {
                          name: "email",
                          label: "Email",
                          type: "email",
                          required: true,
                        },
                        {
                          name: "password",
                          label: "Password",
                          type: "password",
                          required: true,
                          hint: "Minimal 12 karakter untuk akun demo.",
                        },
                      ]}
                      label="Masuk"
                      onDone={() => {
                        refresh();
                        go("home");
                      }}
                    />
                  </section>
                  <section className="panel">
                    <h3>Buat akun pelapor</h3>
                    <ActionForm
                      op="signup"
                      auth
                      fields={[
                        {
                          name: "display_name",
                          label: "Nama tampilan",
                          required: true,
                        },
                        {
                          name: "email",
                          label: "Email",
                          type: "email",
                          required: true,
                        },
                        {
                          name: "password",
                          label: "Password",
                          type: "password",
                          required: true,
                          hint: "Minimal 12 karakter. Periksa email untuk konfirmasi.",
                        },
                      ]}
                      label="Daftar sebagai pelapor"
                      onDone={refresh}
                    />
                    <small>
                      Foto dan kontak tidak tampil di halaman publik. Tidak
                      perlu NIK.
                    </small>
                  </section>
                </div>
              ) : (
                <Empty>Akun tersedia setelah backend dikonfigurasi.</Empty>
              )}
            </>
          )}
          {view === "report" &&
            (w && region?.active ? (
              <>
                <SectionTitle
                  level={1}
                  eyebrow="LAPORAN BARU"
                  title="Sampaikan yang Anda temukan"
                  description="Laporan akan diperiksa koordinator wilayah sebelum dibagikan atau ditugaskan."
                />
                <div className="report-grid">
                  <section className="panel">
                    <p className="notice info">
                      <MapPin size={18} /> Wilayah laporan: {region.name}
                    </p>
                    <ActionForm
                      op="report.create"
                      fixed={{ region_id: region.id, ...(coords || {}) }}
                      fields={[
                        {
                          name: "category",
                          label: "Kategori",
                          type: "select",
                          required: true,
                          options: [
                            "Penumpukan",
                            "Tempat sampah penuh",
                            "Sampah berserakan",
                          ].map((s) => ({ value: s, label: s })),
                        },
                        {
                          name: "observed_at",
                          label: "Waktu pengamatan",
                          type: "datetime-local",
                          required: true,
                          initial: localDateTime(now),
                        },
                        {
                          name: "landmark",
                          label: "Lokasi atau patokan",
                          required: true,
                          hint: "Contoh: dekat pagar sisi timur, tanpa kontak pribadi.",
                        },
                        {
                          name: "description",
                          label: "Apa yang Anda lihat?",
                          type: "textarea",
                          required: true,
                          hint: "Minimal 10 karakter. Jelaskan kondisi dan akses lokasi.",
                        },
                      ]}
                      photos
                      label="Kirim laporan"
                      onDone={() => {
                        refresh();
                        go("mine");
                      }}
                    />
                  </section>
                  <aside className="panel">
                    <h3>Lokasi laporan</h3>
                    <Map region={region} onPick={pick} />
                    {coords && (
                      <p className="notice good">
                        Koordinat dipilih: {coords.lat.toFixed(5)},{" "}
                        {coords.lng.toFixed(5)}{" "}
                        <button
                          className="text-button"
                          onClick={() => setCoords(null)}
                        >
                          Hapus koordinat
                        </button>
                      </p>
                    )}
                    <p>
                      Patokan manual tetap dapat digunakan tanpa GPS atau peta.
                    </p>
                    <p className="small-muted">
                      Gunakan untuk sampah lingkungan biasa. Lokasi dan kategori
                      akan ditinjau pengelola.
                    </p>
                  </aside>
                </div>
              </>
            ) : (
              <>
                <SectionTitle level={1} title="Buat laporan" />
                <Empty>
                  {w
                    ? "Wilayah ini belum terlayani."
                    : "Masuk dahulu untuk mengirim laporan."}
                </Empty>
              </>
            ))}
          {view === "mine" &&
            (w ? (
              <>
                <div className="inline-actions">
                  <button
                    className="button primary"
                    onClick={() => go("report")}
                    disabled={!region?.active}
                  >
                    <Plus size={18} />
                    Buat laporan
                  </button>
                </div>
                <MyReports w={w} refresh={refresh} />
              </>
            ) : (
              <div className="panel">
                <SectionTitle level={1} title="Laporan saya" />
                <Empty>
                  Masuk untuk melihat laporan pribadi dan riwayat penanganan.
                </Empty>
                <button
                  className="button primary"
                  onClick={login}
                  disabled={preview}
                >
                  Masuk
                </button>
              </div>
            ))}
          {view === "manage" &&
            w &&
            region &&
            (coordinator ? (
              <Coordinator now={now} w={w} region={region} refresh={refresh} />
            ) : worker ? (
              <Worker now={now} w={w} refresh={refresh} />
            ) : null)}
          {(["manage", "prevention", "summary", "admin"] as View[]).includes(
            view,
          ) &&
            (!w ||
              !region ||
              (view === "manage"
                ? !coordinator && !worker
                : view === "admin"
                  ? !w.profile.is_admin
                  : !coordinator)) && (
              <section className="panel">
                <SectionTitle level={1} title="Ruang kerja belum tersedia" />
                <p role="status">
                  {busy
                    ? "Memeriksa akses wilayah…"
                    : !w
                      ? "Masuk kembali atau coba muat ulang untuk membuka data pribadi."
                      : "Anda belum memiliki akses pengelola wilayah ini."}
                </p>
                {!w && (
                  <button className="button primary" onClick={login}>
                    Masuk kembali
                  </button>
                )}
                <button
                  className="button secondary"
                  onClick={refresh}
                  disabled={busy}
                >
                  Muat ulang akses
                </button>
              </section>
            )}
          {view === "prevention" && coordinator && w && region && (
            <PreventionPanel
              now={now}
              w={w}
              region={region}
              refresh={refresh}
            />
          )}
          {view === "events" && (
            <Events
              preview={preview}
              onSchedule={() => go("schedule")}
              now={now}
              events={data.events}
              w={w}
              region={region}
              coordinator={coordinator}
              refresh={refresh}
              login={login}
            />
          )}
          {view === "summary" && coordinator && w && region && (
            <>
              <SectionTitle
                level={1}
                title="Ringkasan wilayah"
                description="Periode dalam WIB. Laporan dan insiden dihitung sebagai entitas berbeda."
              />
              <div className="panel period-filter">
                <label className="field">
                  Dari
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                  />
                </label>
                <label className="field">
                  Sampai
                  <input
                    type="date"
                    value={until}
                    onChange={(e) => setUntil(e.target.value)}
                  />
                </label>
                <a
                  className="button primary"
                  href={
                    "/api/export?region=" +
                    region.id +
                    "&from=" +
                    from +
                    "&until=" +
                    until
                  }
                >
                  Unduh CSV
                </a>
              </div>
              <div className="metrics">
                <div>
                  <strong>{filteredReports.length}</strong>
                  <span>Laporan dikirim dalam periode</span>
                </div>
                <div>
                  <strong>{filteredIncidents.length}</strong>
                  <span>Insiden divalidasi dalam periode</span>
                </div>
                <div>
                  <strong>
                    {
                      filteredIncidents.filter((i) => i.status === "closed")
                        .length
                    }
                  </strong>
                  <span>Insiden periode, kini selesai diperiksa</span>
                </div>
              </div>
              <p className="notice info">
                Angka dihitung dari data tersimpan. Belum dicatat dibedakan dari
                tidak terlaksana.{" "}
                {demo ? "Semua angka merupakan Data simulasi." : ""}
              </p>
              <div className="card">
                <h3>Insiden terbuka dan kendala</h3>
                {w.incidents
                  .filter((i) => i.status !== "closed")
                  .map((i) => (
                    <p key={i.id}>
                      {i.public_label} · usia{" "}
                      {Math.max(
                        0,
                        Math.floor(
                          (now.getTime() - Date.parse(i.verified_at)) /
                            86400000,
                        ),
                      )}{" "}
                      hari · <Status value={i.status} />
                    </p>
                  ))}
                <p>
                  Tugas belum diterima:{" "}
                  {w.tasks.filter((t) => t.status === "offered").length}
                </p>
                {w.tasks
                  .filter((t) => t.blocker && t.status === "accepted")
                  .map((t) => (
                    <p key={t.id} className="notice warn">
                      {t.blocker}
                    </p>
                  ))}
                <p>
                  Pelaksanaan tercatat:{" "}
                  {
                    w.runs.filter((r) => r.date >= from && r.date <= until)
                      .length
                  }
                </p>
                <p>
                  Kegiatan mulai dalam periode:{" "}
                  {
                    w.events.filter(
                      (e) =>
                        jakartaDate(new Date(e.starts_at)) >= from &&
                        jakartaDate(new Date(e.starts_at)) <= until,
                    ).length
                  }
                </p>
                <button
                  className="text-button"
                  onClick={() => go("prevention")}
                >
                  Tinjau titik berulang →
                </button>
              </div>
            </>
          )}
          {view === "notifications" &&
            (w ? (
              <>
                <SectionTitle
                  level={1}
                  title="Pemberitahuan"
                  description="Perubahan yang relevan dengan laporan dan tanggung jawab Anda."
                />
                {!w.notifications.length ? (
                  <Empty>Belum ada pemberitahuan.</Empty>
                ) : (
                  w.notifications.map((n) => (
                    <article className="card" key={n.id}>
                      <p>{n.message}</p>
                      <small>{dateTime(n.created_at)}</small>
                      {!n.read_at && (
                        <ActionForm
                          op="notification.read"
                          fixed={{ id: n.id }}
                          label="Tandai dibaca"
                          tone="secondary"
                          onDone={refresh}
                        />
                      )}
                    </article>
                  ))
                )}
              </>
            ) : (
              <>
                <SectionTitle level={1} title="Pemberitahuan" />
                <Empty>Masuk untuk melihat pemberitahuan.</Empty>
              </>
            ))}
          {view === "admin" && w?.profile.is_admin && (
            <Admin w={w} refresh={refresh} />
          )}
          {view === "api-docs" && <ApiDocsView />}
          {view === "guide" && <GuideView />}
        </main>
        <footer className="footer">
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <span>
              <Leaf size={16} />
              Sampah Terhubung · Kolaborasi Kebersihan & Pengelolaan Lingkungan
            </span>
            <div className="flex items-center gap-4 text-xs">
              <button
                type="button"
                className="text-teal-700 hover:text-teal-900 font-medium underline"
                onClick={() => go("api-docs")}
              >
                Integrasi API DLH
              </button>
              <button
                type="button"
                className="text-teal-700 hover:text-teal-900 font-medium underline"
                onClick={() => go("guide")}
              >
                Panduan & Evaluasi SUS
              </button>
            </div>
          </div>
          <small>
            {demo
              ? "Platform Kolaborasi Pengelolaan Sampah Lingkungan Berbasis Komunitas & Terintegrasi."
              : "Informasi layanan dikelola koordinator wilayah."}
          </small>
        </footer>
      </div>
    </div>
  );
}
