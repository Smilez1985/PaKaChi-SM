import {discoverModels,DiscoveryError,modelListURL} from './provider-discovery.ts';
import type {ProviderConnection,DiscoveryErrorCode} from './provider-discovery.ts';

const errors:Record<DiscoveryErrorCode,[string,string]>={
 'invalid-endpoint':['Bitte eine gültige HTTP(S)-Basisadresse ohne Zugangsdaten eingeben.','Enter a valid HTTP(S) base URL without credentials.'],
 'unsupported-adapter':['Für diesen Dienst ist noch kein Modelllisten-Adapter vorhanden.','No model-list adapter is available for this service yet.'],
 'insecure-token':['Für Tokens außerhalb dieses Rechners ist HTTPS erforderlich.','Tokens sent outside this computer require HTTPS.'],
 'invalid-token':['Der API-Schlüssel enthält ungültige Zeichen oder ist zu lang.','The API key contains invalid characters or is too long.'],
 'unauthorized':['Zugriff abgewiesen (401/403). API-Schlüssel und Serverfreigabe prüfen.','Access denied (401/403). Check the API key and server access settings.'],
 'not-found':['Modelllisten-Endpunkt nicht gefunden (404). Basisadresse prüfen.','Model-list endpoint not found (404). Check the base URL.'],
 'rate-limited':['Zu viele Anfragen (429). Später ausdrücklich erneut versuchen.','Too many requests (429). Try again later.'],
 'http-error':['Der Dienst meldet einen HTTP-Fehler.','The service returned an HTTP error.'],
 'invalid-response':['Die Antwort enthält keine unterstützte Modellliste.','The response does not contain a supported model list.'],
 'response-too-large':['Die Modellliste überschreitet die Größenbegrenzung.','The model list exceeds the size limit.'],
 'network':['Verbindung fehlgeschlagen. Server, Adresse und Browserfreigabe (CORS/HTTPS) prüfen.','Connection failed. Check the server, URL and browser access (CORS/HTTPS).'],
 'timeout':['Zeitlimit nach 10 Sekunden.','Request timed out after 10 seconds.'],
 'cancelled':['Abgebrochen.','Cancelled.'],
};
export function mountDiscoveryPanel(host:HTMLElement,connection:()=>ProviderConnection,language:()=> 'de'|'en',choose:(id:string)=>void,discover:typeof discoverModels=discoverModels){
 const t=(de:string,en:string)=>language()==='de'?de:en;
 const tokenLabel=document.createElement('label'),tokenCaption=document.createElement('span'),token=document.createElement('input');token.type='password';token.id='provider-token';token.autocomplete='off';token.maxLength=8192;token.spellcheck=false;tokenLabel.append(tokenCaption,token);
 const target=document.createElement('p'),note=document.createElement('p'),check=document.createElement('button'),cancel=document.createElement('button'),clear=document.createElement('button'),selectLabel=document.createElement('label'),selectCaption=document.createElement('span'),select=document.createElement('select'),status=document.createElement('p');
 check.type=cancel.type=clear.type='button';check.id='provider-discover';cancel.id='provider-discovery-cancel';clear.id='provider-token-clear';select.id='provider-model-list';selectLabel.append(selectCaption,select);status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.id='provider-discovery-status';
 host.append(tokenLabel,target,note,check,cancel,clear,selectLabel,status);
 let controller:AbortController|undefined,sequence=0,models:string[]|null=null,error:DiscoveryErrorCode|undefined;
 function render(){
  tokenCaption.textContent=t('API-Schlüssel / Token (optional, nur bis Dialogschluss)','API key / token (optional, until dialog closes)');
  note.textContent=t('Nur Modellliste abrufen; keine Prompts oder Bilder senden. Der Schlüssel geht ausschließlich an die angezeigte Adresse.','Fetch the model list only; no prompts or images are sent. The key is sent only to the displayed URL.');
  try{target.textContent=`${t('Empfänger','Recipient')}: ${modelListURL(connection())}`;check.disabled=!!controller;}catch(e){target.textContent=e instanceof DiscoveryError&&e.code==='unsupported-adapter'?t(...errors['unsupported-adapter']):t('Zuerst Schnittstelle und gültige Basisadresse wählen.','Choose an interface and valid base URL first.');check.disabled=true;}
  check.textContent=t('Verbindung prüfen & Modelle laden','Check connection & load models');cancel.textContent=t('Abfrage abbrechen','Cancel request');clear.textContent=t('Schlüssel vergessen','Forget key');cancel.disabled=!controller;
  selectCaption.textContent=t('Verfügbare Modelle','Available models');const selected=select.value;select.replaceChildren();const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent=t('Modell wählen …','Choose a model …');select.append(placeholder);
  for(const id of models??[]){const option=document.createElement('option');option.value=id;option.textContent=id;select.append(option);}select.value=selected;select.disabled=!models?.length;
  status.textContent=controller?t('Modellliste wird abgerufen …','Fetching model list …'):error?t(...errors[error]):models===null?'':models.length?`${t('Verbindung geprüft. Modelle','Connection checked. Models')}: ${models.length}. ${t('Modellfähigkeiten noch nicht geprüft.','Model capabilities have not been checked.')}`:t('Verbindung geprüft, aber keine Modelle gemeldet. Modell-ID kann manuell eingegeben werden.','Connection checked, but no models were listed. You can enter a model ID manually.');
 }
 function invalidate(clearToken=true){sequence++;controller?.abort();controller=undefined;models=null;error=undefined;if(clearToken)token.value='';render();}
 check.onclick=async()=>{
  invalidate(false);const own=++sequence;controller=new AbortController();const signal=controller.signal;const conn={...connection()},key=token.value;render();
  try{const result=await discover(conn,{token:key,signal});if(own===sequence)models=result;}
  catch(e){if(own===sequence)error=e instanceof DiscoveryError?e.code:'network';}
  finally{if(own===sequence){controller=undefined;render();}}
 };
 cancel.onclick=()=>{invalidate(false);error='cancelled';render();};clear.onclick=()=>invalidate();token.oninput=()=>invalidate(false);
 select.onchange=()=>{if(select.value)choose(select.value);};render();
 return {render,invalidate,dispose:()=>{sequence++;controller?.abort();controller=undefined;token.value='';}};
}
