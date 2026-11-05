import crypto from 'node:crypto';
import {send,safeEqual} from './_lib/http.js';
import {db} from './_lib/supabase.js';

const admin=(req)=>Boolean(process.env.CLIPPER_ADMIN_SECRET)&&safeEqual(req.headers['x-admin-secret']||'',process.env.CLIPPER_ADMIN_SECRET);
function decrypt(v){if(!v||v.v!==1)throw new Error('Token koneksi tidak valid.');const key=process.env.TOKEN_ENCRYPTION_KEY;if(!/^[a-f0-9]{64}$/i.test(key||''))throw new Error('TOKEN_ENCRYPTION_KEY belum dikonfigurasi.');const d=crypto.createDecipheriv('aes-256-gcm',Buffer.from(key,'hex'),Buffer.from(v.iv,'hex'));d.setAuthTag(Buffer.from(v.tag,'hex'));return JSON.parse(Buffer.concat([d.update(Buffer.from(v.data,'hex')),d.final()]).toString('utf8'))}
async function connection(provider){const rows=await db('connections?provider=eq.'+encodeURIComponent(provider)+'&status=eq.Connected&select=token_encrypted,account_label&order=connected_at.desc&limit=1');if(!rows?.length)throw new Error('Akun '+provider+' belum terhubung melalui Connections.');return {...decrypt(rows[0].token_encrypted),account_label:rows[0].account_label}}
async function meta(path,token){const u=new URL('https://graph.facebook.com/v23.0/'+path);u.searchParams.set('access_token',token);const r=await fetch(u);const j=await r.json();if(!r.ok)throw new Error(j.error?.message||'Meta API request failed');return j}
export default async function handler(req,res){
 if(req.method!=='GET')return send(res,405,{error:'Gunakan GET.'});
 if(!admin(req))return send(res,401,{error:'Admin Secret tidak valid.'});
 const provider=String(req.query.provider||'meta'),action=String(req.query.action||'status');
 try{
  if(action==='status')return send(res,200,{provider,implemented:provider==='meta',availableActions:provider==='meta'?['accounts','insights']:[],message:provider==='meta'?'Meta Marketing API read-only tersedia setelah OAuth ads_read.':'Provider Ads API belum diimplementasikan.'});
  if(provider==='meta'){
   const c=await connection('meta'),token=c.access_token||c.accessToken;
   if(!token)throw new Error('Access token Meta tidak ditemukan.');
   if(action==='accounts'){const data=await meta('me/adaccounts?fields=id,name,account_id,account_status,currency,timezone_name&limit=100',token);return send(res,200,{provider,accounts:data.data||[]})}
   if(action==='insights'){const account=String(req.query.account_id||'');if(!/^act_\d+$/.test(account))return send(res,400,{error:'account_id harus format act_123456.'});const p=new URLSearchParams({fields:'campaign_name,campaign_id,spend,impressions,clicks,reach,ctr,cpc,conversions',date_preset:String(req.query.date_preset||'last_7d'),level:'campaign',limit:'100'});const data=await meta(account+'/insights?'+p.toString(),token);return send(res,200,{provider,account,rows:data.data||[],paging:data.paging})}
   return send(res,400,{error:'Action Meta tidak dikenal.'});
  }
  return send(res,501,{provider,error:'Marketing API provider ini belum diaktifkan pada backend.',required:'Implementasi OAuth advertiser + API credentials provider.'});
 }catch(e){return send(res,502,{provider,error:e.message})}
}