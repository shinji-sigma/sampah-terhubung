import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
test('home loading uses available responsive CSS and an accessible status', () => {
 const source = readFileSync('src/components/home.tsx', 'utf8');
 const css = readFileSync('src/app/globals.css', 'utf8');
 const loading = source.slice(source.indexOf('  if (loading)'), source.indexOf('  return (', source.indexOf('  if (loading)') + 20));
 assert.match(source, /role="status"[^>]*>Memuat data wilayah/);
 assert.match(source, /className="home-loading"/);
 assert.match(css, /\.home-loading\b/);
 assert.match(css, /\.loading-placeholder\b/);
 assert.doesNotMatch(loading, /bg-slate-|space-y-|animate-pulse/);
});
