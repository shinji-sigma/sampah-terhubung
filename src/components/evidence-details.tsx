import { dateTime, type Report } from "@/lib/types";
export function EvidenceDetails({ report: r }: { report: Report }) {
  const hasDevice = r.device_lat != null && r.device_lng != null;
  const hasIncident = r.lat != null && r.lng != null;
  return (
    <details className="evidence-details">
      <summary>
        {r.evidence_mode === "direct"
          ? "Laporan langsung"
          : r.evidence_mode === "supporting"
            ? "Bukti pendukung"
            : "Sumber bukti tidak dicatat"}
      </summary>
      {r.supporting_reason && (
        <p>Alasan jalur pendukung: {r.supporting_reason}</p>
      )}
      <p>
        Lokasi kejadian:{" "}
        {hasIncident
          ? `${r.lat!.toFixed(5)}, ${r.lng!.toFixed(5)}`
          : "Patokan manual"}{" "}
        · {r.landmark}
      </p>
      <p>
        Lokasi perangkat:{" "}
        {hasDevice
          ? `${r.device_lat!.toFixed(5)}, ${r.device_lng!.toFixed(5)}`
          : "Tidak dicatat"}
      </p>
      {hasDevice && (
        <p>
          Perkiraan ketelitian ±{Math.round(r.device_accuracy_m!)} meter. Diukur
          perangkat: {dateTime(r.device_measured_at)}.
        </p>
      )}
      {hasDevice && hasIncident && (
        <p>
          {r.lat === r.device_lat && r.lng === r.device_lng
            ? "Pin kejadian sama dengan snapshot perangkat."
            : "Pin kejadian berbeda dari snapshot perangkat; periksa patokan dan konteksnya."}
        </p>
      )}
      <p>
        Diterima server: {dateTime(r.created_at)}. Lokasi{" "}
        {r.location_confirmed
          ? "dikonfirmasi pelapor"
          : "belum dicatat sebagai konfirmasi"}
        .
      </p>
      <p className="small-muted">
        Metadata sumber dan waktu perangkat adalah keterangan klien. Kesesuaian
        wilayah dan kondisi tetap perlu pemeriksaan koordinator; pusat wilayah
        bukan batas layanan.
      </p>
    </details>
  );
}
