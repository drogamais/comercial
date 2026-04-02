import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { metaApi } from '../../api/meta.api'
import { NovoCadastroTab } from './components/NovoCadastroTab'
import { GerenciarTab } from './components/GerenciarTab'

type Tab = 'novo' | 'gerenciar'

export function MetaPage() {
  const [activeTab, setActiveTab] = useState<Tab>('novo')

  const parceirosQuery = useQuery({
    queryKey: ['meta-parceiros'],
    queryFn: metaApi.listParceiros,
  })

  const resumoQuery = useQuery({
    queryKey: ['meta-resumo'],
    queryFn: metaApi.listResumo,
  })

  function handleNovoCadastroSuccess() {
    // After saving, switch to gerenciar so user can review
    resumoQuery.refetch()
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'novo', label: 'Novo Cadastro' },
    { key: 'gerenciar', label: 'Gerenciar / Editar' },
  ]

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cadastro de Metas</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Gerir metas condicionais e por produto para parceiros.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'novo' && (
          <NovoCadastroTab
            parceiros={parceirosQuery.data ?? []}
            onSuccess={handleNovoCadastroSuccess}
          />
        )}
        {activeTab === 'gerenciar' && (
          <GerenciarTab resumo={resumoQuery.data ?? []} />
        )}
      </div>
    </div>
  )
}
