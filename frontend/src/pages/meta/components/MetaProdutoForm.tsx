import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { FileUploadZone } from '../../../components/ui/FileUploadZone'
import { metaApi } from '../../../api/meta.api'

interface Props {
  idParceiro: number
  mesReferencia: string
  onSuccess: () => void
}

export function MetaProdutoForm({ idParceiro, mesReferencia, onSuccess }: Props) {
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // mes format for API: YYYY-MM from YYYY-MM-01
  const mes = mesReferencia.substring(0, 7)

  const importMut = useMutation({
    mutationFn: () => metaApi.importar(idParceiro, mes, file!),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['meta-resumo'] })
      setSuccess(`${data.count} produto(s) importado(s) com sucesso!`)
      setError(null)
      setFile(null)
      onSuccess()
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Erro ao importar ficheiro.'
      setError(msg)
      setSuccess(null)
    },
  })

  return (
    <div className="space-y-6">
      {/* Step 1: Download template */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-3">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          1. Descarregar o modelo Excel
        </p>
        <div className="overflow-x-auto">
          <table className="text-xs border border-slate-200 dark:border-slate-700 rounded">
            <thead className="bg-slate-50 dark:bg-zinc-800">
              <tr>
                {['EAN', 'VALOR_META', 'QUANTIDADE', 'REPASSE'].map((col) => (
                  <th
                    key={col}
                    className="px-3 py-2 font-medium text-slate-600 dark:text-slate-400 border-r last:border-r-0 border-slate-200 dark:border-slate-700"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white dark:bg-zinc-900 text-slate-400 dark:text-slate-500 italic">
                {['7891234567890', '1500.00', '10', '1.5'].map((val, i) => (
                  <td
                    key={i}
                    className="px-3 py-2 border-r last:border-r-0 border-slate-200 dark:border-slate-700"
                  >
                    {val}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Não altere o nome das colunas.
        </p>
        <a
          href={`${import.meta.env.VITE_API_BASE_URL || ''}/api/metas/modelo`}
          download="modelo_metas.xlsx"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
        >
          <Download className="h-4 w-4" />
          Descarregar Modelo
        </a>
      </div>

      {/* Step 2: Upload */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-4">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          2. Preencher e importar
        </p>
        <FileUploadZone
          accept=".xlsx,.xls"
          label="Ficheiro Excel"
          currentFilename={file?.name ?? null}
          onFileSelect={setFile}
          onRemove={() => setFile(null)}
        />

        {success && (
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">{success}</p>
        )}
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button
          onClick={() => importMut.mutate()}
          disabled={!file || importMut.isPending}
          className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
        >
          {importMut.isPending ? 'Importando...' : 'Confirmar e Importar'}
        </button>
      </div>
    </div>
  )
}
