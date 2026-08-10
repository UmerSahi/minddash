import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDataset } from '../context/DatasetContext';
import { AppLayout } from '../components/layout/AppLayout';
import { User, Mail, Save, LogOut, Trash2, Database, Shield, ChevronRight, Loader2 } from 'lucide-react';

export default function Settings() {
  const { user, updateProfile, logout } = useAuth();
  const { datasets, deleteDataset, clearFilters } = useDataset();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      updateProfile({ name });
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 400);
  };

  const handleLogout = () => {
    clearFilters();
    logout();
    navigate('/');
  };

  const handleDeleteAll = () => {
    if (!window.confirm('Delete all datasets? This cannot be undone.')) return;
    [...datasets].forEach(d => deleteDataset(d.id));
  };

  return (
    <AppLayout onUploadClick={() => navigate('/datasets')}>
      <div className="animate-fade-in max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        {/* Profile */}
        <div className="card p-6 mb-6">
          <h2 className="text-sm font-semibold mb-4">Profile</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary shrink-0">
                {(name || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-sm">{name || 'Your Name'}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5">Display Name</label>
              <div className="relative max-w-sm">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="input pl-10 w-full" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5">Email</label>
              <div className="relative max-w-sm">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="email" value={user?.email || ''} disabled className="input pl-10 w-full opacity-60 cursor-not-allowed" />
              </div>
            </div>

            <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-all cursor-pointer text-sm flex items-center gap-2 disabled:opacity-50 active:scale-[0.97]">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Data */}
        <div className="card p-6 mb-6">
          <h2 className="text-sm font-semibold mb-1 flex items-center gap-2"><Database size={14} className="text-primary" /> Data</h2>
          <p className="text-xs text-muted-foreground mb-4">Manage your stored datasets.</p>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-card-border">
            <div>
              <p className="text-sm font-medium">{datasets.length} dataset{datasets.length !== 1 ? 's' : ''}</p>
              <p className="text-xs text-muted-foreground">{datasets.reduce((sum, d) => sum + d.rowCount, 0).toLocaleString()} total rows</p>
            </div>
            <button onClick={handleDeleteAll} className="px-3 py-2 text-xs text-destructive bg-destructive/10 rounded-lg hover:bg-destructive/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.97]">
              <Trash2 size={13} /> Delete All
            </button>
          </div>
        </div>

        {/* Account */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2"><Shield size={14} className="text-primary" /> Account</h2>
          <button onClick={handleLogout} className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-card-border hover:border-destructive/40 hover:bg-destructive/5 transition-all cursor-pointer text-sm">
            <span className="flex items-center gap-2 text-destructive"><LogOut size={15} /> Sign Out</span>
            <ChevronRight size={15} className="text-muted-foreground" />
          </button>
        </div>
      </div>
    </AppLayout>
  );
}