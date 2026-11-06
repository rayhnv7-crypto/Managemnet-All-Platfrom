import crypto from 'node:crypto';
import {send,encrypt} from './_lib/http.js';
import {db} from './_lib/supabase.js';
import {providers,redirectUri} from './_lib/providers.js';

export default async function handler(req,res){
 const action=String(req.query.action||''),id=String(req.query.provider||''),p=providers[id];
 if(!p)return send(res,404,{error:'Provider tidak didukung'});
 if(action==='start'){
  if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
  if(!p.client()||!p.secret())return send(res,409,{error:`Kredensial ${p.label} belum dikonfigurasi di Vercel.`});
  try{
   const state=crypto.randomBytes(32).toString('hex');
   const verifier=id==='x'?crypto.randomBytes(32).toString('base64url'):null;
   const challenge=verifier?crypto.createHash('sha256').update(verifier).digest('base64url'):null;
   await db('oauth_states',{method:'POST',body:{state,provider:id,expires_at:new Date(Date.now()+600000).toISOString(),...(verifier?{code_verifier:verifier}:{})},prefer:'return=minimal'});
   const u=new URL(p.authorize);u.searchParams.set(id==='tiktok'?'client_key':'client_id',p.client());
   u.searchParams.set('redirect_uri',redirectUri(req,id));u.searchParams.set('response_type','code');u.searchParams.set('scope',p.scopes);u.searchParams.set('state',state);
   if(id==='x'){u.searchParams.set('code_challenge',challenge);u.searchParams.set('code_challenge_method','S256')}
   if(id==='google'){u.searchParams.set('access_type','offline');u.searchParams.set('prompt','consent')}
   return res.redirect(302,u.toString());
  }catch{return send(res,503,{error:'OAuth start gagal diproses'})}
 }
 if(action==='callback'){
  if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
  const state=String(req.query.state||''),code=String(req.query.code||'');
  if(!state)return send(res,400,{error:'OAuth callback tidak lengkap'});
  try{
   const consumed=await db(`oauth_states?state=eq.${encodeURIComponent(state)}&provider=eq.${encodeURIComponent(id)}&select=state,expires_at,code_verifier`,{method:'DELETE',prefer:'return=representation'});
   const st=consumed?.[0];if(!st||new Date(st.expires_at)<=new Date())return send(res,400,{error:'OAuth state tidak valid, kedaluwarsa, atau sudah digunakan'});
   if(req.query.error)return send(res,400,{error:'Akses OAuth ditolak oleh pengguna'});
   if(!code)return send(res,400,{error:'Authorization code tidak diterima'});
   if(id==='x'&&!st.code_verifier)return send(res,400,{error:'OAuth PKCE verifier tidak tersedia; ulangi koneksi X'});
   if(!p.client()||!p.secret())return send(res,503,{error:'OAuth provider belum dikonfigurasi'});
   const form=new URLSearchParams({grant_type:'authorization_code',code,redirect_uri:redirectUri(req,id)});
   if(id==='tiktok'){form.set('client_key',p.client());form.set('client_secret',p.secret())}else{form.set('client_id',p.client());form.set('client_secret',p.secret())}
   if(id==='x')form.set('code_verifier',st.code_verifier);
   const response=await fetch(p.token,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:form});
   const data=await response.json().catch(()=>({})),access=data.access_token||data.data?.access_token;
   if(!response.ok||!access)return send(res,502,{error:'Pertukaran token gagal',provider:id,message:data.error_description||data.message||'Periksa konfigurasi provider'});
   await db('connections',{method:'POST',body:{provider:id,status:'Connected',account_label:'Authorized account',token_encrypted:encrypt(data),connected_at:new Date().toISOString()},prefer:'return=minimal,resolution=merge-duplicates'});
   await db('activity_logs',{method:'POST',body:{event:'OAuth connected',detail:id,level:'info'},prefer:'return=minimal'});
   return res.redirect(302,'/?oauth=connected&provider='+encodeURIComponent(id));
  }catch{return send(res,503,{error:'OAuth callback gagal diproses'})}
 }
 return send(res,400,{error:'OAuth action tidak valid'});
}
