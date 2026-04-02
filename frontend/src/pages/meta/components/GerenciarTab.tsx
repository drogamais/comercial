import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  metaApi,
  formatMesRef,
  fmtBRL,
  type MetaSummary,
  type MetaRow,
} from '../../../api/meta.api'
import { MetaEditTable } from './MetaEditTable'

interface Props {
  resumo: MetaSummary[]
}

function rebuildTextoBi(row: MetaRow): string {
  if (row.tipo_meta === 'PRODUTO') {
    return `Produto ${row.ean_produto} - Repasse ${row.repasse.toFixed(2).replace('.', ',')}%`
  }
  const isValor = row.tipo_meta.startsWith('VAL_')
  const op = row.operador
  const repTxt = row.repasse.toFixed(2).replace('.', ',') + '%'
  if (isValor) {
    return `Se Sell-in ${op} ${fmtBRL(row.valor_meta)} ⮕ Repasse: ${repTxt}`
  }
  return `Se Qtd ${op} ${Math.round(row.quantidade)} ⮕ Repasse: ${repTxt}`
}

export function GerenciarTab({ resumo }: Props) {
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<string>('')
  const [produtosEdit, setProdutosEdit] = useState<MetaRow[]>([])
  const [condicionaisEdit, setCondicionaisEdit] = useState<MetaRow[]>([])
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [selParceiro, selMes] = selected ? selected.split('|') : ['', '']

  const detalheQuery = useQuery({
    queryKey: ['meta-detalhe', selParceiro, selMes],
    queryFn: () => metaApi.getDetalhe(parseInt(selParceiro), selMes),
    enabled: !!selParceiro && !!selMes,
  })

  // When data loads, sync to edit state
  if (detalheQuery.data && !detalheQuery.isFetching) {
    const prodHash = JSON.stringify(detalheQuery.data.produtos)
    const condHash = JSON.stringify(detalheQuery.data.condicionais)
    const editProdHash = JSON.stringify(produtosEdit)
    const editCondHash = JSON.stringify(condicionaisEdit)
    // Only reset if we got fresh data we haven't loaded yet
    if (prodHash !== editProdHash && produtosEdit.length === 0) {
      setProdutosEdit(detalheQuery.data.produtos)
    }
    if (condHash !== editCondHash && condicionaisEdit.length === 0) {
      setCondicionaisEdit(detalheQuery.data.condicionais)
    }
  }

  function handleSelect(val: string) {
    setSelected(val)
    setProdutosEdit([])
    setCondicionaisEdit([])
    setSaveMsg(null)
    setSaveError(null)
  }

  const saveMut = useMutation({
    mutationFn: () => {
      const mesRef = `${selMes}-01`
      const allRows: MetaRow[] = [
        ...produtosEdit.map((r) => ({ ...r, texto_bi: rebuildTextoBi(r) })),
        ...condicionaisEdit.map((r) => ({ ...r, texto_bi: rebuildTextoBi(r) })),
      ]
      return metaApi.save({
        id_parceiro: parseInt(selParceiro),
        mes_referencia: mesRef,
        rows: allRows,
      })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['meta-detalhe', selParceiro, selMes] })
      queryClient.invalidateQueries({ queryKey: ['meta-resumo'] })
      setSaveMsg(`${data.count} registo(s) guardado(s) com sucesso!`)
      setSaveError(null)
    },
    onError: () => {
      setSaveError('Erro ao guardar. Tente novamente.')
      setSaveMsg(null)
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Selecionar Parceiro / Mês
        </label>
        <select
          value={selected}
          onChange={(e) => handleSelect(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-64"
        >
          <option value="">-- Selecionar --</option>
          {resumo.map((r) => (
            <option key={`${r.id_parceiro}|${r.mes_referencia.substring(0, 7)}`} value={`${r.id_parceiro}|${r.mes_referencia.substring(0, 7)}`}>
              {r.nome_fantasia} | {formatMesRef(r.mes_referencia)}
            </option>
          ))}
        </select>
      </div>

      {detalheQuery.isLoading && (
        <p className="text-sm text-slate-400 animate-pulse">A carregar...</p>
      )}

      {selected && !detalheQuery.isLoading && (
        <>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Metas por Produto
            </h3>
            <MetaEditTable
              tipo="produto"
              rows={produtosEdit.length > 0 ? produtosEdit : (detalheQuery.data?.produtos ?? [])}
              onChange={setProdutosEdit}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Regras Condicionais
            </h3>
            <MetaEditTable
              tipo="condicional"
              rows={condicionaisEdit.length > 0 ? condicionaisEdit : (detalheQuery.data?.condicionais ?? [])}
              onChange={setCondicionaisEdit}
            />
          </div>

          {saveMsg && (
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">{saveMsg}</p>
          )}
          {saveError && <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>}

          <button
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
          >
            {saveMut.isPending ? 'Guardando...' : 'Salvar Tudo'}
          </button>
        </>
      )}

      {!selected && resumo.length === 0 && (
        <p className="text-sm text-slate-400 dark:text-slate-500 italic">
          Nenhuma meta registada ainda.
        </p>
      )}
    </div>
  )
}
