import { readdir, readFile, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
const all = await readdir(".next/static/chunks", { recursive: true });
const result = {};
for (const extension of ["js", "css"]) {
  const files = all.filter((p) => p.endsWith("." + extension));
  let raw = 0,
    gzip = 0;
  for (const f of files) {
    const b = await readFile(".next/static/chunks/" + f);
    raw += b.length;
    gzip += gzipSync(b).length;
  }
  result[extension] = { files: files.length, rawBytes: raw, gzipBytes: gzip };
}
await writeFile(process.argv[2], JSON.stringify(result, null, 2));
console.log(result);
