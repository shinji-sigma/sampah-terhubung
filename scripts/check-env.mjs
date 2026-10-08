import { readFile } from "node:fs/promises";
let text = "";
try {
  text = await readFile(".env.local", "utf8");
} catch {}
const values = Object.fromEntries(
  text
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
    }),
);
console.log(
  JSON.stringify(
    {
      filePresent: !!text,
      urlPresent:
        !!values.NEXT_PUBLIC_SUPABASE_URL &&
        !values.NEXT_PUBLIC_SUPABASE_URL.includes("YOUR_PROJECT"),
      publishablePresent: !!values.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      serverSecretPresent: !!(
        values.SUPABASE_SECRET_KEY || values.SUPABASE_SERVICE_ROLE_KEY
      ),
      demoPasswordPresent: !!values.DEMO_PASSWORD,
    },
    null,
    2,
  ),
);
