/* Earth Radio: place-based compositions from independent NASA visual timelines. */
const SOURCE_META = {
  ocean: { title:'Ocean currents', role:'Low, flowing foundation', period:'2007–2008', type:'Animation', projection:'approximate', scope:'Approximate area on a global flat map', url:'https://svs.gsfc.nasa.gov/3912/', credit:'NASA/Goddard Space Flight Center Scientific Visualization Studio', note:'Modelled sea surface currents and temperature. Visible colour and movement shape sound; pixels are not calibrated speed or temperature.', poster:'./assets/ocean-poster.jpg' },
  ocean2: { title:'Perpetual Ocean 2', role:'Bright current lines', period:'2021–2023 model, accelerated excerpt', type:'Animation', projection:'equirectangular', scope:'Equirectangular global map; approximate station focus', url:'https://svs.gsfc.nasa.gov/5505/', credit:"NASA's Scientific Visualization Studio", note:'ECCO-2 ocean-current beauty pass. White lines and blue colours are visual design, not a direct speed or temperature scale. This bundled 24-second version is accelerated and loops independently.', poster:'./assets/ocean2-poster.jpg' },
  night: { title:'EIC night lights', role:'Sparser, bright notes', period:'2012–2023 source sequence', type:'Animation excerpt', projection:'approximate', scope:'Approximate area in the left world-map panel', url:'https://svs.gsfc.nasa.gov/5313/', credit:"NASA's Scientific Visualization Studio", note:'Year labels are visible in NASA’s annual-map frames, but the player does not derive a year from playback seconds. Bright rendered pixels shape notes, not measured light output or population.', poster:'./assets/nightlights-poster.jpg' },
  nightmap: { title:'Black Marble night map', role:'Sparser, bright notes', period:'2012–2023 annual views, 29-second excerpt', type:'Animation', projection:'equirectangular', scope:'Equirectangular annual night-lights map', url:'https://svs.gsfc.nasa.gov/5475/', credit:"NASA's Scientific Visualization Studio", note:'NASA’s flat Black Marble movie shows annual-average lights with year labels. This excerpt ends before the later 2012–2023 change map. Light pixels shape notes; the added drum pulse is an artistic cue, not changing observed light.', poster:'./assets/nightmap-poster.jpg' },
  lightning: { title:'ISS lightning history', role:'Sparse grid-quantized ticks', period:'2017–2023, 10-day moving window', type:'Animation excerpt', projection:'equirectangular', scope:'Equirectangular global historical LIS map', url:'https://svs.gsfc.nasa.gov/5011/', credit:"NASA's Scientific Visualization Studio", note:'ISS LIS detections are shown in a historical 10-day roving window. Rendered point density shapes restrained sound on the music grid; ticks are not individual strikes or live events.', poster:'./assets/lightning-poster.jpg' },
  pm25: { title:'Air quality · PM2.5', role:'Warm model texture', period:'July–August 2024 model excerpt', type:'Animation excerpt', projection:'equirectangular', scope:'Equirectangular global PM2.5 model panel', url:'https://svs.gsfc.nasa.gov/5518/', credit:"NASA’s Global Modeling and Assimilation Office and NASA's Scientific Visualization Studio", note:'Single-pollutant PM2.5 layer from the Science on a Sphere version of the supplied air-quality visualization. Rendered colour and frame change shape sound; this is not a calibrated local concentration reading.', poster:'./assets/pm25-poster.jpg' },
  aerosol: { title:'Atmospheric aerosols', role:'Airy colour texture', period:'19 Aug 2025, 20:00 UTC', type:'Still image', projection:'approximate', scope:'Approximate area on a global flat map', url:'https://svs.gsfc.nasa.gov/5669/', credit:"NASA's Global Modeling Assimilation Office (GMAO) and NASA's Scientific Visualization Studio (SVS)", note:'GEOS model still. Rendered colour shapes a steady texture; it does not advance in time or report particle concentration.', poster:'./assets/aerosol.png' },
  gedi: { title:'West Coast forest height', role:'Soft forest accents', period:'2018–2019 regional GEDI view', type:'Moving regional animation', projection:'camera', scope:'U.S. West Coast scene, not fixed map pixels', url:'https://svs.gsfc.nasa.gov/4950/', credit:"NASA's Scientific Visualization Studio", note:'The camera and coverage move. Visual change can include camera motion; the audio is not a canopy-height measurement.', poster:'./assets/gedi-poster.jpg' },
  co2: { title:'Global CO₂ motion', role:'Planetary background', period:'Jan–Mar 2020 model', type:'Orbiting animation', projection:'camera', scope:'Global editorial layer; no local sampling', url:'https://svs.gsfc.nasa.gov/5196/', credit:"NASA's Scientific Visualization Studio", note:'The camera orbits Earth; sampled pixels do not remain over this station. Colour and movement are not CO₂ ppm or emissions.', poster:'./assets/co2-poster.jpg' },
  river: { title:'Atmospheric river film', role:'Visual context only', period:'MERRA-2 retrospective film excerpt', type:'Moving camera film', projection:'camera', scope:'Pacific coast context; no fixed map pixels', url:'https://svs.gsfc.nasa.gov/4960/', credit:"NASA's Scientific Visualization Studio", note:'Muted segment from NASA’s narrated film. The MERRA-2 retrospective camera moves; this contextual view is not sonified or projected onto the map texture.', poster:'./assets/river-poster.jpg' },
  'film-gulf': { title:'Gulf Stream close-up', role:'Visual context only', period:'2021–2023 model camera excerpt', type:'Moving camera film', projection:'camera', scope:'Gulf Stream cinematic view, not a flat map', url:'https://svs.gsfc.nasa.gov/5425/', credit:"NASA's Scientific Visualization Studio", note:'This film excerpt is shown for context. The paired equirectangular Perpetual Ocean 2 layer drives sound; the moving camera itself is not separately sonified or projected as a flat map.', poster:'./assets/oceanfilm-gulf-poster.jpg' },
  'film-japan': { title:'Kuroshio close-up', role:'Visual context only', period:'2021–2023 model camera excerpt', type:'Moving camera film', projection:'camera', scope:'Kuroshio cinematic view, not a flat map', url:'https://svs.gsfc.nasa.gov/5425/', credit:"NASA's Scientific Visualization Studio", note:'This film excerpt is shown for context. The paired equirectangular Perpetual Ocean 2 layer drives sound; the moving camera itself is not separately sonified or projected as a flat map.', poster:'./assets/oceanfilm-japan-poster.jpg' },
  'film-agulhas': { title:'Agulhas close-up', role:'Visual context only', period:'2021–2023 model camera excerpt', type:'Moving camera film', projection:'camera', scope:'Agulhas cinematic view, not a flat map', url:'https://svs.gsfc.nasa.gov/5425/', credit:"NASA's Scientific Visualization Studio", note:'This film excerpt is shown for context. The paired equirectangular Perpetual Ocean 2 layer drives sound; the moving camera itself is not separately sonified or projected as a flat map.', poster:'./assets/oceanfilm-agulhas-poster.jpg' }
};
const FRAME_METRICS = {
  ocean:[['Warm-looking colour','warmth'],['Frame change','change']],
  ocean2:[['Colour contrast','chroma'],['Frame change','change']],
  night:[['Bright pixel share','brightFraction'],['Rendered brightness','brightness']],
  nightmap:[['Bright pixel share','brightFraction'],['Rendered brightness','brightness']],
  lightning:[['Bright point share','brightFraction'],['Frame change','change']],
  pm25:[['Colour contrast','chroma'],['Frame change','change']],
  aerosol:[['Colour contrast','chroma'],['Warm-looking colour','warmth']],
  gedi:[['Rendered brightness','brightness'],['Frame change','change']],
  co2:[['Colour contrast','chroma'],['Camera motion (not mapped)','change']],
  river:[['Rendered brightness','brightness'],['Camera motion (not mapped)','change']],
  'film-gulf':[['Rendered brightness','brightness'],['Camera motion (not mapped)','change']],
  'film-japan':[['Rendered brightness','brightness'],['Camera motion (not mapped)','change']],
  'film-agulhas':[['Rendered brightness','brightness'],['Camera motion (not mapped)','change']]
};
const SOUND_MAPPING={
  ocean:'Warmer-looking colour raises the ocean tone; brightness opens its filter; frame change shifts its pulse and shared drum accents.',
  ocean2:'Rendered blue/white contrast and brightness shape the flowing tone; changing frames shape pulse and shared drum accents. Beauty-pass colours are not calibrated physical values.',
  night:'A larger share of bright pixels raises and adds glass-like notes; rendered brightness changes their tone.',
  nightmap:'Annual-map bright pixels raise and add glass-like notes; rendered brightness changes tone. The year label is part of NASA’s frame, not inferred from the music clock.',
  lightning:'Historical 10-day-window brightness shapes a faint tone and occasional grid-quantized ticks. The ticks are artistic timing, not detected strike times.',
  pm25:'Rendered colour contrast shapes pitch and frame change shapes a slow pulse. No sound parameter is calibrated to particulate concentration.',
  aerosol:'Colour contrast sets pitch and air-filter brightness; warmth shapes the level of a synthetic air texture. This still has no movement.',
  gedi:'Rendered brightness changes pitch; colour contrast changes tone; camera-driven frame motion can trigger soft plucks. These are not tree-height measurements.',
  co2:'Colour contrast shapes a quiet global bass pitch and pulse. Orbiting camera motion is shown for context but does not drive that pulse.',
  river:'Context film only. The moving-camera river excerpt does not drive sound or act as a flat map layer.',
  'film-gulf':'Context film only. The paired flat Perpetual Ocean 2 frames drive sound, not this moving camera.',
  'film-japan':'Context film only. The paired flat Perpetual Ocean 2 frames drive sound, not this moving camera.',
  'film-agulhas':'Context film only. The paired flat Perpetual Ocean 2 frames drive sound, not this moving camera.'
};
const station = (id,title,lat,lon,subtitle,story,layers) => ({id,title,lat,lon,subtitle,story,layers:layers.map(([id,x,y,weight,role,visualOnly=false])=>({id,focus:{x,y},weight,role,visualOnly}))});
const STATIONS = [
  station('california','California coast',38,-122,'Pacific • forest • human footprint','Pacific flow, a moving GEDI forest view, annual night lights, and a separate 2024 PM2.5 model image shape this station. A muted atmospheric-river camera film is available as context.',[['ocean',.161,.289,.29,'Flow'],['gedi',.46,.43,.19,'Forest'],['night',.081,.257,.15,'Lights'],['pm25',.161,.289,.14,'PM2.5 model'],['river',.5,.5,0,'Context film',true]]),
  station('gulf-stream','Gulf Stream',35,-74,'Atlantic • coast • atmosphere','Perpetual Ocean 2 current lines, an equirectangular annual night map, a still aerosol pattern, and a separate global CO₂ backdrop meet here. A muted Gulf Stream film offers a moving-camera view.',[['ocean2',.294,.306,.34,'Flow'],['nightmap',.294,.272,.18,'Lights'],['aerosol',.294,.306,.15,'Air'],['co2',.45,.25,.09,'Global context — not localized'],['film-gulf',.5,.5,0,'Context film',true]]),
  station('erin-atlantic','Western Atlantic / Erin',27,-71,'Atlantic • sea salt • 2025 still','An editorial point near the sea-salt spiral NASA attributes to Hurricane Erin in its 19 August 2025 aerosol still. This pin is not the storm’s tracked position; the ocean model is from 2007–2008.',[['ocean',.303,.350,.32,'Flow'],['aerosol',.303,.350,.26,'Sea salt still']]),
  station('mediterranean','Mediterranean margin',37,-2,'Europe • sea • air','A coastal entry point into sea, cities, and atmosphere across the western Mediterranean.',[['ocean',.494,.294,.32,'Flow'],['nightmap',.494,.262,.18,'Lights'],['aerosol',.494,.294,.16,'Air']]),
  station('etna','Etna / Ionian coast',37.7,15,'Sicily • sea • 2025 still','A Sicilian coastal entry point near the sulfate plume NASA attributes to Mount Etna in its 19 August 2025 aerosol still. Ocean and night-light visuals are from different years.',[['ocean',.542,.291,.27,'Sea'],['aerosol',.542,.291,.25,'Sulfate still'],['night',.271,.259,.12,'Lights']]),
  station('sahara','Sahara to Atlantic',19,-18,'Dust • eastern Atlantic','A quiet route from the Saharan dust field toward the eastern Atlantic. The aerosol layer is a single 2025 still.',[['ocean',.45,.394,.34,'Flow'],['aerosol',.45,.394,.24,'Dust']]),
  station('bay-bengal','Bay of Bengal',15,89,'Indian Ocean • coast • lights','An offshore Bay of Bengal entry point into the older ocean model and a separate 2025 aerosol still. The night-light focus is toward nearby West Bengal. A historical ISS lightning map supplies global context, not a local strike log.',[['ocean',.747,.417,.35,'Bay flow'],['aerosol',.747,.417,.20,'Air still'],['night',.373,.333,.15,'Nearby lights'],['lightning',.747,.417,.11,'Historical global context']]),
  station('java-offshore','Indian Ocean south of Java',-10,108,'Indian Ocean • south of Java','An offshore listening point south of Java, pairing the 2007–2008 ocean animation with an independent 2025 aerosol still. The pin does not mark a sensor or event.',[['ocean',.800,.556,.39,'Sea'],['aerosol',.800,.556,.22,'Air still']]),
  station('japan','Kuroshio / Japan',35,140,'Pacific • Japan • atmosphere','Perpetual Ocean 2 current lines meet Japanese night lights and a separate global aerosol snapshot. A muted close-up film is a moving-camera companion.',[['ocean2',.889,.306,.34,'Flow'],['nightmap',.889,.272,.18,'Lights'],['aerosol',.889,.306,.15,'Air'],['film-japan',.5,.5,0,'Context film',true]]),
  station('agulhas','Agulhas coast',-34,28,'Southern Africa • ocean • air','An offshore coastal entry point for Perpetual Ocean 2 current lines, aerosol colour, and nearby night lights, with a muted moving-camera film for context.',[['ocean2',.578,.689,.34,'Flow'],['nightmap',.578,.612,.17,'Lights'],['aerosol',.578,.689,.17,'Air'],['film-agulhas',.5,.5,0,'Context film',true]]),
  station('brazil-atlantic','Brazilian Atlantic',-30,-40,'South Atlantic • coast • lights','An offshore southeastern Brazil entry point into the ocean model and a separate aerosol still. The night-light focus is toward the nearby Rio coast, not the offshore pin.',[['ocean',.389,.667,.36,'Ocean'],['aerosol',.389,.667,.18,'Air still'],['night',.190,.558,.15,'Nearby lights']]),
  station('hawaii','Hawaiian Pacific',20,-155,'Pacific • volcanic atmosphere','Open Pacific motion with a still atmospheric view near Hawai‘i. NASA’s aerosol source notes the Kīlauea sulfate plume.',[['ocean',.069,.389,.35,'Flow'],['aerosol',.069,.389,.23,'Air']])
];
const TRACK_NAMES = {
  california: ['Pacific Glass','Canopy Signals','Coast After Dark'],
  'gulf-stream': ['Atlantic Flow','Coastal Pulse','Carbon Veil'],
  'erin-atlantic': ['Atlantic Spiral','Salt Air','Open Current'],
  mediterranean: ['Sea Passage','Harbour Lights','Air over Water'],
  etna: ['Ionian Drift','Coastal Light','Sulfate Veil'],
  sahara: ['Dust Route','Blue Margin','Quiet Crossing'],
  'bay-bengal': ['Bay Current','Coastal Points','Bay Air'],
  'java-offshore': ['South of Java','Current Arc','Southern Air'],
  japan: ['Kuroshio Lines','Night Harbours','Pacific Haze'],
  agulhas: ['Southern Turn','Coastal Pulse','Smoke and Sea'],
  'brazil-atlantic': ['South Atlantic Lines','Coast in Light','Atlantic Veil'],
  hawaii: ['Open Water','Volcanic Air','Island Drift']
};
const TRACK_STYLES = [
  {mode:'flow',duration:72,tempo:58,root:0,description:'A spacious arrangement led by the ocean image.',mix:{ocean:1.55,ocean2:1.55,night:.45,aerosol:.45,gedi:.75,co2:.5}},
  {mode:'pulse',duration:64,tempo:88,root:5,description:'A brighter rhythm led by the station’s changing visual layers.',mix:{ocean:.85,ocean2:.85,night:1.5,aerosol:.6,gedi:1.4,co2:.8}},
  {mode:'air',duration:78,tempo:70,root:7,description:'A restrained upper register led by atmospheric colour and texture.',mix:{ocean:.65,ocean2:.65,night:.6,aerosol:1.5,gedi:.9,co2:1.25}}
];
// These signatures and tempos are compositional choices, not NASA observations.
// Each place keeps a recognisable four-note contour across its three tracks.
const MUSIC_IDENTITIES={
  california:{tempos:[58,82,66],roots:[0,5,7],motif:[0,3,7,5,3,0,5,7]},
  'gulf-stream':{tempos:[54,76,62],roots:[-5,0,3],motif:[0,0,5,7,10,7,5,3]},
  'erin-atlantic':{tempos:[66,92,74],roots:[3,7,10],motif:[0,7,10,7,5,3,7,5]},
  mediterranean:{tempos:[68,96,76],roots:[5,10,12],motif:[0,5,3,10,7,5,3,0]},
  etna:{tempos:[62,84,69],roots:[0,3,7],motif:[0,3,5,10,7,3,5,0]},
  sahara:{tempos:[49,70,55],roots:[-7,-2,0],motif:[0,0,3,0,7,5,3,0]},
  'bay-bengal':{tempos:[64,90,72],roots:[2,7,10],motif:[0,5,10,7,5,3,7,10]},
  'java-offshore':{tempos:[59,83,67],roots:[-2,3,7],motif:[0,3,7,10,12,7,5,3]},
  japan:{tempos:[73,106,82],roots:[7,12,15],motif:[0,7,10,12,7,5,10,7]},
  agulhas:{tempos:[56,79,64],roots:[-3,2,5],motif:[0,5,7,5,0,3,5,10]},
  'brazil-atlantic':{tempos:[63,87,70],roots:[3,8,10],motif:[0,7,5,3,10,7,3,5]},
  hawaii:{tempos:[51,74,60],roots:[0,5,10],motif:[0,3,0,5,7,5,3,0]}
};
const RHYTHM = {
  california:{kickPitch:.94,hatTone:.88,density:.66,snareLevel:.64,note:'Hand-tuned soft low hits and muted high ticks leave room for Pacific imagery; ocean motion changes shared accents and forest camera motion adds plucks.'},
  'gulf-stream':{kickPitch:.82,hatTone:.9,density:.82,snareLevel:.78,note:'Hand-tuned deeper low hits and denser ticks sit under the ocean, night-light, aerosol, and global CO₂ voices.'},
  'erin-atlantic':{kickPitch:.86,hatTone:.92,density:.81,snareLevel:.69,note:'A denser beat and synthetic air texture accompany separate historical ocean motion and the 2025 aerosol still.'},
  mediterranean:{kickPitch:1.04,hatTone:1.15,density:.78,snareLevel:.68,note:'A lighter low hit and brighter high ticks sit beneath the sea, light, and air layers.'},
  etna:{kickPitch:.93,hatTone:1.08,density:.62,snareLevel:.61,note:'A restrained beat leaves space for the separate Ionian ocean view and a synthetic air texture shaped by the 2025 aerosol still.'},
  sahara:{kickPitch:.79,hatTone:.74,density:.36,snareLevel:.5,note:'Sparse low hits leave space for the synthetic air texture shaped by the dust-coloured aerosol still.'},
  'bay-bengal':{kickPitch:1.02,hatTone:1.06,density:.72,snareLevel:.58,note:'Medium-spaced low hits and clear ticks accompany the bay animation, independent aerosol still, and nearby coast lights.'},
  'java-offshore':{kickPitch:.9,hatTone:1.18,density:.57,snareLevel:.63,note:'Light high ticks and a spaced low beat leave room for the ocean animation and separate aerosol still.'},
  japan:{kickPitch:1.06,hatTone:1.24,density:.95,snareLevel:.8,note:'Tighter hand-tuned ticks sit beneath the ocean and night-light voices; ocean frame change shapes shared accents.'},
  agulhas:{kickPitch:.84,hatTone:.86,density:.7,snareLevel:.72,note:'Broad low hits and spaced high ticks support the separate southern ocean, aerosol, and night-light layers.'},
  'brazil-atlantic':{kickPitch:.87,hatTone:.94,density:.76,snareLevel:.75,note:'Broad low hits and moderate high ticks support the South Atlantic animation and the separate air and coast-light views.'},
  hawaii:{kickPitch:.96,hatTone:.78,density:.44,snareLevel:.53,note:'Spaced beats leave room for the Pacific animation and the separate aerosol still near Hawai‘i.'}
};
for(const place of STATIONS){
  const identity=MUSIC_IDENTITIES[place.id],m=identity.motif;
  const motifs=[[m[0],m[1],m[2],m[3]],m,[m[0],m[4],m[2],m[6]]];
  place.tracks=TRACK_STYLES.map((style,index)=>({...style,id:`${place.id}-${style.mode}`,title:TRACK_NAMES[place.id][index],tempo:identity.tempos[index],root:identity.roots[index],motif:motifs[index]}));
}
for(const place of STATIONS)place.rhythm=RHYTHM[place.id];
window.EARTH_STATIONS = STATIONS;
// These short, pre-generated ElevenLabs introductions are editorial narration.
// The MP3s are bundled: visitors do not call a speech service when listening.
const HOST_INTROS = {
  california:{voice:'Eve',script:'California coast. Pacific currents set the flow; forest imagery adds accents. These NASA visuals come from different years.'},
  'gulf-stream':{voice:'Udem',script:'Gulf Stream. Ocean-current frames lead this track; separate night-light images add bright notes.'},
  'erin-atlantic':{voice:'Kathy',script:"Western Atlantic. An older ocean animation meets a 2025 aerosol still near Erin's sea-salt spiral."},
  mediterranean:{voice:'Kade',script:'Mediterranean margin. Sea motion carries the rhythm; separate night-light and aerosol images add colour.'},
  etna:{voice:'Eve',script:'Etna and the Ionian coast. Ocean movement meets light and a separate 2025 sulfate-coloured still.'},
  sahara:{voice:'Udem',script:'Sahara to Atlantic. Sparse beats sit under ocean motion and one dust-coloured aerosol still.'},
  'bay-bengal':{voice:'Kathy',script:'Bay of Bengal. Ocean frames lead; nearby coast lights and a separate aerosol still add texture.'},
  'java-offshore':{voice:'Kade',script:'South of Java. The 2007 ocean model moves beneath a separate 2025 atmospheric still.'},
  japan:{voice:'Eve',script:'Kuroshio and Japan. Ocean frames flow under separate night-light points and atmospheric colour.'},
  agulhas:{voice:'Udem',script:'Agulhas coast. The southern ocean model meets separate air and nearby night-light views.'},
  'brazil-atlantic':{voice:'Kathy',script:'Brazilian Atlantic. Ocean motion leads; an air still and nearby coast lights shape the accents.'},
  hawaii:{voice:'Kade',script:'Hawaiian Pacific. Ocean currents carry the track; a separate still shows atmospheric colour near Hawai‘i.'}
};
const $ = id => document.getElementById(id);
const clamp = (v,a,b) => Math.min(b,Math.max(a,v));
const time = t => Number.isFinite(t) ? `${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}` : '00:00';
const text = (id,value) => {const node=$(id); if(node) node.textContent=value;};
let chosen = STATIONS[0], focusedSource='ocean', baseView=false, muted=false, lastVolume=.28, pendingTrackIndex=0, pendingTrackSeek=0, scrubbing=false, announcedTrackId=null;
let signalCollapsed=matchMedia('(max-width: 760px)').matches;
try{const saved=localStorage.getItem('earthRadioSourceCollapsed');if(saved!==null)signalCollapsed=saved==='1';}catch(_){/* Storage is optional. */}
function syncSignalCollapse(){
  const panel=$('signalWindow'),body=$('signalBody'),button=$('signalToggle');if(!panel||!body||!button)return;
  panel.dataset.collapsed=String(signalCollapsed);body.hidden=signalCollapsed;
  button.setAttribute('aria-expanded',String(!signalCollapsed));
  button.setAttribute('aria-label',signalCollapsed?'Expand NASA source window':'Collapse NASA source window');
}
let lastPreviewAt=0;
const audio = new window.EarthAudio({onUpdate:updateAudio});
const hostAudio=$('hostAudio');
const hostSeen=new Set();
let hostActive=false,hostSafetyTimer=null,hostMuted=false;
try{hostMuted=localStorage.getItem('earthRadioHostMuted')==='1';}catch(_){/* Storage is optional. */}
function hostVolume(){if(hostAudio)hostAudio.volume=Math.min(.55,audio.volume*1.55);}
function updateHostControls(){
  const mute=$('hostMute'),skip=$('hostSkip');
  if(mute){mute.textContent=hostMuted?'Unmute host':'Mute host';mute.setAttribute('aria-pressed',String(hostMuted));}
  if(skip){skip.textContent=hostActive?'Skip intro':'Replay intro';skip.disabled=hostMuted&&!hostActive;skip.setAttribute('aria-label',hostActive?'Skip station host introduction':`Replay ${chosen.title} station host introduction`);}
}
function stopHost(){
  clearTimeout(hostSafetyTimer);hostSafetyTimer=null;
  hostActive=false;
  if(hostAudio){hostAudio.pause();hostAudio.removeAttribute('src');hostAudio.load();}
  audio.setHostDuck(false);updateHostControls();
}
function startHost(force=false){
  if(!hostAudio||!HOST_INTROS[chosen.id]||hostActive||(!force&&hostSeen.has(chosen.id)))return;
  const id=chosen.id;
  hostSeen.add(id);
  if(hostMuted||audio.volume===0)return;
  hostAudio.src=`./assets/hosts/${id}.mp3`;
  hostVolume();hostActive=true;audio.setHostDuck(true);updateHostControls();
  // Fail open to the music if a clip stalls or a browser rejects playback.
  hostSafetyTimer=setTimeout(()=>{if(hostActive&&chosen.id===id){stopHost();announce('Station host timed out. Music continues.');}},15000);
  try{Promise.resolve(hostAudio.play()).catch(()=>{if(chosen.id===id&&hostActive){stopHost();announce('Station host unavailable. Music continues.');}});}
  catch(_){stopHost();}
}
hostAudio?.addEventListener('ended',stopHost);
hostAudio?.addEventListener('error',()=>{if(hostActive){stopHost();announce('Station host unavailable. Music continues.');}});
window.EarthRadioHostTest={start:startHost,stop:stopHost,getState:()=>({active:hostActive,muted:hostMuted,seen:[...hostSeen],currentSrc:hostAudio?.currentSrc||''})};
const globe = new window.EarthGlobe({canvas:$('globeCanvas'),stations:STATIONS,onSelect:selectStation,getBeatPulse:()=>audio.getBeatPulse()});
// Keep engine-owned videos connected when their source card is not in view.
// Disconnecting a playing <video> can pause it and freeze its sonic metrics.
const mediaParking=document.createElement('div');mediaParking.hidden=true;mediaParking.setAttribute('aria-hidden','true');document.body.append(mediaParking);
window.EarthRadioTest={stations:STATIONS,audio,getState:()=>({selected:chosen.id,focusedSource,baseView,audio:audio.getState()})};

function announce(message){text('liveStatus',message);}
function currentLayers(){return audio.getState()?.layers||[];}
function currentLayer(){return currentLayers().find(layer=>layer.id===focusedSource);}
function setPanel(id,open,buttonId){
  const panel=$(id),button=$(buttonId); if(!panel)return;
  if(open&&id==='aboutDrawer')setPanel('sourceDrawer',false,'sourceToggle');
  if(open&&id==='sourceDrawer')setPanel('aboutDrawer',false,'aboutToggle');
  if(open&&matchMedia('(max-width: 760px)').matches&&id==='stationDrawer')setPanel('playerDrawer',false,'playerToggle');
  if(open&&matchMedia('(max-width: 760px)').matches&&id==='playerDrawer')setPanel('stationDrawer',false,'stationsToggle');
  const hadFocus=panel.contains(document.activeElement);
  panel.hidden=!open;button?.setAttribute('aria-expanded',String(open));
  panel.dataset.open=String(open);
  if(id==='stationDrawer')$('exploreToggle')?.setAttribute('aria-expanded',String(open));
  if(open)(panel.querySelector('input, .close-button, button, h2[tabindex]'))?.focus({preventScroll:true});
  else if(hadFocus)(id==='stationDrawer'&&!matchMedia('(max-width: 760px)').matches?$('exploreToggle'):button)?.focus({preventScroll:true});
}
function renderStations(){
  const list=$('stationList');if(!list)return;
  const q=$('stationSearch')?.value.trim().toLocaleLowerCase()||'';
  const filtered=STATIONS.filter(s=>`${s.title} ${s.subtitle}`.toLocaleLowerCase().includes(q));
  list.replaceChildren(...filtered.map(s=>{
    const b=document.createElement('button'); b.type='button'; b.className='station-item';b.dataset.station=s.id;
    b.setAttribute('aria-current',String(s.id===chosen.id));b.setAttribute('aria-label',`Tune to ${s.title}, ${s.subtitle}`);
    const title=document.createElement('strong');title.textContent=s.title;
    const detail=document.createElement('small');detail.textContent=s.subtitle;
    b.append(title,detail);b.addEventListener('click',()=>selectStation(s.id));return b;
  }));
  text('stationCount',String(filtered.length).padStart(2,'0'));
  const empty=$('noStations');if(empty)empty.hidden=filtered.length!==0;
}
function selectStation(id){
  const next=STATIONS.find(s=>s.id===id);if(!next)return;
  if(next.id===chosen.id){
    globe.select(id);
    setPanel('stationDrawer',false,'stationsToggle');
    if(matchMedia('(max-width: 760px)').matches)setPanel('playerDrawer',true,'playerToggle');
    $('receiverTitle')?.focus({preventScroll:true});
    announce(`${next.title} remains selected. ${audio.getState().playing?'Station continues playing.':'Press Play to hear the station.'}`);
    return;
  }
  stopHost();audio.stop();mediaParking.replaceChildren();$('visualFrame')?.querySelector('.active-media')?.remove();
  chosen=next;focusedSource=next.layers[0].id;baseView=false;pendingTrackIndex=0;pendingTrackSeek=0;scrubbing=false;
  globe.select(id);renderStations();renderStation();updateAudio(audio.getState());
  setPanel('stationDrawer',false,'stationsToggle');
  if(matchMedia('(max-width: 760px)').matches)setPanel('playerDrawer',true,'playerToggle');
  $('receiverTitle')?.focus({preventScroll:true});
  announce(`${next.title} selected. Three generated tracks using ${next.layers.length} NASA visual layers. Press Play to hear the station.`);
}
function renderStation(){
  text('receiverTitle',chosen.title);text('receiverDescription',chosen.story);
  text('hostTranscript',HOST_INTROS[chosen.id]?.script||'No host introduction available.');updateHostControls();
  text('rhythmDescription',`Percussion: ${chosen.rhythm.note} These are synthesized sounds, not recordings of this location.`);
  text('receiverPlace',chosen.subtitle);text('receiverKind',`${chosen.layers.length} NASA views · ${chosen.tracks.length} tracks`);
  text('timelineContext','Each animated NASA source runs on its own historical timeline. This slider controls only the selected view.');
  renderLayers();renderViewPicker();showFocusedMedia();
}
function updatePreview(force=false){
  const meta=SOURCE_META[focusedSource],poster=$('previewPoster'),canvas=$('previewCanvas'),button=$('previewButton');
  if(!meta||!poster||!canvas||!button)return;
  if(poster.dataset.source!==focusedSource){poster.dataset.source=focusedSource;poster.src=meta.poster;poster.hidden=false;canvas.hidden=true;force=true;}
  const signalPoster=$('signalPoster'),signalCanvas=$('signalCanvas');
  if(signalPoster&&signalCanvas&&signalPoster.dataset.source!==focusedSource){signalPoster.dataset.source=focusedSource;signalPoster.src=meta.poster;signalPoster.hidden=false;signalCanvas.hidden=true;force=true;}
  text('previewCaption',`NASA · ${{ocean:'Ocean',ocean2:'Ocean 2',night:'EIC lights',nightmap:'Night map',lightning:'Lightning',pm25:'PM2.5',aerosol:'Aerosols',gedi:'Forest',co2:'CO₂',river:'River','film-gulf':'Gulf film','film-japan':'Kuroshio film','film-agulhas':'Agulhas film'}[focusedSource]}`);
  text('signalTitle',meta.title);text('signalCompactTitle',meta.title);
  text('signalTime',`${meta.type} · ${meta.period}`);
  const signalWindow=document.querySelector('.signal-window');if(signalWindow)signalWindow.dataset.beat=String(focusedSource==='night'||focusedSource==='nightmap');
  text('signalHeading',baseView?'NASA SOUND INPUT':meta.projection==='camera'?'NASA CAMERA VIEW':'NASA VIEW');
  text('signalExplanation',chosen.layers.find(layer=>layer.id===focusedSource)?.visualOnly?'This moving-camera NASA film is visual context. It is not sonified or wrapped onto the globe.':baseView?'This original NASA frame still shapes sound. The globe shows the Blue Marble base map.':focusedSource==='night'||focusedSource==='nightmap'?'Light pixels shape tones. Globe brightness is boosted; this frame is original. Blue pulses mark the drum beat.':meta.projection==='camera'?'The camera moves, so this frame shapes sound but cannot be placed at an exact globe coordinate.':`NASA pixels shape sound and this ${meta.projection==='equirectangular'?'equirectangular':'approximate'} globe view. Globe colour is boosted; this frame is original.`);
  button.setAttribute('aria-label',`Inspect current NASA visual: ${meta.title}`);
  if(!force&&(document.hidden||performance.now()-lastPreviewAt<550))return;
  const element=currentLayer()?.element;
  const ready=element&&(element.tagName==='VIDEO'?element.readyState>=2&&!element.seeking:element.complete&&element.naturalWidth);
  const media=ready?element:poster.complete&&poster.naturalWidth?poster:null;
  if(!media)return;
  const width=media.videoWidth||media.naturalWidth,height=media.videoHeight||media.naturalHeight;
  if(!width||!height)return;
  const sourceWidth=focusedSource==='night'?width/2:width;
  const scale=Math.min(canvas.width/sourceWidth,canvas.height/height),shownWidth=sourceWidth*scale,shownHeight=height*scale;
  try{const context=canvas.getContext('2d');context.clearRect(0,0,canvas.width,canvas.height);context.drawImage(media,0,0,sourceWidth,height,(canvas.width-shownWidth)/2,(canvas.height-shownHeight)/2,shownWidth,shownHeight);canvas.hidden=false;poster.hidden=true;
    if(signalCanvas&&signalPoster){const c=signalCanvas.getContext('2d'),s=Math.min(signalCanvas.width/sourceWidth,signalCanvas.height/height),sw=sourceWidth*s,sh=height*s;c.clearRect(0,0,signalCanvas.width,signalCanvas.height);c.drawImage(media,0,0,sourceWidth,height,(signalCanvas.width-sw)/2,(signalCanvas.height-sh)/2,sw,sh);signalCanvas.hidden=false;signalPoster.hidden=true;}
    lastPreviewAt=performance.now();}
  catch(error){canvas.hidden=true;poster.hidden=false;}
}
function makeLayerCard(config,state){
  const m=SOURCE_META[config.id],button=document.createElement('button');button.type='button';button.className='layer-card';
  button.dataset.layer=config.id;button.setAttribute('aria-pressed',String(config.id===focusedSource));
  button.setAttribute('aria-label',`Inspect ${m.title}, ${m.type}, ${m.period}`);
  const img=document.createElement('img');img.src=m.poster;img.alt='';img.loading='lazy';
  const body=document.createElement('span');body.className='layer-body';
  const title=document.createElement('strong');title.textContent=m.title;
  const details=document.createElement('small');details.textContent=`${config.visualOnly?'Visual context · ':''}${config.role} · ${m.period}`;
  const status=document.createElement('span');status.className='layer-status';status.textContent=state?.status||'Ready to load';
  body.append(title,details,status);button.append(img,body);
  button.addEventListener('click',()=>{selectView(config.id);$('layerList')?.querySelector(`[data-layer="${config.id}"]`)?.focus({preventScroll:true});});
  return button;
}
function renderLayers(){
  const list=$('layerList');if(!list)return;
  const states=currentLayers();list.replaceChildren(...chosen.layers.map(config=>makeLayerCard(config,states.find(l=>l.id===config.id))));
}
function renderViewPicker(){
  const picker=$('viewPicker');if(!picker)return;
  const earth=document.createElement('button');earth.type='button';earth.className='view-choice view-choice-earth';earth.title='Plain Earth';earth.setAttribute('aria-label','Show plain Earth without NASA globe overlay');earth.setAttribute('aria-pressed',String(baseView));
  const earthIcon=document.createElement('span');earthIcon.setAttribute('aria-hidden','true');earthIcon.textContent='◎';earth.append(earthIcon);
  earth.addEventListener('click',()=>selectView('base'));
  const items=chosen.layers.map(config=>{
    const meta=SOURCE_META[config.id],button=document.createElement('button');button.type='button';button.className='view-choice';button.title=meta.title;
    button.setAttribute('aria-label',`Show ${meta.title} view`);button.setAttribute('aria-pressed',String(!baseView&&focusedSource===config.id));
    const image=document.createElement('img');image.src=meta.poster;image.alt='';image.loading='lazy';button.append(image);
    button.addEventListener('click',()=>selectView(config.id));return button;
  });
  picker.replaceChildren(earth,...items);
}
function selectView(id){
  const pickerHadFocus=$('viewPicker')?.contains(document.activeElement);
  if(id==='base'){
    baseView=true;renderViewPicker();if(pickerHadFocus)$('viewPicker')?.querySelector('[aria-pressed="true"]')?.focus({preventScroll:true});updatePreview(true);updateAudio(audio.getState());
    announce('Plain Earth view selected. NASA visual frames continue shaping the sound.');return;
  }
  if(!chosen.layers.some(layer=>layer.id===id))return;
  baseView=false;focusedSource=id;renderLayers();renderViewPicker();if(pickerHadFocus)$('viewPicker')?.querySelector('[aria-pressed="true"]')?.focus({preventScroll:true});showFocusedMedia();updateAudio(audio.getState());
  announce(`${SOURCE_META[id].title} NASA view selected. ${SOURCE_META[id].scope}.`);
}
function showFocusedMedia(){
  const meta=SOURCE_META[focusedSource],frame=$('visualFrame');if(!meta||!frame)return;
  audio.setVisualFocus(focusedSource);
  const layer=currentLayer(),existing=frame.querySelector('.active-media');
  if(existing&&existing!==layer?.element){existing.classList.remove('active-media');mediaParking.append(existing);}
  const placeholder=$('visualVideo'),still=$('visualImage');
  if(placeholder)placeholder.hidden=true;if(still)still.hidden=true;
  if(layer?.element){
    layer.element.classList.add('active-media');layer.element.setAttribute('aria-label',`${meta.title}: ${meta.type}${chosen.layers.find(config=>config.id===focusedSource)?.visualOnly?' shown as visual context':' used to shape the current sound'}`);
    if(layer.element.parentNode!==frame)frame.prepend(layer.element);
  }else if(meta.type==='Still image'&&still){still.src=meta.poster;still.alt=`${meta.title} NASA still visualization`;still.hidden=false;}
  else if(placeholder){placeholder.poster=meta.poster;placeholder.removeAttribute('src');placeholder.hidden=false;}
  text('visualCaption',`${meta.title.toUpperCase()} · NASA SVS · ${meta.period}`);
  text('sourceContext',`${meta.scope}. ${meta.note}`);
  text('mappingLegend',`How to listen: ${SOUND_MAPPING[focusedSource]}`);
  text('timelineContext',`${meta.period}. This source has its own timeline, independent of the other layers.`);
  const link=$('sourceLink');if(link)link.href=meta.url;
  const config=chosen.layers.find(l=>l.id===focusedSource);text('focusCoordinates',config?`FOCUS · ${Math.round(config.focus.x*100)}% / ${Math.round(config.focus.y*100)}%`:'FOCUS');
  for(const [axis,id] of [['x','focusX'],['y','focusY']])if($(id)&&config)$(id).value=String(Math.round(config.focus[axis]*100));
  if(layer?.element&&!layer.element.dataset.focusTargetBound){
    layer.element.dataset.focusTargetBound='true';
    layer.element.addEventListener('loadedmetadata',updateFocusTarget);
    layer.element.addEventListener('load',updateFocusTarget);
  }
  updatePreview(true);
  updateFocusTarget();
  const slider=$('timeline');if(slider){slider.disabled=meta.type==='Still image'||!layer?.element||!Number.isFinite(layer.element.duration);slider.value='0';}
  updateTime();
}
function updateFocusTarget(){
  const frame=$('visualFrame'),target=$('focusTarget');
  const focus=chosen.layers.find(l=>l.id===focusedSource)?.focus;
  if(!frame||!target||!focus)return;
  const media=frame.querySelector('.active-media');
  const mediaWidth=media?.videoWidth||media?.naturalWidth||frame.clientWidth;
  const mediaHeight=media?.videoHeight||media?.naturalHeight||frame.clientHeight;
  const scale=Math.min(frame.clientWidth/mediaWidth,frame.clientHeight/mediaHeight);
  const shownWidth=mediaWidth*scale,shownHeight=mediaHeight*scale;
  target.style.left=`${(frame.clientWidth-shownWidth)/2+focus.x*shownWidth}px`;
  target.style.top=`${(frame.clientHeight-shownHeight)/2+focus.y*shownHeight}px`;
  target.style.width=`${shownWidth*9/96}px`;
  target.style.height=`${shownHeight*9/54}px`;
}
function updateTime(){
  const layer=currentLayer(),v=layer?.element,slider=$('timeline');
  if(!v||v.tagName!=='VIDEO'||!Number.isFinite(v.duration)){if(slider)slider.disabled=true;text('timeReadout','STILL / WAITING');return;}
  if(slider)slider.disabled=false;
  text('timeReadout',`${time(v.currentTime)} / ${time(v.duration)}`);
  if(slider&&document.activeElement!==slider)slider.value=String(Math.round(1000*v.currentTime/v.duration));
  slider?.setAttribute('aria-valuetext',`${time(v.currentTime)} of ${time(v.duration)} in ${SOURCE_META[focusedSource].title} video`);
}
function updateAudio(state){
  if(!state)return;const playing=!!state.playing;
  const shownLayers=state.stationId===chosen.id?state.layers||[]:[];
  const selectedLayer=shownLayers.find(item=>item.id===focusedSource),selectedMeta=SOURCE_META[focusedSource];
  const poster=$('signalPoster');
  const fallback=poster?.dataset.source===focusedSource&&poster.complete&&poster.naturalWidth?poster:null;
  const globeMedia=selectedMeta?.projection==='camera'?null:selectedLayer?.status==='ready'?selectedLayer.element:fallback;
  globe.setOverlaysEnabled(!baseView);globe.setVisuals({playing,media:baseView?null:globeMedia,kind:focusedSource,label:selectedMeta?.title||'',projection:selectedMeta?.projection||'approximate'});
  const engineTrack=state.stationId===chosen.id&&state.track;
  const track=engineTrack?state.track:chosen.tracks[pendingTrackIndex];
  const trackIndex=engineTrack?state.trackIndex:pendingTrackIndex;
  const elapsed=engineTrack?state.trackElapsed:0;
  if(engineTrack)pendingTrackIndex=trackIndex;
  text('trackPosition',`TRACK ${String(trackIndex+1).padStart(2,'0')} / ${String(chosen.tracks.length).padStart(2,'0')}`);
  text('trackTitle',track.title);text('trackDescription',track.description);
  const displayedElapsed=state.stationId===chosen.id?elapsed:pendingTrackSeek;
  if(!scrubbing)text('trackTime',`${time(displayedElapsed)} / ${time(track.duration)}`);
  const progress=$('trackProgress');if(progress&&!scrubbing){progress.value=String(Math.round(1000*displayedElapsed/track.duration));progress.style.setProperty('--seek-percent',`${(100*displayedElapsed/track.duration).toFixed(2)}%`);progress.setAttribute('aria-valuetext',`${time(displayedElapsed)} of ${time(track.duration)} in ${track.title}`);}
  $('prevTrack')?.setAttribute('aria-label',`Previous track: ${chosen.tracks[(trackIndex+chosen.tracks.length-1)%chosen.tracks.length].title}`);
  $('nextTrack')?.setAttribute('aria-label',`Next track: ${chosen.tracks[(trackIndex+1)%chosen.tracks.length].title}`);
  if(announcedTrackId&&track.id!==announcedTrackId&&playing)announce(`Now playing track ${trackIndex+1} of ${chosen.tracks.length}: ${track.title}.`);
  announcedTrackId=track.id;
  text('playLabel',playing?'Pause station':'Play station');
  const play=$('playButton');if(play){play.setAttribute('aria-label',playing?`Pause ${chosen.title} station`:`Play ${chosen.title} station`);play.classList.toggle('is-playing',playing);}
  const failures=state.layers?.filter(l=>l.status==='failed')||[];
  const total=state.layers?.length||0;
  $('audioHint')?.classList.toggle('is-error',failures.length>0);
  text('audioHint',total&&failures.length===total?'NASA views could not load. See source links or choose another station.':failures.length?`${failures.length} layer${failures.length===1?' is':'s are'} unavailable; the other NASA views can still play.`:playing?'Tracks rotate automatically. NASA visual timelines are independent.':'Three tracks rotate automatically.');
  if($('layerList')?.childElementCount!==chosen.layers.length)renderLayers();
  for(const config of chosen.layers){const card=$('layerList')?.querySelector(`[data-layer="${config.id}"]`);if(!card)continue;const s=state.layers?.find(l=>l.id===config.id);const label=card.querySelector('.layer-status');if(label)label.textContent=s?.status||'Ready to load';card.setAttribute('aria-pressed',String(config.id===focusedSource));}
  const layer=currentLayer();if(layer?.element&&!layer.element.isConnected)showFocusedMedia();
  const unavailable=$('visualUnavailable');if(unavailable){unavailable.hidden=layer?.status!=='failed';if(layer?.status==='failed')unavailable.textContent=`${SOURCE_META[focusedSource]?.title||'This NASA view'} could not load. Use the NASA source link below or select another layer.`;}
  const mapped=FRAME_METRICS[focusedSource]||FRAME_METRICS.ocean;
  for(const [index,[label,key]] of mapped.entries()){
    const name=index?'change':'brightness',raw=layer?.metrics?.[key];
    text(`${name}Label`,label);text(`${name}Value`,Number.isFinite(raw)?`${Math.round(clamp(raw,0,1)*100)}%`:'—');
    const bar=$(`${name}Bar`);if(bar)bar.style.width=Number.isFinite(raw)?`${Math.round(clamp(raw,0,1)*100)}%`:'0%';
  }
  text('onAir',total&&failures.length===total?'SOURCES UNAVAILABLE':playing?(state.layers?.some(l=>l.status==='ready')?'PLAYING':'LOADING'):'READY');
  updatePreview();
  updateTime();
}

$('previewPoster')?.addEventListener('load',()=>updatePreview(true));
$('signalPoster')?.addEventListener('load',()=>{updatePreview(true);updateAudio(audio.getState());});
$('previewButton')?.addEventListener('click',()=>{if($('playerDetails')?.hidden)$('playerExpand')?.click();$('visualFrame')?.focus({preventScroll:true});$('visualFrame')?.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});});
$('signalToggle')?.addEventListener('click',()=>{
  signalCollapsed=!signalCollapsed;syncSignalCollapse();
  try{localStorage.setItem('earthRadioSourceCollapsed',signalCollapsed?'1':'0');}catch(_){/* Storage is optional. */}
  announce(signalCollapsed?'NASA source window collapsed.':'NASA source window expanded.');
});
$('signalNext')?.addEventListener('click',()=>{const index=chosen.layers.findIndex(layer=>layer.id===focusedSource);selectView(chosen.layers[(index+1)%chosen.layers.length].id);$('signalNext')?.focus({preventScroll:true});});
const TOUR_STEPS=[
  {title:'Choose a place',text:'Drag the globe or open Explore to choose a listening point. Pins are curated regions, not sensors.'},
  {title:'Listen and watch',text:'Press Play in the receiver. The small NASA frame updates as the source video plays; the tones and percussion are synthesized from rendered pixels.'},
  {title:'Check the source',text:'Open “How this sound is made” to switch views, inspect each historical date, and read the sound mapping. The sources do not share one timeline.'}
];
let tourIndex=0,tourReturnFocus=null;
function renderTour(){const step=TOUR_STEPS[tourIndex];text('tourStep',`${tourIndex+1} / ${TOUR_STEPS.length}`);text('tourTitle',step.title);text('tourText',step.text);$('tourBack').disabled=tourIndex===0;text('tourNext',tourIndex===TOUR_STEPS.length-1?'Finish':'Next');$('tourTitle')?.focus({preventScroll:true});}
function closeTour(){const dialog=$('tourDialog');if(dialog?.hidden)return;dialog.hidden=true;tourReturnFocus?.focus({preventScroll:true});}
$('tourStart')?.addEventListener('click',()=>{tourReturnFocus=document.activeElement;tourIndex=0;$('tourDialog').hidden=false;renderTour();});
$('tourClose')?.addEventListener('click',closeTour);
$('tourBack')?.addEventListener('click',()=>{if(tourIndex>0){tourIndex--;renderTour();}});
$('tourNext')?.addEventListener('click',()=>{if(tourIndex===TOUR_STEPS.length-1)closeTour();else{tourIndex++;renderTour();}});
$('tourDialog')?.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeTour();return;}if(event.key!=='Tab')return;const items=[...$('tourDialog').querySelectorAll('button:not(:disabled), [tabindex="-1"]')];const first=items[0],last=items[items.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}});

$('playButton')?.addEventListener('click',()=>{
  const state=audio.getState();
  if(state?.playing){stopHost();audio.pause();announce(`${chosen.title} paused on ${chosen.tracks[pendingTrackIndex].title}.`);return;}
  // The audio engine invokes resume() and all media play() calls in this user gesture.
  const requested=chosen.id,pending=audio.play(chosen,pendingTrackIndex);if(pendingTrackSeek>0)audio.seekTrack(pendingTrackSeek);startHost();updateAudio(audio.getState());
  Promise.resolve(pending).then(result=>{if(chosen.id!==requested)return;updateAudio(result);if(!result?.playing){stopHost();announce('Playback is paused.');return;}const loaded=result?.layers?.filter(l=>l.status==='ready'||l.status==='playing').length||0;const failed=result?.layers?.filter(l=>l.status==='failed').length||0;announce(loaded?`${chosen.title} station playing ${result.track?.title||chosen.tracks[pendingTrackIndex].title} from ${loaded} NASA layers${failed?`; ${failed} unavailable`:''}.`:failed===result?.layers?.length?'All NASA layers are unavailable. Open a NASA source link or try another station.':'The media is loading.');}).catch(error=>{if(chosen.id!==requested)return;stopHost();announce('Audio could not start in this browser. NASA sources remain available.');console.error(error);});
});
function moveTrack(direction){
  stopHost();pendingTrackSeek=0;scrubbing=false;
  const state=audio.getState();
  if(state.stationId===chosen.id){const next=direction>0?audio.nextTrack():audio.previousTrack();pendingTrackIndex=next.trackIndex;updateAudio(next);}
  else {pendingTrackIndex=(pendingTrackIndex+direction+chosen.tracks.length)%chosen.tracks.length;updateAudio(state);}
  if(!audio.getState().playing)announce(`Track ${pendingTrackIndex+1} of ${chosen.tracks.length}: ${chosen.tracks[pendingTrackIndex].title} selected.`);
}
$('prevTrack')?.addEventListener('click',()=>moveTrack(-1));
$('nextTrack')?.addEventListener('click',()=>moveTrack(1));
$('trackProgress')?.addEventListener('input',event=>{
  scrubbing=true;
  const state=audio.getState(),track=state.stationId===chosen.id?chosen.tracks[state.trackIndex]:chosen.tracks[pendingTrackIndex];
  const seconds=track.duration*Number(event.target.value)/1000;
  text('trackTime',`${time(seconds)} / ${time(track.duration)}`);
  event.target.style.setProperty('--seek-percent',`${Number(event.target.value)/10}%`);
  event.target.setAttribute('aria-valuetext',`${time(seconds)} of ${time(track.duration)} in ${track.title}`);
});
$('trackProgress')?.addEventListener('change',event=>{
  const state=audio.getState(),track=state.stationId===chosen.id?chosen.tracks[state.trackIndex]:chosen.tracks[pendingTrackIndex];
  const seconds=Math.min(track.duration-.02,track.duration*Number(event.target.value)/1000);
  scrubbing=false;
  if(state.stationId===chosen.id){audio.seekTrack(seconds);pendingTrackSeek=0;updateAudio(audio.getState());}
  else{pendingTrackSeek=seconds;updateAudio(state);}
  announce(`Song moved to ${time(seconds)} of ${time(track.duration)}. NASA visual timelines are unchanged.`);
});
function reflectVolume(value){muted=value===0;if(value>0)lastVolume=value;if($('volume'))$('volume').value=String(Math.round(value*100));text('volumeValue',`${Math.round(value*100)}%`);const button=$('muteButton');if(button){button.textContent=muted?'Unmute':'Mute';button.setAttribute('aria-pressed',String(muted));}hostVolume();if(muted&&hostActive)stopHost();}
$('volume')?.addEventListener('input',event=>{const v=Number(event.target.value)/100;audio.setVolume(v);reflectVolume(v);});
$('muteButton')?.addEventListener('click',()=>{const next=muted?lastVolume:0;audio.setVolume(next);reflectVolume(next);announce(muted?'Audio muted.':'Audio unmuted.');});
$('hostMute')?.addEventListener('click',()=>{hostMuted=!hostMuted;try{localStorage.setItem('earthRadioHostMuted',hostMuted?'1':'0');}catch(_){/* Storage is optional. */}if(hostMuted)stopHost();else updateHostControls();announce(hostMuted?'Station host muted.':'Station host unmuted. Use Replay intro to hear it now.');});
$('hostSkip')?.addEventListener('click',()=>{if(hostActive){stopHost();announce('Station host skipped. Music continues.');}else if(!hostMuted){startHost(true);announce(`${chosen.title} host introduction replaying.`);}});
$('timeline')?.addEventListener('input',event=>{audio.seek?.(focusedSource,Number(event.target.value)/1000);updateTime();});
for(const [axis,id] of [['x','focusX'],['y','focusY']])$(id)?.addEventListener('input',()=>{
  const config=chosen.layers.find(l=>l.id===focusedSource);if(!config)return;
  config.focus[axis]=Number($(id).value)/100;audio.setFocus?.(focusedSource,config.focus.x,config.focus.y);
  text('focusCoordinates',`FOCUS · ${Math.round(config.focus.x*100)}% / ${Math.round(config.focus.y*100)}%`);
  updateFocusTarget();
});
$('describeFrame')?.addEventListener('click',()=>{
  const m=SOURCE_META[focusedSource],layer=currentLayer();
  const f=chosen.layers.find(l=>l.id===focusedSource)?.focus||{x:.5,y:.5};
  const values=layer?.metrics;
  const selectedMetrics=FRAME_METRICS[focusedSource]||FRAME_METRICS.ocean;
  const reading=values?selectedMetrics.map(([label,key])=>`${label.toLowerCase()} ${Math.round(clamp(values[key]??0,0,1)*100)} percent`).join('; ')+'.':'This frame has not been analyzed yet; press Play and try again.';
  const position=layer?.element?.tagName==='VIDEO'?`Video time ${time(layer.element.currentTime)}.`:'Still image; no time progression.';
  const msg=`${m.title}. ${m.type}, ${m.period}. Focus ${Math.round(f.x*100)} percent across and ${Math.round(f.y*100)} percent down the rendered image. ${position} ${reading} ${m.role}. ${m.note}`;
  text('frameDescription',msg);announce(msg);
});
$('stationSearch')?.addEventListener('input',renderStations);
let searchTimer;
$('stationSearch')?.addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>announce(`${$('stationList')?.childElementCount||0} matching stations.`),300);});
for(const [button,panel] of [['stationsToggle','stationDrawer'],['playerToggle','playerDrawer'],['aboutToggle','aboutDrawer'],['sourceToggle','sourceDrawer']]){
  $(button)?.addEventListener('click',()=>setPanel(panel,$(panel)?.hidden,button));
}
$('exploreToggle')?.addEventListener('click',()=>setPanel('stationDrawer',$('stationDrawer')?.hidden,'exploreToggle'));
$('playerExpand')?.addEventListener('click',()=>{
  const expanded=$('playerDetails')?.hidden;
  $('playerDetails').hidden=!expanded;
  $('playerDrawer').dataset.expanded=String(expanded);
  $('playerExpand').setAttribute('aria-expanded',String(expanded));
  $('playerExpand').firstChild.textContent=expanded?'Hide sound details ':'Sound & sources ';
});
document.addEventListener('keydown',event=>{if(event.key!=='Escape')return;for(const [button,panel] of [['stationsToggle','stationDrawer'],['aboutToggle','aboutDrawer'],['sourceToggle','sourceDrawer']])setPanel(panel,false,button);if(matchMedia('(max-width: 760px)').matches)setPanel('playerDrawer',false,'playerToggle');});
document.addEventListener('keydown',event=>{if(event.key==='/'&&document.activeElement?.tagName!=='INPUT'){event.preventDefault();setPanel('stationDrawer',true,'stationsToggle');$('stationSearch')?.focus();}});
$('aboutClose')?.addEventListener('click',()=>setPanel('aboutDrawer',false,'aboutToggle'));
$('sourceClose')?.addEventListener('click',()=>setPanel('sourceDrawer',false,'sourceToggle'));
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopHost();if(audio.getState()?.stationId)announce('Playback is paused while the tab is hidden.');}});
window.addEventListener('beforeunload',()=>{stopHost();audio.stop();});
const sourceList=$('sourceList');
if(sourceList)sourceList.replaceChildren(...Object.entries(SOURCE_META).map(([id,m])=>{
  const row=document.createElement('article');row.className='source-item';
  const h=document.createElement('h3');h.textContent=m.title;
  const p=document.createElement('p');p.textContent=`${m.type} · ${m.period}. ${m.scope}. ${m.note}`;
  const attribution=document.createElement('p');attribution.textContent=`Credit: ${m.credit}.`;
  const a=document.createElement('a');a.href=m.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent='NASA SVS source ↗';
  row.append(h,p,attribution,a);return row;
}));
const credit=document.createElement('p');credit.textContent="Globe imagery: NASA/Goddard Space Flight Center Scientific Visualization Studio, Blue Marble Next Generation composite; source data courtesy of Reto Stockli (NASA/GSFC) and NASA's Earth Observatory. Historical artwork, not a live Earth view.";
sourceList?.append(credit);
syncSignalCollapse();audio.setVolume(.28);reflectVolume(.28);renderStations();renderStation();globe.select(chosen.id,{instant:true});
if(matchMedia('(max-width: 760px)').matches)setPanel('playerDrawer',false,'playerToggle');
window.matchMedia('(max-width: 760px)').addEventListener('change',event=>{
  if(!event.matches){const panel=$('playerDrawer');panel.hidden=false;panel.dataset.open='true';$('playerToggle')?.setAttribute('aria-expanded','true');}
  updateFocusTarget();
});
window.addEventListener('resize',updateFocusTarget);
