import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { 
  Megaphone, 
  Plus, 
  Search, 
  Filter, 
  Upload, 
  Edit3, 
  Trash2, 
  ChevronRight,
  Calendar,
  User,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { campanhaApi, type Campanha, type CampanhaPayload } from '../../api/campanha.api.ts'
import { parceiroApi } from '../../api/parceiro.api.ts'
import { Modal } from '../../components/ui/Modal.tsx'
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal.tsx'
import { ImportDialog } from '../../components/campanha/ImportDialog.tsx'
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type FormValues = CampanhaPayload & { parceiroId?: string }

export function CampanhaListPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState<Campanha | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Campanha | null>(null)
  const [importTarget, setImportTarget] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const { data: campanhas = [], isLoading } = useQuery({
    queryKey: ['campanhas'],
    queryFn: campanhaApi.list,
  })

  const { data: parceiros = [] } = useQuery({
    queryKey: ['parceiros'],
    queryFn: () => parceiroApi.list(),
  })

  const createMut = useMutation({
    mutationFn: (data: CampanhaPayload) => campanhaApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campanhas'] }); setShowCreate(false) },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CampanhaPayload> }) => campanhaApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campanhas'] }); setEditTarget(null) },
  })

  const deleteMut = useMutation({
    mutationFn: ({ id, senha }: { id: number; senha: string }) => campanhaApi.delete(id, senha),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campanhas'] }); setDeleteTarget(null) },
  })

  const createForm = useForm<FormValues>()
  const editForm = useForm<FormValues>()

  const filteredCampanhas = (campanhas || []).filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.parceiro?.nomeAjustado?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  function openEdit(c: Campanha) {
    editForm.reset({
      nome: c.nome,
      dataInicio: c.dataInicio.split('T')[0],
      dataFim: c.dataFim.split('T')[0],
      status: c.status,
      parceiroId: c.parceiroId ? String(c.parceiroId) : '',
    })
    setEditTarget(c)
  }

  function handleCreate(values: FormValues) {
    createMut.mutate({
      nome: values.nome,
      dataInicio: values.dataInicio,
      dataFim: values.dataFim,
      status: values.status ? 1 : 0,
      parceiroId: values.parceiroId ? parseInt(values.parceiroId) : null,
    })
  }

  function handleEdit(values: FormValues) {
    if (!editTarget) return
    updateMut.mutate({
      id: editTarget.id,
      data: {
        nome: values.nome,
        dataInicio: values.dataInicio,
        dataFim: values.dataFim,
        status: values.status ? 1 : 0,
        parceiroId: values.parceiroId ? parseInt(values.parceiroId) : null,
      },
    })
  }

  const toggleStatus = (c: Campanha) => {
    updateMut.mutate({
        id: c.id,
        data: { status: c.status === 1 ? 0 : 1 }
    })
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Campanhas</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Gerencie suas campanhas de marketing e tabloides.
          </p>
        </div>
        <button
          onClick={() => { createForm.reset(); setShowCreate(true) }}
          className="btn-primary w-fit"
        >
          <Plus className="h-4 w-4" />
          Nova Campanha
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Pesquisar por nome ou parceiro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <button className="btn-secondary w-fit whitespace-nowrap">
          <Filter className="h-4 w-4" />
          Filtros
        </button>
      </div>

      {/* Table Section */}
      <div className="card !p-0 overflow-hidden border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/50 dark:bg-zinc-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Campanha</th>
                <th className="px-6 py-4 font-semibold">Vigência</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold">Parceiro</th>
                <th className="px-6 py-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-6 py-4 h-16 bg-slate-50/50 dark:bg-zinc-800/10"></td>
                  </tr>
                ))
              ) : filteredCampanhas.length > 0 ? (
                filteredCampanhas.map((c) => (
                  <tr key={c.id} className="group hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <Link 
                          to={`/campanhas/${c.id}/produtos`}
                          className="font-bold text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
                        >
                          {c.nome}
                        </Link>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">ID: {c.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <button
                          onClick={() => toggleStatus(c)}
                          disabled={updateMut.isPending}
                          className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95",
                            c.status === 1 
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" 
                                : "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-slate-400"
                          )}
                        >
                          {c.status === 1 ? 'Ativa' : 'Finalizada'}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2 text-[11px]">
                        <Calendar className="h-3.5 w-3.5 opacity-50" />
                        <span>{new Date(c.dataInicio).toLocaleDateString()} a {new Date(c.dataFim).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2 text-[11px]">
                        <User className="h-3.5 w-3.5 opacity-50" />
                        <span className="truncate">{c.parceiro?.nomeFantasia ?? c.parceiro?.nomeAjustado ?? 'Sem Parceiro'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link 
                          to={`/campanhas/${c.id}/produtos`} 
                          title="Ver Produtos"
                          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-400 hover:text-primary-600 transition-all"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                        <button 
                          onClick={() => setImportTarget(c.id)}
                          title="Importar Planilha"
                          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-400 hover:text-indigo-600 transition-all"
                        >
                          <Upload className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => openEdit(c)}
                          title="Editar"
                          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-400 hover:text-amber-600 transition-all"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => setDeleteTarget(c)}
                          title="Eliminar"
                          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Megaphone className="h-10 w-10 opacity-20" />
                      <p>Nenhuma campanha encontrada.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nova Campanha" size="md">
        <CampanhaForm
          form={createForm}
          parceiros={parceiros}
          onSubmit={handleCreate}
          isLoading={createMut.isPending}
          error={(createMut.error as Error)?.message}
        />
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Editar Campanha" size="md">
        <CampanhaForm
          form={editForm}
          parceiros={parceiros}
          onSubmit={handleEdit}
          isLoading={updateMut.isPending}
          error={(updateMut.error as Error)?.message}
        />
      </Modal>

      <ConfirmDeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={(senha) => deleteTarget && deleteMut.mutate({ id: deleteTarget.id, senha })}
        label={deleteTarget?.nome}
        isLoading={deleteMut.isPending}
      />

      {importTarget && (
        <ImportDialog 
          campanhaId={importTarget}
          onClose={() => setImportTarget(null)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ['campanhas'] })}
        />
      )}
    </div>
  )
}

function CampanhaForm({
  form,
  parceiros,
  onSubmit,
  isLoading,
  error,
}: {
  form: any
  parceiros: { id: number; nomeAjustado: string }[]
  onSubmit: (v: FormValues) => void
  isLoading: boolean
  error?: string
}) {
  const { register, handleSubmit, formState: { errors } } = form
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Nome da Campanha</label>
          <input 
            {...register('nome', { required: true })} 
            placeholder="Ex: Tablóide de Natal 2024"
            className="input-field" 
          />
          {errors.nome && <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider mt-1.5">Campo obrigatório</p>}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Início</label>
            <input type="date" {...register('dataInicio', { required: true })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Fim</label>
            <input type="date" {...register('dataFim', { required: true })} className="input-field" />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
                type="checkbox" 
                {...register('status', { setValueAs: (v: any) => v ? 1 : 0 })} 
                defaultChecked={form.getValues('status') !== 0}
                className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" 
            />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Campanha Ativa</span>
          </label>
          <p className="text-[10px] text-slate-500 mt-1 ml-6">Se desativado, não aparecerá no dashboard mesmo se estiver na data.</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Parceiro Associado</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select {...register('parceiroId')} className="input-field pl-10">
              <option value="">— Sem parceiro —</option>
              {parceiros.map((p) => (
                <option key={p.id} value={p.id}>{p.nomeAjustado}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium dark:bg-red-500/10 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={isLoading} className="btn-primary flex-1">
          {isLoading ? 'Guardando...' : 'Guardar Campanha'}
        </button>
      </div>
    </form>
  )
}
