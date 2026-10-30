const {chromium}=require('playwright');
const fs=require('fs');
(async()=>{
const dir='D:/Project/Lomba_UIN/evidence_screens/live-current';fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const records=[];
try{
for(const [name,route,width,height] of [['beranda-desktop','/',1440,900],['jadwal-desktop','/jadwal',1440,900],['laporan-desktop','/laporan',1440,900],['beranda-mobile','/',390,844],['jadwal-mobile','/jadwal',390,844]]){
const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
const url='https://sampah-terhubung-langgamramadhan9-3266.vercel.app'+route;
const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForTimeout(12000);
const text=await page.locator('body').innerText();
const path=dir+'/'+name+'.png';await page.screenshot({path,fullPage:false});
const r={name,url,status:response.status(),width,height,path,time:new Date().toISOString(),text};records.push(r);
fs.writeFileSync(dir+'/manifest.json',JSON.stringify(records,null,2));console.log(name,response.status(),text.slice(0,550));await page.close();
}
}finally{await browser.close()}
})();
