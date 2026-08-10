import type { Dataset, AIInsight, AIConversation } from '../types';
import { generateInsights } from './insightEngine';
import { v4 as uuid } from 'uuid';

interface AIResponse {
  answer: string;
  evidence: string;
  recommendation?: string;
  chart?: {
    type: 'bar' | 'line' | 'pie';
    title: string;
    labels: string[];
    values: number[];
  };
}

function buildContext(dataset: Dataset): string {
  const profile = dataset.profile;
  if (!profile) return 'No dataset available.';

  const totalRows = dataset.rowCount;
  const cols = dataset.columns.map(c => `${c.name} (${c.type})`).join(', ');

  // Compute key stats
  const nums = profile.numericColumns;
  const cats = profile.categoricalColumns;
  const dates = profile.dateColumns;

  let context = `Dataset: "${dataset.name}"\n`;
  context += `Rows: ${totalRows}\n`;
  context += `Columns: ${cols}\n\n`;

  if (nums.length > 0) {
    context += `Numeric metrics available: ${nums.join(', ')}\n`;
    nums.forEach(col => {
      const info = profile.columnInfo[col];
      if (info) {
        context += `  ${col}: sum=${info.sum?.toLocaleString() ?? 'N/A'}, avg=${info.mean ?? 'N/A'}, min=${info.min ?? 'N/A'}, max=${info.max ?? 'N/A'}, median=${info.median ?? 'N/A'}\n`;
      }
    });
  }

  if (cats.length > 0) {
    context += `\nCategorical dimensions: ${cats.join(', ')}\n`;
    cats.forEach(col => {
      const info = profile.columnInfo[col];
      if (info) {
        // Get top categories by frequency
        const valueCounts: Record<string, number> = {};
        dataset.data.forEach(row => {
          const v = String(row[col] || 'Unknown');
          valueCounts[v] = (valueCounts[v] || 0) + 1;
        });
        const top = Object.entries(valueCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
        context += `  ${col}: unique=${info.uniqueCount}, top values: ${top.map(([v, c]) => `${v}(${c})`).join(', ')}\n`;
      }
    });
  }

  if (dates.length > 0) {
    context += `\nDate fields: ${dates.join(', ')}\n`;
    const dateValues = dataset.data.map(r => String(r[dates[0]] || '')).filter(Boolean).sort();
    if (dateValues.length > 0) {
      context += `  Date range: ${dateValues[0]} to ${dateValues[dateValues.length - 1]}\n`;
    }
  }

  // Top products if applicable
  const revCol = nums.find(c => /revenue|sales/i.test(c));
  const prodCol = cats.find(c => /product|item/i.test(c));
  if (revCol && prodCol) {
    const byProd: Record<string, number> = {};
    dataset.data.forEach(r => {
      const p = String(r[prodCol] || 'Unknown');
      byProd[p] = (byProd[p] || 0) + (Number(r[revCol]) || 0);
    });
    const top5 = Object.entries(byProd).sort((a, b) => b[1] - a[1]).slice(0, 5);
    context += `\nTop products by revenue:\n`;
    top5.forEach(([p, v]) => { context += `  ${p}: $${v.toLocaleString()}\n`; });
  }

  return context;
}

function parseIntent(question: string): { intent: string; columns: string[]; aggregation?: string } {
  const q = question.toLowerCase();
  if (q.includes('top') && (q.includes('product') || q.includes('item'))) return { intent: 'top_products', columns: ['Product', 'Revenue'], aggregation: 'sum' };
  if (q.includes('region') && q.includes('profit')) return { intent: 'region_profit', columns: ['Region', 'Profit'], aggregation: 'sum' };
  if (q.includes('region') && q.includes('revenue')) return { intent: 'region_revenue', columns: ['Region', 'Revenue'], aggregation: 'sum' };
  if (q.includes('category') && q.includes('revenue')) return { intent: 'category_revenue', columns: ['Category', 'Revenue'], aggregation: 'sum' };
  if (q.includes('best') && q.includes('month')) return { intent: 'best_month', columns: ['Date', 'Revenue'], aggregation: 'sum' };
  if (q.includes('trend')) return { intent: 'trend', columns: ['Date', 'Revenue'], aggregation: 'sum' };
  if (q.includes('margin') || q.includes('profitability')) return { intent: 'profitability', columns: ['Revenue', 'Profit'], aggregation: 'average' };
  if (q.includes('forecast') || q.includes('predict')) return { intent: 'forecast', columns: ['Date', 'Revenue'], aggregation: 'sum' };
  if (q.includes('anomaly') || q.includes('outlier') || q.includes('unusual')) return { intent: 'anomalies', columns: [] };
  if (q.includes('recommend')) return { intent: 'recommendations', columns: [] };
  if (q.includes('compare')) return { intent: 'comparison', columns: [], aggregation: 'sum' };
  return { intent: 'general', columns: [] };
}

export function generateAIResponse(question: string, dataset: Dataset): AIResponse {
  const context = buildContext(dataset);
  const intent = parseIntent(question);
  const insights = generateInsights(dataset);
  const nums = dataset.profile?.numericColumns || [];
  const cats = dataset.profile?.categoricalColumns || [];
  const revCol = nums.find(c => /revenue|sales/i.test(c));
  const profitCol = nums.find(c => /profit/i.test(c));
  const prodCol = cats.find(c => /product|item/i.test(c));
  const regCol = cats.find(c => /region|area/i.test(c));
  const catCol = cats.find(c => /category/i.test(c));

  // Compute data for response
  const totalRev = revCol ? dataset.data.reduce((s, r) => s + (Number(r[revCol]) || 0), 0) : 0;
  const totalProfit = profitCol ? dataset.data.reduce((s, r) => s + (Number(r[profitCol]) || 0), 0) : 0;

  if (intent.intent === 'top_products' && revCol && prodCol) {
    const byProd: Record<string, number> = {};
    dataset.data.forEach(r => { const p = String(r[prodCol] || 'Unknown'); byProd[p] = (byProd[p] || 0) + (Number(r[revCol]) || 0); });
    const sorted = Object.entries(byProd).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return {
      answer: `**Top 5 Products by Revenue**\n\nHere are your highest revenue-generating products:`,
      evidence: sorted.map(([p, v], i) => `${i + 1}. **${p}**: $${v.toLocaleString()} (${(v / totalRev * 100).toFixed(1)}%)`).join('\n'),
      recommendation: 'Consider bundling top products with slower movers to boost overall revenue.',
      chart: {
        type: 'bar', title: 'Top 5 Products by Revenue',
        labels: sorted.map(([p]) => p),
        values: sorted.map(([, v]) => Math.round(v)),
      },
    };
  }

  if (intent.intent === 'region_profit' && profitCol && regCol) {
    const byReg: Record<string, number> = {};
    dataset.data.forEach(r => { const reg = String(r[regCol] || 'Unknown'); byReg[reg] = (byReg[reg] || 0) + (Number(r[profitCol]) || 0); });
    const sorted = Object.entries(byReg).sort((a, b) => b[1] - a[1]);
    const best = sorted[0];
    return {
      answer: `**Profit by Region**\n\n"${best[0]}" generates the highest profit at **$${best[1].toLocaleString()}**.`,
      evidence: sorted.map(([r, v]) => `  **${r}**: $${v.toLocaleString()}`).join('\n'),
      recommendation: `Study "${best[0]}"'s successful strategies and apply them to other regions.`,
      chart: { type: 'bar', title: 'Profit by Region', labels: sorted.map(([r]) => r), values: sorted.map(([, v]) => Math.round(v)) },
    };
  }

  if (intent.intent === 'region_revenue' && revCol && regCol) {
    const byReg: Record<string, number> = {};
    dataset.data.forEach(r => { const reg = String(r[regCol] || 'Unknown'); byReg[reg] = (byReg[reg] || 0) + (Number(r[revCol]) || 0); });
    const sorted = Object.entries(byReg).sort((a, b) => b[1] - a[1]);
    return {
      answer: `**Revenue by Region**\n\nRevenue distribution across regions:`,
      evidence: sorted.map(([r, v]) => `  **${r}**: $${v.toLocaleString()} (${(v / totalRev * 100).toFixed(1)}%)`).join('\n'),
      recommendation: 'Focus marketing spend on regions with highest ROI.',
      chart: { type: 'bar', title: 'Revenue by Region', labels: sorted.map(([r]) => r), values: sorted.map(([, v]) => Math.round(v)) },
    };
  }

  if (intent.intent === 'category_revenue' && revCol && catCol) {
    const byCat: Record<string, number> = {};
    dataset.data.forEach(r => { const c = String(r[catCol] || 'Unknown'); byCat[c] = (byCat[c] || 0) + (Number(r[revCol]) || 0); });
    const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    return {
      answer: `**Revenue by Category**\n\nHere's how revenue breaks down across categories:`,
      evidence: sorted.map(([c, v]) => `  **${c}**: $${v.toLocaleString()} (${(v / totalRev * 100).toFixed(1)}%)`).join('\n'),
      recommendation: 'Consider expanding categories with high growth potential.',
      chart: { type: 'pie', title: 'Revenue by Category', labels: sorted.map(([c]) => c), values: sorted.map(([, v]) => Math.round(v)) },
    };
  }

  if (intent.intent === 'best_month' && revCol) {
    const byMonth: Record<string, number> = {};
    dataset.data.forEach(r => {
      const d = String(r.Date || r.date || '');
      const m = d.slice(0, 7);
      byMonth[m] = (byMonth[m] || 0) + (Number(r[revCol]) || 0);
    });
    const sorted = Object.entries(byMonth).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      const best = sorted[0];
      return {
        answer: `**Best Performing Month**\n\n**${best[0]}** generated the highest revenue at **$${best[1].toLocaleString()}**.`,
        evidence: `Top 3 months:\n${sorted.slice(0, 3).map(([m, v]) => `  **${m}**: $${v.toLocaleString()}`).join('\n')}`,
        recommendation: 'Analyze what drove success in that month and replicate those factors.',
        chart: { type: 'line', title: 'Monthly Revenue Trend', labels: sorted.slice(0, 12).map(([m]) => m), values: sorted.slice(0, 12).map(([, v]) => Math.round(v)) },
      };
    }
  }

  if (intent.intent === 'profitability' && revCol && profitCol) {
    const margin = totalRev > 0 ? (totalProfit / totalRev) * 100 : 0;
    return {
      answer: `**Profitability Analysis**\n\nYour overall profit margin is **${margin.toFixed(1)}%**.`,
      evidence: `Total Revenue: $${totalRev.toLocaleString()}\nTotal Profit: $${totalProfit.toLocaleString()}\nProfit Margin: ${margin.toFixed(1)}%\n\n${margin > 20 ? '✅ Healthy margin — above 20% threshold.' : '⚠️ Margin below 20% — review pricing and costs.'}`,
      recommendation: margin > 20 ? 'Maintain pricing power and look for premium upsell opportunities.' : 'Review cost structure, renegotiate suppliers, and consider price adjustments.',
    };
  }

  if (intent.intent === 'anomalies') {
    const vals = dataset.data.map(r => Number(r[revCol || '']) || 0);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const std = Math.sqrt(vals.reduce((sq, v) => sq + Math.pow(v - mean, 2), 0) / vals.length);
    const anomalies = vals.filter(v => Math.abs((v - mean) / (std || 1)) > 2.5);
    return {
      answer: `**Anomaly Detection Results**\n\nFound **${anomalies.length} unusual value${anomalies.length === 1 ? '' : 's'}** in your data.`,
      evidence: anomalies.length > 0
        ? `These values deviate significantly (>{2.5}σ) from the mean of $${mean.toFixed(2)}.\n\nDetected ${anomalies.length} potential anomalies out of ${vals.length} data points (${(anomalies.length / vals.length * 100).toFixed(1)}% of data).`
        : 'No significant anomalies detected in the current dataset.',
      recommendation: anomalies.length > 0 ? 'Review each anomaly to determine if it represents a genuine business event or data quality issue.' : 'Your data appears consistent with expected patterns.',
    };
  }

  if (intent.intent === 'recommendations') {
    const topInsights = insights.slice(0, 3);
    return {
      answer: `**AI Recommendations**\n\nBased on analysis of your ${dataset.name} dataset, here are my top recommendations:`,
      evidence: topInsights.map((ins, i) => `${i + 1}. **${ins.insight}**\n   ${ins.recommendation}`).join('\n\n'),
      recommendation: topInsights[0]?.recommendation || 'Continue monitoring your key metrics regularly.',
    };
  }

  // General fallback with insights
  const topInsights = insights.slice(0, 3);
  const generalEvidence = [
    `📊 **Dataset Overview**: ${dataset.rowCount} rows across ${dataset.columnCount} columns`,
    nums.length > 0 ? `📈 **Metrics available**: ${nums.join(', ')}` : '',
    cats.length > 0 ? `🏷️ **Dimensions**: ${cats.join(', ')}` : '',
    totalRev > 0 ? `💰 **Total Revenue**: $${totalRev.toLocaleString()}` : '',
    totalProfit > 0 ? `💵 **Total Profit**: $${totalProfit.toLocaleString()}` : '',
    topInsights.length > 0 ? `\n**Key Insights**:\n${topInsights.map(i => `• ${i.insight}`).join('\n')}` : '',
  ].filter(Boolean).join('\n');

  return {
    answer: `**Analysis of "${question}"**\n\nHere's what I found in your data:`,
    evidence: generalEvidence,
    recommendation: topInsights[0]?.recommendation || 'Explore the Analytics page for deeper statistical analysis of your data.',
  };
}

export function generateReportContent(dataset: Dataset, insights: AIInsight[], anomalies: import('../types').Anomaly[], forecast: import('../types').Forecast | null): import('../types').ReportContent {
  const nums = dataset.profile?.numericColumns || [];
  const cats = dataset.profile?.categoricalColumns || [];
  const revCol = nums.find(c => /revenue|sales/i.test(c));
  const profitCol = nums.find(c => /profit/i.test(c));
  const prodCol = cats.find(c => /product|item/i.test(c));
  const regCol = cats.find(c => /region|area/i.test(c));
  const totalRev = revCol ? dataset.data.reduce((s, r) => s + (Number(r[revCol]) || 0), 0) : 0;
  const totalProfit = profitCol ? dataset.data.reduce((s, r) => s + (Number(r[profitCol]) || 0), 0) : 0;

  // Top products
  const byProd: Record<string, number> = {};
  if (revCol && prodCol) {
    dataset.data.forEach(r => { const p = String(r[prodCol] || ''); byProd[p] = (byProd[p] || 0) + (Number(r[revCol]) || 0); });
  }
  const topProducts = Object.entries(byProd).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([n, v]) => ({ name: n, revenue: v }));

  // Regional performance
  const byReg: Record<string, { r: number; p: number }> = {};
  if (regCol && revCol) {
    dataset.data.forEach(row => {
      const reg = String(row[regCol] || 'Unknown');
      if (!byReg[reg]) byReg[reg] = { r: 0, p: 0 };
      byReg[reg].r += Number(row[revCol]) || 0;
      byReg[reg].p += Number(row[profitCol || revCol]) || 0;
    });
  }
  const regionalPerformance = Object.entries(byReg).map(([region, v]) => ({ region, revenue: v.r, profit: v.p }));

  return {
    executiveSummary: `This report analyzes "${dataset.name}" containing ${dataset.rowCount} records across ${dataset.columnCount} columns. Total revenue stands at $${totalRev.toLocaleString()} with $${totalProfit.toLocaleString()} in profit.`,
    kpiOverview: [
      { label: 'Total Revenue', value: totalRev, formatted: `$${totalRev.toLocaleString()}` },
      { label: 'Total Profit', value: totalProfit, formatted: `$${totalProfit.toLocaleString()}` },
      { label: 'Records', value: dataset.rowCount, formatted: dataset.rowCount.toLocaleString() },
      { label: 'Profit Margin', value: totalRev > 0 ? (totalProfit / totalRev) * 100 : 0, formatted: `${(totalRev > 0 ? (totalProfit / totalRev) * 100 : 0).toFixed(1)}%` },
    ],
    majorTrends: insights.filter(i => i.category === 'Trends').map(i => i.insight),
    topProducts,
    regionalPerformance,
    anomalies: anomalies.slice(0, 5),
    forecast,
    recommendations: insights.slice(0, 3).map(i => i.recommendation),
  };
}

export function saveConversation(userId: string, datasetId: string, question: string, response: AIResponse): AIConversation {
  return {
    id: uuid(),
    userId,
    datasetId,
    question,
    answer: response.answer,
    evidence: response.evidence,
    recommendation: response.recommendation,
    createdAt: new Date().toISOString(),
  };
}