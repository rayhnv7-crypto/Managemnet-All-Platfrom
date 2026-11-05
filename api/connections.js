import {send} from './_lib/http.js';import {db} from './_lib/supabase.js';
export default async function handler(req,res){if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});try{return send(res,200,{connections:await db('connections?select=id,provider,status,account_label,connected_at&order=created_at.desc')||[]})}catch(e){return send(res,503,{error:e.message})}}
