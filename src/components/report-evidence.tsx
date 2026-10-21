"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActionForm, localDateTime } from "./forms";
type Point = { lat: number; lng: number };
type Snapshot = Point & { accuracy: number; measured: string };
type Evidence = {
  file: File;
  source: "camera_web" | "upload";
  captured_at?: string;
  url: string;
};
export function ReportEvidence({
  regionId,
  coords,
  onLocation,
  active,
  onDone,
  onAuthRequired,
}: {
  regionId: string;
  coords: Point | null;
  onLocation: (lat: number, lng: number) => void;
  active: boolean;
  onDone: () => void;
  onAuthRequired: () => void;
}) {
  const [mode, setMode] = useState<"direct" | "supporting">("direct"),
    [snapshot, setSnapshot] = useState<Snapshot | null>(null),
    [files, setFiles] = useState<Evidence[]>([]),
    [message, setMessage] = useState(""),
    [camera, setCamera] = useState(false),
    [pending, setPending] = useState(false),
    [gpsBusy, setGpsBusy] = useState(false),
    [busy, setBusy] = useState(false),
    [frame, setFrame] = useState<Evidence | null>(null);
  const video = useRef<HTMLVideoElement>(null),
    stream = useRef<MediaStream | null>(null),
    cameraGeneration = useRef(0),
    gpsGeneration = useRef(0),
    urls = useRef(new Set<string>()),
    cameraTimer = useRef<number | undefined>(undefined),
    gpsTimer = useRef<number | undefined>(undefined);
  const stopCamera = useCallback(() => {
    cameraGeneration.current++;
    window.clearTimeout(cameraTimer.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    if (video.current) video.current.srcObject = null;
    setCamera(false);
    setPending(false);
  }, []);
  function release(url: string) {
    URL.revokeObjectURL(url);
    urls.current.delete(url);
  }
  function preview(
    file: File,
    source: Evidence["source"],
    captured_at?: string,
  ) {
    const url = URL.createObjectURL(file);
    urls.current.add(url);
    return { file, source, captured_at, url };
  }
  useEffect(() => {
    if (!active) {
      gpsGeneration.current++;
      window.clearTimeout(gpsTimer.current);
      queueMicrotask(() => {
        stopCamera();
        setGpsBusy(false);
      });
    }
  }, [active, stopCamera]);
  useEffect(() => {
    function background() {
      if (document.hidden) {
        stopCamera();
        gpsGeneration.current++;
        window.clearTimeout(gpsTimer.current);
        setGpsBusy(false);
      }
    }
    document.addEventListener("visibilitychange", background);
    const objectUrls = urls.current;
    const cameraRequest = cameraGeneration;
    const gpsRequest = gpsGeneration;
    return () => {
      document.removeEventListener("visibilitychange", background);
      cameraRequest.current++;
      gpsRequest.current++;
      window.clearTimeout(cameraTimer.current);
      window.clearTimeout(gpsTimer.current);
      stream.current?.getTracks().forEach((t) => t.stop());
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [stopCamera]);
  async function openCamera() {
    stopCamera();
    setMessage("");
    if (frame) {
      release(frame.url);
      setFrame(null);
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage(
        "Kamera web tidak tersedia. Gunakan jalur bukti pendukung dengan foto unggahan.",
      );
      return;
    }
    const generation = ++cameraGeneration.current;
    setCamera(true);
    setPending(true);
    cameraTimer.current = window.setTimeout(() => {
      if (generation === cameraGeneration.current) {
        stopCamera();
        setMessage(
          "Izin kamera belum selesai. Tutup prompt browser bila perlu, coba lagi atau gunakan bukti pendukung.",
        );
      }
    }, 20000);
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      if (generation !== cameraGeneration.current) {
        media.getTracks().forEach((t) => t.stop());
        return;
      }
      window.clearTimeout(cameraTimer.current);
      stream.current = media;
      setPending(false);
      if (video.current) {
        video.current.srcObject = media;
        await video.current.play();
      }
    } catch (error) {
      if (generation !== cameraGeneration.current) return;
      stopCamera();
      setMessage(
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "Izin kamera ditolak. Izinkan melalui browser atau gunakan bukti pendukung."
          : "Kamera tidak dapat digunakan atau sedang dipakai aplikasi lain. Coba lagi atau gunakan bukti pendukung.",
      );
    }
  }
  async function capture() {
    if (!video.current?.videoWidth || !video.current.videoHeight) {
      setMessage("Preview kamera belum siap. Tunggu gambar atau tutup kamera.");
      return;
    }
    const generation = cameraGeneration.current,
      canvas = document.createElement("canvas");
    const scale = Math.min(
      1,
      1920 / Math.max(video.current.videoWidth, video.current.videoHeight),
    );
    canvas.width = Math.round(video.current.videoWidth * scale);
    canvas.height = Math.round(video.current.videoHeight * scale);
    const context = canvas.getContext("2d");
    if (!context) {
      setMessage("Pengambilan foto tidak tersedia. Gunakan bukti pendukung.");
      return;
    }
    context.drawImage(video.current, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    if (generation !== cameraGeneration.current) return;
    if (!blob || blob.size > 5242880) {
      setMessage(
        "Foto belum dapat diproses. Ambil ulang atau gunakan bukti pendukung.",
      );
      return;
    }
    if (frame) release(frame.url);
    setFrame(
      preview(
        new File([blob], "kamera.jpg", { type: "image/jpeg" }),
        "camera_web",
        new Date().toISOString(),
      ),
    );
    stopCamera();
  }
  function locate() {
    const generation = ++gpsGeneration.current;
    setMessage("");
    setGpsBusy(true);
    if (!navigator.geolocation) {
      setGpsBusy(false);
      setMessage(
        "Lokasi perangkat tidak tersedia. Gunakan patokan manual pada jalur bukti pendukung.",
      );
      return;
    }
    window.clearTimeout(gpsTimer.current);
    gpsTimer.current = window.setTimeout(() => {
      if (generation === gpsGeneration.current) {
        gpsGeneration.current++;
        setGpsBusy(false);
        setMessage(
          "Permintaan lokasi belum selesai. Coba lagi atau gunakan bukti pendukung.",
        );
      }
    }, 20000);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        if (generation !== gpsGeneration.current) return;
        window.clearTimeout(gpsTimer.current);
        setGpsBusy(false);
        const { latitude: lat, longitude: lng, accuracy } = p.coords;
        if (
          !Number.isFinite(lat) ||
          Math.abs(lat) > 90 ||
          !Number.isFinite(lng) ||
          Math.abs(lng) > 180 ||
          !Number.isFinite(accuracy) ||
          accuracy < 0 ||
          !Number.isFinite(new Date(p.timestamp).getTime())
        ) {
          setMessage(
            "Hasil lokasi tidak dapat dibaca. Coba lagi atau gunakan bukti pendukung.",
          );
          return;
        }
        setSnapshot({
          lat,
          lng,
          accuracy,
          measured: new Date(p.timestamp).toISOString(),
        });
        if (!coords) onLocation(lat, lng);
      },
      (error) => {
        if (generation !== gpsGeneration.current) return;
        window.clearTimeout(gpsTimer.current);
        setGpsBusy(false);
        setMessage(
          error.code === 1
            ? "Izin lokasi ditolak. Pilih bukti pendukung dan isi patokan manual."
            : error.code === 3
              ? "Pengukuran lokasi melewati batas waktu. Coba lagi atau gunakan bukti pendukung."
              : "Lokasi perangkat belum dapat ditentukan. Coba lagi atau gunakan bukti pendukung.",
        );
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
    );
  }
  const payload = {
    region_id: regionId,
    ...(coords || {}),
    evidence_mode: mode,
    ...(snapshot
      ? {
          device_lat: snapshot.lat,
          device_lng: snapshot.lng,
          device_accuracy_m: snapshot.accuracy,
          device_measured_at: snapshot.measured,
        }
      : {}),
  };
  return (
    <>
      <fieldset disabled={busy}>
        <legend>Sumber bukti laporan</legend>
        <button
          type="button"
          className={"button " + (mode === "direct" ? "primary" : "secondary")}
          aria-pressed={mode === "direct"}
          onClick={() => setMode("direct")}
        >
          Laporan langsung
        </button>{" "}
        <button
          type="button"
          className="text-button"
          aria-pressed={mode === "supporting"}
          onClick={() => {
            stopCamera();
            setMode("supporting");
          }}
        >
          Gunakan bukti pendukung
        </button>
        <p>
          {mode === "direct"
            ? "Lampirkan lokasi perangkat dan setidaknya satu foto dari kamera web. Tetap perlu pemeriksaan koordinator."
            : "Untuk kendala kamera/lokasi atau saat sudah meninggalkan lokasi. Isi patokan, waktu pengamatan dan alasan; koordinator memeriksa konteks yang belum lengkap."}
        </p>
        <button
          type="button"
          className="button secondary"
          onClick={locate}
          disabled={gpsBusy}
        >
          {gpsBusy
            ? "Mengukur lokasi…"
            : snapshot
              ? "Ukur lokasi lagi"
              : "Lampirkan lokasi perangkat"}
        </button>
        <p className="small-muted">
          Lokasi diminta setelah Anda menekan tombol ini, untuk konteks
          pemeriksaan laporan; tidak dilacak di background.
        </p>
        {gpsBusy && (
          <button
            type="button"
            className="text-button"
            onClick={() => {
              gpsGeneration.current++;
              window.clearTimeout(gpsTimer.current);
              setGpsBusy(false);
            }}
          >
            Batalkan lokasi
          </button>
        )}
        {snapshot && (
          <p>
            Lokasi perangkat: {snapshot.lat.toFixed(5)},{" "}
            {snapshot.lng.toFixed(5)}. Perkiraan ketelitian ±
            {Math.round(snapshot.accuracy)} meter; diukur{" "}
            {new Date(snapshot.measured).toLocaleString("id-ID")}. Ukur lagi
            bila berpindah atau sudah lama menunggu. Pin kejadian dapat berbeda
            dan tidak mengganti snapshot ini.
          </p>
        )}
        <p className="small-muted">
          Pusat wilayah hanya ilustrasi, bukan batas layanan. Kesesuaian wilayah
          perlu dikonfirmasi pengelola.
        </p>
        <button
          type="button"
          className="button secondary"
          onClick={openCamera}
          disabled={files.length >= 3 || camera}
        >
          Ambil foto
        </button>
        <div className="camera-panel" hidden={!camera}>
          <video
            ref={video}
            autoPlay
            muted
            playsInline
            aria-label="Preview kamera, tanpa audio"
          />
          <p>
            {pending
              ? "Menunggu izin kamera…"
              : "Arahkan ke sampah dan patokan lingkungan; hindari wajah atau identitas pribadi."}
          </p>
          <button
            type="button"
            className="button primary"
            disabled={pending}
            onClick={capture}
          >
            Ambil gambar
          </button>{" "}
          <button
            type="button"
            className="button secondary"
            onClick={stopCamera}
          >
            Tutup kamera
          </button>
        </div>
        {frame && (
          <div>
            <img
              className="capture-preview"
              src={frame.url}
              alt="Preview foto yang baru ditangkap"
            />
            <button
              type="button"
              className="button primary"
              disabled={files.length >= 3}
              onClick={() => {
                setFiles((previous) => [...previous, frame]);
                setFrame(null);
              }}
            >
              Gunakan foto
            </button>{" "}
            <button type="button" className="text-button" onClick={openCamera}>
              Ambil ulang
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() => {
                release(frame.url);
                setFrame(null);
              }}
            >
              Batalkan foto
            </button>
          </div>
        )}
        {mode === "supporting" && (
          <label>
            Foto pendukung (JPG, PNG, WebP)
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => {
                const chosen = Array.from(e.target.files || []);
                if (
                  files.length + chosen.length > 3 ||
                  chosen.some(
                    (f) =>
                      f.size === 0 ||
                      f.size > 5242880 ||
                      !["image/jpeg", "image/png", "image/webp"].includes(
                        f.type,
                      ),
                  )
                ) {
                  setMessage(
                    "Gunakan maksimal tiga foto JPG/PNG/WebP, masing-masing maksimal 5 MB.",
                  );
                  return;
                }
                setFiles((previous) => [
                  ...previous,
                  ...chosen.map((f) => preview(f, "upload")),
                ]);
                e.target.value = "";
              }}
            />
          </label>
        )}
        {files.map((f, i) => (
          <div className="evidence-photo" key={f.url}>
            <img src={f.url} alt={"Foto laporan " + (i + 1)} />
            <span>
              {f.source === "camera_web"
                ? "Foto melalui kamera web"
                : "Foto unggahan"}
            </span>
            <button
              type="button"
              className="text-button"
              onClick={() => {
                release(f.url);
                setFiles((previous) =>
                  previous.filter((_, index) => index !== i),
                );
              }}
            >
              Hapus foto {i + 1}
            </button>
          </div>
        ))}
        {message && (
          <p className="notice warn" role="status">
            {message}
          </p>
        )}
      </fieldset>
      <ActionForm
        op="report.create"
        fixed={payload}
        photos
        photoSelection={files}
        onBusyChange={(value) => {
          setBusy(value);
          if (value) stopCamera();
        }}
        onAuthRequired={onAuthRequired}
        onDone={onDone}
        label="Kirim laporan"
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
            initial: localDateTime(),
          },
          {
            name: "landmark",
            label: "Lokasi atau patokan",
            required: true,
            hint: "Isi patokan kejadian, tanpa kontak atau identitas pribadi.",
          },
          {
            name: "description",
            label: "Apa yang Anda lihat?",
            type: "textarea",
            required: true,
            hint: "Minimal 10 karakter.",
          },
          ...(mode === "supporting"
            ? [
                {
                  name: "supporting_reason",
                  label: "Alasan menggunakan bukti pendukung",
                  type: "textarea" as const,
                  required: true,
                },
              ]
            : []),
          {
            name: "location_confirmed",
            label: "Saya telah memeriksa lokasi/patokan kejadian",
            type: "checkbox",
            required: true,
          },
        ]}
      />
    </>
  );
}
