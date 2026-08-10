import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataset } from '../context/DatasetContext';
import { AppLayout } from '../components/layout/AppLayout';
import { PageSkeleton } from '../components/ui/LoadingStates';
import { EmptyState } from '../components/ui/EmptyState';
import { Search, ChevronDown, ChevronUp, Eye, EyeOff, Table2, Columns3, ArrowUpDown, Filter, Download } from 'lucide-react';

export default function DataExplorer() {
  const { activeDataset, isLoading } = useDataset();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set());
  const [showColPanel, setShowColPanel] = useState(false);
  const perPage = 25;

  if (isLoading) return <AppLayout onUploadClick={() => navigate('/datasets')}><PageSkeleton /></AppLayout>;
  if (!activeDataset) return (
    <AppLayout onUploadClick={() => navigate('/datasets')}>
      <EmptyState icon="data" title="No Dataset Selected" description="Select or upload a dataset to explore its data." action={{ label: 'Go to Datasets', onClick: () => navigate('/datasets') }} />
    </AppLayout>
  );

  const { columns, data } = activeDataset;

  const toggleCol = (col: string) => {
    setHiddenCols(prev => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col); else next.add(col);
      return next;
    });
  };

  const visibleColumns = columns.filter(c => !hiddenCols.has(c.name));

  const filteredData = useMemo(() => {
    let rows = [...data];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r => visibleColumns.some(c => String(r[c.name] ?? '').toLowerCase().includes(q)));
    }
    if (sortKey) {
      rows.sort((a, b) => {
        const va = a[sortKey], vb = b[sortKey];
        if (va == null) return 1; if (vb == null) return -1;
        if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va;
        return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
      });
    }
    return rows;
  }, [data, search, sortKey, sortDir, visibleColumns]);

  const totalPages = Math.ceil(filteredData.length / perPage);
  const pageData = filteredData.slice(page * perPage, (page + 1) * perPage);

  const handleSort = (col: string) => {
    if (sortKey === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(col); setSortDir('asc'); }
    setPage(0);
  };

  return (
    <AppLayout onUploadClick={() => navigate('/datasets')}>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Data Explorer</h1>
            <p className="text-muted-foreground text-sm">{activeDataset.name} · {activeDataset.rowCount.toLocaleString()} rows × {activeDataset.columnCount} columns</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowColPanel(!showColPanel)} className={`px-3 py-2 text-sm rounded-lg border transition-all cursor-pointer flex items-center gap-2 active:scale-[0.97] ${showColPanel ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-card-border hover:border-primary/40'}`}>
              <Columns3 size={14} /> Columns ({visibleColumns.length}/{columns.length})
            </button>
            <button className="px-3 py-2 text-sm bg-card border border-card-border rounded-lg hover:border-primary/40 transition-all cursor-pointer flex items-center gap-2 active:scale-[0.97]" onClick={() => {}}>
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search across visible columns..."
            className="input pl-10 w-full md:w-96"
          />
        </div>

        {/* Column Toggle Panel */}
        {showColPanel && (
          <div className="card p-3 mb-4 grid grid-cols-2 md:grid-cols-4 gap-1.5 animate-fade-in">
            {columns.map(col => (
              <button key={col.name} onClick={() => toggleCol(col.name)} className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-xs transition-all cursor-pointer ${hiddenCols.has(col.name) ? 'text-muted-foreground bg-muted/30' : 'text-foreground bg-primary/5'}`}>
                {hiddenCols.has(col.name) ? <EyeOff size={12} /> : <Eye size={12} />}
                {col.name}
                <span className="text-[10px] text-muted-foreground ml-auto">{col.type}</span>
              </button>
            ))}
          </div>
        )}

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border bg-muted/20">
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground w-10">#</th>
                  {visibleColumns.map(col => (
                    <th key={col.name} className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none" onClick={() => handleSort(col.name)}>
                      <div className="flex items-center gap-1">
                        {col.name}
                        {sortKey === col.name ? (
                          sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                        ) : <ArrowUpDown size={10} className="opacity-30" />}
                        <span className="text-[10px] text-muted-foreground ml-1">{col.type}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageData.map((row, i) => (
                  <tr key={page * perPage + i} className="border-b border-card-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-2 text-xs text-muted-foreground font-mono">{page * perPage + i + 1}</td>
                    {visibleColumns.map(col => (
                      <td key={col.name} className="px-3 py-2 whitespace-nowrap">
                        <span className="text-xs">{String(row[col.name] ?? '—')}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-3 py-2.5 border-t border-card-border">
            <span className="text-xs text-muted-foreground">
              Showing {page * perPage + 1}–{Math.min((page + 1) * perPage, filteredData.length)} of {filteredData.length.toLocaleString()}
              {filteredData.length !== data.length && ` (filtered from ${data.length.toLocaleString()})`}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-2.5 py-1 text-xs rounded bg-card border border-card-border hover:border-primary/40 transition-all disabled:opacity-30 cursor-pointer disabled:cursor-default">Prev</button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const p = Math.max(0, Math.min(totalPages - 1, page - 2 + i));
                return <button key={p} onClick={() => setPage(p)} className={`px-2.5 py-1 text-xs rounded transition-all cursor-pointer ${p === page ? 'bg-primary text-primary-foreground' : 'bg-card border border-card-border hover:border-primary/40'}`}>{p + 1}</button>;
              })}
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="px-2.5 py-1 text-xs rounded bg-card border border-card-border hover:border-primary/40 transition-all disabled:opacity-30 cursor-pointer disabled:cursor-default">Next</button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}