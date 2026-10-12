import { z } from "zod";
const id = z.uuid();
const text = z
  .string()
  .trim()
  .min(3, "Isi sedikitnya 3 karakter.")
  .max(2000, "Maksimal 2000 karakter.");
export const evidenceTime = z.iso
  .datetime({ offset: true })
  .refine(
    (value) =>
      Number.isFinite(Date.parse(value)) && Number(value.slice(0, 4)) >= 1,
    "Gunakan waktu yang sah.",
  );
const time = evidenceTime;
const date = z.iso.date();
const hhmm = z
  .string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Gunakan jam yang sah.");
const version = z.number().int().positive();
const coords = {
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
};
const photos = z
  .array(id)
  .min(1, "Tambahkan setidaknya satu foto.")
  .max(3, "Maksimal tiga foto.");
const keyed = { id, version };
const reason = { reason: text };
const commandSchemas = {
  "report.create": z
    .object({
      region_id: id,
      category: z.enum([
        "Penumpukan",
        "Tempat sampah penuh",
        "Sampah berserakan",
      ]),
      landmark: text,
      description: text.min(10, "Jelaskan sedikitnya 10 karakter."),
      observed_at: time,
      photos,
      evidence_mode: z.enum(["direct", "supporting"]),
      supporting_reason: text.optional(),
      location_confirmed: z.literal(true, {
        error: "Konfirmasikan lokasi kejadian.",
      }),
      device_lat: z.number().min(-90).max(90).nullable().optional(),
      device_lng: z.number().min(-180).max(180).nullable().optional(),
      device_accuracy_m: z
        .number()
        .nonnegative()
        .finite()
        .nullable()
        .optional(),
      device_measured_at: time.nullable().optional(),
      ...coords,
    })
    .superRefine((p, ctx) => {
      if ((p.lat == null) !== (p.lng == null))
        ctx.addIssue({
          code: "custom",
          path: ["lat"],
          message: "Isi kedua koordinat kejadian atau gunakan patokan manual.",
        });
      const snapshot = [
        p.device_lat,
        p.device_lng,
        p.device_accuracy_m,
        p.device_measured_at,
      ];
      if (
        (snapshot.some((v) => v != null) && snapshot.some((v) => v == null)) ||
        (p.evidence_mode === "direct" && snapshot.some((v) => v == null))
      )
        ctx.addIssue({
          code: "custom",
          path: ["device_lat"],
          message: "Ambil lokasi perangkat atau gunakan bukti pendukung.",
        });
      if (p.evidence_mode === "supporting" && !p.supporting_reason)
        ctx.addIssue({
          code: "custom",
          path: ["supporting_reason"],
          message: "Isi alasan penggunaan bukti pendukung.",
        });
    }),
  "report.validate": z
    .object({
      ...keyed,
      incident_id: id.optional(),
      point_id: id.optional(),
      public_label: text.optional(),
    })
    .refine((p) => !!p.incident_id || !!p.public_label, {
      message: "Isi patokan publik atau pilih insiden terbuka.",
      path: ["public_label"],
    }),
  "report.reject": z.object({ ...keyed, ...reason }),
  "incident.assign": z.object({
    ...keyed,
    worker_id: id,
    due_at: time,
    ...reason,
  }),
  "task.accept": z.object(keyed),
  "task.reject": z.object({ ...keyed, ...reason }),
  "task.block": z.object({ ...keyed, ...reason }),
  "task.evidence": z
    .object({
      ...keyed,
      action_taken: text.min(5),
      performed_at: time,
      moved: z.boolean(),
      destination: text.optional(),
      photos,
    })
    .refine((p) => !p.moved || !!p.destination, {
      path: ["destination"],
      message: "Isi tujuan pengangkutan.",
    }),
  "incident.review": z.object({ ...keyed, ...reason, approved: z.boolean() }),
  "incident.reopen": z.object({ ...keyed, ...reason }),
  "report.feedback": z.object({ id, ...reason }),
  "feedback.review": z.object({ id, ...reason }),
  "schedule.save": z.object({
    id: id.optional(),
    version: version.optional(),
    region_id: id,
    service: text,
    zone: text,
    weekdays: z.array(z.number().int().min(0).max(6)).min(1).max(7),
    start_time: hhmm,
    end_time: hhmm,
    valid_from: date,
    valid_until: date,
    source: text,
    confirmed: z.boolean(),
    worker_id: id.optional(),
  }),
  "schedule.exception": z.object({
    id,
    date,
    cancelled: z.boolean(),
    start_time: hhmm.optional(),
    end_time: hhmm.optional(),
    ...reason,
  }),
  "schedule.run": z.object({ id, date, actual_at: time, ...reason }),
  "prevention.create": z.object({
    point_id: id,
    hypothesis: text,
    basis: text,
    action: text,
    pic: text,
    evaluate_on: date,
  }),
  "prevention.evaluate": z.object({ ...keyed, result: text }),
  "event.create": z.object({
    region_id: id,
    point_id: id.optional(),
    incident_id: id.optional(),
    title: text,
    location: text,
    starts_at: time,
    capacity: z.number().int().min(1).max(500),
    pic: text,
    duties: text,
    equipment: text,
    transporter: z.string().max(2000),
    pickup_at: time.optional(),
    destination: z.string().max(2000),
    transport_confirmed: z.boolean(),
  }),
  "event.transport": z.object({
    ...keyed,
    transporter: text,
    pickup_at: time,
    destination: text,
    transport_confirmed: z.boolean(),
  }),
  "event.publish": z.object(keyed),
  "event.join": z.object({ id }),
  "event.leave": z.object({ id }),
  "event.complete": z.object({
    ...keyed,
    performed_at: time,
    completion_note: text,
    transport_status: z.enum([
      "Sudah diangkut",
      "Tertunda — perlu tindak lanjut",
    ]),
    photos,
  }),
  "event.duty": z.object({ ...keyed, user_id: id, duty: text }),
  "notification.read": z.object({ id }),
  "admin.region": z.object({
    id: id.optional(),
    version: version.optional(),
    name: text.optional(),
    coverage: text.optional(),
    owner_label: text.optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    active: z.boolean(),
    recurrence_count: z.number().int().min(2).max(20).optional(),
    recurrence_days: z.number().int().min(1).max(365).optional(),
    ...reason,
  }),
  "admin.membership": z.object({
    region_id: id,
    user_id: id,
    role: z.enum(["coordinator", "worker"]),
    active: z.boolean(),
    ...reason,
  }),
  "admin.moderate": z.object({
    id,
    entity_type: z.enum(["report", "incident"]),
    hidden: z.boolean(),
    ...reason,
  }),
};
export type Operation = keyof typeof commandSchemas;
export function validateCommand(data: unknown) {
  const envelope = z
    .object({ request_key: id, p: z.record(z.string(), z.unknown()) })
    .parse(data);
  const op = z
    .enum(Object.keys(commandSchemas) as [Operation, ...Operation[]])
    .parse(envelope.p.op);
  const { op: _op, ...fields } = envelope.p;
  void _op;
  return {
    request_key: envelope.request_key,
    p: { ...commandSchemas[op].parse(fields), op },
  };
}
