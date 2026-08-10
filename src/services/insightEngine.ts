import type { Dataset, AIInsight, Anomaly, Forecast, CorrelationResult, SegmentationResult } from '../types';
import { formatCurrency, formatNumber } from '../utils/storage';

export function generateInsights(dataset: Dataset): AIInsight[] {
  const insights: AIInsight[] = [];
  const nums = dataset.profile?.numericColumns || [];
  const cats = dataset.profile?.categoricalColumns || [];
  const dates = dataset.profile?.dateColumns || [];
  const data = dataset.data;
  const revCol = findColumn(nums, ['revenue', 'sales', 'income']);
  const profitCol = findColumn(nums, ['profit']);
  const dateCol = dates[0];
  const catCol = cats.find(c => /category/i.test(c)) || cats[0];
  const regionCol = cats.find(c => /region|area/i.test(c)) || cats[0];
  const productCol = cats.find(c => /product|item/i.test(c)) || cats[0];
  const channelCol = cats.find(c => /channel|source|medium|sales channel/i.test(c));

  if (!revCol) return insights;
  const totalRev = sumColumn(data, revCol);
  const totalProfit = profitCol ? sumColumn(data, profitCol) : 0;
  const margin = totalRev > 0 ? (totalProfit / totalRev) * 100 : 0;

  // Revenue trend insight
  if (dateCol) {
    const sorted = [...data].sort((a, b) => String(a[dateCol]).localeCompare(String(b[dateCol])));
    const mid = Math.floor(sorted.length / 2);
    const recent = sumColumn(sorted.slice(mid), revCol);
    const earlier = sumColumn(sorted.slice(0, mid), revCol);
    const change = earlier > 0 ? ((recent - earlier) / earlier) * 100 : 0;
    if (Math.abs(change) > 3) {
      insights.push({
        id: 'trend', insight: `Revenue ${change >= 0 ? 'increased' : 'decreased'} ${Math.abs(change).toFixed(1)}% compared to the earlier period.`,
        explanation: `Analysis of ${formatCurrency(totalRev)} in total revenue shows a ${change >= 0 ? 'positive' : 'negative'} trajectory.`,
        evidence: `Period 1: ${formatCurrency(earlier)} → Period 2: ${formatCurrency(recent)}. Change: ${change.toFixed(1)}%.`,
        businessImpact: change >= 0 ? 'Growth trajectory is positive — maintain momentum.' : 'Declining revenue requires immediate strategic attention.',
        recommendation: change >= 0 ? 'Double down on successful channels and products.' : 'Identify underperforming areas and develop recovery plans.',
        severity: change >= 0 ? 'positive' : 'negative', category: 'Trends',
      });
    }
  }

  // Top product
  if (productCol && revCol) {
    const byProduct = groupByKey(data, productCol, revCol, totalRev);
    if (byProduct.length > 0) {
      const top = byProduct[0];
      insights.push({
        id: 'top-product', insight: `"${top.name}" leads revenue with ${top.share}% contribution.`,
        explanation: 'Revenue concentration analysis identifies your most valuable product.',
        evidence: `${top.name}: ${formatCurrency(top.value)} out of ${formatCurrency(totalRev)} total.\n\nProduct Rank:\n${byProduct.slice(0, 5).map((p, i) => `  ${i + 1}. ${p.name} — ${formatCurrency(p.value)} (${p.share}%)`).join('\n')}`,
        businessImpact: top.share > 30 ? 'High concentration in one product creates risk.' : 'Balanced product portfolio with strong leader.',
        recommendation: top.share > 30 ? 'Diversify while maximizing the top performer.' : 'Cross-sell top product to more customers.',
        severity: 'positive', category: 'Products',
      });
    }
  }

  // Regional performance
  if (regionCol && profitCol && revCol && cats.length > 1) {
    const byRegion = data.reduce((acc: Record<string, { r: number; p: number }>, row) => {
      const r = String(row[regionCol] || 'Unknown');
      if (!acc[r]) acc[r] = { r: 0, p: 0 };
      acc[r].r += Number(row[revCol]) || 0;
      acc[r].p += Number(row[profitCol]) || 0;
      return acc;
    }, {});
    let bestR = '', bestM = -Infinity;
    Object.entries(byRegion).forEach(([r, v]) => { const m = v.r > 0 ? (v.p / v.r) * 100 : 0; if (m > bestM) { bestM = m; bestR = r; } });
    if (bestR) insights.push({
      id: 'best-region', insight: `"${bestR}" has the strongest profit margin at ${bestM.toFixed(1)}%.`,
      explanation: 'Regional profit margin analysis reveals performance disparities across markets.',
      evidence: `${bestR}: ${bestM.toFixed(1)}% margin. Revenue: ${formatCurrency(byRegion[bestR].r)}, Profit: ${formatCurrency(byRegion[bestR].p)}.`,
      businessImpact: 'Regional insights help allocate resources to high-performing areas.',
      recommendation: `Study "${bestR}" practices and apply to underperforming regions.`,
      severity: 'positive', category: 'Regions',
    });
  }

  // Channel performance
  if (channelCol && revCol) {
    const byChannel = groupByKey(data, channelCol, revCol, totalRev);
    if (byChannel.length >= 2) {
      const best = byChannel[0];
      insights.push({
        id: 'channel', insight: `"${best.name}" is the top channel at ${best.share}% of revenue.`,
        explanation: 'Sales channel analysis identifies the most effective distribution method.',
        evidence: `${best.name}: ${formatCurrency(best.value)} (${best.share}% share).\n\nChannel Breakdown:\n${byChannel.map(c => `  ${c.name} — ${formatCurrency(c.value)} (${c.share}%)`).join('\n')}`,
        businessImpact: 'Optimizing top channels drives significant revenue growth.',
        recommendation: `Increase investment in "${best.name}" and improve others.`,
        severity: 'positive', category: 'Channels',
      });
    }
  }

  // Category concentration
  if (catCol && revCol) {
    const byCat = groupByKey(data, catCol, revCol, totalRev);
    if (byCat.length >= 2) {
      const gap = byCat[0].share - byCat[1].share;
      if (gap > 15) insights.push({
        id: 'concentration', insight: `Revenue concentrated in "${byCat[0].name}" (${byCat[0].share}%).`,
        explanation: 'Category concentration analysis shows an imbalanced revenue distribution.',
        evidence: `${byCat[0].name}: ${formatCurrency(byCat[0].value)} (${byCat[0].share}%). Next: ${byCat[1].name} (${byCat[1].share}%).`,
        businessImpact: 'Category downturns could significantly impact total revenue.',
        recommendation: 'Explore growth in underperforming categories for balance.',
        severity: 'neutral', category: 'Categories',
      });
    }
  }

  // Profit margin
  if (margin > 0) insights.push({
    id: 'margin', insight: `Overall profit margin is ${margin.toFixed(1)}%.`,
    explanation: 'Profit margin measures how efficiently revenue converts to profit.',
    evidence: `Profit: ${formatCurrency(totalProfit)}. Revenue: ${formatCurrency(totalRev)}. Margin: ${margin.toFixed(1)}%.`,
    businessImpact: margin > 20 ? 'Healthy margins show strong pricing and cost control.' : 'Margins below 20% suggest pricing or cost issues.',
    recommendation: margin > 20 ? 'Maintain pricing strategy and explore premium offerings.' : 'Review cost structure and pricing strategy.',
    severity: margin > 20 ? 'positive' : 'negative', category: 'Financial',
  });

  return insights;
}

function findColumn(columns: string[], candidates: string[]): string | undefined {
  const lower = columns.map(c => c.toLowerCase());
  for (const c of candidates) { const i = lower.findIndex(l => l.includes(c)); if (i >= 0) return columns[i]; }
  return undefined;
}

function sumColumn(data: Record<string, unknown>[], col: string): number {
  return data.reduce((s, r) => s + (Number(r[col]) || 0), 0);
}

function groupByKey(data: Record<string, unknown>[], groupCol: string, metricCol: string, total: number): { name: string; value: number; share: number }[] {
  const g: Record<string, number> = {};
  data.forEach(r => { const k = String(r[groupCol] || 'Unknown'); g[k] = (g[k] || 0) + (Number(r[metricCol]) || 0); });
  return Object.entries(g).map(([n, v]) => ({ name: n, value: parseFloat(v.toFixed(2)), share: total > 0 ? parseFloat(((v / total) * 100).toFixed(1)) : 0 })).sort((a, b) => b.value - a.value);
}

export function detectAnomalies(dataset: Dataset): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const nums = dataset.profile?.numericColumns || [];
  const dates = dataset.profile?.dateColumns || [];
  const revCol = findColumn(nums, ['revenue', 'sales']);
  const dateCol = dates[0];
  if (!revCol) return [];
  const data = dataset.data;
  const values = data.map(r => Number(r[revCol]) || 0);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(values.reduce((sq, v) => sq + Math.pow(v - mean, 2), 0) / values.length);
  data.forEach((row, i) => {
    const val = values[i];
    if (val === 0) return;
    const z = Math.abs((val - mean) / (stdDev || 1));
    if (z > 2.5) {
      const dev = ((val - mean) / mean) * 100;
      anomalies.push({
        id: `a-${i}`, date: dateCol ? String(row[dateCol]) : undefined,
        metric: revCol, severity: z > 3.5 ? 'high' : z > 3 ? 'medium' : 'low',
        expectedValue: parseFloat(mean.toFixed(2)), actualValue: val,
        deviation: parseFloat(dev.toFixed(1)),
        explanation: val > mean ? `Unusually high value — potential promotion or seasonal peak.` : `Unusually low value — potential operational issue or data gap.`,
        timestamp: new Date().toISOString(),
      });
    }
  });
  return anomalies.sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation)).slice(0, 10);
}

export function generateForecast(dataset: Dataset, metric: string, periods: number): Forecast | null {
  const dates = dataset.profile?.dateColumns || [];
  const nums = dataset.profile?.numericColumns || [];
  const dateCol = dates[0];
  if (!dateCol) return null;
  const metricCol = nums.find(c => c.toLowerCase().includes(metric.toLowerCase())) || nums[0];
  if (!metricCol) return null;
  const grouped: Record<string, number> = {};
  dataset.data.forEach(row => {
    const month = String(row[dateCol] || '').slice(0, 7);
    grouped[month] = (grouped[month] || 0) + (Number(row[metricCol]) || 0);
  });
  const monthly = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  if (monthly.length < 3) return null;
  const historical = monthly.map(([d, v]) => ({ date: d, value: parseFloat(v.toFixed(2)) }));
  const n = historical.length;
  const xMean = (n - 1) / 2;
  const yMean = historical.reduce((s, d) => s + d.value, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (i - xMean) * (historical[i].value - yMean); den += Math.pow(i - xMean, 2); }
  const slope = den !== 0 ? num / den : 0;
  const intercept = yMean - slope * xMean;
  const preds = historical.map((_, i) => slope * i + intercept);
  const ssRes = historical.reduce((s, d, i) => s + Math.pow(d.value - preds[i], 2), 0);
  const ssTot = historical.reduce((s, d) => s + Math.pow(d.value - yMean, 2), 0);
  const rSq = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  const lastDate = new Date(historical[historical.length - 1].date + '-01');
  const forecastData: { date: string; value: number; upperBound?: number; lowerBound?: number }[] = [];
  const stdErr = Math.sqrt(ssRes / (n - 2 || 1));
  for (let i = 1; i <= periods; i++) {
    const nd = new Date(lastDate); nd.setMonth(nd.getMonth() + i);
    const x = n + i - 1;
    const p = slope * x + intercept;
    forecastData.push({
      date: `${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, '0')}`,
      value: Math.max(0, parseFloat(p.toFixed(2))),
      upperBound: Math.max(0, parseFloat((p + 1.96 * stdErr).toFixed(2))),
      lowerBound: Math.max(0, parseFloat((p - 1.96 * stdErr).toFixed(2))),
    });
  }
  return { metric: metricCol, period: periods, historicalData: historical, forecastData, trend: slope > 0.01 ? 'up' : slope < -0.01 ? 'down' : 'stable', confidence: parseFloat((rSq * 100).toFixed(1)) };
}

export function calculateCorrelations(dataset: Dataset): CorrelationResult[] {
  const nums = dataset.profile?.numericColumns || [];
  if (nums.length < 2) return [];
  const results: CorrelationResult[] = [];
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      const v1 = dataset.data.map(r => Number(r[nums[i]]) || 0);
      const v2 = dataset.data.map(r => Number(r[nums[j]]) || 0);
      const m1 = v1.reduce((a, b) => a + b, 0) / v1.length;
      const m2 = v2.reduce((a, b) => a + b, 0) / v2.length;
      let n = 0, d1 = 0, d2 = 0;
      for (let k = 0; k < v1.length; k++) { const a = v1[k] - m1; const b = v2[k] - m2; n += a * b; d1 += a * a; d2 += b * b; }
      const d = Math.sqrt(d1 * d2);
      const c = d !== 0 ? n / d : 0;
      const a = Math.abs(c);
      results.push({ col1: nums[i], col2: nums[j], value: parseFloat(c.toFixed(3)), strength: a > 0.7 ? 'strong' : a > 0.4 ? 'moderate' : a > 0.2 ? 'weak' : 'none', direction: c >= 0 ? 'positive' : 'negative' });
    }
  }
  return results;
}

export function calculateSegmentation(dataset: Dataset, dimension: string, metrics: string[]): SegmentationResult {
  const groups = dataset.data.reduce((acc: Record<string, Record<string, number[]>>, row) => {
    const key = String(row[dimension] || 'Unknown');
    if (!acc[key]) acc[key] = {};
    metrics.forEach(m => { if (!acc[key][m]) acc[key][m] = []; acc[key][m].push(Number(row[m]) || 0); });
    return acc;
  }, {});
  const segments = Object.entries(groups).map(([name, mv]) => {
    const metricsSum: Record<string, number> = {};
    Object.entries(mv).forEach(([m, vals]) => { metricsSum[m] = parseFloat((vals.reduce((a, b) => a + b, 0)).toFixed(2)); });
    return { name, count: Object.values(mv)[0]?.length || 0, metrics: metricsSum };
  });
  return { dimension, segments };
}