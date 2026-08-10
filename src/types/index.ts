export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

export interface Dataset {
  id: string;
  userId: string;
  name: string;
  description: string;
  fileName: string;
  fileType: string;
  rowCount: number;
  columnCount: number;
  columns: ColumnInfo[];
  data: Record<string, unknown>[];
  originalData: Record<string, unknown>[];
  profile: DatasetProfile | null;
  createdAt: string;
  updatedAt: string;
}

export interface ColumnInfo {
  name: string;
  type: ColumnType;
  nullable: boolean;
  missingCount: number;
  uniqueCount: number;
  sampleValues: unknown[];
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  sum?: number;
  stdDev?: number;
  isMetric?: boolean;
  isDimension?: boolean;
  isDate?: boolean;
}

export type ColumnType = 'numeric' | 'categorical' | 'date' | 'boolean' | 'text';

export interface DatasetProfile {
  rowCount: number;
  columnCount: number;
  numericColumns: string[];
  categoricalColumns: string[];
  dateColumns: string[];
  booleanColumns: string[];
  textColumns: string[];
  missingValues: Record<string, number>;
  columnInfo: Record<string, ColumnInfo>;
}

export interface KPI {
  id: string;
  label: string;
  value: number;
  formatted: string;
  prefix?: string;
  suffix?: string;
  change?: number;
  changeLabel?: string;
  isPositive?: boolean;
  icon?: string;
}

export interface ChartConfig {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'donut' | 'scatter' | 'area' | 'histogram';
  xKey: string;
  yKey: string;
  xLabel?: string;
  yLabel?: string;
  data: Record<string, unknown>[];
  color?: string;
  groupBy?: string;
}

export interface AIInsight {
  id: string;
  insight: string;
  explanation: string;
  evidence: string;
  businessImpact: string;
  recommendation: string;
  severity: 'positive' | 'negative' | 'neutral';
  category: string;
}

export interface AIQuery {
  question: string;
  intent: string;
  relevantColumns: string[];
  aggregation?: string;
  visualization?: ChartConfig;
  answer: string;
  evidence: string;
  recommendation?: string;
}

export interface Anomaly {
  id: string;
  date?: string;
  metric: string;
  severity: 'high' | 'medium' | 'low';
  expectedValue: number;
  actualValue: number;
  deviation: number;
  explanation: string;
  timestamp: string;
}

export interface Forecast {
  metric: string;
  period: number;
  historicalData: { date: string; value: number }[];
  forecastData: { date: string; value: number; upperBound?: number; lowerBound?: number }[];
  trend: 'up' | 'down' | 'stable';
  confidence: number;
}

export interface Dashboard {
  id: string;
  userId: string;
  datasetId: string;
  name: string;
  configuration: DashboardConfig;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardConfig {
  kpis: string[];
  charts: ChartConfig[];
  filters: FilterState;
}

export interface Report {
  id: string;
  userId: string;
  datasetId: string;
  title: string;
  content: ReportContent;
  createdAt: string;
}

export interface ReportContent {
  executiveSummary: string;
  kpiOverview: KPISummary[];
  majorTrends: string[];
  topProducts: { name: string; revenue: number }[];
  regionalPerformance: { region: string; revenue: number; profit: number }[];
  anomalies: Anomaly[];
  forecast: Forecast | null;
  recommendations: string[];
}

export interface KPISummary {
  label: string;
  value: number;
  formatted: string;
  change?: number;
}

export interface FilterState {
  dateRange?: { start: string; end: string };
  regions?: string[];
  categories?: string[];
  products?: string[];
  salesChannels?: string[];
  searchQuery?: string;
}

export interface AIConversation {
  id: string;
  userId: string;
  datasetId: string;
  question: string;
  answer: string;
  evidence: string;
  recommendation?: string;
  chart?: ChartConfig;
  createdAt: string;
}

export interface CorrelationResult {
  col1: string;
  col2: string;
  value: number;
  strength: 'strong' | 'moderate' | 'weak' | 'none';
  direction: 'positive' | 'negative';
}

export interface SegmentationResult {
  dimension: string;
  segments: {
    name: string;
    count: number;
    metrics: Record<string, number>;
  }[];
}

export interface DistributionResult {
  column: string;
  bins: { min: number; max: number; count: number }[];
  skewness: number;
  normality: string;
}