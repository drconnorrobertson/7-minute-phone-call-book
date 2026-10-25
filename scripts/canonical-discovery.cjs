'use strict';
// Keep canonical, sitemap, social, schema and internal link URLs consistent.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),cfg=JSON.parse(fs.readFileSync(path.join(root,'vercel.json'),'utf8')),out=path.resolve(root,cfg.outputDirectory||'.');
const home=fs.readFileSync(path.join(out,'index.html'),'utf8');
const origin=new URL(home.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/i)[1]).origin;
const hostname=new URL(origin).hostname.replace(/^www\./,'');
const redirects=new Map((cfg.redirects||[]).filter(r=>!r.has&&!r.missing&&!r.source.includes(':')).map(r=>[r.source,r.destination]));
const skip=new Set(['.git','node_modules','brand','assets','css','js','images']);
function normalize(value,relative=false){
 if(!value||(!/^https?:\/\//.test(value)&&!(relative&&value.startsWith('/')&&!value.startsWith('//'))))return value;
 let u;try{u=new URL(value,origin)}catch{return value}
 if(u.hostname.replace(/^www\./,'')!==hostname)return value;
 u.protocol='https:';u.host=new URL(origin).host;
 let p=u.pathname;
 const dest=redirects.get(p);if(dest&&dest.startsWith('/'))p=dest;
 if(cfg.cleanUrls&&p.endsWith('/index.html'))p=p.slice(0,-10)||'/';
 else if(cfg.cleanUrls&&p.endsWith('.html'))p=p.slice(0,-5);
 if(p!=='/'&&!path.posix.extname(p)){
  if(cfg.trailingSlash===true)p=p.replace(/\/$/,'')+'/';
  if(cfg.trailingSlash===false)p=p.replace(/\/$/,'');
 }
 u.pathname=p;
 return value.startsWith('/')?u.pathname+u.search+u.hash:u.href;
}
function tree(dir){let files=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.name.startsWith('.')||skip.has(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory()){if(dir===out&&['public','dist'].includes(e.name))continue;files.push(...tree(p))}else if(p.endsWith('.html'))files.push(p)}return files}
let changed=0;const files=tree(out),canonicalPages=new Set();
for(const f of files){let s=fs.readFileSync(f,'utf8');const n=s.replace(/\b(href|content)=(['"])([^'"]*)\2/g,(all,key,q,value)=>{const u=normalize(value,key==='href');return u===value?all:key+'='+q+u+q}).replace(/<script\b([^>]*type=['"]application\/ld\+json['"][^>]*)>([\s\S]*?)<\/script>/gi,(all,attrs,json)=>{let data;try{data=JSON.parse(json)}catch{throw Error('Invalid JSON-LD: '+f)}function visit(x){if(Array.isArray(x))return x.map(visit);if(x&&typeof x==='object'){for(const k of Object.keys(x))x[k]=visit(x[k]);return x}return typeof x==='string'?normalize(x):x}const updated=visit(data);return JSON.stringify(updated)===JSON.stringify(JSON.parse(json))?all:'<script'+attrs+'>'+JSON.stringify(updated)+'</script>'});
 const m=n.match(/<link\b[^>]*rel=['"]canonical['"][^>]*href=['"]([^'"]+)/i);if(m&&!/<meta[^>]*content=['"][^'"]*noindex/i.test(n))canonicalPages.add(m[1]);
 if(s!==n){fs.writeFileSync(f,n);changed++}
}
let removed=0,sitemapChanges=0;
for(const f of fs.readdirSync(out).filter(f=>/^sitemap.*\.xml$/.test(f))){const p=path.join(out,f),s=fs.readFileSync(p,'utf8'),seen=new Set();const n=s.replace(/<url\b[^>]*>[\s\S]*?<\/url>/g,entry=>{let m=entry.match(/<loc>\s*([^<]*?)\s*<\/loc>/);if(!m)return entry;const old=m[1],u=normalize(old);if(!canonicalPages.has(u)||seen.has(u)){removed++;return ''}seen.add(u);if(old!==u)sitemapChanges++;return entry.replace(m[0],'<loc>'+u+'</loc>')});if(s!==n)fs.writeFileSync(p,n)}
console.log(JSON.stringify({origin,htmlFiles:files.length,changed,sitemapChanges,removed}));
