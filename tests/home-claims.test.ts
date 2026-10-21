import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
test('home avoids unsupported competitor claims and public private-photo promises',()=>{
 const source=readFileSync('src/components/home.tsx','utf8');
 assert.doesNotMatch(source,/API Tertutup|Birokrasi berjenjang|OpenGov Ready|dapat diaudit publik/);
 assert.match(source,/belum terhubung/i);
 assert.match(source,/pengguna berwenang/i);
});
