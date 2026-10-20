"use client";
import { useEffect, useRef, useState } from "react";
import type { Region } from "@/lib/types";
export default function LocationMap({
  region,
  onPick,
}: {
  region: Region;
  onPick?: (lat: number, lng: number) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let map: import("leaflet").Map | undefined,
      disposed = false;
    import("leaflet")
      .then((L) => {
        if (disposed || !root.current) return;
        map = L.map(root.current).setView([region.lat, region.lng], 15);
        const tiles = L.tileLayer(
          "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            maxZoom: 19,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
        ).addTo(map);
        tiles.on("tileerror", () => setFailed(true));
        L.circleMarker([region.lat, region.lng], {
          radius: 12,
          color: "#166534",
          fillColor: "#166534",
          fillOpacity: 0.2,
        })
          .addTo(map)
          .bindTooltip("Pusat wilayah simulasi, bukan batas layanan");
        if (onPick) {
          let marker: import("leaflet").CircleMarker | undefined;
          map.on("click", (event: import("leaflet").LeafletMouseEvent) => {
            marker?.remove();
            marker = L.circleMarker(event.latlng, {
              radius: 8,
              color: "#166534",
            }).addTo(map!);
            onPick(event.latlng.lat, event.latlng.lng);
          });
        }
      })
      .catch(() => setFailed(true));
    return () => {
      disposed = true;
      map?.remove();
    };
  }, [region.id, region.lat, region.lng, onPick]);
  return (
    <>
      <div
        ref={root}
        className="map"
        role="region"
        tabIndex={0}
        aria-label={"Peta interaktif pusat " + region.name + " (" + region.coverage + ")"}
      />
      <div className="visually-hidden" aria-live="polite">
        Peta wilayah {region.name}. Koordinat pusat: lintang {region.lat}, bujur {region.lng}. {region.coverage}.
      </div>
      {failed && (
        <p className="notice warn" role="status">
          Peta tidak tersedia. Gunakan daftar wilayah dan patokan manual.
        </p>
      )}
      <small>
        Pusat wilayah adalah titik ilustrasi.{" "}
        {onPick
          ? "Klik peta untuk memilih koordinat; patokan tetap wajib."
          : "Cakupan layanan tercantum pada informasi wilayah."}
      </small>
    </>
  );
}
