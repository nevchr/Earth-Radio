/* Interactive, locally textured globe. Coordinates on pins are editorial entry points. */
(function(){
  const DEG=Math.PI/180;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  window.EarthGlobe=function EarthGlobe({canvas,stations=[],onSelect=()=>{},getBeatPulse=()=>0}){
    const ctx=canvas?.getContext?.('2d');
    if(!ctx)return {select(){},resize(){},destroy(){}};
    const bearing=document.getElementById('globeBearing');
    const liveStatus=document.getElementById('liveStatus');
    const zoomIn=document.getElementById('globeZoomIn');
    const zoomOut=document.getElementById('globeZoomOut');
    const layersInfo=document.getElementById('globeLayerInfo');
    const signalWindow=document.querySelector('.signal-window');
    const texture=new Image();
    let texturePixels=null,textureWidth=0,textureHeight=0;
    let w=0,h=0,dpr=1,centerX=0,centerY=0,radius=0,zoom=1;
    let centerLon=-20,centerLat=20,selectedId=stations[0]?.id||null;
    let frame=0,disposed=false,pins=[],cameraMotion=null,overlayTimer=null,lastTextureKey='';
    let overlaysEnabled=true,visualPlaying=false,activeMedia=null,activeKind='ocean',activeLabel='',activeProjection='approximate';
    let activePixels=null,nightPoints=[],lastActiveTime=-1,lastOverlayCapture=0,activeFrameCaptured=false,activeFrameSerial=0;
    const isLean=()=>Boolean(navigator.connection?.saveData||(navigator.deviceMemory&&navigator.deviceMemory<=4)||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4)||window.matchMedia?.('(max-width: 760px)')?.matches);
    let leanDevice=isLean(),overlayInterval=leanDevice?420:260,wasMobile=null,layout=null,earthFallback=false;
    const mediaCanvas=document.createElement('canvas');mediaCanvas.width=640;mediaCanvas.height=320;
    const mediaCtx=mediaCanvas.getContext('2d',{willReadFrequently:true});
    const reducedMotion=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||false;
    const pointers=new Map();let lastPinchDistance=0,dragged=false;
    const sphere=document.createElement('canvas'),sphereCtx=sphere.getContext('2d');
    // Keep the existing software renderer as a fallback. On supported devices,
    // sample the same NASA and Blue Marble pixels in a fragment shader so a
    // drag does not block the UI thread with a full-sphere pixel loop.
    const gpuCanvas=document.createElement('canvas');
    let gpu=null;
    function createGpu(){
      let gl;
      try{gl=gpuCanvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});}catch(_error){return null;}
      if(!gl)return null;
      const vertexSource='attribute vec2 position; varying vec2 coord; void main(){coord=position;gl_Position=vec4(position,0.0,1.0);}';
      const fragmentSource=`precision highp float;
        varying vec2 coord;
        uniform sampler2D earthMap;
        uniform sampler2D nasaMap;
        uniform float centerLon;
        uniform float centerLat;
        uniform float hasEarth;
        uniform float hasNasa;
        uniform float nasaStrength;
        uniform float boostFloor;
        uniform float boostGain;
        void main(){
          float r2=dot(coord,coord);
          if(r2>=1.0)discard;
          float z=sqrt(1.0-r2), c=cos(centerLat), s=sin(centerLat);
          float lat=asin(clamp(coord.y*c+z*s,-1.0,1.0));
          float lon=centerLon+atan(coord.x,z*c-coord.y*s);
          vec2 uv=vec2(fract((degrees(lon)+180.0)/360.0),(degrees(lat)+90.0)/180.0);
          float light=0.32+0.66*z-0.09*coord.x;
          vec3 colour=hasEarth>0.5?texture2D(earthMap,uv).rgb*light:vec3(21.0,86.0,108.0)/255.0*(0.36+0.57*z);
          if(hasNasa>0.5){
            vec3 source=texture2D(nasaMap,uv).rgb;
            source=clamp(source+max(source-vec3(boostFloor),0.0)*boostGain,0.0,1.0);
            colour=mix(colour,source,nasaStrength);
          }
          gl_FragColor=vec4(colour,1.0);
        }`;
      function shader(type,source){const item=gl.createShader(type);gl.shaderSource(item,source);gl.compileShader(item);if(!gl.getShaderParameter(item,gl.COMPILE_STATUS)){gl.deleteShader(item);return null;}return item;}
      const vertex=shader(gl.VERTEX_SHADER,vertexSource),fragment=shader(gl.FRAGMENT_SHADER,fragmentSource);
      if(!vertex||!fragment)return null;
      const program=gl.createProgram();gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
      gl.deleteShader(vertex);gl.deleteShader(fragment);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS)){gl.deleteProgram(program);return null;}
      const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
      const position=gl.getAttribLocation(program,'position');
      const uniforms=Object.fromEntries(['earthMap','nasaMap','centerLon','centerLat','hasEarth','hasNasa','nasaStrength','boostFloor','boostGain'].map(name=>[name,gl.getUniformLocation(program,name)]));
      function makeTexture(){const item=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,item);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,255]));return item;}
      const earth=makeTexture(),nasa=makeTexture();
      let earthReady=false,nasaReady=false;
      function upload(item,source){gl.bindTexture(gl.TEXTURE_2D,item);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);}
      return {
        maxTextureSize:gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxRenderSize:Math.min(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),...gl.getParameter(gl.MAX_VIEWPORT_DIMS)),
        get overlayReady(){return nasaReady;},
        uploadEarth(source){try{upload(earth,source);earthReady=true;return true;}catch(_error){return false;}},
        uploadOverlay(source){try{upload(nasa,source);nasaReady=true;return true;}catch(_error){nasaReady=false;return false;}},
        clearOverlay(){nasaReady=false;},
        render(size,showNasa,strength,boostFloor,boostGain){
          if(gl.isContextLost()||(texture.naturalWidth&&!earthReady)||(showNasa&&!nasaReady))return false;
          try{
            if(gpuCanvas.width!==size){gpuCanvas.width=size;gpuCanvas.height=size;}
            gl.viewport(0,0,size,size);gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
            gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
            gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,earth);gl.uniform1i(uniforms.earthMap,0);
            gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,nasa);gl.uniform1i(uniforms.nasaMap,1);
            gl.uniform1f(uniforms.centerLon,centerLon*DEG);
            gl.uniform1f(uniforms.centerLat,centerLat*DEG);
            gl.uniform1f(uniforms.hasEarth,earthReady?1:0);
            gl.uniform1f(uniforms.hasNasa,showNasa&&nasaReady?1:0);
            gl.uniform1f(uniforms.nasaStrength,strength);
            gl.uniform1f(uniforms.boostFloor,boostFloor/255);
            gl.uniform1f(uniforms.boostGain,boostGain);
            gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
            return true;
          }catch(_error){return false;}
        }
      };
    }
    gpu=createGpu();
    gpuCanvas.addEventListener('webglcontextlost',event=>{event.preventDefault();gpu=null;activeFrameCaptured=false;schedule();});
    gpuCanvas.addEventListener('webglcontextrestored',()=>{gpu=createGpu();if(texture.complete&&texture.naturalWidth)gpu?.uploadEarth(texture);activeFrameCaptured=false;schedule();});
    texture.onload=()=>{
      if(disposed)return;
      gpu?.uploadEarth(texture);
      canvas.dataset.earthTexture=`${texture.naturalWidth}x${texture.naturalHeight}`;
      // Keep a bounded software copy instead of reading back the full desktop
      // map. The GPU samples the original NASA image at its native resolution.
      try{
        const source=document.createElement('canvas');
        source.width=Math.min(2048,texture.naturalWidth);
        source.height=Math.round(source.width*texture.naturalHeight/texture.naturalWidth);
        const c=source.getContext('2d',{willReadFrequently:true});
        c.drawImage(texture,0,0,source.width,source.height);
        texturePixels=c.getImageData(0,0,source.width,source.height).data;
        textureWidth=source.width;textureHeight=source.height;
      }catch(error){console.warn('Earth texture cannot be read; using globe fallback.',error);}
      lastTextureKey='';schedule();
    };
    texture.onerror=()=>{
      if(disposed)return;
      if(!texture.src.endsWith('/bluemarble-2048.png')){earthFallback=true;texture.src='./assets/bluemarble-2048.png';return;}
      console.warn('Earth texture unavailable; using globe fallback.');schedule();
    };
    function refreshEarth(){const detailed=!earthFallback&&!leanDevice&&w>=900&&gpu?.maxTextureSize>=5400;const url=detailed?'bluemarble-5400.jpg':'bluemarble-2048.png';if(!texture.src.endsWith('/'+url))texture.src='./assets/'+url;}
    document.fonts?.load('700 12px Helvetica').then(schedule).catch(()=>{});
    function geometry(){centerX=layout?.x??w*.5;centerY=layout?.y??h*.51;radius=(layout?.radius??Math.min(w*.36,h*.42))*zoom;canvas.dataset.geometry=JSON.stringify({x:centerX,y:centerY,radius});}
    function resize(){
      if(disposed)return;const rect=canvas.getBoundingClientRect();w=Math.max(1,rect.width);h=Math.max(1,rect.height);
      const mobile=w<=760;
      if(wasMobile!==null&&wasMobile!==mobile){cameraMotion=null;zoom=mobile?1.08:1.18;}
      wasMobile=mobile;leanDevice=isLean();overlayInterval=leanDevice?420:260;canvas.dataset.quality=leanDevice?'lean':'detailed';refreshEarth();
      layout=null;
      if(mobile){
        const short=h<=550,player=document.getElementById('playerDrawer'),stationsPanel=document.getElementById('stationDrawer');
        const sheet=[player,stationsPanel].find(panel=>panel&&!panel.hidden);
        const top=short?114:120,bottom=short?h-68:sheet?Math.max(top+60,sheet.getBoundingClientRect().top-10):h-68;
        const width=short?w*.49:w;
        layout={x:width/2,y:(top+bottom)/2,radius:Math.max(28,Math.min(width*.43,(bottom-top)*.46))/1.08};
      }
      dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);geometry();lastTextureKey='';schedule();
    }
    function project(lat,lon){const a=(lon-centerLon)*DEG,b=lat*DEG,c=centerLat*DEG;const z=Math.sin(c)*Math.sin(b)+Math.cos(c)*Math.cos(b)*Math.cos(a);return {x:centerX+radius*Math.cos(b)*Math.sin(a),y:centerY-radius*(Math.cos(c)*Math.sin(b)-Math.sin(c)*Math.cos(b)*Math.cos(a)),z};}
    function capture(media,kind){
      if(!mediaCtx||!media)return null;
      const video=media.tagName==='VIDEO';
      if(video?(media.readyState<2||media.seeking):(!media.complete||!media.naturalWidth))return null;
      try{
        const sourceWidth=video?media.videoWidth:media.naturalWidth,sourceHeight=video?media.videoHeight:media.naturalHeight;
        const flatSourceWidth=kind==='night'?sourceWidth/2:sourceWidth;
        const mapLimit=gpu?Math.min(4096,gpu.maxTextureSize):1536;
        const mapWidth=leanDevice?640:Math.max(640,Math.min(mapLimit,Math.round(flatSourceWidth/2)*2)),mapHeight=mapWidth/2;
        canvas.dataset.overlayTexture=`${mapWidth}x${mapHeight}`;
        if(mediaCanvas.width!==mapWidth){mediaCanvas.width=mapWidth;mediaCanvas.height=mapHeight;}
        mediaCtx.clearRect(0,0,mapWidth,mapHeight);
        // The EIC night-light clip contains two 640×360 world-map panels.
        // Use the full left panel, then fit it to our 2:1 globe sampling
        // texture. Its page does not provide pixel-level georeferencing.
        if(kind==='night')mediaCtx.drawImage(media,0,0,sourceWidth/2,sourceHeight,0,0,mapWidth,mapHeight);
        else mediaCtx.drawImage(media,0,0,sourceWidth,sourceHeight,0,0,mapWidth,mapHeight);
        if(kind==='nightmap'){
          // The SOS movie repeats its year label four times over open ocean.
          // Remove just those captions from the globe texture; keep NASA's
          // untouched frame, including its labels, in the source window.
          const scale=mapWidth/640;
          for(const x of [111,271,437,596])mediaCtx.drawImage(mediaCanvas,Math.round(x*scale),Math.round(175*scale),Math.round(36*scale),Math.round(16*scale),Math.round(x*scale),Math.round(153*scale),Math.round(36*scale),Math.round(16*scale));
        }
        const uploaded=gpu?.uploadOverlay(mediaCanvas);
        // Night-light points need actual pixels; other GPU views avoid a
        // multi-megabyte readback on every animation frame.
        return !uploaded||kind==='night'||kind==='nightmap'?mediaCtx.getImageData(0,0,mapWidth,mapHeight).data:null;
      }catch(error){console.warn('Globe layer frame unavailable.',error);return false;}
    }
    function locateNightPixels(pixels){
      // Sample warm, bright pixels from the actual NASA annual-map frame.
      // The panel has no pixel-level georeferencing, so these remain an
      // approximate drape and must not be described as exact city positions.
      const points=[];
      // Keep at most one warm bright pixel per map tile so a few bright labels
      // or metropolitan clusters cannot consume the whole point budget.
      const mapWidth=mediaCanvas.width,mapHeight=mediaCanvas.height,scale=mapWidth/640;
      for(let tileY=Math.round(23*scale);tileY<Math.round(296*scale);tileY+=Math.round(9*scale))for(let tileX=0;tileX<mapWidth;tileX+=Math.round(9*scale)){
        let brightest=null;
        for(let y=tileY;y<Math.min(tileY+Math.round(9*scale),Math.round(296*scale));y+=Math.max(2,Math.round(2*scale)))for(let x=tileX;x<Math.min(tileX+Math.round(9*scale),mapWidth);x+=Math.max(2,Math.round(2*scale))){
          const i=(y*mapWidth+x)*4,r=pixels[i],g=pixels[i+1],b=pixels[i+2];
          if(r<65||r-b<9||g-b<6)continue;
          const strength=clamp((r-65)/100,.22,1);
          if(!brightest||strength>brightest.strength)brightest={lat:90-y/(mapHeight-1)*180,lon:x/(mapWidth-1)*360-180,strength};
        }
        if(brightest)points.push(brightest);
      }
      points.sort((a,b)=>b.strength-a.strength);
      return points.slice(0,210);
    }
    function updateOverlayFrames(){
      if(!overlaysEnabled||!activeMedia)return;
      const now=performance.now();
      if(now-lastOverlayCapture<overlayInterval&&activeFrameCaptured)return;
      lastOverlayCapture=now;
      const time=activeMedia.tagName==='VIDEO'?activeMedia.currentTime:0;
      if((!reducedMotion()||!activeFrameCaptured)&&(!activeFrameCaptured||time!==lastActiveTime)){
        const pixels=capture(activeMedia,activeKind);
        if(pixels!==false){
          nightPoints=pixels&&(activeKind==='night'||activeKind==='nightmap')?locateNightPixels(pixels):[];
          // This buffer belongs only to the globe display. Tone it once per
          // source frame rather than repeating the work on every drag frame.
          const curve=displayStyle(activeKind).curve;
          if(pixels&&curve)for(let i=0;i<pixels.length;i+=4){pixels[i]=curve[pixels[i]];pixels[i+1]=curve[pixels[i+1]];pixels[i+2]=curve[pixels[i+2]];}
          activePixels=pixels;activeFrameCaptured=true;activeFrameSerial++;lastActiveTime=time;
        }
      }
    }
    let sphereGrid=null,sphereImage=null;
    function prepareSphere(size){
      if(sphereGrid?.size===size)return;
      sphere.width=size;sphere.height=size;
      sphereImage=sphereCtx.createImageData(size,size);
      const count=size*size,gridX=new Float32Array(count),gridY=new Float32Array(count),gridZ=new Float32Array(count),gridLight=new Float32Array(count);
      const half=size/2;
      for(let py=0;py<size;py++)for(let px=0;px<size;px++){
        const index=py*size+px,x=(px+.5-half)/half,y=(half-py-.5)/half,r2=x*x+y*y;
        if(r2>=1)continue;
        const z=Math.sqrt(1-r2);
        gridX[index]=x;gridY[index]=y;gridZ[index]=z;gridLight[index]=.32+.66*z-.09*x;
      }
      sphereGrid={size,x:gridX,y:gridY,z:gridZ,light:gridLight};
    }
    // Display-only tone lift. The sampled NASA media and sound analysis remain
    // untouched; the source window is the visual reference for original pixels.
    function makeDisplayStyle(strength,floor,gain){
      const curve=gain?Uint8ClampedArray.from({length:256},(_,value)=>Math.min(255,value+Math.max(0,value-floor)*gain)):null;
      return {strength,floor,gain,curve};
    }
    const displayStyles={night:makeDisplayStyle(.98,16,2.1),nightmap:makeDisplayStyle(.98,28,1.7),lightning:makeDisplayStyle(.94,24,1.2),default:makeDisplayStyle(.91,0,0)};
    function displayStyle(kind){return displayStyles[kind]||displayStyles.default;}
    function renderTexture(){
      if(!sphereCtx)return;
      // Reuse exact sphere geometry and image memory across camera frames.
      // Rotation changes the map lookup, but not each pixel's surface normal.
      const displayPixels=radius*2*dpr;
      const size=Math.round(clamp(displayPixels*(cameraMotion?.68:1.05),leanDevice?260:380,leanDevice?640:1024));
      prepareSphere(size);
      const out=sphereImage.data,grid=sphereGrid,cos0=Math.cos(centerLat*DEG),sin0=Math.sin(centerLat*DEG);
      const map=overlaysEnabled&&activePixels?activePixels:null,mapWidth=mediaCanvas.width,mapHeight=mediaCanvas.height;
      const style=displayStyle(activeKind),strength=style.strength,baseStrength=1-strength;
      const earthWidth=textureWidth,earthHeight=textureHeight,earth=texturePixels;
      for(let index=0;index<grid.z.length;index++){
        const z=grid.z[index];if(!z)continue;
        const x=grid.x[index],y=grid.y[index];
        const latDegrees=Math.asin(y*cos0+z*sin0)/DEG;
        let lon=centerLon+Math.atan2(x,z*cos0-y*sin0)/DEG;
        if(lon>180)lon-=360;else if(lon<-180)lon+=360;
        const longitude=(lon+180)/360,latitude=(90-latDegrees)/180,i=index*4;
        if(earth){
          const tx=clamp(Math.floor(longitude*earthWidth),0,earthWidth-1),ty=clamp(Math.floor(latitude*earthHeight),0,earthHeight-1),j=(ty*earthWidth+tx)*4;
          const light=grid.light[index];out[i]=earth[j]*light;out[i+1]=earth[j+1]*light;out[i+2]=earth[j+2]*light;
        }else{
          const light=.36+.57*z;out[i]=21*light;out[i+1]=86*light;out[i+2]=108*light;
        }
        if(map){
          const tx=clamp(longitude*(mapWidth-1),0,mapWidth-1),ty=clamp(latitude*(mapHeight-1),0,mapHeight-1);
          const x0=Math.floor(tx),y0=Math.floor(ty),x1=Math.min(mapWidth-1,x0+1),y1=Math.min(mapHeight-1,y0+1),fx=tx-x0,fy=ty-y0;
          const a=(y0*mapWidth+x0)*4,b=(y0*mapWidth+x1)*4,c=(y1*mapWidth+x0)*4,d=(y1*mapWidth+x1)*4;
          const wa=(1-fx)*(1-fy),wb=fx*(1-fy),wc=(1-fx)*fy,wd=fx*fy;
          const red=map[a]*wa+map[b]*wb+map[c]*wc+map[d]*wd;
          const green=map[a+1]*wa+map[b+1]*wb+map[c+1]*wc+map[d+1]*wd;
          const blue=map[a+2]*wa+map[b+2]*wb+map[c+2]*wc+map[d+2]*wd;
          out[i]=out[i]*baseStrength+red*strength;
          out[i+1]=out[i+1]*baseStrength+green*strength;
          out[i+2]=out[i+2]*baseStrength+blue*strength;
        }
        out[i+3]=255;
      }
      sphereCtx.putImageData(sphereImage,0,0);
    }
    function animateCamera(){
      if(!cameraMotion)return;
      const t=clamp((performance.now()-cameraMotion.started)/cameraMotion.duration,0,1);
      const eased=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
      centerLon=((cameraMotion.lon+cameraMotion.lonDelta*eased+540)%360)-180;
      centerLat=cameraMotion.lat+(cameraMotion.targetLat-cameraMotion.lat)*eased;
      zoom=cameraMotion.zoom+(cameraMotion.targetZoom-cameraMotion.zoom)*eased;
      if(t>=1)cameraMotion=null;
    }
    function drawNightPoints(){
      if(!nightPoints.length||!overlaysEnabled||!(activeKind==='night'||activeKind==='nightmap'))return;
      const pulse=reducedMotion()?0:clamp(getBeatPulse(),0,1);
      ctx.save();ctx.globalCompositeOperation='screen';
      for(const point of nightPoints){
        const p=project(point.lat,point.lon);if(p.z<.1)continue;
        const alpha=(.45+.48*pulse)*point.strength*p.z;
        ctx.fillStyle=`rgba(246,207,137,${alpha.toFixed(3)})`;
        ctx.shadowColor='#efc878';ctx.shadowBlur=6+13*pulse;
        ctx.beginPath();ctx.arc(p.x,p.y,(1.4+2*pulse)*(.75+.45*point.strength),0,Math.PI*2);ctx.fill();
      }
      ctx.restore();
    }
    function draw(){
      frame=0;if(disposed)return;animateCamera();geometry();updateOverlayFrames();ctx.clearRect(0,0,w,h);
      if(signalWindow)signalWindow.style.setProperty('--kick',String(visualPlaying&&(activeKind==='night'||activeKind==='nightmap')&&overlaysEnabled&&!reducedMotion()?(.12+.75*clamp(getBeatPulse(),0,1)).toFixed(2):'.12'));
      const glow=ctx.createRadialGradient(centerX,centerY,radius*.75,centerX,centerY,radius*1.24);
      glow.addColorStop(0,'#438dff00');glow.addColorStop(.43,'#438dff20');glow.addColorStop(.75,'#438dff10');glow.addColorStop(1,'#438dff00');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(centerX,centerY,radius*1.24,0,Math.PI*2);ctx.fill();
      const textureKey=[w,h,radius.toFixed(2),centerLon.toFixed(3),centerLat.toFixed(3),selectedId,overlaysEnabled,activeKind,activeFrameSerial,!!texturePixels].join('|');
      if(textureKey!==lastTextureKey){
        const textureStarted=performance.now();
        const displayPixels=radius*2*dpr;
        const renderLimit=leanDevice?640:gpu?Math.min(2048,gpu.maxRenderSize):1024;
        const size=Math.round(clamp(displayPixels*1.05,leanDevice?260:380,renderLimit));
        const style=displayStyle(activeKind);
        if(gpu?.render(size,overlaysEnabled&&activeFrameCaptured,style.strength,style.floor,style.gain))usingGpu=true;
        else{usingGpu=false;renderTexture();}
        canvas.dataset.renderer=usingGpu?'webgl':'canvas2d';
        canvas.dataset.renderSize=String(usingGpu?size:sphere.width);
        canvas.dataset.textureMs=(performance.now()-textureStarted).toFixed(1);
        lastTextureKey=textureKey;
      }
      ctx.save();ctx.beginPath();ctx.arc(centerX,centerY,radius,0,Math.PI*2);ctx.clip();ctx.drawImage(usingGpu?gpuCanvas:sphere,centerX-radius,centerY-radius,radius*2,radius*2);
      const limb=ctx.createRadialGradient(centerX-radius*.35,centerY-radius*.43,radius*.2,centerX,centerY,radius*1.03);limb.addColorStop(0,'#bcf0e318');limb.addColorStop(.7,'#00000000');limb.addColorStop(1,'#04131bb0');ctx.fillStyle=limb;ctx.fillRect(centerX-radius,centerY-radius,radius*2,radius*2);drawNightPoints();ctx.restore();
      ctx.strokeStyle='#83b9ee73';ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(centerX,centerY,radius,0,Math.PI*2);ctx.stroke();
      pins=[];const mobile=w<=760;
      if(!mobile&&['river','film-gulf','film-japan','film-agulhas'].includes(activeKind)&&signalWindow){
        const station=stations.find(item=>item.id===selectedId),point=station&&project(station.lat,station.lon);
        if(point?.z>.08){
          const box=signalWindow.getBoundingClientRect(),surface=canvas.getBoundingClientRect();
          const endX=box.right-surface.left,endY=box.top-surface.top+box.height*.4;
          ctx.strokeStyle='#9fc5ed7a';ctx.lineWidth=1.2;ctx.setLineDash([3,5]);
          ctx.beginPath();ctx.moveTo(point.x,point.y);ctx.quadraticCurveTo((point.x+endX)/2,Math.min(point.y,endY)-24,endX,endY);ctx.stroke();ctx.setLineDash([]);
        }
      }
      const labelBoxes=[];
      for(const station of [...stations].sort((a,b)=>Number(b.id===selectedId)-Number(a.id===selectedId))){if(!Number.isFinite(station.lat)||!Number.isFinite(station.lon))continue;const p=project(station.lat,station.lon);if(p.z<.04)continue;pins.push({id:station.id,x:p.x,y:p.y});const active=station.id===selectedId;
        if(active&&overlaysEnabled&&!reducedMotion()&&p.z>.1){const beat=clamp(getBeatPulse(),0,1);if(beat>.015){ctx.strokeStyle=`rgba(69,157,255,${(beat*.5).toFixed(3)})`;ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(p.x,p.y,12+22*(1-beat),0,Math.PI*2);ctx.stroke();}}
        ctx.fillStyle=active?'#4a9fff35':'#7db8ef2a';ctx.beginPath();ctx.arc(p.x,p.y,active?22:17,0,Math.PI*2);ctx.fill();
        ctx.fillStyle=active?'#59aaff':'#96caff';ctx.strokeStyle='#17232c';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,active?7:5,0,Math.PI*2);ctx.fill();ctx.stroke();
        if((!mobile&&p.z>.4)||active){const label=station.title||station.id;ctx.font='700 12px Helvetica, Arial, sans-serif';const width=ctx.measureText(label).width;
          const x=clamp(p.x+12+width>w-22?p.x-12-width:p.x+12,8,Math.max(8,w-width-8));let y=p.y-11;
          for(let tries=0;tries<5&&labelBoxes.some(b=>x<b.x+b.w&&x+width>b.x&&y>b.y-15&&y-15<b.y);tries++)y+=18;
          if(!labelBoxes.some(b=>x<b.x+b.w&&x+width>b.x&&y>b.y-15&&y-15<b.y)){labelBoxes.push({x,y,w:width});ctx.fillStyle='#e8eef4';ctx.shadowColor='#0a1118';ctx.shadowBlur=7;ctx.fillText(label,x,y);ctx.shadowBlur=0;}}
      }
      if(bearing)bearing.textContent=`VIEW / ${Math.abs(Math.round(centerLat))}° ${centerLat>=0?'N':'S'} · ${String(Math.abs(Math.round(centerLon))).padStart(3,'0')}° ${centerLon>=0?'E':'W'}`;
      if(cameraMotion)schedule();
      else if(overlaysEnabled&&visualPlaying&&!reducedMotion()){clearTimeout(overlayTimer);overlayTimer=setTimeout(schedule,getBeatPulse()>.02?55:overlayInterval);}
    }
    let usingGpu=false;
    function schedule(){if(!frame&&!disposed)frame=requestAnimationFrame(draw);}
    function setZoom(value){cameraMotion=null;zoom=clamp(value,.64,1.65);schedule();}
    function announceView(){if(liveStatus)liveStatus.textContent=`Globe view ${Math.abs(Math.round(centerLat))} degrees ${centerLat>=0?'north':'south'}, ${Math.abs(Math.round(centerLon))} degrees ${centerLon>=0?'east':'west'}, zoom ${Math.round(zoom*100)} percent. Use the Explore stations button for the same station choices.`;}
    function select(id,{instant=false}={}){const station=stations.find(s=>s.id===id);if(!station)return;selectedId=id;
      const targetLon=station.lon,targetLat=clamp(station.lat*.82,-67,67),targetZoom=w<=760?1.08:1.18;
      if(instant||reducedMotion()){cameraMotion=null;centerLon=targetLon;centerLat=targetLat;zoom=targetZoom;}
      else{const lonDelta=((targetLon-centerLon+540)%360)-180;cameraMotion={lon:centerLon,lonDelta,lat:centerLat,targetLat,zoom,targetZoom,started:performance.now(),duration:850};}
      schedule();}
    function setOverlaysEnabled(enabled){
      const next=Boolean(enabled);if(next===overlaysEnabled)return;
      overlaysEnabled=next;activePixels=null;nightPoints=[];lastActiveTime=-1;activeFrameCaptured=false;gpu?.clearOverlay();
      if(layersInfo)layersInfo.hidden=!overlaysEnabled||!activeMedia;
      schedule();
    }
    function setVisuals({playing=false,media=null,kind='ocean',label='',projection='approximate'}={}){
      const changed=playing!==visualPlaying||media!==activeMedia||kind!==activeKind;
      if(media!==activeMedia||kind!==activeKind){activeMedia=media;activeKind=kind;activePixels=null;nightPoints=[];lastActiveTime=-1;activeFrameCaptured=false;gpu?.clearOverlay();}
      activeLabel=label;activeProjection=projection;visualPlaying=playing;
      if(layersInfo){layersInfo.hidden=!overlaysEnabled||!activeMedia;const info=activeProjection==='equirectangular'?'equirectangular map':'approximate flat-map placement';const labelText=`NASA ${activeLabel} · ${info} · display-enhanced globe colours${activeKind==='night'||activeKind==='nightmap'?' · bright pixels pulse with the synthesized kick':''}`;if(layersInfo.textContent!==labelText)layersInfo.textContent=labelText;}
      if(changed)schedule();
    }
    function pointerDown(event){if(event.pointerType==='mouse'&&event.button!==0)return;cameraMotion=null;canvas.setPointerCapture(event.pointerId);pointers.set(event.pointerId,{x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY});if(pointers.size===1)dragged=false;if(pointers.size===2){dragged=true;const [a,b]=[...pointers.values()];lastPinchDistance=Math.hypot(a.x-b.x,a.y-b.y);}}
    function pointerMove(event){const pointer=pointers.get(event.pointerId);if(!pointer)return;const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;pointer.x=event.clientX;pointer.y=event.clientY;if(Math.abs(event.clientX-pointer.startX)+Math.abs(event.clientY-pointer.startY)>5)dragged=true;
      if(pointers.size===2){const [a,b]=[...pointers.values()],distance=Math.hypot(a.x-b.x,a.y-b.y);if(lastPinchDistance)setZoom(zoom*distance/lastPinchDistance);lastPinchDistance=distance;dragged=true;return;}
      centerLon=((centerLon-dx*.34/zoom+540)%360)-180;centerLat=clamp(centerLat+dy*.25/zoom,-75,75);schedule();}
    function pointerUp(event){const pointer=pointers.get(event.pointerId);pointers.delete(event.pointerId);if(pointers.size<2)lastPinchDistance=0;if(!pointer||dragged)return;const rect=canvas.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;const pin=pins.map(p=>({...p,distance:Math.hypot(p.x-x,p.y-y)})).filter(p=>p.distance<25).sort((a,b)=>a.distance-b.distance)[0];if(pin){selectedId=pin.id;schedule();onSelect(pin.id);}}
    function pointerCancel(event){pointers.delete(event.pointerId);dragged=true;if(pointers.size<2)lastPinchDistance=0;}
    function wheel(event){event.preventDefault();setZoom(zoom*(event.deltaY<0?1.09:.91));}
    function keydown(event){let handled=true;switch(event.key){case 'ArrowLeft':centerLon-=10/zoom;break;case 'ArrowRight':centerLon+=10/zoom;break;case 'ArrowUp':centerLat=clamp(centerLat+8/zoom,-75,75);break;case 'ArrowDown':centerLat=clamp(centerLat-8/zoom,-75,75);break;case '+':case '=':setZoom(zoom*1.12);break;case '-':case '_':setZoom(zoom/1.12);break;default:handled=false;}if(handled){cameraMotion=null;event.preventDefault();centerLon=((centerLon+540)%360)-180;schedule();announceView();}}
    canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerCancel);canvas.addEventListener('wheel',wheel,{passive:false});canvas.addEventListener('keydown',keydown);
    zoomIn?.addEventListener('click',()=>{setZoom(zoom*1.12);announceView();});zoomOut?.addEventListener('click',()=>{setZoom(zoom/1.12);announceView();});
    window.addEventListener('resize',resize);
    resize();
    return {select,setVisuals,setOverlaysEnabled,resize,destroy(){disposed=true;cancelAnimationFrame(frame);clearTimeout(overlayTimer);window.removeEventListener('resize',resize);canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('pointercancel',pointerCancel);canvas.removeEventListener('wheel',wheel);canvas.removeEventListener('keydown',keydown);}};
  };
})();
