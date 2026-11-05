import crypto from 'node:crypto';
import {send} from '../../_lib/http.js';
import {db} from '../../_lib/supabase.js';
import {providers,redirectUri} from '../../_lib/providers.js';

export default async function handler(req,res){
 if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
 const id=req.query.provider,p=providers[id];
 if(!p)return send(res,404,{error:'Provider tidak didukung'});
 if(!p.client()||!p.secret())return send(res,409,{error:`Kredensial ${p.label} belum dikonfigurasi di Vercel.`});
 try{
  const state=crypto.randomBytes(32).toString('hex');
  // X OAuth 2.0 requires PKCE. Keep the verifier server-side with the one-time state.
  const verifier=id==='x'?crypto.randomBytes(32).toString('base64url'):null;
  const challenge=verifier?crypto.createHash('sha256').update(verifier).digest('base64url'):null;
  await db('oauth_states',{method:'POST',body:{state,provider:id,expires_at:new Date(Date.now()+600000).toISOString(),...(verifier?{code_verifier:verifier}:{})},prefer:'return=minimal'});
  const u=new URL(p.authorize);
  u.searchParams.set(id==='tiktok'?'client_key':'client_id',p.client());
  u.searchParams.set('redirect_uri',redirectUri(req,id));
  u.searchParams.set('response_type','code');
  u.searchParams.set('scope',p.scopes);
  u.searchParams.set('state',state);
  if(id==='x'){
   u.searchParams.set('code_challenge',challenge);
   u.searchParams.set('code_challenge_method','S256');
  }
  if(id==='google'){u.searchParams.set('access_type','offline');u.searchParams.set('prompt','consent')}
  return res.redirect(302,u.toString());
 }catch(e){return send(res,503,{error:'OAuth start gagal diproses'})}
}