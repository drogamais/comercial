import { useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { campanhaApi } from '../../api/campanha.api.ts'
import { campanhaProdutoApi, type CampanhaProduto } from '../../api/campanhaProduto.api.ts'
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal.tsx'
import { Modal } from '../../components/ui/Modal.tsx'
import { GtinValidationBadge } from '../../components/produto/GtinValidationBadge.tsx'
import {
  ArrowLeft,
  Download,
  Upload,
  CheckCircle2,
  Trash2,
  Package,
  Edit3
} from 'lucide-react'
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ProdutoFormValues = Partial<CampanhaProduto>

function ProdutoEditModal({
  produto,
  isCampanha,
  onClose,
  onSave,
  isLoading,
}: {
  produto: CampanhaProduto
  isCampanha: boolean
  onClose: () => void
  onSave: (values: ProdutoFormValues) => void
  isLoading: boolean
}) {
  const { register, handleSubmit } = useForm<ProdutoFormValues>({ defaultValues: produto as ProdutoFormValues })

  return (
    <Modal open title="Editar Produto" size="lg" onClose={onClose}>
      <form onSubmit={handleSubmit(onSave)} className="space-y-5">
        {/* GTIN / Código Interno — somente leitura */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">GTIN / EAN</label>
            <input {...register('codigoBarrasNormalizado')} readOnly className="input-field bg-slate-50 dark:bg-zinc-800/50 cursor-not-allowed opacity-70" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Código Interno</label>
            <input {...register('codigoInterno')} readOnly className="input-field bg-slate-50 dark:bg-zinc-800/50 cursor-not-allowed opacity-70" />
          </div>
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Descrição</label>
          <input {...register('descricao')} className="input-field" />
        </div>

        {/* Campos tablóide (sem parceiro) */}
        {!isCampanha && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Laboratório</label>
                <input {...register('laboratorio')} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tipo Preço</label>
                <input {...register('tipoPreco')} className="input-field" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Preço Normal</label>
                <input {...register('precoNormal')} className="input-field" type="text" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Preço Desconto</label>
                <input {...register('precoDesconto')} className="input-field" type="text" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Preço Cliente+</label>
                <input {...register('precoDescontoCliente')} className="input-field" type="text" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Preço App</label>
                <input {...register('precoApp')} className="input-field" type="text" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tipo Regra</label>
              <input {...register('tipoRegra')} className="input-field" />
            </div>
          </>
        )}

        {/* Campos campanha (com parceiro) */}
        {isCampanha && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Preço Normal</label>
                <input {...register('precoNormal')} className="input-field" type="text" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Preço Desconto</label>
                <input {...register('precoDesconto')} className="input-field" type="text" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Pontuação</label>
                <input {...register('pontuacao')} className="input-field" type="text" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Rebaixe</label>
                <input {...register('rebaixe')} className="input-field" type="text" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Qtd. Limite</label>
                <input {...register('qtdLimite')} className="input-field" type="text" />
              </div>
            </div>
          </>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button type="submit" disabled={isLoading} className="btn-primary flex-1">
            {isLoading ? 'A guardar...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function ProdutosPage() {
  const { id } = useParams<{ id: string }>()
  const campanhaId = parseInt(id!)
  const qc = useQueryClient()

  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [validGtins, setValidGtins] = useState<Set<string>>(new Set())
  const [editTarget, setEditTarget] = useState<CampanhaProduto | null>(null)

  const { data: campanha } = useQuery({
    queryKey: ['campanha', id],
    queryFn: () => campanhaApi.get(campanhaId),
  })

  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ['produtos', id],
    queryFn: () => campanhaProdutoApi.list(campanhaId),
  })

  const updateMut = useMutation({
    mutationFn: (items: Array<{ id: number } & Partial<CampanhaProduto>>) =>
      campanhaProdutoApi.update(campanhaId, items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['produtos', id] })
      setEditTarget(null)
    },
  })

  const deleteMut = useMutation({
    mutationFn: (senha: string) => campanhaProdutoApi.delete(campanhaId, Array.from(selected), senha),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['produtos', id] })
      setSelected(new Set())
      setShowDeleteModal(false)
    },
  })

  const validateMut = useMutation({
    mutationFn: () => {
      const items = produtos.map((p) => ({ id: p.id, gtin: p.codigoBarrasNormalizado ?? '' }))
      return campanhaProdutoApi.validateGtins(campanhaId, items)
    },
    onSuccess: (data) => {
      setValidGtins(new Set(data.validGtins))
      qc.invalidateQueries({ queryKey: ['produtos', id] })
    },
  })

  const toggleSelect = useCallback((pid: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(pid) ? next.delete(pid) : next.add(pid)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    setSelected((prev) => prev.size === produtos.length ? new Set() : new Set(produtos.map((p) => p.id)))
  }, [produtos])

  function handleSaveEdit(values: ProdutoFormValues) {
    if (!editTarget) return
    updateMut.mutate([{ id: editTarget.id, ...values }])
  }

  const isCampanha = !!campanha?.parceiroId

  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-8 animate-fade-in">
      <div className="flex flex-col gap-6 mb-8 md:flex-row md:items-center md:justify-between">
        <div className="space-y-4">
          <Link
            to="/campanhas"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-primary-600 transition-colors uppercase tracking-wider"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 shadow-sm dark:bg-zinc-800 dark:border-slate-700">
              <ArrowLeft className="h-4 w-4" />
            </div>
            Voltar para Campanhas
          </Link>

          <div className="flex items-center gap-4">
             <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                <Package className="h-6 w-6" />
             </div>
             <div>
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Produtos
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {campanha ? `Gerir itens da campanha: ${campanha.nome}` : 'A carregar detalhes...'}
                </p>
             </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={campanhaProdutoApi.exportUrl(campanhaId)}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 transition-all active:scale-95 dark:bg-zinc-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-zinc-700"
          >
            <Download className="h-4 w-4" />
            Exportar
          </a>

          <Link
            to={`/campanhas/${id}/upload`}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 transition-all dark:bg-zinc-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-zinc-700"
          >
            <Upload className="h-4 w-4" />
            Importar Itens
          </Link>

          <button
            onClick={() => validateMut.mutate()}
            disabled={validateMut.isPending || produtos.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-600 hover:bg-indigo-100 transition-all dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20"
          >
            <CheckCircle2 className="h-4 w-4" />
            {validateMut.isPending ? 'A validar...' : 'Validar GTINs'}
          </button>

          {selected.size > 0 && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-100 transition-all dark:bg-red-500/10 dark:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar {selected.size}
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden dark:bg-zinc-900 dark:border-slate-800">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="min-w-full text-xs text-left border-collapse" style={{ minWidth: isCampanha ? 900 : 1200 }}>
              <thead className="bg-slate-50/50 border-b border-slate-200 dark:bg-zinc-800/30 dark:border-slate-800">
                <tr>
                  <th className="px-3 py-4 w-8 shrink-0">
                    <input
                        type="checkbox"
                        className="rounded border-slate-300 pointer-events-auto"
                        checked={selected.size === produtos.length && produtos.length > 0}
                        onChange={toggleAll}
                    />
                  </th>
                  <th className="px-3 py-4 font-bold text-slate-500 uppercase tracking-wider w-[140px]">GTIN / EAN</th>
                  <th className="px-3 py-4 font-bold text-slate-500 uppercase tracking-wider w-[110px]">Cód. Interno</th>
                  <th className="px-3 py-4 font-bold text-slate-500 uppercase tracking-wider">Descrição do Produto</th>
                  {!isCampanha && (
                    <>
                      <th className="px-3 py-4 font-bold text-slate-500 uppercase tracking-wider w-[160px]">Laboratório</th>
                      <th className="px-3 py-4 font-bold text-slate-500 uppercase tracking-wider w-[80px]">Tipo</th>
                      <th className="px-3 py-4 font-bold text-slate-500 uppercase tracking-wider text-right w-[90px]">P. Normal</th>
                      <th className="px-3 py-4 font-bold text-slate-500 uppercase tracking-wider text-right w-[90px]">P. Desc.</th>
                      <th className="px-3 py-4 font-bold text-slate-500 uppercase tracking-wider text-right w-[90px]">P. Cli+</th>
                      <th className="px-3 py-4 font-bold text-slate-500 uppercase tracking-wider text-right w-[90px]">P. App</th>
                      <th className="px-3 py-4 font-bold text-slate-500 uppercase tracking-wider w-[90px]">Regra</th>
                    </>
                  )}
                  {isCampanha && (
                    <>
                      <th className="px-3 py-4 font-bold text-slate-500 uppercase tracking-wider text-right w-[90px]">P. Normal</th>
                      <th className="px-3 py-4 font-bold text-slate-500 uppercase tracking-wider text-right w-[90px]">P. Desc.</th>
                      <th className="px-3 py-4 font-bold text-slate-500 uppercase tracking-wider text-right w-[90px]">Pontos</th>
                      <th className="px-3 py-4 font-bold text-slate-500 uppercase tracking-wider text-right w-[90px]">Rebaixe</th>
                      <th className="px-3 py-4 font-bold text-slate-500 uppercase tracking-wider text-right w-[90px]">Qtd. Lim.</th>
                    </>
                  )}
                  <th className="px-3 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {produtos.map((p) => (
                  <tr key={p.id} className={cn(
                    "group transition-colors hover:bg-slate-50/50 dark:hover:bg-zinc-800/30",
                    selected.has(p.id) && "bg-primary-50/30 dark:bg-primary-500/5"
                  )}>
                    <td className="px-3 py-3 text-center">
                      <input
                          type="checkbox"
                          className="rounded border-slate-300 pointer-events-auto"
                          checked={selected.has(p.id)}
                          onChange={() => toggleSelect(p.id)}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                           {p.codigoBarrasNormalizado || '—'}
                        </span>
                        <GtinValidationBadge isValid={validGtins.has(p.codigoBarrasNormalizado ?? '')} />
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-600 dark:text-slate-400">
                      {p.codigoInterno || '—'}
                    </td>
                    <td className="px-3 py-3 text-slate-700 dark:text-slate-300">
                      {p.descricao || '—'}
                    </td>
                    {!isCampanha && (
                      <>
                        <td className="px-3 py-3 text-slate-600 dark:text-slate-400">{p.laboratorio || '—'}</td>
                        <td className="px-3 py-3 text-slate-500 uppercase font-medium">{p.tipoPreco || '—'}</td>
                        <td className="px-3 py-3 text-right text-slate-700 dark:text-slate-300">{p.precoNormal ?? '—'}</td>
                        <td className="px-3 py-3 text-right text-slate-700 dark:text-slate-300">{p.precoDesconto ?? '—'}</td>
                        <td className="px-3 py-3 text-right text-slate-700 dark:text-slate-300">{p.precoDescontoCliente ?? '—'}</td>
                        <td className="px-3 py-3 text-right text-slate-700 dark:text-slate-300">{p.precoApp ?? '—'}</td>
                        <td className="px-3 py-3 text-slate-500 italic">{p.tipoRegra || '—'}</td>
                      </>
                    )}
                    {isCampanha && (
                      <>
                        <td className="px-3 py-3 text-right text-slate-700 dark:text-slate-300">{p.precoNormal ?? '—'}</td>
                        <td className="px-3 py-3 text-right text-slate-700 dark:text-slate-300">{p.precoDesconto ?? '—'}</td>
                        <td className="px-3 py-3 text-right text-slate-700 dark:text-slate-300">{p.pontuacao ?? '—'}</td>
                        <td className="px-3 py-3 text-right text-slate-700 dark:text-slate-300">{p.rebaixe ?? '—'}</td>
                        <td className="px-3 py-3 text-right text-slate-700 dark:text-slate-300">{p.qtdLimite ?? '—'}</td>
                      </>
                    )}
                    <td className="px-3 py-3">
                      <button
                        onClick={() => setEditTarget(p)}
                        title="Editar produto"
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {produtos.length === 0 && (
                  <tr>
                    <td colSpan={20} className="px-6 py-16 text-center text-slate-400">
                      <Package className="h-10 w-10 opacity-20 mx-auto mb-2" />
                      <p>Nenhum produto nesta campanha.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editTarget && (
        <ProdutoEditModal
          produto={editTarget}
          isCampanha={isCampanha}
          onClose={() => setEditTarget(null)}
          onSave={handleSaveEdit}
          isLoading={updateMut.isPending}
        />
      )}

      <ConfirmDeleteModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={(senha) => deleteMut.mutate(senha)}
        label={`${selected.size} produto(s)`}
        isLoading={deleteMut.isPending}
      />
    </div>
  )
}
