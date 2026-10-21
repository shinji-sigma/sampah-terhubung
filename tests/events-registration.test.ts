import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement, isValidElement, type ReactNode } from "react";
import { ActionForm } from "../src/components/forms";
import { renderToStaticMarkup } from "react-dom/server";
import { Events } from "../src/components/events";
import type { CleanupEvent, Workspace } from "../src/lib/types";

const event: CleanupEvent = {
  id: "event-registration-regression",
  region_id: "region",
  point_id: null,
  incident_id: null,
  title: "Bersih lingkungan",
  location: "Balai warga",
  starts_at: "2026-11-01T08:00:00+07:00",
  capacity: 10,
  participants: 3,
  pic: "Koordinator",
  duties: "Membersihkan lingkungan",
  equipment: "Sarung tangan",
  transporter: "",
  pickup_at: null,
  destination: "",
  transport_confirmed: false,
  status: "published",
  transport_status: null,
  completion_note: null,
  version: 1,
};
const props = {
  events: [event],
  w: null,
  region: null,
  coordinator: false,
  refresh: () => {},
  login: () => {},
  now: new Date("2026-10-20T08:00:00+07:00"),
  onSchedule: () => {},
};

test("guests are told signup is unavailable instead of offered a non-persistent registration", () => {
  const html = renderToStaticMarkup(createElement(Events, props));
  assert.match(html, /Pendaftaran tamu belum tersedia/);
  assert.match(html, /Masuk dengan Akun/);
  assert.doesNotMatch(
    html,
    /Daftar Relawan Sekarang|Pendaftaran Relawan Berhasil|WhatsApp/,
  );
  assert.doesNotMatch(html, /role="dialog"|<input|<form/);
  assert.match(html, /3 \/ 10/);
});

function elements(
  node: ReactNode,
): React.ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  return [node, ...elements(node.props.children as ReactNode)];
}

const workspace: Workspace = {
  profile: { id: "member", display_name: "Warga", is_admin: false },
  memberships: [],
  profiles: [],
  regions: [],
  points: [],
  reports: [],
  incidents: [],
  tasks: [],
  feedback: [],
  schedules: [],
  exceptions: [],
  runs: [],
  preventions: [],
  events: [event],
  registrations: [],
  photos: [],
  history: [],
  notifications: [],
};

test("authenticated signup and cancellation retain the server ActionForm operation and refresh callback", () => {
  for (const joined of [false, true]) {
    const w = {
      ...workspace,
      registrations: joined
        ? [{ event_id: event.id, user_id: "member", duty: "Pemilah" }]
        : [],
    };
    const tree = Events({ ...props, w });
    const forms = elements(tree).filter(
      (element) => element.type === ActionForm,
    );
    assert.equal(forms.length, 1);
    assert.equal(forms[0].props.op, joined ? "event.leave" : "event.join");
    assert.deepEqual(forms[0].props.fixed, { id: event.id });
    assert.equal(forms[0].props.onDone, props.refresh);
    const html = renderToStaticMarkup(tree);
    assert.match(html, joined ? /Batalkan keikutsertaan/ : /Daftar kegiatan/);
    assert.equal(html.includes("Anda terdaftar"), joined);
    assert.doesNotMatch(html, /Pendaftaran tamu belum tersedia/);
  }
});

test("preview disables login and exposes no guest input or registration modal", () => {
  let loginCalls = 0;
  const tree = Events({
    ...props,
    preview: true,
    login: () => {
      loginCalls++;
    },
  });
  const buttons = elements(tree).filter((element) => element.type === "button");
  assert.equal(buttons.length, 1);
  assert.equal(buttons[0].props.disabled, true);
  assert.equal(loginCalls, 0);
  const html = renderToStaticMarkup(tree);
  assert.match(html, /Pendaftaran tidak tersedia di pratinjau statis/);
  assert.doesNotMatch(html, /<input|<form|role="dialog"/);
});

test("guest login action still invokes the supplied login callback", () => {
  let loginCalls = 0;
  const tree = Events({
    ...props,
    login: () => {
      loginCalls++;
    },
  });
  const buttons = elements(tree).filter((element) => element.type === "button");
  assert.equal(buttons.length, 1);
  assert.equal(buttons[0].props.disabled, false);
  (buttons[0].props.onClick as () => void)();
  assert.equal(loginCalls, 1);
});
