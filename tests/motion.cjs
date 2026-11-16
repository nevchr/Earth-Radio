const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const root=path.join(__dirname,'..'),window={};
vm.runInNewContext(fs.readFileSync(path.join(root,'audio.js'),'utf8'),{window,navigator:{},console});
const {measure,soundValues}=window.EarthImageSound;
const regions={ocean:[[.161,.289],[.303,.350],[.494,.294],[.542,.291],[.45,.394],[.747,.417],[.800,.556],[.389,.667],[.069,.389]],ocean2:[[.294,.306],[.889,.306],[.578,.689]]};
const report={};
for(const [id,foci] of Object.entries(regions))for(const suffix of ['','-hd']){
  const file=id+suffix+'.mp4';
  const bytes=execFileSync('ffmpeg',['-v','error','-i',path.join(root,'assets',file),'-t','8','-vf','fps=5,scale=96:54:flags=bilinear','-pix_fmt','rgba','-f','rawvideo','-'],{maxBuffer:16*1024*1024});
  const size=96*54*4,rows=[];
  for(const [x,y] of foci){let previous=null,values=[];
    for(let offset=0;offset+size<=bytes.length;offset+=size){const data=bytes.subarray(offset,offset+size),m=measure(data,96,54,{x,y},previous,.62);if(previous)values.push(soundValues(id,m).motion);previous=data;}
    const min=Math.min(...values),max=Math.max(...values);
    assert(max-min>.02,`${file} at ${x}/${y} must retain a changing motion response`);
    assert(max<1,`${file} must not hit a hard motion ceiling`);
    rows.push({focus:[x,y],min:+min.toFixed(3),max:+max.toFixed(3)});
  }
  report[file]=rows;
}
console.log(JSON.stringify(report,null,2));
