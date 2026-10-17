/** Synchronous publication boundary: disposal errors after success do not undo a valid install. */
export function disposeAll(actions:Array<()=>void>):unknown[]{
 const errors:unknown[]=[];for(const action of actions){try{action();}catch(error){errors.push(error);}}return errors;
}
export function installAtomically(install:()=>void,rollback:()=>void,disposeCandidate:()=>void,disposePrevious:()=>void):unknown[]{
 try{install();}
 catch(error){const failures=disposeAll([rollback,disposeCandidate]);if(failures.length)throw new AggregateError([error,...failures],'avatar-install-rollback-failed');throw error;}
 return disposeAll([disposePrevious]);
}
/** Retains real DOM nodes and their handlers; no innerHTML reconstruction on rollback. */
export function checkpointElements(elements:HTMLElement[]):()=>void{
 const snapshots=elements.map(element=>({element,children:[...element.childNodes],attributes:[...element.attributes].map(a=>[a.name,a.value] as const),value:'value' in element?String(element.value):undefined}));
 return ()=>{for(const {element,children,attributes,value} of snapshots){element.replaceChildren(...children);for(const attribute of [...element.attributes])element.removeAttribute(attribute.name);for(const [name,text] of attributes)element.setAttribute(name,text);if(value!==undefined)(element as HTMLInputElement).value=value;}};
}
