import { send } from '../_lib/http.js';
export default function handler(req,res){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return send(res,405,{error:'Method not allowed'});}
 if(!process.env.CLIPPER_ADMIN_SECRET||req.headers['x-clipper-secret']!==process.env.CLIPPER_ADMIN_SECRET)return send(res,401,{error:'Unauthorized'});
 return send(res,200,{providers:[
  {id:'gemini',name:'Google Gemini',configured:!!process.env.GEMINI_API_KEY,model:process.env.GEMINI_MODEL||'gemini-2.5-flash',env:'GEMINI_API_KEY'},
  {id:'groq',name:'Groq',configured:!!process.env.GROQ_API_KEY,model:process.env.GROQ_MODEL||'llama-3.3-70b-versatile',env:'GROQ_API_KEY'},
  {id:'openrouter',name:'OpenRouter',configured:!!process.env.OPENROUTER_API_KEY,model:process.env.OPENROUTER_MODEL||'meta-llama/llama-3.3-70b-instruct:free',env:'OPENROUTER_API_KEY'}
 ],routing:'auto: Gemini → Groq → OpenRouter',secretRequired:true});
}