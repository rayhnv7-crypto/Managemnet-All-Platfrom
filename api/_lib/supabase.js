const config=()=>{const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new Error('Supabase belum dikonfigurasi di Vercel.');return {url:url.replace(/\/$/,''),key}};
export async function db(path,{method='GET',body,prefer}={}){
 const {url,key}=config();
 const headers={apikey:key,'Content-Type':'application/json',...(prefer?{Prefer:prefer}:{})};
 // New Supabase sb_secret_* keys are opaque API keys, not JWTs.
 // Only legacy service_role JWT keys belong in Authorization: Bearer.
 if(key.startsWith('eyJ'))headers.Authorization='Bearer '+key;
 const r=await fetch(`${url}/rest/v1/${path}`,{method,headers,...(body!==undefined?{body:JSON.stringify(body)}:{})});
 const t=await r.text();
 if(!r.ok)throw new Error(`Supabase ${r.status}: ${t.slice(0,300)}`);
 return t?JSON.parse(t):null;
}
