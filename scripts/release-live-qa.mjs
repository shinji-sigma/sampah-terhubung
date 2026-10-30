import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const base = process.env.QA_BASE || 'https://sampah-terhubung-langgamramadhan9-3266.vercel.app';
const destination = readFileSync('src/lib/sus-destination.ts', 'utf8').match(/https:\/\/docs.google.com[^"\s]+/)[0];
const results = [], errors = [], apiCalls = [];
const record = (test, pass, details) => { results.push({test, pass, details}); console.log(test, pass, JSON.stringify(details ?? '')); };
mkdirSync('output', {recursive:true});
const browser = await chromium.launch({channel:'chrome', headless:true});
const page = await browser.newPage();
page.on('pageerror', e => errors.push(e.message));
page.on('request', r => { if(r.url().includes('/api/evaluasi')) apiCalls.push(r.url()); });
try {
  for (const path of ['/','/jadwal','/kegiatan','/laporan','/laporan/baru','/integrasi','/panduan','/admin','/kelola','/wilayah','/preview','/uji-pengguna']) {
    const r = await page.goto(base + path);
    record('route '+path, r.status() === 200, {status:r.status()});
  }
  const redirect = await page.request.get(base+'/evaluasi', {maxRedirects:0});
  record('legacy exact redirect', redirect.status()===307 && redirect.headers().location===destination, {status:redirect.status(),location:redirect.headers().location});
  for(const width of [390,1440]) {
    await page.setViewportSize({width,height:950});
    for(const path of ['/','/uji-pengguna','/panduan']) {
      await page.goto(base+path); await page.waitForTimeout(1000);
      const size=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
      record('layout '+width+' '+path,size.scroll<=size.client+1,size);
      const links=await page.locator('a').evaluateAll(as=>as.filter(a=>/SUS/.test(a.textContent)).map(a=>({text:a.textContent,href:a.href})));
      record('exact SUS links '+width+' '+path,links.length>0&&links.every(a=>a.href===destination),links);
      if(path==='/uji-pengguna') {
        record('no study gate '+width,await page.locator('input,select,form').count()===0);
        record('feature access '+width,await page.getByRole('link',{name:'Buka aplikasi',exact:true}).isVisible());
        await page.screenshot({path:'output/feature-guide-'+width+'.png',fullPage:true});
      }
    }
  }
  for(const path of ['/uji-pengguna/foto-sebelum.jpg','/uji-pengguna/foto-sesudah.jpg']) {
    const r=await page.request.get(base+path);record('sample '+path,r.status()===200&&r.headers()['content-type'].startsWith('image/'),{status:r.status()});
  }
  await page.goto(base+'/uji-pengguna');
  await page.evaluate(()=>{window.__copied='';Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.__copied=text}},configurable:true});});
  await page.getByRole('button',{name:'Salin undangan WhatsApp'}).click();
  const invitation=await page.evaluate(()=>window.__copied);
  record('invitation exact destination',invitation.includes(destination)&&!invitation.includes(base+'/evaluasi'),{text:invitation});
  await page.goto(base+'/evaluasi');
  record('browser follows legacy redirect',page.url()===destination,{url:page.url()});
  const formText=await page.locator('body').innerText();
  const formData=await page.evaluate(()=>window.FB_PUBLIC_LOAD_DATA_ || null);
  const questions=(formData?.[1]?.[1]||[]).map(q=>({title:q[1],type:q[3],required:q[4]?.[0]?.[2]}));
  writeFileSync('output/google-form-readonly.json',JSON.stringify({url:page.url(),questions,text:formText},null,2));
  const sus=questions.filter(q=>/^\d+\./.test(q.title||''));
  record('Google Form read only 10 SUS questions',sus.length===10,{count:sus.length,titles:sus.map(q=>q.title)});
  record('Google Form consent present',questions.some(q=>/persetujuan/i.test(q.title)),questions[0]?.title);
  record('no legacy API used',apiCalls.length===0,apiCalls);
  record('no uncaught errors',errors.length===0,errors);
} finally {
  const summary={base,destination,at:new Date().toISOString(),count:results.length,failed:results.filter(r=>!r.pass).length,results,errors};
  writeFileSync('output/google-forms-live-qa.json',JSON.stringify(summary,null,2));
  await browser.close();
}
console.log('TOTAL',results.length,'FAIL',results.filter(r=>!r.pass).length);
if(results.some(r=>!r.pass))process.exitCode=1;

