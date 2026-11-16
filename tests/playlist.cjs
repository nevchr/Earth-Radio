const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

class Parameter {
  constructor(value = 0) { this.value = value; this.events = []; }
  setValueAtTime(value) { this.value = value; this.events.push(value); }
  setTargetAtTime(value) { this.value = value; this.events.push(value); }
  linearRampToValueAtTime(value) { this.value = value; this.events.push(value); }
  exponentialRampToValueAtTime(value) { this.value = value; this.events.push(value); }
  cancelScheduledValues() {}
}
class Node {
  connect(next) { return next; }
  disconnect() {}
}
class Oscillator extends Node {
  constructor() { super(); this.frequency = new Parameter(); }
  start(at) { this.startedAt = at; }
  stop() { this.onended?.(); }
}
class FakeAudioContext {
  constructor() { this.currentTime = 0; this.state = 'suspended'; this.destination = new Node(); this.sampleRate = 48000; this.oscillators = []; this.bufferSources = []; }
  createGain() { const node = new Node(); node.gain = new Parameter(); return node; }
  createOscillator() { const node = new Oscillator(); this.oscillators.push(node); return node; }
  createBufferSource() { const node = new Oscillator(); this.bufferSources.push(node); return node; }
  createBuffer(channels, frames) { return { getChannelData: () => new Float32Array(frames) }; }
  createBiquadFilter() { const node = new Node(); node.frequency = new Parameter(); node.Q = new Parameter(); return node; }
  createDynamicsCompressor() { const node = new Node(); for (const key of ['threshold','knee','ratio','attack','release']) node[key] = new Parameter(); return node; }
  resume() { this.state = 'running'; return Promise.resolve(); }
  suspend() { this.state = 'suspended'; return Promise.resolve(); }
}
class Media {
  constructor(tagName) { this.tagName = tagName; this.readyState = 2; this.currentTime = 0; this.duration = 8; this.paused = true; this.complete = true; this.naturalWidth = 96; }
  setAttribute() {}
  removeAttribute() {}
  load() {}
  play() { this.paused = false; this.onplaying?.(); return Promise.resolve(); }
  pause() { this.paused = true; }
}
let now = 0;
let frame = new Uint8ClampedArray(96 * 54 * 4).fill(92);
const document = {
  hidden: false,
  addEventListener() {},
  createElement(tag) {
    if (tag !== 'canvas') return new Media(tag.toUpperCase());
    return { getContext: () => ({ drawImage() {}, getImageData: () => ({ data: frame }) }) };
  }
};
const window = { AudioContext: FakeAudioContext };
vm.runInNewContext(fs.readFileSync(require.resolve('../audio.js'), 'utf8'), {
  window, document, performance: { now: () => now }, Uint8ClampedArray,
  setInterval: () => 1, clearInterval() {}, setTimeout: () => 1, clearTimeout() {}, console
});

const station = {
  id: 'test-coast',
  layers: [
    { id: 'ocean', focus: { x: .3, y: .4 }, weight: .6 },
    { id: 'aerosol', focus: { x: .3, y: .4 }, weight: .4 }
  ],
  tracks: [
    { id: 'flow', title: 'Flow', mode: 'flow', duration: 4, tempo: 58, root: 0, mix: { ocean: 1.5, aerosol: .5 } },
    { id: 'pulse', title: 'Pulse', mode: 'pulse', duration: 4, tempo: 88, root: 5, mix: { ocean: .8, aerosol: 1.2 } },
    { id: 'air', title: 'Air', mode: 'air', duration: 4, tempo: 70, root: 7, mix: { ocean: .6, aerosol: 1.5 } }
  ],
  rhythm: { kickPitch: .9, hatTone: 1.1, density: .8, snareLevel: .7 }
};

(async () => {
  const audio = new window.EarthAudio();
  await audio.play(station, 1);
  assert.equal(audio.getState().track.title, 'Pulse');
  assert.equal(audio.getState().playing, true);
  assert.equal(audio.getState().layers.filter(layer => layer.status === 'ready').length, 2);
  const sliderPositions = [0, .1, .25, .5, .75, 1];
  const gains = sliderPositions.map(position => { audio.setVolume(position); return audio.master.gain.value; });
  assert.equal(gains[0], 0, 'zero volume is silent');
  for (let i = 1; i < gains.length; i++) assert(gains[i] > gains[i - 1], 'every slider step increases gain');
  assert(gains[2] >= .035 && gains[2] <= .05, 'default vicinity starts conservatively');
  assert(gains.at(-1) <= .11, 'full slider respects the master ceiling');
  assert(gains[4] > gains[3], 'slider does not saturate at 50%');
  assert(audio.compressor.ratio.value >= 10 && audio.compressor.attack.value <= .005, 'fast compressor protects peaks');
  audio.setVolume(.25);
  const unduckedGain = audio.master.gain.value;
  audio.setHostDuck(true);
  assert(audio.master.gain.value < unduckedGain * .3, 'host narration ducks the music');
  audio.setVolume(.4);
  assert(audio.master.gain.value < unduckedGain, 'volume changes preserve ducking during narration');
  audio.setHostDuck(false);
  assert(audio.master.gain.value > unduckedGain, 'music smoothly returns after the host');
  audio.setVolume(.25);
  const pulseTrack = station.tracks[1];
  const playMotifStart = motif => {
    pulseTrack.motif = motif;
    audio.nextMotif = 0; audio.motifStep = 0;
    audio._motif();
    return audio.context.oscillators.at(-1).frequency.value;
  };
  const rootNote = playMotifStart([0, 3, 7]);
  const highNote = playMotifStart([10, 7, 3]);
  assert(Math.abs(highNote / rootNote - 2 ** (10 / 12)) < .0001, 'station motif changes the scheduled note by its semitone offset');
  assert.equal(playMotifStart([2, 7]), rootNote, 'an out-of-scale motif safely falls back to the existing pulse pattern');
  pulseTrack.motif = [0, 3, 7];
  const oceanMedia = audio.getMedia('ocean');
  const pulsePitch = audio.layers[0].voice.osc.frequency.value;
  assert.equal(audio.layers[0].voice.osc.type, 'triangle', 'ocean uses a warm, flowing triangle voice');
  assert(audio.layers[1].voice.textureSource?.loop, 'aerosol still has a synthetic, filtered air texture');
  const slowPulse = audio.layers[0].sonic.pulseHz;
  frame = new Uint8ClampedArray(96 * 54 * 4).fill(93);
  audio._sample(audio.layers[0], true);
  assert(audio.layers[0].sonic.pulseHz > slowPulse + .4, 'measured 5 Hz ocean frame change substantially changes pulse');
  assert(audio._visualRhythm().oceanMotion > .3, 'ocean visual motion reaches the rhythm driver');
  const baseOscillators = audio.context.oscillators.length;
  const baseNoiseSources = audio.context.bufferSources.length;
  audio.nextMotif = 0;
  audio._tick();
  assert(audio.context.oscillators.length > baseOscillators, 'ready NASA pixels schedule a synthesized low drum');
  const scheduled = audio.context.oscillators.slice(baseOscillators).map(oscillator => oscillator.startedAt);
  assert(scheduled.filter(at => at === scheduled[0]).length >= 2, 'station motif and low drum start on the same Web Audio beat');
  assert(audio.context.bufferSources.length > baseNoiseSources, 'beat grid schedules synthesized high percussion');
  audio.context.currentTime = .04;
  assert(audio.getBeatPulse() > 0, 'globe cue follows the scheduled synthesized kick');
  const percussionCount = audio.context.bufferSources.length;
  audio.setVolume(0);
  assert.equal(audio.getBeatPulse(), 0, 'globe cue stops when muted');
  audio.context.currentTime = .5; audio._tick();
  assert.equal(audio.context.bufferSources.length, percussionCount, 'zero volume schedules no percussion');
  audio.setVolume(.25);
  function countNoiseHits(density) {
    audio.station.rhythm.density = density;
    audio.nextBeatTime = 0;
    const before = audio.context.bufferSources.length;
    for (let step = 0; step < 8; step++) {
      audio.context.currentTime = step * 30 / 88;
      audio._drums();
    }
    return audio.context.bufferSources.length - before;
  }
  assert(countNoiseHits(.95) > countNoiseHits(.36), 'station profile changes percussion density');
  audio.context.currentTime = 0;

  now = 5000; audio.context.currentTime = 5; audio._tick();
  assert.equal(audio.getState().track.title, 'Air', 'elapsed track automatically advances');
  assert.equal(audio.getState().trackElapsed, 0);
  assert(audio.bus.gain.events.includes(0) && audio.bus.gain.events.includes(1), 'transition fades out and in');
  assert.notEqual(audio.layers[0].voice.osc.frequency.value, pulsePitch, 'track changes the audible pitch');

  audio.previousTrack();
  assert.equal(audio.getState().track.title, 'Pulse');
  assert.equal(audio.motifStep, 0, 'track transition resets the station motif to its first note');
  audio.context.currentTime = 6; audio.pause();
  const heldTime = audio.getState().trackElapsed;
  audio.context.currentTime = 20;
  assert.equal(audio.getState().trackElapsed, heldTime, 'pause freezes track progress');
  await audio.play(station);
  assert.equal(audio.getState().track.title, 'Pulse', 'resume preserves the selected track');
  audio.context.currentTime = 21;
  assert(Math.abs(audio.getState().trackElapsed - heldTime - 1) < .001, 'resume continues the track clock');

  audio.nextTrack(); audio.nextTrack(); audio.previousTrack();
  assert.equal(audio.getState().track.title, 'Air', 'rapid navigation wraps predictably');
  assert.equal(audio.getMedia('ocean'), oceanMedia, 'track changes keep the media session');
  audio.stop();
  assert.equal(audio.getState().playing, false);
  assert.equal(audio.getState().stationId, null);
  const newerOcean = { ...station, id: 'newer-ocean-test', layers: [{ id: 'ocean2', focus: { x: .3, y: .4 }, weight: 1 }] };
  await audio.play(newerOcean);
  const newerLayer = audio.layers[0];
  assert.equal(newerLayer.source.url, './assets/ocean2.mp4', 'new equirectangular NASA source is loaded');
  assert.equal(newerLayer.voice.osc.type, 'triangle', 'new ocean source uses the flowing voice');
  const oldMotion = newerLayer.sonic.motion;
  frame = new Uint8ClampedArray(96 * 54 * 4).fill(134);
  audio._sample(newerLayer, true);
  assert(newerLayer.sonic.motion > oldMotion, 'new ocean source maps actual frame changes');
  assert(audio._visualRhythm().oceanMotion > 0, 'new ocean source contributes to shared percussion accents');
  audio.stop();
  const forest = { ...station, id: 'forest-test', layers: [
    { id: 'ocean', focus: { x: .3, y: .4 }, weight: .35 },
    { id: 'gedi', focus: { x: .46, y: .43 }, weight: .25 },
    { id: 'night', focus: { x: .1, y: .3 }, weight: .15 },
    { id: 'aerosol', focus: { x: .3, y: .4 }, weight: .15 },
    { id: 'co2', focus: { x: .45, y: .25 }, weight: .1 }
  ] };
  await audio.play(forest);
  assert.notEqual(audio.layers.find(layer => layer.id === 'co2').voice.osc.type, audio.layers.find(layer => layer.id === 'gedi').voice.osc.type,
    'moving global CO₂ and regional forest imagery use distinct base timbres');
  const forestLayer = audio.layers.find(layer => layer.id === 'gedi');
  const globalLayer = audio.layers.find(layer => layer.id === 'co2');
  const globalPulse = globalLayer.sonic.pulseHz;
  frame = new Uint8ClampedArray(96 * 54 * 4).fill(95);
  audio._sample(forestLayer, true); audio._sample(globalLayer, true);
  const beforePluck = audio.context.oscillators.length;
  audio._wood(forestLayer);
  assert(audio.context.oscillators.length > beforePluck, 'moving GEDI imagery can trigger a restrained woody accent');
  assert.equal(globalLayer.sonic.pulseHz, globalPulse, 'CO₂ camera motion alone does not drive bass pulse');
  const activeBus = audio.bus;
  audio.pause();
  assert(activeBus.gain.events.includes(0), 'pause fades the active composition bus');
  audio.stop();
  assert.equal(audio.getState().playing, false, 'rapid pause and stop leave the engine silent');
  const expanded = { ...station, id: 'expanded-visuals', layers: [
    { id: 'nightmap', focus: { x: .3, y: .4 }, weight: .3 },
    { id: 'lightning', focus: { x: .3, y: .4 }, weight: .2 },
    { id: 'pm25', focus: { x: .3, y: .4 }, weight: .2 },
    { id: 'river', focus: { x: .5, y: .5 }, weight: 0, visualOnly: true }
  ] };
  await audio.play(expanded);
  assert.equal(audio.getState().layers.filter(layer => layer.status === 'ready').length, 3, 'three new sound maps load while the context film waits');
  assert.equal(audio.layers.find(layer => layer.id === 'river').voice, null, 'moving-camera context film has no sound voice');
  assert.equal(audio.layers.find(layer => layer.id === 'river').visualOnly, true);
  assert.equal(audio.layers.find(layer => layer.id === 'river').element.paused, true, 'unfocused context film is not decoding in the background');
  audio.setVisualFocus('river');
  assert.equal(audio.layers.find(layer => layer.id === 'river').element.paused, false, 'focused context film plays');
  assert.equal(audio.getState().layers.filter(layer => layer.status === 'ready').length, 4, 'focused context view loads');
  audio.setVisualFocus('nightmap');
  assert.equal(audio.layers.find(layer => layer.id === 'river').element.paused, true, 'context film pauses when another source is selected');
  assert(audio.layers.find(layer => layer.id === 'nightmap').voice, 'flat annual night map drives a voice');
  assert(audio.layers.find(layer => layer.id === 'pm25').voice, 'flat modeled PM2.5 view drives a voice');
  assert(audio.layers.find(layer => layer.id === 'lightning').voice, 'historical lightning map drives a voice');
  assert(Number.isFinite(audio._visualRhythm().lightningLight), 'lightning brightness reaches the artistic beat grid');
  audio.stop();
  await audio.play(station, 0);
  const visualTimeBeforeSongSeek = audio.getMedia('ocean').currentTime;
  audio.seekTrack(2.5);
  assert(Math.abs(audio.getState().trackElapsed - 2.5) < .001, 'song seek moves the composition clock while playing');
  assert.equal(audio.getMedia('ocean').currentTime, visualTimeBeforeSongSeek, 'song seek does not rewrite the independent NASA visual timeline');
  assert.equal(audio.nextBeatTime, 0, 'song seek resets the beat scheduler');
  audio.context.currentTime += .4;
  assert(Math.abs(audio.getState().trackElapsed - 2.9) < .001, 'song clock continues from the sought position');
  audio.pause();
  audio.seekTrack(1.25);
  assert(Math.abs(audio.getState().trackElapsed - 1.25) < .001, 'song seek also works while paused');
  await audio.play(station);
  assert(Math.abs(audio.getState().trackElapsed - 1.25) < .001, 'resume retains the sought position');
  audio.stop();
  console.log('Playlist/audio: station motifs, rotation, seek, safe volume, new NASA sound and context sources, measured frame response, camera caveat, mute, pause/resume, and cleanup passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
