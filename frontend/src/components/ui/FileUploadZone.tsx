import { useRef, type ChangeEvent } from 'react'

interface FileUploadZoneProps {
  accept: string
  label?: string
  currentFilename?: string | null
  onFileSelect: (file: File) => void
  onRemove?: () => void
}

export function FileUploadZone({ accept, label, currentFilename, onFileSelect, onRemove }: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onFileSelect(file)
  }

  return (
    <div>
      {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="px-4 py-2 text-sm border border-dashed border-slate-400 dark:border-slate-600 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition"
        >
          Escolher ficheiro
        </button>
        {currentFilename && (
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <span className="truncate max-w-xs">{currentFilename}</span>
            {onRemove && (
              <button type="button" onClick={onRemove} className="text-red-400 hover:text-red-600 dark:hover:text-red-400 text-lg leading-none">
                &times;
              </button>
            )}
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />
    </div>
  )
}
