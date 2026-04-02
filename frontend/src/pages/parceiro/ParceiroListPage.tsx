import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { parceiroApi, type Parceiro } from '../../api/parceiro.api.ts'
import { Modal } from '../../components/ui/Modal.tsx'
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal.tsx'
import { FileUploadZone } from '../../components/ui/FileUploadZone.tsx'

export function ParceiroListPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState<Parceiro | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Parceiro | null>(null)
  const [passwordTarget, setPasswordTarget] = useState<Parceiro | null>(null)

  const { data: parceiros = [], isLoading } = useQuery({
    queryKey: ['parceiros'],
    queryFn: () => parceiroApi.list(),
  })

  const { data: nomesAjustados = [] } = useQuery({
    queryKey: ['nomesAjustados'],
    queryFn: parceiroApi.nomesAjustados,
  })

  const createMut = useMutation({
    mutationFn: (fd: FormData) => parceiroApi.create(fd),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['parceiros'] }); setShowCreate(false) },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, fd }: { id: number; fd: FormData }) => parceiroApi.update(id, fd),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['parceiros'] }); setEditTarget(null) },
  })

  const deleteMut = useMutation({
    mutationFn: ({ id, senha }: { id: number; senha: string }) => parceiroApi.delete(id, senha),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['parceiros'] }); setDeleteTarget(null) },
  })

  const passwordMut = useMutation({
    mutationFn: ({ id, nova, confirmar }: { id: number; nova: string; confirmar: string }) =>
      parceiroApi.setPassword(id, nova, confirmar),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['parceiros'] }); setPasswordTarget(null) },
  })

  function daysUntilExpiry(p: Parceiro): number | null {
    if (!p.dataSaida) return null
    return Math.ceil((new Date(p.dataSaida).getTime() - Date.now()) / 86400000)
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Parceiros</h1>
        <div className="flex gap-2">
          <a href={parceiroApi.exportUrl()} className="btn-secondary text-sm">Exportar Excel</a>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">+ Novo Parceiro</button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-slate-500 dark:text-slate-400">A carregar...</p>
      ) : (
        <div className="card !p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/50 dark:bg-zinc-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                <th className="px-4 py-3 text-left font-semibold">Nome Ajustado</th>
                <th className="px-4 py-3 text-left font-semibold">Nome Fantasia</th>
                <th className="px-4 py-3 text-left font-semibold">Gestor</th>
                <th className="px-4 py-3 text-left font-semibold">Validade</th>
                <th className="px-4 py-3 text-left font-semibold">Senha</th>
                <th className="px-4 py-3 text-left font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {parceiros.map((p) => {
                const days = daysUntilExpiry(p)
                const expiring = days !== null && days <= 30
                return (
                  <tr key={p.id} className={`hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors ${expiring ? 'bg-amber-50 dark:bg-amber-500/10' : ''}`}>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.tipo === 'INDUSTRIA' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'}`}>
                        {p.tipo ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{p.nomeAjustado}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{p.nomeFantasia ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{p.gestor ?? '—'}</td>
                    <td className="px-4 py-3">
                      {p.dataSaida ? (
                        <span className={expiring ? 'text-amber-700 dark:text-amber-400 font-medium' : 'text-slate-600 dark:text-slate-400'}>
                          {new Date(p.dataSaida).toLocaleDateString('pt-PT')}
                          {expiring && <span className="ml-1 text-xs">({days}d)</span>}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs ${p.senhaDefinida ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}`}>
                        {p.senhaDefinida ? '✓ Definida' : '— Não definida'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <button onClick={() => setEditTarget(p)} className="text-amber-600 hover:underline text-xs dark:text-amber-400">Editar</button>
                        <button onClick={() => setPasswordTarget(p)} className="text-indigo-600 hover:underline text-xs dark:text-indigo-400">Senha</button>
                        {p.contratoArquivo && (
                          <a href={parceiroApi.contratoUrl(p.id)} className="text-blue-600 hover:underline text-xs dark:text-blue-400">Contrato</a>
                        )}
                        <button onClick={() => setDeleteTarget(p)} className="text-red-500 hover:underline text-xs dark:text-red-400">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {parceiros.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400 dark:text-slate-500">Nenhum parceiro encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Criar */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Novo Parceiro" size="xl">
        <ParceiroForm
          nomesAjustados={nomesAjustados}
          onSubmit={(fd) => createMut.mutate(fd)}
          isLoading={createMut.isPending}
          error={(createMut.error as Error)?.message}
        />
      </Modal>

      {/* Modal Editar */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Editar Parceiro" size="xl">
        {editTarget && (
          <ParceiroForm
            defaultValues={editTarget}
            nomesAjustados={nomesAjustados}
            onSubmit={(fd) => updateMut.mutate({ id: editTarget.id, fd })}
            isLoading={updateMut.isPending}
            error={(updateMut.error as Error)?.message}
          />
        )}
      </Modal>

      {/* Modal Definir Senha */}
      <Modal open={!!passwordTarget} onClose={() => setPasswordTarget(null)} title="Definir Senha" size="sm">
        <PasswordForm
          onSubmit={({ nova, confirmar }) => passwordTarget && passwordMut.mutate({ id: passwordTarget.id, nova, confirmar })}
          isLoading={passwordMut.isPending}
          error={(passwordMut.error as Error)?.message}
        />
      </Modal>

      {/* Modal Eliminar */}
      <ConfirmDeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={(senha) => deleteTarget && deleteMut.mutate({ id: deleteTarget.id, senha })}
        label={deleteTarget?.nomeAjustado}
        isLoading={deleteMut.isPending}
      />
    </div>
  )
}

function ParceiroForm({
  defaultValues,
  nomesAjustados,
  onSubmit,
  isLoading,
  error,
}: {
  defaultValues?: Parceiro
  nomesAjustados: string[]
  onSubmit: (fd: FormData) => void
  isLoading: boolean
  error?: string
}) {
  const { register, handleSubmit } = useForm({ defaultValues: defaultValues as Record<string, unknown> })
  const [contrato, setContrato] = useState<File | null>(null)
  const [removerContrato, setRemoverContrato] = useState(false)

  function submitHandler(values: Record<string, unknown>) {
    const fd = new FormData()
    Object.entries(values).forEach(([k, v]) => { if (v != null) fd.append(k, String(v)) })
    if (contrato) fd.append('file', contrato)
    if (removerContrato) fd.append('removerContrato', 'true')
    onSubmit(fd)
  }

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Ajustado *</label>
          <select {...register('nomeAjustado', { required: true })} className="input-field">
            <option value="">— Selecionar —</option>
            {nomesAjustados.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
          <select {...register('tipo')} className="input-field">
            <option value="">—</option>
            <option value="INDUSTRIA">Indústria</option>
            <option value="DISTRIBUIDOR">Distribuidor</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CNPJ</label>
          <input {...register('cnpj')} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Fantasia</label>
          <input {...register('nomeFantasia')} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Razão Social</label>
          <input {...register('razaoSocial')} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gestor</label>
          <input {...register('gestor')} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone Gestor</label>
          <input {...register('telefoneGestor')} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            E-mail Gestor {defaultValues ? <span className="text-slate-400 dark:text-slate-500 text-xs">(não editável)</span> : '*'}
          </label>
          <input
            {...register('emailGestor', { required: !defaultValues })}
            className="input-field"
            readOnly={!!defaultValues}
            disabled={!!defaultValues}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data Entrada</label>
          <input type="date" {...register('dataEntrada')} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data Saída</label>
          <input type="date" {...register('dataSaida')} className="input-field" />
        </div>
      </div>

      <div>
        <FileUploadZone
          accept=".pdf"
          label="Contrato (PDF)"
          currentFilename={contrato?.name ?? (defaultValues?.contratoArquivo ?? undefined)}
          onFileSelect={setContrato}
          onRemove={() => { setContrato(null); setRemoverContrato(true) }}
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex justify-end pt-2">
        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? 'A guardar...' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}

function PasswordForm({
  onSubmit,
  isLoading,
  error,
}: {
  onSubmit: (v: { nova: string; confirmar: string }) => void
  isLoading: boolean
  error?: string
}) {
  const { register, handleSubmit } = useForm<{ nova: string; confirmar: string }>()
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nova Senha</label>
        <input type="password" {...register('nova', { required: true })} className="input-field" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirmar Senha</label>
        <input type="password" {...register('confirmar', { required: true })} className="input-field" />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex justify-end">
        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? 'A definir...' : 'Definir Senha'}
        </button>
      </div>
    </form>
  )
}
