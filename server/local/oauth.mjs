import {randomBytes,timingSafeEqual} from 'node:crypto';
import {createMcpExpressApp} from '@modelcontextprotocol/sdk/server/express.js';
import {createOAuthMetadata,mcpAuthMetadataRouter} from '@modelcontextprotocol/sdk/server/auth/router.js';
import {authorizationHandler} from '@modelcontextprotocol/sdk/server/auth/handlers/authorize.js';
import {tokenHandler} from '@modelcontextprotocol/sdk/server/auth/handlers/token.js';
import {clientRegistrationHandler} from '@modelcontextprotocol/sdk/server/auth/handlers/register.js';
import {revocationHandler} from '@modelcontextprotocol/sdk/server/auth/handlers/revoke.js';
import {InvalidGrantError,InvalidTokenError,InvalidScopeError,InvalidClientMetadataError} from '@modelcontextprotocol/sdk/server/auth/errors.js';
import {connectionDetails} from './settings.mjs';
const random=()=>randomBytes(32).toString('hex');
export const equal=(a,b)=>{const x=Buffer.from(a??''),y=Buffer.from(b??'');return x.length===y.length&&timingSafeEqual(x,y);};

/** SDK OAuth 2.1/PKCE endpoints. Only the local application can approve a client. */
export function createLocalOAuth(settings,localUrl){
 const clients=new Map(),pending=new Map(),codes=new Map(),tokens=new Map();let cached;
 const clean=()=>{for(const map of [pending,codes,tokens])for(const [id,p] of map)if(p.expires<Date.now())map.delete(id);};
 const resource=()=>connectionDetails(settings.value.publicUrl,localUrl()).resource;
 const verifyResource=r=>{if(r&&r.href!==resource().href)throw new InvalidGrantError('Wrong resource');};
 const issue=(clientId,scopes)=>{
  clean();if(tokens.size>256)throw new InvalidGrantError('Too many tokens');
  const access=random(),refresh=random();tokens.set(access,{type:'access',clientId,scopes,expires:Date.now()+3600000});tokens.set(refresh,{type:'refresh',clientId,scopes,expires:Date.now()+7*86400000});
  return {access_token:access,refresh_token:refresh,token_type:'Bearer',expires_in:3600,scope:scopes.join(' ')};
 };
 const provider={
  clientsStore:{async getClient(id){return clients.get(id);},async registerClient(client){
   clean();if(clients.size>=64||client.redirect_uris.length>8||client.client_name?.length>200)throw new InvalidClientMetadataError('Client limit');
   for(const value of client.redirect_uris){const u=new URL(value);if(u.username||u.password||u.hash||u.protocol!=='https:'&&!(u.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(u.hostname)))throw new InvalidClientMetadataError('HTTPS or loopback callback required');}
   clients.set(client.client_id,client);return client;
  }},
  async authorize(client,params,res){
   clean();verifyResource(params.resource);if(params.scopes?.some(s=>s!=='pakachi:tools'))throw new InvalidScopeError('Only pakachi:tools is supported');if(pending.size>=16)throw new InvalidGrantError('Too many pending approvals');
   const id=random();pending.set(id,{client,params,expires:Date.now()+300000,redirect:null});
   const {prefix}=connectionDetails(settings.value.publicUrl,localUrl());
   res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'unsafe-inline'; connect-src 'self'; style-src 'unsafe-inline'; frame-ancestors 'none'");res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cache-Control','no-store');
   res.type('html').send(`<!doctype html><html lang="de"><meta charset="utf-8"><title>PaKaChi verbinden</title><style>body{font:18px system-ui;max-width:650px;margin:12vh auto;background:#13271e;color:#e8f6e5;padding:24px}p{line-height:1.6}</style><h1>PaKaChi verbinden</h1><p>Bitte die Verbindungsanfrage in deiner laufenden PaKaChi-Anwendung unter „Lokale Werkzeuge“ freigeben. Diese Seite leitet dich anschließend zurück.</p><p id="status">Warte auf Freigabe …</p><script>const timer=setInterval(async()=>{try{const r=await fetch(${JSON.stringify(prefix+'/oauth-wait/'+id)});if(!r.ok){clearInterval(timer);document.getElementById('status').textContent='Anfrage abgelaufen. Bitte erneut verbinden.';return;}const d=await r.json();if(d.redirect){clearInterval(timer);location.replace(d.redirect);}}catch{}},1500);</script></html>`);
  },
  async challengeForAuthorizationCode(client,code){clean();const c=codes.get(code);if(!c||c.client.client_id!==client.client_id)throw new InvalidGrantError('Invalid authorization code');return c.params.codeChallenge;},
  async exchangeAuthorizationCode(client,code,_verifier,redirectUri,r){
   clean();const c=codes.get(code);if(!c||c.client.client_id!==client.client_id||redirectUri&&redirectUri!==c.params.redirectUri)throw new InvalidGrantError('Invalid authorization code');verifyResource(r);codes.delete(code);return issue(client.client_id,['pakachi:tools']);
  },
  async exchangeRefreshToken(client,token,scopes,r){clean();const t=tokens.get(token);if(!t||t.type!=='refresh'||t.clientId!==client.client_id||scopes?.some(s=>!t.scopes.includes(s)))throw new InvalidGrantError('Invalid refresh token');verifyResource(r);tokens.delete(token);return issue(client.client_id,t.scopes);},
  async verifyAccessToken(token){clean();const t=tokens.get(token);if(!t||t.type!=='access')throw new InvalidTokenError('Invalid or expired token');return {token,clientId:t.clientId,scopes:t.scopes,expiresAt:Math.floor(t.expires/1000),resource:resource()};},
  async revokeToken(client,{token}){const t=tokens.get(token);if(t?.clientId===client.client_id)tokens.delete(token);},
 };
 return {provider,
  localToken(clientId,seconds=3600){const token=random();tokens.set(token,{type:'access',clientId,scopes:['pakachi:tools'],expires:Date.now()+seconds*1000});return token;},
  clear(){clients.clear();pending.clear();codes.clear();tokens.clear();cached=undefined;},
  approvals(){clean();return [...pending].filter(([,p])=>!p.redirect).map(([id,p])=>({id,name:p.client.client_name??'MCP-Client',callback:new URL(p.params.redirectUri).origin,expires:p.expires}));},
  approve(id,allow){clean();const p=pending.get(id);if(!p||p.redirect)throw Error('Anfrage nicht mehr verfügbar.');const target=new URL(p.params.redirectUri);if(allow){const code=random();codes.set(code,{client:p.client,params:p.params,expires:Date.now()+60000});target.searchParams.set('code',code);}else target.searchParams.set('error','access_denied');if(p.params.state!==undefined)target.searchParams.set('state',p.params.state);p.redirect=target.href;},
  wait(id){clean();const p=pending.get(id);return p?{redirect:p.redirect}:null;},
  handle(req,res){
   const {resource:rs,prefix,base}=connectionDetails(settings.value.publicUrl,localUrl());
   if(cached?.resource!==rs.href){
    const app=createMcpExpressApp({allowedHosts:['localhost','127.0.0.1',rs.hostname]});const rateLimit={windowMs:60000,max:60,validate:{xForwardedForHeader:false}};
    const metadata=createOAuthMetadata({provider,issuerUrl:base,resourceServerUrl:rs,scopesSupported:['pakachi:tools']});
    for(const [key,path] of [['authorization_endpoint','authorize'],['token_endpoint','token'],['registration_endpoint','register'],['revocation_endpoint','revoke']])metadata[key]=rs.origin+prefix+'/'+path;
    app.use(mcpAuthMetadataRouter({oauthMetadata:metadata,resourceServerUrl:rs,scopesSupported:['pakachi:tools'],resourceName:'PaKaChi lokale Werkzeuge'}));
    if(prefix)app.get('/.well-known/oauth-authorization-server'+prefix,(_q,s)=>s.json(metadata));
    app.use('/authorize',authorizationHandler({provider,rateLimit}));app.use('/token',tokenHandler({provider,rateLimit}));app.use('/register',clientRegistrationHandler({clientsStore:provider.clientsStore,rateLimit}));app.use('/revoke',revocationHandler({provider,rateLimit}));cached={resource:rs.href,app};
   }
   if(prefix&&req.url.startsWith(prefix+'/'))req.url=req.url.slice(prefix.length);cached.app(req,res);
  },
 };
}
