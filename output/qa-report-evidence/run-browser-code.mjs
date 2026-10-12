// Test-only CLI adapter. The scripts it runs mock backend/camera/GPS in the browser.
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
const code = (await readFile(process.argv[2], "utf8")).trim().replace(/;$/, "");
const session = process.argv[3] || "evidence";
const wrapped = `async page => {page.__qaSession=${JSON.stringify(session)};return await (${code})(page);}`;
const result = spawnSync(
  process.execPath,
  [
    resolve("node_modules/@playwright/cli/playwright-cli.js"),
    "-s=" + session,
    "run-code",
    wrapped,
  ],
  { encoding: "utf8" },
);
process.stdout.write(result.stdout || "");
process.stderr.write(result.stderr || "");
process.exit(result.stdout?.includes("### Error") ? 1 : (result.status ?? 1));
