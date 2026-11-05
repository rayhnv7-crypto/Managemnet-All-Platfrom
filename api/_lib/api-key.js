import crypto from 'node:crypto';
import {db} from './supabase.js';
export const hashApiKey=(key)=>crypto.createHash('sha256').update(String(key)).digest('hex');
export async function requireApiKey(req,permission='read-only'){
 const raw=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'').trim();
 if(!raw)return {ok:false,status:401,error:'API Key diperlukan.'};
 const rows=await db('api_keys?select=id,workspace_id,permissions&key_hash=eq.'+hashApiKey(raw)+'&revoked_at=is.null&limit=1');
 const record=rows?.[0];
 if(!record)return {ok:false,status:401,error:'API Key tidak valid atau sudah dicabut.'};
 if(permission==='read-write'&&record.permissions!=='read-write')return {ok:false,status:403,error:'API Key hanya memiliki izin read-only.'};
 await db('api_keys?id=eq.'+record.id,{method:'PATCH',body:{last_used_at:new Date().toISOString()},prefer:'return=minimal'});
 return {ok:true,key:record};
}
