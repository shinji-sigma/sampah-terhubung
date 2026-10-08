export type Role = "coordinator" | "worker";
export interface Region {
  id: string;
  name: string;
  coverage: string;
  active: boolean;
  owner_label: string;
  lat: number;
  lng: number;
  recurrence_count: number;
  recurrence_days: number;
  version: number;
}
export interface Profile {
  id: string;
  display_name: string;
  is_admin: boolean;
}
export interface Membership {
  user_id: string;
  region_id: string;
  role: Role;
  active: boolean;
}
export interface Point {
  id: string;
  region_id: string;
  label: string;
  lat: number | null;
  lng: number | null;
}
export interface Incident {
  id: string;
  region_id: string;
  point_id: string;
  status: string;
  public_label: string;
  verified_at: string;
  observed_at: string;
  closed_at: string | null;
  previous_incident_id: string | null;
  previous_closed_at: string | null;
  version: number;
  hidden: boolean;
  created_at: string;
}
export interface Report {
  id: string;
  region_id: string;
  reporter_id: string;
  incident_id: string | null;
  category: string;
  landmark: string;
  description: string;
  observed_at: string;
  status: string;
  reason: string | null;
  version: number;
  hidden: boolean;
  created_at: string;
  lat: number | null;
  lng: number | null;
}
export interface Task {
  id: string;
  region_id: string;
  incident_id: string;
  worker_id: string;
  status: string;
  due_at: string;
  accepted_at: string | null;
  blocker: string | null;
  reason: string | null;
  action_taken: string | null;
  performed_at: string | null;
  destination: string | null;
  moved: boolean;
  version: number;
  created_at: string;
}
export interface Schedule {
  id: string;
  region_id: string;
  service: string;
  zone: string;
  weekdays: number[];
  start_time: string;
  end_time: string;
  source: string;
  confirmed_at: string | null;
  valid_from: string;
  valid_until: string;
  worker_id?: string | null;
  version: number;
  updated_at: string;
}
export interface ScheduleException {
  id: string;
  schedule_id: string;
  date: string;
  cancelled: boolean;
  start_time: string | null;
  end_time: string | null;
  reason: string;
  created_at: string;
}
export interface ScheduleRun {
  id: string;
  schedule_id: string;
  date: string;
  actual_at: string;
  note: string;
}
export interface Prevention {
  id: string;
  point_id: string;
  hypothesis: string;
  basis: string;
  action: string;
  pic: string;
  evaluate_on: string;
  result: string | null;
  version: number;
}
export interface CleanupEvent {
  id: string;
  region_id: string;
  point_id: string | null;
  incident_id: string | null;
  title: string;
  location: string;
  starts_at: string;
  capacity: number;
  participants?: number;
  pic: string;
  duties: string;
  equipment: string;
  transporter: string;
  pickup_at: string | null;
  destination: string;
  transport_confirmed: boolean;
  status: string;
  transport_status: string | null;
  completion_note: string | null;
  version: number;
}
export interface Registration {
  event_id: string;
  user_id: string;
  duty: string;
}
export interface Photo {
  id: string;
  report_id: string | null;
  task_id: string | null;
  event_id: string | null;
  owner_id: string;
}
export interface History {
  id: number;
  entity_id: string;
  entity_type: string;
  action: string;
  note: string;
  created_at: string;
}
export interface Feedback {
  id: string;
  report_id: string;
  note: string;
  reviewed_at: string | null;
  review_note: string | null;
}
export interface Notification {
  id: string;
  message: string;
  read_at: string | null;
  created_at: string;
  entity_id: string | null;
}
export interface PublicData {
  regions: Region[];
  schedules: Schedule[];
  exceptions: ScheduleException[];
  runs: ScheduleRun[];
  incidents: Pick<Incident, "id" | "public_label" | "status" | "verified_at">[];
  events: CleanupEvent[];
}
export interface Workspace {
  profile: Profile;
  memberships: Membership[];
  profiles: Profile[];
  regions: Region[];
  points: Point[];
  reports: Report[];
  incidents: Incident[];
  tasks: Task[];
  feedback: Feedback[];
  schedules: Schedule[];
  exceptions: ScheduleException[];
  runs: ScheduleRun[];
  preventions: Prevention[];
  events: CleanupEvent[];
  registrations: Registration[];
  photos: Photo[];
  history: History[];
  notifications: Notification[];
}
export const labels: Record<string, string> = {
  pending: "Menunggu validasi",
  validated: "Terverifikasi",
  rejected: "Ditolak",
  verified: "Terverifikasi",
  assigned: "Ditugaskan",
  working: "Dikerjakan",
  awaiting_review: "Menunggu verifikasi",
  closed: "Selesai terverifikasi",
  offered: "Menunggu penerimaan",
  accepted: "Dikerjakan",
  superseded: "Dialihkan",
  submitted: "Menunggu verifikasi",
  draft: "Draf",
  published: "Pendaftaran dibuka",
  completed: "Kegiatan selesai",
};
export const dateTime = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Jakarta",
      }).format(new Date(value)) + " WIB"
    : "Belum dicatat";
export const shortId = (id: string) => id.slice(0, 8).toUpperCase();
export function incidentReference(id: string, ids: readonly string[]) {
  const normalized = id.replaceAll("-", "").toUpperCase();
  const peers = [
    ...new Set(ids.map((value) => value.replaceAll("-", "").toUpperCase())),
  ];
  // Include both ends; extend the prefix if another incident shares the label.
  for (let prefix = 4; prefix < normalized.length - 8; prefix++) {
    const label = normalized.slice(0, prefix) + "-" + normalized.slice(-8);
    if (
      !peers.some(
        (peer) =>
          peer !== normalized &&
          peer.slice(0, prefix) + "-" + peer.slice(-8) === label,
      )
    )
      return label;
  }
  return normalized;
}
export const dateLabel = (value: string) =>
  value
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "long",
        timeZone: "Asia/Jakarta",
      }).format(new Date(value + "T12:00:00+07:00"))
    : "Tanggal belum dipilih";
