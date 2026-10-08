import { CheckCircle2, Clock3, AlertCircle } from "lucide-react";
import Image from "next/image";
import { labels, dateTime, type Photo, type History } from "@/lib/types";
export function Status({ value }: { value: string }) {
  const good = ["closed", "completed", "validated"].includes(value);
  const bad = ["rejected", "superseded"].includes(value);
  const Icon = good ? CheckCircle2 : bad ? AlertCircle : Clock3;
  return (
    <span className={"badge " + (good ? "good" : bad ? "bad" : "warn")}>
      <Icon size={14} />
      {labels[value] || value}
    </span>
  );
}
export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="empty">
      <p>{children}</p>
    </div>
  );
}
export function PhotoStrip({ photos }: { photos: Photo[] }) {
  return photos.length ? (
    <div className="photo-strip">
      {photos.map((p, index) => (
        <a
          key={p.id}
          href={"/api/photos/" + p.id}
          target="_blank"
          rel="noreferrer"
          aria-label={"Lihat foto bukti " + (index + 1)}
        >
          <Image
            src={"/api/photos/" + p.id}
            alt={"Bukti penanganan " + (index + 1)}
            width={130}
            height={95}
            unoptimized
          />
        </a>
      ))}
    </div>
  ) : null;
}
export function Timeline({ history }: { history: History[] }) {
  return (
    <ol className="timeline">
      {history.map((h) => (
        <li key={h.id}>
          <strong>{h.action}</strong>
          <small>{dateTime(h.created_at)}</small>
          <p>{h.note}</p>
        </li>
      ))}
    </ol>
  );
}
export function SectionTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="section-title">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
        {description && <p className="muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
