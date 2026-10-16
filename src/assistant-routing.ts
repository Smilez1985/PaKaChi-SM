import {providerRoute,parseProviderConfig} from './ai-providers.ts';
import type {ProviderConfig,ProviderProfile} from './ai-providers.ts';
import {runAssistant} from './assistant.ts';
/** Only explicitly configured candidates, once each. No retries after cancellation or studio conflicts. */
export async function runAssistantRoute(config:ProviderConfig,input:Omit<Parameters<typeof runAssistant>[0],'profile'|'token'>,keyFor:(profile:ProviderProfile)=>string,run=runAssistant,onAttempt?:(profile:ProviderProfile)=>void){
 const route=providerRoute(parseProviderConfig(config),'assistant');if(!route.length)throw new Error('unassigned');
 const attempts=route.map(profile=>({profile,token:keyFor(profile)}));
 for(let index=0;index<attempts.length;index++){
  input.signal?.throwIfAborted();const attempt=attempts[index];onAttempt?.(attempt.profile);
  try{const result=await run({...input,...attempt});input.signal?.throwIfAborted();return {...result,profile:attempt.profile};}
  catch(error){if(input.signal?.aborted)throw error;const code=error instanceof Error?error.message:'';if(!['network','provider-error','unauthorized','timeout','incomplete-response','empty-response','unsupported-adapter'].includes(code)||index===attempts.length-1)throw error;}
 }
 throw new Error('unavailable');
}
