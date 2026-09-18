import { uid, clamp } from './utils.js';
const fresh=()=>({version:1,name:'Untitled movie',clips:[],audio:null,videoVolume:1,videoMuted:false,musicVolume:.8,musicMuted:false,settings:{resolution:'original',quality:'normal'}});
const copy=s=>structuredClone(s);
export class ProjectStore extends EventTarget{
  constructor(){super();this.state=fresh();this.undoStack=[];this.redoStack=[];}
  get duration(){return this.state.clips.reduce((n,c)=>n+c.out-c.in,0)}
  notify(){this.dispatchEvent(new Event('change'))}
  commit(mutator){this.undoStack.push(copy(this.state));if(this.undoStack.length>80)this.undoStack.shift();this.redoStack=[];mutator(this.state);this.notify()}
  replace(state,history=true){if(history)this.undoStack.push(copy(this.state));this.state=copy(state);this.redoStack=[];this.notify()}
  reset(){this.replace(fresh())}
  undo(){if(!this.undoStack.length)return;this.redoStack.push(copy(this.state));this.state=this.undoStack.pop();this.notify()}
  redo(){if(!this.redoStack.length)return;this.undoStack.push(copy(this.state));this.state=this.redoStack.pop();this.notify()}
  addVideo(asset){this.commit(s=>s.clips.push({id:uid(),assetId:asset.id,name:asset.name,in:0,out:asset.duration,sourceDuration:asset.duration}))}
  setAudio(asset){this.commit(s=>s.audio={id:uid(),assetId:asset.id,name:asset.name,in:0,out:asset.duration,start:0,sourceDuration:asset.duration})}
  deleteClip(id){this.commit(s=>s.clips=s.clips.filter(c=>c.id!==id))}
  split(id,offset){this.commit(s=>{const i=s.clips.findIndex(c=>c.id===id),c=s.clips[i];if(!c)return;const at=c.in+offset;if(at<=c.in+.1||at>=c.out-.1)return;const right={...c,id:uid(),in:at};c.out=at;s.clips.splice(i+1,0,right)})}
  trim(id,edge,value){this.commit(s=>{const c=s.clips.find(x=>x.id===id);if(!c)return;if(edge==='start')c.in=clamp(value,0,c.out-.1);else c.out=clamp(value,c.in+.1,c.sourceDuration||Infinity)})}
  reorder(from,to){if(from===to)return;this.commit(s=>{const [c]=s.clips.splice(from,1);s.clips.splice(to,0,c)})}
  updateAudio(patch){if(!this.state.audio)return;this.commit(s=>Object.assign(s.audio,patch))}
  settings(patch){this.commit(s=>Object.assign(s,patch))}
  serialize(){return JSON.stringify(this.state,null,2)}
}
export function timelineAt(state,time){let cursor=0;for(let i=0;i<state.clips.length;i++){const c=state.clips[i],len=c.out-c.in;if(time<cursor+len||i===state.clips.length-1)return {clip:c,index:i,local:clamp(c.in+time-cursor,c.in,c.out),start:cursor,end:cursor+len};cursor+=len}return null}
