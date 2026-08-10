import { useNavigate } from 'react-router-dom';
import { useDataset } from '../context/DatasetContext';
import { AppLayout } from '../components/layout/AppLayout';
import { ChartRenderer } from '../components/charts/ChartRenderer';
import { PageSkeleton } from '../components/ui/LoadingStates';
import { EmptyState } from '../components/ui/EmptyState';
import { LineChart, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';

export default function Forecasts() {
  const { activeDataset, forecast, isLoading } = useDataset();
  const navigate = useNavigate();

  if (isLoading) return <AppLayout onUploadClick={() => navigate('/datasets')}><PageSkeleton /></AppLayout>;
  if (!activeDataset) return (
    <AppLayout onUploadClick={() => navigate('/datasets')}>
      <EmptyState icon="data" title="No Dataset Selected" description="Select a dataset to view forecasts." action={{ label: 'Go to Datasets', onClick: () => navigate('/datasets') }} />
    </AppLayout>
  );

  const forecastChart = forecast ? {
    id: 'forecast-chart',
    title: `${forecast.metric} — ${forecast.period}-Day Forecast`,
    type: 'area' as const,
    xKey: 'date' as const,
    yKey: 'value' as const,
    data: [
      ...(forecast.historicalData || []).map(d => ({ ...d, type: 'Historical' })),
      ...(forecast.forecastData || []).map(d => ({ ...d, type: 'Forecast' })),
    ] as unknown as Record<string, unknown>[],
  } : null;

  return (
    <AppLayout onUploadClick={() => navigate('/datasets')}>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Forecasts</h1>
            <p className="text-muted-foreground text-sm">Predictive analytics for {activeDataset.name}</p>
          </div>
        </div>

        {forecast ? (
          <>
            {/* Forecast Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="card p-4">
                <div className="text-muted-foreground text-xs mb-1">Metric</div>
                <div className="text-lg font-semibold capitalize">{forecast.metric}</div>
              </div>
              <div className="card p-4">
                <div className="text-muted-foreground text-xs mb-1">Forecast Period</div>
                <div className="text-lg font-semibold">{forecast.period} days</div>
              </div>
              <div className="card p-4">
                <div className="text-muted-foreground text-xs mb-1">Confidence</div>
                <div className="text-lg font-semibold">{(forecast.confidence * 100).toFixed(0)}%</div>
              </div>
            </div>

            {/* Trend */}
            <div className="card p-4 mb-6">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={16} className={forecast.trend === 'up' ? 'text-success' : forecast.trend === 'down' ? 'text-destructive' : 'text-muted-foreground'} />
                <span className="text-sm font-semibold">Trend: {forecast.trend === 'up' ? 'Upward' : forecast.trend === 'down' ? 'Downward' : 'Stable'}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                The {forecast.metric} is projected to trend {forecast.trend === 'up' ? 'upward' : forecast.trend === 'down' ? 'downward' : 'remain stable'} over the next {forecast.period} days.
              </p>
            </div>

            {/* Chart */}
            {forecastChart && (
              <div className="card p-4">
                <ChartRenderer config={forecastChart} height={350} />
              </div>
            )}

            {/* Forecast Data Table */}
            <div className="card p-4 mt-6">
              <h3 className="text-sm font-semibold mb-3">Forecast Data Points</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-card-border">
                      <th className="text-left px-3 py-2 text-xs text-muted-foreground">Date</th>
                      <th className="text-right px-3 py-2 text-xs text-muted-foreground">Forecast</th>
                      <th className="text-right px-3 py-2 text-xs text-muted-foreground">Upper Bound</th>
                      <th className="text-right px-3 py-2 text-xs text-muted-foreground">Lower Bound</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(forecast.forecastData || []).slice(0, 15).map((d, i) => (
                      <tr key={i} className="border-b border-card-border/50">
                        <td className="px-3 py-2 text-xs">{d.date}</td>
                        <td className="px-3 py-2 text-xs text-right font-mono">{d.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        <td className="px-3 py-2 text-xs text-right text-success font-mono">{d.upperBound?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '—'}</td>
                        <td className="px-3 py-2 text-xs text-right text-destructive font-mono">{d.lowerBound?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="card p-8 text-center">
            <div className="w-14 h-14 rounded-xl bg-card border border-card-border flex items-center justify-center mx-auto mb-4">
              <LineChart size={28} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Forecast Available</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              A forecast could not be generated for this dataset. Try uploading data with a clear time-series dimension and numeric metric.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}