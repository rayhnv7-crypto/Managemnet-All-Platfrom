import {send,encrypt} from '../../_lib/http.js';
import {db} from '../../_lib/supabase.js';
import {providers,redirectUri} from '../../_lib/providers.js';

export default async function handler(req,res){
 if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
 const id=req.query.provider,p=providers[id],state=String(req.query.state||''),code=String(req.query.code||'');
 if(!p||!state)return send(res,400,{error:'OAuth callback tidak lengkap'});
 try{
  // Consume state atomically so a callback cannot be replayed concurrently.
  const consumed=await db(`oauth_states?state=eq.${encodeURIComponent(state)}&provider=eq.${encodeURIComponent(id)}&select=state,expires_at`,{method:'DELETE',prefer:'return=representation'});
  const st=consumed?.[0];
  if(!st||new Date(st.expires_at)<=new Date())return send(res,400,{error:'OAuth state tidak valid, kedaluwarsa, atau sudah digunakan'});
  if(req.query.error)return send(res,400,{error:'Akses OAuth ditolak oleh pengguna'});
  if(!code)return send(res,400,{error:'Authorization code tidak diterima'});
  if(!p.client()||!p.secret())return send(res,503,{error:'OAuth provider belum dikonfigurasi'});
  const form=new URLSearchParams({grant_type:'authorization_code',code,redirect_uri:redirectUri(req,id)});
  if(id==='tiktok'){form.set('client_key',p.client());form.set('client_secret',p.secret())}
  else{form.set('client_id',p.client());form.set('client_secret',p.secret())}
  const response=await fetch(p.token,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:form});
  const data=await response.json().catch(()=>({}));
  const access=data.access_token||data.data?.access_token;
  if(!response.ok||!access)return send(res,502,{error:'Pertukaran token gagal',provider:id,message:data.error_description||data.message||'Periksa konfigurasi provider'});
  await db('connections',{method:'POST',body:{provider:id,status:'Connected',account_label:'Authorized account',token_encrypted:encrypt(data),connected_at:new Date().toISOString()},prefer:'return=minimal,resolution=merge-duplicates'});
  await db('activity_logs',{method:'POST',body:{event:'OAuth connected',detail:id,level:'info'},prefer:'return=minimal'});
  return res.redirect(302,'/?oauth=connected&provider='+encodeURIComponent(id));
 }catch(e){return send(res,503,{error:'OAuth callback gagal diproses'})}
}