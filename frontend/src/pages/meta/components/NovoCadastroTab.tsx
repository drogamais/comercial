import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import type { ParceiroExterno } from '../../../api/meta.api'
import { MetaCondicionalForm } from './MetaCondicionalForm'
import { MetaProdutoForm } from './MetaProdutoForm'

interface Props {
  parceiros: ParceiroExterno[]
  onSuccess: () => void
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export function NovoCadastroTab({ parceiros, onSuccess }: Props) {
  const currentYear = new Date().getFullYear()
  const years = [currentYear - 1, currentYear, currentYear + 1]

  const [step, setStep] = useState<'selecao' | 'formulario'>('selecao')
  const [parceiroId, setParceiroId] = useState<number | ''>('')
  const [mesIdx, setMesIdx] = useState<number>(new Date().getMonth())
  const [ano, setAno] = useState<number>(currentYear)
  const [tipo, setTipo] = useState<'condicional' | 'produto'>('condicional')

  // mes_referencia no formato YYYY-MM-01 para o backend
  const mesReferencia = `${ano}-${String(mesIdx + 1).padStart(2, '0')}-01`

  function handleAvancar() {
    if (parceiroId === '') return
    setStep('formulario')
  }

  function handleVoltar() {
    setStep('selecao')
  }

  function handleSuccess() {
    onSuccess()
    setStep('selecao')
    setParceiroId('')
  }

  if (step === 'selecao') {
    return (
      <div className="space-y-6 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Parceiro
          </label>
          <select
            value={parceiroId}
            onChange={(e) => setParceiroId(e.target.value === '' ? '' : parseInt(e.target.value))}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">-- Selecionar parceiro --</option>
            {parceiros.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome_fantasia}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Mês
            </label>
            <select
              value={mesIdx}
              onChange={(e) => setMesIdx(parseInt(e.target.value))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {MESES.map((m, i) => (
                <option key={i} value={i}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Ano
            </label>
            <select
              value={ano}
              onChange={(e) => setAno(parseInt(e.target.value))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleAvancar}
          disabled={parceiroId === ''}
          className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
        >
          Avançar
        </button>
      </div>
    )
  }

  const parceiro = parceiros.find((p) => p.id === parceiroId)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={handleVoltar}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </button>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          <span className="font-medium text-slate-800 dark:text-slate-200">
            {parceiro?.nome_fantasia}
          </span>{' '}
          · {String(mesIdx + 1).padStart(2, '0')}/{ano}
        </div>
      </div>

      {/* Type selection */}
      <div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Tipo de Meta
        </p>
        <div className="flex gap-3">
          {(['condicional', 'produto'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTipo(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                tipo === t
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-primary-400'
              }`}
            >
              {t === 'condicional' ? 'Meta Condicional' : 'Meta por Produto (Excel)'}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        {tipo === 'condicional' ? (
          <MetaCondicionalForm
            idParceiro={parceiroId as number}
            mesReferencia={mesReferencia}
            onSuccess={handleSuccess}
          />
        ) : (
          <MetaProdutoForm
            idParceiro={parceiroId as number}
            mesReferencia={mesReferencia}
            onSuccess={handleSuccess}
          />
        )}
      </div>
    </div>
  )
}
