import { useState } from 'react'
import { Modal } from './Modal.tsx'

interface ConfirmDeleteModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (senha: string) => void
  label?: string
  isLoading?: boolean
}

export function ConfirmDeleteModal({ open, onClose, onConfirm, label = 'este registo', isLoading }: ConfirmDeleteModalProps) {
  const [senha, setSenha] = useState('')
  const [error, setError] = useState('')

  function handleSubmit() {
    if (!senha) {
      setError('Introduz a senha de confirmação')
      return
    }
    setError('')
    onConfirm(senha)
    setSenha('')
  }

  function handleClose() {
    setSenha('')
    setError('')
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Confirmar Eliminação" size="sm">
      <p className="text-sm text-gray-600 mb-4">
        Tens a certeza que queres eliminar <strong>{label}</strong>? Esta ação não pode ser revertida.
      </p>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Senha de confirmação</label>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          placeholder="••••••"
          autoFocus
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={handleClose}
          className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
        >
          {isLoading ? 'A eliminar...' : 'Eliminar'}
        </button>
      </div>
    </Modal>
  )
}
