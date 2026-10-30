import {chromium} from 'playwright';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const base=process.env.QA_BASE||'https://sampah-terhubung-langgamramadhan9-3266.vercel.app';
const env=Object.fromEntries(readFileSync('D:/WebDemo/.env.local','utf8').split(/\r?\n/).filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^["']|["']$/g,'')]}));
const browser=await chromium.launch({channel:'chrome',headless:true});
const ctx=await browser.newContext(); const page=await ctx.newPage(); const results=[];const errors=[];page.on('pageerror',e=>errors.push(e.message));
const record=(test,pass,detail)=>{results.push({test,pass,detail});console.log(test,pass,JSON.stringify(detail??''));};
try {
const login=await ctx.request.post(base+'/api/auth',{headers:{Origin:base},data:{action:'login',email:'admin@demo.invalid',password:env.DEMO_PASSWORD}});record('admin login',login.ok(),{status:login.status()});if(!login.ok())throw Error('login failed');
const w=await ctx.request.get(base+'/api/workspace?region=10000000-0000-4000-8000-000000000001');record('admin workspace',w.ok(),{status:w.status()});
await page.goto(base+'/');
await page.evaluate(()=>localStorage.setItem('sampah-terhubung.region.v1','10000000-0000-4000-8000-000000000001'));
for(const width of [1440,390]) {
await page.setViewportSize({width,height:950});
for(const path of ['/admin','/kelola','/kegiatan','/jadwal']){
await page.goto(base+path);
try { await page.waitForResponse(r=>r.url().includes('/api/workspace')&&r.status()===200,{timeout:15000}); } catch(e){}
await page.waitForTimeout(600);
const sections=page.locator('.admin-data-section');record('tables '+width+' '+path,(await sections.count())>0,{tables:await sections.count()});
const size=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));record('overflow '+width+' '+path,size.scroll<=size.client+1,size);
const count = await sections.count();
for(let i=0;i<count;i++){
const section=sections.nth(i);
const search=section.locator('input[type=search]');
if(await search.count()){
await search.fill('zzzz-no-result');
await page.waitForTimeout(100);
record('empty search '+width+' '+path+' '+i,await section.getByText('Tidak ada data yang cocok.',{exact:false}).isVisible());
await section.getByRole('button',{name:'Reset',exact:true}).click();
}
const sort=section.locator('.admin-sort').first();
if(await sort.count()){
await sort.click();record('sort asc '+path+' '+i,await section.locator('th').first().getAttribute('aria-sort')==='ascending');
await sort.click();record('sort desc '+path+' '+i,await section.locator('th').first().getAttribute('aria-sort')==='descending');
}
const select=section.locator('select').first();
if(await select.count()&&await select.locator('option').count()>1){
await select.selectOption({index:1});
if(await search.count()){
await search.fill('zzzz-no-result');
record('combined search filter '+path+' '+i,await section.getByText('Tidak ada data yang cocok.',{exact:false}).isVisible());
await section.getByRole('button',{name:'Reset',exact:true}).click();
}
}
const detail=section.getByRole('button',{name:/^Detail /}).first();
if(await detail.count()){
await detail.click();
await page.waitForTimeout(200);
record('detail opens '+path+' '+i,await section.locator('dialog').isVisible());
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
record('escape closes '+path+' '+i,!(await section.locator('dialog').isVisible()));
}
}
if(path==='/admin')await page.screenshot({path:'output/admin-'+width+'.png',fullPage:true});
}
}
const anon=await browser.newContext();const publicPage=await anon.newPage();for(const path of ['/','/jadwal','/kegiatan','/laporan','/integrasi','/uji-pengguna']){const r=await publicPage.goto(base+path);await publicPage.waitForTimeout(500);record('public unchanged '+path,r.status()===200&&await publicPage.locator('.admin-data-section').count()===0,{status:r.status()});}await anon.close();
record('no browser errors',errors.length===0,errors);
}finally{mkdirSync('output',{recursive:true});writeFileSync('output/admin-live-qa.json',JSON.stringify({base,results,errors},null,2));await browser.close();}
console.log('TOTAL',results.length,'FAIL',results.filter(r=>!r.pass).length);
