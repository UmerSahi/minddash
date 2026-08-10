import { useNavigate } from 'react-router-dom';
import { useDataset } from '../context/DatasetContext';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/layout/AppLayout';
import { ChartRenderer } from '../components/charts/ChartRenderer';
import { EmptyState } from '../components/ui/EmptyState';
import { PageSkeleton } from '../components/ui/LoadingStates';
import { Upload, TrendingUp, TrendingDown, BarChart3, Zap, ArrowUpRight, ChevronRight, Sparkles, Bot, AlertTriangle } from 'lucide-react';

function StatCard({ label, value, change, changeLabel, isPositive }: {
  label: string; value: string; change?: number; changeLabel?: string; isPositive?: boolean;
}) {
  return (
    <div className="card p-4 hover:translate-y-[-1px] transition-all">
      <div className="text-muted-foreground text-xs mb-1">{label}</div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-success' : 'text-destructive'}`}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{change.toFixed(1)}%</span>
          {changeLabel && <span className="text-muted-foreground">vs {changeLabel}</span>}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { datasets, activeDataset, kpis, charts, insights, isLoading } = useDataset();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (isLoading) return <AppLayout onUploadClick={() => {}}><PageSkeleton /></AppLayout>;

  if (!activeDataset) {
    return (
      <AppLayout onUploadClick={() => {}}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground text-sm">Welcome{user?.name ? `, ${user.name}` : ''}</p>
          </div>
        </div>
        <EmptyState
          icon="upload"
          title="No Dataset Selected"
          description="Upload a dataset or add the demo dataset to see your analytics dashboard come to life."
          action={{ label: 'Upload Dataset', onClick: () => navigate('/datasets') }}
        />
      </AppLayout>
    );
  }

  const topInsights = insights.slice(0, 3);
  const latestKpis = kpis.slice(0, 4);

  return (
    <AppLayout onUploadClick={() => navigate('/datasets')}>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{activeDataset.name} Dashboard</h1>
            <p className="text-muted-foreground text-sm">
              {activeDataset.rowCount.toLocaleString()} rows · {activeDataset.columnCount} columns · Last updated {new Date(activeDataset.updatedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/data-explorer')} className="px-4 py-2 bg-card border border-card-border text-sm rounded-lg hover:border-primary/40 transition-all cursor-pointer flex items-center gap-2 active:scale-[0.97]">
              <BarChart3 size={14} /> Explore Data
            </button>
            <button onClick={() => navigate('/datasets')} className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary-hover transition-all cursor-pointer flex items-center gap-2 active:scale-[0.97]">
              <Upload size={14} /> Datasets
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        {latestKpis.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {latestKpis.map(kpi => (
              <StatCard
                key={kpi.id}
                label={kpi.label}
                value={kpi.formatted}
                change={kpi.change}
                changeLabel={kpi.changeLabel}
                isPositive={kpi.isPositive}
              />
            ))}
          </div>
        )}

        {/* Charts */}
        {charts.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {charts.slice(0, 2).map(chart => (
              <div key={chart.id} className="card p-4">
                <h3 className="text-sm font-semibold mb-3">{chart.title}</h3>
                <ChartRenderer config={chart} height={260} />
              </div>
            ))}
          </div>
        )}

        {/* AI Insights / Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Insights */}
          <div className="lg:col-span-2 card p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Sparkles size={14} className="text-accent" /> AI Insights
              </h3>
              <button onClick={() => navigate('/ai-analyst')} className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer">
                View All <ChevronRight size={12} />
              </button>
            </div>
            {topInsights.length === 0 ? (
              <p className="text-sm text-muted-foreground">AI analysis will appear here once your dataset is ready.</p>
            ) : (
              <div className="space-y-3">
                {topInsights.map((insight, i) => (
                  <div key={insight.id} className={`p-3 rounded-lg border ${
                    insight.severity === 'positive' ? 'border-success/20 bg-success/5' :
                    insight.severity === 'negative' ? 'border-destructive/20 bg-destructive/5' :
                    'border-primary/10 bg-primary/5'
                  }`}>
                    <div className="flex items-start gap-2">
                      {insight.severity === 'positive' ? <TrendingUp size={16} className="text-success mt-0.5 shrink-0" /> :
                       insight.severity === 'negative' ? <AlertTriangle size={16} className="text-destructive mt-0.5 shrink-0" /> :
                       <Zap size={16} className="text-primary mt-0.5 shrink-0" />}
                      <div>
                        <p className="text-sm font-medium">{insight.insight}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{insight.explanation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button onClick={() => navigate('/ai-analyst')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer text-sm text-left">
                <Bot size={16} className="text-primary" />
                <span>Ask AI Analyst</span>
              </button>
              <button onClick={() => navigate('/forecasts')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer text-sm text-left">
                <TrendingUp size={16} className="text-secondary" />
                <span>View Forecasts</span>
              </button>
              <button onClick={() => navigate('/reports')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer text-sm text-left">
                <Zap size={16} className="text-accent" />
                <span>Generate Report</span>
              </button>
              <button onClick={() => navigate('/datasets')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer text-sm text-left">
                <Upload size={16} className="text-success" />
                <span>Change Dataset</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}