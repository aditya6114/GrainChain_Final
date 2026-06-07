import { z } from 'zod'

export const RegisterSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name:     z.string().min(2).max(50),
  role:     z.enum(['donor', 'recipient', 'volunteer']),
})

export const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput = z.infer<typeof LoginSchema>
