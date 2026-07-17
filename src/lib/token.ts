import { randomBytes } from 'node:crypto'

export function generarToken(): string {
  return randomBytes(32).toString('base64url')
}
