const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('C:/Users/Usuario/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root = path.resolve(__dirname, '..');
const siteRoot = path.join(root, '.artifacts', 'site');
const results = path.join(root, '.artifacts', 'test-results', 'academy-hubs');
const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png'};

function server(){
  const instance = http.createServer((req,res)=>{
    const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    let file = path.resolve(siteRoot,'.'+pathname);
    if(pathname.endsWith('/')) file = path.join(file,'index.html');
    if(!file.startsWith(siteRoot+path.sep)){res.writeHead(403).end('Forbidden');return;}
    fs.readFile(file,(error,body)=>{
      if(error){res.writeHead(404).end('Not found');return;}
      res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'}).end(body);
    });
  });
  return new Promise(resolve=>instance.listen(0,'127.0.0.1',()=>resolve(instance)));
}

async function inspect(browser,base,route,name,viewport){
  const context = await browser.newContext({viewport});
  const page = await context.newPage();
  const errors=[]; page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+route,{waitUntil:'networkidle'});
  await page.locator(viewport.width<=760 ?
    '.mobile-category-heading[aria-expanded="true"]' : '.active-category .lesson-row').first().waitFor();
  const metrics = await page.evaluate(()=>{
    const rect = selector=>document.querySelector(selector).getBoundingClientRect();
    return {
      overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      header:rect('.academy-shell'),hero:rect('.hub-hero'),firstRow:rect('.focused-curriculum'),
      academyLinks:[...document.querySelectorAll('.academy-brand,.all-constellations,.dfoot')]
        .map(link=>link.href),
      burger:getComputedStyle(document.querySelector('#burger')).display,
      nav:getComputedStyle(document.querySelector('#navMain')).display
    };
  });
  assert.ok(metrics.overflow<=0, `${name} must not overflow at ${viewport.width}`);
  assert.ok(metrics.firstRow.top<viewport.height, `${name} first row must begin in first viewport`);
  assert.equal(await page.locator('.curriculum-workspace').count(),1,
    `${name} must render one focused curriculum workspace`);
  assert.equal(await page.locator('.active-category').count(),1,
    `${name} must render one active desktop category`);
  assert.ok(await page.locator('.lesson-row[href]').count()>=1,
    `${name} must keep published lessons freely navigable`);
  assert.equal(await page.locator('.deck-card').count(),0,
    `${name} must not render the retired card grid`);
  assert.ok(metrics.academyLinks.length>=3, `${name} must expose academy navigation links`);
  assert.ok(metrics.academyLinks.every(href=>href===base+'/'),
    `${name} academy navigation must preserve the current origin`);
  const headingContracts=await page.locator('.mobile-category-heading').evaluateAll(headings=>
    headings.map(button=>({expanded:button.getAttribute('aria-expanded'),
      controls:button.getAttribute('aria-controls'),
      panel:Boolean(document.getElementById(button.getAttribute('aria-controls')))})));
  assert.ok(headingContracts.every(item=>item.panel && /^(true|false)$/.test(item.expanded)),
    `${name} category headings must control real panels`);
  assert.deepEqual(errors,[]);
  if(viewport.width===1440){
    assert.equal(metrics.burger,'none',`${name} desktop navigation should fit at 1440`);
    assert.notEqual(metrics.nav,'none',`${name} desktop navigation must remain visible at 1440`);
    assert.ok(await page.locator('.course-map').isVisible(),`${name} desktop course map must be visible`);
    assert.equal(await page.locator('.course-map-button[aria-pressed="true"]').count(),1,
      `${name} desktop course map must select one category`);
    assert.ok(await page.locator('.active-category').isVisible(),
      `${name} active category must be visible on desktop`);
    const target=page.locator('.course-map-button').nth(1);
    const targetId=await target.getAttribute('data-category-id');
    const before=page.url();
    await target.click();
    assert.equal(page.url(),before,`${name} category switching must not navigate`);
    assert.equal(await page.locator('.active-category').getAttribute('data-active-category'),targetId,
      `${name} category switching must replace the active lesson panel`);
  }
  if(viewport.width===760){
    assert.notEqual(metrics.burger,'none',`${name} burger must appear when nav does not fit`);
    assert.equal(metrics.nav,'none',`${name} desktop nav must collapse`);
    await page.locator('#burger').click();
    await page.locator('#navDrawer[aria-hidden="false"]').waitFor();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#burger').getAttribute('aria-expanded'),'false');
  }
  if(viewport.width===430){
    assert.equal(await page.locator('.course-map').isVisible(),false,
      `${name} desktop map must hide on mobile`);
    assert.ok(await page.locator('.mobile-curriculum').isVisible(),
      `${name} mobile curriculum must be visible`);
    const categories=page.locator('[data-mobile-category]');
    assert.ok(await categories.count()>=1, `${name} needs mobile categories`);
    assert.equal(await categories.locator('.mobile-category-heading[aria-expanded="true"]').count(),1,
      `${name} must initially open one mobile category`);
    const closed=categories.locator('.mobile-category-heading[aria-expanded="false"]').first();
    if(await closed.count()){
      const panelId=await closed.getAttribute('aria-controls');
      await closed.click();
      const opened=page.locator(`.mobile-category-heading[aria-controls="${panelId}"]`);
      assert.equal(await opened.getAttribute('aria-expanded'),'true');
      assert.equal(await categories.locator('.mobile-category-heading[aria-expanded="true"]').count(),1,
        `${name} mobile disclosure must keep exactly one category open`);
      assert.ok(await page.locator('#'+panelId).isVisible(),
        `${name} must reveal a category from its accessible control`);
    }
  }
  await page.screenshot({path:path.join(results,`${name}-${viewport.width}x${viewport.height}.png`),fullPage:true});
  await context.close();
}

async function inspectResources(browser,base){
  const context = await browser.newContext({viewport:{width:430,height:844}});
  const page = await context.newPage();
  await page.goto(base+'/ingles/recursos.html',{waitUntil:'networkidle'});
  await page.locator('#items .item').first().waitFor();
  assert.ok(await page.evaluate(()=>document.querySelector('header.topbar').scrollWidth<=document.documentElement.clientWidth),
    'english resources header must fit the mobile viewport');
  assert.equal(await page.locator('header.topbar').count(),1,
    'english resources must preserve its compact header');
  assert.equal(await page.locator('header a[href="index.html"]').count(),2,
    'english resources header must link back to classes');
  assert.equal(await page.locator('header a[href="https://lareddeluz.com"]').count(),1,
    'english resources header must link to La Red de Luz');
  assert.equal(await page.locator('.salir a[href="index.html"]').count(),1,
    'english resources body must expose its return to classes');
  await context.close();
}

async function seedProgress(context,courseId){
  await context.addInitScript(({courseId})=>{
    localStorage.setItem('lrdl.progreso',JSON.stringify({
      esquema:1,
      dispositivoId:'e2e-test',
      cursos:{
        [courseId]:{
          ultima:'sesion-4',
          clases:{
            'sesion-3':{estado:'visto',ts:'2026-08-31T12:00:00.000Z'},
            'sesion-4':{estado:'curso',ts:'2026-09-01T12:00:00.000Z'}
          }
        }
      }
    }));
  },{courseId});
}

async function inspectProgress(browser,base){
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  await seedProgress(context,'ingles');
  const page=await context.newPage();
  await page.goto(base+'/ingles/',{waitUntil:'networkidle'});
  await page.locator('.lesson-row').first().waitFor();
  assert.equal(await page.locator('.active-category .lesson-row.visto').count(),1,
    'english progress must show one completed lesson');
  assert.equal(await page.locator('.active-category .lesson-row.curso').count(),1,
    'english progress must show one active lesson');
  assert.match(await page.locator('.featured-class h2').innerText(),/What do you do every day\?/i,
    'hero must recommend the active lesson');
  assert.match(await page.locator('.course-progress').innerText(),/1 de 8 vistas/i,
    'hero must summarize completed progress');
  assert.ok(await page.locator('.active-category .lesson-row[href]').count()>=6,
    'progress must keep the active category lessons navigable');
  await page.locator('.course-map-button[data-category-id="sesiones"]').click();
  assert.equal(await page.locator('.active-category .lesson-row[href]').count(),2,
    'progress must allow freely exploring another category');
  assert.equal(await page.locator('.focused-curriculum .lesson-row.soon[href]').count(),0,
    'upcoming lessons must not be links');
  await context.close();
}

async function inspectUnavailableProgress(browser,base){
  const context=await browser.newContext({viewport:{width:1024,height:768}});
  await context.addInitScript(()=>{
    Storage.prototype.setItem=function(){throw new DOMException('Storage blocked','SecurityError');};
  });
  const page=await context.newPage();
  const errors=[]; page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'/ingles/',{waitUntil:'networkidle'});
  await page.locator('.lesson-row').first().waitFor();
  assert.equal(await page.locator('.course-progress').count(),0,
    'unavailable storage must hide personalized progress');
  assert.ok(await page.locator('.active-category .lesson-row[href]').count()>=2,
    'unavailable storage must keep the initial category navigable');
  await page.locator('.course-map-button[data-category-id="basico"]').click();
  assert.equal(await page.locator('.active-category .lesson-row[href]').count(),6,
    'unavailable storage must keep other categories navigable');
  assert.deepEqual(errors,[],'unavailable storage must not break the hub');
  await context.close();
}

(async()=>{
  fs.mkdirSync(results,{recursive:true});
  const httpServer=await server();
  const base=`http://127.0.0.1:${httpServer.address().port}`;
  const browser=await chromium.launch({executablePath:edge,headless:true});
  try{
    for(const [route,name] of [['/dtmm/','dtmm'],['/ingles/','ingles']]){
      for(const viewport of [{width:1440,height:900},{width:1024,height:768},
        {width:760,height:900},{width:430,height:844},{width:390,height:844}]){
        await inspect(browser,base,route,name,viewport);
      }
    }
    await inspectResources(browser,base);
    await inspectProgress(browser,base);
    await inspectUnavailableProgress(browser,base);
    console.log('academy hubs browser layout: PASS');
  }finally{
    await browser.close();
    await new Promise(resolve=>httpServer.close(resolve));
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
