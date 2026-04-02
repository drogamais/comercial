import fs from 'fs/promises'
import path from 'path'
import { config } from '../config.js'

function generateContractFilename(nomeFantasia: string): string {
  const cleaned = nomeFantasia
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 50)
  const ts = new Date()
    .toISOString()
    .replace(/[-:T]/g, '')
    .replace(/\..+/, '')
    .slice(0, 15)
  return `contrato_${cleaned}_${ts}.pdf`
}

export async function saveContract(fileBuffer: Buffer, nomeFantasia: string): Promise<string> {
  const filename = generateContractFilename(nomeFantasia)
  const destPath = path.join(config.UPLOAD_FOLDER, filename)
  await fs.writeFile(destPath, fileBuffer)
  return filename
}

export async function deleteContract(filename: string | null | undefined): Promise<void> {
  if (!filename) return
  const filePath = path.join(config.UPLOAD_FOLDER, filename)
  try {
    await fs.unlink(filePath)
  } catch {
    // Ficheiro pode já não existir — ignora
  }
}

export function getContractPath(filename: string): string {
  return path.join(config.UPLOAD_FOLDER, filename)
}
