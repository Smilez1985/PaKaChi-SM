/** Conservative alpha-channel segmentation. It proposes bounding boxes only; it never assigns identity or approves regions. */
export interface TransparentImageComponent {x:number;y:number;width:number;height:number;area:number}
export function detectTransparentImageComponents(image:{width:number;height:number;data:Uint8ClampedArray},options:{maxDimension?:number;minFraction?:number;maxComponents?:number;alphaThreshold?:number}={}):TransparentImageComponent[]{
 const {width,height,data}=image;
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||data.length!==width*height*4)throw new Error('invalid-image-data');
 const maxDimension=options.maxDimension??1600,minFraction=options.minFraction??0.0002,maxComponents=options.maxComponents??24,alphaThreshold=options.alphaThreshold??16;
 if(!Number.isInteger(maxDimension)||maxDimension<1||!Number.isFinite(minFraction)||minFraction<0||!Number.isInteger(maxComponents)||maxComponents<1||!Number.isInteger(alphaThreshold)||alphaThreshold<0||alphaThreshold>255)throw new Error('invalid-detection-options');
 const step=Math.max(1,Math.ceil(Math.max(width,height)/maxDimension)),cols=Math.ceil(width/step),rows=Math.ceil(height/step),count=cols*rows;
 const active=new Uint8Array(count),visited=new Uint8Array(count),queue=new Int32Array(count);
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const px=Math.min(width-1,x*step+Math.floor(step/2)),py=Math.min(height-1,y*step+Math.floor(step/2));active[y*cols+x]=data[(py*width+px)*4+3]!>=alphaThreshold?1:0;}
 const minimum=Math.max(4,Math.ceil(count*minFraction)),components:TransparentImageComponent[]=[];
 for(let seed=0;seed<count;seed++){if(!active[seed]||visited[seed])continue;let read=0,write=0,minX=cols,minY=rows,maxX=-1,maxY=-1;queue[write++]=seed;visited[seed]=1;
  while(read<write){const index=queue[read++]!,x=index%cols,y=Math.floor(index/cols);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=cols||ny>=rows)continue;const next=ny*cols+nx;if(active[next]&&!visited[next]){visited[next]=1;queue[write++]=next;}}
  }
  if(write<minimum||minX===0||minY===0||maxX===cols-1||maxY===rows-1)continue;const x=minX*step,y=minY*step,right=Math.min(width,(maxX+1)*step),bottom=Math.min(height,(maxY+1)*step);
  components.push({x,y,width:right-x,height:bottom-y,area:write*step*step});
 }
 return components.sort((a,b)=>b.area-a.area).slice(0,maxComponents);
}


/** Conservative segmentation for images with a nearly uniform opaque border background. */
export function detectSolidBackgroundImageComponents(
 image:{width:number;height:number;data:Uint8ClampedArray},
 options:{maxDimension?:number;minFraction?:number;maxComponents?:number;borderTolerance?:number;minBorderConsistency?:number}={}
):TransparentImageComponent[]{
 const {width,height,data}=image;
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||data.length!==width*height*4)throw new Error('invalid-image-data');
 const maxDimension=options.maxDimension??1600,minFraction=options.minFraction??0.0002,maxComponents=options.maxComponents??24,borderTolerance=options.borderTolerance??36,minBorderConsistency=options.minBorderConsistency??0.78;
 if(!Number.isInteger(maxDimension)||maxDimension<1||!Number.isFinite(minFraction)||minFraction<0||!Number.isInteger(maxComponents)||maxComponents<1||!Number.isFinite(borderTolerance)||borderTolerance<0||borderTolerance>255||!Number.isFinite(minBorderConsistency)||minBorderConsistency<0.5||minBorderConsistency>1)throw new Error('invalid-detection-options');
 const step=Math.max(1,Math.ceil(Math.max(width,height)/maxDimension)),cols=Math.ceil(width/step),rows=Math.ceil(height/step),count=cols*rows;
 const pixels=new Uint8Array(count*4);
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const px=Math.min(width-1,x*step+Math.floor(step/2)),py=Math.min(height-1,y*step+Math.floor(step/2)),source=(py*width+px)*4,target=(y*cols+x)*4;pixels[target]=data[source]!;pixels[target+1]=data[source+1]!;pixels[target+2]=data[source+2]!;pixels[target+3]=data[source+3]!;}
 const border:number[]=[];
 for(let x=0;x<cols;x++){border.push(x,(rows-1)*cols+x);}
 for(let y=1;y<rows-1;y++){border.push(y*cols,y*cols+cols-1);}
 const channels=[0,1,2].map(channel=>{const values=border.filter(index=>pixels[index*4+3]!>=240).map(index=>pixels[index*4+channel]!);if(values.length<8)return -1;values.sort((a,b)=>a-b);return values[Math.floor(values.length/2)]!;});
 if(channels.some(value=>value<0))return [];
 const toleranceSquared=borderTolerance*borderTolerance;
 const distance=(index:number)=>{const offset=index*4;const dr=pixels[offset]!-channels[0]!,dg=pixels[offset+1]!-channels[1]!,db=pixels[offset+2]!-channels[2]!;return dr*dr+dg*dg+db*db;};
 const opaqueBorder=border.filter(index=>pixels[index*4+3]!>=240);
 const consistent=opaqueBorder.filter(index=>distance(index)<=toleranceSquared).length/Math.max(1,opaqueBorder.length);
 if(consistent<minBorderConsistency)return [];
 const background=new Uint8Array(count),queue=new Int32Array(count);let read=0,write=0;
 const enqueue=(index:number)=>{if(background[index]||pixels[index*4+3]!<240||distance(index)>toleranceSquared)return;background[index]=1;queue[write++]=index;};
 for(let x=0;x<cols;x++){enqueue(x);enqueue((rows-1)*cols+x);}
 for(let y=1;y<rows-1;y++){enqueue(y*cols);enqueue(y*cols+cols-1);}
 while(read<write){const index=queue[read++]!,x=index%cols,y=Math.floor(index/cols);if(x>0)enqueue(index-1);if(x+1<cols)enqueue(index+1);if(y>0)enqueue(index-cols);if(y+1<rows)enqueue(index+cols);}
 const visited=new Uint8Array(count),active=(index:number)=>pixels[index*4+3]!>=16&&!background[index],minimum=Math.max(4,Math.ceil(count*minFraction)),components:TransparentImageComponent[]=[];
 for(let seed=0;seed<count;seed++){if(!active(seed)||visited[seed])continue;let qRead=0,qWrite=0,minX=cols,minY=rows,maxX=-1,maxY=-1;queue[qWrite++]=seed;visited[seed]=1;
  while(qRead<qWrite){const index=queue[qRead++]!,x=index%cols,y=Math.floor(index/cols);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=cols||ny>=rows)continue;const next=ny*cols+nx;if(active(next)&&!visited[next]){visited[next]=1;queue[qWrite++]=next;}}
  }
  if(qWrite<minimum||minX===0||minY===0||maxX===cols-1||maxY===rows-1)continue;
  const x=minX*step,y=minY*step,right=Math.min(width,(maxX+1)*step),bottom=Math.min(height,(maxY+1)*step);
  components.push({x,y,width:right-x,height:bottom-y,area:qWrite*step*step});
 }
 return components.sort((a,b)=>b.area-a.area).slice(0,maxComponents);
}

/**
 * Explainable geometry-quality estimate for a segmented component.
 * This is NOT confidence that the component is a person, avatar, form, or view.
 * Scores only describe how well the extracted foreground pixels support the box.
 */
export interface ImageComponentAssessment {
 confidence:number;
 evidence:string[];
}
export function assessImageComponent(
 component:TransparentImageComponent,
 source:{width:number;height:number}
):ImageComponentAssessment {
 const {width,height}=source;
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||
  ![component.x,component.y,component.width,component.height,component.area].every(Number.isFinite)||
  component.x<0||component.y<0||component.width<=0||component.height<=0||component.area<=0||
  component.x+component.width>width||component.y+component.height>height||component.area>width*height) {
  throw new Error('invalid-component-assessment-input');
 }
 const boxArea=component.width*component.height;
 const fillRatio=Math.min(1,component.area/boxArea);
 const imageFraction=component.area/(width*height);
 const margin=Math.min(component.x,component.y,width-(component.x+component.width),height-(component.y+component.height));
 const normalizedMargin=margin/Math.min(width,height);
 let confidence=0.45;
 const evidence:string[]=[];
 if(fillRatio>=0.7){confidence+=0.2;evidence.push('compact-foreground');}
 else if(fillRatio>=0.4){confidence+=0.1;evidence.push('moderate-foreground-fill');}
 else evidence.push('sparse-or-irregular-foreground');
 if(imageFraction>=0.01&&imageFraction<=0.8){confidence+=0.15;evidence.push('usable-relative-area');}
 else if(imageFraction>0.8)evidence.push('very-large-foreground');
 else evidence.push('small-foreground');
 if(normalizedMargin>=0.02){confidence+=0.1;evidence.push('separated-from-image-edge');}
 else evidence.push('close-to-image-edge');
 if(component.width/width>=0.02&&component.height/height>=0.02){confidence+=0.1;evidence.push('measurable-box-size');}
 else evidence.push('thin-or-small-box');
 return {confidence:Math.round(Math.min(1,confidence)*100)/100,evidence};
}


/**
 * Compute a small difference hash for a crop. It is a weak visual cue, not
 * identity recognition: pose, lighting, crop bounds and background affect it.
 */
export function imageComponentPerceptualHash(
 image:{width:number;height:number;data:Uint8ClampedArray},
 component:TransparentImageComponent
):string {
 const {width,height,data}=image;
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||data.length!==width*height*4||
  ![component.x,component.y,component.width,component.height].every(Number.isFinite)||
  component.x<0||component.y<0||component.width<=0||component.height<=0||
  component.x+component.width>width||component.y+component.height>height)throw new Error('invalid-component-hash-input');
 const luminance:number[]=[];
 for(let gy=0;gy<8;gy++)for(let gx=0;gx<9;gx++){
  let sum=0,count=0;
  for(let sy=0;sy<3;sy++)for(let sx=0;sx<3;sx++){
   const x=Math.min(width-1,Math.floor(component.x+(gx+(sx+0.5)/3)*component.width/9));
   const y=Math.min(height-1,Math.floor(component.y+(gy+(sy+0.5)/3)*component.height/8));
   const offset=(y*width+x)*4,alpha=data[offset+3]!/255;
   if(alpha<0.06)continue;
   sum+=(0.2126*data[offset]!+0.7152*data[offset+1]!+0.0722*data[offset+2]!)*alpha;
   count++;
  }
  luminance.push(count?sum/count:0);
 }
 let bits=0n;
 for(let y=0;y<8;y++)for(let x=0;x<8;x++)if(luminance[y*9+x]!>luminance[y*9+x+1]!)bits|=1n<<BigInt(y*8+x);
 return bits.toString(16).padStart(16,'0');
}

/** Returns a normalized dHash similarity. Values are only a review hint. */
export function compareImageComponentHashes(left:string,right:string):number {
 if(!/^[a-f0-9]{16}$/i.test(left)||!/^[a-f0-9]{16}$/i.test(right))throw new Error('invalid-component-hash');
 let differing=BigInt('0x'+left)^BigInt('0x'+right),distance=0;
 while(differing){distance+=Number(differing&1n);differing>>=1n;}
 return Math.round((1-distance/64)*100)/100;
}


export interface ImageComponentSimilarityPair {leftId:string;rightId:string;score:number}

/**
 * Compare only the newest bounded set of identified crops and return the best
 * manual-review hints. This deliberately has no identity or assignment semantics.
 */
export function findSimilarImageComponentHashes(
 entries:Array<{id:string;hash:string}>,
 options:{threshold?:number;maxCandidates?:number;maxResults?:number}={}
):ImageComponentSimilarityPair[] {
 const threshold=options.threshold??0.8,maxCandidates=options.maxCandidates??64,maxResults=options.maxResults??12;
 if(!Number.isFinite(threshold)||threshold<0||threshold>1||!Number.isInteger(maxCandidates)||maxCandidates<2||!Number.isInteger(maxResults)||maxResults<1)throw new Error('invalid-similarity-options');
 const candidates=entries.slice(-maxCandidates);
 const results:ImageComponentSimilarityPair[]=[];
 for(let i=0;i<candidates.length;i++)for(let j=i+1;j<candidates.length;j++){
  const left=candidates[i]!,right=candidates[j]!;
  if(left.id===right.id)continue;
  const score=compareImageComponentHashes(left.hash,right.hash);
  if(score>=threshold)results.push({leftId:left.id,rightId:right.id,score});
 }
 results.sort((a,b)=>b.score-a.score||a.leftId.localeCompare(b.leftId)||a.rightId.localeCompare(b.rightId));
 return results.slice(0,maxResults);
}
