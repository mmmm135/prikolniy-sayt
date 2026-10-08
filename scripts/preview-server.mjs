import http from 'node:http';
import path from 'node:path';
import {readFile,stat} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
const root=path.resolve(process.cwd(),'out'),port=Number(process.argv[2]||5173),compressed=new Map();
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.mp4':'video/mp4','.webm':'video/webm','.ttf':'font/ttf','.woff2':'font/woff2','.gltf':'model/gltf+json','.glb':'model/gltf-binary','.ico':'image/x-icon','.md':'text/plain; charset=utf-8'};
http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');let file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
  if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  if((await stat(file)).isDirectory())file=path.join(file,'index.html');
  const data=await readFile(file),extension=path.extname(file),mime=types[extension]||'application/octet-stream';
  const headers={'Content-Type':mime,'Cache-Control':extension==='.html'?'no-store':'public, max-age=3600','Accept-Ranges':'bytes'};
  const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
  if(range){const start=Number(range[1]),end=Math.min(range[2]?Number(range[2]):data.length-1,data.length-1);if(start>end){res.writeHead(416,{'Content-Range':`bytes */${data.length}`});res.end();return;}res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${data.length}`,'Content-Length':end-start+1});res.end(data.subarray(start,end+1));return;}
  if(/gzip/.test(req.headers['accept-encoding']||'')&&['.js','.css','.html','.svg','.json','.gltf'].includes(extension)){
   let zipped=compressed.get(file);if(!zipped){zipped=gzipSync(data);compressed.set(file,zipped);}res.writeHead(200,{...headers,'Content-Encoding':'gzip','Vary':'Accept-Encoding','Content-Length':zipped.length});res.end(req.method==='HEAD'?undefined:zipped);
  }else{res.writeHead(200,{...headers,'Content-Length':data.length});res.end(req.method==='HEAD'?undefined:data);}
 }catch(error){if(!req.url.startsWith('/_next/hmr'))console.error(req.url,error.code||error.message);res.writeHead(error.code==='ENOENT'?404:500);res.end();}
}).listen(port,'127.0.0.1',()=>console.log(`Production preview: http://localhost:${port}/`));
