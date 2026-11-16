// Verify attribution and the encoded audio packets recorded after lossless tag editing.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'media-provenance.json'), 'utf8'));
assert.equal(manifest.host_clips.length, 12);
for (const clip of manifest.host_clips) {
  const file=path.join(root,clip.file);
  const tags=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format_tags','-of','json',file],{encoding:'utf8'})).format.tags;
  assert.match(tags.title,/Earth Radio/);
  assert.match(tags.artist,/ElevenLabs.*AI-generated/i);
  assert.match(tags.comment,/AI-generated ElevenLabs narration/i);
  assert(tags.comment.includes(clip.voice));
  assert.match(tags.comment,/Not NASA audio/);
  const hash=execFileSync('ffmpeg',['-v','error','-i',file,'-map','0:a:0','-c','copy','-f','hash','-hash','sha256','-'],{encoding:'utf8'}).trim().replace('SHA256=','');
  assert.equal(hash,clip.encoded_audio_sha256,`${clip.file} encoded audio packets changed`);
}
console.log('Verified ElevenLabs attribution tags and unchanged encoded-audio hashes for all 12 host clips.');
