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
function focusedPoster(meta){return window.EarthPreferHiRes?window.EarthSources[focusedSource]?.hdPoster||meta.poster:meta.poster;}
function setFocusedPoster(image,meta){
  image.onerror=()=>{image.onerror=null;image.src=meta.poster;};
  image.src=focusedPoster(meta);
}
function sizePreview(canvas){
  if(!window.EarthPreferHiRes)return;
  const rect=canvas.parentElement?.getBoundingClientRect(),scale=Math.min(window.devicePixelRatio||1,2);
  if(!rect?.width||!rect.height)return;
  const width=Math.min(1920,Math.ceil(rect.width*scale)),height=Math.min(1080,Math.ceil(rect.height*scale));
  if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
}
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
const SHORT_MAPPING={
  ocean:'Warmer-looking colours → higher ocean tones.',
  ocean2:'More blue/white contrast → higher flowing tones.',
  night:'More bright pixels → higher, more frequent glass-like notes.',
  nightmap:'More bright pixels → higher, more frequent glass-like notes.',
  lightning:'More bright points → higher faint tones and grid-timed ticks.',
  pm25:'More colour contrast → higher tones.',
  aerosol:'More colour contrast → higher, brighter air texture.',
  gedi:'Brighter pixels → higher tones; changing frames can add plucks.',
  co2:'More colour contrast → higher, faster bass pulses.'
};
const station = (id,title,lat,lon,subtitle,story,layers) => ({id,title,lat,lon,subtitle,story,layers:layers.map(([id,x,y,weight,role,visualOnly=false,viewable=true])=>({id,focus:{x,y},defaultFocus:{x,y},weight,role,visualOnly,viewable}))});
const STATIONS = [
  station('california','California coast',38,-122,'Pacific • forest • human footprint','Pacific flow, moving GEDI forest imagery, annual night lights, and a separate 2024 PM2.5 model image shape this station. GEDI remains a sound input but is not a selectable view. A muted atmospheric-river camera film is available as context.',[['ocean',.161,.289,.29,'Flow'],['gedi',.46,.43,.19,'Forest',false,false],['night',.081,.257,.15,'Lights'],['pm25',.161,.289,.14,'PM2.5 model'],['river',.5,.5,0,'Context film',true]]),
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
let soloSource=null, pendingRestoreTimes=null, demoSession=null, demoChoice=null;
let detailedView=null,signalPreferenceSaved=false;
let signalCollapsed=matchMedia('(max-width: 760px)').matches;
try{const saved=localStorage.getItem('earthRadioSourceCollapsed');if(saved!==null){signalCollapsed=saved==='1';signalPreferenceSaved=true;}}catch(_){/* Storage is optional. */}
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
  $('playerDrawer').dataset.hostActive=String(hostActive);
  const mute=$('hostMute'),skip=$('hostSkip');
  if(mute){mute.textContent=hostMuted?'Unmute host':'Mute host';mute.setAttribute('aria-pressed',String(hostMuted));}
  if(skip){skip.textContent=hostActive?'Skip intro':'Replay intro';skip.disabled=(hostMuted||audio.volume===0)&&!hostActive;skip.setAttribute('aria-label',hostActive?`Skip intro for ${chosen.title}`:`Replay intro for ${chosen.title}`);}
}
function stopHost(){
  clearTimeout(hostSafetyTimer);hostSafetyTimer=null;
  hostActive=false;
  if(hostAudio){hostAudio.pause();hostAudio.removeAttribute('src');hostAudio.load();}
  audio.setHostDuck(false);updateHostControls();
}
function startHost(force=false){
  if(!hostAudio||!HOST_INTROS[chosen.id]||hostActive||(!force&&hostSeen.has(chosen.id)))return false;
  const id=chosen.id;
  if(hostMuted||audio.volume===0)return false;
  hostAudio.src=`./assets/hosts/${id}.mp3`;
  hostVolume();hostActive=true;audio.setHostDuck(true);updateHostControls();
  // Fail open to the music if a clip stalls or a browser rejects playback.
  hostSafetyTimer=setTimeout(()=>{if(hostActive&&chosen.id===id){stopHost();announce('Station host timed out. Music continues.');}},15000);
  try{Promise.resolve(hostAudio.play()).catch(()=>{if(chosen.id===id&&hostActive){stopHost();announce('Station host unavailable. Music continues.');}});}
  catch(_){stopHost();return false;}
  return true;
}
hostAudio?.addEventListener('ended',()=>{hostSeen.add(chosen.id);stopHost();});
hostAudio?.addEventListener('error',()=>{if(hostActive){stopHost();announce('Station host unavailable. Music continues.');}});
window.EarthRadioHostTest={start:startHost,stop:stopHost,getState:()=>({active:hostActive,muted:hostMuted,seen:[...hostSeen],currentSrc:hostAudio?.currentSrc||''})};
const globe = new window.EarthGlobe({canvas:$('globeCanvas'),stations:STATIONS,onSelect:selectStation,getBeatPulse:()=>audio.getBeatPulse()});
// Keep engine-owned videos connected when their source card is not in view.
// Disconnecting a playing <video> can pause it and freeze its sonic metrics.
const mediaParking=document.createElement('div');mediaParking.hidden=true;mediaParking.setAttribute('aria-hidden','true');document.body.append(mediaParking);
window.EarthRadioTest={stations:STATIONS,audio,getState:()=>({selected:chosen.id,focusedSource,baseView,soloSource,demoChoice,demoActive:!!demoSession,audio:audio.getState()})};

function announce(message){text('liveStatus',message);}
function currentLayers(){const state=audio.getState();return state.stationId===chosen.id?state.layers||[]:[];}
function currentLayer(){return currentLayers().find(layer=>layer.id===focusedSource);}
function viewableLayers(){return chosen.layers.filter(layer=>layer.viewable!==false);}
function displayMedia(){
  const element=detailedView?.id===focusedSource?detailedView.element:null;
  return element&&(element.tagName==='VIDEO'?element.readyState>=2:element.complete&&element.naturalWidth)?element:currentLayer()?.element;
}
function stopDetailedView(){
  const view=detailedView;detailedView=null;
  if(view){view.element.onload=null;view.element.onloadeddata=null;view.element.onerror=null;view.element.remove();if(view.element.tagName==='VIDEO'){view.element.pause();view.element.removeAttribute('src');view.element.load();}}
  $('detailToggle')?.setAttribute('aria-pressed','false');
}
function syncDetailedView(){
  const view=detailedView,layer=currentLayer();if(!view||view.id!==focusedSource||view.element.tagName!=='VIDEO')return;
  const video=view.element,source=layer?.element;
  if(source?.tagName==='VIDEO'&&Number.isFinite(video.duration)&&Number.isFinite(source.duration)&&source.duration>0&&!video.seeking){
    const target=source.currentTime/source.duration*video.duration;
    if(Math.abs(video.currentTime-target)>.35)video.currentTime=target;
  }
  if(audio.playing&&!demoSession&&layer?.status==='ready'){
    if(video.paused&&!view.starting){view.starting=true;Promise.resolve(video.play()).catch(error=>{if(detailedView===view&&audio.playing&&!demoSession&&error.name!=='AbortError'){stopDetailedView();showFocusedMedia();announce('Detailed view unavailable. The standard view and music remain available.');}}).finally(()=>view.starting=false);}
  }else video.pause();
}
function toggleDetailedView(){
  if(detailedView){stopDetailedView();showFocusedMedia();updateAudio(audio.getState());return;}
  const source=window.EarthSources[focusedSource];if(!source?.hdUrl)return;
  const element=document.createElement(source.type==='video'?'video':'img'),view={id:focusedSource,element,starting:false};detailedView=view;
  if(source.type==='video'){element.muted=true;element.playsInline=true;element.loop=true;element.preload='auto';}
  const ready=()=>{if(detailedView!==view)return;syncDetailedView();showFocusedMedia();updateAudio(audio.getState());};
  element.onload=ready;element.onloadeddata=ready;
  element.onerror=()=>{if(detailedView!==view)return;stopDetailedView();showFocusedMedia();announce('Detailed view unavailable. The standard view and music remain available.');};
  element.src=source.hdUrl;mediaParking.append(element);$('detailToggle').setAttribute('aria-pressed','true');
  announce('Loading a detailed view of this source. Sound continues to use the same image analysis.');
}
function setPanel(id,open,buttonId){
  const panel=$(id),button=$(buttonId); if(!panel)return;
  if(open&&id==='aboutDrawer')setPanel('sourceDrawer',false,'sourceToggle');
  if(open&&id==='sourceDrawer')setPanel('aboutDrawer',false,'aboutToggle');
  if(open&&matchMedia('(max-width: 760px)').matches&&id==='stationDrawer')setPanel('playerDrawer',false,'playerToggle');
  if(open&&matchMedia('(max-width: 760px)').matches&&id==='playerDrawer')setPanel('stationDrawer',false,'stationsToggle');
  const hadFocus=panel.contains(document.activeElement);
  panel.hidden=!open;button?.setAttribute('aria-expanded',String(open));
  panel.dataset.open=String(open);
  if(id==='stationDrawer')for(const toggle of ['exploreToggle','stationsToggle'])$(toggle)?.setAttribute('aria-expanded',String(open));
  if(open)(id==='playerDrawer'?$('playButton'):panel.querySelector('input, .close-button, button, h2[tabindex]'))?.focus({preventScroll:true});
  else if(hadFocus)(id==='stationDrawer'&&!matchMedia('(max-width: 760px)').matches?$('exploreToggle'):button)?.focus({preventScroll:true});
  globe.resize();
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
  stopDetailedView();stopHost();audio.stop();mediaParking.replaceChildren();$('visualFrame')?.querySelector('.active-media')?.remove();
  chosen=next;focusedSource=next.layers.find(layer=>layer.viewable!==false).id;baseView=false;soloSource=null;pendingRestoreTimes=null;pendingTrackIndex=0;pendingTrackSeek=0;scrubbing=false;
  globe.select(id);renderStations();renderStation();updateAudio(audio.getState());
  setPanel('stationDrawer',false,'stationsToggle');
  if(matchMedia('(max-width: 760px)').matches)setPanel('playerDrawer',true,'playerToggle');
  $('receiverTitle')?.focus({preventScroll:true});
  announce(`${next.title} selected. Three generated tracks using ${next.layers.length} NASA sources. Press Play to hear the station.`);
}
function renderStation(){
  text('receiverTitle',chosen.title);text('receiverDescription','Historical NASA frames shape music made in your browser.');text('stationStory',chosen.story);
  text('hostTranscript',HOST_INTROS[chosen.id]?.script||'No host introduction available.');updateHostControls();
  text('rhythmDescription',`Percussion: ${chosen.rhythm.note} These are synthesized sounds, not recordings of this location.`);
  text('receiverPlace',chosen.subtitle);text('receiverKind',`${chosen.layers.filter(l=>!l.visualOnly).length} sound layers and ${chosen.layers.filter(l=>l.visualOnly).length} context films · ${chosen.tracks.length} tracks`);
  text('timelineContext','Each animated NASA source runs on its own historical timeline. This slider controls only the selected view.');
  renderLayers();renderViewPicker();showFocusedMedia();
}
function updatePreview(force=false){
  const meta=SOURCE_META[focusedSource],poster=$('previewPoster'),canvas=$('previewCanvas'),button=$('previewButton');
  if(!meta||!poster||!canvas||!button)return;
  if(poster.dataset.source!==focusedSource){poster.dataset.source=focusedSource;setFocusedPoster(poster,meta);poster.hidden=false;canvas.hidden=true;force=true;}
  const signalPoster=$('signalPoster'),signalCanvas=$('signalCanvas');
  if(signalPoster&&signalCanvas&&signalPoster.dataset.source!==focusedSource){signalPoster.dataset.source=focusedSource;setFocusedPoster(signalPoster,meta);signalPoster.hidden=false;signalCanvas.hidden=true;force=true;}
  text('previewCaption',`NASA · ${{ocean:'Ocean',ocean2:'Ocean 2',night:'EIC lights',nightmap:'Night map',lightning:'Lightning',pm25:'PM2.5',aerosol:'Aerosols',gedi:'Forest',co2:'CO₂',river:'River','film-gulf':'Gulf film','film-japan':'Kuroshio film','film-agulhas':'Agulhas film'}[focusedSource]}`);
  text('signalTitle',meta.title);text('signalCompactTitle',meta.title);
  const sourceState=currentLayer()?.status;
  text('signalCompactTitle',`${meta.title}${sourceState==='failed'?' · unavailable':''}`);
  text('signalTime',`${meta.type} · ${meta.period}${sourceState==='failed'?' · SOURCE UNAVAILABLE':sourceState==='waiting'?' · waiting for frame':''}`);
  const signalWindow=document.querySelector('.signal-window');if(signalWindow)signalWindow.dataset.beat=String(focusedSource==='night'||focusedSource==='nightmap');
  text('signalHeading',baseView?'NASA SOURCE VIEW':meta.projection==='camera'?'NASA CAMERA VIEW':'NASA VIEW');
  const config=chosen.layers.find(layer=>layer.id===focusedSource);
  text('signalExplanation',sourceState==='failed'?'Source unavailable. Showing a saved preview; this layer is not contributing sound.':config?.visualOnly?'Visual context only: this film does not generate sound.':soloSource&&soloSource!==focusedSource?`Viewing this source; the audible selection is ${SOURCE_META[soloSource].title}.`:baseView?'NASA pixels shape this layer when audible. The globe shows the Blue Marble base map.':meta.projection==='camera'?'This moving-camera image can shape sound, but its pixels are not fixed to a place.':'Original NASA frames can shape sound; the globe display is enhanced for visibility.');
  button.setAttribute('aria-label',`Inspect current NASA visual: ${meta.title}`);
  if(signalCollapsed||!$('signalWindow').getClientRects().length)return;
  if(!force&&(document.hidden||performance.now()-lastPreviewAt<550))return;
  const element=displayMedia();
  const ready=element&&(element.tagName==='VIDEO'?element.readyState>=2&&!element.seeking:element.complete&&element.naturalWidth);
  const media=ready?element:poster.complete&&poster.naturalWidth?poster:null;
  if(!media)return;
  const width=media.videoWidth||media.naturalWidth,height=media.videoHeight||media.naturalHeight;
  if(!width||!height)return;
  const sourceWidth=focusedSource==='night'?width/2:width;
  if(signalCollapsed&&!force)return;
  if(signalCanvas)sizePreview(signalCanvas);
  try{
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
function makeSoundOnlyCard(config,state){
  const meta=SOURCE_META[config.id],card=document.createElement('article');
  card.className='sound-only-card';card.dataset.layer=config.id;
  const title=document.createElement('strong');title.textContent=meta.title;
  const details=document.createElement('p');details.textContent=`Sound input only · ${meta.period}. ${SOUND_MAPPING[config.id]}`;
  const status=document.createElement('span');status.className='layer-status';status.textContent=state?.status||'Ready to load';
  const listen=document.createElement('button');listen.type='button';listen.className='sound-only-listen';listen.textContent='Hear forest layer';
  listen.setAttribute('aria-pressed',String(soloSource===config.id));
  listen.addEventListener('click',()=>chooseMix(soloSource===config.id?null:config.id));
  card.append(title,details,status,listen);return card;
}
function renderLayers(){
  const list=$('layerList');if(!list)return;
  const states=currentLayers();list.replaceChildren(...chosen.layers.map(config=>config.viewable===false?makeSoundOnlyCard(config,states.find(l=>l.id===config.id)):makeLayerCard(config,states.find(l=>l.id===config.id))));
}
function renderViewPicker(){
  const picker=$('viewPicker');if(!picker)return;
  const earth=document.createElement('button');earth.type='button';earth.className='view-choice view-choice-earth';earth.title='Plain Earth';earth.setAttribute('aria-label','Show plain Earth without NASA globe overlay');earth.setAttribute('aria-pressed',String(baseView));
  const earthIcon=document.createElement('span');earthIcon.setAttribute('aria-hidden','true');earthIcon.textContent='◎';earth.append(earthIcon);
  earth.addEventListener('click',()=>selectView('base'));
  const items=viewableLayers().map(config=>{
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
  if(!viewableLayers().some(layer=>layer.id===id))return;
  if(detailedView&&detailedView.id!==id)stopDetailedView();
  baseView=false;focusedSource=id;renderLayers();renderViewPicker();if(pickerHadFocus)$('viewPicker')?.querySelector('[aria-pressed="true"]')?.focus({preventScroll:true});showFocusedMedia();updateAudio(audio.getState());
  announce(`${SOURCE_META[id].title} NASA view selected. ${SOURCE_META[id].scope}.`);
}
function showFocusedMedia(){
  const meta=SOURCE_META[focusedSource],frame=$('visualFrame');if(!meta||!frame)return;
  audio.setVisualFocus(focusedSource);
  const layer=currentLayer(),element=displayMedia(),existing=frame.querySelector('.active-media');
  if(existing&&existing!==element){existing.classList.remove('active-media');mediaParking.append(existing);}
  const placeholder=$('visualVideo'),still=$('visualImage');
  if(placeholder)placeholder.hidden=true;if(still)still.hidden=true;
  if(element){
    element.classList.add('active-media');element.setAttribute('aria-label',`${meta.title}: ${meta.type}${chosen.layers.find(config=>config.id===focusedSource)?.visualOnly?' shown as visual context':' used to shape the current sound'}`);
    if(element.parentNode!==frame)frame.prepend(element);
    if(layer?.element&&layer.element!==element&&!layer.element.isConnected)mediaParking.append(layer.element);
  }else if(meta.type==='Still image'&&still){setFocusedPoster(still,meta);still.alt=`${meta.title} NASA still visualization`;still.hidden=false;}
  else if(placeholder){placeholder.poster=focusedPoster(meta);placeholder.removeAttribute('src');placeholder.hidden=false;}
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
// Match the actual 96 × 54 canvas and inclusive radius-four loop in audio.js.
function sampleBounds(focus){
  const x=Math.round(clamp(focus.x,0,1)*95),y=Math.round(clamp(focus.y,0,1)*53);
  return {left:Math.max(0,x-4),right:Math.min(95,x+4),top:Math.max(0,y-4),bottom:Math.min(53,y+4)};
}
function samplingDescription(config,meta){
  if(config.visualOnly)return 'Visual context only: this film is not sampled for sound.';
  const b=sampleBounds(config.focus),w=b.right-b.left+1,h=b.bottom-b.top+1;
  const window=`The outlined window samples ${w} × ${h} of 96 × 54 image pixels (${Math.round(w/96*100)}% of the image width and ${Math.round(h/54*100)}% of its height).`;
  if(meta.projection==='camera')return `${window} This is image space; the moving camera does not track a fixed geographic area.`;
  if(config.id==='night'){
    const panel=b.right<48?'the left map panel':b.left>=48?'the right presentation panel':'both presentation panels';
    return `${window} It covers ${panel} of the two-panel source, not a point at the globe pin.`;
  }
  if(meta.projection==='equirectangular')return `${window} On this global map, the window spans approximately ${Math.round(w/96*360)}° longitude by ${Math.round(h/54*180)}° latitude; registration is approximate. The pin is an editorial entry point, not a sensor.`;
  return `${window} This global image is only approximately draped on the globe, so precise geographic bounds are not known. The pin is an editorial entry point, not a sensor.`;
}
function updateFocusTarget(){
  const frame=$('visualFrame'),target=$('focusTarget');
  const config=chosen.layers.find(l=>l.id===focusedSource),meta=SOURCE_META[focusedSource],focus=config?.focus;
  if(!frame||!target||!focus||!meta)return;
  target.hidden=!!config.visualOnly;
  text('sampleScope',samplingDescription(config,meta));
  for(const id of ['focusX','focusY'])if($(id))$(id).disabled=!!config.visualOnly;
  $('resetFocus').disabled=!!config.visualOnly;
  if(config.visualOnly)return;
  const media=frame.querySelector('.active-media');
  const fallback=$('visualImage')?.hidden?$('signalPoster'):$('visualImage');
  const mediaWidth=media?.videoWidth||media?.naturalWidth||fallback?.naturalWidth||frame.clientWidth;
  const mediaHeight=media?.videoHeight||media?.naturalHeight||fallback?.naturalHeight||frame.clientHeight;
  const scale=Math.min(frame.clientWidth/mediaWidth,frame.clientHeight/mediaHeight);
  const shownWidth=mediaWidth*scale,shownHeight=mediaHeight*scale;
  const b=sampleBounds(focus);
  target.style.left=`${(frame.clientWidth-shownWidth)/2+b.left/96*shownWidth}px`;
  target.style.top=`${(frame.clientHeight-shownHeight)/2+b.top/54*shownHeight}px`;
  target.style.width=`${shownWidth*(b.right-b.left+1)/96}px`;
  target.style.height=`${shownHeight*(b.bottom-b.top+1)/54}px`;
}
function updateTime(){
  const layer=currentLayer(),v=layer?.element,slider=$('timeline');
  if(!v||v.tagName!=='VIDEO'||!Number.isFinite(v.duration)){if(slider)slider.disabled=true;text('timeReadout',layer?.status==='failed'?'UNAVAILABLE':SOURCE_META[focusedSource].type==='Still image'?'STILL IMAGE':'NOT LOADED');return;}
  if(slider)slider.disabled=false;
  text('timeReadout',`${time(v.currentTime)} / ${time(v.duration)}`);
  if(slider&&document.activeElement!==slider)slider.value=String(Math.round(1000*v.currentTime/v.duration));
  slider?.setAttribute('aria-valuetext',`${time(v.currentTime)} of ${time(v.duration)} in ${SOURCE_META[focusedSource].title} video`);
}
function updateMix(state){
  const meta=SOURCE_META[focusedSource],config=chosen.layers.find(l=>l.id===focusedSource);
  const sameStation=state.stationId===chosen.id;
  const candidates=chosen.layers.filter(l=>!l.visualOnly&&(!soloSource||l.id===soloSource));
  const ready=candidates.filter(c=>sameStation&&state.layers.some(l=>l.id===c.id&&l.status==='ready'));
  const failed=candidates.filter(c=>sameStation&&state.layers.some(l=>l.id===c.id&&l.status==='failed'));
  const loading=candidates.filter(c=>!ready.includes(c)&&!failed.includes(c));
  const names=items=>items.map(item=>SOURCE_META[item.id].title).join(', ');
  text('viewSummary',`${meta.title} · ${meta.period}${config.visualOnly?' · visual context only':''}`);
  text('listenMapping',config.visualOnly?'Listen: this film is visual context only; it does not make sound.':`Listen: ${SHORT_MAPPING[focusedSource]}`);
  let summary;
  if(!state.playing||!sameStation)summary=`${sameStation?'Paused. ':'Ready. '}${soloSource?'Selected layer':'Full mix'}: ${names(candidates)}.`;
  else if(state.volume===0)summary=`Muted. ${soloSource?'Selected layer':'Full mix'}: ${names(candidates)}.`;
  else if(!ready.length)summary=loading.length?`Waiting for ${names(loading)} to load.${failed.length?` Unavailable: ${names(failed)}.`:''}`:`Unavailable: ${names(failed)}.`;
  else summary=`${soloSource?'Isolated layer':'Full mix'}: ${names(ready)}.${loading.length?` Loading: ${names(loading)}.`:''}${failed.length?` Unavailable: ${names(failed)}.`:''}`;
  text('mixSummary',summary);
  const hear=$('hearLayer'),mix=$('hearMix');
  if(hear){hear.disabled=!!config.visualOnly;hear.setAttribute('aria-pressed',String(soloSource===focusedSource));hear.title=config.visualOnly?'This film is visual context only.':'';}
  mix?.setAttribute('aria-pressed',String(!soloSource));
  for(const config of chosen.layers.filter(layer=>layer.viewable===false))$('layerList')?.querySelector(`[data-layer="${config.id}"] .sound-only-listen`)?.setAttribute('aria-pressed',String(soloSource===config.id));
}
function updateAudio(state){
  if(!state)return;
  if(demoSession){updateDemoAudio(state);return;}
  const playing=!!state.playing;
  syncDetailedView();
  $('playerDrawer').dataset.hostActive=String(hostActive);
  updateMix(state);
  const shownLayers=state.stationId===chosen.id?state.layers||[]:[];
  // A sound-only source never enters the viewer, so keep its media connected
  // in the hidden parking area while its frames continue to drive audio.
  for(const config of chosen.layers.filter(layer=>layer.viewable===false)){
    const element=shownLayers.find(layer=>layer.id===config.id)?.element;
    if(element&&!element.isConnected)mediaParking.append(element);
  }
  const selectedLayer=shownLayers.find(item=>item.id===focusedSource),selectedMeta=SOURCE_META[focusedSource];
  const poster=$('signalPoster');
  const fallback=poster?.dataset.source===focusedSource&&poster.complete&&poster.naturalWidth?poster:null;
  const globeMedia=selectedMeta?.projection==='camera'?null:(displayMedia()&&selectedLayer?.status!=='failed'?displayMedia():fallback);
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
  const play=$('playButton');if(play){play.setAttribute('aria-label',playing?`Pause station: ${chosen.title}`:`Play station: ${chosen.title}`);play.classList.toggle('is-playing',playing);}
  const failures=state.layers?.filter(l=>l.status==='failed')||[];
  const total=state.layers?.length||0;
  $('audioHint')?.classList.toggle('is-error',failures.length>0);
  text('audioHint',total&&failures.length===total?'NASA views could not load. See source links or choose another station.':failures.length?`${failures.length} layer${failures.length===1?' is':'s are'} unavailable; the other NASA views can still play.`:playing?'Tracks rotate automatically. NASA visual timelines are independent.':'Three tracks rotate automatically.');
  if($('layerList')?.childElementCount!==chosen.layers.length)renderLayers();
  for(const config of chosen.layers){const card=$('layerList')?.querySelector(`[data-layer="${config.id}"]`);if(!card)continue;const s=state.layers?.find(l=>l.id===config.id);const label=card.querySelector('.layer-status');if(label)label.textContent=s?.status||'Ready to load';if(config.viewable!==false)card.setAttribute('aria-pressed',String(config.id===focusedSource));}
  const layer=currentLayer();if(layer?.element&&!layer.element.isConnected)showFocusedMedia();
  const unavailable=$('visualUnavailable');if(unavailable){unavailable.hidden=layer?.status!=='failed';if(layer?.status==='failed')unavailable.textContent=`${SOURCE_META[focusedSource]?.title||'This NASA view'} could not load. Use the NASA source link below or select another layer.`;}
  const mapped=FRAME_METRICS[focusedSource]||FRAME_METRICS.ocean;
  for(const [index,[label,key]] of mapped.entries()){
    const name=index?'change':'brightness',raw=layer?.metrics?.[key];
    const motion=key==='change'&&Number.isFinite(layer?.sonic?.motion)?layer.sonic.motion:null;
    text(`${name}Label`,motion!==null?'Motion → pulse strength':label);text(`${name}Value`,motion!==null?`${Math.round(motion*100)}%`:Number.isFinite(raw)?`${(raw*100).toFixed(1)}%`:'—');
    const bar=$(`${name}Bar`);if(bar)bar.style.width=Number.isFinite(raw)?`${100*(motion??clamp(raw,0,1))}%`:'0%';
    if(motion!==null)$(`${name}Value`)?.setAttribute('title',`Image frame difference: ${(raw*100).toFixed(2)}%; mapped pulse strength: ${Math.round(motion*100)}%.`);
  }
  text('metricExplanation',Number.isFinite(layer?.sonic?.motion)?`Image difference ${(100*layer.metrics.change).toFixed(2)}% per 0.2 seconds maps to ${Math.round(layer.sonic.motion*100)}% pulse strength. This is an artistic mapping, not a scientific measurement.`:'These are rendered image properties, not physical measurements.');
  updatePreview();
  updateTime();
}

$('previewPoster')?.addEventListener('load',()=>updatePreview(true));
$('signalPoster')?.addEventListener('load',()=>{updatePreview(true);updateFocusTarget();updateAudio(audio.getState());});
$('previewButton')?.addEventListener('click',()=>{if($('playerDetails')?.hidden)$('playerExpand')?.click();$('visualFrame')?.focus({preventScroll:true});$('visualFrame')?.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});});
$('signalToggle')?.addEventListener('click',()=>{
  signalCollapsed=!signalCollapsed;signalPreferenceSaved=true;syncSignalCollapse();
  if(!signalCollapsed)updatePreview(true);
  try{localStorage.setItem('earthRadioSourceCollapsed',signalCollapsed?'1':'0');}catch(_){/* Storage is optional. */}
  announce(signalCollapsed?'NASA source window collapsed.':'NASA source window expanded.');
});
$('signalNext')?.addEventListener('click',()=>{const views=viewableLayers(),index=views.findIndex(layer=>layer.id===focusedSource);selectView(views[(index+1)%views.length].id);$('signalNext')?.focus({preventScroll:true});});
const TOUR_STEPS=[
  {title:'Explore Earth with your ears',text:'Historical NASA images shape browser-made music. Sound gives you another way to notice a visual pattern. Choose a place with the globe or Explore; the pins are entry points, not sensors.'},
  {title:'Try a guided listen',text:'Can you tell which window has more bright rendered pixels? Compare A and B on the same frozen 2014 NASA Black Marble frame. Press either button to start; listen for glass-like notes. The same synthesis and clock are used for both.'},
  {title:'What did you hear?',text:'The darker A window produces few or no glass-like notes. In brighter B, more bright pixels produce higher, more frequent notes. This reflects rendered image pixels, including map shading, not a measurement of light output. Return to the station, choose a source, and use Hear this layer to explore its mapping.'}
];
const DEMO_REGIONS={A:{x:10/95,y:30/53},B:{x:50/95,y:19/53}};
const DEMO_STATION={id:'guided-listen',demo:true,layers:[{id:'nightmap',focus:{...DEMO_REGIONS.A},weight:1,demoFreeze:true}],tracks:[{id:'guided-notes',title:'Frozen frame comparison',description:'One image and one instrument',mode:'pulse',duration:600,tempo:80,root:0,mix:{nightmap:1}}]};
let tourIndex=0,tourReturnFocus=null,tourInert=[];
function setDemoStatus(message){const node=$('demoStatus');if(node&&node.textContent!==message)node.textContent=message;}
function updateDemoAudio(state){
  if(!demoSession||state.stationId!=='guided-listen')return;
  const layer=state.layers[0];
  $('demoPause').disabled=!state.playing;
  $('demoReplay').disabled=!demoChoice;
  for(const choice of ['A','B'])$('demo'+choice).setAttribute('aria-pressed',String(demoChoice===choice));
  if(layer?.status==='failed')setDemoStatus('The frozen NASA frame could not be loaded. Exit the guide and try the NASA source link.');
  else if(!layer?.metrics)setDemoStatus(`Loading the frozen NASA frame for window ${demoChoice}.`);
  else if(!state.playing)setDemoStatus(`Window ${demoChoice} paused. Choose A or B, or replay to listen again.`);
  else if(state.volume===0)setDemoStatus('Volume is muted. Increase the volume above to hear the comparison.');
  else setDemoStatus(`Playing window ${demoChoice}: about ${Math.round(layer.metrics.brightFraction*100)}% of its sampled pixels exceed the image brightness threshold. ${demoChoice==='A'?'Listen for few or no glass notes.':'Listen for higher, more frequent glass notes.'}`);
}
function restoreMediaTimes(){
  if(!pendingRestoreTimes)return;
  const times=pendingRestoreTimes;pendingRestoreTimes=null;
  const stationId=chosen.id;
  for(const [id,seconds] of Object.entries(times)){
    const media=audio.getMedia(id);if(!media||media.tagName!=='VIDEO'||!Number.isFinite(seconds))continue;
    const restore=()=>{if(audio.getState().stationId!==stationId||!Number.isFinite(media.duration)||media.duration<=0)return;try{media.currentTime=Math.min(seconds,Math.max(0,media.duration-.05));}catch(_){/* Keep the source usable if a browser rejects a seek. */}};
    if(media.readyState>=1)restore();else media.addEventListener('loadedmetadata',restore,{once:true});
  }
}
function endDemo(){
  if(!demoSession)return;
  const saved=demoSession;
  audio.stop();demoSession=null;demoChoice=null;soloSource=null;
  pendingTrackIndex=saved.trackIndex;pendingTrackSeek=saved.elapsed;pendingRestoreTimes=saved.times;
  showFocusedMedia();
  for(const choice of ['A','B'])$('demo'+choice).setAttribute('aria-pressed','false');
  $('demoPause').disabled=true;$('demoReplay').disabled=true;
  if(saved.wasPlaying){
    const pending=audio.play(chosen,pendingTrackIndex);
    if(pendingTrackSeek>0)audio.seekTrack(pendingTrackSeek);
    pendingTrackSeek=0;restoreMediaTimes();
    Promise.resolve(pending).catch(error=>{announce('The station could not resume. Press Play to try again.');console.error(error);});
  }else updateAudio(audio.getState());
}
function playDemoRegion(choice){
  if(!demoSession){
    const state=audio.getState(),same=state.stationId===chosen.id;
    demoSession={wasPlaying:!!(same&&state.playing),trackIndex:same?state.trackIndex:pendingTrackIndex,elapsed:same?state.trackElapsed:pendingTrackSeek,times:Object.fromEntries((same?state.layers:[]).filter(l=>l.element?.tagName==='VIDEO'&&(!l.visualOnly||l.id===focusedSource)&&l.element.currentTime>0).map(l=>[l.id,l.element.currentTime]))};
    detailedView?.element.pause?.();stopHost();audio.stop();mediaParking.replaceChildren();$('visualFrame')?.querySelector('.active-media')?.remove();
    if(detailedView)mediaParking.append(detailedView.element);
  }
  demoChoice=choice;DEMO_STATION.layers[0].focus={...DEMO_REGIONS[choice]};
  const state=audio.getState();let pending;
  if(state.stationId!=='guided-listen')pending=audio.play(DEMO_STATION);
  else{
    audio.setFocus('nightmap',DEMO_REGIONS[choice].x,DEMO_REGIONS[choice].y);
    audio.seekTrack(0);
    if(!state.playing)pending=audio.play(DEMO_STATION);
  }
  updateDemoAudio(audio.getState());
  if(pending)Promise.resolve(pending).catch(error=>{setDemoStatus('Audio could not start. Check browser audio permissions and try again.');console.error(error);});
}
function renderTour(){
  const step=TOUR_STEPS[tourIndex];text('tourStep',`${tourIndex+1} / ${TOUR_STEPS.length}`);text('tourTitle',step.title);text('tourText',step.text);
  $('guidedComparison').hidden=tourIndex!==1;
  if(tourIndex===1){const img=$('demoImage');if(!img.src)img.src=img.dataset.src;$('demoVolume').value=String(Math.round(audio.volume*100));}
  $('tourBack').disabled=tourIndex===0;text('tourNext',tourIndex===TOUR_STEPS.length-1?'Finish':'Next');$('tourTitle')?.focus({preventScroll:true});
}
function closeTour(){const dialog=$('tourDialog');if(dialog?.hidden)return;endDemo();dialog.hidden=true;for(const [node,old] of tourInert)node.inert=old;tourInert=[];tourReturnFocus?.focus({preventScroll:true});}
function openTour(){tourReturnFocus=document.activeElement;tourIndex=0;setDemoStatus('Choose A or B to begin. No sound plays until you choose.');tourInert=[...$('top').children].filter(node=>node.id!=='tourDialog').map(node=>[node,node.inert]);for(const [node] of tourInert)node.inert=true;$('tourDialog').hidden=false;renderTour();}
$('tourStart')?.addEventListener('click',openTour);
$('tourOpenNav')?.addEventListener('click',openTour);
$('tourClose')?.addEventListener('click',closeTour);
$('tourBack')?.addEventListener('click',()=>{if(tourIndex>0){if(tourIndex===1)endDemo();tourIndex--;renderTour();}});
$('tourNext')?.addEventListener('click',()=>{if(tourIndex===TOUR_STEPS.length-1)closeTour();else{if(tourIndex===1)endDemo();tourIndex++;renderTour();}});
for(const choice of ['A','B'])$('demo'+choice)?.addEventListener('click',()=>playDemoRegion(choice));
$('demoPause')?.addEventListener('click',()=>audio.pause());
$('demoReplay')?.addEventListener('click',()=>{if(demoChoice)playDemoRegion(demoChoice);});
$('demoVolume')?.addEventListener('input',event=>{const value=Number(event.target.value)/100;audio.setVolume(value);reflectVolume(value);});
$('tourDialog')?.addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeTour();return;}
  if(event.key!=='Tab')return;
  const items=[...$('tourDialog').querySelectorAll('button:not(:disabled), input:not(:disabled), a[href]')].filter(node=>!node.closest('[hidden]'));
  const first=items[0],last=items[items.length-1];
  if(event.shiftKey&&(document.activeElement===first||document.activeElement===$('tourTitle'))){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
});

function chooseMix(sourceId){
  const config=chosen.layers.find(layer=>layer.id===sourceId);
  if(sourceId&&(!config||config.visualOnly))return;
  soloSource=sourceId;
  const state=audio.getState();
  if(state.stationId===chosen.id)audio.setSolo(sourceId);
  updateMix(audio.getState());updatePreview(true);
  announce(sourceId?`Isolating ${SOURCE_META[sourceId].title}. Other sound layers fade out.`:'Full station mix selected. Available sound layers fade back in.');
}
$('hearLayer')?.addEventListener('click',()=>chooseMix(focusedSource));
$('hearMix')?.addEventListener('click',()=>chooseMix(null));

$('playButton')?.addEventListener('click',()=>{
  const state=audio.getState();
  if(state?.playing){stopHost();audio.pause();announce(`${chosen.title} paused on ${chosen.tracks[pendingTrackIndex].title}.`);return;}
  // The audio engine invokes resume() and all media play() calls in this user gesture.
  const requested=chosen.id,pending=audio.play(chosen,pendingTrackIndex);audio.setSolo(soloSource);if(pendingTrackSeek>0){audio.seekTrack(pendingTrackSeek);pendingTrackSeek=0;}restoreMediaTimes();startHost();updateAudio(audio.getState());
  Promise.resolve(pending).then(result=>{if(chosen.id!==requested)return;updateAudio(result);if(!result?.playing){stopHost();announce('Playback is paused.');return;}const sounds=result?.layers?.filter(l=>!l.visualOnly&&(!result.soloSourceId||l.id===result.soloSourceId))||[],loaded=sounds.filter(l=>l.status==='ready').length,failed=sounds.filter(l=>l.status==='failed').length;announce(loaded?`${chosen.title} station playing ${result.track?.title||chosen.tracks[pendingTrackIndex].title} from ${loaded} sound layer${loaded===1?'':'s'}${failed?`; ${failed} unavailable`:''}.`:failed===sounds.length?'All sound layers are unavailable. Open a NASA source link or try another station.':'The media is loading.');}).catch(error=>{if(chosen.id!==requested)return;stopHost();announce('Audio could not start in this browser. NASA sources remain available.');console.error(error);});
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
function reflectVolume(value){muted=value===0;if(value>0)lastVolume=value;if($('volume'))$('volume').value=String(Math.round(value*100));text('volumeValue',`${Math.round(value*100)}%`);const button=$('muteButton');if(button){button.textContent=muted?'Unmute':'Mute';button.setAttribute('aria-pressed',String(muted));}hostVolume();if(muted&&hostActive)stopHost();updateHostControls();}
$('volume')?.addEventListener('input',event=>{const v=Number(event.target.value)/100;audio.setVolume(v);reflectVolume(v);});
$('muteButton')?.addEventListener('click',()=>{const next=muted?lastVolume:0;audio.setVolume(next);reflectVolume(next);announce(muted?'Audio muted.':'Audio unmuted.');});
$('hostMute')?.addEventListener('click',()=>{hostMuted=!hostMuted;try{localStorage.setItem('earthRadioHostMuted',hostMuted?'1':'0');}catch(_){/* Storage is optional. */}if(hostMuted)stopHost();else updateHostControls();announce(hostMuted?'Station host muted.':'Station host unmuted. Use Replay intro to hear it now.');});
$('hostSkip')?.addEventListener('click',()=>{if(hostActive){hostSeen.add(chosen.id);stopHost();announce('Station host skipped. Music continues.');}else if(startHost(true))announce(`${chosen.title} host introduction replaying.`);else announce('Host audio is muted. Unmute it before replaying the introduction.');});
$('detailToggle')?.addEventListener('click',toggleDetailedView);
$('resetFocus')?.addEventListener('click',()=>{
  const config=chosen.layers.find(layer=>layer.id===focusedSource);if(!config||config.visualOnly)return;
  config.focus={...config.defaultFocus};audio.setFocus(config.id,config.focus.x,config.focus.y);showFocusedMedia();announce('Image focus reset to the original station window.');
});
document.querySelector('.skip-link')?.addEventListener('click',event=>{event.preventDefault();setPanel('stationDrawer',true,'exploreToggle');$('stationSearch').focus();});
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
  const reading=values&&layer?.status==='ready'?`Image properties: ${selectedMetrics.map(([label,key])=>`${label.toLowerCase()} ${Math.round(clamp(values[key]??0,0,1)*100)} percent`).join('; ')}. These are not scientific measurements.`:'No analyzed frame is available yet.';
  let position;
  if(layer?.status==='failed')position='Source failed to load.';
  else if(m.type==='Still image')position=layer?.status==='ready'?'Still image; no time progression.':'Still image not loaded yet; it does not progress in time.';
  else if(!layer?.element)position='Animation not loaded yet. Press Play to load it.';
  else if(layer.element.paused)position=`Animation paused at video time ${time(layer.element.currentTime)}.${layer.status!=='ready'||layer.element.readyState<2?' Its frame is loading or waiting.':''}`;
  else if(layer.status!=='ready'||layer.element.readyState<2)position='Animation is loading or waiting for a frame.';
  else position=`Animation playing at video time ${time(layer.element.currentTime)}.`;
  const config=chosen.layers.find(l=>l.id===focusedSource);
  const msg=`${m.title}. ${m.type}, ${m.period}. ${position} ${samplingDescription(config,m)} ${reading} ${m.role}. ${m.note}`;
  text('frameDescription',msg);announce(msg);
});
$('stationSearch')?.addEventListener('input',renderStations);
let searchTimer;
$('stationSearch')?.addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{const count=$('stationList')?.childElementCount||0;announce(`${count} matching station${count===1?'':'s'}.`);},300);});
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
  globe.resize();
});
document.addEventListener('keydown',event=>{if(event.key!=='Escape')return;for(const [button,panel] of [['stationsToggle','stationDrawer'],['aboutToggle','aboutDrawer'],['sourceToggle','sourceDrawer']])setPanel(panel,false,button);if(matchMedia('(max-width: 760px)').matches)setPanel('playerDrawer',false,'playerToggle');});
document.addEventListener('keydown',event=>{if(event.key==='/'&&$('tourDialog')?.hidden&&document.activeElement?.tagName!=='INPUT'){event.preventDefault();setPanel('stationDrawer',true,'stationsToggle');$('stationSearch')?.focus();}});
$('aboutClose')?.addEventListener('click',()=>setPanel('aboutDrawer',false,'aboutToggle'));
$('sourceClose')?.addEventListener('click',()=>setPanel('sourceDrawer',false,'sourceToggle'));
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopHost();detailedView?.element.pause?.();if(audio.getState()?.stationId)announce('Playback paused because the tab was hidden. Press Play to resume.');}});
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
const credit=document.createElement('p');credit.textContent="Globe imagery: NASA/Goddard Space Flight Center Scientific Visualization Studio and NASA's Earth Observatory. The detailed base map is an August 2004 Blue Marble Next Generation composite with shaded topography and bathymetry; data courtesy of Reto Stockli (NASA/GSFC). Historical artwork, not a live Earth view. ";
const earthCreditLink=document.createElement('a');earthCreditLink.href='https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-topography-bathymetry/';earthCreditLink.textContent='Blue Marble source';earthCreditLink.target='_blank';earthCreditLink.rel='noopener noreferrer';credit.append(earthCreditLink);
sourceList?.append(credit);
syncSignalCollapse();audio.setVolume(.28);reflectVolume(.28);renderStations();renderStation();globe.select(chosen.id,{instant:true});
if(matchMedia('(max-width: 760px)').matches)setPanel('playerDrawer',false,'playerToggle');
window.matchMedia('(max-width: 760px)').addEventListener('change',event=>{
  if(event.matches){if(!$('stationDrawer').hidden)setPanel('playerDrawer',false,'playerToggle');stopDetailedView();showFocusedMedia();}
  else{const panel=$('playerDrawer');panel.hidden=false;panel.dataset.open='true';$('playerToggle')?.setAttribute('aria-expanded','true');}
  for(const toggle of ['exploreToggle','stationsToggle'])$(toggle).setAttribute('aria-expanded',String(!$('stationDrawer').hidden));
  if(!signalPreferenceSaved){signalCollapsed=event.matches;syncSignalCollapse();}
  globe.resize();
  updateFocusTarget();
});
window.addEventListener('resize',()=>{const prior=window.EarthPreferHiRes;window.EarthRefreshQuality();if(prior!==window.EarthPreferHiRes){setFocusedPoster($('signalPoster'),SOURCE_META[focusedSource]);}updateFocusTarget();});
new ResizeObserver(()=>globe.resize()).observe($('playerDrawer'));
