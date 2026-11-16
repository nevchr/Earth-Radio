const { chromium } = require('playwright');
const AxeBuilder = require('@axe-core/playwright').default;
const assert = require('node:assert/strict');
const path = require('node:path');

const url = process.env.EARTH_PREVIEW_URL || 'http://127.0.0.1:4178/';
const reportDir = process.env.EARTH_REPORT_DIR;
const report = { desktop: {}, mobile: {}, errors: [], axe: {} };
async function shot(page, name) { if (reportDir) await page.screenshot({ path: path.join(reportDir, name) }); }
async function levels(page) {
  return page.evaluate(async () => {
    const engine = window.EarthRadioTest.audio, analyser = engine.context.createAnalyser();
    analyser.fftSize = 1024; engine.compressor.connect(analyser);
    const samples = new Float32Array(analyser.fftSize); let peak = 0, square = 0, count = 0;
    await new Promise(resolve => { let n=0; const timer=setInterval(() => {
      analyser.getFloatTimeDomainData(samples);
      for(const value of samples){peak=Math.max(peak,Math.abs(value));square+=value*value;count++;}
      if(++n===60){clearInterval(timer);resolve();}
    },40); });
    engine.compressor.disconnect(analyser);
    return {peak,rms:Math.sqrt(square/count)};
  });
}
async function demoState(page) {
  return page.evaluate(() => {
    const e=window.EarthRadioTest.audio,l=e.layers[0];
    return {station:e.station?.id,playing:e.playing,mode:e._track()?.mode,tempo:e._track()?.tempo,layers:e.layers.length,
      type:l?.source.type,src:l?.source.url,metrics:l?.metrics,sonic:l?.sonic};
  });
}
(async () => {
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try {
    const context=await browser.newContext({viewport:{width:1440,height:900}});
    const page=await context.newPage();
    const coldMedia=[];
    page.on('pageerror',error=>report.errors.push(error.message));
    page.on('request',req=>{if(/\.(?:mp4|mp3)(?:\?|$)/i.test(req.url()))coldMedia.push(req.url());});
    assert.equal((await page.goto(url,{waitUntil:'domcontentloaded'})).status(),200);
    await page.waitForFunction(()=>window.EarthRadioTest?.stations.length===12);
    await page.waitForTimeout(800);
    assert.deepEqual(coldMedia,[], 'cold load should not decode station video or host audio');
    assert.match(await page.locator('#listenMapping').textContent(),/colour|brightness/i);
    assert.match(await page.locator('#viewSummary').textContent(),/2007|2008/);
    assert.equal(await page.getByRole('button',{name:'Show West Coast forest height view'}).count(),0,'forest is not a selectable globe view');
    for(const expected of ['night','pm25','river','ocean']){
      await page.locator('#signalNext').click();
      assert.equal(await page.evaluate(()=>window.EarthRadioTest.getState().focusedSource),expected,'Next view skips the sound-only forest source');
    }
    assert.equal((await page.request.get(new URL('README.md',url).href)).status(),200,'README link resolves');
    await shot(page,'iteration-desktop-compact.png');

    await page.locator('#playerExpand').click();
    assert.equal(await page.getByRole('button',{name:/Inspect West Coast forest height/}).count(),0,'forest is not selectable in the source viewer');
    assert.match(await page.locator('[data-layer="gedi"]').textContent(),/Sound input only/);
    assert.equal(await page.locator('[data-layer="gedi"] img').count(),0,'sound-only forest entry has no visual thumbnail');
    assert.match(await page.locator('#sourceList').textContent(),/West Coast forest height/,'NASA credit remains available');
    await page.locator('#describeFrame').click();
    assert.match(await page.locator('#frameDescription').textContent(),/Animation not loaded yet/);
    assert.doesNotMatch(await page.locator('#frameDescription').textContent(),/Still image; no time progression/);
    assert.match(await page.locator('#sampleScope').textContent(),/9 × 9.*96 × 54/);
    await shot(page,'iteration-desktop-details.png');

    await page.locator('#playButton').click();
    await page.waitForFunction(()=>{const s=window.EarthRadioTest.getState();return s.audio.playing&&s.audio.layers.filter(l=>!l.visualOnly&&l.status==='ready').length>=2;},null,{timeout:45000});
    assert.match(await page.locator('#mixSummary').textContent(),/Full mix:/);
    await page.waitForFunction(()=>window.EarthRadioTest.audio.layers.find(l=>l.id==='gedi')?.status==='ready',null,{timeout:45000});
    const forestBefore=await page.evaluate(()=>{const e=window.EarthRadioTest.audio.getMedia('gedi');return {time:e.currentTime,connected:e.isConnected,paused:e.paused};});
    await page.waitForTimeout(1200);
    const forestAfter=await page.evaluate(()=>window.EarthRadioTest.audio.getMedia('gedi').currentTime);
    assert(forestBefore.connected&&!forestBefore.paused&&forestAfter>forestBefore.time+.4,'sound-only forest frames remain connected and advance');
    await page.locator('.sound-only-listen').focus();await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(()=>window.EarthRadioTest.audio.soloSourceId),'gedi');
    assert.equal(await page.locator('.sound-only-listen').getAttribute('aria-pressed'),'true');
    assert.match(await page.locator('#mixSummary').textContent(),/Isolated layer: West Coast forest height/);
    assert.match(await page.locator('#viewSummary').textContent(),/Ocean currents/,'isolating sound-only forest does not change the view');
    await page.locator('#hearMix').click();
    assert.equal(await page.evaluate(()=>window.EarthRadioTest.audio.soloSourceId),null);
    await page.waitForFunction(()=>document.querySelector('#hostAudio').readyState>=2,null,{timeout:15000});
    report.desktop.host=await page.locator('#hostAudio').evaluate(e=>({duration:e.duration,error:e.error?.code??null}));
    assert.equal(report.desktop.host.error,null);
    await page.locator('#hostSkip').click();
    assert.equal(await page.evaluate(()=>window.EarthRadioHostTest.getState().active),false);
    await page.locator('#hostSkip').click();
    assert.equal(await page.evaluate(()=>window.EarthRadioHostTest.getState().active),true,'host intro can be replayed');
    await page.locator('#hostSkip').click();
    await page.locator('#hostMute').click();
    assert.equal(await page.locator('#hostMute').getAttribute('aria-pressed'),'true');
    await page.locator('#hostMute').click();
    assert.equal(await page.locator('#hostMute').getAttribute('aria-pressed'),'false');

    await page.getByRole('button',{name:'Show EIC night lights view'}).click();
    assert.match(await page.locator('#viewSummary').textContent(),/EIC night lights/);
    assert.match(await page.locator('#mixSummary').textContent(),/Full mix:/,'view switching does not silently change sound');
    await page.locator('#describeFrame').click();
    assert.match(await page.locator('#frameDescription').textContent(),/Animation playing/);
    await page.evaluate(()=>{const e=window.EarthRadioTest.audio;e._waiting(e.layers.find(l=>l.id==='night'));document.querySelector('#describeFrame').click();});
    assert.match(await page.locator('#frameDescription').textContent(),/Animation is loading or waiting for a frame/);
    await page.locator('#focusX').fill('75');
    assert.match(await page.locator('#sampleScope').textContent(),/right presentation panel/);
    await page.locator('#focusX').fill('8');
    await page.locator('#hearLayer').focus();await page.keyboard.press('Enter');
    await page.waitForTimeout(600);
    const solo=await page.evaluate(()=>{const e=window.EarthRadioTest.audio;return {id:e.soloSourceId,gains:Object.fromEntries(e.layers.filter(l=>l.voice).map(l=>[l.id,l.voice.gain.gain.value]))};});
    assert.equal(solo.id,'night');
    assert(solo.gains.night>0 && solo.gains.ocean<.001 && solo.gains.gedi<.001,`solo gain mismatch: ${JSON.stringify(solo)}`);
    await page.getByRole('button',{name:'Show Atmospheric river film view'}).click();
    assert(await page.locator('#hearLayer').isDisabled());
    assert.match(await page.locator('#viewSummary').textContent(),/visual context only/);
    assert.match(await page.locator('#mixSummary').textContent(),/EIC night lights/);
    assert.match(await page.locator('#sampleScope').textContent(),/not sampled for sound/);
    assert.equal(await page.locator('#focusTarget').isVisible(),false);
    await page.getByRole('button',{name:'Show EIC night lights view'}).click();
    assert.match(await page.locator('#sampleScope').textContent(),/left map panel/);
    await page.locator('#hearMix').focus();await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(()=>window.EarthRadioTest.audio.soloSourceId),null);
    await page.locator('#hearLayer').focus();await page.keyboard.press('Enter');

    await page.locator('#tourStart').click();
    assert.equal(await page.evaluate(()=>document.activeElement.id),'tourTitle');
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'tourNext');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'tourClose');
    await page.locator('#tourNext').click();
    assert.equal(await page.evaluate(()=>window.EarthRadioTest.getState().demoActive),false,'opening guide does not start demo sound');
    await page.keyboard.press('/');
    assert.equal(await page.locator('#stationDrawer').isHidden(),true,'background shortcuts do not open panels behind the modal guide');
    const visualBeforeDemo=await page.evaluate(()=>window.EarthRadioTest.audio.getMedia('night').currentTime);
    await page.locator('#demoA').focus();await page.keyboard.press('Enter');
    await page.waitForFunction(()=>{const s=window.EarthRadioTest.getState();return s.demoActive&&s.demoChoice==='A'&&s.audio.layers[0]?.status==='ready';},null,{timeout:20000});
    const a=await demoState(page); await page.waitForTimeout(600); const aLevel=await levels(page);
    await page.locator('#demoB').focus();await page.keyboard.press('Space');
    await page.waitForFunction(()=>window.EarthRadioTest.getState().audio.layers[0]?.metrics?.brightFraction>.3);
    const b=await demoState(page); await page.waitForTimeout(600); const bLevel=await levels(page);
    assert.equal(a.station,'guided-listen');assert.equal(b.station,'guided-listen');
    assert.equal(a.type,'image');assert.equal(a.src,b.src);assert.equal(a.layers,1);assert.equal(b.layers,1);
    assert.equal(a.tempo,b.tempo);assert.equal(a.mode,b.mode);
    assert(b.metrics.brightFraction>a.metrics.brightFraction+.3);
    assert(b.sonic.pitch>a.sonic.pitch && b.sonic.pulseHz>a.sonic.pulseHz);
    assert(bLevel.rms>aLevel.rms*2,`brighter frame must change actual graph output: ${JSON.stringify({aLevel,bLevel})}`);
    const statusChanges=await page.evaluate(()=>new Promise(resolve=>{
      let changes=0;const observer=new MutationObserver(()=>changes++);
      observer.observe(document.querySelector('#demoStatus'),{childList:true,characterData:true,subtree:true});
      setTimeout(()=>{observer.disconnect();resolve(changes);},1300);
    }));
    assert.equal(statusChanges,0,'the static comparison status does not announce on every audio tick');
    await shot(page,'iteration-desktop-guide.png');
    await page.locator('#demoPause').focus();await page.keyboard.press('Enter');
    assert.equal((await demoState(page)).playing,false);
    await page.locator('#demoReplay').click();
    await page.waitForFunction(()=>window.EarthRadioTest.getState().audio.playing);
    report.desktop.comparison={a:{brightFraction:a.metrics.brightFraction,pitch:a.sonic.pitch,level:aLevel},b:{brightFraction:b.metrics.brightFraction,pitch:b.sonic.pitch,level:bLevel}};
    const guideAxe=await new AxeBuilder({page}).include('#tourDialog').analyze();
    report.axe.guide=guideAxe.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}));
    await page.locator('#tourNext').click();
    await page.waitForFunction(()=>{const s=window.EarthRadioTest.getState();return !s.demoActive&&s.audio.stationId===s.selected&&s.audio.playing&&s.audio.soloSourceId===null;},null,{timeout:45000});
    await page.waitForFunction(()=>window.EarthRadioTest.audio.getState().layers.find(l=>l.id==='night')?.status==='ready',null,{timeout:45000});
    const visualAfterDemo=await page.evaluate(()=>window.EarthRadioTest.audio.getMedia('night').currentTime);
    assert(visualAfterDemo>=visualBeforeDemo-.3 && visualAfterDemo<visualBeforeDemo+4,'normal source resumes near its former video position');
    await page.locator('#tourNext').click();
    assert.equal(await page.evaluate(()=>document.activeElement.id),'tourStart');
    assert.equal(await page.locator('#hearMix').getAttribute('aria-pressed'),'true');
    assert.match(await page.locator('#mixSummary').textContent(),/Full mix/);

    const first=await page.locator('#trackTitle').textContent();
    await page.locator('#nextTrack').click();
    assert.notEqual(await page.locator('#trackTitle').textContent(),first);
    await page.locator('#trackProgress').fill('600');
    await page.locator('#trackProgress').dispatchEvent('change');
    assert((await page.evaluate(()=>window.EarthRadioTest.audio.getState().trackElapsed))>20);
    await page.locator('#playButton').click();
    assert.equal(await page.evaluate(()=>window.EarthRadioTest.audio.playing),false);
    await page.locator('#describeFrame').click();
    assert.match(await page.locator('#frameDescription').textContent(),/Animation paused/);
    await page.locator('#playButton').click();
    assert.equal(await page.evaluate(()=>window.EarthRadioTest.audio.playing),true);
    await page.locator('#playButton').click();
    const elapsedBeforePausedDemo=await page.evaluate(()=>window.EarthRadioTest.audio.getState().trackElapsed);
    await page.locator('#tourStart').click();await page.locator('#tourNext').click();await page.locator('#demoA').click();
    await page.waitForFunction(()=>window.EarthRadioTest.getState().audio.layers[0]?.status==='ready');
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(()=>window.EarthRadioTest.audio.playing),false,'exiting a paused station does not autoplay');
    assert.equal(await page.locator('#hearMix').getAttribute('aria-pressed'),'true');
    assert(await page.locator('#visualVideo').isVisible(),'the paused station retains its source poster after the comparison');
    await page.locator('#playButton').click();
    assert((await page.evaluate(()=>window.EarthRadioTest.audio.getState().trackElapsed))>=elapsedBeforePausedDemo-.5,'paused station position is restored on resume');
    await page.locator('#playButton').click();
    const playerAxe=await new AxeBuilder({page}).include('#playerDrawer').analyze();
    report.axe.player=playerAxe.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}));
    assert.deepEqual(report.axe.guide,[],'guided comparison has no automated axe violations');
    assert.deepEqual(report.axe.player,[],'receiver has no automated axe violations');
    await page.locator('#exploreToggle').click();await page.locator('[data-station="etna"]').click();
    await page.getByRole('button',{name:'Show Atmospheric aerosols view'}).click();
    await page.locator('#describeFrame').click();
    assert.match(await page.locator('#frameDescription').textContent(),/Still image not loaded yet/);
    await page.locator('#playButton').click();
    await page.waitForFunction(()=>window.EarthRadioTest.getState().audio.layers.find(l=>l.id==='aerosol')?.status==='ready',null,{timeout:45000});
    await page.locator('#describeFrame').click();
    assert.match(await page.locator('#frameDescription').textContent(),/Still image; no time progression/);
    await page.locator('#hearLayer').click();
    await page.evaluate(()=>{const e=window.EarthRadioTest.audio;e._fail(e.layers.find(l=>l.id==='aerosol'),'Simulated test failure');});
    await page.locator('#describeFrame').click();
    assert.match(await page.locator('#frameDescription').textContent(),/Source failed to load/);
    assert.match(await page.locator('#mixSummary').textContent(),/Unavailable: Atmospheric aerosols/);
    report.desktop.checks='cold load, README, unloaded and paused frame description, full mix, source switching, context-only, isolation gain, host skip/mute, frozen A/B output, replay/pause, focus trap and restoration, track/seek/pause/resume';
    await context.close();

    for(const viewport of [{width:390,height:844},{width:320,height:700}]){
      const c=await browser.newContext({viewport,reducedMotion:'reduce'}),p=await c.newPage();
      p.on('pageerror',error=>report.errors.push(error.message));
      await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.EarthRadioTest?.stations.length===12);
      assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile page must not overflow horizontally');
      await p.locator('#tourOpenNav').click();await p.locator('#tourNext').click();
      assert(await p.locator('#guidedComparison').isVisible());
      assert.equal(await p.evaluate(()=>window.EarthRadioTest.audio.playing),false,'opening the guide on a cold page does not autoplay');
      assert(await p.evaluate(()=>document.querySelector('.tour-card').scrollWidth<=document.querySelector('.tour-card').clientWidth));
      if(viewport.width===390)await shot(p,'iteration-mobile-guide.png');
      await p.keyboard.press('Escape');
      assert.equal(await p.evaluate(()=>document.activeElement.id),'tourOpenNav');
      await p.locator('#playerToggle').click();
      assert(await p.locator('#playButton').isVisible());
      if(viewport.width===390)await shot(p,'iteration-mobile-player.png');
      await p.locator('#playerExpand').click();
      assert(await p.evaluate(()=>document.querySelector('#playerDrawer').scrollWidth<=document.querySelector('#playerDrawer').clientWidth));
      report.mobile[`${viewport.width}x${viewport.height}`]='reduced motion, guide keyboard exit, compact and expanded layout, no horizontal overflow';
      await c.close();
    }
    assert.deepEqual(report.errors,[],'no uncaught page errors');
    console.log(JSON.stringify(report,null,2));
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);console.error(JSON.stringify(report,null,2));process.exitCode=1;});
