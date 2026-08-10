import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Dataset, Dashboard, FilterState, ChartConfig, KPI, AIInsight, Anomaly, Forecast, Report, AIConversation } from '../types';
import { getItem, setItem, getUserStorageKey } from '../utils/storage';
import { useAuth } from './AuthContext';
import { generateDemoData, DEMO_DATASET_META } from '../services/demoData';
import { processDataset } from '../services/dataProcessor';
import { v4 as uuid } from 'uuid';

interface DatasetContextType {
  datasets: Dataset[];
  activeDataset: Dataset | null;
  activeDashboard: Dashboard | null;
  kpis: KPI[];
  charts: ChartConfig[];
  insights: AIInsight[];
  anomalies: Anomaly[];
  forecast: Forecast | null;
  conversations: AIConversation[];
  filters: FilterState;
  reports: Report[];
  isLoading: boolean;
  setActiveDataset: (id: string) => void;
  uploadDataset: (file: File) => Promise<Dataset>;
  addDemoDataset: () => Dataset;
  deleteDataset: (id: string) => void;
  renameDataset: (id: string, name: string) => void;
  duplicateDataset: (id: string) => void;
  setFilters: (filters: FilterState) => void;
  clearFilters: () => void;
  addConversation: (conv: AIConversation) => void;
  addReport: (report: Report) => void;
  updateDashboard: (config: { kpis: KPI[]; charts: ChartConfig[] }) => void;
}

const DatasetContext = createContext<DatasetContextType | null>(null);

export function DatasetProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [activeDataset, setActiveDatasetState] = useState<Dataset | null>(null);
  const [filters, setFiltersState] = useState<FilterState>({});
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Derived state from active dataset
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [activeDashboard, setActiveDashboard] = useState<Dashboard | null>(null);

  // Load datasets on mount
  useEffect(() => {
    if (!user) return;
    const key = getUserStorageKey(user.id, 'datasets');
    const stored = getItem<Dataset[]>(key);
    if (stored) {
      setDatasets(stored);
      // Restore last active dataset
      const lastActive = getItem<string>(getUserStorageKey(user.id, 'active_dataset'));
      if (lastActive) {
        const found = stored.find(d => d.id === lastActive);
        if (found) setActiveDatasetState(found);
      }
    }
    // Load conversations
    const convs = getItem<AIConversation[]>(getUserStorageKey(user.id, 'conversations'));
    if (convs) setConversations(convs);
    // Load reports
    const rpts = getItem<Report[]>(getUserStorageKey(user.id, 'reports'));
    if (rpts) setReports(rpts);
    setIsLoading(false);
  }, [user]);

  // Persist datasets
  useEffect(() => {
    if (!user) return;
    setItem(getUserStorageKey(user.id, 'datasets'), datasets);
  }, [datasets, user]);

  // Persist conversations
  useEffect(() => {
    if (!user) return;
    setItem(getUserStorageKey(user.id, 'conversations'), conversations);
  }, [conversations, user]);

  // Persist reports
  useEffect(() => {
    if (!user) return;
    setItem(getUserStorageKey(user.id, 'reports'), reports);
  }, [reports, user]);

  // Recalculate when dataset or filters change
  useEffect(() => {
    if (!activeDataset) {
      setKpis([]); setCharts([]); setInsights([]); setAnomalies([]); setForecast(null);
      setActiveDashboard(null);
      return;
    }

    import('../services/analyticsEngine').then(({ calculateKPIs, generateCharts, filterData }) => {
      const filteredData = { ...activeDataset, data: filterData(activeDataset.data, filters) };
      const kpiResults = calculateKPIs(filteredData, filters);
      const chartResults = generateCharts(filteredData);
      setKpis(kpiResults);
      setCharts(chartResults);
    });

    import('../services/insightEngine').then(({ generateInsights, detectAnomalies, generateForecast }) => {
      setInsights(generateInsights(activeDataset));
      setAnomalies(detectAnomalies(activeDataset));
      const fore = generateForecast(activeDataset, 'revenue', 30);
      if (!fore) {
        const fore2 = generateForecast(activeDataset, 'profit', 30);
        setForecast(fore2);
      } else {
        setForecast(fore);
      }
    });

    setActiveDashboard({
      id: 'active',
      userId: user?.id || '',
      datasetId: activeDataset.id,
      name: `${activeDataset.name} Dashboard`,
      configuration: { kpis: [], charts: [], filters },
      createdAt: activeDataset.createdAt,
      updatedAt: new Date().toISOString(),
    });

    setItem(getUserStorageKey(user?.id || '', 'active_dataset'), activeDataset.id);
  }, [activeDataset, filters, user]);

  const setActiveDataset = useCallback((id: string) => {
    const found = datasets.find(d => d.id === id);
    if (found) {
      setActiveDatasetState(found);
      setFiltersState({});
    }
  }, [datasets]);

  const uploadDataset = useCallback(async (file: File): Promise<Dataset> => {
    if (!user) throw new Error('Not authenticated');
    const { processUploadedFile } = await import('../services/dataProcessor');
    const dataset = await processUploadedFile(file, user.id);
    setDatasets(prev => [...prev, dataset]);
    setActiveDatasetState(dataset);
    return dataset;
  }, [user]);

  const addDemoDataset = useCallback(() => {
    if (!user) throw new Error('Not authenticated');
    const demoData = generateDemoData(500);
    const csvHeader = Object.keys(demoData[0]).join(',');
    const csvRows = demoData.map(r => Object.values(r).join(',')).join('\n');
    const csvText = csvHeader + '\n' + csvRows;
    const dataset = processDataset(DEMO_DATASET_META.name, DEMO_DATASET_META.description, csvText, user.id);
    setDatasets(prev => [...prev, dataset]);
    setActiveDatasetState(dataset);
    return dataset;
  }, [user]);

  const deleteDataset = useCallback((id: string) => {
    setDatasets(prev => prev.filter(d => d.id !== id));
    if (activeDataset?.id === id) {
      setActiveDatasetState(null);
      removeItem(getUserStorageKey(user?.id || '', 'active_dataset'));
    }
  }, [activeDataset, user]);

  const renameDataset = useCallback((id: string, name: string) => {
    setDatasets(prev => prev.map(d => d.id === id ? { ...d, name, updatedAt: new Date().toISOString() } : d));
  }, []);

  const duplicateDataset = useCallback((id: string) => {
    const ds = datasets.find(d => d.id === id);
    if (ds) {
      const copy: Dataset = {
        ...ds,
        id: uuid(),
        name: `${ds.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setDatasets(prev => [...prev, copy]);
    }
  }, [datasets]);

  const setFilters = useCallback((newFilters: FilterState) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState({});
  }, []);

  const addConversation = useCallback((conv: AIConversation) => {
    setConversations(prev => [...prev, conv]);
  }, []);

  const addReport = useCallback((report: Report) => {
    setReports(prev => [...prev, report]);
  }, []);

  const updateDashboard = useCallback((config: { kpis: KPI[]; charts: ChartConfig[] }) => {
    // Dashboard is derived, no need to persist
  }, []);

  return (
    <DatasetContext.Provider value={{
      datasets, activeDataset, activeDashboard, kpis, charts, insights, anomalies, forecast,
      conversations, filters, reports, isLoading,
      setActiveDataset, uploadDataset, addDemoDataset, deleteDataset, renameDataset, duplicateDataset,
      setFilters, clearFilters, addConversation, addReport, updateDashboard,
    }}>
      {children}
    </DatasetContext.Provider>
  );
}

function removeItem(key: string) {
  localStorage.removeItem(key);
}

export function useDataset(): DatasetContextType {
  const ctx = useContext(DatasetContext);
  if (!ctx) throw new Error('useDataset must be used within DatasetProvider');
  return ctx;
}