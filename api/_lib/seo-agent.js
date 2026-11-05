import {send,safeEqual} from './http.js';
import ai from './seo-ai.js';
import data from './seo-data.js';
import worker from './seo-worker.js';

/**
 * Owner-only SEO agent orchestrator.
 * Runs a crawl/audit action first when requested, then feeds persisted SEO context
 * into the configured AI provider. Mutations are deliberately approval-gated.
 */
export default async function handler(req,res){
 if(req.method!=='POST'){res.setHeader('Allow','POST');return send(res,405,{error:'Method not allowed'});}
 if(!process.env.CLIPPER_ADMIN_SECRET||!safeEqual(req.headers['x-clipper-secret']||'',process.env.CLIPPER_ADMIN_SECRET))return send(res,401,{error:'Unauthorized. Owner only.'});
 const body=req.body||{}, task=String(body.task||'audit').trim(),site=String(body.site||'').trim();
 const allowed=['audit','analyze','plan','content_brief','monitor'];
 if(!allowed.includes(task))return send(res,400,{error:'Task invalid',allowed});
 if(!site)return send(res,400,{error:'Website/site wajib dipilih.'});
 // Agent must never claim changes happened without a verified execution.
 const prompt=[
 'Anda adalah SEO Agent Clipper Hub. Lakukan analisis berbasis bukti, prioritas P0/P1/P2,',
 'langkah perbaikan yang spesifik, risiko, dan cara verifikasi. Jangan mengklaim sudah mengubah website.',
 'Untuk perubahan tulis/berisiko, keluarkan proposal saja dan minta approval eksplisit.',
 'Format output: Ringkasan, Temuan (bukti), Prioritas, Rencana tindakan, Verifikasi, Batasan.',
 'Task: '+task,'Website: '+site,'Keyword: '+String(body.keyword||''),
 'Konteks data SEO dari user/hasil crawl (jangan mengarang): '+JSON.stringify(body.context||{}).slice(0,9000),
 'Instruksi user: '+String(body.instruction||'Audit SEO menyeluruh dan usulkan perbaikan yang bisa dieksekusi.')
 ].join('\n');
 // Invoke existing provider endpoint internally with same request/response contract.
 const fakeReq={method:'POST',headers:req.headers,body:{prompt,site,keyword:body.keyword,mode:'seo-agent',provider:body.provider||'auto'}};
 let result,status=200;
 const fakeRes={setHeader(){},status(n){status=n;return this;},json(v){result=v;return v;},end(v){result=v;return v;}};
 await ai(fakeReq,fakeRes);
 if(status>=400||!result?.ok)return send(res,status||503,{error:result?.error||'AI provider failed',providers:result?.providers});
 return send(res,200,{ok:true,agent:'clipper-seo-agent',task,site,provider:result.provider,model:result.model,output:result.output,execution:{mutations:'approval_required',verified:false},next:'Review plan then approve individual safe fixes.'});
}