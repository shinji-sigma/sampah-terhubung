import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
const base=process.env.AUDIT_URL || 'http://localhost:3108';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
const results=[];
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
try {
 await page.goto(base+'/preview');
 await page.getByRole('button',{name:'Buka navigasi',exact:true}).click();
 await page.getByRole('button',{name:'Kegiatan',exact:true}).click();
 await page.getByRole('heading',{name:'Kegiatan lingkungan',exact:true}).waitFor();
 results.push({test:'preview events renders',pass:true});
 for (const name of ['Beranda','Jadwal angkut','Laporan saya','Kegiatan','Integrasi API','Panduan & SUS']) {
  await page.getByRole('button',{name:'Buka navigasi',exact:true}).click();
  await page.getByRole('button',{name,exact:true}).first().click();
  await page.waitForTimeout(300);
  const sizes=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
  results.push({test:'mobile '+name,...sizes,pass:sizes.scroll<=sizes.client+1});
 }
 await page.screenshot({path:'../jury-audit/mobile-guide.png',fullPage:true});
 for(const path of ['/admin','/kelola','/wilayah','/laporan/baru']) {
  const response=await page.goto(base+path);
  results.push({test:'route '+path,status:response.status(),pass:response.status()===200});
 }
 results.push({test:'no uncaught browser errors',errors,pass:errors.length===0});
 writeFileSync('../jury-audit/browser-results.json',JSON.stringify(results,null,2));
 console.log(JSON.stringify(results,null,2));
 assert.ok(results.every(r=>r.pass),'Browser checks failed; see browser-results.json');
} finally {await browser.close();}
