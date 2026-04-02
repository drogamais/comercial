import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { campanhaApi } from '../../api/campanha.api.ts'
import { campanhaProdutoApi } from '../../api/campanhaProduto.api.ts'
import { FileUploadZone } from '../../components/ui/FileUploadZone.tsx'
import { ArrowLeft } from 'lucide-react'

export function CampanhaUploadPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<{ inserted: number } | null>(null)

  const { data: campanha } = useQuery({
    queryKey: ['campanha', id],
    queryFn: () => campanhaApi.get(parseInt(id!)),
  })

  const uploadMut = useMutation({
    mutationFn: (f: File) => campanhaProdutoApi.upload(parseInt(id!), f),
    onSuccess: (data) => {
      setResult(data)
      setFile(null)
      qc.invalidateQueries({ queryKey: ['produtos', id] })
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (file) uploadMut.mutate(file)
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <Link
          to="/campanhas"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-primary-600 transition-colors uppercase tracking-wider"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 shadow-sm dark:bg-zinc-800 dark:border-slate-700">
            <ArrowLeft className="h-4 w-4" />
          </div>
          Voltar para Campanhas
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
          Upload de Produtos{campanha ? ` — ${campanha.nome}` : ''}
        </h1>
      </div>

      <div className="card">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Seleciona um ficheiro <strong>.xlsx</strong> ou <strong>.xls</strong>.
          Os produtos existentes serão substituídos.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FileUploadZone
            accept=".xlsx,.xls"
            label="Ficheiro Excel"
            currentFilename={file?.name}
            onFileSelect={setFile}
            onRemove={() => setFile(null)}
          />
          {uploadMut.error && (
            <p className="text-red-500 dark:text-red-400 text-sm">{(uploadMut.error as Error).message}</p>
          )}
          {result && (
            <p className="text-green-600 dark:text-green-400 text-sm font-medium">
              {result.inserted} produto(s) importado(s) com sucesso!
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={!file || uploadMut.isPending}
              className="btn-primary disabled:opacity-50"
            >
              {uploadMut.isPending ? 'A importar...' : 'Importar'}
            </button>
            <Link
              to={`/campanhas/${id}/produtos`}
              className="btn-secondary"
            >
              Ver Produtos
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
