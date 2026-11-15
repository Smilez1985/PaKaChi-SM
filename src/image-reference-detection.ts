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
  if(write<minimum)continue;const x=minX*step,y=minY*step,right=Math.min(width,(maxX+1)*step),bottom=Math.min(height,(maxY+1)*step);
  components.push({x,y,width:right-x,height:bottom-y,area:write*step*step});
 }
 return components.sort((a,b)=>b.area-a.area).slice(0,maxComponents);
}
