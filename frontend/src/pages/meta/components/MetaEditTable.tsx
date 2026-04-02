import type { MetaRow } from '../../../api/meta.api'

interface Props {
  tipo: 'produto' | 'condicional'
  rows: MetaRow[]
  onChange: (rows: MetaRow[]) => void
}

export function MetaEditTable({ tipo, rows, onChange }: Props) {
  function update(idx: number, field: keyof MetaRow, value: string) {
    onChange(
      rows.map((r, i) => {
        if (i !== idx) return r
        const numVal = parseFloat(value) || 0
        if (field === 'operador' || field === 'ean_produto' || field === 'tipo_meta' || field === 'texto_bi') {
          return { ...r, [field]: value }
        }
        return { ...r, [field]: numVal }
      })
    )
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-slate-400 dark:text-slate-500 italic">Nenhum registo.</p>
    )
  }

  if (tipo === 'produto') {
    return (
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-zinc-800">
            <tr>
              {['EAN', 'Valor Meta (R$)', 'Quantidade', 'Repasse (%)'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {rows.map((row, idx) => (
              <tr key={idx} className="bg-white dark:bg-zinc-900">
                <td className="px-4 py-2 text-slate-500 dark:text-slate-400 font-mono text-xs">
                  {row.ean_produto}
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={row.valor_meta}
                    onChange={(e) => update(idx, 'valor_meta', e.target.value)}
                    className="w-32 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    min={0}
                    step="1"
                    value={row.quantidade}
                    onChange={(e) => update(idx, 'quantidade', e.target.value)}
                    className="w-24 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={row.repasse}
                    onChange={(e) => update(idx, 'repasse', e.target.value)}
                    className="w-24 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // condicional
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-zinc-800">
          <tr>
            {['Tipo', 'Condição', 'Valor Referência', 'Repasse (%)'].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
          {rows.map((row, idx) => {
            const isValor = row.tipo_meta.startsWith('VAL_')
            return (
              <tr key={idx} className="bg-white dark:bg-zinc-900">
                <td className="px-4 py-2 text-xs font-mono text-slate-400 dark:text-slate-500">
                  {isValor ? 'Valor (R$)' : 'Quantidade'}
                </td>
                <td className="px-4 py-2">
                  <select
                    value={row.operador}
                    onChange={(e) => {
                      const op = e.target.value as '<=' | '>'
                      const newTipo = `${isValor ? 'VAL' : 'QTD'}_${op}`
                      onChange(
                        rows.map((r, i) =>
                          i === idx ? { ...r, operador: op, tipo_meta: newTipo } : r
                        )
                      )
                    }}
                    className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="<=">Menor ou Igual (&lt;=)</option>
                    <option value=">">Maior que (&gt;)</option>
                  </select>
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    min={0}
                    step={isValor ? '0.01' : '1'}
                    value={isValor ? row.valor_meta : row.quantidade}
                    onChange={(e) =>
                      update(idx, isValor ? 'valor_meta' : 'quantidade', e.target.value)
                    }
                    className="w-32 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={row.repasse}
                    onChange={(e) => update(idx, 'repasse', e.target.value)}
                    className="w-24 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
