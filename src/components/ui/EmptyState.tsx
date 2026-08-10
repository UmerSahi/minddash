import { Upload, FileSpreadsheet, Search } from 'lucide-react';

interface EmptyStateProps {
  icon?: 'upload' | 'data' | 'search' | 'generic';
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon = 'generic', title, description, action }: EmptyStateProps) {
  const icons = {
    upload: <Upload size={48} className="text-primary" />,
    data: <FileSpreadsheet size={48} className="text-primary" />,
    search: <Search size={48} className="text-primary" />,
    generic: <FileSpreadsheet size={48} className="text-primary" />,
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
        {icons[icon]}
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm text-center max-w-md mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-all cursor-pointer font-medium text-sm active:scale-[0.97]"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}