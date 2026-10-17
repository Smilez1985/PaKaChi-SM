import {mountCredentialVault} from './credential-vault-panel.ts';
import {getProviderKey,setProviderKey,forgetProviderKeys} from './provider-credentials.ts';
import {mountDiscoveryPanel} from './provider-discovery-panel.ts';
import {ADAPTERS,ROLES,parseProviderConfig,readProviderConfig,removeProviderProfile,saveProviderConfig} from './ai-providers.ts';
import type {ProviderConfig,ProviderRole} from './ai-providers.ts';

type Language='de'|'en';
const labels:Record<ProviderRole,[string,string]>={assistant:['Assistent','Assistant'],generation:['3D-Generator','3D generator'],rigging:['Rigging-Dienst','Rigging service']};
const defaultEndpoints:Partial<Record<typeof ADAPTERS[number],string>>={anthropic:'https://api.anthropic.com',ollama:'http://localhost:11434',lmstudio:'http://localhost:1234/v1'};
const adapterNames=['OpenAI-compatible','Ollama','LM Studio','3D','Rigging','Anthropic'];
export function mountProviderPanel(host:HTMLElement,language:()=>Language,storage:Pick<Storage,'getItem'|'setItem'>):()=>void {
  const loaded=readProviderConfig(storage);let config=loaded.config;
  const t=(de:string,en:string)=>language()==='de'?de:en;
  host.dataset.userText=''; // Localize explicitly; preserve profile names and draft input on language changes.
  const heading=document.createElement('h3'),intro=document.createElement('p'),list=document.createElement('div'),form=document.createElement('form'),roles=document.createElement('div'),status=document.createElement('p');
  heading.id='ai-providers-heading';host.setAttribute('aria-labelledby',heading.id);
  status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const name=document.createElement('input'),endpoint=document.createElement('input'),model=document.createElement('input'),adapter=document.createElement('select');
  name.maxLength=160;endpoint.maxLength=2048;model.maxLength=160;endpoint.type='url';
  name.required=endpoint.required=model.required=true;
  name.id='provider-name';endpoint.id='provider-endpoint';model.id='provider-model';adapter.id='provider-adapter';
  endpoint.placeholder='https://…';model.placeholder=t('Modell-ID','Model ID');
  ADAPTERS.forEach((id,i)=>{const option=document.createElement('option');option.value=id;option.textContent=adapterNames[i];adapter.append(option);});
  const presets=[
    {name:'Anthropic',adapter:'anthropic',endpoint:'https://api.anthropic.com'},
    {name:'OpenAI',adapter:'openai-compatible',endpoint:'https://api.openai.com/v1'},
    {name:'OpenRouter',adapter:'openai-compatible',endpoint:'https://openrouter.ai/api/v1'},
    {name:'DeepInfra',adapter:'openai-compatible',endpoint:'https://api.deepinfra.com/v1/openai'},
    {name:'Ollama',adapter:'ollama',endpoint:'http://localhost:11434'},
    {name:'LM Studio',adapter:'lmstudio',endpoint:'http://localhost:1234/v1'},
    {name:'TripoSR (lokal)',adapter:'custom-generation',endpoint:'http://127.0.0.1:8766'},
  ];
  const preset=document.createElement('select');preset.id='provider-preset';
  const placeholder=document.createElement('option');placeholder.value='';preset.append(placeholder);
  presets.forEach((p,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=p.name;preset.append(option);});
  const captions:[HTMLSpanElement,string,string][]=[];
  function field(control:HTMLElement,de:string,en:string){const label=document.createElement('label'),caption=document.createElement('span');caption.textContent=t(de,en);captions.push([caption,de,en]);label.append(caption,control);form.append(label);}
  field(preset,'Anbietervorlage einsetzen','Apply provider preset');
  field(name,'Profilname','Profile name');field(adapter,'Schnittstelle','Interface');field(endpoint,'API-Basisadresse (ohne Zugangsdaten)','API base URL (without credentials)');field(model,'Modell-ID','Model ID');
  const discoveryHost=document.createElement('div');form.append(discoveryHost);
  const discovery=mountDiscoveryPanel(discoveryHost,()=>({adapter:adapter.value as typeof ADAPTERS[number],endpoint:endpoint.value}),language,id=>{model.value=id;});
  // Keep an endpoint draft per interface; selecting another provider must not send to the previous one.
  const profileDrafts=new Map<string,{name:string;adapter:string;endpoint:string;model:string}>();
  const endpointDrafts=new Map<string,string>();const drafts=new Map<string,{model:string;token:string}>();let previousAdapter=adapter.value;let previousEndpoint=endpoint.value;
  const draftId=()=>JSON.stringify([previousAdapter,previousEndpoint]);
  function remember(){drafts.set(draftId(),{model:model.value,token:discovery.getToken()});if(editing){profileDrafts.set(editing,{name:name.value,adapter:previousAdapter,endpoint:previousEndpoint,model:model.value});setProviderKey({id:editing,adapter:previousAdapter as typeof ADAPTERS[number],endpoint:previousEndpoint},discovery.getToken());window.dispatchEvent(new window.Event('pakachi-provider-keys'));}}
  function restore(){previousEndpoint=endpoint.value;const draft=drafts.get(draftId());model.value=draft?.model??'';discovery.setToken(draft?.token??'');}
  const defaultEndpoint=()=>defaultEndpoints[adapter.value as typeof ADAPTERS[number]]??'';
  function updateEndpointHint(){endpoint.placeholder=defaultEndpoint()||'https://…';}
  endpoint.oninput=()=>{remember();endpointDrafts.set(adapter.value,endpoint.value);restore();};
  adapter.onchange=()=>{remember();endpointDrafts.set(previousAdapter,endpoint.value);previousAdapter=adapter.value;endpoint.value=endpointDrafts.get(adapter.value)??defaultEndpoint();restore();updateEndpointHint();restoreEndpoint.hidden=!defaultEndpoint();};
  const restoreEndpoint=document.createElement('button');restoreEndpoint.type='button';restoreEndpoint.id='provider-default-endpoint';
  restoreEndpoint.onclick=()=>{remember();endpoint.value=defaultEndpoint();endpointDrafts.set(adapter.value,endpoint.value);updateEndpointHint();restore();};
  endpoint.parentElement!.append(restoreEndpoint);updateEndpointHint();
  preset.onchange=()=>{const choice=presets[Number(preset.value)];if(preset.value===''||!choice)return;
    remember();endpointDrafts.set(previousAdapter,endpoint.value);adapter.value=choice.adapter;previousAdapter=adapter.value;
    endpoint.value=choice.endpoint;endpointDrafts.set(adapter.value,endpoint.value);restore();
    if(choice.adapter==='custom-generation'&&!model.value)model.value='triposr';
    updateEndpointHint();restoreEndpoint.hidden=!defaultEndpoint();preset.value='';
  };
  const dialog=host.closest('dialog');const onClose=()=>{remember();discovery.invalidate(false);};dialog?.addEventListener('close',onClose);
  const submit=document.createElement('button');submit.type='submit';submit.className='button outline';
  const cancel=document.createElement('button');cancel.type='button';cancel.hidden=true;let editing:string|null=null;
  form.append(submit,cancel);host.append(heading,intro,list,form,roles,status);
  const message=(de:string,en:string)=>{status.textContent=t(de,en);};
  function persist(next:ProviderConfig):boolean {
    try{saveProviderConfig(next,storage);config=next;window.dispatchEvent(new window.Event('pakachi-providers'));message('Gespeichert · noch nicht verbunden.','Saved · not connected yet.');return true;}
    catch{message('Speichern nicht möglich. Bisherige Einstellungen bleiben erhalten.','Could not save. Previous settings are preserved.');return false;}
  }
  function reset(){editing=null;form.reset();endpointDrafts.clear();drafts.clear();previousAdapter=adapter.value;endpoint.value=defaultEndpoint();previousEndpoint=endpoint.value;updateEndpointHint();discovery.invalidate();cancel.hidden=true;submit.textContent=t('Profil hinzufügen','Add profile');}
  function render(){
    heading.textContent=t('KI-Anbieter','AI providers');
    placeholder.textContent=t('Vorlage wählen …','Choose a preset …');
    restoreEndpoint.textContent=t('Standardadresse einsetzen','Use default address');restoreEndpoint.hidden=!defaultEndpoint();
    intro.textContent=t('Profile bleiben in diesem Browser. Modelllisten können auf Knopfdruck geladen werden. Noch keine Generierung oder OAuth-Anmeldung. Schlüssel nur im gesonderten Tokenfeld eingeben. Eine Rollenzuordnung bestätigt keine Modellfähigkeit.','Profiles stay in this browser. Model lists can be fetched on request. Generation and OAuth login are not available yet. Enter keys only in the separate token field. Assigning a role does not verify model capabilities.');
    captions.forEach(([el,de,en])=>el.textContent=t(de,en));
    adapter.options[3].textContent=t('3D · eigener Dienst','3D · custom service');adapter.options[4].textContent=t('Rigging · eigener Dienst','Rigging · custom service');
    submit.textContent=editing?t('Änderungen speichern','Save changes'):t('Profil hinzufügen','Add profile');cancel.textContent=t('Abbrechen','Cancel');
    list.replaceChildren();
    for(const profile of config.profiles){
      const row=document.createElement('div');row.className='provider-row';const summary=document.createElement('p');
      summary.textContent=`${profile.name} · ${profile.model}\n${profile.endpoint}`;
      const edit=document.createElement('button');edit.type='button';edit.textContent=t('Bearbeiten','Edit');edit.setAttribute('aria-label',`${edit.textContent}: ${profile.name}`);
      edit.onclick=()=>{remember();endpointDrafts.clear();drafts.clear();editing=profile.id;const draft=profileDrafts.get(profile.id)??profile;name.value=draft.name;adapter.value=draft.adapter;endpoint.value=draft.endpoint;previousAdapter=adapter.value;endpointDrafts.set(adapter.value,endpoint.value);updateEndpointHint();model.value=draft.model;previousEndpoint=endpoint.value;discovery.setToken(getProviderKey({id:profile.id,adapter:adapter.value as typeof ADAPTERS[number],endpoint:endpoint.value}));cancel.hidden=false;render();name.focus();};
      const remove=document.createElement('button');remove.type='button';remove.textContent=t('Entfernen','Remove');remove.setAttribute('aria-label',`${remove.textContent}: ${profile.name}`);
      remove.onclick=()=>{if(persist(removeProviderProfile(config,profile.id))){forgetProviderKeys(profile.id);profileDrafts.delete(profile.id);if(editing===profile.id)reset();render();}};
      row.append(summary,edit,remove);list.append(row);
    }
    roles.replaceChildren();
    for(const role of ROLES){
      const label=document.createElement('label');label.textContent=labels[role][language()==='de'?0:1];const select=document.createElement('select');select.id=`provider-role-${role}`;
      const none=document.createElement('option');none.value='';none.textContent=t('Nicht zugeordnet','Not assigned');select.append(none);
      for(const profile of config.profiles){const option=document.createElement('option');option.value=profile.id;option.textContent=`${profile.name} · ${profile.model}`;select.append(option);}
      select.value=config.assignments[role]??'';
      select.onchange=()=>{const next=structuredClone(config);next.assignments[role]=select.value||null;if(next.fallbacks)next.fallbacks[role]=next.fallbacks[role].filter(id=>id!==select.value);persist(next);render();};
      label.append(select);roles.append(label);
      const chain=document.createElement('ol');chain.dataset.role=role;
      const fallbackIds=config.fallbacks?.[role]??[];
      function updateFallbacks(ids:string[]){const next=structuredClone(config);next.fallbacks??={assistant:[],generation:[],rigging:[]};next.fallbacks[role]=ids;persist(next);render();}
      fallbackIds.forEach((id,index)=>{const li=document.createElement('li');li.textContent=config.profiles.find(p=>p.id===id)!.name+' ';
        for(const [caption,delta] of [['↑',-1],['↓',1]] as const){const button=document.createElement('button');button.type='button';button.textContent=caption;button.disabled=index+delta<0||index+delta>=fallbackIds.length;button.onclick=()=>{const ids=[...fallbackIds];[ids[index],ids[index+delta]]=[ids[index+delta],ids[index]];updateFallbacks(ids);};li.append(button);}
        const remove=document.createElement('button');remove.type='button';remove.textContent=t('Entfernen','Remove');remove.onclick=()=>updateFallbacks(fallbackIds.filter(x=>x!==id));li.append(remove);chain.append(li);
      });
      const add=document.createElement('select');add.id=`provider-fallback-${role}`;const first=document.createElement('option');first.value='';first.textContent=t('Fallback hinzufügen …','Add fallback …');add.append(first);
      for(const p of config.profiles)if(p.id!==config.assignments[role]&&!fallbackIds.includes(p.id)){const option=document.createElement('option');option.value=p.id;option.textContent=`${p.name} · ${p.model}`;add.append(option);}
      add.onchange=()=>{if(add.value)updateFallbacks([...fallbackIds,add.value]);};roles.append(chain,add);
    }
  }
  cancel.onclick=()=>{remember();reset();render();};
  form.onsubmit=event=>{
    event.preventDefault();if(!form.reportValidity())return;
    try {
      const next=structuredClone(config),profile={id:editing??crypto.randomUUID(),name:name.value,adapter:adapter.value,endpoint:endpoint.value,model:model.value};
      const candidate={...next,profiles:[...next.profiles.filter(p=>p.id!==editing),profile]};
      const valid=parseProviderConfig(candidate);
      if(persist(valid)){profileDrafts.delete(profile.id);setProviderKey(valid.profiles.find(p=>p.id===profile.id)!,discovery.getToken());window.dispatchEvent(new window.Event('pakachi-provider-keys'));reset();render();}
    }catch{message('Profil ungültig: Name und Modell-ID angeben; HTTP(S)-Adresse ohne Anmeldung, Suchparameter oder Fragment verwenden. Maximal 64 Profile.','Invalid profile: enter name and model ID; use an HTTP(S) URL without credentials, query or fragment. Maximum 64 profiles.');}
  };
  const onLanguage=()=>{status.textContent='';render();discovery.render();};window.addEventListener('pakachi-options',onLanguage);render();
  const onVaultLock=()=>{for(const draft of drafts.values())draft.token='';discovery.invalidate();};window.addEventListener('pakachi-vault-lock',onVaultLock);
  const disposeVault=mountCredentialVault(host,storage,language,remember,()=>{if(editing){const p=config.profiles.find(p=>p.id===editing);if(p&&adapter.value===p.adapter&&endpoint.value===p.endpoint)discovery.setToken(getProviderKey(p));}});
  if(loaded.error)message('Gespeicherte Anbieterprofile konnten nicht gelesen werden. Sie werden erst beim nächsten Speichern ersetzt.','Saved provider profiles could not be read. They will only be replaced when you save.');
  return ()=>{window.removeEventListener('pakachi-vault-lock',onVaultLock);disposeVault();window.removeEventListener('pakachi-options',onLanguage);dialog?.removeEventListener('close',onClose);discovery.dispose();};
}
