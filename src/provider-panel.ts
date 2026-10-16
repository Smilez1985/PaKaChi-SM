import {mountDiscoveryPanel} from './provider-discovery-panel.ts';
import {ADAPTERS,ROLES,parseProviderConfig,readProviderConfig,removeProviderProfile,saveProviderConfig} from './ai-providers.ts';
import type {ProviderConfig,ProviderRole} from './ai-providers.ts';

type Language='de'|'en';
const labels:Record<ProviderRole,[string,string]>={assistant:['Assistent','Assistant'],generation:['3D-Generator','3D generator'],rigging:['Rigging-Dienst','Rigging service']};
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
  endpoint.placeholder='http://localhost:11434';model.placeholder=t('Modell-ID','Model ID');
  ADAPTERS.forEach((id,i)=>{const option=document.createElement('option');option.value=id;option.textContent=adapterNames[i];adapter.append(option);});
  const captions:[HTMLSpanElement,string,string][]=[];
  function field(control:HTMLElement,de:string,en:string){const label=document.createElement('label'),caption=document.createElement('span');caption.textContent=t(de,en);captions.push([caption,de,en]);label.append(caption,control);form.append(label);}
  field(name,'Profilname','Profile name');field(adapter,'Schnittstelle','Interface');field(endpoint,'API-Basisadresse (ohne Zugangsdaten)','API base URL (without credentials)');field(model,'Modell-ID','Model ID');
  const discoveryHost=document.createElement('div');form.append(discoveryHost);
  const discovery=mountDiscoveryPanel(discoveryHost,()=>({adapter:adapter.value as typeof ADAPTERS[number],endpoint:endpoint.value}),language,id=>{model.value=id;});
  endpoint.oninput=()=>discovery.invalidate();adapter.onchange=()=>discovery.invalidate();
  const dialog=host.closest('dialog');const onClose=()=>discovery.invalidate();dialog?.addEventListener('close',onClose);
  const submit=document.createElement('button');submit.type='submit';submit.className='button outline';
  const cancel=document.createElement('button');cancel.type='button';cancel.hidden=true;let editing:string|null=null;
  form.append(submit,cancel);host.append(heading,intro,list,form,roles,status);
  const message=(de:string,en:string)=>{status.textContent=t(de,en);};
  function persist(next:ProviderConfig):boolean {
    try{saveProviderConfig(next,storage);config=next;window.dispatchEvent(new window.Event('pakachi-providers'));message('Gespeichert · noch nicht verbunden.','Saved · not connected yet.');return true;}
    catch{message('Speichern nicht möglich. Bisherige Einstellungen bleiben erhalten.','Could not save. Previous settings are preserved.');return false;}
  }
  function reset(){editing=null;form.reset();discovery.invalidate();cancel.hidden=true;submit.textContent=t('Profil hinzufügen','Add profile');}
  function render(){
    heading.textContent=t('KI-Anbieter','AI providers');
    intro.textContent=t('Profile bleiben in diesem Browser. Modelllisten können auf Knopfdruck geladen werden. Noch keine Generierung oder OAuth-Anmeldung. Schlüssel nur im gesonderten Tokenfeld eingeben. Eine Rollenzuordnung bestätigt keine Modellfähigkeit.','Profiles stay in this browser. Model lists can be fetched on request. Generation and OAuth login are not available yet. Enter keys only in the separate token field. Assigning a role does not verify model capabilities.');
    captions.forEach(([el,de,en])=>el.textContent=t(de,en));
    adapter.options[3].textContent=t('3D · eigener Dienst','3D · custom service');adapter.options[4].textContent=t('Rigging · eigener Dienst','Rigging · custom service');
    submit.textContent=editing?t('Änderungen speichern','Save changes'):t('Profil hinzufügen','Add profile');cancel.textContent=t('Abbrechen','Cancel');
    list.replaceChildren();
    for(const profile of config.profiles){
      const row=document.createElement('div');row.className='provider-row';const summary=document.createElement('p');
      summary.textContent=`${profile.name} · ${profile.model}\n${profile.endpoint}`;
      const edit=document.createElement('button');edit.type='button';edit.textContent=t('Bearbeiten','Edit');edit.setAttribute('aria-label',`${edit.textContent}: ${profile.name}`);
      edit.onclick=()=>{editing=profile.id;name.value=profile.name;adapter.value=profile.adapter;endpoint.value=profile.endpoint;model.value=profile.model;discovery.invalidate();cancel.hidden=false;render();name.focus();};
      const remove=document.createElement('button');remove.type='button';remove.textContent=t('Entfernen','Remove');remove.setAttribute('aria-label',`${remove.textContent}: ${profile.name}`);
      remove.onclick=()=>{if(persist(removeProviderProfile(config,profile.id))){if(editing===profile.id)reset();render();}};
      row.append(summary,edit,remove);list.append(row);
    }
    roles.replaceChildren();
    for(const role of ROLES){
      const label=document.createElement('label');label.textContent=labels[role][language()==='de'?0:1];const select=document.createElement('select');select.id=`provider-role-${role}`;
      const none=document.createElement('option');none.value='';none.textContent=t('Nicht zugeordnet','Not assigned');select.append(none);
      for(const profile of config.profiles){const option=document.createElement('option');option.value=profile.id;option.textContent=`${profile.name} · ${profile.model}`;select.append(option);}
      select.value=config.assignments[role]??'';
      select.onchange=()=>{const next=structuredClone(config);next.assignments[role]=select.value||null;persist(next);render();};
      label.append(select);roles.append(label);
    }
  }
  cancel.onclick=()=>{reset();render();};
  form.onsubmit=event=>{
    event.preventDefault();if(!form.reportValidity())return;
    try {
      const next=structuredClone(config),profile={id:editing??crypto.randomUUID(),name:name.value,adapter:adapter.value,endpoint:endpoint.value,model:model.value};
      const candidate={...next,profiles:[...next.profiles.filter(p=>p.id!==editing),profile]};
      const valid=parseProviderConfig(candidate);
      if(persist(valid)){reset();render();}
    }catch{message('Profil ungültig: Name und Modell-ID angeben; HTTP(S)-Adresse ohne Anmeldung, Suchparameter oder Fragment verwenden. Maximal 64 Profile.','Invalid profile: enter name and model ID; use an HTTP(S) URL without credentials, query or fragment. Maximum 64 profiles.');}
  };
  const onLanguage=()=>{status.textContent='';render();discovery.render();};window.addEventListener('pakachi-options',onLanguage);render();
  if(loaded.error)message('Gespeicherte Anbieterprofile konnten nicht gelesen werden. Sie werden erst beim nächsten Speichern ersetzt.','Saved provider profiles could not be read. They will only be replaced when you save.');
  return ()=>{window.removeEventListener('pakachi-options',onLanguage);dialog?.removeEventListener('close',onClose);discovery.dispose();};
}
