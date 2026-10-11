import { writeFile } from 'node:fs/promises';
import http from 'node:http';
const base='http://127.0.0.1:3004';
const probes=[
 ['preview','/preview'],['fixture-production','/ui-test'],['public-unconfigured','/api/public'],['workspace-unconfigured','/api/workspace?region=10000000-0000-4000-8000-000000000001'],['photo-invalid-id','/api/photos/not-a-uuid'],['photo-unconfigured','/api/photos/10000000-0000-4000-8000-000000000001'],['export-invalid-region','/api/export?region=invalid&from=2026-10-01&until=2026-10-10'],
 ['commands-foreign-origin','/api/commands',{method:'POST',headers:{Origin:'https://audit.invalid','Content-Type':'application/json'},body:'{}'}],
 ['commands-no-origin','/api/commands',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}],
 ['commands-bounded-large-body','/api/commands',{method:'POST',headers:{Origin:'http://localhost:3001','Content-Type':'application/json'},body:' '.repeat(30001)}],
 ['auth-bounded-large-body','/api/auth',{method:'POST',headers:{Origin:'http://localhost:3001','Content-Type':'application/json'},body:' '.repeat(5001)}],

];
const results=[];
for(const [name,path,options] of probes){try{const r=await fetch(base+path,{...options,signal:AbortSignal.timeout(5000)}); const type=r.headers.get('content-type'); let message=null; if(type?.includes('json')){const j=await r.json();message=j.error||null}else await r.arrayBuffer(); results.push({name,status:r.status,cacheControl:r.headers.get('cache-control'),nosniff:r.headers.get('x-content-type-options'),frame:r.headers.get('x-frame-options'),referrer:r.headers.get('referrer-policy'),cors:r.headers.get('access-control-allow-origin'),message});}catch(e){results.push({name,result:'request-error',code:e.cause?.code||e.name})}}
results.push(await new Promise(resolve=>{const req=http.request({hostname:'127.0.0.1',port:3004,path:'/api/photos',method:'POST',headers:{Origin:'http://localhost:3001','Content-Length':'16777217','Content-Type':'application/octet-stream'}},res=>{resolve({name:'upload-declared-limit-one-actual-byte',status:res.statusCode,cacheControl:res.headers['cache-control']});res.resume();req.destroy()});req.setTimeout(5000,()=>{resolve({name:'upload-declared-limit-one-actual-byte',result:'timeout'});req.destroy()});req.on('error',()=>{resolve({name:'upload-declared-limit-one-actual-byte',result:'request-error'})});req.end('X')}));
const chunked=new ReadableStream({start(controller){controller.enqueue(new Uint8Array(15001).fill(32));controller.enqueue(new Uint8Array(15000).fill(32));controller.close()}});
const chunkedResponse=await fetch(base+'/api/commands',{method:'POST',headers:{Origin:'http://localhost:3001','Content-Type':'application/json'},body:chunked,duplex:'half',signal:AbortSignal.timeout(5000)});results.push({name:'chunked-no-content-length-limit',status:chunkedResponse.status,cacheControl:chunkedResponse.headers.get('cache-control')});await chunkedResponse.arrayBuffer();
await writeFile('output/audit/security/final-http-probes.json',JSON.stringify({target:base,snapshot:'0f9d0558756a25e1f8b3fa1a8735972517fcc87e',limits:'13 requests sequential, 5 sec timeout, maximum actual body 30001 bytes; no credentials',results},null,2)); process.stdout.write(JSON.stringify(results,null,2));



