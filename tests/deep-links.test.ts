import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

test('every operational deep link has a server route with an explicit initial view', () => {
  for (const [path, view] of [['admin','admin'],['kelola','manage'],['wilayah','region'],['laporan/baru','report']]) {
    const file = resolve('src/app', path, 'page.tsx');
    assert.ok(existsSync(file), `missing deep link /${path}`);
    assert.match(readFileSync(file,'utf8'), new RegExp(`initialView="${view}"`));
  }
});
