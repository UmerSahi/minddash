import { ResponsiveContainer, LineChart as RechartsLine, BarChart as RechartsBar, PieChart as RechartsPie, ScatterChart as RechartsScatter, AreaChart as RechartsArea, Line, Bar, Pie, Scatter, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer as RC } from 'recharts';
import type { ChartConfig } from '../../types';

const COLORS = ['#3b82f6', '#7c3aed', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#6366f1'];

interface ChartRendererProps {
  config: ChartConfig;
  height?: number;
}

export function ChartRenderer({ config, height = 300 }: ChartRendererProps) {
  if (!config.data || config.data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
        No data available
      </div>
    );
  }

  const renderTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="glass rounded-lg px-3 py-2 text-xs shadow-lg">
        <p className="font-medium text-foreground mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} style={{ color: entry.color }} className="font-mono">
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </div>
    );
  };

  switch (config.type) {
    case 'line':
      return (
        <RC width="100%" height={height}>
          <RechartsLine data={config.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2456" />
            <XAxis dataKey={config.xKey} stroke="#94a3b8" tick={{ fontSize: 11 }} tickLine={false} />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toString()} />
            <Tooltip content={renderTooltip} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
            <Line type="monotone" dataKey={config.yKey} stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} activeDot={{ r: 5 }} />
          </RechartsLine>
        </RC>
      );

    case 'bar':
      return (
        <RC width="100%" height={height}>
          <RechartsBar data={config.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2456" />
            <XAxis dataKey={config.xKey} stroke="#94a3b8" tick={{ fontSize: 11 }} tickLine={false} angle={config.data.length > 8 ? -35 : 0} textAnchor={config.data.length > 8 ? 'end' : 'middle'} height={80} />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toString()} />
            <Tooltip content={renderTooltip} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
            <Bar dataKey={config.yKey} fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50}>
              {config.data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </RechartsBar>
        </RC>
      );

    case 'donut':
    case 'pie':
      return (
        <RC width="100%" height={height}>
          <RechartsPie>
            <Pie
              data={config.data}
              dataKey={config.yKey}
              nameKey={config.xKey}
              cx="50%" cy="50%"
              innerRadius={config.type === 'donut' ? 60 : 0}
              outerRadius={100}
              paddingAngle={2}
            >
              {config.data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip content={renderTooltip} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
          </RechartsPie>
        </RC>
      );

    case 'scatter':
      return (
        <RC width="100%" height={height}>
          <RechartsScatter data={config.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2456" />
            <XAxis dataKey={config.xKey} stroke="#94a3b8" tick={{ fontSize: 11 }} tickLine={false} name={config.xLabel || config.xKey} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toString()} />
            <YAxis dataKey={config.yKey} stroke="#94a3b8" tick={{ fontSize: 11 }} tickLine={false} name={config.yLabel || config.yKey} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toString()} />
            <Tooltip content={renderTooltip} cursor={{ strokeDasharray: '3 3' }} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
            <Scatter data={config.data} fill="#3b82f6" opacity={0.6} />
          </RechartsScatter>
        </RC>
      );

    case 'area':
      return (
        <RC width="100%" height={height}>
          <RechartsArea data={config.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2456" />
            <XAxis dataKey={config.xKey} stroke="#94a3b8" tick={{ fontSize: 11 }} tickLine={false} />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toString()} />
            <Tooltip content={renderTooltip} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey={config.yKey} stroke="#3b82f6" fill="url(#areaGrad)" strokeWidth={2} />
          </RechartsArea>
        </RC>
      );

    default:
      return null;
  }
}