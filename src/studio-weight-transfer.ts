import type * as T from 'three';
type Attribute=T.BufferAttribute|T.InterleavedBufferAttribute;
/** Pure counterpart of a stored transfer. Callers commit only after every palette succeeds. */
export function transferSkinInfluences(originalIndices:Attribute,originalWeights:Attribute,source:number,target:number,amountAt:(vertex:number)=>number){
 const indices=originalIndices.clone(),weights=originalWeights.clone(),ids=new Int32Array(5),merged=new Float64Array(5);let affected=0;
 for(let v=0;v<indices.count;v++){
  let original=0;for(let k=0;k<4;k++)if(indices.getComponent(v,k)===source&&weights.getComponent(v,k)>0)original+=weights.getComponent(v,k);
  if(original<=0)continue;const amount=amountAt(v);if(!Number.isFinite(amount)||amount<0||amount>1)throw Error('Ungültiger Übertragungsanteil.');if(!amount)continue;
  if(target<0)throw Error('Zielknochen fehlt in einer betroffenen Skinning-Palette.');affected++;let count=0;
  for(let k=0;k<4;k++){const id=indices.getComponent(v,k),w=weights.getComponent(v,k);if(w<=0)continue;let slot=0;while(slot<count&&ids[slot]!==id)slot++;if(slot===count){ids[count]=id;merged[count++]=0;}merged[slot]+=w;}
  let targetSlot=-1;
  for(let k=0;k<count;k++){if(ids[k]===source)merged[k]=original*(1-amount);if(ids[k]===target)targetSlot=k;}
  if(targetSlot<0){targetSlot=count++;ids[targetSlot]=target;merged[targetSlot]=0;}merged[targetSlot]+=original*amount;
  for(let k=1;k<count;k++){const id=ids[k],w=merged[k];let j=k;while(j>0&&(merged[j-1]<w||merged[j-1]===w&&ids[j-1]>id)){ids[j]=ids[j-1];merged[j]=merged[j-1];j--;}ids[j]=id;merged[j]=w;}
  let sum=0;for(let k=0;k<Math.min(count,4);k++)if(merged[k]>0)sum+=merged[k];
  for(let k=0;k<4;k++){const present=k<count&&merged[k]>0;indices.setComponent(v,k,present?ids[k]:0);weights.setComponent(v,k,present?merged[k]/sum:0);}
 }
 return {indices,weights,affected};
}
