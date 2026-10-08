"use client";
import { useId, useRef, useState } from "react";
import type { Operation } from "@/lib/validation";
export interface Field {
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
  const result = await response.json();
  if (!response.ok)
    throw new ApiError(result.error || "Permintaan gagal.", result.fields);
  return result;
}
export const localDateTime = (date = new Date()) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
export function ActionForm({
  op,
  fixed = {},
  fields = [],
  label = "Simpan",
  photos = false,
  onDone,
  auth = false,
  tone = "primary",
}: {
  op: Operation | string;
  fixed?: Payload;
  fields?: Field[];
  label?: string;
  photos?: boolean;
  onDone: () => void;
  auth?: boolean;
  tone?: string;
}) {
  const prefix = useId();
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [success, setSuccess] = useState(false);
  const key = useRef<string | null>(null),
    lastPayload = useRef(""),
    photoIds = useRef<string[]>([]);
  const inFlight = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setMessage("");
    setErrors({});
    setSuccess(false);
    const form = event.currentTarget,
      data = new FormData(form);
    const p: Payload = { ...fixed };
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
              ? new Date(String(raw)).toISOString()
              : String(raw);
      }
      // Weekday entries are converted from a clear comma-separated input for a small pilot.
      if (typeof p.weekdays === "string")
        p.weekdays = p.weekdays.split(",").map((day) => Number(day.trim()));
      if (photos) {
        const files = data
          .getAll("photos")
          .filter((f): f is File => f instanceof File && f.size > 0);
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
        if (!photoIds.current.length) {
          const upload = new FormData();
          for (const f of files) upload.append("photos", f);
          photoIds.current = (await api("/api/photos", upload)).ids;
        }
        p.photos = photoIds.current;
      }
      if (auth) {
        const result = await api("/api/auth", { ...p, action: op });
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
      photoIds.current = [];
      key.current = null;
      lastPayload.current = "";
      form.reset();
      onDone();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Permintaan gagal. Coba lagi.",
      );
      if (error instanceof ApiError) setErrors(error.fields);
    } finally {
      inFlight.current = false;
      setBusy(false);
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
                field.type === "password"
                  ? "current-password"
                  : field.type === "email"
                    ? "email"
                    : undefined
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
      {photos && (
        <div className="field">
          <label htmlFor={prefix + "-photos"}>Foto bukti (1–3) *</label>
          <input
            id={prefix + "-photos"}
            name="photos"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            required
            onChange={() => {
              photoIds.current = [];
            }}
            aria-invalid={!!errors.photos}
            aria-describedby={prefix + "-photos-help"}
          />
          <small id={prefix + "-photos-help"}>
            Maksimal 5 MB per foto. Hindari wajah, pelat kendaraan, dan bagian
            rumah yang tidak diperlukan.
          </small>
          {errors.photos && <p className="field-error">{errors.photos}</p>}
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
