/**
 * Deterministic SEO issue prioritization. AI is advisory and never mutates a website.
 */
const weights = { critical: 100, high: 70, medium: 40, low: 15 };
const effort = { low: 1, medium: 2, high: 3 };
export function scoreIssue(issue = {}) {
  const impact = weights[String(issue.severity || 'low').toLowerCase()] || 15;
  const business = Math.max(1, Math.min(3, Number(issue.businessImpact || 1)));
  const confidence = Math.max(0.1, Math.min(1, Number(issue.confidence || 0.8)));
  const cost = effort[String(issue.effort || 'medium').toLowerCase()] || 2;
  return Math.round((impact * business * confidence) / cost);
}
export function buildSeoSummary({ crawl = {}, audit = {}, search = {} } = {}) {
  const issues = (audit.issues || []).map(x => ({ ...x, priorityScore: scoreIssue(x) }))
    .sort((a, b) => b.priorityScore - a.priorityScore);
  return {
    generatedAt: new Date().toISOString(),
    site: crawl.root || null,
    crawledPages: crawl.pageCount || audit.scannedPages || 0,
    issueCount: issues.length,
    topIssues: issues.slice(0, 20),
    searchPerformance: {
      clicks: Number(search.clicks || 0), impressions: Number(search.impressions || 0),
      ctr: Number(search.ctr || 0), position: Number(search.position || 0)
    },
    nextActions: issues.slice(0, 5).map(i => ({ issue: i.type, url: i.url, priorityScore: i.priorityScore }))
  };
}
