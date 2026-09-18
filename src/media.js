import { uid, mediaMetadata } from './utils.js';
export class MediaLibrary extends EventTarget{
  constructor(){super();this.assets=new Map()}
  async addFiles(files){const added=[],errors=[];for(const file of files){if(!file.type.startsWith('video/')&&!file.type.startsWith('audio/'))continue;try{const meta=await mediaMetadata(file);const existing=[...this.assets.values()].find(a=>a.name===file.name&&a.size===file.size&&a.type===file.type);if(existing){existing.file=file;if(!existing.url)existing.url=URL.createObjectURL(file);added.push(existing);continue}const asset={id:uid(),name:file.name,size:file.size,type:file.type,duration:meta.duration,width:meta.width,height:meta.height,file,url:URL.createObjectURL(file)};this.assets.set(asset.id,asset);added.push(asset)}catch(e){errors.push(e.message)}}this.dispatchEvent(new Event('change'));return {added,errors}}
  get(id){return this.assets.get(id)}
  findByName(name){return [...this.assets.values()].find(a=>a.name===name)}
  clear(){for(const a of this.assets.values())if(a.url)URL.revokeObjectURL(a.url);this.assets.clear();this.dispatchEvent(new Event('change'))}
}
