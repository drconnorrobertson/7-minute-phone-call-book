const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(process.argv[2]||path.join(__dirname,'..'));
const c=JSON.parse(fs.readFileSync(path.join(__dirname,'decision-guides.json'),'utf8'));
const e=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const route=slug=>c.clean?'/'+slug+'/':'/'+slug+'.html';
const file=slug=>path.join(root,c.clean?slug+'/index.html':slug+'.html');
const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
const absolute=s=>s.replace(/\b(href|src)="(?!https?:|\/|#|mailto:|tel:|data:)([^"]+)"/g,(_,a,v)=>a+'="/'+v+'"');
const header=absolute((home.match(/<header\b[\s\S]*?<\/header>/i)||home.match(/<nav\b[\s\S]*?<\/nav>/i)||[''])[0]).replace(/\saria-current="page"/g,'').replace(/\sclass="active"/g,'');
const footer=absolute((home.match(/<footer\b[\s\S]*?<\/footer>/i)||[''])[0]);
const styles=(home.match(/<link\b[^>]*rel="stylesheet"[^>]*>/gi)||[]).map(absolute).join('\n');
const js=(home.match(/<script\b[^>]*src="[^"]+"[^>]*><\/script>/gi)||[]).filter(s=>!s.includes('ld+json')).map(absolute).join('\n');
const css=`.site-header{background:#0a1013}.decision-guide{background:#faf9f6;color:#202a2b;padding:140px 24px 72px;min-height:70vh;font:18px/1.75 Arial,sans-serif}.decision-guide .dg-inner{max-width:860px;margin:auto}.decision-guide h1{font-size:clamp(32px,5vw,52px);line-height:1.15;margin:24px 0;color:${c.color};letter-spacing:-.025em}.decision-guide h2{font-size:29px;line-height:1.3;margin:42px 0 18px;color:${c.color}}.decision-guide h3{font-size:22px;line-height:1.4;margin:24px 0 12px;color:${c.color}}.decision-guide p{margin:0 0 20px}.decision-guide a{color:${c.color};text-decoration:underline;text-underline-offset:3px}.decision-guide li{margin-bottom:22px}.decision-guide ol,.decision-guide ul{padding-left:28px}.decision-guide .dg-meta{font-size:14px;color:#52615b}.decision-guide .dg-panel{border:1px solid #bdc7bf;padding:24px;margin:32px 0;border-radius:8px}.decision-guide .dg-button{display:inline-block;background:${c.color};color:white;padding:12px 20px;border-radius:4px;text-decoration:none}.decision-guide :focus-visible{outline:3px solid #bb6c17;outline-offset:4px}.dg-discovery{padding:34px 24px;background:#f1f3ee;color:#202a2b}.dg-discovery>div{max-width:860px;margin:auto}.dg-discovery a{color:${c.color};text-decoration:underline}.dg-discovery h2{font-size:26px;color:${c.color};margin:0 0 10px}`;
function render(slug,title,description,body,extra=[]){
 const url=c.origin+route(slug),hub=c.origin+route('decision-guides');
 const graph=[{'@type':'WebPage','@id':url+'#page',url,name:title,description,isPartOf:{'@type':'WebSite',name:c.brand,url:c.origin+'/'}},{'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:c.origin+'/'},{'@type':'ListItem',position:2,name:'Decision guides',item:hub},...(slug==='decision-guides'?[]:[{'@type':'ListItem',position:3,name:title,item:url}])]},...extra];
 const schema=JSON.stringify({'@context':'https://schema.org','@graph':graph}).replaceAll('<','\\u003c');
 const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${e(title)} | ${e(c.brand)}</title><meta name="description" content="${e(description)}"><link rel="canonical" href="${url}"><meta property="og:type" content="article"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}"><meta property="og:url" content="${url}">${styles}<style>${css}</style><script type="application/ld+json">${schema}</script></head><body>${header}<main class="decision-guide" id="main"><div class="dg-inner"><nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="${route('decision-guides')}">Decision guides</a></nav><p class="dg-meta">${e(c.brand)} · Practical planning guides</p><h1>${e(title)}</h1>${body}</div></main>${footer}${js}</body></html>`;
 fs.mkdirSync(path.dirname(file(slug)),{recursive:true});fs.writeFileSync(file(slug),html);
}
for(const p of c.pages){
 const body=`<p>${e(p.intro)}</p><h2>Work through the decision</h2><ol>${p.items.map(([h,t])=>`<li><h3>${e(h)}</h3><p>${e(t)}</p></li>`).join('')}</ol><section class="dg-panel"><h2>Worked example</h2><p>${e(p.example)}</p></section><h2>Your next step</h2><p>${e(p.action)}</p><h2>Common questions</h2>${p.faq.map(([q,a])=>`<h3>${e(q)}</h3><p>${e(a)}</p>`).join('')}<h2>Related decisions</h2><ul>${c.pages.filter(x=>x!==p).map(x=>`<li><a href="${route(x.slug)}">${e(x.title)}</a></li>`).join('')}${c.related.map(([u,t])=>`<li><a href="${e(u)}">${e(t)}</a></li>`).join('')}</ul><p><a class="dg-button" href="${c.cta}">${e(c.ctaText)}</a></p>`;
 render(p.slug,p.title,p.description,body,[{'@type':'ItemList',name:p.title,itemListElement:p.items.map(([name],i)=>({'@type':'ListItem',position:i+1,name}))}]);
}
render('decision-guides','Comparison and Checklist Guides',`Practical ${c.brand} comparisons and checklists. Evaluate scope, responsibilities and next steps with worked examples.`,`<p>Choose the decision you are working on. Each guide explains the tradeoffs, the questions to ask and the evidence to collect before moving forward. The examples are illustrative planning scenarios.</p>${c.pages.map(p=>`<section class="dg-panel"><h2><a href="${route(p.slug)}">${e(p.title)}</a></h2><p>${e(p.intro)}</p><p><a href="${route(p.slug)}">Read the comparison and checklist</a></p></section>`).join('')}<h2>Continue planning</h2><ul>${c.related.map(([u,t])=>`<li><a href="${u}">${e(t)}</a></li>`).join('')}</ul><p><a class="dg-button" href="${c.cta}">${e(c.ctaText)}</a></p>`);
const block=`<!-- decision-guides:start --><section class="dg-discovery" style="padding:32px 24px;background:#f1f3ee;color:#202a2b"><div style="max-width:1000px;margin:auto"><h2 style="font-size:26px;color:${c.color}">Compare your next step</h2><p>Use practical comparisons, checklists and worked examples to clarify your scope.</p><ul>${c.pages.map(p=>`<li><a style="color:${c.color};text-decoration:underline" href="${route(p.slug)}">${e(p.title)}</a></li>`).join('')}</ul><p><a style="color:${c.color};text-decoration:underline" href="${route('decision-guides')}">Browse comparison and checklist guides</a></p></div></section><!-- decision-guides:end -->`;
for(const parent of c.parents){
 const f=path.join(root,parent);if(!fs.existsSync(f))throw new Error('Missing discovery parent '+parent);
 let h=fs.readFileSync(f,'utf8').replace(/<!-- decision-guides:start -->[\s\S]*?<!-- decision-guides:end -->/g,'');
 if(h.includes('</main>'))h=h.replace('</main>',block+'</main>');else if(/<footer\b/.test(h))h=h.replace(/<footer\b/,block+'<footer');else throw new Error('No insertion point '+parent);
 fs.writeFileSync(f,h);
}
const urls=['decision-guides',...c.pages.map(p=>p.slug)].map(s=>c.origin+route(s));
const sitemap=path.join(root,'sitemap.xml');let xml=fs.readFileSync(sitemap,'utf8');
if(xml.includes('<sitemapindex')){
 const name='sitemap-decision-guides.xml';fs.writeFileSync(path.join(root,name),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.map(u=>'<url><loc>'+u+'</loc></url>').join('')+'</urlset>');
 if(!xml.includes(c.origin+'/'+name))xml=xml.replace('</sitemapindex>','<sitemap><loc>'+c.origin+'/'+name+'</loc></sitemap></sitemapindex>');
}else{
 for(const u of urls)if(!xml.includes('<loc>'+u+'</loc>'))xml=xml.replace('</urlset>','<url><loc>'+u+'</loc></url></urlset>');
}
fs.writeFileSync(sitemap,xml);
console.log('Decision guides: '+c.brand+', '+urls.length+' pages, '+c.parents.length+' discovery parents');
