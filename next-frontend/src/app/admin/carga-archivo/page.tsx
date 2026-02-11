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
  CloudUpload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function CargaArchivoPage() {
  const { data: session } = useSession();
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

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setMessage(null);
    setStats(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = (session?.user as any)?.accessToken;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/upload`, {
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

      setMessage({ type: 'success', text: 'Archivo procesado exitosamente.' });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Cargar Archivo de Operaciones</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Importa datos de operaciones desde archivos Excel (.xlsx)
        </p>
      </div>

      <div className="max-w-2xl">
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
                  <div className="rounded-xl bg-muted p-4 mb-4">
                    <CloudUpload className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Arrastra tu archivo aqui
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
                    <div className="rounded-lg bg-primary/10 p-2.5 shrink-0">
                      <FileSpreadsheet className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatFileSize(file.size)}</p>
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
                className="min-w-[160px]"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Cargar Operaciones
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
              {[
                'El archivo debe estar en formato Excel (.xlsx o .xls)',
                'Asegurate de que las columnas coincidan con el formato esperado',
                'Los registros duplicados seran actualizados automaticamente',
                'El proceso puede tardar segun el tamano del archivo',
              ].map((text, i) => (
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
