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
