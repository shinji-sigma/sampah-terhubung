async (page) => {
  const region = {
    id: "10000000-0000-4000-8000-000000000001",
    name: "Wilayah A · MOCK",
    coverage: "Uji UI sintetis, bukan wilayah lapangan",
    active: true,
    owner_label: "Pengelola MOCK",
    lat: -7.3,
    lng: 112.7,
    recurrence_count: 2,
    recurrence_days: 30,
    version: 1,
  };
  const publicData = {
    regions: [
      region,
      {
        ...region,
        id: "10000000-0000-4000-8000-000000000003",
        name: "Wilayah C · MOCK",
        active: false,
      },
    ],
    schedules: [],
    exceptions: [],
    runs: [],
    incidents: [],
    events: [],
  };
  page.__evidenceQa = {
    actor: null,
    commandMode: "422",
    requests: [],
    uploads: [],
    signup: 0,
  };
  await page.addInitScript(() => {
    window.__evidenceMock = {
      cameraMode: "ok",
      gpsMode: "ok",
      started: 0,
      stopped: 0,
    };
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition(ok, fail) {
          if (window.__evidenceMock.gpsMode === "timeout")
            return setTimeout(() => fail({ code: 3 }), 20);
          if (window.__evidenceMock.gpsMode === "denied")
            return setTimeout(() => fail({ code: 1 }), 20);
          setTimeout(
            () =>
              ok({
                coords: { latitude: -7.3, longitude: 112.7, accuracy: 2500 },
                timestamp: Date.now(),
              }),
            20,
          );
        },
      },
    });
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      configurable: true,
      value: async (constraints) => {
        if (constraints.audio !== false)
          throw Error("Mock requires video only");
        const state = window.__evidenceMock;
        if (state.cameraMode === "denied")
          throw new DOMException("Synthetic denial", "NotAllowedError");
        if (state.cameraMode === "pending")
          return new Promise((resolve) => {
            window.__resolveCameraMock = resolve;
          });
        const canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#177956";
        ctx.fillRect(0, 0, 640, 480);
        ctx.fillStyle = "white";
        ctx.font = "28px sans-serif";
        ctx.fillText("MOCK · FOTO SINTETIS", 40, 100);
        const stream = canvas.captureStream(15);
        for (const track of stream.getTracks()) {
          const stop = track.stop.bind(track);
          track.stop = () => {
            state.stopped++;
            stop();
          };
        }
        state.started++;
        return stream;
      },
    });
  });
  await page.route("**/api/**", async (route) => {
    const qa = page.__evidenceQa,
      path = new URL(route.request().url()).pathname;
    if (path === "/api/public") return route.fulfill({ json: publicData });
    if (path === "/api/auth") {
      const p = route.request().postDataJSON();
      if (p.action === "logout") {
        qa.actor = null;
        return route.fulfill({ json: { message: "Keluar · MOCK" } });
      }
      if (p.action === "signup") {
        qa.signup++;
        return route.fulfill({
          json: {
            signed_in: false,
            message:
              "Periksa email untuk konfirmasi akun · MOCK, email tidak dikirim.",
          },
        });
      }
      qa.actor = {
        id: p.email.startsWith("other")
          ? "20000000-0000-4000-8000-000000000002"
          : "20000000-0000-4000-8000-000000000001",
        display_name: "Pelapor MOCK",
        is_admin: false,
      };
      return route.fulfill({ json: { message: "Masuk · MOCK" } });
    }
    if (path === "/api/workspace")
      return route.fulfill(
        qa.actor
          ? {
              json: {
                ...publicData,
                profile: qa.actor,
                profiles: [qa.actor],
                memberships: [],
                points: [],
                reports: [],
                tasks: [],
                feedback: [],
                preventions: [],
                registrations: [],
                photos: [],
                history: [],
                notifications: [],
              },
            }
          : { status: 401, json: { error: "Sesi MOCK belum aktif" } },
      );
    if (path === "/api/photos") {
      qa.uploads.push(
        route
          .request()
          .postDataBuffer()
          .toString("latin1")
          .includes("camera_web")
          ? "camera_web"
          : "upload",
      );
      return route.fulfill({ json: { ids: [crypto.randomUUID()] } });
    }
    if (path === "/api/commands") {
      qa.requests.push(route.request().postDataJSON());
      if (qa.commandMode === "401") {
        qa.actor = null;
        qa.commandMode = "422";
        return route.fulfill({
          status: 401,
          json: { error: "Sesi berakhir · MOCK" },
        });
      }
      return route.fulfill({
        status: 422,
        json: {
          error: "Isian tetap tersedia · MOCK, tidak tersimpan",
          fields: { description: "Kegagalan sintetis untuk menguji draf" },
        },
      });
    }
    return route.fulfill({
      status: 503,
      json: { error: "Endpoint tidak disimulasikan" },
    });
  });
  await page.goto("http://localhost:3001");
  await page
    .getByRole("button", { name: "Masuk untuk melapor", exact: true })
    .click();
  return { scope: "MOCK only", state: "Login reached from report CTA" };
};
