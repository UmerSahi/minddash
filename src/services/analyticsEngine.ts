import type { Dataset, KPI, ChartConfig, FilterState } from '../types';
import { formatCurrency, formatNumber } from '../utils/storage';

export function filterData(data: Record<string, unknown>[], filters?: FilterState): Record<string, unknown>[] {
  if (!filters) return data;
  let filtered = [...data];
  if (filters.dateRange?.start || filters.dateRange?.end) {
    filtered = filtered.filter(row => {
      const date = String(row.Date || row.date || '');
      if (filters.dateRange?.start && date < filters.dateRange.start) return false;
      if (filters.dateRange?.end && date > filters.dateRange.end) return false;
      return true;
    });
  }
  ['regions', 'categories', 'products', 'salesChannels'].forEach(key => {
    const filterKey = key as keyof FilterState;
    const vals = filters[filterKey] as string[] | undefined;
    if (vals?.length) {
      const colMap: Record<string, string> = { regions: 'Region', categories: 'Category', products: 'Product', salesChannels: 'Sales Channel' };
      filtered = filtered.filter(r => vals.includes(String(r[colMap[key]] || '')));
    }
  });
  return filtered;
}

export function findColumn(columns: string[], candidates: string[]): string | undefined {
  const lower = columns.map(c => c.toLowerCase());
  for (const candidate of candidates) {
    const idx = lower.findIndex(c => c.includes(candidate));
    if (idx >= 0) return columns[idx];
  }
  return columns[0];
}

export function sumColumn(data: Record<string, unknown>[], col: string): number {
  return data.reduce((s, r) => s + (Number(r[col]) || 0), 0);
}

function groupByDate(data: Record<string, unknown>[], dateCol: string, metricCol: string): { date: string; value: number }[] {
  const grouped: Record<string, number> = {};
  data.forEach(row => {
    const month = String(row[dateCol] || '').slice(0, 7);
    grouped[month] = (grouped[month] || 0) + (Number(row[metricCol]) || 0);
  });
  return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, value: parseFloat(value.toFixed(2)) }));
}

function groupByCount(data: Record<string, unknown>[], dateCol: string): { date: string; count: number }[] {
  const grouped: Record<string, number> = {};
  data.forEach(row => {
    const month = String(row[dateCol] || '').slice(0, 7);
    grouped[month] = (grouped[month] || 0) + 1;
  });
  return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }));
}

export function groupBy(data: Record<string, unknown>[], groupCol: string, metricCol: string): { name: string; value: number }[] {
  const grouped: Record<string, number> = {};
  data.forEach(row => {
    const key = String(row[groupCol] || 'Unknown');
    grouped[key] = (grouped[key] || 0) + (Number(row[metricCol]) || 0);
  });
  return Object.entries(grouped).map(([n, v]) => ({ name: n, value: parseFloat(v.toFixed(2)) }));
}

export function calculateKPIs(dataset: Dataset, filters?: FilterState): KPI[] {
  const data = filterData(dataset.data, filters);
  const nums = dataset.profile?.numericColumns || [];
  const dates = dataset.profile?.dateColumns || [];
  const kpis: KPI[] = [];
  const revCol = findColumn(nums, ['revenue', 'sales', 'income']);
  const profitCol = findColumn(nums, ['profit']);
  const costCol = findColumn(nums, ['cost']);
  const qtyCol = findColumn(nums, ['quantity', 'qty']);
  const dateCol = dates[0];
  const totalRev = revCol ? sumColumn(data, revCol) : 0;
  const totalProfit = profitCol ? sumColumn(data, profitCol) : 0;
  const totalCost = costCol ? sumColumn(data, costCol) : 0;
  const totalQty = qtyCol ? sumColumn(data, qtyCol) : data.length;
  if (!revCol) return [];
  if (!totalRev) return [];
  let revChange: number | undefined;
  if (dateCol) {
    const sorted = [...data].sort((a, b) => String(a[dateCol]).localeCompare(String(b[dateCol])));
    const mid = Math.floor(sorted.length / 2);
    const first = sumColumn(sorted.slice(0, mid), revCol);
    const second = sumColumn(sorted.slice(mid), revCol);
    revChange = first > 0 ? parseFloat((((second - first) / first) * 100).toFixed(1)) : 0;
  }
  const avgOrder = totalQty > 0 ? totalRev / totalQty : totalRev;
  const margin = totalRev > 0 ? (totalProfit / totalRev) * 100 : 0;
  kpis.push({ id: 'revenue', label: 'Total Revenue', value: totalRev, formatted: formatCurrency(totalRev), change: revChange, isPositive: revChange ? revChange >= 0 : undefined });
  kpis.push({ id: 'profit', label: 'Total Profit', value: totalProfit, formatted: formatCurrency(totalProfit) });
  kpis.push({ id: 'orders', label: 'Total Orders', value: data.length, formatted: formatNumber(data.length) });
  kpis.push({ id: 'avg_order', label: 'Avg Order Value', value: avgOrder, formatted: formatCurrency(avgOrder) });
  if (margin !== 0) kpis.push({ id: 'margin', label: 'Profit Margin', value: margin, formatted: `${margin.toFixed(1)}%` });
  if (totalCost > 0) kpis.push({ id: 'cost', label: 'Total Cost', value: totalCost, formatted: formatCurrency(totalCost) });
  return kpis;
}

export function generateCharts(dataset: Dataset): ChartConfig[] {
  const charts: ChartConfig[] = [];
  const nums = dataset.profile?.numericColumns || [];
  const cats = dataset.profile?.categoricalColumns || [];
  const dates = dataset.profile?.dateColumns || [];
  const data = dataset.data;
  const dateCol = dates[0];
  const revCol = findColumn(nums, ['revenue', 'sales', 'income']);
  const profitCol = findColumn(nums, ['profit']);
  const catCol = cats.find(c => /category/i.test(c)) || cats[0];
  const regionCol = cats.find(c => /region|area/i.test(c)) || cats[1];
  const productCol = cats.find(c => /product|item/i.test(c)) || catCol;
  if (dateCol && revCol) charts.push({ id: 'revenue-trend', title: 'Revenue Trend', type: 'line', xKey: 'date', yKey: 'value', xLabel: 'Date', yLabel: 'Revenue', data: groupByDate(data, dateCol, revCol) });
  if (catCol && revCol) charts.push({ id: 'revenue-category', title: 'Revenue by Category', type: 'bar', xKey: 'name', yKey: 'value', xLabel: catCol, yLabel: 'Revenue', data: groupBy(data, catCol, revCol) });
  if (regionCol && revCol && regionCol !== catCol) charts.push({ id: 'revenue-region', title: 'Revenue by Region', type: 'bar', xKey: 'name', yKey: 'value', xLabel: 'Region', yLabel: 'Revenue', data: groupBy(data, regionCol, revCol) });
  if (productCol && revCol) charts.push({ id: 'top-products', title: 'Top Products by Revenue', type: 'bar', xKey: 'name', yKey: 'value', data: groupBy(data, productCol, revCol).sort((a, b) => b.value - a.value).slice(0, 10) });
  if (revCol && profitCol) charts.push({ id: 'profit-revenue', title: 'Profit vs Revenue', type: 'scatter', xKey: 'revenue', yKey: 'profit', xLabel: 'Revenue', yLabel: 'Profit', data: data.slice(0, 200).map(r => ({ revenue: Number(r[revCol]) || 0, profit: Number(r[profitCol]) || 0, label: String(r[productCol] || '') })) });
  if (catCol && revCol) charts.push({ id: 'category-share', title: 'Revenue Share by Category', type: 'donut', xKey: 'name', yKey: 'value', data: groupBy(data, catCol, revCol) });
  if (dateCol) charts.push({ id: 'orders-time', title: 'Orders Over Time', type: 'area', xKey: 'date', yKey: 'count', xLabel: 'Date', yLabel: 'Orders', data: groupByCount(data, dateCol) });
  return charts;
}