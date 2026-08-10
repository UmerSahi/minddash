import { useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Database, TrendingUp, Bot, LineChart, FileText, FolderOpen, Settings, LayoutDashboard, Upload, Sparkles, Menu, X } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { useState } from 'react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/data-explorer', label: 'Data Explorer', icon: Database },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/ai-analyst', label: 'AI Analyst', icon: Bot },
  { path: '/forecasts', label: 'Forecasts', icon: LineChart },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/datasets', label: 'Datasets', icon: FolderOpen },
  { path: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  onUploadClick: () => void;
}

export function Sidebar({ onUploadClick }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-card-border hover:bg-card-hover transition-all cursor-pointer"
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-card border-r border-card-border
        transform transition-transform duration-300 ease-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        <div className="p-5 border-b border-card-border">
          <Logo size="sm" showTagline />
        </div>

        <div className="p-3">
          <button
            onClick={() => { onUploadClick(); setMobileOpen(false); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-all cursor-pointer font-medium text-sm active:scale-[0.98]"
          >
            <Upload size={16} />
            Upload Dataset
          </button>
        </div>

        <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto scrollbar-hide">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary/15 text-primary font-medium border-l-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-card-border">
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
            <Sparkles size={12} className="text-accent" />
            <span>Powered by MindDash AI</span>
          </div>
        </div>
      </aside>
    </>
  );
}

interface AppLayoutProps {
  children: React.ReactNode;
  onUploadClick: () => void;
}

export function AppLayout({ children, onUploadClick }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar onUploadClick={onUploadClick} />
      <main className="flex-1 lg:ml-0 min-w-0 overflow-x-hidden">
        <div className="p-4 lg:p-6 pt-16 lg:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}