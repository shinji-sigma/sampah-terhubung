"use client";

import { useState, useSyncExternalStore } from "react"; const subscribeOrigin = () => () => {}; const browserOrigin = () => window.location.origin; const serverOrigin = () => "https://sampah-terhubung.id"; // Stable server snapshot prevents hydration mismatch.
import { Terminal, Copy, Check, Play, Globe, Shield, RefreshCw } from "lucide-react";
import { SectionTitle, Card } from "./primitives";
import { MOCK_DATA, envelope } from "../app/api/v1/contracts";

interface ApiEndpoint {
  id: string;
  name: string;
  method: "GET";
  path: string;
  description: string;
  auth: "Bebas (Public)" | "API Key / Token";
  params?: { name: string; type: string; required: boolean; desc: string }[];
  responseExample: object;
}

export const ENDPOINTS: ApiEndpoint[] = (["schedules", "incidents", "events"] as const).map(id => ({
  id,
  name: { schedules: "Jadwal Angkut Terbuka", incidents: "Feed Insiden Publik", events: "Agenda Lingkungan" }[id],
  method: "GET",
  path: `/api/v1/${id}`,
  description: {
    schedules: "Jadwal dengan status confirmed atau tentative. Bukan bukti integrasi instansi.",
    incidents: "Proyeksi publik: id, public_label, status, verified_at (ISO 8601 atau null). Tidak ada persentase progres.",
    events: "Agenda publik beserta kuota agregat. is_open memperhitungkan waktu, status published dan kapasitas; bukan konfirmasi pendaftaran.",
  }[id],
  auth: "Bebas (Public)",
  params: [{ name: "region", type: "UUID", required: false, desc: "Hilangkan untuk semua wilayah; UUID valid untuk filter. Nilai kosong/tidak valid: 400. Mode mock dengan filter wilayah menghasilkan data kosong." }],
  responseExample: envelope(id, MOCK_DATA[id], null, "mock_interop", "2026-10-20T08:00:00.000Z"),
}));

export function ApiDocsView() {
  const [selectedId, setSelectedId] = useState("schedules");
  const [tab, setTab] = useState<"curl" | "js" | "python">("curl");
  const [copied, setCopied] = useState(false);
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveResult, setLiveResult] = useState<string | null>(null);
  const endpoint = ENDPOINTS.find((e) => e.id === selectedId) || ENDPOINTS[0];
  const host = useSyncExternalStore(subscribeOrigin, browserOrigin, serverOrigin);

  const getCurlCode = () => `curl -X GET "${host}${endpoint.path}" -H "Accept: application/json"`;
  const getJsCode = () => `const response = await fetch("${host}${endpoint.path}", { credentials: "omit" });\nconsole.log(response.status, await response.json());`;
  const getPythonCode = () => `import requests\nres = requests.get("${host}${endpoint.path}")\nprint(res.status_code, res.json())`;

  const getActiveCode = () => {
    if (tab === "curl") return getCurlCode();
    if (tab === "js") return getJsCode();
    return getPythonCode();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunLive = async () => {
    setLiveLoading(true);
    setLiveResult(null);
    setLiveStatus(null);
    try {
      const res = await fetch(endpoint.path, { credentials: "omit" });
      setLiveStatus(`${res.status} ${res.statusText}`.trim());
      const text = await res.text();
      try { setLiveResult(JSON.stringify(JSON.parse(text), null, 2)); }
      catch { setLiveResult(text || "Respons tanpa body"); }
    } catch (err) {
      setLiveResult(
        JSON.stringify(
          { error: "Permintaan gagal", message: err instanceof Error ? err.message : String(err) },
          null,
          2,
        ),
      );
    } finally {
      setLiveLoading(false);
    }
  };

  return (
    <div className="api-documentation space-y-6">
      <SectionTitle
        level={1}
        eyebrow="API Publik Baca-Saja"
        title="Dokumentasi REST API Sampah Terhubung"
        description="Tiga endpoint GET JSON dan OPTIONS. Belum ada sinkronisasi tulis, webhook, atau integrasi pemerintah terverifikasi."
      />

      {/* Highlights Bar */}
      <div className="grid sm:grid-cols-3 gap-3">
        <Card className="flex items-center gap-3 p-3 text-sm">
          <Globe className="text-teal-600 shrink-0" size={20} />
          <div>
            <div className="font-semibold text-slate-800">CORS Diaktifkan</div>
            <div className="text-xs text-slate-500">GET / OPTIONS tanpa kredensial lintas origin</div>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-3 text-sm">
          <Shield className="text-teal-600 shrink-0" size={20} />
          <div>
            <div className="font-semibold text-slate-800">Waktu ISO 8601</div>
            <div className="text-xs text-slate-500">Timestamp UTC (Z); jam jadwal lokal WIB</div>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-3 text-sm">
          <Terminal className="text-teal-600 shrink-0" size={20} />
          <div>
            <div className="font-semibold text-slate-800">Sumber Data Transparan</div>
            <div className="text-xs text-slate-500">mock_interop = simulasi; database = backend</div>
          </div>
        </Card>
      </div>

      {/* Endpoint Selector Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {ENDPOINTS.map((e) => (
          <button
            key={e.id}
            onClick={() => {
              setSelectedId(e.id);
              setLiveResult(null);
            }}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedId === e.id
                ? "bg-teal-700 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <span
              className={`inline-block mr-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                e.method === "GET" ? "bg-emerald-500/20 text-emerald-800" : "bg-blue-500/20 text-blue-800"
              } ${selectedId === e.id ? "text-white bg-white/20" : ""}`}
            >
              {e.method}
            </span>
            {e.name}
          </button>
        ))}
      </div>

      {/* Main Endpoint Details & Code Playground */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left: Endpoint Spec */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                    endpoint.method === "GET"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {endpoint.method}
                </span>
                <code className="text-sm font-mono font-semibold text-slate-800">
                  {endpoint.path}
                </code>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200">
                {endpoint.auth}
              </span>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              {endpoint.description}
            </p>

            {endpoint.params && endpoint.params.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Parameter Kueri
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-600">
                        <th className="py-1.5 pr-3 font-semibold">Nama</th>
                        <th className="py-1.5 pr-3 font-semibold">Tipe</th>
                        <th className="py-1.5 font-semibold">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {endpoint.params.map((p) => (
                        <tr key={p.name}>
                          <td className="py-2 pr-3 font-mono text-teal-800 font-medium">
                            {p.name}
                            {p.required && <span className="text-rose-500">*</span>}
                          </td>
                          <td className="py-2 pr-3 text-slate-500 font-mono">{p.type}</td>
                          <td className="py-2 text-slate-600">{p.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}


            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Contoh Respons Mock (200; timestamp ilustratif)
              </h4>
              <pre className="p-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-lg text-xs font-mono overflow-x-auto max-h-56">
                {JSON.stringify(endpoint.responseExample, null, 2)}
              </pre>
            </div>
          </Card>
        </div>

        {/* Right: Code Snippets & Live Execution Playground */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="p-4 bg-slate-900 text-white border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <div className="flex gap-1">
                {(["curl", "js", "python"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                      tab === t
                        ? "bg-teal-600 text-white"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    }`}
                  >
                    {t === "curl" ? "cURL" : t === "js" ? "JavaScript" : "Python"}
                  </button>
                ))}
              </div>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition-colors"
                title="Salin cuplikan kode"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-emerald-400" />
                    <span className="text-emerald-400">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Salin</span>
                  </>
                )}
              </button>
            </div>

            <pre className="text-xs font-mono text-emerald-300 overflow-x-auto p-2 bg-slate-950/60 rounded max-h-72 leading-relaxed">
              {getActiveCode()}
            </pre>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                Uji coba langsung ke server runtime:
              </span>
              <button
                onClick={handleRunLive}
                disabled={liveLoading}
                className="button teal flex items-center gap-1.5 text-xs py-1.5 px-3"
              >
                {liveLoading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    Kirim Permintaan
                  </>
                )}
              </button>
            </div>

            {liveResult && (
              <div className="mt-4 space-y-1.5">
                <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span>Hasil Respon Server:</span>
                  <span className="text-emerald-400 font-bold">{liveStatus ?? "Tidak ada respons HTTP"}</span>
                </div>
                <pre className="p-3 bg-slate-950 text-cyan-300 rounded text-xs font-mono overflow-x-auto max-h-64 border border-slate-800">
                  {liveResult}
                </pre>
              </div>
            )}
          </Card>

          {/* RajaOngkir-style implementation notice */}
          <div className="p-3.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 text-xs leading-relaxed space-y-1">
            <p className="font-semibold flex items-center gap-1">
              <Globe size={14} /> Standar Interoperabilitas Terbuka (Open Data)
            </p>
            <p>
              Contoh di atas memakai source: mock_interop saat backend belum dikonfigurasi; bukan data operasional atau data DLH.
              Backend aktif memakai source: database, dengan envelope dan field yang sama. Timestamp ISO 8601 dapat memakai UTC (Z); jam jadwal adalah WIB.
              Respons error berbentuk status: error dan message: 400 untuk region tidak valid, 503 untuk kegagalan backend (tanpa fallback sukses palsu).
              API hanya baca, tanpa integrasi instansi terverifikasi. CORS * tanpa credentials; respons tidak disimpan cache publik.

            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
