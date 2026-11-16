const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const url=process.env.EARTH_PREVIEW_URL||'http://127.0.0.1:4178/';
const out=process.env.EARTH_REPORT_DIR,report={layouts:[],errors:[]};
const shot=async(p,name)=>{if(out)await p.screenshot({path:path.join(out,name+'.png')});};
const geometry=()=>JSON.parse(document.querySelector('#globeCanvas').dataset.geometry);
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  for(const size of [{width:844,height:390},{width:667,height:375},{width:720,height:450},{width:320,height:568},{width:768,height:1024}]){
   const c=await browser.newContext({viewport:size,reducedMotion:'reduce'}),p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));
   await p.goto(url);await p.waitForFunction(()=>window.EarthRadioTest);
   if(size.width<=760){
    await p.locator('#playerToggle').click();
    assert.equal(await p.evaluate(()=>document.activeElement.id),'playButton');
   }
   await p.waitForTimeout(350);
   const visible=await p.evaluate(()=>{
    const {x,y,radius}=JSON.parse(document.querySelector('#globeCanvas').dataset.geometry);let total=0,clear=0;
    for(let dx=-.9;dx<=.9;dx+=.1)for(let dy=-.9;dy<=.9;dy+=.1)if(dx*dx+dy*dy<=.81){total++;if(document.elementFromPoint(x+dx*radius,y+dy*radius)?.id==='globeCanvas')clear++;}
    return {fraction:clear/total,x,y,radius};
   });
   assert(visible.fraction>.5,`${size.width}x${size.height}: globe must remain usable (${visible.fraction})`);
   assert(await p.locator('#hostMute').isVisible(),'host controls are available without expanding');
   const brand=await p.locator('.brand').boundingBox(),explore=await p.locator('#exploreToggle').boundingBox();
   assert(!(brand.x<explore.x+explore.width&&brand.x+brand.width>explore.x&&brand.y<explore.y+explore.height&&brand.y+brand.height>explore.y),'brand and Explore do not overlap');
   const meta=await p.locator('#receiverPlace').boundingBox(),guide=await p.locator('#tourStart').boundingBox();
   assert(meta.x+meta.width<=guide.x||meta.y>=guide.y+guide.height||meta.y+meta.height<=guide.y,'station metadata does not overlap Guide');
   await shot(p,`finish-${size.width}x${size.height}-compact`);
   await p.locator('#playerExpand').click();await p.waitForTimeout(100);
   const titleClear=await p.locator('#receiverTitle').evaluate(title=>{const b=title.getBoundingClientRect();return title.contains(document.elementFromPoint(b.x+8,b.y+b.height/2));});
   assert(titleClear,`station title remains uncovered at ${size.width}x${size.height}`);
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await shot(p,`finish-${size.width}x${size.height}-expanded`);
   report.layouts.push({...size,visible});await c.close();
  }
  const c=await browser.newContext({viewport:{width:1440,height:900}}),p=await c.newPage(),videoRequests=[];
  p.on('pageerror',e=>report.errors.push(e.message));p.on('request',r=>{if(/\.mp4(?:\?|$)/.test(r.url()))videoRequests.push(new URL(r.url()).pathname.split('/').pop());});
  await p.goto(url);await p.waitForFunction(()=>window.EarthRadioTest);
  await p.locator('.skip-link').focus();await p.keyboard.press('Enter');
  assert(await p.locator('#stationDrawer').isVisible());assert.equal(await p.evaluate(()=>document.activeElement.id),'stationSearch');
  assert.equal(await p.locator('#stationsToggle').getAttribute('aria-expanded'),'true');
  await p.setViewportSize({width:375,height:812});await p.waitForTimeout(200);
  assert(await p.locator('#stationDrawer').isVisible());assert(await p.locator('#playerDrawer').isHidden());
  assert.equal(await p.locator('#stationsToggle').getAttribute('aria-expanded'),'true');
  assert.equal(await p.locator('#exploreToggle').getAttribute('aria-expanded'),'true');
  assert.equal(await p.locator('#globeCanvas').getAttribute('data-quality'),'lean');
  await p.setViewportSize({width:1440,height:900});await p.waitForTimeout(200);
  assert.equal(await p.locator('#globeCanvas').getAttribute('data-quality'),'detailed');
  await p.locator('#exploreToggle').click();
  await p.locator('#playButton').click();
  await p.waitForFunction(()=>window.EarthRadioTest.audio.layers.filter(l=>!l.visualOnly&&l.status==='ready').length===4,null,{timeout:45000});
  assert(!videoRequests.some(n=>n.includes('-hd')),'standard listening must not request HD video');
  report.standardVideoAssets=[...new Set(videoRequests)];
  report.standardAssetBytes=report.standardVideoAssets.reduce((n,file)=>n+fs.statSync(path.join(__dirname,'..','assets',file)).size,0);
  const motion=await p.evaluate(()=>new Promise(resolve=>{const values=[];let n=0;const timer=setInterval(()=>{values.push(window.EarthRadioTest.audio.layers.find(l=>l.id==='ocean').sonic.motion);if(++n===24){clearInterval(timer);resolve(values);}},250);}));
  assert(Math.max(...motion)<.99&&Math.max(...motion)-Math.min(...motion)>.02,'live ocean motion remains responsive');report.liveOceanMotion={min:Math.min(...motion),max:Math.max(...motion)};
  await p.locator('#detailToggle').click();
  await p.waitForFunction(()=>[...document.querySelectorAll('video')].some(v=>v.src.includes('ocean-hd.mp4')&&v.readyState>=2),null,{timeout:30000});
  assert(await p.evaluate(()=>window.EarthRadioTest.audio.getMedia('ocean').src.endsWith('/ocean.mp4')),'detailed display cannot change the analysis source');
  assert.equal(await p.evaluate(()=>[...document.querySelectorAll('video')].filter(v=>v.src.includes('-hd.mp4')).length),1,'only one detailed video exists');
  await p.locator('#tourStart').click();await p.locator('#tourNext').click();await p.locator('#demoA').click();
  await p.waitForFunction(()=>window.EarthRadioTest.getState().audio.stationId==='guided-listen');
  assert(await p.evaluate(()=>[...document.querySelectorAll('video')].find(v=>v.src.includes('ocean-hd.mp4')).paused),'detailed video pauses during the comparison');
  await p.keyboard.press('Escape');
  await p.waitForFunction(()=>window.EarthRadioTest.audio.station?.id==='california'&&window.EarthRadioTest.audio.layers.find(l=>l.id==='ocean')?.ready,null,{timeout:45000});
  assert.equal(await p.evaluate(()=>[...document.querySelectorAll('video')].filter(v=>v.src.includes('-hd.mp4')).length),1,'comparison returns to the same single display stream');
  await p.locator('#playButton').click();
  assert(await p.evaluate(()=>[...document.querySelectorAll('video')].find(v=>v.src.includes('ocean-hd.mp4')).paused));
  await p.locator('#signalNext').click();
  assert.equal(await p.evaluate(()=>[...document.querySelectorAll('video')].filter(v=>v.src.includes('-hd.mp4')).length),0,'view changes release the old detailed decoder');
  await c.route('**/night-hd.mp4',route=>route.abort());await p.locator('#detailToggle').click();
  await p.waitForFunction(()=>document.querySelector('#detailToggle').getAttribute('aria-pressed')==='false');
  assert.equal(await p.evaluate(()=>window.EarthRadioTest.audio.getState().layers.find(l=>l.id==='night').status),'ready','detailed-view failure does not disable the analysis layer');
  await p.locator('#muteButton').click();assert(await p.locator('#hostSkip').isDisabled());
  await p.locator('#hostSkip').dispatchEvent('click');assert.match(await p.locator('#liveStatus').textContent(),/muted/);
  await p.locator('#muteButton').click();assert(!(await p.locator('#hostSkip').isDisabled()));
  await p.locator('#playerExpand').click();await p.locator('#focusX').fill('80');await p.locator('#resetFocus').click();
  assert.equal(await p.evaluate(()=>window.EarthRadioTest.stations[0].layers.find(l=>l.id==='night').focus.x),.081,'focus reset restores fractional original coordinates');
  await p.evaluate(()=>{const e=window.EarthRadioTest.audio;e._fail(e.layers.find(l=>l.id==='night'),'test failure');});
  assert.match(await p.locator('#signalTime').textContent(),/UNAVAILABLE/);assert.match(await p.locator('#signalCompactTitle').textContent(),/unavailable/);
  assert.deepEqual(report.errors,[]);await c.close();
  if(out)fs.writeFileSync(path.join(out,'finishing-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);console.error(JSON.stringify(report,null,2));process.exitCode=1;});
