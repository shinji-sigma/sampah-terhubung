"use client";
import { useId, useRef, useState } from "react";
import type { Operation } from "@/lib/validation";
import { uploadPhotoFiles } from "@/lib/photo-client";
export interface Field {
  autoComplete?: string;
  name: string;
  label: string;
  type?:
    | "text"
    | "textarea"
    | "datetime-local"
    | "date"
    | "time"
    | "number"
    | "select"
    | "checkbox"
    | "email"
    | "password";
  required?: boolean;
  hint?: string;
  initial?: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
}
type Payload = Record<string, unknown>;
export class ApiError extends Error {
  constructor(
    message: string,
    public fields: Record<string, string> = {},
    public status = 0,
  ) {
    super(message);
  }
}
export async function api(url: string, body?: unknown) {
  let response: Response;
  try {
    response = await fetch(
      url,
      body instanceof FormData
        ? { method: "POST", body }
        : body
          ? {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            }
          : { cache: "no-store" },
    );
  } catch {
    throw new ApiError("Koneksi terputus. Isian tetap tersedia; coba lagi.");
  }
  let result;
  try {
    result = await response.json();
    if (!result || typeof result !== "object") throw new Error();
  } catch {
    throw new ApiError(
      "Respons layanan tidak dapat dibaca. Isian tetap tersedia; coba lagi.",
    );
  }
  if (!response.ok)
    throw new ApiError(
      result.error || "Permintaan gagal.",
      result.fields,
      response.status,
    );
  return result;
}
export const localDateTime = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
};

export function parseWIB(datetimeStr: string): string {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(datetimeStr)) {
    const clean = datetimeStr.length === 16 ? datetimeStr + ":00" : datetimeStr;
    return new Date(clean + "+07:00").toISOString();
  }
  return new Date(datetimeStr).toISOString();
}
export function ActionForm({
  op,
  fixed = {},
  fields = [],
  label = "Simpan",
  photos = false,
  onDone,
  auth = false,
  tone = "primary",
  photoSelection,
  onAuthRequired,
  onBusyChange,
}: {
  op: Operation | string;
  fixed?: Payload;
  fields?: Field[];
  label?: string;
  photos?: boolean;
  onDone: (result?: { signed_in?: boolean }) => void;
  auth?: boolean;
  tone?: string;
  photoSelection?: {
    file: File;
    source: "camera_web" | "upload";
    captured_at?: string;
  }[];
  onAuthRequired?: () => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const prefix = useId();
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [success, setSuccess] = useState(false);
  const key = useRef<string | null>(null),
    lastPayload = useRef(""),
    uploadedPhotos = useRef(new Map<File, string>());
  const inFlight = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    onBusyChange?.(true);
    setMessage("");
    setErrors({});
    setSuccess(false);
    const form = event.currentTarget,
      data = new FormData(form);
    const p: Payload = { ...fixed };
    let completed;
    try {
      for (const field of fields) {
        const raw = data.get(field.name);
        if (field.type === "checkbox") {
          p[field.name] = raw === "on";
          continue;
        }
        if (raw === "" || raw === null) {
          if (field.required) p[field.name] = "";
          continue;
        }
        p[field.name] =
          field.type === "number"
            ? Number(raw)
            : field.type === "datetime-local"
              ? parseWIB(String(raw))
              : String(raw);
      }
      // Weekday entries are converted from a clear comma-separated input for a small pilot.
      if (typeof p.weekdays === "string")
        p.weekdays = p.weekdays.split(",").map((day) => Number(day.trim()));
      if (photos) {
        if (op === "report.create" && fixed.evidence_mode === "direct") {
          if (fixed.device_lat == null)
            throw new ApiError(
              "Lampirkan lokasi perangkat atau pilih bukti pendukung.",
            );
          if (!photoSelection?.some((photo) => photo.source === "camera_web"))
            throw new ApiError(
              "Ambil setidaknya satu foto melalui kamera web atau pilih bukti pendukung.",
            );
        }
        const files =
          photoSelection?.map((p) => p.file) ||
          Array.from(
            form.querySelector<HTMLInputElement>('input[name="photos"]')
              ?.files || [],
          );
        if (files.length < 1 || files.length > 3)
          throw new ApiError("Tambahkan 1–3 foto.", {
            photos: "Gunakan 1–3 foto JPG, PNG, atau WebP.",
          });
        if (
          files.some(
            (f) =>
              f.size > 5242880 ||
              !["image/jpeg", "image/png", "image/webp"].includes(f.type),
          )
        )
          throw new ApiError("Periksa berkas foto.", {
            photos: "Maksimal 5 MB per foto; gunakan JPG, PNG, atau WebP.",
          });
        p.photos = await uploadPhotoFiles(
          files,
          uploadedPhotos.current,
          (body) => api("/api/photos", body),
          photoSelection?.map(({ source, captured_at }) => ({
            source,
            captured_at,
          })),
        );
      }
      if (auth) {
        const result = await api("/api/auth", { ...p, action: op });
        completed = result;
        setMessage(result.message);
      } else {
        p.op = op;
        const serialized = JSON.stringify(p);
        if (serialized !== lastPayload.current) {
          lastPayload.current = serialized;
          key.current = crypto.randomUUID();
        }
        const result = await api("/api/commands", {
          p,
          request_key: key.current,
        });
        setMessage(result.message);
      }
      setSuccess(true);
      uploadedPhotos.current.clear();
      key.current = null;
      lastPayload.current = "";
      form.reset();
      onDone(completed);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Permintaan gagal. Coba lagi.",
      );
      if (error instanceof ApiError) setErrors(error.fields);
      if (error instanceof ApiError && error.status === 401) onAuthRequired?.();
      else
        requestAnimationFrame(() =>
          form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
        );
    } finally {
      inFlight.current = false;
      setBusy(false);
      onBusyChange?.(false);
    }
  }
  return (
    <form
      ref={formRef}
      onSubmit={submit}
      className="action-form"
      aria-busy={busy}
    >
      {fields.map((field) => (
        <div
          className={
            "field " + (field.type === "checkbox" ? "check-field" : "")
          }
          key={field.name}
        >
          <label htmlFor={prefix + "-" + field.name}>
            {field.label}
            {field.required && <span aria-hidden="true"> *</span>}
          </label>
          {field.type === "textarea" ? (
            <textarea
              id={prefix + "-" + field.name}
              name={field.name}
              rows={3}
              disabled={busy}
              required={field.required}
              defaultValue={field.initial}
              aria-invalid={!!errors[field.name]}
              aria-describedby={prefix + "-" + field.name + "-help"}
              maxLength={2000}
            />
          ) : field.type === "select" ? (
            <select
              id={prefix + "-" + field.name}
              name={field.name}
              required={field.required}
              disabled={busy}
              defaultValue={field.initial || ""}
              aria-invalid={!!errors[field.name]}
              aria-describedby={prefix + "-" + field.name + "-help"}
            >
              <option value="">
                {field.required ? "Pilih…" : "Tidak dipilih"}
              </option>
              {field.options?.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              id={prefix + "-" + field.name}
              name={field.name}
              type={field.type || "text"}
              disabled={busy}
              step={
                field.type === "number"
                  ? ["lat", "lng"].includes(field.name)
                    ? "any"
                    : "1"
                  : undefined
              }
              required={field.required}
              defaultValue={
                field.type === "checkbox" ? undefined : field.initial
              }
              defaultChecked={
                field.type === "checkbox" && field.initial === "true"
              }
              min={field.min}
              max={field.max}
              maxLength={field.type === "password" ? 128 : 2000}
              aria-invalid={!!errors[field.name]}
              aria-describedby={prefix + "-" + field.name + "-help"}
              autoComplete={
                field.autoComplete ||
                (field.type === "password"
                  ? auth && op === "signup"
                    ? "new-password"
                    : "current-password"
                  : field.type === "email"
                    ? "email"
                    : undefined)
              }
            />
          )}
          <div id={prefix + "-" + field.name + "-help"}>
            {field.hint && <small>{field.hint}</small>}
            {errors[field.name] && (
              <p className="field-error">{errors[field.name]}</p>
            )}
          </div>
        </div>
      ))}
      {photos && !photoSelection && (
        <div className="field">
          <label htmlFor={prefix + "-photos"}>Foto bukti (1–3) *</label>
          <input
            id={prefix + "-photos"}
            name="photos"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            required
            disabled={busy}
            onChange={() => {
              uploadedPhotos.current.clear();
            }}
            aria-invalid={!!errors.photos}
            aria-describedby={prefix + "-photos-help"}
          />
          <div id={prefix + "-photos-help"}>
            <small>
              Maksimal 5 MB per foto. Foto besar diperkecil sebelum dikirim satu
              per satu. Hindari wajah, pelat kendaraan, dan bagian rumah yang
              tidak diperlukan.
            </small>
            {errors.photos && <p className="field-error">{errors.photos}</p>}
          </div>
        </div>
      )}
      {message && (
        <p
          className={"notice " + (success ? "good" : "bad")}
          role={success ? "status" : "alert"}
        >
          {message}
        </p>
      )}
      {Object.entries(errors)
        .filter(
          ([name]) =>
            !fields.some((field) => field.name === name) &&
            (name !== "photos" || !!photoSelection),
        )
        .map(([name, error]) => (
          <p key={name} className="field-error" role="alert">
            {error}
          </p>
        ))}
      <button type="submit" className={"button " + tone} disabled={busy}>
        {busy ? "Menyimpan…" : label}
      </button>
    </form>
  );
}
export const reasonField: Field = {
  name: "reason",
  label: "Alasan atau hasil pemeriksaan",
  type: "textarea",
  required: true,
};
