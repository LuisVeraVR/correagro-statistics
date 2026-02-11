'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Upload, FileUp, AlertCircle, CheckCircle, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ArchivosHistoricosPage() {
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [stats, setStats] = useState<{ count: number } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage(null);
      setStats(null);
    }
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

      setMessage({ type: 'success', text: 'Archivo histórico procesado exitosamente.' });
      setStats({ count: data.count });
      setFile(null);
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-6 w-6" />
            Cargar Archivos Históricos
          </CardTitle>
          <CardDescription>
            Sube los archivos Excel (.xlsx) con las operaciones históricas (2023, 2024, 2025, etc.).
            Asegúrate de que el formato coincida con el de las cargas diarias.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-10 bg-gray-50 hover:bg-gray-100 transition-colors">
            <FileUp className="h-10 w-10 text-gray-400 mb-4" />
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                Seleccionar Archivo Histórico
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
            {file && (
              <p className="mt-4 text-sm text-gray-600 font-medium">
                {file.name}
              </p>
            )}
            {!file && (
              <p className="mt-2 text-xs text-gray-500">
                Solo archivos .xlsx (uno a la vez)
              </p>
            )}
          </div>

          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className={message.type === 'success' ? 'border-green-500 text-green-700 bg-green-50' : ''}>
              {message.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
              <AlertTitle>{message.type === 'error' ? 'Error' : 'Éxito'}</AlertTitle>
              <AlertDescription>
                {message.text}
                {stats && (
                  <div className="mt-2 font-semibold">
                    Se importaron {stats.count} registros históricos.
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button 
              onClick={handleUpload} 
              disabled={!file || uploading}
              className="w-full sm:w-auto"
            >
                {uploading ? 'Procesando Histórico...' : 'Cargar Histórico'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
