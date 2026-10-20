"use client";

import { useState } from "react";
import { Terminal, Copy, Check, Play, Globe, Shield, RefreshCw } from "lucide-react";
import { SectionTitle, Card } from "./primitives";

interface ApiEndpoint {
  id: string;
  name: string;
  method: "GET" | "POST";
  path: string;
  description: string;
  auth: "Bebas (Public)" | "API Key / Token";
  params?: { name: string; type: string; required: boolean; desc: string }[];
  bodyExample?: object;
  responseExample: object;
}

const ENDPOINTS: ApiEndpoint[] = [
  {
    id: "schedules",
    name: "Jadwal Angkut Terbuka",
    method: "GET",
    path: "/api/v1/schedules",
    description:
      "Mengambil jadwal operasional pengangkutan sampah terkonfirmasi per wilayah. Digunakan untuk integrasi smart city, portal RT/RW, atau papan pengumuman digital.",
    auth: "Bebas (Public)",
    params: [
      {
        name: "region",
        type: "UUID",
        required: false,
        desc: "ID unik wilayah (opsional, kosongkan untuk semua wilayah terdaftar)",
      },
    ],
    responseExample: {
      status: "success",
      total: 2,
      region: "all",
      data: [
        {
          id: "sch-pilot-01",
          service: "Pengangkutan Organik & Daur Ulang",
          zone: "Kawasan Permukiman RW 04",
          weekdays: [1, 3, 5],
          weekdays_label: ["Senin", "Rabu", "Jumat"],
          start_time: "07:00",
          end_time: "09:30",
          status: "confirmed",
          source: "Dinas Lingkungan Hidup / SIMPAN Daerah",
        },
      ],
      timestamp: "2026-10-20T08:00:00.000Z",
    },
  },
  {
    id: "incidents",
    name: "Feed Insiden & Aduan Publik",
    method: "GET",
    path: "/api/v1/incidents",
    description:
      "Feed publik status laporan warga yang telah divalidasi oleh Koordinator Wilayah. Menampilkan persentase penanganan dan stempel waktu WIB.",
    auth: "Bebas (Public)",
    params: [
      {
        name: "region",
        type: "UUID",
        required: false,
        desc: "Filter berdasarkan ID wilayah tertentu",
      },
    ],
    responseExample: {
      status: "success",
      total: 3,
      data: [
        {
          id: "inc-demo-02",
          public_label: "Pembersihan saluran drainase tersumbat kantong plastik",
          status: "working",
          status_label: "Sedang ditangani petugas",
          verified_at: "2026-10-18T04:15:00.000Z",
          verified_at_wib: "18 Okt 2026, 11.15 WIB",
          progress: 65,
        },
      ],
    },
  },
  {
    id: "events",
    name: "Agenda Aksi Bersih Lingkungan",
    method: "GET",
    path: "/api/v1/events",
    description:
      "Daftar kegiatan gotong royong, edukasi pemilahan sampah, dan kuota relawan yang masih dibuka.",
    auth: "Bebas (Public)",
    params: [],
    responseExample: {
      status: "success",
      total: 2,
      data: [
        {
          id: "ev-demo-01",
          title: "Aksi Bersih Sungai & Pemilahan Plastik Bersama",
          location: "Bantaran Sungai RW 03",
          starts_at_wib: "25 Okt 2026, 07.30 WIB",
          capacity: 20,
          participants: 14,
          is_open: true,
          transport_confirmed: true,
        },
      ],
    },
  },
  {
    id: "sync",
    name: "Sinkronisasi DLH / Mitra Pengangkut",
    method: "POST",
    path: "/api/v1/sync/schedules",
    description:
      "Webhook / Ingestion API untuk sistem kebersihan daerah (DLH / vendor armada) guna memperbarui jadwal ritasi secara otomatis tanpa entri manual.",
    auth: "API Key / Token",
    bodyExample: {
      source_agency: "Dinas Lingkungan Hidup Kota",
      region_id: "wilayah-pusat-01",
      schedules: [
        {
          service_type: "Truk Kompaksi Organik",
          target_zone: "Zona Utama Pasar & Perumahan",
          weekdays: [1, 3, 5],
          start_time: "06:30",
          end_time: "09:00",
          effective_until: "2026-12-31",
        },
      ],
    },
    responseExample: {
      status: "success",
      code: 200,
      message: "Berhasil melakukan sinkronisasi 1 aturan jadwal dari Dinas Lingkungan Hidup Kota.",
      details: {
        synced_records: 1,
        batch_id: "SYNC-1729418291000",
        interoperability_standard: "OpenGov-WasteData-v1.0",
      },
    },
  },
];

export function ApiDocsView() {
  const [selectedId, setSelectedId] = useState("schedules");
  const [tab, setTab] = useState<"curl" | "js" | "python">("curl");
  const [copied, setCopied] = useState(false);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveResult, setLiveResult] = useState<string | null>(null);

  const endpoint = ENDPOINTS.find((e) => e.id === selectedId) || ENDPOINTS[0];
  const host = typeof window !== "undefined" ? window.location.origin : "https://sampah-terhubung.id";

  const getCurlCode = () => {
    if (endpoint.method === "GET") {
      return `curl -X GET "${host}${endpoint.path}" \\\n  -H "Accept: application/json"`;
    }
    return `curl -X POST "${host}${endpoint.path}" \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -d '${JSON.stringify(endpoint.bodyExample, null, 2)}'`;
  };

  const getJsCode = () => {
    if (endpoint.method === "GET") {
      return `const response = await fetch("${host}${endpoint.path}");\nconst data = await response.json();\nconsole.log(data);`;
    }
    return `const response = await fetch("${host}${endpoint.path}", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json",\n    "Authorization": "Bearer YOUR_API_KEY"\n  },\n  body: JSON.stringify(${JSON.stringify(endpoint.bodyExample, null, 4)})\n});\nconst result = await response.json();\nconsole.log(result);`;
  };

  const getPythonCode = () => {
    if (endpoint.method === "GET") {
      return `import requests\n\nres = requests.get("${host}${endpoint.path}")\nprint(res.json())`;
    }
    return `import requests\n\npayload = ${JSON.stringify(endpoint.bodyExample, null, 4)}\nheaders = {"Authorization": "Bearer YOUR_API_KEY"}\n\nres = requests.post("${host}${endpoint.path}", json=payload, headers=headers)\nprint(res.json())`;
  };

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
    try {
      if (endpoint.method === "GET") {
        const res = await fetch(endpoint.path);
        const data = await res.json();
        setLiveResult(JSON.stringify(data, null, 2));
      } else {
        const res = await fetch(endpoint.path, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(endpoint.bodyExample),
        });
        const data = await res.json();
        setLiveResult(JSON.stringify(data, null, 2));
      }
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
    <div className="space-y-6">
      <SectionTitle
        eyebrow="Standar Terbuka & Interoperabilitas"
        title="Dokumentasi REST API Sampah Terhubung"
        description="Akses terstandar data jadwal ritasi, feed pelaporan warga, dan webhook sinkronisasi armada untuk dinas daerah atau sistem smart city (Kompatibel OpenGov standard)."
      />

      {/* Highlights Bar */}
      <div className="grid sm:grid-cols-3 gap-3">
        <Card className="flex items-center gap-3 p-3 text-sm">
          <Globe className="text-teal-600 shrink-0" size={20} />
          <div>
            <div className="font-semibold text-slate-800">CORS Diaktifkan</div>
            <div className="text-xs text-slate-500">Dapat diakses dari browser mana pun</div>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-3 text-sm">
          <Shield className="text-teal-600 shrink-0" size={20} />
          <div>
            <div className="font-semibold text-slate-800">Zona Waktu WIB (+07:00)</div>
            <div className="text-xs text-slate-500">Serialisasi ISO 8601 terstandar</div>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-3 text-sm">
          <Terminal className="text-teal-600 shrink-0" size={20} />
          <div>
            <div className="font-semibold text-slate-800">Open Data Ready</div>
            <div className="text-xs text-slate-500">Mendukung integrasi SIMPAN / DLH</div>
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

            {endpoint.bodyExample && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Format Body (JSON)
                </h4>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-xs font-mono overflow-x-auto max-h-56">
                  {JSON.stringify(endpoint.bodyExample, null, 2)}
                </pre>
              </div>
            )}

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Contoh Respon Berhasil (200 OK)
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
                  <span className="text-emerald-400 font-bold">200 OK</span>
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
              Format data mematuhi standar JSON RESTful dengan stempel waktu ISO 8601 Asia/Jakarta (WIB).
              Sistem luar (Dinas Lingkungan Hidup, armada swasta, maupun RT/RW) dapat melakukan sinkronisasi data jadwal dua arah tanpa kendala format (*plug and play*).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
