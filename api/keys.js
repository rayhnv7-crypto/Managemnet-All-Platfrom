import crypto from 'node:crypto';
import {send,safeEqual} from './_lib/http.js';
import {db} from './_lib/supabase.js';
import {hashApiKey} from './_lib/api-key.js';
function admin(req){return safeEqual(String(req.headers['x-admin-secret']||''),process.env.CLIPPER_ADMIN_SECRET||'')&&Boolean(process.env.CLIPPER_ADMIN_SECRET)}
export default async function handler(req,res){
 if(!admin(req))return send(res,401,{error:'Admin authentication required.'});
 try{
  if(req.method==='GET'){const keys=await db('api_keys?select=id,name,key_prefix,permissions,created_at,last_used_at,revoked_at&order=created_at.desc');return send(res,200,{keys:keys||[]})}
  if(req.method==='POST'){let body=req.body;if(typeof body==='string'){try{body=JSON.parse(body)}catch{return send(res,400,{error:'Body JSON tidak valid.'})}}const name=String(body?.name||'').trim().slice(0,80);const permissions=body?.permissions==='read-write'?'read-write':'read-only';if(!name)return send(res,400,{error:'Nama API Key wajib diisi.'});const workspaces=await db('workspaces?select=id&order=created_at.asc&limit=1');const workspace=workspaces?.[0];if(!workspace)return send(res,409,{error:'Workspace belum dibuat. Buat workspace sebelum API Key.'});const secret='ch_live_'+crypto.randomBytes(32).toString('hex');const rows=await db('api_keys',{method:'POST',body:{workspace_id:workspace.id,name,key_hash:hashApiKey(secret),key_prefix:secret.slice(0,15),permissions},prefer:'return=representation'});return send(res,201,{key:secret,record:rows?.[0]||null,note:'Simpan secret sekarang. Secret tidak dapat ditampilkan kembali.'})}
  if(req.method==='DELETE'){const id=String(req.query.id||'');if(!/^[0-9a-f-]{36}$/i.test(id))return send(res,400,{error:'ID API Key tidak valid.'});await db('api_keys?id=eq.'+id,{method:'PATCH',body:{revoked_at:new Date().toISOString()},prefer:'return=minimal'});return send(res,200,{ok:true})}
  res.setHeader('Allow','GET, POST, DELETE');return send(res,405,{error:'Method not allowed'});
 }catch(e){return send(res,503,{error:e.message})}
}