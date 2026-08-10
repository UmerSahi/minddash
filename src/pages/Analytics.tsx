import { useNavigate } from 'react-router-dom';
import { useDataset } from '../context/DatasetContext';
import { AppLayout } from '../components/layout/AppLayout';
import { ChartRenderer } from '../components/charts/ChartRenderer';
import { PageSkeleton } from '../components/ui/LoadingStates';
import { EmptyState } from '../components/ui/EmptyState';
import { BarChart3, TrendingUp, TrendingDown, Download, Maximize2, ChevronRight, Filter } from 'lucide-react';
import { useState } from 'react';

export default function Analytics() {
  const { activeDataset, kpis, charts, isLoading } = useDataset();
  const navigate = useNavigate();
  const [expandedChart, setExpandedChart] = useState<string | null>(null);

  if (isLoading) return <AppLayout onUploadClick={() => navigate('/datasets')}><PageSkeleton /></AppLayout>;
  if (!activeDataset) return (
    <AppLayout onUploadClick={() => navigate('/datasets')}>
      <EmptyState icon="data" title="No Dataset Selected" description="Select a dataset to view detailed analytics." action={{ label: 'Go to Datasets', onClick: () => navigate('/datasets') }} />
    </AppLayout>
  );

  return (
    <AppLayout onUploadClick={() => navigate('/datasets')}>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-muted-foreground text-sm">In-depth analysis of {activeDataset.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 text-sm bg-card border border-card-border rounded-lg hover:border-primary/40 transition-all cursor-pointer flex items-center gap-2 active:scale-[0.97]">
              <Filter size={14} /> Filter
            </button>
            <button className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-all cursor-pointer flex items-center gap-2 active:scale-[0.97]">
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        {/* KPIs */}
        {kpis.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {kpis.map(kpi => (
              <div key={kpi.id} className="card p-3 text-center">
                <div className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">{kpi.label}</div>
                <div className="text-lg font-bold">{kpi.formatted}</div>
                {kpi.change !== undefined && (
                  <div className={`flex items-center justify-center gap-0.5 text-xs mt-0.5 ${kpi.isPositive ? 'text-success' : 'text-destructive'}`}>
                    {kpi.isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {kpi.change.toFixed(1)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {charts.map(chart => (
            <div key={chart.id} className={`card p-4 transition-all ${expandedChart === chart.id ? 'lg:col-span-2' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">{chart.title}</h3>
                <button
                  onClick={() => setExpandedChart(expandedChart === chart.id ? null : chart.id)}
                  className="p-1.5 rounded hover:bg-muted/50 transition-all cursor-pointer text-muted-foreground"
                >
                  <Maximize2 size={14} />
                </button>
              </div>
              <ChartRenderer config={chart} height={expandedChart === chart.id ? 400 : 280} />
            </div>
          ))}
        </div>

        {/* No charts message */}
        {charts.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No analytics data available. Try selecting a different dataset.
          </div>
        )}
      </div>
    </AppLayout>
  );
}