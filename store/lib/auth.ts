import crypto from 'crypto'
import { cookies } from 'next/headers'
import { prisma } from './db'

const SECRET =
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  'dev-only-insecure-secret'

const SESSION_COOKIE = 'session'
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

// ---------- passwords (scrypt, format: salt:hash hex) ----------

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const candidate = crypto.scryptSync(password, salt, 64)
  const expected = Buffer.from(hash, 'hex')
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected)
}

// ---------- session token (HMAC-signed, httpOnly cookie) ----------

function sign(payload: string): string {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('base64url')
}

function createToken(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ sub: userId, exp: Date.now() + SESSION_TTL_MS }),
  ).toString('base64url')
  return `${payload}.${sign(payload)}`
}

function parseToken(token: string): string | null {
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return null
  const expected = sign(payload)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (typeof data.sub !== 'string' || typeof data.exp !== 'number') return null
    if (data.exp < Date.now()) return null
    return data.sub
  } catch {
    return null
  }
}

export async function createSession(userId: string) {
  const store = await cookies()
  store.set(SESSION_COOKIE, createToken(userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  })
}

export async function destroySession() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export async function getSessionUser() {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  const userId = parseToken(token)
  if (!userId) return null
  return prisma.user.findUnique({ where: { id: userId } })
}
