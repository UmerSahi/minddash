import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataset } from '../context/DatasetContext';
import { AppLayout } from '../components/layout/AppLayout';
import { FileUploadZone } from '../components/ui/FileUploadZone';
import { PageSkeleton } from '../components/ui/LoadingStates';
import { EmptyState } from '../components/ui/EmptyState';
import { FileSpreadsheet, MoreVertical, Pencil, Copy, Trash2, Check, X, Upload, Loader2, Search } from 'lucide-react';

export default function Datasets() {
  const { datasets, activeDataset, setActiveDataset, uploadDataset, addDemoDataset, deleteDataset, renameDataset, duplicateDataset, isLoading } = useDataset();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [search, setSearch] = useState('');

  if (isLoading) return <AppLayout onUploadClick={() => {}}><PageSkeleton /></AppLayout>;

  const handleFile = async (file: File) => {
    setIsProcessing(true);
    setProgress(`Processing ${file.name}...`);
    try {
      await uploadDataset(file);
      setProgress('Dataset ready!');
      setTimeout(() => setIsProcessing(false), 600);
    } catch (e) {
      setProgress('Failed to process file');
      setTimeout(() => setIsProcessing(false), 1500);
    }
  };

  const handleDemo = () => {
    try {
      addDemoDataset();
    } catch {
      navigate('/signup');
    }
  };

  const filtered = datasets.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppLayout onUploadClick={() => {}}>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Datasets</h1>
            <p className="text-muted-foreground text-sm">Upload, manage, and organize your data</p>
          </div>
          <button onClick={handleDemo} className="px-4 py-2 bg-card border border-card-border rounded-lg hover:border-primary/40 transition-all cursor-pointer text-sm flex items-center gap-2 active:scale-[0.97]">
            <FileSpreadsheet size={14} className="text-primary" /> Add Demo Dataset
          </button>
        </div>

        {/* Upload Zone */}
        <div className="mb-8">
          <FileUploadZone onFileSelect={handleFile} isProcessing={isProcessing} progress={progress} />
        </div>

        {/* Search */}
        {datasets.length > 0 && (
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search datasets..." className="input pl-10 w-full md:w-96" />
          </div>
        )}

        {/* Dataset Grid */}
        {filtered.length === 0 && datasets.length === 0 ? (
          <EmptyState
            icon="upload"
            title="No Datasets Yet"
            description="Upload a CSV file or add the demo dataset to start exploring your data."
            action={{ label: 'Add Demo Dataset', onClick: handleDemo }}
          />
        ) : filtered.length === 0 ? (
          <EmptyState icon="search" title="No Matching Datasets" description={`No datasets match "${search}". Try a different search.`} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(ds => {
              const isActive = activeDataset?.id === ds.id;
              const isEditing = editingId === ds.id;
              return (
                <div key={ds.id} className={`card p-4 relative transition-all hover:translate-y-[-2px] ${isActive ? 'border-primary/40 ring-1 ring-primary/20' : ''}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileSpreadsheet size={18} className="text-primary" />
                      </div>
                      <div>
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input value={editName} onChange={e => setEditName(e.target.value)} className="input text-sm py-1 px-2 w-32" autoFocus />
                            <button onClick={() => { renameDataset(ds.id, editName); setEditingId(null); }} className="text-success hover:opacity-70 cursor-pointer p-1"><Check size={14} /></button>
                            <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:opacity-70 cursor-pointer p-1"><X size={14} /></button>
                          </div>
                        ) : (
                          <h3 className="font-semibold text-sm">{ds.name}</h3>
                        )}
                        <p className="text-xs text-muted-foreground">{new Date(ds.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="relative">
                      <button onClick={() => setMenuFor(menuFor === ds.id ? null : ds.id)} className="p-1.5 rounded-lg hover:bg-muted/50 transition-all cursor-pointer text-muted-foreground">
                        <MoreVertical size={16} />
                      </button>
                      {menuFor === ds.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuFor(null)} />
                          <div className="absolute right-0 top-8 z-20 w-40 card p-1.5 shadow-xl animate-fade-in">
                            {[
                              { icon: Pencil, label: 'Rename', fn: () => { setEditingId(ds.id); setEditName(ds.name); setMenuFor(null); } },
                              { icon: Copy, label: 'Duplicate', fn: () => { duplicateDataset(ds.id); setMenuFor(null); } },
                              { icon: Trash2, label: 'Delete', fn: () => { deleteDataset(ds.id); setMenuFor(null); } },
                            ].map((item, i) => (
                              <button key={i} onClick={item.fn} className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs transition-all cursor-pointer ${item.label === 'Delete' ? 'text-destructive hover:bg-destructive/10' : 'hover:bg-muted/50'}`}>
                                <item.icon size={13} /> {item.label}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <span>{ds.rowCount.toLocaleString()} rows</span>
                    <span>{ds.columnCount} cols</span>
                    <span className="capitalize">{ds.fileType}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => { setActiveDataset(ds.id); navigate('/dashboard'); }}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer active:scale-[0.97] ${isActive ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                    >
                      {isActive ? 'Active' : 'Open Dashboard'}
                    </button>
                    <button onClick={() => { setActiveDataset(ds.id); navigate('/data-explorer'); }} className="px-3 py-2 rounded-lg text-xs bg-card border border-card-border hover:border-primary/40 transition-all cursor-pointer active:scale-[0.97]">
                      Explore
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}