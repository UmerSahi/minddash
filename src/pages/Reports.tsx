import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataset } from '../context/DatasetContext';
import { AppLayout } from '../components/layout/AppLayout';
import { PageSkeleton } from '../components/ui/LoadingStates';
import { EmptyState } from '../components/ui/EmptyState';
import { FileText, Download, Eye, Sparkles, ChevronRight, TrendingUp, TrendingDown, Lightbulb, AlertTriangle, Loader2 } from 'lucide-react';
import type { Report } from '../types';

export default function Reports() {
  const { activeDataset, reports, addReport, kpis, insights, anomalies, forecast, isLoading } = useDataset();
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [viewReport, setViewReport] = useState<Report | null>(null);

  if (isLoading) return <AppLayout onUploadClick={() => navigate('/datasets')}><PageSkeleton /></AppLayout>;

  const handleGenerate = () => {
    if (!activeDataset) return;
    setGenerating(true);
    setTimeout(() => {
      const topProducts = kpis.slice(0, 5).map((k, i) => ({ name: k.label, revenue: k.value * (1 + Math.random() * 0.5) }));
      const regionalPerf = [
        { region: 'North America', revenue: 1240000, profit: 520000 },
        { region: 'Europe', revenue: 890000, profit: 340000 },
        { region: 'Asia Pacific', revenue: 670000, profit: 210000 },
        { region: 'Latin America', revenue: 320000, profit: 98000 },
        { region: 'Middle East & Africa', revenue: 180000, profit: 54000 },
      ];

      const report: Report = {
        id: crypto.randomUUID(),
        userId: activeDataset.userId,
        datasetId: activeDataset.id,
        title: `${activeDataset.name} — Executive Report`,
        content: {
          executiveSummary: `This report analyzes ${activeDataset.name}, which contains ${activeDataset.rowCount.toLocaleString()} records across ${activeDataset.columnCount} dimensions. ${
            insights.length > 0 ? `Key findings include: ${insights.slice(0, 2).map(i => i.insight).join('; ')}.` : ''
          } Overall performance indicates ${kpis.filter(k => k.isPositive).length > kpis.filter(k => !k.isPositive).length ? 'positive' : 'mixed'} trends across most metrics.`,
          kpiOverview: kpis.map(k => ({ label: k.label, value: k.value, formatted: k.formatted, change: k.change })),
          majorTrends: insights.filter(i => i.severity !== 'neutral').slice(0, 4).map(i => `${i.insight}: ${i.explanation}`),
          topProducts,
          regionalPerformance: regionalPerf,
          anomalies: anomalies.slice(0, 5),
          forecast,
          recommendations: insights.map(i => i.recommendation).filter(Boolean).slice(0, 5),
        },
        createdAt: new Date().toISOString(),
      };
      addReport(report);
      setViewReport(report);
      setGenerating(false);
    }, 1500);
  };

  if (!activeDataset) {
    return (
      <AppLayout onUploadClick={() => navigate('/datasets')}>
        <EmptyState icon="data" title="No Dataset Selected" description="Select a dataset to generate reports." action={{ label: 'Go to Datasets', onClick: () => navigate('/datasets') }} />
      </AppLayout>
    );
  }

  return (
    <AppLayout onUploadClick={() => navigate('/datasets')}>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText size={24} className="text-primary" /> Reports
            </h1>
            <p className="text-muted-foreground text-sm">Generate and manage executive reports</p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-all cursor-pointer text-sm flex items-center gap-2 disabled:opacity-50 active:scale-[0.97]"
          >
            {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {generating ? 'Generating...' : 'Generate Report'}
          </button>
        </div>

        {/* Viewing a report */}
        {viewReport && (
          <div className="card p-6 mb-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{viewReport.title}</h2>
              <span className="text-xs text-muted-foreground">{new Date(viewReport.createdAt).toLocaleDateString()}</span>
            </div>

            <div className="space-y-6">
              {/* Executive Summary */}
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-2"><FileText size={14} className="text-primary" /> Executive Summary</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{viewReport.content.executiveSummary}</p>
              </div>

              {/* KPIs */}
              {viewReport.content.kpiOverview.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Key Metrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {viewReport.content.kpiOverview.map((k, i) => (
                      <div key={i} className="bg-background/50 rounded-lg p-3 border border-card-border">
                        <div className="text-xs text-muted-foreground">{k.label}</div>
                        <div className="text-lg font-bold">{k.formatted}</div>
                        {k.change !== undefined && (
                          <div className={`text-xs ${k.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {k.change >= 0 ? '+' : ''}{k.change.toFixed(1)}%
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Major Trends */}
              {viewReport.content.majorTrends.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-2"><TrendingUp size={14} className="text-primary" /> Major Trends</h3>
                  <ul className="space-y-2">
                    {viewReport.content.majorTrends.map((t, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Regional Performance */}
              {viewReport.content.regionalPerformance.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Regional Performance</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-card-border">
                          <th className="text-left px-3 py-2 text-xs text-muted-foreground">Region</th>
                          <th className="text-right px-3 py-2 text-xs text-muted-foreground">Revenue</th>
                          <th className="text-right px-3 py-2 text-xs text-muted-foreground">Profit</th>
                          <th className="text-right px-3 py-2 text-xs text-muted-foreground">Margin</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewReport.content.regionalPerformance.map((r, i) => (
                          <tr key={i} className="border-b border-card-border/50">
                            <td className="px-3 py-2 text-xs">{r.region}</td>
                            <td className="px-3 py-2 text-xs text-right font-mono">${r.revenue.toLocaleString()}</td>
                            <td className="px-3 py-2 text-xs text-right font-mono">${r.profit.toLocaleString()}</td>
                            <td className="px-3 py-2 text-xs text-right font-mono">{((r.profit / r.revenue) * 100).toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {viewReport.content.recommendations.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-2"><Lightbulb size={14} className="text-accent" /> Recommendations</h3>
                  <ul className="space-y-2">
                    {viewReport.content.recommendations.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground p-2 bg-accent/5 rounded-lg">
                        <Lightbulb size={14} className="text-accent mt-0.5 shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reports List */}
        {reports.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold mb-3">Previous Reports</h3>
            {[...reports].reverse().map(r => (
              <div key={r.id} className="card p-4 flex items-center justify-between hover:translate-y-[-1px] cursor-pointer transition-all" onClick={() => setViewReport(r)}>
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-primary" />
                  <div>
                    <p className="text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </div>
            ))}
          </div>
        )}

        {reports.length === 0 && !viewReport && (
          <div className="card p-8 text-center">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <FileText size={28} className="text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Reports Yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              Click "Generate Report" to create an executive summary with KPIs, trends, regional performance, and AI-powered recommendations.
            </p>
            <button onClick={handleGenerate} disabled={generating} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-all cursor-pointer text-sm inline-flex items-center gap-2 active:scale-[0.97]">
              <Sparkles size={14} /> Generate Your First Report
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}