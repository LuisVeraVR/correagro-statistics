'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  Upload,
  FileUp,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  X,
  Loader2,
  UploadCloud,
  CalendarDays,
  History,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type UploadMode = 'daily' | 'historic';

export default function CargaArchivoPage() {
  const { data: session } = useSession();
  const [mode, setMode] = useState<UploadMode>('daily');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [stats, setStats] = useState<{ count: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage(null);
      setStats(null);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      setFile(droppedFile);
      setMessage(null);
      setStats(null);
    } else {
      setMessage({ type: 'error', text: 'Solo se aceptan archivos Excel (.xlsx, .xls)' });
    }
  }, []);

  const removeFile = () => {
    setFile(null);
    setMessage(null);
    setStats(null);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const switchMode = (newMode: UploadMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    setFile(null);
    setMessage(null);
    setStats(null);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setMessage(null);
    setStats(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = (session?.user as any)?.accessToken;
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${API_URL}/transactions/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al cargar el archivo');
      }

      const label = mode === 'daily' ? 'diario' : 'historico';
      setMessage({ type: 'success', text: `Archivo ${label} procesado exitosamente.` });
      setStats({ count: data.count });
      setFile(null);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const modeConfig = {
    daily: {
      title: 'Operaciones Diarias',
      description: 'Importa las operaciones del dia desde un archivo Excel',
      dropLabel: 'Arrastra el archivo diario aqui',
      buttonLabel: 'Cargar Operaciones',
      processingLabel: 'Procesando...',
      instructions: [
        'El archivo debe contener las operaciones del dia en formato .xlsx o .xls',
        'Asegurate de que las columnas coincidan con el formato esperado',
        'Los registros duplicados seran actualizados automaticamente',
        'El archivo sera validado antes del procesamiento',
      ],
    },
    historic: {
      title: 'Archivos Historicos',
      description: 'Importa operaciones de periodos pasados (2023, 2024, etc.)',
      dropLabel: 'Arrastra el archivo historico aqui',
      buttonLabel: 'Cargar Historico',
      processingLabel: 'Procesando historico...',
      instructions: [
        'Sube archivos Excel con operaciones de anos anteriores',
        'Utiliza el mismo formato que las cargas diarias',
        'Los registros duplicados seran actualizados automaticamente',
        'El proceso puede tardar mas segun el volumen de datos',
      ],
    },
  };

  const config = modeConfig[mode];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Cargar Archivos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Importa datos de operaciones diarias o archivos historicos
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => switchMode('daily')}
          className={`flex items-center gap-2.5 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
            mode === 'daily'
              ? 'border-primary bg-primary/5 text-primary shadow-sm'
              : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground'
          }`}
        >
          <CalendarDays className="h-4 w-4" />
          Operaciones Diarias
        </button>
        <button
          onClick={() => switchMode('historic')}
          className={`flex items-center gap-2.5 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
            mode === 'historic'
              ? 'border-primary bg-primary/5 text-primary shadow-sm'
              : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground'
          }`}
        >
          <History className="h-4 w-4" />
          Archivos Historicos
        </button>
      </div>

      <div className="max-w-2xl">
        {/* Context banner */}
        <div className={`flex items-start gap-3 rounded-lg border p-4 mb-4 transition-colors duration-200 ${
          mode === 'daily' ? 'border-primary/20 bg-primary/5' : 'border-amber-500/20 bg-amber-500/5'
        }`}>
          <Info className={`h-4 w-4 mt-0.5 shrink-0 ${
            mode === 'daily' ? 'text-primary' : 'text-amber-600'
          }`} />
          <div>
            <p className={`text-sm font-medium ${
              mode === 'daily' ? 'text-primary' : 'text-amber-700'
            }`}>
              {config.title}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {config.description}
            </p>
          </div>
        </div>

        {/* Upload area */}
        <Card>
          <CardContent className="p-6">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-all duration-200 ${
                isDragging
                  ? 'border-primary bg-primary/5 scale-[1.01]'
                  : file
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border bg-muted/20 hover:border-muted-foreground/30 hover:bg-muted/40'
              }`}
            >
              {!file ? (
                <>
                  <div className={`p-4 rounded-full transition-colors ${
                    mode === 'daily' ? 'bg-muted' : 'bg-amber-500/10'
                  }`}>
                    <UploadCloud className={`h-8 w-8 ${
                      mode === 'daily' ? 'text-muted-foreground' : 'text-amber-600'
                    }`} />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    {config.dropLabel}
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    o selecciona un archivo de tu computador
                  </p>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                      <FileUp className="h-4 w-4" />
                      Seleccionar Archivo
                    </span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept=".xlsx, .xls"
                      onChange={handleFileChange}
                      disabled={uploading}
                    />
                  </label>
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    Formatos aceptados: .xlsx, .xls
                  </p>
                </>
              ) : (
                <div className="w-full">
                  <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
                    <div className={`rounded-lg p-2.5 shrink-0 ${
                      mode === 'daily' ? 'bg-primary/10' : 'bg-amber-500/10'
                    }`}>
                      <FileSpreadsheet className={`h-6 w-6 ${
                        mode === 'daily' ? 'text-primary' : 'text-amber-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          mode === 'daily'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-amber-500/10 text-amber-700'
                        }`}>
                          {mode === 'daily' ? 'Diario' : 'Historico'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Messages */}
            {message && (
              <div
                className={`mt-4 flex items-start gap-3 rounded-lg border p-4 animate-scale-in ${
                  message.type === 'error'
                    ? 'border-destructive/20 bg-destructive/5'
                    : 'border-primary/20 bg-primary/5'
                }`}
              >
                {message.type === 'error' ? (
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`text-sm font-medium ${message.type === 'error' ? 'text-destructive' : 'text-primary'}`}>
                    {message.type === 'error' ? 'Error' : 'Carga Exitosa'}
                  </p>
                  <p className={`text-sm mt-0.5 ${message.type === 'error' ? 'text-destructive/80' : 'text-foreground/70'}`}>
                    {message.text}
                  </p>
                  {stats && (
                    <p className="text-sm font-semibold text-primary mt-1.5">
                      Se importaron {stats.count.toLocaleString()} registros.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Upload button */}
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="min-w-[180px]"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {config.processingLabel}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    {config.buttonLabel}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-4">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Instrucciones</h3>
            <ul className="space-y-2">
              {config.instructions.map((text, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
