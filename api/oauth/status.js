import {send} from '../_lib/http.js';
import {providers} from '../_lib/providers.js';
export default async function handler(req,res){
 if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
 const result=Object.entries(providers).map(([id,p])=>({id,label:p.label,configured:Boolean(p.client()&&p.secret()),clientIdPresent:Boolean(p.client()),secretPresent:Boolean(p.secret())}));
 return send(res,200,{mode:'hosted-oauth',service:'CLIPPER HUB OAuth Broker',providers:result,redirectBase:process.env.OAUTH_REDIRECT_BASE||'current-domain'});
}