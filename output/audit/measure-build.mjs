import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import os from 'node:os';
import sharp from 'sharp';
const files = [];
async function walk(path) {
  for (const entry of await readdir(path, {withFileTypes:true})) {
    const next = join(path, entry.name);
    if (entry.isDirectory()) await walk(next);
    else if (/\.(js|css)$/.test(entry.name)) files.push(next);
  }
}
await walk('.next/static/chunks');
const totals = {js:{files:0,raw:0,gzip:0},css:{files:0,raw:0,gzip:0}};
for (const path of files) {
  const bytes = await readFile(path), type = path.endsWith('.js')?'js':'css';
  totals[type].files++;
  totals[type].raw += bytes.length;
  totals[type].gzip += gzipSync(bytes).length;
}
const image = 'public/illustrations/coordination.webp', meta = await sharp(image).metadata();
const result = {measuredAt:new Date().toISOString(),node:process.version,platform:os.platform(),architecture:os.arch(),cpu:os.cpus()[0]?.model,logicalCpus:os.cpus().length,totalMemoryGiB:Math.round(os.totalmem()/1024**3),buildId:(await readFile('.next/BUILD_ID','utf8')).trim(),allChunks:totals,hero:{bytes:(await stat(image)).size,width:meta.width,height:meta.height,format:meta.format},limits:'All build chunks and independent gzip totals, not one route transfer, Cloud latency, physical phone, FPS, LCP or CLS.'};
await writeFile('output/audit/build-metrics-final.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
