interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  isProcessing?: boolean;
  progress?: string;
}

export function FileUploadZone({ onFileSelect, isProcessing, progress }: FileUploadZoneProps) {
  const handleDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) onFileSelect(file);
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <label className={`block border-2 border-dashed border-border rounded-xl p-8 md:p-12 text-center cursor-pointer transition-all ${isProcessing ? 'pointer-events-none opacity-70' : 'hover:border-primary/50 hover:bg-primary/5'}`}
      onDragOver={handleDrag} onDrop={handleDrop}>
      <input type="file" accept=".csv" onChange={handleChange} className="hidden" disabled={isProcessing} />
      <div className="flex flex-col items-center gap-3">
        <div className={`w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center ${isProcessing ? 'animate-pulse' : ''}`}>
          <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>
        {isProcessing ? (
          <div className="space-y-2">
            <p className="text-foreground font-medium">{progress || 'Processing...'}</p>
            <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        ) : (
          <>
            <p className="text-foreground font-medium">Drop your dataset here or browse files</p>
            <p className="text-muted-foreground text-sm">Supports CSV files</p>
          </>
        )}
      </div>
    </label>
  );
}