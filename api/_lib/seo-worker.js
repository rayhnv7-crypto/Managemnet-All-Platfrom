import {createClient} from '@supabase/supabase-js';
import {crawlSite,auditCrawl} from '../seo/_lib/crawler.js';
import {send,safeEqual} from './http.js';

export default async function handler(req,res){
  // Vercel Cron invokes GET; manual/internal triggers may use POST.
  if(!['GET','POST'].includes(req.method)){
    res.setHeader('Allow','GET,POST');
    return send(res,405,{error:'GET or POST only'});
  }
  const secret=process.env.CRON_SECRET||process.env.SEO_CRON_SECRET;
  if(!secret||!safeEqual(req.headers.authorization,'Bearer '+secret))
    return send(res,401,{error:'Unauthorized cron'});
  if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY)
    return send(res,503,{error:'Supabase unavailable'});

  const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
  const {data:jobs,error}=await db.from('seo_crawl_runs').select('id,site_id,start_url')
    .eq('status','queued').order('created_at',{ascending:true}).limit(1);
  if(error)return send(res,500,{error:error.message});
  if(!jobs?.length)return send(res,200,{ok:true,processed:0});
  const job=jobs[0];
  const {data:claim,error:ce}=await db.from('seo_crawl_runs')
    .update({status:'running',result:{worker_started_at:new Date().toISOString()}})
    .eq('id',job.id).eq('status','queued').select('id').maybeSingle();
  if(ce||!claim)return send(res,200,{ok:true,processed:0,reason:'already claimed'});
  try{
    const crawl=await crawlSite(job.start_url,{maxPages:100,concurrency:3,timeoutMs:10000});
    const audit=auditCrawl(crawl.pages);
    const result={...crawl,audit,finishedAt:new Date().toISOString()};
    const {error:runSave}=await db.from('seo_crawl_runs').update({status:'completed',result}).eq('id',job.id);
    if(runSave)throw runSave;
    const {error:auditSave}=await db.from('seo_audits').insert({site_id:job.site_id,url:job.start_url,score:Math.max(0,100-audit.issueCount),findings:audit});
    if(auditSave)throw auditSave;
    return send(res,200,{ok:true,processed:1,run_id:job.id,pages:crawl.pageCount,issues:audit.issueCount});
  }catch(e){
    await db.from('seo_crawl_runs').update({status:'failed',result:{error:e.message,failed_at:new Date().toISOString()}}).eq('id',job.id);
    return send(res,500,{error:'Crawl worker failed',run_id:job.id});
  }
}