'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import {
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
} from '@/lib/auth'

function str(formData: FormData, key: string): string {
  const v = formData.get(key)
  return typeof v === 'string' ? v.trim() : ''
}

export async function signupAction(formData: FormData) {
  const name = str(formData, 'name')
  const email = str(formData, 'email').toLowerCase()
  const password = str(formData, 'password')

  if (!name || !email || password.length < 8) {
    redirect('/signup?error=' + encodeURIComponent('Name, email and a password of 8+ characters are required.'))
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    redirect('/signup?error=' + encodeURIComponent('An account with this email already exists. Try logging in.'))
  }

  const user = await prisma.user.create({
    data: { name, email, password: hashPassword(password) },
  })
  await createSession(user.id)
  redirect('/account')
}

export async function loginAction(formData: FormData) {
  const email = str(formData, 'email').toLowerCase()
  const password = str(formData, 'password')

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !verifyPassword(password, user.password)) {
    redirect('/login?error=' + encodeURIComponent('Invalid email or password.'))
  }
  await createSession(user.id)
  redirect('/account')
}

export async function logoutAction() {
  await destroySession()
  redirect('/')
}
