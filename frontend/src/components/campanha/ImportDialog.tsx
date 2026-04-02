import React, { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ImportDialogProps {
  campanhaId: number;
  onSuccess: () => void;
  onClose: () => void;
}

export function ImportDialog({ campanhaId, onSuccess, onClose }: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setStatus('idle');
        setMessage('');
      } else {
        setStatus('error');
        setMessage('Por favor, selecione um ficheiro .xlsx ou .csv');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus('uploading');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      await axios.post(`${baseUrl}/api/campanhas/${campanhaId}/importar`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setStatus('success');
      setMessage('Produtos importados com sucesso!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setMessage(err.response?.data?.error || 'Erro ao importar ficheiro');
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setStatus('idle');
        setMessage('');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="card w-full max-w-md animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Importar Planilha</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div 
          className={cn(
            "relative group border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center text-center cursor-pointer",
            file ? "border-primary-500 bg-primary-50/30 dark:bg-primary-500/5" : "border-slate-200 hover:border-primary-400 dark:border-slate-800",
            status === 'error' && "border-red-300 bg-red-50/30 dark:bg-red-500/5"
          )}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".xlsx,.csv"
          />
          
          {file ? (
            <>
              <div className="h-16 w-16 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-600 mb-4 dark:bg-primary-500/20 dark:text-primary-400">
                <FileText className="h-8 w-8" />
              </div>
              <p className="font-bold text-slate-900 dark:text-white truncate max-w-full px-4">
                {file.name}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </>
          ) : (
            <>
              <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-4 group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors dark:bg-zinc-800">
                <Upload className="h-8 w-8" />
              </div>
              <p className="font-bold text-slate-900 dark:text-white">Arraste seu arquivo aqui</p>
              <p className="text-sm text-slate-500 mt-1">ou clique para selecionar (.xlsx, .csv)</p>
            </>
          )}
        </div>

        {status === 'error' && (
          <div className="mt-4 flex items-center gap-2 text-sm font-medium text-red-600 animate-in slide-in-from-top-1">
            <AlertCircle className="h-4 w-4" />
            {message}
          </div>
        )}

        {status === 'success' && (
          <div className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-600 animate-in slide-in-from-top-1">
            <CheckCircle2 className="h-4 w-4" />
            {message}
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <button 
            onClick={onClose}
            className="btn-secondary flex-1"
            disabled={status === 'uploading'}
          >
            Cancelar
          </button>
          <button 
            onClick={handleUpload}
            className="btn-primary flex-1"
            disabled={!file || status === 'uploading' || status === 'success'}
          >
            {status === 'uploading' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : 'Fazer Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}
