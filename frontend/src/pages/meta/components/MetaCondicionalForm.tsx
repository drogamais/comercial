import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import {
  metaApi,
  buildCondicionalRows,
  fmtBRL,
  type CondicionalRule,
} from '../../../api/meta.api'

interface Props {
  idParceiro: number
  mesReferencia: string
  onSuccess: () => void
}

export function MetaCondicionalForm({ idParceiro, mesReferencia, onSuccess }: Props) {
  const queryClient = useQueryClient()
  const [base, setBase] = useState<'valor' | 'quantidade'>('valor')
  const [rules, setRules] = useState<CondicionalRule[]>([
    { condicao: '<=', valorGatilho: 0, repasse: 0 },
  ])
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const saveMut = useMutation({
    mutationFn: () => {
      const rows = buildCondicionalRows(rules, base, idParceiro, mesReferencia)
      return metaApi.save({ id_parceiro: idParceiro, mes_referencia: mesReferencia, rows })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['meta-resumo'] })
      setSuccess(`${data.count} regra(s) salva(s) com sucesso!`)
      setError(null)
      onSuccess()
    },
    onError: () => {
      setError('Erro ao salvar regras. Tente novamente.')
      setSuccess(null)
    },
  })

  function addRule() {
    setRules((prev) => [...prev, { condicao: '<=', valorGatilho: 0, repasse: 0 }])
  }

  function removeRule(idx: number) {
    setRules((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateRule(idx: number, field: keyof CondicionalRule, value: string) {
    setRules((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r
        if (field === 'condicao') return { ...r, condicao: value as '<=' | '>' }
        return { ...r, [field]: parseFloat(value) || 0 }
      })
    )
  }

  const preview = buildCondicionalRows(rules, base, idParceiro, mesReferencia)

  return (
    <div className="space-y-6">
      {/* Base selection */}
      <div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Base da Meta</p>
        <div className="flex gap-4">
          {(['valor', 'quantidade'] as const).map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="base"
                value={opt}
                checked={base === opt}
                onChange={() => setBase(opt)}
                className="accent-primary-600"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {opt === 'valor' ? 'Valor (R$)' : 'Quantidade'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Rules table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-zinc-800">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">
                Condição
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">
                {base === 'valor' ? 'Valor (R$)' : 'Quantidade'}
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">
                Repasse (%)
              </th>
              <th className="px-4 py-3 w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {rules.map((rule, idx) => (
              <tr key={idx} className="bg-white dark:bg-zinc-900">
                <td className="px-4 py-2">
                  <select
                    value={rule.condicao}
                    onChange={(e) => updateRule(idx, 'condicao', e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="<=">Menor ou Igual a (&lt;=)</option>
                    <option value=">">Maior que (&gt;)</option>
                  </select>
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    min={0}
                    step={base === 'valor' ? '0.01' : '1'}
                    value={rule.valorGatilho}
                    onChange={(e) => updateRule(idx, 'valorGatilho', e.target.value)}
                    className="w-36 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={rule.repasse}
                    onChange={(e) => updateRule(idx, 'repasse', e.target.value)}
                    className="w-28 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => removeRule(idx)}
                    disabled={rules.length === 1}
                    className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={addRule}
        className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
      >
        <Plus className="h-4 w-4" />
        Adicionar Regra
      </button>

      {/* Preview */}
      {rules.length > 0 && (
        <div className="rounded-lg bg-slate-50 dark:bg-zinc-800 p-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Pré-visualização (texto_bi)
          </p>
          <ul className="space-y-1">
            {preview.map((row, idx) => (
              <li key={idx} className="text-sm text-slate-700 dark:text-slate-300">
                {row.texto_bi}
              </li>
            ))}
          </ul>
        </div>
      )}

      {success && (
        <p className="text-sm text-green-600 dark:text-green-400 font-medium">{success}</p>
      )}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        onClick={() => saveMut.mutate()}
        disabled={saveMut.isPending || rules.length === 0}
        className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
      >
        {saveMut.isPending ? 'Salvando...' : 'Salvar Regras'}
      </button>
    </div>
  )
}
