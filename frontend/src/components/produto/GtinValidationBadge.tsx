interface Props {
  gtin: string | null
  validGtins?: Set<string>
}

export function GtinValidationBadge({ gtin, validGtins }: Props) {
  if (!gtin || !validGtins) return null
  const isValid = validGtins.has(gtin)
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ml-1 ${isValid ? 'bg-green-500' : 'bg-red-400'}`}
      title={isValid ? 'GTIN válido' : 'GTIN não encontrado'}
    />
  )
}
