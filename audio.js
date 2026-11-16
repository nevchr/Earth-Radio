/* Earth Radio v2: live sound from NASA-rendered pixels, not physical measurements.
   Videos run on independent timelines; simultaneous layers are an artistic
   juxtaposition, never a synchronized observation of Earth. */
(function () {
  'use strict';

  const SOURCES = window.EarthSources = {
    ocean: { id: 'ocean', type: 'video', url: './assets/ocean.mp4', hdUrl: './assets/ocean-hd.mp4', hz: 5, source: 'https://svs.gsfc.nasa.gov/3912/', period: '2007–2008 model sequence', scope: 'Rendered global ocean map' },
    ocean2: { id: 'ocean2', type: 'video', url: './assets/ocean2.mp4', hdUrl: './assets/ocean2-hd.mp4', hz: 5, source: 'https://svs.gsfc.nasa.gov/5505/', period: '2021–2023 model sequence, accelerated excerpt', scope: 'Equirectangular global ocean beauty pass' },
    night: { id: 'night', type: 'video', url: './assets/nightlights.mp4', hdUrl: './assets/night-hd.mp4', hz: 3, source: 'https://svs.gsfc.nasa.gov/5313/', period: 'Excerpt from 2012–2023 annual views', scope: 'Rendered global night-light map' },
    nightmap: { id: 'nightmap', type: 'video', url: './assets/nightmap.mp4', hdUrl: './assets/nightmap-hd.mp4', hz: 3, source: 'https://svs.gsfc.nasa.gov/5475/', period: '2012–2023 annual views, 29-second excerpt', scope: 'Equirectangular Black Marble map' },
    lightning: { id: 'lightning', type: 'video', url: './assets/lightning.mp4', hdUrl: './assets/lightning-hd.mp4', hz: 4, source: 'https://svs.gsfc.nasa.gov/5011/', period: '2017–2023 ISS LIS, historical 10-day moving window', scope: 'Equirectangular historical lightning map; no live strike timing' },
    pm25: { id: 'pm25', type: 'video', url: './assets/pm25.mp4', hdUrl: './assets/pm25-hd.mp4', hz: 4, source: 'https://svs.gsfc.nasa.gov/5518/', period: 'July–August 2024 GEOS-CF model excerpt', scope: 'Equirectangular PM2.5 model visualization' },
    river: { id: 'river', type: 'video', url: './assets/river.mp4', hz: 2, source: 'https://svs.gsfc.nasa.gov/4960/', period: 'MERRA-2 retrospective, muted camera excerpt', scope: 'Moving West Coast context film, not a map layer' },
    'film-gulf': { id: 'film-gulf', type: 'video', url: './assets/oceanfilm-gulf.mp4', hz: 2, source: 'https://svs.gsfc.nasa.gov/5425/', period: '2021–2023 ocean model, Gulf Stream camera excerpt', scope: 'Moving camera film, not a map layer' },
    'film-japan': { id: 'film-japan', type: 'video', url: './assets/oceanfilm-japan.mp4', hz: 2, source: 'https://svs.gsfc.nasa.gov/5425/', period: '2021–2023 ocean model, Kuroshio camera excerpt', scope: 'Moving camera film, not a map layer' },
    'film-agulhas': { id: 'film-agulhas', type: 'video', url: './assets/oceanfilm-agulhas.mp4', hz: 2, source: 'https://svs.gsfc.nasa.gov/5425/', period: '2021–2023 ocean model, Agulhas camera excerpt', scope: 'Moving camera film, not a map layer' },
    aerosol: { id: 'aerosol', type: 'image', url: './assets/aerosol.png', hdUrl: './assets/aerosol-hd.png', hz: 0, source: 'https://svs.gsfc.nasa.gov/5669/', period: 'August 19, 2025 still model image', scope: 'Rendered global aerosol snapshot' },
    gedi: { id: 'gedi', type: 'video', url: './assets/gedi.mp4', hz: 5, source: 'https://svs.gsfc.nasa.gov/4950/', period: 'GEDI coverage sequence', scope: 'Moving West Coast view; pixel focus does not follow a fixed location' },
    co2: { id: 'co2', type: 'video', url: './assets/co2.mp4', hz: 5, source: 'https://svs.gsfc.nasa.gov/5196/', period: 'January–March 2020 model sequence', scope: 'Orbiting global view; not a local station measurement' }
  };

  // Use sharper NASA copies on wider, capable screens. Smaller originals remain
  // the default for phones, data-saving connections, and low-memory devices.
  const preferHiRes = window.matchMedia?.('(min-width: 900px)')?.matches &&
    !navigator.connection?.saveData &&
    (navigator.deviceMemory == null || navigator.deviceMemory > 4) &&
    (navigator.hardwareConcurrency == null || navigator.hardwareConcurrency > 4);
  const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, Number.isFinite(value) ? value : low));
  const scale = (value, low, high) => clamp((value - low) / (high - low));
  // Default 25–28% remains gentle (~.04 gain), while the full slider now has
  // useful range. The .11 ceiling is before the safety compressor below.
  const OUTPUT_CEILING = .11;
  const outputGain = volume => volume <= 0 ? 0 : Math.min(OUTPUT_CEILING, OUTPUT_CEILING * clamp(volume) ** .72);
  const NOTES = [0, 3, 5, 7, 10, 12]; // shared minor pentatonic palette: an artistic choice
  const PENTATONIC_CLASSES = new Set([0, 3, 5, 7, 10]);
  const note = (level, octave = 0) => 130.8128 * 2 ** ((NOTES[Math.round(clamp(level) * 5)] + octave * 12) / 12);
  const createAudioContext = () => {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) throw new Error('This browser does not support Web Audio.');
    return new Audio();
  };

  function measure(data, width, height, focus, previous, brightThreshold) {
    const x0 = Math.round(clamp(focus.x) * (width - 1));
    const y0 = Math.round(clamp(focus.y) * (height - 1));
    const radius = Math.max(2, Math.floor(Math.min(width, height) * .09));
    let luminance = 0, chroma = 0, warmth = 0, bright = 0, change = 0, count = 0;
    for (let y = Math.max(0, y0 - radius); y <= Math.min(height - 1, y0 + radius); y++) {
      for (let x = Math.max(0, x0 - radius); x <= Math.min(width - 1, x0 + radius); x++) {
        const i = (y * width + x) * 4;
        const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
        const l = .2126 * r + .7152 * g + .0722 * b;
        luminance += l;
        chroma += Math.max(r, g, b) - Math.min(r, g, b);
        warmth += Math.max(0, r - b);
        bright += l > brightThreshold ? 1 : 0;
        if (previous) change += (Math.abs(data[i] - previous[i]) + Math.abs(data[i + 1] - previous[i + 1]) + Math.abs(data[i + 2] - previous[i + 2])) / 765;
        count++;
      }
    }
    return { brightness: luminance / count, chroma: chroma / count, warmth: warmth / count, brightFraction: bright / count, change: previous ? change / count : 0 };
  }

  function soundValues(id, m) {
    // Percentile-like visual ranges are tuned to the bundled rendered assets.
    // The parameters are not temperature, canopy height, light output or ppm.
    if (id === 'ocean') {
      // The bundled ocean film changes by roughly .002–.005 per 5 Hz frame in
      // the curated regions. A .04 ceiling flattened nearly all audible motion.
      const motion = scale(m.change, .001, .009);
      return { pitch: note(scale(m.warmth, .006, .22), 0), filter: 380 + 1300 * scale(m.brightness, .16, .32), pulseHz: .22 + 1.4 * motion, activity: scale(m.chroma, .04, .24), motion };
    }
    if (id === 'ocean2') {
      // The beauty-pass palette is aesthetic. Map rendered blue/white contrast
      // and frame change, not a physical temperature or current-speed value.
      const motion = scale(m.change, .001, .018);
      return { pitch: note(scale(m.chroma, .15, .4), 0), filter: 420 + 1100 * scale(m.brightness, .18, .42), pulseHz: .2 + 1.25 * motion, activity: scale(m.chroma, .15, .4), motion };
    }
    if (id === 'night' || id === 'nightmap') return { pitch: note(scale(m.brightFraction, .01, .4), 2), filter: 900 + 1200 * scale(m.brightness, .06, .3), pulseHz: .3 + 2.1 * scale(m.brightFraction, .01, .4), activity: scale(m.brightFraction, 0, .35) };
    if (id === 'lightning') return { pitch: note(scale(m.brightFraction, .002, .16), 2), filter: 750 + 1400 * scale(m.brightness, .02, .2), pulseHz: .2 + 1.1 * scale(m.change, .001, .015), activity: scale(m.brightFraction, .002, .16) };
    if (id === 'pm25') return { pitch: note(scale(m.chroma, .08, .42), 0), filter: 450 + 1400 * scale(m.brightness, .25, .8), pulseHz: .22 + 1.1 * scale(m.change, .001, .025), activity: scale(m.chroma, .08, .42) };
    if (id === 'aerosol') return { pitch: note(scale(m.chroma, .07, .4), 1), filter: 500 + 1500 * scale(m.chroma, .06, .45), pulseHz: .2, activity: .35 + .65 * scale(m.warmth, 0, .25) };
    if (id === 'gedi') return { pitch: note(scale(m.brightness, .18, .5), 1), filter: 550 + 1500 * scale(m.chroma, .08, .35), pulseHz: .28 + 1.3 * scale(m.change, 0, .05), activity: scale(m.brightness, .12, .55) };
    // The CO₂ camera orbits. Its apparent frame motion is deliberately not
    // mapped to the shared beat, which would suggest local atmospheric motion.
    return { pitch: note(scale(m.chroma, .015, .25), -1), filter: 360 + 1100 * scale(m.chroma, .01, .28), pulseHz: .12 + .28 * scale(m.chroma, .01, .28), activity: scale(m.chroma, .008, .2) };
  }

  class EarthAudio {
    constructor({ onUpdate = () => {} } = {}) {
      this.onUpdate = onUpdate;
      this.context = null;
      this.master = null;
      this.compressor = null;
      this.bus = null;
      this.station = null;
      this.layers = [];
      this.playing = false;
      this.volume = .25;
      this.hostDuck = false;
      this.visualFocusId = null;
      this.serial = 0;
      this.timer = null;
      this.sleepTimer = null;
      this.pendingNotes = new Set();
      this.trackIndex = 0;
      this.trackElapsedAccum = 0;
      this.trackStart = null;
      this.nextMotif = 0;
      this.motifStep = 0;
      this.lastClockNotify = 0;
      this.nextBeatTime = 0;
      this.beatStep = 0;
      this.percussionNoise = null;
      this.textureNoise = null;
      this.lastKickAt = -1;
      this.lastKickStrength = 0;
      this._onVisibility = () => { if (document.hidden) this.pause(); };
      document.addEventListener('visibilitychange', this._onVisibility);
    }

    _ensureGraph() {
      if (this.context) return;
      const ctx = this.context = createAudioContext();
      this.master = ctx.createGain();
      this.master.gain.value = 0;
      this.compressor = ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -18;
      this.compressor.knee.value = 8;
      this.compressor.ratio.value = 10;
      this.compressor.attack.value = .003;
      this.compressor.release.value = .16;
      this.master.connect(this.compressor).connect(ctx.destination);
      // One short synthesized noise buffer feeds hats and soft snare-like hits.
      // It is generated in the browser; no environmental audio is included.
      this.percussionNoise = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * .5), ctx.sampleRate);
      const noise = this.percussionNoise.getChannelData(0);
      for (let i = 0; i < noise.length; i++) noise[i] = Math.random() * 2 - 1;
      // A repeatable synthetic noise bed gives the still aerosol image an airy
      // timbre. It is not an environmental recording or a NASA audio source.
      this.textureNoise = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 3), ctx.sampleRate);
      const texture = this.textureNoise.getChannelData(0);
      let seed = 0x51a7e;
      for (let i = 0; i < texture.length; i++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        texture[i] = (seed / 0x80000000) - 1;
      }
    }

    _notify() { try { this.onUpdate(this.getState()); } catch (error) { console.error('Earth Radio update callback failed:', error); } }

    _voice(layer) {
      const ctx = this.context, profile = layer.id;
      const osc = ctx.createOscillator(), harmonic = ctx.createOscillator();
      const oscGain = ctx.createGain(), harmonicGain = ctx.createGain();
      const filter = ctx.createBiquadFilter(), gain = ctx.createGain(), lfo = ctx.createOscillator(), lfoGain = ctx.createGain();
      osc.type = profile === 'ocean' || profile === 'ocean2' || profile === 'gedi' ? 'triangle' : 'sine';
      harmonic.type = profile === 'night' || profile === 'nightmap' || profile === 'lightning' ? 'sine' : 'triangle';
      osc.frequency.value = 130.8128; harmonic.frequency.value = 261.6256;
      oscGain.gain.value = profile === 'night' || profile === 'nightmap' || profile === 'lightning' ? .012 : (profile === 'ocean' || profile === 'ocean2') ? .52 : profile === 'co2' ? .38 : profile === 'aerosol' ? .10 : .16;
      harmonicGain.gain.value = profile === 'night' || profile === 'nightmap' || profile === 'lightning' ? 0 : (profile === 'ocean' || profile === 'ocean2') ? .12 : profile === 'co2' ? .045 : profile === 'aerosol' ? .03 : .055;
      filter.type = 'lowpass'; filter.frequency.value = 900;
      gain.gain.value = 0;
      lfo.type = 'sine'; lfo.frequency.value = .3;
      lfoGain.gain.value = 0;
      osc.connect(oscGain).connect(filter); harmonic.connect(harmonicGain).connect(filter);
      filter.connect(gain).connect(this.bus);
      lfo.connect(lfoGain).connect(gain.gain);
      let textureSource = null, textureFilter = null, textureGain = null;
      if (profile === 'aerosol') {
        textureSource = ctx.createBufferSource(); textureSource.buffer = this.textureNoise; textureSource.loop = true;
        textureFilter = ctx.createBiquadFilter(); textureFilter.type = 'bandpass'; textureFilter.frequency.value = 1100; textureFilter.Q.value = .35;
        textureGain = ctx.createGain(); textureGain.gain.value = .85;
        textureSource.connect(textureFilter).connect(textureGain).connect(gain);
        textureSource.start();
      }
      osc.start(); harmonic.start(); lfo.start();
      return { osc, harmonic, oscGain, harmonicGain, filter, gain, lfo, lfoGain, textureSource, textureFilter, textureGain };
    }

    _createLayer(spec, weight) {
      const source = SOURCES[spec.id];
      if (!source) throw new Error(`Unknown Earth Radio source: ${spec.id}`);
      const element = source.type === 'video' ? document.createElement('video') : document.createElement('img');
      if (source.type === 'video') {
        element.muted = true; element.playsInline = true; element.loop = true; element.preload = spec.visualOnly ? 'metadata' : 'auto';
        element.setAttribute('playsinline', '');
      }
      const canvas = document.createElement('canvas'); canvas.width = 96; canvas.height = 54;
      const context2d = canvas.getContext('2d', { willReadFrequently: true });
      const layer = {
        id: source.id, source, role: spec.role || source.id, weight, visualOnly: !!spec.visualOnly,
        focus: { x: clamp(spec.focus?.x ?? .5), y: clamp(spec.focus?.y ?? .5) },
        element, canvas, context2d, voice: null, status: 'loading', error: null,
        metrics: null, sonic: null, previous: null, lastMediaTime: null,
        lastSampleAt: 0, frameHandle: null, ready: false, nextNote: 0, nextPluck: 0
      };
      layer.voice = layer.visualOnly ? null : this._voice(layer);
      if (!context2d) {
        layer.status = 'failed'; layer.error = 'This browser cannot analyze canvas frames.';
        return layer;
      }
      element.onerror = () => this._fail(layer, 'The NASA media could not load.');
      if (source.type === 'video') {
        element.onwaiting = () => this._waiting(layer);
        element.onstalled = () => this._waiting(layer);
        element.onseeking = () => { layer.previous = null; this._waiting(layer); };
        element.onseeked = () => { layer.previous = null; this._sample(layer, true); };
        element.onplaying = () => { if (this.playing && layer.status !== 'failed') this._sample(layer, true); };
        element.onloadeddata = () => this._sample(layer, true);
      } else {
        element.onload = () => this._sample(layer, true);
      }
      element.src = preferHiRes && source.hdUrl ? source.hdUrl : source.url;
      return layer;
    }

    _setup(station, trackIndex = 0) {
      this.station = station;
      this.trackIndex = Math.max(0, Math.min((station.tracks?.length || 1) - 1, Math.floor(trackIndex)));
      this.trackElapsedAccum = 0;
      this.trackStart = null;
      this.nextMotif = 0;
      this.motifStep = 0;
      this.nextBeatTime = 0;
      this.beatStep = 0;
      this.lastKickAt = -1;
      this.bus = this.context.createGain(); this.bus.gain.value = 0; this.bus.connect(this.master);
      const specs = Array.isArray(station.layers) ? station.layers : [];
      const total = Math.max(1, specs.reduce((sum, spec) => sum + clamp(Number(spec.weight ?? 1), 0, 1), 0));
      const seen = new Set();
      this.layers = specs.map(spec => {
        if (seen.has(spec.id)) throw new Error(`Duplicate Earth Radio source: ${spec.id}`);
        seen.add(spec.id);
        return this._createLayer(spec, clamp(Number(spec.weight ?? 1), 0, 1) / total);
      });
      this._notify();
    }

    _track() { return this.station?.tracks?.[this.trackIndex] || null; }
    _trackElapsed() { return this.trackElapsedAccum + (this.playing && this.trackStart !== null && this.context ? this.context.currentTime - this.trackStart : 0); }

    setTrack(index) {
      const tracks = this.station?.tracks;
      if (!tracks?.length) return this.getState();
      const next = ((Math.floor(index) % tracks.length) + tracks.length) % tracks.length;
      if (next === this.trackIndex) return this.getState();
      this.trackIndex = next;
      this.trackElapsedAccum = 0;
      this.trackStart = this.playing && this.context && this.layers.some(layer => layer.ready) ? this.context.currentTime : null;
      this.nextMotif = 0;
      this.motifStep = 0;
      this.nextBeatTime = 0;
      this.beatStep = 0;
      this.lastKickAt = -1;
      for (const layer of this.layers) { layer.nextNote = 0; layer.nextPluck = 0; }
      if (this.playing && this.context && this.bus) {
        const now = this.context.currentTime, gain = this.bus.gain;
        for (const noteGain of this.pendingNotes) {
          noteGain.gain.cancelScheduledValues(now);
          noteGain.gain.setTargetAtTime(0, now, .01);
        }
        gain.cancelScheduledValues(now);
        gain.setValueAtTime(gain.value, now);
        gain.linearRampToValueAtTime(0, now + .16);
        gain.linearRampToValueAtTime(1, now + .52);
        for (const layer of this.layers) if (layer.ready) this._apply(layer);
      }
      this._notify();
      return this.getState();
    }

    nextTrack() { return this.setTrack(this.trackIndex + 1); }
    previousTrack() { return this.setTrack(this.trackIndex - 1); }

    seekTrack(seconds) {
      const track = this._track();
      if (!track || !Number.isFinite(Number(seconds))) return this.getState();
      const target = Math.max(0, Math.min(Number(seconds), Math.max(0, track.duration - .02)));
      this.trackElapsedAccum = target;
      this.trackStart = this.playing && this.context && this.layers.some(layer => layer.ready) ? this.context.currentTime : null;
      this.nextBeatTime = 0;
      this.beatStep = Math.floor(target / (30 / track.tempo)) % 8;
      const phrase = (60 / track.tempo) * (track.mode === 'pulse' ? .5 : track.mode === 'air' ? 1.5 : 3);
      this.motifStep = Math.floor(target / phrase);
      this.nextMotif = 0;
      this.lastKickAt = -1;
      for (const layer of this.layers) { layer.nextNote = 0; layer.nextPluck = 0; }
      if (this.playing && this.bus && this.context) {
        const now = this.context.currentTime;
        for (const noteGain of this.pendingNotes) {
          noteGain.gain.cancelScheduledValues(now);
          noteGain.gain.setTargetAtTime(0, now, .01);
        }
        const gain = this.bus.gain;
        gain.cancelScheduledValues(now);
        gain.setValueAtTime(gain.value, now);
        gain.linearRampToValueAtTime(0, now + .04);
        gain.linearRampToValueAtTime(1, now + .16);
      }
      this._notify();
      return this.getState();
    }

    _fadeLayer(layer, target, seconds = .08) {
      if (!layer.voice || !this.context) return;
      const now = this.context.currentTime;
      layer.voice.gain.gain.setTargetAtTime(target, now, Math.max(.01, seconds / 3));
      layer.voice.lfoGain.gain.setTargetAtTime(target * (layer.id === 'night' || layer.id === 'nightmap' || layer.id === 'lightning' ? 0 : layer.id === 'aerosol' ? .02 : .18), now, Math.max(.01, seconds / 3));
    }

    _waiting(layer) {
      if (layer.status === 'failed') return;
      layer.status = 'waiting'; layer.ready = false; this._fadeLayer(layer, 0, .04); this._notify();
    }

    _fail(layer, message) {
      layer.status = 'failed'; layer.error = message; layer.ready = false; this._fadeLayer(layer, 0, .04);
      if (layer.source.type === 'video') layer.element.pause();
      this._notify();
    }

    _scheduleFrames(layer, serial) {
      const video = layer.element;
      if (!video.requestVideoFrameCallback) return;
      const callback = (now, metadata) => {
        if (serial !== this.serial || !this.playing || layer.status === 'failed') return;
        if (now - layer.lastSampleAt >= 1000 / layer.source.hz) this._sample(layer);
        layer.frameHandle = video.requestVideoFrameCallback(callback);
      };
      layer.frameHandle = video.requestVideoFrameCallback(callback);
    }

    _sample(layer, force = false) {
      if (layer.status === 'failed' || !layer.context2d) return;
      const source = layer.element;
      if (layer.source.type === 'video') {
        if (source.seeking || source.readyState < 2) return;
        if (layer.lastMediaTime !== null && (source.currentTime < layer.lastMediaTime - .05 || source.currentTime - layer.lastMediaTime > 1)) layer.previous = null;
        if (!force && source.currentTime === layer.lastMediaTime) return;
        layer.lastMediaTime = source.currentTime;
      } else if (!source.complete || !source.naturalWidth) return;
      const now = performance.now();
      if (!force && now - layer.lastSampleAt < 1000 / (layer.source.hz || 5)) return;
      try {
        layer.context2d.drawImage(source, 0, 0, 96, 54);
        const pixels = layer.context2d.getImageData(0, 0, 96, 54).data;
        layer.metrics = measure(pixels, 96, 54, layer.focus, layer.previous, ['night','nightmap','lightning'].includes(layer.id) ? .2 : .62);
        layer.previous = new Uint8ClampedArray(pixels);
        layer.sonic = soundValues(layer.id, layer.metrics);
        layer.lastSampleAt = now; layer.status = 'ready'; layer.error = null; layer.ready = true;
        if (this.playing && this.trackStart === null && this.context) this.trackStart = this.context.currentTime;
        if (this.playing) this._apply(layer);
        this._notify();
      } catch (error) { this._fail(layer, `Frame analysis failed: ${error.message || error}`); }
    }

    _apply(layer) {
      if (!this.playing || !layer.ready || !layer.sonic || !this.context || layer.visualOnly) return;
      const p = layer.sonic, v = layer.voice, now = this.context.currentTime;
      const track = this._track(), mode = track?.mode || 'flow';
      const root = 2 ** ((track?.root || 0) / 12);
      const pitch = p.pitch * root;
      const harmonicRatio = mode === 'air' ? 2.5 : mode === 'pulse' ? 2 : layer.id === 'co2' ? 1.75 : 1.5;
      // First frame sets the pitch before fading in; later frames glide smoothly.
      if (v.gain.gain.value < .001) {
        v.osc.frequency.setValueAtTime(pitch, now);
        v.harmonic.frequency.setValueAtTime(pitch * harmonicRatio, now);
      } else {
        v.osc.frequency.setTargetAtTime(pitch, now, .16);
        v.harmonic.frequency.setTargetAtTime(pitch * harmonicRatio, now, .16);
      }
      v.filter.frequency.setTargetAtTime(p.filter * (mode === 'air' ? 1.3 : mode === 'flow' ? .82 : 1), now, .18);
      v.lfo.frequency.setTargetAtTime(p.pulseHz * (mode === 'pulse' ? 1.55 : mode === 'air' ? .65 : .75), now, .2);
      if (layer.id === 'aerosol' && v.textureFilter) {
        v.textureFilter.frequency.setTargetAtTime(850 + 2100 * scale(layer.metrics.chroma, .07, .24), now, .2);
        v.textureFilter.Q.setTargetAtTime(.28 + .45 * scale(layer.metrics.warmth, 0, .12), now, .2);
      }
      const activity = layer.id === 'night' || layer.id === 'nightmap' || layer.id === 'lightning' ? .08 : layer.id === 'co2' ? .1 + .38 * p.activity : (layer.id === 'ocean' || layer.id === 'ocean2') ? .38 + .2 * p.activity : .25 + .25 * p.activity;
      const mix = track?.mix?.[layer.id] ?? 1;
      const mixTotal = this.layers.reduce((sum, item) => sum + item.weight * (track?.mix?.[item.id] ?? 1), 0);
      this._fadeLayer(layer, layer.weight * mix / Math.max(1, mixTotal) * activity, .12);
    }

    _tick() {
      if (!this.playing) return;
      const current = this._track();
      if (current && this.trackStart !== null && this._trackElapsed() >= current.duration) this.nextTrack();
      for (const layer of this.layers) {
        if (layer.source.type === 'video' && layer.element.readyState >= 2 && !layer.element.seeking && !layer.element.paused) this._sample(layer);
      }
      this._drums();
      if (performance.now() - this.lastClockNotify > 500) { this.lastClockNotify = performance.now(); this._notify(); }
    }

    _visualRhythm() {
      const track = this._track();
      // The shared groove reads the flat global maps only. GEDI pans its
      // camera and CO₂ orbits the planet; neither is a local rhythm sensor.
      const ready = this.layers.filter(layer => layer.ready && layer.metrics && !layer.visualOnly && layer.id !== 'gedi' && layer.id !== 'co2');
      if (!ready.length) return null;
      const totals = { brightness: 0, chroma: 0, change: 0, brightFraction: 0, warmth: 0, oceanMotion: 0, lightningLight: 0 };
      let weight = 0, oceanWeight = 0;
      for (const layer of ready) {
        const amount = layer.weight * (track?.mix?.[layer.id] ?? 1);
        weight += amount;
        for (const key of ['brightness', 'chroma', 'change', 'brightFraction', 'warmth']) totals[key] += (layer.metrics[key] || 0) * amount;
        if (layer.id === 'ocean' || layer.id === 'ocean2') { totals.oceanMotion += (layer.sonic?.motion || 0) * amount; oceanWeight += amount; }
        if (layer.id === 'lightning') totals.lightningLight += scale(layer.metrics.brightFraction, .002, .15) * amount;
      }
      for (const key of ['brightness', 'chroma', 'change', 'brightFraction', 'warmth']) totals[key] /= weight;
      totals.oceanMotion = oceanWeight ? totals.oceanMotion / oceanWeight : 0;
      totals.lightningLight /= weight;
      return totals;
    }

    _drumKick(at, image, accent) {
      const osc = this.context.createOscillator(), envelope = this.context.createGain();
      this.lastKickAt = at;
      this.lastKickStrength = accent;
      const base = (54 + 42 * scale(image.brightness, .04, .48)) * (this.station?.rhythm?.kickPitch || 1);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(base * 1.65, at);
      osc.frequency.exponentialRampToValueAtTime(base * .72, at + .16);
      envelope.gain.setValueAtTime(0, at);
      envelope.gain.linearRampToValueAtTime(.22 * accent, at + .008);
      envelope.gain.exponentialRampToValueAtTime(.001, at + .25);
      osc.connect(envelope).connect(this.bus);
      this.pendingNotes.add(envelope);
      osc.onended = () => { this.pendingNotes.delete(envelope); osc.disconnect(); envelope.disconnect(); };
      osc.start(at); osc.stop(at + .27);
    }

    _drumNoise(at, image, type, accent) {
      const source = this.context.createBufferSource(), filter = this.context.createBiquadFilter(), envelope = this.context.createGain();
      const hat = type === 'hat';
      source.buffer = this.percussionNoise;
      filter.type = 'highpass';
      filter.frequency.setValueAtTime((hat ? 4200 + 2900 * scale(image.chroma, .02, .4) : 950 + 850 * scale(image.warmth, 0, .24)) * (this.station?.rhythm?.hatTone || 1), at);
      const duration = hat ? .065 : .16;
      envelope.gain.setValueAtTime(0, at);
      envelope.gain.linearRampToValueAtTime((hat ? .034 : .085 * (this.station?.rhythm?.snareLevel || 1)) * accent, at + .005);
      envelope.gain.exponentialRampToValueAtTime(.001, at + duration);
      source.connect(filter).connect(envelope).connect(this.bus);
      this.pendingNotes.add(envelope);
      source.onended = () => { this.pendingNotes.delete(envelope); source.disconnect(); filter.disconnect(); envelope.disconnect(); };
      source.start(at); source.stop(at + duration + .01);
    }

    _drums() {
      if (!this.playing || !this.context || !this.percussionNoise || this.volume <= 0) return;
      const track = this._track(), image = this._visualRhythm();
      if (!track || !image || this.trackStart === null) { this.nextBeatTime = 0; return; }
      const now = this.context.currentTime, stepSeconds = 30 / track.tempo;
      const density = this.station?.rhythm?.density ?? .7;
      if (!this.nextBeatTime || this.nextBeatTime < now - stepSeconds) {
        this.nextBeatTime = now + .035;
        this.beatStep = Math.floor(this._trackElapsed() / stepSeconds) % 8;
      }
      // The track tempo stays steady; current image properties shape accents,
      // extra hits, and the synthesized drum timbre at each scheduled beat.
      for (let scheduled = 0; this.nextBeatTime < now + .11 && scheduled < 3; scheduled++) {
        const step = this.beatStep % 8, mode = track.mode;
        // Only the flat-map ocean animation drives motion accents. GEDI camera
        // motion and the orbiting CO₂ camera are not treated as local activity.
        const activity = image.oceanMotion;
        const lights = scale(image.brightFraction, .01, .4);
        const color = scale(image.chroma, .03, .36);
        const accent = .65 + .35 * scale(image.brightness, .04, .42);
        const kick = step === 0 || (mode === 'pulse' && step === 4) || (mode === 'flow' && step === 6 && activity > .6);
        const snare = (mode === 'pulse' && (step === 2 || step === 6)) || (mode !== 'pulse' && step === 4);
        const hat = mode === 'pulse' ? ((step % 2 === 0 && (density > .6 || step === 2 || step === 6)) || (color > .35 && density > .84)) : mode === 'air' ? (step === 7 || (step === 3 && density > .5) || (step === 5 && density > .8 && lights > .45)) : (step === 6 || (step === 2 && density > .5) || (step === 3 && density > .75 && activity > .55));
        if (kick) this._drumKick(this.nextBeatTime, image, accent * (step === 0 ? 1 : .7));
        if (snare) this._drumNoise(this.nextBeatTime, image, 'snare', (mode === 'air' ? .48 : .72) + .22 * activity);
        if (hat) this._drumNoise(this.nextBeatTime, image, 'hat', .55 + .25 * color + .2 * lights);
        // Historical 10-day lightning-window brightness shapes a modest,
        // quantized tick; it is not a replay of individual strike times.
        if (image.lightningLight > .16 && (step === 3 || step === 7)) this._drumNoise(this.nextBeatTime, image, 'hat', .14 + .2 * image.lightningLight);
        // Melodic motifs and transient visual accents share this same Web
        // Audio beat clock instead of drifting on the 50 ms UI tick.
        this._motif(this.nextBeatTime);
        for (const layer of this.layers) {
          if ((layer.id === 'night' || layer.id === 'nightmap') && layer.ready && layer.metrics) this._glint(layer,this.nextBeatTime);
          if (layer.id === 'gedi' && layer.ready && layer.metrics) this._wood(layer,this.nextBeatTime);
        }
        this.nextBeatTime += stepSeconds;
        this.beatStep++;
      }
    }

    _glint(layer,at=this.context?.currentTime||0) {
      if (!this.playing || !layer.ready || !this.context || !layer.sonic || this.volume <= 0) return;
      const now = at;
      if (now < layer.nextNote) return;
      const track = this._track(), mode = track?.mode || 'flow';
      layer.nextNote = now + 1 / (layer.sonic.pulseHz * (mode === 'pulse' ? 1.4 : mode === 'flow' ? .65 : .9));
      if (layer.metrics.brightFraction < .015) return;
      const osc = this.context.createOscillator(), shimmer = this.context.createOscillator();
      const shimmerGain = this.context.createGain(), envelope = this.context.createGain();
      osc.type = 'sine'; osc.frequency.value = layer.sonic.pitch * 2 ** ((track?.root || 0) / 12);
      shimmer.type = 'sine'; shimmer.frequency.value = osc.frequency.value * 2.73;
      shimmerGain.gain.value = .21;
      envelope.gain.setValueAtTime(0, now);
      envelope.gain.linearRampToValueAtTime(layer.weight * (mode === 'pulse' ? .36 : .20), now + .012);
      envelope.gain.exponentialRampToValueAtTime(.001, now + .43);
      osc.connect(envelope).connect(this.bus);
      shimmer.connect(shimmerGain).connect(envelope);
      this.pendingNotes.add(envelope);
      osc.onended = () => { this.pendingNotes.delete(envelope); osc.disconnect(); shimmer.disconnect(); shimmerGain.disconnect(); envelope.disconnect(); };
      osc.start(now); shimmer.start(now); osc.stop(now + .44); shimmer.stop(now + .44);
    }

    _wood(layer,at=this.context?.currentTime||0) {
      if (!this.playing || !this.context || this.volume <= 0 || !layer.sonic) return;
      const now = at;
      if (now < layer.nextPluck) return;
      // This is visual change in a moving-camera render, not forest activity.
      const motion = scale(layer.metrics.change, .002, .02);
      if (motion < .14) return;
      layer.nextPluck = now + .42 + .55 * (1 - motion);
      const track = this._track();
      const osc = this.context.createOscillator(), filter = this.context.createBiquadFilter(), envelope = this.context.createGain();
      osc.type = 'triangle'; osc.frequency.value = layer.sonic.pitch * 2 ** ((track?.root || 0) / 12);
      filter.type = 'lowpass'; filter.frequency.value = Math.min(2100, layer.sonic.filter * 1.1);
      envelope.gain.setValueAtTime(0, now);
      envelope.gain.linearRampToValueAtTime(layer.weight * (.10 + .17 * motion), now + .006);
      envelope.gain.exponentialRampToValueAtTime(.001, now + .19);
      osc.connect(filter).connect(envelope).connect(this.bus);
      this.pendingNotes.add(envelope);
      osc.onended = () => { this.pendingNotes.delete(envelope); osc.disconnect(); filter.disconnect(); envelope.disconnect(); };
      osc.start(now); osc.stop(now + .2);
    }

    _motif(at=this.context?.currentTime||0) {
      if (!this.playing || !this.context || this.volume <= 0) return;
      const track = this._track(); if (!track) return;
      const now = at;
      if (now < this.nextMotif) return;
      const beat = 60 / track.tempo;
      this.nextMotif = now + beat * (track.mode === 'pulse' ? .5 : track.mode === 'air' ? 1.5 : 3);
      const ready = this.layers.filter(layer => layer.ready && layer.sonic && layer.status === 'ready');
      if (!ready.length) return;
      ready.sort((a,b)=>(track.mix?.[b.id] || 1)*b.weight-(track.mix?.[a.id] || 1)*a.weight);
      const layer = ready[this.motifStep % Math.min(ready.length, track.mode === 'flow' ? 1 : 2)];
      const fallback = track.mode === 'pulse' ? [0,5,7,3,0,10,7,5] : track.mode === 'air' ? [7,3,10,5] : [0,5,3];
      // A station may supply its own short signature. Invalid offsets fall
      // back to the established track-mode pattern rather than creating an
      // out-of-key or dangerously high oscillator frequency.
      const custom = track.motif;
      const valid = Array.isArray(custom) && custom.length > 0 && custom.length <= 16 && custom.every(offset =>
        Number.isInteger(offset) && offset >= -12 && offset <= 24 && PENTATONIC_CLASSES.has(((offset % 12) + 12) % 12));
      const steps = valid ? custom : fallback;
      const interval = steps[this.motifStep % steps.length]; this.motifStep++;
      const level = .25 + .75 * (layer.sonic.activity || 0);
      const duration = track.mode === 'pulse' ? .2 : track.mode === 'air' ? .55 : .4;
      const osc = this.context.createOscillator(), envelope = this.context.createGain();
      osc.type = track.mode === 'pulse' ? 'triangle' : 'sine';
      osc.frequency.value = layer.sonic.pitch * 2 ** ((track.root + interval) / 12);
      envelope.gain.setValueAtTime(0, now);
      envelope.gain.linearRampToValueAtTime(Math.min(.36, layer.weight * (track.mix?.[layer.id] || 1) * .55 * level), now + .015);
      envelope.gain.exponentialRampToValueAtTime(.001, now + duration);
      osc.connect(envelope).connect(this.bus);
      this.pendingNotes.add(envelope);
      osc.onended = () => { this.pendingNotes.delete(envelope); osc.disconnect(); envelope.disconnect(); };
      osc.start(now); osc.stop(now + duration + .02);
    }

    play(station, initialTrackIndex = 0) {
      // This function intentionally invokes resume() and every video.play()
      // synchronously before its first awaited promise, preserving user activation.
      if (!station || !station.id || !Array.isArray(station.layers) || station.layers.length === 0) return Promise.reject(new Error('A station with layers is required.'));
      try { this._ensureGraph(); } catch (error) { return Promise.reject(error); }
      clearTimeout(this.sleepTimer); this.sleepTimer = null;
      if (!this.station || this.station.id !== station.id) { this.stop(); this._setup(station, initialTrackIndex); }
      const serial = ++this.serial;
      const audioResume = this.context.resume();
      const resumes = [audioResume];
      this.playing = true;
      this.trackStart = this.layers.some(layer => layer.ready) ? this.context.currentTime : null;
      this.nextBeatTime = 0;
      this.bus.gain.setTargetAtTime(1, this.context.currentTime, .035);
      this.master.gain.setTargetAtTime(outputGain(this.volume) * (this.hostDuck ? .25 : 1), this.context.currentTime, .06);
      for (const layer of this.layers) {
        if (layer.source.type === 'video') {
          if (layer.visualOnly && layer.id !== this.visualFocusId) continue;
          // Capture each invocation during the same click gesture as AudioContext.resume.
          try { resumes.push(layer.element.play().catch(error => { if (serial === this.serial) this._fail(layer, `Playback unavailable: ${error.message || error}`); })); }
          catch (error) { this._fail(layer, `Playback unavailable: ${error.message || error}`); }
          this._scheduleFrames(layer, serial);
        } else if (layer.element.complete && layer.element.naturalWidth) this._sample(layer, true);
        if (layer.ready) this._apply(layer);
      }
      clearInterval(this.timer); this.timer = setInterval(() => this._tick(), 50);
      this._notify();
      return Promise.allSettled(resumes).then(async () => {
        try { await audioResume; }
        catch (error) {
          if (serial === this.serial) this.pause();
          throw new Error(`Audio playback unavailable: ${error.message || error}`);
        }
        if (serial === this.serial) this._notify();
        return this.getState();
      });
    }

    pause() {
      if (!this.station) return this.getState();
      this.trackElapsedAccum = this._trackElapsed(); this.trackStart = null;
      this.nextBeatTime = 0;
      this.nextMotif = 0;
      for (const layer of this.layers) { layer.nextNote = 0; layer.nextPluck = 0; }
      this.lastKickAt = -1;
      this.playing = false; ++this.serial;
      clearInterval(this.timer); this.timer = null;
      if (this.bus && this.context) this.bus.gain.setTargetAtTime(0, this.context.currentTime, .025);
      for (const layer of this.layers) {
        if (layer.source.type === 'video') {
          layer.element.pause();
          if (layer.frameHandle !== null && layer.element.cancelVideoFrameCallback) layer.element.cancelVideoFrameCallback(layer.frameHandle);
          layer.frameHandle = null;
        }
        this._fadeLayer(layer, 0, .05);
      }
      for (const noteGain of this.pendingNotes) {
        noteGain.gain.cancelScheduledValues(this.context.currentTime);
        noteGain.gain.setTargetAtTime(0, this.context.currentTime, .01);
      }
      const serial = this.serial;
      clearTimeout(this.sleepTimer);
      this.sleepTimer = setTimeout(() => { if (serial === this.serial && !this.playing) this.context?.suspend().catch(() => {}); }, 130);
      this._notify(); return this.getState();
    }

    stop() {
      this.pause(); ++this.serial;
      const oldBus = this.bus, oldLayers = this.layers, ctx = this.context;
      if (oldBus && ctx) {
        oldBus.gain.setTargetAtTime(0, ctx.currentTime, .02);
        setTimeout(() => { try { oldBus.disconnect(); } catch (_) {} }, 120);
      }
      if (this.master && ctx) this.master.gain.setTargetAtTime(0, ctx.currentTime, .025);
      for (const layer of oldLayers) {
        layer.element.onerror = null;
        layer.element.onload = null;
        layer.element.onwaiting = null;
        layer.element.onstalled = null;
        layer.element.onseeking = null;
        layer.element.onseeked = null;
        layer.element.onplaying = null;
        layer.element.onloadeddata = null;
        if (layer.source.type === 'video') { layer.element.pause(); layer.element.removeAttribute('src'); layer.element.load(); }
        const voice = layer.voice;
        if (voice && ctx) {
          for (const oscillator of [voice.osc, voice.harmonic, voice.lfo, voice.textureSource]) if (oscillator) try { oscillator.stop(ctx.currentTime + .12); } catch (_) {}
          setTimeout(() => { for (const node of Object.values(voice)) if (node) try { node.disconnect(); } catch (_) {} }, 180);
        }
      }
      this.layers = []; this.station = null; this.bus = null;
      this.trackIndex = 0; this.trackElapsedAccum = 0; this.trackStart = null; this.nextMotif = 0; this.motifStep = 0; this.nextBeatTime = 0; this.beatStep = 0; this.lastKickAt = -1;
      clearTimeout(this.sleepTimer);
      const serial = this.serial;
      this.sleepTimer = setTimeout(() => { if (serial === this.serial && !this.playing) ctx?.suspend().catch(() => {}); }, 150);
      this._notify(); return this.getState();
    }

    setVolume(value) {
      this.volume = clamp(Number(value));
      if (this.master && this.context) this.master.gain.setTargetAtTime(this.playing ? outputGain(this.volume) * (this.hostDuck ? .25 : 1) : 0, this.context.currentTime, .06);
      this._notify(); return this.getState();
    }

    setHostDuck(active) {
      this.hostDuck = Boolean(active);
      if (this.master && this.context) this.master.gain.setTargetAtTime(this.playing ? outputGain(this.volume) * (this.hostDuck ? .25 : 1) : 0, this.context.currentTime, .12);
    }

    setVisualFocus(sourceId) {
      if (this.visualFocusId === sourceId) return;
      this.visualFocusId = sourceId;
      for (const layer of this.layers) {
        if (!layer.visualOnly || layer.source.type !== 'video') continue;
        if (layer.id !== sourceId) {
          layer.element.pause();
          if (layer.frameHandle !== null && layer.element.cancelVideoFrameCallback) layer.element.cancelVideoFrameCallback(layer.frameHandle);
          layer.frameHandle = null;
        } else if (this.playing) {
          try { layer.element.play().catch(error => this._fail(layer, `Playback unavailable: ${error.message || error}`)); }
          catch (error) { this._fail(layer, `Playback unavailable: ${error.message || error}`); }
          this._scheduleFrames(layer, this.serial);
        }
      }
      this._notify();
    }

    setFocus(sourceId, x, y) {
      const layer = this.layers.find(item => item.id === sourceId);
      if (!layer) return false;
      layer.focus = { x: clamp(Number(x)), y: clamp(Number(y)) };
      layer.previous = null; this._sample(layer, true); this._notify(); return true;
    }

    seek(sourceId, normalizedPosition) {
      const layer = this.layers.find(item => item.id === sourceId && item.source.type === 'video');
      if (!layer || !Number.isFinite(layer.element.duration)) return false;
      layer.previous = null; layer.ready = false; this._fadeLayer(layer, 0, .04);
      layer.element.currentTime = clamp(Number(normalizedPosition)) * layer.element.duration;
      this._notify(); return true;
    }

    getMedia(sourceId) { return this.layers.find(layer => layer.id === sourceId)?.element || null; }

    getBeatPulse() {
      if(!this.playing||this.volume<=0||!this.context||this.lastKickAt<0)return 0;
      const elapsed=this.context.currentTime-this.lastKickAt;
      return elapsed>=0&&elapsed<.45?clamp(this.lastKickStrength*Math.exp(-elapsed*8)):0;
    }

    getState() {
      const track = this._track();
      return {
        stationId: this.station?.id || null, playing: this.playing, volume: this.volume,
        contextState: this.context?.state || 'uninitialized',
        track: track ? { id:track.id, title:track.title, description:track.description, mode:track.mode, duration:track.duration } : null,
        trackIndex:this.trackIndex, trackCount:this.station?.tracks?.length || 0,
        trackElapsed:track ? Math.min(track.duration,this._trackElapsed()) : 0,
        layers: this.layers.map(layer => ({ id: layer.id, role: layer.role, weight: layer.weight, status: layer.status, error: layer.error,
          focus: { ...layer.focus }, metrics: layer.metrics && { ...layer.metrics }, sonic: layer.sonic && { ...layer.sonic },
          source: layer.source, element: layer.element, visualOnly: layer.visualOnly, currentTime: layer.source.type === 'video' ? layer.element.currentTime : null,
          duration: layer.source.type === 'video' ? layer.element.duration || 0 : null }))
      };
    }
  }

  window.EarthAudio = EarthAudio;
})();
