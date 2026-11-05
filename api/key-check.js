import {send} from './_lib/http.js';
import {requireApiKey} from './_lib/api-key.js';
export default async function handler(req,res){
 if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
 try{
  const auth=await requireApiKey(req);
  if(!auth.ok)return send(res,auth.status,{error:auth.error});
  return send(res,200,{ok:true,authenticated:true,key_id:auth.key.id,permissions:auth.key.permissions,workspace_id:auth.key.workspace_id});
 }catch(e){return send(res,503,{error:e.message})}
}
