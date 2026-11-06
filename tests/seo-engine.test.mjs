import { auditCrawl } from '../api/seo/_lib/crawler.js';
import { scoreIssue, buildSeoSummary } from '../api/seo/_lib/analysis.js';

const pages = [
 {url:'https://x.test/a',finalUrl:'https://x.test/a',status:200,title:'Same',description:'D',h1:['A'],canonical:'https://x.test/a'},
 {url:'https://x.test/b',finalUrl:'https://x.test/b',status:404,title:'Same',description:'D',h1:[],canonical:null}
];
const audit = auditCrawl(pages);
if (!audit.issues.some(x=>x.type==='http_error')) throw new Error('HTTP error not detected');
if (!audit.issues.some(x=>x.type==='duplicate_title')) throw new Error('Duplicate title not detected');
if (scoreIssue({severity:'high',businessImpact:2,confidence:1,effort:'low'}) <= scoreIssue({severity:'low'})) throw new Error('Issue scoring order invalid');
const summary = buildSeoSummary({crawl:{root:'https://x.test',pageCount:2},audit});
if (summary.crawledPages!==2 || summary.issueCount===0) throw new Error('Summary invalid');
console.log('SEO engine smoke tests passed');


// Integration-style crawler test with deterministic HTTP fixtures.
import { crawlSite } from '../api/seo/_lib/crawler.js';
const originalFetch = globalThis.fetch;
const requests = [];
globalThis.fetch = async (url) => {
  const href = String(url); requests.push(href);
  const html = href.endsWith('/about')
    ? '<html><head><title>About</title><meta name="description" content="About page"></head><body><h1>About</h1></body></html>'
    : '<html><head><title>Home</title><meta name="description" content="Home page"><link rel="canonical" href="https://fixture.test/"></head><body><h1>Home</h1><a href="/about">About</a><a href="https://outside.test/">External</a></body></html>';
  return { status: 200, url: href, headers: { get: () => 'text/html; charset=utf-8' }, text: async () => html };
};
try {
  const result = await crawlSite('https://fixture.test/', { maxPages: 10, concurrency: 2, timeoutMs: 1000 });
  if (result.pageCount !== 2) throw new Error('Crawler must follow same-origin links only');
  if (requests.some(url => url.includes('outside.test'))) throw new Error('Crawler followed external origin');
  if (!result.pages.some(page => page.title === 'About')) throw new Error('Crawler failed to extract linked page title');
  console.log('SEO crawler integration fixtures passed');
} finally { globalThis.fetch = originalFetch; }
