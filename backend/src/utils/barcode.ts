// Port direto de utils.py: pad_barcode() e clean_barcode()

export function padBarcode(barcode: unknown): string | null {
  if (barcode === null || barcode === undefined) return null
  const str = String(barcode).trim()
  if (!str) return null
  return str.padStart(14, '0')
}

export function cleanBarcode(barcode: unknown): string | null {
  if (barcode === null || barcode === undefined) return null
  const str = String(barcode).trim()
  return str || null
}
